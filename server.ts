import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import cron from "node-cron";
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("novels.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS novels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    outline TEXT,
    cover_url TEXT,
    status TEXT DEFAULT 'draft',
    views INTEGER DEFAULT 0,
    target_chapters INTEGER DEFAULT 50,
    characters TEXT,
    storylines TEXT,
    world_setting TEXT,
    relationships TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS chapters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    novel_id INTEGER,
    title TEXT NOT NULL,
    content TEXT,
    summary TEXT,
    word_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'draft',
    scheduled_at DATETIME,
    published_at DATETIME,
    token_usage INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (novel_id) REFERENCES novels(id)
  );
`);

// Migration: Add summary column if it doesn't exist
try {
  db.exec("ALTER TABLE chapters ADD COLUMN summary TEXT");
} catch (e) {
  // Column likely already exists
}

db.exec(`
  CREATE TABLE IF NOT EXISTS token_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    novel_id INTEGER,
    chapter_id INTEGER,
    tokens INTEGER NOT NULL,
    type TEXT, -- 'generation', 'editing', etc.
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS outline_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    novel_id INTEGER,
    version_name TEXT NOT NULL,
    content TEXT,
    is_active INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (novel_id) REFERENCES novels(id)
  );

  CREATE TABLE IF NOT EXISTS platforms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'inkflow', 'webhook', 'custom'
    config TEXT, -- JSON configuration
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL, -- 'generate', 'publish'
    novel_id INTEGER,
    chapter_id INTEGER,
    platform_id INTEGER,
    scheduled_at DATETIME NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
    error TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (novel_id) REFERENCES novels(id),
    FOREIGN KEY (chapter_id) REFERENCES chapters(id),
    FOREIGN KEY (platform_id) REFERENCES platforms(id)
  );
`);

// Insert default platform if not exists
const defaultPlatform = db.prepare("SELECT id FROM platforms WHERE name = 'InkFlow Public'").get();
if (!defaultPlatform) {
  db.prepare("INSERT INTO platforms (name, type, config) VALUES (?, ?, ?)").run('InkFlow Public', 'inkflow', JSON.stringify({ url: 'https://inkflow.io/publish' }));
}

// Migration for existing databases
try { db.prepare("ALTER TABLE novels ADD COLUMN target_chapters INTEGER DEFAULT 50").run(); } catch (e) {}
try { db.prepare("ALTER TABLE novels ADD COLUMN characters TEXT").run(); } catch (e) {}
try { db.prepare("ALTER TABLE novels ADD COLUMN storylines TEXT").run(); } catch (e) {}
try { db.prepare("ALTER TABLE novels ADD COLUMN world_setting TEXT").run(); } catch (e) {}
try { db.prepare("ALTER TABLE novels ADD COLUMN cover_url TEXT").run(); } catch (e) {}
try { db.prepare("ALTER TABLE novels ADD COLUMN relationships TEXT").run(); } catch (e) {}
try { db.prepare("ALTER TABLE chapters ADD COLUMN summary TEXT").run(); } catch (e) {}
try { db.prepare("ALTER TABLE chapters ADD COLUMN scheduled_at DATETIME").run(); } catch (e) {}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // API Routes
  
  // Get all novels with stats
  app.get("/api/novels", (req, res) => {
    try {
      const novels = db.prepare(`
        SELECT n.*, 
               (SELECT COUNT(*) FROM chapters WHERE novel_id = n.id) as chapter_count,
               (SELECT SUM(token_usage) FROM chapters WHERE novel_id = n.id) as total_tokens,
               (SELECT content FROM outline_versions WHERE novel_id = n.id AND is_active = 1 LIMIT 1) as active_outline
        FROM novels n
      `).all();
      res.json(novels);
    } catch (error) {
      console.error("Error fetching novels:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/novels", (req, res) => {
    try {
      const { title, description } = req.body;
      const info = db.prepare("INSERT INTO novels (title, description) VALUES (?, ?)").run(title, description);
      const novelId = info.lastInsertRowid;
      
      // Create initial outline version
      db.prepare("INSERT INTO outline_versions (novel_id, version_name, content, is_active) VALUES (?, ?, ?, ?)").run(novelId, "V1.0 Initial", "", 1);
      
      res.json({ id: novelId });
    } catch (error) {
      console.error("Error creating novel:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/novels/:id", (req, res) => {
    try {
      const novel = db.prepare("SELECT * FROM novels WHERE id = ?").get(req.params.id);
      if (!novel) return res.status(404).json({ error: "Novel not found" });
      const chapters = db.prepare("SELECT * FROM chapters WHERE novel_id = ? ORDER BY created_at ASC").all(req.params.id);
      const outlines = db.prepare("SELECT * FROM outline_versions WHERE novel_id = ? ORDER BY created_at DESC").all(req.params.id);
      res.json({ ...novel, chapters, outlines });
    } catch (error) {
      console.error("Error fetching novel details:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  app.patch("/api/novels/:id", (req, res) => {
    try {
      const { title, description, target_chapters, characters, storylines, world_setting, cover_url, relationships } = req.body;
      
      const sanitize = (val: any) => {
        if (val === undefined) return null;
        if (val !== null && typeof val === 'object') {
          return JSON.stringify(val);
        }
        return val;
      };

      const params = [
        sanitize(title),
        sanitize(description),
        target_chapters ?? null,
        sanitize(characters),
        sanitize(storylines),
        sanitize(world_setting),
        sanitize(cover_url),
        sanitize(relationships),
        req.params.id
      ];

      db.prepare(`
        UPDATE novels 
        SET title = COALESCE(?, title),
            description = COALESCE(?, description),
            target_chapters = COALESCE(?, target_chapters),
            characters = COALESCE(?, characters),
            storylines = COALESCE(?, storylines),
            world_setting = COALESCE(?, world_setting),
            cover_url = COALESCE(?, cover_url),
            relationships = COALESCE(?, relationships)
        WHERE id = ?
      `).run(...params);
      
      const updatedNovel = db.prepare("SELECT * FROM novels WHERE id = ?").get(req.params.id);
      const chapters = db.prepare("SELECT * FROM chapters WHERE novel_id = ? ORDER BY created_at ASC").all(req.params.id);
      const outlines = db.prepare("SELECT * FROM outline_versions WHERE novel_id = ? ORDER BY created_at DESC").all(req.params.id);
      res.json({ ...updatedNovel, chapters, outlines });
    } catch (error) {
      console.error("Error updating novel:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/novels/:id", (req, res) => {
    const id = req.params.id;
    // Manual cleanup of related data
    db.prepare("DELETE FROM token_logs WHERE novel_id = ?").run(id);
    db.prepare("DELETE FROM outline_versions WHERE novel_id = ?").run(id);
    db.prepare("DELETE FROM chapters WHERE novel_id = ?").run(id);
    db.prepare("DELETE FROM novels WHERE id = ?").run(id);
    res.json({ success: true });
  });

  // Outline Version Routes
  app.post("/api/novels/:id/outlines", (req, res) => {
    const { version_name, content } = req.body;
    db.prepare("INSERT INTO outline_versions (novel_id, version_name, content, is_active) VALUES (?, ?, ?, 0)").run(req.params.id, version_name, content);
    res.json({ success: true });
  });

  app.patch("/api/outlines/:id/activate", (req, res) => {
    const outline = db.prepare("SELECT novel_id FROM outline_versions WHERE id = ?").get(req.params.id);
    if (outline) {
      db.prepare("UPDATE outline_versions SET is_active = 0 WHERE novel_id = ?").run(outline.novel_id);
      db.prepare("UPDATE outline_versions SET is_active = 1 WHERE id = ?").run(req.params.id);
    }
    res.json({ success: true });
  });

  app.patch("/api/outlines/:id", (req, res) => {
    const { content, version_name } = req.body;
    db.prepare("UPDATE outline_versions SET content = COALESCE(?, content), version_name = COALESCE(?, version_name) WHERE id = ?").run(content, version_name, req.params.id);
    res.json({ success: true });
  });

  app.post("/api/chapters", (req, res) => {
    const { novel_id, title, content, token_usage, scheduled_at } = req.body;
    const word_count = content ? content.length : 0;
    const info = db.prepare(`
      INSERT INTO chapters (novel_id, title, content, word_count, token_usage, scheduled_at) 
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(novel_id, title, content, word_count, token_usage || 0, scheduled_at || null);
    
    if (token_usage) {
      db.prepare("INSERT INTO token_logs (novel_id, chapter_id, tokens, type) VALUES (?, ?, ?, ?)").run(novel_id, info.lastInsertRowid, token_usage, 'generation');
    }
    
    res.json({ id: info.lastInsertRowid });
  });

  app.patch("/api/chapters/:id", (req, res) => {
    const { content, title, summary, scheduled_at, token_usage } = req.body;
    
    // Only update word_count if content is provided
    const word_count = content !== undefined ? content.length : undefined;
    
    db.prepare(`
      UPDATE chapters 
      SET content = COALESCE(?, content), 
          title = COALESCE(?, title), 
          summary = COALESCE(?, summary),
          word_count = COALESCE(?, word_count), 
          scheduled_at = COALESCE(?, scheduled_at),
          token_usage = token_usage + COALESCE(?, 0)
      WHERE id = ?
    `).run(content, title, summary, word_count, scheduled_at, token_usage, req.params.id);

    if (token_usage) {
      const chapter = db.prepare("SELECT novel_id FROM chapters WHERE id = ?").get(req.params.id);
      db.prepare("INSERT INTO token_logs (novel_id, chapter_id, tokens, type) VALUES (?, ?, ?, ?)").run(chapter.novel_id, req.params.id, token_usage, 'editing');
    }

    res.json({ success: true });
  });

  app.delete("/api/chapters/:id", (req, res) => {
    const id = req.params.id;
    db.prepare("DELETE FROM token_logs WHERE chapter_id = ?").run(id);
    db.prepare("DELETE FROM chapters WHERE id = ?").run(id);
    res.json({ success: true });
  });

  // Task & Platform Routes
  app.get("/api/platforms", (req, res) => {
    const platforms = db.prepare("SELECT * FROM platforms").all();
    res.json(platforms);
  });

  app.get("/api/tasks", (req, res) => {
    const tasks = db.prepare(`
      SELECT t.*, n.title as novel_title, c.title as chapter_title, p.name as platform_name
      FROM tasks t
      LEFT JOIN novels n ON t.novel_id = n.id
      LEFT JOIN chapters c ON t.chapter_id = c.id
      LEFT JOIN platforms p ON t.platform_id = p.id
      ORDER BY t.scheduled_at DESC
    `).all();
    res.json(tasks);
  });

  app.post("/api/tasks", (req, res) => {
    const { type, novel_id, chapter_id, platform_id, scheduled_at } = req.body;
    const info = db.prepare(`
      INSERT INTO tasks (type, novel_id, chapter_id, platform_id, scheduled_at, status)
      VALUES (?, ?, ?, ?, ?, 'pending')
    `).run(type, novel_id, chapter_id, platform_id, scheduled_at);
    res.json({ id: info.lastInsertRowid });
  });

  app.delete("/api/tasks/:id", (req, res) => {
    db.prepare("DELETE FROM tasks WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Stats API
  app.get("/api/stats/tokens", (req, res) => {
    const totalTokens = db.prepare("SELECT SUM(tokens) as total FROM token_logs").get();
    const tokensByNovel = db.prepare(`
      SELECT n.title, SUM(tl.tokens) as tokens
      FROM token_logs tl
      JOIN novels n ON tl.novel_id = n.id
      GROUP BY n.id
    `).all();
    const dailyTokens = db.prepare(`
      SELECT DATE(created_at) as date, SUM(tokens) as tokens
      FROM token_logs
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 7
    `).all();
    res.json({ totalTokens: totalTokens.total || 0, tokensByNovel, dailyTokens });
  });

  // Scheduled Tasks Processor
  cron.schedule("* * * * *", async () => {
    const now = new Date().toISOString();
    
    // 1. Process legacy scheduled chapters (Publishing)
    const pendingChapters = db.prepare("SELECT * FROM chapters WHERE status = 'draft' AND scheduled_at <= ?").all(now);
    for (const chapter of pendingChapters) {
      console.log(`[Cron] Publishing chapter: ${chapter.title}`);
      db.prepare("UPDATE chapters SET status = 'published', published_at = ? WHERE id = ?").run(new Date().toISOString(), chapter.id);
      db.prepare("UPDATE novels SET views = views + ? WHERE id = ?").run(Math.floor(Math.random() * 100), chapter.novel_id);
    }

    // 2. Process new Tasks table
    const pendingTasks = db.prepare("SELECT * FROM tasks WHERE status = 'pending' AND scheduled_at <= ?").all(now);
    
    for (const task of pendingTasks) {
      console.log(`[Cron] Processing task ${task.id}: ${task.type}`);
      db.prepare("UPDATE tasks SET status = 'running' WHERE id = ?").run(task.id);

      try {
        if (task.type === 'generate') {
          await handleServerSideGeneration(task);
        } else if (task.type === 'publish') {
          await handleServerSidePublication(task);
        }
        db.prepare("UPDATE tasks SET status = 'completed' WHERE id = ?").run(task.id);
      } catch (error: any) {
        console.error(`[Cron] Task ${task.id} failed:`, error);
        db.prepare("UPDATE tasks SET status = 'failed', error = ? WHERE id = ?").run(error.message || String(error), task.id);
      }
    }
  });

  async function handleServerSideGeneration(task: any) {
    const novel = db.prepare("SELECT * FROM novels WHERE id = ?").get(task.novel_id);
    if (!novel) throw new Error("Novel not found");

    const chapters = db.prepare("SELECT * FROM chapters WHERE novel_id = ? ORDER BY created_at ASC").all(task.novel_id);
    const activeOutline = db.prepare("SELECT content FROM outline_versions WHERE novel_id = ? AND is_active = 1 LIMIT 1").get(task.novel_id);
    
    const nextChapterNum = chapters.length + 1;
    const title = `Chapter ${nextChapterNum}`;

    // AI Generation
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY not configured on server");

    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Write chapter ${nextChapterNum} of the novel "${novel.title}". Focus on advancing the plot according to the outline.`;
    const context = `Novel Title: ${novel.title}\nDescription: ${novel.description}\nOutline: ${activeOutline?.content || ""}\nCharacters: ${novel.characters || ""}\nWorld Setting: ${novel.world_setting || ""}\nPrevious Chapters Context: ${chapters.slice(-2).map((c: any) => c.title + ": " + (c.content || "").slice(-500)).join("\n")}`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `${context}\n\n${prompt}`,
    });

    const content = response.text || "";
    const word_count = content.length;

    // Create chapter
    const info = db.prepare(`
      INSERT INTO chapters (novel_id, title, content, word_count, token_usage, status) 
      VALUES (?, ?, ?, ?, ?, 'draft')
    `).run(task.novel_id, title, content, word_count, 0);

    return info.lastInsertRowid;
  }

  async function handleServerSidePublication(task: any) {
    const chapter = db.prepare("SELECT * FROM chapters WHERE id = ?").get(task.chapter_id);
    const platform = db.prepare("SELECT * FROM platforms WHERE id = ?").get(task.platform_id);
    
    if (!chapter || !platform) throw new Error("Chapter or Platform not found");

    console.log(`[Mock] Submitting chapter "${chapter.title}" to platform "${platform.name}"`);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    db.prepare("UPDATE chapters SET status = 'published', published_at = ? WHERE id = ?").run(new Date().toISOString(), chapter.id);
  }

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

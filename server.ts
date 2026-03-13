import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import cron from "node-cron";

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
    status TEXT DEFAULT 'draft',
    views INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS chapters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    novel_id INTEGER,
    title TEXT NOT NULL,
    content TEXT,
    word_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'draft',
    scheduled_at DATETIME,
    published_at DATETIME,
    token_usage INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (novel_id) REFERENCES novels(id)
  );

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
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  
  // Get all novels with stats
  app.get("/api/novels", (req, res) => {
    const novels = db.prepare(`
      SELECT n.*, 
             (SELECT COUNT(*) FROM chapters WHERE novel_id = n.id) as chapter_count,
             (SELECT SUM(token_usage) FROM chapters WHERE novel_id = n.id) as total_tokens,
             (SELECT content FROM outline_versions WHERE novel_id = n.id AND is_active = 1 LIMIT 1) as active_outline
      FROM novels n
    `).all();
    res.json(novels);
  });

  app.post("/api/novels", (req, res) => {
    const { title, description } = req.body;
    const info = db.prepare("INSERT INTO novels (title, description) VALUES (?, ?)").run(title, description);
    const novelId = info.lastInsertRowid;
    
    // Create initial outline version
    db.prepare("INSERT INTO outline_versions (novel_id, version_name, content, is_active) VALUES (?, ?, ?, ?)").run(novelId, "V1.0 Initial", "", 1);
    
    res.json({ id: novelId });
  });

  app.get("/api/novels/:id", (req, res) => {
    const novel = db.prepare("SELECT * FROM novels WHERE id = ?").get(req.params.id);
    const chapters = db.prepare("SELECT * FROM chapters WHERE novel_id = ? ORDER BY created_at ASC").all(req.params.id);
    const outlines = db.prepare("SELECT * FROM outline_versions WHERE novel_id = ? ORDER BY created_at DESC").all(req.params.id);
    res.json({ ...novel, chapters, outlines });
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
    const { content, title, scheduled_at, token_usage } = req.body;
    const word_count = content ? content.length : 0;
    
    db.prepare(`
      UPDATE chapters 
      SET content = COALESCE(?, content), 
          title = COALESCE(?, title), 
          word_count = ?, 
          scheduled_at = ?,
          token_usage = token_usage + ?
      WHERE id = ?
    `).run(content, title, word_count, scheduled_at, token_usage || 0, req.params.id);

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

  // Scheduled Publishing Task
  cron.schedule("* * * * *", () => {
    const now = new Date().toISOString();
    const pendingChapters = db.prepare("SELECT * FROM chapters WHERE status = 'draft' AND scheduled_at <= ?").all(now);
    
    for (const chapter of pendingChapters) {
      console.log(`Publishing chapter: ${chapter.title}`);
      // In a real app, you'd call a platform API here
      db.prepare("UPDATE chapters SET status = 'published', published_at = ? WHERE id = ?").run(new Date().toISOString(), chapter.id);
      
      // Mock view increase
      db.prepare("UPDATE novels SET views = views + ? WHERE id = ?").run(Math.floor(Math.random() * 100), chapter.novel_id);
    }
  });

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

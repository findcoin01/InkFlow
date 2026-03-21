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
    last_supplement_at DATETIME,
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

try {
  db.exec("ALTER TABLE novels ADD COLUMN last_supplement_at DATETIME");
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

  CREATE TABLE IF NOT EXISTS prompts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT, -- 'outline', 'chapter', 'summary', 'refactor'
    is_default INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS operation_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action TEXT NOT NULL,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS ai_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    provider TEXT NOT NULL UNIQUE, -- 'gemini', 'openai', 'deepseek', 'custom'
    model TEXT,
    api_key TEXT,
    base_url TEXT,
    parameters TEXT, -- JSON: { temperature, top_p, top_k, max_tokens, etc. }
    is_active INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL, -- 'generate', 'publish'
    novel_id INTEGER,
    chapter_id INTEGER,
    platform_id INTEGER,
    count INTEGER DEFAULT 1,
    scheduled_at DATETIME NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
    error TEXT,
    recurrence TEXT DEFAULT 'once', -- 'once', 'daily'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (novel_id) REFERENCES novels(id),
    FOREIGN KEY (chapter_id) REFERENCES chapters(id),
    FOREIGN KEY (platform_id) REFERENCES platforms(id)
  );
`);

// Migration: Add recurrence column if it doesn't exist
try {
  db.exec("ALTER TABLE tasks ADD COLUMN recurrence TEXT DEFAULT 'once'");
} catch (e) {
  // Column likely already exists
}

// Insert default platform if not exists
const defaultPlatform = db.prepare("SELECT id FROM platforms WHERE name = 'InkFlow Public'").get();
if (!defaultPlatform) {
  db.prepare("INSERT INTO platforms (name, type, config) VALUES (?, ?, ?)").run('InkFlow Public', 'inkflow', JSON.stringify({ url: 'https://inkflow.io/publish' }));
}

// Migration for existing databases
try { db.prepare("ALTER TABLE novels ADD COLUMN status TEXT DEFAULT 'draft'").run(); } catch (e) {}
try { db.prepare("ALTER TABLE novels ADD COLUMN target_chapters INTEGER DEFAULT 50").run(); } catch (e) {}
try { db.prepare("ALTER TABLE novels ADD COLUMN characters TEXT").run(); } catch (e) {}
try { db.prepare("ALTER TABLE novels ADD COLUMN storylines TEXT").run(); } catch (e) {}
try { db.prepare("ALTER TABLE novels ADD COLUMN world_setting TEXT").run(); } catch (e) {}
try { db.prepare("ALTER TABLE novels ADD COLUMN cover_url TEXT").run(); } catch (e) {}
try { db.prepare("ALTER TABLE novels ADD COLUMN relationships TEXT").run(); } catch (e) {}
try { db.prepare("ALTER TABLE chapters ADD COLUMN summary TEXT").run(); } catch (e) {}
try { db.prepare("ALTER TABLE chapters ADD COLUMN scheduled_at DATETIME").run(); } catch (e) {}

try { db.prepare("ALTER TABLE tasks ADD COLUMN count INTEGER DEFAULT 1").run(); } catch (e) {}

// Insert default AI config if not exists
const defaultAI = db.prepare("SELECT id FROM ai_configs WHERE provider = 'gemini'").get();
if (!defaultAI) {
  db.prepare(`
    INSERT INTO ai_configs (provider, model, api_key, is_active) 
    VALUES (?, ?, ?, 1)
  `).run('gemini', 'gemini-3-flash-preview', process.env.GEMINI_API_KEY || '');
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '500mb' }));
  app.use(express.urlencoded({ limit: '500mb', extended: true }));

  // Debug middleware to log request size
  app.use((req, res, next) => {
    if (req.method === 'POST' || req.method === 'PATCH' || req.method === 'PUT') {
      const size = parseInt(req.headers['content-length'] || '0');
      if (size > 1024 * 1024) { // Log if > 1MB
        console.log(`[Request Size] ${req.method} ${req.url}: ${(size / 1024 / 1024).toFixed(2)} MB`);
      }
    }
    next();
  });

  // Helper for logging operations
  function logOperation(action: string, details: any) {
    try {
      db.prepare("INSERT INTO operation_logs (action, details) VALUES (?, ?)").run(action, typeof details === 'string' ? details : JSON.stringify(details));
    } catch (e) {
      console.error("Failed to log operation:", e);
    }
  }

  // Insert default prompts if not exists
  const promptCount = db.prepare("SELECT COUNT(*) as count FROM prompts").get().count;
  if (promptCount === 0) {
    const defaultPrompts = [
      { name: '标准章节生成', type: 'chapter', content: '请根据以下背景和任务进行创作。\n\n背景上下文：\n{context}\n\n任务：\n{task}', is_default: 1 },
      { name: '快节奏网文', type: 'chapter', content: '使用快节奏的网文风格，段落简短，对话紧凑，充满悬念。\n\n背景上下文：\n{context}\n\n任务：\n{task}', is_default: 0 },
      { name: '细腻文学风', type: 'chapter', content: '注重环境描写和心理活动，语言优美细腻，节奏平缓。\n\n背景上下文：\n{context}\n\n任务：\n{task}', is_default: 0 },
      
      { name: '标准大纲优化', type: 'outline', content: '优化以下大纲。确保逻辑连贯和引人入胜的角色弧线。\n\n大纲内容：\n{context}', is_default: 1 },
      { name: '冲突强化大纲', type: 'outline', content: '分析并优化以下大纲，增加更多的冲突点和反转，提高故事的张力。\n\n大纲内容：\n{context}', is_default: 0 },
      
      { name: '简明摘要', type: 'summary', content: '将以下小说章节总结为简明摘要（最多 200 字）。重点关注角色发展、情节推进和世界观细节。{langInstruction}\n\n内容：{context}\n\n任务：仅输出摘要文本。', is_default: 1 },
      { name: '详细剧情回顾', type: 'summary', content: '详细总结本章的剧情走向、角色变动和伏笔设置，为后续创作提供参考。{langInstruction}\n\n内容：{context}\n\n任务：提供深度剧情分析和伏笔记录。', is_default: 0 },
      
      { name: '标准结构化', type: 'refactor', content: '将以下小说世界设定内容重构为更结构化的 markdown 格式。使用项目符号和清晰的标题。\n\n设定内容：\n{context}', is_default: 1 },
      { name: '深度设定扩展', type: 'refactor', content: '在保持原有设定的基础上，对以下世界观内容进行深度扩展和逻辑补全，使其更加严谨。\n\n设定内容：\n{context}', is_default: 0 },
      
      { name: '标准润色', type: 'polish', content: '请对以下小说片段进行润色。在保持原意和情节的基础上，优化遣词造句，增强画面感和感染力。\n\n片段内容：\n{context}', is_default: 1 },
      { name: '风格转换 (古风)', type: 'polish', content: '将以下小说片段重构为唯美古风风格。使用更具古典韵味的词汇，增加意境描写。\n\n片段内容：\n{context}', is_default: 0 },
      { name: '情节扩充', type: 'polish', content: '在保持原有情节走向的基础上，对以下片段进行扩充。增加更多的细节描写、心理活动和环境渲染，使内容更丰满。\n\n片段内容：\n{context}', is_default: 0 }
    ];
    const insertPrompt = db.prepare("INSERT INTO prompts (name, type, content, is_default) VALUES (?, ?, ?, ?)");
    defaultPrompts.forEach(p => insertPrompt.run(p.name, p.type, p.content, p.is_default));
    logOperation("系统初始化", "已插入默认提示词模板");
  } else {
    // Migration: Update existing prompts or add new defaults if missing
    const hasRefactor = db.prepare("SELECT id FROM prompts WHERE type = 'refactor'").get();
    if (!hasRefactor) {
      const refactorPrompts = [
        { name: '标准结构化', type: 'refactor', content: '将以下小说世界设定内容重构为更结构化的 markdown 格式。使用项目符号和清晰的标题。\n\n设定内容：\n{context}', is_default: 1 },
        { name: '深度设定扩展', type: 'refactor', content: '在保持原有设定的基础上，对以下世界观内容进行深度扩展和逻辑补全，使其更加严谨。\n\n设定内容：\n{context}', is_default: 0 }
      ];
      const insertPrompt = db.prepare("INSERT INTO prompts (name, type, content, is_default) VALUES (?, ?, ?, ?)");
      refactorPrompts.forEach(p => insertPrompt.run(p.name, p.type, p.content, p.is_default));
    }

    const hasPolish = db.prepare("SELECT id FROM prompts WHERE type = 'polish'").get();
    if (!hasPolish) {
      const polishPrompts = [
        { name: '标准润色', type: 'polish', content: '请对以下小说片段进行润色。在保持原意和情节的基础上，优化遣词造句，增强画面感和感染力。\n\n片段内容：\n{context}', is_default: 1 },
        { name: '风格转换 (古风)', type: 'polish', content: '将以下小说片段重构为唯美古风风格。使用更具古典韵味的词汇，增加意境描写。\n\n片段内容：\n{context}', is_default: 0 },
        { name: '情节扩充', type: 'polish', content: '在保持原有情节走向的基础上，对以下片段进行扩充。增加更多的细节描写、心理活动和环境渲染，使内容更丰满。\n\n片段内容：\n{context}', is_default: 0 }
      ];
      const insertPrompt = db.prepare("INSERT INTO prompts (name, type, content, is_default) VALUES (?, ?, ?, ?)");
      polishPrompts.forEach(p => insertPrompt.run(p.name, p.type, p.content, p.is_default));
    }

    // Update existing summary prompts to use the new recommended format
    db.prepare(`
      UPDATE prompts 
      SET content = '将以下小说章节总结为简明摘要（最多 200 字）。重点关注角色发展、情节推进和世界观细节。{langInstruction}\n\n内容：{context}\n\n任务：仅输出摘要文本。'
      WHERE type = 'summary' AND name = '简明摘要' AND content LIKE '%对以下章节内容提供简明摘要%'
    `).run();

    // Update existing prompts to use {context} and {task} if they use old placeholders
    const existingPrompts = db.prepare("SELECT id, content FROM prompts").all() as { id: number, content: string }[];
    const updatePrompt = db.prepare("UPDATE prompts SET content = ? WHERE id = ?");
    
    existingPrompts.forEach(p => {
      let newContent = p.content;
      let changed = false;

      // Replace old placeholders with new ones
      if (newContent.includes('{title}') || newContent.includes('{chapter_num}')) {
        // If it's a chapter prompt, we should probably wrap it in the new format
        if (!newContent.includes('{context}') && !newContent.includes('{task}')) {
          newContent = `${newContent}\n\n背景上下文：\n{context}\n\n任务：\n{task}`;
          changed = true;
        }
      } else if (!newContent.includes('{context}') && !newContent.includes('{task}')) {
        // For other types, just append {context}
        newContent = `${newContent}\n\n内容：\n{context}`;
        changed = true;
      }

      if (changed) {
        updatePrompt.run(newContent, p.id);
      }
    });
  }

  // Insert default AI config if not exists
  const configCount = db.prepare("SELECT COUNT(*) as count FROM ai_configs").get().count;
  if (configCount === 0) {
    db.prepare(`
      INSERT INTO ai_configs (provider, model, is_active, parameters)
      VALUES (?, ?, ?, ?)
    `).run('gemini', 'gemini-3-flash-preview', 1, JSON.stringify({ temperature: 0.7, top_p: 0.9, max_tokens: 2000 }));
    logOperation("系统初始化", "已插入默认 AI 配置 (Gemini)");
  }

  async function callAI(config: any, prompt: string, systemInstruction?: string) {
    const { provider, model, api_key, base_url, parameters } = config;
    const params = JSON.parse(parameters || '{}');

    if (provider === 'gemini') {
      const ai = new GoogleGenAI({ apiKey: api_key || process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: model || "gemini-3-flash-preview",
        contents: prompt,
        config: {
          systemInstruction,
          temperature: params.temperature,
          topP: params.top_p,
          maxOutputTokens: params.max_tokens
        }
      });
      return response.text || "";
    } else {
      // OpenAI / DeepSeek / Custom (OpenAI compatible)
      const url = `${base_url || (provider === 'deepseek' ? 'https://api.deepseek.com' : 'https://api.openai.com/v1')}/chat/completions`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${api_key}`
        },
        body: JSON.stringify({
          model: model,
          messages: [
            ...(systemInstruction ? [{ role: 'system', content: systemInstruction }] : []),
            { role: 'user', content: prompt }
          ],
          temperature: params.temperature,
          top_p: params.top_p,
          max_tokens: params.max_tokens
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || response.statusText);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    }
  }

  // API Routes
  
  // Prompts
  app.get("/api/prompts", (req, res) => {
    const prompts = db.prepare("SELECT * FROM prompts ORDER BY created_at DESC").all();
    res.json(prompts);
  });

  app.post("/api/prompts", (req, res) => {
    const { name, content, type, is_default } = req.body;
    if (is_default) {
      db.prepare("UPDATE prompts SET is_default = 0 WHERE type = ?").run(type);
    }
    const info = db.prepare("INSERT INTO prompts (name, content, type, is_default) VALUES (?, ?, ?, ?)").run(name, content, type, is_default ? 1 : 0);
    logOperation("创建提示词", { 名称: name, 类型: type });
    res.json({ id: info.lastInsertRowid });
  });

  app.patch("/api/prompts/:id", (req, res) => {
    const { name, content, type, is_default } = req.body;
    
    const currentPrompt = db.prepare("SELECT type, is_default FROM prompts WHERE id = ?").get(req.params.id);
    if (!currentPrompt) return res.status(404).json({ error: "Prompt not found" });

    const targetType = type || currentPrompt.type;
    const targetIsDefault = is_default !== undefined ? (is_default ? 1 : 0) : currentPrompt.is_default;

    if (targetIsDefault === 1) {
      // Clear other defaults for the target category
      db.prepare("UPDATE prompts SET is_default = 0 WHERE type = ? AND id != ?").run(targetType, req.params.id);
    }

    db.prepare(`
      UPDATE prompts 
      SET name = COALESCE(?, name), 
          content = COALESCE(?, content), 
          type = COALESCE(?, type), 
          is_default = ? 
      WHERE id = ?
    `).run(name, content, type, targetIsDefault, req.params.id);
    
    logOperation("更新提示词", { ID: req.params.id });
    res.json({ success: true });
  });

  app.delete("/api/prompts/:id", (req, res) => {
    db.prepare("DELETE FROM prompts WHERE id = ?").run(req.params.id);
    logOperation("删除提示词", { ID: req.params.id });
    res.json({ success: true });
  });

  // Operation Logs
  app.get("/api/logs", (req, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const total = db.prepare("SELECT COUNT(*) as count FROM operation_logs").get() as { count: number };
    const logs = db.prepare("SELECT * FROM operation_logs ORDER BY created_at DESC LIMIT ? OFFSET ?").all(limit, offset);
    
    res.json({
      logs,
      total: total.count,
      page,
      totalPages: Math.ceil(total.count / limit)
    });
  });

  // AI Configs
  app.get("/api/ai-configs", (req, res) => {
    const configs = db.prepare("SELECT * FROM ai_configs").all();
    res.json(configs);
  });

  app.post("/api/ai-configs", (req, res) => {
    const { provider, model, api_key, base_url, parameters, is_active } = req.body;
    if (is_active) {
      db.prepare("UPDATE ai_configs SET is_active = 0").run();
    }
    
    const sanitizeParams = (params: any) => {
      if (typeof params === 'string') return params;
      try {
        return JSON.stringify(params);
      } catch (e) {
        return '{}';
      }
    };

    db.prepare(`
      INSERT INTO ai_configs (provider, model, api_key, base_url, parameters, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(provider) DO UPDATE SET
        model = excluded.model,
        api_key = excluded.api_key,
        base_url = excluded.base_url,
        parameters = excluded.parameters,
        is_active = excluded.is_active
    `).run(provider, model, api_key, base_url, sanitizeParams(parameters), is_active ? 1 : 0);
    logOperation("更新AI配置", { 供应商: provider });
    res.json({ success: true });
  });

  app.post("/api/ai-configs/test", async (req, res) => {
    try {
      const config = req.body;
      const result = await callAI(config, "Hello, this is a connection test. Please reply with 'OK'.");
      res.json({ success: true, message: result });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Get all novels with stats
  app.post("/api/token-logs", (req, res) => {
    const { novel_id, operation_type, tokens } = req.body;
    if (!novel_id || !operation_type || !tokens) {
      return res.status(400).json({ error: "novel_id, operation_type, and tokens are required" });
    }
    try {
      db.prepare(
        "INSERT INTO token_logs (novel_id, operation_type, tokens) VALUES (?, ?, ?)"
      ).run(novel_id, operation_type, tokens);
      res.status(201).json({ success: true });
    } catch (error) {
      console.error("Failed to log tokens:", error);
      res.status(500).json({ error: "Failed to log tokens" });
    }
  });

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
      db.prepare("INSERT INTO outline_versions (novel_id, version_name, content, is_active) VALUES (?, ?, ?, ?)").run(novelId, "V1.0 初始版本", "", 1);
      
      logOperation("创建小说", { 标题: title });
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
      const { title, description, target_chapters, characters, storylines, world_setting, cover_url, relationships, status, last_supplement_at, token_usage } = req.body;
      
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
        sanitize(status),
        last_supplement_at ?? null,
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
            relationships = COALESCE(?, relationships),
            status = COALESCE(?, status),
            last_supplement_at = COALESCE(?, last_supplement_at)
        WHERE id = ?
      `).run(...params);

      if (token_usage) {
        db.prepare("INSERT INTO token_logs (novel_id, tokens, type) VALUES (?, ?, 'supplement')").run(req.params.id, token_usage);
      }
      
      logOperation("更新小说", { ID: req.params.id, 标题: title });
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
    logOperation("删除小说", { ID: id });
    res.json({ success: true });
  });

  // Outline Version Routes
  app.post("/api/novels/:id/outlines", (req, res) => {
    const { version_name, content, token_usage } = req.body;
    db.prepare("INSERT INTO outline_versions (novel_id, version_name, content, is_active) VALUES (?, ?, ?, 0)").run(req.params.id, version_name, content);
    if (token_usage) {
      db.prepare("INSERT INTO token_logs (novel_id, operation_type, tokens) VALUES (?, ?, ?)").run(req.params.id, "生成大纲", token_usage);
    }
    logOperation("创建大纲版本", { 小说ID: req.params.id, 版本: version_name });
    res.json({ success: true });
  });

  app.patch("/api/outlines/:id/activate", (req, res) => {
    const outline = db.prepare("SELECT novel_id FROM outline_versions WHERE id = ?").get(req.params.id);
    if (outline) {
      db.prepare("UPDATE outline_versions SET is_active = 0 WHERE novel_id = ?").run(outline.novel_id);
      db.prepare("UPDATE outline_versions SET is_active = 1 WHERE id = ?").run(req.params.id);
      logOperation("激活大纲版本", { ID: req.params.id });
    }
    res.json({ success: true });
  });

  app.patch("/api/outlines/:id", (req, res) => {
    const { content, version_name } = req.body;
    db.prepare("UPDATE outline_versions SET content = COALESCE(?, content), version_name = COALESCE(?, version_name) WHERE id = ?").run(content, version_name, req.params.id);
    logOperation("更新大纲版本", { ID: req.params.id });
    res.json({ success: true });
  });

  app.delete("/api/outlines/:id", (req, res) => {
    const outline = db.prepare("SELECT novel_id, is_active FROM outline_versions WHERE id = ?").get(req.params.id) as { novel_id: number, is_active: number };
    if (outline) {
      db.prepare("DELETE FROM outline_versions WHERE id = ?").run(req.params.id);
      logOperation("删除大纲版本", { ID: req.params.id });
      
      // If the deleted version was active, activate another one if available
      if (outline.is_active) {
        const another = db.prepare("SELECT id FROM outline_versions WHERE novel_id = ? LIMIT 1").get(outline.novel_id) as { id: number };
        if (another) {
          db.prepare("UPDATE outline_versions SET is_active = 1 WHERE id = ?").run(another.id);
        }
      }
    }
    res.json({ success: true });
  });

  app.post("/api/chapters", (req, res) => {
    const { novel_id, title, content, token_usage, scheduled_at } = req.body;
    const word_count = content ? content.length : 0;
    const info = db.prepare(`
      INSERT INTO chapters (novel_id, title, content, word_count, token_usage, scheduled_at) 
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(novel_id, title, content, word_count, token_usage || 0, scheduled_at || null);
    
    logOperation("创建章节", { 小说ID: novel_id, 标题: title });
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

    logOperation("更新章节", { ID: req.params.id, 标题: title });
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
    logOperation("删除章节", { ID: id });
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
    const { type, novel_id, chapter_id, platform_id, scheduled_at, count, recurrence } = req.body;
    const info = db.prepare(`
      INSERT INTO tasks (type, novel_id, chapter_id, platform_id, scheduled_at, count, recurrence, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
    `).run(type, novel_id, chapter_id, platform_id, scheduled_at, count || 1, recurrence || 'once');
    res.json({ id: info.lastInsertRowid });
  });

  app.post("/api/tasks/:id/run", async (req, res) => {
    const { id } = req.params;
    const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);
    if (!task) return res.status(404).json({ error: "Task not found" });

    res.json({ message: "Task started" });

    // Run in background
    (async () => {
      console.log(`[Manual] Running task ${task.id}: ${task.type}`);
      logOperation("手动执行任务", { 任务ID: task.id, 类型: task.type });
      db.prepare("UPDATE tasks SET status = 'running' WHERE id = ?").run(task.id);

      try {
        if (task.type === 'generate') {
          const count = task.count || 1;
          for (let i = 0; i < count; i++) {
            await handleServerSideGeneration(task);
          }
        } else if (task.type === 'publish') {
          await handleServerSidePublication(task);
        }
        
        if (task.recurrence === 'daily') {
          const nextRun = new Date(new Date(task.scheduled_at).getTime() + 24 * 60 * 60 * 1000).toISOString();
          db.prepare("UPDATE tasks SET status = 'pending', scheduled_at = ? WHERE id = ?").run(nextRun, task.id);
        } else {
          db.prepare("UPDATE tasks SET status = 'completed' WHERE id = ?").run(task.id);
        }
        logOperation("任务完成", { 任务ID: task.id, 类型: task.type });
      } catch (error: any) {
        console.error(`[Manual] Task ${task.id} failed:`, error);
        if (task.recurrence === 'daily') {
          const nextRun = new Date(new Date(task.scheduled_at).getTime() + 24 * 60 * 60 * 1000).toISOString();
          db.prepare("UPDATE tasks SET status = 'pending', scheduled_at = ?, error = ? WHERE id = ?").run(nextRun, error.message || String(error), task.id);
        } else {
          db.prepare("UPDATE tasks SET status = 'failed', error = ? WHERE id = ?").run(error.message || String(error), task.id);
        }
        logOperation("任务失败", { 任务ID: task.id, 类型: task.type, 错误: error.message || String(error) });
      }
    })();
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

    // Calculate token trend (last 7 days vs previous 7 days)
    const currentWeekTokens = db.prepare(`
      SELECT SUM(tokens) as total FROM token_logs 
      WHERE created_at >= datetime('now', '-7 days')
    `).get().total || 0;
    
    const previousWeekTokens = db.prepare(`
      SELECT SUM(tokens) as total FROM token_logs 
      WHERE created_at >= datetime('now', '-14 days') AND created_at < datetime('now', '-7 days')
    `).get().total || 0;

    let tokenTrend = 0;
    if (previousWeekTokens > 0) {
      tokenTrend = Math.round(((currentWeekTokens - previousWeekTokens) / previousWeekTokens) * 100);
    } else if (currentWeekTokens > 0) {
      tokenTrend = 100;
    }

    // Calculate view trend (based on chapter publishing as a proxy for view growth)
    // In this app, views are updated when chapters are published in the cron job.
    // We can estimate view growth by looking at how many chapters were published.
    const currentWeekChapters = db.prepare(`
      SELECT COUNT(*) as count FROM chapters 
      WHERE published_at >= datetime('now', '-7 days')
    `).get().count || 0;

    const previousWeekChapters = db.prepare(`
      SELECT COUNT(*) as count FROM chapters 
      WHERE published_at >= datetime('now', '-14 days') AND published_at < datetime('now', '-7 days')
    `).get().count || 0;

    let viewTrend = 0;
    if (previousWeekChapters > 0) {
      viewTrend = Math.round(((currentWeekChapters - previousWeekChapters) / previousWeekChapters) * 100);
    } else if (currentWeekChapters > 0) {
      viewTrend = 100;
    }

    res.json({ 
      totalTokens: totalTokens.total || 0, 
      tokensByNovel, 
      dailyTokens,
      tokenTrend,
      viewTrend
    });
  });

  app.get("/api/stats/logs", (req, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const total = db.prepare("SELECT COUNT(*) as count FROM token_logs").get().count;
    const totalPages = Math.ceil(total / limit);

    const logs = db.prepare(`
      SELECT tl.*, n.title as novel_title, c.title as chapter_title
      FROM token_logs tl
      LEFT JOIN novels n ON tl.novel_id = n.id
      LEFT JOIN chapters c ON tl.chapter_id = c.id
      ORDER BY tl.created_at DESC
      LIMIT ? OFFSET ?
    `).all(limit, offset);
    
    res.json({
      logs,
      total,
      page,
      totalPages
    });
  });

  // Scheduled Tasks Processor
  cron.schedule("* * * * *", async () => {
    const now = new Date().toISOString();
    console.log(`[Cron] Checking tasks at ${now}`);
    
    // 1. Process legacy scheduled chapters (Publishing)
    const pendingChapters = db.prepare("SELECT * FROM chapters WHERE status = 'draft' AND scheduled_at <= ?").all(now);
    for (const chapter of pendingChapters) {
      console.log(`[Cron] Publishing chapter: ${chapter.title}`);
      db.prepare("UPDATE chapters SET status = 'published', published_at = ? WHERE id = ?").run(new Date().toISOString(), chapter.id);
      db.prepare("UPDATE novels SET views = views + ? WHERE id = ?").run(Math.floor(Math.random() * 100), chapter.novel_id);
    }

    // 2. Process new Tasks table
    const pendingTasks = db.prepare("SELECT * FROM tasks WHERE status = 'pending'").all();
    
    if (pendingTasks.length > 0) {
      console.log(`[Cron] Found ${pendingTasks.length} pending tasks. Current time: ${now}`);
    }

    for (const task of pendingTasks) {
      const taskTime = new Date(task.scheduled_at).getTime();
      const currentTime = new Date(now).getTime();

      if (taskTime <= currentTime) {
        console.log(`[Cron] Processing task ${task.id}: ${task.type} (scheduled: ${task.scheduled_at}, now: ${now})`);
        logOperation("任务开始", { 任务ID: task.id, 类型: task.type, 预定时间: task.scheduled_at, 当前时间: now });
        db.prepare("UPDATE tasks SET status = 'running' WHERE id = ?").run(task.id);

        try {
          if (task.type === 'generate') {
            const count = task.count || 1;
            console.log(`[Cron] Generating ${count} chapters for novel ${task.novel_id}`);
            for (let i = 0; i < count; i++) {
              await handleServerSideGeneration(task);
            }
          } else if (task.type === 'publish') {
            await handleServerSidePublication(task);
          }
          
          if (task.recurrence === 'daily') {
            const nextRun = new Date(taskTime + 24 * 60 * 60 * 1000).toISOString();
            db.prepare("UPDATE tasks SET status = 'pending', scheduled_at = ? WHERE id = ?").run(nextRun, task.id);
            console.log(`[Cron] Task ${task.id} rescheduled for ${nextRun}`);
          } else {
            db.prepare("UPDATE tasks SET status = 'completed' WHERE id = ?").run(task.id);
          }
          logOperation("任务完成", { 任务ID: task.id, 类型: task.type });
        } catch (error: any) {
          console.error(`[Cron] Task ${task.id} failed:`, error);
          if (task.recurrence === 'daily') {
            const nextRun = new Date(taskTime + 24 * 60 * 60 * 1000).toISOString();
            db.prepare("UPDATE tasks SET status = 'pending', scheduled_at = ?, error = ? WHERE id = ?").run(nextRun, error.message || String(error), task.id);
            console.log(`[Cron] Task ${task.id} failed but rescheduled for ${nextRun}`);
          } else {
            db.prepare("UPDATE tasks SET status = 'failed', error = ? WHERE id = ?").run(error.message || String(error), task.id);
          }
          logOperation("任务失败", { 任务ID: task.id, 类型: task.type, 错误: error.message || String(error) });
        }
      } else {
        // console.log(`[Cron] Task ${task.id} not yet due (scheduled: ${task.scheduled_at}, now: ${now})`);
      }
    }
  });

  async function handleServerSideGeneration(task: any) {
    console.log(`[Cron] Generating chapter for novel ${task.novel_id}...`);
    const novel = db.prepare("SELECT * FROM novels WHERE id = ?").get(task.novel_id);
    if (!novel) throw new Error("Novel not found");

    const chapters = db.prepare("SELECT * FROM chapters WHERE novel_id = ? ORDER BY created_at ASC").all(task.novel_id);
    const activeOutline = db.prepare("SELECT content FROM outline_versions WHERE novel_id = ? AND is_active = 1 LIMIT 1").get(task.novel_id);
    
    const nextChapterNum = chapters.length + 1;
    const title = `第 ${nextChapterNum} 章`;

    // Get active AI config
    const aiConfig = db.prepare("SELECT * FROM ai_configs WHERE is_active = 1 LIMIT 1").get();
    if (!aiConfig) throw new Error("未找到激活的 AI 配置");

    console.log(`[Cron] Using AI model: ${aiConfig.model}`);
    // Get default chapter prompt
    const promptTemplate = db.prepare("SELECT content FROM prompts WHERE type = 'chapter' AND is_default = 1 LIMIT 1").get();
    const promptText = promptTemplate 
      ? promptTemplate.content.replace('{chapter_num}', nextChapterNum.toString()).replace('{title}', novel.title)
      : `创作小说《${novel.title}》的第 ${nextChapterNum} 章。`;

    const context = `小说标题: ${novel.title}\n描述: ${novel.description}\n大纲: ${activeOutline?.content || ""}\n角色: ${novel.characters || ""}\n世界设定: ${novel.world_setting || ""}\n前文背景: ${chapters.slice(-2).map((c: any) => c.title + ": " + (c.content || "").slice(-500)).join("\n")}`;

    const content = await callAI(aiConfig, `${context}\n\n${promptText}`);
    const word_count = content.length;

    // Create chapter
    const info = db.prepare(`
      INSERT INTO chapters (novel_id, title, content, word_count, token_usage, status) 
      VALUES (?, ?, ?, ?, ?, 'draft')
    `).run(task.novel_id, title, content, word_count, 0);

    console.log(`[Cron] Chapter "${title}" generated successfully (ID: ${info.lastInsertRowid})`);
    logOperation("章节生成成功", { 任务ID: task.id, 小说ID: task.novel_id, 章节ID: info.lastInsertRowid });
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
    logOperation("发布成功", { 任务ID: task.id, 章节ID: chapter.id, 平台: platform.name });
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
    logOperation("系统启动", { 端口: PORT, 时间: new Date().toISOString() });
  });
}

startServer();

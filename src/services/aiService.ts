import { GoogleGenAI, Type } from "@google/genai";
import OpenAI from "openai";
import { AIConfig, WritingConfig, Chapter } from "../types";

export async function generateAIContent(
  prompt: string, 
  context: string, 
  config: AIConfig, 
  writingConfig: WritingConfig,
  language: string = 'en',
  signal?: AbortSignal,
  promptTemplate?: string
) {
  const langInstruction = language === 'zh' ? "请使用简体中文回答。" : "Please respond in English.";
  
  let layoutInstruction = "";
  if (writingConfig.layout === 'web') {
    layoutInstruction = "严格排版规则：使用网络小说风格。这意味着段落非常短（通常只有1-2句话），频繁换行，并包含大量对话。务必避免长篇大论。";
  } else if (writingConfig.layout === 'traditional') {
    layoutInstruction = "严格排版规则：使用传统文学风格。这意味着段落较长且具有描述性，语气正式，词汇丰富。使用标准段落结构。";
  } else {
    layoutInstruction = "使用标准小说格式，段落长度均衡，叙述流畅。";
  }

  const wordCountInstruction = writingConfig.enforceWordCount 
    ? `内容长度应在 ${writingConfig.minWords} 到 ${writingConfig.maxWords} 字之间。`
    : "如果没有特别说明，请遵循大纲中的长度要求。否则，请撰写标准长度的章节。";

  let fullPrompt = `你是一位创意小说作家。${langInstruction}\n\n${layoutInstruction}\n${wordCountInstruction}\n\n背景上下文：${context}\n\n任务：${prompt}`;
  
  if (promptTemplate) {
    fullPrompt = promptTemplate
      .replace(/{context}/g, context)
      .replace(/{task}/g, prompt)
      .replace(/{langInstruction}/g, langInstruction)
      .replace(/{layoutInstruction}/g, layoutInstruction)
      .replace(/{wordCountInstruction}/g, wordCountInstruction);
  }

  if (config.provider === 'gemini') {
    const ai = new GoogleGenAI({ apiKey: config.apiKey || process.env.GEMINI_API_KEY || "" });
    const systemInstruction = `你是一位创意小说作家。${layoutInstruction} ${langInstruction} 
    严格规则：仅输出小说内容。不要包含元对话、章节摘要或诸如“这是第X章”或“故事继续”之类的结束语。
    如果是接着之前的文本创作，请从上次停止的地方开始，不要重复任何内容。`;

    try {
      const response = await ai.models.generateContent({
        model: config.model || "gemini-3-flash-preview",
        contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
        config: {
          temperature: 0.8,
          maxOutputTokens: 8192,
          systemInstruction: systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "章节标题" },
              content: { type: Type.STRING, description: "章节完整内容" }
            },
            required: ["title", "content"]
          }
        }
      });

      let text = response.text || "{}";
      if (text.includes("```json")) {
        text = text.split("```json")[1].split("```")[0].trim();
      } else if (text.includes("```")) {
        text = text.split("```")[1].split("```")[0].trim();
      }

      let data = { title: "", content: "" };
      try {
        data = JSON.parse(text);
      } catch (e) {
        data = { title: "", content: text };
      }

      return {
        title: data.title || "",
        text: data.content || text,
        tokens: (response.text?.length || 0) / 4 + (prompt.length + context.length) / 4
      };
    } catch (error) {
      console.error("Gemini Error:", error);
      throw error;
    }
  } else {
    // OpenAI, DeepSeek, or Custom
    const openai = new OpenAI({
      apiKey: config.apiKey || "",
      baseURL: config.baseUrl || (config.provider === 'deepseek' ? "https://api.deepseek.com" : undefined),
      dangerouslyAllowBrowser: true
    });

    try {
      const response = await openai.chat.completions.create({
        model: config.model || (config.provider === 'openai' ? "gpt-4o" : (config.provider === 'deepseek' ? "deepseek-chat" : "")),
        messages: [
          { role: "system", content: `你是一位创意小说作家。${layoutInstruction} ${langInstruction} 始终以 JSON 格式返回响应，包含 'title' 和 'content' 键。` },
          { role: "user", content: fullPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.8,
        max_tokens: 4096,
      }, { signal });

      const text = response.choices[0].message.content || "{}";
      const data = JSON.parse(text);

      return {
        title: data.title || "",
        text: data.content || text,
        tokens: response.usage?.total_tokens || 0
      };
    } catch (error) {
      console.error(`${config.provider} Error:`, error);
      throw error;
    }
  }
}

export async function* generateAIContentStream(
  prompt: string, 
  context: string, 
  config: AIConfig, 
  writingConfig: WritingConfig,
  language: string = 'en',
  signal?: AbortSignal,
  promptTemplate?: string
) {
  const langInstruction = language === 'zh' ? "请使用简体中文回答。" : "Please respond in English.";
  
  let layoutInstruction = "";
  if (writingConfig.layout === 'web') {
    layoutInstruction = "严格排版规则：使用网络小说风格。这意味着段落非常短（通常只有1-2句话），频繁换行，并包含大量对话。务必避免长篇大论。";
  } else if (writingConfig.layout === 'traditional') {
    layoutInstruction = "严格排版规则：使用传统文学风格。这意味着段落较长且具有描述性，语气正式，词汇丰富。使用标准段落结构。";
  } else {
    layoutInstruction = "使用标准小说格式，段落长度均衡，叙述流畅。";
  }

  const wordCountInstruction = writingConfig.enforceWordCount 
    ? `内容长度应在 ${writingConfig.minWords} 到 ${writingConfig.maxWords} 字之间。`
    : "如果没有特别说明，请遵循大纲中的长度要求。否则，请撰写标准长度的章节。";
  
  let fullPrompt = `你是一位创意小说作家。${langInstruction}\n\n${layoutInstruction}\n${wordCountInstruction}\n\n背景上下文：${context}\n\n任务：${prompt}\n\n重要提示：仅输出小说正文内容。不要使用 JSON。不要包含标题或元对话。`;
  
  if (promptTemplate) {
    fullPrompt = promptTemplate
      .replace(/{context}/g, context)
      .replace(/{task}/g, prompt)
      .replace(/{langInstruction}/g, langInstruction)
      .replace(/{layoutInstruction}/g, layoutInstruction)
      .replace(/{wordCountInstruction}/g, wordCountInstruction) + "\n\n重要提示：仅输出小说正文内容。不要使用 JSON。不要包含标题或元对话。";
  }

  if (config.provider === 'gemini') {
    const ai = new GoogleGenAI({ apiKey: config.apiKey || process.env.GEMINI_API_KEY || "" });
    const systemInstruction = `你是一位创意小说作家。${layoutInstruction} ${langInstruction} 
    严格规则：仅输出小说内容。不要包含元对话、章节摘要或结束语。
    如果是接着之前的文本创作，请从上次停止的地方开始，不要重复任何内容。`;

    try {
      const response = await ai.models.generateContentStream({
        model: config.model || "gemini-3-flash-preview",
        contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
        config: {
          temperature: 0.8,
          maxOutputTokens: 8192,
          systemInstruction: systemInstruction,
        }
      });

      for await (const chunk of response) {
        if (signal?.aborted) break;
        if (chunk.text) {
          yield chunk.text;
        }
      }
    } catch (error) {
      console.error("Gemini Stream Error:", error);
      throw error;
    }
  } else {
    const openai = new OpenAI({
      apiKey: config.apiKey || "",
      baseURL: config.baseUrl || (config.provider === 'deepseek' ? "https://api.deepseek.com" : undefined),
      dangerouslyAllowBrowser: true
    });

    try {
      const stream = await openai.chat.completions.create({
        model: config.model || (config.provider === 'openai' ? "gpt-4o" : (config.provider === 'deepseek' ? "deepseek-chat" : "")),
        messages: [
          { role: "system", content: `你是一位创意小说作家。${layoutInstruction} ${langInstruction} 仅输出小说正文内容。` },
          { role: "user", content: fullPrompt }
        ],
        temperature: 0.8,
        max_tokens: 4096,
        stream: true,
      }, { signal });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          yield content;
        }
      }
    } catch (error) {
      console.error(`${config.provider} Stream Error:`, error);
      throw error;
    }
  }
}

export async function generateAIOutline(title: string, genre: string, config: AIConfig, language: string = 'en', promptTemplate?: string) {
  const langInstruction = language === 'zh' ? "请使用简体中文回答。" : "Please respond in English.";
  const defaultPrompt = `为一部名为《${title}》的 ${genre} 小说创作详细的大纲。${langInstruction} 包括主要角色、情节要点和世界设定。`;
  
  let fullPrompt = defaultPrompt;
  if (promptTemplate) {
    fullPrompt = promptTemplate
      .replace(/{title}/g, title)
      .replace(/{genre}/g, genre)
      .replace(/{langInstruction}/g, langInstruction);
  }

  if (config.provider === 'gemini') {
    const ai = new GoogleGenAI({ apiKey: config.apiKey || process.env.GEMINI_API_KEY || "" });
    try {
      const response = await ai.models.generateContent({
        model: config.model || "gemini-3-flash-preview",
        contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
        config: { temperature: 0.7 }
      });

      return {
        text: response.text || "",
        tokens: (response.text?.length || 0) / 4 + (title.length + genre.length) / 4
      };
    } catch (error) {
      console.error("Gemini Error:", error);
      throw error;
    }
  } else {
    const openai = new OpenAI({
      apiKey: config.apiKey || "",
      baseURL: config.baseUrl || (config.provider === 'deepseek' ? "https://api.deepseek.com" : undefined),
      dangerouslyAllowBrowser: true
    });

    try {
      const response = await openai.chat.completions.create({
        model: config.model || (config.provider === 'openai' ? "gpt-4o" : (config.provider === 'deepseek' ? "deepseek-chat" : "")),
        messages: [{ role: "user", content: fullPrompt }],
        temperature: 0.7,
      });

      return {
        text: response.choices[0].message.content || "",
        tokens: response.usage?.total_tokens || 0
      };
    } catch (error) {
      console.error(`${config.provider} Error:`, error);
      throw error;
    }
  }
}

export async function generateChapterTitle(content: string, config: AIConfig, language: string = 'en') {
  const langInstruction = language === 'zh' ? "请使用简体中文回答。" : "Please respond in English.";
  const fullPrompt = `根据以下小说章节内容，生成一个简明且贴切的章节标题。${langInstruction}\n\n内容：${content.slice(0, 2000)}\n\n任务：仅输出标题文本。不要带引号，不要带“第X章”，不要带前导破折号或点，仅输出标题。`;

  if (config.provider === 'gemini') {
    const ai = new GoogleGenAI({ apiKey: config.apiKey || process.env.GEMINI_API_KEY || "" });
    try {
      const response = await ai.models.generateContent({
        model: config.model || "gemini-3-flash-preview",
        contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
        config: { temperature: 0.7 }
      });

      return response.text?.trim() || "Untitled Chapter";
    } catch (error) {
      console.error("Gemini Error:", error);
      return "Untitled Chapter";
    }
  } else {
    const openai = new OpenAI({
      apiKey: config.apiKey || "",
      baseURL: config.baseUrl || (config.provider === 'deepseek' ? "https://api.deepseek.com" : undefined),
      dangerouslyAllowBrowser: true
    });

    try {
      const response = await openai.chat.completions.create({
        model: config.model || (config.provider === 'openai' ? "gpt-4o" : (config.provider === 'deepseek' ? "deepseek-chat" : "")),
        messages: [{ role: "user", content: fullPrompt }],
        temperature: 0.7,
      });

      return response.choices[0].message.content?.trim() || "Untitled Chapter";
    } catch (error) {
      console.error(`${config.provider} Error:`, error);
      return "Untitled Chapter";
    }
  }
}

export async function generateChapterSummary(content: string, config: AIConfig, language: string = 'en', promptTemplate?: string) {
  const langInstruction = language === 'zh' ? "请使用简体中文回答。" : "Please respond in English.";
  const defaultPrompt = `将以下小说章节总结为简明摘要（最多 200 字）。重点关注角色发展、情节推进和世界观细节。${langInstruction}\n\n内容：${content}\n\n任务：仅输出摘要文本。`;
  
  let fullPrompt = defaultPrompt;
  if (promptTemplate) {
    fullPrompt = promptTemplate
      .replace(/{content}/g, content)
      .replace(/{langInstruction}/g, langInstruction);
  }

  if (config.provider === 'gemini') {
    const ai = new GoogleGenAI({ apiKey: config.apiKey || process.env.GEMINI_API_KEY || "" });
    try {
      const response = await ai.models.generateContent({
        model: config.model || "gemini-3-flash-preview",
        contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
        config: { temperature: 0.5 }
      });
      return response.text?.trim() || "";
    } catch (error) {
      console.error("Gemini Summary Error:", error);
      return "";
    }
  } else {
    const openai = new OpenAI({
      apiKey: config.apiKey || "",
      baseURL: config.baseUrl || (config.provider === 'deepseek' ? "https://api.deepseek.com" : undefined),
      dangerouslyAllowBrowser: true
    });
    try {
      const response = await openai.chat.completions.create({
        model: config.model || (config.provider === 'openai' ? "gpt-4o" : (config.provider === 'deepseek' ? "deepseek-chat" : "")),
        messages: [{ role: "user", content: fullPrompt }],
        temperature: 0.5,
      });
      return response.choices[0].message.content?.trim() || "";
    } catch (error) {
      console.error(`${config.provider} Summary Error:`, error);
      return "";
    }
  }
}

export async function extractNovelMetadata(
  chapters: Chapter[], 
  currentMetadata: { characters: string, storylines: string, world_setting: string, relationships: string },
  config: AIConfig, 
  language: string = 'en'
) {
  const langInstruction = language === 'zh' ? "请使用简体中文回答。" : "Please respond in English.";
  
  // Optimization: Smarter sampling for large novels
  let selectedChapters: Chapter[] = [];
  if (chapters.length <= 20) {
    selectedChapters = chapters;
  } else {
    // Take first 3 (origin), 2 from middle (transition), and last 15 (current context)
    const firstThree = chapters.slice(0, 3);
    const middleIdx = Math.floor(chapters.length / 2);
    const middleTwo = chapters.slice(middleIdx - 1, middleIdx + 1);
    const lastFifteen = chapters.slice(-15);
    
    // Use a Set to avoid duplicates if indices overlap
    const selectedSet = new Set([...firstThree, ...middleTwo, ...lastFifteen]);
    selectedChapters = Array.from(selectedSet).sort((a, b) => 
      chapters.indexOf(a) - chapters.indexOf(b)
    );
  }

  const chaptersContent = selectedChapters.map(c => {
    const content = c.summary || c.content.slice(0, 600);
    return `章节 ${c.title} (索引: ${chapters.indexOf(c) + 1}, ${c.summary ? '摘要' : '摘录'}):\n${content}`;
  }).join("\n\n");
  
  const fullPrompt = `你是一位创意编辑。根据提供的章节摘要或摘录，提取并更新小说的元数据。
  ${langInstruction}
  
  当前元数据：
  角色：${currentMetadata.characters}
  剧情线：${currentMetadata.storylines}
  世界设定：${currentMetadata.world_setting}
  人际关系：${currentMetadata.relationships}
  
  近期章节信息：
  ${chaptersContent}
  
  任务：分析章节并更新元数据。
  - 角色：列出主要角色、他们的特征和当前状态。
  - 剧情线：总结主要情节要点和活跃的支线。
  - 世界设定：更新引入的地理、魔法系统或社会规则。
  - 人际关系：描述角色之间的联系（例如，“A 是 B 的导师”，“C 和 D 是竞争对手”）。
  
  以 JSON 格式返回响应。`;

  if (config.provider === 'gemini') {
    const ai = new GoogleGenAI({ apiKey: config.apiKey || process.env.GEMINI_API_KEY || "" });
    try {
      const response = await ai.models.generateContent({
        model: config.model || "gemini-3-flash-preview",
        contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
        config: {
          temperature: 0.7,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              characters: { type: Type.STRING, description: "角色信息" },
              storylines: { type: Type.STRING, description: "剧情线信息" },
              world_setting: { type: Type.STRING, description: "世界设定信息" },
              relationships: { type: Type.STRING, description: "人际关系信息" }
            },
            required: ["characters", "storylines", "world_setting", "relationships"]
          }
        }
      });

      let text = response.text || "{}";
      return JSON.parse(text);
    } catch (error) {
      console.error("Gemini Metadata Extraction Error:", error);
      throw error;
    }
  } else {
    const openai = new OpenAI({
      apiKey: config.apiKey || "",
      baseURL: config.baseUrl || (config.provider === 'deepseek' ? "https://api.deepseek.com" : undefined),
      dangerouslyAllowBrowser: true
    });

    try {
      const response = await openai.chat.completions.create({
        model: config.model || (config.provider === 'openai' ? "gpt-4o" : (config.provider === 'deepseek' ? "deepseek-chat" : "")),
        messages: [
          { role: "system", content: "你是一位创意编辑。以 JSON 格式返回响应，包含 'characters'、'storylines'、'world_setting' 和 'relationships' 键。" },
          { role: "user", content: fullPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      const text = response.choices[0].message.content || "{}";
      return JSON.parse(text);
    } catch (error) {
      console.error(`${config.provider} Metadata Extraction Error:`, error);
      throw error;
    }
  }
}

export async function refactorWorldSetting(content: string, config: AIConfig, language: string = 'en', promptTemplate?: string) {
  const langInstruction = language === 'zh' ? "请使用简体中文回答。" : "Please respond in English.";
  const defaultPrompt = `将以下小说世界设定内容重构为更结构化的 markdown 格式。
  ${langInstruction}
  
  使用项目符号和清晰的标题：
  - 地理与环境
  - 魔法系统 / 力量体系
  - 历史与背景
  - 社会规则与政治
  - 其他相关方面
  
  内容：${content}
  
  任务：仅输出重构后的 markdown 文本。`;

  let fullPrompt = defaultPrompt;
  if (promptTemplate) {
    fullPrompt = promptTemplate
      .replace(/{content}/g, content)
      .replace(/{langInstruction}/g, langInstruction);
  }

  if (config.provider === 'gemini') {
    const ai = new GoogleGenAI({ apiKey: config.apiKey || process.env.GEMINI_API_KEY || "" });
    try {
      const response = await ai.models.generateContent({
        model: config.model || "gemini-3-flash-preview",
        contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
        config: { temperature: 0.5 }
      });
      return response.text?.trim() || content;
    } catch (error) {
      console.error("Gemini Refactor Error:", error);
      return content;
    }
  } else {
    const openai = new OpenAI({
      apiKey: config.apiKey || "",
      baseURL: config.baseUrl || (config.provider === 'deepseek' ? "https://api.deepseek.com" : undefined),
      dangerouslyAllowBrowser: true
    });
    try {
      const response = await openai.chat.completions.create({
        model: config.model || (config.provider === 'openai' ? "gpt-4o" : (config.provider === 'deepseek' ? "deepseek-chat" : "")),
        messages: [{ role: "user", content: fullPrompt }],
        temperature: 0.5,
      });
      return response.choices[0].message.content?.trim() || content;
    } catch (error) {
      console.error(`${config.provider} Refactor Error:`, error);
      return content;
    }
  }
}

import { GoogleGenAI, Type } from "@google/genai";
import OpenAI from "openai";
import { AIConfig, WritingConfig, Chapter } from "../types";

export async function generateAIContent(
  prompt: string, 
  context: string, 
  config: AIConfig, 
  writingConfig: WritingConfig,
  language: string = 'en',
  signal?: AbortSignal
) {
  const langInstruction = language === 'zh' ? "Please respond in Simplified Chinese." : "Please respond in English.";
  
  let layoutInstruction = "";
  if (writingConfig.layout === 'web') {
    layoutInstruction = "STRICT LAYOUT RULE: Use web novel style. This means VERY short paragraphs (often just 1-2 sentences), frequent line breaks, and a lot of dialogue. Avoid long blocks of text at all costs.";
  } else if (writingConfig.layout === 'traditional') {
    layoutInstruction = "STRICT LAYOUT RULE: Use traditional literary style. This means longer, descriptive paragraphs, formal tone, and rich vocabulary. Use standard paragraph structures.";
  } else {
    layoutInstruction = "Use standard novel formatting with balanced paragraph lengths and natural flow.";
  }

  const wordCountInstruction = `The content should be between ${writingConfig.minWords} and ${writingConfig.maxWords} words.`;

  const fullPrompt = `You are a creative novel writer. ${langInstruction}\n\n${layoutInstruction}\n${wordCountInstruction}\n\nContext: ${context}\n\nTask: ${prompt}`;

  if (config.provider === 'gemini') {
    const ai = new GoogleGenAI({ apiKey: config.apiKey || process.env.GEMINI_API_KEY || "" });
    const systemInstruction = `You are a creative novel writer. ${layoutInstruction} ${langInstruction} 
    STRICT RULE: Output ONLY the novel content. DO NOT include meta-talk, chapter summaries, or concluding remarks like 'This is Chapter X' or 'The story continues'. 
    If continuing from previous text, start exactly where it left off without repeating anything.`;

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
              title: { type: Type.STRING, description: "The title of the chapter" },
              content: { type: Type.STRING, description: "The full content of the chapter" }
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
          { role: "system", content: `You are a creative novel writer. ${layoutInstruction} ${langInstruction} Always return your response in JSON format with 'title' and 'content' keys.` },
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
  signal?: AbortSignal
) {
  const langInstruction = language === 'zh' ? "Please respond in Simplified Chinese." : "Please respond in English.";
  
  let layoutInstruction = "";
  if (writingConfig.layout === 'web') {
    layoutInstruction = "STRICT LAYOUT RULE: Use web novel style. This means VERY short paragraphs (often just 1-2 sentences), frequent line breaks, and a lot of dialogue. Avoid long blocks of text at all costs.";
  } else if (writingConfig.layout === 'traditional') {
    layoutInstruction = "STRICT LAYOUT RULE: Use traditional literary style. This means longer, descriptive paragraphs, formal tone, and rich vocabulary. Use standard paragraph structures.";
  } else {
    layoutInstruction = "Use standard novel formatting with balanced paragraph lengths and natural flow.";
  }

  const wordCountInstruction = `The content should be between ${writingConfig.minWords} and ${writingConfig.maxWords} words.`;
  const fullPrompt = `You are a creative novel writer. ${langInstruction}\n\n${layoutInstruction}\n${wordCountInstruction}\n\nContext: ${context}\n\nTask: ${prompt}\n\nIMPORTANT: Output ONLY the novel content text. Do not use JSON. Do not include titles or meta-talk.`;

  if (config.provider === 'gemini') {
    const ai = new GoogleGenAI({ apiKey: config.apiKey || process.env.GEMINI_API_KEY || "" });
    const systemInstruction = `You are a creative novel writer. ${layoutInstruction} ${langInstruction} 
    STRICT RULE: Output ONLY the novel content. DO NOT include meta-talk, chapter summaries, or concluding remarks. 
    If continuing from previous text, start exactly where it left off without repeating anything.`;

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
          { role: "system", content: `You are a creative novel writer. ${layoutInstruction} ${langInstruction} Output ONLY the novel content text.` },
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

export async function generateAIOutline(title: string, genre: string, config: AIConfig, language: string = 'en') {
  const langInstruction = language === 'zh' ? "Please respond in Simplified Chinese." : "Please respond in English.";
  const fullPrompt = `Create a detailed novel outline for a ${genre} novel titled "${title}". ${langInstruction} Include main characters, plot points, and setting.`;

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
  const langInstruction = language === 'zh' ? "Please respond in Simplified Chinese." : "Please respond in English.";
  const fullPrompt = `Based on the following novel chapter content, generate a concise and fitting chapter title. ${langInstruction}\n\nContent: ${content.slice(0, 2000)}\n\nTask: Output ONLY the title text. No quotes, no 'Chapter X', just the title.`;

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

export async function extractNovelMetadata(
  chapters: Chapter[], 
  currentMetadata: { characters: string, storylines: string, world_setting: string, relationships: string },
  config: AIConfig, 
  language: string = 'en'
) {
  const langInstruction = language === 'zh' ? "Please respond in Simplified Chinese." : "Please respond in English.";
  const recentChapters = chapters.slice(-10);
  const chaptersContent = recentChapters.map(c => `Chapter ${c.title}:\n${c.content.slice(0, 1000)}`).join("\n\n");
  
  const fullPrompt = `You are a creative editor. Based on the provided chapter excerpts, extract and update the novel's metadata. 
  ${langInstruction}
  
  Current Metadata:
  Characters: ${currentMetadata.characters}
  Storylines: ${currentMetadata.storylines}
  World Setting: ${currentMetadata.world_setting}
  Relationships: ${currentMetadata.relationships}
  
  Recent Chapter Excerpts:
  ${chaptersContent}
  
  Task: Analyze the chapters and update the metadata. 
  - Characters: List main characters, their traits, and current status.
  - Storylines: Summarize main plot points and active subplots.
  - World Setting: Update geography, magic systems, or social rules introduced.
  - Relationships: Describe the connections between characters (e.g., "A is B's mentor", "C and D are rivals").
  
  Return the response in JSON format.`;

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
              characters: { type: Type.STRING },
              storylines: { type: Type.STRING },
              world_setting: { type: Type.STRING },
              relationships: { type: Type.STRING }
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
          { role: "system", content: "You are a creative editor. Return your response in JSON format with 'characters', 'storylines', 'world_setting', and 'relationships' keys." },
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

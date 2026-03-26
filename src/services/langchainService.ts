import { BufferMemory } from "@langchain/classic/memory";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOpenAI } from "@langchain/openai";
import { 
  ChatPromptTemplate, 
  SystemMessagePromptTemplate, 
  HumanMessagePromptTemplate,
  MessagesPlaceholder
} from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { AIConfig, WritingConfig } from "../types";

/**
 * LangChain Service for advanced AI operations
 */
export class LangChainService {
  private static memories: Record<string, BufferMemory> = {};

  static clearMemory(novelId: string) {
    if (this.memories[novelId]) {
      delete this.memories[novelId];
    }
  }

  private static getModel(config: AIConfig, signal?: AbortSignal) {
    const normalizedConfig = {
      ...config,
      apiKey: config.apiKey || (config as any).api_key || "",
      baseUrl: config.baseUrl || (config as any).base_url
    };
    const params = this.getParams(normalizedConfig);
    
    // If Gemini but has a baseUrl, it's likely a proxy using OpenAI-compatible API
    if (normalizedConfig.provider === 'gemini' && !normalizedConfig.baseUrl) {
      return new ChatGoogleGenerativeAI({
        apiKey: normalizedConfig.apiKey || process.env.GEMINI_API_KEY || "",
        model: normalizedConfig.model || "gemini-3-flash-preview",
        temperature: params.temperature,
        topP: params.top_p,
        maxOutputTokens: params.max_tokens,
        streaming: true,
        callbacks: signal ? [{
          handleLLMNewToken(token: string) {
            if (signal.aborted) throw new Error("AbortError");
          }
        }] : []
      });
    } else {
      // OpenAI, DeepSeek, Custom, or Gemini with BaseUrl (OpenAI-compatible)
      let modelName = normalizedConfig.model;
      if (!modelName) {
        if (normalizedConfig.provider === 'openai') modelName = "gpt-4o";
        else if (normalizedConfig.provider === 'deepseek') modelName = "deepseek-chat";
        else if (normalizedConfig.provider === 'gemini') modelName = "gemini-3-flash-preview";
        else modelName = "gpt-3.5-turbo";
      }

      return new ChatOpenAI({
        apiKey: normalizedConfig.apiKey,
        model: modelName,
        temperature: params.temperature,
        topP: params.top_p,
        maxTokens: params.max_tokens,
        configuration: {
          baseURL: normalizedConfig.baseUrl || (normalizedConfig.provider === 'deepseek' ? "https://api.deepseek.com" : undefined),
        },
        streaming: true,
        callbacks: signal ? [{
          handleLLMNewToken(token: string) {
            if (signal.aborted) throw new Error("AbortError");
          }
        }] : []
      });
    }
  }

  private static getParams(config: AIConfig) {
    const defaults = {
      temperature: 0.7,
      top_p: 0.9,
      max_tokens: 4096
    };
    try {
      const parsed = JSON.parse(config.parameters || '{}') || {};
      return { ...defaults, ...parsed };
    } catch (e) {
      return defaults;
    }
  }

  /**
   * Generates novel content using a LangChain sequence
   */
  static async *generateChapterStream(
    prompt: string,
    context: string,
    config: AIConfig,
    writingConfig: WritingConfig,
    language: string = 'zh',
    signal?: AbortSignal,
    existingContent?: string,
    nextChapterContext?: string
  ) {
    const model = this.getModel(config, signal);
    
    const langInstruction = language === 'zh' ? "请使用简体中文回答。" : "Please respond in English.";
    
    let layoutInstruction = "";
    if (writingConfig.layout === 'web') {
      layoutInstruction = "严格排版规则：使用网络小说风格。段落短，频繁换行，多对话。";
    } else if (writingConfig.layout === 'traditional') {
      layoutInstruction = "严格排版规则：使用传统文学风格。段落长，描述性强，语气正式。";
    } else {
      layoutInstruction = "使用标准小说格式，段落长度均衡。";
    }

    const wordCountInstruction = writingConfig.enforceWordCount 
      ? `内容长度应在 ${writingConfig.minWords} 到 ${writingConfig.maxWords} 字之间。`
      : "撰写标准长度的章节。";

    const systemTemplate = `你是一位创意小说作家。
{langInstruction}
{layoutInstruction}
{wordCountInstruction}

背景上下文：
{context}

{existingContentInstruction}
{nextChapterInstruction}

重要提示：仅输出小说正文内容。不要包含标题、元对话或结束语。`;

    const existingContentInstruction = existingContent 
      ? `当前章节已写内容（最后部分）：\n${existingContent.slice(-1500)}\n\n指令：检查上述内容的最后一句是否完整。如果不完整，请先补完该句子，然后继续创作。确保衔接自然，不要重复。`
      : "";

    const nextChapterInstruction = nextChapterContext
      ? `下一章大纲/背景：\n${nextChapterContext}\n\n指令：参考下一章内容以保证连贯性。`
      : "";

    const chatPrompt = ChatPromptTemplate.fromMessages([
      SystemMessagePromptTemplate.fromTemplate(systemTemplate),
      HumanMessagePromptTemplate.fromTemplate("{task}")
    ]);

    const chain = RunnableSequence.from([
      chatPrompt,
      model,
      new StringOutputParser()
    ]);

    const stream = await chain.stream({
      langInstruction,
      layoutInstruction,
      wordCountInstruction,
      context,
      existingContentInstruction,
      nextChapterInstruction,
      task: prompt
    });

    for await (const chunk of stream) {
      if (signal?.aborted) break;
      yield chunk;
    }
  }

  /**
   * Chat with memory for plot assistance (Streaming)
   */
  static async *chatWithMemoryStream(
    message: string,
    novelId: string,
    context: string,
    config: AIConfig,
    language: string = 'zh',
    signal?: AbortSignal,
    initialHistory?: { role: string, content: string }[]
  ) {
    if (!this.memories[novelId]) {
      this.memories[novelId] = new BufferMemory({
        returnMessages: true,
        memoryKey: "history"
      });
      
      // Load initial history if provided
      if (initialHistory && initialHistory.length > 0) {
        for (const msg of initialHistory) {
          if (msg.role === 'user') {
            await this.memories[novelId].chatHistory.addUserMessage(msg.content);
          } else {
            await this.memories[novelId].chatHistory.addAIMessage(msg.content);
          }
        }
      }
    }

    const model = this.getModel(config, signal);
    const langInstruction = language === 'zh' ? "请使用简体中文回答。" : "Please respond in English.";

    const systemTemplate = `你是一位专业的小说编辑和情节助手。
{langInstruction}
你正在协助作者创作小说。

小说背景和当前进度：
{context}

请基于上述背景和作者的提问，提供有创意的建议、逻辑检查或情节构思。

重要提示：
1. 如果你提供了可以直接替换或插入到小说中的文本段落，请务必将其包裹在代码块中（例如 \`\`\` 文本内容 \`\`\`），这样作者可以一键应用你的建议。
2. 保持对话的连贯性，参考之前的对话记录。`;

    const chatPrompt = ChatPromptTemplate.fromMessages([
      SystemMessagePromptTemplate.fromTemplate(systemTemplate),
      new MessagesPlaceholder("history"),
      HumanMessagePromptTemplate.fromTemplate("{input}")
    ]);

    const memory = this.memories[novelId];
    const memoryVariables = await memory.loadMemoryVariables({});
    const history = memoryVariables.history;

    const chain = RunnableSequence.from([
      chatPrompt,
      model,
      new StringOutputParser()
    ]);

    const stream = await chain.stream({ 
      input: message,
      context: context,
      langInstruction: langInstruction,
      history: history
    });

    let fullResponse = "";
    for await (const chunk of stream) {
      if (signal?.aborted) break;
      fullResponse += chunk;
      yield chunk;
    }

    if (!signal?.aborted) {
      await memory.saveContext({ input: message }, { output: fullResponse });
    }
  }

  /**
   * Chat with memory for plot assistance (Legacy non-streaming)
   */
  static async chatWithMemory(
    message: string,
    novelId: string,
    context: string,
    config: AIConfig,
    language: string = 'zh'
  ) {
    if (!this.memories[novelId]) {
      this.memories[novelId] = new BufferMemory({
        returnMessages: true,
        memoryKey: "history"
      });
    }

    const model = this.getModel(config);
    const langInstruction = language === 'zh' ? "请使用简体中文回答。" : "Please respond in English.";

    const systemTemplate = `你是一位专业的小说编辑和情节助手。
{langInstruction}
你正在协助作者创作小说。

小说背景和当前进度：
{context}

请基于上述背景和作者的提问，提供有创意的建议、逻辑检查或情节构思。`;

    const chatPrompt = ChatPromptTemplate.fromMessages([
      SystemMessagePromptTemplate.fromTemplate(systemTemplate),
      new MessagesPlaceholder("history"),
      HumanMessagePromptTemplate.fromTemplate("{input}")
    ]);

    const memory = this.memories[novelId];
    const memoryVariables = await memory.loadMemoryVariables({});
    const history = memoryVariables.history;

    const chain = RunnableSequence.from([
      chatPrompt,
      model,
      new StringOutputParser()
    ]);

    const response = await chain.invoke({ 
      input: message,
      context: context,
      langInstruction: langInstruction,
      history: history
    });

    await memory.saveContext({ input: message }, { output: response });
    
    const estimatedTokens = Math.ceil((message.length + context.length + response.length) / 4);
    
    return {
      text: response,
      tokens: estimatedTokens
    };
  }
}

export interface Novel {
  id: number;
  title: string;
  author?: string;
  description: string;
  genre?: string;
  status: string;
  views: number;
  chapter_count: number;
  total_tokens: number;
  total_words: number;
  created_at: string;
  active_outline?: string;
  outlines?: OutlineVersion[];
  target_chapters?: number;
  cover_url?: string;
  characters?: string; // JSON string
  storylines?: string; // JSON string
  world_setting?: string; // JSON string
  relationships?: string; // JSON string
  last_supplement_at?: string;
  token_usage?: number; // For updates
  token_type?: string; // For updates
}

export interface OutlineVersion {
  id: number;
  novel_id: number;
  version_name: string;
  content: string;
  is_active: number;
  created_at: string;
}

export interface Chapter {
  id: number;
  novel_id: number;
  title: string;
  content: string;
  word_count: number;
  order_index?: number;
  summary?: string;
  status: string;
  scheduled_at: string | null;
  published_at: string | null;
  token_usage: number;
  created_at: string;
}

export interface TokenStats {
  totalTokens: number;
  tokensByNovel: { title: string; tokens: number }[];
  dailyTokens: { date: string; tokens: number }[];
  tokenTrend?: number;
  viewTrend?: number;
}

export type AIProvider = 'gemini' | 'openai' | 'deepseek' | 'custom';

export interface AIConfig {
  id?: number;
  provider: AIProvider;
  model: string;
  api_key?: string;
  base_url?: string;
  apiKey?: string; // Legacy
  baseUrl?: string; // Legacy
  parameters?: string; // JSON string
  is_active?: number;
}

export type ContentLayout = 'standard' | 'web' | 'traditional';

export interface WritingConfig {
  defaultAuthor?: string;
  minWords: number;
  maxWords: number;
  layout: ContentLayout;
  enforceWordCount: boolean;
  autoSummarize: boolean;
}

export interface Platform {
  id: number;
  name: string;
  type: string;
  config: string; // JSON string
  created_at: string;
}

export interface Prompt {
  id: number;
  name: string;
  content: string;
  type: 'outline' | 'chapter' | 'summary' | 'refactor' | 'polish' | 'description';
  is_default: number;
  created_at: string;
}

export type PromptTemplate = Prompt;

export interface OperationLog {
  id: number;
  action: string;
  details: string;
  created_at: string;
}

export interface AIConfigDetail {
  id: number;
  provider: AIProvider;
  model: string;
  api_key: string;
  base_url: string;
  parameters: string; // JSON string
  is_active: number;
  created_at: string;
}

export interface ScheduledTask {
  id: number;
  type: 'generate' | 'publish';
  novel_id?: number;
  chapter_id?: number;
  platform_id?: number;
  count?: number;
  recurrence?: 'once' | 'daily';
  scheduled_at: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  error?: string;
  created_at: string;
  novel_title?: string;
  chapter_title?: string;
  platform_name?: string;
}

export type Language = 'en' | 'zh';

export type Task = ScheduledTask;
export type Log = OperationLog;

export interface ChapterVersion {
  id: number;
  chapter_id: number;
  content: string;
  created_at: string;
}

export interface TokenLog {
  id: number;
  novel_id: number;
  chapter_id: number;
  tokens: number;
  type: string;
  novel_title?: string;
  chapter_title?: string;
  created_at: string;
}

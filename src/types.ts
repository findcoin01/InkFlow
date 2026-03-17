export interface Novel {
  id: number;
  title: string;
  description: string;
  status: string;
  views: number;
  chapter_count: number;
  total_tokens: number;
  created_at: string;
  active_outline?: string;
  outlines?: OutlineVersion[];
  target_chapters?: number;
  cover_url?: string;
  characters?: string; // JSON string
  storylines?: string; // JSON string
  world_setting?: string; // JSON string
  relationships?: string; // JSON string
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
}

export type AIProvider = 'gemini' | 'openai' | 'deepseek' | 'custom';

export interface AIConfig {
  provider: AIProvider;
  model: string;
  apiKey?: string;
  baseUrl?: string;
}

export type ContentLayout = 'standard' | 'web' | 'traditional';

export interface WritingConfig {
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
  type: 'outline' | 'chapter' | 'summary' | 'refactor' | 'polish';
  is_default: number;
  created_at: string;
}

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
  scheduled_at: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  error?: string;
  created_at: string;
  novel_title?: string;
  chapter_title?: string;
  platform_name?: string;
}

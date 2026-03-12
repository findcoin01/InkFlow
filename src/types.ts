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
}

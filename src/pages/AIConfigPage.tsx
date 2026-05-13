import React from 'react';
import { 
  Zap, 
  Sparkles, 
  X, 
  Settings, 
  Activity 
} from "lucide-react";
import { motion } from "motion/react";
import { cn } from "../lib/utils";
import Card from "../components/ui/Card";
import { AIConfig, AIProvider } from "../types";

interface AIConfigPageProps {
  aiConfigs: any[];
  activeProvider: AIProvider;
  setActiveProvider: (provider: AIProvider) => void;
  setAiConfigs: (configs: any[]) => void;
  isTesting: boolean;
  testResult: { success: boolean; message: string } | null;
  setTestResult: (res: { success: boolean; message: string } | null) => void;
  handleTestConnection: (config: any) => void;
  handleSaveAIConfig: (config: any) => void;
  t: any;
}

const AIConfigPage: React.FC<AIConfigPageProps> = ({
  aiConfigs,
  activeProvider,
  setActiveProvider,
  setAiConfigs,
  isTesting,
  testResult,
  setTestResult,
  handleTestConnection,
  handleSaveAIConfig,
  t
}) => {
  const providers: AIProvider[] = ['gemini', 'openai', 'deepseek', 'custom'];

  const config = aiConfigs.find(c => c.provider === activeProvider) || {
    provider: activeProvider,
    model: activeProvider === 'gemini' ? 'gemini-3-flash-preview' : (activeProvider === 'openai' ? 'gpt-4o' : (activeProvider === 'deepseek' ? 'deepseek-chat' : '')),
    api_key: '',
    base_url: activeProvider === 'deepseek' ? "https://api.deepseek.com" : (activeProvider === 'openai' ? "https://api.openai.com/v1" : ""),
    parameters: JSON.stringify({ temperature: 0.7, top_p: 0.9, max_tokens: 2000 }),
    is_active: 0
  };

  let parsedParams: any = {};
  try {
    const parsed = JSON.parse(config.parameters || '{}');
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      parsedParams = parsed;
    }
  } catch (e) {
    console.error("Failed to parse AI parameters:", e);
  }

  const params = {
    temperature: 0.7,
    top_p: 0.9,
    top_k: 40,
    max_tokens: 4096,
    ...parsedParams
  };

  const updateConfig = (updates: Partial<AIConfig>) => {
    const newConfigs = aiConfigs.map(c => 
      c.provider === activeProvider ? { ...c, ...updates } : c
    );
    if (!newConfigs.find(c => c.provider === activeProvider)) {
      newConfigs.push({ ...config, ...updates } as any);
    }
    setAiConfigs(newConfigs);
  };

  const updateParam = (key: string, value: any) => {
    const newParams = { ...params, [key]: value };
    updateConfig({ parameters: JSON.stringify(newParams) });
  };

  return (
    <motion.div
      key="ai-config"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-8"
    >
      <header>
        <h2 className="text-3xl font-bold text-white mb-2">{t.aiConfig}</h2>
        <p className="text-zinc-500">{t.aiConfigDesc}</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-2">
          {providers.map((p) => {
            const isActive = aiConfigs.find(c => c.provider === p)?.is_active === 1;
            return (
              <button
                key={p}
                onClick={() => {
                  setActiveProvider(p);
                  setTestResult(null);
                }}
                className={cn(
                  "w-full py-3 px-4 rounded-xl border transition-all text-left flex items-center justify-between group relative overflow-hidden",
                  activeProvider === p 
                    ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]" 
                    : "bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:border-zinc-700"
                )}
              >
                <div className="flex flex-col">
                  <span className="font-bold">{t[p]}</span>
                  {isActive && (
                    <span className="text-[10px] text-emerald-500/70 font-medium uppercase tracking-wider mt-0.5">
                      {t.activeAI}
                    </span>
                  )}
                </div>
                {isActive && (
                  <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                )}
              </button>
            );
          })}
        </div>

        <div className="lg:col-span-3">
          <Card>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-400">{t.model}</label>
                  <input
                    type="text"
                    value={config.model || ""}
                    onChange={(e) => updateConfig({ model: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-400">{t.baseUrl}</label>
                  <input
                    type="text"
                    value={config.base_url || ""}
                    onChange={(e) => updateConfig({ base_url: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400">{t.apiKey}</label>
                <input
                  type="password"
                  value={config.api_key || ""}
                  onChange={(e) => updateConfig({ api_key: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-all font-mono"
                />
              </div>

              <div className="pt-4 border-t border-zinc-800">
                <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <Activity size={16} className="text-emerald-500" />
                  {t.advancedParams}
                </h4>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <label className="text-xs text-zinc-500">{t.temperature}</label>
                      <span className="text-xs text-emerald-400">{params.temperature}</span>
                    </div>
                    <input 
                      type="range" min="0" max="2" step="0.1" 
                      value={params.temperature || 0.7}
                      onChange={(e) => updateParam('temperature', parseFloat(e.target.value))}
                      className="w-full accent-emerald-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <label className="text-xs text-zinc-500">{t.topP}</label>
                      <span className="text-xs text-emerald-400">{params.top_p}</span>
                    </div>
                    <input 
                      type="range" min="0" max="1" step="0.05" 
                      value={params.top_p || 0.9}
                      onChange={(e) => updateParam('top_p', parseFloat(e.target.value))}
                      className="w-full accent-emerald-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <label className="text-xs text-zinc-500">{t.maxTokens}</label>
                      <span className="text-xs text-emerald-400">{params.max_tokens}</span>
                    </div>
                    <input 
                      type="range" min="100" max="16384" step="100" 
                      value={params.max_tokens || 4096}
                      onChange={(e) => updateParam('max_tokens', parseInt(e.target.value))}
                      className="w-full accent-emerald-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <label className="text-xs text-zinc-500">{t.topK}</label>
                      <span className="text-xs text-emerald-400">{params.top_k}</span>
                    </div>
                    <input 
                      type="range" min="1" max="100" step="1" 
                      value={params.top_k || 40}
                      onChange={(e) => updateParam('top_k', parseInt(e.target.value))}
                      className="w-full accent-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-zinc-800">
                <div className="flex gap-3">
                  <button 
                    onClick={() => handleTestConnection(config)}
                    disabled={isTesting}
                    className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-bold rounded-xl transition-all flex items-center gap-2"
                  >
                    {isTesting ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Zap size={16} />}
                    {t.testConnection}
                  </button>
                  <button 
                    onClick={() => handleSaveAIConfig({ ...config, is_active: 1 })}
                    className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-bold rounded-xl transition-all"
                  >
                    {t.saveSettings}
                  </button>
                </div>
                
                {testResult && (
                  <div className={cn(
                    "flex items-center gap-2 text-xs font-medium",
                    testResult.success ? "text-emerald-400" : "text-rose-400"
                  )}>
                    {testResult.success ? <Sparkles size={14} /> : <X size={14} />}
                    {testResult.message}
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
  );
};

export default AIConfigPage;

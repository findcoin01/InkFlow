import React from 'react';
import { 
  Type, 
  FileText 
} from "lucide-react";
import { motion } from "motion/react";
import { cn } from "../lib/utils";
import Card from "../components/ui/Card";
import { WritingConfig, ContentLayout, AIConfig } from "../types";

interface SettingsPageProps {
  writingConfig: WritingConfig;
  setWritingConfig: (config: WritingConfig) => void;
  lang: string;
  t: any;
  handleResetSettings: () => void;
  aiConfig: AIConfig;
  setToast: (toast: { message: string, type: 'success' | 'error' | 'info' | 'warning' } | null) => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({
  writingConfig,
  setWritingConfig,
  lang,
  t,
  handleResetSettings,
  aiConfig,
  setToast
}) => {
  return (
    <motion.div
      key="settings"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto space-y-8"
    >
      <header>
        <h2 className="text-3xl font-bold text-white mb-2">{t.writingConfig}</h2>
        <p className="text-zinc-500">{t.aiConfigDesc}</p>
      </header>

      <Card>
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400">{t.author}</label>
            <input
              type="text"
              value={writingConfig.defaultAuthor || ""}
              onChange={(e) => setWritingConfig({ ...writingConfig, defaultAuthor: e.target.value })}
              placeholder={t.authorPlaceholder}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-all"
            />
          </div>

          <div className="space-y-4">
            <label className="text-sm font-medium text-zinc-400">{t.wordCountRange}</label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <span className="text-[10px] uppercase text-zinc-500 font-bold">{t.minWords}</span>
                <input
                  type="number"
                  value={writingConfig.minWords ?? ""}
                  onChange={(e) => setWritingConfig({ ...writingConfig, minWords: parseInt(e.target.value) || 0 })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-all"
                />
              </div>
              <div className="space-y-2">
                <span className="text-[10px] uppercase text-zinc-500 font-bold">{t.maxWords}</span>
                <input
                  type="number"
                  value={writingConfig.maxWords ?? ""}
                  onChange={(e) => setWritingConfig({ ...writingConfig, maxWords: parseInt(e.target.value) || 0 })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-all"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-zinc-800/30 rounded-xl border border-zinc-700/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-500">
                <Type size={20} />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-200">{t.enforceWordCount}</p>
                <p className="text-xs text-zinc-500">{t.targetChaptersDesc}</p>
              </div>
            </div>
            <button 
              onClick={() => setWritingConfig({ ...writingConfig, enforceWordCount: !writingConfig.enforceWordCount })}
              className={cn(
                "w-12 h-6 rounded-full transition-colors relative",
                writingConfig.enforceWordCount ? "bg-emerald-500" : "bg-zinc-700"
              )}
            >
              <div className={cn(
                "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                writingConfig.enforceWordCount ? "left-7" : "left-1"
              )} />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-zinc-800/30 rounded-xl border border-zinc-700/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-500">
                <FileText size={20} />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-200">{t.autoSummarize}</p>
                <p className="text-xs text-zinc-500">{t.autoSummarize}</p>
              </div>
            </div>
            <button 
              onClick={() => setWritingConfig({ ...writingConfig, autoSummarize: !writingConfig.autoSummarize })}
              className={cn(
                "w-12 h-6 rounded-full transition-colors relative",
                writingConfig.autoSummarize ? "bg-emerald-500" : "bg-zinc-700"
              )}
            >
              <div className={cn(
                "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                writingConfig.autoSummarize ? "left-7" : "left-1"
              )} />
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-zinc-400">{t.contentLayout}</label>
              <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">{t.layoutPreview}</span>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="grid grid-cols-1 gap-3">
                {(['standard', 'web', 'traditional'] as ContentLayout[]).map((l) => (
                  <button
                    key={l}
                    onClick={() => setWritingConfig({ ...writingConfig, layout: l })}
                    className={cn(
                      "py-4 px-4 rounded-xl border transition-all text-left group",
                      writingConfig.layout === l 
                        ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400" 
                        : "bg-zinc-800/50 border-zinc-700 text-zinc-500 hover:border-zinc-600"
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold">{t[`layout${l.charAt(0).toUpperCase() + l.slice(1)}`]}</span>
                      {writingConfig.layout === l && <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" />}
                    </div>
                    <p className="text-[10px] opacity-60 leading-tight">
                      {l === 'standard' && t.layoutStandardDesc}
                      {l === 'web' && t.layoutWebDesc}
                      {l === 'traditional' && t.layoutTraditionalDesc}
                    </p>
                  </button>
                ))}
              </div>

              <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 relative overflow-hidden min-h-[200px] flex flex-col">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-zinc-700" />
                  <div className="w-2 h-2 rounded-full bg-zinc-700" />
                  <div className="w-2 h-2 rounded-full bg-zinc-700" />
                </div>
                
                <div className={cn(
                  "flex-1 text-zinc-400 text-xs leading-relaxed transition-all duration-500",
                  writingConfig.layout === 'web' ? "space-y-4" : "space-y-2",
                  writingConfig.layout === 'traditional' ? "[&>p]:indent-[2em]" : ""
                )}>
                  <p>
                    {writingConfig.layout === 'web' 
                      ? t.layoutPreviewP1
                      : t.layoutPreviewP1Long}
                  </p>
                  <p>
                    {writingConfig.layout === 'web'
                      ? t.layoutPreviewP2
                      : t.layoutPreviewP2Long}
                  </p>
                  {writingConfig.layout === 'web' && (
                    <p>{t.layoutPreviewP3}</p>
                  )}
                  <p>
                    {writingConfig.layout === 'web'
                      ? t.layoutPreviewP4
                      : t.layoutPreviewP4Long}
                  </p>
                </div>

                <div className="mt-4 pt-4 border-t border-zinc-800/50 flex justify-between items-center opacity-40">
                  <span className="text-[9px] font-mono">{t.style || "STYLE"}: {writingConfig.layout.toUpperCase()}</span>
                  <span className="text-[9px] font-mono">{t.previewMode || "PREVIEW MODE"}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <div className="flex gap-4">
              <button
                onClick={handleResetSettings}
                className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 font-bold rounded-xl transition-all border border-zinc-700"
              >
                {t.resetSettings || "Reset All"}
              </button>
              <button
                onClick={() => {
                  try {
                    localStorage.setItem("inkflow_ai_config", JSON.stringify(aiConfig));
                    localStorage.setItem("inkflow_writing_config", JSON.stringify(writingConfig));
                  setToast({ message: t.settingsSaved, type: 'success' });
                } catch (e) {
                  setToast({ message: t.failedToSaveSettings, type: 'error' });
                }
                }}
                className="flex-[2] py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20"
              >
                {t.saveSettings}
              </button>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default SettingsPage;

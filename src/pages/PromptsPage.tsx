import React from 'react';
import { 
  Plus, 
  Trash2, 
  Settings, 
  Sparkles,
  Zap
} from "lucide-react";
import { motion } from "motion/react";
import { cn } from "../lib/utils";
import { Prompt } from "../types";

interface PromptsPageProps {
  prompts: Prompt[];
  promptFilter: string;
  setPromptFilter: (filter: string) => void;
  setEditingPrompt: (prompt: Partial<Prompt> | null) => void;
  setShowPromptModal: (show: boolean) => void;
  handleSetDefaultPrompt: (id: number, type: string) => void;
  handleDeletePrompt: (id: number) => void;
  t: any;
}

const PromptsPage: React.FC<PromptsPageProps> = ({
  prompts,
  promptFilter,
  setPromptFilter,
  setEditingPrompt,
  setShowPromptModal,
  handleSetDefaultPrompt,
  handleDeletePrompt,
  t
}) => {
  return (
    <motion.div
      key="prompts"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">{t.prompts}</h2>
          <p className="text-zinc-500">{t.promptsDesc}</p>
        </div>
        <button 
          onClick={() => {
            setEditingPrompt({ name: '', content: '', type: promptFilter === 'all' ? 'chapter' : promptFilter as any, is_default: 0 });
            setShowPromptModal(true);
          }}
          className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
        >
          <Plus size={20} />
          {t.addPrompt}
        </button>
      </header>

      <div className="flex items-center gap-2 p-1 bg-zinc-900/50 border border-zinc-800 rounded-xl w-fit">
        {['all', 'chapter', 'outline', 'summary', 'description', 'refactor', 'polish'].map((filter) => (
          <button
            key={filter}
            onClick={() => setPromptFilter(filter)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all",
              promptFilter === filter 
                ? "bg-zinc-800 text-white shadow-sm" 
                : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            {filter === 'all' ? t.all : 
             filter === 'chapter' ? t.typeChapter : 
             filter === 'outline' ? t.typeOutline : 
             filter === 'summary' ? t.typeSummary : 
             filter === 'description' ? t.typeDescription : 
             filter === 'refactor' ? t.typeRefactor : t.typePolish}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {prompts
          .filter(p => promptFilter === 'all' || p.type === promptFilter)
          .map(prompt => (
          <div 
            key={prompt.id} 
            className="group relative bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-6 hover:border-zinc-700 transition-all hover:shadow-xl hover:shadow-black/20"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">{prompt.name}</h4>
                  {prompt.is_default === 1 && (
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-wider rounded border border-emerald-500/20">
                      {t.isDefault}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
                  {prompt.type === 'chapter' ? t.typeChapter : 
                   prompt.type === 'outline' ? t.typeOutline : 
                   prompt.type === 'summary' ? t.typeSummary : 
                   prompt.type === 'description' ? t.typeDescription : 
                   prompt.type === 'refactor' ? t.typeRefactor : t.typePolish}
                </p>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {prompt.is_default !== 1 && (
                  <button 
                    onClick={() => handleSetDefaultPrompt(prompt.id, prompt.type)}
                    className="p-2 text-zinc-500 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-all"
                    title={t.setAsDefault}
                  >
                    <Sparkles size={16} />
                  </button>
                )}
                <button 
                  onClick={() => {
                    setEditingPrompt(prompt);
                    setShowPromptModal(true);
                  }}
                  className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-all"
                >
                  <Settings size={16} />
                </button>
                <button 
                  onClick={() => handleDeletePrompt(prompt.id)}
                  className="p-2 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-black/20 rounded-xl p-4 border border-zinc-800/50 font-mono text-xs text-zinc-400 leading-relaxed max-h-32 overflow-hidden relative">
                {prompt.content}
                <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-zinc-900/40 to-transparent" />
              </div>
            </div>
          </div>
        ))}
        
        {prompts.filter(p => promptFilter === 'all' || p.type === promptFilter).length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-zinc-600 border-2 border-dashed border-zinc-800 rounded-3xl">
            <div className="p-4 bg-zinc-900 rounded-full mb-4">
              <Plus size={32} />
            </div>
            <p className="text-lg font-medium mb-2">{t.noTemplates}</p>
            <p className="text-sm opacity-60">{t.addFirstPrompt}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default PromptsPage;

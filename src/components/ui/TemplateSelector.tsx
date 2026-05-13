import React from 'react';
import { BookOpen, GitBranch, FileText, Zap, Sparkles, ChevronDown, X } from "lucide-react";
import { cn } from "../../lib/utils";
import { Prompt } from "../../types";

interface TemplateSelectorProps {
  type: string;
  prompts: Prompt[];
  selectedId?: number;
  onSelect: (id: number) => void;
  onDelete: (id: number) => void;
  t: any;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({ 
  type, 
  prompts, 
  selectedId, 
  onSelect, 
  onDelete,
  t 
}) => {
  const filtered = prompts.filter(p => p.type === type);
  const activePrompt = filtered.find(p => p.id === selectedId) || filtered.find(p => p.is_default === 1);

  const getTypeIcon = () => {
    switch(type) {
      case 'chapter': return <BookOpen size={12} />;
      case 'outline': return <GitBranch size={12} />;
      case 'summary': return <FileText size={12} />;
      case 'refactor': return <Zap size={12} />;
      default: return <Sparkles size={12} />;
    }
  };

  return (
    <div className="relative group/template">
      <div className="flex items-center gap-1.5 px-2 py-1.5 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/30 rounded-lg transition-all cursor-pointer group-hover/template:border-zinc-600">
        <div className="text-emerald-500/60 group-hover/template:text-emerald-400 transition-colors">
          {getTypeIcon()}
        </div>
        <ChevronDown size={10} className="text-zinc-600 group-hover/template:text-zinc-400 transition-colors" />
      </div>
      
      <div className="absolute bottom-full left-0 mb-2 w-64 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl opacity-0 invisible group-hover/template:opacity-100 group-hover/template:visible transition-all z-50 overflow-hidden translate-y-2 group-hover/template:translate-y-0">
        <div className="p-3 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-md flex items-center justify-between">
          <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">{t.prompts}</span>
          <div className="px-1.5 py-0.5 bg-zinc-800 rounded text-[9px] text-zinc-500 font-mono">
            {filtered.length}
          </div>
        </div>
        <div className="max-h-64 overflow-y-auto py-2">
          {filtered.length > 0 ? (
            filtered.map(p => (
              <div 
                key={p.id}
                className={cn(
                  "flex items-center justify-between px-4 py-2.5 text-xs transition-all hover:bg-zinc-800/80 cursor-pointer group/item",
                  (selectedId === p.id || (!selectedId && p.is_default === 1)) ? "text-emerald-400 bg-emerald-500/5" : "text-zinc-400 hover:text-zinc-200"
                )}
                onClick={() => onSelect(p.id)}
              >
                <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium">{p.name}</span>
                    {p.is_default === 1 && (
                      <span className="text-[8px] px-1 bg-emerald-500/10 text-emerald-500 rounded border border-emerald-500/20 uppercase">{t.defaultLabel || "Default"}</span>
                    )}
                  </div>
                  <span className="text-[9px] text-zinc-600 truncate opacity-0 group-hover/item:opacity-100 transition-opacity">
                    {p.content.substring(0, 40)}...
                  </span>
                </div>
                {p.is_default !== 1 && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(p.id);
                    }}
                    className="p-1.5 text-zinc-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-md opacity-0 group-hover/item:opacity-100 transition-all ml-2"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            ))
          ) : (
            <div className="px-4 py-8 text-center">
              <p className="text-[10px] text-zinc-600 uppercase tracking-widest">{t.noTemplates || "No templates found"}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TemplateSelector;

import React from 'react';
import { motion } from 'motion/react';
import { X, ChevronDown } from 'lucide-react';
import type { PromptTemplate } from '../../types';

interface PromptModalProps {
  editingPrompt: Partial<PromptTemplate> | null;
  setEditingPrompt: React.Dispatch<React.SetStateAction<Partial<PromptTemplate> | null>>;
  onClose: () => void;
  onSave: () => Promise<void>;
  t: any;
}

const PromptModal: React.FC<PromptModalProps> = ({
  editingPrompt,
  setEditingPrompt,
  onClose,
  onSave,
  t
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
          <h3 className="text-xl font-bold text-white">
            {editingPrompt?.id ? t.editPrompt : t.addPrompt}
          </h3>
          <button 
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">{t.promptName}</label>
              <input
                type="text"
                value={editingPrompt?.name || ""}
                onChange={(e) => setEditingPrompt(prev => ({ ...prev!, name: e.target.value }))}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-zinc-700"
                placeholder={t.promptNamePlaceholder}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">{t.promptType}</label>
              <div className="relative">
                <select
                  value={editingPrompt?.type || "chapter"}
                  onChange={(e) => setEditingPrompt(prev => ({ ...prev!, type: e.target.value as any }))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 transition-all appearance-none"
                >
                  <option value="chapter">{t.typeChapter}</option>
                  <option value="outline">{t.typeOutline}</option>
                  <option value="summary">{t.typeSummary}</option>
                  <option value="description">{t.typeDescription}</option>
                  <option value="refactor">{t.typeRefactor}</option>
                  <option value="polish">{t.typePolish}</option>
                </select>
                <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between ml-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t.promptContent}</label>
              <span className="text-[10px] text-zinc-700 font-mono">{t.supports}: {"{title}, {chapter_num}"}</span>
            </div>
            <textarea
              value={editingPrompt?.content || ""}
              onChange={(e) => setEditingPrompt(prev => ({ ...prev!, content: e.target.value }))}
              rows={8}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 transition-all resize-none placeholder:text-zinc-700 font-mono text-sm leading-relaxed"
              placeholder={t.promptContentPlaceholder}
            />
          </div>

          <div 
            className="flex items-center gap-3 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl group cursor-pointer" 
            onClick={() => setEditingPrompt(prev => ({ ...prev!, is_default: prev?.is_default === 1 ? 0 : 1 }))}
          >
            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${editingPrompt?.is_default === 1 ? 'bg-emerald-500 border-emerald-500 text-black' : 'border-zinc-700 group-hover:border-zinc-500'}`}>
              {editingPrompt?.is_default === 1 && <X size={12} fill="currentColor" />}
            </div>
            <span className="text-sm text-zinc-300 font-medium">
              {t.setAsDefault}
            </span>
          </div>

          <div className="flex gap-4 pt-4">
            <button 
              onClick={onClose}
              className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-all"
            >
              {t.cancel}
            </button>
            <button 
              onClick={onSave}
              disabled={!editingPrompt?.name || !editingPrompt?.content}
              className="flex-2 py-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20"
            >
              {t.saveSettings}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PromptModal;

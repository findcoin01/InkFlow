import React from 'react';
import { motion } from 'motion/react';

interface CreateNovelModalProps {
  newNovelTitle: string;
  setNewNovelTitle: (val: string) => void;
  newNovelAuthor: string;
  setNewNovelAuthor: (val: string) => void;
  newNovelGenre: string;
  setNewNovelGenre: (val: string) => void;
  isCreating: boolean;
  onClose: () => void;
  onCreate: () => void;
  t: any;
}

export const CreateNovelModal: React.FC<CreateNovelModalProps> = ({
  newNovelTitle,
  setNewNovelTitle,
  newNovelAuthor,
  setNewNovelAuthor,
  newNovelGenre,
  setNewNovelGenre,
  isCreating,
  onClose,
  onCreate,
  t,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl"
      >
        <h3 className="text-2xl font-bold text-white mb-6">{t.newNovel}</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">{t.novel} {t.appName}</label>
            <input 
              autoFocus
              value={newNovelTitle || ""}
              onChange={(e) => setNewNovelTitle(e.target.value)}
              placeholder={t.enterTitle}
              onKeyDown={(e) => e.key === 'Enter' && onCreate()}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">{t.author}</label>
            <input 
              value={newNovelAuthor || ""}
              onChange={(e) => setNewNovelAuthor(e.target.value)}
              placeholder={t.authorPlaceholder}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">{t.novelGenreLabel}</label>
            <input 
              value={newNovelGenre || ""}
              onChange={(e) => setNewNovelGenre(e.target.value)}
              placeholder={t.novelGenrePlaceholder}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-all"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button 
              onClick={onClose}
              className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-all"
            >
              {t.cancel}
            </button>
            <button 
              onClick={onCreate}
              disabled={!newNovelTitle.trim() || isCreating}
              className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:hover:bg-emerald-500 text-black font-bold rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {isCreating ? (
                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : t.confirm}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

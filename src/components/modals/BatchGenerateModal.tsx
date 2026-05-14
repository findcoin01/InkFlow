import React from 'react';
import { motion } from 'motion/react';
import { Wand2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Novel, Chapter } from '../../types';

interface BatchGenerateModalProps {
  selectedNovel: Novel;
  chapters: Chapter[];
  batchCount: number;
  setBatchCount: (val: number) => void;
  onClose: () => void;
  onBatchGenerate: () => void;
  t: any;
}

export const BatchGenerateModal: React.FC<BatchGenerateModalProps> = ({
  selectedNovel,
  chapters,
  batchCount,
  setBatchCount,
  onClose,
  onBatchGenerate,
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
        <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <Wand2 className="text-emerald-500" />
          {t.batchGenerate}
        </h3>
        <div className="space-y-4 mb-8">
          <label className="block text-sm text-zinc-500 mb-2">
            {t.generateCount} 
            <span className="ml-2 text-[10px] text-zinc-600 uppercase font-bold">
              ({t.maxLabel || "Max"}: {Math.max(0, (selectedNovel.target_chapters || 50) - chapters.length)})
            </span>
          </label>
          <div className="flex gap-4 mb-4">
            {[1, 3, 5, 10].map(n => (
              <button
                key={n}
                onClick={() => setBatchCount(n)}
                className={cn(
                  "flex-1 py-3 rounded-xl border transition-all font-bold",
                  batchCount === n ? "bg-emerald-500 border-emerald-500 text-black" : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500"
                )}
              >
                {n}
              </button>
            ))}
          </div>
          <div className="relative">
            <input 
              type="number"
              value={batchCount}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 0;
                const max = Math.max(0, (selectedNovel.target_chapters || 50) - chapters.length);
                setBatchCount(Math.min(val, max));
              }}
              min={1}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-emerald-500 transition-all"
              placeholder={t.customCountPlaceholder || "Custom count..."}
            />
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-all"
          >
            {t.cancel}
          </button>
          <button 
            onClick={onBatchGenerate}
            className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl transition-all"
          >
            {t.startGenerating}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

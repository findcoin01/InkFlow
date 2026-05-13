import React from 'react';
import { motion } from 'motion/react';
import { X, Eye } from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { OutlineVersion } from '../../types';

interface OutlinePreviewModalProps {
  activeOutline: OutlineVersion;
  onClose: () => void;
  t: any;
}

const OutlinePreviewModal: React.FC<OutlinePreviewModalProps> = ({
  activeOutline,
  onClose,
  t
}) => {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-12">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-5xl h-full max-h-[90vh] bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
      >
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <Eye size={20} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">{t.previewOutline}</h3>
              <p className="text-xs text-zinc-500">{activeOutline.version_name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full hover:bg-zinc-800 flex items-center justify-center text-zinc-500 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 md:p-12 scrollbar-thin scrollbar-thumb-zinc-800">
          <div className="markdown-body">
            <Markdown remarkPlugins={[remarkGfm]}>
              {activeOutline.content || ""}
            </Markdown>
          </div>
        </div>

        <div className="p-6 bg-zinc-800/30 border-t border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-8 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20"
          >
            {t.confirm}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default OutlinePreviewModal;

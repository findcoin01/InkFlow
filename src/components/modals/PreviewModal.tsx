import React from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Novel, Chapter } from '../../types';
import { ChapterPreview } from '../ui/ChapterPreview';

interface PreviewModalProps {
  selectedNovel: Novel;
  chapters: Chapter[];
  onClose: () => void;
  t: any;
}

const TOCItem: React.FC<{ ch: Chapter; idx: number; onScrollTo: (id: number) => void }> = ({ ch, idx, onScrollTo }) => (
  <button 
    onClick={() => onScrollTo(ch.id)}
    className="w-full text-left px-2 py-1.5 text-xs text-zinc-500 hover:text-emerald-400 hover:bg-emerald-500/5 rounded transition-all truncate"
  >
    <span className="opacity-50 mr-2 font-mono">{String(idx + 1).padStart(2, '0')}</span>
    {ch.title}
  </button>
);

export const PreviewModal: React.FC<PreviewModalProps> = ({
  selectedNovel,
  chapters,
  onClose,
  t,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="w-full max-w-6xl h-[90vh] bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col shadow-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50 backdrop-blur-md sticky top-0 z-10">
          <h3 className="text-2xl font-bold text-white">{selectedNovel.title} - {t.previewNovel}</h3>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="flex-1 flex overflow-hidden">
          {/* TOC Sidebar */}
          <div className="w-64 border-r border-zinc-800 bg-zinc-900/30 overflow-y-auto p-4 hidden md:block">
            <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4 px-2">{t.tableOfContents}</h4>
            <div className="space-y-1">
              {chapters.map((ch, idx) => (
                <TOCItem 
                  key={ch.id} 
                  ch={ch} 
                  idx={idx} 
                  onScrollTo={(id) => {
                    const element = document.getElementById(`preview-chapter-${id}`);
                    element?.scrollIntoView({ behavior: 'smooth' });
                  }} 
                />
              ))}
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-12 bg-zinc-950 scroll-smooth">
            <div className="max-w-2xl mx-auto">
              <h1 className="text-5xl font-bold text-white text-center mb-4">{selectedNovel.title}</h1>
              {selectedNovel.author && (
                <p className="text-xl text-zinc-400 text-center mb-8 italic">By {selectedNovel.author}</p>
              )}
              <div className="text-zinc-500 text-center italic mb-12 markdown-body">
                <Markdown remarkPlugins={[remarkGfm]}>
                  {selectedNovel.description || ""}
                </Markdown>
              </div>
              
              <div className="space-y-24">
                {chapters.map((ch, idx) => (
                  <ChapterPreview key={ch.id} ch={ch} idx={idx} t={t} />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-zinc-800 flex justify-end bg-zinc-900/50">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-lg transition-all"
          >
            {t.close}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

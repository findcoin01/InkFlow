import React from 'react';
import { motion } from 'motion/react';
import { X, History, Clock, Save, Loader2 } from 'lucide-react';
import { format as formatDate } from 'date-fns';
import type { Chapter, ChapterVersion } from '../../types';

interface HistoryModalProps {
  currentChapter: Chapter;
  chapterVersions: ChapterVersion[];
  isSavingVersion: boolean;
  isRestoringVersion: boolean;
  onClose: () => void;
  onSaveVersion: (chapterId: number) => Promise<void>;
  onRestoreVersion: (chapterId: number, versionId: number) => Promise<void>;
  t: any;
}

const HistoryModal: React.FC<HistoryModalProps> = ({
  currentChapter,
  chapterVersions,
  isSavingVersion,
  isRestoringVersion,
  onClose,
  onSaveVersion,
  onRestoreVersion,
  t
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh]"
      >
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-white">{t.history} - {currentChapter.title}</h3>
            <p className="text-sm text-zinc-500">{t.version} {t.history}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onSaveVersion(currentChapter.id)}
              disabled={isSavingVersion}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-bold transition-all flex items-center gap-2"
            >
              {isSavingVersion ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {t.saveVersion}
            </button>
            <button 
              onClick={onClose}
              className="p-2 text-zinc-500 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {chapterVersions.length === 0 ? (
            <div className="text-center py-12 text-zinc-600">
              <History size={48} className="mx-auto mb-4 opacity-20" />
              <p>{t.noVersions}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {chapterVersions.map((version) => (
                <div 
                  key={version.id}
                  className="p-4 bg-zinc-800/50 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-all group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-500">
                        <Clock size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-zinc-200">
                          {formatDate(new Date(version.created_at), 'yyyy-MM-dd HH:mm:ss')}
                        </p>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
                          {version.content?.length || 0} {t.characters}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => onRestoreVersion(currentChapter.id, version.id)}
                      disabled={isRestoringVersion}
                      className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-lg text-xs font-bold transition-all opacity-0 group-hover:opacity-100"
                    >
                      {t.restore}
                    </button>
                  </div>
                  <div className="text-xs text-zinc-500 line-clamp-2 italic">
                    {version.content?.substring(0, 200)}...
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default HistoryModal;

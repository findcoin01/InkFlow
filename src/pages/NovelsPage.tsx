import React from 'react';
import { motion } from "motion/react";
import { 
  Search, 
  Download, 
  FileDown, 
  BookOpen, 
  Trash2, 
  User 
} from "lucide-react";
import { cn } from "../lib/utils";
import { Novel } from "../types";
import Card from "../components/ui/Card";

interface NovelsPageProps {
  novels: Novel[];
  novelSearch: string;
  setNovelSearch: (val: string) => void;
  handleDeleteNovel: (e: React.MouseEvent, id: number) => void;
  exportNovel: (novel: Novel, format: 'markdown' | 'epub') => void;
  fetchNovelDetails: (id: number) => void;
  t: any;
}

const NovelsPage: React.FC<NovelsPageProps> = ({
  novels,
  novelSearch,
  setNovelSearch,
  handleDeleteNovel,
  exportNovel,
  fetchNovelDetails,
  t
}) => {
  return (
    <motion.div
      key="novels"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">{t.myNovels}</h2>
          <p className="text-zinc-500">{t.manageEmpire}</p>
        </div>
        <div className="relative w-full md:w-64">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input 
            type="text"
            value={novelSearch}
            onChange={(e) => setNovelSearch(e.target.value)}
            placeholder={t.searchNovels || "Search novels..."}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500/50 transition-all"
          />
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {novels.filter(n => n.title.toLowerCase().includes(novelSearch.toLowerCase()) || n.genre?.toLowerCase().includes(novelSearch.toLowerCase())).map(novel => (
          <Card key={novel.id} className="group hover:border-emerald-500/50 transition-all cursor-pointer relative" onClick={() => fetchNovelDetails(novel.id)}>
            <div className="absolute top-4 right-4 flex gap-2 z-10 opacity-0 group-hover:opacity-100 transition-all">
              <div className="relative group/export">
                <button 
                  onClick={(e) => e.stopPropagation()}
                  className="p-2 text-zinc-600 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg"
                >
                  <Download size={16} />
                </button>
                <div className="absolute right-0 top-full pt-1 w-32 hidden group-hover/export:block z-20">
                  <div className="bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl overflow-hidden">
                    <button 
                      onClick={(e) => { e.stopPropagation(); exportNovel(novel, 'markdown'); }}
                      className="w-full text-left px-3 py-2 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 flex items-center gap-2"
                    >
                      <FileDown size={12} />
                      Markdown
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); exportNovel(novel, 'epub'); }}
                      className="w-full text-left px-3 py-2 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 flex items-center gap-2"
                    >
                      <BookOpen size={12} />
                      EPUB
                    </button>
                  </div>
                </div>
              </div>
              <button 
                onClick={(e) => handleDeleteNovel(e, novel.id)}
                className="p-2 text-zinc-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg"
                title={t.deleteNovel}
              >
                <Trash2 size={16} />
              </button>
            </div>
            <div className="flex gap-4 mb-4">
              <div className="w-20 h-28 bg-zinc-800 rounded-lg flex items-center justify-center text-zinc-600 shadow-xl overflow-hidden">
                {novel.cover_url ? (
                  <img src={novel.cover_url} alt={novel.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <BookOpen size={40} />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors">{novel.title}</h3>
                  {novel.genre && (
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold rounded uppercase tracking-wider">
                      {novel.genre}
                    </span>
                  )}
                </div>
                {novel.author && (
                  <p className="text-xs text-zinc-400 mt-0.5 flex items-center gap-1">
                    <User size={10} className="text-zinc-500" />
                    {novel.author}
                  </p>
                )}
                <p className="text-sm text-zinc-500 line-clamp-2 mt-2">{novel.description}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-800">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">{t.novelStatus}</p>
                <p className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-1", 
                  novel.status === 'completed' ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                )}>
                  {novel.status === 'completed' ? t.novelCompleted : t.novelDraft}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">{t.totalWords}</p>
                <p className="text-sm text-zinc-200 font-mono">{(novel.total_words || 0).toLocaleString()}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 mt-2">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">{t.progress}</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-zinc-200">{novel.chapter_count} {t.chapters}</p>
                  {novel.target_chapters && (
                    <span className="text-[10px] text-zinc-500">/ {novel.target_chapters}</span>
                  )}
                </div>
                {novel.target_chapters && (
                  <div className="w-full h-1 bg-zinc-800 rounded-full mt-1 overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500"
                      style={{ width: `${Math.min((novel.chapter_count / novel.target_chapters) * 100, 100)}%` }}
                    />
                  </div>
                )}
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">{t.views}</p>
                <p className="text-sm text-zinc-200">{novel.views.toLocaleString()}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </motion.div>
  );
};

export default NovelsPage;

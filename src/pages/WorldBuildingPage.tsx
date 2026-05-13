import React from 'react';
import { 
  Sparkles, 
  Clock, 
  BookOpen, 
  Globe, 
  Users, 
  GitBranch, 
  Network, 
  TrendingUp 
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { cn } from "../lib/utils";
import { Novel, Prompt, Chapter } from "../types";
import Card from "../components/ui/Card";
import TemplateSelector from "../components/ui/TemplateSelector";
import StructuredContent from "../components/ui/StructuredContent";

interface WorldBuildingPageProps {
  selectedNovel: Novel;
  handleAISupplement: () => void;
  isSupplementing: boolean;
  chapters: Chapter[];
  handleSaveNovelDetails: (details: Partial<Novel>) => void;
  handleCoverUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleGenerateDescription: () => void;
  isGenerating: boolean;
  isRefactoringWorld: boolean;
  handleRefactorWorldSetting: () => void;
  toggleEditMode: (field: string) => void;
  editMode: Record<string, boolean>;
  prompts: Prompt[];
  selectedTemplates: Record<string, number>;
  setSelectedTemplates: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  handleDeletePrompt: (id: number) => void;
  t: any;
}

const WorldBuildingPage: React.FC<WorldBuildingPageProps> = ({
  selectedNovel,
  handleAISupplement,
  isSupplementing,
  chapters,
  handleSaveNovelDetails,
  handleCoverUpload,
  handleGenerateDescription,
  isGenerating,
  isRefactoringWorld,
  handleRefactorWorldSetting,
  toggleEditMode,
  editMode,
  prompts,
  selectedTemplates,
  setSelectedTemplates,
  handleDeletePrompt,
  t
}) => {
  return (
    <div className="flex-1 overflow-y-auto pr-2 space-y-6 pb-12 custom-scrollbar">
      <Card className="bg-emerald-500/5 border-emerald-500/20">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-1">{t.aiSupplement}</h4>
            <p className="text-xs text-zinc-500">{t.aiSupplementDesc}</p>
            {selectedNovel.last_supplement_at && (
              <p className="text-[10px] text-zinc-600 mt-2 flex items-center gap-1">
                <Clock size={10} />
                {t.lastSupplementAt}: {new Date(selectedNovel.last_supplement_at).toLocaleString()}
              </p>
            )}
          </div>
          <button 
            onClick={handleAISupplement}
            disabled={isSupplementing || chapters.length === 0}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all",
              isSupplementing 
                ? "bg-zinc-800 text-zinc-500 cursor-not-allowed" 
                : "bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
            )}
          >
            {isSupplementing ? (
              <>
                <div className="w-3 h-3 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin" />
                {t.aiSupplementing}
              </>
            ) : (
              <>
                <Sparkles size={14} />
                {t.aiSupplement}
              </>
            )}
          </button>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title={t.basicSettings} className="p-6">
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800/50">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t.currentChapters}</p>
                <p className="text-xl font-bold text-white font-mono">{chapters.length}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t.totalWords}</p>
                <p className="text-xl font-bold text-emerald-400 font-mono">
                  {chapters.reduce((acc, c) => acc + (c.word_count || 0), 0).toLocaleString()}
                </p>
              </div>
              <div className="col-span-2 pt-2">
                <div className="flex justify-between items-center mb-1.5">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t.novelProgress}</p>
                  <p className="text-[10px] font-bold text-zinc-400">{Math.round((chapters.length / (selectedNovel.target_chapters || 1)) * 100)}%</p>
                </div>
                <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${Math.min(100, (chapters.length / (selectedNovel.target_chapters || 1)) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">{t.novelTitle}</label>
              <input 
                type="text"
                value={selectedNovel.title || ""}
                onChange={(e) => handleSaveNovelDetails({ title: e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">{t.author}</label>
              <input 
                type="text"
                value={selectedNovel.author || ""}
                onChange={(e) => handleSaveNovelDetails({ author: e.target.value })}
                placeholder={t.authorPlaceholder}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">{t.novelGenreLabel}</label>
              <input 
                type="text"
                value={selectedNovel.genre || ""}
                onChange={(e) => handleSaveNovelDetails({ genre: e.target.value })}
                placeholder={t.novelGenrePlaceholder}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">{t.novelCover}</label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-24 bg-zinc-800 rounded-lg flex items-center justify-center text-zinc-600 overflow-hidden border border-zinc-700">
                  {selectedNovel.cover_url ? (
                    <img src={selectedNovel.cover_url} alt="Cover" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <BookOpen size={24} />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <input 
                    type="text"
                    value={selectedNovel.cover_url || ""}
                    onChange={(e) => handleSaveNovelDetails({ cover_url: e.target.value })}
                    placeholder={t.coverUrlPlaceholder}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-white text-xs focus:outline-none focus:border-emerald-500 transition-all"
                  />
                  <label className="block">
                    <span className="sr-only">{t.chooseCoverFile || "Choose cover file"}</span>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleCoverUpload}
                      className="block w-full text-xs text-zinc-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-full file:border-0
                        file:text-xs file:font-semibold
                        file:bg-emerald-500/10 file:text-emerald-400
                        hover:file:bg-emerald-500/20
                        cursor-pointer"
                    />
                  </label>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">{t.targetChapters}</label>
              <div className="flex items-center gap-3">
                <input 
                  type="number"
                  value={selectedNovel.target_chapters || ""}
                  onChange={(e) => {
                    const val = e.target.value === "" ? 0 : parseInt(e.target.value);
                    if (!isNaN(val)) {
                      handleSaveNovelDetails({ target_chapters: val });
                    }
                  }}
                  className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500 transition-all"
                />
                <span className="text-sm text-zinc-500">{t.chapters}</span>
              </div>
              <p className="text-[10px] text-zinc-600 mt-2 italic">
                {t.targetChaptersDesc}
              </p>
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">{t.novelStatus}</label>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleSaveNovelDetails({ status: 'draft' })}
                  className={cn(
                    "flex-1 px-4 py-2 rounded-xl border text-sm font-medium transition-all",
                    selectedNovel.status === 'draft' || !selectedNovel.status
                      ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400"
                      : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600"
                  )}
                >
                  {t.novelDraft}
                </button>
                <button 
                  onClick={() => handleSaveNovelDetails({ status: 'completed' })}
                  className={cn(
                    "flex-1 px-4 py-2 rounded-xl border text-sm font-medium transition-all",
                    selectedNovel.status === 'completed'
                      ? "bg-blue-500/10 border-blue-500/50 text-blue-400"
                      : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600"
                  )}
                >
                  {t.novelCompleted}
                </button>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider">{t.novelDescription}</label>
                <button 
                  onClick={handleGenerateDescription}
                  disabled={isGenerating}
                  className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-500 hover:text-emerald-400 uppercase tracking-wider transition-colors disabled:opacity-50"
                >
                  <Sparkles size={12} />
                  {t.generateDescriptionLabel}
                </button>
              </div>
              <textarea 
                value={selectedNovel.description || ""}
                onChange={(e) => handleSaveNovelDetails({ description: e.target.value })}
                rows={6}
                placeholder={t.novelDescPlaceholder}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500 transition-all resize-none text-sm leading-relaxed"
              />
            </div>
          </div>
        </Card>

        <Card 
          title={t.worldSetting} 
          className="p-6 lg:col-span-2 flex flex-col min-h-[450px] group/card"
          headerAction={
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-2 py-1 bg-zinc-800 rounded-md border border-zinc-700">
                <Globe size={12} className="text-emerald-500" />
                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">{t.system}</span>
              </div>
              {selectedNovel.world_setting && (
                <div className="flex items-center gap-2">
                  <TemplateSelector 
                    type="refactor"
                    prompts={prompts}
                    selectedId={selectedTemplates['refactor']}
                    onSelect={(id) => setSelectedTemplates(prev => ({ ...prev, refactor: id }))}
                    onDelete={handleDeletePrompt}
                    t={t}
                  />
                  <button 
                    onClick={handleRefactorWorldSetting}
                    disabled={isRefactoringWorld}
                    className={cn(
                      "text-[10px] font-bold uppercase tracking-wider transition-colors px-2 py-1 rounded flex items-center gap-1.5",
                      isRefactoringWorld 
                        ? "bg-emerald-500/20 text-emerald-400 animate-pulse" 
                        : "text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10"
                    )}
                  >
                    <Sparkles size={10} className={isRefactoringWorld ? "animate-spin" : ""} />
                    {isRefactoringWorld ? t.refactoring : t.refactor}
                  </button>
                </div>
              )}
              <button 
                onClick={() => toggleEditMode('world')}
                className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 hover:text-emerald-300 transition-colors px-2 py-1 hover:bg-emerald-500/10 rounded"
              >
                {editMode['world'] ? t.save : t.edit}
              </button>
            </div>
          }
        >
          <div className="flex flex-col flex-1 overflow-hidden">
            <p className="text-[10px] text-zinc-500 mb-4 leading-relaxed">
              {t.worldSettingDesc}
            </p>
            <div className="flex-1 overflow-y-auto bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-6 shadow-inner">
              {editMode['world'] ? (
                <textarea 
                  value={selectedNovel.world_setting || ""}
                  onChange={(e) => handleSaveNovelDetails({ world_setting: e.target.value })}
                  placeholder={t.worldSettingPlaceholder}
                  className="w-full h-full bg-transparent border-none text-white focus:outline-none resize-none text-sm leading-relaxed font-mono"
                />
              ) : (
                <StructuredContent 
                  content={selectedNovel.world_setting || ""} 
                  placeholder={t.worldSettingPlaceholder} 
                />
              )}
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card 
          title={t.characters} 
          className="p-6 flex flex-col min-h-[450px] group/card"
          headerAction={
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-2 py-1 bg-zinc-800 rounded-md border border-zinc-700">
                <Users size={12} className="text-emerald-500" />
                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">{t.library}</span>
              </div>
              <button 
                onClick={() => toggleEditMode('characters')}
                className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 hover:text-emerald-300 transition-colors px-2 py-1 hover:bg-emerald-500/10 rounded"
              >
                {editMode['characters'] ? t.save : t.edit}
              </button>
            </div>
          }
        >
          <div className="flex flex-col flex-1 overflow-hidden">
            <p className="text-[10px] text-zinc-500 mb-4 leading-relaxed">
              {t.charactersDesc}
            </p>
            <div className="flex-1 overflow-y-auto bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-6 shadow-inner">
              {editMode['characters'] ? (
                <textarea 
                  value={selectedNovel.characters || ""}
                  onChange={(e) => handleSaveNovelDetails({ characters: e.target.value })}
                  placeholder={t.charactersPlaceholder}
                  className="w-full h-full bg-transparent border-none text-white focus:outline-none resize-none text-sm leading-relaxed"
                />
              ) : (
                <StructuredContent 
                  content={selectedNovel.characters || ""} 
                  placeholder={t.charactersPlaceholder} 
                />
              )}
            </div>
          </div>
        </Card>

        <Card 
          title={t.storylines} 
          className="p-6 flex flex-col min-h-[450px] group/card"
          headerAction={
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-2 py-1 bg-zinc-800 rounded-md border border-zinc-700">
                <GitBranch size={12} className="text-emerald-500" />
                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">{t.threads}</span>
              </div>
              <button 
                onClick={() => toggleEditMode('storylines')}
                className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 hover:text-emerald-300 transition-colors px-2 py-1 hover:bg-emerald-500/10 rounded"
              >
                {editMode['storylines'] ? t.save : t.edit}
              </button>
            </div>
          }
        >
          <div className="flex flex-col flex-1 overflow-hidden">
            <p className="text-[10px] text-zinc-500 mb-4 leading-relaxed">
              {t.storylinesDesc}
            </p>
            <div className="flex-1 overflow-y-auto bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-6 shadow-inner">
              {editMode['storylines'] ? (
                <textarea 
                  value={selectedNovel.storylines || ""}
                  onChange={(e) => handleSaveNovelDetails({ storylines: e.target.value })}
                  placeholder={t.storylinesPlaceholder}
                  className="w-full h-full bg-transparent border-none text-white focus:outline-none resize-none text-sm leading-relaxed"
                />
              ) : (
                <StructuredContent 
                  content={selectedNovel.storylines || ""} 
                  placeholder={t.storylinesPlaceholder} 
                />
              )}
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card 
          title={t.relationships} 
          className="p-6 flex flex-col min-h-[450px] group/card"
          headerAction={
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-2 py-1 bg-zinc-800 rounded-md border border-zinc-700">
                <Network size={12} className="text-emerald-500" />
                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">{t.network}</span>
              </div>
              <button 
                onClick={() => toggleEditMode('relationships')}
                className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 hover:text-emerald-300 transition-colors px-2 py-1 hover:bg-emerald-500/10 rounded"
              >
                {editMode['relationships'] ? t.save : t.edit}
              </button>
            </div>
          }
        >
          <div className="flex flex-col flex-1 overflow-hidden">
            <p className="text-[10px] text-zinc-500 mb-4 leading-relaxed">
              {t.relationshipsDesc}
            </p>
            <div className="flex-1 overflow-y-auto bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-6 shadow-inner">
              {editMode['relationships'] ? (
                <textarea 
                  value={selectedNovel.relationships || ""}
                  onChange={(e) => handleSaveNovelDetails({ relationships: e.target.value })}
                  placeholder={t.relationshipsPlaceholder}
                  className="w-full h-full bg-transparent border-none text-white focus:outline-none resize-none text-sm leading-relaxed"
                />
              ) : (
                <StructuredContent 
                  content={selectedNovel.relationships || ""} 
                  placeholder={t.relationshipsPlaceholder} 
                />
              )}
            </div>
          </div>
        </Card>

        <Card title={t.visualOverview} className="p-6">
          <div className="grid grid-cols-1 gap-8">
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-zinc-400 flex items-center gap-2">
                <TrendingUp size={16} className="text-emerald-500" />
                {t.storyProgression}
              </h4>
              <div className="aspect-video bg-zinc-950 rounded-2xl border border-zinc-800 p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chapters.map(c => ({ name: c.order_index, words: c.word_count }))}>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                      itemStyle={{ color: '#10b981' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="words" 
                      stroke="#10b981" 
                      strokeWidth={2} 
                      dot={{ fill: '#10b981', r: 2 }}
                      activeDot={{ r: 4, strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
                <div className="mt-2 flex justify-between text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
                  <span>{t.beginning}</span>
                  <span>{t.development}</span>
                  <span>{t.climax}</span>
                  <span>{t.ending}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default WorldBuildingPage;

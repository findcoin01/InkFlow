import React from 'react';
import { 
  Square, 
  Sparkles, 
  Zap, 
  FileText, 
  Layers, 
  Search,
  BookOpen,
  Save,
  Plus,
  Trash2,
  TrendingUp,
  Eye,
  X
} from "lucide-react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn, formatDate } from "../lib/utils";
import { Chapter, Novel, Prompt, AIConfig, WritingConfig } from "../types";
import Card from "../components/ui/Card";
import TemplateSelector from "../components/ui/TemplateSelector";
import StructuredContent from "../components/ui/StructuredContent";

interface EditorPageProps {
  currentChapter: Chapter | null;
  isMarkdownPreview: boolean;
  contentSearch: string;
  setContentSearch: (val: string) => void;
  setLastSearchIndex: (val: number) => void;
  handleSearchContent: () => void;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  setCurrentChapter: (ch: Chapter | null) => void;
  isGenerating: boolean;
  isSegmenting: boolean;
  abortController: AbortController | null;
  handleAIWrite: () => void;
  prompts: Prompt[];
  selectedTemplates: Record<string, number>;
  setSelectedTemplates: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  handleDeletePrompt: (id: number) => void;
  isPolishing: boolean;
  handleRefactorChapter: () => void;
  handleGenerateSummary: (content?: string) => void;
  handleSegmentedWrite: () => void;
  segmentProgress: number;
  aiConfig: AIConfig;
  isSaving: boolean;
  lastSavedAt: Date | null;
  selectedNovel: Novel;
  activeOutline: any;
  setActiveOutline: (outline: any) => void;
  handleSaveOutline: () => void;
  isCreatingOutlineVersion: boolean;
  setIsCreatingOutlineVersion: (val: boolean) => void;
  newOutlineVersionName: string;
  setNewOutlineVersionName: (val: string) => void;
  handleCreateOutlineVersion: () => void;
  handleDeleteOutlineVersion: (id: number) => void;
  handleActivateOutline: (id: number) => void;
  isOutlinePreview: boolean;
  setIsOutlinePreview: (val: boolean) => void;
  handleAIGenerateOutline: () => void;
  isGeneratingOutline: boolean;
  t: any;
}

const EditorPage: React.FC<EditorPageProps> = ({
  currentChapter,
  isMarkdownPreview,
  contentSearch,
  setContentSearch,
  setLastSearchIndex,
  handleSearchContent,
  textareaRef,
  setCurrentChapter,
  isGenerating,
  isSegmenting,
  abortController,
  handleAIWrite,
  prompts,
  selectedTemplates,
  setSelectedTemplates,
  handleDeletePrompt,
  isPolishing,
  handleRefactorChapter,
  handleGenerateSummary,
  handleSegmentedWrite,
  segmentProgress,
  aiConfig,
  isSaving,
  lastSavedAt,
  selectedNovel,
  activeOutline,
  setActiveOutline,
  handleSaveOutline,
  isCreatingOutlineVersion,
  setIsCreatingOutlineVersion,
  newOutlineVersionName,
  setNewOutlineVersionName,
  handleCreateOutlineVersion,
  handleDeleteOutlineVersion,
  handleActivateOutline,
  isOutlinePreview,
  setIsOutlinePreview,
  handleAIGenerateOutline,
  isGeneratingOutline,
  t
}) => {
  return (
    <div className="flex-1 flex gap-6 overflow-hidden">
      {/* Editor Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {currentChapter ? (
          <>
            <Card className="flex-1 flex flex-col overflow-hidden bg-zinc-950/50 border-zinc-800/50 group/editor relative">
              {contentSearch && (
                <div className="absolute top-4 right-4 z-20 flex items-center gap-2 p-2 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl animate-in fade-in slide-in-from-top-2">
                  <div className="relative w-48">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input 
                      type="text"
                      value={contentSearch}
                      onChange={(e) => {
                        setContentSearch(e.target.value);
                        setLastSearchIndex(-1);
                      }}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearchContent()}
                      placeholder={t.searchContent || "Search content..."}
                      className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-lg py-1.5 pl-9 pr-3 text-xs text-zinc-300 focus:outline-none focus:border-emerald-500/30 transition-all"
                    />
                  </div>
                  <button 
                    onClick={handleSearchContent}
                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all"
                  >
                    {t.findNext || "Find Next"}
                  </button>
                </div>
              )}

              {isMarkdownPreview ? (
                <div className="flex-1 p-8 overflow-y-auto markdown-body">
                  <Markdown remarkPlugins={[remarkGfm]}>
                    {currentChapter.content || t.noContent}
                  </Markdown>
                </div>
              ) : (
                <textarea
                  ref={textareaRef}
                  value={currentChapter.content || ""}
                  onChange={(e) => setCurrentChapter({...currentChapter, content: e.target.value})}
                  placeholder={t.startWriting}
                  className="flex-1 p-8 bg-transparent border-none text-zinc-300 text-lg leading-relaxed focus:outline-none resize-none"
                />
              )}
              <div className="p-3 bg-zinc-900/90 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4 backdrop-blur-md">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* AI Assist Group */}
                  <div className="flex items-center bg-zinc-800/30 rounded-xl p-1 border border-zinc-700/30">
                    <button 
                      onClick={isGenerating || isSegmenting ? () => abortController?.abort() : handleAIWrite}
                      className={cn(
                        "px-4 py-1.5 rounded-lg flex items-center gap-2 transition-all text-xs font-bold",
                        isGenerating || isSegmenting 
                          ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20" 
                          : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400"
                      )}
                    >
                      {isGenerating || isSegmenting ? <Square size={14} fill="currentColor" /> : <Sparkles size={14} className={isGenerating ? "animate-spin" : ""} />}
                      {isGenerating || isSegmenting ? t.stop : t.aiAssist}
                    </button>
                    <TemplateSelector 
                      type="chapter"
                      prompts={prompts}
                      selectedId={selectedTemplates['chapter']}
                      onSelect={(id) => setSelectedTemplates(prev => ({ ...prev, chapter: id }))}
                      onDelete={handleDeletePrompt}
                      t={t}
                    />
                  </div>

                  {/* Polish Group */}
                  <div className="flex items-center bg-zinc-800/30 rounded-xl p-1 border border-zinc-700/30">
                    <button 
                      onClick={isPolishing ? () => abortController?.abort() : handleRefactorChapter}
                      disabled={!currentChapter.content}
                      className={cn(
                        "px-3 py-1.5 rounded-lg flex items-center gap-2 transition-all text-xs font-bold",
                        isPolishing 
                          ? "bg-amber-500 text-white shadow-lg shadow-amber-500/20" 
                          : "hover:bg-zinc-800 text-zinc-400"
                      )}
                      title={t.polish}
                    >
                      {isPolishing ? <Square size={14} fill="currentColor" /> : <Zap size={14} className={isPolishing ? "animate-pulse" : ""} />}
                      {isPolishing ? t.stop : t.polish}
                    </button>
                    <TemplateSelector 
                      type="polish"
                      prompts={prompts}
                      selectedId={selectedTemplates['polish']}
                      onSelect={(id) => setSelectedTemplates(prev => ({ ...prev, polish: id }))}
                      onDelete={handleDeletePrompt}
                      t={t}
                    />
                  </div>

                  {/* Summary Group */}
                  <div className="flex items-center bg-zinc-800/30 rounded-xl p-1 border border-zinc-700/30">
                    <button 
                      onClick={() => handleGenerateSummary()}
                      disabled={isGenerating || isSegmenting || !currentChapter.content}
                      className="px-3 py-1.5 hover:bg-zinc-800 text-zinc-400 rounded-lg flex items-center gap-2 transition-all disabled:opacity-50 text-xs font-bold"
                      title={t.summarize}
                    >
                      <FileText size={14} />
                      {t.summarize}
                    </button>
                    <TemplateSelector 
                      type="summary"
                      prompts={prompts}
                      selectedId={selectedTemplates['summary']}
                      onSelect={(id) => setSelectedTemplates(prev => ({ ...prev, summary: id }))}
                      onDelete={handleDeletePrompt}
                      t={t}
                    />
                  </div>

                  {/* Segmented Group */}
                  <button 
                    onClick={handleSegmentedWrite}
                    disabled={isGenerating || isSegmenting}
                    className="px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded-xl flex items-center gap-2 transition-all disabled:opacity-50 text-xs font-bold relative overflow-hidden"
                  >
                    <Layers size={14} />
                    {isSegmenting ? `${segmentProgress}%` : t.segmentedWrite}
                    {isSegmenting && (
                      <div 
                        className="absolute bottom-0 left-0 h-0.5 bg-indigo-500 transition-all duration-300" 
                        style={{ width: `${segmentProgress}%` }}
                      />
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-4 ml-auto">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl shrink-0">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[10px] text-emerald-500/70 font-mono font-bold">{aiConfig.model}</span>
                  </div>

                  <div className="text-[10px] text-zinc-600 font-medium italic flex items-center gap-2 whitespace-nowrap">
                    {isSaving ? (
                      <>
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        {t.saving}
                      </>
                    ) : (
                      <>
                        {t.autoSaved}
                        {lastSavedAt && (
                          <span className="ml-1 opacity-60">
                            {formatDate(lastSavedAt, "HH:mm")}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </>
        ) : (
          <div className="flex-1 flex justify-center items-center text-zinc-600 bg-zinc-900/20 border border-dashed border-zinc-800 rounded-2xl">
            <div className="text-center">
              <BookOpen size={48} className="mx-auto mb-4 opacity-20" />
              <p>{t.selectToStart}</p>
            </div>
          </div>
        )}
      </div>

      {/* Outline / Context Panel */}
      <div className="w-80 flex flex-col gap-4">
        <Card 
          className="flex-1 flex flex-col" 
          title={t.novelOutline}
          headerAction={
            <div className="flex gap-1">
              <button 
                onClick={handleSaveOutline}
                className="p-1.5 hover:bg-zinc-800 rounded-lg text-emerald-400 transition-all"
                title={t.save}
              >
                <Save size={16} />
              </button>
              <button 
                onClick={handleCreateOutlineVersion}
                className={cn(
                  "p-1.5 rounded-lg transition-all",
                  isCreatingOutlineVersion ? "bg-emerald-500 text-white" : "hover:bg-zinc-800 text-zinc-400 hover:text-emerald-400"
                )}
                title={t.newVersion}
              >
                {isCreatingOutlineVersion ? <Save size={16} /> : <Plus size={16} />}
              </button>
              {isCreatingOutlineVersion && (
                <button 
                  onClick={() => setIsCreatingOutlineVersion(false)}
                  className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-rose-400 transition-all"
                  title={t.cancel}
                >
                  <X size={16} />
                </button>
              )}
            </div>
          }
        >
          <div className="flex flex-col h-full gap-4">
            {isCreatingOutlineVersion && (
              <div className="flex flex-col gap-2 p-3 bg-zinc-800/30 rounded-xl border border-emerald-500/20">
                <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">{t.versionName}</span>
                <input 
                  autoFocus
                  value={newOutlineVersionName}
                  onChange={(e) => setNewOutlineVersionName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateOutlineVersion()}
                  className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50 transition-all"
                  placeholder={t.versionNamePlaceholder || "e.g. V2.0"}
                />
              </div>
            )}
            {selectedNovel.outlines && selectedNovel.outlines.length > 0 ? (
              <>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-2">
                    <select 
                      value={activeOutline?.id || ""}
                      onChange={(e) => {
                        const selected = selectedNovel.outlines?.find(o => o.id === parseInt(e.target.value));
                        if (selected) setActiveOutline(selected);
                      }}
                      className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-zinc-300 focus:outline-none"
                    >
                      {selectedNovel.outlines?.map(o => (
                        <option key={o.id} value={o.id}>{o.version_name} {o.is_active ? `(${t.activeVersion})` : ""}</option>
                      ))}
                    </select>
                    <div className="flex gap-1">
                      {activeOutline && (
                        <button 
                          onClick={() => handleDeleteOutlineVersion(activeOutline.id)}
                          className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-rose-400 transition-colors"
                          title={t.delete}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                      {activeOutline && !activeOutline.is_active && (
                        <button 
                          onClick={() => handleActivateOutline(activeOutline.id)}
                          className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-emerald-400"
                          title={t.activate}
                        >
                          <TrendingUp size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between px-1">
                    <div className="flex gap-2 items-center">
                      <TemplateSelector 
                        type="outline"
                        prompts={prompts}
                        selectedId={selectedTemplates['outline']}
                        onSelect={(id) => setSelectedTemplates(prev => ({ ...prev, outline: id }))}
                        onDelete={handleDeletePrompt}
                        t={t}
                      />
                      <button 
                        onClick={() => setIsOutlinePreview(true)}
                        className="p-1.5 rounded-lg transition-colors hover:bg-zinc-800 text-zinc-500 hover:text-emerald-400"
                        title={t.previewOutline}
                      >
                        <Eye size={14} />
                      </button>
                    </div>
                    <button 
                      onClick={handleAIGenerateOutline}
                      disabled={isGeneratingOutline}
                      className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg text-emerald-400 text-[10px] font-bold transition-all disabled:opacity-50"
                    >
                      <Sparkles size={12} className={isGeneratingOutline ? "animate-pulse" : ""} />
                      {t.generateOutline}
                    </button>
                  </div>
                </div>
                <textarea 
                  value={activeOutline?.content || ""}
                  onChange={(e) => activeOutline && setActiveOutline({...activeOutline, content: e.target.value})}
                  placeholder={t.outlinePlaceholder}
                  className="flex-1 bg-transparent border-none text-sm text-zinc-400 leading-relaxed focus:outline-none resize-none scrollbar-hide"
                />
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-4">
                <div className="p-4 rounded-full bg-zinc-800/50 text-zinc-600">
                  <FileText size={32} />
                </div>
                <div className="text-center">
                  <p className="text-sm text-zinc-500 italic mb-4">{t.noOutlineVersions || "No outline versions found"}</p>
                  {!isCreatingOutlineVersion && (
                    <button 
                      onClick={handleCreateOutlineVersion}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20"
                    >
                      <Plus size={14} />
                      {t.newVersion}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default EditorPage;

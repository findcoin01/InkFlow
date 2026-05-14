import React, { useState, useEffect, useRef } from "react";
import { 
  LayoutDashboard, 
  BookOpen, 
  BarChart3, 
  Settings, 
  Plus, 
  Play,
  RefreshCw,
  Save, 
  Send, 
  Calendar, 
  Sparkles,
  ChevronRight,
  ChevronDown,
  Clock,
  Eye,
  TrendingUp,
  BookMarked,
  Languages,
  Trash2,
  X,
  Layers,
  Square,
  Users,
  User,
  GitBranch,
  Network,
  Globe,
  FileText,
  Type,
  Cpu,
  Zap,
  Activity,
  Wand2,
  Download,
  FileDown,
  Search,
  History,
  Loader2
} from "lucide-react";
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar,
  Cell,
  PieChart,
  Pie
} from "recharts";
import { motion, AnimatePresence } from "motion/react";
import { cn, formatDate } from "./lib/utils";
import { Novel, Chapter, TokenStats, OutlineVersion, AIConfig, AIProvider, WritingConfig, ContentLayout, Platform, ScheduledTask, Prompt, OperationLog, AIConfigDetail, TokenLog, Language } from "./types";
import { translations } from "./constants";
import remarkGfm from "remark-gfm";
import Markdown from "react-markdown";

// Page Components
import Dashboard from "./pages/Dashboard";
import NovelsPage from "./pages/NovelsPage";
import EditorPage from "./pages/EditorPage";
import WorldBuildingPage from "./pages/WorldBuildingPage";
import StatsPage from "./pages/StatsPage";
import TasksPage from "./pages/TasksPage";
import PromptsPage from "./pages/PromptsPage";
import LogsPage from "./pages/LogsPage";
import AIConfigPage from "./pages/AIConfigPage";
import SettingsPage from "./pages/SettingsPage";

import SidebarItem from "./components/ui/SidebarItem";

import { ChapterPreview } from "./components/ui/ChapterPreview";
import { CreateNovelModal } from "./components/modals/CreateNovelModal";
import { DeleteConfirmModal } from "./components/modals/DeleteConfirmModal";
import { BatchGenerateModal } from "./components/modals/BatchGenerateModal";
import { PreviewModal } from "./components/modals/PreviewModal";
import Card from "./components/ui/Card";
import StatCard from "./components/ui/StatCard";
import Toast from "./components/ui/Toast";
import TemplateSelector from "./components/ui/TemplateSelector";
import TOCItem from "./components/ui/TOCItem";
import StructuredContent from "./components/ui/StructuredContent";
import PlotAssistant from "./components/PlotAssistant";
import Logo from "./components/Logo";

import TaskModal from "./components/modals/TaskModal";
import PromptModal from "./components/modals/PromptModal";
import OutlinePreviewModal from "./components/modals/OutlinePreviewModal";
import HistoryModal from "./components/modals/HistoryModal";

import { useInkFlow } from "./hooks/useInkFlow";

import { generateAIContent, generateAIOutline, generateAIContentStream, generateChapterTitle, generateChapterTitleFromOutline, extractNovelMetadata, generateChapterSummary, generateNovelDescription, refactorWorldSetting } from "./services/aiService";

// --- Components ---

// --- Main App ---

export default function App() {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const flow = useInkFlow();

  const {
    fetchNovels, fetchStats, fetchTokenLogs, fetchTasks, fetchPrompts, fetchLogs, fetchAIConfigs, fetchNovelDetails,
    handleSaveNovelDetails, handleCreateNovel, handleDeleteNovel: confirmDeleteNovel, handleSaveChapter, handleAddChapter, handleDeleteChapter: confirmDeleteChapter,
    fetchChapterVersions, saveChapterVersion, restoreChapterVersion, getChapterTitleFromOutline, getChapterOutlineFromOutline,
    handleGenerateTitle, handleGenerateDescription, handleAIWrite, handleGenerateSummary, handleSavePrompt, handleCreateTask, getActivePrompt,
    handleSearchContent: flowSearchContent, handleExportNovel, handleRefactorWorldSetting, handleAISupplement, handleSegmentedWrite, handleAIGenerateOutline, handleBatchGenerate,
    handleRefactorChapterContent: handleRefactorChapterStream,
    handleSaveOutline, handleCreateOutlineVersion, handleActivateOutline, handleDeleteOutlineVersion: confirmDeleteOutline,
    handleSaveAIConfig, handleRunTask, handleDeleteTask: confirmDeleteTask, handleDeletePrompt: confirmDeletePrompt, handleActivatePrompt, handleTestConnection, handleResetSettings,
    handleCoverUpload, toggleEditMode, onDeleteNovelClick, onDeleteChapterClick, onDeleteOutlineClick, onDeletePromptClick,

    isSidebarCollapsed, setIsSidebarCollapsed, novelSearch, setNovelSearch, chapterSearch, setChapterSearch, contentSearch, setContentSearch, lastSearchIndex, setLastSearchIndex,
    prompts, setPrompts, promptFilter, setPromptFilter, selectedTemplates, setSelectedTemplates, logs, setLogs, logPage, setLogPage, logTotalPages, setLogTotalPages,
    logTotal, setLogTotal, aiConfigs, setAiConfigs, activeProvider, setActiveProvider, testResult, setTestResult, isTesting, setIsTesting, activeTab, setActiveTab,
    isPlotAssistantOpen, setIsPlotAssistantOpen, isHistoryOpen, setIsHistoryOpen, chapterVersions, setChapterVersions, isSavingVersion, setIsSavingVersion,
    isRestoringVersion, setIsRestoringVersion, novels, setNovels, stats, setStats, tokenLogs, setTokenLogs, tokenLogPage, setTokenLogPage, tokenLogTotalPages, setTokenLogTotalPages,
    tokenLogTotal, setTokenLogTotal, selectedNovel, setSelectedNovel, chapters, setChapters, currentChapter, setCurrentChapter, activeOutline, setActiveOutline,
    isWriting, setIsWriting, isGenerating, setIsGenerating, isGeneratingTitle, setIsGeneratingTitle, isSegmenting, setIsSegmenting, isPolishing, setIsPolishing,
    segmentProgress, setSegmentProgress, isGeneratingOutline, setIsGeneratingOutline, isSupplementing, setIsSupplementing, isRefactoringWorld, setIsRefactoringWorld,
    isOutlinePreview, setIsOutlinePreview, editMode, setEditMode, abortController, setAbortController, isCreating, setIsCreating, showCreateModal, setShowCreateModal,
    showBatchModal, setShowBatchModal, showPreview, setShowPreview, isMarkdownPreview, setIsMarkdownPreview, tasks, setTasks, showTaskModal, setShowTaskModal,
    newTask, setNewTask, batchCount, setBatchCount, isBatchGenerating, setIsBatchGenerating, batchProgress, setBatchProgress, novelToDelete, setNovelToDelete,
    outlineToDelete, setOutlineToDelete, chapterToDelete, setChapterToDelete, showResetConfirm, setShowResetConfirm, promptToDelete, setPromptToDelete,
    newNovelTitle, setNewNovelTitle, newNovelAuthor, setNewNovelAuthor, newNovelGenre, setNewNovelGenre, isSaving, setIsSaving, lastSavedAt, setLastSavedAt, toast, setToast,
    aiConfig, setAiConfig, writingConfig, setWritingConfig, lang, setLang, t, showPromptModal, setShowPromptModal, editingPrompt, setEditingPrompt,
    isCreatingOutlineVersion, setIsCreatingOutlineVersion, newOutlineVersionName, setNewOutlineVersionName
  } = flow;

  // Local wrappers for handlers using refs
  const handleSearchContent = () => flowSearchContent(contentSearch, textareaRef.current);
  const handleRefactorChapter = handleRefactorChapterStream;
  const onCreateNovel = () => handleCreateNovel(newNovelTitle, newNovelAuthor, newNovelGenre);
  const onCreateOutlineVersion = (name: string) => handleCreateOutlineVersion(name);

  // Effects remaining in App.tsx
  useEffect(() => {
    if ((isGenerating || isSegmenting || isBatchGenerating) && textareaRef.current) {
      const textarea = textareaRef.current;
      requestAnimationFrame(() => {
        textarea.scrollTop = textarea.scrollHeight;
      });
    }
  }, [currentChapter?.content, isGenerating, isSegmenting, isBatchGenerating]);














  return (
    <div className="flex h-screen bg-black text-zinc-300 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className={cn(
        "border-r border-zinc-800 p-6 flex flex-col gap-8 transition-all duration-300 relative",
        isSidebarCollapsed ? "w-20" : "w-64"
      )}>
        <button 
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="absolute -right-3 top-10 w-6 h-6 bg-zinc-800 border border-zinc-700 rounded-full flex items-center justify-center text-zinc-400 hover:text-white z-10"
        >
          <ChevronRight size={14} className={cn("transition-transform", !isSidebarCollapsed && "rotate-180")} />
        </button>

        <div className={cn("flex items-center gap-3 px-2", isSidebarCollapsed && "justify-center")}>
          <Logo size={40} />
          {!isSidebarCollapsed && <h1 className="text-xl font-bold text-white tracking-tight">{t.appName}</h1>}
        </div>

        <nav className="flex flex-col gap-2 overflow-y-auto custom-scrollbar">
          <SidebarItem 
            icon={LayoutDashboard} 
            label={t.dashboard} 
            active={activeTab === "dashboard"} 
            onClick={() => setActiveTab("dashboard")} 
            collapsed={isSidebarCollapsed}
          />
          <SidebarItem 
            icon={BookOpen} 
            label={t.myNovels} 
            active={activeTab === "novels"} 
            onClick={() => setActiveTab("novels")} 
            collapsed={isSidebarCollapsed}
          />
          <SidebarItem 
            icon={BarChart3} 
            label={t.statistics} 
            active={activeTab === "stats"} 
            onClick={() => setActiveTab("stats")} 
            collapsed={isSidebarCollapsed}
          />
          <SidebarItem 
            icon={Calendar} 
            label={t.scheduledTasks} 
            active={activeTab === "tasks"} 
            onClick={() => setActiveTab("tasks")} 
            collapsed={isSidebarCollapsed}
          />
          <SidebarItem 
            icon={FileText} 
            label={t.prompts} 
            active={activeTab === "prompts"} 
            onClick={() => setActiveTab("prompts")} 
            collapsed={isSidebarCollapsed}
          />
          <SidebarItem 
            icon={Clock} 
            label={t.logs} 
            active={activeTab === "logs"} 
            onClick={() => setActiveTab("logs")} 
            collapsed={isSidebarCollapsed}
          />
          <SidebarItem 
            icon={Cpu} 
            label={t.aiConfig} 
            active={activeTab === "ai-config"} 
            onClick={() => setActiveTab("ai-config")} 
            collapsed={isSidebarCollapsed}
          />
          {selectedNovel && (
            <SidebarItem 
              icon={Sparkles} 
              label={t.plotAssistant || "Plot Assistant"} 
              active={isPlotAssistantOpen} 
              onClick={() => setIsPlotAssistantOpen(true)} 
              collapsed={isSidebarCollapsed}
              className="text-emerald-400"
            />
          )}
          <SidebarItem 
            icon={Settings} 
            label={t.settings} 
            active={activeTab === "settings"} 
            onClick={() => setActiveTab("settings")} 
            collapsed={isSidebarCollapsed}
          />
        </nav>

        <div className="mt-auto space-y-4">
          {!isSidebarCollapsed && (
            <div className="px-2">
              <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-2 flex items-center gap-2">
                <Languages size={12} />
                {t.language}
              </p>
              <div className="flex gap-2">
                <button 
                  onClick={() => setLang('en')}
                  className={cn(
                    "flex-1 py-1.5 text-xs rounded-lg border transition-all",
                    lang === 'en' ? "bg-zinc-800 border-zinc-700 text-white" : "border-transparent text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  EN
                </button>
                <button 
                  onClick={() => setLang('zh')}
                  className={cn(
                    "flex-1 py-1.5 text-xs rounded-lg border transition-all",
                    lang === 'zh' ? "bg-zinc-800 border-zinc-700 text-white" : "border-transparent text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  中文
                </button>
              </div>
            </div>
          )}
          <button 
            onClick={() => {
              setNewNovelTitle("");
              setNewNovelAuthor(writingConfig.defaultAuthor || "");
              setNewNovelGenre("");
              setShowCreateModal(true);
            }}
            className={cn(
              "w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl flex items-center justify-center gap-2 transition-all",
              isSidebarCollapsed && "p-0 h-12 w-12 mx-auto"
            )}
          >
            <Plus size={20} />
            {!isSidebarCollapsed && t.newNovel}
          </button>
        </div>
      </aside>

      {/* Create Novel Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateNovelModal 
            newNovelTitle={newNovelTitle}
            setNewNovelTitle={setNewNovelTitle}
            newNovelAuthor={newNovelAuthor}
            setNewNovelAuthor={setNewNovelAuthor}
            newNovelGenre={newNovelGenre}
            setNewNovelGenre={setNewNovelGenre}
            isCreating={isCreating}
            onClose={() => {
              setShowCreateModal(false);
              setNewNovelTitle("");
              setNewNovelAuthor("");
              setNewNovelGenre("");
            }}
            onCreate={onCreateNovel}
            t={t}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {novelToDelete !== null && (
          <DeleteConfirmModal 
            title={t.deleteNovel}
            description={t.confirmDelete}
            onCancel={() => setNovelToDelete(null)}
            onConfirm={confirmDeleteNovel}
            t={t}
          />
        )}

        {chapterToDelete !== null && (
          <DeleteConfirmModal 
            title={t.deleteChapter}
            description={t.confirmDelete}
            onCancel={() => setChapterToDelete(null)}
            onConfirm={confirmDeleteChapter}
            t={t}
          />
        )}

        {outlineToDelete !== null && (
          <DeleteConfirmModal 
            title={t.delete}
            description={t.deleteConfirm}
            onCancel={() => setOutlineToDelete(null)}
            onConfirm={confirmDeleteOutline}
            t={t}
          />
        )}

        {showResetConfirm && (
          <DeleteConfirmModal 
            title={t.resetSettings}
            description={t.confirmReset}
            onCancel={() => setShowResetConfirm(false)}
            onConfirm={handleResetSettings}
            confirmText={t.confirm}
            type="warning"
            t={t}
          />
        )}

        {promptToDelete !== null && (
          <DeleteConfirmModal 
            title={t.deletePrompt || "删除模板"}
            description={t.confirmDeletePrompt || "确定要删除这个模板吗？"}
            onCancel={() => setPromptToDelete(null)}
            onConfirm={confirmDeletePrompt}
            t={t}
          />
        )}
      </AnimatePresence>

      {/* Batch Generate Modal */}
      <AnimatePresence>
        {showBatchModal && selectedNovel && (
          <BatchGenerateModal 
            selectedNovel={selectedNovel}
            chapters={chapters}
            batchCount={batchCount}
            setBatchCount={setBatchCount}
            onClose={() => setShowBatchModal(false)}
            onBatchGenerate={handleBatchGenerate}
            t={t}
          />
        )}
      </AnimatePresence>

      {/* Preview Modal */}
      <AnimatePresence>
        {showPreview && selectedNovel && (
          <PreviewModal 
            selectedNovel={selectedNovel}
            chapters={chapters}
            onClose={() => setShowPreview(false)}
            t={t}
          />
        )}
      </AnimatePresence>

      {/* Batch Generating Indicator (Non-blocking) */}
      <AnimatePresence>
        {isBatchGenerating && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-8 right-8 z-[60] bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl flex items-center gap-6 backdrop-blur-md"
          >
            <div className="relative w-12 h-12 shrink-0">
              <div className="absolute inset-0 border-2 border-emerald-500/20 rounded-full"></div>
              <div className="absolute inset-0 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <Sparkles className="absolute inset-0 m-auto text-emerald-400 animate-pulse" size={16} />
            </div>
            <div className="flex flex-col gap-3">
              <div>
                <h3 className="text-sm font-bold text-white mb-1">{t.generatingChapters}</h3>
                <p className="text-xs text-zinc-400">{t.aiThinking}</p>
              </div>
              <button 
                onClick={() => abortController?.abort()}
                className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-lg text-[10px] font-medium transition-all flex items-center justify-center gap-2"
              >
                <Square size={10} fill="currentColor" />
                {t.stop}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        <AnimatePresence mode="wait">
          {activeTab === "dashboard" && (
            <Dashboard 
              stats={stats}
              novels={novels}
              fetchNovelDetails={fetchNovelDetails}
              tasks={tasks}
              t={t}
            />
          )}

          {activeTab === "novels" && (
            <NovelsPage 
              novels={novels}
              novelSearch={novelSearch}
              setNovelSearch={setNovelSearch}
              handleDeleteNovel={onDeleteNovelClick}
              exportNovel={handleExportNovel}
              fetchNovelDetails={fetchNovelDetails}
              t={t}
            />
          )}

          {(activeTab === "editor" || activeTab === "world") && selectedNovel && (
            <motion.div
              key="novel-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full flex flex-col gap-6"
            >
              <header className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setActiveTab("novels")}
                    className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400"
                  >
                    <ChevronRight size={24} className="rotate-180" />
                  </button>
                  <div className="w-10 h-14 bg-zinc-800 rounded flex items-center justify-center text-zinc-600 overflow-hidden border border-zinc-700">
                    {selectedNovel.cover_url ? (
                      <img src={selectedNovel.cover_url} alt="Cover" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <BookOpen size={20} />
                    )}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">{selectedNovel.title}</h2>
                    <div className="flex items-center gap-4 mt-1">
                      {selectedNovel.author && (
                        <span className="text-xs text-zinc-500 flex items-center gap-1">
                          <User size={10} />
                          {selectedNovel.author}
                        </span>
                      )}
                      <button 
                        onClick={() => setActiveTab("editor")}
                        className={cn("text-xs font-bold uppercase tracking-wider transition-all", activeTab === "editor" ? "text-emerald-400" : "text-zinc-500 hover:text-zinc-300")}
                      >
                        {t.chapters}
                      </button>
                      <button 
                        onClick={() => setActiveTab("world")}
                        className={cn("text-xs font-bold uppercase tracking-wider transition-all", activeTab === "world" ? "text-emerald-400" : "text-zinc-500 hover:text-zinc-300")}
                      >
                        {t.worldBuilding}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setIsPlotAssistantOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/20 transition-all group"
                  >
                    <Sparkles size={18} className="group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-bold">{t.plotAssistant || "Plot Assistant"}</span>
                  </button>
                  <div className="hidden md:flex flex-col items-end mr-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">{t.progress}:</span>
                      <span className="text-[10px] text-zinc-300 font-mono">{chapters.length} / {selectedNovel.target_chapters || 0}</span>
                    </div>
                    <div className="w-32 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 transition-all duration-500"
                        style={{ width: `${Math.min(100, (chapters.length / (selectedNovel.target_chapters || 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <button 
                    onClick={(e) => onDeleteNovelClick(e as any, selectedNovel.id)}
                    className="p-2 hover:bg-rose-500/10 text-zinc-500 hover:text-rose-500 rounded-lg transition-all"
                    title={t.deleteNovel}
                  >
                    <Trash2 size={20} />
                  </button>
                  <div className="relative group/export">
                    <button 
                      className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg flex items-center gap-2 transition-all"
                    >
                      <Download size={18} />
                      {t.export}
                    </button>
                    <div className="absolute right-0 top-full pt-1 w-40 hidden group-hover/export:block z-20">
                      <div className="bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl overflow-hidden">
                        <button 
                          onClick={() => handleExportNovel(selectedNovel, 'markdown')}
                          className="w-full text-left px-4 py-3 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 flex items-center gap-3"
                        >
                          <FileDown size={16} />
                          {t.exportMarkdown}
                        </button>
                        <button 
                          onClick={() => handleExportNovel(selectedNovel, 'epub')}
                          className="w-full text-left px-4 py-3 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 flex items-center gap-3"
                        >
                          <BookOpen size={16} />
                          {t.exportEpub}
                        </button>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowPreview(true)}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg flex items-center gap-2 transition-all"
                  >
                    <Eye size={18} />
                    {t.previewNovel}
                  </button>
                  <button 
                    onClick={() => handleSaveChapter()}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg flex items-center gap-2 transition-all"
                    title={t.save}
                  >
                    <Save size={18} />
                    <span className="hidden sm:inline">{t.save}</span>
                  </button>
                  <button 
                    onClick={() => saveChapterVersion(currentChapter.id)}
                    disabled={isSavingVersion}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-emerald-900/20"
                    title={t.saveVersion}
                  >
                    {isSavingVersion ? <Loader2 size={18} className="animate-spin" /> : <Clock size={18} />}
                    <span className="hidden sm:inline">{t.saveVersion}</span>
                  </button>
                </div>
              </header>

              {activeTab === "editor" ? (
                <div className="flex-1 flex gap-6 min-h-0">
                {/* Chapter List */}
                <div className="w-64 flex flex-col gap-4">
                  <Card className="flex-1 flex flex-col p-4 overflow-hidden" title={t.chapters}>
                    <div className="relative mb-4">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                      <input 
                        type="text"
                        value={chapterSearch}
                        onChange={(e) => setChapterSearch(e.target.value)}
                        placeholder={t.searchChapters || "Search chapters..."}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-1.5 pl-9 pr-3 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500/50 transition-all"
                      />
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                      {chapters.filter(ch => ch.title.toLowerCase().includes(chapterSearch.toLowerCase())).map((ch, idx) => (
                        <div
                          key={ch.id}
                          onClick={() => setCurrentChapter(ch)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => e.key === 'Enter' && setCurrentChapter(ch)}
                          className={cn(
                            "w-full text-left p-3 rounded-lg text-sm transition-all relative group/chapter cursor-pointer",
                            currentChapter?.id === ch.id 
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                              : "text-zinc-400 hover:bg-zinc-800"
                          )}
                        >
                          <div className="flex justify-between items-center pr-6">
                            <span className="truncate font-medium">{ch.title}</span>
                            {ch.status === 'published' && <Clock size={12} className="text-emerald-500" />}
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                              {t.chapterPrefix || "Chapter"} {idx + 1}
                            </p>
                            <p className="text-[10px] text-zinc-600">
                              {ch.word_count} {t.words}
                            </p>
                          </div>
                          
                          <button
                            onClick={(e) => onDeleteChapterClick(e, ch.id)}
                            className="absolute top-1/2 -translate-y-1/2 right-2 p-1.5 text-zinc-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-md opacity-0 group-hover/chapter:opacity-100 transition-all"
                            title={t.deleteChapter}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-4">
                      {isBatchGenerating ? (
                        <div className="flex-1 p-2 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider animate-pulse">
                              {t.batchGenerating}...
                            </span>
                            <span className="text-[10px] font-mono text-zinc-400">
                              {batchProgress.current}/{batchProgress.total}
                            </span>
                          </div>
                          <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                            <motion.div 
                              className="h-full bg-emerald-500"
                              initial={{ width: 0 }}
                              animate={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <>
                          <button 
                            onClick={handleAddChapter}
                            className="flex-1 py-2 border border-dashed border-zinc-700 hover:border-emerald-500/50 text-zinc-500 hover:text-emerald-400 rounded-lg flex items-center justify-center gap-2 transition-all"
                          >
                            <Plus size={16} />
                            {t.addChapter}
                          </button>
                          <button 
                            onClick={() => setShowBatchModal(true)}
                            className="flex-1 py-2 border border-dashed border-zinc-700 hover:border-emerald-500/50 text-zinc-500 hover:text-emerald-400 rounded-lg flex items-center justify-center gap-2 transition-all"
                            title={t.batchGenerate}
                          >
                            <Wand2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </Card>
                </div>

                {/* Editor Area */}
                <div className="flex-1 flex flex-col gap-4">
                  {currentChapter ? (
                    <>
                      <Card className="flex-1 p-0 overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-zinc-800 flex items-center justify-between gap-4">
                          <div className="flex-1 flex items-center gap-2">
                            <input 
                              value={currentChapter.title || ""}
                              onChange={(e) => setCurrentChapter({...currentChapter, title: e.target.value})}
                              className="bg-transparent border-none text-xl font-bold text-white focus:outline-none w-full"
                            />
                            <button 
                              onClick={handleGenerateTitle}
                              disabled={isGeneratingTitle}
                              className={cn(
                                "p-1.5 rounded-lg transition-all",
                                isGeneratingTitle 
                                  ? "text-emerald-400 bg-emerald-500/10 animate-pulse" 
                                  : "text-zinc-500 hover:text-emerald-400 hover:bg-emerald-500/10"
                              )}
                              title={t.generateTitle || "Generate Title"}
                            >
                              <Sparkles size={16} className={isGeneratingTitle ? "animate-spin" : ""} />
                            </button>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-zinc-500 shrink-0">
                            <button
                              onClick={() => {
                                fetchChapterVersions(currentChapter.id);
                                setIsHistoryOpen(true);
                              }}
                              className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-zinc-800 transition-colors"
                              title={t.history}
                            >
                              <History size={12} />
                              <span>{t.history}</span>
                            </button>
                            <button
                              onClick={() => setIsMarkdownPreview(!isMarkdownPreview)}
                              className={cn(
                                "flex items-center gap-1 px-2 py-1 rounded-md transition-colors",
                                isMarkdownPreview ? "bg-emerald-500/20 text-emerald-400" : "hover:bg-zinc-800"
                              )}
                            >
                              {isMarkdownPreview ? <Eye size={12} /> : <FileText size={12} />}
                              <span>{isMarkdownPreview ? t.preview : t.edit}</span>
                            </button>
                            <span>{(currentChapter.content || "").length} {t.characters}</span>
                            <span>
                              {(() => {
                                const content = currentChapter.content || "";
                                // Simple heuristic: Chinese characters + English words
                                const chineseChars = (content.match(/[\u4e00-\u9fa5]/g) || []).length;
                                const englishWords = content.replace(/[\u4e00-\u9fa5]/g, ' ').trim().split(/\s+/).filter(w => w.length > 0).length;
                                return chineseChars + englishWords;
                              })()} {t.words}
                            </span>
                          </div>
                        </div>
                        {currentChapter.summary || isGenerating ? (
                          <div className="mx-8 mt-4 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <FileText size={14} className="text-emerald-500" />
                                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">{t.summary}</span>
                              </div>
                              <button 
                                onClick={() => setCurrentChapter({...currentChapter, summary: null})}
                                className="text-[10px] text-zinc-500 hover:text-rose-400 transition-colors"
                              >
                                {t.clear}
                              </button>
                            </div>
                            <textarea
                              value={currentChapter.summary || ""}
                              onChange={(e) => setCurrentChapter({...currentChapter, summary: e.target.value})}
                              placeholder={isGenerating ? t.aiSummarizing || "AI is summarizing..." : t.summarize + "..."}
                              className="w-full bg-transparent text-xs text-zinc-400 leading-relaxed italic resize-none focus:outline-none"
                              rows={2}
                            />
                          </div>
                        ) : null}

                        {!isMarkdownPreview && (
                          <div className="mx-8 mt-4 flex items-center gap-2">
                            <div className="relative flex-1">
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
                                onDelete={setPromptToDelete}
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
                                onDelete={setPromptToDelete}
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
                                onDelete={setPromptToDelete}
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
                    <div className="flex-1 flex flex-center justify-center items-center text-zinc-600 bg-zinc-900/20 border border-dashed border-zinc-800 rounded-2xl">
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
                          onClick={() => onCreateOutlineVersion("")}
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
                            onKeyDown={(e) => e.key === 'Enter' && onCreateOutlineVersion(newOutlineVersionName)}
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
                                    onClick={(e) => onDeleteOutlineClick(e, activeOutline.id)}
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
                                  onDelete={setPromptToDelete}
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
                                onClick={() => onCreateOutlineVersion("")}
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
              ) : (
                <div className="flex-1 overflow-y-auto pr-2 space-y-6 pb-12">
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
                                onDelete={setPromptToDelete}
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
              )}
            </motion.div>
          )}

          {activeTab === "stats" && stats && (
            <StatsPage 
              stats={stats} 
              tokenLogs={tokenLogs} 
              tokenLogPage={tokenLogPage} 
              tokenLogTotal={tokenLogTotal} 
              tokenLogTotalPages={tokenLogTotalPages} 
              fetchTokenLogs={fetchTokenLogs} 
              t={t} 
            />
          )}

          {activeTab === "tasks" && (
            <TasksPage 
              tasks={tasks}
              novels={novels}
              setShowTaskModal={setShowTaskModal}
              handleDeleteTask={confirmDeleteTask}
              handleRunTask={handleRunTask}
              t={t}
            />
          )}

          {activeTab === "prompts" && (
            <PromptsPage 
              prompts={prompts}
              promptFilter={promptFilter}
              setPromptFilter={setPromptFilter}
              setShowPromptModal={setShowPromptModal}
              setEditingPrompt={setEditingPrompt}
              handleSetDefaultPrompt={handleActivatePrompt}
              handleDeletePrompt={setPromptToDelete}
              t={t}
            />
          )}

          {activeTab === "logs" && (
            <LogsPage 
              logs={logs}
              logPage={logPage}
              logTotal={logTotal}
              logTotalPages={logTotalPages}
              fetchLogs={fetchLogs}
              t={t}
            />
          )}

          {activeTab === "ai-config" && (
            <AIConfigPage 
              aiConfigs={aiConfigs}
              activeProvider={activeProvider}
              setActiveProvider={setActiveProvider}
              setAiConfigs={setAiConfigs}
              handleTestConnection={handleTestConnection}
              handleSaveAIConfig={handleSaveAIConfig}
              isTesting={isTesting}
              testResult={testResult}
              setTestResult={setTestResult}
              t={t}
            />
          )}

          {activeTab === "settings" && (
            <SettingsPage 
              writingConfig={writingConfig}
              setWritingConfig={setWritingConfig}
              handleResetSettings={handleResetSettings}
              aiConfig={aiConfig}
              lang={lang}
              setToast={setToast}
              t={t}
            />
          )}
        </AnimatePresence>
      </main>
      {/* Task Creation Modal */}
      <AnimatePresence>
        {showTaskModal && (
          <TaskModal 
            newTask={newTask}
            setNewTask={setNewTask}
            novels={novels}
            onClose={() => setShowTaskModal(false)}
            onCreateTask={handleCreateTask}
            t={t}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPromptModal && (
          <PromptModal 
            editingPrompt={editingPrompt}
            setEditingPrompt={setEditingPrompt}
            onClose={() => setShowPromptModal(false)}
            onSave={handleSavePrompt}
            t={t}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOutlinePreview && activeOutline && (
          <OutlinePreviewModal 
            activeOutline={activeOutline}
            onClose={() => setIsOutlinePreview(false)}
            t={t}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isPlotAssistantOpen && selectedNovel && (
          <PlotAssistant 
            novel={selectedNovel} 
            aiConfig={aiConfig}
            language={lang}
            onClose={() => setIsPlotAssistantOpen(false)} 
            currentChapter={currentChapter}
            setToast={setToast}
            onUpdateChapter={async (content, mode = 'replace') => {
              if (currentChapter) {
                // Ensure version is saved before modification
                await saveChapterVersion(currentChapter.id);
                
                const newContent = mode === 'append' 
                  ? (currentChapter.content || "") + "\n\n" + content 
                  : content;

                const updated = { ...currentChapter, content: newContent };
                setCurrentChapter(updated);
                
                // Use handleSaveChapter to save and update lastSavedContentRef
                await handleSaveChapter(false, updated);
                
                setToast({ 
                  message: ((mode === 'append' ? (t as any).append : (t as any).replace) || t.completed) + " " + t.completed, 
                  type: 'success' 
                });
              }
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isHistoryOpen && currentChapter && (
          <HistoryModal 
            currentChapter={currentChapter}
            chapterVersions={chapterVersions}
            isSavingVersion={isSavingVersion}
            isRestoringVersion={isRestoringVersion}
            onClose={() => setIsHistoryOpen(false)}
            onSaveVersion={saveChapterVersion}
            onRestoreVersion={restoreChapterVersion}
            t={t}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <Toast 
            message={toast.message} 
            type={toast.type} 
            onClose={() => setToast(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

import React, { useState, useEffect, useRef } from "react";
import { 
  LayoutDashboard, 
  BookOpen, 
  BarChart3, 
  Settings, 
  Plus, 
  Save, 
  Send, 
  Calendar, 
  Sparkles,
  ChevronRight,
  Clock,
  Eye,
  Languages,
  Trash2,
  Square,
  User,
  FileText,
  Cpu,
  Download,
  FileDown,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn, formatDate } from "./lib/utils";
import { Novel, Chapter, TokenStats, OutlineVersion, AIConfig, AIProvider, WritingConfig, ContentLayout, Platform, ScheduledTask, Prompt, OperationLog, AIConfigDetail, TokenLog, Language } from "./types";
import { translations } from "./constants";

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

import { CreateNovelModal } from "./components/modals/CreateNovelModal";
import { DeleteConfirmModal } from "./components/modals/DeleteConfirmModal";
import { BatchGenerateModal } from "./components/modals/BatchGenerateModal";
import { PreviewModal } from "./components/modals/PreviewModal";
import Toast from "./components/ui/Toast";
import PlotAssistant from "./components/PlotAssistant";
import Logo from "./components/Logo";

import TaskModal from "./components/modals/TaskModal";
import PromptModal from "./components/modals/PromptModal";
import OutlinePreviewModal from "./components/modals/OutlinePreviewModal";
import HistoryModal from "./components/modals/HistoryModal";

import { useInkFlow } from "./hooks/useInkFlow";

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
                <EditorPage
                  chapters={chapters}
                  chapterSearch={chapterSearch}
                  setChapterSearch={setChapterSearch}
                  currentChapter={currentChapter}
                  setCurrentChapter={setCurrentChapter}
                  handleCreateChapter={handleAddChapter}
                  onDeleteChapterClick={onDeleteChapterClick}
                  isMarkdownPreview={isMarkdownPreview}
                  contentSearch={contentSearch}
                  setContentSearch={setContentSearch}
                  setLastSearchIndex={setLastSearchIndex}
                  handleSearchContent={handleSearchContent}
                  textareaRef={textareaRef}
                  isGenerating={isGenerating}
                  isSegmenting={isSegmenting}
                  abortController={abortController}
                  handleAIWrite={handleAIWrite}
                  prompts={prompts}
                  selectedTemplates={selectedTemplates}
                  setSelectedTemplates={setSelectedTemplates}
                  onDeletePromptClick={onDeletePromptClick}
                  isPolishing={isPolishing}
                  handleRefactorChapter={handleRefactorChapter}
                  handleGenerateSummary={handleGenerateSummary}
                  handleSegmentedWrite={handleSegmentedWrite}
                  segmentProgress={segmentProgress}
                  aiConfig={aiConfig}
                  isSaving={isSaving}
                  lastSavedAt={lastSavedAt}
                  selectedNovel={selectedNovel}
                  activeOutline={activeOutline}
                  setActiveOutline={setActiveOutline}
                  handleSaveOutline={handleSaveOutline}
                  isCreatingOutlineVersion={isCreatingOutlineVersion}
                  setIsCreatingOutlineVersion={setIsCreatingOutlineVersion}
                  newOutlineVersionName={newOutlineVersionName}
                  setNewOutlineVersionName={setNewOutlineVersionName}
                  handleCreateOutlineVersion={() => onCreateOutlineVersion(newOutlineVersionName)}
                  onDeleteOutlineClick={onDeleteOutlineClick}
                  handleActivateOutline={handleActivateOutline}
                  isOutlinePreview={isOutlinePreview}
                  setIsOutlinePreview={setIsOutlinePreview}
                  handleAIGenerateOutline={handleAIGenerateOutline}
                  isGeneratingOutline={isGeneratingOutline}
                  t={t}
                />
              ) : (
                <WorldBuildingPage
                  selectedNovel={selectedNovel}
                  handleAISupplement={handleAISupplement}
                  isSupplementing={isSupplementing}
                  chapters={chapters}
                  handleSaveNovelDetails={handleSaveNovelDetails}
                  handleCoverUpload={handleCoverUpload}
                  handleGenerateDescription={handleGenerateDescription}
                  isGenerating={isGenerating}
                  isRefactoringWorld={isRefactoringWorld}
                  handleRefactorWorldSetting={handleRefactorWorldSetting}
                  toggleEditMode={toggleEditMode}
                  editMode={editMode}
                  prompts={prompts}
                  selectedTemplates={selectedTemplates}
                  setSelectedTemplates={setSelectedTemplates}
                  onDeletePromptClick={onDeletePromptClick}
                  t={t}
                />
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

import { useState, useEffect, useRef, useCallback } from "react";
import { Novel, Chapter, TokenStats, OutlineVersion, AIConfig, AIProvider, WritingConfig, Platform, ScheduledTask, Prompt, OperationLog, AIConfigDetail, TokenLog, Language } from "../types";
import { translations } from "../constants";
import { 
  generateChapterTitle, 
  generateAIOutline, 
  generateAIContentStream, 
  generateChapterSummary, 
  generateNovelDescription, 
  refactorWorldSetting,
  extractNovelMetadata,
  generateChapterTitleFromOutline
} from "../services/aiService";
import { formatDate } from "../lib/utils";
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export function useInkFlow() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [novelSearch, setNovelSearch] = useState("");
  const [chapterSearch, setChapterSearch] = useState("");
  const [contentSearch, setContentSearch] = useState("");
  const [lastSearchIndex, setLastSearchIndex] = useState(-1);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [promptFilter, setPromptFilter] = useState<string>("all");
  const [selectedTemplates, setSelectedTemplates] = useState<Record<string, number>>({});
  const [logs, setLogs] = useState<OperationLog[]>([]);
  const [logPage, setLogPage] = useState(1);
  const [logTotalPages, setLogTotalPages] = useState(1);
  const [logTotal, setLogTotal] = useState(0);
  const [aiConfigs, setAiConfigs] = useState<AIConfigDetail[]>([]);
  const [activeProvider, setActiveProvider] = useState<AIProvider>('gemini');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const [activeTab, setActiveTab] = useState("dashboard");
  const [isPlotAssistantOpen, setIsPlotAssistantOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [chapterVersions, setChapterVersions] = useState<any[]>([]);
  const [isSavingVersion, setIsSavingVersion] = useState(false);
  const [isRestoringVersion, setIsRestoringVersion] = useState(false);
  const lastSavedContentRef = useRef<string>("");
  const [novels, setNovels] = useState<Novel[]>([]);
  const [stats, setStats] = useState<TokenStats | null>(null);
  const [tokenLogs, setTokenLogs] = useState<TokenLog[]>([]);
  const [tokenLogPage, setTokenLogPage] = useState(1);
  const [tokenLogTotalPages, setTokenLogTotalPages] = useState(1);
  const [tokenLogTotal, setTokenLogTotal] = useState(0);
  const [selectedNovel, setSelectedNovel] = useState<Novel | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);
  const [activeOutline, setActiveOutline] = useState<OutlineVersion | null>(null);
  const [isWriting, setIsWriting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);
  const [isSegmenting, setIsSegmenting] = useState(false);
  const [isPolishing, setIsPolishing] = useState(false);
  const [segmentProgress, setSegmentProgress] = useState(0);
  const [isGeneratingOutline, setIsGeneratingOutline] = useState(false);
  const [isSupplementing, setIsSupplementing] = useState(false);
  const [isRefactoringWorld, setIsRefactoringWorld] = useState(false);
  const [isOutlinePreview, setIsOutlinePreview] = useState(false);
  const [editMode, setEditMode] = useState<{ [key: string]: boolean }>({});
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isMarkdownPreview, setIsMarkdownPreview] = useState(false);
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [newTask, setNewTask] = useState<Partial<ScheduledTask>>({ type: 'generate', count: 1, recurrence: 'once' });

  const [batchCount, setBatchCount] = useState(3);
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });
  const [novelToDelete, setNovelToDelete] = useState<number | null>(null);
  const [outlineToDelete, setOutlineToDelete] = useState<number | null>(null);
  const [chapterToDelete, setChapterToDelete] = useState<number | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [promptToDelete, setPromptToDelete] = useState<number | null>(null);
  const [newNovelTitle, setNewNovelTitle] = useState("");
  const [newNovelAuthor, setNewNovelAuthor] = useState("");
  const [newNovelGenre, setNewNovelGenre] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const [aiConfig, setAiConfig] = useState<AIConfig>(() => {
    const saved = localStorage.getItem("inkflow_ai_config");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return { provider: 'gemini', model: 'gemini-3-flash-preview' };
  });

  const [writingConfig, setWritingConfig] = useState<WritingConfig>(() => {
    const saved = localStorage.getItem("inkflow_writing_config");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return { defaultAuthor: "", minWords: 1000, maxWords: 2000, layout: 'standard', enforceWordCount: true, autoSummarize: true };
  });

  const [lang, setLang] = useState<Language>('zh');
  const t = translations[lang];

  const [showPromptModal, setShowPromptModal] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Partial<Prompt> | null>(null);
  const [isCreatingOutlineVersion, setIsCreatingOutlineVersion] = useState(false);
  const [newOutlineVersionName, setNewOutlineVersionName] = useState("");

  useEffect(() => {
    localStorage.setItem("inkflow_ai_config", JSON.stringify(aiConfig));
  }, [aiConfig]);

  useEffect(() => {
    localStorage.setItem("inkflow_writing_config", JSON.stringify(writingConfig));
  }, [writingConfig]);

  useEffect(() => {
    fetchNovels();
    fetchStats();
    fetchTasks();
    fetchPrompts();
    fetchLogs();
    fetchAIConfigs();
    
    if ((activeTab === "editor" || activeTab === "world") && selectedNovel) {
      fetchNovelDetails(selectedNovel.id, currentChapter?.id);
    }
  }, [activeTab]);

  const fetchNovels = async () => {
    try {
      const res = await fetch("/api/novels");
      if (!res.ok) throw new Error(t.fetchError || "Failed to fetch novels");
      const data = await res.json();
      setNovels(data);
    } catch (e: any) {
      console.error(e);
      setToast({ message: e.message || "Failed to fetch novels", type: 'error' });
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/stats/tokens");
      if (!res.ok) throw new Error(t.fetchError || "Failed to fetch stats");
      const data = await res.json();
      setStats(data);
      await fetchTokenLogs(1);
    } catch (e: any) {
      console.error(e);
      setToast({ message: e.message || "Failed to fetch stats", type: 'error' });
    }
  };

  const fetchTokenLogs = async (page = 1) => {
    try {
      const res = await fetch(`/api/stats/logs?page=${page}&limit=20`);
      if (res.ok) {
        const data = await res.json();
        setTokenLogs(data.logs);
        setTokenLogPage(data.page);
        setTokenLogTotalPages(data.totalPages);
        setTokenLogTotal(data.total);
      }
    } catch (e) { console.error(e); }
  };

  const fetchTasks = async () => {
    try {
      const res = await fetch("/api/tasks");
      if (!res.ok) throw new Error(t.fetchError || "Failed to fetch tasks");
      const data = await res.json();
      setTasks(data);
    } catch (e: any) { console.error(e); }
  };

  const fetchPrompts = async () => {
    try {
      const res = await fetch("/api/prompts");
      if (res.ok) setPrompts(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchLogs = async (page = 1) => {
    try {
      const res = await fetch(`/api/logs?page=${page}&limit=20`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs);
        setLogPage(data.page);
        setLogTotalPages(data.totalPages);
        setLogTotal(data.total);
      }
    } catch (e) { console.error(e); }
  };

  const fetchAIConfigs = async () => {
    try {
      const res = await fetch("/api/ai-configs");
      if (res.ok) {
        const configs = await res.json();
        setAiConfigs(configs);
        const active = configs.find((c: any) => c.is_active === 1);
        if (active) {
          setActiveProvider(active.provider);
          setAiConfig({
            provider: active.provider,
            model: active.model,
            apiKey: active.api_key,
            baseUrl: active.base_url,
            parameters: active.parameters
          });
        }
      }
    } catch (e) { console.error(e); }
  };

  const fetchNovelDetails = async (id: number, keepChapterId?: number) => {
    try {
      const res = await fetch(`/api/novels/${id}`);
      if (!res.ok) throw new Error(t.fetchError || "Failed to fetch novel details");
      const data = await res.json();
      setSelectedNovel(data);
      setChapters(data.chapters || []);
      
      if (keepChapterId) {
        const updated = data.chapters?.find((c: Chapter) => c.id === keepChapterId);
        if (updated) setCurrentChapter(updated);
      } else {
        setCurrentChapter(null);
      }

      const active = data.outlines?.find((o: OutlineVersion) => o.is_active === 1) || data.outlines?.[0] || null;
      setActiveOutline(active);
      
      if (activeTab !== "editor" && activeTab !== "world") {
        setActiveTab("editor");
      }
    } catch (e: any) {
      console.error(e);
      setToast({ message: e.message || "Failed to fetch novel details", type: 'error' });
    }
  };

  const handleSaveNovelDetails = async (updates: Partial<Novel>) => {
    if (!selectedNovel) return;
    const previousNovel = { ...selectedNovel };
    const newNovel = { ...selectedNovel, ...updates };
    setSelectedNovel(newNovel);
    setNovels(novels.map(n => n.id === selectedNovel.id ? newNovel : n));

    try {
      const response = await fetch(`/api/novels/${selectedNovel.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!response.ok) {
        setSelectedNovel(previousNovel);
        setNovels(novels.map(n => n.id === selectedNovel.id ? previousNovel : n));
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || t.saveError || "Failed to save novel details");
      }
      const updatedNovel = await response.json();
      setSelectedNovel(updatedNovel);
      setNovels(novels.map(n => n.id === updatedNovel.id ? updatedNovel : n));
    } catch (error: any) {
      console.error("Failed to save novel details:", error);
      setToast({ message: error.message || "Failed to save novel details", type: 'error' });
    }
  };

  const handleCreateNovel = async (title: string, author: string, genre: string) => {
    if (!title.trim() || isCreating) return;
    setIsCreating(true);
    try {
      const res = await fetch("/api/novels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          title, 
          author: author || writingConfig.defaultAuthor,
          genre,
          description: t.newNovelDraft
        }),
      });
      if (!res.ok) throw new Error(t.createError || "Failed to create novel");
      const data = await res.json();
      setShowCreateModal(false);
      await fetchNovels();
      await fetchNovelDetails(data.id);
      setToast({ message: t.saveSettings || "Novel created successfully", type: 'success' });
      return data.id;
    } catch (error: any) {
      console.error(error);
      setToast({ message: error.message || "Failed to create novel", type: 'error' });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteNovel = async (id: number) => {
    try {
      const res = await fetch(`/api/novels/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(t.deleteError || "Failed to delete novel");
      if (selectedNovel?.id === id) {
        setSelectedNovel(null);
        setActiveTab("novels");
      }
      setNovelToDelete(null);
      fetchNovels();
      fetchStats();
      setToast({ message: t.deleteNovel + " " + t.active, type: 'success' });
    } catch (error: any) {
      console.error("Error deleting novel:", error);
      setToast({ message: error.message || "Failed to delete novel", type: 'error' });
    }
  };

  const handleSaveChapter = async (isAuto = false, updatedChapter?: Chapter) => {
    const chapterToSave = updatedChapter || currentChapter;
    if (!chapterToSave || !selectedNovel) return;
    if (isAuto && chapterToSave.content === lastSavedContentRef.current) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/chapters/${chapterToSave.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          content: chapterToSave.content,
          title: chapterToSave.title,
          summary: chapterToSave.summary
        }),
      });
      if (!res.ok) throw new Error(t.saveError || "Failed to save chapter");
      if (!isAuto || chapterToSave.content !== lastSavedContentRef.current) {
        await saveChapterVersion(chapterToSave.id);
      }
      setChapters(prev => prev.map(ch => ch.id === chapterToSave.id ? { ...ch, ...chapterToSave } : ch));
      lastSavedContentRef.current = chapterToSave.content || "";
      setLastSavedAt(new Date());
      if (!isAuto) setToast({ message: t.saveSuccess || "Saved successfully", type: 'success' });
    } catch (error: any) {
      console.error("Error saving chapter:", error);
      if (!isAuto) setToast({ message: error.message || "Failed to save chapter", type: 'error' });
    } finally { setIsSaving(false); }
  };

  const handleAddChapter = async () => {
    if (!selectedNovel) return;
    try {
      const nextChapterNum = chapters.length + 1;
      const activeOutlineContent = selectedNovel.outlines?.find(o => o.is_active === 1)?.content || "";
      let outlineTitle = getChapterTitleFromOutline(activeOutlineContent, nextChapterNum);
      
      if (!outlineTitle && activeOutlineContent) {
        setToast({ message: t.generatingTitle || "Generating chapter title from outline...", type: 'success' });
        const titleRes = await generateChapterTitleFromOutline(activeOutlineContent, nextChapterNum, aiConfig, lang);
        outlineTitle = titleRes.text;
        if (titleRes.tokens > 0) {
          await fetch("/api/token-logs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ novel_id: selectedNovel.id, operation_type: 'title', tokens: Math.round(titleRes.tokens) }),
          }).catch(console.error);
        }
      }
      
      const title = outlineTitle || `${t.chapters} ${nextChapterNum}`;
      const res = await fetch("/api/chapters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ novel_id: selectedNovel.id, title, content: "" }),
      });
      if (!res.ok) throw new Error(t.createError || "Failed to create chapter");
      const data = await res.json();
      await fetchNovelDetails(selectedNovel.id);
      setToast({ message: t.chapters + " " + t.active, type: 'success' });
      return data.id;
    } catch (error: any) {
      console.error(error);
      setToast({ message: error.message || "Failed to create chapter", type: 'error' });
    }
  };

  const handleDeleteChapter = async (chapterId: number) => {
    try {
      const res = await fetch(`/api/chapters/${chapterId}`, { method: "DELETE" });
      if (!res.ok) throw new Error(t.deleteError || "Failed to delete chapter");
      if (currentChapter?.id === chapterId) setCurrentChapter(null);
      if (selectedNovel) await fetchNovelDetails(selectedNovel.id);
      setToast({ message: t.deleteChapter + " " + t.active, type: 'success' });
    } catch (e: any) {
      console.error(e);
      setToast({ message: e.message || "Failed to delete chapter", type: 'error' });
    } finally { setChapterToDelete(null); }
  };

  const getChapterTitleFromOutline = (outlineContent: string, chapterNum: number) => {
    if (!outlineContent) return "";
    const lines = outlineContent.split('\n');
    const chapterPatterns = [
      new RegExp(`(?:Chapter|第)\\s*${chapterNum}(?!\\d|[-~])\\s*(?:[:：]|章|\\s|[\\)\\]）］])*\\s*(.+)`, 'i'),
      new RegExp(`^${chapterNum}(?!\\d|[-~])\\.\\s*(.+)`),
      new RegExp(`^${chapterNum}(?!\\d|[-~])[\\s：:](.+)`)
    ];
    const rangePattern = /(?:Chapter|第)?\s*(\d+)\s*[-~]\s*(\d+)\s*(?:[:：]|章|\\s|[\\)\\]）］])*\\s*(.+)/i;
    for (const line of lines) {
      const rangeMatch = line.match(rangePattern);
      if (rangeMatch) {
        const start = parseInt(rangeMatch[1]);
        const end = parseInt(rangeMatch[2]);
        const title = rangeMatch[3].trim();
        if (chapterNum >= start && chapterNum <= end) {
          const index = chapterNum - start + 1;
          const chineseNumbers = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十'];
          const suffix = chineseNumbers[index - 1] || index;
          return `${title} (${suffix})`;
        }
      }
      for (const pattern of chapterPatterns) {
        const match = line.match(pattern);
        if (match && match[1]) return match[1].trim();
      }
    }
    return "";
  };

  const getChapterOutlineFromOutline = (outlineContent: string, chapterNum: number) => {
    if (!outlineContent) return "";
    const lines = outlineContent.split('\n');
    let found = false;
    let result = "";
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const isCurrentChapter = getChapterTitleFromOutline(line, chapterNum);
      const isNextChapter = getChapterTitleFromOutline(line, chapterNum + 1);
      if (isCurrentChapter) {
        found = true;
        result += line + "\n";
        continue;
      }
      if (found && isNextChapter) break;
      if (found) {
        const anyChapterMatch = line.match(/^(?:Chapter|第)?\s*\d+/i);
        if (anyChapterMatch && !isCurrentChapter) break;
        result += line + "\n";
      }
    }
    return result.trim();
  };

  const fetchChapterVersions = async (chapterId: number) => {
    try {
      const res = await fetch(`/api/chapters/${chapterId}/versions`);
      if (res.ok) setChapterVersions(await res.json());
    } catch (e) { console.error(e); }
  };

  const saveChapterVersion = async (chapterId: number) => {
    if (isSavingVersion) return;
    setIsSavingVersion(true);
    try {
      const res = await fetch(`/api/chapters/${chapterId}/versions`, { method: 'POST' });
      if (res.ok) {
        await fetchChapterVersions(chapterId);
        setToast({ message: t.versionSaved, type: 'success' });
      }
    } catch (e) { console.error(e); }
    finally { setIsSavingVersion(false); }
  };

  const restoreChapterVersion = async (chapterId: number, versionId: number) => {
    setIsRestoringVersion(true);
    try {
      const res = await fetch(`/api/chapters/${chapterId}/restore-version/${versionId}`, { method: 'POST' });
      if (res.ok) {
        await fetchNovelDetails(selectedNovel!.id, chapterId);
        await fetchChapterVersions(chapterId);
        setToast({ message: t.restore + " " + t.completed, type: 'success' });
        setIsHistoryOpen(false);
      }
    } catch (e) { console.error(e); }
    finally { setIsRestoringVersion(false); }
  };

  const handleGenerateTitle = async () => {
    if (!currentChapter || !currentChapter.content || isGeneratingTitle) return;
    setIsGeneratingTitle(true);
    try {
      const { text: title, tokens } = await generateChapterTitle(currentChapter.content, aiConfig, lang);
      if (title) {
        setCurrentChapter({ ...currentChapter, title });
        await fetch(`/api/chapters/${currentChapter.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, token_usage: tokens, token_type: 'title' }),
        });
        setToast({ message: t.saveSuccess, type: 'success' });
      }
    } catch (e) {
      console.error(e);
      setToast({ message: t.aiError, type: 'error' });
    } finally { setIsGeneratingTitle(false); }
  };

  const handleGenerateDescription = async () => {
    if (!selectedNovel) return;
    const activeOutline = selectedNovel.outlines?.find(o => o.is_active === 1);
    if (!activeOutline || !activeOutline.content) {
      setToast({ message: t.outlineContextLabel + " " + t.undefinedContext, type: 'error' });
      return;
    }
    setIsGenerating(true);
    try {
      const promptTemplate = getActivePrompt('description');
      const { text: description, tokens } = await generateNovelDescription(activeOutline.content, aiConfig, lang, promptTemplate);
      if (description) {
        handleSaveNovelDetails({ description, token_usage: tokens, token_type: 'description' } as any);
        setToast({ message: t.generateDescriptionLabel + " " + t.active, type: 'success' });
      }
    } catch (error: any) {
      console.error("Error generating description:", error);
      setToast({ message: error.message || "Failed to generate description", type: 'error' });
    } finally { setIsGenerating(false); }
  };

  const handleAIWrite = async () => {
    if (!currentChapter || !selectedNovel) return;
    const controller = new AbortController();
    setAbortController(controller);
    setIsGenerating(true);
    try {
      const activeOutlineContent = selectedNovel.outlines?.find(o => o.is_active === 1)?.content || "";
      const currentContent = currentChapter.content || "";
      const layoutContext = `${t.layoutStrictContext.replace('{layout}', writingConfig.layout)}`;
      const prompt = `${layoutContext}\n\n${t.continueWritingPrompt.replace('{title}', currentChapter.title)}${currentContent.slice(-800)}`;
      const context = `${t.novelTitleContext}: ${selectedNovel.title}\n${t.outlineContextLabel}: ${activeOutlineContent}`;
      const currentIndex = chapters.findIndex(c => c.id === currentChapter.id);
      const nextChapter = currentIndex !== -1 && currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null;
      let nextChapterContext = "";
      if (nextChapter) {
        const nextChapterOutline = getChapterOutlineFromOutline(activeOutlineContent, currentIndex + 2);
        nextChapterContext = nextChapterOutline ? `下一章大纲：\n${nextChapterOutline}` : `下一章标题：${nextChapter.title}\n下一章摘要：${nextChapter.summary || "无"}`;
      }
      let streamedText = "";
      const promptTemplate = getActivePrompt('chapter');
      await saveChapterVersion(currentChapter.id);
      const stream = generateAIContentStream(prompt, context, aiConfig, writingConfig, lang, controller.signal, promptTemplate, currentContent, nextChapterContext);
      for await (const chunk of stream) {
        if (controller.signal.aborted) break;
        streamedText += chunk;
        setCurrentChapter(prev => prev ? { ...prev, content: currentContent + (currentContent ? "\n\n" : "") + streamedText } : null);
      }
      const finalContent = currentContent + (currentContent ? "\n\n" : "") + streamedText;
      await fetch(`/api/chapters/${currentChapter.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          content: finalContent,
          token_usage: Math.round((streamedText.length + prompt.length + context.length) / 4),
          token_type: 'generation'
        }),
      });
      fetchStats();
      if (writingConfig.autoSummarize) handleGenerateSummary(finalContent);
      else await fetchNovelDetails(selectedNovel.id, currentChapter.id);
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error(error);
        setToast({ message: error.message || "AI generation failed", type: 'error' });
      }
    } finally {
      setIsGenerating(false);
      setAbortController(null);
    }
  };

  const handleGenerateSummary = async (providedContent?: string) => {
    const contentToSummarize = providedContent || currentChapter?.content;
    if (!currentChapter || !selectedNovel || !contentToSummarize) return;
    setIsGenerating(true);
    try {
      const promptTemplate = getActivePrompt('summary');
      const { text: summary, tokens } = await generateChapterSummary(contentToSummarize, aiConfig, lang, promptTemplate);
      if (summary) {
        setCurrentChapter(prev => prev ? { ...prev, summary } : null);
        setChapters(prev => prev.map(ch => ch.id === currentChapter.id ? { ...ch, summary } : ch));
        const res = await fetch(`/api/chapters/${currentChapter.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ summary, token_usage: tokens, token_type: 'summary' }),
        });
        if (!res.ok) throw new Error(t.saveError || "Failed to save summary");
        setToast({ message: t.summarize + " " + t.active, type: 'success' });
      }
    } catch (error: any) {
      console.error("Error generating summary:", error);
      setToast({ message: error.message || "Failed to generate summary", type: 'error' });
    } finally { setIsGenerating(false); }
  };

  const handleSavePrompt = async () => {
    if (!editingPrompt?.name || !editingPrompt?.content || !editingPrompt?.type) return;
    try {
      const isNew = !editingPrompt.id;
      const url = isNew ? "/api/prompts" : `/api/prompts/${editingPrompt.id}`;
      const method = isNew ? "POST" : "PATCH";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingPrompt),
      });
      if (res.ok) {
        await fetchPrompts();
        setShowPromptModal(false);
        setEditingPrompt(null);
        setToast({ message: isNew ? t.promptCreated : t.promptUpdated, type: 'success' });
      }
    } catch (e) {
      console.error(e);
      setToast({ message: t.promptSaveError, type: 'error' });
    }
  };

  const handleCreateTask = async () => {
    if (!newTask.type || !newTask.scheduled_at) return;
    try {
      const taskData = {
        ...newTask,
        scheduled_at: new Date(newTask.scheduled_at).toISOString(),
        count: newTask.count || 1
      };
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData),
      });
      if (!res.ok) throw new Error(t.createError || "Failed to create task");
      setShowTaskModal(false);
      setNewTask({ type: 'generate', count: 1 });
      await fetchTasks();
      setToast({ message: t.taskCreated || "Task created", type: 'success' });
    } catch (e: any) {
      console.error(e);
      setToast({ message: e.message || "Failed to create task", type: 'error' });
    }
  };

  const getActivePrompt = (type: string) => {
    const selectedId = selectedTemplates[type];
    if (selectedId) return prompts.find(p => p.id === selectedId)?.content;
    return prompts.find(p => p.type === type && p.is_default === 1)?.content;
  };

  const handleSearchContent = (query: string, textarea: HTMLTextAreaElement | null) => {
    if (!query || !textarea || !currentChapter?.content) return;
    const content = currentChapter.content.toLowerCase();
    const lcQuery = query.toLowerCase();
    let nextIndex = content.indexOf(lcQuery, lastSearchIndex + 1);
    if (nextIndex === -1) nextIndex = content.indexOf(lcQuery);
    if (nextIndex !== -1) {
      setLastSearchIndex(nextIndex);
      textarea.focus();
      textarea.setSelectionRange(nextIndex, nextIndex + lcQuery.length);
      const style = window.getComputedStyle(textarea);
      const mirror = document.createElement('div');
      mirror.style.fontFamily = style.fontFamily;
      mirror.style.fontSize = style.fontSize;
      mirror.style.fontWeight = style.fontWeight;
      mirror.style.lineHeight = style.lineHeight;
      mirror.style.paddingLeft = style.paddingLeft;
      mirror.style.paddingRight = style.paddingRight;
      mirror.style.paddingTop = style.paddingTop;
      mirror.style.paddingBottom = style.paddingBottom;
      mirror.style.borderWidth = style.borderWidth;
      mirror.style.boxSizing = style.boxSizing;
      mirror.style.width = `${textarea.clientWidth}px`;
      mirror.style.whiteSpace = 'pre-wrap';
      mirror.style.wordWrap = 'break-word';
      mirror.style.position = 'absolute';
      mirror.style.visibility = 'hidden';
      mirror.style.top = '0';
      mirror.style.left = '-9999px';
      const textBefore = currentChapter.content.substring(0, nextIndex);
      mirror.textContent = textBefore;
      const marker = document.createElement('span');
      marker.textContent = currentChapter.content.substring(nextIndex, nextIndex + lcQuery.length);
      mirror.appendChild(marker);
      document.body.appendChild(mirror);
      const offsetTop = marker.offsetTop;
      document.body.removeChild(mirror);
      const containerHeight = textarea.clientHeight;
      textarea.scrollTop = offsetTop - (containerHeight / 2);
    }
  };

  const handleExportNovel = async (novel: Novel, format: 'markdown' | 'epub') => {
    try {
      setToast({ message: t.exporting, type: 'info' });
      const res = await fetch(`/api/novels/${novel.id}`);
      if (!res.ok) throw new Error(t.fetchError);
      const data = await res.json();
      const chapters: Chapter[] = data.chapters || [];
      if (format === 'markdown') {
        let content = `# ${novel.title}\n\n`;
        if (novel.description) content += `## ${t.novelDescription}\n${novel.description}\n\n`;
        chapters.forEach((ch, index) => {
          const chapterHeader = `${t.chapterPrefix}${index + 1}${t.chapterSuffix || ''} ${ch.title}`.trim();
          content += `## ${chapterHeader}\n\n`;
          const cleanContent = (ch.content || "").trim().replace(/^#+\s+.*\n+/, "").trim();
          content += `${cleanContent}\n\n`;
        });
        const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
        saveAs(blob, `${novel.title}.md`);
      } else if (format === 'epub') {
        const zip = new JSZip();
        zip.file("mimetype", "application/epub+zip", { compression: "STORE" });
        const containerXml = `<?xml version="1.0" encoding="UTF-8"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>`;
        zip.folder("META-INF").file("container.xml", containerXml);
        const contentOpf = `<?xml version="1.0" encoding="UTF-8"?><package xmlns="http://www.idpf.org/2007/opf" unique-identifier="pub-id" version="3.0"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:identifier id="pub-id">urn:uuid:${novel.id}</dc:identifier><dc:title>${novel.title}</dc:title><dc:language>zh</dc:language><dc:creator>InkFlow</dc:creator><meta property="dcterms:modified">${new Date().toISOString().replace(/\.\d+Z$/, "Z")}</meta></metadata><manifest><item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>${chapters.map((_, i) => `<item id="ch${i}" href="ch${i}.xhtml" media-type="application/xhtml+xml"/>`).join('\n    ')}<item id="css" href="style.css" media-type="text/css"/></manifest><spine><itemref idref="nav"/>${chapters.map((_, i) => `<itemref idref="ch${i}"/>`).join('\n    ')}</spine></package>`;
        const oebps = zip.folder("OEBPS");
        oebps.file("content.opf", contentOpf);
        oebps.file("style.css", "body { font-family: sans-serif; line-height: 1.6; padding: 1em; } h1, h2, h3 { text-align: center; } p { text-indent: 2em; margin: 0.5em 0; }");
        const navXhtml = `<?xml version="1.0" encoding="UTF-8"?><html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops"><head><title>Navigation</title></head><body><nav epub:type="toc"><h1>${novel.title}</h1><ol>${chapters.map((ch, i) => { const chapterTitle = `${t.chapterPrefix}${i + 1}${t.chapterSuffix || ''} ${ch.title}`.trim(); return `<li><a href="ch${i}.xhtml">${chapterTitle}</a></li>`; }).join('\n      ')}</ol></nav></body></html>`;
        oebps.file("nav.xhtml", navXhtml);
        chapters.forEach((ch, i) => {
          const chapterTitle = `${t.chapterPrefix}${i + 1}${t.chapterSuffix || ''} ${ch.title}`.trim();
          const chXhtml = `<?xml version="1.0" encoding="UTF-8"?><html xmlns="http://www.w3.org/1999/xhtml"><head><title>${chapterTitle}</title><link rel="stylesheet" type="text/css" href="style.css"/></head><body><h2>${chapterTitle}</h2>${(ch.content || "").split('\n').filter(p => p.trim()).map(p => `<p>${p.trim()}</p>`).join('\n  ')}</body></html>`;
          oebps.file(`ch${i}.xhtml`, chXhtml);
        });
        const blob = await zip.generateAsync({ type: "blob" });
        saveAs(blob, `${novel.title}.epub`);
      }
      setToast({ message: t.exportSuccess, type: 'success' });
    } catch (error) {
      console.error("Export error:", error);
      setToast({ message: t.exportError, type: 'error' });
    }
  };

  const handleRefactorWorldSetting = async () => {
    if (!selectedNovel || !selectedNovel.world_setting) return;
    setIsRefactoringWorld(true);
    try {
      const promptTemplate = getActivePrompt('refactor');
      const { text: refactored, tokens } = await refactorWorldSetting(selectedNovel.world_setting, aiConfig, lang, promptTemplate);
      if (refactored) {
        await handleSaveNovelDetails({ world_setting: refactored, token_usage: tokens, token_type: 'refactor' } as any);
      }
    } catch (error: any) {
      console.error("Error refactoring world setting:", error);
      setToast({ message: error.message || "Failed to refactor world setting", type: 'error' });
    } finally { setIsRefactoringWorld(false); }
  };

  const handleAISupplement = async () => {
    if (!selectedNovel || isSupplementing) return;
    setIsSupplementing(true);
    try {
      const result = await extractNovelMetadata(chapters, { characters: selectedNovel.characters || "", storylines: selectedNovel.storylines || "", world_setting: selectedNovel.world_setting || "", relationships: selectedNovel.relationships || "" }, aiConfig, lang);
      if (result && result.data) {
        await handleSaveNovelDetails({ ...result.data, last_supplement_at: new Date().toISOString(), token_usage: result.usage?.total_tokens || 0, token_type: 'supplement' } as any);
      }
    } catch (error: any) {
      console.error("Failed to supplement novel metadata:", error);
      setToast({ message: error.message || "Failed to update novel metadata", type: 'error' });
    } finally { setIsSupplementing(false); }
  };

  const handleSegmentedWrite = async () => {
    if (!currentChapter || !selectedNovel) return;
    const controller = new AbortController();
    setAbortController(controller);
    setIsSegmenting(true);
    setSegmentProgress(0);
    try {
      const activeOutlineContent = selectedNovel.outlines?.find(o => o.is_active === 1)?.content || "";
      let currentContent = currentChapter.content || "";
      let totalTokens = 0;
      const segments = 3;
      for (let i = 0; i < segments; i++) {
        if (controller.signal.aborted) break;
        setSegmentProgress(Math.round(((i) / segments) * 100));
        const layoutContext = `${t.segmentedWritePrompt.replace('{layout}', writingConfig.layout)}`;
        const prompt = `${layoutContext}\n\n${t.segmentedPartPrompt.replace('{title}', currentChapter.title).replace('{current}', (i + 1).toString()).replace('{total}', segments.toString())}\n${i > 0 ? t.segmentedContinuePrompt : t.segmentedStartPrompt} \n\n${t.contextBackground}：${currentContent.slice(-1000)}`;
        const context = `${t.novelTitleContext}: ${selectedNovel.title}\n${t.outlineContextLabel}: ${activeOutlineContent}`;
        const currentIndex = chapters.findIndex(c => c.id === currentChapter.id);
        const nextChapter = currentIndex !== -1 && currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null;
        let nextChapterContext = "";
        if (nextChapter) {
          const nextChapterOutline = getChapterOutlineFromOutline(activeOutlineContent, currentIndex + 2);
          nextChapterContext = nextChapterOutline ? `下一章大纲：\n${nextChapterOutline}` : `下一章标题：${nextChapter.title}\n下一章摘要：${nextChapter.summary || "无"}`;
        }
        let streamedText = "";
        const promptTemplate = getActivePrompt('chapter');
        const stream = generateAIContentStream(prompt, context, aiConfig, writingConfig, lang, controller.signal, promptTemplate, currentContent, nextChapterContext);
        for await (const chunk of stream) {
          if (controller.signal.aborted) break;
          streamedText += chunk;
          setCurrentChapter(prev => prev ? { ...prev, content: currentContent + (currentContent ? "\n\n" : "") + streamedText } : null);
        }
        currentContent += (currentContent ? "\n\n" : "") + streamedText;
        totalTokens += (streamedText.length + prompt.length + context.length) / 4;
        if (currentContent.length > writingConfig.maxWords * 0.8 && i < segments - 1) break;
      }
      setSegmentProgress(100);
      await fetch(`/api/chapters/${currentChapter.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: currentContent, token_usage: Math.round(totalTokens), token_type: 'generation' }),
      });
      fetchStats();
      if (writingConfig.autoSummarize) handleGenerateSummary(currentContent);
      else await fetchNovelDetails(selectedNovel.id, currentChapter.id);
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error("Segmented Write Error:", error);
        setToast({ message: error.message || "Segmented writing failed", type: 'error' });
      }
    } finally {
      setIsSegmenting(false);
      setSegmentProgress(0);
      setAbortController(null);
    }
  };

  const handleAIGenerateOutline = async () => {
    if (!selectedNovel) return;
    setIsGeneratingOutline(true);
    try {
      const promptTemplate = getActivePrompt('outline');
      const result = await generateAIOutline(selectedNovel.title, selectedNovel.description || "小说", aiConfig, lang, promptTemplate);
      const res = await fetch(`/api/novels/${selectedNovel.id}/outlines`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version_name: `${t.aiGenerated || "AI Generated"} ${formatDate(new Date(), "HH:mm")}`, content: result.text, token_usage: result.tokens }),
      });
      if (res.ok) {
        await fetchNovelDetails(selectedNovel.id);
        setToast({ message: t.generateOutline + " " + t.active, type: 'success' });
      }
    } catch (error: any) {
      console.error(error);
      setToast({ message: error.message || "Failed to generate outline", type: 'error' });
    } finally { setIsGeneratingOutline(false); }
  };

  const handleBatchGenerate = async () => {
    if (!selectedNovel || isBatchGenerating) return;
    const targetChapters = selectedNovel.target_chapters || 50;
    const remainingChapters = Math.max(0, targetChapters - chapters.length);
    const actualBatchCount = Math.min(batchCount, remainingChapters);
    if (actualBatchCount <= 0) return;

    setIsBatchGenerating(true);
    setBatchProgress({ current: 0, total: actualBatchCount });
    try {
      for (let i = 0; i < actualBatchCount; i++) {
        setBatchProgress(prev => ({ ...prev, current: i + 1 }));
        const chapterId = await handleAddChapter();
        if (!chapterId) break;
        const activeOutlineContent = selectedNovel.outlines?.find(o => o.is_active === 1)?.content || "";
        const nextChapterNum = chapters.length + i + 1;
        const chapterTitle = getChapterTitleFromOutline(activeOutlineContent, nextChapterNum);
        const chapterOutline = getChapterOutlineFromOutline(activeOutlineContent, nextChapterNum);
        const layoutContext = `${t.layoutStrictContext.replace('{layout}', writingConfig.layout)}`;
        const prompt = `${layoutContext}\n\n当前章节大纲：\n${chapterOutline}\n\n${t.continueWritingPrompt.replace('{title}', chapterTitle)}`;
        const context = `${t.novelTitleContext}: ${selectedNovel.title}\n${t.outlineContextLabel}: ${activeOutlineContent}`;
        let generatedText = "";
        const promptTemplate = getActivePrompt('chapter');
        const stream = generateAIContentStream(prompt, context, aiConfig, writingConfig, lang, null, promptTemplate);
        for await (const chunk of stream) { generatedText += chunk; }
        await fetch(`/api/chapters/${chapterId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: generatedText, token_usage: Math.round((generatedText.length + prompt.length + context.length) / 4), token_type: 'generation' }),
        });
      }
      await fetchNovelDetails(selectedNovel.id);
      setToast({ message: t.batchGenerateSuccess || "Batch generate success", type: 'success' });
    } catch (e: any) {
      console.error(e);
      setToast({ message: e.message || "Batch generation failed", type: 'error' });
    } finally {
      setIsBatchGenerating(false);
      setShowBatchModal(false);
    }
  };

  const handleRefactorChapterStream = async () => {
    if (!currentChapter || !selectedNovel || !currentChapter.content) return;
    const controller = new AbortController();
    setAbortController(controller);
    setIsPolishing(true);
    try {
      const activeOutlineContent = selectedNovel.outlines?.find(o => o.is_active === 1)?.content || "";
      const currentContent = currentChapter.content;
      const prompt = `${t.refactorPrompt}\n\n${currentContent}`;
      const context = `${t.novelTitleContext}: ${selectedNovel.title}\n${t.outlineContextLabel}: ${activeOutlineContent}`;
      let streamedText = "";
      const promptTemplate = getActivePrompt('polish');
      await saveChapterVersion(currentChapter.id);
      const stream = generateAIContentStream(prompt, context, aiConfig, writingConfig, lang, controller.signal, promptTemplate);
      for await (const chunk of stream) {
        if (controller.signal.aborted) break;
        streamedText += chunk;
        setCurrentChapter(prev => prev ? { ...prev, content: streamedText } : null);
      }
      await fetch(`/api/chapters/${currentChapter.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: streamedText, token_usage: Math.round((streamedText.length + prompt.length + context.length) / 4), token_type: 'polish' }),
      });
      fetchStats();
      await fetchNovelDetails(selectedNovel.id, currentChapter.id);
      setToast({ message: t.polishing + " " + t.completed, type: 'success' });
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error(error);
        setToast({ message: error.message || "Polishing failed", type: 'error' });
      }
    } finally {
      setIsPolishing(false);
      setAbortController(null);
    }
  };

  const handleSaveOutline = async () => {
    if (!activeOutline || !selectedNovel) return;
    try {
      const res = await fetch(`/api/outlines/${activeOutline.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: activeOutline.content, version_name: activeOutline.version_name }),
      });
      if (!res.ok) throw new Error(t.saveError || "Failed to save outline");
      fetchNovelDetails(selectedNovel.id);
      setToast({ message: t.saveSettings || "Outline saved", type: 'success' });
    } catch (error: any) {
      console.error(error);
      setToast({ message: error.message || "Failed to save outline", type: 'error' });
    }
  };

  const handleCreateOutlineVersion = async (name: string) => {
    if (!selectedNovel) return;
    try {
      const res = await fetch(`/api/novels/${selectedNovel.id}/outlines`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version_name: name, content: activeOutline?.content || "" }),
      });
      if (!res.ok) throw new Error(t.createError || "Failed to create outline version");
      await fetchNovelDetails(selectedNovel.id);
      setToast({ message: t.newVersion + " " + t.active, type: 'success' });
      setIsCreatingOutlineVersion(false);
      setNewOutlineVersionName("");
    } catch (error: any) {
      console.error(error);
      setToast({ message: error.message || "Failed to create outline version", type: 'error' });
    }
  };

  const handleActivateOutline = async (id: number) => {
    if (!selectedNovel) return;
    try {
      const res = await fetch(`/api/outlines/${id}/activate`, { method: "PATCH" });
      if (!res.ok) throw new Error(t.saveError || "Failed to activate outline");
      fetchNovelDetails(selectedNovel.id);
      setToast({ message: t.activate + " " + t.active, type: 'success' });
    } catch (error: any) {
      console.error(error);
      setToast({ message: error.message || "Failed to activate outline", type: 'error' });
    }
  };

  const handleDeleteOutlineVersion = async (id: number) => {
    if (!selectedNovel) return;
    try {
      const res = await fetch(`/api/outlines/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(t.deleteError || "Failed to delete outline version");
      fetchNovelDetails(selectedNovel.id);
      setToast({ message: t.deleteSuccess || "Deleted successfully", type: 'success' });
      setOutlineToDelete(null);
    } catch (error: any) {
      console.error(error);
      setToast({ message: error.message || "Failed to delete outline version", type: 'error' });
    }
  };

  const handleSaveAIConfig = async (config: any) => {
    try {
      const res = await fetch("/api/ai-configs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (res.ok) {
        setToast({ message: t.settingsSaved, type: 'success' });
        await fetchAIConfigs();
        setAiConfig({ provider: config.provider, model: config.model, apiKey: config.api_key, baseUrl: config.base_url, parameters: config.parameters });
      }
    } catch (e) { setToast({ message: t.saveError, type: 'error' }); }
  };

  const handleRunTask = async (id: number) => {
    try {
      const res = await fetch(`/api/tasks/${id}/run`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to run task");
      setToast({ message: t.taskStarted, type: 'success' });
      await fetchTasks();
    } catch (e: any) {
      console.error(e);
      setToast({ message: e.message || "Failed to run task", type: 'error' });
    }
  };

  const handleDeleteTask = async (id: number) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(t.deleteError || "Failed to delete task");
      await fetchTasks();
      setToast({ message: t.taskDeleted || "Task deleted", type: 'success' });
    } catch (e: any) {
      console.error(e);
      setToast({ message: e.message || "Failed to delete task", type: 'error' });
    }
  };

  const handleDeletePrompt = async (id: number) => {
    try {
      const res = await fetch(`/api/prompts/${id}`, { method: "DELETE" });
      if (res.ok) {
        await fetchPrompts();
        setSelectedTemplates(prev => {
          const next = { ...prev };
          Object.keys(next).forEach(key => { if (next[key] === id) delete next[key]; });
          return next;
        });
        setToast({ message: t.promptDeleted || "模板已删除", type: 'success' });
      }
    } catch (e) { console.error(e); }
    finally { setPromptToDelete(null); }
  };

  const handleActivatePrompt = async (id: number) => {
    try {
      const res = await fetch(`/api/prompts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_default: 1 }),
      });
      if (res.ok) {
        await fetchPrompts();
        setToast({ message: t.promptSetDefault, type: 'success' });
      }
    } catch (e) { console.error(e); }
  };

  const handleTestConnection = async (config: any) => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/ai-configs/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      setTestResult({ success: data.success, message: data.success ? data.message : data.error });
    } catch (e: any) { setTestResult({ success: false, message: e.message }); }
    finally { setIsTesting(false); }
  };

  const handleResetSettings = () => {
    const defaultAIConfig: AIConfig = { provider: "gemini", model: "gemini-3-flash-preview", apiKey: "", baseUrl: "", parameters: JSON.stringify({ temperature: 0.7, max_tokens: 4000, top_p: 0.95, top_k: 40 }) };
    const defaultWritingConfig: WritingConfig = { minWords: 2000, maxWords: 5000, layout: "standard", enforceWordCount: true, autoSummarize: true };
    setAiConfig(defaultAIConfig);
    setWritingConfig(defaultWritingConfig);
    localStorage.setItem("inkflow_ai_config", JSON.stringify(defaultAIConfig));
    localStorage.setItem("inkflow_writing_config", JSON.stringify(defaultWritingConfig));
    setToast({ message: t.settingsSaved || "Settings reset to default", type: 'success' });
    setShowResetConfirm(false);
  };

  return {
    fetchNovels, fetchStats, fetchTokenLogs, fetchTasks, fetchPrompts, fetchLogs, fetchAIConfigs, fetchNovelDetails,
    handleSaveNovelDetails, handleCreateNovel, handleDeleteNovel, handleSaveChapter, handleAddChapter, handleDeleteChapter,
    fetchChapterVersions, saveChapterVersion, restoreChapterVersion, getChapterTitleFromOutline, getChapterOutlineFromOutline,
    handleGenerateTitle, handleGenerateDescription, handleAIWrite, handleGenerateSummary, handleSavePrompt, handleCreateTask, getActivePrompt,
    handleSearchContent, handleExportNovel, handleRefactorWorldSetting, handleAISupplement, handleSegmentedWrite, handleAIGenerateOutline, handleBatchGenerate,
    handleRefactorChapterContent: handleRefactorChapterStream,
    handleSaveOutline, handleCreateOutlineVersion, handleActivateOutline, handleDeleteOutlineVersion,
    handleSaveAIConfig, handleRunTask, handleDeleteTask, handleDeletePrompt, handleActivatePrompt, handleTestConnection, handleResetSettings,

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
    isCreatingOutlineVersion, setIsCreatingOutlineVersion, newOutlineVersionName, setNewOutlineVersionName, lastSavedContentRef
  };
}

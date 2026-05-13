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

// UI Components
import SidebarItem from "./components/ui/SidebarItem";
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

const ChapterPreview = React.memo(({ ch, idx, t }: { ch: Chapter, idx: number, t: any }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '800px' }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div 
      ref={ref} 
      id={`preview-chapter-${ch.id}`} 
      className="space-y-8 scroll-mt-24 min-h-[100px]"
      style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 500px' } as any}
    >
      <div className="flex items-center gap-4">
        <div className="h-px flex-1 bg-zinc-800"></div>
        <h2 className="text-2xl font-bold text-emerald-400">{t.chapterPrefix || "Chapter"} {idx + 1}{t.chapterSuffix || ""}：{ch.title}</h2>
        <div className="h-px flex-1 bg-zinc-800"></div>
      </div>
      <div className="text-zinc-300 text-lg leading-loose whitespace-pre-wrap font-serif markdown-body">
        {isVisible ? (
          <Markdown remarkPlugins={[remarkGfm]}>
            {ch.content || t.noContent}
          </Markdown>
        ) : (
          <div className="h-40 flex items-center justify-center text-zinc-800 border border-dashed border-zinc-800 rounded-xl">
            <RefreshCw className="animate-spin opacity-20" size={24} />
          </div>
        )}
      </div>
    </div>
  );
});

// --- Main App ---

export default function App() {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const handleSearchContent = () => {
    if (!contentSearch || !textareaRef.current || !currentChapter?.content) return;

    const content = currentChapter.content.toLowerCase();
    const query = contentSearch.toLowerCase();
    let nextIndex = content.indexOf(query, lastSearchIndex + 1);

    if (nextIndex === -1) {
      // Loop back to start
      nextIndex = content.indexOf(query);
    }

    if (nextIndex !== -1) {
      setLastSearchIndex(nextIndex);
      const textarea = textareaRef.current;
      
      textarea.focus();
      textarea.setSelectionRange(nextIndex, nextIndex + query.length);

      // Create a mirror element to calculate the scroll position accurately
      const style = window.getComputedStyle(textarea);
      const mirror = document.createElement('div');
      
      // Copy relevant styles for accurate measurement
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
      
      // Set content up to the match
      const textBefore = currentChapter.content.substring(0, nextIndex);
      mirror.textContent = textBefore;
      
      // Add a marker for the match
      const marker = document.createElement('span');
      marker.textContent = currentChapter.content.substring(nextIndex, nextIndex + query.length);
      mirror.appendChild(marker);
      
      document.body.appendChild(mirror);
      const offsetTop = marker.offsetTop;
      document.body.removeChild(mirror);

      // Scroll the textarea to center the match
      const containerHeight = textarea.clientHeight;
      textarea.scrollTop = offsetTop - (containerHeight / 2);
    }
  };
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

  const toggleEditMode = (section: string) => {
    setEditMode(prev => ({ ...prev, [section]: !prev[section] }));
  };
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
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    if ((isGenerating || isSegmenting || isBatchGenerating) && textareaRef.current) {
      const textarea = textareaRef.current;
      requestAnimationFrame(() => {
        textarea.scrollTop = textarea.scrollHeight;
      });
    }
  }, [currentChapter?.content, isGenerating, isSegmenting, isBatchGenerating]);

  useEffect(() => {
    if (currentChapter) {
      lastSavedContentRef.current = currentChapter.content || "";
    }
  }, [currentChapter?.id]);

  // Auto-save logic
  useEffect(() => {
    if (!currentChapter || isGenerating || isWriting || isSegmenting || isBatchGenerating) return;
    
    // Only auto-save if content has changed
    if (currentChapter.content === lastSavedContentRef.current) return;

    const timer = setTimeout(() => {
      handleSaveChapter(true);
    }, 10000); // Auto-save after 10 seconds of inactivity

    return () => clearTimeout(timer);
  }, [currentChapter?.content, currentChapter?.title, currentChapter?.summary]);

  const [aiConfig, setAiConfig] = useState<AIConfig>(() => {
    const saved = localStorage.getItem("inkflow_ai_config");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      provider: 'gemini',
      model: 'gemini-3-flash-preview',
    };
  });

  const [writingConfig, setWritingConfig] = useState<WritingConfig>(() => {
    const saved = localStorage.getItem("inkflow_writing_config");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      defaultAuthor: "",
      minWords: 1000,
      maxWords: 2000,
      layout: 'standard',
      enforceWordCount: true,
      autoSummarize: true,
    };
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
    
    // If we are in novel view, also refresh the selected novel details
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
      
      // Also fetch token logs
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
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTasks = async () => {
    try {
      const res = await fetch("/api/tasks");
      if (!res.ok) throw new Error(t.fetchError || "Failed to fetch tasks");
      const data = await res.json();
      setTasks(data);
    } catch (e: any) {
      console.error(e);
    }
  };

  const fetchPrompts = async () => {
    try {
      const res = await fetch("/api/prompts");
      if (res.ok) setPrompts(await res.json());
    } catch (e) { console.error(e); }
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

  const handleSetDefaultPrompt = async (id: number, type: string) => {
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
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeletePrompt = (id: number) => {
    setPromptToDelete(id);
  };

  const confirmDeletePrompt = async () => {
    if (promptToDelete === null) return;
    try {
      const res = await fetch(`/api/prompts/${promptToDelete}`, { method: "DELETE" });
      if (res.ok) {
        await fetchPrompts();
        setSelectedTemplates(prev => {
          const next = { ...prev };
          Object.keys(next).forEach(key => {
            if (next[key] === promptToDelete) delete next[key];
          });
          return next;
        });
        setToast({ message: t.promptDeleted || "模板已删除", type: 'success' });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPromptToDelete(null);
    }
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

  const getActivePrompt = (type: string) => {
    const selectedId = selectedTemplates[type];
    if (selectedId) {
      return prompts.find(p => p.id === selectedId)?.content;
    }
    return prompts.find(p => p.type === type && p.is_default === 1)?.content;
  };

  const fetchAIConfigs = async () => {
    try {
      const res = await fetch("/api/ai-configs");
      if (res.ok) {
        const configs = await res.json();
        setAiConfigs(configs);
        // Set active provider to the one currently in use on initial load
        const active = configs.find((c: any) => c.is_active === 1);
        if (active) {
          setActiveProvider(active.provider);
          // Normalize config to match AIConfig interface (camelCase)
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
      
      // Only switch to editor if we're not already in a novel-related view
      if (activeTab !== "editor" && activeTab !== "world") {
        setActiveTab("editor");
      }
    } catch (e: any) {
      console.error(e);
      setToast({ message: e.message || "Failed to fetch novel details", type: 'error' });
    }
  };

  const exportNovel = async (novel: Novel, format: 'markdown' | 'epub') => {
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
          // Strip leading # headers from content to avoid double headers or H1 issues
          const cleanContent = (ch.content || "").trim().replace(/^#+\s+.*\n+/, "").trim();
          content += `${cleanContent}\n\n`;
        });

        const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
        saveAs(blob, `${novel.title}.md`);
      } else if (format === 'epub') {
        const zip = new JSZip();
        
        // EPUB structure
        zip.file("mimetype", "application/epub+zip", { compression: "STORE" });
        
        const containerXml = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;
        zip.folder("META-INF").file("container.xml", containerXml);

        const contentOpf = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="pub-id" version="3.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="pub-id">urn:uuid:${novel.id}</dc:identifier>
    <dc:title>${novel.title}</dc:title>
    <dc:language>zh</dc:language>
    <dc:creator>InkFlow</dc:creator>
    <meta property="dcterms:modified">${new Date().toISOString().replace(/\.\d+Z$/, "Z")}</meta>
  </metadata>
  <manifest>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    ${chapters.map((_, i) => `<item id="ch${i}" href="ch${i}.xhtml" media-type="application/xhtml+xml"/>`).join('\n    ')}
    <item id="css" href="style.css" media-type="text/css"/>
  </manifest>
  <spine>
    <itemref idref="nav"/>
    ${chapters.map((_, i) => `<itemref idref="ch${i}"/>`).join('\n    ')}
  </spine>
</package>`;
        
        const oebps = zip.folder("OEBPS");
        oebps.file("content.opf", contentOpf);
        oebps.file("style.css", "body { font-family: sans-serif; line-height: 1.6; padding: 1em; } h1, h2, h3 { text-align: center; } p { text-indent: 2em; margin: 0.5em 0; }");

        const navXhtml = `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head><title>Navigation</title></head>
<body>
  <nav epub:type="toc">
    <h1>${novel.title}</h1>
    <ol>
      ${chapters.map((ch, i) => {
        const chapterTitle = `${t.chapterPrefix}${i + 1}${t.chapterSuffix || ''} ${ch.title}`.trim();
        return `<li><a href="ch${i}.xhtml">${chapterTitle}</a></li>`;
      }).join('\n      ')}
    </ol>
  </nav>
</body>
</html>`;
        oebps.file("nav.xhtml", navXhtml);

        chapters.forEach((ch, i) => {
    const chapterTitle = `${t.chapterPrefix}${i + 1}${t.chapterSuffix || ''} ${ch.title}`.trim();
    const chXhtml = `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml">
<head><title>${chapterTitle}</title><link rel="stylesheet" type="text/css" href="style.css"/></head>
<body>
  <h2>${chapterTitle}</h2>
  ${(ch.content || "").split('\n').filter(p => p.trim()).map(p => `<p>${p.trim()}</p>`).join('\n  ')}
</body>
</html>`;
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

  const handleSaveNovelDetails = async (updates: Partial<Novel>) => {
    if (!selectedNovel) return;
    
    // Optimistically update local state for better responsiveness
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
        // Rollback on error
        setSelectedNovel(previousNovel);
        setNovels(novels.map(n => n.id === selectedNovel.id ? previousNovel : n));
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || t.saveError || "Failed to save novel details");
      }
      // Sync with server response just in case
      const updatedNovel = await response.json();
      setSelectedNovel(updatedNovel);
      setNovels(novels.map(n => n.id === updatedNovel.id ? updatedNovel : n));
    } catch (error: any) {
      console.error("Failed to save novel details:", error);
      setToast({ message: error.message || "Failed to save novel details", type: 'error' });
    }
  };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleSaveNovelDetails({ cover_url: reader.result as string });
      };
      reader.readAsDataURL(file);
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
    } finally {
      setIsRefactoringWorld(false);
    }
  };

  const handleAISupplement = async () => {
    if (!selectedNovel || isSupplementing) return;
    setIsSupplementing(true);
    try {
      const result = await extractNovelMetadata(
        chapters,
        {
          characters: selectedNovel.characters || "",
          storylines: selectedNovel.storylines || "",
          world_setting: selectedNovel.world_setting || "",
          relationships: selectedNovel.relationships || ""
        },
        aiConfig,
        lang
      );
      
      if (result && result.data) {
        await handleSaveNovelDetails({
          ...result.data,
          last_supplement_at: new Date().toISOString(),
          token_usage: result.usage?.total_tokens || 0,
          token_type: 'supplement'
        } as any);
      }
    } catch (error: any) {
      console.error("Failed to supplement novel metadata:", error);
      setToast({ message: error.message || "Failed to update novel metadata", type: 'error' });
    } finally {
      setIsSupplementing(false);
    }
  };

  const handleCreateNovel = async () => {
    if (!newNovelTitle.trim() || isCreating) return;
    setIsCreating(true);
    try {
      const res = await fetch("/api/novels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          title: newNovelTitle, 
          author: newNovelAuthor || writingConfig.defaultAuthor,
          genre: newNovelGenre,
          description: t.newNovelDraft
        }),
      });
      if (!res.ok) throw new Error(t.createError || "Failed to create novel");
      const data = await res.json();
      setNewNovelTitle("");
      setNewNovelAuthor("");
      setNewNovelGenre("");
      setShowCreateModal(false);
      await fetchNovels();
      await fetchNovelDetails(data.id);
      setToast({ message: t.saveSettings || "Novel created successfully", type: 'success' });
    } catch (error: any) {
      console.error(error);
      setToast({ message: error.message || "Failed to create novel", type: 'error' });
    } finally {
      setIsCreating(false);
    }
  };
  
  const handleCreateTask = async () => {
    if (!newTask.type || !newTask.scheduled_at) return;
    try {
      // Convert to ISO string for consistent server-side processing
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

  const handleGenerateTitle = async () => {
    if (!currentChapter || !currentChapter.content || isGeneratingTitle) return;
    setIsGeneratingTitle(true);
    try {
      const { text: title, tokens } = await generateChapterTitle(currentChapter.content, aiConfig, lang);
      if (title) {
        setCurrentChapter({ ...currentChapter, title });
        // Save to server
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
    } finally {
      setIsGeneratingTitle(false);
    }
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
    } finally {
      setIsGenerating(false);
    }
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
    } catch (e: any) {
      setTestResult({ success: false, message: e.message });
    } finally {
      setIsTesting(false);
    }
  };

  const handleResetSettings = () => {
    setShowResetConfirm(true);
  };

  const confirmResetSettings = () => {
    const defaultAIConfig: AIConfig = {
      provider: "gemini",
      model: "gemini-3-flash-preview",
      apiKey: "",
      baseUrl: "",
      parameters: JSON.stringify({
        temperature: 0.7,
        max_tokens: 4000,
        top_p: 0.95,
        top_k: 40
      })
    };
    const defaultWritingConfig: WritingConfig = {
      minWords: 2000,
      maxWords: 5000,
      layout: "standard",
      enforceWordCount: true,
      autoSummarize: true
    };
    setAiConfig(defaultAIConfig);
    setWritingConfig(defaultWritingConfig);
    localStorage.setItem("inkflow_ai_config", JSON.stringify(defaultAIConfig));
    localStorage.setItem("inkflow_writing_config", JSON.stringify(defaultWritingConfig));
    setToast({ message: t.settingsSaved || "Settings reset to default", type: 'success' });
    setShowResetConfirm(false);
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
        // Update the active aiConfig state immediately with normalized fields
        setAiConfig({
          provider: config.provider,
          model: config.model,
          apiKey: config.api_key,
          baseUrl: config.base_url,
          parameters: config.parameters
        });
      }
    } catch (e) {
      setToast({ message: t.saveError, type: 'error' });
    }
  };

  const handleSaveChapter = async (isAuto = false, updatedChapter?: Chapter) => {
    const chapterToSave = updatedChapter || currentChapter;
    if (!chapterToSave || !selectedNovel) return;
    
    // If auto-saving, check if content actually changed
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
      
      // Save version if it's a manual save or if content changed significantly
      if (!isAuto || chapterToSave.content !== lastSavedContentRef.current) {
        await saveChapterVersion(chapterToSave.id);
      }
      
      // Update local chapters list
      setChapters(prev => prev.map(ch => ch.id === chapterToSave.id ? { ...ch, ...chapterToSave } : ch));
      
      lastSavedContentRef.current = chapterToSave.content || "";
      setLastSavedAt(new Date());
      
      if (!isAuto) {
        setToast({ message: t.saveSuccess || "Saved successfully", type: 'success' });
      }
    } catch (error: any) {
      console.error("Error saving chapter:", error);
      if (!isAuto) {
        setToast({ message: error.message || "Failed to save chapter", type: 'error' });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveOutline = async () => {
    if (!activeOutline || !selectedNovel) return;
    try {
      const res = await fetch(`/api/outlines/${activeOutline.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          content: activeOutline.content,
          version_name: activeOutline.version_name
        }),
      });
      if (!res.ok) throw new Error(t.saveError || "Failed to save outline");
      fetchNovelDetails(selectedNovel.id);
      setToast({ message: t.saveSettings || "Outline saved", type: 'success' });
    } catch (error: any) {
      console.error("Error saving outline:", error);
      setToast({ message: error.message || "Failed to save outline", type: 'error' });
    }
  };

  const handleCreateOutlineVersion = async () => {
    if (!selectedNovel) return;
    if (!isCreatingOutlineVersion) {
      setIsCreatingOutlineVersion(true);
      setNewOutlineVersionName(`V${(selectedNovel.outlines?.length || 0) + 1}.0`);
      return;
    }
    
    if (!newOutlineVersionName.trim()) {
      setIsCreatingOutlineVersion(false);
      return;
    }

    try {
      const res = await fetch(`/api/novels/${selectedNovel.id}/outlines`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version_name: newOutlineVersionName, content: activeOutline?.content || "" }),
      });
      if (!res.ok) throw new Error(t.createError || "Failed to create outline version");
      await fetchNovelDetails(selectedNovel.id);
      setToast({ message: t.newVersion + " " + t.active, type: 'success' });
      setIsCreatingOutlineVersion(false);
      setNewOutlineVersionName("");
    } catch (error: any) {
      console.error("Error creating outline version:", error);
      setToast({ message: error.message || "Failed to create outline version", type: 'error' });
    }
  };

  const handleActivateOutline = async (id: number) => {
    if (!selectedNovel) return;
    try {
      const res = await fetch(`/api/outlines/${id}/activate`, {
        method: "PATCH",
      });
      if (!res.ok) throw new Error(t.saveError || "Failed to activate outline");
      fetchNovelDetails(selectedNovel.id);
      setToast({ message: t.activate + " " + t.active, type: 'success' });
    } catch (error: any) {
      console.error("Error activating outline:", error);
      setToast({ message: error.message || "Failed to activate outline", type: 'error' });
    }
  };

  const handleDeleteOutlineVersion = async (id: number) => {
    setOutlineToDelete(id);
  };

  const confirmDeleteOutline = async () => {
    if (!selectedNovel || outlineToDelete === null) return;
    try {
      const res = await fetch(`/api/outlines/${outlineToDelete}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(t.deleteError || "Failed to delete outline version");
      fetchNovelDetails(selectedNovel.id);
      setToast({ message: t.deleteSuccess || "Deleted successfully", type: 'success' });
      setOutlineToDelete(null);
    } catch (error: any) {
      console.error("Error deleting outline version:", error);
      setToast({ message: error.message || "Failed to delete outline version", type: 'error' });
    }
  };

  const handleDeleteNovel = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setNovelToDelete(id);
  };

  const confirmDeleteNovel = async () => {
    if (!novelToDelete) return;
    
    try {
      const res = await fetch(`/api/novels/${novelToDelete}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(t.deleteError || "Failed to delete novel");
      
      if (selectedNovel?.id === novelToDelete) {
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
      } else {
        setToast({ message: t.emptySummaryError || "AI returned an empty summary. Please try again.", type: 'error' });
      }
    } catch (error: any) {
      console.error("Error generating summary:", error);
      setToast({ message: error.message || "Failed to generate summary", type: 'error' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRefactorChapter = async () => {
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
      
      // Save version before polishing
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
        body: JSON.stringify({ 
          content: streamedText,
          token_usage: Math.round((streamedText.length + prompt.length + context.length) / 4),
          token_type: 'polish'
        }),
      });
      
      fetchStats();
      await fetchNovelDetails(selectedNovel.id, currentChapter.id);
      setToast({ message: t.polishing + " " + t.completed, type: 'success' });
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Polishing aborted');
      } else {
        console.error(error);
        setToast({ message: error.message || "Polishing failed", type: 'error' });
      }
    } finally {
      setIsPolishing(false);
      setAbortController(null);
    }
  };

  const handleAIWrite = async () => {
    if (!currentChapter || !selectedNovel) return;
    const controller = new AbortController();
    setAbortController(controller);
    setIsGenerating(true);
    try {
      const activeOutlineContent = selectedNovel.outlines?.find(o => o.is_active === 1)?.content || "";
      const currentContent = currentChapter.content || "";
      
      // Stronger context for layout
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
      
      // Save version before AI write
      await saveChapterVersion(currentChapter.id);
      
      const stream = generateAIContentStream(prompt, context, aiConfig, writingConfig, lang, controller.signal, promptTemplate, currentContent, nextChapterContext);
      
      for await (const chunk of stream) {
        if (controller.signal.aborted) break;
        streamedText += chunk;
        // Update locally in real-time
        setCurrentChapter(prev => prev ? { ...prev, content: currentContent + (currentContent ? "\n\n" : "") + streamedText } : null);
      }
      
      const finalContent = currentContent + (currentContent ? "\n\n" : "") + streamedText;
      
      // Update on server with token usage
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
      if (writingConfig.autoSummarize) {
        handleGenerateSummary(finalContent);
      } else {
        await fetchNovelDetails(selectedNovel.id, currentChapter.id);
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Generation aborted');
      } else {
        console.error(error);
        setToast({ message: error.message || "AI generation failed", type: 'error' });
      }
    } finally {
      setIsGenerating(false);
      setAbortController(null);
    }
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
      
      // We'll do up to 3 segments to try and reach the target
      const segments = 3;
      for (let i = 0; i < segments; i++) {
        if (controller.signal.aborted) break;
        setSegmentProgress(Math.round(((i) / segments) * 100));
        
        const layoutContext = `${t.segmentedWritePrompt.replace('{layout}', writingConfig.layout)}`;
        const prompt = `${layoutContext}\n\n${t.segmentedPartPrompt.replace('{title}', currentChapter.title).replace('{current}', (i + 1).toString()).replace('{total}', segments.toString())}
        ${i > 0 ? t.segmentedContinuePrompt : t.segmentedStartPrompt} 
        
        ${t.contextBackground}：${currentContent.slice(-1000)}`;
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
          // Update locally
          setCurrentChapter(prev => prev ? { ...prev, content: currentContent + (currentContent ? "\n\n" : "") + streamedText } : null);
        }
        
        currentContent += (currentContent ? "\n\n" : "") + streamedText;
        totalTokens += (streamedText.length + prompt.length + context.length) / 4;
        
        // If we already reached a decent length, we can stop early if it's not the last segment
        if (currentContent.length > writingConfig.maxWords * 0.8 && i < segments - 1) {
          break;
        }
      }
      
      setSegmentProgress(100);
      
      // Final save
      await fetch(`/api/chapters/${currentChapter.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          content: currentContent,
          token_usage: Math.round(totalTokens),
          token_type: 'generation'
        }),
      });
      fetchStats();
      if (writingConfig.autoSummarize) {
        handleGenerateSummary(currentContent);
      } else {
        await fetchNovelDetails(selectedNovel.id, currentChapter.id);
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Segmented write aborted');
      } else {
        console.error("Segmented Write Error:", error);
        setToast({ message: error.message || "Segmented writing failed", type: 'error' });
      }
    } finally {
      setIsSegmenting(false);
      setSegmentProgress(0);
      setAbortController(null);
    }
  };

  const getChapterTitleFromOutline = (outlineContent: string, chapterNum: number) => {
    if (!outlineContent) return "";
    const lines = outlineContent.split('\n');
    
    // Regular chapter patterns
    const chapterPatterns = [
      new RegExp(`(?:Chapter|第)\\s*${chapterNum}(?!\\d|[-~])\\s*(?:[:：]|章|\\s|[\\)\\]）］])*\\s*(.+)`, 'i'),
      new RegExp(`^${chapterNum}(?!\\d|[-~])\\.\\s*(.+)`),
      new RegExp(`^${chapterNum}(?!\\d|[-~])[\\s：:](.+)`)
    ];

    // Range patterns like 16-18
    const rangePattern = /(?:Chapter|第)?\s*(\d+)\s*[-~]\s*(\d+)\s*(?:[:：]|章|\\s|[\\)\\]）］])*\\s*(.+)/i;
    
    for (const line of lines) {
      // Check for range first
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
        if (match && match[1]) {
          return match[1].trim();
        }
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
      
      if (found && isNextChapter) {
        break;
      }
      
      if (found) {
        // Check if this line looks like ANY chapter header to avoid over-consuming
        const anyChapterMatch = line.match(/^(?:Chapter|第)?\s*\d+/i);
        if (anyChapterMatch && !isCurrentChapter) {
           // If we hit another chapter header that isn't the current one, stop
           break;
        }
        result += line + "\n";
      }
    }
    return result.trim();
  };

  const handleAIGenerateOutline = async () => {
    if (!selectedNovel) return;
    setIsGeneratingOutline(true);
    try {
      const promptTemplate = getActivePrompt('outline');
      const result = await generateAIOutline(selectedNovel.title, selectedNovel.description || "小说", aiConfig, lang, promptTemplate);
      
      // Create a new version with the generated content
      const res = await fetch(`/api/novels/${selectedNovel.id}/outlines`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          version_name: `${t.aiGenerated || "AI Generated"} ${formatDate(new Date(), "HH:mm")}`,
          content: result.text,
          token_usage: result.tokens
        }),
      });
      
      if (res.ok) {
        await fetchNovelDetails(selectedNovel.id);
        setToast({ message: t.generateOutline + " " + t.active, type: 'success' });
      } else {
        throw new Error(t.createError || "Failed to save generated outline");
      }
    } catch (error: any) {
      console.error(error);
      setToast({ message: error.message || "Failed to generate outline", type: 'error' });
    } finally {
      setIsGeneratingOutline(false);
    }
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
        // Log tokens for title generation
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

  const handleDeleteChapter = async (e: React.MouseEvent, chapterId: number) => {
    e.stopPropagation();
    setChapterToDelete(chapterId);
  };

  const fetchChapterVersions = async (chapterId: number) => {
    try {
      console.log(`Fetching versions for chapter: ${chapterId}`);
      const res = await fetch(`/api/chapters/${chapterId}/versions`);
      if (res.ok) {
        const data = await res.json();
        console.log(`Fetched ${data.length} versions for chapter: ${chapterId}`);
        setChapterVersions(data);
      } else {
        console.error("Failed to fetch chapter versions, status:", res.status);
      }
    } catch (e) {
      console.error("Failed to fetch versions:", e);
    }
  };

  const saveChapterVersion = async (chapterId: number) => {
    if (isSavingVersion) return;
    setIsSavingVersion(true);
    try {
      console.log(`Saving version for chapter: ${chapterId}`);
      const res = await fetch(`/api/chapters/${chapterId}/versions`, { method: 'POST' });
      if (res.ok) {
        console.log(`Version saved for chapter: ${chapterId}`);
        await fetchChapterVersions(chapterId);
        setToast({ message: t.versionSaved, type: 'success' });
      } else {
        console.error("Failed to save version, status:", res.status);
      }
    } catch (e) {
      console.error("Failed to save version:", e);
    } finally {
      setIsSavingVersion(false);
    }
  };

  const restoreChapterVersion = async (chapterId: number, versionId: number) => {
    if (!confirm(t.restoreConfirm)) return;
    setIsRestoringVersion(true);
    try {
      const res = await fetch(`/api/chapters/${chapterId}/restore-version/${versionId}`, { method: 'POST' });
      if (res.ok) {
        await fetchNovelDetails(selectedNovel.id, chapterId);
        await fetchChapterVersions(chapterId);
        setToast({ message: t.restore + " " + t.completed, type: 'success' });
        setIsHistoryOpen(false);
      }
    } catch (e) {
      console.error("Failed to restore version:", e);
    } finally {
      setIsRestoringVersion(false);
    }
  };

  const confirmDeleteChapter = async () => {
    if (chapterToDelete === null) return;
    
    try {
      const res = await fetch(`/api/chapters/${chapterToDelete}`, { method: "DELETE" });
      if (!res.ok) throw new Error(t.deleteError || "Failed to delete chapter");
      if (currentChapter?.id === chapterToDelete) {
        setCurrentChapter(null);
      }
      if (selectedNovel) {
        await fetchNovelDetails(selectedNovel.id);
      }
      setToast({ message: t.deleteChapter + " " + t.active, type: 'success' });
    } catch (e: any) {
      console.error(e);
      setToast({ message: e.message || "Failed to delete chapter", type: 'error' });
    } finally {
      setChapterToDelete(null);
    }
  };

  const handleBatchGenerate = async () => {
    if (!selectedNovel || isBatchGenerating) return;
    
    const targetChapters = selectedNovel.target_chapters || 50;
    const remainingChapters = Math.max(0, targetChapters - chapters.length);
    const actualBatchCount = Math.min(batchCount, remainingChapters);
    
    if (actualBatchCount <= 0) {
      setToast({ message: t.targetReached, type: 'success' });
      setShowBatchModal(false);
      return;
    }

    const controller = new AbortController();
    setAbortController(controller);
    setIsBatchGenerating(true);
    setBatchProgress({ current: 0, total: actualBatchCount });
    setShowBatchModal(false);
    
    // Switch to novels tab to show the writing area
    setActiveTab("novels");
    
    try {
      const activeOutlineContent = selectedNovel.outlines?.find(o => o.is_active === 1)?.content || "";
      
      for (let i = 0; i < actualBatchCount; i++) {
        if (controller.signal.aborted) break;
        
        setBatchProgress(prev => ({ ...prev, current: i + 1 }));
        
        const novelInfoRes = await fetch(`/api/novels/${selectedNovel.id}`);
        if (!novelInfoRes.ok) throw new Error("Failed to fetch novel info during batch generate");
        const novelInfo = await novelInfoRes.json();
        const currentChapters = novelInfo.chapters || [];
        const nextChapterNum = currentChapters.length + 1;
        
        // Try to find title in outline
        let outlineTitle = getChapterTitleFromOutline(activeOutlineContent, nextChapterNum);
        let totalTokens = 0;

        if (!outlineTitle && activeOutlineContent) {
          const titleRes = await generateChapterTitleFromOutline(activeOutlineContent, nextChapterNum, aiConfig, lang);
          outlineTitle = titleRes.text;
          totalTokens += titleRes.tokens;
        }

        const defaultTitle = outlineTitle || `${t.chapters} ${nextChapterNum}`;
        
        // 1. Create chapter
        const createRes = await fetch("/api/chapters", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ novel_id: selectedNovel.id, title: defaultTitle, content: "" }),
        });
        if (!createRes.ok) throw new Error("Failed to create chapter during batch generate");
        const chapterData = await createRes.json();
        
        // Update local chapters list and select the new chapter
        await fetchNovelDetails(selectedNovel.id);
        setCurrentChapter(chapterData);

        // 2. Generate content with streaming
        const isLastChapter = nextChapterNum >= targetChapters;
        const prompt = isLastChapter 
          ? t.finalChapterPrompt.replace('{title}', defaultTitle)
          : t.nextChapterPrompt.replace('{num}', nextChapterNum.toString()).replace('{title}', defaultTitle).replace('{total}', targetChapters.toString());
        
        const context = `${t.novelTitleContext}: ${selectedNovel.title}\n${t.descriptionContextLabel}: ${selectedNovel.description}\n${t.targetChaptersContextLabel}: ${targetChapters}\n${t.outlineContextLabel}: ${activeOutlineContent}\n${t.charactersContextLabel}: ${selectedNovel.characters || t.undefinedContext}\n${t.worldSettingContextLabel}: ${selectedNovel.world_setting || t.undefinedContext}\n${t.contextBackground}: ${currentChapters.slice(-2).map((c: any) => c.title + ": " + (c.content || "").slice(-500)).join("\n")}`;
        
        const nextChapterOutline = getChapterOutlineFromOutline(activeOutlineContent, nextChapterNum + 1);
        const nextChapterContext = nextChapterOutline ? `下一章大纲：\n${nextChapterOutline}` : "";

        let fullContent = "";
        
        const promptTemplate = getActivePrompt('chapter');
        const stream = generateAIContentStream(prompt, context, aiConfig, writingConfig, lang, controller.signal, promptTemplate, "", nextChapterContext);
        
        for await (const chunk of stream) {
          if (controller.signal.aborted) break;
          fullContent += chunk;
          
          // Update current chapter state so user sees it in real-time
          setCurrentChapter(prev => prev && prev.id === chapterData.id ? { ...prev, content: fullContent } : prev);
        }
        
        if (controller.signal.aborted) break;

        // 3. Generate Title (only if not from outline)
        let finalTitle = defaultTitle;
        if (!outlineTitle) {
          const titleRes = await generateChapterTitle(fullContent, aiConfig, lang);
          finalTitle = titleRes.text;
          totalTokens += titleRes.tokens;
        }

        // 4. Generate Summary
        const summaryRes = await generateChapterSummary(fullContent, aiConfig, lang);
        const summary = summaryRes.text;
        totalTokens += summaryRes.tokens;

        // 5. Update chapter in DB
        // Add content tokens (estimate)
        totalTokens += (fullContent.length + prompt.length + context.length) / 4;

        await fetch(`/api/chapters/${chapterData.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            title: finalTitle,
            content: fullContent,
            summary: summary,
            token_usage: Math.round(totalTokens)
          }),
        });
        
        // Update local state for immediate feedback
        setCurrentChapter(prev => prev && prev.id === chapterData.id ? { ...prev, title: finalTitle, content: fullContent, summary: summary } : prev);
        
        // Final refresh for this chapter
        await fetchNovelDetails(selectedNovel.id);
      }
      
      fetchStats();
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Batch generation aborted');
      } else {
        console.error(error);
        setToast({ message: error.message || "Batch generation failed", type: 'error' });
      }
    } finally {
      setIsBatchGenerating(false);
      setAbortController(null);
    }
  };

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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl"
            >
              <h3 className="text-2xl font-bold text-white mb-6">{t.newNovel}</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">{t.novel} {t.appName}</label>
                  <input 
                    autoFocus
                    value={newNovelTitle || ""}
                    onChange={(e) => setNewNovelTitle(e.target.value)}
                    placeholder={t.enterTitle}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateNovel()}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">{t.author}</label>
                  <input 
                    value={newNovelAuthor || ""}
                    onChange={(e) => setNewNovelAuthor(e.target.value)}
                    placeholder={t.authorPlaceholder}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">{t.novelGenreLabel}</label>
                  <input 
                    value={newNovelGenre || ""}
                    onChange={(e) => setNewNovelGenre(e.target.value)}
                    placeholder={t.novelGenrePlaceholder}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-all"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={() => {
                      setShowCreateModal(false);
                      setNewNovelTitle("");
                      setNewNovelAuthor("");
                      setNewNovelGenre("");
                    }}
                    className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-all"
                  >
                    {t.cancel}
                  </button>
                  <button 
                    onClick={handleCreateNovel}
                    disabled={!newNovelTitle.trim() || isCreating}
                    className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:hover:bg-emerald-500 text-black font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    {isCreating ? (
                      <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    ) : t.confirm}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {novelToDelete !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl"
            >
              <div className="w-12 h-12 bg-rose-500/10 text-rose-500 rounded-xl flex items-center justify-center mb-6">
                <Trash2 size={24} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">{t.deleteNovel}</h3>
              <p className="text-zinc-400 mb-8">{t.confirmDelete}</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setNovelToDelete(null)}
                  className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-all"
                >
                  {t.cancel}
                </button>
                <button 
                  onClick={confirmDeleteNovel}
                  className="flex-1 py-3 bg-rose-500 hover:bg-rose-400 text-white font-bold rounded-xl transition-all"
                >
                  {t.delete}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {chapterToDelete !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl"
            >
              <div className="w-12 h-12 bg-rose-500/10 text-rose-500 rounded-xl flex items-center justify-center mb-6">
                <Trash2 size={24} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">{t.deleteChapter}</h3>
              <p className="text-zinc-400 mb-8">{t.confirmDelete}</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setChapterToDelete(null)}
                  className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-all"
                >
                  {t.cancel}
                </button>
                <button 
                  onClick={confirmDeleteChapter}
                  className="flex-1 py-3 bg-rose-500 hover:bg-rose-400 text-white font-bold rounded-xl transition-all"
                >
                  {t.delete}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {outlineToDelete !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl"
            >
              <div className="w-12 h-12 bg-rose-500/10 text-rose-500 rounded-xl flex items-center justify-center mb-6">
                <Trash2 size={24} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">{t.delete}</h3>
              <p className="text-zinc-400 mb-8">{t.deleteConfirm}</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setOutlineToDelete(null)}
                  className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-all"
                >
                  {t.cancel}
                </button>
                <button 
                  onClick={confirmDeleteOutline}
                  className="flex-1 py-3 bg-rose-500 hover:bg-rose-400 text-white font-bold rounded-xl transition-all"
                >
                  {t.delete}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {showResetConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl"
            >
              <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center mb-6">
                <Activity size={24} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">{t.resetSettings}</h3>
              <p className="text-zinc-400 mb-8">{t.confirmReset}</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-all"
                >
                  {t.cancel}
                </button>
                <button 
                  onClick={confirmResetSettings}
                  className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-white font-bold rounded-xl transition-all"
                >
                  {t.confirm}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {promptToDelete !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl"
            >
              <div className="w-12 h-12 bg-rose-500/10 text-rose-500 rounded-xl flex items-center justify-center mb-6">
                <Trash2 size={24} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">{t.deletePrompt || "删除模板"}</h3>
              <p className="text-zinc-400 mb-8">{t.confirmDeletePrompt || "确定要删除这个模板吗？"}</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setPromptToDelete(null)}
                  className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-all"
                >
                  {t.cancel}
                </button>
                <button 
                  onClick={confirmDeletePrompt}
                  className="flex-1 py-3 bg-rose-500 hover:bg-rose-400 text-white font-bold rounded-xl transition-all"
                >
                  {t.delete}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Batch Generate Modal */}
      <AnimatePresence>
        {showBatchModal && (
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
                  onClick={() => setShowBatchModal(false)}
                  className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-all"
                >
                  {t.cancel}
                </button>
                <button 
                  onClick={handleBatchGenerate}
                  className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl transition-all"
                >
                  {t.startGenerating}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Preview Modal */}
      <AnimatePresence>
        {showPreview && selectedNovel && (
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
                  onClick={() => setShowPreview(false)}
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
                  onClick={() => setShowPreview(false)}
                  className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-lg transition-all"
                >
                  {t.close}
                </button>
              </div>
            </motion.div>
          </div>
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
              handleDeleteNovel={handleDeleteNovel}
              exportNovel={exportNovel}
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
                    onClick={(e) => handleDeleteNovel(e as any, selectedNovel.id)}
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
                          onClick={() => exportNovel(selectedNovel, 'markdown')}
                          className="w-full text-left px-4 py-3 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 flex items-center gap-3"
                        >
                          <FileDown size={16} />
                          {t.exportMarkdown}
                        </button>
                        <button 
                          onClick={() => exportNovel(selectedNovel, 'epub')}
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
                            onClick={(e) => handleDeleteChapter(e, ch.id)}
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
              handleDeleteTask={handleDeleteTask}
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
              handleSetDefaultPrompt={handleSetDefaultPrompt}
              handleDeletePrompt={handleDeletePrompt}
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

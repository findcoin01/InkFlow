import React, { useState, useEffect } from "react";
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
  GitBranch,
  Network,
  Globe,
  FileText,
  Type,
  Cpu,
  Zap,
  Activity,
  Wand2
} from "lucide-react";
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
import { format } from "date-fns";
import { cn } from "./lib/utils";
import { Novel, Chapter, TokenStats, OutlineVersion, AIConfig, AIProvider, WritingConfig, ContentLayout, Platform, ScheduledTask, Prompt, OperationLog, AIConfigDetail, TokenLog } from "./types";
import { generateAIContent, generateAIOutline, generateAIContentStream, generateChapterTitle, generateChapterTitleFromOutline, extractNovelMetadata, generateChapterSummary, refactorWorldSetting } from "./services/aiService";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { translations, Language } from "./constants";

// --- Components ---

const SidebarItem = ({ icon: Icon, label, active, onClick, collapsed }: any) => (
  <button
    onClick={onClick}
    title={collapsed ? label : ""}
    className={cn(
      "flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all duration-200",
      active 
        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
        : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200",
      collapsed && "justify-center px-0"
    )}
  >
    <Icon size={20} className="shrink-0" />
    {!collapsed && <span className="font-medium truncate">{label}</span>}
  </button>
);

const Card = ({ children, className, title, headerAction, onClick }: any) => (
  <div 
    onClick={onClick}
    className={cn("bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6", className)}
  >
    {title && (
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-zinc-100">{title}</h3>
        {headerAction}
      </div>
    )}
    {children}
  </div>
);

const StatCard = ({ label, value, icon: Icon, trend, t }: any) => (
  <Card className="flex items-center justify-between">
    <div>
      <p className="text-sm text-zinc-400 mb-1">{label}</p>
      <h4 className="text-2xl font-bold text-zinc-100">{value}</h4>
      {trend !== undefined && (
        <p className={cn(
          "text-xs mt-1 flex items-center gap-1", 
          typeof trend === 'number' ? (trend > 0 ? "text-emerald-400" : trend < 0 ? "text-rose-400" : "text-zinc-500") : "text-zinc-500"
        )}>
          {typeof trend === 'number' ? (
            <>
              <TrendingUp size={12} className={trend < 0 ? "rotate-180" : ""} />
              {Math.abs(trend)}% {t.fromLastWeek}
            </>
          ) : (
            <>
              <Clock size={12} />
              {trend}
            </>
          )}
        </p>
      )}
    </div>
    <div className="p-3 bg-zinc-800 rounded-xl text-emerald-400">
      <Icon size={24} />
    </div>
  </Card>
);

const StructuredContent = ({ content, placeholder }: { content: string, placeholder: string }) => {
  if (!content) return <p className="text-zinc-500 italic text-sm">{placeholder}</p>;

  try {
    const data = JSON.parse(content);
    
    // Handle Array (likely Characters)
    if (Array.isArray(data)) {
      return (
        <div className="space-y-4">
          {data.map((item: any, idx: number) => (
            <div key={idx} className="p-4 bg-zinc-800/50 rounded-xl border border-zinc-700/50 hover:border-emerald-500/30 transition-all">
              {Object.entries(item).map(([key, value]: [string, any]) => (
                <div key={key} className="mb-2 last:mb-0">
                  <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider block mb-1">{key}</span>
                  <p className="text-sm text-zinc-300 leading-relaxed">
                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                  </p>
                </div>
              ))}
            </div>
          ))}
        </div>
      );
    }

    // Handle Object (World Setting, Storylines)
    if (typeof data === 'object' && data !== null) {
      return (
        <div className="space-y-6">
          {Object.entries(data).map(([key, value]: [string, any]) => (
            <div key={key}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1 h-4 bg-emerald-500 rounded-full" />
                <h5 className="text-xs font-bold text-white uppercase tracking-widest">{key.replace(/_/g, ' ')}</h5>
              </div>
              <div className="pl-3 border-l border-zinc-800 ml-0.5">
                {Array.isArray(value) ? (
                  <ul className="list-disc list-inside space-y-1">
                    {value.map((v: any, i: number) => (
                      <li key={i} className="text-sm text-zinc-400 leading-relaxed">
                        {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      );
    }
  } catch (e) {
    // Not JSON, fallback to Markdown
  }

  return (
    <div className="markdown-body">
      <Markdown remarkPlugins={[remarkGfm]}>
        {content || `*${placeholder}*`}
      </Markdown>
    </div>
  );
};

const TemplateSelector = ({ 
  type, 
  prompts, 
  selectedId, 
  onSelect, 
  onDelete,
  t 
}: { 
  type: string, 
  prompts: any[], 
  selectedId?: number, 
  onSelect: (id: number) => void,
  onDelete: (id: number) => void,
  t: any 
}) => {
  const filtered = prompts.filter(p => p.type === type);
  const activePrompt = filtered.find(p => p.id === selectedId) || filtered.find(p => p.is_default === 1);

  const getTypeIcon = () => {
    switch(type) {
      case 'chapter': return <BookOpen size={12} />;
      case 'outline': return <GitBranch size={12} />;
      case 'summary': return <FileText size={12} />;
      case 'refactor': return <Zap size={12} />;
      default: return <Sparkles size={12} />;
    }
  };

  return (
    <div className="relative group/template">
      <div className="flex items-center gap-1.5 px-2 py-1.5 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/30 rounded-lg transition-all cursor-pointer group-hover/template:border-zinc-600">
        <div className="text-emerald-500/60 group-hover/template:text-emerald-400 transition-colors">
          {getTypeIcon()}
        </div>
        <ChevronDown size={10} className="text-zinc-600 group-hover/template:text-zinc-400 transition-colors" />
      </div>
      
      <div className="absolute bottom-full left-0 mb-2 w-64 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl opacity-0 invisible group-hover/template:opacity-100 group-hover/template:visible transition-all z-50 overflow-hidden translate-y-2 group-hover/template:translate-y-0">
        <div className="p-3 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-md flex items-center justify-between">
          <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">{t.prompts}</span>
          <div className="px-1.5 py-0.5 bg-zinc-800 rounded text-[9px] text-zinc-500 font-mono">
            {filtered.length}
          </div>
        </div>
        <div className="max-h-64 overflow-y-auto py-2">
          {filtered.length > 0 ? (
            filtered.map(p => (
              <div 
                key={p.id}
                className={cn(
                  "flex items-center justify-between px-4 py-2.5 text-xs transition-all hover:bg-zinc-800/80 cursor-pointer group/item",
                  (selectedId === p.id || (!selectedId && p.is_default === 1)) ? "text-emerald-400 bg-emerald-500/5" : "text-zinc-400 hover:text-zinc-200"
                )}
                onClick={() => onSelect(p.id)}
              >
                <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium">{p.name}</span>
                    {p.is_default === 1 && (
                      <span className="text-[8px] px-1 bg-emerald-500/10 text-emerald-500 rounded border border-emerald-500/20 uppercase">Default</span>
                    )}
                  </div>
                  <span className="text-[9px] text-zinc-600 truncate opacity-0 group-hover/item:opacity-100 transition-opacity">
                    {p.content.substring(0, 40)}...
                  </span>
                </div>
                {p.is_default !== 1 && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(p.id);
                    }}
                    className="p-1.5 text-zinc-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-md opacity-0 group-hover/item:opacity-100 transition-all ml-2"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            ))
          ) : (
            <div className="px-4 py-8 text-center">
              <p className="text-[10px] text-zinc-600 uppercase tracking-widest">No templates found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
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
  const [newNovelGenre, setNewNovelGenre] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

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
  }, []);

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
        setToast({ message: isNew ? "提示词已创建" : "提示词已更新", type: 'success' });
      }
    } catch (e) {
      console.error(e);
      setToast({ message: "保存提示词失败", type: 'error' });
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
        setToast({ message: "已设为默认提示词", type: 'success' });
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
      setActiveTab("editor");
    } catch (e: any) {
      console.error(e);
      setToast({ message: e.message || "Failed to fetch novel details", type: 'error' });
    }
  };

  const handleSaveNovelDetails = async (updates: Partial<Novel>) => {
    if (!selectedNovel) return;
    try {
      const response = await fetch(`/api/novels/${selectedNovel.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (response.ok) {
        const updatedNovel = await response.json();
        setSelectedNovel(updatedNovel);
        setNovels(novels.map(n => n.id === updatedNovel.id ? updatedNovel : n));
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || t.saveError || "Failed to save novel details");
      }
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
      const refactored = await refactorWorldSetting(selectedNovel.world_setting, aiConfig, lang, promptTemplate);
      if (refactored) {
        await handleSaveNovelDetails({ world_setting: refactored });
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
          token_usage: result.usage?.total_tokens || 0
        });
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
          description: newNovelGenre || t.newNovelDraft
        }),
      });
      if (!res.ok) throw new Error(t.createError || "Failed to create novel");
      const data = await res.json();
      setNewNovelTitle("");
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
      setToast({ message: "任务已开始执行", type: 'success' });
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
      const title = await generateChapterTitle(currentChapter.content, aiConfig, lang);
      setCurrentChapter({ ...currentChapter, title });
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingTitle(false);
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
        fetchAIConfigs();
      }
    } catch (e) {
      setToast({ message: t.saveError, type: 'error' });
    }
  };

  const handleSaveChapter = async () => {
    if (!currentChapter || !selectedNovel) return;
    setIsSaving(true);
    
    try {
      const res = await fetch(`/api/chapters/${currentChapter.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          content: currentChapter.content,
          title: currentChapter.title,
          summary: currentChapter.summary
        }),
      });
      if (!res.ok) throw new Error(t.saveError || "Failed to save chapter");
      
      // Update local chapters list
      setChapters(prev => prev.map(ch => ch.id === currentChapter.id ? { ...ch, ...currentChapter } : ch));
      
      setLastSavedAt(new Date());
    } catch (error: any) {
      console.error("Error saving chapter:", error);
      setToast({ message: error.message || "Failed to save chapter", type: 'error' });
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
      const summary = await generateChapterSummary(contentToSummarize, aiConfig, lang, promptTemplate);
      if (summary) {
        setCurrentChapter(prev => prev ? { ...prev, summary } : null);
        setChapters(prev => prev.map(ch => ch.id === currentChapter.id ? { ...ch, summary } : ch));
        
        const res = await fetch(`/api/chapters/${currentChapter.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ summary }),
        });
        
        if (!res.ok) throw new Error(t.saveError || "Failed to save summary");
        setToast({ message: t.summarize + " " + t.active, type: 'success' });
      } else {
        setToast({ message: "AI returned an empty summary. Please try again.", type: 'error' });
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
      
      const prompt = `请对以下小说章节内容进行重构和润色：\n\n${currentContent}`;
      const context = `小说标题: ${selectedNovel.title}\n大纲: ${activeOutlineContent}`;
      
      let streamedText = "";
      const promptTemplate = getActivePrompt('polish');
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
          token_usage: Math.round(streamedText.length / 4)
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
      const layoutContext = `重要：请严格遵守 ${writingConfig.layout} 排版风格。`;
      const prompt = `${layoutContext}\n\n继续创作章节《${currentChapter.title}》。当前内容为：${currentContent.slice(-800)}`;
      const context = `小说标题: ${selectedNovel.title}\n大纲: ${activeOutlineContent}`;
      
      let streamedText = "";
      const promptTemplate = getActivePrompt('chapter');
      const stream = generateAIContentStream(prompt, context, aiConfig, writingConfig, lang, controller.signal, promptTemplate);
      
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
          token_usage: Math.round(streamedText.length / 4)
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
        
        const layoutContext = `严格排版：使用 ${writingConfig.layout} 风格。对于网络小说，这意味着每段最多 2 句话。`;
        const prompt = `${layoutContext}\n\n这是章节《${currentChapter.title}》的第 ${i + 1} 段（共 ${segments} 段）。
        ${i > 0 ? "从上文结束的地方继续创作。不要重复之前的句子。立即开始接下来的行动或对话。" : "从头开始创作本章。"} 
        
        上文背景：${currentContent.slice(-1000)}`;
        const context = `小说标题: ${selectedNovel.title}\n大纲: ${activeOutlineContent}`;
        
        let streamedText = "";
        const promptTemplate = getActivePrompt('chapter');
        const stream = generateAIContentStream(prompt, context, aiConfig, writingConfig, lang, controller.signal, promptTemplate);
        
        for await (const chunk of stream) {
          if (controller.signal.aborted) break;
          streamedText += chunk;
          // Update locally
          setCurrentChapter(prev => prev ? { ...prev, content: currentContent + (currentContent ? "\n\n" : "") + streamedText } : null);
        }
        
        currentContent += (currentContent ? "\n\n" : "") + streamedText;
        totalTokens += streamedText.length / 4;
        
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
          token_usage: Math.round(totalTokens)
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
          version_name: `AI 生成 ${format(new Date(), "HH:mm")}`,
          content: result.text
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
        setToast({ message: "Generating chapter title from outline...", type: 'success' });
        outlineTitle = await generateChapterTitleFromOutline(activeOutlineContent, nextChapterNum, aiConfig, lang);
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
      setToast({ message: "Already reached target chapter count", type: 'success' });
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

        if (!outlineTitle && activeOutlineContent) {
          outlineTitle = await generateChapterTitleFromOutline(activeOutlineContent, nextChapterNum, aiConfig, lang);
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
          ? `创作小说的最终章（${defaultTitle}）。为故事带来圆满的结局，并解决所有主要情节。`
          : `创作第 ${nextChapterNum} 章（${defaultTitle}）。重点是根据大纲推进情节。当前进度：${nextChapterNum}/${targetChapters} 章。`;
        
        const context = `小说标题: ${selectedNovel.title}\n描述: ${selectedNovel.description}\n目标总章节: ${targetChapters}\n大纲: ${activeOutlineContent}\n角色: ${selectedNovel.characters || "未定义"}\n世界设定: ${selectedNovel.world_setting || "未定义"}\n前文背景: ${currentChapters.slice(-2).map((c: any) => c.title + ": " + (c.content || "").slice(-500)).join("\n")}`;
        
        let fullContent = "";
        
        const promptTemplate = getActivePrompt('chapter');
        const stream = generateAIContentStream(prompt, context, aiConfig, writingConfig, lang, controller.signal, promptTemplate);
        
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
          finalTitle = await generateChapterTitle(fullContent, aiConfig, lang);
        }

        // 4. Generate Summary
        const summary = await generateChapterSummary(fullContent, aiConfig, lang);

        // 5. Update chapter in DB
        await fetch(`/api/chapters/${chapterData.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            title: finalTitle,
            content: fullContent,
            summary: summary,
            token_usage: Math.round(fullContent.length / 4)
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
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-black shrink-0">
            <Sparkles size={24} />
          </div>
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
            onClick={() => setShowCreateModal(true)}
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
                  <label className="block text-sm font-medium text-zinc-400 mb-2">类型/风格 (Genre/Style)</label>
                  <input 
                    value={newNovelGenre || ""}
                    onChange={(e) => setNewNovelGenre(e.target.value)}
                    placeholder="例如：玄幻、都市、科幻..."
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-all"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-all"
                  >
                    取消
                  </button>
                  <button 
                    onClick={handleCreateNovel}
                    disabled={!newNovelTitle.trim() || isCreating}
                    className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:hover:bg-emerald-500 text-black font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    {isCreating ? (
                      <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    ) : t.save}
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
                  取消
                </button>
                <button 
                  onClick={confirmDeleteNovel}
                  className="flex-1 py-3 bg-rose-500 hover:bg-rose-400 text-white font-bold rounded-xl transition-all"
                >
                  确认删除
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
                  取消
                </button>
                <button 
                  onClick={confirmDeleteChapter}
                  className="flex-1 py-3 bg-rose-500 hover:bg-rose-400 text-white font-bold rounded-xl transition-all"
                >
                  确认删除
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
                  取消
                </button>
                <button 
                  onClick={confirmDeleteOutline}
                  className="flex-1 py-3 bg-rose-500 hover:bg-rose-400 text-white font-bold rounded-xl transition-all"
                >
                  确认删除
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
                  取消
                </button>
                <button 
                  onClick={confirmResetSettings}
                  className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-white font-bold rounded-xl transition-all"
                >
                  确认重置
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
                  取消
                </button>
                <button 
                  onClick={confirmDeletePrompt}
                  className="flex-1 py-3 bg-rose-500 hover:bg-rose-400 text-white font-bold rounded-xl transition-all"
                >
                  确认删除
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
                    (Max: {Math.max(0, (selectedNovel.target_chapters || 50) - chapters.length)})
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
                    placeholder="Custom count..."
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowBatchModal(false)}
                  className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-all"
                >
                  取消
                </button>
                <button 
                  onClick={handleBatchGenerate}
                  className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl transition-all"
                >
                  开始生成
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
                      <button
                        key={ch.id}
                        onClick={() => {
                          const element = document.getElementById(`preview-chapter-${ch.id}`);
                          element?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg text-sm text-zinc-400 hover:bg-zinc-800 hover:text-white transition-all truncate"
                      >
                        <span className="text-zinc-600 mr-2">{idx + 1}.</span>
                        {ch.title}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-12 bg-zinc-950 scroll-smooth">
                  <div className="max-w-2xl mx-auto">
                    <h1 className="text-5xl font-bold text-white text-center mb-4">{selectedNovel.title}</h1>
                    <div className="text-zinc-500 text-center italic mb-12 markdown-body">
                      <Markdown remarkPlugins={[remarkGfm]}>
                        {selectedNovel.description || ""}
                      </Markdown>
                    </div>
                    
                    <div className="space-y-24">
                      {chapters.map((ch, idx) => (
                        <div key={ch.id} id={`preview-chapter-${ch.id}`} className="space-y-8 scroll-mt-24">
                          <div className="flex items-center gap-4">
                            <div className="h-px flex-1 bg-zinc-800"></div>
                            <h2 className="text-2xl font-bold text-emerald-400">第 {idx + 1} 章：{ch.title}</h2>
                            <div className="h-px flex-1 bg-zinc-800"></div>
                          </div>
                          <div className="text-zinc-300 text-lg leading-loose whitespace-pre-wrap font-serif markdown-body">
                            <Markdown remarkPlugins={[remarkGfm]}>
                              {ch.content || "（暂无内容）"}
                            </Markdown>
                          </div>
                        </div>
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
                <p className="text-xs text-zinc-400">AI 正在为您构思精彩剧情，请稍候...</p>
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
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <header>
                <h2 className="text-3xl font-bold text-white mb-2">{t.welcomeBack}</h2>
                <p className="text-zinc-500 text-lg">{t.dashboardSub}</p>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                  label={t.totalTokens} 
                  value={stats?.totalTokens.toLocaleString() || "0"} 
                  icon={Sparkles} 
                  trend={stats?.tokenTrend} 
                  t={t}
                />
                <StatCard 
                  label={t.totalViews} 
                  value={novels.reduce((acc, n) => acc + n.views, 0).toLocaleString()} 
                  icon={Eye} 
                  trend={stats?.viewTrend} 
                  t={t}
                />
                <StatCard 
                  label={t.activeNovels} 
                  value={novels.length} 
                  icon={BookMarked} 
                  t={t}
                />
                <StatCard 
                  label={t.scheduledTasks} 
                  value={tasks.filter(t => t.status === 'pending').length} 
                  icon={Calendar} 
                  trend={tasks.find(t => t.status === 'pending') ? format(new Date(tasks.find(t => t.status === 'pending')!.scheduled_at), 'HH:mm') : undefined}
                  t={t}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card title={t.tokenConsumption}>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={stats?.dailyTokens.map(d => ({ ...d, date: format(new Date(d.date), 'MMM dd') })) || []}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                        <XAxis dataKey="date" stroke="#71717a" fontSize={12} />
                        <YAxis stroke="#71717a" fontSize={12} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }}
                          itemStyle={{ color: '#10b981' }}
                        />
                        <Line type="monotone" dataKey="tokens" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981' }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                <Card title={t.recentNovels}>
                  <div className="space-y-4">
                    {novels.slice(0, 4).map(novel => (
                      <div 
                        key={novel.id} 
                        onClick={() => fetchNovelDetails(novel.id)}
                        className="flex items-center justify-between p-4 rounded-xl bg-zinc-800/30 border border-zinc-800 hover:border-emerald-500/50 cursor-pointer transition-all group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-16 bg-zinc-700 rounded-lg flex items-center justify-center text-zinc-500 overflow-hidden">
                            {novel.cover_url ? (
                              <img src={novel.cover_url} alt={novel.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <BookOpen size={24} />
                            )}
                          </div>
                          <div>
                            <h4 className="font-semibold text-zinc-100 group-hover:text-emerald-400 transition-colors">{novel.title}</h4>
                            <p className="text-xs text-zinc-500 mt-1">{novel.chapter_count} {t.chapters} • {novel.total_tokens?.toLocaleString() || 0} {t.tokens}</p>
                            {novel.target_chapters && (
                              <div className="w-32 h-1 bg-zinc-800 rounded-full mt-2 overflow-hidden">
                                <div 
                                  className="h-full bg-emerald-500"
                                  style={{ width: `${Math.min((novel.chapter_count / novel.target_chapters) * 100, 100)}%` }}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                        <ChevronRight size={20} className="text-zinc-600 group-hover:text-emerald-400" />
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </motion.div>
          )}

          {activeTab === "novels" && (
            <motion.div
              key="novels"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <header className="flex justify-between items-end">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">{t.myNovels}</h2>
                  <p className="text-zinc-500">{t.manageEmpire}</p>
                </div>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {novels.map(novel => (
                  <Card key={novel.id} className="group hover:border-emerald-500/50 transition-all cursor-pointer relative" onClick={() => fetchNovelDetails(novel.id)}>
                    <button 
                      onClick={(e) => handleDeleteNovel(e, novel.id)}
                      className="absolute top-4 right-4 p-2 text-zinc-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all z-10"
                      title={t.deleteNovel}
                    >
                      <Trash2 size={16} />
                    </button>
                    <div className="flex gap-4 mb-4">
                      <div className="w-20 h-28 bg-zinc-800 rounded-lg flex items-center justify-center text-zinc-600 shadow-xl overflow-hidden">
                        {novel.cover_url ? (
                          <img src={novel.cover_url} alt={novel.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <BookOpen size={40} />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors">{novel.title}</h3>
                        <p className="text-sm text-zinc-500 line-clamp-2 mt-2">{novel.description}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-800">
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
                  <button 
                    onClick={() => setShowPreview(true)}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg flex items-center gap-2 transition-all"
                  >
                    <Eye size={18} />
                    {t.previewNovel}
                  </button>
                  <button 
                    onClick={handleSaveChapter}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg flex items-center gap-2 transition-all"
                  >
                    <Save size={18} />
                    {t.save}
                  </button>
                </div>
              </header>

              {activeTab === "editor" ? (
                <div className="flex-1 flex gap-6 min-h-0">
                {/* Chapter List */}
                <div className="w-64 flex flex-col gap-4">
                  <Card className="flex-1 flex flex-col p-4 overflow-hidden" title={t.chapters}>
                    <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                      {chapters.map(ch => (
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
                          <p className="text-[10px] text-zinc-600 mt-1 flex items-center justify-between">
                            <span>{ch.word_count} {t.words}</span>
                            {ch.summary && <span className="text-[9px] text-emerald-500/60 italic truncate ml-2 max-w-[80px]">{ch.summary}</span>}
                          </p>
                          
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
                        {(currentChapter.summary || isGenerating) && (
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
                              placeholder={isGenerating ? "AI is summarizing..." : t.summarize + "..."}
                              className="w-full bg-transparent text-xs text-zinc-400 leading-relaxed italic resize-none focus:outline-none"
                              rows={2}
                            />
                          </div>
                        )}
                        {isMarkdownPreview ? (
                          <div className="flex-1 p-8 overflow-y-auto markdown-body">
                            <Markdown remarkPlugins={[remarkGfm]}>
                              {currentChapter.content || "（暂无内容）"}
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
                                {isGenerating || isSegmenting ? "停止" : t.aiAssist}
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
                                {isPolishing ? "停止" : t.polish}
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
                                  保存中...
                                </>
                              ) : (
                                <>
                                  {t.autoSaved}
                                  {lastSavedAt && (
                                    <span className="ml-1 opacity-60">
                                      {format(lastSavedAt, "HH:mm")}
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
                            placeholder="e.g. V2.0"
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
                                <span className="sr-only">Choose cover file</span>
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
                            设置目标章节数可以帮助 AI 更好地控制故事节奏并在接近尾声时自动完结。
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
                          <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">{t.novelDescription}</label>
                          <textarea 
                            value={selectedNovel.description || ""}
                            onChange={(e) => handleSaveNovelDetails({ description: e.target.value })}
                            rows={6}
                            placeholder="简述小说的主题、核心冲突和目标读者..."
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
                            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">System</span>
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
                          定义地理环境、力量体系、历史背景、社会规则等。AI 将参考这些设定来保证世界观的一致性。
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
                            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Library</span>
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
                          列出主要角色、性格特征、外貌描写及核心动机。
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
                            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Threads</span>
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
                          规划主线剧情、支线任务、伏笔和高潮点。
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
                            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Network</span>
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
                          可视化展示角色之间的复杂联系与情感纽带。
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

                    <Card title="可视化概览 (Visual Overview)" className="p-6">
                      <div className="grid grid-cols-1 gap-8">
                        <div className="space-y-4">
                          <h4 className="text-sm font-bold text-zinc-400 flex items-center gap-2">
                            <TrendingUp size={16} className="text-emerald-500" />
                            故事进展曲线 (Story Progression)
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
                              <span>开端</span>
                              <span>发展</span>
                              <span>高潮</span>
                              <span>结局</span>
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
            <motion.div
              key="stats"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-8"
            >
              <header>
                <h2 className="text-3xl font-bold text-white mb-2">{t.analytics}</h2>
                <p className="text-zinc-500">{t.analyticsSub}</p>
              </header>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card title={t.tokenUsageByNovel}>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.tokensByNovel}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                        <XAxis dataKey="title" stroke="#71717a" fontSize={12} />
                        <YAxis stroke="#71717a" fontSize={12} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }}
                          itemStyle={{ color: '#10b981' }}
                        />
                        <Bar dataKey="tokens" fill="#10b981" radius={[4, 4, 0, 0]}>
                          {stats.tokensByNovel.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#10b981' : '#059669'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                <Card title={t.consumptionDistribution}>
                  <div className="h-80 w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats.tokensByNovel}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="tokens"
                          nameKey="title"
                        >
                          {stats.tokensByNovel.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={['#10b981', '#059669', '#065f46', '#064e3b'][index % 4]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>

              <Card 
                title={t.tokenHistoryLog}
                headerAction={
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500">{t.total}: {tokenLogTotal}</span>
                    <div className="flex items-center gap-1 ml-4">
                      <button 
                        onClick={() => fetchTokenLogs(tokenLogPage - 1)}
                        disabled={tokenLogPage <= 1}
                        className="p-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-all"
                      >
                        <ChevronRight size={14} className="rotate-180" />
                      </button>
                      <span className="text-xs text-zinc-400 px-2">
                        {tokenLogPage} / {tokenLogTotalPages}
                      </span>
                      <button 
                        onClick={() => fetchTokenLogs(tokenLogPage + 1)}
                        disabled={tokenLogPage >= tokenLogTotalPages}
                        className="p-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-all"
                      >
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                }
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-zinc-800 text-zinc-500 text-xs uppercase tracking-wider">
                        <th className="px-4 py-3 font-bold">{t.novel}</th>
                        <th className="px-4 py-3 font-bold">章节</th>
                        <th className="px-4 py-3 font-bold">{t.date}</th>
                        <th className="px-4 py-3 font-bold">{t.tokens}</th>
                        <th className="px-4 py-3 font-bold">类型</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {tokenLogs.length > 0 ? (
                        tokenLogs.map(log => (
                          <tr key={log.id} className="text-sm text-zinc-300 hover:bg-zinc-800/30 transition-colors">
                            <td className="px-4 py-4 font-medium">{log.novel_title || "Unknown"}</td>
                            <td className="px-4 py-4 text-zinc-500">{log.chapter_title || "-"}</td>
                            <td className="px-4 py-4 text-zinc-500">{format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss')}</td>
                            <td className="px-4 py-4 text-emerald-400 font-mono">{log.tokens?.toLocaleString() || 0}</td>
                            <td className="px-4 py-4">
                              <span className={cn(
                                "px-2 py-1 text-[10px] rounded-full border",
                                log.type === 'generation'
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                  : log.type === 'supplement'
                                  ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                  : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                              )}>
                                {log.type === 'generation' ? t.generateChapter : log.type === 'supplement' ? t.aiSupplement : t.polish}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-zinc-600">
                            No history logs found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </motion.div>
          )}

          {activeTab === "tasks" && (
            <motion.div
              key="tasks"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-8"
            >
              <header className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">{t.scheduledTasks}</h2>
                  <p className="text-zinc-500">Manage your automated generation tasks.</p>
                </div>
                <button 
                  onClick={() => setShowTaskModal(true)}
                  className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl flex items-center gap-2 transition-all"
                >
                  <Plus size={20} />
                  {t.scheduleTask}
                </button>
              </header>

              <div className="grid grid-cols-1 gap-6">
                <Card title={t.scheduledTasks}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-zinc-800 text-zinc-500 text-xs uppercase tracking-wider">
                          <th className="px-4 py-3 font-bold">{t.taskType}</th>
                          <th className="px-4 py-3 font-bold">{t.novel}</th>
                          <th className="px-4 py-3 font-bold">{t.scheduleTime}</th>
                          <th className="px-4 py-3 font-bold">{t.recurrence}</th>
                          <th className="px-4 py-3 font-bold">{t.taskStatus}</th>
                          <th className="px-4 py-3 font-bold text-right">{t.active}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800">
                        {tasks.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-4 py-8 text-center text-zinc-500 italic">
                              {t.noTasks}
                            </td>
                          </tr>
                        ) : (
                          tasks.map(task => (
                            <tr key={task.id} className="text-sm text-zinc-300 hover:bg-zinc-800/30 transition-colors">
                              <td className="px-4 py-4">
                                <div className="flex items-center gap-2">
                                  {task.type === 'generate' ? (
                                    <>
                                      <Sparkles size={14} className="text-emerald-400" />
                                      <span className="font-medium">{t.generateChapter}</span>
                                    </>
                                  ) : (
                                    <>
                                      <Send size={14} className="text-blue-400" />
                                      <span className="font-medium">模拟发布</span>
                                    </>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                <p className="font-medium text-zinc-200">{task.novel_title || '-'}</p>
                                {task.chapter_title && <p className="text-xs text-zinc-500">{task.chapter_title}</p>}
                              </td>
                              <td className="px-4 py-4 text-zinc-400">
                                <div className="flex items-center gap-1.5">
                                  <Clock size={12} />
                                  {format(new Date(task.scheduled_at), 'yyyy-MM-dd HH:mm')}
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                <span className={cn(
                                  "px-2 py-0.5 text-[10px] rounded-full border",
                                  task.recurrence === 'daily' 
                                    ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                                    : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                                )}>
                                  {task.recurrence === 'daily' ? t.recurrenceDaily : t.recurrenceOnce}
                                </span>
                              </td>
                              <td className="px-4 py-4">
                                <span className={cn(
                                  "px-2 py-0.5 text-[10px] rounded-full border",
                                  task.status === 'pending' && "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
                                  task.status === 'running' && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 animate-pulse",
                                  task.status === 'completed' && "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
                                  task.status === 'failed' && "bg-rose-500/10 text-rose-400 border-rose-500/20"
                                )}>
                                  {t[task.status]}
                                </span>
                                {task.error && <p className="text-[10px] text-rose-400 mt-1 max-w-[200px] truncate" title={task.error}>{task.error}</p>}
                              </td>
                              <td className="px-4 py-4 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  {task.status === 'pending' && (
                                    <button 
                                      onClick={() => handleRunTask(task.id)}
                                      className="p-2 text-zinc-500 hover:text-emerald-400 transition-colors"
                                      title="立即执行"
                                    >
                                      <Play size={16} />
                                    </button>
                                  )}
                                  <button 
                                    onClick={() => handleDeleteTask(task.id)}
                                    className="p-2 text-zinc-500 hover:text-rose-400 transition-colors"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            </motion.div>
          )}

          {activeTab === "prompts" && (
            <motion.div
              key="prompts"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <header className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">{t.prompts}</h2>
                  <p className="text-zinc-500">{t.promptsDesc}</p>
                </div>
                <button 
                  onClick={() => {
                    setEditingPrompt({ name: '', content: '', type: promptFilter === 'all' ? 'chapter' : promptFilter as any, is_default: 0 });
                    setShowPromptModal(true);
                  }}
                  className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
                >
                  <Plus size={20} />
                  {t.addPrompt}
                </button>
              </header>

              <div className="flex items-center gap-2 p-1 bg-zinc-900/50 border border-zinc-800 rounded-xl w-fit">
                {['all', 'chapter', 'outline', 'summary', 'refactor', 'polish'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setPromptFilter(filter)}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                      promptFilter === filter 
                        ? "bg-zinc-800 text-white shadow-sm" 
                        : "text-zinc-500 hover:text-zinc-300"
                    )}
                  >
                    {filter === 'all' ? "全部 (All)" : 
                     filter === 'chapter' ? t.typeChapter : 
                     filter === 'outline' ? t.typeOutline : 
                     filter === 'summary' ? t.typeSummary : 
                     filter === 'refactor' ? t.typeRefactor : t.typePolish}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {prompts
                  .filter(p => promptFilter === 'all' || p.type === promptFilter)
                  .map(prompt => (
                  <div 
                    key={prompt.id} 
                    className="group relative bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-6 hover:border-zinc-700 transition-all hover:shadow-xl hover:shadow-black/20"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">{prompt.name}</h4>
                          {prompt.is_default === 1 && (
                            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-wider rounded border border-emerald-500/20">
                              {t.isDefault}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
                          {prompt.type === 'chapter' ? t.typeChapter : 
                           prompt.type === 'outline' ? t.typeOutline : 
                           prompt.type === 'summary' ? t.typeSummary : 
                           prompt.type === 'refactor' ? t.typeRefactor : t.typePolish}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {prompt.is_default !== 1 && (
                          <button 
                            onClick={() => handleSetDefaultPrompt(prompt.id, prompt.type)}
                            className="p-2 text-zinc-500 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-all"
                            title={t.setDefault}
                          >
                            <Sparkles size={16} />
                          </button>
                        )}
                        <button 
                          onClick={() => {
                            setEditingPrompt(prompt);
                            setShowPromptModal(true);
                          }}
                          className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-all"
                        >
                          <Settings size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeletePrompt(prompt.id)}
                          className="p-2 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="relative">
                      <div className="bg-black/20 rounded-xl p-4 border border-zinc-800/50 font-mono text-xs text-zinc-400 leading-relaxed max-h-32 overflow-hidden relative">
                        {prompt.content}
                        <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-zinc-900/40 to-transparent" />
                      </div>
                    </div>
                  </div>
                ))}
                
                {prompts.filter(p => promptFilter === 'all' || p.type === promptFilter).length === 0 && (
                  <div className="col-span-full py-20 flex flex-col items-center justify-center text-zinc-600 border-2 border-dashed border-zinc-800 rounded-3xl">
                    <div className="p-4 bg-zinc-900 rounded-full mb-4">
                      <Plus size={32} />
                    </div>
                    <p className="text-lg font-medium mb-2">暂无模板</p>
                    <p className="text-sm opacity-60">点击右上角按钮添加您的第一个提示词模板</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === "logs" && (
            <motion.div
              key="logs"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <header>
                <h2 className="text-3xl font-bold text-white mb-2">{t.logs}</h2>
                <p className="text-zinc-500">{t.logsDesc}</p>
              </header>

              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left border-b border-zinc-800">
                        <th className="px-4 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t.action}</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t.details}</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t.time}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                      {logs.map(log => (
                        <tr key={log.id} className="text-sm text-zinc-300 hover:bg-zinc-800/30 transition-colors">
                          <td className="px-4 py-4">
                            <span className="font-mono text-emerald-400">{log.action}</span>
                          </td>
                          <td className="px-4 py-4">
                            <p className="text-xs text-zinc-500 max-w-md truncate">{log.details}</p>
                          </td>
                          <td className="px-4 py-4 text-zinc-400 text-xs">
                            {format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {logTotalPages > 1 && (
                  <div className="p-4 border-t border-zinc-800 flex items-center justify-between">
                    <div className="text-xs text-zinc-500">
                      {t.total}: {logTotal}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => fetchLogs(logPage - 1)}
                        disabled={logPage === 1}
                        className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-xs font-medium transition-colors"
                      >
                        {t.prevPage}
                      </button>
                      <span className="text-xs text-zinc-400">
                        {t.page} {logPage} {t.of} {logTotalPages}
                      </span>
                      <button
                        onClick={() => fetchLogs(logPage + 1)}
                        disabled={logPage === logTotalPages}
                        className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-xs font-medium transition-colors"
                      >
                        {t.nextPage}
                      </button>
                    </div>
                  </div>
                )}
              </Card>
            </motion.div>
          )}

          {activeTab === "ai-config" && (
            <motion.div
              key="ai-config"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl mx-auto space-y-8"
            >
              <header>
                <h2 className="text-3xl font-bold text-white mb-2">{t.aiConfig}</h2>
                <p className="text-zinc-500">{t.aiConfigDesc}</p>
              </header>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-1 space-y-2">
                  {(['gemini', 'openai', 'deepseek', 'custom'] as AIProvider[]).map((p) => {
                    const isActive = aiConfigs.find(c => c.provider === p)?.is_active === 1;
                    return (
                      <button
                        key={p}
                        onClick={() => {
                          setActiveProvider(p);
                          setTestResult(null);
                        }}
                        className={cn(
                          "w-full py-3 px-4 rounded-xl border transition-all text-left flex items-center justify-between group relative overflow-hidden",
                          activeProvider === p 
                            ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]" 
                            : "bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:border-zinc-700"
                        )}
                      >
                        <div className="flex flex-col">
                          <span className="font-bold">{t[p]}</span>
                          {isActive && (
                            <span className="text-[10px] text-emerald-500/70 font-medium uppercase tracking-wider mt-0.5">
                              {t.activeAI}
                            </span>
                          )}
                        </div>
                        {isActive && (
                          <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="lg:col-span-3">
                  <Card>
                    <div className="space-y-6">
                      {/* Provider Config Form */}
                      {(() => {
                        const config = aiConfigs.find(c => c.provider === activeProvider) || {
                          provider: activeProvider,
                          model: activeProvider === 'gemini' ? 'gemini-3-flash-preview' : (activeProvider === 'openai' ? 'gpt-4o' : (activeProvider === 'deepseek' ? 'deepseek-chat' : '')),
                          api_key: '',
                          base_url: activeProvider === 'deepseek' ? "https://api.deepseek.com" : (activeProvider === 'openai' ? "https://api.openai.com/v1" : ""),
                          parameters: JSON.stringify({ temperature: 0.7, top_p: 0.9, max_tokens: 2000 }),
                          is_active: 0
                        };

                        let parsedParams = {};
                        try {
                          const parsed = JSON.parse(config.parameters || '{}');
                          if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
                            parsedParams = parsed;
                          }
                        } catch (e) {
                          console.error("Failed to parse AI parameters:", e);
                        }

                        const params = {
                          temperature: 0.7,
                          top_p: 0.9,
                          top_k: 40,
                          max_tokens: 4096,
                          ...parsedParams
                        };

                        return (
                          <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-400">{t.model}</label>
                                <input
                                  type="text"
                                  value={config.model || ""}
                                  onChange={(e) => {
                                    const newConfigs = aiConfigs.map(c => 
                                      c.provider === activeProvider ? { ...c, model: e.target.value } : c
                                    );
                                    if (!newConfigs.find(c => c.provider === activeProvider)) {
                                      newConfigs.push({ ...config, model: e.target.value } as any);
                                    }
                                    setAiConfigs(newConfigs);
                                  }}
                                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-all"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-400">{t.baseUrl}</label>
                                <input
                                  type="text"
                                  value={config.base_url || ""}
                                  onChange={(e) => {
                                    const newConfigs = aiConfigs.map(c => 
                                      c.provider === activeProvider ? { ...c, base_url: e.target.value } : c
                                    );
                                    if (!newConfigs.find(c => c.provider === activeProvider)) {
                                      newConfigs.push({ ...config, base_url: e.target.value } as any);
                                    }
                                    setAiConfigs(newConfigs);
                                  }}
                                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-all"
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <label className="text-sm font-medium text-zinc-400">{t.apiKey}</label>
                              <input
                                type="password"
                                value={config.api_key || ""}
                                onChange={(e) => {
                                  const newConfigs = aiConfigs.map(c => 
                                    c.provider === activeProvider ? { ...c, api_key: e.target.value } : c
                                  );
                                  if (!newConfigs.find(c => c.provider === activeProvider)) {
                                    newConfigs.push({ ...config, api_key: e.target.value } as any);
                                  }
                                  setAiConfigs(newConfigs);
                                }}
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-all font-mono"
                              />
                            </div>

                            <div className="pt-4 border-t border-zinc-800">
                              <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                                <Activity size={16} className="text-emerald-500" />
                                {t.advancedParams}
                              </h4>
                              <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                  <div className="flex justify-between">
                                    <label className="text-xs text-zinc-500">{t.temperature}</label>
                                    <span className="text-xs text-emerald-400">{params.temperature}</span>
                                  </div>
                                  <input 
                                    type="range" min="0" max="2" step="0.1" 
                                    value={params.temperature || 0.7}
                                    onChange={(e) => {
                                      const newParams = { ...params, temperature: parseFloat(e.target.value) };
                                      const newConfigs = aiConfigs.map(c => 
                                        c.provider === activeProvider ? { ...c, parameters: JSON.stringify(newParams) } : c
                                      );
                                      if (!newConfigs.find(c => c.provider === activeProvider)) {
                                        newConfigs.push({ ...config, parameters: JSON.stringify(newParams) } as any);
                                      }
                                      setAiConfigs(newConfigs);
                                    }}
                                    className="w-full accent-emerald-500"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <div className="flex justify-between">
                                    <label className="text-xs text-zinc-500">{t.topP}</label>
                                    <span className="text-xs text-emerald-400">{params.top_p}</span>
                                  </div>
                                  <input 
                                    type="range" min="0" max="1" step="0.05" 
                                    value={params.top_p || 0.9}
                                    onChange={(e) => {
                                      const newParams = { ...params, top_p: parseFloat(e.target.value) };
                                      const newConfigs = aiConfigs.map(c => 
                                        c.provider === activeProvider ? { ...c, parameters: JSON.stringify(newParams) } : c
                                      );
                                      if (!newConfigs.find(c => c.provider === activeProvider)) {
                                        newConfigs.push({ ...config, parameters: JSON.stringify(newParams) } as any);
                                      }
                                      setAiConfigs(newConfigs);
                                    }}
                                    className="w-full accent-emerald-500"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <div className="flex justify-between">
                                    <label className="text-xs text-zinc-500">{t.maxTokens}</label>
                                    <span className="text-xs text-emerald-400">{params.max_tokens}</span>
                                  </div>
                                  <input 
                                    type="range" min="100" max="16384" step="100" 
                                    value={params.max_tokens || 4096}
                                    onChange={(e) => {
                                      const newParams = { ...params, max_tokens: parseInt(e.target.value) };
                                      const newConfigs = aiConfigs.map(c => 
                                        c.provider === activeProvider ? { ...c, parameters: JSON.stringify(newParams) } : c
                                      );
                                      if (!newConfigs.find(c => c.provider === activeProvider)) {
                                        newConfigs.push({ ...config, parameters: JSON.stringify(newParams) } as any);
                                      }
                                      setAiConfigs(newConfigs);
                                    }}
                                    className="w-full accent-emerald-500"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <div className="flex justify-between">
                                    <label className="text-xs text-zinc-500">{t.topK}</label>
                                    <span className="text-xs text-emerald-400">{params.top_k}</span>
                                  </div>
                                  <input 
                                    type="range" min="1" max="100" step="1" 
                                    value={params.top_k || 40}
                                    onChange={(e) => {
                                      const newParams = { ...params, top_k: parseInt(e.target.value) };
                                      const newConfigs = aiConfigs.map(c => 
                                        c.provider === activeProvider ? { ...c, parameters: JSON.stringify(newParams) } : c
                                      );
                                      if (!newConfigs.find(c => c.provider === activeProvider)) {
                                        newConfigs.push({ ...config, parameters: JSON.stringify(newParams) } as any);
                                      }
                                      setAiConfigs(newConfigs);
                                    }}
                                    className="w-full accent-emerald-500"
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-6 border-t border-zinc-800">
                              <div className="flex gap-3">
                                <button 
                                  onClick={() => handleTestConnection(config)}
                                  disabled={isTesting}
                                  className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-bold rounded-xl transition-all flex items-center gap-2"
                                >
                                  {isTesting ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Zap size={16} />}
                                  {t.testConnection}
                                </button>
                                <button 
                                  onClick={() => handleSaveAIConfig({ ...config, is_active: 1 })}
                                  className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-bold rounded-xl transition-all"
                                >
                                  {t.saveSettings}
                                </button>
                              </div>
                              
                              {testResult && (
                                <div className={cn(
                                  "flex items-center gap-2 text-xs font-medium",
                                  testResult.success ? "text-emerald-400" : "text-rose-400"
                                )}>
                                  {testResult.success ? <Sparkles size={14} /> : <X size={14} />}
                                  {testResult.message}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </Card>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "settings" && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-2xl mx-auto space-y-8"
            >
              <header>
                <h2 className="text-3xl font-bold text-white mb-2">{t.writingConfig}</h2>
                <p className="text-zinc-500">Customize how AI generates your story content.</p>
              </header>

              <Card>
                <div className="space-y-6">
                  <div className="space-y-4">
                    <label className="text-sm font-medium text-zinc-400">{t.wordCountRange}</label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <span className="text-[10px] uppercase text-zinc-500 font-bold">{t.minWords}</span>
                        <input
                          type="number"
                          value={writingConfig.minWords ?? ""}
                          onChange={(e) => setWritingConfig({ ...writingConfig, minWords: parseInt(e.target.value) || 0 })}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <span className="text-[10px] uppercase text-zinc-500 font-bold">{t.maxWords}</span>
                        <input
                          type="number"
                          value={writingConfig.maxWords ?? ""}
                          onChange={(e) => setWritingConfig({ ...writingConfig, maxWords: parseInt(e.target.value) || 0 })}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-zinc-800/30 rounded-xl border border-zinc-700/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-500">
                        <Type size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-zinc-200">{t.enforceWordCount}</p>
                        <p className="text-xs text-zinc-500">Enable or disable word count limits for AI generation.</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setWritingConfig({ ...writingConfig, enforceWordCount: !writingConfig.enforceWordCount })}
                      className={cn(
                        "w-12 h-6 rounded-full transition-colors relative",
                        writingConfig.enforceWordCount ? "bg-emerald-500" : "bg-zinc-700"
                      )}
                    >
                      <div className={cn(
                        "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                        writingConfig.enforceWordCount ? "left-7" : "left-1"
                      )} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-zinc-800/30 rounded-xl border border-zinc-700/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-500">
                        <FileText size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-zinc-200">{t.autoSummarize}</p>
                        <p className="text-xs text-zinc-500">Automatically generate a concise summary after completing a chapter.</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setWritingConfig({ ...writingConfig, autoSummarize: !writingConfig.autoSummarize })}
                      className={cn(
                        "w-12 h-6 rounded-full transition-colors relative",
                        writingConfig.autoSummarize ? "bg-emerald-500" : "bg-zinc-700"
                      )}
                    >
                      <div className={cn(
                        "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                        writingConfig.autoSummarize ? "left-7" : "left-1"
                      )} />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-zinc-400">{t.contentLayout}</label>
                      <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">{t.layoutPreview}</span>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="grid grid-cols-1 gap-3">
                        {(['standard', 'web', 'traditional'] as ContentLayout[]).map((l) => (
                          <button
                            key={l}
                            onClick={() => setWritingConfig({ ...writingConfig, layout: l })}
                            className={cn(
                              "py-4 px-4 rounded-xl border transition-all text-left group",
                              writingConfig.layout === l 
                                ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400" 
                                : "bg-zinc-800/50 border-zinc-700 text-zinc-500 hover:border-zinc-600"
                            )}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-bold">{t[`layout${l.charAt(0).toUpperCase() + l.slice(1)}`]}</span>
                              {writingConfig.layout === l && <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" />}
                            </div>
                            <p className="text-[10px] opacity-60 leading-tight">
                              {l === 'standard' && "Balanced paragraphs for a smooth reading experience."}
                              {l === 'web' && "Optimized for mobile with frequent breaks and high readability."}
                              {l === 'traditional' && "Classic literary style with indented first lines and dense text."}
                            </p>
                          </button>
                        ))}
                      </div>

                      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 relative overflow-hidden min-h-[200px] flex flex-col">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-2 h-2 rounded-full bg-zinc-700" />
                          <div className="w-2 h-2 rounded-full bg-zinc-700" />
                          <div className="w-2 h-2 rounded-full bg-zinc-700" />
                        </div>
                        
                        <div className={cn(
                          "flex-1 text-zinc-400 text-xs leading-relaxed transition-all duration-500",
                          writingConfig.layout === 'web' ? "space-y-4" : "space-y-2",
                          writingConfig.layout === 'traditional' ? "[&>p]:indent-[2em]" : ""
                        )}>
                          <p>
                            {writingConfig.layout === 'web' 
                              ? "The sun dipped below the horizon, painting the sky in hues of violet and gold."
                              : "The sun dipped below the horizon, painting the sky in hues of violet and gold. A cool breeze swept through the valley, carrying the scent of pine and damp earth."}
                          </p>
                          <p>
                            {writingConfig.layout === 'web'
                              ? "Kael stood at the edge of the cliff, his cloak billowing behind him."
                              : "Kael stood at the edge of the cliff, his cloak billowing behind him like a dark wing. He had waited for this moment for years, ever since the day the elders had spoken of the prophecy."}
                          </p>
                          {writingConfig.layout === 'web' && (
                            <p>"It's time," he whispered to the wind.</p>
                          )}
                          <p>
                            {writingConfig.layout === 'web'
                              ? "The journey ahead would be long and treacherous."
                              : "The journey ahead would be long and treacherous, but he was ready. With one last look at his home, he stepped forward into the unknown."}
                          </p>
                        </div>

                        <div className="mt-4 pt-4 border-t border-zinc-800/50 flex justify-between items-center opacity-40">
                          <span className="text-[9px] font-mono">STYLE: {writingConfig.layout.toUpperCase()}</span>
                          <span className="text-[9px] font-mono">PREVIEW MODE</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4">
                    <div className="flex gap-4">
                      <button
                        onClick={handleResetSettings}
                        className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 font-bold rounded-xl transition-all border border-zinc-700"
                      >
                        {t.resetSettings || "Reset All"}
                      </button>
                      <button
                        onClick={() => {
                          try {
                            localStorage.setItem("inkflow_ai_config", JSON.stringify(aiConfig));
                            localStorage.setItem("inkflow_writing_config", JSON.stringify(writingConfig));
                            setToast({ message: t.settingsSaved || "Settings saved", type: 'success' });
                          } catch (e) {
                            setToast({ message: "Failed to save settings", type: 'error' });
                          }
                        }}
                        className="flex-[2] py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20"
                      >
                        {t.saveSettings}
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      {/* Task Creation Modal */}
      <AnimatePresence>
        {showTaskModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl"
            >
              <h3 className="text-2xl font-bold text-white mb-6">{t.scheduleTask}</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">{t.taskType}</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => setNewTask({ ...newTask, type: 'generate' })}
                      className={cn(
                        "py-3 px-4 rounded-xl border transition-all text-sm font-medium flex items-center justify-center gap-2",
                        newTask.type === 'generate'
                          ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400"
                          : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600"
                      )}
                    >
                      <Sparkles size={16} />
                      {t.generateChapter}
                    </button>
                    <button 
                      onClick={() => setNewTask({ ...newTask, type: 'publish' })}
                      className={cn(
                        "py-3 px-4 rounded-xl border transition-all text-sm font-medium flex items-center justify-center gap-2",
                        newTask.type === 'publish'
                          ? "bg-blue-500/10 border-blue-500/50 text-blue-400"
                          : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600"
                      )}
                    >
                      <Send size={16} />
                      模拟发布
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">{t.recurrence}</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => setNewTask({ ...newTask, recurrence: 'once' })}
                      className={cn(
                        "py-3 px-4 rounded-xl border transition-all text-sm font-medium flex items-center justify-center gap-2",
                        newTask.recurrence === 'once' || !newTask.recurrence
                          ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400"
                          : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600"
                      )}
                    >
                      {t.recurrenceOnce}
                    </button>
                    <button 
                      onClick={() => setNewTask({ ...newTask, recurrence: 'daily' })}
                      className={cn(
                        "py-3 px-4 rounded-xl border transition-all text-sm font-medium flex items-center justify-center gap-2",
                        newTask.recurrence === 'daily'
                          ? "bg-purple-500/10 border-purple-500/50 text-purple-400"
                          : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600"
                      )}
                    >
                      <RefreshCw size={16} />
                      {t.recurrenceDaily}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">{t.novel}</label>
                  <select 
                    value={newTask.novel_id || ""}
                    onChange={(e) => setNewTask({ ...newTask, novel_id: parseInt(e.target.value) })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-all"
                  >
                    <option value="">{t.selectNovel}</option>
                    {novels.map(n => (
                      <option key={n.id} value={n.id}>{n.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">{t.scheduleTime}</label>
                  <input 
                    type="datetime-local"
                    value={newTask.scheduled_at || ""}
                    onChange={(e) => setNewTask({ ...newTask, scheduled_at: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-all"
                  />
                </div>

                {newTask.type === 'generate' && (
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">{t.generateCount}</label>
                    <input 
                      type="number"
                      min="1"
                      max="50"
                      value={newTask.count || 1}
                      onChange={(e) => setNewTask({ ...newTask, count: parseInt(e.target.value) })}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-all"
                    />
                  </div>
                )}

                <div className="flex gap-4 mt-8">
                  <button 
                    onClick={() => setShowTaskModal(false)}
                    className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-all"
                  >
                    {t.cancel}
                  </button>
                  <button 
                    onClick={handleCreateTask}
                    disabled={!newTask.novel_id || !newTask.scheduled_at}
                    className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold rounded-xl transition-all"
                  >
                    {t.confirm}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPromptModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">
                  {editingPrompt?.id ? "编辑提示词" : "添加提示词"}
                </h3>
                <button 
                  onClick={() => setShowPromptModal(false)}
                  className="text-zinc-500 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">{t.promptName}</label>
                    <input
                      type="text"
                      value={editingPrompt?.name || ""}
                      onChange={(e) => setEditingPrompt(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-zinc-700"
                      placeholder="例如：玄幻风格章节生成"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">{t.promptType}</label>
                    <div className="relative">
                      <select
                        value={editingPrompt?.type || "chapter"}
                        onChange={(e) => setEditingPrompt(prev => ({ ...prev, type: e.target.value as any }))}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 transition-all appearance-none"
                      >
                        <option value="chapter">{t.typeChapter}</option>
                        <option value="outline">{t.typeOutline}</option>
                        <option value="summary">{t.typeSummary}</option>
                        <option value="refactor">{t.typeRefactor}</option>
                        <option value="polish">{t.typePolish}</option>
                      </select>
                      <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between ml-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t.promptContent}</label>
                    <span className="text-[10px] text-zinc-700 font-mono">Supports: {"{title}, {chapter_num}"}</span>
                  </div>
                  <textarea
                    value={editingPrompt?.content || ""}
                    onChange={(e) => setEditingPrompt(prev => ({ ...prev, content: e.target.value }))}
                    className="w-full h-64 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-4 text-zinc-300 focus:outline-none focus:border-emerald-500/50 transition-all font-mono text-sm resize-none leading-relaxed"
                    placeholder="输入提示词内容..."
                  />
                </div>

                <div className="flex items-center gap-3 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl group cursor-pointer" onClick={() => setEditingPrompt(prev => ({ ...prev, is_default: prev?.is_default === 1 ? 0 : 1 }))}>
                  <div className={cn(
                    "w-5 h-5 rounded border flex items-center justify-center transition-all",
                    editingPrompt?.is_default === 1 ? "bg-emerald-500 border-emerald-500 text-black" : "border-zinc-700 group-hover:border-zinc-500"
                  )}>
                    {editingPrompt?.is_default === 1 && <Zap size={12} fill="currentColor" />}
                  </div>
                  <span className="text-sm text-zinc-300 font-medium">
                    设为默认提示词 (Set as Default)
                  </span>
                </div>
              </div>

              <div className="p-6 bg-zinc-800/30 border-t border-zinc-800 flex justify-end gap-3">
                <button
                  onClick={() => setShowPromptModal(false)}
                  className="px-6 py-2 text-zinc-400 hover:text-white transition-colors"
                >
                  {t.cancel}
                </button>
                <button
                  onClick={handleSavePrompt}
                  className="px-8 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl transition-all"
                >
                  {t.confirm}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOutlinePreview && activeOutline && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-12">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOutlinePreview(false)}
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
                  onClick={() => setIsOutlinePreview(false)}
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
                  onClick={() => setIsOutlinePreview(false)}
                  className="px-8 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20"
                >
                  {t.confirm}
                </button>
              </div>
            </motion.div>
          </div>
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

const Toast = ({ message, type, onClose }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 50 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 50 }}
    className={cn(
      "fixed bottom-12 left-1/2 -translate-x-1/2 z-[100] px-8 py-4 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center gap-4 border backdrop-blur-xl",
      type === 'success' 
        ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300" 
        : "bg-rose-500/20 border-rose-500/40 text-rose-300"
    )}
  >
    <div className={cn(
      "w-8 h-8 rounded-full flex items-center justify-center",
      type === 'success' ? "bg-emerald-500/20" : "bg-rose-500/20"
    )}>
      {type === 'success' ? <Sparkles size={20} /> : <X size={20} className="cursor-pointer" onClick={onClose} />}
    </div>
    <span className="text-base font-semibold tracking-wide">{message}</span>
  </motion.div>
);

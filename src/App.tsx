import React, { useState, useEffect } from "react";
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
  TrendingUp,
  BookMarked,
  Languages,
  Trash2,
  X,
  Layers
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
import { Novel, Chapter, TokenStats, OutlineVersion, AIConfig, AIProvider, WritingConfig, ContentLayout } from "./types";
import { generateAIContent, generateAIOutline } from "./services/aiService";
import { translations, Language } from "./constants";

// --- Components ---

const SidebarItem = ({ icon: Icon, label, active, onClick }: any) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all duration-200",
      active 
        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
        : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
    )}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
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
      {trend && (
        <p className={cn("text-xs mt-1 flex items-center gap-1", trend > 0 ? "text-emerald-400" : "text-rose-400")}>
          <TrendingUp size={12} className={trend < 0 ? "rotate-180" : ""} />
          {Math.abs(trend)}% {t.fromLastWeek}
        </p>
      )}
    </div>
    <div className="p-3 bg-zinc-800 rounded-xl text-emerald-400">
      <Icon size={24} />
    </div>
  </Card>
);

// --- Main App ---

export default function App() {
  const [lang, setLang] = useState<Language>("zh");
  const t = translations[lang];

  const [activeTab, setActiveTab] = useState("dashboard");
  const [novels, setNovels] = useState<Novel[]>([]);
  const [stats, setStats] = useState<TokenStats | null>(null);
  const [selectedNovel, setSelectedNovel] = useState<Novel | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);
  const [activeOutline, setActiveOutline] = useState<OutlineVersion | null>(null);
  const [isWriting, setIsWriting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSegmenting, setIsSegmenting] = useState(false);
  const [segmentProgress, setSegmentProgress] = useState(0);
  const [isGeneratingOutline, setIsGeneratingOutline] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [batchCount, setBatchCount] = useState(3);
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const [novelToDelete, setNovelToDelete] = useState<number | null>(null);
  const [newNovelTitle, setNewNovelTitle] = useState("");
  const [newNovelGenre, setNewNovelGenre] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

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
    };
  });

  useEffect(() => {
    localStorage.setItem("inkflow_ai_config", JSON.stringify(aiConfig));
  }, [aiConfig]);

  useEffect(() => {
    localStorage.setItem("inkflow_writing_config", JSON.stringify(writingConfig));
  }, [writingConfig]);

  useEffect(() => {
    fetchNovels();
    fetchStats();
  }, []);

  const fetchNovels = async () => {
    try {
      const res = await fetch("/api/novels");
      if (!res.ok) throw new Error("Failed to fetch novels");
      const data = await res.json();
      setNovels(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/stats/tokens");
      if (!res.ok) throw new Error("Failed to fetch stats");
      const data = await res.json();
      setStats(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchNovelDetails = async (id: number) => {
    try {
      const res = await fetch(`/api/novels/${id}`);
      if (!res.ok) throw new Error("Failed to fetch novel details");
      const data = await res.json();
      setSelectedNovel(data);
      setChapters(data.chapters || []);
      const active = data.outlines?.find((o: OutlineVersion) => o.is_active === 1) || data.outlines?.[0] || null;
      setActiveOutline(active);
      setActiveTab("editor");
    } catch (e) {
      console.error(e);
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
      const data = await res.json();
      setNewNovelTitle("");
      setNewNovelGenre("");
      setShowCreateModal(false);
      await fetchNovels();
      await fetchNovelDetails(data.id);
    } catch (error) {
      console.error(error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleSaveChapter = async () => {
    if (!currentChapter || !selectedNovel) return;
    setIsSaving(true);
    
    let scheduledAt = currentChapter.scheduled_at;
    if (scheduledAt && scheduledAt.length > 0) {
      try {
        // Ensure it's stored as UTC ISO string
        scheduledAt = new Date(scheduledAt).toISOString();
      } catch (e) {
        console.error("Invalid date:", scheduledAt);
      }
    }

    try {
      const res = await fetch(`/api/chapters/${currentChapter.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          content: currentChapter.content,
          title: currentChapter.title,
          scheduled_at: scheduledAt || null
        }),
      });
      if (!res.ok) throw new Error("Failed to save chapter");
      await fetchNovelDetails(selectedNovel.id);
      setLastSavedAt(new Date());
    } catch (error) {
      console.error("Error saving chapter:", error);
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
      if (!res.ok) throw new Error("Failed to save outline");
      fetchNovelDetails(selectedNovel.id);
    } catch (error) {
      console.error("Error saving outline:", error);
    }
  };

  const handleCreateOutlineVersion = async () => {
    if (!selectedNovel) return;
    try {
      const name = prompt(t.versionName, `V${(selectedNovel.outlines?.length || 0) + 1}.0`);
      if (!name) return;
      const res = await fetch(`/api/novels/${selectedNovel.id}/outlines`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version_name: name, content: activeOutline?.content || "" }),
      });
      if (!res.ok) throw new Error("Failed to create outline version");
      fetchNovelDetails(selectedNovel.id);
    } catch (error) {
      console.error("Error creating outline version:", error);
    }
  };

  const handleActivateOutline = async (id: number) => {
    if (!selectedNovel) return;
    try {
      const res = await fetch(`/api/outlines/${id}/activate`, {
        method: "PATCH",
      });
      if (!res.ok) throw new Error("Failed to activate outline");
      fetchNovelDetails(selectedNovel.id);
    } catch (error) {
      console.error("Error activating outline:", error);
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
      if (!res.ok) throw new Error("Failed to delete novel");
      
      if (selectedNovel?.id === novelToDelete) {
        setSelectedNovel(null);
        setActiveTab("novels");
      }
      setNovelToDelete(null);
      fetchNovels();
      fetchStats();
    } catch (error) {
      console.error("Error deleting novel:", error);
    }
  };

  const handleAIWrite = async () => {
    if (!currentChapter || !selectedNovel) return;
    setIsGenerating(true);
    try {
      const activeOutlineContent = selectedNovel.outlines?.find(o => o.is_active === 1)?.content || "";
      const currentContent = currentChapter.content || "";
      
      // Stronger context for layout
      const layoutContext = `IMPORTANT: Follow the ${writingConfig.layout} layout style strictly.`;
      const prompt = `${layoutContext}\n\nContinue writing the chapter titled "${currentChapter.title}". The current content is: ${currentContent.slice(-800)}`;
      const context = `Novel Title: ${selectedNovel.title}\nOutline: ${activeOutlineContent}`;
      
      const result = await generateAIContent(prompt, context, aiConfig, writingConfig, lang);
      
      const newContent = currentContent + (currentContent ? "\n\n" : "") + result.text;
      
      // Update locally
      setCurrentChapter({ ...currentChapter, content: newContent });
      
      // Update on server with token usage
      await fetch(`/api/chapters/${currentChapter.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          content: newContent,
          token_usage: Math.round(result.tokens)
        }),
      });
      
      fetchStats();
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSegmentedWrite = async () => {
    if (!currentChapter || !selectedNovel) return;
    setIsSegmenting(true);
    setSegmentProgress(0);
    
    try {
      const activeOutlineContent = selectedNovel.outlines?.find(o => o.is_active === 1)?.content || "";
      let currentContent = currentChapter.content || "";
      let totalTokens = 0;
      
      // We'll do up to 3 segments to try and reach the target
      const segments = 3;
      for (let i = 0; i < segments; i++) {
        setSegmentProgress(Math.round(((i) / segments) * 100));
        
        const layoutContext = `STRICT LAYOUT: Use the ${writingConfig.layout} style. For web novels, this means MAX 2 sentences per paragraph.`;
        const prompt = `${layoutContext}\n\nThis is segment ${i + 1} of ${segments} for the chapter "${currentChapter.title}". 
        ${i > 0 ? "CONTINUE exactly where the previous text ended. DO NOT repeat the previous sentences. Start with the next action or dialogue immediately." : "START the chapter from the beginning."} 
        
        Previous context for flow: ${currentContent.slice(-1000)}`;
        const context = `Novel Title: ${selectedNovel.title}\nOutline: ${activeOutlineContent}`;
        
        const result = await generateAIContent(prompt, context, aiConfig, writingConfig, lang);
        
        currentContent += (currentContent ? "\n\n" : "") + result.text;
        totalTokens += result.tokens;
        
        // Update locally after each segment for feedback
        setCurrentChapter(prev => prev ? { ...prev, content: currentContent } : null);
        
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
    } catch (error) {
      console.error("Segmented Write Error:", error);
    } finally {
      setIsSegmenting(false);
      setSegmentProgress(0);
    }
  };

  const handleAIGenerateOutline = async () => {
    if (!selectedNovel) return;
    setIsGeneratingOutline(true);
    try {
      const result = await generateAIOutline(selectedNovel.title, selectedNovel.description || "Novel", aiConfig, lang);
      
      // Create a new version with the generated content
      const res = await fetch(`/api/novels/${selectedNovel.id}/outlines`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          version_name: `AI Generated ${format(new Date(), "HH:mm")}`,
          content: result.text
        }),
      });
      
      if (res.ok) {
        await fetchNovelDetails(selectedNovel.id);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsGeneratingOutline(false);
    }
  };

  const handleAddChapter = async () => {
    if (!selectedNovel) return;
    const title = `${t.chapters} ${chapters.length + 1}`;
    const res = await fetch("/api/chapters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ novel_id: selectedNovel.id, title, content: "" }),
    });
    const data = await res.json();
    await fetchNovelDetails(selectedNovel.id);
    return data.id;
  };

  const handleBatchGenerate = async () => {
    if (!selectedNovel || isBatchGenerating) return;
    setIsBatchGenerating(true);
    setShowBatchModal(false);
    
    try {
      const activeOutlineContent = selectedNovel.outlines?.find(o => o.is_active === 1)?.content || "";
      
      for (let i = 0; i < batchCount; i++) {
        const novelInfoRes = await fetch(`/api/novels/${selectedNovel.id}`);
        if (!novelInfoRes.ok) throw new Error("Failed to fetch novel info during batch generate");
        const novelInfo = await novelInfoRes.json();
        const currentChapters = novelInfo.chapters || [];
        const nextChapterNum = currentChapters.length + 1;
        const title = `${t.chapters} ${nextChapterNum}`;
        
        // 1. Create chapter
        const createRes = await fetch("/api/chapters", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ novel_id: selectedNovel.id, title, content: "" }),
        });
        if (!createRes.ok) throw new Error("Failed to create chapter during batch generate");
        const chapterData = await createRes.json();
        const chapterId = chapterData.id;

        // 2. Generate content
        const prompt = `Write the full content for ${title}. Focus on advancing the plot according to the outline.`;
        const context = `Novel Title: ${selectedNovel.title}\nOutline: ${activeOutlineContent}\nPrevious Chapters Context: ${currentChapters.slice(-1).map((c: any) => c.title + ": " + (c.content || "").slice(-300)).join("\n")}`;
        const result = await generateAIContent(prompt, context, aiConfig, writingConfig, lang);
        
        // 3. Update chapter
        await fetch(`/api/chapters/${chapterId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            title: result.title || title,
            content: result.text,
            token_usage: Math.round(result.tokens)
          }),
        });
      }
      
      await fetchNovelDetails(selectedNovel.id);
      fetchStats();
    } catch (error) {
      console.error(error);
    } finally {
      setIsBatchGenerating(false);
    }
  };

  return (
    <div className="flex h-screen bg-black text-zinc-300 font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r border-zinc-800 p-6 flex flex-col gap-8">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-black">
            <Sparkles size={24} />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">{t.appName}</h1>
        </div>

        <nav className="flex flex-col gap-2">
          <SidebarItem 
            icon={LayoutDashboard} 
            label={t.dashboard} 
            active={activeTab === "dashboard"} 
            onClick={() => setActiveTab("dashboard")} 
          />
          <SidebarItem 
            icon={BookOpen} 
            label={t.myNovels} 
            active={activeTab === "novels"} 
            onClick={() => setActiveTab("novels")} 
          />
          <SidebarItem 
            icon={BarChart3} 
            label={t.statistics} 
            active={activeTab === "stats"} 
            onClick={() => setActiveTab("stats")} 
          />
          <SidebarItem 
            icon={Settings} 
            label={t.settings} 
            active={activeTab === "settings"} 
            onClick={() => setActiveTab("settings")} 
          />
        </nav>

        <div className="mt-auto space-y-4">
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
          <button 
            onClick={() => setShowCreateModal(true)}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl flex items-center justify-center gap-2 transition-all"
          >
            <Plus size={20} />
            {t.newNovel}
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
                    value={newNovelTitle}
                    onChange={(e) => setNewNovelTitle(e.target.value)}
                    placeholder={t.enterTitle}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateNovel()}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">类型/风格 (Genre/Style)</label>
                  <input 
                    value={newNovelGenre}
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
              <h3 className="text-2xl font-bold text-white mb-6">{t.batchGenerate}</h3>
              <div className="space-y-4 mb-8">
                <label className="block text-sm text-zinc-500 mb-2">{t.generateCount}</label>
                <div className="flex gap-4">
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
                    <p className="text-zinc-500 text-center italic mb-12">{selectedNovel.description}</p>
                    
                    <div className="space-y-24">
                      {chapters.map((ch, idx) => (
                        <div key={ch.id} id={`preview-chapter-${ch.id}`} className="space-y-8 scroll-mt-24">
                          <div className="flex items-center gap-4">
                            <div className="h-px flex-1 bg-zinc-800"></div>
                            <h2 className="text-2xl font-bold text-emerald-400">第 {idx + 1} 章：{ch.title}</h2>
                            <div className="h-px flex-1 bg-zinc-800"></div>
                          </div>
                          <div className="text-zinc-300 text-lg leading-loose whitespace-pre-wrap font-serif">
                            {ch.content || "（暂无内容）"}
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

      {/* Batch Generating Overlay */}
      <AnimatePresence>
        {isBatchGenerating && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md">
            <div className="text-center">
              <div className="relative w-24 h-24 mx-auto mb-6">
                <div className="absolute inset-0 border-4 border-emerald-500/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <Sparkles className="absolute inset-0 m-auto text-emerald-400 animate-pulse" size={32} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">{t.generatingChapters}</h3>
              <p className="text-zinc-400">AI 正在为您构思精彩剧情，请稍候...</p>
            </div>
          </div>
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard 
                  label={t.totalTokens} 
                  value={stats?.totalTokens.toLocaleString() || "0"} 
                  icon={Sparkles} 
                  trend={12} 
                  t={t}
                />
                <StatCard 
                  label={t.totalViews} 
                  value={novels.reduce((acc, n) => acc + n.views, 0).toLocaleString()} 
                  icon={Eye} 
                  trend={5} 
                  t={t}
                />
                <StatCard 
                  label={t.activeNovels} 
                  value={novels.length} 
                  icon={BookMarked} 
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
                            <BookOpen size={24} />
                          </div>
                          <div>
                            <h4 className="font-semibold text-zinc-100 group-hover:text-emerald-400 transition-colors">{novel.title}</h4>
                            <p className="text-xs text-zinc-500 mt-1">{novel.chapter_count} {t.chapters} • {novel.total_tokens?.toLocaleString() || 0} {t.tokens}</p>
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
                      <div className="w-20 h-28 bg-zinc-800 rounded-lg flex items-center justify-center text-zinc-600 shadow-xl">
                        <BookOpen size={40} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors">{novel.title}</h3>
                        <p className="text-sm text-zinc-500 line-clamp-2 mt-2">{novel.description}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-800">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">{t.progress}</p>
                        <p className="text-sm text-zinc-200">{novel.chapter_count} {t.chapters}</p>
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

          {activeTab === "editor" && selectedNovel && (
            <motion.div
              key="editor"
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
                  <div>
                    <h2 className="text-2xl font-bold text-white">{selectedNovel.title}</h2>
                    <p className="text-sm text-zinc-500">{t.editingChapter}: {currentChapter?.title || t.selectChapter}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
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
                  <button className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-lg flex items-center gap-2 transition-all">
                    <Send size={18} />
                    {t.publish}
                  </button>
                </div>
              </header>

              <div className="flex-1 flex gap-6 min-h-0">
                {/* Chapter List */}
                <div className="w-64 flex flex-col gap-4">
                  <Card className="flex-1 flex flex-col p-4 overflow-hidden" title={t.chapters}>
                    <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                      {chapters.map(ch => (
                        <button
                          key={ch.id}
                          onClick={() => setCurrentChapter(ch)}
                          className={cn(
                            "w-full text-left p-3 rounded-lg text-sm transition-all",
                            currentChapter?.id === ch.id 
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                              : "text-zinc-400 hover:bg-zinc-800"
                          )}
                        >
                          <div className="flex justify-between items-center">
                            <span className="truncate font-medium">{ch.title}</span>
                            {ch.status === 'published' && <Clock size={12} className="text-emerald-500" />}
                          </div>
                          <p className="text-[10px] text-zinc-600 mt-1">{ch.word_count} {t.words}</p>
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-4">
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
                        <Sparkles size={16} />
                      </button>
                    </div>
                  </Card>
                </div>

                {/* Editor Area */}
                <div className="flex-1 flex flex-col gap-4">
                  {currentChapter ? (
                    <>
                      <Card className="flex-1 p-0 overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                          <input 
                            value={currentChapter.title}
                            onChange={(e) => setCurrentChapter({...currentChapter, title: e.target.value})}
                            className="bg-transparent border-none text-xl font-bold text-white focus:outline-none w-full"
                          />
                          <div className="flex items-center gap-4 text-xs text-zinc-500">
                            <span>{currentChapter.content.length} {t.characters}</span>
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
                        <textarea
                          value={currentChapter.content}
                          onChange={(e) => setCurrentChapter({...currentChapter, content: e.target.value})}
                          placeholder={t.startWriting}
                          className="flex-1 p-8 bg-transparent border-none text-zinc-300 text-lg leading-relaxed focus:outline-none resize-none"
                        />
                        <div className="p-4 bg-zinc-900/80 border-t border-zinc-800 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 flex-wrap">
                            <button 
                              onClick={handleAIWrite}
                              disabled={isGenerating || isSegmenting}
                              className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg flex items-center gap-2 transition-all disabled:opacity-50 whitespace-nowrap"
                            >
                              <Sparkles size={16} />
                              {isGenerating ? t.aiWriting : t.aiAssist}
                            </button>

                            <button 
                              onClick={handleSegmentedWrite}
                              disabled={isGenerating || isSegmenting}
                              className="px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded-lg flex items-center gap-2 transition-all disabled:opacity-50 whitespace-nowrap relative overflow-hidden"
                            >
                              <Layers size={16} />
                              {isSegmenting ? `${t.segmentedWriting} ${segmentProgress}%` : t.segmentedWrite}
                              {isSegmenting && (
                                <div 
                                  className="absolute bottom-0 left-0 h-0.5 bg-indigo-500 transition-all duration-300" 
                                  style={{ width: `${segmentProgress}%` }}
                                />
                              )}
                            </button>
                            
                            <div className="h-6 w-px bg-zinc-800 hidden sm:block" />

                            <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800/30 border border-zinc-700/30 rounded-lg">
                              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                              <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">{t.activeAI}:</span>
                              <span className="text-[10px] text-emerald-400 font-mono font-bold">{aiConfig.provider.toUpperCase()} ({aiConfig.model})</span>
                            </div>

                            <div className="flex items-center gap-3 px-3 py-1.5 bg-zinc-800/30 border border-zinc-700/30 rounded-lg group hover:border-emerald-500/40 transition-all duration-300">
                              <Calendar size={14} className="text-zinc-500 group-hover:text-emerald-400" />
                              <input 
                                type="datetime-local"
                                value={(() => {
                                  if (!currentChapter.scheduled_at) return "";
                                  try {
                                    const d = new Date(currentChapter.scheduled_at);
                                    if (!isNaN(d.getTime())) {
                                      return format(d, "yyyy-MM-dd'T'HH:mm");
                                    }
                                  } catch (e) {}
                                  return currentChapter.scheduled_at;
                                })()}
                                onChange={(e) => setCurrentChapter({...currentChapter, scheduled_at: e.target.value})}
                                onBlur={handleSaveChapter}
                                onClick={(e) => (e.target as any).showPicker?.()}
                                className="bg-transparent border-none text-[10px] focus:outline-none text-zinc-400 cursor-pointer hover:text-white transition-colors w-32 [color-scheme:dark] font-medium"
                              />
                            </div>
                          </div>

                          <div className="text-[10px] text-zinc-600 italic flex items-center gap-2 shrink-0">
                            {isSaving ? (
                              <>
                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                正在保存...
                              </>
                            ) : (
                              <>
                                {t.autoSaved}
                                {lastSavedAt && (
                                  <span className="ml-1 opacity-60">
                                    ({format(lastSavedAt, "HH:mm:ss")})
                                  </span>
                                )}
                              </>
                            )}
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
                      <button 
                        onClick={handleSaveOutline}
                        className="p-1.5 hover:bg-zinc-800 rounded-lg text-emerald-400 transition-all"
                        title={t.save}
                      >
                        <Save size={16} />
                      </button>
                    }
                  >
                    {activeOutline ? (
                      <div className="flex flex-col h-full gap-4">
                        <div className="flex items-center justify-between">
                          <select 
                            value={activeOutline.id}
                            onChange={(e) => {
                              const selected = selectedNovel.outlines?.find(o => o.id === parseInt(e.target.value));
                              if (selected) setActiveOutline(selected);
                            }}
                            className="bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-zinc-300 focus:outline-none"
                          >
                            {selectedNovel.outlines?.map(o => (
                              <option key={o.id} value={o.id}>{o.version_name} {o.is_active ? `(${t.activeVersion})` : ""}</option>
                            ))}
                          </select>
                          <div className="flex gap-1">
                            <button 
                              onClick={handleAIGenerateOutline}
                              disabled={isGeneratingOutline}
                              className="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-emerald-400 disabled:opacity-50"
                              title={t.generateOutline}
                            >
                              <Sparkles size={14} className={isGeneratingOutline ? "animate-pulse" : ""} />
                            </button>
                            {!activeOutline.is_active && (
                              <button 
                                onClick={() => handleActivateOutline(activeOutline.id)}
                                className="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-emerald-400"
                                title={t.activate}
                              >
                                <TrendingUp size={14} />
                              </button>
                            )}
                            <button 
                              onClick={handleCreateOutlineVersion}
                              className="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-emerald-400"
                              title={t.newVersion}
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>
                        <textarea 
                          value={activeOutline.content}
                          onChange={(e) => setActiveOutline({...activeOutline, content: e.target.value})}
                          placeholder={t.outlinePlaceholder}
                          className="flex-1 bg-transparent border-none text-sm text-zinc-400 leading-relaxed focus:outline-none resize-none"
                        />
                      </div>
                    ) : (
                      <div className="flex-1 flex items-center justify-center text-zinc-600 italic text-xs">
                        No outline versions found
                      </div>
                    )}
                  </Card>
                </div>
              </div>
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

              <Card title={t.tokenHistoryLog}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-zinc-800 text-zinc-500 text-xs uppercase tracking-wider">
                        <th className="px-4 py-3 font-bold">{t.novel}</th>
                        <th className="px-4 py-3 font-bold">{t.date}</th>
                        <th className="px-4 py-3 font-bold">{t.tokens}</th>
                        <th className="px-4 py-3 font-bold">{t.status}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {novels.map(novel => (
                        <tr key={novel.id} className="text-sm text-zinc-300 hover:bg-zinc-800/30 transition-colors">
                          <td className="px-4 py-4 font-medium">{novel.title}</td>
                          <td className="px-4 py-4 text-zinc-500">{format(new Date(novel.created_at), 'MMM dd, yyyy')}</td>
                          <td className="px-4 py-4 text-emerald-400 font-mono">{novel.total_tokens?.toLocaleString() || 0}</td>
                          <td className="px-4 py-4">
                            <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] rounded-full border border-emerald-500/20">{t.active}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
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
                <h2 className="text-3xl font-bold text-white mb-2">{t.aiSettings}</h2>
                <p className="text-zinc-500">Configure your AI providers and models.</p>
              </header>

              <Card>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-400">{t.aiProvider}</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {(['gemini', 'openai', 'deepseek', 'custom'] as AIProvider[]).map((p) => (
                        <button
                          key={p}
                          onClick={() => setAiConfig({ ...aiConfig, provider: p, model: p === 'gemini' ? 'gemini-3-flash-preview' : (p === 'openai' ? 'gpt-4o' : (p === 'deepseek' ? 'deepseek-chat' : '')) })}
                          className={cn(
                            "py-3 px-2 rounded-xl border transition-all text-[10px] sm:text-xs font-medium",
                            aiConfig.provider === p 
                              ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400" 
                              : "bg-zinc-800/50 border-zinc-700 text-zinc-500 hover:border-zinc-600"
                          )}
                        >
                          {t[p]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-400">{t.aiModel}</label>
                    <input
                      type="text"
                      value={aiConfig.model}
                      onChange={(e) => setAiConfig({ ...aiConfig, model: e.target.value })}
                      placeholder={t.modelPlaceholder}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-400">{t.apiKey} {aiConfig.provider === 'gemini' && '(Optional if set in env)'}</label>
                    <input
                      type="password"
                      value={aiConfig.apiKey || ""}
                      onChange={(e) => setAiConfig({ ...aiConfig, apiKey: e.target.value })}
                      placeholder={t.apiKeyPlaceholder}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-all font-mono"
                    />
                  </div>

                  {aiConfig.provider !== 'gemini' && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-400">{t.baseUrl}</label>
                      <input
                        type="text"
                        value={aiConfig.baseUrl || ""}
                        onChange={(e) => setAiConfig({ ...aiConfig, baseUrl: e.target.value })}
                        placeholder={aiConfig.provider === 'deepseek' ? "https://api.deepseek.com" : "https://api.openai.com/v1"}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-all"
                      />
                    </div>
                  )}
                </div>
              </Card>

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
                          value={writingConfig.minWords}
                          onChange={(e) => setWritingConfig({ ...writingConfig, minWords: parseInt(e.target.value) || 0 })}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <span className="text-[10px] uppercase text-zinc-500 font-bold">{t.maxWords}</span>
                        <input
                          type="number"
                          value={writingConfig.maxWords}
                          onChange={(e) => setWritingConfig({ ...writingConfig, maxWords: parseInt(e.target.value) || 0 })}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-all"
                        />
                      </div>
                    </div>
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
                    <button
                      onClick={() => {
                        localStorage.setItem("inkflow_ai_config", JSON.stringify(aiConfig));
                        localStorage.setItem("inkflow_writing_config", JSON.stringify(writingConfig));
                        alert(t.settingsSaved);
                      }}
                      className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20"
                    >
                      {t.saveSettings}
                    </button>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

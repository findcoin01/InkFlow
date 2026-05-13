import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
  Cell 
} from "recharts";
import { 
  TrendingUp, 
  Clock, 
  FileText, 
  Calendar, 
  Activity, 
  FileCheck,
  BarChart3,
  Sparkles
} from "lucide-react";
import { motion } from "motion/react";
import { cn } from "../lib/utils";
import Card from "../components/ui/Card";
import StatCard from "../components/ui/StatCard";
import { Novel, Chapter, TokenLog, TokenStats } from "../types";

interface StatsPageProps {
  stats: TokenStats;
  tokenLogs: TokenLog[];
  tokenLogPage: number;
  tokenLogTotal: number;
  tokenLogTotalPages: number;
  fetchTokenLogs: (page?: number) => Promise<void>;
  t: any;
}

const StatsPage: React.FC<StatsPageProps> = ({
  stats,
  tokenLogs,
  tokenLogPage,
  tokenLogTotal,
  tokenLogTotalPages,
  fetchTokenLogs,
  t
}) => {
  const totalTokens = stats.totalTokens;

  // Data for chart: Tokens per novel (since words per novel is not directly available in stats)
  const chartData = stats.tokensByNovel.map(n => ({
    name: n.title.length > 10 ? n.title.substring(0, 10) + '...' : n.title,
    tokens: n.tokens
  })).sort((a, b) => b.tokens - a.tokens).slice(0, 8);

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <motion.div
      key="stats"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <header>
        <h2 className="text-3xl font-bold text-white mb-2">{t.statistics}</h2>
        <p className="text-zinc-500">{t.analyticsSub}</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label={t.totalTokens} value={totalTokens.toLocaleString()} icon={<Zap className="text-amber-500" size={20} />} trend={stats.tokenTrend ? (stats.tokenTrend > 0 ? "+" : "") + stats.tokenTrend + "%" : undefined} t={t} />
        <StatCard label={t.totalViews} value={0} icon={<Activity size={20} />} trend={stats.viewTrend ? (stats.viewTrend > 0 ? "+" : "") + stats.viewTrend + "%" : undefined} t={t} />
        <StatCard label={t.activeNovels} value={stats.tokensByNovel.length} icon={<FileText size={20} />} t={t} />
        <StatCard label={t.tokens} value={totalTokens} icon={<BarChart3 size={20} />} t={t} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card title={t.tokenUsageByNovel}>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12 }} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }}
                  itemStyle={{ color: '#10b981' }}
                />
                <Bar dataKey="tokens" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title={t.recentActivity}>
          <div className="space-y-4">
            {tokenLogs.slice(0, 6).map((log, i) => (
              <div key={log.id || i} className="flex items-center gap-4 p-4 bg-zinc-900/30 rounded-2xl border border-zinc-800/50">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center",
                  (log as any).action?.includes('generate') ? "bg-emerald-500/10 text-emerald-400" : "bg-blue-500/10 text-blue-400"
                )}>
                  {(log as any).action?.includes('generate') ? <Sparkles size={18} /> : <Zap size={18} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-bold text-white truncate">{(log as any).action || log.type}</p>
                    <span className="text-[10px] text-zinc-500 font-mono">{new Date(log.created_at).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5 truncate">{(log as any).model || log.chapter_title || 'System'}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-emerald-400">{(log as any).total_tokens || log.tokens} tokens</p>
                  <p className="text-[10px] text-zinc-600">SUCCESS</p>
                </div>
              </div>
            ))}
            {tokenLogs.length === 0 && (
              <div className="py-12 text-center text-zinc-600 italic">
                {t.noActivityFound}
              </div>
            )}
          </div>
        </Card>
      </div>
    </motion.div>
  );
};

// Reusable icons
const Zap = ({ className, size }: { className?: string; size?: number }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size || 24} 
    height={size || 24} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>
  </svg>
);

export default StatsPage;

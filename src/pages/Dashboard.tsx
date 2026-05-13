import React from 'react';
import { motion } from "motion/react";
import { 
  Sparkles, 
  Eye, 
  BookMarked, 
  Calendar, 
  ChevronRight,
  BookOpen
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { cn, formatDate } from "../lib/utils";
import { Novel, TokenStats, ScheduledTask } from "../types";
import Logo from "../components/Logo";
import StatCard from "../components/ui/StatCard";
import Card from "../components/ui/Card";

interface DashboardProps {
  stats: TokenStats | null;
  novels: Novel[];
  tasks: ScheduledTask[];
  t: any;
  fetchNovelDetails: (id: number) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  stats, 
  novels, 
  tasks, 
  t, 
  fetchNovelDetails 
}) => {
  return (
    <motion.div
      key="dashboard"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      <header className="flex items-center gap-6">
        <Logo size={80} className="hidden sm:block" />
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">{t.welcomeBack}</h2>
          <p className="text-zinc-500 text-lg">{t.dashboardSub}</p>
        </div>
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
          value={tasks.filter(tk => tk.status === 'pending').length} 
          icon={Calendar} 
          trend={tasks.find(tk => tk.status === 'pending') ? formatDate(tasks.find(tk => tk.status === 'pending')!.scheduled_at, 'HH:mm') : undefined}
          t={t}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title={t.tokenConsumption}>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats?.dailyTokens.map(d => ({ ...d, date: formatDate(d.date, 'MMM dd') })) || []}>
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
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-zinc-100 group-hover:text-emerald-400 transition-colors">{novel.title}</h4>
                      {novel.genre && (
                        <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold rounded uppercase tracking-wider">
                          {novel.genre}
                        </span>
                      )}
                    </div>
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
  );
};

export default Dashboard;

import React from 'react';
import { 
  Plus, 
  Trash2, 
  RefreshCw, 
  Clock, 
  Zap,
  Send,
  Sparkles,
  Calendar
} from "lucide-react";
import { motion } from "motion/react";
import { cn, formatDate } from "../lib/utils";
import Card from "../components/ui/Card";
import { Task, Novel } from "../types";

interface TasksPageProps {
  tasks: Task[];
  novels: Novel[];
  handleDeleteTask: (id: number) => Promise<void>;
  handleRunTask: (id: number) => Promise<void>;
  setShowTaskModal: (show: boolean) => void;
  t: any;
}

const TasksPage: React.FC<TasksPageProps> = ({
  tasks,
  novels,
  handleDeleteTask,
  handleRunTask,
  setShowTaskModal,
  t
}) => {
  return (
    <motion.div
      key="tasks"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">{t.scheduledTasks}</h2>
          <p className="text-zinc-500">{t.scheduledTasksDesc}</p>
        </div>
        <button 
          onClick={() => setShowTaskModal(true)}
          className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
        >
          <Plus size={20} />
          {t.addSchedule}
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">{t.totalTasks}</p>
          <p className="text-3xl font-bold text-white">{tasks.length}</p>
        </div>
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">{t.pendingTasks}</p>
          <p className="text-3xl font-bold text-amber-500">{tasks.filter(t => t.status === 'pending').length}</p>
        </div>
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">{t.completedTasks}</p>
          <p className="text-3xl font-bold text-emerald-500">{tasks.filter(t => t.status === 'completed').length}</p>
        </div>
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">{t.failedTasks}</p>
          <p className="text-3xl font-bold text-rose-500">{tasks.filter(t => t.status === 'failed').length}</p>
        </div>
      </div>

      <div className="space-y-4">
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-zinc-800">
                  <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t.taskType}</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t.targetNovel}</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t.recurrence}</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t.scheduleTime}</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t.status}</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-right">{t.action}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {tasks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center text-zinc-600 italic">
                      {t.noTasksFound}
                    </td>
                  </tr>
                ) : (
                  tasks.map(task => (
                    <tr key={task.id} className="hover:bg-zinc-800/20 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {task.type === 'generate' ? (
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                              <Sparkles size={14} />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                              <Send size={14} />
                            </div>
                          )}
                          <div className="space-y-0.5">
                            <p className="text-sm font-bold text-white">
                              {task.type === 'generate' ? t.generateChapter : t.mockPublish}
                            </p>
                            {task.type === 'generate' && (
                              <p className="text-[10px] text-zinc-500">{t.count}: {task.count || 1}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-zinc-400">
                          {novels.find(n => n.id === task.novel_id)?.title || t.unknownNovel}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                          {task.recurrence === 'daily' ? <RefreshCw size={12} className="text-purple-400" /> : <Clock size={12} />}
                          {task.recurrence === 'daily' ? t.recurrenceDaily : t.recurrenceOnce}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-xs text-zinc-400">
                          <Calendar size={12} />
                          {formatDate(task.scheduled_at, 'yyyy-MM-dd HH:mm')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                          task.status === 'pending' ? "bg-amber-500/10 text-amber-500" :
                          task.status === 'completed' ? "bg-emerald-500/10 text-emerald-500" :
                          "bg-rose-500/10 text-rose-500"
                        )}>
                          {task.status === 'pending' ? t.statusPending : 
                           task.status === 'completed' ? t.statusCompleted : t.statusFailed}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {task.status === 'pending' && (
                            <button 
                              onClick={() => handleRunTask(task.id)}
                              className="p-2 text-zinc-600 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-all"
                              title={t.runNow}
                            >
                              <Zap size={16} />
                            </button>
                          )}
                          <button 
                            onClick={() => handleDeleteTask(task.id)}
                            className="p-2 text-zinc-600 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                            title={t.delete}
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
  );
};

export default TasksPage;

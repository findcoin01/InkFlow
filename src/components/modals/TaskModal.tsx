import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Send, RefreshCw, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { Novel, Task } from '../../types';

interface TaskModalProps {
  newTask: Partial<Task>;
  setNewTask: React.Dispatch<React.SetStateAction<Partial<Task>>>;
  novels: Novel[];
  onClose: () => void;
  onCreateTask: () => Promise<void>;
  t: any;
}

const TaskModal: React.FC<TaskModalProps> = ({
  newTask,
  setNewTask,
  novels,
  onClose,
  onCreateTask,
  t
}) => {
  return (
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
                {t.mockPublish}
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
              onClick={onClose}
              className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-all"
            >
              {t.cancel}
            </button>
            <button 
              onClick={onCreateTask}
              disabled={!newTask.novel_id || !newTask.scheduled_at}
              className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold rounded-xl transition-all"
            >
              {t.confirm}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default TaskModal;

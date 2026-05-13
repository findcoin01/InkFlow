import React from 'react';
import { motion } from "motion/react";
import { formatDate } from "../lib/utils";
import Card from "../components/ui/Card";
import { Log } from "../types";

interface LogsPageProps {
  logs: Log[];
  logTotal: number;
  logPage: number;
  logTotalPages: number;
  fetchLogs: (page: number) => void;
  t: any;
}

const LogsPage: React.FC<LogsPageProps> = ({
  logs,
  logTotal,
  logPage,
  logTotalPages,
  fetchLogs,
  t
}) => {
  return (
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
                    {formatDate(log.created_at, 'yyyy-MM-dd HH:mm:ss')}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-20 text-center text-zinc-600 italic">
                    {t.noLogsFound || "No logs found"}
                  </td>
                </tr>
              )}
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
  );
};

export default LogsPage;

import React from 'react';
import { motion } from "motion/react";
import { Sparkles, X } from "lucide-react";
import { cn } from "../../lib/utils";

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => (
  <motion.div
    initial={{ opacity: 0, y: 50 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 50 }}
    className={cn(
      "fixed bottom-12 left-1/2 -translate-x-1/2 z-[100] px-8 py-4 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center gap-4 border backdrop-blur-xl",
      type === 'success' 
        ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300" 
        : type === 'error'
        ? "bg-rose-500/20 border-rose-500/40 text-rose-300"
        : type === 'warning'
        ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
        : "bg-blue-500/20 border-blue-500/40 text-blue-300"
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

export default Toast;

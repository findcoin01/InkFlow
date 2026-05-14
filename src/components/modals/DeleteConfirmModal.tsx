import React from 'react';
import { motion } from 'motion/react';
import { Trash2, Activity } from 'lucide-react';

interface DeleteConfirmModalProps {
  title: string;
  description: string;
  onCancel: () => void;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning';
  t: any;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  title,
  description,
  onCancel,
  onConfirm,
  confirmText,
  cancelText,
  type = 'danger',
  t,
}) => {
  const Icon = type === 'danger' ? Trash2 : Activity;
  const accentColor = type === 'danger' ? 'rose' : 'amber';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl"
      >
        <div className={`w-12 h-12 bg-${accentColor}-500/10 text-${accentColor}-500 rounded-xl flex items-center justify-center mb-6`}>
          <Icon size={24} />
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
        <p className="text-zinc-400 mb-8">{description}</p>
        <div className="flex gap-3">
          <button 
            onClick={onCancel}
            className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-all"
          >
            {cancelText || t.cancel}
          </button>
          <button 
            onClick={onConfirm}
            className={`flex-1 py-3 bg-${accentColor}-500 hover:bg-${accentColor}-400 text-white font-bold rounded-xl transition-all`}
          >
            {confirmText || (type === 'danger' ? t.delete : t.confirm)}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

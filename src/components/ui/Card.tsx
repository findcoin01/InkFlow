import React from 'react';
import { cn } from "../../lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  headerAction?: React.ReactNode;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({ children, className, title, headerAction, onClick }) => (
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

export default Card;

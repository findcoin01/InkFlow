import React from 'react';
import { cn } from "../../lib/utils";

interface SidebarItemProps {
  icon: any;
  label: string;
  active?: boolean;
  onClick: () => void;
  collapsed?: boolean;
  className?: string;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ 
  icon: Icon, 
  label, 
  active, 
  onClick, 
  collapsed, 
  className 
}) => (
  <button
    onClick={onClick}
    title={collapsed ? label : ""}
    className={cn(
      "flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all duration-200",
      active 
        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
        : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200",
      collapsed && "justify-center px-0",
      className
    )}
  >
    <Icon size={20} className="shrink-0" />
    {!collapsed && <span className="font-medium truncate">{label}</span>}
  </button>
);

export default SidebarItem;

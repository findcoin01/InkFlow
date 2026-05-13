import React from 'react';
import { TrendingUp, Clock } from "lucide-react";
import { cn } from "../../lib/utils";
import Card from "./Card";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode | React.ElementType;
  trend?: number | string;
  t: any;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, trend, t }) => {
  const renderIcon = () => {
    if (React.isValidElement(icon)) return icon;
    if (typeof icon === 'function' || (typeof icon === 'object' && icon !== null)) {
      return React.createElement(icon as React.ElementType, { size: 24 });
    }
    return null;
  };
  
  return (
    <Card className="flex items-center justify-between p-6">
      <div>
        <p className="text-sm text-zinc-400 mb-1">{label}</p>
        <h4 className="text-2xl font-bold text-zinc-100 font-mono tracking-tight">{value}</h4>
        {trend !== undefined && (
          <div className={cn(
            "text-xs mt-1 flex items-center gap-1", 
            typeof trend === 'number' ? (trend > 0 ? "text-emerald-400" : trend < 0 ? "text-rose-400" : "text-zinc-500") : "text-zinc-500"
          )}>
            {typeof trend === 'number' ? (
              <>
                <TrendingUp size={12} className={trend < 0 ? "rotate-180" : ""} />
                {Math.abs(trend)}% {t.fromLastWeek}
              </>
            ) : (
              <>
                <Clock size={12} />
                {trend}
              </>
            )}
          </div>
        )}
      </div>
      <div className="p-3 bg-zinc-800/80 rounded-xl text-emerald-400 border border-zinc-700/50">
        {renderIcon()}
      </div>
    </Card>
  );
};

export default StatCard;

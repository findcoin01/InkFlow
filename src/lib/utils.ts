import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string | Date | null | undefined, formatStr: string = "yyyy-MM-dd HH:mm:ss"): string {
  if (!dateStr) return "-";
  
  try {
    let date: Date;
    if (typeof dateStr === 'string') {
      // Handle date-only strings (YYYY-MM-DD)
      if (dateStr.length === 10 && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        const [y, m, d] = dateStr.split('-').map(Number);
        date = new Date(y, m - 1, d);
      } else {
        // Handle SQLite format (YYYY-MM-DD HH:MM:SS) by making it ISO (YYYY-MM-DDTHH:MM:SSZ)
        // This ensures the browser treats it as UTC and converts to local time
        let isoStr = dateStr;
        if (!dateStr.includes('T')) {
          isoStr = dateStr.replace(' ', 'T');
        }
        if (!isoStr.endsWith('Z') && !isoStr.includes('+')) {
          isoStr += 'Z';
        }
        date = new Date(isoStr);
      }
    } else {
      date = dateStr;
    }
    
    // Check if valid date
    if (isNaN(date.getTime())) return "-";
    
    return format(date, formatStr);
  } catch (e) {
    console.error("Date formatting error:", e);
    return "-";
  }
}

export const APP_NAME = "InkFlow";

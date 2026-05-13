import React from 'react';
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface StructuredContentProps {
  content: string;
  placeholder: string;
}

const StructuredContent: React.FC<StructuredContentProps> = ({ content, placeholder }) => {
  if (!content) return <p className="text-zinc-500 italic text-sm">{placeholder}</p>;

  try {
    const data = JSON.parse(content);
    
    // Handle Array (likely Characters)
    if (Array.isArray(data)) {
      return (
        <div className="space-y-4">
          {data.map((item: any, idx: number) => (
            <div key={idx} className="p-4 bg-zinc-800/50 rounded-xl border border-zinc-700/50 hover:border-emerald-500/30 transition-all">
              {Object.entries(item).map(([key, value]: [string, any]) => (
                <div key={key} className="mb-2 last:mb-0">
                  <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider block mb-1">{key}</span>
                  <p className="text-sm text-zinc-300 leading-relaxed">
                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                  </p>
                </div>
              ))}
            </div>
          ))}
        </div>
      );
    }

    // Handle Object (World Setting, Storylines)
    if (typeof data === 'object' && data !== null) {
      return (
        <div className="space-y-6">
          {Object.entries(data).map(([key, value]: [string, any]) => (
            <div key={key}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1 h-4 bg-emerald-500 rounded-full" />
                <h5 className="text-xs font-bold text-white uppercase tracking-widest">{key.replace(/_/g, ' ')}</h5>
              </div>
              <div className="pl-3 border-l border-zinc-800 ml-0.5">
                {Array.isArray(value) ? (
                  <ul className="list-disc list-inside space-y-1">
                    {value.map((v: any, i: number) => (
                      <li key={i} className="text-sm text-zinc-400 leading-relaxed">
                        {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      );
    }
  } catch (e) {
    // Not JSON, fallback to Markdown
  }

  return (
    <div className="markdown-body">
      <Markdown remarkPlugins={[remarkGfm]}>
        {content || `*${placeholder}*`}
      </Markdown>
    </div>
  );
};

export default StructuredContent;

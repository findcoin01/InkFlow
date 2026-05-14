import React, { useState, useEffect, useRef } from "react";
import { RefreshCw } from "lucide-react";
import remarkGfm from "remark-gfm";
import Markdown from "react-markdown";
import { Chapter } from "../../types";

interface ChapterPreviewProps {
  ch: Chapter;
  idx: number;
  t: any;
}

export const ChapterPreview: React.FC<ChapterPreviewProps> = React.memo(({ ch, idx, t }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '800px' }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div 
      ref={ref} 
      id={`preview-chapter-${ch.id}`} 
      className="space-y-8 scroll-mt-24 min-h-[100px]"
      style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 500px' } as any}
    >
      <div className="flex items-center gap-4">
        <div className="h-px flex-1 bg-zinc-800"></div>
        <h2 className="text-2xl font-bold text-emerald-400">{t.chapterPrefix || "Chapter"} {idx + 1}{t.chapterSuffix || ""}：{ch.title}</h2>
        <div className="h-px flex-1 bg-zinc-800"></div>
      </div>
      <div className="text-zinc-300 text-lg leading-loose whitespace-pre-wrap font-serif markdown-body">
        {isVisible ? (
          <Markdown remarkPlugins={[remarkGfm]}>
            {ch.content || t.noContent}
          </Markdown>
        ) : (
          <div className="h-40 flex items-center justify-center text-zinc-800 border border-dashed border-zinc-800 rounded-xl">
            <RefreshCw className="animate-spin opacity-20" size={24} />
          </div>
        )}
      </div>
    </div>
  );
});

ChapterPreview.displayName = "ChapterPreview";

export default ChapterPreview;

import React from 'react';
import { Chapter } from "../../types";

interface TOCItemProps {
  ch: Chapter;
  idx: number;
  onScrollTo: (id: number) => void;
}

const TOCItem: React.FC<TOCItemProps> = React.memo(({ ch, idx, onScrollTo }) => (
  <button
    onClick={() => onScrollTo(ch.id)}
    className="w-full text-left px-3 py-2 rounded-lg text-sm text-zinc-400 hover:bg-zinc-800 hover:text-white transition-all truncate"
  >
    <span className="text-zinc-600 mr-2">{idx + 1}.</span>
    {ch.title}
  </button>
));

export default TOCItem;

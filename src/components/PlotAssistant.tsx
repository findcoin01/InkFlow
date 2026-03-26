import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Loader2, Sparkles, X, Plus, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { LangChainService } from '../services/langchainService';
import { AIConfig, Novel } from '../types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface PlotAssistantProps {
  novel: Novel;
  aiConfig: AIConfig;
  onClose: () => void;
  language: string;
  currentChapter?: any;
  onUpdateChapter?: (content: string, mode?: 'append' | 'replace') => void;
}

export const PlotAssistant: React.FC<PlotAssistantProps> = ({ 
  novel, 
  aiConfig, 
  onClose, 
  language,
  currentChapter,
  onUpdateChapter
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    fetchHistory();
  }, [novel.id]);

  const fetchHistory = async () => {
    try {
      console.log(`Fetching history for novel: ${novel.id}`);
      const res = await fetch(`/api/novels/${novel.id}/plot-assistant-messages`);
      if (res.ok) {
        const data = await res.json();
        console.log(`Fetched ${data.length} messages for novel: ${novel.id}`);
        setMessages(data.map((m: any) => ({ role: m.role, content: m.content })));
      } else {
        console.error("Failed to fetch history, status:", res.status);
      }
    } catch (e) {
      console.error("Failed to fetch history:", e);
    }
  };

  const clearHistory = async () => {
    if (!confirm(language === 'zh' ? "确定要清空对话记录吗？" : "Are you sure you want to clear conversation history?")) return;
    try {
      await fetch(`/api/novels/${novel.id}/plot-assistant-messages`, { method: 'DELETE' });
      setMessages([]);
      // Also clear in-memory LangChain memory if exists
      LangChainService.clearMemory(novel.id.toString());
    } catch (e) {
      console.error("Failed to clear history:", e);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const saveMessage = async (role: 'user' | 'assistant', content: string) => {
    try {
      console.log(`Saving message for novel: ${novel.id}, role: ${role}`);
      const res = await fetch(`/api/novels/${novel.id}/plot-assistant-messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, content })
      });
      if (!res.ok) {
        console.error("Failed to save message, status:", res.status);
      } else {
        console.log("Message saved successfully");
      }
    } catch (e) {
      console.error("Failed to save message:", e);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    await saveMessage('user', userMsg);
    setIsLoading(true);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      let context = `书名：${novel.title}\n简介：${novel.description}\n大纲：${novel.outlines?.find(o => o.is_active === 1)?.content || "无"}\n角色：${novel.characters || "无"}\n世界观：${novel.world_setting || "无"}`;
      
      if (currentChapter) {
        context += `\n\n当前正在编辑章节：${currentChapter.title}\n内容：${currentChapter.content?.substring(0, 2000)}...`;
      }

      // Add an empty assistant message to start streaming into
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
      
      const stream = LangChainService.chatWithMemoryStream(
        userMsg,
        novel.id.toString(),
        context,
        aiConfig,
        language,
        abortControllerRef.current.signal,
        messages // Pass current messages as initial history
      );

      let fullContent = "";
      for await (const chunk of stream) {
        fullContent += chunk;
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMsg = newMessages[newMessages.length - 1];
          if (lastMsg && lastMsg.role === 'assistant') {
            lastMsg.content = fullContent;
          }
          return newMessages;
        });
      }

      await saveMessage('assistant', fullContent);

      // Log token usage
      const estimatedTokens = Math.ceil((userMsg.length + context.length + fullContent.length) / 4);
      try {
        await fetch('/api/token-logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            novel_id: novel.id,
            type: 'plot_assistant',
            tokens: estimatedTokens
          })
        });
      } catch (logError) {
        console.error("Failed to log Plot Assistant tokens:", logError);
      }
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      console.error("Plot Assistant Error:", error);
      setMessages(prev => [...prev, { role: 'assistant', content: "抱歉，我遇到了一些问题，请稍后再试。" }]);
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const extractCodeBlock = (text: string) => {
    // More flexible regex to handle code blocks with or without language identifier and with or without newline
    const match = text.match(/```(?:[\w]*)\n?([\s\S]*?)```/);
    return match ? match[1].trim() : null;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="flex flex-col h-full bg-zinc-900 border-l border-zinc-800 shadow-2xl w-80 md:w-96"
    >
      <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400">
            <Sparkles size={18} />
          </div>
          <div>
            <h3 className="font-bold text-zinc-100">{language === 'zh' ? '情节助手' : 'Plot Assistant'}</h3>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">LangChain AI</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <button 
              onClick={clearHistory}
              className="p-2 text-zinc-500 hover:text-rose-400 transition-colors"
              title={language === 'zh' ? "清空对话" : "Clear History"}
            >
              <X size={16} />
            </button>
          )}
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-zinc-800 flex items-center justify-center text-zinc-500 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar"
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 px-6">
            <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center text-emerald-400 mb-2">
              <Bot size={32} />
            </div>
            <p className="text-sm text-zinc-400 leading-relaxed">
              {language === 'zh' 
                ? "我是你的情节助手。你可以问我关于角色发展、情节漏洞或灵感建议。" 
                : "I am your plot assistant. You can ask me about character development, plot holes, or inspiration suggestions."}
            </p>
          </div>
        )}
        
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex gap-3 max-w-[90%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center ${
                  msg.role === 'user' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-800 text-zinc-400'
                }`}>
                  {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>
                <div className="flex flex-col gap-2">
                  <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-emerald-500 text-black font-medium rounded-tr-none' 
                      : 'bg-zinc-800 text-zinc-200 border border-zinc-700/50 rounded-tl-none'
                  }`}>
                    {msg.role === 'user' ? (
                      msg.content
                    ) : (
                      <div className="markdown-body prose prose-invert prose-sm max-w-none">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                  
                  {msg.role === 'assistant' && onUpdateChapter && currentChapter && (
                    <div className="flex justify-start gap-2">
                      {(() => {
                        const code = extractCodeBlock(msg.content);
                        if (!code) return null;
                        return (
                          <>
                            <button
                              onClick={() => onUpdateChapter(code, 'append')}
                              className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold uppercase tracking-widest flex items-center gap-1 bg-emerald-500/5 px-2 py-1 rounded border border-emerald-500/10 transition-all"
                            >
                              <Plus size={10} />
                              {language === 'zh' ? "追加" : "Append"}
                            </button>
                            <button
                              onClick={() => onUpdateChapter(code, 'replace')}
                              className="text-[10px] text-zinc-400 hover:text-white font-bold uppercase tracking-widest flex items-center gap-1 bg-zinc-800/50 px-2 py-1 rounded border border-zinc-700/50 transition-all"
                            >
                              <RefreshCw size={10} />
                              {language === 'zh' ? "替换" : "Replace"}
                            </button>
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isLoading && messages[messages.length - 1]?.role === 'user' && (
          <div className="flex justify-start">
            <div className="flex gap-3 items-center text-zinc-500 text-xs font-medium">
              <div className="w-8 h-8 rounded-xl bg-zinc-800 flex items-center justify-center">
                <Loader2 size={16} className="animate-spin" />
              </div>
              {language === 'zh' ? "正在思考..." : "Thinking..."}
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-zinc-900/80 backdrop-blur-md border-t border-zinc-800">
        <div className="relative group">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={language === 'zh' ? "输入你的问题..." : "Ask me anything..."}
            className="w-full pl-4 pr-12 py-4 bg-zinc-800 border border-zinc-700 rounded-2xl text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 transition-all resize-none min-h-[80px]"
            rows={2}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-3 bottom-3 w-10 h-10 bg-emerald-500 text-black rounded-xl flex items-center justify-center hover:bg-emerald-400 disabled:opacity-50 disabled:hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-500/20"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default PlotAssistant;

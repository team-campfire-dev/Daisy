import { motion } from 'framer-motion';
import { useRef, useEffect } from 'react';
import clsx from 'clsx';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

interface ChatInterfaceProps {
    messages: Message[];
    onSendMessage: (msg: string) => void;
    onGenerate: () => void;
    isGenerating?: boolean;
    loadingStatus?: string;
    suggestions?: string[];
}

export default function ChatInterface({
    messages,
    onSendMessage,
    onGenerate,
    isGenerating,
    loadingStatus = "데이지가 생각 중...",
    suggestions
}: ChatInterfaceProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isGenerating, suggestions]);

    const handleSend = () => {
        if (inputRef.current && inputRef.current.value.trim()) {
            onSendMessage(inputRef.current.value);
            inputRef.current.value = '';
        }
    };

    return (
        <div className="w-full h-full flex flex-col pointer-events-auto bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="p-4 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center text-xl text-white shadow-md">
                        🌼
                    </div>
                    <div>
                        <h2 className="text-white font-bold text-lg leading-tight">데이지</h2>
                        <p className="text-slate-400 text-xs font-medium">AI 데이트 코스 플래너</p>
                    </div>
                </div>

                <button
                    onClick={onGenerate}
                    disabled={isGenerating}
                    className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold rounded-lg transition-colors shadow-md disabled:opacity-50"
                >
                    ✨ 계획 짜기
                </button>
            </div>

            {/* Messages */}
            <div
                className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-900 flex flex-col"
                ref={scrollRef}
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                <style jsx>{`
                    div::-webkit-scrollbar { display: none; }
                `}</style>
                {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-3 opacity-80">
                        <div className="text-5xl grayscale">🌼</div>
                        <p className="text-base font-medium">데이지와 대화를 시작해보세요.</p>
                    </div>
                )}

                {messages.map((msg, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={clsx(
                            "max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm font-medium",
                            msg.role === 'user'
                                ? "self-end bg-violet-600 text-white rounded-br-none"
                                : "self-start bg-slate-800 text-slate-100 border border-slate-700 rounded-bl-none"
                        )}
                    >
                        {msg.content}
                    </motion.div>
                ))}

                {/* Loading Indicator */}
                {isGenerating && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="self-start flex items-center gap-2 text-slate-400 text-sm pl-2 font-medium"
                    >
                        <div className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-violet-500 rounded-full animate-bounce delay-75" />
                        <div className="w-2 h-2 bg-violet-500 rounded-full animate-bounce delay-150" />
                        <span className="ml-2 text-violet-300">{loadingStatus}</span>
                    </motion.div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-slate-800 border-t border-slate-700">
                {/* Suggestions - Stacked (Wrap) */}
                {suggestions && suggestions.length > 0 && !isGenerating && (
                    <div className="flex flex-wrap gap-2 mb-3">
                        {suggestions.map((s, i) => (
                            <button
                                key={i}
                                onClick={() => onSendMessage(s)}
                                className="px-3 py-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg text-sm text-slate-200 transition-colors font-medium"
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                )}

                <div className="flex gap-2">
                    <input
                        ref={inputRef}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        type="text"
                        placeholder="데이지에게 질문하기..."
                        disabled={isGenerating}
                        className="flex-1 bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none placeholder-slate-500 font-medium text-sm"
                    />
                    <button
                        onClick={handleSend}
                        disabled={isGenerating}
                        className="p-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors disabled:opacity-50"
                    >
                        ➤
                    </button>
                </div>
            </div>
        </div>
    );
}

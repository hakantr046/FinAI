'use client';

import React from 'react';
import { Sparkles, ArrowUpRight } from 'lucide-react';
import type { ChatMessage } from '@/types/chat';

interface ChatWidgetProps {
  isOpen: boolean;
  onToggle: (open: boolean) => void;
  history: ChatMessage[];
  message: string;
  onMessageChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  title?: string;
  subtitle?: string;
  placeholder?: string;
  closedLabel?: string;
}

export default function ChatWidget({
  isOpen,
  onToggle,
  history,
  message,
  onMessageChange,
  onSubmit,
  loading,
  title = 'FinAI Danışmanı',
  subtitle = 'Akıllı Asistanınız',
  placeholder = 'Tasarruf için öneri iste...',
  closedLabel,
}: ChatWidgetProps) {
  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {isOpen ? (
        <div className="bg-white rounded-3xl w-80 md:w-96 h-[480px] shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-fade-in">
          <div className="bg-[var(--primary)] p-4 text-white flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              <div>
                <h3 className="font-semibold text-sm">{title}</h3>
                <span className="text-[10px] text-indigo-100">{subtitle}</span>
              </div>
            </div>
            <button
              onClick={() => onToggle(false)}
              className="text-white/80 hover:text-white transition-colors cursor-pointer text-xs font-semibold"
            >
              Kapat
            </button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50 select-text cursor-text">
            {history.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed select-text cursor-text ${
                    msg.role === 'user'
                      ? 'bg-[var(--primary)] text-white rounded-tr-none'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white text-slate-500 border border-slate-200 rounded-2xl rounded-tl-none p-3 text-xs flex items-center gap-2 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={onSubmit} className="border-t border-slate-100 p-3 bg-white flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => onMessageChange(e.target.value)}
              placeholder={placeholder}
              className="flex-1 input-light rounded-xl px-3 py-2 text-xs focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading || !message.trim()}
              className="btn-gradient text-white px-3 py-2 rounded-xl transition-all cursor-pointer disabled:opacity-50"
            >
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      ) : (
        <button
          onClick={() => onToggle(true)}
          className="btn-gradient p-4 rounded-full shadow-2xl flex items-center gap-2 transition-all hover:scale-105 cursor-pointer"
        >
          <Sparkles className="w-6 h-6 animate-pulse text-white" />
          {closedLabel && <span className="text-xs font-semibold pr-1 text-white">{closedLabel}</span>}
        </button>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import { Send, Bot, User, ChevronDown, ChevronUp, AlertCircle, RefreshCw } from 'lucide-react';
import api from '../lib/api';

interface SourceChip {
  label: string;
  data: Record<string, any>;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sourceChips?: SourceChip[];
}

const CHIPS = [
  "Which department emits the most CO₂?",
  "Generate this month's ESG report",
  "Show unresolved compliance issues",
  "What goals are at risk?"
];

export default function Copilot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    
    const newMsg: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, newMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Pass recent history for context
      const history = messages.slice(-4).map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await api.post('/copilot/ask', {
        message: text,
        session_history: history
      });

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: res.data.response,
        sourceChips: res.data.source_chips
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Sorry, I'm having trouble connecting right now. Please try again."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col bg-white rounded-xl shadow-sm border border-[var(--border)] overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-[var(--border)] flex items-center justify-between bg-white">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #714B67, #0EA5E9)' }}>
            <Bot size={18} className="text-white" />
          </div>
          <div>
            <h2 className="font-bold text-[var(--text-primary)] text-base leading-tight">EcoSphere Copilot</h2>
            <p className="text-[10px] text-[var(--text-secondary)] font-medium">Powered by Gemini · Grounded in live ESG data</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-semibold px-3 py-1.5 rounded-full border border-[var(--border)] text-[var(--text-secondary)] bg-[var(--surface-alt)]">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block"></span>
          Live data
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
            <div className="w-16 h-16 bg-[var(--brand-primary)]/10 rounded-2xl flex items-center justify-center text-[var(--brand-primary)]">
              <Bot size={32} />
            </div>
            <div className="space-y-2 max-w-md">
              <h3 className="text-xl font-semibold text-[var(--text-primary)]">Ask anything about your ESG data</h3>
              <p className="text-[var(--text-secondary)]">I can analyze your carbon footprint, check compliance status, or explain your ESG scores in real time.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl mt-8">
              {CHIPS.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => sendMessage(chip)}
                  className="text-left px-4 py-3 rounded-lg border border-[var(--border)] hover:border-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/5 transition-colors text-sm text-[var(--text-secondary)] hover:text-[var(--brand-primary)]"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex space-x-3 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  msg.role === 'user' ? 'bg-[var(--brand-primary)] text-white' : 'bg-[var(--surface-alt)] text-[var(--brand-primary)]'
                }`}>
                  {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>
                <div className={`space-y-2 ${msg.role === 'user' ? 'text-right' : ''}`}>
                  <div className={`p-4 rounded-2xl text-sm ${
                    msg.role === 'user' 
                      ? 'bg-[var(--brand-primary)] text-white rounded-tr-none' 
                      : 'bg-[var(--surface-alt)] text-[var(--text-primary)] rounded-tl-none'
                  }`}>
                    {msg.content}
                  </div>
                  
                  {/* Source Chips */}
                  {msg.sourceChips && msg.sourceChips.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {msg.sourceChips.map((chip, cIdx) => (
                        <SourceChipView key={cIdx} chip={chip} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex space-x-3 max-w-[80%]">
              <div className="w-8 h-8 rounded-full bg-[var(--surface-alt)] text-[var(--brand-primary)] flex items-center justify-center shrink-0">
                <RefreshCw size={16} className="animate-spin" />
              </div>
              <div className="p-4 rounded-2xl text-sm bg-[var(--surface-alt)] text-[var(--text-secondary)] rounded-tl-none flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-[var(--brand-primary)] animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-[var(--brand-primary)] animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-[var(--brand-primary)] animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-[var(--border)]">
        <div className="relative max-w-4xl mx-auto">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your ESG data..."
            className="w-full bg-[var(--surface-alt)] border-none rounded-xl pl-4 pr-12 py-3 text-sm focus:ring-2 focus:ring-[var(--brand-primary)] resize-none"
            rows={1}
            style={{ minHeight: '48px', maxHeight: '120px' }}
          />
          <button 
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-2 p-2 rounded-lg text-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/10 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

function SourceChipView({ chip }: { chip: SourceChip }) {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <div className="relative">
      <button 
        onClick={() => setExpanded(!expanded)}
        className="flex items-center space-x-1 px-2 py-1 bg-white border border-[var(--border)] rounded-md text-xs text-[var(--text-secondary)] hover:border-[var(--brand-primary)] transition-colors shadow-sm"
      >
        <span>{chip.label}</span>
        {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>
      
      {expanded && (
        <div className="absolute top-full left-0 mt-1 z-10 min-w-[200px] max-w-sm bg-white border border-[var(--border)] rounded-md shadow-lg p-2 max-h-64 overflow-y-auto">
          <pre className="text-[10px] text-[var(--text-secondary)] whitespace-pre-wrap">
            {JSON.stringify(chip.data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

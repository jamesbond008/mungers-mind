import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import html2pdf from 'html2pdf.js';
import { getMungerAdvice } from './services/geminiService';
import { MungerResponse } from './types';

// 预设模型，防止加载失败
const DEFAULT_MODELS = [
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash (最新)' },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' }
];

function App() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<any[]>([]); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [models] = useState(DEFAULT_MODELS); 

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // PDF 导出函数
  const exportToPDF = (elementId: string) => {
    const element = document.getElementById(elementId);
    const opt = {
      margin: 1,
      filename: `Munger_Advice_${new Date().getTime()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user', content: input, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response: MungerResponse = await getMungerAdvice(input);
      const assistantMessage = { 
        id: `msg-${Date.now()}`, // 为 PDF 导出提供唯一 ID
        role: 'assistant', 
        content: response.content, 
        timestamp: response.timestamp 
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err: any) {
      setError("系统故障。大概是电路里掺杂了太多的废话。再试一次。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white flex flex-col font-sans">
      <header className="p-4 border-b border-gray-800 flex justify-between items-center bg-[#1e293b]">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-[#10b981] rounded-full flex items-center justify-center text-2xl">🏛️</div>
          <div>
            <h1 className="text-xl font-bold text-[#10b981]">芒格智慧圣殿</h1>
            <p className="text-xs text-gray-400">世俗智慧思维格栅</p>
          </div>
        </div>
        <select className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm">
          {(models || []).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center opacity-30">
            <div className="text-6xl mb-4">📖</div>
            <p>“反过来想，总是反过来想。”</p>
          </div>
        )}

        {(messages || []).map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div 
              id={msg.id} 
              className={`max-w-[90%] p-5 rounded-xl ${
                msg.role === 'user' ? 'bg-[#10b981]' : 'bg-[#1e293b] border border-gray-700'
              }`}
            >
              {msg.role === 'assistant' && (
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold text-[#10b981] uppercase tracking-wider">查理的深度判断</span>
                  <button 
                    onClick={() => exportToPDF(msg.id)}
                    className="text-[10px] bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded transition-colors"
                  >
                    📥 导出 PDF
                  </button>
                </div>
              )}
              {/* 支持 Markdown 和表格渲染 */}
              <div className="prose prose-invert max-w-none prose-table:border prose-th:bg-gray-800 prose-th:p-2 prose-td:p-2 prose-td:border-gray-700">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {msg.content}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        {loading && <div className="text-gray-500 animate-pulse">查理正在翻阅思维模型...</div>}
        <div ref={messagesEndRef} />
      </main>

      <footer className="p-4 bg-[#1e293b] border-t border-gray-800">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入你的困惑..."
            className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-[#10b981] outline-none"
          />
          <button type="submit" className="bg-[#10b981] px-6 py-3 rounded-lg font-bold">提问</button>
        </form>
      </footer>
    </div>
  );
}

export default App;

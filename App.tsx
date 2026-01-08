import React, { useState, useEffect, useRef } from 'react';
import { getMungerAdvice } from './services/geminiService';
import { MungerResponse } from './types';

// 模拟预设的模型数据，防止 API 获取失败导致白屏
const DEFAULT_MODELS = [
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash (最新)' },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' }
];

function App() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<any[]>([]); // 确保初始值为数组
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 针对报错 H.data.models is undefined 的核心防御
  const [models] = useState(DEFAULT_MODELS); 

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user', content: input, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const response: MungerResponse = await getMungerAdvice(input);
      const assistantMessage = { role: 'assistant', content: response.content, timestamp: response.timestamp };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error("Munger Error:", err);
      setError("系统故障。大概是电路里掺杂了太多的废话。再试一次。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white flex flex-col font-sans">
      {/* 顶部栏 */}
      <header className="p-4 border-b border-gray-800 flex justify-between items-center bg-[#1e293b]">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-[#10b981] rounded-full flex items-center justify-center">
            <span className="text-2xl">🏛️</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#10b981]">芒格的智慧圣殿</h1>
            <p className="text-xs text-gray-400">世俗智慧思维格栅</p>
          </div>
        </div>
        
        {/* 模型选择器：使用防御性 map 逻辑 */}
        <div className="flex items-center gap-2">
          <select className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#10b981]">
            {(models || []).map(model => (
              <option key={model.id} value={model.id}>{model.name}</option>
            ))}
          </select>
          <span className="text-xs text-gray-500 italic">“反过来想，总是反过来想。”</span>
        </div>
      </header>

      {/* 聊天区域 */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-4">
            <div className="text-6xl opacity-20">📖</div>
            <p className="max-w-md text-center">“我这一辈子都在寻找能够让我变得更聪明的思维模型。你有什么困惑，尽管开口。”</p>
          </div>
        )}
        
        {/* 消息渲染：使用防御性 map 逻辑 */}
        {(messages || []).map((msg, index) => (
          <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-4 rounded-lg ${
              msg.role === 'user' ? 'bg-[#10b981] text-white' : 'bg-[#1e293b] border border-gray-700'
            }`}>
              {msg.role === 'assistant' && <div className="text-xs text-[#10b981] font-bold mb-1">查理的深度判断 ——</div>}
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-[#1e293b] border border-gray-700 p-4 rounded-lg animate-pulse text-gray-400">
              查理正在翻阅他的思维格栅...
            </div>
          </div>
        )}
        {error && (
          <div className="text-center text-red-400 text-sm p-2 bg-red-900/20 rounded border border-red-900/50">
            {error}
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* 输入区域 */}
      <footer className="p-4 bg-[#1e293b] border-t border-gray-800">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入你的困惑，听听查理的世俗智慧..."
            className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#10b981] text-white"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-[#10b981] hover:bg-[#059669] disabled:opacity-50 text-white px-6 py-3 rounded-lg font-bold transition-colors"
          >
            提问
          </button>
        </form>
      </footer>
    </div>
  );
}

export default App;

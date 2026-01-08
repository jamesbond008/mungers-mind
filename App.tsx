import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import html2pdf from 'html2pdf.js';
import { getMungerAdvice, MungerResponse } from './services/geminiService';
import { MENTAL_MODELS, ModelEntry } from './models'; // 确保你创建了这个文件

// 类型定义
interface Message {
  id: string;
  role: 'user' | 'munger';
  content: string;
  data?: MungerResponse;
  timestamp: number;
}

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showExplorer, setShowExplorer] = useState(false);
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [usageCount, setUsageCount] = useState(0);
  const [showPaywall, setShowPaywall] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 初始化读取次数
  useEffect(() => {
    const storedCount = localStorage.getItem('munger_usage_count');
    if (storedCount) setUsageCount(parseInt(storedCount));
  }, []);

  // 滚动到底部
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isLoading]);

  // 高清 PDF 导出 (融合了新版逻辑)
  const handleDownload = (elementId: string) => {
    if (usageCount > 5) { // 示例：限制免费导出次数
      setShowPaywall(true);
      return;
    }
    setIsExporting(elementId);
    const element = document.getElementById(`msg-${elementId}`);
    const opt = {
      margin: 0.3,
      filename: `Munger_Report_${Date.now()}.pdf`,
      image: { type: 'jpeg', quality: 1 },
      html2canvas: { scale: 3, useCORS: true }, // 高清缩放
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save().then(() => setIsExporting(null));
  };

  const processQuery = async (query: string) => {
    if (usageCount >= 3) { // 限制免费对话次数
      setShowPaywall(true);
      return;
    }
    if (!query.trim() || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: query, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const result = await getMungerAdvice(query);
      const mungerMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'munger',
        content: result.advice,
        data: result,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, mungerMsg]);
      
      const newCount = usageCount + 1;
      setUsageCount(newCount);
      localStorage.setItem('munger_usage_count', newCount.toString());
    } catch (error) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'munger', content: "系统思维格栅暂时断开。", timestamp: Date.now() }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* Header */}
      <header className="flex-none p-4 bg-slate-900 border-b border-slate-800 shadow-xl z-20 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-700 rounded-full flex items-center justify-center text-xl shadow-lg">🏛️</div>
          <div>
            <h1 className="text-lg font-bold text-emerald-400">芒格智慧圣殿</h1>
            <p className="text-xs text-slate-400 uppercase tracking-widest">世俗智慧思维格栅</p>
          </div>
        </div>
        <button 
          onClick={() => setShowExplorer(!showExplorer)}
          className="px-4 py-2 bg-slate-800 hover:bg-emerald-700 rounded-full text-xs font-bold uppercase transition-colors"
        >
          {showExplorer ? '关闭格栅' : '探索 100 模型'}
        </button>
      </header>

      <main className="flex-1 relative overflow-hidden flex flex-col">
        {/* 模型探索器 Overlay */}
        {showExplorer && (
          <div className="absolute inset-0 z-30 bg-slate-950/90 backdrop-blur p-8 overflow-y-auto animate-fadeIn">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 max-w-6xl mx-auto">
              {MENTAL_MODELS.map(model => (
                <button 
                  key={model.id}
                  onClick={() => {
                    setShowExplorer(false);
                    processQuery(`请用“${model.name}”模型分析我的问题：[请补充]`);
                  }}
                  className="p-3 border border-slate-700 rounded hover:bg-emerald-900/50 hover:border-emerald-500 transition-all text-left"
                >
                  <div className="text-xs font-bold text-emerald-400">{model.symbol}</div>
                  <div className="text-xs text-slate-300 truncate">{model.name}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 聊天区域 */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 scroll-smooth">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center opacity-30">
              <div className="text-6xl mb-4">📖</div>
              <p className="text-xl serif italic">“手里拿着锤子的人，看什么都像钉子。”</p>
              <p className="text-xs mt-4 border border-emerald-800 px-3 py-1 rounded-full text-emerald-500">
                剩余免费次数: {3 - usageCount}
              </p>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'user' ? (
                <div className="bg-emerald-900/30 border border-emerald-500/30 p-4 rounded-xl max-w-xl text-emerald-100">
                  {msg.content}
                </div>
              ) : (
                /* 专业报告卡片 (融合了你想要的设计和新版 PDF 导出) */
                <div id={`msg-${msg.id}`} className="bg-white text-slate-900 w-full max-w-3xl rounded-sm shadow-2xl overflow-hidden border-t-8 border-emerald-600">
                  <div className="bg-slate-50 p-6 border-b border-slate-200 flex justify-between items-center">
                    <div>
                      <h2 className="text-xl font-black uppercase tracking-tighter text-slate-800">Munger Analysis Report</h2>
                      <p className="text-xs text-slate-500">GENERATED BY GEMINI 2.0</p>
                    </div>
                    <button 
                      onClick={() => handleDownload(msg.id)}
                      className="no-print text-[10px] font-bold bg-slate-900 text-white px-3 py-2 rounded hover:bg-emerald-600 transition-colors uppercase"
                    >
                      {isExporting === msg.id ? 'Exporting...' : 'Download PDF'}
                    </button>
                  </div>

                  <div className="p-8 prose prose-sm max-w-none prose-headings:font-bold prose-headings:uppercase prose-p:text-slate-600">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.content}
                    </ReactMarkdown>
                    
                    {/* 格栅模型展示区 */}
                    {msg.data?.models && msg.data.models.length > 0 && (
                      <div className="mt-8 pt-6 border-t border-slate-200">
                        <h3 className="text-xs font-bold uppercase text-slate-400 mb-3">Applied Lattice Models</h3>
                        <div className="grid grid-cols-2 gap-3 not-prose">
                          {msg.data.models.map((m: any, idx: number) => (
                            <div key={idx} className="bg-slate-50 p-3 border border-slate-200 rounded">
                              <div className="font-bold text-xs text-emerald-700">{m.name}</div>
                              <div className="text-[10px] text-slate-500">{m.description}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Lollapalooza 效应 */}
                    {msg.data?.lollapalooza && (
                      <div className="mt-4 bg-emerald-50 p-4 rounded border-l-4 border-emerald-500">
                        <strong className="text-xs text-emerald-700 uppercase block mb-1">⚡ Lollapalooza Effect</strong>
                        <p className="text-xs text-emerald-900 m-0">{msg.data.lollapalooza}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
          {isLoading && <div className="text-center text-emerald-500 animate-pulse text-xs">正在调动思维格栅...</div>}
        </div>

        {/* Input */}
        <div className="p-4 bg-slate-900 border-t border-slate-800">
          <form onSubmit={(e) => { e.preventDefault(); processQuery(input); }} className="max-w-4xl mx-auto flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="输入你的困惑..."
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-all"
            />
            <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 rounded-xl font-bold">提问</button>
          </form>
        </div>
      </main>

      {/* Paywall Modal */}
      {showPaywall && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500/50 p-8 rounded-2xl max-w-md text-center">
            <div className="text-4xl mb-4">💎</div>
            <h2 className="text-2xl font-serif text-white mb-2">Unlock Full Wisdom</h2>
            <p className="text-slate-400 text-sm mb-6">You have reached the free limit. Invest in yourself to continue.</p>
            <button onClick={() => setShowPaywall(false)} className="block w-full bg-emerald-600 py-3 rounded-lg font-bold text-white mb-3">Upgrade - $9.99/mo</button>
            <button onClick={() => setShowPaywall(false)} className="text-xs text-slate-500 hover:text-white">Maybe Later</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;

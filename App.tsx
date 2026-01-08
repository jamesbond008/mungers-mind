import React, { useState, useRef, useEffect } from 'react';
// 确保你有这个类型定义，如果没有，使用 geminiService 里的
import { MungerResponse, getMungerAdvice } from './services/geminiService'; 
import { exportToPDF } from './services/pdfService';

// 假设你的组件都在这里，如果没有请告诉我
import MentalModelCard from './components/MentalModelCard';
import InversionPanel from './components/InversionPanel';
import ModelExplorer from './components/ModelExplorer';
// 引入你有的 models.ts 里的类型
import { ModelEntry } from './models';

// 你的 Lemon Squeezy 链接
const STARTER_LINK = "https://mungers-mind.lemonsqueezy.com/checkout/buy/b2b33d63-a09f-41f9-9db9-050a3e6f9652"; 
const PRO_LINK = "https://mungers-mind.lemonsqueezy.com/checkout/buy/950653fe8-dcf9-47c4-8cd2-f32a0f453d9d";

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
  
  const [showPaywall, setShowPaywall] = useState(false);
  const [usageCount, setUsageCount] = useState(0);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedCount = localStorage.getItem('munger_usage_count');
    if (storedCount) setUsageCount(parseInt(storedCount));
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isLoading]);

  const processQuery = async (query: string) => {
    if (usageCount >= 3) { // 限制免费次数
      setShowPaywall(true);
      return; 
    }

    if (!query.trim() || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: query, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // 调用新的 Gemini 2.0 服务
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
      console.error(error);
      // 错误处理
    } finally {
      setIsLoading(false);
    }
  };

  const handleModelSelect = (model: ModelEntry) => {
    setShowExplorer(false);
    processQuery(`请详细解释“${model.name}”如何应用到现实生活中，以及根据逆向思维，我应该避开哪些坑？`);
  };

  // 修复后的下载逻辑
  const handleDownload = async (msgId: string) => {
    if (usageCount >= 3) {
      setShowPaywall(true);
      return;
    }

    setIsExporting(msgId);
    // 这里传入 HTML 元素的 ID (msg-xxxx)
    await exportToPDF(`msg-container-${msgId}`);
    setIsExporting(null);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      <header className="flex-none p-4 md:p-6 bg-slate-900 border-b border-slate-800 shadow-xl z-20">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-700 rounded-full flex items-center justify-center text-xl shadow-lg border border-emerald-500/30">🏛️</div>
            <div>
              <h1 className="text-lg md:text-xl font-bold tracking-tight text-emerald-400">芒格的智慧圣殿</h1>
              <p className="text-[9px] md:text-xs text-slate-400 font-medium uppercase tracking-widest">世俗智慧思维格栅</p>
            </div>
          </div>
          <button 
            onClick={() => setShowExplorer(!showExplorer)}
            className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all border ${showExplorer ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-emerald-400'}`}
          >
            {showExplorer ? '关闭探索器' : '探索 100 个模型'}
          </button>
        </div>
      </header>

      <main className="flex-1 relative overflow-hidden flex flex-col">
        {/* Model Explorer 遮罩 */}
        <div className={`absolute inset-0 z-30 p-4 md:p-8 overflow-y-auto transition-all duration-500 bg-slate-950/90 backdrop-blur-sm ${showExplorer ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'}`}>
          <div className="max-w-6xl mx-auto pb-32">
            {/* 确保你 components 目录下有这个组件 */}
            <ModelExplorer onSelect={handleModelSelect} />
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-12 scroll-smooth">
          {messages.length === 0 && !isLoading && (
            <div className="max-w-2xl mx-auto text-center mt-20 opacity-40">
              <div className="text-6xl mb-6 text-emerald-900">📜</div>
              <h2 className="text-2xl font-serif mb-2 italic">寻求世俗智慧</h2>
              <p className="text-sm text-emerald-500 border border-emerald-900/50 bg-emerald-900/10 px-3 py-1 rounded-full inline-block mt-4">
                 剩余免费次数: {3 - usageCount}
              </p>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-4xl w-full ${msg.role === 'user' ? 'bg-slate-800/40 p-5 rounded-2xl border border-slate-700/50 ml-auto md:w-auto md:max-w-xl' : ''}`}>
                {msg.role === 'user' ? (
                  <p className="text-md text-emerald-50 font-medium italic">“{msg.content}”</p>
                ) : (
                  // 这里加个 ID 方便 PDF 截图
                  <div id={`msg-container-${msg.id}`} className="space-y-10 bg-slate-950 p-4 md:p-0"> 
                    <div className="flex justify-between items-center border-b border-slate-800 pb-6">
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-[2px] bg-emerald-600"></span>
                        <span className="text-emerald-500 font-bold uppercase tracking-widest text-xs">查理的深度判断</span>
                      </div>
                      {msg.data && (
                         <button 
                           onClick={() => handleDownload(msg.id)}
                           disabled={isExporting === msg.id}
                           className="text-[10px] uppercase tracking-widest font-bold px-4 py-2 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30 rounded-lg transition-all"
                         >
                           {isExporting === msg.id ? '正在生成...' : '下载报告 (PDF)'}
                         </button>
                      )}
                    </div>

                    <p className="text-lg md:text-xl serif leading-relaxed text-slate-100 whitespace-pre-wrap">
                      {msg.content}
                    </p>

                    {msg.data && (
                      <>
                        {/* 模型卡片展示区 */}
                        <section>
                          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">格栅模型 (Lattice Models)</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* 确保 models 存在且是数组，防止白屏 */}
                            {(msg.data.models || []).map((model, idx) => (
                              <MentalModelCard key={idx} model={model} />
                            ))}
                          </div>
                        </section>

                        <section className="bg-emerald-950/10 border-l-4 border-emerald-600 p-5 rounded-r-lg">
                          <h3 className="text-emerald-500 font-bold mb-2 text-xs uppercase tracking-widest">⚡ Lollapalooza 效应</h3>
                          <p className="text-slate-300 text-sm italic">{msg.data.lollapalooza}</p>
                        </section>

                        <InversionPanel content={msg.data.inversion} />
                      </>
                    )}
                    
                    {/* PDF 页脚签名 (只在打印时有用) */}
                    <div className="hidden print:block mt-8 text-center text-xs text-slate-400 border-t pt-4">
                       Generated by Munger's Mind Oracle
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {isLoading && <div className="text-center text-emerald-500 animate-pulse">查理正在思考...</div>}
        </div>

        <div className="flex-none p-4 bg-slate-900 border-t border-slate-800 z-40">
          <form onSubmit={(e) => { e.preventDefault(); processQuery(input); }} className="max-w-4xl mx-auto relative">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="向查理提问..."
              className="w-full bg-slate-950 border border-slate-700 rounded-full py-4 pl-6 pr-16 focus:border-emerald-500 text-slate-100"
              disabled={isLoading}
            />
            <button type="submit" disabled={isLoading || !input.trim()} className="absolute right-2 top-2 w-12 h-12 bg-emerald-600 rounded-full text-white flex items-center justify-center hover:bg-emerald-500">
               ⬆
            </button>
          </form>
        </div>
      </main>

      {/* Paywall 弹窗 */}
      {showPaywall && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-emerald-500/30 p-8 rounded-2xl max-w-md text-center">
            <h2 className="text-2xl font-serif text-emerald-50 mb-2">最好的投资是投资自己</h2>
            <p className="text-slate-400 mb-8 text-sm">您的免费深度分析次数已用完。</p>
            <a href={STARTER_LINK} className="block w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl mb-3">解锁无限智慧 - $9.99/月</a>
            <button onClick={() => setShowPaywall(false)} className="text-xs text-slate-500 hover:text-white">暂不升级</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;

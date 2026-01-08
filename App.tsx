import React, { useState, useRef, useEffect } from 'react';
import { Message, MungerResponse } from './types';
import { getMungerAdvice } from './services/geminiService';
import MentalModelCard from './components/MentalModelCard';
import InversionPanel from './components/InversionPanel';
import ModelExplorer from './components/ModelExplorer';
import { ModelEntry } from './models';
import { exportToPDF } from './services/pdfService';

// 🔥 请在这里填入你 Lemon Squeezy 的真实支付链接
const STARTER_LINK = "https://mungers-mind.lemonsqueezy.com/checkout/buy/b2b33d63-a09f-41f9-9db9-050a3e6f9652"; 
const PRO_LINK = "https://mungers-mind.lemonsqueezy.com/checkout/buy/950653fe8-dcf9-47c4-8cd2-f32a0f453d9d";

const App: React.FC = () => {
  // 原有状态
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showExplorer, setShowExplorer] = useState(false);
  const [isExporting, setIsExporting] = useState<string | null>(null);
  
  // 💰 新增状态：付费拦截相关
  const [showPaywall, setShowPaywall] = useState(false);
  const [usageCount, setUsageCount] = useState(0);

  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  // 🔄 新增 Effect：初始化时读取本地使用次数
  useEffect(() => {
    const storedCount = localStorage.getItem('munger_usage_count');
    if (storedCount) {
      setUsageCount(parseInt(storedCount));
    }
  }, []);

  // 原有 Effect：消息滚动
  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // 🧠 核心逻辑：处理用户提问（包含付费拦截）
  const processQuery = async (query: string) => {
    // 🛑 拦截点 1：如果已经用过一次免费机会，直接弹窗阻断
    if (usageCount >= 1) {
      setShowPaywall(true);
      return; 
    }

    if (!query.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: query,
      timestamp: Date.now(),
    };

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

      // ✅ 成功获取回复后，消耗一次免费机会
      const newCount = usageCount + 1;
      setUsageCount(newCount);
      localStorage.setItem('munger_usage_count', newCount.toString());

    } catch (error) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'munger',
        content: "系统故障。大概是电路里掺杂了太多的废话。再试一次。",
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    processQuery(input);
  };

  const handleModelSelect = (model: ModelEntry) => {
    setShowExplorer(false);
    // 这里调用 processQuery，也会自动触发上面的付费拦截逻辑
    processQuery(`请详细解释“${model.name}”如何应用到现实生活中，以及根据逆向思维，我应该避开哪些坑？`);
  };

  // 📥 下载逻辑（包含付费拦截）
  const handleDownload = async (msgId: string, query: string, data: MungerResponse) => {
    // 🛑 拦截点 2：PDF 下载必须付费（或者视同第二次使用）
    if (usageCount >= 1) {
      setShowPaywall(true);
      return;
    }

    setIsExporting(msgId);
    await exportToPDF(query, data);
    setIsExporting(null);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* 头部 */}
      <header className="flex-none p-4 md:p-6 bg-slate-900 border-b border-slate-800 shadow-xl z-20">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-700 rounded-full flex items-center justify-center text-xl md:text-2xl shadow-lg border border-emerald-500/30">
              <i className="fas fa-university text-white"></i>
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold tracking-tight text-emerald-400 serif">芒格的智慧圣殿</h1>
              <p className="text-[9px] md:text-xs text-slate-400 font-medium uppercase tracking-widest">世俗智慧思维格栅</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowExplorer(!showExplorer)}
              className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all border ${showExplorer ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-emerald-400 hover:border-emerald-500'}`}
            >
              <i className={`fas ${showExplorer ? 'fa-times' : 'fa-compass'} mr-2`}></i>
              {showExplorer ? '关闭探索器' : '探索 100 个模型'}
            </button>
            <div className="hidden lg:block text-right">
              <p className="text-[10px] text-slate-500 italic max-w-xs leading-tight">“反过来想，总是反过来想。”</p>
            </div>
          </div>
        </div>
      </header>

      {/* 内容区域 */}
      <main className="flex-1 relative overflow-hidden flex flex-col">
        {/* 探索器遮罩 */}
        <div className={`absolute inset-0 z-30 p-4 md:p-8 overflow-y-auto transition-all duration-500 ease-in-out bg-slate-950/40 backdrop-blur-sm ${showExplorer ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'}`}>
          <div className="max-w-6xl mx-auto pb-32">
            <ModelExplorer onSelect={handleModelSelect} />
          </div>
        </div>

        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 md:p-8 space-y-12 scroll-smooth"
        >
          {messages.length === 0 && !isLoading && (
            <div className="max-w-2xl mx-auto text-center mt-20 opacity-40">
              <i className="fas fa-scroll text-6xl mb-6 block text-emerald-900"></i>
              <h2 className="text-2xl font-serif mb-2 italic">寻求世俗智慧</h2>
              <p className="text-sm">识别模型。理解 Lollapalooza 效应。逆向思考。</p>
              
              {/* 提示剩余次数 */}
              <div className="mt-4 text-xs text-emerald-500 bg-emerald-900/20 inline-block px-3 py-1 rounded-full border border-emerald-800">
                {usageCount === 0 ? "✨ 你有 1 次免费深度决策分析机会" : "🔒 免费额度已用完，请升级"}
              </div>

              <button 
                onClick={() => setShowExplorer(true)}
                className="mt-8 text-emerald-500 hover:text-emerald-400 uppercase tracking-widest text-[10px] font-bold border-b border-emerald-900 pb-1 block mx-auto"
              >
                点击探索 100 个思维模型格栅
              </button>
            </div>
          )}

          {messages.map((msg, idx) => {
            const userQuery = msg.role === 'munger' && idx > 0 ? messages[idx-1].content : '';
            
            return (
              <div 
                key={msg.id} 
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
              >
                <div className={`max-w-4xl w-full ${msg.role === 'user' ? 'bg-slate-800/40 p-5 rounded-2xl border border-slate-700/50 ml-auto md:w-auto md:max-w-xl' : ''}`}>
                  
                  {msg.role === 'user' ? (
                    <p className="text-md leading-relaxed text-emerald-50 font-medium italic">“{msg.content}”</p>
                  ) : (
                    <div className="space-y-10">
                      {/* 分析头部，包含下载按钮 */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
                        <div className="flex items-center gap-2">
                          <span className="w-8 h-[2px] bg-emerald-600"></span>
                          <span className="text-emerald-500 font-bold uppercase tracking-widest text-xs">查理的深度判断</span>
                        </div>
                        
                        {msg.data && (
                           <button 
                             onClick={() => handleDownload(msg.id, userQuery, msg.data!)}
                             disabled={isExporting === msg.id}
                             className="group text-[10px] uppercase tracking-widest font-bold px-4 py-2 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30 hover:border-emerald-500 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg"
                           >
                             {isExporting === msg.id ? (
                               <i className="fas fa-spinner fa-spin"></i>
                             ) : (
                               <i className="fas fa-file-pdf"></i>
                             )}
                             {isExporting === msg.id ? '正在生成...' : '下载分析报告 (PDF)'}
                           </button>
                        )}
                      </div>

                      <section>
                        <p className="text-lg md:text-xl serif leading-relaxed text-slate-100">
                          {msg.content}
                        </p>
                      </section>

                      {msg.data && (
                        <>
                          <section>
                            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                              <i className="fas fa-th"></i>
                              格栅模型格栅 (Lattice Models)
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {msg.data.models.map((model, idx) => (
                                <MentalModelCard key={idx} model={model} />
                              ))}
                            </div>
                          </section>

                          <section className="bg-emerald-950/10 border-l-4 border-emerald-600 p-5 rounded-r-lg shadow-inner">
                            <h3 className="text-emerald-500 font-bold mb-2 flex items-center gap-2 text-xs uppercase tracking-widest">
                              <i className="fas fa-bolt"></i>
                              Lollapalooza 综合效应
                            </h3>
                            <p className="text-slate-300 text-sm leading-relaxed italic">
                              {msg.data.lollapalooza}
                            </p>
                          </section>

                          <InversionPanel content={msg.data.inversion} />
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex justify-start animate-pulse">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4 w-full max-w-2xl shadow-2xl">
                <div className="h-4 bg-slate-800 rounded w-3/4"></div>
                <div className="h-4 bg-slate-800 rounded w-1/2"></div>
                <div className="grid grid-cols-2 gap-4 mt-8">
                  <div className="h-24 bg-slate-800 rounded"></div>
                  <div className="h-24 bg-slate-800 rounded"></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 输入区域 */}
        <div className="flex-none p-4 md:p-6 bg-slate-900 border-t border-slate-800 sticky bottom-0 z-40">
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto relative group">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="向查理提问：如何做出更好的决策？"
              className="w-full bg-slate-950 border border-slate-700 rounded-full py-4 pl-6 pr-16 focus:outline-none focus:border-emerald-500 transition-all text-slate-100 placeholder-slate-600 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="absolute right-2 top-2 w-12 h-12 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-full flex items-center justify-center transition-all shadow-lg active:scale-95"
            >
              {isLoading ? (
                <i className="fas fa-circle-notch fa-spin"></i>
              ) : (
                <i className="fas fa-arrow-up"></i>
              )}
            </button>
          </form>
          <div className="max-w-4xl mx-auto mt-2 flex justify-between px-4">
             <p className="text-[10px] text-slate-600 font-medium">犀利 • 客观 • 诚实</p>
             <button 
               onClick={() => {
                 setMessages([]);
                 setUsageCount(0); // 开发测试用：允许重置次数，上线前可以删掉这一行
                 localStorage.removeItem('munger_usage_count');
               }}
               className="text-[10px] text-slate-600 hover:text-red-400 transition-colors uppercase tracking-widest font-bold"
             >
               重置 (开发测试用)
             </button>
          </div>
        </div>
      </main>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #020617;
        }
        ::-webkit-scrollbar-thumb {
          background: #1e293b;
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #334155;
        }
      `}</style>

      {/* 💰 Paywall Modal (付费墙弹窗) */}
      {showPaywall && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-emerald-500/30 p-8 rounded-2xl max-w-md text-center shadow-2xl relative overflow-hidden">
            {/* 装饰背景 */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-50"></div>

            <button 
              onClick={() => setShowPaywall(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
            >
              <i className="fas fa-times"></i>
            </button>

            <div className="w-16 h-16 bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
              <i className="fas fa-gem text-2xl text-emerald-400"></i>
            </div>

            <h2 className="text-2xl font-serif text-emerald-50 mb-2">
              The best investment is in yourself.
            </h2>
            <p className="text-slate-400 mb-8 text-sm leading-relaxed">
              You’ve seen the blind spots in your first analysis. Don't let cognitive biases erode your future returns.
            </p>
            
            <div className="space-y-4 mb-8 text-left text-slate-300 text-sm bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
               <div className="flex items-center gap-3">
                 <i className="fas fa-check text-emerald-400 text-xs"></i> 
                 <span>Unlimited Oracle Analysis</span>
               </div>
               <div className="flex items-center gap-3">
                 <i className="fas fa-check text-emerald-400 text-xs"></i> 
                 <span>Download Professional PDF Reports</span>
               </div>
               <div className="flex items-center gap-3">
                 <i className="fas fa-check text-emerald-400 text-xs"></i> 
                 <span>Lollapalooza Detection</span>
               </div>
            </div>

            <div className="space-y-3">
              <a 
                href={STARTER_LINK}
                className="block w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-900/20 hover:shadow-emerald-900/40 transform hover:-translate-y-0.5"
              >
                Unlock Full Wisdom - $9.99/mo
              </a>
              <a 
                href={PRO_LINK}
                className="block w-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium py-3.5 rounded-xl transition-all border border-slate-700"
              >
                Go Pro - $29.99/year (Save 75%)
              </a>
            </div>
            
            <p className="mt-6 text-[10px] text-slate-500 italic font-serif">
              "Like compound interest, avoiding one bad decision today is worth a fortune tomorrow."
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
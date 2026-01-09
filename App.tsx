import React, { useState, useRef, useEffect } from 'react';
import { MungerResponse, getMungerAdvice } from './services/geminiService'; 
import { exportToPDF } from './services/pdfService';
import MentalModelCard from './components/MentalModelCard';
import InversionPanel from './components/InversionPanel';
import ModelExplorer from './components/ModelExplorer';
import { ModelEntry } from './models';

// 🔥 真实支付链接配置完成 (Module 2 Final)
const LINKS = {
  // Starter ($19/mo)
  STARTER: "https://mungers-mind.lemonsqueezy.com/checkout/buy/b2b33d63-a09f-41f9-9db9-050a3e6f9652",
  // Pro ($39/mo)
  PRO: "https://mungers-mind.lemonsqueezy.com/checkout/buy/950653fe8-dcf9-47c4-8cd2-f32a0f453d9d",
  // Credits ($39/20次) - 新填入的链接
  CREDITS: "https://mungers-mind.lemonsqueezy.com/checkout/buy/a52438b3-daa2-486a-b426-464d18e9f962" 
};

// 用户身份类型
type UserPlan = 'free' | 'starter' | 'pro' | 'credits';

interface UserState {
  plan: UserPlan;
  creditsLeft: number;
}

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

  // 用户状态管理
  const [user, setUser] = useState<UserState>({ plan: 'free', creditsLeft: 1 });
  const scrollRef = useRef<HTMLDivElement>(null);

  // 初始化：处理支付回调与本地缓存
  useEffect(() => {
    // 1. 检查 URL 参数（来自 Lemon Squeezy Redirect）
    const params = new URLSearchParams(window.location.search);
    const planParam = params.get('plan');

    if (planParam === 'starter') {
      updateUser('starter', 10);
    } else if (planParam === 'pro') {
      updateUser('pro', 9999);
    } else if (planParam === 'credits') {
      // 购买点数：在现有基础上 +20
      const current = loadUser();
      const newCredits = (current.plan === 'credits' ? current.creditsLeft : 0) + 20;
      updateUser('credits', newCredits > 0 ? newCredits : 20);
    } else {
      // 2. 没有参数，读取本地缓存
      setUser(loadUser());
    }
  }, []);

  const loadUser = (): UserState => {
    const saved = localStorage.getItem('munger_user_state');
    return saved ? JSON.parse(saved) : { plan: 'free', creditsLeft: 1 };
  };

  const updateUser = (plan: UserPlan, credits: number) => {
    const newState = { plan, creditsLeft: credits };
    setUser(newState);
    localStorage.setItem('munger_user_state', JSON.stringify(newState));
    // 清除 URL 参数，保持地址栏干净
    if (window.location.search.includes('plan=')) {
      window.history.replaceState({}, document.title, "/");
    }
  };

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isLoading]);

  const processQuery = async (query: string) => {
    // 🛑 拦截逻辑：没有次数且不是 Pro
    if (user.creditsLeft <= 0 && user.plan !== 'pro') {
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

      // 📉 扣减次数 (Pro 不扣)
      if (user.plan !== 'pro') {
        updateUser(user.plan, user.creditsLeft - 1);
      }

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'munger', content: "系统连接中断，请重试。", timestamp: Date.now() }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleModelSelect = (model: ModelEntry) => {
    setShowExplorer(false);
    processQuery(`请详细解释“${model.name}”如何应用到现实生活中，以及根据逆向思维，我应该避开哪些坑？`);
  };

  const handleDownload = async (msgId: string) => {
    // 免费用户点击下载 -> 弹付费墙
    if (user.plan === 'free') {
      setShowPaywall(true);
      return;
    }
    setIsExporting(msgId);
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
              <h1 className="text-lg md:text-xl font-bold tracking-tight text-emerald-400">芒格智慧圣殿</h1>
              <p className="text-[9px] md:text-xs text-slate-400 font-medium uppercase tracking-widest">世俗智慧思维格栅</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* 状态仪表盘 */}
            <div className="hidden md:flex bg-slate-800 px-3 py-1 rounded-full border border-slate-700 text-xs font-mono items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${user.creditsLeft > 0 ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
              {user.plan === 'pro' ? (
                <span className="text-emerald-400 font-bold">PRO (∞)</span>
              ) : (
                <span className="text-slate-300">
                  {user.plan === 'free' ? 'Trial' : user.plan === 'starter' ? 'Starter' : 'Credits'}: 
                  <span className="text-white font-bold ml-1">{user.creditsLeft}</span>
                </span>
              )}
            </div>

            <button 
              onClick={() => setShowExplorer(!showExplorer)}
              className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all border ${showExplorer ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-emerald-400'}`}
            >
              {showExplorer ? '关闭格栅' : '探索模型'}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 relative overflow-hidden flex flex-col">
        {/* Model Explorer */}
        <div className={`absolute inset-0 z-30 p-4 md:p-8 overflow-y-auto transition-all duration-500 bg-slate-950/90 backdrop-blur-sm ${showExplorer ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'}`}>
          <div className="max-w-6xl mx-auto pb-32">
            <ModelExplorer onSelect={handleModelSelect} />
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-12 scroll-smooth">
          {messages.length === 0 && !isLoading && (
            <div className="max-w-2xl mx-auto text-center mt-20 opacity-40">
              <div className="text-6xl mb-6 text-emerald-900">📜</div>
              <h2 className="text-2xl font-serif mb-2 italic">寻求世俗智慧</h2>
              
              <div className="mt-6 flex justify-center gap-4 text-xs">
                <div className="px-4 py-2 bg-slate-900 border border-emerald-900/50 rounded-lg text-emerald-500">
                  当前身份: <strong className="uppercase">{user.plan}</strong>
                </div>
                <div className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-400">
                  剩余分析: <strong>{user.plan === 'pro' ? '无限' : user.creditsLeft}</strong> 次
                </div>
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-4xl w-full ${msg.role === 'user' ? 'bg-slate-800/40 p-5 rounded-2xl border border-slate-700/50 ml-auto md:w-auto md:max-w-xl' : ''}`}>
                {msg.role === 'user' ? (
                  <p className="text-md text-emerald-50 font-medium italic">“{msg.content}”</p>
                ) : (
                  <div id={`msg-container-${msg.id}`} className="space-y-10 bg-slate-950 p-4 md:p-0"> 
                    <div className="flex justify-between items-center border-b border-slate-800 pb-6">
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-[2px] bg-emerald-600"></span>
                        <span className="text-emerald-500 font-bold uppercase tracking-widest text-xs">查理的深度判断</span>
                      </div>
                      {msg.data && (
                         <button 
                           onClick={() => handleDownload(msg.id)}
                           className="text-[10px] uppercase tracking-widest font-bold px-4 py-2 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30 rounded-lg transition-all flex items-center gap-2"
                         >
                           {isExporting === msg.id ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-file-pdf"></i>}
                           {user.plan === 'free' ? '解锁 PDF 报告' : '下载报告 (PDF)'}
                         </button>
                      )}
                    </div>

                    <p className="text-lg md:text-xl serif leading-relaxed text-slate-100 whitespace-pre-wrap">
                      {msg.content}
                    </p>

                    {msg.data && (
                      <>
                        <section>
                          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">格栅模型 (Lattice Models)</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    
                    <div className="hidden print:block mt-8 text-center text-xs text-slate-400 border-t pt-4">
                       Generated by Munger's Mind Oracle
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {isLoading && <div className="text-center text-emerald-500 animate-pulse">查理正在调动格栅...</div>}
        </div>

        <div className="flex-none p-4 bg-slate-900 border-t border-slate-800 z-40">
          <form onSubmit={(e) => { e.preventDefault(); processQuery(input); }} className="max-w-4xl mx-auto relative">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="输入你的困惑..."
              className="w-full bg-slate-950 border border-slate-700 rounded-full py-4 pl-6 pr-16 focus:border-emerald-500 text-slate-100"
              disabled={isLoading}
            />
            <button type="submit" disabled={isLoading || !input.trim()} className="absolute right-2 top-2 w-12 h-12 bg-emerald-600 rounded-full text-white flex items-center justify-center hover:bg-emerald-500">
               ⬆
            </button>
          </form>
        </div>
      </main>

      {/* 💰 付费墙 (Module 2 核心) */}
      {showPaywall && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="max-w-6xl w-full bg-slate-900 border border-emerald-900/50 rounded-3xl p-6 md:p-10 text-center shadow-2xl relative">
            <button onClick={() => setShowPaywall(false)} className="absolute top-6 right-6 text-slate-500 hover:text-white">✕</button>
            
            <div className="w-16 h-16 bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
              <span className="text-3xl">🗝️</span>
            </div>

            <h2 className="text-3xl md:text-4xl font-serif text-emerald-50 mb-4">Invest In Your Wisdom</h2>
            <p className="text-slate-400 mb-10 text-sm md:text-base max-w-2xl mx-auto">
              好的决策是昂贵的，但无知更昂贵。<br/>选择适合你的方案，开启你的“外部认知系统”。
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* STARTER ($19) */}
              <div className="bg-slate-800/50 p-8 rounded-2xl border border-slate-700 hover:border-emerald-500/50 transition-all flex flex-col hover:transform hover:-translate-y-1 duration-300">
                <h3 className="text-emerald-400 font-bold tracking-widest uppercase text-sm mb-2">Starter</h3>
                <div className="text-3xl font-bold text-white mb-2">$19 <span className="text-sm font-normal text-slate-500">/ mo</span></div>
                <div className="text-xs text-slate-500 mb-6">适合稳健的长期主义者</div>
                
                <ul className="text-left space-y-4 text-sm text-slate-300 flex-1 mb-8">
                  <li className="flex gap-3"><span className="text-emerald-500">✓</span> 每月 <strong>10 次</strong> 完整分析</li>
                  <li className="flex gap-3"><span className="text-emerald-500">✓</span> 解锁 PDF 深度报告导出</li>
                  <li className="flex gap-3"><span className="text-emerald-500">✓</span> 永久保存历史记录</li>
                </ul>
                <a href={LINKS.STARTER} className="block w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3.5 rounded-xl transition-all">
                  订阅 Starter
                </a>
              </div>

              {/* PRO ($39) - Highlight */}
              <div className="bg-emerald-900/10 p-8 rounded-2xl border-2 border-emerald-500 relative flex flex-col transform md:-translate-y-4 shadow-2xl shadow-emerald-500/10">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-emerald-500 text-slate-900 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                  Best Value
                </div>
                <h3 className="text-emerald-400 font-bold tracking-widest uppercase text-sm mb-2">Pro</h3>
                <div className="text-3xl font-bold text-white mb-2">$39 <span className="text-sm font-normal text-slate-500">/ mo</span></div>
                <div className="text-xs text-emerald-500/80 mb-6">高频决策者的首选</div>

                <ul className="text-left space-y-4 text-sm text-slate-300 flex-1 mb-8">
                  <li className="flex gap-3"><span className="text-emerald-500">✓</span> <strong>无限次</strong> 深度分析</li>
                  <li className="flex gap-3"><span className="text-emerald-500">✓</span> 高级偏差叠加 (Lollapalooza)</li>
                  <li className="flex gap-3"><span className="text-emerald-500">✓</span> 优先体验新模型</li>
                </ul>
                <a href={LINKS.PRO} className="block w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg hover:shadow-emerald-500/25">
                  成为 Pro 会员
                </a>
              </div>

              {/* CREDITS ($39) - One Time */}
              <div className="bg-slate-800/50 p-8 rounded-2xl border border-slate-700 hover:border-emerald-500/50 transition-all flex flex-col hover:transform hover:-translate-y-1 duration-300">
                <h3 className="text-slate-400 font-bold tracking-widest uppercase text-sm mb-2">Credits Pack</h3>
                <div className="text-3xl font-bold text-white mb-2">$39 <span className="text-sm font-normal text-slate-500">/ once</span></div>
                <div className="text-xs text-slate-500 mb-6">拒绝订阅，按需购买</div>

                <ul className="text-left space-y-4 text-sm text-slate-300 flex-1 mb-8">
                  <li className="flex gap-3"><span className="text-emerald-500">✓</span> 获得 <strong>20 次</strong> 完整分析点数</li>
                  <li className="flex gap-3"><span className="text-emerald-500">✓</span> <strong>无自动续费</strong> (No Recurring)</li>
                  <li className="flex gap-3"><span className="text-emerald-500">✓</span> 永久有效，用完即止</li>
                </ul>
                <a href={LINKS.CREDITS} className="block w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3.5 rounded-xl transition-all">
                  购买 20 点数
                </a>
              </div>
            </div>

            <p className="mt-10 text-xs text-slate-600">
              Secure payment via Lemon Squeezy. Cancel anytime.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;

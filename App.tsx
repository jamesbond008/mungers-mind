import React, { useState, useRef, useEffect } from 'react';
// ✅ 适配路径：确保这些文件夹都在 src 内部
import { MungerResponse, getMungerAdvice } from './services/geminiService'; 
import { exportToPDF } from './services/pdfService';
import MentalModelCard from './components/MentalModelCard';
import InversionPanel from './components/InversionPanel';
import ModelExplorer from './components/ModelExplorer';
import { ModelEntry } from './models'; 

// 🔥 真实支付链接配置
const LINKS = {
  STARTER: "https://mungers-mind.lemonsqueezy.com/checkout/buy/b2b33d63-a09f-41f9-9db9-050a3e6f9652",
  PRO: "https://mungers-mind.lemonsqueezy.com/checkout/buy/950653fe8-dcf9-47c4-8cd2-f32a0f453d9d",
  CREDITS: "https://mungers-mind.lemonsqueezy.com/checkout/buy/a52438b3-daa2-486a-b426-464d18e9f962" 
};

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
  
  // 用户初始状态
  const [user, setUser] = useState<UserState>({ plan: 'free', creditsLeft: 1 });
  const scrollRef = useRef<HTMLDivElement>(null);

  // 初始化与支付回调处理
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const planParam = params.get('plan');

    if (planParam === 'starter') {
      updateUser('starter', 10);
    } else if (planParam === 'pro') {
      updateUser('pro', 9999);
    } else if (planParam === 'credits') {
      const current = loadUser();
      const newCredits = (current.plan === 'credits' ? current.creditsLeft : 0) + 20;
      updateUser('credits', newCredits);
    } else {
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
    // 清理 URL 参数，防止刷新重复触发
    if (window.location.search.includes('plan=')) {
      window.history.replaceState({}, document.title, "/");
    }
  };

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isLoading]);

  const processQuery = async (query: string) => {
    // 拦截无点数用户
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

      // 扣减非 PRO 用户的次数
      if (user.plan !== 'pro') {
        updateUser(user.plan, user.creditsLeft - 1);
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'munger', content: "连接圣殿失败，请稍后重试。", timestamp: Date.now() }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleModelSelect = (model: ModelEntry) => {
    setShowExplorer(false);
    processQuery(`请详细解释“${model.name}”并分析其在当前情境下的应用。`);
  };

  const handleDownload = async (msgId: string) => {
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
              <p className="text-[9px] md:text-xs text-slate-400 font-medium uppercase tracking-widest text-center">Lattice of Mental Models</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="hidden md:flex bg-slate-800 px-3 py-1 rounded-full border border-slate-700 text-xs font-mono items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${user.creditsLeft > 0 ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
              {user.plan === 'pro' ? (
                <span className="text-emerald-400 font-bold">PRO 会员 (∞)</span>
              ) : (
                <span className="text-slate-300">
                  {user.plan.toUpperCase()}: <span className="text-white font-bold ml-1">{user.creditsLeft}</span>
                </span>
              )}
            </div>
            <button 
              onClick={() => setShowExplorer(!showExplorer)}
              className={`px-4 py-2 rounded-full text-xs font-bold uppercase transition-all border ${showExplorer ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
            >
              探索模型
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 relative overflow-hidden flex flex-col">
        {/* 模型浏览器遮罩 */}
        <div className={`absolute inset-0 z-30 p-4 overflow-y-auto transition-all bg-slate-950/90 backdrop-blur-sm ${showExplorer ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <div className="max-w-6xl mx-auto pb-32">
            <ModelExplorer onSelect={handleModelSelect} />
          </div>
        </div>

        {/* 聊天内容区 */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-12">
          {messages.length === 0 && !isLoading && (
            <div className="max-w-2xl mx-auto text-center mt-20 opacity-40">
              <div className="text-6xl mb-6">📜</div>
              <h2 className="text-2xl font-serif italic text-white">寻求世俗智慧的指引</h2>
              <p className="mt-4 text-slate-400">输入你的商业难题或人生困惑，启动格栅思维分析。</p>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-4xl w-full ${msg.role === 'user' ? 'bg-slate-800/40 p-5 rounded-2xl border border-slate-700/50' : ''}`}>
                {msg.role === 'user' ? (
                  <p className="text-md text-emerald-50 font-medium italic">“{msg.content}”</p>
                ) : (
                  <div id={`msg-container-${msg.id}`} className="space-y-10 bg-slate-950 p-4 md:p-0"> 
                    <div className="flex justify-between items-center border-b border-slate-800 pb-6">
                      <span className="text-emerald-500 font-bold uppercase tracking-widest text-xs">查理的深度判断</span>
                      {msg.data && (
                         <button 
                           onClick={() => handleDownload(msg.id)}
                           className="text-[10px] font-bold px-4 py-2 bg-emerald-600/10 text-emerald-400 border border-emerald-500/30 rounded-lg hover:bg-emerald-600 hover:text-white transition-colors"
                         >
                           {isExporting === msg.id ? '导出中...' : '下载分析报告 (PDF)'}
                         </button>
                      )}
                    </div>
                    <p className="text-lg md:text-xl serif leading-relaxed text-slate-100 whitespace-pre-wrap">{msg.content}</p>
                    {msg.data && (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {(msg.data.models || []).map((model, idx) => (
                            <MentalModelCard key={idx} model={model} />
                          ))}
                        </div>
                        <section className="bg-emerald-950/10 border-l-4 border-emerald-600 p-5 rounded-r-lg">
                          <h3 className="text-emerald-500 font-bold mb-2 text-xs uppercase tracking-widest">⚡ Lollapalooza 效应</h3>
                          <p className="text-slate-300 text-sm italic">{msg.data.lollapalooza}</p>
                        </section>
                        <InversionPanel content={msg.data.inversion} />
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && <div className="text-center text-emerald-500 animate-pulse font-bold">查理正在思考，请稍候...</div>}
        </div>

        {/* 输入框区域 */}
        <div className="flex-none p-4 bg-slate-900 border-t border-slate-800">
          <form onSubmit={(e) => { e.preventDefault(); processQuery(input); }} className="max-w-4xl mx-auto relative">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="输入你的困惑..."
              className="w-full bg-slate-950 border border-slate-700 rounded-full py-4 pl-6 pr-16 text-slate-100 outline-none focus:border-emerald-500"
              disabled={isLoading}
            />
            <button type="submit" disabled={isLoading || !input.trim()} className="absolute right-2 top-2 w-12 h-12 bg-emerald-600 rounded-full text-white hover:bg-emerald-500 transition-colors">
              ⬆
            </button>
          </form>
        </div>
      </main>

      {/* 💰 付费墙逻辑 */}
      {showPaywall && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="max-w-6xl w-full bg-slate-900 border border-emerald-900/50 rounded-3xl p-10 text-center shadow-2xl relative">
            <button onClick={() => setShowPaywall(false)} className="absolute top-6 right-6 text-slate-500 hover:text-white">✕</button>
            <h2 className="text-4xl font-serif text-emerald-50 mb-10">投资你的智慧格栅</h2>
            <p className="text-slate-400 mb-10">你的免费试用已结束。选择方案以继续深度分析。</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-800/50 p-8 rounded-2xl border border-slate-700">
                <h3 className="text-emerald-400 font-bold mb-2">入门版</h3>
                <div className="text-3xl font-bold text-white mb-6">$19 / 月</div>
                <p className="text-xs text-slate-500 mb-6 text-left">每月10次分析，支持PDF导出</p>
                <a href={LINKS.STARTER} className="block w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl">立即订阅</a>
              </div>
              <div className="bg-emerald-900/10 p-8 rounded-2xl border-2 border-emerald-500 transform md:-translate-y-4 shadow-xl">
                <h3 className="text-emerald-400 font-bold mb-2">专业版</h3>
                <div className="text-3xl font-bold text-white mb-6">$39 / 月</div>
                <p className="text-xs text-emerald-400 mb-6 text-left">无限次深度分析，优先访问新模型</p>
                <a href={LINKS.PRO} className="block w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl">解锁无限能力</a>
              </div>
              <div className="bg-slate-800/50 p-8 rounded-2xl border border-slate-700">
                <h3 className="text-slate-400 font-bold mb-2">点数包</h3>
                <div className="text-3xl font-bold text-white mb-6">$39 / 一次性</div>
                <p className="text-xs text-slate-500 mb-6 text-left">20次独立分析额度，永久有效</p>
                <a href={LINKS.CREDITS} className="block w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl">购买点数</a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;

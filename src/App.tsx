import React, { useState, useRef, useEffect } from 'react';
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
interface UserState { plan: UserPlan; creditsLeft: number; }
interface Message { id: string; role: 'user' | 'munger'; content: string; data?: MungerResponse; timestamp: number; }

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showExplorer, setShowExplorer] = useState(false);
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [user, setUser] = useState<UserState>({ plan: 'free', creditsLeft: 1 });
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const planParam = params.get('plan');
    if (planParam) {
      if (planParam === 'starter') updateUser('starter', 10);
      else if (planParam === 'pro') updateUser('pro', 9999);
      else if (planParam === 'credits') {
        const current = loadUser();
        updateUser('credits', (current.plan === 'credits' ? current.creditsLeft : 0) + 20);
      }
    } else setUser(loadUser());
  }, []);

  const loadUser = (): UserState => {
    const saved = localStorage.getItem('munger_user_state');
    return saved ? JSON.parse(saved) : { plan: 'free', creditsLeft: 1 };
  };

  const updateUser = (plan: UserPlan, credits: number) => {
    const newState = { plan, creditsLeft: credits };
    setUser(newState);
    localStorage.setItem('munger_user_state', JSON.stringify(newState));
    window.history.replaceState({}, document.title, "/");
  };

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }); }, [messages, isLoading]);

  const processQuery = async (query: string) => {
    if (user.creditsLeft <= 0 && user.plan !== 'pro') { setShowPaywall(true); return; }
    if (!query.trim() || isLoading) return;
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: query, timestamp: Date.now() }]);
    setInput(''); setIsLoading(true);
    try {
      const result = await getMungerAdvice(query);
      setMessages(prev => [...prev, { id: (Date.now()+1).toString(), role: 'munger', content: result.advice, data: result, timestamp: Date.now() }]);
      if (user.plan !== 'pro') updateUser(user.plan, user.creditsLeft - 1);
    } catch (e) { setMessages(prev => [...prev, { id: Date.now().toString(), role: 'munger', content: "系统连接中断。", timestamp: Date.now() }]); } 
    finally { setIsLoading(false); }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      <header className="flex-none p-4 md:p-6 bg-slate-900 border-b border-slate-800 shadow-xl z-20">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-700 rounded-full flex items-center justify-center text-xl shadow-lg border border-emerald-500/30">🏛️</div>
            <h1 className="text-lg md:text-xl font-bold text-emerald-400">芒格智慧圣殿</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-slate-800 px-3 py-1 rounded-full text-xs border border-slate-700">
              {user.plan.toUpperCase()}: <strong>{user.plan === 'pro' ? '∞' : user.creditsLeft}</strong>
            </div>
            <button onClick={() => setShowExplorer(!showExplorer)} className="px-4 py-2 rounded-full text-xs font-bold border border-slate-700 text-slate-400">探索模型</button>
          </div>
        </div>
      </header>

      <main className="flex-1 relative overflow-hidden flex flex-col">
        {showExplorer && <div className="absolute inset-0 z-30 p-8 overflow-y-auto bg-slate-950/90 backdrop-blur-sm"><ModelExplorer onSelect={(m) => { setShowExplorer(false); processQuery(`分析模型：${m.name}`); }} /></div>}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-12">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-4xl w-full">
                <div id={`msg-container-${msg.id}`} className="space-y-10 bg-slate-950 p-4 md:p-0">
                  <p className="text-lg serif text-slate-100">{msg.content}</p>
                  
                  {msg.data && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                      {/* 1. 思维模型格栅区 */}
                      <section>
                        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">格栅模型 (Lattice Models)</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {msg.data.models.map((m, i) => <MentalModelCard key={i} model={m} />)}
                        </div>
                      </section>

                      {/* 2. Lollapalooza 效应区 - 修复格式 */}
                      <section className="bg-emerald-950/10 border-l-4 border-emerald-600 p-6 rounded-r-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-2 opacity-10 text-4xl group-hover:scale-110 transition-transform">⚡</div>
                        <h3 className="flex items-center gap-2 text-emerald-500 font-bold mb-3 text-xs uppercase tracking-widest">
                          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                          Lollapalooza 综合效应
                        </h3>
                        <p className="text-slate-300 text-sm leading-relaxed italic">
                          {msg.data.lollapalooza}
                        </p>
                      </section>

                      {/* 3. 逆向思维区 - 修复格式 */}
                      <section className="bg-rose-950/10 border border-rose-900/30 p-6 rounded-2xl relative">
                        <h3 className="flex items-center gap-2 text-rose-500 font-bold mb-4 text-xs uppercase tracking-widest">
                          <span className="text-lg">🔄</span> 逆向思维原则 (Inversion)
                        </h3>
                        <div className="space-y-3">
                          <p className="text-rose-200/80 text-sm italic font-serif">
                            “反过来想，总是反过来想。你应该绝对避免的事：”
                          </p>
                          <div className="bg-slate-900/60 p-4 rounded-lg border border-rose-900/20 text-slate-300 text-sm leading-relaxed">
                            {msg.data.inversion}
                          </div>
                        </div>
                      </section>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {isLoading && <div className="text-emerald-500 animate-pulse text-center">查理正在思考...</div>}
        </div>
        <div className="p-4 bg-slate-900 border-t border-slate-800">
          <form onSubmit={(e) => { e.preventDefault(); processQuery(input); }} className="max-w-4xl mx-auto relative">
            <input value={input} onChange={(e) => setInput(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-full py-4 px-6 text-slate-100 focus:border-emerald-500 outline-none" placeholder="输入你的困惑..." />
            <button type="submit" className="absolute right-2 top-2 w-12 h-12 bg-emerald-600 rounded-full text-white">⬆</button>
          </form>
        </div>
      </main>

      {showPaywall && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-4">
          <div className="max-w-4xl w-full bg-slate-900 border border-emerald-900/50 rounded-3xl p-10 text-center">
            <h2 className="text-3xl font-serif text-emerald-50 mb-8">Invest In Your Wisdom</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 text-left">
                <div className="text-emerald-400 font-bold mb-2">Starter</div>
                <div className="text-2xl font-bold mb-4">$19<span className="text-sm font-normal text-slate-500">/mo</span></div>
                <a href={LINKS.STARTER} className="block w-full bg-slate-700 text-center py-2 rounded-lg text-white">订阅</a>
              </div>
              <div className="bg-emerald-900/20 p-6 rounded-xl border border-emerald-500 text-left scale-110 shadow-2xl">
                <div className="text-emerald-400 font-bold mb-2">Pro</div>
                <div className="text-2xl font-bold mb-4">$39<span className="text-sm font-normal text-slate-500">/mo</span></div>
                <a href={LINKS.PRO} className="block w-full bg-emerald-600 text-center py-2 rounded-lg text-white">无限分析</a>
              </div>
              <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 text-left">
                <div className="text-slate-400 font-bold mb-2">Credits</div>
                <div className="text-2xl font-bold mb-4">$39<span className="text-sm font-normal text-slate-500">/20次</span></div>
                <a href={LINKS.CREDITS} className="block w-full bg-slate-700 text-center py-2 rounded-lg text-white">一次性购</a>
              </div>
            </div>
            <button onClick={() => setShowPaywall(false)} className="mt-8 text-slate-500 underline text-sm">稍后再说</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;

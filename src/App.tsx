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
interface Message { 
  id: string; 
  role: 'user' | 'munger'; 
  content: string; 
  relatedQuestion?: string;
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
  const [user, setUser] = useState<UserState>({ plan: 'free', creditsLeft: 1 });
  const scrollRef = useRef<HTMLDivElement>(null);

  // 判断是否耗尽额度
  const isOutOfCredits = user.creditsLeft <= 0 && user.plan !== 'pro';

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
    // 双重拦截：如果没点数，直接弹窗并阻断
    if (isOutOfCredits) { 
      setShowPaywall(true); 
      return; 
    }
    
    if (!query.trim() || isLoading) return;
    
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: query, timestamp: Date.now() }]);
    setInput(''); setIsLoading(true);
    
    try {
      const result = await getMungerAdvice(query);
      setMessages(prev => [...prev, { 
        id: (Date.now()+1).toString(), 
        role: 'munger', 
        content: result.advice, 
        relatedQuestion: query,
        data: result, 
        timestamp: Date.now() 
      }]);
      
      if (user.plan !== 'pro') updateUser(user.plan, user.creditsLeft - 1);
    } catch (e) { setMessages(prev => [...prev, { id: Date.now().toString(), role: 'munger', content: "系统连接中断。", timestamp: Date.now() }]); } 
    finally { setIsLoading(false); }
  };

  const handleDownload = async (msgId: string) => {
    if (user.plan === 'free') {
      setShowPaywall(true);
      return;
    }
    setIsExporting(msgId);
    setTimeout(async () => {
      await exportToPDF(`msg-container-${msgId}`);
      setIsExporting(null);
    }, 100);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      <header className="flex-none p-4 md:p-6 bg-slate-900 border-b border-slate-800 shadow-xl z-20">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-700 rounded-full flex items-center justify-center text-xl shadow-lg border border-emerald-500/30">🏛️</div>
            <div>
               <h1 className="text-lg md:text-xl font-bold text-emerald-400">芒格智慧圣殿</h1>
               <p className="text-[10px] text-slate-500 font-mono hidden md:block">LATTICE OF MENTAL MODELS</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-slate-800 px-3 py-1 rounded-full text-xs border border-slate-700">
              {user.plan.toUpperCase()}: <strong>{user.plan === 'pro' ? '∞' : user.creditsLeft}</strong>
            </div>
            <button onClick={() => setShowExplorer(!showExplorer)} className="px-4 py-2 rounded-full text-xs font-bold border border-slate-700 text-slate-400 hover:text-emerald-400 transition-colors">探索模型</button>
          </div>
        </div>
      </header>

      <main className="flex-1 relative overflow-hidden flex flex-col">
        {showExplorer && <div className="absolute inset-0 z-30 p-8 overflow-y-auto bg-slate-950/90 backdrop-blur-sm"><ModelExplorer onSelect={(m) => { setShowExplorer(false); processQuery(`分析模型：${m.name}`); }} /></div>}
        
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-12 scroll-smooth">
          
          {messages.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center h-full min-h-[50vh] space-y-8 animate-in fade-in zoom-in duration-700 pb-20">
              <div className="w-20 h-20 bg-emerald-900/20 rounded-2xl flex items-center justify-center border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                <span className="text-4xl">📜</span>
              </div>
              <div className="text-center space-y-2">
                <h2 className="text-3xl md:text-4xl font-serif text-slate-100 tracking-wider">寻求世俗智慧</h2>
                <p className="text-xs text-slate-500 uppercase tracking-[0.2em] font-medium">The Oracle of Secular Wisdom</p>
              </div>
              
              {/* ✅ 优化点 1: 中央状态栏变更为可点击的“解锁按钮” */}
              <button 
                onClick={() => isOutOfCredits && setShowPaywall(true)}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-medium border transition-all ${
                user.creditsLeft > 0 || user.plan === 'pro' 
                  ? 'bg-emerald-900/20 border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]' 
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-emerald-900/30 hover:text-emerald-400 hover:border-emerald-500/50 cursor-pointer animate-pulse'
              }`}>
                {user.plan === 'pro' ? <><span className="text-base">💎</span> PRO 会员无限畅享</> : user.creditsLeft > 0 ? <><span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span> 剩余分析点数: {user.creditsLeft}</> : <><span className="text-base">🔒</span> 免费额度已用完 (点击充值)</>}
              </button>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-4xl w-full">
                <div id={`msg-container-${msg.id}`} className={`space-y-8 p-6 rounded-xl border ${msg.role === 'user' ? 'bg-slate-800 border-slate-700' : 'bg-slate-950 border-slate-900'}`}>
                  {msg.role === 'munger' && (
                    <div className="border-b border-slate-800 pb-6 mb-2 flex justify-between items-start gap-4">
                      <div className="space-y-2">
                        <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest flex items-center gap-2">
                          <span className="w-2 h-2 bg-emerald-600 rounded-full"></span>
                          REPORT DATE: {new Date(msg.timestamp).toLocaleDateString()}
                        </div>
                        {msg.relatedQuestion && (
                          <h2 className="text-xl md:text-2xl font-serif text-emerald-50 italic">“{msg.relatedQuestion}”</h2>
                        )}
                      </div>
                      {msg.data && (
                        <button 
                          onClick={() => handleDownload(msg.id)}
                          data-html2canvas-ignore="true"
                          className="flex-none group flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-lg shadow-lg hover:shadow-emerald-500/30 hover:-translate-y-0.5 transition-all duration-300 font-bold text-xs tracking-wider"
                        >
                          {isExporting === msg.id ? <><span className="animate-spin text-sm">⏳</span> 生成中...</> : <><span className="text-sm">⬇</span> 获取 PDF 报告</>}
                        </button>
                      )}
                    </div>
                  )}
                  <p className="text-lg serif text-slate-100 leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  {msg.data && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pt-4">
                      <section>
                        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                           <span className="w-1 h-4 bg-emerald-600"></span> 格栅模型 (Lattice Models)
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {msg.data.models.map((m, i) => <MentalModelCard key={i} model={m} />)}
                        </div>
                      </section>
                      <section className="bg-emerald-950/10 border-l-4 border-emerald-600 p-6 rounded-r-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-2 opacity-5 text-6xl group-hover:opacity-10 transition-opacity select-none">⚡</div>
                        <h3 className="flex items-center gap-2 text-emerald-500 font-bold mb-3 text-xs uppercase tracking-widest">
                          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span> Lollapalooza 综合效应
                        </h3>
                        <p className="text-slate-300 text-sm leading-relaxed italic border-t border-emerald-500/10 pt-3 mt-2">{msg.data.lollapalooza}</p>
                      </section>
                      <section className="bg-rose-950/10 border border-rose-900/30 p-6 rounded-2xl relative shadow-[0_0_20px_rgba(225,29,72,0.05)]">
                        <h3 className="flex items-center gap-2 text-rose-500 font-bold mb-4 text-xs uppercase tracking-widest">
                          <span className="text-lg">🔄</span> 逆向思维原则 (Inversion)
                        </h3>
                        <div className="space-y-4">
                          <div className="flex gap-3 items-start">
                             <div className="w-1 h-full bg-rose-500/20 rounded-full min-h-[40px]"></div>
                             <p className="text-rose-200/80 text-sm italic font-serif leading-relaxed">“反过来想，总是反过来想...”</p>
                          </div>
                          <div className="bg-slate-900/80 p-5 rounded-lg border border-rose-900/20 text-slate-300 text-sm leading-relaxed shadow-inner">{msg.data.inversion}</div>
                        </div>
                      </section>
                      <div className="text-center text-[10px] text-slate-600 pt-8 border-t border-slate-900 mt-8">Generated by MungersMind.live</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {isLoading && <div className="text-emerald-500/70 animate-pulse text-center text-sm font-mono mt-8">Thinking... 調動格栅模型中...</div>}
        </div>

        <div className="p-4 bg-slate-900 border-t border-slate-800">
          <form onSubmit={(e) => { 
            e.preventDefault(); 
            // 如果没点数，点击发送也直接弹窗
            if(isOutOfCredits) setShowPaywall(true); 
            else processQuery(input); 
          }} className="max-w-4xl mx-auto relative">
            
            {/* ✅ 优化点 2: 没点数时，输入框直接变成“点击解锁”按钮 */}
            <input 
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              onClick={() => isOutOfCredits && setShowPaywall(true)} // 点击输入框弹窗
              readOnly={isOutOfCredits} // 没点数时禁止键盘输入，防止误解
              className={`w-full bg-slate-950 border rounded-full py-4 px-6 outline-none transition-colors ${
                isOutOfCredits 
                  ? 'border-rose-900/50 text-rose-400 placeholder:text-rose-500/50 cursor-pointer hover:border-rose-500' 
                  : 'border-slate-700 text-slate-100 focus:border-emerald-500 placeholder:text-slate-600'
              }`}
              placeholder={isOutOfCredits ? "🔒 免费次数耗尽，点击订阅解锁无限智慧..." : "向查理提问：如何更好的做出决策？"} 
            />
            
            {/* ✅ 优化点 3: 发送按钮变成“锁”图标 */}
            <button type="submit" disabled={!isOutOfCredits && (!input.trim() || isLoading)} className={`absolute right-2 top-2 w-12 h-12 rounded-full text-white transition-all shadow-lg flex items-center justify-center ${
              isOutOfCredits 
                ? 'bg-rose-600 hover:bg-rose-500 hover:scale-105' 
                : 'bg-emerald-600 hover:bg-emerald-500 hover:shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed'
            }`}>
              {isOutOfCredits ? '🔒' : '⬆'}
            </button>
          </form>
        </div>
      </main>

      {showPaywall && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="max-w-4xl w-full bg-slate-900 border border-emerald-900/50 rounded-3xl p-10 text-center shadow-2xl relative overflow-hidden">
            <button onClick={() => setShowPaywall(false)} className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors">✕</button>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-900 via-emerald-500 to-emerald-900"></div>
            <h2 className="text-3xl font-serif text-emerald-50 mb-2">Invest In Your Wisdom</h2>
            <p className="text-slate-400 mb-10 text-sm">好的决策是昂贵的，但无知更昂贵。</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 text-left hover:border-emerald-500/30 transition-colors">
                <div className="text-emerald-400 font-bold mb-2 text-sm uppercase tracking-wider">Starter</div>
                <div className="text-3xl font-bold mb-1 text-white">$19<span className="text-sm font-normal text-slate-500">/mo</span></div>
                <a href={LINKS.STARTER} className="block w-full bg-slate-700 hover:bg-slate-600 text-center py-3 rounded-lg text-white font-bold transition-colors">订阅 Starter</a>
              </div>
              <div className="bg-emerald-900/10 p-6 rounded-xl border-2 border-emerald-500 text-left scale-105 shadow-2xl relative">
                <div className="absolute top-0 right-0 bg-emerald-500 text-black text-[10px] font-bold px-2 py-1 rounded-bl-lg">POPULAR</div>
                <div className="text-emerald-400 font-bold mb-2 text-sm uppercase tracking-wider">Pro</div>
                <div className="text-3xl font-bold mb-1 text-white">$39<span className="text-sm font-normal text-slate-500">/mo</span></div>
                <a href={LINKS.PRO} className="block w-full bg-emerald-600 hover:bg-emerald-500 text-center py-3 rounded-lg text-white font-bold shadow-lg shadow-emerald-500/20 transition-all">成为 Pro 会员</a>
              </div>
              <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 text-left hover:border-emerald-500/30 transition-colors">
                <div className="text-slate-400 font-bold mb-2 text-sm uppercase tracking-wider">Credits</div>
                <div className="text-3xl font-bold mb-1 text-white">$39<span className="text-sm font-normal text-slate-500">/once</span></div>
                <a href={LINKS.CREDITS} className="block w-full bg-slate-700 hover:bg-slate-600 text-center py-3 rounded-lg text-white font-bold transition-colors">购买点数</a>
              </div>
            </div>
            <button onClick={() => setShowPaywall(false)} className="mt-10 text-slate-600 hover:text-slate-400 underline text-xs transition-colors">稍后再说</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;

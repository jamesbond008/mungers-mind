import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import html2pdf from 'html2pdf.js';
import { getMungerAdvice } from './services/geminiService';

function App() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 终极 PDF 导出配置
  const exportToPDF = (elementId: string) => {
    const element = document.getElementById(elementId);
    const opt = {
      margin: 0.3,
      filename: `Munger_Consultation_${Date.now()}.pdf`,
      image: { type: 'jpeg', quality: 1 },
      html2canvas: { 
        scale: 4, // 极高清晰度
        useCORS: true,
        letterRendering: true,
        scrollY: 0
      },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="min-h-screen bg-[#0f172a] text-gray-100 p-4 font-sans">
      {/* 顶部保持简洁 */}
      <header className="max-w-4xl mx-auto flex justify-between items-center mb-8 border-b border-gray-800 pb-4">
        <h1 className="text-2xl font-black text-[#10b981] tracking-tight">MUNGER ORACLE <span className="text-white font-light text-sm ml-2">v2.0</span></h1>
      </header>

      <main className="max-w-5xl mx-auto space-y-12 mb-32">
        {messages.map((msg, idx) => (
          <div key={idx} className={msg.role === 'user' ? 'flex justify-end' : 'flex flex-col items-center'}>
            {msg.role === 'user' ? (
              <div className="bg-[#1e293b] border border-gray-700 p-4 rounded-2xl max-w-lg shadow-xl">
                {msg.content}
              </div>
            ) : (
              /* 专业报告模版：解决“难看”问题的核心 */
              <div id={msg.id} className="report-card bg-white text-gray-900 shadow-2xl w-full max-w-[850px] overflow-hidden rounded-sm">
                {/* 报告头 */}
                <div className="bg-[#10b981] p-6 text-white flex justify-between items-end">
                  <div>
                    <h2 className="text-3xl font-black uppercase leading-none">Intelligence Report</h2>
                    <p className="text-xs mt-2 opacity-80 uppercase tracking-widest font-bold">查理·芒格思维格栅深度分析</p>
                  </div>
                  <button 
                    onClick={() => exportToPDF(msg.id)}
                    className="no-print bg-white text-[#10b981] px-4 py-2 text-xs font-black rounded hover:bg-gray-100 transition-all uppercase"
                  >
                    Download PDF
                  </button>
                </div>

                {/* 报告主体内容 */}
                <div className="p-10">
                  <div className="flex justify-between text-[10px] text-gray-400 font-mono mb-8 border-b pb-2">
                    <span>SERIAL NO: {msg.id}</span>
                    <span>DATE: {new Date().toLocaleDateString()}</span>
                  </div>

                  <article className="prose prose-sm max-w-none 
                    prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tight prose-headings:border-l-4 prose-headings:border-[#10b981] prose-headings:pl-3
                    prose-table:w-full prose-table:border prose-table:border-gray-200
                    prose-th:bg-gray-50 prose-th:p-3 prose-th:text-left prose-th:uppercase prose-th:text-[10px]
                    prose-td:p-3 prose-td:border-t prose-td:border-gray-100 prose-td:align-top
                    prose-blockquote:border-l-4 prose-blockquote:border-gray-200 prose-blockquote:bg-gray-50 prose-blockquote:p-4 prose-blockquote:italic
                  ">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.content}
                    </ReactMarkdown>
                  </article>
                  
                  {/* 页脚签名 */}
                  <div className="mt-12 pt-6 border-t border-gray-100 flex justify-between items-center italic text-gray-400 text-[11px]">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-[#10b981] rounded-full flex items-center justify-center text-white not-italic font-bold text-xs">CM</div>
                      <span>“反过来想，总是反过来想。”</span>
                    </div>
                    <span>© 2026 Worldly Wisdom Lattice</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        {loading && <div className="text-center text-[#10b981] animate-pulse font-mono">Lattice Models Analyzing...</div>}
        <div ref={messagesEndRef} />
      </main>

      {/* 底部输入框 */}
      <footer className="fixed bottom-0 left-0 right-0 bg-[#0f172a]/90 backdrop-blur-md p-6 border-t border-gray-800">
        <form onSubmit={async (e) => {
          e.preventDefault();
          if (!input.trim()) return;
          const userMsg = { role: 'user', content: input };
          setMessages(p => [...p, userMsg]);
          setInput('');
          setLoading(true);
          const res = await getMungerAdvice(userMsg.content);
          setMessages(p => [...p, { id: `M-ORACLE-${Date.now()}`, role: 'assistant', content: res.content }]);
          setLoading(false);
        }} className="max-w-4xl mx-auto flex gap-4">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="描述你的现状（例如：股市被套、职业选择、资金管理...）"
            className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-6 py-4 outline-none focus:ring-2 focus:ring-[#10b981] transition-all"
          />
          <button type="submit" className="bg-[#10b981] px-10 py-4 rounded-xl font-black text-white hover:scale-105 active:scale-95 transition-all uppercase tracking-tighter">
            Consult
          </button>
        </form>
      </footer>
    </div>
  );
}

export default App;

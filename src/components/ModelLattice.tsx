
import React from 'react';
import { MENTAL_MODELS_100, ModelEntry } from '../models';

interface Props {
  onSelect: (model: ModelEntry) => void;
  filteredModels?: ModelEntry[];
  isSearchActive?: boolean;
}

const ModelLattice: React.FC<Props> = ({ onSelect, filteredModels, isSearchActive }) => {
  const categories: Record<ModelEntry['category'], { label: string; style: string }> = {
    Psychology: { label: '心理学', style: 'bg-purple-900/40 border-purple-500/50 text-purple-100' },
    Math: { label: '数学', style: 'bg-blue-900/40 border-blue-500/50 text-blue-100' },
    Physics: { label: '物理学', style: 'bg-orange-900/40 border-orange-500/50 text-orange-100' },
    Chemistry: { label: '化学', style: 'bg-yellow-900/40 border-yellow-500/50 text-yellow-100' },
    Biology: { label: '生物学', style: 'bg-green-900/40 border-green-500/50 text-green-100' },
    Engineering: { label: '工程学', style: 'bg-red-900/40 border-red-500/50 text-red-100' },
    Economics: { label: '经济学', style: 'bg-emerald-900/40 border-emerald-500/50 text-emerald-100' },
    Decision: { label: '决策学', style: 'bg-indigo-900/40 border-indigo-500/50 text-indigo-100' },
  };

  const displayModels = filteredModels || MENTAL_MODELS_100;

  return (
    <div className="bg-slate-900/98 backdrop-blur-2xl border border-slate-700 p-4 md:p-8 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4 border-b border-slate-800 pb-6">
        <div>
          <h2 className="text-3xl font-bold serif text-emerald-400 tracking-tight">世俗智慧思维格栅</h2>
          <p className="text-xs text-slate-500 uppercase tracking-[0.2em] mt-2 font-semibold">100 个普世智慧思维模型周期表</p>
        </div>
        <div className="hidden lg:flex flex-wrap gap-x-4 gap-y-2 text-[10px] uppercase tracking-wider text-slate-400 font-bold">
           {Object.keys(categories).map(catKey => {
             const cat = categories[catKey as ModelEntry['category']];
             return (
               <div key={catKey} className="flex items-center gap-1.5">
                 <span className={`w-3 h-3 rounded-sm border ${cat.style.split(' ')[1]}`}></span>
                 {cat.label}
               </div>
             );
           })}
        </div>
      </div>
      
      <div className="grid grid-cols-5 md:grid-cols-10 gap-2 md:gap-3">
        {displayModels.map((model, index) => {
          // Calculate grid position to adjust tooltip
          const colIndex = index % 10;
          const isLastRows = index >= displayModels.length - 20; // Bottom 2 rows
          const isLastCols = colIndex >= 8; // Right 2 columns
          const isFirstCols = colIndex <= 1; // Left 2 columns

          let tooltipXClass = "left-1/2 -translate-x-1/2";
          if (isLastCols) tooltipXClass = "right-0 translate-x-0";
          if (isFirstCols) tooltipXClass = "left-0 translate-x-0";

          // If it's the last few rows, show tooltip above the cell
          const tooltipYClass = isLastRows ? "bottom-full mb-3" : "top-full mt-3";
          const translateDir = isLastRows ? "group-hover:-translate-y-1 -translate-y-0" : "group-hover:translate-y-0 translate-y-2";

          return (
            <button
              key={model.id}
              onClick={() => onSelect(model)}
              className={`
                aspect-square flex flex-col p-1 md:p-1.5 border transition-all duration-300
                hover:scale-[1.15] hover:z-50 hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]
                cursor-pointer relative group rounded-sm
                ${categories[model.category].style}
              `}
            >
              <span className="text-[8px] md:text-[9px] font-mono opacity-60 self-start leading-none">{model.id}</span>
              <span className="text-base md:text-xl font-bold leading-tight flex-1 flex items-center justify-center">
                {model.symbol}
              </span>
              <span className="text-[6px] md:text-[7px] font-medium opacity-90 truncate w-full text-center">
                {model.name}
              </span>
              
              <div className={`
                absolute ${tooltipYClass} ${tooltipXClass} 
                w-48 md:w-56 p-3 md:p-4 bg-slate-950/98 border border-slate-700 rounded-lg shadow-2xl 
                opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-[100] transform ${translateDir}
                backdrop-blur-md
              `}>
                <div className="flex justify-between items-start mb-2 border-b border-slate-800 pb-1">
                  <span className="text-emerald-400 font-bold text-[10px] md:text-xs">{model.name}</span>
                  <span className="text-[8px] md:text-[10px] text-slate-500 font-mono">#{model.id}</span>
                </div>
                <p className="text-[9px] md:text-[11px] text-slate-200 leading-relaxed italic mb-2">“{model.brief}”</p>
                <p className="text-[8px] md:text-[9px] text-emerald-500/70 font-bold uppercase tracking-widest">提出者: {model.founder}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ModelLattice;

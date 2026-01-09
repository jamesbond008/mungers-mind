
import React from 'react';
import { MentalModel } from '../types';
import { MENTAL_MODELS_100 } from '../models';

interface Props {
  model: MentalModel;
}

const categoryMap: Record<string, string> = {
  Psychology: '心理学',
  Math: '数学',
  Physics: '物理学',
  Chemistry: '化学',
  Biology: '生物学',
  Engineering: '工程学',
  Economics: '经济学',
  Decision: '决策学',
};

const MentalModelCard: React.FC<Props> = ({ model }) => {
  // 尝试在格栅中查找该模型
  const knownModel = MENTAL_MODELS_100.find(m => 
    m.name === model.name || model.name.includes(m.name)
  );

  return (
    <div className="bg-slate-800/40 border border-emerald-900/20 rounded-xl p-5 hover:border-emerald-500/40 transition-all group shadow-sm">
      <div className="flex items-start gap-3 mb-3">
        {knownModel && (
          <div className="w-10 h-10 flex-none rounded border border-emerald-500/30 bg-emerald-900/20 flex flex-col items-center justify-center text-emerald-400">
            <span className="text-[8px] opacity-50 font-mono leading-none">{knownModel.id}</span>
            <span className="text-sm font-bold">{knownModel.symbol}</span>
          </div>
        )}
        <div>
          <h4 className="text-emerald-400 font-bold group-hover:text-emerald-300 transition-colors">
            {model.name}
          </h4>
          {knownModel && (
            <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">
              {categoryMap[knownModel.category] || knownModel.category}
            </span>
          )}
        </div>
      </div>
      <p className="text-slate-300 text-sm leading-relaxed border-t border-slate-700/50 pt-3">
        {model.explanation}
      </p>
    </div>
  );
};

export default MentalModelCard;

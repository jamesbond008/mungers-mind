
import React from 'react';
import { ModelEntry } from '../models';

interface Props {
  models: ModelEntry[];
  onSelect: (model: ModelEntry) => void;
}

const ModelList: React.FC<Props> = ({ models, onSelect }) => {
  const categoryStyles: Record<string, string> = {
    Psychology: 'bg-purple-500',
    Math: 'bg-blue-500',
    Physics: 'bg-orange-500',
    Chemistry: 'bg-yellow-500',
    Biology: 'bg-green-500',
    Engineering: 'bg-red-500',
    Economics: 'bg-emerald-500',
    Decision: 'bg-indigo-500',
  };

  const categoryLabels: Record<string, string> = {
    Psychology: '心理学',
    Math: '数学',
    Physics: '物理学',
    Chemistry: '化学',
    Biology: '生物学',
    Engineering: '工程学',
    Economics: '经济学',
    Decision: '决策学',
  };

  if (models.length === 0) {
    return (
      <div className="text-center py-20 text-slate-500 italic">
        没有找到匹配的思维模型。
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-900/50">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-800 bg-slate-900/80 text-[10px] uppercase tracking-widest text-slate-500 font-bold">
            <th className="px-4 py-4 w-16">ID</th>
            <th className="px-4 py-4 w-40">模型名称</th>
            <th className="px-4 py-4 w-32">学科</th>
            <th className="px-4 py-4 w-32">奠基人</th>
            <th className="px-4 py-4">核心观点 (Brief)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/50">
          {models.map((model) => (
            <tr 
              key={model.id}
              onClick={() => onSelect(model)}
              className="group cursor-pointer hover:bg-emerald-500/5 transition-colors"
            >
              <td className="px-4 py-4">
                <div className="flex items-center gap-3">
                  <div className={`w-1 h-6 rounded-full ${categoryStyles[model.category]}`}></div>
                  <span className="font-mono text-xs text-slate-500">#{model.id}</span>
                </div>
              </td>
              <td className="px-4 py-4 font-bold text-slate-200 group-hover:text-emerald-400 transition-colors">
                {model.name}
              </td>
              <td className="px-4 py-4">
                <span className="text-[10px] px-2 py-0.5 rounded border border-slate-700 text-slate-400">
                  {categoryLabels[model.category]}
                </span>
              </td>
              <td className="px-4 py-4 text-xs text-slate-400 italic">
                {model.founder}
              </td>
              <td className="px-4 py-4 text-sm text-slate-300">
                {model.brief}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ModelList;


import React, { useState, useMemo } from 'react';
import { MENTAL_MODELS_100, ModelEntry } from '../models';
import ModelLattice from './ModelLattice';
import ModelList from './ModelList';

interface Props {
  onSelect: (model: ModelEntry) => void;
}

const ModelExplorer: React.FC<Props> = ({ onSelect }) => {
  const [viewType, setViewType] = useState<'lattice' | 'list'>('lattice');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = [
    { id: 'All', label: '全部' },
    { id: 'Psychology', label: '心理学' },
    { id: 'Math', label: '数学' },
    { id: 'Physics', label: '物理学' },
    { id: 'Chemistry', label: '化学' },
    { id: 'Biology', label: '生物学' },
    { id: 'Engineering', label: '工程学' },
    { id: 'Economics', label: '经济学' },
    { id: 'Decision', label: '决策学' },
  ];

  const filteredModels = useMemo(() => {
    return MENTAL_MODELS_100.filter(model => {
      const matchesSearch = 
        model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        model.brief.toLowerCase().includes(searchQuery.toLowerCase()) ||
        model.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        model.founder.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === 'All' || model.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div className="space-y-6">
      {/* 搜索与过滤栏 */}
      <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-xl flex flex-col md:flex-row items-center gap-4">
        {/* 搜索框 */}
        <div className="relative flex-1 w-full">
          <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"></i>
          <input 
            type="text" 
            placeholder="搜索模型名称、作者或关键词..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg py-3 pl-12 pr-4 text-sm text-slate-100 focus:outline-none focus:border-emerald-500/50 transition-all"
          />
        </div>

        {/* 视图切换 */}
        <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 self-stretch">
          <button 
            onClick={() => setViewType('lattice')}
            className={`px-4 py-2 rounded flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-all ${viewType === 'lattice' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <i className="fas fa-th-large"></i>
            网格
          </button>
          <button 
            onClick={() => setViewType('list')}
            className={`px-4 py-2 rounded flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-all ${viewType === 'list' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <i className="fas fa-list"></i>
            列表
          </button>
        </div>
      </div>

      {/* 学科过滤标签 */}
      <div className="flex flex-wrap gap-2">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all ${selectedCategory === cat.id ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'}`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* 主视图区域 */}
      <div className="animate-fadeIn">
        {viewType === 'lattice' ? (
          <ModelLattice onSelect={onSelect} filteredModels={filteredModels} isSearchActive={searchQuery !== '' || selectedCategory !== 'All'} />
        ) : (
          <ModelList models={filteredModels} onSelect={onSelect} />
        )}
      </div>
    </div>
  );
};

export default ModelExplorer;

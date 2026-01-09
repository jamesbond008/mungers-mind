
import React from 'react';

interface Props {
  content: string;
}

const InversionPanel: React.FC<Props> = ({ content }) => {
  return (
    <div className="bg-red-950/20 border border-red-900/30 rounded-lg p-5 mt-6">
      <h3 className="text-red-400 font-bold mb-3 flex items-center gap-2 uppercase tracking-wider text-sm">
        <i className="fas fa-undo-alt"></i>
        逆向思维原则
      </h3>
      <p className="text-red-100 italic leading-relaxed font-serif text-lg">
        “反过来想，总是反过来想。你应该绝对避免的事：”
      </p>
      <div className="mt-3 text-red-200 leading-relaxed border-l-2 border-red-800/50 pl-4 py-1">
        {content}
      </div>
    </div>
  );
};

export default InversionPanel;

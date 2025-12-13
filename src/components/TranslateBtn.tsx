import React from 'react';
import { Languages } from 'lucide-react';

const TranslateBtn = ({ isHindi, onToggle, isDark }) => {
  return (
    <button 
      onClick={onToggle} 
      className={`p-2 rounded-full border transition-all active:scale-95 shadow-sm ${
        isDark ? 'bg-slate-800 border-slate-600 text-white hover:bg-slate-700' : 'bg-white border-gray-200 text-black hover:bg-gray-50'
      } ${isHindi ? 'ring-2 ring-green-500 text-green-600 bg-green-50' : ''}`}
    >
      <Languages size={20}/>
    </button>
  );
};

export default TranslateBtn;
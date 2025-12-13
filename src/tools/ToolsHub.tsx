import React, { useState } from 'react';
import { ArrowLeft, Pin, FileText, Percent, Calculator, RefreshCcw, CreditCard, StickyNote, Languages } from 'lucide-react';
import { convertToHindi } from '../utils/translator';
import VoiceInput from '../components/VoiceInput';
import InvoiceGenerator from './InvoiceGenerator';
import GstCalculator from './GstCalculator';
import Notepad from './Notepad';
// Import other tools similarly...

const ToolsHub = ({ onBack, t, isDark, initialTool = null, pinnedTools, onTogglePin, shopDetails }) => {
  const [activeTool, setActiveTool] = useState(initialTool);
  
  const tools = [
    { id: 'invoice', name: 'Bill Generator', icon: <FileText size={24} />, color: 'bg-indigo-100 text-indigo-600' },
    { id: 'gst', name: 'GST Pro', icon: <Percent size={24} />, color: 'bg-blue-100 text-blue-600' },
    { id: 'margin', name: 'Profit/Margin', icon: <Calculator size={24} />, color: 'bg-purple-100 text-purple-600' },
    { id: 'converter', name: 'Unit Convert', icon: <RefreshCcw size={24} />, color: 'bg-green-100 text-green-600' },
    { id: 'card', name: 'Digital Card', icon: <CreditCard size={24} />, color: 'bg-orange-100 text-orange-600' },
    { id: 'notes', name: 'Note Master', icon: <StickyNote size={24} />, color: 'bg-yellow-100 text-yellow-600' },
    { id: 'translator', name: 'Translator', icon: <Languages size={24} />, color: 'bg-pink-100 text-pink-600' },
  ];

  const commonInputClass = `w-full p-3 rounded-xl border font-bold text-lg mb-4 ${isDark ? 'bg-slate-800 border-slate-600 text-white' : 'bg-gray-50 border-gray-300 text-black'}`;
  const cardClass = `p-6 rounded-2xl shadow-lg border h-full flex flex-col ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`;

  const renderToolContent = () => {
    switch (activeTool) {
      case 'invoice': return <InvoiceGenerator onBack={onBack} shopDetails={shopDetails} cardClass={cardClass} />;
      case 'gst': return <GstCalculator cardClass={cardClass} commonInputClass={commonInputClass} />;
      case 'notes': return <Notepad cardClass={cardClass} isDark={isDark} />;
      // ... Add other cases for DigitalCard, Margin, etc.
      case 'translator': 
         return (
             <div className={cardClass}>
                 <h3 className="font-bold text-xl mb-4">Translator</h3>
                 {/* Logic for simple translator */}
             </div>
         );
      default: return null;
    }
  };

  return (
    <div className={`fixed inset-0 z-[60] overflow-y-auto ${isDark ? 'bg-slate-950 text-white' : 'bg-gray-50 text-black'}`}>
      <div className={`sticky top-0 p-4 border-b flex items-center gap-3 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
        <button onClick={() => activeTool ? setActiveTool(null) : onBack()} className="p-2 rounded-full hover:bg-gray-100/10"><ArrowLeft size={24}/></button>
        <h1 className="text-xl font-bold">{activeTool ? tools.find(i => i.id === activeTool).name : t("Business Tools")}</h1>
      </div>

      <div className="p-4 max-w-md mx-auto min-h-screen">
        {!activeTool && (
          <div className="grid grid-cols-2 gap-4 mt-4">
            {tools.map(tool => {
               const isPinned = pinnedTools.includes(tool.id);
               return (
                <div key={tool.id} onClick={() => setActiveTool(tool.id)} className={`relative p-6 rounded-2xl border flex flex-col items-center justify-center gap-3 transition-transform ${isDark ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : 'bg-white border-gray-200 hover:border-blue-400 shadow-sm'}`}>
                  <div className={`p-4 rounded-full ${tool.color}`}>{tool.icon}</div>
                  <span className="font-bold text-sm text-center mt-3">{t(tool.name)}</span>
                  <button onClick={(e) => { e.stopPropagation(); onTogglePin(tool.id); }} className={`absolute top-2 right-2 p-2 rounded-full ${isPinned ? 'text-blue-500 bg-blue-50' : 'text-gray-300 hover:text-gray-500'}`}>
                      {isPinned ? <Pin size={16} fill="currentColor"/> : <Pin size={16}/>}
                  </button>
                </div>
               );
            })}
          </div>
        )}
        {activeTool && <div className="animate-in slide-in-from-right duration-300 mt-4 h-full">{renderToolContent()}</div>}
      </div>
    </div>
  );
};
export default ToolsHub;
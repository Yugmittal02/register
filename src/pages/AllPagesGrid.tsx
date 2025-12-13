import React from 'react';
import { Grid, Search, Plus, Edit } from 'lucide-react';
import VoiceInput from '../components/VoiceInput';

const AllPagesGrid = ({ data, isDark, t, globalSearchResults, setActivePageId, setView, setManagingPage, setInput, setIsNewPageOpen, indexSearchTerm, setIndexSearchTerm, pageCounts }) => {
  return (
    <div className={`pb-24 min-h-screen p-4 ${isDark ? 'bg-slate-950' : 'bg-gray-100'}`}>
        <div className="mb-4 sticky top-0 z-10 pt-2 pb-2 backdrop-blur-sm flex justify-between items-center">
            <h1 className={`text-2xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-800'}`}><Grid/> {t("All Pages")}</h1>
        </div>
        <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
                <input className={`w-full pl-9 p-3 rounded-xl border outline-none shadow-sm ${isDark ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white border-gray-300 text-black'}`} placeholder={t("Find Page...")} value={indexSearchTerm} onChange={e => setIndexSearchTerm(e.target.value)}/>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
            </div>
            <VoiceInput onResult={setIndexSearchTerm} isDark={isDark} />
        </div>
        
        <div className="flex flex-col gap-3">
            {globalSearchResults.pages.map((page) => {
                 const totalItems = pageCounts[page.id] || 0;
                 return (
                    <div key={page.id} onClick={() => { setActivePageId(page.id); setView('page'); }} className={`relative p-4 rounded-xl border-2 shadow-sm cursor-pointer active:scale-95 transition-all flex flex-row items-center justify-between h-24 ${isDark ? 'bg-slate-800 border-slate-600 hover:border-blue-500' : 'bg-white border-gray-200 hover:border-blue-500'}`}>
                        <div className="flex items-center gap-4">
                             <div className="bg-gray-100 rounded p-2 border font-bold text-gray-500">#{page.pageNo}</div>
                             <div>
                                <h3 className={`font-bold text-xl leading-tight ${isDark ? 'text-white' : 'text-gray-800'}`}>{t(page.itemName)}</h3>
                                <span className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{totalItems} Pcs</span>
                             </div>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); setManagingPage(page); setInput({itemName: page.itemName}); }} className="p-3 text-blue-500 hover:bg-blue-50 rounded-full border border-blue-100"><Edit size={24}/></button>
                    </div>
                 )
            })}
        </div>
        <button onClick={() => setIsNewPageOpen(true)} className="fixed bottom-24 right-6 bg-blue-600 text-white w-14 h-14 rounded-full shadow-xl border-2 border-white flex items-center justify-center active:scale-95 z-20"><Plus size={28}/></button>
    </div>
  );
};
export default AllPagesGrid;
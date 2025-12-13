import React, { useState, useMemo } from 'react';
import { ArrowLeft, ArrowRight, Copy, Search, Plus, ArrowLeft as ArrowLeftIcon } from 'lucide-react';
import EntryRow from '../components/EntryRow';
import VoiceInput from '../components/VoiceInput';

const PageView = ({ data, activePageId, setActivePageId, setView, isDark, t, updateQtyBuffer, tempChanges, setEditingEntry, setIsNewEntryOpen, setIsCopyModalOpen }) => {
  const [pageSearchTerm, setPageSearchTerm] = useState('');
  const [displayLimit, setDisplayLimit] = useState(50);

  const activePage = (data.pages || []).find(p => p.id === activePageId);
  const currentPageIndex = data.pages.findIndex(p => p.id === activePageId);
  const prevPage = currentPageIndex > 0 ? data.pages[currentPageIndex - 1] : null;
  const nextPage = currentPageIndex < data.pages.length - 1 ? data.pages[currentPageIndex + 1] : null;

  const pageViewData = useMemo(() => {
      if (!activePage) return { filteredEntries: [], grandTotal: 0 };
      const pageEntries = (data.entries || []).filter(e => e.pageId === activePage.id);
      const safeSearch = pageSearchTerm ? pageSearchTerm.toLowerCase() : '';
      const filtered = pageEntries.filter(e => e.car && e.car.toLowerCase().includes(safeSearch));
      const total = pageEntries.reduce((acc, curr) => { 
          const val = tempChanges[curr.id] !== undefined ? tempChanges[curr.id] : curr.qty; 
          return acc + val; 
      }, 0);
      return { filteredEntries: filtered, grandTotal: total };
  }, [data.entries, activePage, pageSearchTerm, tempChanges]);

  if (!activePage) return <div className={`min-h-screen flex items-center justify-center ${isDark ? 'text-white' : 'text-black'}`}>Page not found...</div>;

  const visibleEntries = pageViewData.filteredEntries.slice(0, displayLimit);

  return (
    <div className={`pb-24 min-h-screen ${isDark ? 'bg-slate-950 text-white' : 'bg-white text-black'}`}>
       <div className={`sticky top-0 z-10 border-b-2 shadow-sm ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-red-200'}`}>
           <div className={`flex items-center p-3 ${isDark ? 'bg-slate-800' : 'bg-red-50'}`}>
              <button onClick={() => { setView('generalIndex'); setActivePageId(null); }} className="mr-2 p-2"><ArrowLeftIcon/></button>
              <div className="flex-1">
                 <div className="flex justify-between items-center">
                    <p className={`text-xs font-bold uppercase ${isDark ? 'text-slate-400' : 'text-red-400'}`}>{t("Page No")}: {activePage.pageNo}</p>
                    <div className="flex gap-4 items-center bg-white/10 p-1 rounded-full">
                         <button onClick={() => setActivePageId(prevPage.id)} disabled={!prevPage} className="h-12 w-12 flex items-center justify-center bg-blue-600 text-white rounded-full shadow-lg disabled:opacity-30 disabled:bg-gray-400 active:scale-95 transition-transform"><ArrowLeftIcon size={28}/></button>
                         <button onClick={() => setActivePageId(nextPage.id)} disabled={!nextPage} className="h-12 w-12 flex items-center justify-center bg-blue-600 text-white rounded-full shadow-lg disabled:opacity-30 disabled:bg-gray-400 active:scale-95 transition-transform"><ArrowRight size={28}/></button>
                    </div>
                    <button onClick={() => setIsCopyModalOpen(true)} className={`p-2 rounded-full border ${isDark ? 'bg-slate-700 text-yellow-400 border-slate-500' : 'bg-yellow-100 text-yellow-700 border-yellow-400'}`}><Copy size={20}/></button>
                 </div>
                 <h2 className="text-2xl font-black uppercase mt-1">{t(activePage.itemName)}</h2>
                 <div className="text-xs font-bold opacity-70 mt-1">{t("Total")} {t("Items")}: {pageViewData.grandTotal}</div>
              </div>
           </div>
           <div className={`p-2 flex gap-2 border-t ${isDark ? 'border-slate-700' : 'border-gray-100'}`}>
              <div className="relative flex-1">
                 <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
                 <input className={`w-full pl-8 py-2 rounded border outline-none ${isDark ? 'bg-slate-900 border-slate-600' : 'bg-gray-50 border-gray-300'}`} placeholder={t("Search Item...")} value={pageSearchTerm} onChange={e => setPageSearchTerm(e.target.value)}/>
              </div>
              <VoiceInput onResult={setPageSearchTerm} isDark={isDark}/>
           </div>
           <div className={`flex p-2 text-xs font-bold uppercase ${isDark ? 'bg-slate-700' : 'bg-red-100 text-red-900'}`}>
             <div className="w-6 pl-1">#</div>
             <div className="flex-[2]">{t("Car Name")}</div>
             <div className="flex-[1] text-center">{t("Qty")}</div>
             <div className="w-8 text-center">Ed</div> 
           </div>
       </div>
       
       <div className="flex flex-col">
         {visibleEntries.map((entry, index) => (
             <EntryRow 
                key={entry.id} 
                index={index}
                entry={entry} 
                t={t} 
                isDark={isDark} 
                onUpdateBuffer={updateQtyBuffer} 
                onEdit={setEditingEntry} 
                limit={data.settings.limit}
                tempQty={tempChanges[entry.id]}
             />
         ))}
       </div>
       
       {pageViewData.filteredEntries.length > displayLimit && (
           <button onClick={() => setDisplayLimit(prev => prev + 50)} className="w-full py-6 text-blue-500 font-bold opacity-80 border-t">
               {t("Load More")}...
           </button>
       )}

       <button onClick={() => setIsNewEntryOpen(true)} className="fixed bottom-24 right-6 bg-blue-600 text-white w-14 h-14 rounded-full shadow-lg border-2 border-white flex items-center justify-center z-20"><Plus size={28}/></button>
    </div>
  );
};
export default PageView;
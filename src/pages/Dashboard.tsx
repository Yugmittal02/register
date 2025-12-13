import React from 'react';
import { Wifi, WifiOff, Search, Edit, X } from 'lucide-react';
import VoiceInput from '../components/VoiceInput';
import TranslateBtn from '../components/TranslateBtn';

const Dashboard = ({ data, isDark, isOnline, t, indexSearchTerm, setIndexSearchTerm, globalSearchResults, setView, setActivePageId, setManagingPage, setInput, isHindi, onToggleHindi }) => {
    return (
    <div className="pb-24">
      <div className={`p-6 border-b-4 double sticky top-0 z-10 ${isDark ? 'bg-slate-800 border-slate-600' : 'bg-yellow-100 border-yellow-400'}`}>
        <div className="flex justify-between items-center mb-2">
          <h1 className={`text-2xl font-extrabold uppercase tracking-widest ${isDark ? 'text-white' : 'text-yellow-900'} underline truncate`}>
            {data.settings.shopName || "Dukan Register"}
          </h1>
          <div className="flex gap-2">
              {isOnline ? <Wifi className="text-green-600"/> : <WifiOff className="text-red-500 animate-pulse"/>}
              <TranslateBtn isHindi={isHindi} onToggle={onToggleHindi} isDark={isDark} />
          </div>
        </div>
        <div className="flex gap-2 mt-3">
            <div className="relative flex-1">
                <input className={`w-full pl-9 p-2 rounded border outline-none ${isDark ? 'bg-slate-900 border-slate-600 text-white' : 'bg-white border-yellow-500 text-black'}`} placeholder={t("Search Index...")} value={indexSearchTerm} onChange={e => setIndexSearchTerm(e.target.value)}/>
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
                {indexSearchTerm && <button onClick={() => setIndexSearchTerm('')} className="absolute right-2 top-1/2 -translate-y-1/2"><X size={16}/></button>}
            </div>
            <VoiceInput onResult={setIndexSearchTerm} isDark={isDark} />
        </div>
      </div>

      <div className={`m-2 mt-4 border-2 ${isDark ? 'border-slate-700 bg-slate-900' : 'border-black bg-white'}`}>
        <div className={`flex border-b-2 ${isDark ? 'border-slate-700 bg-slate-800 text-white' : 'border-black bg-gray-100 text-black'} p-2`}>
          <div className="w-12 font-black text-center border-r border-gray-400">#</div>
          <div className="flex-1 font-black pl-3 border-r border-gray-400">{t("Particulars")}</div>
          <div className="w-16 font-black text-center border-r border-gray-400">{t("Page")}</div>
          <div className="w-12 font-black text-center">Edit</div>
        </div>
        <div className="min-h-[20vh]">
          {globalSearchResults.pages.map((page) => (
            <div key={page.id} onClick={() => { setActivePageId(page.id); setView('page'); }} className={`flex border-b border-gray-300 cursor-pointer hover:bg-blue-50 transition-colors h-14 items-center ${isDark ? 'text-white hover:bg-slate-800' : 'text-black'}`}>
              <div className="w-12 text-center font-bold text-red-600 border-r border-gray-300 h-full flex items-center justify-center text-sm">{page.pageNo}</div>
              <div className="flex-1 pl-3 font-semibold text-lg border-r border-gray-300 h-full flex items-center truncate">{t(page.itemName)}</div>
              <div className="w-16 text-center font-bold text-blue-700 h-full flex items-center justify-center underline border-r border-gray-300">{page.pageNo}</div>
              <div className="w-12 flex items-center justify-center h-full">
                  {/* Stopped Propagation here so clicking edit doesn't open the page */}
                  <button onClick={(e) => { e.stopPropagation(); setManagingPage(page); setInput({itemName: page.itemName}); }} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-100 rounded-full active:scale-95">
                      <Edit size={18}/>
                  </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
    );
};
export default Dashboard;
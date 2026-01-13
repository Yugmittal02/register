import React, { useMemo } from 'react';
import {
    ArrowLeft, ArrowRight as ArrowRightIcon, ArrowLeft as ArrowLeftIcon,
    Copy, Search, Plus
} from 'lucide-react';
import DraggableFAB from '../DraggableFAB';
import { TranslateBtn } from './TranslateBtn';
import EntryRow from './EntryRow';
import VoiceInput from './VoiceInput';
// App.tsx has `import VoiceInput from './components/VoiceInput';`
// So it is default export.

interface ItemsPageProps {
    activePage: any;
    activePageId: string | null;
    data: any;
    isDark: boolean;
    t: (text: string) => string;
    isHindi: boolean;
    setIsHindi: (val: boolean) => void;
    setActivePageId: (id: string | null) => void;
    setView: (view: string) => void;
    pageSearchTerm: string;
    setPageSearchTerm: (term: string) => void;
    displayLimit: number;
    setDisplayLimit: (updater: (prev: number) => number) => void;
    setIsNewEntryOpen: (val: boolean) => void;
    setEditingEntry: (entry: any) => void;
    setIsCopyModalOpen: (val: boolean) => void;
    updateQtyBuffer: (id: number, delta: number, current?: number) => void;
    tempChanges: Record<number, number>;
}

export const ItemsPage: React.FC<ItemsPageProps> = ({
    activePage, activePageId, data, isDark, t, isHindi, setIsHindi,
    setActivePageId, setView, pageSearchTerm, setPageSearchTerm,
    displayLimit, setDisplayLimit, setIsNewEntryOpen, setEditingEntry,
    setIsCopyModalOpen, updateQtyBuffer, tempChanges
}) => {

    const pageViewData = useMemo(() => {
        if (!activePage) return { filteredEntries: [], grandTotal: 0 };

        let pageEntries = (data.entries || []).filter((e: any) => e.pageId === activePageId);

        // Sort logic? App.tsx didn't seem to have specific sort in renderPage, it rendered filteredEntries.
        // Wait, let's check if App.tsx had internal sort logic for pageViewData.
        // Yes, line 2262: const filtered = pageEntries.filter(...)
        // Implementation Plan said: "pageViewData calculation (filtering and totaling entries)".
        // I need to implement filtering here.

        const filtered = pageEntries.filter((e: any) => {
            if (!pageSearchTerm) return true;
            return (e.car || '').toLowerCase().includes(pageSearchTerm.toLowerCase());
        });

        const total = pageEntries.reduce((acc: number, curr: any) => {
            const val = tempChanges[curr.id] !== undefined ? tempChanges[curr.id] : curr.qty;
            return acc + val;
        }, 0);

        return { filteredEntries: filtered, grandTotal: total };
    }, [data.entries, activePage, activePageId, pageSearchTerm, tempChanges]);

    if (!activePage) return <div className={`min-h-screen flex items-center justify-center ${isDark ? 'text-white' : 'text-black'}`}>Page not found or Loading...</div>;

    const { filteredEntries, grandTotal } = pageViewData;
    const currentPageIndex = data.pages.findIndex((p: any) => p.id === activePageId);
    const prevPage = currentPageIndex > 0 ? data.pages[currentPageIndex - 1] : null;
    const nextPage = currentPageIndex < data.pages.length - 1 ? data.pages[currentPageIndex + 1] : null;

    const visibleEntries = pageSearchTerm ? filteredEntries : filteredEntries.slice(0, displayLimit);

    // Note: VoiceInput import needs to be correct. 
    // ToolsHub imported it as `import VoiceInput from './VoiceInput';`
    // App.tsx imported it as `import { VoiceInput }` ?? No.
    // App.tsx line 1108: `VoiceInput({ onResult, isDark, lang = 'en-IN' })` was defined IN App.tsx before extraction.
    // Wait, I extracted it to `src/components/VoiceInput.tsx`.
    // `src/components/VoiceInput.tsx` is likely default export based on my previous check of Imports.
    // I will check imports in App.tsx to be sure. It imports `VoiceInput` presumably.

    return (
        <div className={`pb-24 min-h-screen ${isDark ? 'bg-slate-950 text-white' : 'bg-white text-black'}`}>
            <div className={`sticky top-0 z-10 border-b-2 shadow-sm ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-red-200'}`}>
                <div className={`flex items-center p-3 ${isDark ? 'bg-slate-800' : 'bg-red-50'}`}>
                    <button onClick={() => { setView('generalIndex'); setActivePageId(null); }} className="mr-2 p-2"><ArrowLeft /></button>
                    <div className="flex-1">
                        <div className="flex justify-between items-center">
                            <p className={`text-xs font-bold uppercase ${isDark ? 'text-slate-400' : 'text-red-400'}`}>{t("Page No")}: {activePage.pageNo}</p>

                            <div className="flex gap-4 items-center bg-white/10 p-1 rounded-full">
                                <button onClick={() => setActivePageId(prevPage ? prevPage.id : null)} disabled={!prevPage} className="h-12 w-12 flex items-center justify-center bg-blue-600 text-white rounded-full shadow-lg disabled:opacity-30 disabled:bg-gray-400 active:scale-95 transition-transform"><ArrowLeftIcon size={28} /></button>
                                <button onClick={() => setActivePageId(nextPage ? nextPage.id : null)} disabled={!nextPage} className="h-12 w-12 flex items-center justify-center bg-blue-600 text-white rounded-full shadow-lg disabled:opacity-30 disabled:bg-gray-400 active:scale-95 transition-transform"><ArrowRightIcon size={28} /></button>
                            </div>

                            <div className="flex gap-2 ml-2">
                                <button onClick={() => setIsCopyModalOpen(true)} className={`p-2 rounded-full border ${isDark ? 'bg-slate-700 text-yellow-400 border-slate-500' : 'bg-yellow-100 text-yellow-700 border-yellow-400'}`}><Copy size={20} /></button>
                                <TranslateBtn isHindi={isHindi} setIsHindi={setIsHindi} isDark={isDark} />
                            </div>
                        </div>
                        <h2 className="text-2xl font-black uppercase mt-1">{t(activePage.itemName)}</h2>
                        <div className="text-xs font-bold opacity-70 mt-1">{t("Total")} {t("Items")}: {grandTotal}</div>
                    </div>
                </div>
                <div className={`p-2 flex gap-2 border-t ${isDark ? 'border-slate-700' : 'border-gray-100'}`}>
                    <div className="relative flex-1">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input className={`w-full pl-8 py-2 rounded border outline-none ${isDark ? 'bg-slate-900 border-slate-600' : 'bg-gray-50 border-gray-300'}`} placeholder={t("Search Item...")} value={pageSearchTerm} onChange={e => setPageSearchTerm(e.target.value)} />
                    </div>
                    <VoiceInput onResult={setPageSearchTerm} isDark={isDark} lang={isHindi ? 'hi-IN' : 'en-IN'} />
                </div>
                <div className={`flex p-2 text-xs font-bold uppercase ${isDark ? 'bg-slate-700' : 'bg-red-100 text-red-900'}`}>
                    <div className="w-6 pl-1">#</div>
                    <div className="flex-[2]">{t("Car Name")}</div>
                    <div className="flex-[1] text-center">{t("Qty")}</div>
                    <div className="w-8 text-center">Ed</div>
                </div>
            </div>

            <div className="flex flex-col">
                {visibleEntries.map((entry: any, index: number) => (
                    <EntryRow
                        key={entry.id}
                        index={index}
                        entry={entry}
                        t={t}
                        isDark={isDark}
                        onUpdateBuffer={(id: any, delta: any) => updateQtyBuffer(Number(id), delta)}
                        onEdit={setEditingEntry}
                        limit={data.settings.limit}
                        tempQty={tempChanges[entry.id]}
                    />
                ))}
            </div>

            {filteredEntries.length > displayLimit && (
                <button onClick={() => setDisplayLimit((prev: number) => prev + 50)} className="w-full py-6 text-blue-500 font-bold opacity-80 border-t">
                    {t("Load More")}... ({t("Showing")} {visibleEntries.length} {t("of")} {filteredEntries.length})
                </button>
            )}

            <DraggableFAB id="fab-add" onClick={() => setIsNewEntryOpen(true)} className="fixed z-20" initialBottom={96} initialRight={24}>
                <div className="bg-blue-600 text-white w-14 h-14 rounded-full shadow-lg border-2 border-white flex items-center justify-center">
                    <Plus size={28} />
                </div>
            </DraggableFAB>
        </div>
    );
};

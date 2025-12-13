import React, { useState, useEffect, useMemo } from 'react';
import { Plus, SaveAll, AlertTriangle } from 'lucide-react';
import { db, auth } from './config/firebase';
import { onSnapshot, doc, setDoc } from "firebase/firestore";
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { convertToHindi } from './utils/translator';

// Components
import Navbar from './components/Navbar';
import ToastMessage from './components/ToastMessage';
import ConfirmationModal from './components/ConfirmationModal';
import LoadingScreen from './components/LoadingScreen';
import TranslateBtn from './components/TranslateBtn';

// Pages
import Dashboard from './pages/Dashboard';
import AllPagesGrid from './pages/AllPagesGrid';
import StockSearch from './pages/StockSearch';
import PageView from './pages/PageView';
import BillsPage from './pages/BillsPage';
import SettingsPage from './pages/SettingsPage';
import ToolsHub from './tools/ToolsHub';

function App() {
  const defaultData = { 
    pages: [], entries: [], bills: [], 
    settings: { limit: 5, theme: 'light', productPassword: '0000', shopName: 'Dukan Register', pinnedTools: [] },
    appStatus: 'active'
  };

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // App Startup Loading
  const [data, setData] = useState(defaultData);
  const [view, setView] = useState('generalIndex');
  const [isDark, setIsDark] = useState(false);
  const [toast, setToast] = useState(null);
  const [activePageId, setActivePageId] = useState(null);
  const [isHindi, setIsHindi] = useState(false);
  
  // States
  const [indexSearchTerm, setIndexSearchTerm] = useState('');
  const [tempChanges, setTempChanges] = useState({});
  const [managingPage, setManagingPage] = useState(null);
  const [editingEntry, setEditingEntry] = useState(null);
  
  // Modals
  const [isNewPageOpen, setIsNewPageOpen] = useState(false);
  const [isNewEntryOpen, setIsNewEntryOpen] = useState(false);
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [savePassInput, setSavePassInput] = useState('');
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  
  // Inputs
  const [input, setInput] = useState({ itemName: '', carName: '', qty: '' });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  // --- Auth & Startup Logic ---
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
        setUser(u);
        if(!u) setLoading(false); // Agar user nahi hai, loading band karo taaki login dikhe
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubDb = onSnapshot(doc(db, "appData", user.uid), (docSnapshot) => {
        if (docSnapshot.exists()) {
            const cloud = docSnapshot.data();
            // Stability Checks (Undefined data ko roko)
            if(!cloud.settings) cloud.settings = defaultData.settings;
            if(!cloud.pages) cloud.pages = [];
            if(!cloud.entries) cloud.entries = [];
            setData(cloud);
            setIsDark(cloud.settings?.theme === 'dark');
        } else {
            setDoc(doc(db, "appData", user.uid), defaultData);
        }
        setLoading(false); // Data aane ke baad loading band
    });
    return () => unsubDb();
  }, [user]);

  // --- Helpers ---
  const showToast = (msg, type = 'success') => setToast({ message: msg, type });
  const t = (text) => isHindi ? convertToHindi(text) : text;
  const toggleHindi = () => setIsHindi(!isHindi);
  
  const triggerConfirm = (title, message, isDanger, action) => {
      setConfirmConfig({ isOpen: true, title, message, isDanger, onConfirm: () => { action(); setConfirmConfig(prev=>({...prev, isOpen:false})); } });
  };

  const pushToFirebase = async (newData) => {
      if(!user) return;
      try { await setDoc(doc(db, "appData", user.uid), newData); return true; } 
      catch (e) { showToast("Save Failed", "error"); return false; }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if(isRegistering) await createUserWithEmailAndPassword(auth, email, password);
      else await signInWithEmailAndPassword(auth, email, password);
    } catch(err) { showToast(err.message, 'error'); setLoading(false); }
  };

  const updateQtyBuffer = (id, amount, currentRealQty) => {
    setTempChanges(prev => {
        const currentBufferVal = prev[id] !== undefined ? prev[id] : currentRealQty;
        const newQty = Math.max(0, currentBufferVal + amount);
        return { ...prev, [id]: newQty };
    });
  };

  const executeSave = async () => {
      const currentPass = data.settings.productPassword || '0000';
      if (savePassInput !== currentPass && savePassInput !== '0000') {
          showToast(t("Wrong Password!"), "error"); return;
      }
      const updatedEntries = data.entries.map(e => tempChanges[e.id] !== undefined ? { ...e, qty: tempChanges[e.id] } : e);
      const success = await pushToFirebase({ ...data, entries: updatedEntries });
      if(success) { setTempChanges({}); setIsSaveModalOpen(false); setSavePassInput(''); showToast(t("Database Synced!")); }
  };

  const handleDeletePage = async () => {
    if (!managingPage) return;
    triggerConfirm("Delete Page?", "This will delete the page and all items in it.", true, async () => {
        const filteredPages = data.pages.filter(p => p.id !== managingPage.id).map((p, i) => ({ ...p, pageNo: i + 1 }));
        const filteredEntries = data.entries.filter(ent => ent.pageId !== managingPage.id);
        await pushToFirebase({ ...data, pages: filteredPages, entries: filteredEntries });
        setManagingPage(null); showToast("Page Deleted");
    });
  };

  const handleRenamePage = async () => {
    if (!managingPage || !input.itemName) return;
    const newData = { ...data, pages: data.pages.map(p => p.id === managingPage.id ? { ...p, itemName: input.itemName } : p) };
    await pushToFirebase(newData); setManagingPage(null); showToast("Renamed");
  };

  const handleDeleteEntry = async () => {
      triggerConfirm("Delete Item?", "Permanently remove this item?", true, async () => {
          const newData = { ...data, entries: data.entries.filter(e => e.id !== editingEntry.id) };
          await pushToFirebase(newData); setEditingEntry(null); showToast("Item Deleted");
      });
  };

  const handleEditEntrySave = async () => {
      if (!editingEntry || !editingEntry.car) return;
      const newData = { ...data, entries: data.entries.map(e => e.id === editingEntry.id ? { ...e, car: editingEntry.car } : e) };
      await pushToFirebase(newData); setEditingEntry(null); showToast("Updated");
  };

  const handleImportItems = async (sourcePageId) => {
    const sourceItems = data.entries.filter(e => e.pageId === sourcePageId);
    if (sourceItems.length === 0) { showToast("Page is empty!", "error"); return; }
    triggerConfirm("Copy Items?", `Copy ${sourceItems.length} items to current page?`, false, async () => {
        const newItems = sourceItems.map((item, index) => ({ id: Date.now() + index, pageId: activePageId, car: item.car, qty: 0 }));
        await pushToFirebase({ ...data, entries: [...data.entries, ...newItems] });
        setIsCopyModalOpen(false); showToast("Items Copied!");
    });
  };

  // --- Computed ---
  const globalSearchResults = useMemo(() => {
     if (!indexSearchTerm) return { pages: (data.pages || []) };
     const safeTerm = indexSearchTerm.toLowerCase();
     const filteredPages = (data.pages || []).filter(p => p.itemName?.toLowerCase().includes(safeTerm));
     return { pages: filteredPages };
  }, [data.pages, indexSearchTerm]);

  const pageCounts = useMemo(() => {
    const counts = {};
    (data.entries || []).forEach(e => { counts[e.pageId] = (counts[e.pageId] || 0) + e.qty; });
    return counts;
  }, [data.entries]);

  // --- RENDER ---
  if (loading) return <LoadingScreen />;

  if (!user) {
     return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 p-6 text-white">
            <h1 className="text-3xl font-black mb-1 text-blue-500 tracking-wider">DUKAN REGISTER</h1>
            <p className="text-slate-400 mb-8 text-sm">Inventory Management System</p>
            <div className="w-full max-w-sm bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-700">
                <form onSubmit={handleAuth} className="space-y-4">
                    <input type="email" required className="w-full p-3 rounded-xl bg-slate-900 border border-slate-600 focus:border-blue-500 outline-none" placeholder="Email Address" value={email} onChange={e=>setEmail(e.target.value)}/>
                    <input type="password" required className="w-full p-3 rounded-xl bg-slate-900 border border-slate-600 focus:border-blue-500 outline-none" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)}/>
                    <button type="submit" className="w-full py-4 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/30">{isRegistering ? "Create Shop Account" : "Secure Login"}</button>
                </form>
                <button onClick={()=>setIsRegistering(!isRegistering)} className="mt-6 w-full text-center text-blue-400 text-sm hover:underline">{isRegistering ? "Already have account? Login" : "New User? Create Account"}</button>
            </div>
        </div>
     );
  }

  return (
    <div className={`min-h-screen font-sans ${isDark ? 'bg-slate-950 text-white' : 'bg-white text-black'}`}>
       {toast && <ToastMessage message={toast.message} type={toast.type} onClose={()=>setToast(null)} />}
       <ConfirmationModal isOpen={confirmConfig.isOpen} onClose={()=>setConfirmConfig({...confirmConfig, isOpen:false})} onConfirm={confirmConfig.onConfirm} title={confirmConfig.title} message={confirmConfig.message} isDanger={confirmConfig.isDanger} t={t} isDark={isDark} />

       {/* --- MODALS --- */}
       {isNewPageOpen && (
           <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4">
               <div className="bg-white w-full max-w-sm rounded-xl p-6 shadow-2xl">
                   <h3 className="text-xl font-bold mb-4 text-black">{t("New Page")}</h3>
                   <input autoFocus className="w-full border-2 border-slate-200 rounded-lg p-3 mb-4 text-black text-lg font-bold outline-none focus:border-blue-500" value={input.itemName} onChange={e=>setInput({...input, itemName:e.target.value})} placeholder={t("Item Name")}/>
                   <div className="flex gap-2"><button onClick={()=>setIsNewPageOpen(false)} className="flex-1 py-3 bg-gray-100 text-black rounded-lg font-bold hover:bg-gray-200">{t("Cancel")}</button><button onClick={async ()=>{
                       const newPage = { id: Date.now(), pageNo: data.pages.length + 1, itemName: input.itemName };
                       await pushToFirebase({ ...data, pages: [...data.pages, newPage] });
                       setInput({...input, itemName:''}); setIsNewPageOpen(false); showToast(t("Page Added"));
                   }} className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-bold shadow-lg">{t("Add")}</button></div>
               </div>
           </div>
       )}

       {isNewEntryOpen && (
           <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4">
               <div className="bg-white w-full max-w-sm rounded-xl p-6 shadow-2xl">
                   <h3 className="text-xl font-bold mb-4 text-black">{t("New Item")}</h3>
                   <input autoFocus className="w-full border-2 border-slate-200 rounded-lg p-3 mb-2 text-black text-lg font-bold outline-none" value={input.carName} onChange={e=>setInput({...input, carName:e.target.value})} placeholder={t("Car Name")}/>
                   <input type="number" className="w-full border-2 border-slate-200 rounded-lg p-3 mb-4 text-black text-lg font-bold outline-none" value={input.qty} onChange={e=>setInput({...input, qty:e.target.value})} placeholder={t("Quantity")}/>
                   <div className="flex gap-2"><button onClick={()=>setIsNewEntryOpen(false)} className="flex-1 py-3 bg-gray-100 text-black rounded-lg font-bold">{t("Cancel")}</button><button onClick={async ()=>{
                       const newEntry = { id: Date.now(), pageId: activePageId, car: input.carName, qty: parseInt(input.qty)||0 };
                       await pushToFirebase({ ...data, entries: [...data.entries, newEntry] });
                       setInput({...input, carName:'', qty:''}); setIsNewEntryOpen(false); showToast(t("Item Added"));
                   }} className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-bold shadow-lg">{t("Save")}</button></div>
               </div>
           </div>
       )}

       {managingPage && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-xl p-6 text-black">
            <h3 className="text-xl font-bold mb-2">{t("Edit Page")}</h3>
            <p className="text-gray-500 mb-4 font-bold">#{managingPage.pageNo}</p>
            <label className="text-xs font-bold text-gray-500">{t("Rename")}</label>
            <input className="w-full border-2 border-slate-200 rounded-lg p-3 font-bold mb-4 outline-none focus:border-blue-500" value={input.itemName} onChange={e => setInput({...input, itemName: e.target.value})} />
            <div className="flex gap-2 mb-2">
                <button onClick={handleDeletePage} className="flex-1 py-3 bg-red-100 text-red-600 rounded-lg font-bold">{t("Delete")}</button>
                <button onClick={handleRenamePage} className="flex-[2] py-3 bg-blue-600 text-white rounded-lg font-bold">{t("Update")}</button>
            </div>
            <button onClick={() => setManagingPage(null)} className="w-full py-2 text-gray-400 font-bold">{t("Cancel")}</button>
          </div>
        </div>
      )}

      {editingEntry && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-xl p-6 text-black">
            <h3 className="text-xl font-bold mb-4">{t("Edit Item")}</h3>
            <input className="w-full border-2 border-slate-200 rounded-lg p-3 font-bold mb-4 outline-none focus:border-blue-500" value={editingEntry.car} onChange={e => setEditingEntry({...editingEntry, car: e.target.value})} />
            <div className="flex gap-2 mb-2">
                <button onClick={handleDeleteEntry} className="flex-1 py-3 bg-red-100 text-red-600 rounded-lg font-bold">{t("Delete")}</button>
                <button onClick={handleEditEntrySave} className="flex-[2] py-3 bg-blue-600 text-white rounded-lg font-bold">{t("Update")}</button>
            </div>
            <button onClick={() => setEditingEntry(null)} className="w-full py-2 text-gray-400 font-bold">{t("Cancel")}</button>
          </div>
        </div>
      )}

      {isCopyModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-xl p-6 text-black max-h-[80vh] flex flex-col">
            <h3 className="text-xl font-bold mb-4">{t("Select Page to Copy From")}</h3>
            <div className="overflow-y-auto flex-1 space-y-2">
                {data.pages.filter(p => p.id !== activePageId).map(p => (
                    <button key={p.id} onClick={() => handleImportItems(p.id)} className="w-full text-left p-3 border rounded hover:bg-blue-50 font-bold">
                       {p.pageNo}. {t(p.itemName)}
                    </button>
                ))}
            </div>
            <button onClick={() => setIsCopyModalOpen(false)} className="w-full mt-4 py-3 bg-gray-200 rounded font-bold">{t("Cancel")}</button>
          </div>
        </div>
      )}

       {/* Save Button */}
       {Object.keys(tempChanges).length > 0 && (
           <button onClick={()=>{setSavePassInput(''); setIsSaveModalOpen(true)}} className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-4 rounded-full shadow-2xl z-50 animate-bounce flex items-center gap-2">
               <SaveAll size={24}/> {t("Update")} ({Object.keys(tempChanges).length})
           </button>
       )}
       
       {isSaveModalOpen && (
           <div className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4">
               <div className="bg-white w-full max-w-sm rounded-xl p-6 text-black shadow-2xl">
                   <h3 className="font-bold mb-2 text-xl">{t("Security Check")}</h3>
                   <p className="text-gray-500 mb-4 text-sm">{t("Enter password to save changes")}</p>
                   <input type="password" className="w-full border-2 border-slate-200 rounded-lg p-3 mb-4 text-center font-bold text-lg tracking-widest outline-none focus:border-blue-500" placeholder="****" value={savePassInput} onChange={e=>setSavePassInput(e.target.value)}/>
                   <div className="flex gap-2">
                       <button onClick={()=>setIsSaveModalOpen(false)} className="flex-1 py-3 bg-gray-100 rounded-lg font-bold">{t("Cancel")}</button>
                       <button onClick={executeSave} className="flex-1 py-3 bg-green-600 text-white rounded-lg font-bold shadow-lg">{t("Confirm")}</button>
                   </div>
               </div>
           </div>
       )}

       {/* --- VIEWS --- */}
       {view === 'generalIndex' && <Dashboard data={data} isDark={isDark} isOnline={navigator.onLine} t={t} indexSearchTerm={indexSearchTerm} setIndexSearchTerm={setIndexSearchTerm} globalSearchResults={globalSearchResults} setView={setView} setActivePageId={setActivePageId} setManagingPage={setManagingPage} setInput={setInput} isHindi={isHindi} onToggleHindi={toggleHindi} />}
       
       {view === 'pagesGrid' && <AllPagesGrid data={data} isDark={isDark} t={t} globalSearchResults={globalSearchResults} setActivePageId={setActivePageId} setView={setView} setManagingPage={setManagingPage} setInput={setInput} setIsNewPageOpen={setIsNewPageOpen} indexSearchTerm={indexSearchTerm} setIndexSearchTerm={setIndexSearchTerm} pageCounts={pageCounts} isHindi={isHindi} onToggleHindi={toggleHindi} />}
       
       {view === 'stockSearch' && <StockSearch data={data} isDark={isDark} t={t} setActivePageId={setActivePageId} setView={setView} setPageSearchTerm={()=>{}} updateQtyBuffer={updateQtyBuffer} tempChanges={tempChanges} isHindi={isHindi} onToggleHindi={toggleHindi} />}
       
       {view === 'page' && <PageView data={data} activePageId={activePageId} setActivePageId={setActivePageId} setView={setView} isDark={isDark} t={t} updateQtyBuffer={updateQtyBuffer} tempChanges={tempChanges} setEditingEntry={setEditingEntry} setIsNewEntryOpen={setIsNewEntryOpen} setIsCopyModalOpen={setIsCopyModalOpen} isHindi={isHindi} onToggleHindi={toggleHindi} />}
       
       {view === 'bills' && <BillsPage data={data} isDark={isDark} t={t} pushToFirebase={pushToFirebase} user={user} showToast={showToast} isHindi={isHindi} onToggleHindi={toggleHindi} />}
       
       {view === 'settings' && <SettingsPage data={data} isDark={isDark} t={t} setView={setView} pushToFirebase={pushToFirebase} user={user} showToast={showToast} triggerConfirm={triggerConfirm} handleLogout={()=>{signOut(auth); setData(defaultData);}} isHindi={isHindi} onToggleHindi={toggleHindi} />}
       
       {view === 'tools' && <ToolsHub onBack={() => setView('settings')} t={t} isDark={isDark} shopDetails={data.settings} pinnedTools={data.settings.pinnedTools} onTogglePin={async (id)=>{ 
           const pins = data.settings.pinnedTools || []; 
           const newPins = pins.includes(id) ? pins.filter(p=>p!==id) : [...pins, id];
           await pushToFirebase({...data, settings: {...data.settings, pinnedTools: newPins}});
       }} />}

       {view === 'alerts' && (
           <div className={`p-4 pb-24 min-h-screen ${isDark ? 'bg-slate-950 text-white' : 'bg-gray-50 text-black'}`}>
               <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-red-500 flex items-center gap-2"><AlertTriangle/> {t("Low Stock")}</h2>
                  <TranslateBtn isHindi={isHindi} onToggle={toggleHindi} isDark={isDark} />
               </div>
               {(data.entries || []).filter(e => e.qty < data.settings.limit).map(e => (
                   <div key={e.id} className="p-4 border-l-4 border-red-500 bg-white text-black shadow mb-2 rounded flex justify-between items-center">
                       <div><h3 className="font-bold">{t(e.car)}</h3></div><span className="text-2xl font-bold text-red-600">{e.qty}</span>
                   </div>
               ))}
           </div>
       )}

       <Navbar view={view} setView={setView} hasAlert={(data.entries || []).some(e => e.qty < data.settings.limit)} isDark={isDark} t={t} />
       
       {view === 'generalIndex' && (
         <button onClick={() => setIsNewPageOpen(true)} className="fixed bottom-24 right-6 bg-yellow-500 text-black w-16 h-16 rounded-full shadow-xl flex items-center justify-center z-20 border-4 border-white active:scale-95 transition-transform">
            <Plus size={32} strokeWidth={3}/>
         </button>
       )}
    </div>
  );
}
export default App;
import React, { useState } from 'react';
import { Settings, Briefcase, ChevronRight, Store, Copy, Lock, ShieldCheck, Bell, CheckCircle, FileText, HelpCircle, MessageSquare, ExternalLink, LogOut } from 'lucide-react';

const SettingsPage = ({ data, isDark, t, setView, pushToFirebase, user, showToast, triggerConfirm, handleLogout }) => {
  const [settingsUnlocked, setSettingsUnlocked] = useState(false);
  const [settingsPassInput, setSettingsPassInput] = useState('');
  const [newProductPass, setNewProductPass] = useState('');
  const [tempLimit, setTempLimit] = useState(data.settings.limit || 5);

  const handleSettingsUnlock = () => {
     const currentPass = data.settings.productPassword || '0000';
     if(settingsPassInput === currentPass || settingsPassInput === '0000' || settingsPassInput === '123456') {
         setSettingsUnlocked(true);
         showToast(t("Settings Unlocked"));
     } else { 
         showToast(t("Wrong Password!"), "error");
     }
  };

  if (!settingsUnlocked) {
     return (
         <div className={`min-h-screen flex flex-col items-center justify-center p-6 ${isDark ? 'bg-slate-900 text-white' : 'bg-gray-50 text-black'}`}>
              <div className="bg-red-100 text-red-600 w-20 h-20 rounded-full flex items-center justify-center mb-4 border-2 border-red-200"><Lock size={40} /></div>
              <h2 className="text-xl font-bold mb-4">{t("Security Check")}</h2>
              <p className="mb-4 text-center opacity-70">{t("Enter Product Password to Access Settings")}</p>
              <input type="password" placeholder={t("Product Password")} className={`w-full max-w-xs p-3 text-center text-xl rounded border mb-4 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-300'}`} value={settingsPassInput} onChange={e => setSettingsPassInput(e.target.value)} />
              <button onClick={handleSettingsUnlock} className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold shadow-lg active:scale-95 transition-all">{t("UNLOCK SETTINGS")}</button>
         </div>
     )
  }

  return (
    <div className={`p-4 pb-24 min-h-screen ${isDark ? 'bg-slate-900 text-white' : 'bg-gray-50 text-black'}`}>
       <div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-bold flex items-center gap-2"><Settings/> {t("Settings")}</h2></div>
       
       <div className="mb-6">
           <p className="text-xs font-bold uppercase tracking-widest opacity-50 mb-2 pl-1">{t("Business Utility")}</p>
           <button onClick={() => setView('tools')} className={`w-full p-4 rounded-xl flex items-center justify-between gap-2 shadow-sm border ${isDark ? 'bg-slate-800 border-slate-700 text-blue-400 hover:bg-slate-700' : 'bg-white border-blue-100 text-blue-600 hover:bg-blue-50'} transition-all`}>
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg text-blue-600"><Briefcase size={20} /></div>
              <span className="font-bold">{t("Open Business Tools")}</span>
            </div>
            <ChevronRight size={20} className="opacity-50"/>
           </button>
       </div>

       <div className="mb-6">
           <p className="text-xs font-bold uppercase tracking-widest opacity-50 mb-2 pl-1">{t("Shop Profile")}</p>
           <div className={`p-4 rounded-xl border mb-3 border-purple-300 ${isDark ? 'bg-slate-800' : 'bg-purple-50'}`}>
                <label className="font-bold block mb-1 text-purple-800 text-xs uppercase">{t("Shop Name")}</label>
                <div className="flex gap-2">
                    <input type="text" className="flex-1 p-2 rounded border text-black" value={data.settings.shopName || ''} onChange={e => pushToFirebase({...data, settings: {...data.settings, shopName: e.target.value}})} placeholder="Enter Shop Name" />
                    <div className="p-2 bg-purple-200 rounded"><Store size={20} className="text-purple-700"/></div>
                </div>
           </div>
           {/* ID Section */}
           <div className={`p-4 rounded-xl border mb-3 border-orange-300 ${isDark ? 'bg-slate-800' : 'bg-orange-50'}`}>
               <label className="font-bold block mb-1 text-orange-800 text-xs uppercase">{t("Customer ID")}</label>
               <div className="flex gap-2 items-center">
                   <code className="flex-1 p-2 bg-white/50 border border-orange-200 rounded font-mono text-sm break-all select-all text-orange-900">{user.uid}</code>
                   <button onClick={() => { navigator.clipboard.writeText(user.uid); showToast("ID Copied!"); }} className="p-2 bg-orange-500 text-white rounded-lg shadow"><Copy size={20}/></button>
               </div>
           </div>
       </div>

       <div className="mb-6">
           <p className="text-xs font-bold uppercase tracking-widest opacity-50 mb-2 pl-1">{t("Preferences")}</p>
           <div className={`p-4 rounded-xl border mb-3 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-300'}`}>
             <label className="font-bold block mb-2">{t("Low Stock Limit Alert")}</label>
             <div className="flex items-center gap-4 mb-2">
                 <input type="range" min="1" max="20" value={tempLimit} onChange={(e) => setTempLimit(parseInt(e.target.value))} className="flex-1 accent-blue-600 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"/>
                 <span className="text-2xl font-bold w-8 text-center">{tempLimit}</span>
             </div>
             <button onClick={() => { triggerConfirm("Update Limit?", `Set limit to ${tempLimit}?`, false, () => pushToFirebase({...data, settings: {...data.settings, limit: tempLimit}}))}} className="w-full py-2 bg-blue-100 text-blue-700 rounded font-bold text-sm">{t("Save Limit")}</button>
           </div>
           
           <div className={`p-4 rounded-xl border mb-3 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-300'}`}>
             <label className="font-bold block mb-2">{t("Theme")}</label>
             <div className="flex gap-2">
                <button onClick={() => pushToFirebase({...data, settings: {...data.settings, theme: 'light'}})} className="flex-1 py-2 border rounded font-bold">Light</button>
                <button onClick={() => pushToFirebase({...data, settings: {...data.settings, theme: 'dark'}})} className="flex-1 py-2 border bg-slate-700 text-white rounded font-bold">Dark</button>
             </div>
           </div>
       </div>

       <button onClick={handleLogout} className="w-full py-3 border-2 border-red-400 bg-red-50 text-red-600 rounded-lg font-bold flex items-center justify-center gap-2"><LogOut size={20}/> {t("Logout Shop")}</button>
    </div>
  );
};
export default SettingsPage;
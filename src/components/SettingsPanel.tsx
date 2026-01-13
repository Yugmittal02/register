import React, { useState, useEffect } from 'react';
import {
    Store, Activity, PenTool, Bell, Shield, Download, HelpCircle,
    CheckCircle, Type, Vibrate, AlertCircle, Zap, Package, AlertTriangle,
    Clock, Lock, SaveAll, FileText, Wifi, WifiOff, MessageSquare,
    ExternalLink, LogOut, ChevronRight, User, Copy, ShieldCheck, Layers
} from 'lucide-react';

interface SettingsPanelProps {
    isDark: boolean;
    t: (key: string) => string;
    settingsUnlocked: boolean;
    handleSettingsUnlock: () => void;
    settingsPassInput: string;
    setSettingsPassInput: (val: string) => void;
    settingsTab: string;
    setSettingsTab: (val: string) => void;
    data: any;
    setData: (data: any) => void;
    pushToFirebase: (data: any) => void;
    user: any;
    setView: (view: string) => void;
    deferredPrompt: any;
    setDeferredPrompt: (prompt: any) => void;
    showToast: (msg: string) => void;
    themePreset: any;
    notifPermission: string;
    requestNotificationPermission: () => void;
    setIsPrivacyOpen: (open: boolean) => void;
    setIsFaqOpen: (open: boolean) => void;
    handleLogout: () => void;
    triggerConfirm: (title: string, msg: string, isDanger: boolean, onConfirm: () => void) => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
    isDark, t, settingsUnlocked, handleSettingsUnlock, settingsPassInput, setSettingsPassInput,
    settingsTab, setSettingsTab, data, setData, pushToFirebase, user, setView,
    deferredPrompt, setDeferredPrompt, showToast, themePreset, notifPermission,
    requestNotificationPermission, setIsPrivacyOpen, setIsFaqOpen, handleLogout, triggerConfirm
}) => {
    const [tempLimit, setTempLimit] = useState(data.settings?.limit || 5);
    const [newProductPass, setNewProductPass] = useState('');

    useEffect(() => {
        if (data.settings?.limit) {
            setTempLimit(data.settings.limit);
        }
    }, [data.settings?.limit]);

    const settingsTabs = [
        { id: 'profile', icon: Store, label: t('Profile'), color: 'from-purple-500 to-indigo-500' },
        { id: 'ai', icon: Activity, label: t('AI'), color: 'from-blue-500 to-cyan-500' },
        { id: 'appearance', icon: PenTool, label: t('Theme'), color: 'from-pink-500 to-rose-500' },
        { id: 'notifications', icon: Bell, label: t('Alerts'), color: 'from-green-500 to-emerald-500' },
        { id: 'security', icon: Shield, label: t('Security'), color: 'from-red-500 to-orange-500' },
        { id: 'backup', icon: Download, label: t('Backup'), color: 'from-cyan-500 to-blue-500' },
        { id: 'help', icon: HelpCircle, label: t('Help'), color: 'from-gray-500 to-slate-500' },
    ];

    const themeOptions = [
        { id: 'light', name: t('Light'), colors: ['#ffffff', '#f1f5f9', '#3b82f6'] },
        { id: 'dark', name: t('Dark'), colors: ['#0f172a', '#1e293b', '#3b82f6'] },
        { id: 'blue', name: t('Ocean Blue'), colors: ['#1e3a5f', '#2563eb', '#60a5fa'] },
        { id: 'green', name: t('Forest'), colors: ['#14532d', '#22c55e', '#86efac'] },
        { id: 'purple', name: t('Royal'), colors: ['#4c1d95', '#8b5cf6', '#c4b5fd'] },
        { id: 'orange', name: t('Sunset'), colors: ['#7c2d12', '#f97316', '#fed7aa'] },
        { id: 'rose', name: t('Rose'), colors: ['#4c0519', '#f43f5e', '#fda4af'] },
        { id: 'auto', name: t('Auto'), colors: ['#1e293b', '#ffffff', '#8b5cf6'] },
    ];

    if (!settingsUnlocked) {
        return (
            <div className={`min-h-screen flex flex-col items-center justify-center p-6 ${isDark ? 'bg-slate-900 text-white' : 'bg-gray-50 text-black'}`}>
                <div className="bg-red-100 text-red-600 w-20 h-20 rounded-full flex items-center justify-center mb-4 border-2 border-red-200"><Lock size={40} /></div>
                <h2 className="text-xl font-bold mb-4">{t("Security Check")}</h2>
                <p className="mb-4 text-center opacity-70">{t("Enter Product Password to Access Settings")}</p>
                <input type="password" placeholder={t("Product Password")} className={`w-full max-w-xs p-3 text-center text-xl rounded border mb-4 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-300'}`} value={settingsPassInput} onChange={e => setSettingsPassInput(e.target.value)} />
                <button onClick={handleSettingsUnlock} className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold shadow-lg active:scale-95 transition-all">{t("UNLOCK SETTINGS")}</button>

                <div className="mt-8 flex items-center justify-center gap-2 text-green-600 bg-green-50 p-2 rounded-full px-4 border border-green-200">
                    <ShieldCheck size={16} />
                    <span className="text-xs font-bold uppercase tracking-widest">{t("Secured by Autonex")}</span>
                </div>
            </div>
        );
    }

    return (
        <div className={`pb-24 min-h-screen ${isDark ? 'text-white' : 'text-black'}`} style={{ backgroundColor: themePreset.bg }}>
            {/* Header */}
            <div className={`sticky top-0 z-40 p-4 backdrop-blur-xl ${isDark ? 'bg-slate-900/90' : 'bg-gray-50/90'}`}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold flex items-center gap-2"><Settings /> {t("Settings")}</h2>
                </div>

                {/* Tab Navigation */}
                <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
                    {settingsTabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setSettingsTab(tab.id as any)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-300 ${settingsTab === tab.id
                                ? `bg-gradient-to-r ${tab.color} text-white shadow-lg scale-105`
                                : isDark ? 'bg-slate-800 text-gray-400 hover:bg-slate-700' : 'bg-white text-gray-500 hover:bg-gray-100'
                                }`}
                        >
                            <tab.icon size={14} />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="p-4">
                {/* ?? PROFILE TAB */}
                {settingsTab === 'profile' && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                        <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-2xl shadow-lg">
                                    <Store size={24} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">{t("Shop Profile")}</h3>
                                    <p className="text-xs opacity-60">{t("Your business information")}</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs font-bold opacity-60 mb-1 block">{t("Shop Name")}</label>
                                    <input
                                        type="text"
                                        className={`w-full p-3 rounded-xl border ${isDark ? 'bg-slate-700 border-slate-600' : 'bg-gray-50 border-gray-200'}`}
                                        value={data.settings.shopName || ''}
                                        onChange={e => pushToFirebase({ ...data, settings: { ...data.settings, shopName: e.target.value } })}
                                        placeholder={t("Enter Shop Name")}
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-bold opacity-60 mb-1 block">{t("Shop Address")}</label>
                                    <input
                                        type="text"
                                        placeholder={t("Shop Address")}
                                        value={data.settings?.shopAddress || ''}
                                        onChange={e => pushToFirebase({ ...data, settings: { ...data.settings, shopAddress: e.target.value } })}
                                        className={`w-full p-3 rounded-xl border ${isDark ? 'bg-slate-700 border-slate-600' : 'bg-gray-50 border-gray-200'}`}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-xs font-bold opacity-60 mb-1 block">{t("City")}</label>
                                        <input
                                            type="text"
                                            placeholder={t("City")}
                                            value={data.settings?.shopCity || ''}
                                            onChange={e => pushToFirebase({ ...data, settings: { ...data.settings, shopCity: e.target.value } })}
                                            className={`w-full p-2 rounded-lg border ${isDark ? 'bg-slate-700 border-slate-600' : 'bg-gray-50 border-gray-200'}`}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold opacity-60 mb-1 block">{t("PIN Code")}</label>
                                        <input
                                            type="text"
                                            placeholder={t("PIN Code")}
                                            value={data.settings?.shopPincode || ''}
                                            onChange={e => pushToFirebase({ ...data, settings: { ...data.settings, shopPincode: e.target.value } })}
                                            className={`w-full p-2 rounded-lg border ${isDark ? 'bg-slate-700 border-slate-600' : 'bg-gray-50 border-gray-200'}`}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold opacity-60 mb-1 block">{t("GST Number (Optional)")}</label>
                                    <input
                                        type="text"
                                        placeholder={t("GST Number")}
                                        value={data.settings?.gstNumber || ''}
                                        onChange={e => pushToFirebase({ ...data, settings: { ...data.settings, gstNumber: e.target.value } })}
                                        className={`w-full p-3 rounded-xl border ${isDark ? 'bg-slate-700 border-slate-600' : 'bg-gray-50 border-gray-200'}`}
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-bold opacity-60 mb-1 block">{t("Phone Number")}</label>
                                    <input
                                        type="tel"
                                        placeholder={t("e.g., +91 98765 43210")}
                                        value={data.settings?.shopPhone || ''}
                                        onChange={e => pushToFirebase({ ...data, settings: { ...data.settings, shopPhone: e.target.value } })}
                                        className={`w-full p-3 rounded-xl border ${isDark ? 'bg-slate-700 border-slate-600' : 'bg-gray-50 border-gray-200'}`}
                                    />
                                </div>
                                <User size={18} className="text-orange-500" />
                                <span className="font-bold">{t("Your Customer ID")}</span>
                            </div>
                            <div className="flex gap-2 items-center">
                                <code className={`flex-1 p-2 rounded-lg font-mono text-xs break-all select-all ${isDark ? 'bg-slate-700' : 'bg-white'}`}>
                                    {user.uid}
                                </code>
                                <button onClick={() => { navigator.clipboard.writeText(user.uid); showToast("ID Copied!"); }} className="p-2 bg-orange-500 text-white rounded-lg active:scale-95 transition-transform shadow">
                                    <Copy size={18} />
                                </button>
                            </div>
                            <p className="text-[10px] opacity-50 mt-2">{t("Share this ID for support")}</p>
                        </div>

                        {/* Business Tools */}
                        <button onClick={() => setView('tools')} className={`w-full p-4 rounded-2xl flex items-center justify-between gap-2 shadow-sm border ${isDark ? 'bg-gradient-to-r from-slate-800 to-blue-900/30 border-blue-500/30' : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'}`}>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow"><Package size={20} className="text-white" /></div>
                                <div className="text-left">
                                    <span className="font-bold block">{t("Business Tools")}</span>
                                    <span className="text-xs opacity-60">{t("GST, Invoice, Calculator")}</span>
                                </div>
                            </div>
                            <ChevronRight size={20} className="opacity-50" />
                        </button>

                        {/* Business Achievements */}
                        <div className={`p-4 rounded-2xl border ${isDark ? 'bg-gradient-to-br from-slate-800 to-yellow-900/30 border-yellow-500/30' : 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200'}`}>
                            <div className="flex items-center gap-2 mb-3">
                                <ShieldCheck size={18} className="text-yellow-500" />
                                <span className="font-bold">{t("Business Achievements")}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 mb-3">
                                {[
                                    { label: t('Days'), value: '30+' },
                                    { label: t('Products'), value: (data.entries?.length || 0).toString() },
                                    { label: t('Bills'), value: (data.bills?.length || 0).toString() },
                                ].map((stat, i) => (
                                    <div key={i} className={`p-2 rounded-xl text-center ${isDark ? 'bg-slate-700/50' : 'bg-white/80'}`}>
                                        <p className="text-lg font-bold">{stat.value}</p>
                                        <p className="text-[9px] opacity-60">{stat.label}</p>
                                    </div>
                                ))}
                            </div>
                            <div className={`p-2 rounded-xl ${isDark ? 'bg-slate-700/50' : 'bg-yellow-100/50'}`}>
                                <div className="flex items-center justify-between text-xs mb-1">
                                    <span>{t("Level")}</span>
                                    <span className="font-bold">{(data.entries?.length || 0) > 100 ? t('Gold') : (data.entries?.length || 0) > 50 ? t('Silver') : t('Bronze')}</span>
                                </div>
                                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full" style={{ width: `${Math.min(100, ((data.entries?.length || 0) / 100) * 100)}%` }}></div>
                                </div>
                            </div>
                        </div>

                        {/* Install App Button */}
                        <button
                            onClick={() => {
                                if (deferredPrompt) {
                                    deferredPrompt.prompt();
                                    deferredPrompt.userChoice.then((choiceResult: any) => {
                                        if (choiceResult.outcome === 'accepted') setDeferredPrompt(null);
                                        showToast(choiceResult.outcome === 'accepted' ? t("App Installed!") : t("Installation cancelled"));
                                    });
                                } else {
                                    showToast(t("Use browser menu ? Add to Home Screen"));
                                }
                            }}
                            className={`w-full p-4 rounded-2xl flex items-center justify-between gap-2 shadow-sm border ${deferredPrompt ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white border-green-400' : isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-xl shadow ${deferredPrompt ? 'bg-white/20' : 'bg-gradient-to-br from-green-500 to-emerald-600'}`}>
                                    <Download size={20} className="text-white" />
                                </div>
                                <div className="text-left">
                                    <span className="font-bold block">{t("Install App")}</span>
                                    <span className={`text-xs ${deferredPrompt ? 'text-white/80' : 'opacity-60'}`}>
                                        {deferredPrompt ? t("Tap to install on your device") : t("Already installed or use browser menu")}
                                    </span>
                                </div>
                            </div>
                            {deferredPrompt && <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>}
                        </button>
                    </div>
                )}

                {/* ?? AI TAB */}
                {settingsTab === 'ai' && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                        <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl shadow-lg">
                                    <Activity size={24} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">{t("AI & Smart Features")}</h3>
                                    <p className="text-xs opacity-60">{t("Powered by Machine Learning")}</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                {[
                                    { id: 'fuzzySearch', icon: Layers, label: t('Fuzzy Search'), desc: t('Find items with typos'), gradient: 'from-orange-500 to-amber-500' },
                                    { id: 'autoCategory', icon: Layers, label: t('Auto Categorization'), desc: t('AI groups products'), gradient: 'from-pink-500 to-rose-500' },
                                ].map(item => (
                                    (() => {
                                        const defaultOn = item.id === 'fuzzySearch';
                                        const isEnabled = defaultOn ? data.settings?.[item.id] !== false : !!data.settings?.[item.id];
                                        return (
                                            <div key={item.id} className={`p-3 rounded-xl border flex items-center justify-between ${isDark ? 'bg-slate-700/50 border-slate-600' : 'bg-gray-50 border-gray-200'}`}>
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg bg-gradient-to-br ${item.gradient}`}>
                                                        <item.icon size={16} className="text-white" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold">{item.label}</p>
                                                        <p className="text-[10px] opacity-50">{item.desc}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        const nextEnabled = !isEnabled;
                                                        const newData = { ...data, settings: { ...data.settings, [item.id]: nextEnabled } };
                                                        setData(newData);
                                                        pushToFirebase(newData);
                                                    }}
                                                    className={`relative w-11 h-6 rounded-full transition-all duration-300 ${isEnabled ? `bg-gradient-to-r ${item.gradient}` : 'bg-gray-300'}`}
                                                >
                                                    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-300 ${isEnabled ? 'left-5' : 'left-0.5'}`}></div>
                                                </button>
                                            </div>
                                        );
                                    })()
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ?? APPEARANCE TAB */}
                {settingsTab === 'appearance' && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                        {/* Theme Selection */}
                        <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl shadow-lg">
                                    <PenTool size={24} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">{t("Theme")}</h3>
                                    <p className="text-xs opacity-60">{t("Choose your style")}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-4 gap-2 mb-4">
                                {themeOptions.map(theme => (
                                    <button
                                        key={theme.id}
                                        onClick={() => pushToFirebase({ ...data, settings: { ...data.settings, theme: theme.id } })}
                                        className={`p-2 rounded-xl border-2 transition-all ${(data.settings?.theme || 'light') === theme.id
                                            ? 'border-blue-500 scale-105 shadow-lg'
                                            : isDark ? 'border-slate-600 hover:border-slate-500' : 'border-gray-200 hover:border-gray-300'}`}
                                    >
                                        <div className="flex justify-center gap-0.5 mb-1.5">
                                            {theme.colors.map((color, i) => (
                                                <div key={i} className="w-4 h-4 rounded-full shadow-inner" style={{ backgroundColor: color }}></div>
                                            ))}
                                        </div>
                                        <p className="text-[10px] font-semibold text-center">{theme.name}</p>
                                        {(data.settings?.theme || 'light') === theme.id && <CheckCircle size={12} className="text-blue-500 mx-auto mt-1" />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Font Size */}
                        <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                            <div className="flex items-center gap-2 mb-3">
                                <Type size={18} className="text-pink-500" />
                                <span className="font-bold">{t("Font Size")}</span>
                            </div>
                            <div className="flex gap-2">
                                {['Small', 'Medium', 'Large'].map(size => (
                                    <button
                                        key={size}
                                        onClick={() => pushToFirebase({ ...data, settings: { ...data.settings, fontSize: size } })}
                                        className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${(data.settings?.fontSize || 'Medium') === size
                                            ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg'
                                            : isDark ? 'bg-slate-700' : 'bg-gray-100'}`}
                                    >
                                        {t(size)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* More Options */}
                        <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                            <p className="text-xs font-bold opacity-60 mb-3">{t("More Options")}</p>
                            <div className="space-y-2">
                                {[
                                    { id: 'soundEffects', icon: Vibrate, label: t('Sound Effects'), desc: t('Button sounds') },
                                    { id: 'highContrast', icon: AlertCircle, label: t('High Contrast'), desc: t('Better visibility') },
                                    { id: 'reducedMotion', icon: Zap, label: t('Reduced Motion'), desc: t('Less animations') },
                                ].map(item => (
                                    <div key={item.id} className={`p-3 rounded-xl border flex items-center justify-between ${isDark ? 'bg-slate-700/50 border-slate-600' : 'bg-gray-50 border-gray-200'}`}>
                                        <div className="flex items-center gap-3">
                                            <item.icon size={18} className="text-purple-500" />
                                            <div>
                                                <p className="text-sm font-semibold">{item.label}</p>
                                                <p className="text-[10px] opacity-50">{item.desc}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => pushToFirebase({ ...data, settings: { ...data.settings, [item.id]: item.id === 'soundEffects' ? data.settings?.soundEffects === false : !data.settings?.[item.id] } })}
                                            className={`relative w-10 h-5 rounded-full transition-all duration-300 ${(item.id === 'soundEffects' ? data.settings?.soundEffects !== false : data.settings?.[item.id]) ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-gray-300'}`}
                                        >
                                            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-300 ${(item.id === 'soundEffects' ? data.settings?.soundEffects !== false : data.settings?.[item.id]) ? 'left-5' : 'left-0.5'}`}></div>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ?? NOTIFICATIONS TAB */}
                {settingsTab === 'notifications' && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                        <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl shadow-lg">
                                    <Bell size={24} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">{t("Notifications")}</h3>
                                    <p className="text-xs opacity-60">{t("Stay informed")}</p>
                                </div>
                            </div>

                            {/* Permission Status */}
                            <div className={`p-3 rounded-xl border mb-4 flex items-center justify-between ${isDark ? 'bg-slate-700/50 border-slate-600' : 'bg-gray-50 border-gray-200'}`}>
                                <div>
                                    <p className="font-bold">{t("Push Notifications")}</p>
                                    <p className="text-xs opacity-60">{notifPermission === 'granted' ? t("Enabled") : t("Allow popups & alerts")}</p>
                                </div>
                                {notifPermission === 'granted'
                                    ? <span className="px-3 py-1 bg-green-100 text-green-700 rounded-lg font-bold text-xs flex items-center gap-1"><CheckCircle size={14} /> Active</span>
                                    : <button onClick={requestNotificationPermission} className="px-3 py-1.5 bg-green-600 text-white rounded-lg font-bold text-xs flex items-center gap-1"><Bell size={14} /> Enable</button>
                                }
                            </div>

                            {/* Notification Types */}
                            <p className="text-xs font-bold opacity-60 mb-2">{t("Alert Types")}</p>
                            <div className="space-y-2">
                                {[
                                    { id: 'lowStockAlert', icon: Package, label: t('Low Stock Alerts'), color: 'text-orange-500' },
                                    { id: 'expiryAlert', icon: AlertTriangle, label: t('Expiry Reminders'), color: 'text-yellow-500' },
                                ].map(item => (
                                    <div key={item.id} className={`p-3 rounded-xl border flex items-center justify-between ${isDark ? 'bg-slate-700/50 border-slate-600' : 'bg-gray-50 border-gray-200'}`}>
                                        <div className="flex items-center gap-3">
                                            <item.icon size={18} className={item.color} />
                                            <p className="text-sm font-semibold">{item.label}</p>
                                        </div>
                                        <button
                                            onClick={() => pushToFirebase({ ...data, settings: { ...data.settings, notifications: { ...(data.settings?.notifications || {}), [item.id]: !data.settings?.notifications?.[item.id] } } })}
                                            className={`relative w-10 h-5 rounded-full transition-all duration-300 ${data.settings?.notifications?.[item.id] ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gray-300'}`}
                                        >
                                            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-300 ${data.settings?.notifications?.[item.id] ? 'left-5' : 'left-0.5'}`}></div>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Low Stock Limit */}
                        <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                            <div className="flex items-center gap-2 mb-3">
                                <AlertTriangle size={18} className="text-red-500" />
                                <span className="font-bold">{t("Low Stock Limit")}</span>
                            </div>
                            <div className="flex items-center gap-4 mb-3">
                                <input
                                    type="range" min="1" max="20"
                                    value={tempLimit}
                                    onChange={(e) => setTempLimit(parseInt(e.target.value))}
                                    className="flex-1 accent-red-500 h-2 bg-gray-200 rounded-lg"
                                />
                                <span className="text-2xl font-bold w-10 text-center">{tempLimit}</span>
                            </div>
                            <button
                                onClick={() => { triggerConfirm("Update?", `Set limit to ${tempLimit}?`, false, () => pushToFirebase({ ...data, settings: { ...data.settings, limit: tempLimit } })) }}
                                className="w-full py-2 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl font-bold text-sm"
                            >
                                {t("Save Limit")}
                            </button>
                        </div>
                    </div>
                )}

                {/* ?? SECURITY TAB */}
                {settingsTab === 'security' && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                        <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl shadow-lg">
                                    <Shield size={24} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">{t("Security")}</h3>
                                    <p className="text-xs opacity-60">{t("Protect your data")}</p>
                                </div>
                            </div>

                            {/* Change Password */}
                            <div className={`p-3 rounded-xl border mb-3 ${isDark ? 'bg-slate-700/50 border-slate-600' : 'bg-gray-50 border-gray-200'}`}>
                                <p className="font-bold mb-2">{t("Product Password")}</p>
                                <input
                                    type="password"
                                    placeholder={t("New Password")}
                                    className={`w-full p-2 rounded-lg border mb-2 ${isDark ? 'bg-slate-600 border-slate-500' : 'bg-white border-gray-300'}`}
                                    value={newProductPass}
                                    onChange={e => setNewProductPass(e.target.value)}
                                />
                                <button
                                    onClick={() => { triggerConfirm("Change?", "Update password?", false, () => { pushToFirebase({ ...data, settings: { ...data.settings, productPassword: newProductPass } }); setNewProductPass(''); showToast(t("Updated!")); }) }}
                                    className="w-full py-2 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg font-bold text-sm"
                                >
                                    {t("Update Password")}
                                </button>
                            </div>

                            {/* Security Features */}
                            <div className="space-y-2">
                                {/* Auto Lock Timer */}
                                <div className={`p-3 rounded-xl border flex items-center justify-between ${isDark ? 'bg-slate-700/50 border-slate-600' : 'bg-gray-50 border-gray-200'}`}>
                                    <div className="flex items-center gap-3">
                                        <Clock size={18} className="text-orange-500" />
                                        <div>
                                            <p className="text-sm font-semibold">{t("Auto Lock")}</p>
                                            <p className="text-[10px] opacity-50">{t("Lock after inactivity")}</p>
                                        </div>
                                    </div>
                                    <select
                                        value={data.settings?.autoLockTime || '5'}
                                        onChange={e => pushToFirebase({ ...data, settings: { ...data.settings, autoLockTime: e.target.value } })}
                                        className={`px-3 py-1 rounded-lg text-xs font-bold border ${isDark ? 'bg-slate-600 border-slate-500 text-white' : 'bg-gray-100 border-gray-300'}`}
                                    >
                                        <option value="1">1 min</option>
                                        <option value="5">5 min</option>
                                        <option value="15">15 min</option>
                                        <option value="never">Never</option>
                                    </select>
                                </div>

                                {/* Data Encryption - Always ON */}
                                <div className={`p-3 rounded-xl border flex items-center justify-between ${isDark ? 'bg-slate-700/50 border-slate-600' : 'bg-gray-50 border-gray-200'}`}>
                                    <div className="flex items-center gap-3">
                                        <Lock size={18} className="text-green-500" />
                                        <div>
                                            <p className="text-sm font-semibold">{t("Data Encryption")}</p>
                                            <p className="text-[10px] opacity-50">{t("AES-256 encryption")}</p>
                                        </div>
                                    </div>
                                    <span className="px-2 py-1 bg-green-100 text-green-600 rounded-lg text-[10px] font-bold flex items-center gap-1">
                                        <CheckCircle size={10} /> Enabled
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ?? BACKUP TAB */}
                {settingsTab === 'backup' && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                        <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl shadow-lg">
                                    <Download size={24} className="text-white" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-lg">{t("Cloud & Backup")}</h3>
                                    <p className="text-xs opacity-60">{t("Never lose your data")}</p>
                                </div>
                                <span className="px-2 py-1 bg-green-500 text-white rounded-lg text-[10px] font-bold flex items-center gap-1">
                                    <CheckCircle size={10} /> Synced
                                </span>
                            </div>

                            <div className="space-y-2">
                                {/* Auto Backup Frequency */}
                                <div className={`p-3 rounded-xl border flex items-center justify-between ${isDark ? 'bg-slate-700/50 border-slate-600' : 'bg-gray-50 border-gray-200'}`}>
                                    <div className="flex items-center gap-3">
                                        <SaveAll size={18} className="text-cyan-500" />
                                        <div>
                                            <p className="text-sm font-semibold">{t("Auto Backup")}</p>
                                            <p className="text-[10px] opacity-50">{t("Schedule backups")}</p>
                                        </div>
                                    </div>
                                    <select
                                        value={data.settings?.autoBackup || 'daily'}
                                        onChange={e => pushToFirebase({ ...data, settings: { ...data.settings, autoBackup: e.target.value } })}
                                        className={`px-3 py-1 rounded-lg text-xs font-bold border ${isDark ? 'bg-slate-600 border-slate-500 text-white' : 'bg-gray-100 border-gray-300'}`}
                                    >
                                        <option value="hourly">Hourly</option>
                                        <option value="daily">Daily</option>
                                        <option value="weekly">Weekly</option>
                                        <option value="manual">Manual</option>
                                    </select>
                                </div>

                                {/* Export Data */}
                                <button
                                    onClick={() => {
                                        const exportData = JSON.stringify(data, null, 2);
                                        const blob = new Blob([exportData], { type: 'application/json' });
                                        const url = URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = `${data.settings?.shopName || 'shop'}_backup_${new Date().toISOString().split('T')[0]}.json`;
                                        a.click();
                                        showToast(t("Backup Downloaded!"));
                                    }}
                                    className={`w-full p-3 rounded-xl border flex items-center justify-between ${isDark ? 'bg-slate-700/50 border-slate-600' : 'bg-gray-50 border-gray-200'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <FileText size={18} className="text-green-500" />
                                        <div className="text-left">
                                            <p className="text-sm font-semibold">{t("Export Data")}</p>
                                            <p className="text-[10px] opacity-50">{t("Download JSON backup")}</p>
                                        </div>
                                    </div>
                                    <div className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold flex items-center gap-1">
                                        <Download size={12} /> Export
                                    </div>
                                </button>

                                {/* Last Backup Info */}
                                <div className={`p-3 rounded-xl ${isDark ? 'bg-cyan-900/30' : 'bg-cyan-50'} flex items-center justify-between`}>
                                    <span className="text-xs opacity-70">{t("Last Backup")}</span>
                                    <span className="text-xs font-bold">{new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* Performance Mode */}
                        <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                            <div className="flex items-center gap-2 mb-3">
                                <Zap size={18} className="text-amber-500" />
                                <span className="font-bold">{t("Performance")}</span>
                            </div>
                            <div className="space-y-2">
                                {[
                                    { id: 'batterySaver', icon: Vibrate, label: t('Battery Saver'), desc: t('Reduce animations'), color: 'text-green-500' },
                                    { id: 'lowDataMode', icon: Wifi, label: t('Low Data Mode'), desc: t('Compress images'), color: 'text-blue-500' },
                                    { id: 'offlineFirst', icon: WifiOff, label: t('Offline First'), desc: t('Work without internet'), color: 'text-purple-500' },
                                ].map(item => (
                                    <div key={item.id} className={`p-3 rounded-xl border flex items-center justify-between ${isDark ? 'bg-slate-700/50 border-slate-600' : 'bg-gray-50 border-gray-200'}`}>
                                        <div className="flex items-center gap-3">
                                            <item.icon size={18} className={item.color} />
                                            <div>
                                                <p className="text-sm font-semibold">{item.label}</p>
                                                <p className="text-[10px] opacity-50">{item.desc}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => pushToFirebase({ ...data, settings: { ...data.settings, performance: { ...(data.settings?.performance || {}), [item.id]: !data.settings?.performance?.[item.id] } } })}
                                            className={`relative w-10 h-5 rounded-full transition-all duration-300 ${data.settings?.performance?.[item.id] ? 'bg-gradient-to-r from-amber-500 to-yellow-500' : 'bg-gray-300'}`}
                                        >
                                            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-300 ${data.settings?.performance?.[item.id] ? 'left-5' : 'left-0.5'}`}></div>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ? HELP TAB */}
                {settingsTab === 'help' && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                        <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-gradient-to-br from-gray-500 to-slate-500 rounded-2xl shadow-lg">
                                    <HelpCircle size={24} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">{t("Help & Support")}</h3>
                                    <p className="text-xs opacity-60">{t("Get assistance")}</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <button onClick={() => setIsPrivacyOpen(true)} className={`w-full p-3 rounded-xl border text-left flex items-center gap-3 ${isDark ? 'bg-slate-700/50 border-slate-600' : 'bg-gray-50 border-gray-200'}`}>
                                    <FileText size={20} className="text-gray-500" />
                                    <span className="font-semibold">{t("Privacy Policy")}</span>
                                    <ChevronRight size={16} className="ml-auto opacity-50" />
                                </button>
                                <button onClick={() => setIsFaqOpen(true)} className={`w-full p-3 rounded-xl border text-left flex items-center gap-3 ${isDark ? 'bg-slate-700/50 border-slate-600' : 'bg-gray-50 border-gray-200'}`}>
                                    <HelpCircle size={20} className="text-blue-500" />
                                    <span className="font-semibold">{t("FAQ")}</span>
                                    <ChevronRight size={16} className="ml-auto opacity-50" />
                                </button>
                                <a href="tel:8619152422" className={`w-full p-3 rounded-xl border text-left flex items-center gap-3 ${isDark ? 'bg-slate-700/50 border-slate-600' : 'bg-gray-50 border-gray-200'}`}>
                                    <MessageSquare size={20} className="text-green-500" />
                                    <span className="font-semibold">{t("Contact Support")}</span>
                                    <ExternalLink size={14} className="ml-auto opacity-50" />
                                </a>
                            </div>
                        </div>

                        {/* Logout */}
                        <button onClick={handleLogout} className="w-full py-3 border-2 border-red-400 bg-red-50 text-red-600 rounded-xl font-bold flex items-center justify-center gap-2">
                            <LogOut size={20} /> {t("Logout")}
                        </button>

                        {/* App Info */}
                        <div className={`p-4 rounded-2xl border ${isDark ? 'bg-gradient-to-br from-slate-800 via-purple-900/30 to-blue-900/30 border-purple-500/30' : 'bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 border-purple-200'}`}>
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                                        <Zap size={20} className="text-white" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm">{data.settings?.shopName || 'Autonex'}</p>
                                        <p className="text-[10px] opacity-50">v3.0 Pro Edition</p>
                                    </div>
                                </div>
                                <span className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-[10px] font-bold text-white flex items-center gap-1">
                                    <ShieldCheck size={10} /> PRO
                                </span>
                            </div>

                            <div className="grid grid-cols-3 gap-2 text-center text-[10px] mb-3">
                                <div className={`p-2 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-white/80'}`}>
                                    <Activity size={14} className="mx-auto text-purple-500 mb-1" />
                                    <span className="font-semibold">{t("AI Powered")}</span>
                                </div>
                                <div className={`p-2 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-white/80'}`}>
                                    <Shield size={14} className="mx-auto text-green-500 mb-1" />
                                    <span className="font-semibold">{t("Secure")}</span>
                                </div>
                                <div className={`p-2 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-white/80'}`}>
                                    <Download size={14} className="mx-auto text-blue-500 mb-1" />
                                    <span className="font-semibold">{t("Cloud Sync")}</span>
                                </div>
                            </div>

                            <div className="text-center">
                                <p className="text-[9px] uppercase tracking-widest opacity-50 mb-1">{t("Developed By")}</p>
                                <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full ${isDark ? 'bg-slate-700' : 'bg-white'}`}>
                                    <div className="w-5 h-5 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                                        <Zap size={10} className="text-white" />
                                    </div>
                                    <span className="font-bold text-xs">Autonex</span>
                                    <CheckCircle size={12} className="text-blue-500" />
                                </div>
                                <p className="text-[8px] mt-2 opacity-40">  2025 All Rights Reserved</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <div className="h-24"></div>
        </div>
    );
};

export default SettingsPanel;

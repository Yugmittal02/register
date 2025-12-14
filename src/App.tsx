import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { 
  Plus, Minus, Search, X, Trash2, ArrowLeft, Book, Grid, 
  Mic, Settings, AlertTriangle, Languages, Lock, Bell, 
  Download, ShieldCheck, ShieldAlert, CheckCircle, 
  Edit, SaveAll, LogOut, Wifi, WifiOff, User, Loader2, ChevronRight,
  ChevronUp, ChevronDown, ArrowRight, 
  ArrowRight as ArrowRightIcon, 
  ArrowLeft as ArrowLeftIcon,
  Copy, Layers, Ban, Store, Zap, XCircle, AlertCircle,
  FileText, HelpCircle, Phone, MessageSquare, ExternalLink, Shield,
  Calculator, Percent, CreditCard, StickyNote, Briefcase, Image as ImageIcon,
  Share2, Calendar, MoreVertical, History, RefreshCcw, DollarSign,
  Pin, PinOff, PenTool, Highlighter, Circle as CircleIcon, Eraser, Type,
  RefreshCw, RotateCcw, Printer, FilePlus, Send,
  Bold, Italic, Underline // <--- Added these for Notepad
} from 'lucide-react';

// --- FIREBASE IMPORTS ---
import { initializeApp } from "firebase/app";
import { getFirestore, doc, onSnapshot, setDoc, enableIndexedDbPersistence, enableMultiTabIndexedDbPersistence } from "firebase/firestore";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged 
} from "firebase/auth";
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";

// ---------------------------------------------------------
// ✅ CONFIGURATION
// ---------------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyDDer9o6DqRuFVSQwRcq0BqvDkc72oKSRk",
  authDomain: "arvindregister-353e5.firebaseapp.com",
  projectId: "arvindregister-353e5",
  storageBucket: "arvindregister-353e5.firebasestorage.app",
  messagingSenderId: "557116649734",
  appId: "1:557116649734:web:822bbad24cca3274012e87",
  measurementId: "G-79C2SNJC56"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

// Fix for Multi-Tab Persistence Error
// Attempt to enable multi-tab IndexedDB persistence first (preferred for shared access).
// Persistence owner coordination to avoid multiple tabs enabling persistence concurrently
// and causing Firestore INTERNAL ASSERTION errors about exclusive access.
(function () {
  const DISABLED_KEY = 'dukan:firestore-persistence-disabled';
  const OWNER_KEY = 'dukan:firestore-persistence-owner';
  const TAB_ID = `${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
  const HEARTBEAT_MS = 5000;
  const FIRESTORE_ERROR_KEY = 'dukan:firestore-persistence-error';
  const FIRESTORE_ERROR_PATTERNS = [
    'Failed to obtain exclusive access to the persistence layer',
    'Failed to obtain primary lease',
    'INTERNAL ASSERTION FAILED'
  ];
  const SUPPRESS_DURATION_MS = 60_000;

  if (localStorage.getItem(DISABLED_KEY) === '1') {
    console.info('Skipping Firestore persistence (previously disabled)');
    return;
  }

  let heartbeatTimer = null;
  let suppressionActive = false;
  const setOwner = () => {
    try {
      localStorage.setItem(OWNER_KEY, JSON.stringify({ id: TAB_ID, ts: Date.now() }));
    } catch {
      /* noop */
    }
  };
  const clearOwner = () => {
    try {
      const raw = localStorage.getItem(OWNER_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && parsed.id === TAB_ID) localStorage.removeItem(OWNER_KEY);
    } catch { /* noop */ }
  };

  const tryEnable = async () => {
    try {
      // Quick check: if another owner exists and is recent, don't attempt to become owner.
      const raw = localStorage.getItem(OWNER_KEY);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (parsed && (Date.now() - parsed.ts) < HEARTBEAT_MS * 2) {
            console.info('Another tab appears to own persistence; skipping enable');
            return;
          }
        } catch { /* fall through */ }
      }

      // Become owner and attempt to enable multi-tab persistence
      setOwner();
      if (typeof enableMultiTabIndexedDbPersistence === 'function') {
        await enableMultiTabIndexedDbPersistence(db);
        console.info('Firestore multi-tab persistence enabled by owner', TAB_ID);
      } else {
        // Some SDKs support enableIndexedDbPersistence with synchronizeTabs flag
        try {
          await enableIndexedDbPersistence(db, { synchronizeTabs: true });
          console.info('Firestore persistence with synchronizeTabs enabled by owner', TAB_ID);
        } catch (inner) {
          console.warn('synchronizeTabs attempt failed', inner);
          try {
            await enableIndexedDbPersistence(db);
            console.info('Firestore single-tab persistence enabled by owner', TAB_ID);
          } catch (err2) {
            if (err2 && err2.code === 'failed-precondition') {
              console.warn('Persistence unavailable: another tab has exclusive access. Disabling persistence attempts.');
              localStorage.setItem(DISABLED_KEY, '1');
              clearOwner();
            } else if (err2 && err2.code === 'unimplemented') {
              console.warn('Persistence is not supported by this browser.');
              localStorage.setItem(DISABLED_KEY, '1');
              clearOwner();
            } else {
              console.warn('Unexpected error enabling IndexedDB persistence', err2);
              clearOwner();
            }
          }
        }
      }

      // If we got here and persistence seems enabled, keep a heartbeat to show liveness
      heartbeatTimer = setInterval(() => {
        setOwner();
      }, HEARTBEAT_MS);

      // Remove owner on unload
      window.addEventListener('beforeunload', () => {
        clearOwner();
      });
    } catch (err) {
      // If we see repeated SDK assertion failures, mark persistence disabled
      console.warn('Unexpected error while attempting to enable persistence', err);
      localStorage.setItem(DISABLED_KEY, '1');
      localStorage.setItem(FIRESTORE_ERROR_KEY, JSON.stringify({ ts: Date.now(), msg: String(err && err.message ? err.message : err) }));
      clearOwner();
      if (heartbeatTimer) clearInterval(heartbeatTimer);
      // Activate short-term suppression of matching console messages
      suppressionActive = true;
      wrapConsoleSuppression();
    }
  };

  const handleFirestoreError = (message) => {
    if (suppressionActive) return;
    if (!message) return;
    if (!FIRESTORE_ERROR_PATTERNS.some(p => message.includes(p))) return;
    try {
      console.warn('Detected Firestore persistence contention, disabling further attempts');
      localStorage.setItem(DISABLED_KEY, '1');
      localStorage.setItem(FIRESTORE_ERROR_KEY, JSON.stringify({ ts: Date.now(), msg: message }));
      clearOwner();
      if (heartbeatTimer) clearInterval(heartbeatTimer);
      suppressionActive = true;
      wrapConsoleSuppression();
    } catch {
      /* noop */
    }
  };

  const wrapConsoleSuppression = () => {
    const origWarn = console.warn.bind(console);
    const origError = console.error.bind(console);
    console.warn = (...args) => {
      if (args.some(a => typeof a === 'string' && FIRESTORE_ERROR_PATTERNS.some(p => a.includes(p)))) return;
      origWarn(...args);
    };
    console.error = (...args) => {
      if (args.some(a => typeof a === 'string' && FIRESTORE_ERROR_PATTERNS.some(p => a.includes(p)))) return;
      origError(...args);
    };
    setTimeout(() => {
      console.warn = origWarn;
      console.error = origError;
      suppressionActive = false;
    }, SUPPRESS_DURATION_MS);
  };

  // React to storage events so that if a new owner appears we back off
  window.addEventListener('storage', (ev) => {
    if (ev.key === OWNER_KEY && ev.newValue) {
      try {
        const parsed = JSON.parse(ev.newValue);
        if (parsed && parsed.id !== TAB_ID) {
          // Another tab became owner; stop our heartbeat
          if (heartbeatTimer) { clearInterval(heartbeatTimer); heartbeatTimer = null; }
        }
      } catch { /* noop */ }
    }
    if (ev.key === FIRESTORE_ERROR_KEY && ev.newValue) {
      // If another tab reports an error, also activate local suppression and mark disabled
      try { const parsed = JSON.parse(ev.newValue); handleFirestoreError(parsed.msg || String(ev.newValue)); } catch { handleFirestoreError(String(ev.newValue)); }
    }
  });

  // Also listen to global errors/unhandled rejections so we can react quickly
  const globalErrorHandler = (ev) => {
    try {
      const msg = ev && (ev.reason?.message || ev.message || String(ev));
      handleFirestoreError(msg);
      if (msg && msg.includes('Invalid hook call')) {
        // Log diagnostics for invalid hook call to help debugging
        try {
          console.error('Invalid hook call detected. Diagnostics:', {
            reactVersion: React && React.version,
            reactDomVersion: (window && window.ReactDOM && window.ReactDOM.version) || null,
            dukanTabDiagnostics: window.__dukan_dumpDiagnostics ? window.__dukan_dumpDiagnostics() : null,
            location: window.location.href
          });
        } catch { /* noop */ }
        try { localStorage.setItem('dukan:invalid-hook', JSON.stringify({ ts: Date.now(), msg })); } catch { /* noop */ }
      }
    } catch { /* noop */ }
  };
  window.addEventListener('unhandledrejection', globalErrorHandler);
  window.addEventListener('error', (ev) => { globalErrorHandler(ev); });

  // Start attempt after small delay to allow other tabs to set up first
  setTimeout(tryEnable, 400);
  // Expose lightweight diagnostics to make runtime debugging easier
  try { window.__dukan_tabId = TAB_ID; } catch { /* noop */ }
  try {
    window.__dukan_dumpDiagnostics = () => ({
      tabId: TAB_ID,
      owner: localStorage.getItem(OWNER_KEY),
      disabled: localStorage.getItem(DISABLED_KEY),
      lastError: localStorage.getItem(FIRESTORE_ERROR_KEY),
      pendingDeletes: localStorage.getItem('dukan:pendingDeletes')
    });
  } catch { /* noop */ }
})();

// ---------------------------------------------------------
// 🧠 TRANSLATION ENGINE
    // Delete a bill (remove from storage if present and update cloud)
// ---------------------------------------------------------
const translationCache = new Map(); 

const exactDictionary = {
  "brake": "ब्रेक", "pads": "पैड्स", "shoe": "शू", "oil": "तेल", "filter": "फिल्टर",
  "light": "लाइट", "headlight": "हेडलाइट", "bumper": "बम्पर", "cover": "कवर",
  "seat": "सीट", "mat": "मैट", "guard": "गार्ड", "horn": "हॉर्न", "mirror": "शीशा",
  "glass": "कांच", "clutch": "क्लच", "wire": "तार", "battery": "बैटरी", "tyre": "टायर",
  "tube": "ट्यूब", "alloy": "अलॉय", "wheel": "व्हील", "cap": "कैप", "door": "दरवाजा",
  "handle": "हैंडल", "lock": "लॉक", "key": "चाबी", "sensor": "सेंसर", "screen": "स्क्रीन",
  "kit": "किट", "rod": "रॉड", "bush": "बुश", "arm": "आर्म", "wiper": "वाइपर", 
  "motor": "मोटर", "pump": "पम्प", "coolant": "कूलेंट", "chain": "चैन", "belt": "बेल्ट",
  "swift": "स्विफ्ट", "thar": "थार", "creta": "क्रेटा", "alto": "आल्टो", "scorpio": "स्कॉर्पियो",
  "bolero": "बोलेरो", "city": "सिटी", "verna": "वर्ना", "wagonr": "वैगन-आर", "baleno": "बलेनो",
  "dzire": "डिजायर", "innova": "इनोवा", "fortuner": "फॉर्च्यूनर", "brezza": "ब्रेजा",
  "page": "पेज", "qty": "मात्रा", "car": "गाड़ी", "search": "खोजें", 
  "index": "विषय सूची", "settings": "सेटिंग्स", "pages": "पेज लिस्ट", 
  "total": "कुल", "delete": "हटाएं", "confirm": "पुष्टि करें", "update": "अपडेट",
  "save changes": "बदलाव सेव करें", "pending": "पेंडिंग", "online": "ऑनलाइन", "offline": "ऑफलाइन",
  "item name": "आइटम का नाम", "edit entry": "एंट्री बदलें", "new page": "नया पेज",
  "cancel": "रद्द करें", "add": "जोड़ें", "save": "सेव करें", "new entry": "नया माल",
  "quantity": "मात्रा", "install app": "ऐप इंस्टॉल करें", "notifications": "नोटिफिकेशन",
  "theme": "थीम", "logout shop": "दुकान बंद करें", "alerts": "चेतावनी",
  "unknown item": "अनजान आइटम", "go to page": "पेज पर जाएं", "low stock": "कम माल",
  "stock full": "माल पूरा है", "security check": "सुरक्षा जाँच", "unlock settings": "सेटिंग्स खोलें",
  "import items": "आइटम कॉपी करें", "select page to copy from": "किस पेज से कॉपी करना है?", "copy": "कॉपी करें",
  "your customer id (support)": "आपकी कस्टमर आईडी (सपोर्ट)", "share this for help": "मदद के लिए इसे शेयर करें", "id copied": "आईडी कॉपी हो गई!",
  "manage page": "पेज मैनेज करें", "rename": "नाम बदलें", "move up": "ऊपर करें", "move down": "नीचे करें", "shop name": "दुकान का नाम",
  "enter password": "पासवर्ड डालें", "success": "सफल", "error": "त्रुटि", "wrong password": "गलत पासवर्ड",
  "are you sure": "क्या आप सुनिश्चित हैं?", "delete warning": "यह हमेशा के लिए हट जाएगा", "yes delete": "हाँ, हटाओ", "no cancel": "नहीं, रहने दो",
  "privacy policy": "गोपनीयता नीति", "legal": "कानूनी", "support": "सहायता", "faq": "अक्सर पूछे जाने वाले सवाल", "feedback": "सुझाव / संपर्क",
  "app info": "ऐप की जानकारी", "secured by": "सुरक्षित", "parent company": "मूल कंपनी", "load more": "और देखें", "showing": "दिख रहे हैं", "of": "में से",
  "tools": "टूल्स", "business tools": "बिज़नेस टूल्स", "gst calc": "GST कैलकुलेटर", "margin": "मार्जिन", "converter": "कन्वर्टर", "visiting card": "विजिटिंग कार्ड", "quick notes": "नोट्स",
  "bills": "बिल्स", "upload bill": "बिल जोड़ें", "delete bill": "बिल हटाएं",
  "translator": "अनुवादक", "type here": "यहाँ लिखें", "translate": "अनुवाद करें", "invoice": "बिल जनरेटर"
};

const soundMap = {
  'a': 'ा', 'i': 'ि', 'u': 'ु', 'e': 'े', 'o': 'ो',
  'aa': 'ा', 'ee': 'ी', 'oo': 'ू', 'ai': 'ै', 'au': 'ौ',
  'k': 'क', 'kh': 'ख', 'g': 'ग', 'gh': 'घ',
  'ch': 'च', 'chh': 'छ', 'j': 'ज', 'jh': 'झ',
  't': 'ट', 'th': 'थ', 'd': 'ड', 'dh': 'ढ', 'n': 'न',
  'p': 'प', 'f': 'फ', 'ph': 'फ', 'b': 'ब', 'bh': 'भ', 'm': 'म',
  'y': 'य', 'r': 'र', 'l': 'ल', 'v': 'व', 'w': 'व',
  's': 'स', 'sh': 'श', 'h': 'ह', 'z': 'ज़', 'x': 'क्स'
};

const convertToHindi = (text) => {
  if (!text) return "";
  const strText = text.toString();
  if (translationCache.has(strText)) return translationCache.get(strText);
  try {
    const translated = strText.split(/\s+/).map((word) => {
      const lower = word.toLowerCase();
      if (exactDictionary[lower]) return exactDictionary[lower];

      let i = 0;
      let hindiWord = '';
      while (i < lower.length) {
        const char = lower[i];
        const next = lower[i + 1] || '';
        const double = char + next;

        if (soundMap[double] && !['a', 'e', 'i', 'o', 'u'].includes(char)) {
          hindiWord += soundMap[double];
          i += 2;
        } else if (soundMap[char]) {
          if (i === 0 && ['a', 'e', 'i', 'o', 'u'].includes(char)) {
            if (char === 'a') hindiWord += 'अ';
            else if (char === 'e') hindiWord += 'ए';
            else if (char === 'i') hindiWord += 'इ';
            else if (char === 'o') hindiWord += 'ओ';
            else if (char === 'u') hindiWord += 'उ';
          } else {
            hindiWord += soundMap[char];
          }
          i++;
        } else {
          hindiWord += char;
          i++;
        }
      }
      return hindiWord || word;
    }).join(' ');

    translationCache.set(strText, translated);
    return translated;
  } catch (err) {
    console.error(err);
    return strText;
  }
};

// --- SUB-COMPONENTS ---

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, errorInfo) {
    console.error("App Error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
            <AlertTriangle size={64} className="text-red-500 mb-4"/>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">Something went wrong.</h1>
            <p className="text-slate-500 mb-6">The app encountered an error.</p>
            <button onClick={() => window.location.reload()} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2">
                <RefreshCw size={20}/> Reload App
            </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const ToastMessage = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full shadow-2xl z-[100] flex items-center gap-3 transition-all transform animate-in fade-in slide-in-from-top-4 border-2 border-white/20 ${
      type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
    }`}>
       {type === 'error' ? <XCircle size={22} className="shrink-0"/> : <CheckCircle size={22} className="shrink-0"/>}
       <span className="font-bold text-sm md:text-base whitespace-nowrap">{message}</span>
    </div>
  );
};

// 🛠️ TOOLS COMPONENT (UPGRADED)
const ToolsHub = ({ onBack, t, isDark, initialTool = null, pinnedTools, onTogglePin, shopDetails }) => {
  const [activeTool, setActiveTool] = useState(initialTool);
  const [invoiceNumber] = useState(() => Date.now().toString().slice(-4));
  const [gstInput, setGstInput] = useState({ price: '', rate: 18, isReverse: false });
  const [marginInput, setMarginInput] = useState({ cost: '', sell: '', discount: 0, mode: 'profit' });
  const [convInput, setConvInput] = useState({ val: '', type: 'kgToTon' });
  const [transInput, setTransInput] = useState('');

  // 🧾 INVOICE GENERATOR STATE
  const [invCust, setInvCust] = useState({ name: '', phone: '', address: '' });
  const [invItems, setInvItems] = useState([]);
  const [invCurrentItem, setInvCurrentItem] = useState({ name: '', qty: 1, rate: 0, gst: 0 });

  // 📝 NOTEPAD STATE (RICH TEXT UPGRADE)
  const [notesView, setNotesView] = useState('list');
  const [notes, setNotes] = useState(() => {
      try {
        const saved = localStorage.getItem('proNotes');
        return saved ? JSON.parse(saved) : [];
      } catch(e) { console.error(e); return []; }
  });
  const [currentNote, setCurrentNote] = useState({ id: null, title: '', body: '', date: '', sketch: null });
  const [noteSearch, setNoteSearch] = useState('');
  
  const [noteMode, setNoteMode] = useState('text');
  const canvasRef = useRef(null);
  const contentEditableRef = useRef(null); // Ref for Rich Text
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushType, setBrushType] = useState('pencil');
  const [startPos, setStartPos] = useState({x:0, y:0});

  useEffect(() => {
      localStorage.setItem('proNotes', JSON.stringify(notes));
  }, [notes]);

  const tools = [
    { id: 'invoice', name: 'Bill Generator', icon: <FileText size={24} />, color: 'bg-indigo-100 text-indigo-600' },
    { id: 'gst', name: 'GST Pro', icon: <Percent size={24} />, color: 'bg-blue-100 text-blue-600' },
    { id: 'margin', name: 'Profit/Margin', icon: <Calculator size={24} />, color: 'bg-purple-100 text-purple-600' },
    { id: 'converter', name: 'Unit Convert', icon: <RefreshCcw size={24} />, color: 'bg-green-100 text-green-600' },
    { id: 'card', name: 'Digital Card', icon: <CreditCard size={24} />, color: 'bg-orange-100 text-orange-600' },
    { id: 'notes', name: 'Note Master', icon: <StickyNote size={24} />, color: 'bg-yellow-100 text-yellow-600' },
    { id: 'translator', name: 'Translator', icon: <Languages size={24} />, color: 'bg-pink-100 text-pink-600' },
  ];

  // --- INVOICE FUNCTIONS ---
  const addInvItem = () => {
     if(!invCurrentItem.name || !invCurrentItem.rate) return;
     const total = invCurrentItem.qty * invCurrentItem.rate;
     const gstAmt = (total * invCurrentItem.gst) / 100;
     const newItem = { ...invCurrentItem, id: Date.now(), total: total + gstAmt, gstAmt };
     setInvItems([...invItems, newItem]);
     setInvCurrentItem({ name: '', qty: 1, rate: 0, gst: 0 });
  };
  
  const deleteInvItem = (id) => setInvItems(invItems.filter(i => i.id !== id));
  
  const calculateBillTotal = () => invItems.reduce((acc, curr) => acc + curr.total, 0);

  const shareInvoiceImage = async () => {
    if (!window.html2canvas) {
        const script = document.createElement('script');
        script.src = "https://html2canvas.hertzen.com/dist/html2canvas.min.js";
        document.head.appendChild(script);
        await new Promise(resolve => script.onload = resolve);
    }

    const element = document.getElementById('invoice-area');
    if (!element) return;
    
    setTimeout(async () => {
        try {
            const canvas = await window.html2canvas(element, { backgroundColor: '#ffffff', scale: 2 });
            canvas.toBlob(async (blob) => {
                if (!blob) return alert("Error creating image");
                const file = new File([blob], `invoice_${Date.now()}.png`, { type: "image/png" });

                if (navigator.share) {
                    try {
                        await navigator.share({
                            files: [file],
                            title: 'Invoice',
                            text: `Invoice from ${shopDetails.shopName}`
                        });
                    } catch (err) {
                     console.warn('Share API failed, falling back to download', err);
                     const link = document.createElement('a');
                     link.href = canvas.toDataURL();
                     link.download = `Invoice_${Date.now()}.png`;
                     link.click();
                    }
                } else {
                    const link = document.createElement('a');
                    link.href = canvas.toDataURL();
                    link.download = `Invoice_${Date.now()}.png`;
                    link.click();
                    alert("Invoice Image Downloaded!");
                }
            }, 'image/png');
        } catch (error) {
            console.error(error);
            alert("Failed to generate image.");
        }
    }, 100);
  };

  // --- NOTEPAD FUNCTIONS ---
  
  // Rich Text Formatting Helper
  const execFormat = (command, value = null) => {
    document.execCommand(command, false, value);
    if(contentEditableRef.current) contentEditableRef.current.focus();
  };

  const saveCurrentNote = () => {
    // Get HTML from contentEditable for text mode
    let bodyContent = currentNote.body;
    if(noteMode === 'text' && contentEditableRef.current) {
        bodyContent = contentEditableRef.current.innerHTML;
    }

    if(!currentNote.title && !bodyContent && !currentNote.sketch) { setNotesView('list'); return; }
    
    let sketchData = currentNote.sketch;
    if (canvasRef.current && noteMode === 'draw') {
        sketchData = canvasRef.current.toDataURL();
    }
    const now = new Date().toLocaleString();
    const finalNote = { ...currentNote, body: bodyContent, date: now, sketch: sketchData };
    if(currentNote.id) {
       setNotes(notes.map(n => n.id === currentNote.id ? finalNote : n));
    } else {
       setNotes([{ ...finalNote, id: Date.now() }, ...notes]);
    }
    setNotesView('list');
    setNoteMode('text');
  };

  const deleteNote = (id) => {
     if(window.confirm("Delete note?")) {
        setNotes(notes.filter(n => n.id !== id));
        if(currentNote.id === id) setNotesView('list');
     }
  };

  // --- CANVAS LOGIC ---
  useEffect(() => {
    if (noteMode === 'draw' && canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (currentNote.sketch) {
            const img = new Image();
            img.src = currentNote.sketch;
            img.onload = () => ctx.drawImage(img, 0, 0);
        } else {
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0,0, canvas.width, canvas.height);
        }
    }
  }, [noteMode, currentNote.sketch]);

  const getPos = (e) => {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDrawing = (e) => {
      setIsDrawing(true);
      const pos = getPos(e);
      setStartPos(pos);
      const ctx = canvasRef.current.getContext('2d');
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e) => {
      if (!isDrawing) return;
      const pos = getPos(e);
      const ctx = canvasRef.current.getContext('2d');
      if (brushType === 'circle' || brushType === 'line') return;
      ctx.lineCap = 'round';
      if (brushType === 'pencil') {
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 2;
          ctx.globalAlpha = 1;
      } else if (brushType === 'highlight') {
          ctx.strokeStyle = 'yellow';
          ctx.lineWidth = 15;
          ctx.globalAlpha = 0.3;
      } else if (brushType === 'eraser') {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 20;
          ctx.globalAlpha = 1;
      }
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
  };

  const stopDrawing = (e) => {
      if (!isDrawing) return;
      setIsDrawing(false);
      const pos = getPos(e);
      const ctx = canvasRef.current.getContext('2d');
      if (brushType === 'circle') {
          const radius = Math.sqrt(Math.pow(pos.x - startPos.x, 2) + Math.pow(pos.y - startPos.y, 2));
          ctx.beginPath();
          ctx.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI);
          ctx.strokeStyle = 'red';
          ctx.lineWidth = 3;
          ctx.stroke();
      } else if (brushType === 'line') {
          ctx.beginPath();
          ctx.moveTo(startPos.x, startPos.y);
          ctx.lineTo(pos.x, pos.y);
          ctx.strokeStyle = 'blue';
          ctx.lineWidth = 2;
          ctx.stroke();
      }
  };

  const renderToolContent = () => {
    const commonInputClass = `w-full p-3 rounded-xl border font-bold text-lg mb-4 ${isDark ? 'bg-slate-800 border-slate-600 text-white' : 'bg-gray-50 border-gray-300 text-black'}`;
    const cardClass = `p-6 rounded-2xl shadow-lg border h-full flex flex-col ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`;

    switch (activeTool) {
      case 'invoice':
        return (
          <div className={`${cardClass} overflow-y-auto`}>
             <div className="flex justify-between items-center mb-4 border-b pb-2">
                <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100"><ArrowLeft size={20}/></button>
                <h3 className="font-bold text-xl">Invoice Pro</h3>
                <div className="flex gap-2">
                    <button onClick={shareInvoiceImage} className="p-2 bg-green-600 text-white rounded-lg flex items-center gap-1 text-sm font-bold shadow-md"><Share2 size={16}/> Share</button>
                </div>
             </div>
             
             {/* PREVIEW AREA */}
             <div className="flex justify-center bg-gray-200 p-2 rounded-lg mb-4 overflow-hidden">
                <div className="bg-white text-black p-4 border shadow-xl rounded-sm text-xs w-full max-w-[320px]" id="invoice-area">
                    <div className="text-center border-b-2 border-black pb-2 mb-2">
                        <h2 className="text-lg font-black uppercase tracking-wider">{shopDetails.shopName || "My Shop"}</h2>
                        <p className="text-[9px] uppercase">Invoice / Bill of Supply</p>
                    </div>
                    
                    <div className="flex justify-between mb-2 text-[10px]">
                        <div>
                            <p><strong>To:</strong> {invCust.name}</p>
                            <p>{invCust.phone}</p>
                        </div>
                        <div className="text-right">
                            <p>#{invoiceNumber}</p>
                            <p>{new Date().toLocaleDateString()}</p>
                        </div>
                    </div>

                    <table className="w-full text-left mb-2 border-collapse">
                        <thead>
                            <tr className="border-b-2 border-black text-[10px] uppercase">
                                <th className="py-1">Item</th>
                                <th className="py-1 text-center">Qty</th>
                                <th className="py-1 text-right">Price</th>
                            <th className="py-1 text-right">Total</th>
                            <th className="py-1 text-right">&nbsp;</th>
                            </tr>
                        </thead>
                        <tbody className="text-[10px]">
                          {invItems.map(item => (
                            <tr key={item.id} className="border-b border-gray-100">
                              <td className="py-1">{item.name}</td>
                              <td className="py-1 text-center">{item.qty}</td>
                              <td className="py-1 text-right">{item.rate}</td>
                              <td className="py-1 text-right">{(item.total).toFixed(0)}</td>
                              <td className="py-1 text-right"><button onClick={() => deleteInvItem(item.id)} className="text-red-500 p-1 rounded hover:bg-red-50"><Trash2 size={14}/></button></td>
                            </tr>
                          ))}
                        </tbody>
                    </table>
                    
                    <div className="flex justify-end border-t-2 border-black pt-2">
                        <div className="text-right">
                            <p className="text-base font-bold">TOTAL: ₹ {calculateBillTotal().toFixed(2)}</p>
                        </div>
                    </div>
                    <div className="mt-2 text-center text-[9px] italic">Thank you for your visit!</div>
                </div>
             </div>

             {/* UPDATED: RESTRUCTURED INPUTS FOR MOBILE */}
             <div className="grid grid-cols-2 gap-2 mb-2">
                 <input className="p-2 border rounded" placeholder="Customer Name" value={invCust.name} onChange={e=>setInvCust({...invCust, name: e.target.value})} />
                 <input className="p-2 border rounded" placeholder="Mobile Number" value={invCust.phone} onChange={e=>setInvCust({...invCust, phone: e.target.value})} />
             </div>

             <div className="bg-gray-50 p-3 rounded-lg border mb-4 text-black">
                 {/* Item Name - Full Width */}
                 <div className="mb-2">
                     <input className="w-full p-2 border rounded font-bold" placeholder="Item Name" value={invCurrentItem.name} onChange={e=>setInvCurrentItem({...invCurrentItem, name: e.target.value})} />
                 </div>
                 
                 {/* Grid for Qty, Rate, and Add Button */}
                 <div className="grid grid-cols-3 gap-2">
                     <div className="col-span-1">
                         <input type="number" className="w-full p-2 border rounded font-bold" placeholder="Qty" value={invCurrentItem.qty} onChange={e=>setInvCurrentItem({...invCurrentItem, qty: parseInt(e.target.value)||1})} />
                     </div>
                     <div className="col-span-1">
                         <input type="number" className="w-full p-2 border rounded" placeholder="Rate" value={invCurrentItem.rate || ''} onChange={e=>setInvCurrentItem({...invCurrentItem, rate: parseFloat(e.target.value)})} />
                     </div>
                     <div className="col-span-1">
                         <button onClick={addInvItem} className="w-full h-full bg-indigo-600 text-white rounded font-bold flex items-center justify-center"><Plus size={20}/></button>
                     </div>
                 </div>
             </div>
             
             {invItems.length > 0 && 
                <button onClick={() => setInvItems([])} className="text-red-500 text-xs text-center w-full bg-red-50 p-2 rounded">Clear All Items</button>
             }
          </div>
        );

      case 'translator':
        return (
            <div className={cardClass}>
                <h3 className="font-bold text-xl mb-4">English to Hindi Translator</h3>
                <div className="flex gap-2 mb-2">
                    <input className={commonInputClass} placeholder="Type in English..." value={transInput} onChange={e => setTransInput(e.target.value)} />
                    <VoiceInput onResult={setTransInput} isDark={isDark} />
                </div>
                <div className="flex-1 bg-yellow-50 rounded-xl p-4 border border-yellow-200">
                    <p className="text-xs text-yellow-700 font-bold mb-2">HINDI OUTPUT:</p>
                    <p className="text-2xl font-bold text-black">{convertToHindi(transInput)}</p>
                </div>
                <button onClick={() => {navigator.clipboard.writeText(convertToHindi(transInput)); alert("Copied!")}} className="mt-4 w-full py-3 bg-blue-600 text-white font-bold rounded-xl flex items-center justify-center gap-2"><Copy size={18}/> Copy Hindi Text</button>
            </div>
        );
      case 'gst': {
        const price = parseFloat(gstInput.price) || 0;
        let gstAmt = 0, finalAmt = 0, baseAmt = 0;
        if(gstInput.isReverse) {
          baseAmt = (price * 100) / (100 + gstInput.rate);
          gstAmt = price - baseAmt;
          finalAmt = price;
        } else {
          baseAmt = price;
          gstAmt = (price * gstInput.rate) / 100;
          finalAmt = price + gstAmt;
        }
        return (
           <div className={cardClass}>
             <div className="flex justify-between items-center mb-4">
                 <h3 className="font-bold text-xl">GST Calculator</h3>
                 <button onClick={() => setGstInput({...gstInput, isReverse: !gstInput.isReverse})} className={`text-xs px-3 py-1 rounded-full border ${gstInput.isReverse ? 'bg-green-100 text-green-700 border-green-500' : 'bg-gray-100 text-gray-600'}`}>
                     {gstInput.isReverse ? "Inclusive (Reverse)" : "Exclusive (Add)"}
                 </button>
             </div>
             <input type="number" placeholder="Enter Amount (₹)" className={commonInputClass} value={gstInput.price} onChange={e => setGstInput({...gstInput, price: e.target.value})} />
             <div className="flex gap-2 mb-4">
               {[5, 12, 18, 28].map(r => (
                 <button key={r} onClick={() => setGstInput({...gstInput, rate: r})} className={`flex-1 py-2 rounded-lg font-bold border ${gstInput.rate === r ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>{r}%</button>
               ))}
             </div>
             <div className="bg-blue-50 p-4 rounded-xl text-blue-900 border border-blue-100 mb-4">
               <div className="flex justify-between mb-1 opacity-70 text-sm"><span>Base Amount</span> <span>₹{baseAmt.toFixed(2)}</span></div>
               <div className="flex justify-between mb-1"><span>GST ({gstInput.rate}%)</span> <span>₹{gstAmt.toFixed(2)}</span></div>
               <div className="flex justify-between text-2xl font-bold border-t border-blue-200 pt-2 mt-2"><span>Total</span> <span>₹{finalAmt.toFixed(2)}</span></div>
             </div>
             <button onClick={() => navigator.clipboard.writeText(`Base: ${baseAmt.toFixed(2)}\nGST: ${gstAmt.toFixed(2)}\nTotal: ${finalAmt.toFixed(2)}`)} className="w-full py-3 bg-gray-200 rounded-xl font-bold text-gray-700 flex items-center justify-center gap-2"><Copy size={16}/> Copy Result</button>
           </div>
           );
          }
      case 'margin':
         return (
           <div className={cardClass}>
               <div className="flex justify-between items-center mb-4">
                 <h3 className="font-bold text-xl">Profit & Margin</h3>
                 <button onClick={() => setMarginInput({cost: '', sell: '', discount: 0, mode: marginInput.mode})} className="text-xs text-red-500 font-bold">RESET</button>
               </div>
               <div className="flex gap-2 mb-4 bg-gray-100 p-1 rounded-lg">
                  <button onClick={() => setMarginInput({...marginInput, mode: 'profit'})} className={`flex-1 py-2 rounded-md font-bold text-sm ${marginInput.mode === 'profit' ? 'bg-white shadow text-purple-600' : 'text-gray-500'}`}>Profit Analysis</button>
                  <button onClick={() => setMarginInput({...marginInput, mode: 'discount'})} className={`flex-1 py-2 rounded-md font-bold text-sm ${marginInput.mode === 'discount' ? 'bg-white shadow text-purple-600' : 'text-gray-500'}`}>Discount Calc</button>
               </div>
               {marginInput.mode === 'profit' ? (
                  <>
                      <input type="number" placeholder="Buying Cost (₹)" className={commonInputClass} value={marginInput.cost} onChange={e => setMarginInput({...marginInput, cost: e.target.value})} />
                      <input type="number" placeholder="Selling Price (₹)" className={commonInputClass} value={marginInput.sell} onChange={e => setMarginInput({...marginInput, sell: e.target.value})} />
                      {marginInput.cost && marginInput.sell && (
                          <div className={`p-4 rounded-xl border mt-2 ${parseFloat(marginInput.sell) >= parseFloat(marginInput.cost) ? 'bg-green-50 text-green-900 border-green-200' : 'bg-red-50 text-red-900 border-red-200'}`}>
                             <div className="flex justify-between text-lg font-bold">
                                <span>Profit/Loss</span>
                                <span>₹{(parseFloat(marginInput.sell) - parseFloat(marginInput.cost)).toFixed(2)}</span>
                             </div>
                             <div className="flex justify-between text-sm mt-1 opacity-80">
                                <span>Margin</span>
                                <span>{(((parseFloat(marginInput.sell) - parseFloat(marginInput.cost)) / parseFloat(marginInput.sell)) * 100).toFixed(2)}%</span>
                             </div>
                          </div>
                      )}
                  </>
               ) : (
                  <>
                      <input type="number" placeholder="Original Price (₹)" className={commonInputClass} value={marginInput.cost} onChange={e => setMarginInput({...marginInput, cost: e.target.value})} />
                      <input type="number" placeholder="Discount %" className={commonInputClass} value={marginInput.discount} onChange={e => setMarginInput({...marginInput, discount: e.target.value})} />
                      <div className="bg-purple-50 p-4 rounded-xl text-purple-900 border border-purple-100">
                         <div className="flex justify-between mb-1"><span>You Save</span> <span>₹{((parseFloat(marginInput.cost) * marginInput.discount) / 100 || 0).toFixed(2)}</span></div>
                         <div className="flex justify-between text-xl font-bold border-t border-purple-200 pt-2 mt-2"><span>Payable</span> <span>₹{(parseFloat(marginInput.cost) - ((parseFloat(marginInput.cost) * marginInput.discount) / 100) || 0).toFixed(2)}</span></div>
                      </div>
                  </>
               )}
           </div>
         );
      case 'converter': {
        const val = parseFloat(convInput.val) || 0;
        let res = 0;
        let unit = '';
        if(convInput.type === 'kgToTon') { res = val / 1000; unit = 'Tons'; }
        else if(convInput.type === 'tonToKg') { res = val * 1000; unit = 'KG'; }
        else if(convInput.type === 'oil') { res = val * 0.91; unit = 'KG (approx)'; } 
        else if(convInput.type === 'feetToM') { res = val * 0.3048; unit = 'Meters'; }
        return (
           <div className={cardClass}>
             <h3 className="font-bold mb-4 text-xl">Pro Converter</h3>
             <select className={commonInputClass} value={convInput.type} onChange={e => setConvInput({...convInput, type: e.target.value})}>
                 <option value="kgToTon">KG to Tons</option>
                 <option value="tonToKg">Tons to KG</option>
                 <option value="oil">Liters to KG (Oil)</option>
                 <option value="feetToM">Feet to Meters</option>
             </select>
             <input type="number" placeholder="Enter Value" className={commonInputClass} value={convInput.val} onChange={e => setConvInput({...convInput, val: e.target.value})} />
             <div className={`p-6 rounded-xl font-mono text-3xl font-bold text-center mt-4 ${isDark ? 'bg-slate-700' : 'bg-gray-100'}`}>
                 {res.toFixed(3)} <span className="text-sm opacity-50">{unit}</span>
             </div>
           </div>
         );
        }
      case 'card':
         return (
           <div className={cardClass}>
             <h3 className="font-bold mb-4 text-xl">Digital Card</h3>
             <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white p-6 rounded-xl shadow-2xl mb-4 relative overflow-hidden transform transition-transform hover:scale-105 duration-300">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-bl-full"></div>
                <div className="absolute bottom-0 left-0 w-16 h-16 bg-yellow-500/20 rounded-tr-full"></div>
                <h2 className="text-3xl font-bold text-yellow-400 mb-1 tracking-tight">{shopDetails.shopName || "MY SHOP"}</h2>
                <p className="text-xs opacity-70 mb-8 uppercase tracking-widest">Deals in: All Car Parts & Accessories</p>
                <div className="text-sm space-y-2 font-medium">
                  <p className="flex items-center gap-2"><Phone size={14} className="text-yellow-500"/> +91 98765 43210</p>
                  <p className="flex items-center gap-2"><Store size={14} className="text-yellow-500"/> Main Market, City Name</p>
                </div>
             </div>
             <p className="text-center text-xs opacity-50">Take a screenshot to share on WhatsApp</p>
           </div>
         );
      case 'notes':
         // 📝 UPDATED NOTEPAD UI
         if(notesView === 'list') {
           const filteredNotes = notes.filter(n => n.title.toLowerCase().includes(noteSearch.toLowerCase()));
           return (
               <div className={`h-[80vh] flex flex-col ${cardClass} p-0 overflow-hidden`}>
                   <div className="p-4 border-b flex gap-2 items-center bg-yellow-50/50">
                       <Search size={18} className="text-yellow-600"/>
                       <input className="bg-transparent w-full outline-none text-sm font-bold" placeholder="Search notes..." value={noteSearch} onChange={e=>setNoteSearch(e.target.value)} />
                   </div>
                   <div className="flex-1 overflow-y-auto p-2 space-y-2">
                       {filteredNotes.length === 0 && <div className="text-center mt-10 opacity-40 font-bold">No notes found.<br/>Tap + to create.</div>}
                       {filteredNotes.map(note => (
                           <div key={note.id} onClick={() => { setCurrentNote(note); setNotesView('editor'); setNoteMode(note.sketch ? 'draw' : 'text'); }} className="p-4 rounded-xl border bg-white shadow-sm hover:shadow-md transition-all cursor-pointer relative group">
                               <h4 className="font-bold text-lg mb-1 truncate pr-8">{note.title || "Untitled Note"}</h4>
                               <p className="text-xs text-gray-500 line-clamp-1">
                                   {note.body ? note.body.replace(/<[^>]*>?/gm, '') : (note.sketch ? "Contains Drawing" : "No text")}
                               </p>
                               {note.sketch && <div className="mt-2 h-10 w-full bg-gray-100 rounded overflow-hidden"><img src={note.sketch} className="h-full object-contain opacity-50"/></div>}
                               <span className="text-[10px] text-gray-400 mt-2 block flex items-center gap-1"><Calendar size={10}/> {note.date}</span>
                               <button onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }} className="absolute top-2 right-2 p-2 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16}/></button>
                           </div>
                       ))}
                   </div>
                   <button onClick={() => { setCurrentNote({id:null, title:'', body:'', date:'', sketch:null}); setNotesView('editor'); setNoteMode('text'); }} className="absolute bottom-6 right-6 bg-yellow-500 text-white p-4 rounded-full shadow-xl hover:scale-105 transition-transform"><Plus size={24}/></button>
               </div>
           );
         } else {
             // RICH EDITOR
             return (
                 <div className={`h-[80vh] flex flex-col ${cardClass} p-0`}>
                     <div className="p-3 border-b flex justify-between items-center bg-yellow-50">
                         <button onClick={saveCurrentNote} className="flex items-center gap-1 text-sm font-bold text-gray-600"><ChevronRight className="rotate-180" size={16}/> Back</button>
                         <div className="flex bg-white rounded-lg p-1 border">
                            <button onClick={()=>setNoteMode('text')} className={`p-1 px-3 rounded text-xs font-bold ${noteMode==='text' ? 'bg-yellow-100 text-yellow-700' : 'text-gray-400'}`}><Type size={14}/></button>
                            <button onClick={()=>setNoteMode('draw')} className={`p-1 px-3 rounded text-xs font-bold ${noteMode==='draw' ? 'bg-yellow-100 text-yellow-700' : 'text-gray-400'}`}><PenTool size={14}/></button>
                         </div>
                         <div className="flex items-center gap-2">
                            <button onClick={saveCurrentNote} className="text-yellow-600 font-bold text-sm">Save</button>
                         </div>
                     </div>
                     <input className="p-4 text-xl font-bold outline-none bg-transparent border-b" placeholder="Title" value={currentNote.title} onChange={e => setCurrentNote({...currentNote, title: convertToHindi(e.target.value)})} />
                     
                     {noteMode === 'text' ? (
                        <>
                            {/* UPDATED: RICH TEXT TOOLBAR */}
                            <div className="flex gap-1 p-2 bg-gray-50 border-b overflow-x-auto">
                                <button className="p-2 hover:bg-gray-200 rounded" onMouseDown={(e) => {e.preventDefault(); execFormat('bold');}}><Bold size={16}/></button>
                                <button className="p-2 hover:bg-gray-200 rounded" onMouseDown={(e) => {e.preventDefault(); execFormat('italic');}}><Italic size={16}/></button>
                                <button className="p-2 hover:bg-gray-200 rounded" onMouseDown={(e) => {e.preventDefault(); execFormat('underline');}}><Underline size={16}/></button>
                                <button className="p-2 hover:bg-gray-200 rounded bg-yellow-100" onMouseDown={(e) => {e.preventDefault(); execFormat('hiliteColor', 'yellow');}}><Highlighter size={16} className="text-yellow-600"/></button>
                            </div>
                            <div 
                                ref={contentEditableRef}
                                className="flex-1 p-4 resize-none outline-none text-base leading-relaxed bg-transparent overflow-y-auto"
                                contentEditable={true}
                                dangerouslySetInnerHTML={{__html: currentNote.body || ''}}
                                placeholder="Start typing..."
                            ></div>
                        </>
                     ) : (
                        <div className="flex-1 relative bg-white overflow-hidden touch-none">
                           <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-white shadow-lg border rounded-full p-1 flex gap-2 z-10">
                               <button onClick={()=>setBrushType('pencil')} className={`p-2 rounded-full ${brushType==='pencil' ? 'bg-black text-white' : 'hover:bg-gray-100'}`}><PenTool size={16}/></button>
                               <button onClick={()=>setBrushType('highlight')} className={`p-2 rounded-full ${brushType==='highlight' ? 'bg-yellow-300 text-yellow-900' : 'hover:bg-gray-100'}`}><Highlighter size={16}/></button>
                               <button onClick={()=>setBrushType('circle')} className={`p-2 rounded-full ${brushType==='circle' ? 'bg-red-100 text-red-600' : 'hover:bg-gray-100'}`}><CircleIcon size={16}/></button>
                               <button onClick={()=>setBrushType('line')} className={`p-2 rounded-full ${brushType==='line' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}><Minus size={16}/></button>
                               <button onClick={()=>setBrushType('eraser')} className={`p-2 rounded-full ${brushType==='eraser' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}><Eraser size={16}/></button>
                           </div>
                           <canvas 
                               ref={canvasRef}
                               className="w-full h-full cursor-crosshair touch-none"
                               width={window.innerWidth > 400 ? 400 : window.innerWidth} 
                               height={600}
                               onMouseDown={startDrawing}
                               onMouseMove={draw}
                               onMouseUp={stopDrawing}
                               onTouchStart={startDrawing}
                               onTouchMove={draw}
                               onTouchEnd={stopDrawing}
                           />
                        </div>
                     )}
                 </div>
             );
         }
      default: return null;
    }
  };

  return (
    <div className={`fixed inset-0 z-[60] overflow-y-auto ${isDark ? 'bg-slate-950 text-white' : 'bg-gray-50 text-black'}`}>
      <div className={`sticky top-0 p-4 border-b flex items-center gap-3 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
        {activeTool ? (
          <button onClick={() => { if(notesView==='editor') saveCurrentNote(); setActiveTool(null); }} className="p-2 rounded-full hover:bg-gray-100/10"><ArrowLeft size={24}/></button>
        ) : (
          <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100/10"><ArrowLeft size={24}/></button>
        )}
        <h1 className="text-xl font-bold">{activeTool ? tools.find(toolItem => toolItem.id === activeTool).name : t("Business Tools")}</h1>
      </div>

      <div className="p-4 max-w-md mx-auto min-h-screen">
        {!activeTool && (
          <div className="grid grid-cols-2 gap-4 mt-4">
            {tools.map(tool => {
               const isPinned = pinnedTools.includes(tool.id);
               return (
                <div key={tool.id} className={`relative p-6 rounded-2xl border flex flex-col items-center justify-center gap-3 transition-transform ${isDark ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : 'bg-white border-gray-200 hover:border-blue-400 shadow-sm'}`}>
                  <div onClick={() => { setActiveTool(tool.id); setNotesView('list'); }} className="flex flex-col items-center justify-center w-full cursor-pointer">
                    <div className={`p-4 rounded-full ${tool.color}`}>{tool.icon}</div>
                    <span className="font-bold text-sm text-center mt-3">{t(tool.name)}</span>
                  </div>
                  {/* Pin Button */}
                  <button onClick={(e) => { e.stopPropagation(); onTogglePin(tool.id); }} className={`absolute top-2 right-2 p-2 rounded-full ${isPinned ? 'text-blue-500 bg-blue-50' : 'text-gray-300 hover:text-gray-500'}`}>
                      {isPinned ? <Pin size={16} fill="currentColor"/> : <Pin size={16}/>}
                  </button>
                </div>
               );
            })}
            <div className="col-span-2 text-center text-xs opacity-50 mt-4">
                Tip: Click the <Pin size={10} className="inline"/> icon to add tools to Home Screen.
            </div>
          </div>
        )}
        {activeTool && <div className="animate-in slide-in-from-right duration-300 mt-4 h-full">{renderToolContent()}</div>}
      </div>
    </div>
  );
};

// ... (Rest of your components: ConfirmationModal, LegalModal, EntryRow, VoiceInput, ImageModal, NavBtn stay the same)

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, isDanger, t, isDark }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/80 z-[90] flex items-center justify-center p-4 animate-in fade-in">
        <div className={`w-full max-w-sm rounded-2xl p-6 shadow-2xl transform transition-all scale-100 ${isDark ? 'bg-slate-800 text-white' : 'bg-white text-black'}`}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${isDanger ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                {isDanger ? <Trash2 size={24}/> : <AlertCircle size={24}/>}
            </div>
            <h3 className="text-xl font-bold mb-2">{t(title)}</h3>
            <p className="text-sm opacity-70 mb-6 font-medium">{t(message)}</p>
            <div className="flex gap-3">
                <button onClick={onClose} className={`flex-1 py-3 rounded-xl font-bold transition-colors ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
                    {t("Cancel")}
                </button>
                <button onClick={onConfirm} className={`flex-1 py-3 rounded-xl font-bold text-white shadow-lg transition-transform active:scale-95 ${isDanger ? 'bg-red-600 hover:bg-red-500 shadow-red-500/30' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/30'}`}>
                    {t(isDanger ? "Yes, Delete" : "Confirm")}
                </button>
            </div>
        </div>
    </div>
  );
};

const LegalModal = ({ isOpen, onClose, type, t, isDark }) => {
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4">
        <div className={`w-full max-w-md rounded-2xl p-6 shadow-2xl max-h-[80vh] overflow-y-auto ${isDark ? 'bg-slate-900 text-white' : 'bg-white text-black'}`}>
            <div className="flex justify-between items-center mb-4 border-b pb-2">
                <h3 className="text-xl font-bold flex items-center gap-2">
                    {type === 'privacy' ? <FileText className="text-blue-500"/> : <HelpCircle className="text-yellow-500"/>}
                    {type === 'privacy' ? t("Privacy & Policy") : t("FAQ")}
                </h3>
                <button onClick={onClose}><X size={24}/></button>
            </div>
            
            {type === 'privacy' ? (
                <div className="space-y-4 text-sm opacity-80 leading-relaxed">
                    <p><strong>Last Updated:</strong> Oct 2025</p>
                    <p>Welcome to <strong>Dukan Register</strong>, developed by <strong>AutomationX</strong>.</p>
                    <p>1. <strong>Data Security:</strong> Your data is stored securely on Google Firebase servers. We do not sell your shop data.</p>
                    <p>2. <strong>Usage:</strong> This app is intended for inventory management purposes only.</p>
                    <p>3. <strong>Liability:</strong> AutomationX is not responsible for any physical stock discrepancies.</p>
                    <p className="mt-4 pt-4 border-t text-xs">For legal inquiries, contact: support@automationx.com</p>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="border rounded-lg p-3">
                        <p className="font-bold text-blue-500 mb-1">Q: How to add a new item?</p>
                        <p className="text-sm opacity-80">A: Go to a Page, click the (+) button, and enter the car name.</p>
                    </div>
                    <div className="border rounded-lg p-3">
                        <p className="font-bold text-blue-500 mb-1">Q: How to delete a page?</p>
                        <p className="text-sm opacity-80">A: Go to 'Pages List', click the Edit icon, and select 'Delete'.</p>
                    </div>
                    <div className="border rounded-lg p-3">
                        <p className="font-bold text-blue-500 mb-1">Q: Password Reset?</p>
                        <p className="text-sm opacity-80">A: Contact AutomationX support with your Customer ID.</p>
                    </div>
                </div>
            )}
        </div>
      </div>
    );
};

const EntryRow = React.memo(({ entry, t, isDark, onUpdateBuffer, onEdit, limit, tempQty, index }) => {
    const displayQty = tempQty !== undefined ? tempQty : entry.qty;
    const isChanged = tempQty !== undefined;
    
    return (
        <div className={`flex items-center px-3 py-2 border-b ${isDark ? 'border-slate-800 bg-slate-900' : 'border-gray-200 bg-white'}`}>
            <div className="w-6 text-xs font-bold opacity-40">#{index + 1}</div>
            <div className="flex-[2] text-base font-bold truncate pr-2 leading-tight">{t(entry.car)}</div>
            
            <div className="flex items-center justify-center gap-3 bg-gray-50 rounded-lg p-1 border border-gray-100">
                <button onClick={() => onUpdateBuffer(entry.id, -1, entry.qty)} className="w-8 h-8 rounded bg-white border shadow-sm text-red-600 flex items-center justify-center active:bg-red-100 transition-colors"><Minus size={16}/></button>
                <span className={`text-lg font-mono font-bold w-8 text-center ${isChanged ? 'text-blue-500' : (displayQty < limit ? 'text-red-500 animate-pulse' : 'text-slate-700')}`}>{displayQty}</span>
                <button onClick={() => onUpdateBuffer(entry.id, 1, entry.qty)} className="w-8 h-8 rounded bg-white border shadow-sm text-green-600 flex items-center justify-center active:bg-green-100 transition-colors"><Plus size={16}/></button>
            </div>
            
            <button onClick={() => onEdit(entry)} className="ml-3 p-2 text-gray-400 hover:text-blue-500 active:scale-90 transition-transform bg-gray-50 rounded-full border border-gray-100">
                <Edit size={16}/>
            </button>
        </div>
    );
});

const VoiceInput = ({ onResult, isDark }) => {
  const startListening = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-IN'; 
      recognition.onresult = (e) => onResult(e.results[0][0].transcript);
      try { recognition.start(); } catch (e) { console.error(e); }
    } else { alert("Mic Error"); }
  };
  return (
    <button onClick={startListening} className={`p-3 rounded-full shrink-0 ${isDark ? 'bg-slate-700 text-white' : 'bg-gray-100 text-black hover:bg-gray-200'}`}>
      <Mic size={20}/>
    </button>
  );
};

// 🖼️ FULL SCREEN IMAGE MODAL
const ImageModal = ({ src, onClose, onDelete }) => {
    const [zoom, setZoom] = useState(false);
    if (!src) return null;
    return (
        <div className="fixed inset-0 bg-black z-[120] flex flex-col justify-center items-center p-4">
            <button onClick={onClose} className="absolute top-4 right-4 text-white bg-white/20 p-3 rounded-full"><X/></button>
            <div className={`overflow-auto ${zoom ? 'cursor-zoom-out' : 'cursor-zoom-in'} w-full h-full flex items-center justify-center`} onClick={() => setZoom(z => !z)}>
                <img src={src} className={`object-contain transition-transform duration-150 ${zoom ? 'scale-125 max-w-none max-h-none' : 'max-w-full max-h-[80vh]'}`} alt="Bill" />
            </div>
            <div className="mt-4 flex gap-3">
              <button onClick={onDelete} className="bg-red-600 text-white px-6 py-3 rounded-xl font-bold flex gap-2"><Trash2/> Delete Photo</button>
              <button onClick={() => setZoom(z => !z)} className="bg-white text-black px-4 py-2 rounded">{zoom ? 'Exit Zoom' : 'Zoom'}</button>
            </div>
        </div>
    );
};


const NavBtn = ({ icon, label, active, onClick, alert }) => (
  <button onClick={onClick} className={`relative flex-1 flex flex-col items-center p-2 rounded-xl transition-all ${active ? 'text-blue-600 bg-blue-50 dark:bg-slate-800 dark:text-blue-400' : 'text-gray-400 dark:text-slate-500'}`}>
    {icon && React.createElement(icon, { size: 24, strokeWidth: active ? 2.5 : 2 })}
    <span className="text-[10px] font-bold mt-1 text-center leading-none">{label}</span>
    {alert && <span className="absolute top-1 right-3 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-bounce"></span>}
  </button>
);


const defaultData = { 
  pages: [], 
  entries: [], 
  bills: [], 
  settings: { limit: 5, theme: 'light', productPassword: '0000', shopName: 'Dukan Register', pinnedTools: [] },
  appStatus: 'active'
};


function DukanRegister() {
  useEffect(() => {
    console.info('DukanRegister mounted', { tabId: window.__dukan_tabId, time: Date.now() });
    return () => console.info('DukanRegister unmounted', { tabId: window.__dukan_tabId, time: Date.now() });
  }, []);

  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const [data, setData] = useState(defaultData);
  const [dbLoading, setDbLoading] = useState(false);
  const [fbDocId, setFbDocId] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
    
  const [view, setView] = useState('generalIndex'); 
  const [activePageId, setActivePageId] = useState(null);
  const [activeToolId, setActiveToolId] = useState(null);

  // Upload concurrency control to avoid heavy CPU/network bursts
  const uploadConcurrency = useRef(0);
  const uploadQueue = useRef([]);
  const MAX_CONCURRENT_UPLOADS = 3;
  const scheduleUpload = useCallback((fn) => {
    if (uploadConcurrency.current < MAX_CONCURRENT_UPLOADS) {
      uploadConcurrency.current += 1;
      (async () => {
        try { await fn(); } catch (err) { console.warn('Scheduled upload failed', err); }
        finally {
          uploadConcurrency.current -= 1;
          if (uploadQueue.current.length) {
            const next = uploadQueue.current.shift();
            scheduleUpload(next);
          }
        }
      })();
    } else {
      uploadQueue.current.push(fn);
    }
  }, []);

  
  const [pageSearchTerm, setPageSearchTerm] = useState(''); 
  const [indexSearchTerm, setIndexSearchTerm] = useState(''); 
  const [stockSearchTerm, setStockSearchTerm] = useState(''); 
  const [isHindi, setIsHindi] = useState(false);
  const [isSafeMode, setIsSafeMode] = useState(true); 
  const [tempChanges, setTempChanges] = useState({}); 

  const [displayLimit, setDisplayLimit] = useState(50);

  const [settingsUnlocked, setSettingsUnlocked] = useState(false);
  const [settingsPassInput, setSettingsPassInput] = useState('');
  const [savePassInput, setSavePassInput] = useState(''); 
    
  const [newProductPass, setNewProductPass] = useState(''); 
  const [isNewPageOpen, setIsNewPageOpen] = useState(false);
  const [isNewEntryOpen, setIsNewEntryOpen] = useState(false);
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false); 
  
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isFaqOpen, setIsFaqOpen] = useState(false);
  const [tempLimit, setTempLimit] = useState(5); 

  const [editingEntry, setEditingEntry] = useState(null); 
  const [managingPage, setManagingPage] = useState(null); 
  
  const [input, setInput] = useState({ itemName: '', carName: '', qty: '' });
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [notifPermission, setNotifPermission] = useState('default');
  const [toast, setToast] = useState(null);
  
  // 🖼️ IMAGE STATE
  const [viewImage, setViewImage] = useState(null);

  const [confirmConfig, setConfirmConfig] = useState({
      isOpen: false,
      title: '',
      message: '',
      isDanger: false,
      onConfirm: () => {}
  });

  const audioRef = useRef(null);

  const t = useCallback((text) => {
    if (!isHindi) return text;
    return convertToHindi(text);
  }, [isHindi]);

  // Keep a ref to `data` so snapshot handler can merge transient local state without triggering
  // extra effect dependencies (avoids re-subscribing to Firestore on every local state change).
  const dataRef = useRef(data);
  useEffect(() => { dataRef.current = data; }, [data]);

    const showToast = useCallback((message, type = 'success') => {
      setToast({ message, type });
    }, [setToast]);

  useEffect(() => {
      setDisplayLimit(50);
      window.scrollTo(0,0);
  }, [view, activePageId, indexSearchTerm, stockSearchTerm, pageSearchTerm]);

  const triggerConfirm = (title, message, isDanger, action) => {
      setConfirmConfig({
          isOpen: true,
          title,
          message,
          isDanger,
          onConfirm: () => {
              action();
              setConfirmConfig(prev => ({ ...prev, isOpen: false }));
          }
      });
  };

  const activePage = useMemo(() => {
    return (data.pages || []).find(p => p.id === activePageId);
  }, [data.pages, activePageId]);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!user) return;
    setDbLoading(true);
    window.addEventListener('online', () => setIsOnline(true));
    window.addEventListener('offline', () => setIsOnline(false));

    const unsubDb = onSnapshot(doc(db, "appData", user.uid), (docSnapshot) => {
      if (docSnapshot.exists()) {
        // store doc id for diagnostics / admin contact display
        setFbDocId(docSnapshot.id);
        const cloudData = docSnapshot.data();
        if(!cloudData.settings) cloudData.settings = defaultData.settings;
        if(!cloudData.settings.pinnedTools) cloudData.settings.pinnedTools = []; 
        if(!cloudData.settings.shopName) cloudData.settings.shopName = 'Dukan Register';
        if(!cloudData.appStatus) cloudData.appStatus = 'active';
            
        if(!Array.isArray(cloudData.pages)) cloudData.pages = [];
        if(!Array.isArray(cloudData.entries)) cloudData.entries = [];
        if(!Array.isArray(cloudData.bills)) cloudData.bills = []; 
        if(!cloudData.settings.productPassword) cloudData.settings.productPassword = '0000';

        if(cloudData.settings.limit) setTempLimit(cloudData.settings.limit);

        // Merge transient local state (previewUrl, uploading/progress/tempBlob, uploadFailed)
        const localBills = (dataRef.current && dataRef.current.bills) ? dataRef.current.bills : [];
        const localMap = new Map(localBills.map(b => [b.id, b]));

        const mergedBills = (cloudData.bills || []).map(cb => {
          const local = localMap.get(cb.id);
          if (!local) return cb;
          return { ...cb,
            previewUrl: local.previewUrl || local.image || null,
            uploading: local.uploading || false,
            progress: typeof local.progress === 'number' ? local.progress : 0,
            tempBlob: local.tempBlob,
            uploadFailed: local.uploadFailed || false
          };
        });

        // Include any local-only bills (not yet in cloud) at the front so they remain visible
        const cloudIds = new Set((cloudData.bills || []).map(b => b.id));
        const localOnly = localBills.filter(b => !cloudIds.has(b.id));

        const finalData = { ...cloudData, bills: [...localOnly, ...mergedBills] };

        setData(finalData);
      } else {
        setDoc(doc(db, "appData", user.uid), defaultData);
      }
        setDbLoading(false);
    }, (error) => console.error("DB Error:", error));
    return () => unsubDb();
  }, [user]);

  const handleAuth = async (e) => {
    e.preventDefault();
    if(!email || !password) { showToast("Please fill details", "error"); return; }
    try {
      if(isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
        showToast("Account Created!");
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error) { showToast(error.message, "error"); }
  };

  const handleLogout = () => {
    triggerConfirm("Logout?", "Are you sure you want to Logout?", true, () => {
        signOut(auth);
        setData(defaultData);
        setEmail(''); setPassword('');
    });
  };

  const pushToFirebase = async (newData) => {
      if(!user) return false;

      // Try to write immediately with retries; fall back to queued local writes on persistent failure
      const trySet = async (attempts = 3) => {
        for (let i = 1; i <= attempts; i++) {
          try {
            await setDoc(doc(db, "appData", user.uid), newData);
            return true;
          } catch (err) {
            // If offline or persistence disabled, break and queue
            const msg = String(err && err.message ? err.message : err);
            console.warn(`pushToFirebase attempt ${i} failed:`, msg);
            if (i === attempts) throw err;
            await new Promise(res => setTimeout(res, 300 * i));
          }
        }
        return false;
      };

      try {
        const res = await trySet(3);
        return res;
      } catch (err) {
        // Queue for later sync
        try {
          const key = 'dukan:pendingWrites';
          const raw = localStorage.getItem(key);
          const list = raw ? JSON.parse(raw) : [];
          list.push({ id: Date.now() + '-' + Math.random().toString(36).slice(2,8), data: newData, ts: Date.now(), attempts: 0 });
          localStorage.setItem(key, JSON.stringify(list));
          showToast(t('Saved locally. Will retry sync.'), 'error');
        } catch (e) {
          console.error('Failed to queue write', e);
          showToast(t('Save Failed: ') + (err && err.message ? err.message : String(err)), 'error');
        }
        return false;
      }
  };

  // Process pending writes persisted in localStorage
  const processPendingWrites = useCallback(async () => {
    if (!user) return;
    try {
      const key = 'dukan:pendingWrites';
      const raw = localStorage.getItem(key);
      if (!raw) return;
      const list = JSON.parse(raw) || [];
      const remaining = [];
      for (const item of list) {
        try {
          await setDoc(doc(db, 'appData', user.uid), item.data);
        } catch {
          const attempts = (item.attempts || 0) + 1;
          if (attempts >= 5) {
            console.warn('Dropping pending write after max attempts', item.id);
            continue;
          }
          remaining.push({ ...item, attempts });
        }
      }
      if (remaining.length) localStorage.setItem(key, JSON.stringify(remaining)); else localStorage.removeItem(key);
    } catch (e) {
      console.warn('Error processing pending writes', e);
    }
  }, [user]);

  useEffect(() => {
    // Try to sync pending writes when online or when user signs in
    processPendingWrites();
    window.addEventListener('online', processPendingWrites);
    return () => window.removeEventListener('online', processPendingWrites);
  }, [processPendingWrites]);

  // Periodic local backup and an export helper to avoid data loss
  useEffect(() => {
    const id = setInterval(() => {
      try { localStorage.setItem('dukan:backup', JSON.stringify(data)); } catch (e) { console.warn('Backup failed', e); }
    }, 1000 * 60 * 5); // every 5 minutes
    return () => clearInterval(id);
  }, [data]);

  const exportDataToFile = () => {
    try {
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `dukan-backup-${Date.now()}.json`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 3000);
      showToast(t('Backup exported'));
    } catch (e) { console.warn('Export failed', e); showToast(t('Backup failed'), 'error'); }
  };
  try { window.__dukan_exportData = exportDataToFile; } catch { /* noop */ }

  const handleTogglePin = async (toolId) => {
      const currentPins = data.settings.pinnedTools || [];
      let newPins;
      if (currentPins.includes(toolId)) {
          newPins = currentPins.filter(id => id !== toolId);
          showToast("Tool Removed from Home");
      } else {
          newPins = [...currentPins, toolId];
          showToast("Tool Added to Home");
      }
      await pushToFirebase({ ...data, settings: { ...data.settings, pinnedTools: newPins } });
  };

  const compressImage = (file) => {
    // Faster compression: use createImageBitmap + binary search on quality, then downscale if needed.
    // Target is <= 100KB for instant add UX.
    return (async () => {
      const TARGET_MIN = 20 * 1024; // allow lower floor if necessary
      const TARGET_MAX = 100 * 1024; // target <= 100KB
      const MAX_WIDTH = 900; // reduce max width for faster, smaller images
      const MIN_WIDTH = 320; // lower bound

        const imgBitmap = await createImageBitmap(file);
        let width = Math.min(MAX_WIDTH, imgBitmap.width);
        let height = Math.round((imgBitmap.height * width) / imgBitmap.width);

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        const blobAtQuality = (q) => new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', q));

        let bestBlob = null;

        while (true) {
          canvas.width = width;
          canvas.height = height;
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(imgBitmap, 0, 0, canvas.width, canvas.height);

            // Quick direct attempt at reasonable quality first
            const quick = await blobAtQuality(0.75);
            if (quick && quick.size <= TARGET_MAX) return quick;

            // Binary search over quality to reduce iterations
            let low = 0.35, high = 0.85, candidate = null;
            for (let i = 0; i < 5; i++) {
            const mid = (low + high) / 2;
            const blob = await blobAtQuality(mid);
            if (!blob) break;
            const size = blob.size;
            candidate = blob;
            if (size > TARGET_MAX) {
              high = mid;
            } else if (size < TARGET_MIN) {
              low = mid;
            } else {
              return blob; // within target
            }
          }

          if (candidate) {
            if (!bestBlob) bestBlob = candidate;
            else if (Math.abs(bestBlob.size - TARGET_MAX) > Math.abs(candidate.size - TARGET_MAX)) bestBlob = candidate;
          }

          if (width <= MIN_WIDTH) break;
          width = Math.max(MIN_WIDTH, Math.round(width * 0.8));
          height = Math.round((imgBitmap.height * width) / imgBitmap.width);
        }

        if (bestBlob) return bestBlob;

        // final fallback
        canvas.width = Math.min(MAX_WIDTH, imgBitmap.width);
        canvas.height = Math.round((imgBitmap.height * canvas.width) / imgBitmap.width);
        ctx.drawImage(imgBitmap, 0, 0, canvas.width, canvas.height);
        return await new Promise((res, rej) => canvas.toBlob(b => b ? res(b) : rej(new Error('Compression failed')), 'image/jpeg', 0.75));
    })();
  };
  /* eslint-disable-next-line no-unused-vars */
  const handleBillUpload = async (e) => {
    if(data.bills.length >= 50) return alert("Storage Limit Reached (Max 50 Photos)");
    const file = e.target.files[0];
    if(!file) return;

    if (!file.type || !file.type.startsWith('image/')) {
      showToast(t('Only image files are supported'), 'error');
      return;
    }

    // Create a local preview so the user sees the photo immediately
    const previewUrl = URL.createObjectURL(file);
    const timestamp = Date.now();
    const storagePath = user ? `bills/${user.uid}/${timestamp}.jpg` : null;
    const tempBill = {
      id: timestamp,
      date: new Date().toISOString(),
      image: previewUrl, // local preview
      path: storagePath,
      uploading: true,
      progress: 0,
      originalFile: file
    };

    // Server-visible bill (no object URLs) so it's persisted safely
    const serverBill = {
      id: timestamp,
      date: new Date().toISOString(),
      image: null, // will be set to downloadURL after upload
      path: storagePath,
      uploading: true,
      progress: 0
    };

    // Optimistically update UI
    setData(prev => {
      const next = { ...prev, bills: [tempBill, ...(prev.bills || [])] };
      // Persist a server-friendly bill (without object URL) so it remains after refresh
      if (user) {
        const cloudNext = { ...prev, bills: [serverBill, ...(prev.bills || [])] };
        pushToFirebase(cloudNext).catch(e => console.error('Initial bill save failed', e));
      } else {
        showToast('Saved locally. Sign in to persist to cloud.');
      }
      return next;
    });
    showToast("Processing & Uploading...");

    // Use resumable upload below to track progress and allow retries
    try {
      if (!storagePath) {
        // No authenticated user to own the upload path
        setData(prev => ({ ...prev, bills: prev.bills.map(b => b.id === timestamp ? { ...b, uploading: false, uploadFailed: true } : b) }));
        showToast('Sign in to upload bills', 'error');
        return;
      }

      // Schedule the heavy work to avoid overloading CPU/network when many images selected
      scheduleUpload(async () => {
        try {
          const compressedBlob = await compressImage(file);
          console.log('Compressed blob size:', compressedBlob.size);
          const storageRef = ref(storage, storagePath);

          // Use resumable upload to track progress
          const uploadTask = uploadBytesResumable(storageRef, compressedBlob);

          // Attach temp bill with compressed blob for potential retry
          setData(prev => ({ ...prev, bills: prev.bills.map(b => b.id === timestamp ? { ...b, tempBlob: compressedBlob } : b) }));

          uploadTask.on('state_changed', (snapshot) => {
            const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            setData(prev => ({ ...prev, bills: prev.bills.map(b => b.id === timestamp ? { ...b, progress } : b) }));
          }, (error) => {
            console.error('Upload failed', error);
            setData(prev => ({ ...prev, bills: prev.bills.map(b => b.id === timestamp ? { ...b, uploading: false, uploadFailed: true } : b) }));
            showToast('Upload Failed', 'error');
          }, async () => {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            const updated = { ...data, bills: (data.bills || []).map(b => b.id === timestamp ? { id: timestamp, date: new Date().toISOString(), image: downloadUrl, path: storagePath } : b) };
            await pushToFirebase(updated);
            setData(updated);
            try { URL.revokeObjectURL(previewUrl); } catch(e) { console.warn('Revoke failed', e); }
            showToast('Bill Saved!');
          });
        } catch (err) {
          console.error('Scheduled upload failed', err);
          setData(prev => ({ ...prev, bills: prev.bills.map(b => b.id === timestamp ? { ...b, uploading: false, uploadFailed: true } : b) }));
          showToast('Upload Failed', 'error');
        }
      });
    } catch (err) {
      console.error(err);
      setData(prev => ({ ...prev, bills: prev.bills.map(b => b.id === timestamp ? { ...b, uploading: false, uploadFailed: true } : b) }));
      showToast('Upload Failed', 'error');
    }


    };
    const handleDeleteBill = async (bill) => {
      if (!bill) return;
      if (!confirm('Delete this bill?')) return;
      // Optimistic UI removal: remove immediately and push to cloud
      const updated = { ...data, bills: (data.bills || []).filter(b => b.id !== bill.id) };
      setData(updated);
      pushToFirebase(updated).catch(e => {
        console.error('Failed to update cloud after delete', e);
        showToast('Cloud delete failed, will retry', 'error');
      });

      // Background storage delete with retry; if it fails persistently, queue it for later
      if (bill.path) {
        (async () => {
          try {
            await deleteWithRetry(bill.path, 4);
            console.info('Storage delete succeeded for', bill.path);
          } catch (err) {
            console.warn('Background delete failed, scheduling for retry', bill.path, err);
            queuePendingDelete(bill.path);
          }
        })();
      }
      showToast('Bill deleted');
    };

    // --- Storage delete helpers ---
    const wait = (ms) => new Promise(res => setTimeout(res, ms));

    const deleteWithRetry = useCallback(async (storagePath, maxAttempts = 3) => {
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          await deleteObject(ref(storage, storagePath));
          return true;
        } catch (e) {
          console.warn(`Delete attempt ${attempt} failed for ${storagePath}`, e);
          if (attempt === maxAttempts) throw e;
          await wait(500 * attempt);
        }
      }
    }, []);

    const queuePendingDelete = (storagePath) => {
      try {
        const key = 'dukan:pendingDeletes';
        const raw = localStorage.getItem(key);
        const list = raw ? JSON.parse(raw) : [];
        if (!list.includes(storagePath)) {
          list.push(storagePath);
          localStorage.setItem(key, JSON.stringify(list));
        }
      } catch (e) {
        console.warn('Failed to queue pending delete', e);
      }
    };

    // Process pending deletes when online
    useEffect(() => {
      let cancelled = false;
      const process = async () => {
        if (!navigator.onLine) return;
        try {
          const key = 'dukan:pendingDeletes';
          const raw = localStorage.getItem(key);
          if (!raw) return;
          const list = JSON.parse(raw) || [];
          const remaining = [];
          for (const path of list) {
            if (cancelled) break;
            try {
              await deleteWithRetry(path, 3);
              console.info('Processed pending delete', path);
            } catch (e) {
              console.warn('Pending delete failed, keeping in queue', path, e);
              remaining.push(path);
            }
          }
          if (!cancelled) localStorage.setItem(key, JSON.stringify(remaining));
        } catch (e) {
          console.warn('Error processing pending deletes', e);
        }
      };
      process();
      return () => { cancelled = true; };
    }, [isOnline, deleteWithRetry]);
    useEffect(() => {
    const handlePopState = () => { 
        if (view !== 'generalIndex') { 
            setView('generalIndex'); 
            setActivePageId(null); 
            setActiveToolId(null);
        }
    };
    window.history.pushState({ view }, '', '');
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [view]);

  useEffect(() => {
    const metaTags = [{ name: "theme-color", content: data.settings.theme === 'dark' ? '#0f172a' : '#ffffff' }];
    metaTags.forEach(tag => {
        let meta = document.querySelector(`meta[name="${tag.name}"]`);
        if (!meta) { meta = document.createElement('meta'); meta.name = tag.name; document.head.appendChild(meta); }
        meta.content = tag.content;
    });
  }, [data.settings.theme]);

  useEffect(() => {
    if ("Notification" in window) setNotifPermission(Notification.permission);
    window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); setDeferredPrompt(e); });
  }, []);

  const _handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => { if (choiceResult.outcome === 'accepted') setDeferredPrompt(null); });
    } else { alert("Browser Menu -> Install App"); }
  };


  const requestNotificationPermission = () => {
    if (!("Notification" in window)) return;
    Notification.requestPermission().then((permission) => {
      setNotifPermission(permission);
      if (permission === "granted") playAlertSound();
    });
  };

  const playAlertSound = () => {
    if (audioRef.current) { audioRef.current.currentTime = 0; audioRef.current.play().catch(e => console.log(e)); }
  };

  const triggerLowStockNotification = (itemCount) => {
      if (notifPermission === 'granted' && itemCount > 0) {
          playAlertSound();
          if("vibrate" in navigator) navigator.vibrate([200, 100, 200]);
          new Notification(t("Low Stock Warning!"), { body: `${itemCount} ${t("items are below stock limit!")}`, icon: "/icon.png" });
      }
  };

  const isDark = data.settings.theme === 'dark';

  const handleSettingsUnlock = () => {
      const currentPass = data.settings.productPassword || '0000';
      if(settingsPassInput === currentPass || settingsPassInput === '0000' || settingsPassInput === '123456') {
          setSettingsUnlocked(true);
          showToast(t("Settings Unlocked"));
      } else { 
          showToast(t("Wrong Password!"), "error");
      }
  };

  const handleDeletePage = async () => {
    if (!managingPage) return;
    
    triggerConfirm("Delete Page?", "This page and all its items will be deleted permanently.", true, async () => {
        const filteredPages = data.pages.filter(p => p.id !== managingPage.id);
        const renumberedPages = filteredPages.map((p, index) => ({
            ...p,
            pageNo: index + 1
        }));
        const filteredEntries = data.entries.filter(ent => ent.pageId !== managingPage.id);
        const newData = { ...data, pages: renumberedPages, entries: filteredEntries };

        await pushToFirebase(newData);
        setManagingPage(null);
        showToast("Page Deleted & Renumbered");
    });
  };

  const handleRenamePage = async () => {
    if (!managingPage || !input.itemName) return;
    const newData = {
        ...data,
        pages: data.pages.map(p => p.id === managingPage.id ? { ...p, itemName: input.itemName } : p)
    };
    await pushToFirebase(newData);
    setManagingPage(null);
    showToast("Page Renamed");
  };

  const handleDeleteEntry = async () => {
      triggerConfirm("Delete Item?", "This item will be permanently removed.", true, async () => {
          const newData = { ...data, entries: data.entries.filter(e => e.id !== editingEntry.id) };
          await pushToFirebase(newData);
          setEditingEntry(null);
          showToast("Item Deleted");
      });
  };

  const handleEditEntrySave = async () => {
      if (!editingEntry || !editingEntry.car) return;
      const newData = { 
          ...data, 
          entries: data.entries.map(e => e.id === editingEntry.id ? { ...e, car: editingEntry.car } : e)
      };
      await pushToFirebase(newData);
      setEditingEntry(null); 
      showToast("Item Updated");
  };

  const handleAddPage = async () => {
    if (!input.itemName) return;
    const formattedName = input.itemName.charAt(0).toUpperCase() + input.itemName.slice(1);
    const newPage = { id: Date.now(), pageNo: data.pages.length + 1, itemName: formattedName };
    await pushToFirebase({ ...data, pages: [...data.pages, newPage] });
    setInput({ ...input, itemName: '' });
    setIsNewPageOpen(false);
    showToast(t("New Page Added"));
  };

  const handleAddEntry = async () => {
    if (!input.carName || !activePage) return;
    const formattedCar = input.carName.charAt(0).toUpperCase() + input.carName.slice(1);
    const newEntry = { id: Date.now(), pageId: activePage.id, car: formattedCar, qty: parseInt(input.qty) || 0 };
    await pushToFirebase({ ...data, entries: [...data.entries, newEntry] });
    setInput({ ...input, carName: '', qty: '' });
    setIsNewEntryOpen(false);
    showToast(t("Item Added"));
  };

  const handleImportItems = async (sourcePageId) => {
    const sourceItems = data.entries.filter(e => e.pageId === sourcePageId);
    if (sourceItems.length === 0) {
      showToast("No items found!", "error");
      return;
    }

    triggerConfirm("Copy Items?", `Copy ${sourceItems.length} items to current page?`, false, async () => {
        const newItems = sourceItems.map((item, index) => ({
          id: Date.now() + index,
          pageId: activePageId,
          car: item.car,
          qty: 0 
        }));

        await pushToFirebase({ ...data, entries: [...data.entries, ...newItems] });
        setIsCopyModalOpen(false);
        showToast(t("Items Copied Successfully!"));
    });
  };

  const handleMovePage = async (direction) => {
      if (!managingPage) return;
      const pageIndex = data.pages.findIndex(p => p.id === managingPage.id);
      const newPages = [...data.pages];
      const swapIndex = direction === 'UP' ? pageIndex - 1 : pageIndex + 1;
      
      if (swapIndex < 0 || swapIndex >= newPages.length) return;

      [newPages[pageIndex], newPages[swapIndex]] = [newPages[swapIndex], newPages[pageIndex]];
      const renumberedPages = newPages.map((p, idx) => ({ ...p, pageNo: idx + 1 }));

      await pushToFirebase({ ...data, pages: renumberedPages });
      setManagingPage(renumberedPages[swapIndex]); 
      showToast(`Page Moved to Position #${swapIndex + 1}`);
  };

  const handleMoveEntry = async (direction) => {
      if (!editingEntry) return;
      const pageEntries = data.entries.filter(e => e.pageId === editingEntry.pageId); 
      const entryIndexInPage = pageEntries.findIndex(e => e.id === editingEntry.id);
      
      if (entryIndexInPage === -1) return;
      
      const swapIndexInPage = direction === 'UP' ? entryIndexInPage - 1 : entryIndexInPage + 1;
      if (swapIndexInPage < 0 || swapIndexInPage >= pageEntries.length) return;

      const targetEntry = pageEntries[swapIndexInPage];

      const mainIndexCurrent = data.entries.findIndex(e => e.id === editingEntry.id);
      const mainIndexTarget = data.entries.findIndex(e => e.id === targetEntry.id);

      if (mainIndexCurrent === -1 || mainIndexTarget === -1) return;

      const newEntries = [...data.entries];
      [newEntries[mainIndexCurrent], newEntries[mainIndexTarget]] = [newEntries[mainIndexTarget], newEntries[mainIndexCurrent]];

      await pushToFirebase({ ...data, entries: newEntries });
      showToast(`Item Moved to Position #${swapIndexInPage + 1}`);
  };

  const updateQtyBuffer = useCallback((id, amount, currentRealQty) => {
    setTempChanges(prev => {
        const currentBufferVal = prev[id] !== undefined ? prev[id] : currentRealQty;
        const newQty = Math.max(0, currentBufferVal + amount);
        // If change reverts back to original quantity, remove from buffer
        if (newQty === currentRealQty) {
          const next = { ...prev };
          delete next[id];
          // Inform the user that the pending update was removed
          try { showToast(t('Change reverted, update removed'), 'error'); } catch { /* noop */ }
          return next;
        }
        return { ...prev, [id]: newQty };
    });
  }, [showToast, t]);

  const openSaveModal = () => {
    setSavePassInput('');
    setIsSaveModalOpen(true);
  };

  const executeSave = async () => {
      if (savePassInput !== data.settings.productPassword && savePassInput !== '0000' && savePassInput !== '123456') {
          showToast(t("Wrong Password!"), "error");
          return;
      }
      
      let lowStockTriggered = 0;
      const updatedEntries = data.entries.map(e => {
          if (tempChanges[e.id] !== undefined) {
              const finalQty = tempChanges[e.id];
              if (finalQty < data.settings.limit) lowStockTriggered++;
              return { ...e, qty: finalQty };
          }
          return e;
      });

      const success = await pushToFirebase({ ...data, entries: updatedEntries });
      if(success) {
          setTempChanges({}); 
          setIsSaveModalOpen(false); 
          if (lowStockTriggered > 0) {
              triggerLowStockNotification(lowStockTriggered);
              showToast(t("Stock Updated (Low Stock Alert!)"));
          } else {
              showToast(t("Database Synced Successfully!"));
          }
      }
  };

  const pageCounts = useMemo(() => {
    const counts = {};
    (data.entries || []).forEach(e => {
      counts[e.pageId] = (counts[e.pageId] || 0) + e.qty;
    });
    return counts;
  }, [data.entries]);

  const globalSearchResults = useMemo(() => {
    if (!indexSearchTerm) return { pages: (data.pages || []), items: [] };
    const safeTerm = indexSearchTerm.toLowerCase();
    const filteredPages = (data.pages || []).filter(p => p.itemName?.toLowerCase().includes(safeTerm));
    const filteredItems = (data.entries || []).filter(e => e.car?.toLowerCase().includes(safeTerm));
    
    const itemsGrouped = filteredItems.reduce((acc, item) => {
        const p = (data.pages || []).find(page => page.id === item.pageId);
        if (p && p.itemName) { 
            if (!acc[p.itemName]) acc[p.itemName] = []; 
            acc[p.itemName].push(item); 
        }
        return acc;
    }, {});
    return { pages: filteredPages, items: itemsGrouped };
  }, [data.pages, data.entries, indexSearchTerm]);

  const filteredStock = useMemo(() => {
      if (!stockSearchTerm || stockSearchTerm.trim() === '') return [];
      const term = stockSearchTerm.toLowerCase();
      return (data.entries || []).filter(e => e.car && e.car.toLowerCase().includes(term));
  }, [data.entries, stockSearchTerm]);

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

  // --------------------------------------------------------------------------

  const TranslateBtn = () => (
    <button onClick={() => setIsHindi(!isHindi)} className={`p-2 rounded-full border ${isDark ? 'bg-slate-700 border-slate-500' : 'bg-white/50 border-black/10'}`}> <Languages size={20}/> </button>
  );

  const renderSaveButton = () => {
      const count = Object.keys(tempChanges).length;
      if (count === 0) return null;
      return (
          <button onClick={openSaveModal} className="fixed bottom-24 right-6 bg-green-600 text-white px-4 py-3 rounded-full shadow-2xl border-2 border-white flex items-center gap-3 z-50 animate-bounce cursor-pointer hover:bg-green-700 transition-colors">
            <SaveAll size={20} /> <span className="font-bold text-sm">{t("Update")} ({count})</span>
          </button>
      );
  };

    // Bills UI removed — feature deprecated per user request

  if (authLoading || (user && dbLoading)) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-between bg-slate-950 text-white p-10">
              <div className="flex-1 flex flex-col items-center justify-center gap-8">
                  <div className="text-center">
                    <h1 className="text-3xl font-black tracking-widest text-white mb-2">DUKAN REGISTER</h1>
                    <div className="h-1 w-24 bg-blue-600 mx-auto rounded-full"></div>
                  </div>
                  <div className="relative">
                      <div className="w-16 h-16 border-4 border-slate-800 border-t-blue-500 rounded-full animate-spin"></div>
                  </div>
              </div>
          </div>
      );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 p-6 text-white">
        {toast && <ToastMessage message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        <div className="w-full max-w-sm bg-slate-800 p-8 rounded-3xl shadow-2xl border border-slate-700">
           <h1 className="text-2xl font-bold text-center mb-1">Welcome Back</h1>
           <p className="text-center text-slate-400 mb-8 text-sm">Sign in to manage your Dukan</p>
           
           <form onSubmit={handleAuth} className="space-y-4">
             <div>
               <label className="text-xs text-slate-400 font-bold ml-1 uppercase">Email Address</label>
               <input type="email" required className="w-full p-3 bg-slate-900 rounded-xl border border-slate-600 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none" placeholder="shop@gmail.com" value={email} onChange={e => setEmail(e.target.value)}/>
             </div>
             <div>
               <label className="text-xs text-slate-400 font-bold ml-1 uppercase">Password</label>
               <input type="password" required className="w-full p-3 bg-slate-900 rounded-xl border border-slate-600 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none" placeholder="******" value={password} onChange={e => setPassword(e.target.value)}/>
             </div>
             <button type="submit" className="w-full py-4 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold shadow-lg shadow-blue-600/30 active:scale-95 transition-all">
               {isRegistering ? "Create Shop Account" : "Secure Login"}
             </button>
           </form>
           
           <div className="mt-6 text-center">
             <button onClick={() => setIsRegistering(!isRegistering)} className="text-blue-400 font-bold ml-2 hover:text-blue-300 transition-colors text-sm">
               {isRegistering ? "Already have an account? Login" : "New here? Create Account"}
             </button>
           </div>
        </div>
      </div>
    );
  }

  // If the app status is set to 'blocked' in Firestore, show a blocking screen
  if (data && data.appStatus === 'blocked') {
    const fid = fbDocId || (user && user.uid) || 'Unknown';
    return (
      <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900 p-6">
        <div className="max-w-xl w-full bg-slate-800 border rounded-xl shadow-xl p-6 text-center">
          <h3 className="text-2xl font-bold mb-2 text-[#f5e6cc]">Account Blocked</h3>
          <p className="mb-4 text-[#f5e6cc]">Your shop has been blocked by the administrator. Payment is pending and access has been restricted until the issue is resolved.</p>
          <p className="text-sm mb-4 text-[#f5e6cc] flex items-center justify-center gap-2"><strong>Firebase ID:</strong> <span className="font-mono">{fid}</span>
            <button onClick={() => { navigator.clipboard?.writeText(fid); showToast('Firebase ID copied to clipboard'); }} title="Copy Firebase ID" className="ml-2 inline-flex items-center justify-center p-1 rounded bg-transparent text-[#f5e6cc] hover:bg-slate-700">
              <Copy size={14} />
            </button>
          </p>
          <p className="text-sm mb-6 text-[#f5e6cc]">Please contact the administrator to resolve billing or account issues.</p>
          <div className="flex gap-3 justify-center">
            <a className="px-4 py-2 bg-amber-500 text-slate-900 rounded inline-flex items-center gap-2 font-bold" href={`tel:8619152422`}>
              Contact
            </a>
            <button onClick={() => { navigator.clipboard?.writeText(fid); showToast('Firebase ID copied to clipboard'); }} className="px-4 py-2 bg-gray-700 text-[#f5e6cc] rounded">Copy ID</button>
          </div>
        </div>
      </div>
    );
  }

  const renderGeneralIndex = () => (
    <div className="pb-24">
      <div className={`p-6 border-b-4 border-double sticky top-0 z-10 ${isDark ? 'bg-slate-800 border-slate-600' : 'bg-yellow-100 border-yellow-400'}`}>
        <div className="flex justify-between items-center mb-2">
          <h1 className={`text-2xl font-extrabold uppercase tracking-widest ${isDark ? 'text-white' : 'text-yellow-900'} underline decoration-2 decoration-red-400 truncate`}>
            {data.settings.shopName || "Dukan Register"}
          </h1>
          <div className="flex gap-2">
              {isOnline ? <Wifi className="text-green-600"/> : <WifiOff className="text-red-500 animate-pulse"/>}
              <TranslateBtn />
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

      {data.settings.pinnedTools && data.settings.pinnedTools.length > 0 && (
        <div className={`py-3 px-4 border-b overflow-x-auto whitespace-nowrap flex gap-3 hide-scrollbar ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-gray-50 border-gray-200'}`}>
           {[
             {id: 'notes', icon: <StickyNote size={18}/>, label: 'Notes', col: 'text-yellow-600 bg-yellow-100'},
             {id: 'gst', icon: <Percent size={18}/>, label: 'GST', col: 'text-blue-600 bg-blue-100'},
             {id: 'margin', icon: <Calculator size={18}/>, label: 'Profit', col: 'text-purple-600 bg-purple-100'},
             {id: 'card', icon: <CreditCard size={18}/>, label: 'Card', col: 'text-orange-600 bg-orange-100'},
             {id: 'converter', icon: <RefreshCcw size={18}/>, label: 'Convert', col: 'text-green-600 bg-green-100'},
             {id: 'translator', icon: <Languages size={18}/>, label: 'Trans', col: 'text-pink-600 bg-pink-100'},
             {id: 'invoice', icon: <FileText size={18}/>, label: 'Bill', col: 'text-indigo-600 bg-indigo-100'},
           ].filter(t => data.settings.pinnedTools.includes(t.id)).map(tool => (
             <button key={tool.id} onClick={() => { setActiveToolId(tool.id); setView('tools'); }} className={`inline-flex items-center gap-2 px-3 py-2 rounded-full font-bold text-sm shadow-sm border ${tool.col} border-transparent hover:scale-105 transition-transform`}>
               {tool.icon} {tool.label}
             </button>
           ))}
        </div>
      )}

      <div className={`m-2 mt-4 border-2 ${isDark ? 'border-slate-700 bg-slate-900' : 'border-black bg-white'}`}>
        <div className={`flex border-b-2 ${isDark ? 'border-slate-700 bg-slate-800 text-white' : 'border-black bg-gray-100 text-black'} p-2`}>
          <div className="w-12 font-black text-center border-r border-gray-400">#</div>
          <div className="flex-1 font-black pl-3 border-r border-gray-400">{t("Particulars")}</div>
          <div className="w-16 font-black text-center border-r border-gray-400">{t("Page")}</div>
          <div className="w-12 font-black text-center">Edit</div>
        </div>
        <div className="min-h-[20vh]">
          {globalSearchResults.pages.map((page) => (
            <div key={page.id} onClick={() => { setActivePageId(page.id); setView('page'); setPageSearchTerm(''); }} className={`flex border-b border-gray-300 cursor-pointer hover:bg-blue-50 transition-colors h-14 items-center ${isDark ? 'text-white hover:bg-slate-800' : 'text-black'}`}>
              <div className="w-12 text-center font-bold text-red-600 border-r border-gray-300 h-full flex items-center justify-center text-sm">{page.pageNo}</div>
              <div className="flex-1 pl-3 font-semibold text-lg border-r border-gray-300 h-full flex items-center truncate">{t(page.itemName)}</div>
              <div className="w-16 text-center font-bold text-blue-700 h-full flex items-center justify-center underline border-r border-gray-300">{page.pageNo}</div>
              
              <div className="w-12 flex items-center justify-center h-full" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => { setManagingPage(page); setInput({...input, itemName: page.itemName}); }} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-100 rounded-full">
                      <Edit size={18}/>
                  </button>
              </div>
            </div>
          ))}
          {globalSearchResults.pages.length === 0 && <div className="p-2 text-center text-gray-400 text-sm">{t("No Pages Found")}</div>}
        </div>
      </div>
      <button onClick={() => setIsNewPageOpen(true)} className="fixed bottom-24 right-6 bg-yellow-500 text-black w-16 h-16 rounded-full shadow-xl border-4 border-white flex items-center justify-center active:scale-95 z-20"><Plus size={32} strokeWidth={3}/></button>
    </div>
  );

  const renderPagesGrid = () => (
    <div className={`pb-24 min-h-screen p-4 ${isDark ? 'bg-slate-950' : 'bg-gray-100'}`}>
        <div className="mb-4 sticky top-0 z-10 pt-2 pb-2 backdrop-blur-sm flex justify-between items-center">
            <h1 className={`text-2xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-800'}`}><Grid/> {t("All Pages")}</h1>
            <TranslateBtn />
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
                     <div key={page.id} onClick={() => { setActivePageId(page.id); setView('page'); setPageSearchTerm(''); }} className={`relative p-4 rounded-xl border-2 shadow-sm cursor-pointer active:scale-95 transition-all flex flex-row items-center justify-between h-24 ${isDark ? 'bg-slate-800 border-slate-600 hover:border-blue-500' : 'bg-white border-gray-200 hover:border-blue-500'}`}>
                         <div className="flex items-center gap-4">
                              <div className="bg-gray-100 rounded p-2 border font-bold text-gray-500">#{page.pageNo}</div>
                              <div>
                                 <h3 className={`font-bold text-xl leading-tight ${isDark ? 'text-white' : 'text-gray-800'}`}>{t(page.itemName)}</h3>
                                 <span className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{totalItems} Pcs</span>
                              </div>
                         </div>
                         <button onClick={(e) => { e.stopPropagation(); setManagingPage(page); setInput({...input, itemName: page.itemName}); }} className="p-3 text-blue-500 hover:bg-blue-50 rounded-full border border-blue-100"><Edit size={24}/></button>
                     </div>
                  )
            })}
        </div>
        <button onClick={() => setIsNewPageOpen(true)} className="fixed bottom-24 right-6 bg-blue-600 text-white w-14 h-14 rounded-full shadow-xl border-2 border-white flex items-center justify-center active:scale-95 z-20"><Plus size={28}/></button>
    </div>
  );

  const renderStockSearch = () => {
      const visibleStock = filteredStock.slice(0, displayLimit);
      
      return (
        <div className={`pb-24 min-h-screen p-4 ${isDark ? 'bg-slate-950' : 'bg-gray-100'}`}>
            <div className="mb-4 sticky top-0 z-10 pt-2 pb-2 backdrop-blur-sm">
                <div className="flex justify-between items-center mb-4">
                    <h1 className={`text-2xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-800'}`}><Search/> {t("Global Search")}</h1>
                    <div className="flex gap-2">
                        <button onClick={() => setIsSafeMode(!isSafeMode)} className={`p-1 rounded-full border ${isSafeMode ? 'bg-green-100 text-green-700 border-green-500' : 'bg-gray-200 text-gray-400'}`}>{isSafeMode ? <ShieldCheck size={20} /> : <ShieldAlert size={20} />}</button>
                        <TranslateBtn />
                    </div>
                </div>
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <input className={`w-full pl-9 p-3 rounded-xl border outline-none shadow-sm ${isDark ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white border-gray-300 text-black'}`} placeholder={t("Type Car Name (e.g. Swift)...")} value={stockSearchTerm} onChange={e => setStockSearchTerm(e.target.value)}/>
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
                        {stockSearchTerm && <button onClick={() => setStockSearchTerm('')} className="absolute right-2 top-1/2 -translate-y-1/2"><X size={16}/></button>}
                    </div>
                    <VoiceInput onResult={setStockSearchTerm} isDark={isDark} />
                </div>
            </div>
            <div className="space-y-3">
                {!stockSearchTerm && (
                    <div className="flex flex-col items-center justify-center mt-20 opacity-40">
                        <Search size={48} className="mb-4"/>
                        <p className="font-bold">{t("Type above to search...")}</p>
                    </div>
                )}
                {visibleStock.map(entry => {
                    const p = (data.pages || []).find(page => page.id === entry.pageId);
                    return (
                        <div key={entry.id} className={`p-4 rounded-xl border-l-4 shadow-sm flex items-center justify-between ${isDark ? 'bg-slate-800 border-l-blue-500 border-slate-700 text-white' : 'bg-white border-l-blue-500 border-gray-200 text-black'}`}>
                            <div className="flex-1">
                                <h3 className="font-bold text-xl">{t(p?.itemName || "Unknown Item")}</h3>
                                <p className={`text-sm mt-1 font-semibold opacity-70`}>{t("For")}: {t(entry.car)}</p>
                                <div onClick={() => { if(p) { setActivePageId(p.id); setView('page'); setPageSearchTerm(stockSearchTerm); }}} className={`inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded mt-2 cursor-pointer hover:underline border ${isDark ? 'bg-slate-700 text-blue-300 border-slate-600' : 'bg-gray-100 text-blue-700 border-gray-300'}`}><Book size={10}/> {t("Go to Page")} <ChevronRight size={10}/></div>
                            </div>
                            <div className="flex items-center gap-3">
                               <button onClick={() => updateQtyBuffer(entry.id, -1, entry.qty)} className="w-8 h-8 rounded-full border bg-gray-100 text-red-600 flex items-center justify-center active:scale-90 transition-transform"><Minus size={16}/></button>
                               <span className={`text-xl font-mono font-bold w-8 text-center ${tempChanges[entry.id] ? 'text-blue-500' : ''}`}>{tempChanges[entry.id] !== undefined ? tempChanges[entry.id] : entry.qty}</span>
                               <button onClick={() => updateQtyBuffer(entry.id, 1, entry.qty)} className="w-8 h-8 rounded-full border bg-gray-100 text-green-600 flex items-center justify-center active:scale-90 transition-transform"><Plus size={16}/></button>
                            </div>
                        </div>
                    );
                })}
                {stockSearchTerm && filteredStock.length === 0 && <div className="text-center mt-10 opacity-50 font-bold">{t("No Items Found")}</div>}
                
                {filteredStock.length > displayLimit && (
                    <button onClick={() => setDisplayLimit(prev => prev + 50)} className="w-full py-4 text-blue-500 font-bold opacity-70">
                        {t("Load More")}... ({t("Showing")} {visibleStock.length} {t("of")} {filteredStock.length})
                    </button>
                )}
            </div>
        </div>
      );
  };

  const renderPage = () => {
    if (!activePage) return <div className={`min-h-screen flex items-center justify-center ${isDark ? 'text-white' : 'text-black'}`}>Page not found or Loading...</div>;

    const { filteredEntries, grandTotal } = pageViewData;
    const currentPageIndex = data.pages.findIndex(p => p.id === activePageId);
    const prevPage = currentPageIndex > 0 ? data.pages[currentPageIndex - 1] : null;
    const nextPage = currentPageIndex < data.pages.length - 1 ? data.pages[currentPageIndex + 1] : null;

    const visibleEntries = filteredEntries.slice(0, displayLimit);

    return (
      <div className={`pb-24 min-h-screen ${isDark ? 'bg-slate-950 text-white' : 'bg-white text-black'}`}>
        <div className={`sticky top-0 z-10 border-b-2 shadow-sm ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-red-200'}`}>
           <div className={`flex items-center p-3 ${isDark ? 'bg-slate-800' : 'bg-red-50'}`}>
              <button onClick={() => { setView('generalIndex'); setActivePageId(null); }} className="mr-2 p-2"><ArrowLeft/></button>
              <div className="flex-1">
                 <div className="flex justify-between items-center">
                    <p className={`text-xs font-bold uppercase ${isDark ? 'text-slate-400' : 'text-red-400'}`}>{t("Page No")}: {activePage.pageNo}</p>
                    
                    <div className="flex gap-4 items-center bg-white/10 p-1 rounded-full">
                         <button onClick={() => setActivePageId(prevPage.id)} disabled={!prevPage} className="h-12 w-12 flex items-center justify-center bg-blue-600 text-white rounded-full shadow-lg disabled:opacity-30 disabled:bg-gray-400 active:scale-95 transition-transform"><ArrowLeftIcon size={28}/></button>
                         <button onClick={() => setActivePageId(nextPage.id)} disabled={!nextPage} className="h-12 w-12 flex items-center justify-center bg-blue-600 text-white rounded-full shadow-lg disabled:opacity-30 disabled:bg-gray-400 active:scale-95 transition-transform"><ArrowRight size={28}/></button>
                    </div>

                    <div className="flex gap-2 ml-2">
                        <button onClick={() => setIsCopyModalOpen(true)} className={`p-2 rounded-full border ${isDark ? 'bg-slate-700 text-yellow-400 border-slate-500' : 'bg-yellow-100 text-yellow-700 border-yellow-400'}`}><Copy size={20}/></button>
                        <TranslateBtn />
                    </div>
                 </div>
                 <h2 className="text-2xl font-black uppercase mt-1">{t(activePage.itemName)}</h2>
                 <div className="text-xs font-bold opacity-70 mt-1">{t("Total")} {t("Items")}: {grandTotal}</div>
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
        
        {filteredEntries.length > displayLimit && (
            <button onClick={() => setDisplayLimit(prev => prev + 50)} className="w-full py-6 text-blue-500 font-bold opacity-80 border-t">
                {t("Load More")}... ({t("Showing")} {visibleEntries.length} {t("of")} {filteredEntries.length})
            </button>
        )}

        <button onClick={() => setIsNewEntryOpen(true)} className="fixed bottom-24 right-6 bg-blue-600 text-white w-14 h-14 rounded-full shadow-lg border-2 border-white flex items-center justify-center z-20"><Plus size={28}/></button>
      </div>
    );
  };

  const renderAlerts = () => (
     <div className={`p-4 pb-24 min-h-screen ${isDark ? 'bg-slate-950 text-white' : 'bg-gray-50 text-black'}`}>
        <div className="flex justify-between items-center mb-4"><h2 className="text-2xl font-bold text-red-500 flex items-center gap-2"><AlertTriangle/> {t("Low Stock")}</h2><TranslateBtn /></div>
        {(data.entries || []).filter(e => e.qty < data.settings.limit).length === 0 && <div className="text-center mt-10 opacity-50">{t("Stock Full")}</div>}
        {(data.entries || []).filter(e => e.qty < data.settings.limit).map(e => {
           const p = (data.pages || []).find(page => page.id === e.pageId);
           return (
              <div key={e.id} className="p-4 border-l-4 border-red-500 bg-white text-black shadow mb-2 rounded flex justify-between items-center" onClick={() => { if(p) { setActivePageId(p.id); setView('page'); }}}>
                 <div><h3 className="font-bold">{t(e.car)}</h3><p className="text-xs">{t(p?.itemName || "Unknown")}</p></div>
                 <span className="text-2xl font-bold text-red-600">{e.qty}</span>
              </div>
           )
        })}
     </div>
  );

  const renderSettings = () => {
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
                     <span className="text-xs font-bold uppercase tracking-widest">{t("Secured by AutomationX")}</span>
                 </div>
            </div>
        )
    }

    return (
    <div className={`p-4 pb-24 min-h-screen ${isDark ? 'bg-slate-900 text-white' : 'bg-gray-50 text-black'}`}>
       <div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-bold flex items-center gap-2"><Settings/> {t("Settings")}</h2><TranslateBtn /></div>
       
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

           <div className={`p-4 rounded-xl border mb-3 border-orange-300 ${isDark ? 'bg-slate-800' : 'bg-orange-50'}`}>
               <label className="font-bold block mb-1 text-orange-800 text-xs uppercase flex justify-between">
                   {t("Your Customer ID (Support)")}
               </label>
               <div className="flex gap-2 items-center">
                   <code className="flex-1 p-2 bg-white/50 border border-orange-200 rounded font-mono text-sm break-all select-all text-orange-900">
                       {user.uid}
                   </code>
                   <button onClick={() => { navigator.clipboard.writeText(user.uid); showToast("ID Copied!"); }} className="p-2 bg-orange-500 text-white rounded-lg active:scale-95 transition-transform shadow">
                       <Copy size={20}/>
                   </button>
               </div>
           </div>
       </div>

       <div className="mb-6">
           <p className="text-xs font-bold uppercase tracking-widest opacity-50 mb-2 pl-1">{t("Preferences")}</p>
           
           <div className={`p-4 rounded-xl border mb-3 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-300'}`}>
             <div className="flex justify-between items-center">
                 <div><h3 className="font-bold">{t("Notifications")}</h3><p className="text-xs opacity-70">{notifPermission === 'granted' ? t("Alerts are Active") : t("Allow sound & popups")}</p></div>
                 {notifPermission === 'granted' ? <button className="bg-green-100 text-green-700 border border-green-500 px-3 py-1 rounded font-bold flex items-center gap-2 cursor-default text-xs"><CheckCircle size={14}/> Active</button> : <button onClick={requestNotificationPermission} className="bg-green-600 text-white px-3 py-1 rounded font-bold flex items-center gap-2 active:scale-95 transition-transform text-xs"><Bell size={14}/> Enable</button>}
             </div>
           </div>

           <div className={`p-4 rounded-xl border mb-3 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-300'}`}>
             <label className="font-bold block mb-2">{t("Low Stock Limit Alert")}</label>
             <div className="flex items-center gap-4 mb-2">
                 <input type="range" min="1" max="20" value={tempLimit} onChange={(e) => setTempLimit(parseInt(e.target.value))} className="flex-1 accent-blue-600 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"/>
                 <span className="text-2xl font-bold w-8 text-center">{tempLimit}</span>
             </div>
             <button onClick={() => { triggerConfirm("Update Limit?", `Set low stock limit to ${tempLimit}?`, false, () => pushToFirebase({...data, settings: {...data.settings, limit: tempLimit}}))}} className="w-full py-2 bg-blue-100 text-blue-700 rounded font-bold text-sm">
                 {t("Set & Save Limit")}
             </button>
           </div>
           
           <div className={`p-4 rounded-xl border mb-3 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-300'}`}>
             <label className="font-bold block mb-2">{t("Theme")}</label>
             <div className="flex gap-2"><button onClick={() => { triggerConfirm("Change Theme?", "Switch to Light Mode?", false, () => pushToFirebase({...data, settings: {...data.settings, theme: 'light'}}))}} className="flex-1 py-2 border rounded font-bold">Light</button><button onClick={() => { triggerConfirm("Change Theme?", "Switch to Dark Mode?", false, () => pushToFirebase({...data, settings: {...data.settings, theme: 'dark'}}))}} className="flex-1 py-2 border bg-slate-700 text-white rounded font-bold">Dark</button></div>
           </div>
       </div>

       <div className="mb-6">
           <p className="text-xs font-bold uppercase tracking-widest opacity-50 mb-2 pl-1">{t("Security")}</p>
           <div className={`p-4 rounded-xl border mb-3 border-blue-300 ${isDark ? 'bg-slate-800' : 'bg-blue-50'}`}>
             <label className="font-bold block mb-2 text-blue-600 text-xs uppercase">{t("Change Product Password")}</label>
             <input type="text" placeholder={t("New Product Password")} className="w-full p-2 border rounded mb-2 text-black" value={newProductPass} onChange={e => setNewProductPass(e.target.value)}/>
             <button onClick={() => { triggerConfirm("Change Password?", "Update product security password?", false, () => { pushToFirebase({...data, settings: {...data.settings, productPassword: newProductPass}}); setNewProductPass(''); showToast(t("Product Password Updated!")); })}} className="w-full py-2 bg-blue-600 text-white font-bold rounded text-sm">{t("Update Password")}</button>
           </div>
       </div>

       <div className="mb-6">
           <p className="text-xs font-bold uppercase tracking-widest opacity-50 mb-2 pl-1">{t("Legal & Support")}</p>
           
           <div className="flex flex-col gap-2">
                <button onClick={() => setIsPrivacyOpen(true)} className={`p-3 rounded-lg border text-left flex items-center gap-3 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-300'}`}>
                    <FileText size={20} className="text-gray-500"/> <span className="font-bold">{t("Privacy & Policy")}</span>
                </button>
                <button onClick={() => setIsFaqOpen(true)} className={`p-3 rounded-lg border text-left flex items-center gap-3 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-300'}`}>
                    <HelpCircle size={20} className="text-gray-500"/> <span className="font-bold">{t("FAQ")}</span>
                </button>
                <a href="tel:8619152422" className={`p-3 rounded-lg border text-left flex items-center gap-3 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-300'}`}>
                    <MessageSquare size={20} className="text-green-500"/> <span className="font-bold">{t("Feedback / Contact")}</span> <ExternalLink size={14} className="ml-auto opacity-50"/>
                </a>
           </div>
       </div>

       <button onClick={handleLogout} className="w-full py-3 border-2 border-red-400 bg-red-50 text-red-600 rounded-lg font-bold flex items-center justify-center gap-2"><LogOut size={20}/> {t("Logout Shop")}</button>
       
       <div className="mt-8 text-center opacity-60 pb-4">
           <p className="text-[10px] uppercase tracking-widest mb-1">{t("Parent Company")}</p>
           <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-slate-100 border border-slate-200">
               <ShieldCheck size={14} className="text-blue-600" />
               <p className="font-bold text-sm text-slate-800">AutomationX</p>
           </div>
       </div>
    </div>
    );
  };

  return (
    <div className={`min-h-screen font-sans ${isDark ? 'bg-slate-950' : 'bg-white'}`}>
      <audio ref={audioRef} src="https://actions.google.com/sounds/v1/alarms/beep_short.ogg" preload="auto"></audio>

      {toast && <ToastMessage message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      <ImageModal src={viewImage} onClose={()=>setViewImage(null)} onDelete={()=>handleDeleteBill(data.bills.find(b => b.image === viewImage || b === viewImage))} />

      <ConfirmationModal 
         isOpen={confirmConfig.isOpen}
         onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
         onConfirm={confirmConfig.onConfirm}
         title={confirmConfig.title}
         message={confirmConfig.message}
         isDanger={confirmConfig.isDanger}
         t={t}
         isDark={isDark}
      />

      <LegalModal isOpen={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} type="privacy" t={t} isDark={isDark} />
      <LegalModal isOpen={isFaqOpen} onClose={() => setIsFaqOpen(false)} type="faq" t={t} isDark={isDark} />

      {view === 'generalIndex' && renderGeneralIndex()}
      {view === 'pagesGrid' && renderPagesGrid()}
      {view === 'stockSearch' && renderStockSearch()} 
      {view === 'page' && renderPage()}
      {view === 'alerts' && renderAlerts()}
      {view === 'settings' && renderSettings()}
      
      {/* Bills view removed */}

      {view === 'tools' && <ToolsHub onBack={() => setView('settings')} t={t} isDark={isDark} initialTool={activeToolId} pinnedTools={data.settings.pinnedTools || []} onTogglePin={handleTogglePin} shopDetails={data.settings}/>}
      
      {renderSaveButton()}

      <div className={`fixed bottom-0 w-full border-t flex justify-between px-2 p-2 pb-safe z-50 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-300'}`}>
         <NavBtn icon={Book} label={t("Index")} active={view === 'generalIndex'} onClick={() => { setView('generalIndex'); setActivePageId(null); }} isDark={isDark}/>
         <NavBtn icon={Grid} label={t("Pages")} active={view === 'pagesGrid'} onClick={() => { setView('pagesGrid'); setIndexSearchTerm(''); setActivePageId(null); }} isDark={isDark}/>
         <NavBtn icon={Search} label={t("Search")} active={view === 'stockSearch'} onClick={() => { setView('stockSearch'); setStockSearchTerm(''); }} isDark={isDark}/>
         <NavBtn icon={AlertTriangle} label={t("Alerts")} active={view === 'alerts'} onClick={() => setView('alerts')} alert={(data.entries || []).some(e => e.qty < data.settings.limit)} isDark={isDark}/>
         {/* My Bills nav removed */}
         <NavBtn icon={Settings} label={t("Settings")} active={view === 'settings'} onClick={() => setView('settings')} isDark={isDark}/>
      </div>

      {isNewPageOpen && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-xl p-6">
            <h3 className="text-xl font-bold mb-4 text-black">{t("New Page")}</h3>
            <div className="flex gap-2 mb-4">
                <input autoFocus className="flex-1 border-2 border-black rounded-lg p-3 text-lg font-bold text-black" placeholder={t("Item Name")} value={input.itemName} onChange={e => setInput({...input, itemName: e.target.value})} />
                <VoiceInput onResult={(txt) => setInput(prev => ({...prev, itemName: txt}))} isDark={false} />
            </div>
            <div className="flex gap-3">
               <button onClick={() => setIsNewPageOpen(false)} className="flex-1 py-3 bg-gray-200 rounded font-bold text-black">{t("Cancel")}</button>
               <button onClick={handleAddPage} className="flex-1 py-3 bg-yellow-500 text-black rounded font-bold">{t("Add")}</button>
            </div>
          </div>
        </div>
      )}

      {isCopyModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-xl p-6 max-h-[80vh] flex flex-col">
            <h3 className="text-xl font-bold mb-4 text-black">{t("Select Page to Copy From")}</h3>
            <div className="overflow-y-auto flex-1 space-y-2">
                {data.pages.filter(p => p.id !== activePageId).map(p => (
                   <button key={p.id} onClick={() => handleImportItems(p.id)} className="w-full text-left p-3 border rounded hover:bg-blue-50 font-bold text-black">
                      {p.pageNo}. {t(p.itemName)}
                   </button>
                ))}
                {data.pages.length <= 1 && <div className="text-center text-gray-400 p-4">No other pages found.</div>}
            </div>
            <button onClick={() => setIsCopyModalOpen(false)} className="w-full mt-4 py-3 bg-gray-200 rounded font-bold text-black">{t("Cancel")}</button>
          </div>
        </div>
      )}

      {isSaveModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4">
          <div className={`w-full max-w-sm rounded-xl p-6 shadow-2xl animate-in zoom-in-95 ${isDark ? 'bg-slate-800 text-white' : 'bg-white text-black'}`}>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold flex items-center gap-2"><Lock size={20}/> {t("Security Check")}</h3>
                <button onClick={() => setIsSaveModalOpen(false)} className="p-1 rounded hover:bg-gray-100/10"><X size={20}/></button>
            </div>
            <p className="text-sm opacity-70 mb-4">{t("Enter Product Password to save changes:")}</p>
            
            <input 
                autoFocus
                type="password" 
                className={`w-full p-3 rounded-lg text-lg font-bold text-center tracking-widest mb-6 border-2 ${isDark ? 'bg-slate-900 border-slate-600 text-white' : 'bg-gray-50 border-gray-300 text-black'}`}
                placeholder="****"
                value={savePassInput}
                onChange={e => setSavePassInput(e.target.value)}
            />
            
            <div className="flex gap-3">
               <button onClick={() => setIsSaveModalOpen(false)} className="flex-1 py-3 bg-gray-500/20 hover:bg-gray-500/30 rounded-lg font-bold">{t("Cancel")}</button>
               <button onClick={executeSave} className="flex-1 py-3 bg-green-600 text-white hover:bg-green-500 rounded-lg font-bold shadow-lg shadow-green-500/30">{t("Confirm Save")}</button>
            </div>
          </div>
        </div>
      )}

      {managingPage && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-xl p-6">
            <h3 className="text-xl font-bold mb-2 text-black">{t("Manage Page")}</h3>
            <p className="text-gray-500 mb-4 text-sm font-bold">#{managingPage.pageNo}</p>
            
            <div className="mb-4">
                <label className="text-xs font-bold text-gray-500">{t("Rename")}</label>
                <input className="w-full border-2 border-black rounded p-2 font-bold text-black mb-2" value={input.itemName} onChange={e => setInput({...input, itemName: e.target.value})} />
            </div>

            <div className="flex gap-2 mb-4">
                <button onClick={() => handleMovePage('UP')} className="flex-1 py-3 bg-blue-100 text-blue-700 rounded font-bold flex items-center justify-center gap-2"><ChevronUp size={20}/> {t("Move Up")}</button>
                <button onClick={() => handleMovePage('DOWN')} className="flex-1 py-3 bg-blue-100 text-blue-700 rounded font-bold flex items-center justify-center gap-2"><ChevronDown size={20}/> {t("Move Down")}</button>
            </div>

            <div className="flex gap-2">
               <button onClick={handleDeletePage} className="flex-1 py-3 bg-red-100 text-red-600 rounded font-bold flex items-center justify-center gap-2"><Trash2 size={18}/> {t("Delete")}</button>
               <button onClick={handleRenamePage} className="flex-[2] py-3 bg-blue-600 text-white rounded font-bold">{t("Update")}</button>
            </div>
            <button onClick={() => setManagingPage(null)} className="w-full mt-2 py-2 text-gray-500 font-bold">{t("Cancel")}</button>
          </div>
        </div>
      )}

      {editingEntry && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-xl p-6">
            <h3 className="text-xl font-bold mb-4 text-black">{t("Edit Entry")}</h3>
            
            {/* Show Current Position */}
            <div className="mb-4 p-2 bg-blue-50 text-blue-700 rounded font-bold text-center">
                 Current Position: #{data.entries.filter(e => e.pageId === editingEntry.pageId).findIndex(e => e.id === editingEntry.id) + 1}
            </div>

            <div className="space-y-4">
               <div>
                   <label className="text-xs font-bold text-gray-500">{t("Car Name")}</label>
                   <input className="w-full border-2 border-black rounded p-2 font-bold text-black" value={editingEntry.car} onChange={e => setEditingEntry({...editingEntry, car: e.target.value})} />
               </div>
               
               <div className="flex gap-2 pt-2">
                  <button onClick={() => handleMoveEntry('UP')} className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 rounded font-bold flex items-center justify-center gap-1 text-sm text-black border"><ChevronUp size={16}/> {t("Move Up")}</button>
                  <button onClick={() => handleMoveEntry('DOWN')} className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 rounded font-bold flex items-center justify-center gap-1 text-sm text-black border"><ChevronDown size={16}/> {t("Move Down")}</button>
               </div>
            </div>
            <div className="flex gap-2 mt-6">
               <button onClick={handleDeleteEntry} className="flex-1 py-3 bg-red-100 text-red-600 rounded font-bold flex items-center justify-center gap-2"><Trash2 size={18}/> {t("Delete")}</button>
               <button onClick={handleEditEntrySave} className="flex-[2] py-3 bg-blue-600 text-white rounded font-bold">{t("Update Name")}</button>
            </div>
            <button onClick={() => setEditingEntry(null)} className="w-full mt-2 py-2 text-gray-500 font-bold">{t("Cancel")}</button>
          </div>
        </div>
      )}

      {isNewEntryOpen && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-xl p-6">
            <h3 className="text-xl font-bold mb-1 text-black">{t("New Entry")}</h3>
            <p className="text-sm font-bold opacity-50 mb-4 text-black">{t(activePage ? activePage.itemName : "")}</p>
            <div className="space-y-4">
              <div className="flex gap-2">
                 <div className="flex-1">
                     <input autoFocus className="w-full border-2 border-black rounded p-3 text-lg font-bold text-black" placeholder={t("Car (e.g. Swift & Alto)")} value={input.carName} onChange={e => setInput({...input, carName: e.target.value})} />
                     <p className="text-[10px] text-gray-500 mt-1">{t("Tip: Use 'Swift & Alto' for shared items.")}</p>
                 </div>
                 <VoiceInput onResult={(txt) => setInput(prev => ({...prev, carName: txt}))} isDark={false} />
              </div>
              {input.carName && (() => {
                  const existing = (data.entries || []).filter(e => activePage && e.pageId === activePage.id && e.car.toLowerCase().includes(input.carName.toLowerCase())).reduce((a,b) => a+b.qty, 0);
                  return existing > 0 ? <div className="p-2 bg-yellow-100 border border-yellow-300 rounded text-yellow-800 text-sm font-bold text-center">{t("Already have")} {existing} {t("in stock!")}</div> : null;
              })()}
              <input type="number" className="w-full border-2 border-black rounded p-3 text-lg font-bold text-black" placeholder={t("Qty")} value={input.qty} onChange={e => setInput({...input, qty: e.target.value})} />
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setIsNewEntryOpen(false)} className="flex-1 py-3 bg-gray-200 rounded font-bold text-black">{t("Cancel")}</button>
              <button onClick={handleAddEntry} className="flex-1 py-3 bg-blue-600 text-white rounded font-bold">{t("Save")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
    return (
        <ErrorBoundary>
            <DukanRegister />
        </ErrorBoundary>
    );
    }

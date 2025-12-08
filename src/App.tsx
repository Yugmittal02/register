import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  LayoutDashboard,
  Package,
  Search,
  Bell,
  Plus,
  Minus,
  Menu,
  X,
  AlertTriangle,
  TrendingUp,
  Trash2,
  Car,
  FolderPlus,
  Folder,
  ArrowLeft,
  ChevronLeft,
  FileText,
  DollarSign,
  Settings,
  LogOut,
  Sun,
  Moon,
  Mic,
  MessageSquare,
  Send,
  Lock,
  User,
  CheckCircle
} from 'lucide-react';

// --- DATA PERSISTENCE HELPERS ---
const loadFromStorage = (key, initial) => {
  const saved = localStorage.getItem(key);
  return saved ? JSON.parse(saved) : initial;
};

const initialProducts = [
  { id: 1, name: 'Leather Seat Covers (Swift)', category: 'Interior', price: 4500, stock: 12, compatibleCars: ['swift', 'dzire'] },
  { id: 2, name: 'Android Screen 9" (Universal)', category: 'Electronics', price: 8500, stock: 4, compatibleCars: ['universal', 'swift', 'creta', 'thar'] },
  { id: 3, name: 'Alloy Wheels 16" (Thar)', category: 'Exterior', price: 22000, stock: 2, compatibleCars: ['thar', 'scorpio'] },
  { id: 4, name: 'Car Body Cover (Sedan)', category: 'Exterior', price: 1200, stock: 20, compatibleCars: ['city', 'verna', 'ciaz'] },
  { id: 5, name: 'LED Headlights H4', category: 'Electronics', price: 3200, stock: 8, compatibleCars: ['swift', 'baleno', 'i20', 'universal'] },
  { id: 6, name: '7D Floor Mats (Creta)', category: 'Interior', price: 2800, stock: 3, compatibleCars: ['creta'] },
  { id: 7, name: 'Tyre Inflator', category: 'Tools', price: 1800, stock: 15, compatibleCars: ['universal', 'swift', 'thar', 'creta', 'city'] },
  { id: 8, name: 'Bass Tube 12"', category: 'Electronics', price: 4500, stock: 6, compatibleCars: ['universal'] },
  { id: 9, name: 'Roof Rails (Thar)', category: 'Exterior', price: 3500, stock: 0, compatibleCars: ['thar'] },
];

const initialCategories = ['All Items', 'Interior', 'Exterior', 'Electronics', 'Tools'];

const initialTransactions = [
  { id: 101, type: 'Sale', productName: 'Leather Seat Covers', amount: 4500, date: 'Today, 10:00 AM' },
  { id: 102, type: 'Restock', productName: 'Car Body Cover', amount: 0, date: 'Yesterday, 6:00 PM' }
];

// --- VOICE INPUT COMPONENT ---
const VoiceInput = ({ onResult, isDark }) => {
  const [isListening, setIsListening] = useState(false);

  const startListening = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'hi-IN'; // Optimized for Hindi/Indian English
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        onResult(transcript);
      };
      recognition.start();
    } else {
      alert("Voice search not supported in this browser.");
    }
  };

  return (
    <button
      onClick={startListening}
      className={`p-2 rounded-full transition-all ${isListening ? 'animate-pulse bg-red-500 text-white' : (isDark ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-blue-600')}`}
      title="Speak to Search (Hindi/English)"
    >
      <Mic size={20} />
    </button>
  );
};

// --- LOGIN COMPONENT ---
const LoginScreen = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    // HARDCODED SECURE CREDENTIALS FOR DEMO
    if (username === 'admin' && password === 'password123') {
      onLogin();
    } else {
      setError('Invalid Credentials');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-slate-700">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/20">
             <span className="text-white font-bold text-2xl">AH</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Welcome Back</h1>
          <p className="text-slate-400 mt-2">Sign in to AutoHub Enterprise</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-slate-400 text-sm font-bold mb-2 uppercase">Username</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="Enter username"
              />
            </div>
          </div>
          <div>
            <label className="block text-slate-400 text-sm font-bold mb-2 uppercase">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="Enter password"
              />
            </div>
          </div>
          
          {error && <div className="text-red-400 text-sm text-center bg-red-900/20 p-2 rounded border border-red-900/50">{error}</div>}

          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-all shadow-lg shadow-blue-600/20 active:scale-95">
            Secure Login
          </button>
        </form>
        <div className="mt-6 text-center text-xs text-slate-500">
          <p>Protected by Enterprise Guard AI</p>
        </div>
      </div>
    </div>
  );
};

// --- AI ASSISTANT COMPONENT ---
const AIChatBot = ({ products, transactions, isDark, businessName }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([
    { role: 'ai', text: `Namaste! Main ${businessName} ka AI Assistant hu. Stock, price ya sales ke baare mein kuch bhi puchiye.` }
  ]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const processQuery = (text) => {
    const lowerText = text.toLowerCase();
    let response = "Maaf kijiye, mujhe samajh nahi aaya. Kripya products, stock ya sales ke baare mein puchiye.";

    // Logic to simulate "Knowing the whole business"
    if (lowerText.includes('total stock') || lowerText.includes('kitne item')) {
      const totalStock = products.reduce((acc, p) => acc + p.stock, 0);
      response = `Humare paas kul ${products.length} alag products hain, aur total ${totalStock} units stock mein hain.`;
    } 
    else if (lowerText.includes('sale') || lowerText.includes('kamai') || lowerText.includes('revenue')) {
      const totalSales = transactions.filter(t => t.type === 'Sale').reduce((acc, t) => acc + t.amount, 0);
      response = `Aaj ki total sales abhi tak ₹${totalSales.toLocaleString()} hui hai.`;
    }
    else if (lowerText.includes('low') || lowerText.includes('kam') || lowerText.includes('khatam')) {
      const lowStock = products.filter(p => p.stock < 5).map(p => p.name).join(', ');
      response = lowStock ? `Ye items khatam hone wale hain: ${lowStock}` : "Sabhi items ka stock sufficient hai.";
    }
    else {
      // Product search logic
      const foundProduct = products.find(p => lowerText.includes(p.name.toLowerCase().split(' ')[0].toLowerCase()));
      if (foundProduct) {
        response = `${foundProduct.name} ka price ₹${foundProduct.price} hai aur abhi ${foundProduct.stock} units available hain. Ye ${foundProduct.compatibleCars.join(', ')} ke liye compatible hai.`;
      }
    }

    return response;
  };

  const handleSend = () => {
    if (!query.trim()) return;
    const userMsg = { role: 'user', text: query };
    setMessages(prev => [...prev, userMsg]);
    setQuery('');

    setTimeout(() => {
      const aiResponse = processQuery(userMsg.text);
      setMessages(prev => [...prev, { role: 'ai', text: aiResponse }]);
    }, 600);
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="fixed bottom-6 right-6 z-50 p-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full shadow-2xl text-white hover:scale-105 transition-transform"
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>

      {isOpen && (
        <div className={`fixed bottom-24 right-6 z-50 w-80 md:w-96 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-in border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`} style={{height: '500px'}}>
          <div className="p-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex justify-between items-center">
             <div>
               <h3 className="font-bold flex items-center gap-2"><div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"/> Business AI</h3>
               <p className="text-xs opacity-80">Hindi & Voice Enabled</p>
             </div>
          </div>
          
          <div className={`flex-1 overflow-y-auto p-4 space-y-3 ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}>
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : (isDark ? 'bg-slate-700 text-slate-200 rounded-bl-none' : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none')}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className={`p-3 border-t flex items-center gap-2 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            <VoiceInput onResult={setQuery} isDark={isDark} />
            <input 
              type="text" 
              value={query} 
              onChange={e => setQuery(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleSend()}
              placeholder="Ask AI (e.g., Stock check)..."
              className={`flex-1 bg-transparent border-none outline-none text-sm ${isDark ? 'text-white placeholder-slate-500' : 'text-slate-800'}`}
            />
            <button onClick={handleSend} className="text-indigo-500 hover:text-indigo-600 p-2"><Send size={20}/></button>
          </div>
        </div>
      )}
    </>
  );
};

const SidebarItem = ({ icon: Icon, label, active, onClick, collapsed }) => (
  <button
    onClick={onClick}
    className={`
      flex items-center w-full py-3 transition-all duration-200 group
      ${collapsed ? 'justify-center px-2' : 'px-4 space-x-3'}
      ${active
        ? 'bg-blue-600 text-white shadow-md'
        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }
    `}
    title={collapsed ? label : ''}
  >
    <Icon size={20} className={`shrink-0 ${active ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
    {!collapsed && <span className="text-sm font-medium tracking-wide whitespace-nowrap">{label}</span>}
    {active && !collapsed && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
  </button>
);

const StatCard = ({ title, value, icon: Icon, color, subtext, onClick, clickable, isDark }) => {
  const colorClasses = {
    blue: isDark ? 'bg-blue-900/30 text-blue-400 border-blue-800' : 'bg-blue-50 text-blue-600 border-blue-200',
    red: isDark ? 'bg-red-900/30 text-red-400 border-red-800' : 'bg-red-50 text-red-600 border-red-200',
    green: isDark ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800' : 'bg-emerald-50 text-emerald-600 border-emerald-200',
  };

  return (
    <div
      onClick={onClick}
      className={`p-5 rounded-lg border shadow-sm flex items-start justify-between relative overflow-hidden group transition-all
        ${isDark ? 'bg-slate-800 border-slate-700 hover:border-blue-500' : 'bg-white border-slate-200 hover:border-blue-400'}
        ${clickable ? 'cursor-pointer hover:shadow-md' : ''}`}
    >
      <div className="z-10">
        <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{title}</p>
        <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{value}</h3>
        {subtext && <p className={`text-xs mt-2 font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{subtext}</p>}
      </div>
      <div className={`p-3 rounded-md ${colorClasses[color]} z-10 border`}>
        <Icon size={22} />
      </div>
      <Icon className={`absolute -bottom-4 -right-4 w-24 h-24 opacity-5 transform group-hover:scale-110 transition-transform ${isDark ? 'text-white' : 'text-slate-900'}`} />
    </div>
  );
};

const ProductDetailModal = ({ product, onClose, onStockChange, isDark }) => {
  if (!product) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm animate-fade-in p-4">
      <div className={`rounded-lg shadow-2xl w-full max-w-lg overflow-hidden border animate-scale-in flex flex-col max-h-[90vh] ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
        <div className={`px-6 py-4 border-b flex justify-between items-center ${isDark ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
          <div>
            <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{product.name}</h3>
            <span className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>ID: #{product.id}</span>
          </div>
          <button onClick={onClose} className={`p-1 rounded-full transition-colors ${isDark ? 'text-slate-400 hover:bg-slate-700 hover:text-white' : 'text-slate-400 hover:bg-slate-200 hover:text-slate-700'}`}>
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          <div className="grid grid-cols-2 gap-4">
             <div className={`p-4 rounded-md border ${isDark ? 'bg-blue-900/20 border-blue-900/50' : 'bg-blue-50/50 border-blue-100'}`}>
                <p className="text-blue-500 text-xs font-bold uppercase">Unit Price</p>
                <p className={`text-xl font-bold ${isDark ? 'text-blue-100' : 'text-slate-800'}`}>₹{product.price.toLocaleString()}</p>
             </div>
             <div className={`p-4 rounded-md border ${isDark ? 'bg-slate-700/50 border-slate-600' : 'bg-slate-50 border-slate-100'}`}>
                <p className={`text-xs font-bold uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Current Stock</p>
                <div className="flex items-center gap-2">
                  <p className={`text-xl font-bold ${product.stock < 5 ? 'text-red-500' : 'text-emerald-500'}`}>
                    {product.stock}
                  </p>
                  <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>units</span>
                </div>
             </div>
          </div>

          <div>
            <p className={`text-xs font-bold uppercase mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Compatibility Map</p>
            <div className="flex flex-wrap gap-2">
              {product.compatibleCars.map((car, idx) => (
                <span key={idx} className={`px-2 py-1 text-xs font-medium rounded border shadow-sm capitalize flex items-center gap-1 ${isDark ? 'bg-slate-700 border-slate-600 text-slate-200' : 'bg-white border-slate-200 text-slate-700'}`}>
                  <Car size={10} className={isDark ? 'text-slate-400' : 'text-slate-400'}/> {car}
                </span>
              ))}
            </div>
          </div>

          <div className={`p-4 rounded-md border ${isDark ? 'bg-slate-700/30 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
            <p className={`text-center text-xs font-bold uppercase mb-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Inventory Adjustment</p>
            <div className="flex items-center justify-center space-x-6">
               <button
                 onClick={() => onStockChange(product.id, -1)}
                 className={`w-10 h-10 rounded-md border flex items-center justify-center transition-all shadow-sm active:scale-95 ${isDark ? 'bg-slate-800 border-slate-600 text-red-400 hover:bg-slate-700' : 'bg-white border-slate-300 text-red-500 hover:bg-red-50'}`}
               >
                 <Minus size={20}/>
               </button>
               <span className={`font-mono text-2xl font-bold w-16 text-center ${isDark ? 'text-white' : 'text-slate-800'}`}>{product.stock}</span>
               <button
                 onClick={() => onStockChange(product.id, 1)}
                 className={`w-10 h-10 rounded-md border flex items-center justify-center transition-all shadow-md active:scale-95 ${isDark ? 'bg-blue-600 border-blue-600 text-white hover:bg-blue-500' : 'bg-slate-800 border-slate-800 text-white hover:bg-slate-700'}`}
               >
                 <Plus size={20}/>
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function ERPSystem() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // -- STATE INITIALIZATION WITH PERSISTENCE --
  const [activeTab, setActiveTab] = useState('dashboard');
  const [theme, setTheme] = useState(() => loadFromStorage('theme', 'light'));
  const [products, setProducts] = useState(() => loadFromStorage('products', initialProducts));
  const [categories, setCategories] = useState(() => loadFromStorage('categories', initialCategories));
  const [transactions, setTransactions] = useState(() => loadFromStorage('transactions', initialTransactions));
  const [notes, setNotes] = useState(() => loadFromStorage('notes', "• Order new mats for Swift\n• Call distributor regarding delayed shipment."));
  const [businessName, setBusinessName] = useState(() => loadFromStorage('businessName', 'AutoHub Enterprise'));
  const [lowStockThreshold, setLowStockThreshold] = useState(() => loadFromStorage('threshold', 5));
  const [currency, setCurrency] = useState('₹');

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [dashboardView, setDashboardView] = useState('overview');
  const [selectedProductForDetail, setSelectedProductForDetail] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Items');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', category: '', price: '', stock: '', compatibleCars: '' });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [carModelSearch, setCarModelSearch] = useState('');
  const [selectedCarCategory, setSelectedCarCategory] = useState(null);

  // Check login on mount
  useEffect(() => {
    const authStatus = localStorage.getItem('isAuthenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
    localStorage.setItem('isAuthenticated', 'true');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('isAuthenticated');
  };

  // Persist Data on Change
  useEffect(() => localStorage.setItem('products', JSON.stringify(products)), [products]);
  useEffect(() => localStorage.setItem('categories', JSON.stringify(categories)), [categories]);
  useEffect(() => localStorage.setItem('transactions', JSON.stringify(transactions)), [transactions]);
  useEffect(() => localStorage.setItem('notes', JSON.stringify(notes)), [notes]);
  useEffect(() => localStorage.setItem('theme', JSON.stringify(theme)), [theme]);
  useEffect(() => localStorage.setItem('businessName', JSON.stringify(businessName)), [businessName]);
  useEffect(() => localStorage.setItem('threshold', JSON.stringify(lowStockThreshold)), [lowStockThreshold]);

  // Derived state for theme
  const isDark = theme === 'dark';

  const lowStockItems = useMemo(() => products.filter(p => p.stock < lowStockThreshold), [products, lowStockThreshold]);
  const totalValue = useMemo(() => products.reduce((acc, curr) => acc + (curr.price * curr.stock), 0), [products]);

  const filteredProducts = useMemo(() => 
    products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'All Items' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    }), 
  [products, searchTerm, selectedCategory]);

  const carSearchMatches = useMemo(() => {
    const searchLower = carModelSearch.toLowerCase().trim();
    if (searchLower.length <= 2) return [];
    return products.filter(p => p.compatibleCars.some(car => car === 'universal' || car.includes(searchLower)));
  }, [products, carModelSearch]);

  const carMatchCategories = useMemo(() => {
    const groups = {};
    carSearchMatches.forEach(p => {
      if (!groups[p.category]) groups[p.category] = [];
      groups[p.category].push(p);
    });
    return groups;
  }, [carSearchMatches]);

  const handleStockChange = (id, amount) => {
    setProducts(currentProducts => {
      const product = currentProducts.find(p => p.id === id);
      if (!product) return currentProducts;

      if (amount !== 0) {
        const type = amount > 0 ? 'Restock' : 'Sale';
        const newTransaction = {
          id: Date.now(),
          type,
          productName: product.name,
          amount: amount > 0 ? 0 : product.price,
          date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setTransactions(prev => [newTransaction, ...prev]);
      }

      return currentProducts.map(p => {
        if (p.id === id) {
          const newStock = Math.max(0, p.stock + amount);
          return { ...p, stock: newStock };
        }
        return p;
      });
    });
  };

  const handleAddCategory = (e) => {
    e.preventDefault();
    if (newCategoryName && !categories.includes(newCategoryName)) {
      setCategories([...categories, newCategoryName]);
      setNewCategoryName('');
      setIsCategoryModalOpen(false);
    }
  };

  const handleDeleteCategory = (catName, e) => {
    e.stopPropagation();
    if (catName === 'All Items') return;
    if (window.confirm(`Delete category "${catName}"?`)) {
      if (window.confirm(`WARNING: This will delete all items in "${catName}". Continue?`)) {
          setCategories(categories.filter(c => c !== catName));
          if (selectedCategory === catName) setSelectedCategory('All Items');
          setProducts(products.filter(p => p.category !== catName));
      }
    }
  };

  const handleAddProduct = (e) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price) return;
    const carsArray = newProduct.compatibleCars.split(',').map(car => car.trim().toLowerCase()).filter(i => i);
    if (carsArray.length === 0) carsArray.push('universal');

    const newItem = {
      id: Date.now(),
      name: newProduct.name,
      category: newProduct.category || 'General',
      price: parseFloat(newProduct.price),
      stock: parseInt(newProduct.stock) || 0,
      compatibleCars: carsArray
    };
    setProducts([...products, newItem]);
    setNewProduct({ name: '', category: '', price: '', stock: '', compatibleCars: '' });
    setIsAddModalOpen(false);
  };

  // --- RENDER FUNCTIONS ---

  const renderDashboard = () => {
    if (dashboardView === 'transactions') {
      return (
        <div className="animate-fade-in flex flex-col h-full">
           <div className="flex items-center justify-between mb-4 shrink-0">
             <button onClick={() => setDashboardView('overview')} className="flex items-center text-slate-500 hover:text-blue-600 transition-colors font-medium">
               <ArrowLeft size={18} className="mr-2"/> Back to Dashboard
             </button>
             <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>Transaction History</h2>
           </div>

           <div className={`rounded-lg shadow-sm border flex-1 overflow-hidden flex flex-col ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
             <div className="overflow-auto flex-1">
               <table className="w-full text-left text-sm">
                 <thead className={`font-semibold sticky top-0 z-10 border-b ${isDark ? 'bg-slate-900 text-slate-400 border-slate-700' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                   <tr>
                     <th className="px-6 py-3">Time</th>
                     <th className="px-6 py-3">Type</th>
                     <th className="px-6 py-3">Product</th>
                     <th className="px-6 py-3 text-right">Value</th>
                   </tr>
                 </thead>
                 <tbody className={`divide-y ${isDark ? 'divide-slate-700' : 'divide-slate-100'}`}>
                   {transactions.map(t => (
                     <tr key={t.id} className={`${isDark ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50'}`}>
                       <td className={`px-6 py-3 font-mono text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{t.date}</td>
                       <td className="px-6 py-3">
                         <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide border ${t.type === 'Sale' ? (isDark ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800' : 'bg-emerald-50 text-emerald-700 border-emerald-100') : (isDark ? 'bg-blue-900/30 text-blue-400 border-blue-800' : 'bg-blue-50 text-blue-700 border-blue-100')}`}>
                           {t.type}
                         </span>
                       </td>
                       <td className={`px-6 py-3 font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{t.productName}</td>
                       <td className={`px-6 py-3 text-right font-mono ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{t.amount > 0 ? `+₹${t.amount}` : '-'}</td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           </div>
        </div>
      );
    }

    return (
      <div className="space-y-6 animate-fade-in pb-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <StatCard
            isDark={isDark}
            title="Total Inventory"
            value={products.length}
            icon={Package}
            color="blue"
            subtext="Unique SKUs"
            clickable
            onClick={() => setActiveTab('inventory')}
          />
          <StatCard
            isDark={isDark}
            title="Critical Stock"
            value={lowStockItems.length}
            icon={AlertTriangle}
            color="red"
            subtext={lowStockItems.length > 0 ? "Items need attention" : "Stock healthy"}
            clickable
            onClick={() => setShowNotifications(true)}
          />
          <StatCard
            isDark={isDark}
            title="Total Valuation"
            value={`₹${totalValue.toLocaleString()}`}
            icon={TrendingUp}
            color="green"
            subtext="Current Asset Value"
            clickable
            onClick={() => setDashboardView('transactions')}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[400px]">
          <div className={`rounded-lg shadow-sm border flex flex-col overflow-hidden ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            <div className={`p-3 border-b flex items-center justify-between ${isDark ? 'border-slate-700 bg-slate-900/30' : 'border-slate-200 bg-slate-50'}`}>
              <h3 className={`font-bold text-sm uppercase tracking-wide flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <FileText size={16} /> System Notes
              </h3>
              <span className={`text-[10px] px-2 py-0.5 rounded ${isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-200 text-slate-600'}`}>Autosave ON</span>
            </div>
            <textarea
              className={`flex-1 w-full p-4 resize-none outline-none font-mono text-sm leading-relaxed ${isDark ? 'bg-slate-800 text-slate-300 placeholder-slate-600' : 'bg-white text-slate-700'}`}
              placeholder="Enter system notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className={`rounded-lg shadow-sm border flex flex-col overflow-hidden ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            <div className={`p-3 border-b flex justify-between items-center ${isDark ? 'border-slate-700 bg-slate-900/30' : 'border-slate-200 bg-slate-50'}`}>
              <h3 className={`font-bold text-sm uppercase tracking-wide ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Live Feed</h3>
              <button onClick={() => setDashboardView('transactions')} className="text-xs text-blue-600 hover:underline font-medium">Full History</button>
            </div>
            <div className="overflow-y-auto flex-1">
              {transactions.slice(0, 10).map(t => (
                <div key={t.id} className={`flex items-center justify-between p-3 border-b transition-colors ${isDark ? 'border-slate-700 hover:bg-slate-700/50' : 'border-slate-50 hover:bg-slate-50'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 ${t.type === 'Sale' ? (isDark ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-100 text-emerald-600') : (isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-600')}`}>
                      {t.type === 'Sale' ? <DollarSign size={14}/> : <Plus size={14}/>}
                    </div>
                    <div>
                      <p className={`text-sm font-semibold truncate max-w-[150px] ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{t.productName}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{t.date}</p>
                    </div>
                  </div>
                  {t.type === 'Sale' && <span className="font-bold text-emerald-500 text-sm font-mono">+₹{t.amount}</span>}
                </div>
              ))}
              {transactions.length === 0 && <div className="text-center text-slate-400 mt-10 text-sm">No activity recorded.</div>}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderInventory = () => (
    <div className="flex flex-col h-full animate-fade-in overflow-hidden">
      <div className={`p-4 border-b flex flex-col md:flex-row justify-between items-center gap-4 shrink-0 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
        <div className="relative w-full md:w-96 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search SKU, Name..."
              className={`w-full pl-9 pr-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${isDark ? 'bg-slate-900 border-slate-600 text-white placeholder-slate-500' : 'bg-white border-slate-300'}`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <VoiceInput onResult={setSearchTerm} isDark={isDark} />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button onClick={() => setIsCategoryModalOpen(true)} className={`flex-1 md:flex-none px-4 py-2 border rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${isDark ? 'bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'}`}>
            <FolderPlus size={16} /> <span className="hidden sm:inline">New Category</span>
          </button>
          <button onClick={() => setIsAddModalOpen(true)} className={`flex-1 md:flex-none px-4 py-2 text-white rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 shadow-sm ${isDark ? 'bg-blue-600 hover:bg-blue-500' : 'bg-slate-900 hover:bg-slate-800'}`}>
            <Plus size={16} /> <span className="hidden sm:inline">Add Product</span>
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className={`hidden md:flex flex-col border-r transition-all duration-300 ${isSidebarCollapsed ? 'w-0 overflow-hidden' : 'w-56'} ${isDark ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
           <div className="p-3">
             <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Filters</h3>
             <div className="space-y-1">
               {categories.map(cat => (
                 <div key={cat} className="group flex items-center">
                   <button
                     onClick={() => setSelectedCategory(cat)}
                     className={`flex-1 text-left px-3 py-2 rounded-md text-xs font-semibold flex items-center justify-between transition-colors ${
                       selectedCategory === cat
                         ? (isDark ? 'bg-slate-800 text-blue-400 shadow-sm border border-slate-700' : 'bg-white text-blue-700 shadow-sm border border-slate-200')
                         : (isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-600 hover:bg-white hover:shadow-sm')
                     }`}
                   >
                     <span>{cat}</span>
                     {selectedCategory === cat && <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>}
                   </button>
                   {cat !== 'All Items' && (
                     <button
                       onClick={(e) => handleDeleteCategory(cat, e)}
                       className="text-slate-300 hover:text-red-500 p-1.5 opacity-0 group-hover:opacity-100 transition-all"
                       title="Delete Category"
                     >
                       <Trash2 size={12}/>
                     </button>
                   )}
                 </div>
               ))}
             </div>
           </div>
        </div>

        <div className={`md:hidden w-full p-2 border-b ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
          <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className={`w-full p-2 border rounded text-sm ${isDark ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white border-slate-300'}`}>
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>

        <div className={`flex-1 overflow-hidden flex flex-col ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
          <div className={`px-4 py-2 border-b flex justify-between items-center shrink-0 ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-100 bg-white'}`}>
            <h3 className={`font-bold text-sm flex items-center gap-2 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
              <Folder size={16} className="text-blue-500"/>
              {selectedCategory}
            </h3>
            <span className="text-xs text-slate-400 font-mono">{filteredProducts.length} records found</span>
          </div>

          <div className="overflow-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead className={`text-[11px] uppercase font-bold tracking-wider sticky top-0 z-10 border-b shadow-sm ${isDark ? 'bg-slate-900 text-slate-400 border-slate-700' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                <tr>
                  <th className="px-4 py-3">Product Name</th>
                  <th className="px-4 py-3 text-right hidden sm:table-cell">Price</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center">Stock Control</th>
                </tr>
              </thead>
              <tbody className={`divide-y text-sm ${isDark ? 'divide-slate-700' : 'divide-slate-100'}`}>
                {filteredProducts.map((product) => (
                  <tr key={product.id} className={`transition-colors group ${isDark ? 'hover:bg-slate-700/50' : 'hover:bg-blue-50/30'}`}>
                    <td className="px-4 py-2.5">
                      <div className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{product.name}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5 sm:hidden">₹{product.price}</div>
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-slate-500 hidden sm:table-cell">₹{product.price.toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                        product.stock < lowStockThreshold
                          ? (isDark ? 'bg-red-900/30 text-red-400 border-red-800' : 'bg-red-50 text-red-700 border-red-100')
                          : (isDark ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800' : 'bg-emerald-50 text-emerald-700 border-emerald-100')
                      }`}>
                        {product.stock} Units
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-center space-x-1 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button
                           onClick={() => handleStockChange(product.id, -1)}
                           className={`w-7 h-7 flex items-center justify-center rounded border transition-colors ${isDark ? 'bg-slate-800 border-slate-600 text-red-400 hover:bg-slate-700' : 'bg-white border-slate-200 text-red-600 hover:bg-red-50 hover:border-red-200'}`}
                           title="Sell/Reduce"
                        >
                           <Minus size={12}/>
                        </button>
                        <button
                          onClick={() => setSelectedProductForDetail(product)}
                          className={`px-2 h-7 text-xs rounded border font-medium transition-colors ${isDark ? 'bg-slate-800 border-slate-600 text-slate-300 hover:bg-blue-900/30 hover:text-blue-400 hover:border-blue-800' : 'bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 border-slate-200'}`}
                        >
                          View
                        </button>
                        <button
                           onClick={() => handleStockChange(product.id, 1)}
                           className={`w-7 h-7 flex items-center justify-center rounded border transition-colors ${isDark ? 'bg-slate-800 border-slate-600 text-emerald-400 hover:bg-slate-700' : 'bg-white border-slate-200 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200'}`}
                           title="Restock/Add"
                        >
                           <Plus size={12}/>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredProducts.length === 0 && (
              <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                <Search size={48} className="mb-2 opacity-20"/>
                <p>No products found in this category.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderCarSearch = () => {
    if (selectedCarCategory) {
      const categoryProducts = carMatchCategories[selectedCarCategory] || [];
      return (
        <div className="max-w-5xl mx-auto animate-fade-in p-6 h-full overflow-auto">
          <button
            onClick={() => setSelectedCarCategory(null)}
            className="mb-6 flex items-center text-slate-500 hover:text-blue-600 transition-colors font-medium"
          >
            <ArrowLeft size={20} className="mr-2"/> Back to Categories
          </button>

          <div className={`rounded-lg shadow-sm border overflow-hidden ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center">
                <Folder className="mr-3 text-blue-400" size={20} />
                {selectedCarCategory} <span className="text-slate-400 mx-2">/</span> {carModelSearch}
              </h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryProducts.map(product => (
                 <div key={product.id} 
                      onClick={() => setSelectedProductForDetail(product)}
                      className={`border p-4 rounded-lg hover:shadow-md transition-all cursor-pointer group relative ${isDark ? 'bg-slate-800 border-slate-700 hover:border-blue-500' : 'bg-white border-slate-200 hover:border-blue-300'}`}
                 >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className={`font-bold line-clamp-2 text-sm group-hover:text-blue-600 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{product.name}</h4>
                      <div className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${product.stock > 0 ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                    </div>
                    <div className="flex justify-between items-end mt-4">
                      <p className={`text-lg font-bold font-mono ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>₹{product.price}</p>
                      <span className="text-[10px] text-blue-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity">VIEW DETAILS</span>
                    </div>
                 </div>
              ))}
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="flex items-center justify-center h-full p-6 animate-fade-in">
        <div className="w-full max-w-2xl text-center space-y-8">
          <div className={`inline-block p-6 rounded-full mb-4 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-blue-50 border-blue-100'}`}>
            <Car className={`w-12 h-12 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
          </div>
          <h2 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>ERP Smart Car Finder</h2>
          <p className="text-slate-500 max-w-md mx-auto">Enter a vehicle model to instantly filter the entire database for compatible parts.</p>

          <div className="relative max-w-lg mx-auto group">
             <div className="flex gap-2">
                 <div className="relative flex-1">
                     <input
                       type="text"
                       className={`block w-full pl-6 pr-14 py-4 border rounded-lg text-lg shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all ${isDark ? 'bg-slate-800 border-slate-600 text-white placeholder-slate-500' : 'bg-white border-slate-300'}`}
                       placeholder="e.g. Swift, Thar, Creta..."
                       value={carModelSearch}
                       onChange={(e) => {
                         setCarModelSearch(e.target.value);
                         setSelectedCarCategory(null);
                       }}
                     />
                     <div className="absolute right-3 top-1/2 -translate-y-1/2 bg-slate-900 p-2 rounded-md text-white shadow-md group-focus-within:bg-blue-600 transition-colors">
                       <Search size={20} />
                     </div>
                 </div>
                 <div className="flex items-center justify-center">
                    <VoiceInput onResult={setCarModelSearch} isDark={isDark} />
                 </div>
             </div>
          </div>

          {carModelSearch.length > 2 && Object.keys(carMatchCategories).length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-8 text-left">
              {Object.keys(carMatchCategories).map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCarCategory(cat)}
                  className={`p-4 rounded-lg border transition-all flex items-center justify-between group ${isDark ? 'bg-slate-800 border-slate-700 hover:border-blue-500' : 'bg-white border-slate-200 hover:border-blue-400 hover:shadow-md'}`}
                >
                  <span className={`font-semibold group-hover:text-blue-700 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{cat}</span>
                  <span className={`text-xs px-2 py-1 rounded font-mono group-hover:bg-blue-50 group-hover:text-blue-700 ${isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-600'}`}>
                    {carMatchCategories[cat].length}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderSettings = () => (
    <div className="animate-fade-in space-y-6 pb-10 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>Settings</h1>
        <span className={`text-sm px-4 py-2 rounded-full ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>System Configuration</span>
      </div>

      <div className={`rounded-lg shadow-sm border p-6 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
        <h2 className={`text-lg font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
           <Sun size={20} className={isDark ? 'text-orange-400' : 'text-orange-600'}/>
           Appearance
        </h2>
        <div className="flex gap-4">
           <button 
             onClick={() => setTheme('light')} 
             className={`flex-1 p-4 rounded-lg border-2 flex items-center justify-center gap-2 transition-all ${!isDark ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-700 bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
           >
              <Sun size={20}/> Light Mode
           </button>
           <button 
             onClick={() => setTheme('dark')} 
             className={`flex-1 p-4 rounded-lg border-2 flex items-center justify-center gap-2 transition-all ${isDark ? 'border-blue-500 bg-slate-700 text-blue-400' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
           >
              <Moon size={20}/> Dark Mode
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`rounded-lg shadow-sm border p-6 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <h2 className={`text-lg font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
            <Settings size={20} className="text-blue-600" />
            Business Settings
          </h2>
          <div className="space-y-4">
            <div>
              <label className={`text-sm font-semibold mb-2 block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Business Name</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDark ? 'bg-slate-900 border-slate-600 text-white' : 'bg-white border-slate-300'}`}
              />
            </div>
            <div>
              <label className={`text-sm font-semibold mb-2 block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Low Stock Alert Threshold</label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={lowStockThreshold}
                  onChange={(e) => setLowStockThreshold(parseInt(e.target.value))}
                  className="flex-1"
                />
                <div className={`flex items-center justify-center w-16 h-10 border rounded-md ${isDark ? 'bg-slate-900 border-slate-600 text-blue-400' : 'bg-blue-50 border-blue-200 text-blue-700'}`}>
                  <span className="font-bold">{lowStockThreshold}</span>
                </div>
              </div>
            </div>
            <div>
              <label className={`text-sm font-semibold mb-2 block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Currency Symbol</label>
              <input
                type="text"
                maxLength={3}
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDark ? 'bg-slate-900 border-slate-600 text-white' : 'bg-white border-slate-300'}`}
              />
            </div>
          </div>
        </div>

        <div className={`rounded-lg shadow-sm border p-6 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <h2 className={`text-lg font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
            <Package size={20} className="text-emerald-600" />
            Inventory Stats
          </h2>
          <div className="space-y-3">
            <div className={`p-4 rounded-lg border ${isDark ? 'bg-slate-700/50 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
              <p className="text-xs font-bold text-slate-500 uppercase mb-1">Total Products</p>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{products.length}</p>
            </div>
            <div className={`p-4 rounded-lg border ${isDark ? 'bg-slate-700/50 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
              <p className="text-xs font-bold text-slate-500 uppercase mb-1">Total Categories</p>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{categories.length}</p>
            </div>
            <div className={`p-4 rounded-lg border ${isDark ? 'bg-slate-700/50 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
              <p className="text-xs font-bold text-slate-500 uppercase mb-1">Inventory Value</p>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{currency}{totalValue.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      <div className={`rounded-lg shadow-sm border p-6 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
        <h2 className={`text-lg font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
          <FileText size={20} className="text-blue-600" />
          Data Management
        </h2>
        <div className="space-y-4">
          <div>
            <h3 className={`font-semibold mb-3 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Export Data</h3>
            <button
              onClick={() => {
                const data = {
                  exportDate: new Date().toISOString(),
                  products,
                  categories,
                  transactions,
                  notes,
                  settings: { lowStockThreshold, businessName, currency }
                };
                const json = JSON.stringify(data, null, 2);
                const blob = new Blob([json], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `autohub-backup-${new Date().getTime()}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors flex items-center justify-center gap-2"
            >
              <FileText size={16} />
              Download Complete Backup
            </button>
            <p className="text-xs text-slate-500 mt-2">All products, transactions, and settings will be saved as JSON</p>
          </div>
          <div className="pt-2 text-center text-xs text-green-600 font-medium">
             <CheckCircle size={12} className="inline mr-1"/> Data is secure. Manual deletion disabled.
          </div>
        </div>
      </div>
    </div>
  );

  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className={`flex h-screen font-sans overflow-hidden ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <aside
        className={`flex flex-col transition-all duration-300 z-40 shrink-0 ${isDark ? 'bg-slate-900 border-r border-slate-800' : 'bg-slate-900 text-slate-300'}
          ${isMobileMenuOpen ? 'absolute inset-y-0 left-0 w-64 shadow-2xl' : 'relative hidden md:flex'}
          ${isSidebarCollapsed ? 'w-20' : 'w-64'}
        `}
      >
        <div className={`h-16 flex items-center justify-center border-b shrink-0 ${isDark ? 'border-slate-800' : 'border-slate-800'}`}>
          {isSidebarCollapsed ? (
            <span className="font-bold text-white text-xl tracking-tighter">AH</span>
          ) : (
             <div className="flex items-center gap-2">
               <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">A</div>
               <div>
                 <h1 className="text-white font-bold leading-tight truncate w-32">{businessName}</h1>
                 <p className="text-[10px] text-slate-500 uppercase tracking-widest">Enterprise</p>
               </div>
             </div>
          )}
        </div>

        <nav className="flex-1 py-6 space-y-1 overflow-y-auto custom-scrollbar px-2">
          <SidebarItem collapsed={isSidebarCollapsed} icon={LayoutDashboard} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }} />
          <SidebarItem collapsed={isSidebarCollapsed} icon={Package} label="Inventory Master" active={activeTab === 'inventory'} onClick={() => { setActiveTab('inventory'); setIsMobileMenuOpen(false); }} />
          <SidebarItem collapsed={isSidebarCollapsed} icon={Car} label="Car Finder" active={activeTab === 'related'} onClick={() => { setActiveTab('related'); setIsMobileMenuOpen(false); }} />

          <div className="my-4 border-t border-slate-800 mx-2"></div>

          <SidebarItem collapsed={isSidebarCollapsed} icon={Settings} label="Settings" active={activeTab === 'settings'} onClick={() => { setActiveTab('settings'); setIsMobileMenuOpen(false); }} />
        </nav>

        <div className="p-4 border-t border-slate-800 shrink-0">
           <button onClick={handleLogout} className={`flex items-center w-full text-slate-400 hover:text-white transition-colors ${isSidebarCollapsed ? 'justify-center' : 'space-x-3 px-2'}`}>
              <LogOut size={20} />
              {!isSidebarCollapsed && <span className="text-sm font-medium">Sign Out</span>}
           </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-hidden relative min-w-0">
        <header className={`h-16 border-b flex items-center justify-between px-6 shadow-sm z-30 shrink-0 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center gap-4">
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden text-slate-600"><Menu size={24} /></button>
            <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className={`hidden md:block transition-colors ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-800'}`}>
               {isSidebarCollapsed ? <Menu size={20}/> : <ChevronLeft size={20}/>}
            </button>
            <h2 className={`text-lg font-bold capitalize hidden sm:block ${isDark ? 'text-white' : 'text-slate-800'}`}>
              {activeTab === 'related' ? 'Compatibility Engine' : activeTab === 'settings' ? 'Settings' : activeTab}
            </h2>
          </div>

          <div className="flex items-center gap-6">
              <div className={`hidden md:flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> System Online
              </div>

              <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className={`p-2 relative rounded-full transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-800'}`}
                  >
                    <Bell size={20} />
                    {lowStockItems.length > 0 && <span className="absolute top-1.5 right-2 h-2 w-2 bg-red-500 rounded-full border border-white"></span>}
                  </button>

                  {showNotifications && (
                    <div className={`absolute right-0 mt-2 w-80 rounded-lg shadow-xl border z-50 overflow-hidden animate-scale-in origin-top-right ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                      <div className={`p-3 border-b font-bold flex justify-between items-center text-sm ${isDark ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-100 text-slate-700'}`}>
                        <span>Alerts ({lowStockItems.length})</span>
                        <button onClick={() => setShowNotifications(false)}><X size={14}/></button>
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {lowStockItems.length > 0 ? (
                          lowStockItems.map(item => (
                            <div key={item.id} className={`p-3 border-b transition-colors flex items-start gap-3 cursor-pointer ${isDark ? 'border-slate-700 hover:bg-slate-700' : 'border-slate-50 hover:bg-red-50'}`} onClick={() => {setSelectedProductForDetail(item); setShowNotifications(false);}}>
                              <AlertTriangle size={16} className="text-red-500 mt-0.5 shrink-0" />
                              <div>
                                <p className={`text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{item.name}</p>
                                <p className="text-xs text-red-600 font-medium">Low Stock: {item.stock} units</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-4 text-center text-slate-400 text-sm">All systems normal.</div>
                        )}
                      </div>
                    </div>
                  )}
              </div>
          </div>
        </header>

        <div className={`flex-1 overflow-y-auto p-6 scroll-smooth ${isDark ? 'bg-slate-950' : 'bg-slate-50/50'}`}>
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'inventory' && renderInventory()}
          {activeTab === 'related' && renderCarSearch()}
          {activeTab === 'settings' && renderSettings()}
        </div>
      </main>

      {/* Floating AI Assistant */}
      <AIChatBot products={products} transactions={transactions} isDark={isDark} businessName={businessName} />

      <ProductDetailModal
         product={selectedProductForDetail}
         onClose={() => setSelectedProductForDetail(null)}
         onStockChange={handleStockChange}
         isDark={isDark}
      />

      {isAddModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div className={`rounded-lg shadow-2xl w-full max-w-md overflow-hidden animate-scale-in ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
            <div className={`p-4 border-b flex justify-between items-center ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
              <h3 className={`font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>New Product Entry</h3>
              <button onClick={() => setIsAddModalOpen(false)}><X size={20} className="text-slate-400 hover:text-slate-700"/></button>
            </div>
            <form onSubmit={handleAddProduct} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Product Name</label>
                <input required type="text" className={`w-full mt-1 border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none ${isDark ? 'bg-slate-900 border-slate-600 text-white' : 'border-slate-300'}`} value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Category</label>
                <select className={`w-full mt-1 border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none ${isDark ? 'bg-slate-900 border-slate-600 text-white' : 'border-slate-300'}`} value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})}>
                  <option value="">Select...</option>
                  {categories.slice(1).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Price (₹)</label>
                  <input required type="number" className={`w-full mt-1 border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none ${isDark ? 'bg-slate-900 border-slate-600 text-white' : 'border-slate-300'}`} value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Initial Stock</label>
                  <input type="number" className={`w-full mt-1 border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none ${isDark ? 'bg-slate-900 border-slate-600 text-white' : 'border-slate-300'}`} value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Compatible Cars</label>
                <input type="text" className={`w-full mt-1 border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none ${isDark ? 'bg-slate-900 border-slate-600 text-white' : 'border-slate-300'}`} placeholder="e.g. Swift, Universal" value={newProduct.compatibleCars} onChange={e => setNewProduct({...newProduct, compatibleCars: e.target.value})} />
              </div>
              <button type="submit" className={`w-full font-medium py-2.5 rounded-md transition-colors mt-2 ${isDark ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-slate-900 hover:bg-slate-800 text-white'}`}>Create Record</button>
            </form>
          </div>
        </div>
      )}

      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div className={`rounded-lg shadow-xl w-full max-w-sm overflow-hidden animate-scale-in ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
            <div className={`p-4 border-b flex justify-between items-center ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
              <h3 className={`font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>Add Category</h3>
              <button onClick={() => setIsCategoryModalOpen(false)}><X size={20} className="text-slate-400 hover:text-slate-700"/></button>
            </div>
            <form onSubmit={handleAddCategory} className="p-6 space-y-4">
              <input required autoFocus type="text" className={`w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none ${isDark ? 'bg-slate-900 border-slate-600 text-white' : 'border-slate-300'}`} placeholder="Category Name" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} />
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-md transition-colors">Save</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
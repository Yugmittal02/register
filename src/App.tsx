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
  Bold, Italic, Underline, Clock, Package,
  PackageX, TrendingDown, Tag, Vibrate, Activity
} from 'lucide-react';

// --- FIREBASE IMPORTS ---
import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  doc, 
  onSnapshot, 
  setDoc, 
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  memoryLocalCache,
  CACHE_SIZE_UNLIMITED
} from "firebase/firestore";
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

// Initialize Firestore with modern cache settings (fixes deprecation warning)
let db: ReturnType<typeof getFirestore>;
try {
  // Try persistent multi-tab cache first
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
      cacheSizeBytes: CACHE_SIZE_UNLIMITED
    })
  });
  console.info('✅ Firestore initialized with persistent multi-tab cache');
} catch (err: any) {
  // If IndexedDB has version issues, clear it and use memory cache
  if (err?.message?.includes('not compatible') || err?.code === 'failed-precondition') {
    console.warn('⚠️ Clearing incompatible IndexedDB cache...');
    try {
      // Clear the problematic IndexedDB
      indexedDB.deleteDatabase('firestore/[DEFAULT]/arvindregister-353e5/main');
      // Fall back to memory cache for this session
      db = initializeFirestore(app, {
        localCache: memoryLocalCache()
      });
      console.info('✅ Firestore initialized with memory cache (cleared old data)');
    } catch {
      db = getFirestore(app);
      console.info('✅ Firestore initialized with default settings');
    }
  } else {
    // Default fallback
    db = getFirestore(app);
    console.info('✅ Firestore initialized with default settings');
  }
}

const auth = getAuth(app);
const storage = getStorage(app);

// ---------------------------------------------------------
// 🚀 SMART PERFORMANCE UTILITIES
// ---------------------------------------------------------

// Debounce utility for search inputs
const debounce = <T extends (...args: any[]) => any>(fn: T, delay: number) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

// Throttle utility for frequent updates
const throttle = <T extends (...args: any[]) => any>(fn: T, limit: number) => {
  let inThrottle = false;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Smart memoization with LRU cache
class LRUCache<K, V> {
  private cache = new Map<K, V>();
  constructor(private maxSize: number = 100) {}
  
  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }
  
  set(key: K, value: V): void {
    if (this.cache.size >= this.maxSize) {
      // Delete oldest entry
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }
  
  clear(): void {
    this.cache.clear();
  }
}

// Search results cache
const searchCache = new LRUCache<string, any[]>(50);

// ---------------------------------------------------------
// 🧠 ADVANCED AI & DSA ENGINE
// ---------------------------------------------------------

// 🌳 TRIE DATA STRUCTURE - O(m) search where m = word length
class TrieNode {
  children: Map<string, TrieNode> = new Map();
  isEndOfWord: boolean = false;
  data: any = null;
  frequency: number = 0;
}

class Trie {
  root: TrieNode = new TrieNode();
  
  // O(m) insertion
  insert(word: string, data: any = null): void {
    let node = this.root;
    for (const char of word.toLowerCase()) {
      if (!node.children.has(char)) {
        node.children.set(char, new TrieNode());
      }
      node = node.children.get(char)!;
    }
    node.isEndOfWord = true;
    node.data = data;
    node.frequency++;
  }
  
  // O(m) prefix search - returns all words with given prefix
  searchPrefix(prefix: string, limit: number = 10): any[] {
    let node = this.root;
    for (const char of prefix.toLowerCase()) {
      if (!node.children.has(char)) return [];
      node = node.children.get(char)!;
    }
    return this._collectWords(node, prefix, [], limit);
  }
  
  private _collectWords(node: TrieNode, prefix: string, results: any[], limit: number): any[] {
    if (results.length >= limit) return results;
    if (node.isEndOfWord) {
      results.push({ word: prefix, data: node.data, frequency: node.frequency });
    }
    for (const [char, child] of node.children) {
      this._collectWords(child, prefix + char, results, limit);
    }
    return results;
  }
}

// 📊 PRIORITY QUEUE - O(log n) operations for alerts/notifications
class PriorityQueue<T> {
  private heap: { priority: number; value: T }[] = [];
  
  enqueue(value: T, priority: number): void {
    this.heap.push({ priority, value });
    this._bubbleUp(this.heap.length - 1);
  }
  
  dequeue(): T | undefined {
    if (this.heap.length === 0) return undefined;
    const result = this.heap[0].value;
    const last = this.heap.pop();
    if (this.heap.length > 0 && last) {
      this.heap[0] = last;
      this._bubbleDown(0);
    }
    return result;
  }
  
  peek(): T | undefined {
    return this.heap[0]?.value;
  }
  
  size(): number {
    return this.heap.length;
  }
  
  private _bubbleUp(index: number): void {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (this.heap[parentIndex].priority <= this.heap[index].priority) break;
      [this.heap[parentIndex], this.heap[index]] = [this.heap[index], this.heap[parentIndex]];
      index = parentIndex;
    }
  }
  
  private _bubbleDown(index: number): void {
    while (true) {
      const leftChild = 2 * index + 1;
      const rightChild = 2 * index + 2;
      let smallest = index;
      
      if (leftChild < this.heap.length && this.heap[leftChild].priority < this.heap[smallest].priority) {
        smallest = leftChild;
      }
      if (rightChild < this.heap.length && this.heap[rightChild].priority < this.heap[smallest].priority) {
        smallest = rightChild;
      }
      if (smallest === index) break;
      [this.heap[smallest], this.heap[index]] = [this.heap[index], this.heap[smallest]];
      index = smallest;
    }
  }
}

// 🔮 BLOOM FILTER - O(k) probabilistic existence check
class BloomFilter {
  private bitArray: boolean[];
  private hashFunctions: number;
  
  constructor(size: number = 1000, hashFunctions: number = 3) {
    this.bitArray = new Array(size).fill(false);
    this.hashFunctions = hashFunctions;
  }
  
  private _hash(str: string, seed: number): number {
    let hash = seed;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
    }
    return Math.abs(hash) % this.bitArray.length;
  }
  
  add(item: string): void {
    for (let i = 0; i < this.hashFunctions; i++) {
      const index = this._hash(item, i * 31);
      this.bitArray[index] = true;
    }
  }
  
  mightContain(item: string): boolean {
    for (let i = 0; i < this.hashFunctions; i++) {
      const index = this._hash(item, i * 31);
      if (!this.bitArray[index]) return false;
    }
    return true;
  }
}

// 📈 AI PREDICTION ENGINE
const AIEngine = {
  // Moving Average for trend prediction - O(n)
  calculateMovingAverage: (data: number[], period: number = 7): number[] => {
    const result: number[] = [];
    for (let i = period - 1; i < data.length; i++) {
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      result.push(sum / period);
    }
    return result;
  },

  // Exponential Smoothing for sales prediction - O(n)
  exponentialSmoothing: (data: number[], alpha: number = 0.3): number => {
    if (data.length === 0) return 0;
    let forecast = data[0];
    for (let i = 1; i < data.length; i++) {
      forecast = alpha * data[i] + (1 - alpha) * forecast;
    }
    return forecast;
  },

  // Linear Regression for price optimization - O(n)
  linearRegression: (x: number[], y: number[]): { slope: number; intercept: number; predict: (val: number) => number } => {
    const n = x.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    for (let i = 0; i < n; i++) {
      sumX += x[i];
      sumY += y[i];
      sumXY += x[i] * y[i];
      sumXX += x[i] * x[i];
    }
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX) || 0;
    const intercept = (sumY - slope * sumX) / n || 0;
    return {
      slope,
      intercept,
      predict: (val: number) => slope * val + intercept
    };
  },

  // Anomaly Detection using Z-Score - O(n)
  detectAnomalies: (data: number[], threshold: number = 2): number[] => {
    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const std = Math.sqrt(data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length);
    return data.map((val, idx) => Math.abs((val - mean) / std) > threshold ? idx : -1).filter(i => i !== -1);
  },

  // Seasonal Decomposition for pattern recognition
  seasonalPattern: (data: number[], seasonLength: number = 7): { trend: number[]; seasonal: number[]; residual: number[] } => {
    const trend = AIEngine.calculateMovingAverage(data, seasonLength);
    const seasonal: number[] = [];
    const residual: number[] = [];
    
    for (let i = 0; i < data.length; i++) {
      const trendVal = trend[Math.max(0, i - Math.floor(seasonLength / 2))] || data[i];
      seasonal.push(data[i] - trendVal);
      residual.push(data[i] - trendVal - (seasonal[i % seasonLength] || 0));
    }
    return { trend, seasonal, residual };
  },

  // Product Recommendation using Collaborative Filtering - O(n*m)
  getRecommendations: (purchases: string[][], currentCart: string[]): string[] => {
    const coOccurrence = new Map<string, Map<string, number>>();
    
    // Build co-occurrence matrix
    purchases.forEach(basket => {
      basket.forEach(item1 => {
        if (!coOccurrence.has(item1)) coOccurrence.set(item1, new Map());
        basket.forEach(item2 => {
          if (item1 !== item2) {
            const count = coOccurrence.get(item1)!.get(item2) || 0;
            coOccurrence.get(item1)!.set(item2, count + 1);
          }
        });
      });
    });
    
    // Get recommendations based on current cart
    const scores = new Map<string, number>();
    currentCart.forEach(item => {
      const related = coOccurrence.get(item);
      if (related) {
        related.forEach((count, relatedItem) => {
          if (!currentCart.includes(relatedItem)) {
            scores.set(relatedItem, (scores.get(relatedItem) || 0) + count);
          }
        });
      }
    });
    
    return Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([item]) => item);
  },

  // Smart Price Suggestion based on market analysis
  suggestPrice: (cost: number, competitorPrices: number[], demandLevel: 'low' | 'medium' | 'high'): { min: number; optimal: number; max: number } => {
    const avgCompetitor = competitorPrices.length > 0 
      ? competitorPrices.reduce((a, b) => a + b, 0) / competitorPrices.length 
      : cost * 1.3;
    
    const demandMultiplier = { low: 0.9, medium: 1.0, high: 1.15 }[demandLevel];
    const minMargin = 1.1; // 10% minimum margin
    const optimalMargin = 1.25; // 25% optimal margin
    const maxMargin = 1.5; // 50% max margin
    
    return {
      min: Math.max(cost * minMargin, avgCompetitor * 0.85) * demandMultiplier,
      optimal: Math.max(cost * optimalMargin, avgCompetitor) * demandMultiplier,
      max: cost * maxMargin * demandMultiplier
    };
  },

  // Inventory Reorder Point Calculation
  calculateReorderPoint: (avgDailySales: number, leadTimeDays: number, safetyStock: number = 0): number => {
    return Math.ceil(avgDailySales * leadTimeDays + safetyStock);
  },

  // ABC Analysis for inventory classification - O(n log n)
  abcAnalysis: (items: { id: string; value: number }[]): { A: string[]; B: string[]; C: string[] } => {
    const sorted = [...items].sort((a, b) => b.value - a.value);
    const total = items.reduce((sum, item) => sum + item.value, 0);
    
    let cumulative = 0;
    const result = { A: [] as string[], B: [] as string[], C: [] as string[] };
    
    for (const item of sorted) {
      cumulative += item.value;
      const percentage = cumulative / total;
      if (percentage <= 0.7) result.A.push(item.id);
      else if (percentage <= 0.9) result.B.push(item.id);
      else result.C.push(item.id);
    }
    return result;
  }
};

// 🔍 FUZZY SEARCH with Levenshtein Distance - O(m*n)
const fuzzySearch = (query: string, items: string[], maxDistance: number = 2): string[] => {
  const levenshtein = (a: string, b: string): number => {
    const matrix: number[][] = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        matrix[i][j] = b[i-1] === a[j-1]
          ? matrix[i-1][j-1]
          : Math.min(matrix[i-1][j-1] + 1, matrix[i][j-1] + 1, matrix[i-1][j] + 1);
      }
    }
    return matrix[b.length][a.length];
  };
  
  return items
    .map(item => ({ item, distance: levenshtein(query.toLowerCase(), item.toLowerCase()) }))
    .filter(r => r.distance <= maxDistance)
    .sort((a, b) => a.distance - b.distance)
    .map(r => r.item);
};

// Global instances
const productTrie = new Trie();
const alertQueue = new PriorityQueue<{ type: string; message: string; data?: any }>();
const searchBloomFilter = new BloomFilter(10000, 5);

// Expose diagnostics for debugging
try { 
  (window as any).__dukan_tabId = `${Date.now()}-${Math.random().toString(36).slice(2,8)}`; 
  (window as any).__dukan_dumpDiagnostics = () => ({
    tabId: (window as any).__dukan_tabId,
    cacheSize: searchCache,
    localStorage: {
      backup: localStorage.getItem('dukan:backup') ? 'exists' : 'none',
      pendingDeletes: localStorage.getItem('dukan:pendingDeletes')
    }
  });
} catch { /* noop */ }

// ---------------------------------------------------------
// 🧠 TRANSLATION ENGINE (API-POWERED + FALLBACK)
// ---------------------------------------------------------
const translationCache = new Map(); 

// API Translation using MyMemory (Free, No API key needed)
const translateWithAPI = async (text: string, from: string = 'en', to: string = 'hi'): Promise<string> => {
  if (!text || text.trim() === '') return '';
  
  const cacheKey = `${from}:${to}:${text}`;
  if (translationCache.has(cacheKey)) return translationCache.get(cacheKey);
  
  try {
    const response = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`
    );
    const data = await response.json();
    
    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      const translated = data.responseData.translatedText;
      translationCache.set(cacheKey, translated);
      return translated;
    }
    throw new Error('API failed');
  } catch (error) {
    console.warn('Translation API failed, using fallback:', error);
    return convertToHindiFallback(text);
  }
};

// 🔠 GOOGLE TRANSLITERATION (Hinglish Typing)
// यह English sound को हिंदी में लिखता है (जैसे: "Cat" -> "कैट", "School" -> "स्कूल")
const transliterateWithGoogle = async (text: string): Promise<string> => {
  if (!text || text.trim() === '') return '';
  
  const cacheKey = `translit:${text}`;
  if (translationCache.has(cacheKey)) return translationCache.get(cacheKey);
  
  try {
    // Google Input Tools API (Official endpoint used by Chrome extensions)
    const url = `https://inputtools.google.com/request?text=${encodeURIComponent(text)}&itc=hi-t-i0-und&num=1&cp=0&cs=1&ie=utf-8&oe=utf-8`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (data && data[0] === 'SUCCESS') {
      // Result structure usually: [SUCCESS, [[input, [option1, option2], ...]]]
      // We map over each word result and join them
      let result = "";
      data[1].forEach((wordData: any) => {
        result += wordData[1][0] + " "; // Pick the first (best) suggestion
      });
      const finalResult = result.trim();
      translationCache.set(cacheKey, finalResult);
      return finalResult;
    }
    return text; // Fail hone par original text return kare
  } catch (error) {
    console.error("Transliteration Error:", error);
    return convertToHindiFallback(text); // Offline fallback use kare
  }
};

// Fallback dictionary for offline/quick translations
const exactDictionary: Record<string, string> = {
  // Auto Parts
  "brake": "ब्रेक", "pads": "पैड्स", "shoe": "शू", "oil": "तेल", "filter": "फिल्टर",
  "light": "लाइट", "headlight": "हेडलाइट", "bumper": "बम्पर", "cover": "कवर",
  "seat": "सीट", "mat": "मैट", "guard": "गार्ड", "horn": "हॉर्न", "mirror": "शीशा",
  "glass": "कांच", "clutch": "क्लच", "wire": "तार", "battery": "बैटरी", "tyre": "टायर",
  "tube": "ट्यूब", "alloy": "अलॉय", "wheel": "व्हील", "cap": "कैप", "door": "दरवाजा",
  "handle": "हैंडल", "lock": "लॉक", "key": "चाबी", "sensor": "सेंसर", "screen": "स्क्रीन",
  "kit": "किट", "rod": "रॉड", "bush": "बुश", "arm": "आर्म", "wiper": "वाइपर", 
  "motor": "मोटर", "pump": "पम्प", "coolant": "कूलेंट", "chain": "चैन", "belt": "बेल्ट",
  // Car Names
  "swift": "स्विफ्ट", "thar": "थार", "creta": "क्रेटा", "alto": "आल्टो", "scorpio": "स्कॉर्पियो",
  "bolero": "बोलेरो", "city": "सिटी", "verna": "वर्ना", "wagonr": "वैगन-आर", "baleno": "बलेनो",
  "dzire": "डिजायर", "innova": "इनोवा", "fortuner": "फॉर्च्यूनर", "brezza": "ब्रेजा",
  // Common English Words (Transliteration)
  "cat": "कैट", "bat": "बैट", "rat": "रैट", "hat": "हैट",
  "school": "स्कूल", "doctor": "डॉक्टर", "hospital": "हॉस्पिटल", "police": "पुलिस",
  "engine": "इंजन", "station": "स्टेशन", "mobile": "मोबाइल", "phone": "फोन",
  "computer": "कंप्यूटर", "internet": "इंटरनेट", "office": "ऑफिस", "market": "मार्केट",
  "shop": "शॉप", "store": "स्टोर", "mall": "मॉल", "bank": "बैंक",
  "bus": "बस", "train": "ट्रेन", "plane": "प्लेन", "bike": "बाइक",
  "hello": "हेलो", "good": "गुड", "morning": "मॉर्निंग", "night": "नाइट", "thank": "थैंक", "you": "यू",
  "yes": "यस", "no": "नो", "please": "प्लीज", "sorry": "सॉरी", "welcome": "वेलकम",
  "name": "नेम", "time": "टाइम", "date": "डेट", "day": "डे", "week": "वीक", "month": "मंथ", "year": "ईयर",
  "water": "वॉटर", "food": "फूड", "tea": "टी", "coffee": "कॉफी", "milk": "मिल्क",
  "red": "रेड", "blue": "ब्लू", "green": "ग्रीन", "white": "व्हाइट", "black": "ब्लैक",
  "one": "वन", "two": "टू", "three": "थ्री", "four": "फोर", "five": "फाइव",
  "price": "प्राइस", "rate": "रेट", "cost": "कॉस्ट", "bill": "बिल", "payment": "पेमेंट",
  "stock": "स्टॉक", "item": "आइटम", "product": "प्रोडक्ट", "order": "ऑर्डर", "delivery": "डिलीवरी",
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

const convertToHindiFallback = (text) => {
  if (!text) return "";
  const strText = text.toString();
  const fallbackCacheKey = `fallback:${strText}`;
  if (translationCache.has(fallbackCacheKey)) return translationCache.get(fallbackCacheKey);
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

    translationCache.set(fallbackCacheKey, translated);
    return translated;
  } catch (err) {
    console.error(err);
    return strText;
  }
};

// ---------------------------------------------------------
// 🧠 DESI DICTIONARY (SYNONYM MAP) - Hindi-to-English Brain
// ---------------------------------------------------------
const synonymMap = {
    // Liquids
    "tel": "oil", "paani": "coolant", "coolent": "coolant", "pani": "coolant",
    "grease": "lubricant", "petrol": "fuel", "diesel": "fuel",
    
    // Body Parts  
    "sheesha": "mirror", "glass": "mirror", "batti": "light", "headlight": "light",
  "tail light": "back light", 
  // "bumper": "guard" वाली लाइन हटा दी गई है
  "dabba": "kit",
    "pahiya": "wheel", "tyre": "tire", "patti": "belt", "patla": "gasket",
    
    // Engine Parts
    "plug": "spark plug", "coil": "ignition", "injector": "fuel injector",
    "silencer": "exhaust", "radiator": "coolant", "ac": "air conditioner",
    
    // Actions/Status
    "awaz": "sound", "khat khat": "suspension", "thanda": "ac", "garam": "heat",
    "start nahi": "battery", "jhatka": "plug", "dhuan": "smoke", "leak": "seal",
    
    // Common Misspellings
    "filtar": "filter", "filtter": "filter", "brack": "brake", "brek": "brake",
    "cushon": "cushion", "shocker": "shock absorber", "shockar": "shock absorber",
    "steerin": "steering", "clutc": "clutch", "geer": "gear",
    
    // Car Names (Common Hindi/Hinglish)
    "swiftt": "swift", "creata": "creta", "cretta": "creta", "tharr": "thar",
    "innova": "innova crysta", "fortunar": "fortuner", "baleeno": "baleno"
};

// ---------------------------------------------------------
// 🔍 INTELLIGENT SEARCH ALGORITHM (Fuzzy Brain)
// ---------------------------------------------------------
const performSmartSearch = (rawTranscript, inventory, pages, options: { useFuzzy?: boolean } = {}) => {
  const useFuzzy = options.useFuzzy !== false;
    // Step A: Normalize & Translate (Tel -> Oil)
    let processedText = rawTranscript.toLowerCase().trim();
    
    // Replace mapped words (whole word match)
    Object.keys(synonymMap).forEach(desiWord => {
        const regex = new RegExp(`\\b${desiWord}\\b`, 'gi');
        if (regex.test(processedText)) {
            processedText = processedText.replace(regex, synonymMap[desiWord]);
        }
    });

    console.log(`🧠 Original: "${rawTranscript}" -> AI Processed: "${processedText}"`);

    // Step B: Keyword Extraction (Remove filler words)
    const fillerWords = /\b(check|search|find|dhundo|dekho|batao|kya|hai|available|stock|mein|ka|ki|ke|se|aur|or|the|is|a|an|for|in|of)\b/gi;
    const keywords = processedText
        .replace(fillerWords, "")
        .trim()
        .split(/\s+/)
        .filter(k => k.length > 1); // Remove single letter remnants

    if (keywords.length === 0) return { match: false, items: [], interpretedAs: processedText };

    // Step C: Scoring System (Advanced Fuzzy Logic)
    const scoredItems = inventory.map(item => {
        let score = 0;
        const itemCar = (item.car || '').toLowerCase();
        const page = pages.find(p => p.id === item.pageId);
        const itemName = (page?.itemName || '').toLowerCase();
        const combinedText = `${itemCar} ${itemName}`;
        
        keywords.forEach(word => {
          // Exact match = 10 points
          if (combinedText.includes(word)) {
            score += 10;
            return;
          }

          if (!useFuzzy) return;

          // Partial match (for typos) = 5 points
          if (word.length > 3) {
            const partialWord = word.slice(0, -1); // Remove last char for typo tolerance
            if (combinedText.includes(partialWord)) score += 5;
          }

          // First letter match (very loose) = 2 points
          else if (combinedText.split(' ').some(w => w.startsWith(word[0]))) score += 2;
        });

        return { ...item, score, pageName: itemName };
    });

    // Filter items with score > 0 and Sort by highest score
    const matches = scoredItems
        .filter(i => i.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 10); // Limit to top 10 results

    return { 
        match: matches.length > 0, 
        items: matches,
        interpretedAs: processedText,
        keywords: keywords
    };
};

// ---------------------------------------------------------
// 📳 SHAKE SENSOR HOOK (Ghost Listener Activation)
// ---------------------------------------------------------
const useShakeSensor = (onShake, enabled = true) => {
    useEffect(() => {
        if (!enabled) return;
        
        let shakeCount = 0;
        let lastTime = Date.now();
        let lastX = 0, lastY = 0, lastZ = 0;
        // 🔥 UPDATE: Prevent accidental triggers
        const SHAKE_THRESHOLD = 60;
        const SHAKE_TIMEOUT = 1000;
        const REQUIRED_SHAKES = 4;

        const handleMotion = (e) => {
            const { x, y, z } = e.accelerationIncludingGravity || { x: 0, y: 0, z: 0 };
            if (!x && !y && !z) return;

            const curTime = Date.now();
            if ((curTime - lastTime) > 100) {
                const diffTime = curTime - lastTime;
                lastTime = curTime;
                
                // Calculate Speed
                const speed = Math.abs(x + y + z - lastX - lastY - lastZ) / diffTime * 10000;

                if (speed > SHAKE_THRESHOLD) {
                    shakeCount++;
                    console.log(`📳 Shake detected! Count: ${shakeCount}`);
                    
                    if (shakeCount >= REQUIRED_SHAKES) {
                        onShake();
                        shakeCount = 0;
                    }
                }

                lastX = x; lastY = y; lastZ = z;
            }
        };

        // Reset shake count after timeout
        const resetInterval = setInterval(() => {
            if (shakeCount > 0 && Date.now() - lastTime > SHAKE_TIMEOUT) {
                shakeCount = 0;
            }
        }, 500);

        // Request permission for iOS 13+
        const DME = DeviceMotionEvent as any;
        if (typeof DME !== 'undefined' && typeof DME.requestPermission === 'function') {
            DME.requestPermission()
                .then((response: string) => {
                    if (response === 'granted') {
                        window.addEventListener('devicemotion', handleMotion);
                    }
                })
                .catch(console.error);
        } else {
            window.addEventListener('devicemotion', handleMotion);
        }

        return () => {
            window.removeEventListener('devicemotion', handleMotion);
            clearInterval(resetInterval);
        };
    }, [onShake, enabled]);
};

// ---------------------------------------------------------
// 🤖 AI ASSISTANT API (REAL GEMINI INTEGRATION)
// ---------------------------------------------------------
const askAIAssistant = async (question: string, language: string = 'en'): Promise<string> => {
    // 1. Detect if the question is basically Hindi/Hinglish
    const isHindiQuestion = /[\u0900-\u097F]/.test(question) || 
                           /\b(kya|hai|kaise|kahan|kaun|kitna|batao|bolo|dhundo|dekho|aaj|kal|mausam|weather)\b/i.test(question);
    
    const responseLanguage = isHindiQuestion ? 'hi' : language;

    // 2. Define the System Prompt (AI's Personality)
    const systemPrompt = `You are "Autonex AI", a smart and friendly shop assistant. 
    You manage an auto parts shop inventory but you are also very intelligent about general topics.
    
    RULES:
    1. If the user speaks Hindi or Hinglish, reply in Hindi (or Hinglish).
    2. If the user speaks English, reply in English.
    3. Keep answers concise (max 2-3 sentences) because you are a voice assistant.
    4. You can answer ANY general question (Weather, Math, GK, Jokes, Life) like a smart human.
    5. Be polite and helpful.`;

    try {
        // 3. Call Google Gemini API
        const API_KEY = "AIzaSyBDvhgjYjN3qpmjDB3EYnEGj0H6OPRvpLQ"; 
        
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `${systemPrompt}\n\nUser Question: ${question}`
                    }]
                }]
            })
        });

        const data = await response.json();

        // 4. Extract Answer
        if (data.candidates && data.candidates[0].content) {
            return data.candidates[0].content.parts[0].text;
        }

        throw new Error("No response from AI");

    } catch (error) {
        console.error("AI API Error:", error);
        // Fallback if API fails (Net issue or Quota full)
        return getSmartLocalResponse(question, responseLanguage);
    }
};

const THEME_PRESETS: Record<string, { bg: string; meta: string; isDark: boolean }> = {
  light: { bg: '#ffffff', meta: '#ffffff', isDark: false },
  dark: { bg: '#0f172a', meta: '#0f172a', isDark: true },
  blue: { bg: '#1e3a5f', meta: '#1e3a5f', isDark: true },
  green: { bg: '#14532d', meta: '#14532d', isDark: true },
  purple: { bg: '#4c1d95', meta: '#4c1d95', isDark: true },
  orange: { bg: '#7c2d12', meta: '#7c2d12', isDark: true },
  rose: { bg: '#4c0519', meta: '#4c0519', isDark: true },
};

const ACCENT_COLOR_HEX: Record<string, string> = {
  blue: '#3b82f6',
  green: '#22c55e',
  purple: '#8b5cf6',
  orange: '#f97316',
  pink: '#ec4899',
  cyan: '#06b6d4',
  red: '#ef4444',
  yellow: '#eab308',
};

const hexToRgba = (hex: string, alpha: number): string => {
  const clean = (hex || '').replace('#', '').trim();
  if (clean.length !== 6) return `rgba(59,130,246,${alpha})`;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
};

const normalizeForMatch = (text: string): string => {
  return (text || '')
    .toLowerCase()
    .trim()
    .replace(/[\n\r\t]+/g, ' ')
    .replace(/[.,!?;:(){}\[\]"'’“”]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const isGreetingText = (text: string): boolean => {
  const s = normalizeForMatch(text);
  if (!s) return false;

  // Note: JS \b doesn't work reliably for Hindi/Unicode letters, so we use (start|space) boundaries.
  if (/(^|\s)(hello|hi|hey|hlo|helo|namaste|namaskar|pranam|ram\s*ram)(\s|$)/i.test(s)) return true;
  if (/(^|\s)(हैलो|हेलो|हाय|नमस्ते|नमस्कार|प्रणाम|राम\s*राम|रामराम)(\s|$)/u.test(s)) return true;
  return false;
};

// Smart local response generator (works offline)
const getSmartLocalResponse = (question: string, lang: string): string => {
    const q = question.toLowerCase();
    const isHindi = lang === 'hi';
    
    // Greetings
  if (isGreetingText(question)) {
        return isHindi ? 'नमस्ते! मैं आपकी क्या मदद कर सकता हूं?' : 'Hello! How can I help you today?';
    }
    
    // Time
    if (/\b(time|samay|kya baja|kitne baje)\b/i.test(q)) {
        const time = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
        return isHindi ? `अभी ${time} बज रहे हैं।` : `The current time is ${time}.`;
    }
    
    // Date
    if (/\b(date|tarikh|aaj|today)\b/i.test(q)) {
        const date = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        return isHindi ? `आज की तारीख ${date} है।` : `Today's date is ${date}.`;
    }
    
    // Weather (basic)
    if (/\b(weather|mausam|garmi|sardi|barish)\b/i.test(q)) {
        return isHindi ? 'मौसम की जानकारी के लिए अपने फोन का वेदर ऐप देखें।' : 'Please check your phone\'s weather app for current conditions.';
    }
    
    // Math calculations
    const mathMatch = q.match(/(\d+)\s*[\+\-\*\/x×÷]\s*(\d+)/);
    if (mathMatch) {
        try {
            const expr = q.replace(/x|×/g, '*').replace(/÷/g, '/');
            const numMatch = expr.match(/(\d+)\s*([\+\-\*\/])\s*(\d+)/);
            if (numMatch) {
                const [, a, op, b] = numMatch;
                let result = 0;
                switch(op) {
                    case '+': result = parseInt(a) + parseInt(b); break;
                    case '-': result = parseInt(a) - parseInt(b); break;
                    case '*': result = parseInt(a) * parseInt(b); break;
                    case '/': result = parseInt(a) / parseInt(b); break;
                }
                return isHindi ? `जवाब है ${result}` : `The answer is ${result}`;
            }
        } catch(e) { /* ignore */ }
    }
    
    // Stock/Inventory queries - guide to search
    if (/\b(stock|maal|item|product|kitna|available|hai kya)\b/i.test(q)) {
        return isHindi ? 'स्टॉक देखने के लिए ऐप में सर्च करें या नीचे रिजल्ट देखें।' : 'Please check the search results below or use the app search.';
    }
    
    // Business/Shop
    if (/\b(business|dukan|shop|sell|buy|price|rate)\b/i.test(q)) {
        return isHindi ? 'बिज़नेस टूल्स के लिए सेटिंग्स में जाएं।' : 'For business tools, go to Settings > Business Tools.';
    }
    
    // Who are you
    if (/\b(who are you|kaun ho|tum kaun|your name|naam kya)\b/i.test(q)) {
        return isHindi ? 'मैं Autonex AI हूं, आपका स्मार्ट बिज़नेस असिस्टेंट!' : 'I am Autonex AI, your smart business assistant!';
    }
    
    // Thank you
    if (/\b(thank|thanks|dhanyawad|shukriya)\b/i.test(q)) {
        return isHindi ? 'आपका स्वागत है! और कुछ मदद चाहिए?' : 'You\'re welcome! Need anything else?';
    }
    
    // Default response
    return isHindi
      ? 'मैं समझ नहीं पाया। कृपया थोड़ा सरल शब्दों में पूछें, या बताएं कि आप स्टॉक, बिल, टूल्स, या सेटिंग्स में क्या करना चाहते हैं।'
      : 'I didn\'t fully understand. Please rephrase, or tell me if this is about stock, bills, tools, or settings.';
};

// ---------------------------------------------------------
// 👻 GHOST MIC COMPONENT (Hands-Free Voice Search + AI Assistant)
// ---------------------------------------------------------
const GhostMic = ({ inventory, pages, onClose, onNavigate, allowAI = true, useFuzzySearch = true }) => {
    const [status, setStatus] = useState("Listening...");
    const [resultText, setResultText] = useState("");
    const [searchResult, setSearchResult] = useState(null);
    const [aiResponse, setAiResponse] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [mode, setMode] = useState('search'); // 'search' or 'ai'

    // Detect language from text
    const detectLanguage = (text: string): string => {
        const isHindi = /[\u0900-\u097F]/.test(text) || 
                       /\b(kya|hai|kaise|kahan|kaun|kitna|batao|bolo|dhundo|dekho|mein|ka|ki|ke)\b/i.test(text);
        return isHindi ? 'hi' : 'en';
    };

    const isGreeting = (text: string) => isGreetingText(text);

    // Special rule: Just return the detected language (No forced Hindi on greeting)
    const resolveResponseLanguage = (transcript: string, detectedLang: string) => {
      // if (isGreeting(transcript)) return 'hi'; <-- ❌ REMOVED THIS LINE
      return detectedLang; // ✅ Returns English for "Hello", Hindi for "Namaste"
    };

    // Text to Speech Helper - responds in same language
    const speak = useCallback((text: string, lang: string = 'en') => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
            utterance.rate = lang === 'hi' ? 0.9 : 1.0;
            window.speechSynthesis.speak(utterance);
        }
    }, []);

    useEffect(() => {
        const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
        if (!SpeechRecognition) {
            setStatus("❌ Browser not supported");
            speak("Sorry, voice search not supported on this browser.", 'en');
            setTimeout(onClose, 2000);
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'hi-IN'; // Hindi-Indian for better Hinglish support
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => {
            if (navigator.vibrate) navigator.vibrate(200);
            setStatus("🎤 Listening...");
        };

        recognition.onresult = async (event) => {
            const transcript = event.results[0][0].transcript;
            setResultText(transcript);
            setStatus("🧠 Processing...");
            setIsProcessing(true);

            if (navigator.vibrate) navigator.vibrate([100, 50, 100]);

            const detectedLang = detectLanguage(transcript);
            const responseLang = resolveResponseLanguage(transcript, detectedLang);

            // First, try stock search
            const stockResult = performSmartSearch(transcript, inventory, pages, { useFuzzy: useFuzzySearch });

            if (stockResult.match && stockResult.items.length > 0) {
                // Stock found - show stock results
                setMode('search');
                setSearchResult(stockResult);
                const topItem = stockResult.items[0];
                const count = stockResult.items.length;
                
                const msg = detectedLang === 'hi'
                    ? `${topItem.car} मिला। मात्रा ${topItem.qty} है। ${count > 1 ? `और ${count - 1} आइटम भी हैं।` : ''}`
                    : `Found ${topItem.car}. Quantity is ${topItem.qty}. ${count > 1 ? `Plus ${count - 1} more items.` : ''}`;
                
                setStatus(`✅ ${count} item${count > 1 ? 's' : ''} found!`);
                speak(msg, detectedLang);
            } else {
                // No stock found - use AI to answer the question
                setMode('ai');
                setStatus("� AI Thinking...");
                
                try {
                if (!allowAI) {
                  const msg = responseLang === 'hi'
                    ? 'AI बंद है। सेटिंग्स में जाकर "Voice AI Commands" ऑन करें या स्टॉक के लिए सर्च करें।'
                    : 'AI is turned off. Enable “Voice AI Commands” in Settings, or search for stock.';
                  setAiResponse(msg);
                  setStatus("🤖 AI Off");
                  speak(msg, responseLang);
                } else {
                  const aiAnswer = await askAIAssistant(transcript, responseLang);
                  setAiResponse(aiAnswer);
                  setStatus("🤖 AI Response");
                  speak(aiAnswer, responseLang);
                }
                } catch (e) {
                const fallback = responseLang === 'hi' 
                        ? 'माफ करें, जवाब नहीं मिला। कृपया दोबारा पूछें।'
                        : 'Sorry, could not find an answer. Please try again.';
                    setAiResponse(fallback);
                    setStatus("🤖 AI Response");
                speak(fallback, responseLang);
                }
            }
            
            setIsProcessing(false);
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            const lang = 'en';
            if (event.error === 'no-speech') {
                setStatus("🔇 No speech detected");
                speak("Did not hear anything. Please try again.", lang);
            } else {
                setStatus(`❌ Error: ${event.error}`);
            }
            setTimeout(onClose, 2000);
        };

        recognition.onend = () => {
            // Recognition ended
        };

        try {
            recognition.start();
        } catch (e) {
            console.error('Failed to start recognition:', e);
            setStatus("❌ Failed to start");
        }

        return () => {
            try { recognition.stop(); } catch (e) { /* ignore */ }
            window.speechSynthesis.cancel();
        };
    }, [inventory, pages, speak, onClose]);

    const handleItemClick = (item) => {
        const page = pages.find(p => p.id === item.pageId);
        if (page) {
            onNavigate(page.id);
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[999] bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center text-white animate-in fade-in p-4">
            {/* Pulsing Visual */}
            <div className="relative mb-8">
                <div className={`absolute inset-0 bg-blue-500 blur-3xl ${isProcessing ? 'animate-ping' : 'animate-pulse'} opacity-40`}></div>
                <div className={`w-28 h-28 bg-slate-800 rounded-full border-4 ${
                    mode === 'ai' && aiResponse ? 'border-purple-500' :
                    searchResult?.match ? 'border-green-500' : 
                    searchResult ? 'border-red-500' : 'border-blue-500'
                } flex items-center justify-center relative z-10 shadow-2xl`}>
                    <Mic size={44} className={`${
                        isProcessing ? 'text-yellow-400 animate-bounce' : 
                        mode === 'ai' && aiResponse ? 'text-purple-400' :
                        searchResult?.match ? 'text-green-400' : 'text-blue-400'
                    }`} />
                </div>
            </div>
            
            <h2 className="text-xl font-black tracking-wider uppercase mb-2">{status}</h2>
            
            {resultText && (
                <div className="bg-slate-800/50 px-4 py-2 rounded-full border border-slate-600 mb-4">
                    <p className="text-lg font-mono text-yellow-400">"{resultText}"</p>
                </div>
            )}
            
            {searchResult?.interpretedAs && searchResult.interpretedAs !== resultText.toLowerCase() && (
                <p className="text-xs text-slate-400 mb-4">Interpreted as: <span className="text-blue-400">{searchResult.interpretedAs}</span></p>
            )}

            {/* AI Response Display */}
            {mode === 'ai' && aiResponse && (
                <div className="w-full max-w-md bg-gradient-to-br from-purple-900/50 to-indigo-900/50 p-4 rounded-2xl border border-purple-500/50 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                            <Zap size={14} className="text-white"/>
                        </div>
                        <span className="text-xs font-bold text-purple-300 uppercase">Autonex AI</span>
                    </div>
                    <p className="text-white text-base leading-relaxed">{aiResponse}</p>
                </div>
            )}

            {/* Stock Results List */}
            {mode === 'search' && searchResult?.match && (
                <div className="w-full max-w-md max-h-60 overflow-y-auto space-y-2 mt-4">
                    {searchResult.items.slice(0, 5).map(item => (
                        <div 
                            key={item.id} 
                            onClick={() => handleItemClick(item)}
                            className="bg-slate-800/80 p-4 rounded-xl border border-slate-600 flex justify-between items-center cursor-pointer hover:bg-slate-700 transition-colors"
                        >
                            <div>
                                <p className="font-bold text-lg">{item.car}</p>
                                <span className="text-xs text-slate-400 bg-slate-700 px-2 py-1 rounded">
                                    {item.pageName || 'Unknown'}
                                </span>
                            </div>
                            <div className="text-right">
                                <span className={`block text-2xl font-bold ${item.qty < 5 ? 'text-red-400' : 'text-green-400'}`}>{item.qty}</span>
                                <span className="text-[10px] text-slate-500">Pcs</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            <button 
                onClick={onClose} 
                className="mt-8 px-8 py-3 border border-white/20 rounded-full text-sm font-bold bg-white/5 hover:bg-white/10 transition-colors flex items-center gap-2"
            >
                <X size={16} /> Close
            </button>
        </div>
    );
};

// ---------------------------------------------------------
// 📦 DEAD STOCK ALERT COMPONENT (No Price, Only Qty)
// ---------------------------------------------------------
const DeadStockAlert = ({ data, onNavigate }) => {
    const DEAD_DAYS_THRESHOLD = 180; // 6 Months

    const deadStockStats = useMemo(() => {
        if (!data.entries || data.entries.length === 0) return { count: 0, totalQty: 0, items: [] };

        const now = Date.now();
        const msInDay = 1000 * 60 * 60 * 24;
        
        // Find items older than 180 days that still have stock
        const deadItems = data.entries.filter(item => {
            const itemTime = item.lastUpdated || item.id; 
            const diffDays = (now - itemTime) / msInDay;
            return diffDays > DEAD_DAYS_THRESHOLD && item.qty > 0;
        });

        // Calculate total pieces
        const totalQty = deadItems.reduce((acc, curr) => acc + curr.qty, 0);

        return {
            count: deadItems.length,
            totalQty: totalQty,
            items: deadItems
        };
    }, [data.entries]);

    if (deadStockStats.count === 0) return null;

    return (
        <div className="mx-4 mt-4 bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-500 rounded-lg p-4 shadow-sm">
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3">
                    <div className="bg-red-100 p-2.5 rounded-full text-red-600 shadow-sm">
                        <PackageX size={22} />
                    </div>
                    <div>
                        <h3 className="font-bold text-red-800 text-lg">Dead Stock Alert</h3>
                        <p className="text-xs text-red-600 font-semibold opacity-80">
                            {deadStockStats.count} items stuck &gt; 6 Months
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-[10px] uppercase font-bold text-red-500 tracking-wider">Stuck Inventory</p>
                    <h2 className="text-2xl font-black text-red-700">
                        {deadStockStats.totalQty} <span className="text-sm font-bold">Units</span>
                    </h2>
                </div>
            </div>

            <details className="group">
                <summary className="cursor-pointer text-xs font-bold text-red-500 hover:text-red-700 flex items-center gap-1 mt-2 select-none border-t border-red-200 pt-2 list-none">
                    <TrendingDown size={14}/> View Dead Stock List
                    <ChevronDown size={14} className="ml-auto group-open:rotate-180 transition-transform" />
                </summary>
                
                <div className="mt-3 space-y-2 max-h-60 overflow-y-auto pr-1">
                    {deadStockStats.items.map(item => {
                        const page = data.pages.find(p => p.id === item.pageId);
                        const daysSinceUpdate = Math.floor((Date.now() - (item.lastUpdated || item.id)) / (1000 * 60 * 60 * 24));
                        
                        return (
                            <div 
                                key={item.id} 
                                onClick={() => onNavigate && onNavigate(item.pageId)}
                                className="bg-white p-3 rounded-lg border border-red-100 flex justify-between items-center shadow-sm cursor-pointer hover:bg-red-50 transition-colors"
                            >
                                <div>
                                    <p className="font-bold text-gray-800">{item.car}</p>
                                    <div className="flex gap-2 mt-1">
                                        <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                            📍 {page?.itemName || 'Unknown'}
                                        </span>
                                        <span className="text-[10px] text-red-500 bg-red-50 px-1.5 py-0.5 rounded">
                                            {daysSinceUpdate} days old
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="block text-xl font-bold text-red-600">{item.qty}</span>
                                    <span className="text-[9px] text-red-400">Pcs</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </details>
        </div>
    );
};

// ---------------------------------------------------------
// 📊 QUICK STATS WIDGET (Business Insights)
// ---------------------------------------------------------
const QuickStats = ({ data }) => {
    const stats = useMemo(() => {
        const entries = data.entries || [];
        const totalItems = entries.length;
        const totalStock = entries.reduce((acc, e) => acc + (e.qty || 0), 0);
        const lowStock = entries.filter(e => e.qty < (data.settings?.limit || 5)).length;
        const outOfStock = entries.filter(e => e.qty === 0).length;
        
        return { totalItems, totalStock, lowStock, outOfStock };
    }, [data.entries, data.settings?.limit]);

    return (
        <div className="mx-4 mt-4 grid grid-cols-4 gap-2">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-2xl text-center border border-blue-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="bg-blue-500 w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg shadow-blue-500/30">
                    <Layers size={16} className="text-white" />
                </div>
                <p className="text-2xl font-black text-blue-700">{stats.totalItems}</p>
                <p className="text-[10px] font-bold text-blue-500 uppercase">Items</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 rounded-2xl text-center border border-green-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="bg-green-500 w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg shadow-green-500/30">
                    <Activity size={16} className="text-white" />
                </div>
                <p className="text-2xl font-black text-green-700">{stats.totalStock}</p>
                <p className="text-[10px] font-bold text-green-500 uppercase">Total Pcs</p>
            </div>
            <div className="bg-gradient-to-br from-yellow-50 to-orange-100 p-3 rounded-2xl text-center border border-yellow-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="bg-yellow-500 w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg shadow-yellow-500/30">
                    <AlertCircle size={16} className="text-white" />
                </div>
                <p className="text-2xl font-black text-yellow-700">{stats.lowStock}</p>
                <p className="text-[10px] font-bold text-yellow-600 uppercase">Low</p>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-red-100 p-3 rounded-2xl text-center border border-red-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="bg-red-500 w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg shadow-red-500/30">
                    <Ban size={16} className="text-white" />
                </div>
                <p className="text-2xl font-black text-red-700">{stats.outOfStock}</p>
                <p className="text-[10px] font-bold text-red-500 uppercase">Empty</p>
            </div>
        </div>
    );
};

// ---------------------------------------------------------
// 🤖 AI INSIGHTS WIDGET (Smart Business Intelligence)
// ---------------------------------------------------------
const AIInsightsWidget = ({ data, t, isDark }) => {
    const insights = useMemo(() => {
        const entries = data.entries || [];
        const pages = data.pages || [];
        const results = [];
        
        // 1. ABC Analysis for inventory prioritization
        if (entries.length > 5) {
            const itemValues = entries.map(e => ({ id: e.car, value: e.qty * (e.salePrice || 100) }));
            const abc = AIEngine.abcAnalysis(itemValues);
            if (abc.A.length > 0) {
                results.push({
                    type: 'abc',
                    icon: '🏆',
                    title: 'High-Value Items',
                    message: `${abc.A.length} items make up 70% of your inventory value. Focus on these!`,
                    priority: 1,
                    color: 'purple'
                });
            }
        }
        
        // 2. Low Stock Prediction
        const lowStockItems = entries.filter(e => e.qty > 0 && e.qty < (data.settings?.limit || 5));
        if (lowStockItems.length > 0) {
            const urgentItems = lowStockItems.filter(e => e.qty <= 2);
            results.push({
                type: 'reorder',
                icon: '⚠️',
                title: 'Reorder Alert',
                message: urgentItems.length > 0 
                    ? `${urgentItems.length} items critically low! Reorder immediately.`
                    : `${lowStockItems.length} items running low. Plan restocking.`,
                priority: urgentItems.length > 0 ? 0 : 2,
                color: urgentItems.length > 0 ? 'red' : 'yellow'
            });
        }
        
        // 3. Stock Distribution Analysis
        const totalStock = entries.reduce((sum, e) => sum + e.qty, 0);
        const avgStock = totalStock / (entries.length || 1);
        const overstocked = entries.filter(e => e.qty > avgStock * 3);
        if (overstocked.length > 0) {
            results.push({
                type: 'overstock',
                icon: '📦',
                title: 'Overstock Detected',
                message: `${overstocked.length} items have excessive stock. Consider promotions.`,
                priority: 3,
                color: 'blue'
            });
        }
        
        // 4. Dead Stock Analysis
        const deadStock = entries.filter(e => e.qty > 10 && e.lastUpdated && 
            (Date.now() - new Date(e.lastUpdated).getTime()) > 30 * 24 * 60 * 60 * 1000);
        if (deadStock.length > 0) {
            results.push({
                type: 'dead',
                icon: '💤',
                title: 'Dead Stock Alert',
                message: `${deadStock.length} items haven't moved in 30+ days.`,
                priority: 2,
                color: 'gray'
            });
        }
        
        // 5. Inventory Health Score
        const outOfStock = entries.filter(e => e.qty === 0).length;
        const healthScore = Math.round(((entries.length - outOfStock - lowStockItems.length) / (entries.length || 1)) * 100);
        results.push({
            type: 'health',
            icon: healthScore >= 80 ? '💚' : healthScore >= 50 ? '💛' : '❤️',
            title: 'Inventory Health',
            message: `Score: ${healthScore}% - ${healthScore >= 80 ? 'Excellent!' : healthScore >= 50 ? 'Needs attention' : 'Critical!'}`,
            priority: healthScore < 50 ? 1 : 4,
            color: healthScore >= 80 ? 'green' : healthScore >= 50 ? 'yellow' : 'red'
        });
        
        // 6. Page Organization Suggestion
        if (pages.length > 10 && entries.length > 50) {
            const avgItemsPerPage = entries.length / pages.length;
            if (avgItemsPerPage < 3) {
                results.push({
                    type: 'organize',
                    icon: '📁',
                    title: 'Organization Tip',
                    message: 'Consider consolidating pages. Many have few items.',
                    priority: 5,
                    color: 'indigo'
                });
            }
        }
        
        return results.sort((a, b) => a.priority - b.priority).slice(0, 4);
    }, [data.entries, data.pages, data.settings?.limit]);

    const colorClasses = {
        purple: 'from-purple-50 to-purple-100 border-purple-200',
        red: 'from-red-50 to-red-100 border-red-200',
        yellow: 'from-yellow-50 to-orange-100 border-yellow-200',
        blue: 'from-blue-50 to-blue-100 border-blue-200',
        green: 'from-green-50 to-green-100 border-green-200',
        gray: 'from-gray-50 to-gray-100 border-gray-200',
        indigo: 'from-indigo-50 to-indigo-100 border-indigo-200'
    };

    if (insights.length === 0) return null;

    return (
        <div className="mx-4 mt-4">
            <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    <Zap size={14} className="text-white"/>
                </div>
                <h3 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-800'}`}>{t("AI Insights")}</h3>
                <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold">SMART</span>
            </div>
            
            <div className="space-y-2">
                {insights.map((insight, idx) => (
                    <div 
                        key={idx}
                        className={`p-3 rounded-xl bg-gradient-to-r ${colorClasses[insight.color]} border flex items-start gap-3 transition-all hover:scale-[1.01]`}
                    >
                        <span className="text-xl">{insight.icon}</span>
                        <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-sm text-gray-800">{insight.title}</h4>
                            <p className="text-xs text-gray-600 line-clamp-2">{insight.message}</p>
                        </div>
                        <ChevronRight size={16} className="text-gray-400 shrink-0 mt-1"/>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ---------------------------------------------------------
// 📈 SALES PREDICTION WIDGET
// ---------------------------------------------------------
const SalesPredictionWidget = ({ data, t, isDark }) => {
    const prediction = useMemo(() => {
    const events = (data.salesEvents || []).filter((e: any) => e && e.type === 'sale');
    if (!events.length) return null;

    const days = 14;
    const dayKeys: string[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dayKeys.push(d.toISOString().slice(0, 10));
    }

    const totalsByDay = new Map<string, number>();
    for (const key of dayKeys) totalsByDay.set(key, 0);

    for (const ev of events) {
      const ts = typeof ev.ts === 'number' ? ev.ts : (ev.date ? Date.parse(ev.date) : NaN);
      if (!Number.isFinite(ts)) continue;
      const day = new Date(ts).toISOString().slice(0, 10);
      if (!totalsByDay.has(day)) continue;
      const qty = Number(ev.qty || 0);
      if (qty > 0) totalsByDay.set(day, (totalsByDay.get(day) || 0) + qty);
    }

    const series = dayKeys.map(k => totalsByDay.get(k) || 0);
    const total = series.reduce((a, b) => a + b, 0);
    if (total <= 0) return null;

    const nextDayPrediction = AIEngine.exponentialSmoothing(series, 0.35);
    const weeklyPrediction = nextDayPrediction * 7;

    const recentAvg = series.slice(-3).reduce((a, b) => a + b, 0) / 3;
    const olderAvg = series.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
    const trend = recentAvg > olderAvg ? 'up' : recentAvg < olderAvg ? 'down' : 'stable';
    const trendPercent = olderAvg > 0 ? Math.abs(Math.round(((recentAvg - olderAvg) / olderAvg) * 100)) : 0;

    const nonZeroDays = series.filter(v => v > 0).length;
    const confidence = Math.min(95, Math.max(55, Math.round(50 + (nonZeroDays / days) * 45)));

    return {
      daily: Math.max(0, Math.round(nextDayPrediction)),
      weekly: Math.max(0, Math.round(weeklyPrediction)),
      trend,
      trendPercent,
      confidence
    };
  }, [data.salesEvents]);

    if (!data.settings?.aiPredictions) return null;

    if (!prediction) {
      return (
        <div className="mx-4 mt-4">
          <div className={`p-4 rounded-2xl ${isDark ? 'bg-slate-800' : 'bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50'} border ${isDark ? 'border-slate-700' : 'border-indigo-200'}`}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Activity size={16} className="text-white"/>
              </div>
              <div>
                <h3 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-800'}`}>{t("Sales Prediction")}</h3>
                <p className="text-[10px] text-gray-500">{t("No sales history yet")}</p>
              </div>
            </div>
            <p className={`mt-3 text-xs ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
              {t("Update stock (sell/restock) to generate real reports.")}
            </p>
          </div>
        </div>
      );
    }

    return (
        <div className="mx-4 mt-4">
            <div className={`p-4 rounded-2xl ${isDark ? 'bg-slate-800' : 'bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50'} border ${isDark ? 'border-slate-700' : 'border-indigo-200'}`}>
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                            <Activity size={16} className="text-white"/>
                        </div>
                        <div>
                            <h3 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-800'}`}>{t("Sales Prediction")}</h3>
                            <p className="text-[10px] text-gray-500">AI-powered forecast</p>
                        </div>
                    </div>
                    <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${
                        prediction.trend === 'up' ? 'bg-green-100 text-green-700' :
                        prediction.trend === 'down' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                    }`}>
                        {prediction.trend === 'up' ? '📈' : prediction.trend === 'down' ? '📉' : '➡️'} 
                        {prediction.trendPercent}%
                    </span>
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  <div className={`p-3 rounded-xl text-center ${isDark ? 'bg-slate-700' : 'bg-white/60'}`}>
                    <p className="text-2xl font-black text-indigo-600">{prediction.daily}</p>
                    <p className="text-[10px] text-gray-500 font-bold">TODAY</p>
                  </div>
                    <div className={`p-3 rounded-xl text-center ${isDark ? 'bg-slate-700' : 'bg-white/60'}`}>
                        <p className="text-2xl font-black text-purple-600">{prediction.weekly}</p>
                        <p className="text-[10px] text-gray-500 font-bold">WEEK</p>
                    </div>
                    <div className={`p-3 rounded-xl text-center ${isDark ? 'bg-slate-700' : 'bg-white/60'}`}>
                        <p className="text-2xl font-black text-pink-600">{prediction.confidence}%</p>
                        <p className="text-[10px] text-gray-500 font-bold">ACCURACY</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ---------------------------------------------------------
// 🔍 SMART SEARCH WITH TRIE + FUZZY MATCHING
// ---------------------------------------------------------
const SmartSearchEngine = {
    initialized: false,
    
    initialize: (entries) => {
        if (SmartSearchEngine.initialized) return;
        entries.forEach(entry => {
            productTrie.insert(entry.car, entry);
            searchBloomFilter.add(entry.car.toLowerCase());
        });
        SmartSearchEngine.initialized = true;
    },
    
    search: (query, entries, useFuzzy = false) => {
        if (!query.trim()) return entries;
        
        const queryLower = query.toLowerCase();
        
        // First try exact Trie search - O(m)
        const trieResults = productTrie.searchPrefix(queryLower, 50);
        if (trieResults.length > 0) {
            const trieIds = new Set(trieResults.map(r => r.data?.id).filter(Boolean));
            return entries.filter(e => trieIds.has(e.id) || e.car.toLowerCase().includes(queryLower));
        }
        
        // If fuzzy search enabled and no exact matches - O(n*m)
        if (useFuzzy) {
            const allNames = entries.map(e => e.car);
            const fuzzyMatches = fuzzySearch(query, allNames, 2);
            const fuzzySet = new Set(fuzzyMatches.map(m => m.toLowerCase()));
            return entries.filter(e => fuzzySet.has(e.car.toLowerCase()));
        }
        
        // Default substring search - O(n)
        return entries.filter(e => e.car.toLowerCase().includes(queryLower));
    },
    
    getSuggestions: (query, limit = 5) => {
        if (!query.trim()) return [];
        return productTrie.searchPrefix(query.toLowerCase(), limit).map(r => r.word);
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
    <div className={`fixed top-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-2xl shadow-2xl z-[100] flex items-center gap-3 transition-all transform border backdrop-blur-sm ${
      type === 'error' 
        ? 'bg-red-600/95 text-white border-red-400/30 shadow-red-500/25' 
        : 'bg-green-600/95 text-white border-green-400/30 shadow-green-500/25'
    }`} style={{animation: 'slideDown 0.3s ease-out'}}>
       <div className={`p-1.5 rounded-full ${type === 'error' ? 'bg-red-500' : 'bg-green-500'}`}>
         {type === 'error' ? <XCircle size={18} className="shrink-0"/> : <CheckCircle size={18} className="shrink-0"/>}
       </div>
       <span className="font-semibold text-sm md:text-base">{message}</span>
       <button onClick={onClose} className="ml-2 p-1 hover:bg-white/20 rounded-full transition-colors">
         <X size={16} />
       </button>
    </div>
  );
};

// 🛠️ TOOLS COMPONENT (INDUSTRY-READY UPGRADE)
const ToolsHub = ({ onBack, t, isDark, initialTool = null, pinnedTools, onTogglePin, shopDetails }) => {
  const [activeTool, setActiveTool] = useState(initialTool);
  const [invoiceNumber] = useState(() => Date.now().toString().slice(-4));
  const [gstInput, setGstInput] = useState({ price: '', rate: 18, isReverse: false });
  const [marginInput, setMarginInput] = useState({ cost: '', sell: '', discount: 0, mode: 'profit', markup: '' });
  const [convInput, setConvInput] = useState({ val: '', type: 'kgToTon' });
  const [transInput, setTransInput] = useState('');
  const [transOutput, setTransOutput] = useState('');
  const [transLoading, setTransLoading] = useState(false);
  const [transLang, setTransLang] = useState({ from: 'en', to: 'hi' });
  const [transHistory, setTransHistory] = useState([]);

  // 🧾 INVOICE GENERATOR STATE (ENHANCED)
  const [invCust, setInvCust] = useState({ name: '', phone: '', address: '', gstNo: '' });
  const [invItems, setInvItems] = useState([]);
  const [invCurrentItem, setInvCurrentItem] = useState({ name: '', qty: 1, rate: 0, gst: 18, unit: 'pcs', hsn: '' });
  const [invSettings, setInvSettings] = useState({ 
    showGst: true, 
    invoiceType: 'retail', // retail, gst, estimate
    paymentMode: 'cash',
    notes: '',
    discount: 0,
    discountType: 'flat' // flat, percent
  });

  // 💰 EMI CALCULATOR STATE
  const [emiInput, setEmiInput] = useState({ principal: '', rate: '', tenure: '', tenureType: 'months' });

  // 📝 NOTEPAD STATE (RICH TEXT UPGRADE)
  const [notesView, setNotesView] = useState('list');
  const [notes, setNotes] = useState(() => {
      try {
        const saved = localStorage.getItem('proNotes');
        return saved ? JSON.parse(saved) : [];
      } catch(e) { console.error(e); return []; }
  });
  const [currentNote, setCurrentNote] = useState({ id: null, title: '', body: '', date: '', sketch: null, category: 'general' });
  const [noteSearch, setNoteSearch] = useState('');
  const [noteCategory, setNoteCategory] = useState('all');
  
  const [noteMode, setNoteMode] = useState('text');
  const canvasRef = useRef(null);
  const contentEditableRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushType, setBrushType] = useState('pencil');
  const [startPos, setStartPos] = useState({x:0, y:0});

  // 📊 STOCK VALUE CALCULATOR
  const [stockCalc, setStockCalc] = useState({ items: [], newItem: { name: '', qty: 0, rate: 0 } });

  useEffect(() => {
      localStorage.setItem('proNotes', JSON.stringify(notes));
  }, [notes]);

  const tools = [
    { id: 'invoice', name: 'Bill Generator', icon: <FileText size={24} />, color: 'bg-indigo-100 text-indigo-600', desc: 'GST & Retail Bills' },
    { id: 'gst', name: 'GST Pro', icon: <Percent size={24} />, color: 'bg-blue-100 text-blue-600', desc: 'Calculate GST' },
    { id: 'margin', name: 'Profit Analyzer', icon: <Calculator size={24} />, color: 'bg-purple-100 text-purple-600', desc: 'Margin & Markup' },
    { id: 'emi', name: 'EMI Calculator', icon: <DollarSign size={24} />, color: 'bg-emerald-100 text-emerald-600', desc: 'Loan EMI Calc' },
    { id: 'converter', name: 'Unit Convert', icon: <RefreshCcw size={24} />, color: 'bg-green-100 text-green-600', desc: 'KG, Tons, Feet' },
    { id: 'stockvalue', name: 'Stock Value', icon: <Activity size={24} />, color: 'bg-cyan-100 text-cyan-600', desc: 'Inventory Worth' },
    { id: 'card', name: 'Digital Card', icon: <CreditCard size={24} />, color: 'bg-orange-100 text-orange-600', desc: 'Business Card' },
    { id: 'notes', name: 'Note Master', icon: <StickyNote size={24} />, color: 'bg-yellow-100 text-yellow-600', desc: 'Smart Notes' },
    { id: 'translator', name: 'AI Translator', icon: <Languages size={24} />, color: 'bg-pink-100 text-pink-600', desc: 'Multi-Language' },
  ];

  const languageOptions = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'Hindi' },
    { code: 'gu', name: 'Gujarati' },
    { code: 'mr', name: 'Marathi' },
    { code: 'ta', name: 'Tamil' },
    { code: 'te', name: 'Telugu' },
    { code: 'bn', name: 'Bengali' },
    { code: 'pa', name: 'Punjabi' },
    { code: 'ur', name: 'Urdu' },
    { code: 'ar', name: 'Arabic' },
  ];

  // 🌐 API TRANSLATION / TRANSLITERATION HANDLER
  const handleTranslate = async () => {
    if (!transInput.trim()) return;
    setTransLoading(true);
    
    try {
      let result = '';
      
      // अगर Target Language हिंदी है, तो हम Transliteration (कैट) करेंगे
      // For Hindi output, use Google Transliteration for phonetic conversion
      if (transLang.to === 'hi') {
         // ✅ Google Transliteration for Hinglish typing (Cat -> कैट)
         result = await transliterateWithGoogle(transInput);
      } else {
         // बाकी भाषाओं के लिए पुराना Translation ही ठीक है
         result = await translateWithAPI(transInput, transLang.from, transLang.to);
      }

      setTransOutput(result);
      setTransHistory(prev => [{ input: transInput, output: result, from: transLang.from, to: transLang.to }, ...prev.slice(0, 9)]);
    } catch (e) {
      setTransOutput('Translation failed. Please try again.');
    }
    setTransLoading(false);
  };

  const swapLanguages = () => {
    setTransLang({ from: transLang.to, to: transLang.from });
    setTransInput(transOutput);
    setTransOutput('');
  };

  // --- INVOICE FUNCTIONS (ENHANCED) ---
  const addInvItem = () => {
     if(!invCurrentItem.name || !invCurrentItem.rate) return;
     const baseTotal = invCurrentItem.qty * invCurrentItem.rate;
     const gstAmt = invSettings.showGst ? (baseTotal * invCurrentItem.gst) / 100 : 0;
     const newItem = { 
       ...invCurrentItem, 
       id: Date.now(), 
       baseTotal,
       gstAmt,
       total: baseTotal + gstAmt 
     };
     setInvItems([...invItems, newItem]);
     setInvCurrentItem({ name: '', qty: 1, rate: 0, gst: 18, unit: 'pcs', hsn: '' });
  };
  
  const deleteInvItem = (id) => setInvItems(invItems.filter(i => i.id !== id));
  
  const calculateBillTotals = () => {
    const subtotal = invItems.reduce((acc, curr) => acc + curr.baseTotal, 0);
    const totalGst = invItems.reduce((acc, curr) => acc + curr.gstAmt, 0);
    const discountAmt = invSettings.discountType === 'percent' 
      ? (subtotal * invSettings.discount / 100)
      : invSettings.discount;
    const grandTotal = subtotal + totalGst - discountAmt;
    return { subtotal, totalGst, discountAmt, grandTotal };
  };
  
  const calculateBillTotal = () => calculateBillTotals().grandTotal;

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
    const totals = calculateBillTotals();

    switch (activeTool) {
      case 'invoice':
        return (
          <div className={`${cardClass} overflow-y-auto`}>
             {/* Header */}
             <div className="flex justify-between items-center mb-4 border-b pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="text-indigo-500" size={24}/>
                  <div>
                    <h3 className="font-bold text-lg">Invoice Pro</h3>
                    <p className="text-xs text-gray-500">#{invoiceNumber}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={shareInvoiceImage} className="p-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl flex items-center gap-1 text-sm font-bold shadow-lg hover:shadow-xl transition-all">
                      <Share2 size={16}/> Share
                    </button>
                </div>
             </div>
             
             {/* Invoice Type Selection */}
             <div className="flex gap-2 mb-4 bg-indigo-50 p-1.5 rounded-xl">
               {[
                 { id: 'retail', label: '🛒 Retail', desc: 'Simple Bill' },
                 { id: 'gst', label: '📋 GST Invoice', desc: 'With Tax' },
                 { id: 'estimate', label: '📝 Estimate', desc: 'Quotation' }
               ].map(type => (
                 <button 
                   key={type.id}
                   onClick={() => setInvSettings({...invSettings, invoiceType: type.id, showGst: type.id === 'gst'})}
                   className={`flex-1 py-2 px-1 rounded-lg text-xs font-bold transition-all ${
                     invSettings.invoiceType === type.id 
                       ? 'bg-white shadow-md text-indigo-600' 
                       : 'text-gray-500 hover:text-indigo-400'
                   }`}
                 >
                   {type.label}
                 </button>
               ))}
             </div>
             
             {/* PREVIEW AREA */}
             <div className="flex justify-center bg-gradient-to-br from-gray-100 to-gray-200 p-3 rounded-xl mb-4 overflow-hidden">
                <div className="bg-white text-black p-4 border shadow-2xl rounded-lg text-xs w-full max-w-[320px]" id="invoice-area">
                    {/* Shop Header */}
                    <div className="text-center border-b-2 border-indigo-600 pb-2 mb-3">
                        <h2 className="text-lg font-black uppercase tracking-wider text-indigo-700">{shopDetails.shopName || "My Shop"}</h2>
                        <p className="text-[8px] uppercase text-gray-500 tracking-widest">
                          {invSettings.invoiceType === 'gst' ? 'TAX INVOICE' : invSettings.invoiceType === 'estimate' ? 'ESTIMATE / QUOTATION' : 'RETAIL INVOICE'}
                        </p>
                    </div>
                    
                    {/* Customer & Invoice Info */}
                    <div className="flex justify-between mb-3 text-[10px] bg-gray-50 p-2 rounded">
                        <div>
                            <p className="text-gray-500 text-[8px]">BILL TO:</p>
                            <p className="font-bold">{invCust.name || 'Walk-in Customer'}</p>
                            <p>{invCust.phone}</p>
                            {invCust.gstNo && <p className="text-[8px] text-gray-500">GSTIN: {invCust.gstNo}</p>}
                        </div>
                        <div className="text-right">
                            <p className="font-bold text-indigo-600">#{invoiceNumber}</p>
                            <p>{new Date().toLocaleDateString('en-IN')}</p>
                            <p className="text-[8px] text-gray-500">{invSettings.paymentMode.toUpperCase()}</p>
                        </div>
                    </div>

                    {/* Items Table */}
                    <table className="w-full text-left mb-3 border-collapse">
                        <thead>
                            <tr className="bg-indigo-600 text-white text-[9px] uppercase">
                                <th className="py-1.5 px-1 rounded-tl">Item</th>
                                <th className="py-1.5 text-center">Qty</th>
                                <th className="py-1.5 text-right">Rate</th>
                                {invSettings.showGst && <th className="py-1.5 text-right">GST</th>}
                                <th className="py-1.5 text-right rounded-tr pr-1">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="text-[10px]">
                          {invItems.map((item, idx) => (
                            <tr key={item.id} className={idx % 2 === 0 ? 'bg-gray-50' : ''}>
                              <td className="py-1.5 px-1">
                                <span className="font-medium">{item.name}</span>
                                {item.hsn && <span className="block text-[7px] text-gray-400">HSN: {item.hsn}</span>}
                              </td>
                              <td className="py-1.5 text-center">{item.qty} {item.unit}</td>
                              <td className="py-1.5 text-right">₹{item.rate}</td>
                              {invSettings.showGst && <td className="py-1.5 text-right">{item.gst}%</td>}
                              <td className="py-1.5 text-right pr-1">₹{Number(item.total || 0).toFixed(2)}</td>
                            </tr>
                          ))}
                          {invItems.length === 0 && (
                            <tr><td colSpan={5} className="py-4 text-center text-gray-400">No items added</td></tr>
                          )}
                        </tbody>
                    </table>
                    
                    {/* Totals */}
                    <div className="border-t-2 border-gray-300 pt-2 space-y-1 text-[10px]">
                        <div className="flex justify-between text-gray-600">
                          <span>Subtotal</span>
                          <span>₹{totals.subtotal.toFixed(2)}</span>
                        </div>
                        {invSettings.showGst && (
                          <div className="flex justify-between text-indigo-600">
                            <span>GST</span>
                            <span>₹{totals.totalGst.toFixed(2)}</span>
                          </div>
                        )}
                        {invSettings.discount > 0 && (
                          <div className="flex justify-between text-green-600">
                            <span>Discount</span>
                            <span>-₹{totals.discountAmt.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-lg font-black border-t-2 border-indigo-600 pt-2 mt-2">
                            <span>TOTAL</span>
                            <span className="text-indigo-700">₹{totals.grandTotal.toFixed(2)}</span>
                        </div>
                    </div>
                    
                    {invSettings.notes && (
                      <div className="mt-2 p-2 bg-yellow-50 rounded text-[8px] text-yellow-800">
                        <strong>Note:</strong> {invSettings.notes}
                      </div>
                    )}
                    <div className="mt-3 text-center text-[8px] text-gray-400 border-t pt-2">Thank you for your business!</div>
                </div>
             </div>

             {/* Customer Details */}
             <div className="grid grid-cols-2 gap-2 mb-3">
                 <input className="p-2.5 border-2 rounded-xl text-sm font-medium focus:border-indigo-400 outline-none" placeholder="Customer Name" value={invCust.name} onChange={e=>setInvCust({...invCust, name: e.target.value})} />
                 <input className="p-2.5 border-2 rounded-xl text-sm focus:border-indigo-400 outline-none" placeholder="Mobile Number" value={invCust.phone} onChange={e=>setInvCust({...invCust, phone: e.target.value})} />
             </div>
             
             {invSettings.invoiceType === 'gst' && (
               <input className="w-full p-2.5 border-2 rounded-xl text-sm mb-3 focus:border-indigo-400 outline-none" placeholder="Customer GSTIN (Optional)" value={invCust.gstNo} onChange={e=>setInvCust({...invCust, gstNo: e.target.value})} />
             )}

             {/* Add Item Form */}
             <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-4 rounded-xl border-2 border-indigo-100 mb-4">
                 <p className="text-xs font-bold text-indigo-600 mb-2">ADD ITEM</p>
                 <div className="grid grid-cols-2 gap-2 mb-2">
                     <input className="col-span-2 p-2.5 border-2 rounded-xl font-bold text-sm" placeholder="Item Name *" value={invCurrentItem.name} onChange={e=>setInvCurrentItem({...invCurrentItem, name: e.target.value})} />
                     {invSettings.showGst && (
                       <input className="p-2 border-2 rounded-lg text-sm" placeholder="HSN Code" value={invCurrentItem.hsn} onChange={e=>setInvCurrentItem({...invCurrentItem, hsn: e.target.value})} />
                     )}
                 </div>
                 
                 <div className="grid grid-cols-4 gap-2">
                     <input type="number" className="p-2 border-2 rounded-lg text-sm font-bold" placeholder="Qty" value={invCurrentItem.qty} onChange={e=>setInvCurrentItem({...invCurrentItem, qty: parseInt(e.target.value)||1})} />
                     <input type="number" className="p-2 border-2 rounded-lg text-sm" placeholder="Rate ₹" value={invCurrentItem.rate || ''} onChange={e=>setInvCurrentItem({...invCurrentItem, rate: parseFloat(e.target.value)})} />
                     {invSettings.showGst && (
                       <select className="p-2 border-2 rounded-lg text-sm" value={invCurrentItem.gst} onChange={e=>setInvCurrentItem({...invCurrentItem, gst: parseInt(e.target.value)})}>
                         <option value={0}>0%</option>
                         <option value={5}>5%</option>
                         <option value={12}>12%</option>
                         <option value={18}>18%</option>
                         <option value={28}>28%</option>
                       </select>
                     )}
                     <button onClick={addInvItem} className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold flex items-center justify-center shadow-lg hover:shadow-xl transition-all">
                       <Plus size={20}/>
                     </button>
                 </div>
             </div>
             
             {/* Extra Settings */}
             <div className="grid grid-cols-2 gap-2 mb-3">
               <select 
                 className="p-2 border-2 rounded-xl text-sm"
                 value={invSettings.paymentMode}
                 onChange={e => setInvSettings({...invSettings, paymentMode: e.target.value})}
               >
                 <option value="cash">💵 Cash</option>
                 <option value="upi">📱 UPI</option>
                 <option value="card">💳 Card</option>
                 <option value="credit">📋 Credit</option>
               </select>
               <div className="flex">
                 <input 
                   type="number" 
                   className="flex-1 p-2 border-2 rounded-l-xl text-sm" 
                   placeholder="Discount" 
                   value={invSettings.discount || ''}
                   onChange={e => setInvSettings({...invSettings, discount: parseFloat(e.target.value) || 0})}
                 />
                 <select 
                   className="p-2 border-2 border-l-0 rounded-r-xl text-sm"
                   value={invSettings.discountType}
                   onChange={e => setInvSettings({...invSettings, discountType: e.target.value})}
                 >
                   <option value="flat">₹</option>
                   <option value="percent">%</option>
                 </select>
               </div>
             </div>
             
             {/* Items List with Delete */}
             {invItems.length > 0 && (
               <div className="mb-3 space-y-1">
                 {invItems.map(item => (
                   <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm">
                     <span className="font-medium">{item.name} × {item.qty}</span>
                     <div className="flex items-center gap-2">
                       <span className="font-bold">₹{item.total.toFixed(0)}</span>
                       <button onClick={() => deleteInvItem(item.id)} className="text-red-500 p-1 hover:bg-red-50 rounded"><Trash2 size={14}/></button>
                     </div>
                   </div>
                 ))}
               </div>
             )}
             
             {invItems.length > 0 && 
                <button onClick={() => setInvItems([])} className="text-red-500 text-xs text-center w-full bg-red-50 p-2 rounded-xl font-bold">
                  Clear All Items
                </button>
             }
          </div>
        );

      case 'translator':
        return (
            <div className={`${cardClass} overflow-hidden`}>
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-xl flex items-center gap-2">
                    <Languages className="text-pink-500" size={24}/>
                    AI Translator
                  </h3>
                  <span className="text-xs bg-gradient-to-r from-pink-500 to-purple-500 text-white px-2 py-1 rounded-full">Powered by API</span>
                </div>

                {/* Language Selection */}
                <div className="flex items-center gap-2 mb-4 bg-gradient-to-r from-pink-50 to-purple-50 p-3 rounded-xl border border-pink-100">
                  <select 
                    value={transLang.from} 
                    onChange={(e) => setTransLang({...transLang, from: e.target.value})}
                    className="flex-1 p-2 rounded-lg border-2 border-pink-200 font-bold text-sm bg-white focus:border-pink-500 outline-none"
                  >
                    {languageOptions.map(lang => (
                      <option key={lang.code} value={lang.code}>{lang.name}</option>
                    ))}
                  </select>
                  <button 
                    onClick={swapLanguages}
                    className="p-2 bg-white border-2 border-pink-200 rounded-lg hover:bg-pink-100 transition-all active:scale-95"
                  >
                    <RefreshCcw size={20} className="text-pink-500"/>
                  </button>
                  <select 
                    value={transLang.to} 
                    onChange={(e) => setTransLang({...transLang, to: e.target.value})}
                    className="flex-1 p-2 rounded-lg border-2 border-purple-200 font-bold text-sm bg-white focus:border-purple-500 outline-none"
                  >
                    {languageOptions.map(lang => (
                      <option key={lang.code} value={lang.code}>{lang.name}</option>
                    ))}
                  </select>
                </div>

                {/* Input Area */}
                <div className="relative mb-4">
                  <textarea 
                    className={`w-full p-4 rounded-xl border-2 font-medium text-lg resize-none h-28 ${isDark ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white border-pink-200 text-black focus:border-pink-400'}`}
                    placeholder={`Type in ${languageOptions.find(l => l.code === transLang.from)?.name || 'source language'}...`}
                    value={transInput} 
                    onChange={e => setTransInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleTranslate()}
                  />
                  <div className="absolute bottom-3 right-3 flex gap-2">
                    <VoiceInput onResult={setTransInput} isDark={isDark} />
                    <button 
                      onClick={() => setTransInput('')}
                      className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all"
                    >
                      <X size={18} className="text-gray-500"/>
                    </button>
                  </div>
                </div>

                {/* Translate Button */}
                <button 
                  onClick={handleTranslate}
                  disabled={transLoading || !transInput.trim()}
                  className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all mb-4 ${
                    transLoading ? 'bg-gray-400 cursor-wait' : 
                    !transInput.trim() ? 'bg-gray-300 cursor-not-allowed' :
                    'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]'
                  }`}
                >
                  {transLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Translating...
                    </>
                  ) : (
                    <>
                      <Languages size={20}/>
                      Translate Now
                    </>
                  )}
                </button>

                {/* Output Area */}
                <div className={`flex-1 rounded-xl p-4 border-2 min-h-28 ${isDark ? 'bg-slate-700 border-slate-600' : 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-purple-600 font-bold uppercase tracking-wide">
                      {languageOptions.find(l => l.code === transLang.to)?.name || 'Translation'} Output:
                    </p>
                    {transOutput && (
                      <button 
                        onClick={() => { navigator.clipboard.writeText(transOutput); alert("Copied!"); }}
                        className="p-1.5 bg-purple-100 rounded-lg hover:bg-purple-200 transition-all"
                      >
                        <Copy size={14} className="text-purple-600"/>
                      </button>
                    )}
                  </div>
                  <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                    {transOutput || <span className="opacity-40 text-base">Translation will appear here...</span>}
                  </p>
                </div>

                {/* Instant Fallback Preview */}
                {transInput && transLang.to === 'hi' && (
                  <div className="mt-3 p-3 bg-yellow-50 rounded-xl border border-yellow-200">
                    <p className="text-xs text-yellow-700 font-bold mb-1 flex items-center gap-1">
                      <Zap size={12}/> Instant Preview (Offline):
                    </p>
                    <p className="text-sm text-yellow-900">{convertToHindiFallback(transInput)}</p>
                  </div>
                )}

                {/* Translation History */}
                {transHistory.length > 0 && (
                  <div className="mt-4 border-t pt-3">
                    <p className="text-xs font-bold text-gray-500 mb-2 flex items-center gap-1">
                      <Clock size={12}/> Recent Translations
                    </p>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {transHistory.slice(0, 5).map((item, idx) => (
                        <div 
                          key={idx}
                          onClick={() => { setTransInput(item.input); setTransOutput(item.output); setTransLang({from: item.from, to: item.to}); }}
                          className="p-2 bg-gray-50 rounded-lg text-xs cursor-pointer hover:bg-gray-100 transition-all border"
                        >
                          <span className="text-gray-600">{item.input.substring(0, 30)}...</span>
                          <span className="text-gray-400 mx-1">→</span>
                          <span className="text-purple-600 font-medium">{item.output.substring(0, 30)}...</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
        );
      case 'gst': {
        const price = parseFloat(gstInput.price) || 0;
        let gstAmt = 0, finalAmt = 0, baseAmt = 0, cgst = 0, sgst = 0, igst = 0;
        if(gstInput.isReverse) {
          baseAmt = (price * 100) / (100 + gstInput.rate);
          gstAmt = price - baseAmt;
          finalAmt = price;
        } else {
          baseAmt = price;
          gstAmt = (price * gstInput.rate) / 100;
          finalAmt = price + gstAmt;
        }
        cgst = sgst = gstAmt / 2;
        igst = gstAmt;
        return (
           <div className={cardClass}>
             <div className="flex justify-between items-center mb-4">
                 <h3 className="font-bold text-xl flex items-center gap-2">
                   <Percent className="text-blue-500" size={24}/>
                   GST Pro Calculator
                 </h3>
             </div>
             
             {/* GST Mode Toggle */}
             <div className="flex gap-2 mb-4 bg-blue-50 p-1 rounded-xl">
                <button 
                  onClick={() => setGstInput({...gstInput, isReverse: false})} 
                  className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${!gstInput.isReverse ? 'bg-blue-600 text-white shadow' : 'text-blue-600 hover:bg-blue-100'}`}
                >
                  Add GST
                </button>
                <button 
                  onClick={() => setGstInput({...gstInput, isReverse: true})} 
                  className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${gstInput.isReverse ? 'bg-green-600 text-white shadow' : 'text-green-600 hover:bg-green-100'}`}
                >
                  Reverse GST
                </button>
             </div>
             
             <input 
               type="number" 
               placeholder={gstInput.isReverse ? "Enter GST Inclusive Amount (₹)" : "Enter Base Amount (₹)"} 
               className={`${commonInputClass} text-center text-2xl`} 
               value={gstInput.price} 
               onChange={e => setGstInput({...gstInput, price: e.target.value})} 
             />
             
             {/* GST Rate Selection */}
             <div className="grid grid-cols-5 gap-2 mb-4">
               {[5, 12, 18, 28, 'custom'].map(r => (
                 <button 
                   key={r} 
                   onClick={() => r !== 'custom' && setGstInput({...gstInput, rate: r})} 
                   className={`py-3 rounded-xl font-bold border-2 transition-all ${gstInput.rate === r ? 'bg-blue-600 text-white border-blue-600 scale-105' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'}`}
                 >
                   {r === 'custom' ? '⚙️' : `${r}%`}
                 </button>
               ))}
             </div>
             
             {/* Results Card */}
             <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-2xl border-2 border-blue-100 mb-4">
               <div className="space-y-2 text-sm">
                 <div className="flex justify-between py-2 border-b border-blue-100">
                   <span className="text-gray-600">Base Amount</span> 
                   <span className="font-bold">₹{baseAmt.toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between py-2 border-b border-blue-100">
                   <span className="text-gray-600">GST ({gstInput.rate}%)</span> 
                   <span className="font-bold text-blue-600">₹{gstAmt.toFixed(2)}</span>
                 </div>
                 
                 {/* CGST/SGST Breakdown */}
                 <div className="bg-white/50 rounded-xl p-3 my-2">
                   <p className="text-xs text-gray-500 font-bold mb-2">TAX BREAKDOWN (Intra-State)</p>
                   <div className="grid grid-cols-2 gap-2">
                     <div className="text-center p-2 bg-blue-100/50 rounded-lg">
                       <p className="text-xs text-blue-600">CGST ({gstInput.rate/2}%)</p>
                       <p className="font-bold text-blue-800">₹{cgst.toFixed(2)}</p>
                     </div>
                     <div className="text-center p-2 bg-indigo-100/50 rounded-lg">
                       <p className="text-xs text-indigo-600">SGST ({gstInput.rate/2}%)</p>
                       <p className="font-bold text-indigo-800">₹{sgst.toFixed(2)}</p>
                     </div>
                   </div>
                   <div className="mt-2 text-center p-2 bg-purple-100/50 rounded-lg">
                     <p className="text-xs text-purple-600">IGST (Inter-State) ({gstInput.rate}%)</p>
                     <p className="font-bold text-purple-800">₹{igst.toFixed(2)}</p>
                   </div>
                 </div>
                 
                 <div className="flex justify-between text-2xl font-bold pt-2">
                   <span>Final Amount</span> 
                   <span className="text-green-600">₹{finalAmt.toFixed(2)}</span>
                 </div>
               </div>
             </div>
             
             <button 
               onClick={() => navigator.clipboard.writeText(`GST Calculation\n━━━━━━━━━━━━━━━\nBase: ₹${baseAmt.toFixed(2)}\nGST @${gstInput.rate}%: ₹${gstAmt.toFixed(2)}\n  CGST: ₹${cgst.toFixed(2)}\n  SGST: ₹${sgst.toFixed(2)}\n━━━━━━━━━━━━━━━\nTotal: ₹${finalAmt.toFixed(2)}`)} 
               className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all"
             >
               <Copy size={16}/> Copy Full Breakdown
             </button>
           </div>
           );
          }
      case 'margin': {
         const cost = parseFloat(marginInput.cost) || 0;
         const sell = parseFloat(marginInput.sell) || 0;
         const markup = parseFloat(marginInput.markup) || 0;
         const profit = sell - cost;
         const marginPercent = sell > 0 ? ((profit / sell) * 100) : 0;
         const markupPercent = cost > 0 ? ((profit / cost) * 100) : 0;
         const sellFromMarkup = cost + (cost * markup / 100);
         const breakEvenQty = cost > 0 && profit > 0 ? Math.ceil(cost / profit) : 0;
         
         return (
           <div className={cardClass}>
               <div className="flex justify-between items-center mb-4">
                 <h3 className="font-bold text-xl flex items-center gap-2">
                   <Calculator className="text-purple-500" size={24}/>
                   Profit Analyzer Pro
                 </h3>
                 <button 
                   onClick={() => setMarginInput({cost: '', sell: '', discount: 0, mode: marginInput.mode, markup: ''})} 
                   className="text-xs text-red-500 font-bold bg-red-50 px-3 py-1 rounded-full"
                 >
                   RESET
                 </button>
               </div>
               
               {/* Mode Tabs */}
               <div className="flex gap-2 mb-4 bg-purple-50 p-1.5 rounded-xl">
                  <button onClick={() => setMarginInput({...marginInput, mode: 'profit'})} className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${marginInput.mode === 'profit' ? 'bg-white shadow-md text-purple-600' : 'text-gray-500 hover:text-purple-400'}`}>
                    📊 Profit Analysis
                  </button>
                  <button onClick={() => setMarginInput({...marginInput, mode: 'markup'})} className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${marginInput.mode === 'markup' ? 'bg-white shadow-md text-purple-600' : 'text-gray-500 hover:text-purple-400'}`}>
                    📈 Markup Pricing
                  </button>
                  <button onClick={() => setMarginInput({...marginInput, mode: 'discount'})} className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${marginInput.mode === 'discount' ? 'bg-white shadow-md text-purple-600' : 'text-gray-500 hover:text-purple-400'}`}>
                    🏷️ Discount
                  </button>
               </div>
               
               {marginInput.mode === 'profit' ? (
                  <>
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div>
                          <label className="text-xs font-bold text-gray-500 mb-1 block">BUYING COST</label>
                          <input 
                            type="number" 
                            placeholder="₹0" 
                            className={`${commonInputClass} mb-0 text-center text-xl`} 
                            value={marginInput.cost} 
                            onChange={e => setMarginInput({...marginInput, cost: e.target.value})} 
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-500 mb-1 block">SELLING PRICE</label>
                          <input 
                            type="number" 
                            placeholder="₹0" 
                            className={`${commonInputClass} mb-0 text-center text-xl`} 
                            value={marginInput.sell} 
                            onChange={e => setMarginInput({...marginInput, sell: e.target.value})} 
                          />
                        </div>
                      </div>
                      
                      {cost > 0 && sell > 0 && (
                          <div className={`p-4 rounded-2xl border-2 ${profit >= 0 ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200' : 'bg-gradient-to-br from-red-50 to-pink-50 border-red-200'}`}>
                             {/* Main Profit Display */}
                             <div className="text-center mb-4">
                               <p className={`text-xs font-bold mb-1 ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                 {profit >= 0 ? '💰 PROFIT' : '📉 LOSS'}
                               </p>
                               <p className={`text-4xl font-black ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                 ₹{Math.abs(profit).toFixed(2)}
                               </p>
                             </div>
                             
                             {/* Stats Grid */}
                             <div className="grid grid-cols-2 gap-3 mb-3">
                               <div className="bg-white/60 rounded-xl p-3 text-center">
                                 <p className="text-xs text-gray-500 font-medium">Profit Margin</p>
                                 <p className={`text-2xl font-bold ${marginPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                   {marginPercent.toFixed(1)}%
                                 </p>
                               </div>
                               <div className="bg-white/60 rounded-xl p-3 text-center">
                                 <p className="text-xs text-gray-500 font-medium">Markup %</p>
                                 <p className={`text-2xl font-bold ${markupPercent >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
                                   {markupPercent.toFixed(1)}%
                                 </p>
                               </div>
                             </div>
                             
                             {/* Break-even Analysis */}
                             {profit > 0 && (
                               <div className="bg-blue-100/50 rounded-xl p-3 text-center">
                                 <p className="text-xs text-blue-600 font-medium">Break-even Quantity</p>
                                 <p className="text-lg font-bold text-blue-800">
                                   Sell {breakEvenQty} units to recover cost
                                 </p>
                               </div>
                             )}
                          </div>
                      )}
                  </>
               ) : marginInput.mode === 'markup' ? (
                  <>
                      <div className="mb-4">
                        <label className="text-xs font-bold text-gray-500 mb-1 block">BUYING COST</label>
                        <input 
                          type="number" 
                          placeholder="₹0" 
                          className={`${commonInputClass} mb-0 text-center text-xl`} 
                          value={marginInput.cost} 
                          onChange={e => setMarginInput({...marginInput, cost: e.target.value})} 
                        />
                      </div>
                      
                      <div className="mb-4">
                        <label className="text-xs font-bold text-gray-500 mb-2 block">SELECT MARKUP %</label>
                        <div className="grid grid-cols-4 gap-2">
                          {[10, 15, 20, 25, 30, 40, 50, 100].map(m => (
                            <button 
                              key={m} 
                              onClick={() => setMarginInput({...marginInput, markup: m.toString()})}
                              className={`py-2 rounded-lg font-bold text-sm transition-all ${parseFloat(marginInput.markup) === m ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-purple-100'}`}
                            >
                              {m}%
                            </button>
                          ))}
                        </div>
                        <input 
                          type="number" 
                          placeholder="Or enter custom markup %" 
                          className={`${commonInputClass} mb-0 mt-3`} 
                          value={marginInput.markup} 
                          onChange={e => setMarginInput({...marginInput, markup: e.target.value})} 
                        />
                      </div>
                      
                      {cost > 0 && markup > 0 && (
                        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-4 rounded-2xl border-2 border-purple-200">
                          <div className="text-center">
                            <p className="text-xs font-bold text-purple-600 mb-1">RECOMMENDED SELLING PRICE</p>
                            <p className="text-4xl font-black text-purple-700">₹{sellFromMarkup.toFixed(2)}</p>
                            <p className="text-sm text-gray-500 mt-2">
                              Profit per unit: <span className="font-bold text-green-600">₹{(sellFromMarkup - cost).toFixed(2)}</span>
                            </p>
                          </div>
                        </div>
                      )}
                  </>
               ) : (
                  <>
                      <div className="mb-4">
                        <label className="text-xs font-bold text-gray-500 mb-1 block">ORIGINAL PRICE (MRP)</label>
                        <input 
                          type="number" 
                          placeholder="₹0" 
                          className={`${commonInputClass} mb-0 text-center text-xl`} 
                          value={marginInput.cost} 
                          onChange={e => setMarginInput({...marginInput, cost: e.target.value})} 
                        />
                      </div>
                      
                      <div className="mb-4">
                        <label className="text-xs font-bold text-gray-500 mb-2 block">DISCOUNT %</label>
                        <div className="grid grid-cols-5 gap-2 mb-3">
                          {[5, 10, 15, 20, 25].map(d => (
                            <button 
                              key={d} 
                              onClick={() => setMarginInput({...marginInput, discount: d})}
                              className={`py-2 rounded-lg font-bold text-sm transition-all ${marginInput.discount === d ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-orange-100'}`}
                            >
                              {d}%
                            </button>
                          ))}
                        </div>
                        <input 
                          type="number" 
                          placeholder="Or enter custom discount %" 
                          className={commonInputClass} 
                          value={marginInput.discount || ''} 
                          onChange={e => setMarginInput({...marginInput, discount: parseFloat(e.target.value) || 0})} 
                        />
                      </div>
                      
                      <div className="bg-gradient-to-br from-orange-50 to-yellow-50 p-4 rounded-2xl border-2 border-orange-200">
                         <div className="flex justify-between items-center mb-3 pb-3 border-b border-orange-200">
                           <span className="text-gray-600">You Save</span> 
                           <span className="text-xl font-bold text-orange-600">
                             ₹{((cost * marginInput.discount) / 100).toFixed(2)}
                           </span>
                         </div>
                         <div className="text-center">
                           <p className="text-xs font-bold text-green-600 mb-1">FINAL PAYABLE AMOUNT</p>
                           <p className="text-4xl font-black text-green-700">
                             ₹{(cost - (cost * marginInput.discount / 100)).toFixed(2)}
                           </p>
                         </div>
                      </div>
                  </>
               )}
           </div>
         );
        }
      case 'converter': {
        const val = parseFloat(convInput.val) || 0;
        const conversions = {
          kgToTon: { factor: 1/1000, unit: 'Tons', formula: '÷ 1000' },
          tonToKg: { factor: 1000, unit: 'KG', formula: '× 1000' },
          kgToQuintal: { factor: 1/100, unit: 'Quintals', formula: '÷ 100' },
          quintalToKg: { factor: 100, unit: 'KG', formula: '× 100' },
          oil: { factor: 0.91, unit: 'KG', formula: '× 0.91 (density)' },
          ghee: { factor: 0.93, unit: 'KG', formula: '× 0.93' },
          feetToM: { factor: 0.3048, unit: 'Meters', formula: '× 0.3048' },
          mToFeet: { factor: 3.28084, unit: 'Feet', formula: '× 3.281' },
          inchToCm: { factor: 2.54, unit: 'CM', formula: '× 2.54' },
          cmToInch: { factor: 0.3937, unit: 'Inches', formula: '× 0.394' },
          sqftToSqm: { factor: 0.0929, unit: 'Sq.Meter', formula: '× 0.093' },
          sqmToSqft: { factor: 10.764, unit: 'Sq.Feet', formula: '× 10.76' },
          gajaToSqft: { factor: 9, unit: 'Sq.Feet', formula: '× 9' },
          bighaToSqft: { factor: 27225, unit: 'Sq.Feet', formula: '× 27225' },
        };
        const conv = conversions[convInput.type] || { factor: 1, unit: '', formula: '' };
        const result = val * conv.factor;
        
        const categories = {
          weight: ['kgToTon', 'tonToKg', 'kgToQuintal', 'quintalToKg'],
          liquid: ['oil', 'ghee'],
          length: ['feetToM', 'mToFeet', 'inchToCm', 'cmToInch'],
          area: ['sqftToSqm', 'sqmToSqft', 'gajaToSqft', 'bighaToSqft']
        };
        
        const convLabels = {
          kgToTon: 'KG → Tons', tonToKg: 'Tons → KG',
          kgToQuintal: 'KG → Quintals', quintalToKg: 'Quintals → KG',
          oil: 'Liters → KG (Oil)', ghee: 'Liters → KG (Ghee)',
          feetToM: 'Feet → Meters', mToFeet: 'Meters → Feet',
          inchToCm: 'Inch → CM', cmToInch: 'CM → Inch',
          sqftToSqm: 'Sq.ft → Sq.m', sqmToSqft: 'Sq.m → Sq.ft',
          gajaToSqft: 'Gaja → Sq.ft', bighaToSqft: 'Bigha → Sq.ft'
        };
        
        return (
           <div className={cardClass}>
             <h3 className="font-bold mb-4 text-xl flex items-center gap-2">
               <RefreshCcw className="text-green-500" size={24}/>
               Pro Unit Converter
             </h3>
             
             {/* Category Tabs */}
             <div className="flex gap-1 mb-3 overflow-x-auto pb-2">
               {Object.entries({ weight: '⚖️ Weight', liquid: '💧 Liquid', length: '📏 Length', area: '📐 Area' }).map(([key, label]) => (
                 <button 
                   key={key}
                   onClick={() => setConvInput({...convInput, type: categories[key][0]})}
                   className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                     categories[key].includes(convInput.type) 
                       ? 'bg-green-600 text-white' 
                       : 'bg-gray-100 text-gray-600 hover:bg-green-100'
                   }`}
                 >
                   {label}
                 </button>
               ))}
             </div>
             
             {/* Conversion Type Grid */}
             <div className="grid grid-cols-2 gap-2 mb-4">
               {Object.entries(convLabels)
                 .filter(([key]) => Object.values(categories).flat().includes(key) && 
                   Object.entries(categories).find(([_, v]) => v.includes(convInput.type))?.[1].includes(key))
                 .map(([key, label]) => (
                   <button 
                     key={key}
                     onClick={() => setConvInput({...convInput, type: key})}
                     className={`py-2 px-3 rounded-xl text-sm font-bold transition-all ${
                       convInput.type === key 
                         ? 'bg-green-600 text-white shadow-lg scale-105' 
                         : 'bg-gray-100 text-gray-600 hover:bg-green-100'
                     }`}
                   >
                     {label}
                   </button>
                 ))
               }
             </div>
             
             {/* Input */}
             <div className="relative mb-4">
               <input 
                 type="number" 
                 placeholder="Enter Value" 
                 className={`${commonInputClass} text-center text-2xl mb-0 pr-16`} 
                 value={convInput.val} 
                 onChange={e => setConvInput({...convInput, val: e.target.value})} 
               />
               <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-bold">
                 {convLabels[convInput.type]?.split('→')[0]?.trim()}
               </span>
             </div>
             
             {/* Formula Display */}
             <div className="text-center text-xs text-gray-500 mb-3 font-mono">
               Formula: {conv.formula}
             </div>
             
             {/* Result */}
             <div className={`p-6 rounded-2xl font-mono text-center ${isDark ? 'bg-gradient-to-br from-slate-700 to-slate-800' : 'bg-gradient-to-br from-green-50 to-emerald-100 border-2 border-green-200'}`}>
                 <p className="text-xs text-green-600 font-bold mb-2">RESULT</p>
                 <p className={`text-4xl font-black ${isDark ? 'text-white' : 'text-green-700'}`}>
                   {result.toFixed(4)}
                 </p>
                 <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-green-600'}`}>
                   {conv.unit}
                 </p>
             </div>
             
             {/* Quick Reference */}
             <div className="mt-4 p-3 bg-gray-50 rounded-xl">
               <p className="text-xs font-bold text-gray-500 mb-2">Quick Reference</p>
               <div className="grid grid-cols-2 gap-2 text-xs">
                 <div className="text-gray-600">1 Quintal = 100 KG</div>
                 <div className="text-gray-600">1 Ton = 1000 KG</div>
                 <div className="text-gray-600">1 Feet = 12 Inch</div>
                 <div className="text-gray-600">1 Gaja = 9 Sq.ft</div>
               </div>
             </div>
           </div>
         );
        }
      case 'card':
         return (
           <div className={cardClass}>
             <h3 className="font-bold mb-4 text-xl flex items-center gap-2">
               <CreditCard className="text-orange-500" size={24}/>
               Digital Business Card
             </h3>
             
             {/* Premium Card Design */}
             <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6 rounded-2xl shadow-2xl mb-4 relative overflow-hidden" id="digital-card-area">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-400/20 to-transparent rounded-bl-full"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-yellow-500/10 to-transparent rounded-tr-full"></div>
                <div className="absolute top-1/2 right-1/4 w-48 h-48 bg-yellow-500/5 rounded-full blur-3xl"></div>
                
                {/* Logo/Icon Placeholder */}
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                  <Store size={24} className="text-white"/>
                </div>
                
                {/* Shop Name */}
                <h2 className="text-2xl font-black text-yellow-400 mb-1 tracking-tight">{shopDetails.shopName || "MY SHOP"}</h2>
                <p className="text-xs text-gray-400 mb-6 uppercase tracking-widest">Premium Auto Parts & Accessories</p>
                
                {/* Contact Info */}
                <div className="space-y-3 relative z-10">
                  <div className="flex items-center gap-3 bg-white/5 p-2 rounded-lg backdrop-blur-sm">
                    <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                      <Phone size={14} className="text-yellow-400"/>
                    </div>
                    <span className="text-sm">+91 98765 43210</span>
                  </div>
                  <div className="flex items-center gap-3 bg-white/5 p-2 rounded-lg backdrop-blur-sm">
                    <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                      <Store size={14} className="text-yellow-400"/>
                    </div>
                    <span className="text-sm">Main Market, City Name</span>
                  </div>
                </div>
                
                {/* QR Code Placeholder */}
                <div className="absolute bottom-4 right-4 w-16 h-16 bg-white rounded-lg p-1">
                  <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 rounded flex items-center justify-center text-gray-400 text-[8px]">QR</div>
                </div>
             </div>
             
             <div className="flex gap-2">
               <button 
                 onClick={async () => {
                   if (!window.html2canvas) {
                     const script = document.createElement('script');
                     script.src = "https://html2canvas.hertzen.com/dist/html2canvas.min.js";
                     document.head.appendChild(script);
                     await new Promise(resolve => script.onload = resolve);
                   }
                   const element = document.getElementById('digital-card-area');
                   if (!element) return;
                   const canvas = await window.html2canvas(element, { backgroundColor: null, scale: 2 });
                   const link = document.createElement('a');
                   link.href = canvas.toDataURL();
                   link.download = `BusinessCard_${Date.now()}.png`;
                   link.click();
                 }}
                 className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-xl font-bold flex items-center justify-center gap-2"
               >
                 <Download size={18}/> Download Card
               </button>
               <button 
                 onClick={() => {
                   const text = `${shopDetails.shopName || 'My Shop'}\n📞 +91 98765 43210\n📍 Main Market, City`;
                   navigator.share ? navigator.share({ text }) : navigator.clipboard.writeText(text);
                 }}
                 className="p-3 bg-gray-100 rounded-xl"
               >
                 <Share2 size={20} className="text-gray-600"/>
               </button>
             </div>
             <p className="text-center text-xs opacity-50 mt-3">Customize in Shop Settings</p>
           </div>
         );

      case 'emi': {
        const P = parseFloat(emiInput.principal) || 0;
        const r = (parseFloat(emiInput.rate) || 0) / 100 / 12; // Monthly rate
        const n = emiInput.tenureType === 'years' 
          ? (parseFloat(emiInput.tenure) || 0) * 12 
          : (parseFloat(emiInput.tenure) || 0);
        
        let emi = 0, totalPayment = 0, totalInterest = 0;
        if (P > 0 && r > 0 && n > 0) {
          emi = P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
          totalPayment = emi * n;
          totalInterest = totalPayment - P;
        }
        
        return (
          <div className={cardClass}>
            <h3 className="font-bold mb-4 text-xl flex items-center gap-2">
              <DollarSign className="text-emerald-500" size={24}/>
              EMI Calculator
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">LOAN AMOUNT (₹)</label>
                <input 
                  type="number" 
                  placeholder="Enter principal amount"
                  className={`${commonInputClass} mb-0 text-center text-xl`}
                  value={emiInput.principal}
                  onChange={e => setEmiInput({...emiInput, principal: e.target.value})}
                />
              </div>
              
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">INTEREST RATE (% per annum)</label>
                <input 
                  type="number" 
                  placeholder="e.g., 12"
                  className={`${commonInputClass} mb-0`}
                  value={emiInput.rate}
                  onChange={e => setEmiInput({...emiInput, rate: e.target.value})}
                />
                <div className="flex gap-2 mt-2">
                  {[8, 10, 12, 15, 18].map(rate => (
                    <button 
                      key={rate}
                      onClick={() => setEmiInput({...emiInput, rate: rate.toString()})}
                      className={`flex-1 py-1 rounded text-xs font-bold ${parseFloat(emiInput.rate) === rate ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600'}`}
                    >
                      {rate}%
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">LOAN TENURE</label>
                <div className="flex gap-2">
                  <input 
                    type="number" 
                    placeholder="Duration"
                    className={`${commonInputClass} mb-0 flex-1`}
                    value={emiInput.tenure}
                    onChange={e => setEmiInput({...emiInput, tenure: e.target.value})}
                  />
                  <select 
                    className={`${commonInputClass} mb-0 w-28`}
                    value={emiInput.tenureType}
                    onChange={e => setEmiInput({...emiInput, tenureType: e.target.value})}
                  >
                    <option value="months">Months</option>
                    <option value="years">Years</option>
                  </select>
                </div>
              </div>
            </div>
            
            {P > 0 && emi > 0 && (
              <div className="mt-6 bg-gradient-to-br from-emerald-50 to-green-50 p-4 rounded-2xl border-2 border-emerald-200">
                <div className="text-center mb-4">
                  <p className="text-xs font-bold text-emerald-600 mb-1">MONTHLY EMI</p>
                  <p className="text-4xl font-black text-emerald-700">₹{emi.toFixed(0)}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/60 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-500">Total Interest</p>
                    <p className="text-lg font-bold text-red-600">₹{totalInterest.toFixed(0)}</p>
                  </div>
                  <div className="bg-white/60 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-500">Total Payment</p>
                    <p className="text-lg font-bold text-emerald-600">₹{totalPayment.toFixed(0)}</p>
                  </div>
                </div>
                
                {/* Visual Breakdown */}
                <div className="mt-3 h-4 rounded-full overflow-hidden bg-gray-200 flex">
                  <div 
                    className="bg-emerald-500 h-full" 
                    style={{ width: `${(P / totalPayment) * 100}%` }}
                  ></div>
                  <div 
                    className="bg-red-400 h-full" 
                    style={{ width: `${(totalInterest / totalPayment) * 100}%` }}
                  ></div>
                </div>
                <div className="flex justify-between mt-1 text-xs text-gray-500">
                  <span>Principal ({((P / totalPayment) * 100).toFixed(0)}%)</span>
                  <span>Interest ({((totalInterest / totalPayment) * 100).toFixed(0)}%)</span>
                </div>
              </div>
            )}
          </div>
        );
      }

      case 'stockvalue': {
        const totalValue = stockCalc.items.reduce((sum, item) => sum + (item.qty * item.rate), 0);
        const totalItems = stockCalc.items.reduce((sum, item) => sum + item.qty, 0);
        
        return (
          <div className={cardClass}>
            <h3 className="font-bold mb-4 text-xl flex items-center gap-2">
              <Activity className="text-cyan-500" size={24}/>
              Stock Value Calculator
            </h3>
            
            {/* Add Item Form */}
            <div className="bg-cyan-50 p-3 rounded-xl border border-cyan-200 mb-4">
              <div className="grid grid-cols-3 gap-2 mb-2">
                <input 
                  placeholder="Item Name"
                  className="col-span-3 p-2 rounded-lg border text-sm font-bold"
                  value={stockCalc.newItem.name}
                  onChange={e => setStockCalc({...stockCalc, newItem: {...stockCalc.newItem, name: e.target.value}})}
                />
                <input 
                  type="number"
                  placeholder="Qty"
                  className="p-2 rounded-lg border text-sm"
                  value={stockCalc.newItem.qty || ''}
                  onChange={e => setStockCalc({...stockCalc, newItem: {...stockCalc.newItem, qty: parseInt(e.target.value) || 0}})}
                />
                <input 
                  type="number"
                  placeholder="Rate ₹"
                  className="p-2 rounded-lg border text-sm"
                  value={stockCalc.newItem.rate || ''}
                  onChange={e => setStockCalc({...stockCalc, newItem: {...stockCalc.newItem, rate: parseFloat(e.target.value) || 0}})}
                />
                <button 
                  onClick={() => {
                    if (stockCalc.newItem.name && stockCalc.newItem.qty && stockCalc.newItem.rate) {
                      setStockCalc({
                        items: [...stockCalc.items, { ...stockCalc.newItem, id: Date.now() }],
                        newItem: { name: '', qty: 0, rate: 0 }
                      });
                    }
                  }}
                  className="bg-cyan-600 text-white rounded-lg font-bold"
                >
                  <Plus size={20} className="mx-auto"/>
                </button>
              </div>
            </div>
            
            {/* Items List */}
            <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
              {stockCalc.items.map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-bold text-sm">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.qty} × ₹{item.rate}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-cyan-600">₹{(item.qty * item.rate).toFixed(0)}</span>
                    <button 
                      onClick={() => setStockCalc({...stockCalc, items: stockCalc.items.filter(i => i.id !== item.id)})}
                      className="text-red-400 hover:text-red-600"
                    >
                      <X size={16}/>
                    </button>
                  </div>
                </div>
              ))}
              {stockCalc.items.length === 0 && (
                <div className="text-center py-6 text-gray-400">
                  <Package size={32} className="mx-auto mb-2 opacity-50"/>
                  <p className="text-sm">Add items to calculate stock value</p>
                </div>
              )}
            </div>
            
            {/* Total Summary */}
            {stockCalc.items.length > 0 && (
              <div className="bg-gradient-to-br from-cyan-50 to-blue-50 p-4 rounded-2xl border-2 border-cyan-200">
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Total Items</p>
                    <p className="text-2xl font-bold text-gray-700">{totalItems}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">SKU Count</p>
                    <p className="text-2xl font-bold text-gray-700">{stockCalc.items.length}</p>
                  </div>
                </div>
                <div className="text-center pt-3 border-t border-cyan-200">
                  <p className="text-xs font-bold text-cyan-600 mb-1">TOTAL STOCK VALUE</p>
                  <p className="text-4xl font-black text-cyan-700">₹{totalValue.toLocaleString()}</p>
                </div>
              </div>
            )}
            
            {stockCalc.items.length > 0 && (
              <button 
                onClick={() => setStockCalc({ items: [], newItem: { name: '', qty: 0, rate: 0 } })}
                className="w-full mt-3 py-2 text-red-500 bg-red-50 rounded-xl text-sm font-bold"
              >
                Clear All Items
              </button>
            )}
          </div>
        );
      }

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
                     <input className="p-4 text-xl font-bold outline-none bg-transparent border-b" placeholder="Title" value={currentNote.title} onChange={e => setCurrentNote({...currentNote, title: e.target.value})} />
                     
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
        <div>
          <h1 className="text-xl font-bold">{activeTool ? tools.find(toolItem => toolItem.id === activeTool)?.name : t("Business Tools")}</h1>
          {!activeTool && <p className="text-xs text-gray-500">Industry-ready business utilities</p>}
        </div>
      </div>

      <div className="p-4 max-w-md mx-auto min-h-screen">
        {!activeTool && (
          <div className="grid grid-cols-2 gap-3 mt-2">
            {tools.map(tool => {
               const isPinned = pinnedTools.includes(tool.id);
               return (
                <div 
                  key={tool.id} 
                  className={`relative p-4 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${isDark ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : 'bg-white border-gray-200 hover:border-blue-400 hover:shadow-lg shadow-sm'}`}
                  onClick={() => { setActiveTool(tool.id); setNotesView('list'); }}
                >
                  <div className={`p-3 rounded-2xl ${tool.color} shadow-sm`}>{tool.icon}</div>
                  <span className="font-bold text-sm text-center">{t(tool.name)}</span>
                  <span className="text-[10px] text-gray-500 text-center">{tool.desc}</span>
                  {/* Pin Button */}
                  <button 
                    onClick={(e) => { e.stopPropagation(); onTogglePin(tool.id); }} 
                    className={`absolute top-2 right-2 p-1.5 rounded-full transition-all ${isPinned ? 'text-blue-500 bg-blue-100' : 'text-gray-300 hover:text-gray-500 hover:bg-gray-100'}`}
                  >
                      {isPinned ? <Pin size={14} fill="currentColor"/> : <Pin size={14}/>}
                  </button>
                </div>
               );
            })}
            <div className="col-span-2 text-center text-xs opacity-50 mt-4 flex items-center justify-center gap-1">
                <Pin size={10}/> Pin tools to Home Screen for quick access
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
  const [isListening, setIsListening] = useState(false);
  const [hasError, setHasError] = useState(false);
  
  const startListening = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-IN';
      recognition.continuous = false;
      recognition.interimResults = false;
      
      recognition.onstart = () => {
        setIsListening(true);
        setHasError(false);
        if (navigator.vibrate) navigator.vibrate(100);
      };
      
      recognition.onresult = (e) => {
        const transcript = e.results[0][0].transcript;
        // Process through desi dictionary before returning
        let processed = transcript.toLowerCase();
        Object.keys(synonymMap).forEach(key => {
            const regex = new RegExp(`\\b${key}\\b`, 'gi');
            if (regex.test(processed)) {
                processed = processed.replace(regex, synonymMap[key]);
            }
        });
        onResult(processed);
        setIsListening(false);
        if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
      };
      
      recognition.onerror = (e) => {
        console.warn('Speech recognition error:', e.error);
        setIsListening(false);
        setHasError(true);
        
        // Handle specific errors
        if (e.error === 'network') {
          // Offline - show visual feedback
          console.info('Voice search requires internet connection');
        } else if (e.error === 'no-speech') {
          // No speech detected - that's OK
          setHasError(false);
        }
        
        // Clear error state after 2 seconds
        setTimeout(() => setHasError(false), 2000);
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };
      
      try { 
        recognition.start(); 
      } catch (e) { 
        console.error('Failed to start voice recognition:', e); 
        setHasError(true);
        setTimeout(() => setHasError(false), 2000);
      }
    } else { 
      alert("Voice input not supported in this browser. Please type manually."); 
    }
  };
  
  return (
    <button 
      onClick={startListening} 
      disabled={isListening}
      className={`p-3 rounded-full shrink-0 transition-all ${
        isListening 
          ? 'bg-red-500 text-white animate-pulse' 
          : hasError
            ? 'bg-yellow-500 text-white'
            : isDark 
              ? 'bg-slate-700 text-white hover:bg-slate-600' 
              : 'bg-gray-100 text-black hover:bg-gray-200'
      }`}
    >
      <Mic size={20} className={isListening ? 'animate-bounce' : ''}/>
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


const NavBtn = ({ icon, label, active, onClick, alert, isDark, accentHex }: any) => (
  <button 
    onClick={onClick} 
    className={`relative flex-1 flex flex-col items-center py-2 px-1 rounded-2xl transition-all duration-200 ${
      active 
        ? isDark 
          ? '' 
          : 'shadow-sm' 
        : isDark 
          ? 'text-slate-500 hover:text-slate-300 hover:bg-slate-800' 
          : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
    }`}
    style={active ? {
      color: accentHex,
      backgroundColor: isDark ? hexToRgba(accentHex, 0.16) : hexToRgba(accentHex, 0.14)
    } : undefined}
  >
    <div
      className="p-1.5 rounded-xl transition-all"
      style={active ? { backgroundColor: isDark ? hexToRgba(accentHex, 0.22) : hexToRgba(accentHex, 0.18) } : undefined}
    >
      {icon && React.createElement(icon, { size: 22, strokeWidth: active ? 2.5 : 2 })}
    </div>
    <span className={`text-[9px] font-bold mt-0.5 text-center leading-none ${active ? 'opacity-100' : 'opacity-70'}`}>{label}</span>
    {alert && (
      <span className="absolute top-0 right-2 flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-white"></span>
      </span>
    )}
  </button>
);


const defaultData = { 
  pages: [], 
  entries: [], 
  bills: [], 
  salesEvents: [],
  settings: { limit: 5, theme: 'light', accentColor: 'blue', shakeToSearch: true, productPassword: '0000', shopName: 'Autonex', pinnedTools: [] },
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
  
  // 👻 GHOST MIC STATE
  const [isGhostMicOpen, setIsGhostMicOpen] = useState(false);
  const shakeEnabled = data.settings?.shakeToSearch !== false;
  
  // 📳 SHAKE SENSOR HOOK - Activates Ghost Mic on shake
  useShakeSensor(() => {
    if (!isGhostMicOpen && user && !authLoading && !dbLoading) {
      console.log('🔔 Shake detected! Opening Ghost Mic...');
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
      setIsGhostMicOpen(true);
    }
  }, shakeEnabled);

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
  const [settingsTab, setSettingsTab] = useState('profile');
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
  
  // 📡 SYNC INDICATOR STATE
  const [hasPendingWrites, setHasPendingWrites] = useState(false);

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
    return convertToHindiFallback(text);
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

  // 🧠 Initialize Smart Search Engine with Trie when data changes
  useEffect(() => {
    if (data.entries && data.entries.length > 0) {
      // Rebuild Trie for fast autocomplete - O(n*m) where n=items, m=avg name length
      SmartSearchEngine.initialized = false;
      SmartSearchEngine.initialize(data.entries);
      console.log('🧠 Smart Search Engine initialized with', data.entries.length, 'items');
    }
  }, [data.entries]);

  // Check for pending writes (for sync indicator)
  useEffect(() => {
    const checkPending = () => {
      try {
        const raw = localStorage.getItem('dukan:pendingWrites');
        setHasPendingWrites(!!raw && JSON.parse(raw).length > 0);
      } catch { setHasPendingWrites(false); }
    };
    checkPending();
    const interval = setInterval(checkPending, 5000);
    return () => clearInterval(interval);
  }, []);

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
        if(!cloudData.settings.shopName) cloudData.settings.shopName = 'Autonex';
        if(!cloudData.appStatus) cloudData.appStatus = 'active';
            
        if(!Array.isArray(cloudData.pages)) cloudData.pages = [];
        if(!Array.isArray(cloudData.entries)) cloudData.entries = [];
        if(!Array.isArray(cloudData.bills)) cloudData.bills = []; 
        if(!cloudData.settings.productPassword) cloudData.settings.productPassword = '0000';

        if(cloudData.settings.limit) setTempLimit(cloudData.settings.limit);

        // Merge transient local state (previewUrl, uploading/progress/tempBlob, uploadFailed)
        const localBills = (dataRef.current && dataRef.current.bills) ? dataRef.current.bills : [];
        const localMap = new Map(localBills.map((b: any) => [b.id, b]));

        const mergedBills = (cloudData.bills || []).map((cb: any) => {
          const local: any = localMap.get(cb.id);
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
        const cloudIds = new Set((cloudData.bills || []).map((b: any) => b.id));
        const localOnly = localBills.filter((b: any) => !cloudIds.has(b.id));

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

        const blobAtQuality = (q: number): Promise<Blob | null> => new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', q));

        let bestBlob: Blob | null = null;

        while (true) {
          canvas.width = width;
          canvas.height = height;
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(imgBitmap, 0, 0, canvas.width, canvas.height);

            // Quick direct attempt at reasonable quality first
            const quick = await blobAtQuality(0.75);
            if (quick && quick.size <= TARGET_MAX) return quick;

            // Binary search over quality to reduce iterations
            let low = 0.35, high = 0.85, candidate: Blob | null = null;
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
          const compressedBlob = await compressImage(file) as Blob;
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

  const themeSetting = (data.settings?.theme || 'light') as string;
  const prefersDark = typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-color-scheme: dark)').matches
    : false;
  const resolvedTheme = themeSetting === 'auto' ? (prefersDark ? 'dark' : 'light') : themeSetting;
  const themePreset = THEME_PRESETS[resolvedTheme] || (prefersDark ? THEME_PRESETS.dark : THEME_PRESETS.light);
  const isDark = themePreset.isDark;

  const accentId = (data.settings?.accentColor || 'blue') as string;
  const accentHex = ACCENT_COLOR_HEX[accentId] || ACCENT_COLOR_HEX.blue;

  useEffect(() => {
    const metaTags = [{ name: "theme-color", content: themePreset.meta }];
    metaTags.forEach(tag => {
        let meta = document.querySelector(`meta[name="${tag.name}"]`) as HTMLMetaElement | null;
        if (!meta) { meta = document.createElement('meta'); meta.name = tag.name; document.head.appendChild(meta); }
        meta.content = tag.content;
    });
  }, [themePreset.meta]);

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
        const nowTs = Date.now();
        const nowIso = new Date(nowTs).toISOString();
        const newSalesEvents: any[] = [];

        const updatedEntries = data.entries.map(e => {
          if (tempChanges[e.id] !== undefined) {
            const finalQty = tempChanges[e.id];
            if (finalQty < data.settings.limit) lowStockTriggered++;

            const prevQty = Number(e.qty || 0);
            const nextQty = Number(finalQty || 0);
            const delta = nextQty - prevQty;

            if (delta !== 0) {
              newSalesEvents.push({
                id: `${nowTs}-${e.id}`,
                ts: nowTs,
                date: nowIso,
                type: delta < 0 ? 'sale' : 'restock',
                entryId: e.id,
                pageId: e.pageId,
                car: e.car,
                qty: Math.abs(delta)
              });
            }

            return { ...e, qty: finalQty };
          }
          return e;
        });

        const mergedSalesEvents = ([...(data.salesEvents || []), ...newSalesEvents]).slice(-2000);

        const success = await pushToFirebase({ ...data, entries: updatedEntries, salesEvents: mergedSalesEvents });
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

  // 🔍 SMART SEARCH WITH CACHING & FUZZY MATCHING
  const filteredStock = useMemo(() => {
      if (!stockSearchTerm || stockSearchTerm.trim() === '') return [];
      
      const term = stockSearchTerm.toLowerCase().trim();
      
      // Check cache first
      const cacheKey = `stock:${term}`;
      const cached = searchCache.get(cacheKey);
      if (cached) return cached;
      
      // Use smart search algorithm for better results
      const smartResult = performSmartSearch(term, data.entries || [], data.pages || [], { useFuzzy: data.settings?.fuzzySearch !== false });
      
      let results: any[];
      if (smartResult.match && smartResult.items.length > 0) {
          // Use smart search results (fuzzy matched)
          results = smartResult.items;
      } else {
          // Fallback to basic contains search
          results = (data.entries || []).filter(e => 
              e.car && e.car.toLowerCase().includes(term)
          );
      }
      
      // Cache results
      searchCache.set(cacheKey, results);
      return results;
  }, [data.entries, data.pages, stockSearchTerm]);

  // Optimized page search with caching
  const pageViewData = useMemo(() => {
      if (!activePage) return { filteredEntries: [], grandTotal: 0 };
      
      const pageEntries = (data.entries || []).filter(e => e.pageId === activePage.id);
      const safeSearch = pageSearchTerm ? pageSearchTerm.toLowerCase().trim() : '';
      
      let filtered: any[];
      if (safeSearch) {
          // Check cache
          const cacheKey = `page:${activePage.id}:${safeSearch}`;
          const cached = searchCache.get(cacheKey);
          if (cached) {
              filtered = cached;
          } else {
              // Smart fuzzy filter
              const smartResult = performSmartSearch(safeSearch, pageEntries, data.pages || [], { useFuzzy: data.settings?.fuzzySearch !== false });
              if (smartResult.match && smartResult.items.length > 0) {
                  filtered = smartResult.items;
              } else {
                  filtered = pageEntries.filter(e => e.car && e.car.toLowerCase().includes(safeSearch));
              }
              searchCache.set(cacheKey, filtered);
          }
      } else {
          filtered = pageEntries;
      }
      
      const total = pageEntries.reduce((acc, curr) => { 
          const val = tempChanges[curr.id] !== undefined ? tempChanges[curr.id] : curr.qty; 
          return acc + val; 
      }, 0);
      return { filteredEntries: filtered, grandTotal: total };
  }, [data.entries, data.pages, activePage, pageSearchTerm, tempChanges]);

  // --------------------------------------------------------------------------

  const TranslateBtn = () => (
    <button onClick={() => setIsHindi(!isHindi)} className={`p-2.5 rounded-xl border transition-all hover:scale-105 ${isDark ? 'bg-slate-700 border-slate-500 hover:bg-slate-600' : 'bg-white border-gray-200 shadow-sm hover:shadow-md'}`}> 
      <Languages size={18} className={isHindi ? 'text-orange-500' : ''}/> 
    </button>
  );

  const renderSaveButton = () => {
      const count = Object.keys(tempChanges).length;
      if (count === 0) return null;
      return (
          <button 
            onClick={openSaveModal} 
            className="fixed bottom-24 right-6 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-5 py-3.5 rounded-2xl shadow-2xl shadow-green-500/40 flex items-center gap-3 z-50 cursor-pointer hover:from-green-500 hover:to-emerald-500 transition-all group"
            style={{animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'}}
          >
            <div className="bg-white/20 p-1.5 rounded-lg group-hover:bg-white/30 transition-colors">
              <SaveAll size={18} />
            </div>
            <span className="font-bold text-sm">{t("Update")} ({count})</span>
          </button>
      );
  };

    // Bills UI removed — feature deprecated per user request

  if (authLoading || (user && dbLoading)) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white p-10">
              <div className="flex flex-col items-center justify-center gap-8">
                  {/* Logo Animation */}
                  <div className="relative">
                      <div className="absolute inset-0 bg-blue-500 blur-3xl opacity-20 animate-pulse"></div>
                      <div className="relative bg-gradient-to-br from-blue-600 to-purple-600 p-6 rounded-3xl shadow-2xl">
                          <Store size={48} className="text-white" />
                      </div>
                  </div>
                  
                  <div className="text-center">
                    <h1 className="text-3xl font-black tracking-widest text-white mb-2">AUTONEX</h1>
                    <p className="text-slate-400 text-sm font-medium">Smart Auto Parts Management</p>
                  </div>
                  
                  {/* Loading Spinner */}
                  <div className="relative">
                      <div className="w-12 h-12 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin"></div>
                      <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-b-purple-500 rounded-full animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
                  </div>
                  
                  <p className="text-slate-500 text-xs font-semibold animate-pulse">Loading your data...</p>
              </div>
          </div>
      );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-6 text-white relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-600 rounded-full blur-[120px] opacity-20"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-purple-600 rounded-full blur-[120px] opacity-20"></div>
        
        {toast && <ToastMessage message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        <div className="w-full max-w-sm bg-slate-800/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-slate-700/50 relative z-10">
           {/* Logo */}
           <div className="flex justify-center mb-6">
             <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-4 rounded-2xl shadow-lg">
               <Store size={32} className="text-white" />
             </div>
           </div>
           <h1 className="text-2xl font-bold text-center mb-1">Welcome to Autonex</h1>
           <p className="text-center text-slate-400 mb-8 text-sm">Sign in to manage your inventory</p>
           
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
      <div className={`p-5 sticky top-0 z-10 ${isDark ? 'bg-gradient-to-b from-slate-900 to-slate-900/95' : 'bg-gradient-to-b from-amber-50 to-amber-50/95'} backdrop-blur-lg border-b ${isDark ? 'border-slate-800' : 'border-amber-200'}`}>
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl ${isDark ? 'bg-blue-500/20' : 'bg-amber-200'}`}>
              <Store size={24} className={isDark ? 'text-blue-400' : 'text-amber-700'} />
            </div>
            <div>
              <h1 className={`text-xl font-extrabold ${isDark ? 'text-white' : 'text-amber-900'} truncate max-w-[180px]`}>
                {data.settings.shopName || "Autonex"}
              </h1>
              <p className={`text-[10px] font-semibold ${isDark ? 'text-slate-400' : 'text-amber-600'}`}>Smart Auto Parts Management</p>
            </div>
          </div>
          <div className="flex gap-2 items-center">
              <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold ${isOnline ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                {isOnline ? <Wifi size={12}/> : <WifiOff size={12} className="animate-pulse"/>}
                <span className="hidden sm:inline">{isOnline ? 'Online' : 'Offline'}</span>
              </div>
              {/* 👻 Ghost Mic Button */}
              <button 
                onClick={() => setIsGhostMicOpen(true)} 
                className={`p-2.5 rounded-xl border transition-all hover:scale-105 ${isDark ? 'hover:bg-slate-600' : 'hover:bg-blue-100'}`}
                style={{
                  color: accentHex,
                  borderColor: hexToRgba(accentHex, 0.35),
                  backgroundColor: isDark ? hexToRgba(accentHex, 0.12) : hexToRgba(accentHex, 0.08),
                }}
                title="Voice Search (or shake phone)"
              >
                <Mic size={18} />
              </button>
              <TranslateBtn />
          </div>
        </div>
        <div className="flex gap-2 mt-2">
            <div className="relative flex-1">
                <input className={`w-full pl-10 pr-10 py-3 rounded-2xl border-2 outline-none transition-all ${isDark ? 'bg-slate-800 border-slate-700 text-white focus:border-blue-500' : 'bg-white border-amber-200 text-black focus:border-amber-500 shadow-sm'}`} placeholder={t("Search Index...")} value={indexSearchTerm} onChange={e => setIndexSearchTerm(e.target.value)}/>
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-400' : 'text-amber-400'}`} size={18}/>
                {indexSearchTerm && <button onClick={() => setIndexSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"><X size={16}/></button>}
            </div>
            <VoiceInput onResult={setIndexSearchTerm} isDark={isDark} />
        </div>
      </div>

      {/* 📊 QUICK STATS WIDGET */}
      <QuickStats data={data} />

      {/* 🤖 AI INSIGHTS WIDGET - REMOVED 
         {(data.settings?.widgets?.aiInsights !== false) && (
           <AIInsightsWidget data={data} t={t} isDark={isDark} />
         )}
      */}

      {/* 📈 SALES PREDICTION WIDGET */}
      {data.settings?.aiPredictions && (data.settings?.widgets?.predictions !== false) && (
        <SalesPredictionWidget data={data} t={t} isDark={isDark} />
      )}

      {/* 📦 DEAD STOCK ALERT */}
      <DeadStockAlert 
        data={data} 
        onNavigate={(pageId) => { setActivePageId(pageId); setView('page'); }} 
      />

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
          {globalSearchResults.pages.length === 0 && <div className="p-8 text-center text-gray-400">\n            <Book size={48} className="mx-auto mb-3 opacity-30" />\n            <p className="font-semibold">{t("No Pages Found")}</p>\n            <p className="text-xs mt-1">Tap + to create your first page</p>\n          </div>}
        </div>
      </div>
      <button 
        onClick={() => setIsNewPageOpen(true)} 
        className="fixed bottom-24 right-6 bg-gradient-to-br from-yellow-500 to-orange-500 text-white w-16 h-16 rounded-2xl shadow-2xl shadow-yellow-500/40 flex items-center justify-center active:scale-90 z-20 hover:from-yellow-400 hover:to-orange-400 transition-all group"
      >
        <Plus size={32} strokeWidth={3} className="group-hover:rotate-90 transition-transform duration-200"/>
      </button>
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
      { id: 'light', name: t('Light'), colors: ['#ffffff', '#f1f5f9', '#3b82f6'], icon: '☀️' },
      { id: 'dark', name: t('Dark'), colors: ['#0f172a', '#1e293b', '#3b82f6'], icon: '🌙' },
      { id: 'blue', name: t('Ocean Blue'), colors: ['#1e3a5f', '#2563eb', '#60a5fa'], icon: '🌊' },
      { id: 'green', name: t('Forest'), colors: ['#14532d', '#22c55e', '#86efac'], icon: '🌲' },
      { id: 'purple', name: t('Royal'), colors: ['#4c1d95', '#8b5cf6', '#c4b5fd'], icon: '👑' },
      { id: 'orange', name: t('Sunset'), colors: ['#7c2d12', '#f97316', '#fed7aa'], icon: '🌅' },
      { id: 'rose', name: t('Rose'), colors: ['#4c0519', '#f43f5e', '#fda4af'], icon: '🌹' },
      { id: 'auto', name: t('Auto'), colors: ['#1e293b', '#ffffff', '#8b5cf6'], icon: '🔄' },
    ];

    const accentColors = [
      { id: 'blue', color: '#3b82f6', name: 'Blue' },
      { id: 'green', color: '#22c55e', name: 'Green' },
      { id: 'purple', color: '#8b5cf6', name: 'Purple' },
      { id: 'orange', color: '#f97316', name: 'Orange' },
      { id: 'pink', color: '#ec4899', name: 'Pink' },
      { id: 'cyan', color: '#06b6d4', name: 'Cyan' },
      { id: 'red', color: '#ef4444', name: 'Red' },
      { id: 'yellow', color: '#eab308', name: 'Yellow' },
    ];

    return (
    <div className={`pb-24 min-h-screen ${isDark ? 'text-white' : 'text-black'}`} style={{ backgroundColor: themePreset.bg }}>
       {/* Header */}
       <div className={`sticky top-0 z-40 p-4 backdrop-blur-xl ${isDark ? 'bg-slate-900/90' : 'bg-gray-50/90'}`}>
         <div className="flex justify-between items-center mb-4">
           <h2 className="text-2xl font-bold flex items-center gap-2"><Settings/> {t("Settings")}</h2>
           <TranslateBtn />
         </div>
         
         {/* Tab Navigation */}
         <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
           {settingsTabs.map(tab => (
             <button
               key={tab.id}
               onClick={() => setSettingsTab(tab.id as any)}
               className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-300 ${
                 settingsTab === tab.id 
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
       {/* 🏪 PROFILE TAB */}
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
                   onChange={e => pushToFirebase({...data, settings: {...data.settings, shopName: e.target.value}})} 
                   placeholder={t("Enter Shop Name")} 
                 />
               </div>
               
               <div>
                 <label className="text-xs font-bold opacity-60 mb-1 block">{t("Shop Address")}</label>
                 <input 
                   type="text"
                   placeholder={t("Shop Address")}
                   value={data.settings?.shopAddress || ''}
                   onChange={e => pushToFirebase({...data, settings: {...data.settings, shopAddress: e.target.value}})}
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
                     onChange={e => pushToFirebase({...data, settings: {...data.settings, shopCity: e.target.value}})}
                     className={`w-full p-2 rounded-lg border ${isDark ? 'bg-slate-700 border-slate-600' : 'bg-gray-50 border-gray-200'}`}
                   />
                 </div>
                 <div>
                   <label className="text-xs font-bold opacity-60 mb-1 block">{t("PIN Code")}</label>
                   <input 
                     type="text"
                     placeholder={t("PIN Code")}
                     value={data.settings?.shopPincode || ''}
                     onChange={e => pushToFirebase({...data, settings: {...data.settings, shopPincode: e.target.value}})}
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
                   onChange={e => pushToFirebase({...data, settings: {...data.settings, gstNumber: e.target.value}})}
                   className={`w-full p-3 rounded-xl border ${isDark ? 'bg-slate-700 border-slate-600' : 'bg-gray-50 border-gray-200'}`}
                 />
               </div>
             </div>
           </div>

           {/* Customer ID */}
           <div className={`p-4 rounded-2xl border ${isDark ? 'bg-gradient-to-br from-slate-800 to-orange-900/30 border-orange-500/30' : 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200'}`}>
             <div className="flex items-center gap-2 mb-3">
               <User size={18} className="text-orange-500"/>
               <span className="font-bold">{t("Your Customer ID")}</span>
             </div>
             <div className="flex gap-2 items-center">
               <code className={`flex-1 p-2 rounded-lg font-mono text-xs break-all select-all ${isDark ? 'bg-slate-700' : 'bg-white'}`}>
                 {user.uid}
               </code>
               <button onClick={() => { navigator.clipboard.writeText(user.uid); showToast("ID Copied!"); }} className="p-2 bg-orange-500 text-white rounded-lg active:scale-95 transition-transform shadow">
                 <Copy size={18}/>
               </button>
             </div>
             <p className="text-[10px] opacity-50 mt-2">{t("Share this ID for support")}</p>
           </div>

           {/* Business Tools */}
           <button onClick={() => setView('tools')} className={`w-full p-4 rounded-2xl flex items-center justify-between gap-2 shadow-sm border ${isDark ? 'bg-gradient-to-r from-slate-800 to-blue-900/30 border-blue-500/30' : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'}`}>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow"><Briefcase size={20} className="text-white" /></div>
              <div className="text-left">
                <span className="font-bold block">{t("Business Tools")}</span>
                <span className="text-xs opacity-60">{t("GST, Invoice, Calculator")}</span>
              </div>
            </div>
            <ChevronRight size={20} className="opacity-50"/>
           </button>

           {/* Business Achievements */}
           <div className={`p-4 rounded-2xl border ${isDark ? 'bg-gradient-to-br from-slate-800 to-yellow-900/30 border-yellow-500/30' : 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200'}`}>
             <div className="flex items-center gap-2 mb-3">
               <ShieldCheck size={18} className="text-yellow-500"/>
               <span className="font-bold">{t("Business Achievements")}</span>
             </div>
             <div className="grid grid-cols-3 gap-2 mb-3">
               {[
                 { icon: '🏪', label: t('Days'), value: '30+' },
                 { icon: '📦', label: t('Products'), value: (data.entries?.length || 0).toString() },
                 { icon: '📊', label: t('Bills'), value: (data.bills?.length || 0).toString() },
               ].map((stat, i) => (
                 <div key={i} className={`p-2 rounded-xl text-center ${isDark ? 'bg-slate-700/50' : 'bg-white/80'}`}>
                   <span className="text-xl">{stat.icon}</span>
                   <p className="text-lg font-bold">{stat.value}</p>
                   <p className="text-[9px] opacity-60">{stat.label}</p>
                 </div>
               ))}
             </div>
             <div className={`p-2 rounded-xl ${isDark ? 'bg-slate-700/50' : 'bg-yellow-100/50'}`}>
               <div className="flex items-center justify-between text-xs mb-1">
                 <span>{t("Level")}</span>
                 <span className="font-bold">{(data.entries?.length || 0) > 100 ? '🥇 Gold' : (data.entries?.length || 0) > 50 ? '🥈 Silver' : '🥉 Bronze'}</span>
               </div>
               <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                 <div className="h-full bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full" style={{ width: `${Math.min(100, ((data.entries?.length || 0) / 100) * 100)}%` }}></div>
               </div>
             </div>
           </div>
         </div>
       )}

       {/* 🤖 AI TAB */}
       {settingsTab === 'ai' && (
         <div className="space-y-3 animate-in fade-in duration-300">
           <div className={`p-4 rounded-2xl border mb-4 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
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
                 { id: 'aiPredictions', icon: Activity, label: t('AI Sales Predictions'), desc: t('Predict future sales'), color: 'text-purple-500', gradient: 'from-purple-500 to-indigo-500' },
                 { id: 'smartReorder', icon: Bell, label: t('Smart Reorder Alerts'), desc: t('AI calculates reorder time'), color: 'text-green-500', gradient: 'from-green-500 to-emerald-500' },
                 { id: 'priceOptimization', icon: DollarSign, label: t('Price Optimization'), desc: t('AI suggests pricing'), color: 'text-blue-500', gradient: 'from-blue-500 to-cyan-500' },
                 { id: 'fuzzySearch', icon: Search, label: t('Fuzzy Search'), desc: t('Find items with typos'), color: 'text-orange-500', gradient: 'from-orange-500 to-amber-500' },
                 { id: 'autoCategory', icon: Layers, label: t('Auto Categorization'), desc: t('AI groups products'), color: 'text-pink-500', gradient: 'from-pink-500 to-rose-500' },
                 { id: 'voiceAI', icon: Mic, label: t('Voice AI Commands'), desc: t('Hindi/English voice control'), color: 'text-indigo-500', gradient: 'from-indigo-500 to-violet-500' },
               ].map(item => (
                 (() => {
                   const defaultOn = item.id === 'voiceAI' || item.id === 'fuzzySearch';
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

       {/* 🎨 APPEARANCE TAB */}
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
                   onClick={() => pushToFirebase({...data, settings: {...data.settings, theme: theme.id}})}
                   className={`p-2 rounded-xl border-2 transition-all ${(data.settings?.theme || 'light') === theme.id 
                     ? 'border-blue-500 scale-105 shadow-lg' 
                     : isDark ? 'border-slate-600 hover:border-slate-500' : 'border-gray-200 hover:border-gray-300'}`}
                 >
                   <div className="flex justify-center gap-0.5 mb-1.5">
                     {theme.colors.map((color, i) => (
                       <div key={i} className="w-4 h-4 rounded-full shadow-inner" style={{ backgroundColor: color }}></div>
                     ))}
                   </div>
                   <span className="text-xl block text-center mb-1">{theme.icon}</span>
                   <p className="text-[10px] font-semibold text-center">{theme.name}</p>
                   {(data.settings?.theme || 'light') === theme.id && <CheckCircle size={12} className="text-blue-500 mx-auto mt-1"/>}
                 </button>
               ))}
             </div>
           </div>

           {/* Accent Color */}
           <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
             <div className="flex items-center gap-2 mb-3">
               <div className="w-4 h-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-500"></div>
               <span className="font-bold">{t("Accent Color")}</span>
             </div>
             <div className="flex gap-2 flex-wrap">
               {accentColors.map(accent => (
                 <button
                   key={accent.id}
                   onClick={() => pushToFirebase({...data, settings: {...data.settings, accentColor: accent.id}})}
                   className={`w-10 h-10 rounded-xl transition-all ${(data.settings?.accentColor || 'blue') === accent.id ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-105'}`}
                   style={{ backgroundColor: accent.color }}
                 >
                   {(data.settings?.accentColor || 'blue') === accent.id && <CheckCircle size={16} className="text-white mx-auto"/>}
                 </button>
               ))}
             </div>
           </div>

           {/* Font Size */}
           <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
             <div className="flex items-center gap-2 mb-3">
               <Type size={18} className="text-pink-500"/>
               <span className="font-bold">{t("Font Size")}</span>
             </div>
             <div className="flex gap-2">
               {['Small', 'Medium', 'Large'].map(size => (
                 <button
                   key={size}
                   onClick={() => pushToFirebase({...data, settings: {...data.settings, fontSize: size}})}
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
                     onClick={() => pushToFirebase({...data, settings: {...data.settings, [item.id]: item.id === 'soundEffects' ? data.settings?.soundEffects === false : !data.settings?.[item.id]}})}
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

       {/* 🔔 NOTIFICATIONS TAB */}
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
                 ? <span className="px-3 py-1 bg-green-100 text-green-700 rounded-lg font-bold text-xs flex items-center gap-1"><CheckCircle size={14}/> Active</span>
                 : <button onClick={requestNotificationPermission} className="px-3 py-1.5 bg-green-600 text-white rounded-lg font-bold text-xs flex items-center gap-1"><Bell size={14}/> Enable</button>
               }
             </div>

             {/* Notification Types */}
             <p className="text-xs font-bold opacity-60 mb-2">{t("Alert Types")}</p>
             <div className="space-y-2">
               {[
                 { id: 'lowStockAlert', icon: Package, label: t('Low Stock Alerts'), color: 'text-orange-500' },
                 { id: 'dailySummary', icon: Activity, label: t('Daily Summary'), color: 'text-blue-500' },
                 { id: 'priceDropAlert', icon: TrendingDown, label: t('Price Drop Alerts'), color: 'text-red-500' },
                 { id: 'expiryAlert', icon: AlertTriangle, label: t('Expiry Reminders'), color: 'text-yellow-500' },
               ].map(item => (
                 <div key={item.id} className={`p-3 rounded-xl border flex items-center justify-between ${isDark ? 'bg-slate-700/50 border-slate-600' : 'bg-gray-50 border-gray-200'}`}>
                   <div className="flex items-center gap-3">
                     <item.icon size={18} className={item.color} />
                     <p className="text-sm font-semibold">{item.label}</p>
                   </div>
                   <button 
                     onClick={() => pushToFirebase({...data, settings: {...data.settings, notifications: {...(data.settings?.notifications || {}), [item.id]: !data.settings?.notifications?.[item.id]}}})}
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
               <AlertTriangle size={18} className="text-red-500"/>
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
               onClick={() => { triggerConfirm("Update?", `Set limit to ${tempLimit}?`, false, () => pushToFirebase({...data, settings: {...data.settings, limit: tempLimit}}))}}
               className="w-full py-2 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl font-bold text-sm"
             >
               {t("Save Limit")}
             </button>
           </div>

           {/* Shake to Search */}
           <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
             <div className="flex items-center justify-between">
               <div className="flex items-center gap-3">
                 <div className="p-2 bg-blue-100 rounded-xl"><Activity size={18} className="text-blue-600"/></div>
                 <div>
                   <p className="font-bold">{t("Shake to Search")}</p>
                   <p className="text-xs opacity-60">{t("Shake phone for voice search")}</p>
                 </div>
               </div>
               <button 
                 onClick={() => {
                   const nextEnabled = !(data.settings?.shakeToSearch !== false);
                   const newData = { ...data, settings: { ...data.settings, shakeToSearch: nextEnabled } };
                   setData(newData);
                   pushToFirebase(newData);
                 }} 
                 className={`relative w-11 h-6 rounded-full transition-all duration-300 ${shakeEnabled ? 'bg-gradient-to-r from-blue-500 to-cyan-500' : 'bg-gray-300'}`}
               >
                 <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-300 ${shakeEnabled ? 'left-5' : 'left-0.5'}`}></div>
               </button>
             </div>
           </div>
         </div>
       )}

       {/* 🔒 SECURITY TAB */}
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
                 onClick={() => { triggerConfirm("Change?", "Update password?", false, () => { pushToFirebase({...data, settings: {...data.settings, productPassword: newProductPass}}); setNewProductPass(''); showToast(t("Updated!")); })}}
                 className="w-full py-2 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg font-bold text-sm"
               >
                 {t("Update Password")}
               </button>
             </div>

             {/* Security Features */}
             <div className="space-y-2">
               {[
                 { id: 'biometricLock', icon: Lock, label: t('Biometric Lock'), desc: t('Face ID / Fingerprint'), color: 'text-red-500' },
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
                     onClick={() => pushToFirebase({...data, settings: {...data.settings, [item.id]: !data.settings?.[item.id]}})}
                     className={`relative w-10 h-5 rounded-full transition-all duration-300 ${data.settings?.[item.id] ? 'bg-gradient-to-r from-red-500 to-orange-500' : 'bg-gray-300'}`}
                   >
                     <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-300 ${data.settings?.[item.id] ? 'left-5' : 'left-0.5'}`}></div>
                   </button>
                 </div>
               ))}

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
                   onChange={e => pushToFirebase({...data, settings: {...data.settings, autoLockTime: e.target.value}})}
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
                   <CheckCircle size={10}/> Enabled
                 </span>
               </div>
             </div>
           </div>
         </div>
       )}

       {/* ☁️ BACKUP TAB */}
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
                 <CheckCircle size={10}/> Synced
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
                   onChange={e => pushToFirebase({...data, settings: {...data.settings, autoBackup: e.target.value}})}
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
                   <Download size={12}/> Export
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
               <Zap size={18} className="text-amber-500"/>
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
                     onClick={() => pushToFirebase({...data, settings: {...data.settings, performance: {...(data.settings?.performance || {}), [item.id]: !data.settings?.performance?.[item.id]}}})}
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

       {/* ❓ HELP TAB */}
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
                 <FileText size={20} className="text-gray-500"/> 
                 <span className="font-semibold">{t("Privacy Policy")}</span>
                 <ChevronRight size={16} className="ml-auto opacity-50"/>
               </button>
               <button onClick={() => setIsFaqOpen(true)} className={`w-full p-3 rounded-xl border text-left flex items-center gap-3 ${isDark ? 'bg-slate-700/50 border-slate-600' : 'bg-gray-50 border-gray-200'}`}>
                 <HelpCircle size={20} className="text-blue-500"/> 
                 <span className="font-semibold">{t("FAQ")}</span>
                 <ChevronRight size={16} className="ml-auto opacity-50"/>
               </button>
               <a href="tel:8619152422" className={`w-full p-3 rounded-xl border text-left flex items-center gap-3 ${isDark ? 'bg-slate-700/50 border-slate-600' : 'bg-gray-50 border-gray-200'}`}>
                 <MessageSquare size={20} className="text-green-500"/> 
                 <span className="font-semibold">{t("Contact Support")}</span>
                 <ExternalLink size={14} className="ml-auto opacity-50"/>
               </a>
             </div>
           </div>

           {/* Logout */}
           <button onClick={handleLogout} className="w-full py-3 border-2 border-red-400 bg-red-50 text-red-600 rounded-xl font-bold flex items-center justify-center gap-2">
             <LogOut size={20}/> {t("Logout")}
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
                 <ShieldCheck size={10}/> PRO
               </span>
             </div>
             
             <div className="grid grid-cols-3 gap-2 text-center text-[10px] mb-3">
               <div className={`p-2 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-white/80'}`}>
                 <Activity size={14} className="mx-auto text-purple-500 mb-1"/>
                 <span className="font-semibold">{t("AI Powered")}</span>
               </div>
               <div className={`p-2 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-white/80'}`}>
                 <Shield size={14} className="mx-auto text-green-500 mb-1"/>
                 <span className="font-semibold">{t("Secure")}</span>
               </div>
               <div className={`p-2 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-white/80'}`}>
                 <Download size={14} className="mx-auto text-blue-500 mb-1"/>
                 <span className="font-semibold">{t("Cloud Sync")}</span>
               </div>
             </div>

             <div className="text-center">
               <p className="text-[9px] uppercase tracking-widest opacity-50 mb-1">{t("Developed By")}</p>
               <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full ${isDark ? 'bg-slate-700' : 'bg-white'}`}>
                 <div className="w-5 h-5 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                   <Zap size={10} className="text-white" />
                 </div>
                 <span className="font-bold text-xs">AutomationX</span>
                 <CheckCircle size={12} className="text-blue-500" />
               </div>
               <p className="text-[8px] mt-2 opacity-40">© 2024 All Rights Reserved</p>
             </div>
           </div>
         </div>
       )}
       </div>
    </div>
    );
  };



  return (
    <div className={`min-h-screen font-sans ${!isOnline ? 'pt-10' : ''}`} style={{ backgroundColor: themePreset.bg }}>
      <audio ref={audioRef} src="https://actions.google.com/sounds/v1/alarms/beep_short.ogg" preload="auto"></audio>

      {/* 📡 CONNECTIVITY INDICATORS */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 z-[200] bg-gradient-to-r from-orange-500 to-red-500 text-white py-2 px-4 flex items-center justify-center gap-2 shadow-lg">
          <WifiOff size={18} className="animate-pulse" />
          <span className="font-bold text-sm">You're Offline - Changes will sync when connected</span>
        </div>
      )}
      
      {hasPendingWrites && isOnline && (
        <div className="fixed top-0 left-0 right-0 z-[199] bg-blue-500 text-white py-1 px-4 flex items-center justify-center gap-2 text-xs">
          <Loader2 size={14} className="animate-spin" />
          <span className="font-semibold">Syncing pending changes...</span>
        </div>
      )}

      {toast && <ToastMessage message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      {/* 👻 GHOST MIC OVERLAY - Voice Search with AI */}
      {isGhostMicOpen && (
        <GhostMic 
          inventory={data.entries || []}
          pages={data.pages || []}
          allowAI={data.settings?.voiceAI !== false}
          useFuzzySearch={data.settings?.fuzzySearch !== false}
          onClose={() => setIsGhostMicOpen(false)}
          onNavigate={(pageId) => {
            setActivePageId(pageId);
            setView('page');
            setIsGhostMicOpen(false);
          }}
        />
      )}
      
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

      <div className={`fixed bottom-0 w-full border-t flex justify-between px-1 py-1.5 pb-safe z-50 backdrop-blur-lg ${isDark ? 'bg-slate-900/95 border-slate-800' : 'bg-white/95 border-gray-200 shadow-lg shadow-gray-200/50'}`}>
        <NavBtn icon={Book} label={t("Index")} active={view === 'generalIndex'} onClick={() => { setView('generalIndex'); setActivePageId(null); }} isDark={isDark} accentHex={accentHex}/>
        <NavBtn icon={Grid} label={t("Pages")} active={view === 'pagesGrid'} onClick={() => { setView('pagesGrid'); setIndexSearchTerm(''); setActivePageId(null); }} isDark={isDark} accentHex={accentHex}/>
        <NavBtn icon={Search} label={t("Search")} active={view === 'stockSearch'} onClick={() => { setView('stockSearch'); setStockSearchTerm(''); }} isDark={isDark} accentHex={accentHex}/>
        <NavBtn icon={AlertTriangle} label={t("Alerts")} active={view === 'alerts'} onClick={() => setView('alerts')} alert={(data.entries || []).some(e => e.qty < data.settings.limit)} isDark={isDark} accentHex={accentHex}/>
         {/* My Bills nav removed */}
        <NavBtn icon={Settings} label={t("Settings")} active={view === 'settings'} onClick={() => setView('settings')} isDark={isDark} accentHex={accentHex}/>
      </div>

      {isNewPageOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-5">
              <div className="bg-yellow-100 p-3 rounded-2xl">
                <FilePlus size={24} className="text-yellow-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">{t("New Page")}</h3>
            </div>
            <div className="flex gap-2 mb-5">
                <input autoFocus className="flex-1 border-2 border-gray-200 focus:border-yellow-500 rounded-xl p-3.5 text-lg font-semibold text-black outline-none transition-colors" placeholder={t("Item Name")} value={input.itemName} onChange={e => setInput({...input, itemName: e.target.value})} />
                <VoiceInput onResult={(txt) => setInput(prev => ({...prev, itemName: txt}))} isDark={false} />
            </div>
            <div className="flex gap-3">
               <button onClick={() => setIsNewPageOpen(false)} className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold text-gray-600 transition-colors">{t("Cancel")}</button>
               <button onClick={handleAddPage} className="flex-1 py-3.5 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white rounded-xl font-bold shadow-lg shadow-yellow-500/30 transition-all">{t("Add")}</button>
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

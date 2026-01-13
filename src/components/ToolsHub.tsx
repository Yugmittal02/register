
import React, { useState, useRef, useEffect } from 'react';
import {
    Calculator, FileText, Percent, DollarSign, RefreshCcw, Activity,
    CreditCard, StickyNote, Languages, Share2, Zap, X, Copy, Plus, Minus,
    Trash2, Clock, Search, Bold, Italic, Underline, Highlighter, PenTool,
    Circle as CircleIcon, Eraser, ArrowLeft, Pin, Phone, Store, Download, Package
} from 'lucide-react';
import { translateWithGoogle, transliterateWithGoogle, convertToHindiFallback } from '../lib/translation';
import VoiceInput from './VoiceInput';

const ToolsHub = ({ onBack, t, isDark, initialTool = null, pinnedTools, onTogglePin, shopDetails }: any) => {
    const [activeTool, setActiveTool] = useState(initialTool);
    const [invoiceNumber] = useState(() => Date.now().toString().slice(-4));
    const [gstInput, setGstInput] = useState({ price: '', rate: 18, isReverse: false });
    const [marginInput, setMarginInput] = useState({ cost: '', sell: '', discount: 0, mode: 'profit', markup: '' });
    const [notesView, setNotesView] = useState('list');
    const [notes, setNotes] = useState<any[]>([]);


    const [convInput, setConvInput] = useState({ val: '', type: 'kgToTon' });
    const [transInput, setTransInput] = useState('');
    const [transOutput, setTransOutput] = useState('');
    const [transLoading, setTransLoading] = useState(false);
    const [transLang, setTransLang] = useState({ from: 'en', to: 'hi' });
    const [transHistory, setTransHistory] = useState<any[]>([]);

    // ?? INVOICE GENERATOR STATE (ENHANCED)
    const [invCust, setInvCust] = useState({ name: '', phone: '', address: '', gstNo: '' });
    const [invItems, setInvItems] = useState<any[]>([]);
    const [invCurrentItem, setInvCurrentItem] = useState({ name: '', qty: 1, rate: 0, gst: 18, unit: 'pcs', hsn: '' });
    const [invSettings, setInvSettings] = useState({
        showGst: true,
        invoiceType: 'retail', // retail, gst, estimate
        paymentMode: 'cash',
        notes: '',
        discount: 0,
        discountType: 'flat' // flat, percent
    });

    // ?? EMI CALCULATOR STATE
    const [emiInput, setEmiInput] = useState({ principal: '', rate: '', tenure: '', tenureType: 'months' });

    // ?? NOTEPAD STATE (RICH TEXT UPGRADE)
    const [currentNote, setCurrentNote] = useState<{ id: any, title: string, body: string, date: string, sketch: any, category: string }>({ id: null, title: '', body: '', date: '', sketch: null, category: 'general' });
    const [noteSearch, setNoteSearch] = useState('');
    const [noteMode, setNoteMode] = useState('text');
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const contentEditableRef = useRef<HTMLDivElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [brushType, setBrushType] = useState('pencil');
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });

    // ?? STOCK VALUE CALCULATOR
    const [stockCalc, setStockCalc] = useState<{ items: any[], newItem: any }>({ items: [], newItem: { name: '', qty: 0, rate: 0 } });

    // ?? BUSINESS CALCULATOR STATE (Expression-based)
    const [calcExpression, setCalcExpression] = useState('');
    const [calcResult, setCalcResult] = useState('0');
    const [calcHistory, setCalcHistory] = useState<string[]>([]);

    useEffect(() => {
        localStorage.setItem('proNotes', JSON.stringify(notes));
    }, [notes]);

    const tools = [
        { id: 'basicCalc', name: 'Business Calc', icon: <Calculator size={24} />, color: 'bg-teal-100 text-teal-600', desc: 'Quick Calculator' },
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
        { code: 'en', name: 'English' }, { code: 'hi', name: 'Hindi' }, { code: 'gu', name: 'Gujarati' },
        { code: 'mr', name: 'Marathi' }, { code: 'ta', name: 'Tamil' }, { code: 'te', name: 'Telugu' },
        { code: 'bn', name: 'Bengali' }, { code: 'pa', name: 'Punjabi' }, { code: 'ur', name: 'Urdu' }, { code: 'ar', name: 'Arabic' },
    ];

    const handleTranslate = async () => {
        if (!transInput.trim()) return;
        setTransLoading(true);
        try {
            let result = await translateWithGoogle(transInput, transLang.from, transLang.to);
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

    const addInvItem = () => {
        if (!invCurrentItem.name || !invCurrentItem.rate) return;
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

    const deleteInvItem = (id: any) => setInvItems(invItems.filter(i => i.id !== id));

    const calculateBillTotals = () => {
        const subtotal = invItems.reduce((acc, curr) => acc + curr.baseTotal, 0);
        const totalGst = invItems.reduce((acc, curr) => acc + curr.gstAmt, 0);
        const discountAmt = invSettings.discountType === 'percent'
            ? (subtotal * invSettings.discount / 100)
            : invSettings.discount;
        const grandTotal = subtotal + totalGst - discountAmt;
        return { subtotal, totalGst, discountAmt, grandTotal };
    };

    const shareInvoiceImage = async () => {
        try {
            // Simple share fallback for now
            alert("Share functionality requires device capabilities.");
        } catch (e) { console.error(e); }
    };

    const saveCurrentNote = () => {
        let bodyContent = currentNote.body;
        if (noteMode === 'text' && contentEditableRef.current) {
            bodyContent = contentEditableRef.current.innerHTML;
        }
        if (!currentNote.title && !bodyContent && !currentNote.sketch) { setNotesView('list'); return; }

        let sketchData = currentNote.sketch;
        if (canvasRef.current && noteMode === 'draw') {
            sketchData = canvasRef.current.toDataURL();
        }
        const finalNote = { ...currentNote, body: bodyContent, date: new Date().toLocaleString(), sketch: sketchData };
        if (currentNote.id) {
            setNotes(notes.map(n => n.id === currentNote.id ? finalNote : n));
        } else {
            setNotes([{ ...finalNote, id: Date.now() }, ...notes]);
        }
        setNotesView('list');
        setNoteMode('text');
    };

    const deleteNote = (id: any) => {
        if (window.confirm("Delete note?")) {
            setNotes(notes.filter(n => n.id !== id));
            if (currentNote.id === id) setNotesView('list');
        }
    };

    useEffect(() => {
        if (noteMode === 'draw' && canvasRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                if (currentNote.sketch) {
                    const img = new Image();
                    img.src = currentNote.sketch;
                    img.onload = () => ctx.drawImage(img, 0, 0);
                } else {
                    ctx.fillStyle = "#ffffff";
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                }
            }
        }
    }, [noteMode, currentNote.sketch]);

    const startDrawing = (e: any) => {
        setIsDrawing(true);
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
        const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
        setStartPos({ x, y });
        const ctx = canvas.getContext('2d');
        if (ctx) { ctx.beginPath(); ctx.moveTo(x, y); }
    };

    const draw = (e: any) => {
        if (!isDrawing || !canvasRef.current) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
        const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        if (brushType === 'pencil') {
            ctx.strokeStyle = '#000000'; ctx.lineWidth = 2;
        } else if (brushType === 'highlight') {
            ctx.strokeStyle = 'yellow'; ctx.lineWidth = 15; ctx.globalAlpha = 0.3;
        } else if (brushType === 'eraser') {
            ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 20; ctx.globalAlpha = 1;
        }
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.globalAlpha = 1;
    };

    const stopDrawing = () => setIsDrawing(false);
    const execFormat = (command: string, value: any = null) => {
        document.execCommand(command, false, value);
        if (contentEditableRef.current) contentEditableRef.current.focus();
    };


    const renderToolContent = () => {
        const commonInputClass = `w-full p-3 rounded-xl border font-bold text-lg mb-4 ${isDark ? 'bg-slate-800 border-slate-600 text-white' : 'bg-gray-50 border-gray-300 text-black'}`;
        const cardClass = `p-6 rounded-2xl shadow-lg border h-full flex flex-col ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`;
        const totals = calculateBillTotals();

        switch (activeTool) {
            case 'basicCalc': {
                const handleCalcInput = (value: string) => {
                    if (calcResult !== '0' && calcResult !== 'Error' && !isNaN(Number(value))) {
                        if (calcExpression.includes('=')) {
                            setCalcExpression(value);
                            setCalcResult('0');
                            return;
                        }
                    }
                    const newExp = calcExpression.includes('=') ? value : calcExpression + value;
                    setCalcExpression(newExp);
                };

                const handleOperator = (op: string) => {
                    if (calcExpression === '' && op !== '-') return;
                    const lastChar = calcExpression.slice(-1);
                    if (['+', '-', '*', '/', '.'].includes(lastChar)) {
                        setCalcExpression(calcExpression.slice(0, -1) + op);
                    } else {
                        setCalcExpression(calcExpression + op);
                    }
                };

                const calculateResult = () => {
                    try {
                        if (!calcExpression || calcExpression === '') return;
                        const sanitized = calcExpression.replace(/[^0-9+\-*/.() ]/g, '');
                        if (!sanitized) return;
                        const result = new Function('return ' + sanitized)();
                        const finalResult = isNaN(result) || !isFinite(result) ? 'Error' : Number(result.toFixed(6)).toString();
                        setCalcResult(finalResult);
                        const historyEntry = `${calcExpression} = ${finalResult}`;
                        setCalcHistory(prev => [historyEntry, ...prev.slice(0, 9)]);
                        setCalcExpression(calcExpression + ' = ' + finalResult);
                    } catch (e) {
                        setCalcResult('Error');
                    }
                };

                const clearCalc = () => {
                    setCalcExpression('');
                    setCalcResult('0');
                };

                const backspace = () => {
                    if (calcExpression.includes('=')) {
                        clearCalc();
                    } else {
                        setCalcExpression(calcExpression.slice(0, -1));
                    }
                };

                const buttons = [
                    { label: 'C', action: clearCalc, color: 'bg-red-500 text-white' },
                    { label: '(', action: () => handleCalcInput('('), color: 'bg-gray-200' },
                    { label: ')', action: () => handleCalcInput(')'), color: 'bg-gray-200' },
                    { label: '÷', action: () => handleOperator('/'), color: 'bg-teal-500 text-white' },
                    { label: '7', action: () => handleCalcInput('7'), color: 'bg-gray-100' },
                    { label: '8', action: () => handleCalcInput('8'), color: 'bg-gray-100' },
                    { label: '9', action: () => handleCalcInput('9'), color: 'bg-gray-100' },
                    { label: '×', action: () => handleOperator('*'), color: 'bg-teal-500 text-white' },
                    { label: '4', action: () => handleCalcInput('4'), color: 'bg-gray-100' },
                    { label: '5', action: () => handleCalcInput('5'), color: 'bg-gray-100' },
                    { label: '6', action: () => handleCalcInput('6'), color: 'bg-gray-100' },
                    { label: '-', action: () => handleOperator('-'), color: 'bg-teal-500 text-white' },
                    { label: '1', action: () => handleCalcInput('1'), color: 'bg-gray-100' },
                    { label: '2', action: () => handleCalcInput('2'), color: 'bg-gray-100' },
                    { label: '3', action: () => handleCalcInput('3'), color: 'bg-gray-100' },
                    { label: '+', action: () => handleOperator('+'), color: 'bg-teal-500 text-white' },
                    { label: '0', action: () => handleCalcInput('0'), color: 'bg-gray-100 col-span-1' },
                    { label: '.', action: () => handleCalcInput('.'), color: 'bg-gray-100' },
                    { label: '⌫', action: backspace, color: 'bg-orange-400 text-white' },
                    { label: '=', action: calculateResult, color: 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white' },
                ];

                return (
                    <div className={cardClass}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-xl flex items-center gap-2">
                                <Calculator className="text-teal-500" size={24} />
                                Business Calculator
                            </h3>
                        </div>
                        <div className={`p-4 rounded-2xl mb-4 ${isDark ? 'bg-slate-900' : 'bg-gradient-to-br from-teal-50 to-emerald-50'} border-2 border-teal-200`}>
                            <div className={`text-right mb-2 min-h-[28px] text-sm font-mono overflow-x-auto whitespace-nowrap ${isDark ? 'text-teal-300' : 'text-teal-600'}`}>
                                {calcExpression || '0'}
                            </div>
                            <div className={`text-right text-4xl font-black overflow-x-auto ${calcResult === 'Error' ? 'text-red-500' : isDark ? 'text-white' : 'text-gray-800'}`}>
                                {calcResult}
                            </div>
                        </div>
                        <div className="grid grid-cols-4 gap-2 flex-1">
                            {buttons.map((btn, idx) => (
                                <button
                                    key={idx}
                                    onClick={btn.action}
                                    className={`p-4 rounded-xl font-bold text-xl transition-all active:scale-95 hover:opacity-80 shadow-md ${btn.color} ${isDark && btn.color.includes('gray') ? '!bg-slate-700 !text-white' : ''}`}
                                >
                                    {btn.label}
                                </button>
                            ))}
                        </div>
                        {calcHistory.length > 0 && (
                            <div className="mt-4 border-t pt-3">
                                <p className={`text-xs font-bold mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>📜 Recent Calculations</p>
                                <div className="space-y-1 max-h-24 overflow-y-auto">
                                    {calcHistory.slice(0, 5).map((entry, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() => {
                                                const parts = entry.split(' = ');
                                                if (parts[1]) setCalcExpression(parts[1]);
                                            }}
                                            className={`p-2 rounded-lg text-xs cursor-pointer transition-all ${isDark ? 'bg-slate-700 hover:bg-slate-600' : 'bg-gray-50 hover:bg-gray-100'}`}
                                        >
                                            <span className="font-mono">{entry}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                );
            }
            case 'invoice':
                return (
                    <div className={`${cardClass} overflow-y-auto`}>
                        <div className="flex justify-between items-center mb-4 border-b pb-3">
                            <div className="flex items-center gap-2">
                                <FileText className="text-indigo-500" size={24} />
                                <div>
                                    <h3 className="font-bold text-lg">Invoice Pro</h3>
                                    <p className="text-xs text-gray-500">#{invoiceNumber}</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={shareInvoiceImage} className="p-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl flex items-center gap-1 text-sm font-bold shadow-lg hover:shadow-xl transition-all">
                                    <Share2 size={16} /> Share
                                </button>
                            </div>
                        </div>
                        <div className="flex gap-2 mb-4 bg-indigo-50 p-1.5 rounded-xl">
                            {[
                                { id: 'retail', label: '🛍️ Retail', desc: 'Simple Bill' },
                                { id: 'gst', label: '📋 GST Invoice', desc: 'With Tax' },
                                { id: 'estimate', label: '📄 Estimate', desc: 'Quotation' }
                            ].map(type => (
                                <button
                                    key={type.id}
                                    onClick={() => setInvSettings({ ...invSettings, invoiceType: type.id, showGst: type.id === 'gst' })}
                                    className={`flex-1 py-2 px-1 rounded-lg text-xs font-bold transition-all ${invSettings.invoiceType === type.id
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
                                <div className="text-center border-b-2 border-indigo-600 pb-2 mb-3">
                                    <h2 className="text-lg font-black uppercase tracking-wider text-indigo-700">{shopDetails.shopName || "My Shop"}</h2>
                                    <p className="text-[8px] uppercase text-gray-500 tracking-widest">
                                        {invSettings.invoiceType === 'gst' ? 'TAX INVOICE' : invSettings.invoiceType === 'estimate' ? 'ESTIMATE / QUOTATION' : 'RETAIL INVOICE'}
                                    </p>
                                </div>
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

                        <div className="grid grid-cols-2 gap-2 mb-3">
                            <input className="p-2.5 border-2 rounded-xl text-sm font-medium focus:border-indigo-400 outline-none" placeholder="Customer Name" value={invCust.name} onChange={e => setInvCust({ ...invCust, name: e.target.value })} />
                            <input className="p-2.5 border-2 rounded-xl text-sm focus:border-indigo-400 outline-none" placeholder="Mobile Number" value={invCust.phone} onChange={e => setInvCust({ ...invCust, phone: e.target.value })} />
                        </div>
                        {invSettings.invoiceType === 'gst' && (
                            <input className="w-full p-2.5 border-2 rounded-xl text-sm mb-3 focus:border-indigo-400 outline-none" placeholder="Customer GSTIN (Optional)" value={invCust.gstNo} onChange={e => setInvCust({ ...invCust, gstNo: e.target.value })} />
                        )}

                        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-4 rounded-xl border-2 border-indigo-100 mb-4">
                            <p className="text-xs font-bold text-indigo-600 mb-2">ADD ITEM</p>
                            <div className="grid grid-cols-2 gap-2 mb-2">
                                <input className="col-span-2 p-2.5 border-2 rounded-xl font-bold text-sm" placeholder="Item Name *" value={invCurrentItem.name} onChange={e => setInvCurrentItem({ ...invCurrentItem, name: e.target.value })} />
                                {invSettings.showGst && (
                                    <input className="p-2 border-2 rounded-lg text-sm" placeholder="HSN Code" value={invCurrentItem.hsn} onChange={e => setInvCurrentItem({ ...invCurrentItem, hsn: e.target.value })} />
                                )}
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                                <input type="number" className="p-2 border-2 rounded-lg text-sm font-bold" placeholder="Qty" value={invCurrentItem.qty} onChange={e => setInvCurrentItem({ ...invCurrentItem, qty: parseInt(e.target.value) || 1 })} />
                                <input type="number" className="p-2 border-2 rounded-lg text-sm" placeholder="Rate ₹" value={invCurrentItem.rate || ''} onChange={e => setInvCurrentItem({ ...invCurrentItem, rate: parseFloat(e.target.value) })} />
                                {invSettings.showGst && (
                                    <select className="p-2 border-2 rounded-lg text-sm" value={invCurrentItem.gst} onChange={e => setInvCurrentItem({ ...invCurrentItem, gst: parseInt(e.target.value) })}>
                                        <option value={0}>0%</option>
                                        <option value={5}>5%</option>
                                        <option value={12}>12%</option>
                                        <option value={18}>18%</option>
                                        <option value={28}>28%</option>
                                    </select>
                                )}
                                <button onClick={addInvItem} className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold flex items-center justify-center shadow-lg hover:shadow-xl transition-all">
                                    <Plus size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mb-3">
                            <select
                                className="p-2 border-2 rounded-xl text-sm"
                                value={invSettings.paymentMode}
                                onChange={e => setInvSettings({ ...invSettings, paymentMode: e.target.value })}
                            >
                                <option value="cash">💵 Cash</option>
                                <option value="upi">📱 UPI</option>
                                <option value="card">💳 Card</option>
                                <option value="credit">📝 Credit</option>
                            </select>
                            <div className="flex">
                                <input
                                    type="number"
                                    className="flex-1 p-2 border-2 rounded-l-xl text-sm"
                                    placeholder="Discount"
                                    value={invSettings.discount || ''}
                                    onChange={e => setInvSettings({ ...invSettings, discount: parseFloat(e.target.value) || 0 })}
                                />
                                <select
                                    className="p-2 border-2 border-l-0 rounded-r-xl text-sm"
                                    value={invSettings.discountType}
                                    onChange={e => setInvSettings({ ...invSettings, discountType: e.target.value })}
                                >
                                    <option value="flat">₹</option>
                                    <option value="percent">%</option>
                                </select>
                            </div>
                        </div>

                        {invItems.length > 0 && (
                            <div className="mb-3 space-y-1">
                                {invItems.map(item => (
                                    <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm">
                                        <span className="font-medium">{item.name} × {item.qty}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold">₹{item.total.toFixed(0)}</span>
                                            <button onClick={() => deleteInvItem(item.id)} className="text-red-500 p-1 hover:bg-red-50 rounded"><Trash2 size={14} /></button>
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

            case 'gst': {
                const price = parseFloat(gstInput.price) || 0;
                let gstAmt = 0, finalAmt = 0, baseAmt = 0, cgst = 0, sgst = 0, igst = 0;
                if (gstInput.isReverse) {
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
                                <Percent className="text-blue-500" size={24} />
                                GST Pro Calculator
                            </h3>
                        </div>
                        <div className="flex gap-2 mb-4 bg-blue-50 p-1 rounded-xl">
                            <button
                                onClick={() => setGstInput({ ...gstInput, isReverse: false })}
                                className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${!gstInput.isReverse ? 'bg-blue-600 text-white shadow' : 'text-blue-600 hover:bg-blue-100'}`}
                            >
                                Add GST
                            </button>
                            <button
                                onClick={() => setGstInput({ ...gstInput, isReverse: true })}
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
                            onChange={e => setGstInput({ ...gstInput, price: e.target.value })}
                        />

                        <div className="grid grid-cols-5 gap-2 mb-4">
                            {[5, 12, 18, 28, 'custom'].map(r => (
                                <button
                                    key={r}
                                    onClick={() => r !== 'custom' && setGstInput({ ...gstInput, rate: Number(r) })}
                                    className={`py-3 rounded-xl font-bold border-2 transition-all ${gstInput.rate === r ? 'bg-blue-600 text-white border-blue-600 scale-105' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'}`}
                                >
                                    {r === 'custom' ? t('Custom') : `${r}%`}
                                </button>
                            ))}
                        </div>

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

                                <div className="bg-white/50 rounded-xl p-3 my-2">
                                    <p className="text-xs text-gray-500 font-bold mb-2">TAX BREAKDOWN (Intra-State)</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="text-center p-2 bg-blue-100/50 rounded-lg">
                                            <p className="text-xs text-blue-600">CGST ({gstInput.rate / 2}%)</p>
                                            <p className="font-bold text-blue-800">₹{cgst.toFixed(2)}</p>
                                        </div>
                                        <div className="text-center p-2 bg-indigo-100/50 rounded-lg">
                                            <p className="text-xs text-indigo-600">SGST ({gstInput.rate / 2}%)</p>
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
                            onClick={() => navigator.clipboard.writeText(`GST Calculation\n---------------\nBase: ₹${baseAmt.toFixed(2)}\nGST @${gstInput.rate}%: ₹${gstAmt.toFixed(2)}\n  CGST: ₹${cgst.toFixed(2)}\n  SGST: ₹${sgst.toFixed(2)}\n---------------\nTotal: ₹${finalAmt.toFixed(2)}`)}
                            className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all"
                        >
                            <Copy size={16} /> Copy Full Breakdown
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
                                <Calculator className="text-purple-500" size={24} />
                                Profit Analyzer Pro
                            </h3>
                            <button
                                onClick={() => setMarginInput({ cost: '', sell: '', discount: 0, mode: marginInput.mode, markup: '' })}
                                className="text-xs text-red-500 font-bold bg-red-50 px-3 py-1 rounded-full"
                            >
                                RESET
                            </button>
                        </div>

                        <div className="flex gap-2 mb-4 bg-purple-50 p-1.5 rounded-xl">
                            <button onClick={() => setMarginInput({ ...marginInput, mode: 'profit' })} className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${marginInput.mode === 'profit' ? 'bg-white shadow-md text-purple-600' : 'text-gray-500 hover:text-purple-400'}`}>
                                📈 Profit Analysis
                            </button>
                            <button onClick={() => setMarginInput({ ...marginInput, mode: 'markup' })} className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${marginInput.mode === 'markup' ? 'bg-white shadow-md text-purple-600' : 'text-gray-500 hover:text-purple-400'}`}>
                                🏷️ Markup Pricing
                            </button>
                            <button onClick={() => setMarginInput({ ...marginInput, mode: 'discount' })} className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${marginInput.mode === 'discount' ? 'bg-white shadow-md text-purple-600' : 'text-gray-500 hover:text-purple-400'}`}>
                                ✂️ Discount
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
                                            onChange={e => setMarginInput({ ...marginInput, cost: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 mb-1 block">SELLING PRICE</label>
                                        <input
                                            type="number"
                                            placeholder="₹0"
                                            className={`${commonInputClass} mb-0 text-center text-xl`}
                                            value={marginInput.sell}
                                            onChange={e => setMarginInput({ ...marginInput, sell: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {cost > 0 && sell > 0 && (
                                    <div className={`p-4 rounded-2xl border-2 ${profit >= 0 ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200' : 'bg-gradient-to-br from-red-50 to-pink-50 border-red-200'}`}>
                                        <div className="text-center mb-4">
                                            <p className={`text-xs font-bold mb-1 ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {profit >= 0 ? '✅ PROFIT' : '❌ LOSS'}
                                            </p>
                                            <p className={`text-4xl font-black ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                ₹{Math.abs(profit).toFixed(2)}
                                            </p>
                                        </div>

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
                                        onChange={e => setMarginInput({ ...marginInput, cost: e.target.value })}
                                    />
                                </div>

                                <div className="mb-4">
                                    <label className="text-xs font-bold text-gray-500 mb-2 block">SELECT MARKUP %</label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {[10, 15, 20, 25, 30, 40, 50, 100].map(m => (
                                            <button
                                                key={m}
                                                onClick={() => setMarginInput({ ...marginInput, markup: m.toString() })}
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
                                        onChange={e => setMarginInput({ ...marginInput, markup: e.target.value })}
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
                                        onChange={e => setMarginInput({ ...marginInput, cost: e.target.value })}
                                    />
                                </div>

                                <div className="mb-4">
                                    <label className="text-xs font-bold text-gray-500 mb-2 block">DISCOUNT %</label>
                                    <div className="grid grid-cols-5 gap-2 mb-3">
                                        {[5, 10, 15, 20, 25].map(d => (
                                            <button
                                                key={d}
                                                onClick={() => setMarginInput({ ...marginInput, discount: d })}
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
                                        onChange={e => setMarginInput({ ...marginInput, discount: parseFloat(e.target.value) || 0 })}
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
                const convert = (val: number, type: string) => {
                    const rates: any = {
                        kgToTon: val / 1000, tonToKg: val * 1000, ftToM: val / 3.28084, mToFt: val * 3.28084,
                        ltrToGal: val * 0.264172, galToLtr: val / 0.264172, sqftToSqm: val / 10.764, sqmToSqft: val * 10.764
                    };
                    return rates[type] || val;
                };
                const result = convInput.val ? convert(Number(convInput.val), convInput.type).toFixed(4) : '0';
                return (
                    <div className={cardClass}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-xl flex items-center gap-2">
                                <RefreshCcw className="text-green-500" size={24} />
                                Unit Converter Pro
                            </h3>
                        </div>
                        <select
                            className={`${commonInputClass} mb-4`}
                            value={convInput.type}
                            onChange={e => setConvInput({ ...convInput, type: e.target.value })}
                        >
                            <option value="kgToTon">KG ↔ Ton</option>
                            <option value="tonToKg">Ton ↔ KG</option>
                            <option value="ftToM">Feet ↔ Meters</option>
                            <option value="mToFt">Meters ↔ Feet</option>
                            <option value="ltrToGal">Liters ↔ Gallons</option>
                            <option value="galToLtr">Gallons ↔ Liters</option>
                            <option value="sqftToSqm">Sq. Ft ↔ Sq. Meters</option>
                            <option value="sqmToSqft">Sq. Meters ↔ Sq. Ft</option>
                        </select>
                        <input
                            type="number"
                            placeholder="Enter Value"
                            className={`${commonInputClass} text-center text-2xl`}
                            value={convInput.val}
                            onChange={e => setConvInput({ ...convInput, val: e.target.value })}
                        />
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-2xl border-2 border-green-200 text-center">
                            <p className="text-sm font-bold text-green-600 mb-2">CONVERTED VALUE</p>
                            <p className="text-4xl font-black text-green-800">{result}</p>
                            <p className="text-xs text-green-600 mt-2 opacity-70">
                                {convInput.type.includes('To') ? convInput.type.split('To')[1].toUpperCase() : ''}
                            </p>
                        </div>
                    </div>
                );
            }
            case 'card':
                return (
                    <div className={cardClass}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-xl flex items-center gap-2">
                                <CreditCard className="text-orange-500" size={24} />
                                Digital Business Card
                            </h3>
                            <button onClick={() => alert('Sharing not available in preview')} className="p-2 bg-orange-100 text-orange-600 rounded-full hover:bg-orange-200">
                                <Share2 size={20} />
                            </button>
                        </div>
                        <div id="biz-card" className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 rounded-2xl shadow-xl aspect-video relative overflow-hidden mb-6">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
                            <div className="relative z-10 flex flex-col h-full justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold mb-1">{shopDetails.shopName || "My Business"}</h2>
                                    <p className="text-orange-400 text-sm">{shopDetails.ownerName || "Business Owner"}</p>
                                </div>
                                <div className="space-y-2 text-sm opacity-90">
                                    <p className="flex items-center gap-2"><Phone size={14} className="text-orange-400" /> {shopDetails.mobile || "+91 98765 43210"}</p>
                                    <p className="flex items-center gap-2"><Store size={14} className="text-orange-400" /> {shopDetails.address || "Business Address"}</p>
                                </div>
                            </div>
                        </div>
                        <p className="text-center text-xs text-gray-500">
                            This is a live preview of your digital business card. Share it with customers to expand your reach.
                        </p>
                    </div>
                );
            case 'emi': {
                const p = parseFloat(emiInput.principal) || 0;
                const r = parseFloat(emiInput.rate) || 0;
                const t = parseFloat(emiInput.tenure) || 0;
                let emi = 0, totalPay = 0, totalInt = 0;
                if (p > 0 && r > 0 && t > 0) {
                    const monthlyR = r / 12 / 100;
                    const months = emiInput.tenureType === 'years' ? t * 12 : t;
                    emi = (p * monthlyR * Math.pow(1 + monthlyR, months)) / (Math.pow(1 + monthlyR, months) - 1);
                    totalPay = emi * months;
                    totalInt = totalPay - p;
                }
                return (
                    <div className={cardClass}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-xl flex items-center gap-2">
                                <DollarSign className="text-emerald-500" size={24} />
                                EMI Calculator
                            </h3>
                        </div>
                        <div className="space-y-3 mb-4">
                            <input
                                type="number"
                                placeholder="Loan Amount (₹)"
                                className={commonInputClass}
                                value={emiInput.principal}
                                onChange={e => setEmiInput({ ...emiInput, principal: e.target.value })}
                            />
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    placeholder="Interest Rate (%)"
                                    className={`${commonInputClass} flex-1 mb-0`}
                                    value={emiInput.rate}
                                    onChange={e => setEmiInput({ ...emiInput, rate: e.target.value })}
                                />
                                <div className="flex-1 flex rounded-xl border border-gray-300 overflow-hidden">
                                    <input
                                        type="number"
                                        placeholder="Tenure"
                                        className="w-full p-3 font-bold text-lg outline-none"
                                        value={emiInput.tenure}
                                        onChange={e => setEmiInput({ ...emiInput, tenure: e.target.value })}
                                    />
                                    <select
                                        className="bg-gray-100 p-2 font-bold text-xs"
                                        value={emiInput.tenureType}
                                        onChange={e => setEmiInput({ ...emiInput, tenureType: e.target.value })}
                                    >
                                        <option value="months">Mo</option>
                                        <option value="years">Yr</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        {emi > 0 && (
                            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-4 rounded-2xl border-2 border-emerald-200">
                                <div className="flex items-center justify-between mb-4 pb-4 border-b border-emerald-200">
                                    <span className="text-sm font-bold text-gray-600">Monthly EMI</span>
                                    <span className="text-3xl font-black text-emerald-700">₹{Math.round(emi).toLocaleString('en-IN')}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-3 text-center">
                                    <div className="bg-white/60 p-2 rounded-xl">
                                        <p className="text-xs text-gray-500">Total Interest</p>
                                        <p className="text-sm font-bold text-emerald-600">₹{Math.round(totalInt).toLocaleString('en-IN')}</p>
                                    </div>
                                    <div className="bg-white/60 p-2 rounded-xl">
                                        <p className="text-xs text-gray-500">Total Payment</p>
                                        <p className="text-sm font-bold text-emerald-600">₹{Math.round(totalPay).toLocaleString('en-IN')}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                );
            }

            case 'stockvalue': {
                const stockTotal = stockCalc.items.reduce((acc: number, item: any) => acc + (item.qty * item.rate), 0);
                return (
                    <div className={cardClass}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-xl flex items-center gap-2">
                                <Activity className="text-cyan-500" size={24} />
                                Stock Value Calculator
                            </h3>
                            <div className="text-right">
                                <p className="text-xs text-gray-500 font-bold">TOTAL VALUE</p>
                                <p className="text-2xl font-black text-cyan-600">₹{stockTotal.toFixed(2)}</p>
                            </div>
                        </div>
                        <div className="bg-cyan-50 p-3 rounded-xl mb-4 border border-cyan-100">
                            <div className="grid grid-cols-6 gap-2 mb-2">
                                <input
                                    className="col-span-3 p-2 border rounded-lg text-sm"
                                    placeholder="Item Name"
                                    value={stockCalc.newItem.name}
                                    onChange={e => setStockCalc({ ...stockCalc, newItem: { ...stockCalc.newItem, name: e.target.value } })}
                                />
                                <input
                                    type="number"
                                    className="col-span-1 p-2 border rounded-lg text-sm"
                                    placeholder="Qty"
                                    value={stockCalc.newItem.qty || ''}
                                    onChange={e => setStockCalc({ ...stockCalc, newItem: { ...stockCalc.newItem, qty: parseFloat(e.target.value) } })}
                                />
                                <input
                                    type="number"
                                    className="col-span-1 p-2 border rounded-lg text-sm"
                                    placeholder="Rate"
                                    value={stockCalc.newItem.rate || ''}
                                    onChange={e => setStockCalc({ ...stockCalc, newItem: { ...stockCalc.newItem, rate: parseFloat(e.target.value) } })}
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
                                    className="col-span-1 bg-cyan-500 text-white rounded-lg flex items-center justify-center"
                                >
                                    <Plus size={20} />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-2">
                            {stockCalc.items.map((item: any) => (
                                <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-white p-2 rounded-lg"><Package size={16} className="text-gray-400" /></div>
                                        <div>
                                            <p className="font-bold text-sm">{item.name}</p>
                                            <p className="text-xs text-gray-500">{item.qty} × ₹{item.rate}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="font-bold text-gray-700">₹{(item.qty * item.rate).toFixed(2)}</span>
                                        <button onClick={() => setStockCalc({ ...stockCalc, items: stockCalc.items.filter((i: any) => i.id !== item.id) })} className="text-red-400 hover:text-red-600">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {stockCalc.items.length === 0 && (
                                <div className="text-center py-10 text-gray-400">
                                    <Package size={48} className="mx-auto mb-2 opacity-50" />
                                    <p className="text-xs">Add items to calculate stock value</p>
                                </div>
                            )}
                        </div>
                    </div>
                );
            }
            case 'notes': {
                if (notesView === 'list') {
                    return (
                        <div className={cardClass}>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-xl flex items-center gap-2">
                                    <StickyNote className="text-yellow-500" size={24} />
                                    Note Master
                                </h3>
                                <button onClick={() => { setCurrentNote({ id: null, title: '', body: '', date: '', sketch: null, category: 'general' }); setNotesView('editor'); }} className="bg-yellow-500 text-white px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 shadow-lg hover:bg-yellow-600 transition-all">
                                    <Plus size={14} /> New Note
                                </button>
                            </div>

                            <div className="relative mb-4">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    className={`${commonInputClass} pl-10 mb-0 py-2 text-sm`}
                                    placeholder="Search notes..."
                                    value={noteSearch}
                                    onChange={e => setNoteSearch(e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3 overflow-y-auto pb-20">
                                {notes.filter(n => n.title.toLowerCase().includes(noteSearch.toLowerCase()) || n.body.toLowerCase().includes(noteSearch.toLowerCase())).map(note => (
                                    <div
                                        key={note.id}
                                        onClick={() => { setCurrentNote(note); setNotesView('editor'); }}
                                        className={`p-3 rounded-xl border cursor-pointer hover:shadow-md transition-all flex flex-col justify-between h-32 ${isDark ? 'bg-slate-700 border-slate-600' : 'bg-yellow-50 border-yellow-200'}`}
                                    >
                                        <div>
                                            <h4 className="font-bold text-sm line-clamp-1 mb-1">{note.title || 'Untitled Note'}</h4>
                                            <div className="text-[10px] text-gray-500 line-clamp-3 overflow-hidden text-ellipsis opacity-70" dangerouslySetInnerHTML={{ __html: note.body || (note.sketch ? '[Sketch]' : 'No content') }}></div>
                                        </div>
                                        <div className="flex justify-between items-end mt-2">
                                            <span className="text-[9px] text-gray-400">{note.date.split(',')[0]}</span>
                                            {note.sketch && <PenTool size={12} className="text-purple-500" />}
                                        </div>
                                    </div>
                                ))}
                                {notes.length === 0 && (
                                    <div className="col-span-2 text-center py-10 opacity-50">
                                        <StickyNote size={48} className="mx-auto mb-2 text-yellow-300" />
                                        <p>No notes yet. Create one!</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                }

                return (
                    <div className="flex flex-col h-full bg-white rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-3 border-b bg-gray-50">
                            <input
                                className="bg-transparent font-bold text-lg outline-none w-full"
                                placeholder="Note Title"
                                value={currentNote.title}
                                onChange={e => setCurrentNote({ ...currentNote, title: e.target.value })}
                            />
                            <div className="flex gap-2">
                                <button onClick={() => deleteNote(currentNote.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-full"><Trash2 size={18} /></button>
                                <button onClick={saveCurrentNote} className="p-2 text-green-600 hover:bg-green-50 rounded-full font-bold">Save</button>
                            </div>
                        </div>
                        {/* Editor Toolbar */}
                        <div className="flex border-b">
                            <button onClick={() => setNoteMode('text')} className={`flex-1 p-2 text-xs font-bold flex items-center justify-center gap-1 ${noteMode === 'text' ? 'bg-white border-b-2 border-primary text-primary' : 'bg-gray-50 text-gray-500'}`}><FileText size={14} /> Text</button>
                            <button onClick={() => setNoteMode('draw')} className={`flex-1 p-2 text-xs font-bold flex items-center justify-center gap-1 ${noteMode === 'draw' ? 'bg-white border-b-2 border-purple-500 text-purple-600' : 'bg-gray-50 text-gray-500'}`}><PenTool size={14} /> Sketch</button>
                        </div>

                        {noteMode === 'text' ? (
                            <>
                                <div className="flex gap-1 p-2 bg-gray-50 border-b overflow-x-auto">
                                    <button className="p-2 hover:bg-gray-200 rounded" onMouseDown={(e) => { e.preventDefault(); execFormat('bold'); }}><Bold size={16} /></button>
                                    <button className="p-2 hover:bg-gray-200 rounded" onMouseDown={(e) => { e.preventDefault(); execFormat('italic'); }}><Italic size={16} /></button>
                                    <button className="p-2 hover:bg-gray-200 rounded" onMouseDown={(e) => { e.preventDefault(); execFormat('underline'); }}><Underline size={16} /></button>
                                    <button className="p-2 hover:bg-gray-200 rounded bg-yellow-100" onMouseDown={(e) => { e.preventDefault(); execFormat('hiliteColor', 'yellow'); }}><Highlighter size={16} className="text-yellow-600" /></button>
                                </div>
                                <div
                                    ref={contentEditableRef}
                                    className="flex-1 p-4 resize-none outline-none text-base leading-relaxed bg-transparent overflow-y-auto"
                                    contentEditable={true}
                                    dangerouslySetInnerHTML={{ __html: currentNote.body || '' }}
                                    placeholder="Start typing..."
                                ></div>
                            </>
                        ) : (
                            <div className="flex-1 relative bg-white overflow-hidden touch-none">
                                <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-white shadow-lg border rounded-full p-1 flex gap-2 z-10">
                                    <button onClick={() => setBrushType('pencil')} className={`p-2 rounded-full ${brushType === 'pencil' ? 'bg-black text-white' : 'hover:bg-gray-100'}`}><PenTool size={16} /></button>
                                    <button onClick={() => setBrushType('highlight')} className={`p-2 rounded-full ${brushType === 'highlight' ? 'bg-yellow-300 text-yellow-900' : 'hover:bg-gray-100'}`}><Highlighter size={16} /></button>
                                    <button onClick={() => setBrushType('circle')} className={`p-2 rounded-full ${brushType === 'circle' ? 'bg-red-100 text-red-600' : 'hover:bg-gray-100'}`}><CircleIcon size={16} /></button>
                                    <button onClick={() => setBrushType('line')} className={`p-2 rounded-full ${brushType === 'line' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}><Minus size={16} /></button>
                                    <button onClick={() => setBrushType('eraser')} className={`p-2 rounded-full ${brushType === 'eraser' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}><Eraser size={16} /></button>
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

            case 'translator':
                return (
                    <div className={cardClass}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-xl flex items-center gap-2">
                                <Languages className="text-pink-500" size={24} />
                                AI Translator Pro
                            </h3>
                        </div>

                        <div className="flex items-center gap-2 mb-4 bg-gray-50 p-2 rounded-xl border">
                            <select
                                className="flex-1 bg-transparent font-bold text-sm outline-none"
                                value={transLang.from}
                                onChange={e => setTransLang({ ...transLang, from: e.target.value })}
                            >
                                {languageOptions.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
                            </select>
                            <button onClick={swapLanguages} className="p-2 rounded-full hover:bg-gray-200 transition-all">
                                <RefreshCcw size={16} />
                            </button>
                            <select
                                className="flex-1 bg-transparent font-bold text-sm outline-none text-right"
                                value={transLang.to}
                                onChange={e => setTransLang({ ...transLang, to: e.target.value })}
                            >
                                {languageOptions.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
                            </select>
                        </div>

                        <div className="relative mb-4">
                            <textarea
                                className={`${commonInputClass} min-h-[120px] resize-none pr-12`}
                                placeholder="Type text to translate..."
                                value={transInput}
                                onChange={e => setTransInput(e.target.value)}
                            />
                            <div className="absolute bottom-6 right-4">
                                <VoiceInput onResult={(txt: string) => setTransInput(txt)} lang={transLang.from} isDark={isDark} />
                            </div>
                        </div>

                        <button
                            onClick={handleTranslate}
                            disabled={transLoading || !transInput.trim()}
                            className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-boldshadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                        >
                            {transLoading ? <RefreshCcw className="animate-spin" size={20} /> : <Languages size={20} />}
                            {transLoading ? 'Translating...' : 'Translate Now'}
                        </button>

                        {transOutput && (
                            <div className="mt-4 animate-in slide-in-from-bottom-2 fade-in">
                                <p className="text-xs font-bold text-gray-500 mb-1">TRANSLATION</p>
                                <div className="p-4 bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl border-2 border-pink-100 relative">
                                    <p className="text-lg font-medium leading-relaxed">{transOutput}</p>
                                    <button
                                        onClick={() => navigator.clipboard.writeText(transOutput)}
                                        className="absolute top-2 right-2 p-2 text-pink-400 hover:bg-pink-100 rounded-lg transition-all"
                                    >
                                        <Copy size={16} />
                                    </button>
                                </div>
                            </div>
                        )}

                        {transHistory.length > 0 && (
                            <div className="mt-6 border-t pt-4">
                                <p className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">History</p>
                                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                                    {transHistory.map((item, i) => (
                                        <div key={i} className="p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all cursor-pointer border" onClick={() => { setTransInput(item.input); setTransOutput(item.output); }}>
                                            <p className="text-xs text-gray-500 mb-1 line-clamp-1">{item.input}</p>
                                            <p className="text-sm font-bold text-gray-800 line-clamp-1">{item.output}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                );
            default: return null;
        }
    };

    return (
        <div className={`fixed inset-0 z-[60] overflow-y-auto ${isDark ? 'bg-slate-950 text-white' : 'bg-gray-50 text-black'}`}>
            <div className={`sticky top-0 p-4 border-b flex items-center gap-3 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
                {activeTool ? (
                    <button onClick={() => { if (notesView === 'editor') saveCurrentNote(); setActiveTool(null); }} className="p-2 rounded-full hover:bg-gray-100/10"><ArrowLeft size={24} /></button>
                ) : (
                    <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100/10"><ArrowLeft size={24} /></button>
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
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onTogglePin(tool.id); }}
                                        className={`absolute top-2 right-2 p-1.5 rounded-full transition-all ${isPinned ? 'text-blue-500 bg-blue-100' : 'text-gray-300 hover:text-gray-500 hover:bg-gray-100'}`}
                                    >
                                        {isPinned ? <Pin size={14} fill="currentColor" /> : <Pin size={14} />}
                                    </button>
                                </div>
                            );
                        })}
                        <div className="col-span-2 text-center text-xs opacity-50 mt-4 flex items-center justify-center gap-1">
                            <Pin size={10} /> Pin tools to Home Screen for quick access
                        </div>
                    </div>
                )}
                {activeTool && <div className="animate-in slide-in-from-right duration-300 mt-4 h-full">{renderToolContent()}</div>}
            </div>
        </div>
    );
};
export default ToolsHub;

import React, { useEffect } from 'react';
import { XCircle, CheckCircle } from 'lucide-react';

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
export default ToastMessage;
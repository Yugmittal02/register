import React from 'react';
import { Phone, Store } from 'lucide-react';

const DigitalCard = ({ cardClass, shopDetails }) => {
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
};
export default DigitalCard;
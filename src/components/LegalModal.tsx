import React from 'react';
import { FileText, HelpCircle, X } from 'lucide-react';

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
                    <p>1. <strong>Data Security:</strong> Your data is stored securely on Google Firebase servers.</p>
                    <p>2. <strong>Usage:</strong> This app is intended for inventory management purposes only.</p>
                    <p className="mt-4 pt-4 border-t text-xs">For legal inquiries, contact: support@automationx.com</p>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="border rounded-lg p-3">
                        <p className="font-bold text-blue-500 mb-1">Q: How to add a new item?</p>
                        <p className="text-sm opacity-80">A: Go to a Page, click the (+) button.</p>
                    </div>
                </div>
            )}
        </div>
      </div>
    );
};
export default LegalModal;
import React from 'react';
import { X, Trash2 } from 'lucide-react';

const ImageModal = ({ src, onClose, onDelete }) => {
    if (!src) return null;
    return (
        <div className="fixed inset-0 bg-black z-[120] flex flex-col justify-center items-center">
            <button onClick={onClose} className="absolute top-4 right-4 text-white bg-white/20 p-3 rounded-full"><X/></button>
            <img src={src} className="max-w-full max-h-[80vh] object-contain" alt="Full view" />
            <button onClick={onDelete} className="mt-8 bg-red-600 text-white px-6 py-3 rounded-xl font-bold flex gap-2"><Trash2/> Delete Photo</button>
        </div>
    );
};
export default ImageModal;
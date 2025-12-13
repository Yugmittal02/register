import React from 'react';
import { Mic } from 'lucide-react';

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
export default VoiceInput;
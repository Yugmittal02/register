
import React, { useState, useRef, useCallback } from 'react';
import { Mic } from 'lucide-react';
import { synonymMap } from '../data/dictionaries';

interface VoiceInputProps {
    onResult: (text: string) => void;
    isDark: boolean;
    lang?: string;
}

const VoiceInput: React.FC<VoiceInputProps> = ({ onResult, isDark, lang = 'en-IN' }) => {
    const [isListening, setIsListening] = useState(false);
    const [hasError, setHasError] = useState(false);
    const audioStreamRef = useRef<any>(null);

    const stopAudioStream = useCallback(() => {
        const stream = audioStreamRef.current;
        if (stream) {
            stream.getTracks().forEach((t: any) => t.stop());
            audioStreamRef.current = null;
        }
    }, []);

    const startListening = async () => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            const recognition = new SpeechRecognition();
            recognition.lang = lang;
            recognition.continuous = false;
            recognition.interimResults = false;

            try {
                if (navigator.mediaDevices?.getUserMedia) {
                    audioStreamRef.current = await navigator.mediaDevices.getUserMedia({
                        audio: {
                            echoCancellation: true,
                            noiseSuppression: true,
                            autoGainControl: true
                        }
                    });
                }
            } catch (err) {
                console.warn('getUserMedia constraints failed:', err);
            }

            recognition.onstart = () => {
                setIsListening(true);
                setHasError(false);
                if (navigator.vibrate) navigator.vibrate(100);
            };

            recognition.onresult = (e: any) => {
                const transcript = e.results[0][0].transcript;
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
                stopAudioStream();
            };

            recognition.onerror = (e: any) => {
                console.warn('Speech recognition error:', e.error);
                setIsListening(false);
                setHasError(true);
                stopAudioStream();

                if (e.error === 'network') {
                    console.info('Voice search requires internet connection');
                } else if (e.error === 'no-speech') {
                    setHasError(false);
                }
                setTimeout(() => setHasError(false), 2000);
            };

            recognition.onend = () => {
                setIsListening(false);
                stopAudioStream();
            };

            try {
                recognition.start();
            } catch (e) {
                console.error('Failed to start voice recognition:', e);
                setHasError(true);
                stopAudioStream();
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
            className={`p-3 rounded-full shrink-0 transition-all ${isListening
                ? 'bg-red-500 text-white animate-pulse'
                : hasError
                    ? 'bg-yellow-500 text-white'
                    : isDark
                        ? 'bg-slate-700 text-white hover:bg-slate-600'
                        : 'bg-gray-100 text-black hover:bg-gray-200'
                }`}
        >
            <Mic size={20} className={isListening ? 'animate-bounce' : ''} />
        </button>
    );
};

export default VoiceInput;

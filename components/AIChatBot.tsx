import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Sparkles, Loader2, Globe, Mic, MicOff, BrainCircuit } from 'lucide-react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'Hindi' },
  { code: 'mr', name: 'Marathi' },
  { code: 'te', name: 'Telugu' },
  { code: 'ta', name: 'Tamil' },
  { code: 'kn', name: 'Kannada' },
  { code: 'gu', name: 'Gujarati' },
  { code: 'pa', name: 'Punjabi' },
  { code: 'bn', name: 'Bengali' },
  { code: 'ml', name: 'Malayalam' },
];

// --- LIVE API HELPERS ---
function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}
// -----------------------

export const AIChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'model', text: string}[]>([
    { role: 'model', text: 'Hello! I am AgriBee, your AI farming assistant. How can I help you with your crops today?' }
  ]);
  const [selectedLang, setSelectedLang] = useState(LANGUAGES[0]);
  const [isThinkingMode, setIsThinkingMode] = useState(false);
  
  // Live Audio State
  const [isLive, setIsLive] = useState(false);
  const [liveStatus, setLiveStatus] = useState<string>('');
  const activeSessionRef = useRef<any>(null);
  const isLiveRef = useRef(false); // Ref to track live status synchronously in callbacks
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  // Cleanup Live Session on Unmount/Close
  useEffect(() => {
    return () => {
       stopLiveSession();
    };
  }, []);

  const stopLiveSession = async () => {
    isLiveRef.current = false;
    setIsLive(false);
    setLiveStatus('Disconnecting...');

    // Close session
    if (activeSessionRef.current) {
        try {
           await activeSessionRef.current.close();
           console.log("Session closed gracefully");
        } catch (e) {
            console.warn("Error closing session:", e);
        }
        activeSessionRef.current = null;
    }
    
    // Close audio contexts
    if (audioContextRef.current) {
        try {
          await audioContextRef.current.close();
        } catch(e) {}
        audioContextRef.current = null;
    }
    if (inputContextRef.current) {
        try {
          await inputContextRef.current.close();
        } catch (e) {}
        inputContextRef.current = null;
    }
    
    setLiveStatus('');
  };

  const startLiveSession = async () => {
    if (isLive) return;

    try {
        setIsLive(true);
        isLiveRef.current = true;
        setLiveStatus('Connecting...');
        
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 16000});
        const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
        inputContextRef.current = inputAudioContext;
        audioContextRef.current = outputAudioContext;
        
        const outputNode = outputAudioContext.createGain();
        outputNode.connect(outputAudioContext.destination);

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // Connect to Gemini Live
        const sessionPromise = ai.live.connect({
            model: 'gemini-2.5-flash-native-audio-preview-09-2025',
            callbacks: {
                onopen: () => {
                    setLiveStatus('Listening...');
                    // Setup Input Stream
                    const source = inputAudioContext.createMediaStreamSource(stream);
                    const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
                    scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                        if (!isLiveRef.current) return; // Stop processing if session closed

                        const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                        const pcmBlob = createBlob(inputData);
                        
                        // Only send if session is active and promises resolved
                        sessionPromise.then((session) => {
                           if (isLiveRef.current) {
                               try {
                                  session.sendRealtimeInput({ media: pcmBlob });
                               } catch(e) {
                                  console.error("Error sending input:", e);
                               }
                           }
                        }).catch(e => console.error("Send input error:", e));
                    };
                    source.connect(scriptProcessor);
                    scriptProcessor.connect(inputAudioContext.destination);
                },
                onmessage: async (message: LiveServerMessage) => {
                    if (!isLiveRef.current) return;

                    const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                    if (base64Audio) {
                        try {
                            // Play Audio
                            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContext.currentTime);
                            const audioBuffer = await decodeAudioData(
                                decode(base64Audio),
                                outputAudioContext,
                                24000,
                                1
                            );
                            const source = outputAudioContext.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(outputNode);
                            source.start(nextStartTimeRef.current);
                            nextStartTimeRef.current += audioBuffer.duration;
                        } catch (e) {
                            console.error("Audio decode error", e);
                        }
                    }
                },
                onclose: () => {
                    console.log("Session closed");
                    if (isLiveRef.current) {
                        setLiveStatus('Disconnected');
                        setIsLive(false);
                        isLiveRef.current = false;
                    }
                },
                onerror: (err) => {
                    console.error("Live API Error", err);
                    // setLiveStatus('Error'); // Optional: show error status
                }
            },
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
                },
                // NOTE: googleSearch tool is removed because it is NOT supported in the Live API preview model
                // and causes immediate "Network Error" / connection closure.
                systemInstruction: `You are AgriBee, a friendly Indian farming assistant. Speak in ${selectedLang.name}. Keep answers short and helpful.`,
            }
        });
        
        // Store the promise/session reference
        const session = await sessionPromise;
        
        // CRITICAL: Check if user stopped session while connecting
        if (!isLiveRef.current) {
            await session.close();
            return;
        }
        
        activeSessionRef.current = session;

    } catch (e) {
        console.error("Failed to start live session", e);
        setIsLive(false);
        isLiveRef.current = false;
        setLiveStatus('Connection Failed');
        alert("Could not start voice mode. Please try again.");
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Build Config based on mode
      const config: any = {};
      if (isThinkingMode) {
          config.thinkingConfig = { thinkingBudget: 32768 };
      }
      // Add Google Search Grounding for text chat (supported here)
      config.tools = [{ googleSearch: {} }];

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview', // Upgraded Model
        contents: [
            { role: 'user', parts: [{ text: `System Instruction: You are AgriBee, a helpful, friendly, and expert agricultural assistant. Keep answers concise and relevant to farming. IMPORTANT: Respond in the ${selectedLang.name} language.` }] },
            ...messages.map(m => ({ role: m.role, parts: [{ text: m.text }] })),
            { role: 'user', parts: [{ text: userMessage }] }
        ],
        config: config
      });
      
      const text = response.text || "I'm sorry, I couldn't process that right now.";
      setMessages(prev => [...prev, { role: 'model', text }]);
    } catch (error) {
      console.error("Chat Error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "Sorry, I'm having trouble connecting to the hive right now. Please check your connection or API key." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-24 right-6 z-40 bg-yellow-400 text-black p-4 rounded-full shadow-lg shadow-yellow-500/30 hover:scale-110 transition-transform duration-300 animate-bounce-slow flex items-center justify-center"
        >
           <span className="text-2xl">🐝</span>
        </button>
      )}

      {/* Chat Bottom Sheet */}
      <div className={`fixed inset-x-0 bottom-0 z-50 transition-transform duration-500 ease-in-out transform ${isOpen ? 'translate-y-0' : 'translate-y-[120%]'}`}>
        <div className="bg-white rounded-t-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] h-[85vh] flex flex-col overflow-hidden border-t border-gray-100">
          
          {/* Header with Language Selector */}
          <div className="bg-gradient-to-r from-yellow-400 to-amber-500 p-4">
            <div className="flex justify-between items-center mb-3">
                <div className="flex items-center space-x-3">
                <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm">
                    <span className="text-xl">🐝</span>
                </div>
                <div>
                    <h3 className="font-bold text-white">AgriBee AI</h3>
                    <p className="text-yellow-100 text-xs flex items-center">
                    <Sparkles size={10} className="mr-1" /> Pro Intelligence
                    </p>
                </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white bg-white/10 p-2 rounded-full">
                <X size={20} />
                </button>
            </div>

            {/* Language Selector Pills */}
            <div className="flex space-x-2 overflow-x-auto pb-1 no-scrollbar">
                <div className="flex items-center bg-white/20 px-2 py-1 rounded-full mr-1">
                    <Globe size={12} className="text-white mr-1" />
                    <span className="text-[10px] text-white font-medium">Lang:</span>
                </div>
                {LANGUAGES.map((lang) => (
                    <button
                        key={lang.code}
                        onClick={() => setSelectedLang(lang)}
                        className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all active:scale-95 ${
                            selectedLang.code === lang.code 
                            ? 'bg-white text-amber-600 shadow-sm' 
                            : 'bg-white/20 text-white hover:bg-white/30'
                        }`}
                    >
                        {lang.name}
                    </button>
                ))}
            </div>
          </div>

          {/* Controls Bar */}
          <div className="bg-gray-50 p-2 border-b border-gray-200 flex justify-between items-center px-4">
             <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-gray-500">Deep Reasoning:</span>
                <button 
                   onClick={() => setIsThinkingMode(!isThinkingMode)}
                   className={`w-10 h-5 rounded-full p-0.5 transition-colors ${isThinkingMode ? 'bg-purple-500' : 'bg-gray-300'}`}
                >
                    <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${isThinkingMode ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
             </div>
             
             {isLive && <div className="text-xs font-bold text-red-500 animate-pulse flex items-center"><div className="w-2 h-2 bg-red-500 rounded-full mr-1"></div> {liveStatus}</div>}
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`max-w-[80%] p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-green-600 text-white rounded-br-none' 
                      : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white p-3 rounded-2xl rounded-bl-none shadow-sm border border-gray-100 flex items-center space-x-2">
                   <Loader2 size={16} className="animate-spin text-green-600" />
                   <span className="text-xs text-gray-500">
                     {isThinkingMode ? 'Thinking deeply...' : `AgriBee is thinking in ${selectedLang.name}...`}
                   </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-gray-100 pb-8">
            <div className="flex items-center bg-gray-100 rounded-full px-2 py-2 border border-gray-200 focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-100 transition-all">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={`Ask something in ${selectedLang.name}...`}
                className="flex-1 bg-transparent border-none focus:ring-0 px-3 text-gray-700 placeholder-gray-400 text-sm outline-none"
                disabled={isLive}
              />
              
              {/* Live Voice Toggle */}
              <button 
                 onClick={isLive ? stopLiveSession : startLiveSession}
                 className={`p-2.5 rounded-full transition-all mr-1 ${isLive ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-gray-200 text-gray-500 hover:bg-gray-300'}`}
                 title={isLive ? "Stop Voice" : "Start Live Voice"}
              >
                 {isLive ? <MicOff size={18} /> : <Mic size={18} />}
              </button>

              <button 
                onClick={handleSend}
                disabled={!input.trim() || loading || isLive}
                className={`p-2.5 rounded-full transition-all ${input.trim() ? 'bg-green-600 text-white shadow-md transform hover:scale-105' : 'bg-gray-200 text-gray-400'}`}
              >
                <Send size={18} />
              </button>
            </div>
          </div>

        </div>
      </div>
      
      {/* Overlay when chat is open */}
      {isOpen && (
        <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-[1px] z-30 transition-opacity" 
            onClick={() => setIsOpen(false)}
        />
      )}
      
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </>
  );
};
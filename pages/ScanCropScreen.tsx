import React, { useState, useRef } from 'react';
import { GoogleGenAI, Type, Modality } from '@google/genai';
import { SideMenu } from '../components/SideMenu';
import { AIChatBot } from '../components/AIChatBot';
import { Image as ImageIcon, Camera, Zap, Search, Leaf, Bug, Loader2, Volume2, Globe, ChevronDown, Check, X, Scan } from 'lucide-react';
import { Page } from '../App';

interface ScanCropScreenProps {
  onNavigate: (page: Page) => void;
  currentTab: string;
  userName?: string;
}

interface AnalysisResult {
  name: string;
  severity: string;
  probability: string;
  remedies: string[];
  prevention: string[];
  description?: string;
}

interface CropData {
  id: number;
  name: string;
  scientificName: string;
  season: string;
  description: string;
  commonDiseases: string[];
  image: string;
}

const CROP_DATABASE: CropData[] = [
  {
    id: 1,
    name: "Wheat (Gehu)",
    scientificName: "Triticum",
    season: "Rabi (Winter)",
    description: "Major staple food crop in India. Requires cool growing season and bright sunshine at ripening.",
    commonDiseases: ["Rust (Brown/Yellow)", "Loose Smut", "Powdery Mildew"],
    image: "https://picsum.photos/seed/wheat/400/300"
  },
  {
    id: 2,
    name: "Rice (Paddy)",
    scientificName: "Oryza sativa",
    season: "Kharif (Monsoon)",
    description: "Staple food for majority of population. Requires high temperature, humidity and rainfall.",
    commonDiseases: ["Blast", "Bacterial Leaf Blight", "Brown Spot"],
    image: "https://picsum.photos/seed/rice/400/300"
  },
  {
    id: 3,
    name: "Cotton (Kapas)",
    scientificName: "Gossypium",
    season: "Kharif",
    description: "Major fiber crop. Requires high temperature, light rainfall or irrigation. Sensitive to frost.",
    commonDiseases: ["Pink Bollworm", "Fusarium Wilt", "Leaf Curl Virus"],
    image: "https://picsum.photos/seed/cotton/400/300"
  },
  {
    id: 4,
    name: "Sugarcane",
    scientificName: "Saccharum officinarum",
    season: "Year-round",
    description: "Main source of sugar. Long duration crop requiring heavy water and hot humid climate.",
    commonDiseases: ["Red Rot", "Smut", "Grassy Shoot"],
    image: "https://picsum.photos/seed/sugarcane/400/300"
  },
  {
    id: 5,
    name: "Maize (Corn)",
    scientificName: "Zea mays",
    season: "Kharif / Rabi",
    description: "Cereal grain used as food and fodder. Grown in diverse climates.",
    commonDiseases: ["Leaf Blight", "Stalk Rot", "Downy Mildew"],
    image: "https://picsum.photos/seed/maize/400/300"
  },
  {
    id: 6,
    name: "Tomato",
    scientificName: "Solanum lycopersicum",
    season: "Year-round",
    description: "Popular vegetable crop. Requires well-drained loamy soil.",
    commonDiseases: ["Early Blight", "Late Blight", "Leaf Curl"],
    image: "https://picsum.photos/seed/tomato/400/300"
  },
  {
    id: 7,
    name: "Potato",
    scientificName: "Solanum tuberosum",
    season: "Rabi",
    description: "Major vegetable crop. Tubers develop best in cool temperatures.",
    commonDiseases: ["Late Blight", "Early Blight", "Scab"],
    image: "https://picsum.photos/seed/potato/400/300"
  }
];

export const ScanCropScreen: React.FC<ScanCropScreenProps> = ({ onNavigate, currentTab, userName }) => {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [language, setLanguage] = useState('en-US');
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  
  // Local Database State
  const [dbSearchQuery, setDbSearchQuery] = useState('');
  const [showDatabase, setShowDatabase] = useState(false);
  const [selectedDbCrop, setSelectedDbCrop] = useState<CropData | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const languages = [
    { code: 'en-US', name: 'English', label: 'EN' },
    { code: 'hi-IN', name: 'Hindi', label: 'HI' },
    { code: 'te-IN', name: 'Telugu', label: 'TE' },
    { code: 'ta-IN', name: 'Tamil', label: 'TA' },
    { code: 'kn-IN', name: 'Kannada', label: 'KN' },
    { code: 'pa-IN', name: 'Punjabi', label: 'PA' },
    { code: 'gu-IN', name: 'Gujarati', label: 'GU' },
    { code: 'mr-IN', name: 'Marathi', label: 'MR' },
    { code: 'bn-IN', name: 'Bengali', label: 'BN' },
    { code: 'ml-IN', name: 'Malayalam', label: 'ML' },
  ];

  // Helper: Resize Image to reduce payload size (speeds up AI processing significantly)
  const resizeImage = (base64Str: string, maxWidth = 1024): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        // Compress to 0.7 quality JPEG
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const rawBase64 = reader.result as string;
        setImage(rawBase64); // Show immediately
        setResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileUpload = () => fileInputRef.current?.click();
  const triggerCamera = () => cameraInputRef.current?.click();

  const analyzeImage = async (promptType: 'pest' | 'deficiency') => {
    if (!image) return;
    setLoading(true);
    setResult(null);
    setLoadingMessage(promptType === 'pest' ? "Scanning for bugs & diseases..." : "Analyzing leaf health...");

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // 1. Optimize Image Size (Client-side)
      const optimizedImage = await resizeImage(image);
      const base64Data = optimizedImage.split(',')[1];
      const mimeType = 'image/jpeg'; // We converted to jpeg in resizeImage
      
      const selectedLangName = languages.find(l => l.code === language)?.name || 'English';

      // 2. Improved Expert Prompt
      const promptText = promptType === 'pest' 
        ? `You are an Expert Agricultural Scientist for Indian crops. 
           Analyze this image for pests, fungal diseases, or bacterial infections.
           Context: The user is an Indian farmer.
           Task:
           1. Identify the crop.
           2. Detect the specific disease or pest.
           3. Assess severity and probability.
           4. Provide 3 organic/chemical remedies available in India.
           
           Output JSON format: { name: string, severity: "Low"|"Medium"|"Critical", probability: "High"|"Medium", remedies: string[], prevention: string[], description: string }.
           Translate all text values to ${selectedLangName}.`
        : `You are an Expert Agronomist specializing in Plant Nutrition.
           Analyze this image for nutrient deficiencies (Nitrogen, Phosphorus, Potassium, Iron, etc.) or water stress.
           Context: The user is an Indian farmer.
           Task:
           1. Identify the crop.
           2. specific nutrient deficiency signs (yellowing, veins, etc).
           3. Assess severity.
           4. Provide 3 fertilizer recommendations (Organic/Chemical) common in India.
           
           Output JSON format: { name: string, severity: "Low"|"Medium"|"Critical", probability: "High"|"Medium", remedies: string[], prevention: string[], description: string }.
           Translate all text values to ${selectedLangName}.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash', // Flash is fast and good for vision
        contents: {
            parts: [
                { inlineData: { data: base64Data, mimeType: mimeType } },
                { text: promptText }
            ]
        },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    severity: { type: Type.STRING },
                    probability: { type: Type.STRING },
                    remedies: { type: Type.ARRAY, items: { type: Type.STRING } },
                    prevention: { type: Type.ARRAY, items: { type: Type.STRING } },
                    description: { type: Type.STRING }
                }
            }
        }
      });
      
      if (response.text) {
          const cleanText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
          try {
            const json = JSON.parse(cleanText);
            setResult(json);
          } catch (parseError) {
            console.error("JSON Parse Error:", parseError);
            // Fallback manual object if JSON fails
            setResult({
                name: "Analysis Complete (Raw)",
                severity: "Medium",
                probability: "Check manually",
                remedies: ["Consult local agri-expert", "Ensure proper drainage"],
                prevention: ["Monitor daily"],
                description: response.text.substring(0, 100) + "..."
            });
          }
      }

    } catch (error) {
      console.error("Analysis error:", error);
      alert("Could not connect to AgriBee Brain. Please check internet.");
    } finally {
      setLoading(false);
      setLoadingMessage("");
    }
  };

  // --- TTS HELPER FUNCTIONS ---
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
  // ----------------------------

  const speakResult = async () => {
    if (!result || speaking) return;
    setSpeaking(true);
    
    try {
        const text = `${result.name}. Severity: ${result.severity}. ${result.description || ''}. Remedies: ${result.remedies?.slice(0,2).join(', ')}`;
        
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-preview-tts',
            contents: [{ parts: [{ text: text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' },
                    },
                },
            },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) throw new Error("No audio generated");

        const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
        const outputNode = outputAudioContext.createGain();
        outputNode.connect(outputAudioContext.destination);

        const audioBuffer = await decodeAudioData(
            decode(base64Audio),
            outputAudioContext,
            24000,
            1
        );

        const source = outputAudioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(outputNode);
        source.start();
        
        source.onended = () => setSpeaking(false);

    } catch (e) {
        console.error("TTS Error", e);
        setSpeaking(false);
        // Fallback to browser speech
        const text = `${result.name}. Severity: ${result.severity}`;
        const utterance = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.speak(utterance);
    }
  };

  // Filter database logic
  const filteredCrops = CROP_DATABASE.filter(c => 
    c.name.toLowerCase().includes(dbSearchQuery.toLowerCase()) ||
    c.scientificName.toLowerCase().includes(dbSearchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-10 font-poppins">
      {/* Header Section */}
      <div className="relative bg-gradient-to-b from-[#1C6E3E] to-[#2D8A52] pt-6 pb-16 px-5 rounded-b-[3rem] shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <SideMenu onNavigate={onNavigate} currentPage={currentTab} whiteIcon={true} userName={userName} />
          
          <h1 className="text-2xl font-bold text-white tracking-wide">AgriBee</h1>
          
          {/* Language Selector */}
          <div className="relative z-50">
            <button 
                onClick={() => setShowLangMenu(!showLangMenu)} 
                className="text-white hover:text-white p-1.5 rounded-full flex items-center space-x-1 bg-white/20 backdrop-blur-md border border-white/20 shadow-sm pr-3 active:scale-95 transition-transform"
            >
                <Globe size={18} className="ml-1" />
                <span className="text-xs font-bold uppercase tracking-wide">{languages.find(l => l.code === language)?.label}</span>
                <ChevronDown size={14} className={`transition-transform duration-200 ${showLangMenu ? 'rotate-180' : ''}`} />
            </button>
            
            {showLangMenu && (
              <div className="absolute right-0 top-12 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-fade-in">
                <div className="max-h-60 overflow-y-auto py-2">
                    {languages.map((lang) => (
                        <button
                            key={lang.code}
                            onClick={() => {
                                setLanguage(lang.code);
                                setShowLangMenu(false);
                            }}
                            className={`w-full px-4 py-2.5 text-left text-sm flex items-center justify-between hover:bg-green-50 transition-colors ${language === lang.code ? 'text-green-700 font-bold bg-green-50/50' : 'text-gray-700'}`}
                        >
                            <span>{lang.name}</span>
                            {language === lang.code && <Check size={14} className="text-green-600" />}
                        </button>
                    ))}
                </div>
              </div>
            )}
            {showLangMenu && (
                <div className="fixed inset-0 z-[-1]" onClick={() => setShowLangMenu(false)} />
            )}
          </div>
        </div>
        <div className="text-center">
            <h2 className="text-3xl font-bold text-white drop-shadow-md mb-2">Scan Your Crop</h2>
            <p className="text-green-100 text-sm opacity-80">Detect pests, diseases & deficiencies instantly</p>
        </div>
      </div>

      {/* Main Content Container - Pulled up to overlap header */}
      <div className="px-5 -mt-8 relative z-10">
        
        {/* Scanner Box */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-4 border border-white/50 overflow-hidden">
          
          {/* Image Preview Area */}
          <div className="relative w-full aspect-[4/3] bg-gray-100 rounded-2xl border-2 border-dashed border-green-300/50 flex flex-col items-center justify-center overflow-hidden group mb-6 shadow-inner">
            {image ? (
              <img src={image} alt="Crop Preview" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center p-6">
                <Leaf className="w-16 h-16 text-green-200 mx-auto mb-3" />
                <p className="text-gray-400 text-sm font-medium">Position crop within frame</p>
              </div>
            )}
            
            {/* Focus Rectangle Overlay */}
            <div className="absolute inset-12 border-2 border-white/60 rounded-lg pointer-events-none opacity-70">
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-white"></div>
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-white"></div>
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-white"></div>
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-white"></div>
            </div>

            {/* SCANNING ANIMATION OVERLAY */}
            {loading && (
                <div className="absolute inset-0 z-20 pointer-events-none">
                    {/* Moving Laser Line */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-green-400 shadow-[0_0_15px_rgba(74,222,128,1)] animate-scan-laser opacity-80"></div>
                    
                    {/* Grid Effect */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(34,197,94,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(34,197,94,0.1)_1px,transparent_1px)] bg-[length:20px_20px] animate-pulse"></div>
                    
                    {/* Text Overlay */}
                    <div className="absolute bottom-4 left-0 right-0 text-center">
                        <span className="inline-flex items-center px-3 py-1 bg-black/60 rounded-full text-green-400 text-xs font-mono font-bold">
                            <Loader2 size={12} className="animate-spin mr-2" />
                            {loadingMessage}
                        </span>
                    </div>
                </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between px-2 pb-2">
             {/* Upload Button (Gallery) */}
             <button 
                onClick={triggerFileUpload}
                disabled={loading}
                className="flex flex-col items-center justify-center space-y-1 text-gray-500 hover:text-green-600 transition-colors disabled:opacity-50"
             >
                <div className="bg-gray-100 p-3 rounded-full shadow-sm active:bg-gray-200 transition-colors">
                    <ImageIcon size={20} />
                </div>
                <span className="text-[10px] font-medium">Gallery</span>
             </button>
             <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

             {/* Camera Button */}
             <button 
                onClick={triggerCamera}
                disabled={loading}
                className="bg-green-500 hover:bg-green-600 text-white p-5 rounded-full shadow-lg shadow-green-400/40 transform transition-transform active:scale-90 border-4 border-green-100 disabled:opacity-50 disabled:scale-100"
             >
                {loading ? <Scan size={32} className="animate-pulse" /> : <Camera size={32} />}
             </button>
             <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />

             {/* Flash Button (Visual) */}
             <button disabled={loading} className="flex flex-col items-center justify-center space-y-1 text-gray-500 hover:text-yellow-500 transition-colors disabled:opacity-50">
                <div className="bg-gray-100 p-3 rounded-full shadow-sm active:bg-gray-200 transition-colors">
                    <Zap size={20} />
                </div>
                <span className="text-[10px] font-medium">Flash</span>
             </button>
          </div>
        </div>

        {/* AI Analysis Section */}
        <div className="mt-6 bg-white rounded-3xl shadow-lg p-5 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-800 text-lg">AI Analysis</h3>
                <div className="bg-green-100 p-1.5 rounded-lg">
                    <Bug size={18} className="text-green-700" />
                </div>
            </div>

            {result ? (
                <div className="bg-green-50 rounded-xl p-4 border border-green-100 animate-fade-in">
                    <div className="flex justify-between items-start">
                        <h4 className="font-bold text-green-800 text-lg capitalize pr-2">{result.name}</h4>
                        <button onClick={speakResult} className="p-2 bg-white rounded-full shadow-sm text-green-700 hover:bg-green-100 transition-colors active:scale-95">
                            {speaking ? <Loader2 size={18} className="animate-spin" /> : <Volume2 size={18} />}
                        </button>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mt-2 mb-3">
                        <span className={`text-xs px-2 py-1 rounded-md font-medium ${
                            result.severity.toLowerCase().includes('high') || result.severity.toLowerCase().includes('critical') ? 'bg-red-100 text-red-700' : 
                            result.severity.toLowerCase().includes('medium') ? 'bg-yellow-100 text-yellow-700' : 
                            'bg-green-200 text-green-800'
                        }`}>
                            Severity: {result.severity}
                        </span>
                        <span className="text-xs px-2 py-1 rounded-md font-medium bg-blue-100 text-blue-700">
                           Prob: {result.probability}
                        </span>
                    </div>

                    <div className="space-y-3">
                        {result.description && (
                            <p className="text-sm text-gray-600 leading-relaxed bg-white/60 p-2 rounded-lg border border-green-100">
                                {result.description}
                            </p>
                        )}

                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase mb-1">Remedies</p>
                            <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                                {result.remedies && result.remedies.length > 0 ? (
                                    result.remedies.slice(0, 3).map((r, i) => <li key={i}>{r}</li>)
                                ) : (
                                    <li className="text-gray-500 italic">No specific remedies found.</li>
                                )}
                            </ul>
                        </div>
                        
                        {result.prevention && result.prevention.length > 0 && (
                             <div>
                                <p className="text-xs font-bold text-gray-500 uppercase mb-1">Prevention</p>
                                <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                                    {result.prevention.slice(0, 2).map((p, i) => <li key={i}>{p}</li>)}
                                </ul>
                            </div>
                        )}
                    </div>
                    <button 
                        onClick={() => setResult(null)} 
                        className="mt-4 w-full py-2.5 text-xs text-green-700 font-bold hover:bg-green-100 rounded-xl transition-colors border border-green-200"
                    >
                        Scan Another Crop
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-3">
                    <button 
                        onClick={() => analyzeImage('pest')}
                        disabled={!image || loading}
                        className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all active:scale-95 ${
                            !image ? 'opacity-50 cursor-not-allowed bg-gray-50 border-gray-200' :
                            loading ? 'bg-green-50 border-green-200' :
                            'bg-green-50 border-green-200 hover:bg-green-100 hover:border-green-300 hover:shadow-md'
                        }`}
                    >
                        {loading ? <Loader2 className="animate-spin text-green-600 mb-2" /> : <Bug className="text-green-600 mb-2" />}
                        <span className="text-sm font-bold text-green-800 text-center leading-tight">Identify Pest / Disease</span>
                    </button>
                    <button 
                        onClick={() => analyzeImage('deficiency')}
                        disabled={!image || loading}
                        className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all active:scale-95 ${
                            !image ? 'opacity-50 cursor-not-allowed bg-gray-50 border-gray-200' :
                            loading ? 'bg-green-50 border-green-200' :
                            'bg-green-50 border-green-200 hover:bg-green-100 hover:border-green-300 hover:shadow-md'
                        }`}
                    >
                        {loading ? <Loader2 className="animate-spin text-green-600 mb-2" /> : <Leaf className="text-green-600 mb-2" />}
                        <span className="text-sm font-bold text-green-800 text-center leading-tight">Nutrient Check</span>
                    </button>
                </div>
            )}
        </div>

        {/* Local Database Section */}
        <div className="mt-6 bg-white rounded-3xl shadow-lg p-5 border border-gray-100 mb-8">
             <h3 className="font-bold text-gray-800 text-lg mb-4">Local Database</h3>
             <div className="flex items-center bg-gray-100 rounded-xl p-3 mb-4 focus-within:ring-2 focus-within:ring-green-200 transition-all">
                <Search size={20} className="text-gray-400 mr-3" />
                <input 
                    type="text" 
                    placeholder="Search crops (e.g., Wheat)..." 
                    className="bg-transparent w-full outline-none text-gray-700 placeholder-gray-400" 
                    value={dbSearchQuery}
                    onChange={(e) => {
                        setDbSearchQuery(e.target.value);
                        if(e.target.value) setShowDatabase(true);
                    }}
                />
                {dbSearchQuery && (
                    <button onClick={() => {setDbSearchQuery(''); setShowDatabase(false);}}><X size={16} className="text-gray-400"/></button>
                )}
             </div>
             
             {!showDatabase ? (
                 <button 
                    onClick={() => setShowDatabase(true)}
                    className="w-full bg-green-600 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-green-200 hover:bg-green-700 transition-colors active:scale-95"
                 >
                    Browse Common Crops
                 </button>
             ) : (
                 <div className="space-y-3 animate-fade-in">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-gray-400 uppercase">{filteredCrops.length} Crops Found</span>
                        <button onClick={() => setShowDatabase(false)} className="text-xs text-red-500 font-bold hover:underline">Close</button>
                    </div>
                    <div className="max-h-60 overflow-y-auto pr-1 space-y-2">
                        {filteredCrops.map(crop => (
                            <div 
                                key={crop.id}
                                onClick={() => setSelectedDbCrop(crop)}
                                className="flex items-center p-2 bg-gray-50 rounded-xl border border-gray-100 hover:bg-green-50 hover:border-green-200 cursor-pointer transition-all"
                            >
                                <img src={crop.image} alt={crop.name} className="w-12 h-12 rounded-lg object-cover mr-3" />
                                <div>
                                    <h4 className="font-bold text-gray-800 text-sm">{crop.name}</h4>
                                    <p className="text-[10px] text-gray-500 italic">{crop.scientificName}</p>
                                </div>
                            </div>
                        ))}
                        {filteredCrops.length === 0 && (
                            <p className="text-center text-gray-400 text-sm py-4">No crops found.</p>
                        )}
                    </div>
                 </div>
             )}
        </div>

      </div>
      
      {/* Database Detail Modal */}
      {selectedDbCrop && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedDbCrop(null)} />
              <div className="bg-white w-full max-w-md rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl relative animate-slide-up overflow-hidden max-h-[90vh] overflow-y-auto">
                  <div className="relative h-48">
                      <img src={selectedDbCrop.image} alt={selectedDbCrop.name} className="w-full h-full object-cover" />
                      <button onClick={() => setSelectedDbCrop(null)} className="absolute top-4 right-4 bg-black/30 text-white p-2 rounded-full backdrop-blur-md hover:bg-black/50">
                          <X size={20} />
                      </button>
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-16">
                          <h2 className="text-white text-2xl font-bold">{selectedDbCrop.name}</h2>
                          <p className="text-white/80 text-sm italic">{selectedDbCrop.scientificName}</p>
                      </div>
                  </div>
                  <div className="p-6 space-y-4">
                      <div className="flex space-x-2">
                          <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                              Season: {selectedDbCrop.season}
                          </span>
                      </div>
                      <div>
                          <h3 className="font-bold text-gray-800 mb-1">Description</h3>
                          <p className="text-sm text-gray-600 leading-relaxed">{selectedDbCrop.description}</p>
                      </div>
                      <div>
                          <h3 className="font-bold text-gray-800 mb-2">Common Diseases</h3>
                          <div className="flex flex-wrap gap-2">
                              {selectedDbCrop.commonDiseases.map((d, i) => (
                                  <span key={i} className="px-3 py-1 bg-red-50 text-red-600 text-xs font-medium rounded-lg border border-red-100">
                                      {d}
                                  </span>
                              ))}
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      <AIChatBot />
      
      <style>{`
        @keyframes scan-laser {
            0% { top: 0%; }
            50% { top: 100%; }
            100% { top: 0%; }
        }
        .animate-scan-laser {
            animation: scan-laser 2.5s linear infinite;
        }
      `}</style>
    </div>
  );
};

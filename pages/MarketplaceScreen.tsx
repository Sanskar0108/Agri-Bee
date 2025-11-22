import React, { useState, useEffect, useRef, useMemo } from 'react';
import { GoogleGenAI } from '@google/genai';
import { SideMenu } from '../components/SideMenu';
import { AIChatBot } from '../components/AIChatBot';
import { Page } from '../App';
import { 
  Search, Filter, MapPin, Star, Volume2, Languages, 
  CloudSun, TrendingUp, TrendingDown, Phone, MessageCircle, 
  Leaf, Tractor, Sprout, ShoppingBag, X, Plus, Loader2, Mic, Check, User, ArrowRight, MicOff, Send
} from 'lucide-react';

interface MarketplaceScreenProps {
  onNavigate: (page: Page) => void;
  currentTab: string;
  userName?: string;
  userLocation?: string;
}

interface Product {
  id: number;
  name: string;
  price: number;
  unit: string;
  location: string;
  image: string;
  rating: number;
  category: string;
  seller: string;
  description: string;
  quality: string;
}

interface MandiRate {
  crop: string;
  price: number;
  change: number;
  market: string;
  details?: string;
}

interface NearbyBuyer {
  name: string;
  distance: string;
  interest: string;
  avatar: string;
  role: string;
}

interface ChatMessage {
  id: number;
  text: string;
  sender: 'me' | 'them';
  time: string;
}

const LANGUAGES = [
  { code: 'en-US', name: 'English', label: 'EN' },
  { code: 'hi-IN', name: 'Hindi', label: 'HI' },
  { code: 'mr-IN', name: 'Marathi', label: 'MR' },
  { code: 'te-IN', name: 'Telugu', label: 'TE' },
  { code: 'ta-IN', name: 'Tamil', label: 'TA' },
  { code: 'kn-IN', name: 'Kannada', label: 'KN' },
  { code: 'gu-IN', name: 'Gujarati', label: 'GU' },
  { code: 'pa-IN', name: 'Punjabi', label: 'PA' },
];

// --- DATA TRANSLATION DATABASE ---
const TRANSLATIONS: Record<string, Record<string, string>> = {
  'hi-IN': {
    // UI
    'Market Place': 'बाज़ार (Market)',
    'Buy, Sell & Trade Crops': 'फसल खरीदें और बेचें',
    'Search items...': 'वस्तुएं खोजें...',
    'Categories': 'श्रेणियाँ',
    'Featured Products': 'मुख्य उत्पाद',
    'View': 'देखें',
    'Sell Your Crop': 'फसल बेचें',
    'Nearby Interested Buyers': 'नज़दीकी खरीदार',
    'Sort By': 'क्रमबद्ध करें',
    'Price: Low to High': 'कीमत: कम से ज्यादा',
    'Price: High to Low': 'कीमत: ज्यादा से कम',
    'Top Rated': 'शीर्ष रेटेड',
    'All': 'सभी',
    'Seeds': 'बीज',
    'Fertilizers': 'उर्वरक',
    'Equipment': 'उपकरण',
    'Buy Crops': 'फसल खरीदें',
    'Product Details': 'उत्पाद विवरण',
    'Quality': 'गुणवत्ता',
    'Seller': 'विक्रेता',
    'Call Seller': 'विक्रेता को कॉल करें',
    'Chat': 'चैट करें',
    'AgriBee AI Insights': 'एग्रीबी एआई सुझाव',
    'Mandi Rates': 'मंडी भाव',
    
    // Products
    'Sharbati Wheat Seeds': 'शरबती गेहूं के बीज',
    'High quality Sharbati wheat seeds, treated for pest resistance. Expected yield 15-18 quintal/acre.': 'उच्च गुणवत्ता वाले शरबती गेहूं के बीज, कीट प्रतिरोध के लिए उपचारित। अपेक्षित उपज 15-18 क्विंटल/एकर।',
    'Organic Urea Substitute': 'जैविक यूरिया विकल्प',
    '100% organic nitrogen supplement. Safe for soil, improves water retention.': '100% जैविक नाइट्रोजन पूरक। मिट्टी के लिए सुरक्षित, जल प्रतिधारण में सुधार करता है।',
    'Agri Drone Sprayer (Rent)': 'एग्री ड्रोन स्प्रेयर (किराया)',
    '10L tank capacity drone for pesticide spraying. Pilot included.': 'कीटनाशक छिड़काव के लिए 10L टैंक क्षमता वाला ड्रोन। पायलट शामिल।',
    'Fresh Tomato Hybrid': 'ताजा टमाटर हाइब्रिड',
    'Freshly harvested hybrid tomatoes. Thick skin, good for transport.': 'ताजा कटे हुए हाइब्रिड टमाटर। मोटी त्वचा, परिवहन के लिए अच्छा।',
    'Mini Tractor 25HP': 'मिनी ट्रैक्टर 25HP',
    'Compact tractor suitable for small farms and orchards. Low diesel consumption.': 'छोटे खेतों और बगीचों के लिए उपयुक्त कॉम्पैक्ट ट्रैक्टर। कम डीजल की खपत।',
    'Neem Cake Fertilizer': 'नीम की खली',
    'Pure neem cake, acts as fertilizer and natural pesticide.': 'शुद्ध नीम की खली, उर्वरक और प्राकृतिक कीटनाशक के रूप में कार्य करती है।',

    // Mandi Crops
    'Wheat': 'गेहूं',
    'Soybean': 'सोयाबीन',
    'Chana': 'चना',
    'Cotton': 'कपास',
    'Mustard': 'सरसों',
    
    // Roles
    'Trader': 'व्यापारी',
    'Farmer': 'किसान',
    'Buyer': 'खरीदार'
  },
  'mr-IN': {
    // UI
    'Market Place': 'बाजार पेठ',
    'Buy, Sell & Trade Crops': 'पिकांची खरेदी विक्री',
    'Search items...': 'शोध...',
    'Categories': 'श्रेण्या',
    'Featured Products': 'वैशिष्ट्यपूर्ण उत्पादने',
    'View': 'पहा',
    'Sell Your Crop': 'पीक विक्री करा',
    'Nearby Interested Buyers': 'जवळचे खरेदीदार',
    'Sort By': 'क्रमवारी लावा',
    'Price: Low to High': 'किंमत: कमी ते जास्त',
    'Price: High to Low': 'किंमत: जास्त ते कमी',
    'Top Rated': 'सर्वाधिक रेट केलेले',
    'All': 'सर्व',
    'Seeds': 'बियाणे',
    'Fertilizers': 'खते',
    'Equipment': 'उपकरणे',
    'Buy Crops': 'पीक खरेदी',
    'Product Details': 'उत्पादन तपशील',
    'Quality': 'गुणवत्ता',
    'Seller': 'विक्रेता',
    'Call Seller': 'विक्रेत्याला कॉल करा',
    'Chat': 'चॅट',
    'AgriBee AI Insights': 'अॅग्रीबी एआय सल्ला',
    'Mandi Rates': 'बाजार भाव',

    // Products
    'Sharbati Wheat Seeds': 'शर्बती गव्हाचे बियाणे',
    'High quality Sharbati wheat seeds, treated for pest resistance. Expected yield 15-18 quintal/acre.': 'उच्च दर्जाचे शर्बती गव्हाचे बियाणे, कीड प्रतिकारशक्तीसाठी प्रक्रिया केलेले. अपेक्षित उत्पादन 15-18 क्विंटल/एकर.',
    'Organic Urea Substitute': 'सेंद्रिय युरिया पर्याय',
    '100% organic nitrogen supplement. Safe for soil, improves water retention.': '100% सेंद्रिय नायट्रोजन पूरक. जमिनीसाठी सुरक्षित, पाणी धरून ठेवण्याची क्षमता वाढवते.',
    'Agri Drone Sprayer (Rent)': 'एग्री ड्रोन फवारणी (भाड्याने)',
    '10L tank capacity drone for pesticide spraying. Pilot included.': 'कीटकनाशक फवारणीसाठी 10L टाकी क्षमता असलेला ड्रोन. पायलट समाविष्ट.',
    'Fresh Tomato Hybrid': 'ताजे टोमॅटो हायब्रीड',
    'Freshly harvested hybrid tomatoes. Thick skin, good for transport.': 'ताजे काढलेले हायब्रीड टोमॅटो. जाड साल, वाहतुकीसाठी चांगले.',
    'Mini Tractor 25HP': 'मिनी ट्रॅक्टर 25HP',
    'Compact tractor suitable for small farms and orchards. Low diesel consumption.': 'लहान शेती आणि बागांसाठी योग्य कॉम्पॅक्ट ट्रॅक्टर. कमी डिझेल वापर.',
    'Neem Cake Fertilizer': 'लिंबोळी पेंड',
    'Pure neem cake, acts as fertilizer and natural pesticide.': 'शुद्ध नीम पेंड, खत आणि नैसर्गिक कीटकनाशक म्हणून काम करते.',

    // Mandi Crops
    'Wheat': 'गहू',
    'Soybean': 'सोयाबीन',
    'Chana': 'हरभरा',
    'Cotton': 'कापूस',
    'Mustard': 'मोहरी',

    // Roles
    'Trader': 'व्यापारी',
    'Farmer': 'शेतकरी',
    'Buyer': 'खरेदीदार'
  },
  'te-IN': {
    'Market Place': 'మార్కెట్',
    'Buy, Sell & Trade Crops': 'పంటల కొనుగోలు & అమ్మకం',
    'Search items...': 'వెతకండి...',
    'Categories': 'విభాగాలు',
    'Featured Products': 'ముఖ్యమైన ఉత్పత్తులు',
    'View': 'చూడండి',
    'Sell Your Crop': 'పంటను అమ్మండి',
    'Nearby Interested Buyers': 'దగ్గరి కొనుగోలుదారులు',
    'All': 'అన్నీ',
    'Seeds': 'విత్తనాలు',
    'Fertilizers': 'ఎరువులు',
    'Equipment': 'పరికరాలు',
    'Buy Crops': 'పంటలు కొనండి',
    'Wheat': 'గోధుమ',
    'Cotton': 'పత్తి',
    'Product Details': 'ఉత్పత్తి వివరాలు',
    'Call Seller': 'విక్రేతకు కాల్ చేయండి',
  }
};

const BASE_CATEGORIES = [
  { id: 'all', name: 'All', icon: ShoppingBag },
  { id: 'seeds', name: 'Seeds', icon: Sprout },
  { id: 'fertilizers', name: 'Fertilizers', icon: Leaf },
  { id: 'equipment', name: 'Equipment', icon: Tractor },
  { id: 'produce', name: 'Buy Crops', icon: ShoppingBag },
];

const BASE_MANDI_RATES: MandiRate[] = [
  { crop: 'Wheat', price: 2125, change: 25, market: 'Neemuch Mandi', details: 'Neemuch APMC Yard, MP. Top commodity: Wheat, Garlic, Coriander.' },
  { crop: 'Soybean', price: 4850, change: -15, market: 'Indore Mandi', details: 'Indore Laxmibai Nagar Mandi. Major trading hub for Soybean and Pulses.' },
  { crop: 'Chana', price: 5200, change: 40, market: 'Latur Mandi', details: 'Latur APMC, Maharashtra. Largest Pulse market in Marathwada.' },
  { crop: 'Cotton', price: 6100, change: 100, market: 'Akola Mandi', details: 'Akola Cotton Market. Known for high quality fiber cotton trades.' },
  { crop: 'Mustard', price: 5450, change: -30, market: 'Jaipur Mandi', details: 'Jaipur Terminal Market, Rajasthan. Key hub for oilseeds.' },
];

const BASE_NEARBY_BUYERS: NearbyBuyer[] = [
  { name: 'Ramesh Gupta', distance: '2 km', interest: 'Wheat (50 Quintal)', avatar: 'https://i.pravatar.cc/150?img=11', role: 'Trader' },
  { name: 'Suresh Patil', distance: '5.5 km', interest: 'Soybean', avatar: 'https://i.pravatar.cc/150?img=12', role: 'Farmer' },
  { name: 'Anita Devi', distance: '3 km', interest: 'Organic Vegetables', avatar: 'https://i.pravatar.cc/150?img=5', role: 'Buyer' },
  { name: 'Vikram Singh', distance: '8 km', interest: 'Cotton', avatar: 'https://i.pravatar.cc/150?img=60', role: 'Trader' },
  { name: 'Meera Farm Foods', distance: '12 km', interest: 'Tomato', avatar: 'https://i.pravatar.cc/150?img=9', role: 'Buyer' },
  { name: 'Rajesh Kumar', distance: '4 km', interest: 'Mustard', avatar: 'https://i.pravatar.cc/150?img=33', role: 'Trader' },
];

const BASE_PRODUCTS: Product[] = [
  {
    id: 1,
    name: 'Sharbati Wheat Seeds',
    price: 3200,
    unit: 'quintal',
    location: 'Sehore, MP',
    image: 'https://picsum.photos/seed/wheatseeds/300/300',
    rating: 4.8,
    category: 'seeds',
    seller: 'Ramesh Patel',
    description: 'High quality Sharbati wheat seeds, treated for pest resistance. Expected yield 15-18 quintal/acre.',
    quality: 'Grade A Certified'
  },
  {
    id: 2,
    name: 'Organic Urea Substitute',
    price: 450,
    unit: 'bag (50kg)',
    location: 'Pune, MH',
    image: 'https://picsum.photos/seed/urea/300/300',
    rating: 4.5,
    category: 'fertilizers',
    seller: 'Green Earth Agro',
    description: '100% organic nitrogen supplement. Safe for soil, improves water retention.',
    quality: 'Organic Certified'
  },
  {
    id: 3,
    name: 'Agri Drone Sprayer (Rent)',
    price: 500,
    unit: 'hour',
    location: 'Nashik, MH',
    image: 'https://picsum.photos/seed/drone/300/300',
    rating: 4.9,
    category: 'equipment',
    seller: 'SkyTech Agri',
    description: '10L tank capacity drone for pesticide spraying. Pilot included.',
    quality: 'High Tech'
  },
  {
    id: 4,
    name: 'Fresh Tomato Hybrid',
    price: 1500,
    unit: 'crate',
    location: 'Kolar, KA',
    image: 'https://picsum.photos/seed/tomatoes/300/300',
    rating: 4.7,
    category: 'produce',
    seller: 'Venkatesh Farmers',
    description: 'Freshly harvested hybrid tomatoes. Thick skin, good for transport.',
    quality: 'Export Quality'
  },
  {
    id: 5,
    name: 'Mini Tractor 25HP',
    price: 450000,
    unit: 'piece',
    location: 'Rajkot, GJ',
    image: 'https://picsum.photos/seed/tractor/300/300',
    rating: 4.6,
    category: 'equipment',
    seller: 'Mahindra Dealer',
    description: 'Compact tractor suitable for small farms and orchards. Low diesel consumption.',
    quality: 'Brand New'
  },
  {
    id: 6,
    name: 'Neem Cake Fertilizer',
    price: 800,
    unit: 'bag',
    location: 'Salem, TN',
    image: 'https://picsum.photos/seed/neem/300/300',
    rating: 4.3,
    category: 'fertilizers',
    seller: 'Natural Organics',
    description: 'Pure neem cake, acts as fertilizer and natural pesticide.',
    quality: 'Standard'
  }
];

export const MarketplaceScreen: React.FC<MarketplaceScreenProps> = ({ onNavigate, currentTab, userName, userLocation }) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [language, setLanguage] = useState('en-US');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showSellModal, setShowSellModal] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [analyzing, setAnalyzing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState<'none' | 'price_low' | 'price_high' | 'rating'>('none');
  const [sellFormDescription, setSellFormDescription] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [locationCheck, setLocationCheck] = useState<string>('');
  const [checkingLocation, setCheckingLocation] = useState(false);
  
  // Sell Form State
  const [sellFormCropName, setSellFormCropName] = useState('');
  const [sellFormPrice, setSellFormPrice] = useState('');
  const [sellFormQuantity, setSellFormQuantity] = useState('');
  const [sellFormUnit, setSellFormUnit] = useState('quintal');
  const [sellFormCustomUnit, setSellFormCustomUnit] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  
  const [selectedMandi, setSelectedMandi] = useState<MandiRate | null>(null);
  
  // Chat State
  const [activeChatSeller, setActiveChatSeller] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  const recognitionRef = useRef<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (showSellModal) {
        setSellFormCropName('');
        setSellFormPrice('');
        setSellFormQuantity('');
        setSellFormDescription('');
        setSellFormUnit('quintal');
        setSellFormCustomUnit('');
        setIsPosting(false);
    }
  }, [showSellModal]);

  // Scroll to bottom of chat
  useEffect(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, activeChatSeller]);

  // Translation Helper
  const t = (text: string): string => {
    const langMap = TRANSLATIONS[language];
    return (langMap && langMap[text]) ? langMap[text] : text;
  };

  // Derived Data - Updates instantly when language changes
  const products = useMemo(() => {
    return BASE_PRODUCTS.map(p => ({
      ...p,
      name: t(p.name),
      description: t(p.description)
    }));
  }, [language]);

  const categories = useMemo(() => {
    return BASE_CATEGORIES.map(c => ({
      ...c,
      name: t(c.name)
    }));
  }, [language]);

  const mandiRates = useMemo(() => {
    return BASE_MANDI_RATES.map(m => ({
      ...m,
      crop: t(m.crop)
    }));
  }, [language]);

  const nearbyBuyers = useMemo(() => {
    if (!sellFormCropName) return [];

    const term = sellFormCropName.toLowerCase();
    // Filter based on interest matching crop name
    const filtered = BASE_NEARBY_BUYERS.filter(b => {
        const interest = b.interest.toLowerCase();
        // Basic inclusion check
        if (interest.includes(term)) return true;
        // Some basic synonym mapping for demo purposes
        if (term.includes('tomato') && interest.includes('vegetable')) return true;
        if (term.includes('vegetable') && interest.includes('tomato')) return true;
        return false;
    });
    
    return filtered.map(b => ({
      ...b,
      role: t(b.role)
    }));
  }, [language, sellFormCropName]);


  // Speech to Text logic
  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Voice input is not supported in this browser.");
      return;
    }
    
    setIsListening(true);
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    
    recognition.lang = language;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSellFormDescription((prev) => prev + (prev ? ' ' : '') + transcript);
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  // Filter products
  const filteredProducts = products.filter(p => 
    (selectedCategory === 'all' || p.category === selectedCategory) &&
    (p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.description.toLowerCase().includes(searchQuery.toLowerCase()))
  ).sort((a, b) => {
    if (filterType === 'price_low') return a.price - b.price;
    if (filterType === 'price_high') return b.price - a.price;
    if (filterType === 'rating') return b.rating - a.rating;
    return 0;
  });

  const speakText = (text: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang === language) || voices.find(v => v.lang.startsWith(language.split('-')[0]));
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
  };

  const analyzeProduct = async (product: Product) => {
    setAnalyzing(true);
    setAiAnalysis('');
    setLocationCheck('');
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Act as an agricultural expert. Analyze this deal: Product: ${product.name}, Price: ₹${product.price}/${product.unit}, Location: ${product.location}. 
      1. Is this a fair price? Compare with current market rates online.
      2. Brief benefit. 
      Keep it concise (under 40 words). Answer in ${LANGUAGES.find(l => l.code === language)?.name || 'English'}.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [{ text: prompt }] },
        // Search Grounding included for accurate price check
        config: { tools: [{ googleSearch: {} }] }
      });
      setAiAnalysis(response.text || 'Analysis unavailable.');
    } catch (e) {
      setAiAnalysis('Analysis unavailable offline.');
    } finally {
      setAnalyzing(false);
    }
  };

  const checkLocation = async (location: string) => {
    setCheckingLocation(true);
    setLocationCheck('');
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `Verify the location: "${location}". Provide brief details about this place (State, District, major crops).`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [{ text: prompt }] },
            // Maps Grounding included
            config: { tools: [{ googleMaps: {} }] }
        });
        setLocationCheck(response.text || "Location verified.");
    } catch (e) {
        setLocationCheck("Could not verify location.");
    } finally {
        setCheckingLocation(false);
    }
  };

  useEffect(() => {
    if (selectedProduct) {
      analyzeProduct(selectedProduct);
    }
  }, [selectedProduct]);

  // --- ACTION HANDLERS ---

  const handleCall = (name: string) => {
    const dummyNumber = "9876543210";
    // Native prompt to simulate opening phone
    const confirmCall = window.confirm(`Call ${name} (+91 ${dummyNumber})?`);
    if (confirmCall) {
        window.location.href = `tel:${dummyNumber}`;
    }
  };

  const handleOpenChat = (name: string) => {
    setActiveChatSeller(name);
    // Load dummy initial messages
    setChatMessages([
        { id: 1, text: `Hi, I'm interested in your listing. Is it still available?`, sender: 'me', time: '10:00 AM' },
        { id: 2, text: `Hello! Yes, it is available. Are you looking to buy in bulk?`, sender: 'them', time: '10:05 AM' }
    ]);
  };

  const handleSendChatMessage = () => {
    if (!chatInput.trim()) return;
    
    const newMessage: ChatMessage = {
        id: Date.now(),
        text: chatInput,
        sender: 'me',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setChatMessages(prev => [...prev, newMessage]);
    setChatInput('');

    // Simulate reply
    setTimeout(() => {
        const reply: ChatMessage = {
            id: Date.now() + 1,
            text: "Okay, great! Let me know if you have any other questions.",
            sender: 'them',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setChatMessages(prev => [...prev, reply]);
    }, 1500);
  };

  const handlePostListing = () => {
      if (!sellFormCropName || !sellFormPrice || !sellFormQuantity) {
          alert("Please fill in all required fields.");
          return;
      }
      setIsPosting(true);
      setTimeout(() => {
          setIsPosting(false);
          alert("Listing Posted Successfully! Your crop is now live.");
          setShowSellModal(false);
      }, 1500);
  };


  // Determine if buyers section should be visible
  const showBuyers = sellFormCropName.trim() !== '' && sellFormPrice.trim() !== '' && sellFormQuantity.trim() !== '';

  return (
    <div className="min-h-screen bg-gray-50 pb-10 font-poppins">
      
      {/* Header */}
      <div className="bg-[#1FAF55] pt-6 pb-4 px-5 rounded-b-[2rem] shadow-lg relative z-10 transition-all">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
             <SideMenu onNavigate={onNavigate} currentPage={currentTab} whiteIcon={true} userName={userName} />
             <div className="ml-2">
                <h1 className="text-2xl font-bold text-white">{t('Market Place')}</h1>
                <p className="text-green-100 text-xs opacity-90">{t('Buy, Sell & Trade Crops')}</p>
             </div>
          </div>
          <div className="flex flex-col items-end text-white">
            <CloudSun size={24} className="mb-1 text-yellow-300" />
            <span className="text-lg font-bold leading-none">28°C</span>
            <span className="text-[10px] opacity-80 truncate max-w-[80px]">{userLocation || "My Farm"}</span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex items-center space-x-2 mb-4">
          {/* Explicit bg-white and text colors to prevent dark mode issues */}
          <div className="bg-white rounded-2xl p-2 flex items-center shadow-md flex-1 border border-white">
            <Search className="text-gray-400 ml-2" size={20} />
            <input 
              type="text" 
              placeholder={t('Search items...')}
              className="flex-1 px-3 py-1 outline-none text-gray-800 placeholder-gray-400 w-full bg-transparent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="relative">
            <button 
              onClick={() => setShowFilters(!showFilters)} 
              className={`p-3 rounded-xl text-white shadow-md transition-colors ${showFilters ? 'bg-yellow-500' : 'bg-green-700'}`}
            >
              <Filter size={20} />
            </button>
            {showFilters && (
              <div className="absolute right-0 top-12 bg-white p-2 rounded-xl shadow-xl w-40 z-20 border border-gray-100 animate-fade-in">
                 <p className="text-xs font-bold text-gray-400 px-2 mb-2">{t('Sort By')}</p>
                 <button onClick={() => setFilterType('price_low')} className={`w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-gray-50 ${filterType === 'price_low' ? 'text-green-600 font-bold' : 'text-gray-700'}`}>{t('Price: Low to High')}</button>
                 <button onClick={() => setFilterType('price_high')} className={`w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-gray-50 ${filterType === 'price_high' ? 'text-green-600 font-bold' : 'text-gray-700'}`}>{t('Price: High to Low')}</button>
                 <button onClick={() => setFilterType('rating')} className={`w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-gray-50 ${filterType === 'rating' ? 'text-green-600 font-bold' : 'text-gray-700'}`}>{t('Top Rated')}</button>
              </div>
            )}
          </div>
        </div>

        {/* Language Switcher */}
        <div className="flex items-center justify-end space-x-2 overflow-x-auto no-scrollbar pb-1">
           <Languages size={14} className="text-white/80" />
           <select 
             value={language} 
             onChange={(e) => setLanguage(e.target.value)}
             className="bg-white/20 border border-white/30 text-white text-xs rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-white/50 cursor-pointer"
           >
             {LANGUAGES.map(l => <option key={l.code} value={l.code} className="text-gray-800">{l.label} - {l.name}</option>)}
           </select>
        </div>
      </div>

      {/* Mandi Ticker */}
      <div className="bg-[#FFF8E1] border-b border-[#FFE082] py-2 overflow-hidden whitespace-nowrap relative">
        <div className="inline-flex space-x-8 animate-marquee px-4">
          {[...mandiRates, ...mandiRates].map((rate, idx) => (
            <button 
                key={idx} 
                onClick={() => setSelectedMandi(rate)}
                className="flex items-center space-x-2 bg-white px-3 py-1 rounded-full shadow-sm border border-yellow-100 hover:bg-yellow-50 transition-colors active:scale-95 cursor-pointer"
            >
              <span className="font-bold text-gray-800 text-sm">{rate.crop}</span>
              <span className="text-gray-600 text-xs">₹{rate.price}</span>
              <span className={`flex items-center text-xs font-bold ${rate.change > 0 ? 'text-green-600' : 'text-red-500'}`}>
                {rate.change > 0 ? <TrendingUp size={12} className="mr-1" /> : <TrendingDown size={12} className="mr-1" />}
                {Math.abs(rate.change)}
              </span>
              <span className="text-[10px] text-gray-400 border-l pl-2 ml-1 border-gray-200">{rate.market}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div className="px-4 mt-6">
        <h2 className="text-xs font-bold text-gray-400 uppercase mb-2 ml-1">{t('Categories')}</h2>
        <div className="flex space-x-4 overflow-x-auto pb-2 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex flex-col items-center min-w-[70px] space-y-2 ${selectedCategory === cat.id ? 'opacity-100' : 'opacity-60 grayscale'}`}
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm transition-all ${selectedCategory === cat.id ? 'bg-green-600 text-white shadow-green-200' : 'bg-white text-gray-500'}`}>
                <cat.icon size={24} />
              </div>
              <span className="text-xs font-medium text-gray-700 text-center leading-tight">{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Product List */}
      <div className="px-4 mt-6 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="font-bold text-gray-800 text-lg">{t('Featured Products')}</h2>
          <span className="text-green-600 text-xs font-bold cursor-pointer hover:underline">{t('View')} {t('All')}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredProducts.map((product) => (
            <div key={product.id} className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex space-x-3 transition-all hover:shadow-md">
              <img src={product.image} alt={product.name} className="w-24 h-24 rounded-xl object-cover bg-gray-100" />
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-gray-800 text-sm line-clamp-2">{product.name}</h3>
                    <div className="flex items-center text-[10px] bg-yellow-50 px-1.5 py-0.5 rounded text-yellow-700 border border-yellow-100 whitespace-nowrap ml-1">
                      <Star size={10} className="mr-0.5 fill-yellow-500" /> {product.rating}
                    </div>
                  </div>
                  <div className="flex items-center text-gray-400 text-xs mt-1">
                    <MapPin size={10} className="mr-1" /> {product.location}
                  </div>
                </div>
                
                <div className="flex justify-between items-end mt-2">
                  <p className="text-green-600 font-bold text-lg leading-none">
                    ₹{product.price}
                    <span className="text-xs text-gray-400 font-normal ml-1">/{product.unit}</span>
                  </p>
                  <div className="flex space-x-1">
                    <button 
                      onClick={(e) => { e.stopPropagation(); speakText(`${product.name}. ${product.description}`); }}
                      className="p-1.5 bg-gray-100 rounded-lg text-gray-500 hover:bg-green-50 hover:text-green-600"
                    >
                      <Volume2 size={14} />
                    </button>
                    <button 
                      onClick={() => setSelectedProduct(product)}
                      className="px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded-lg shadow-lg shadow-green-200 hover:bg-green-700"
                    >
                      {t('View')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sell CTA */}
      <div className="fixed bottom-10 right-4 left-4 z-30 flex justify-center pointer-events-none">
        <button 
          onClick={() => setShowSellModal(true)}
          className="bg-[#1FAF55] hover:bg-green-700 text-white font-bold py-4 px-8 rounded-full shadow-xl shadow-green-500/40 flex items-center space-x-2 transform transition-all hover:scale-105 active:scale-95 pointer-events-auto"
        >
          <Plus size={24} strokeWidth={3} />
          <span>{t('Sell Your Crop')}</span>
        </button>
      </div>

      {/* Mandi Detail Modal */}
      {selectedMandi && (
         <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
           <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedMandi(null)} />
           <div className="bg-white w-full max-w-md rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl relative animate-slide-up overflow-hidden">
             <div className="bg-yellow-500 p-6 text-white relative">
                <button onClick={() => setSelectedMandi(null)} className="absolute top-4 right-4 bg-white/20 p-2 rounded-full hover:bg-white/30"><X size={18} /></button>
                <h2 className="text-2xl font-bold">{selectedMandi.market}</h2>
                <p className="text-yellow-100 text-sm flex items-center mt-1"><MapPin size={14} className="mr-1" /> {t('Mandi Rates')}</p>
             </div>
             <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <p className="text-gray-500 text-xs uppercase font-bold">Commodity</p>
                        <p className="text-xl font-bold text-gray-800">{selectedMandi.crop}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-gray-500 text-xs uppercase font-bold">Current Rate</p>
                        <p className="text-2xl font-bold text-green-600">₹{selectedMandi.price}<span className="text-sm text-gray-400 font-normal">/Qt</span></p>
                    </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-4">
                    <h3 className="font-bold text-gray-800 text-sm mb-2">Market Insights</h3>
                    <p className="text-gray-600 text-sm">{selectedMandi.details}</p>
                    <div className={`mt-3 flex items-center font-bold text-sm ${selectedMandi.change > 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {selectedMandi.change > 0 ? <TrendingUp size={16} className="mr-2" /> : <TrendingDown size={16} className="mr-2" />}
                        Price {selectedMandi.change > 0 ? 'Up' : 'Down'} by ₹{Math.abs(selectedMandi.change)} today
                    </div>
                </div>
                <button className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-yellow-200 transition-all">
                    View All Sellers in this Mandi
                </button>
             </div>
           </div>
         </div>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setSelectedProduct(null)} />
          <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden relative animate-slide-up z-10 max-h-[90vh] overflow-y-auto">
            <div className="relative h-64">
              <img src={selectedProduct.image} className="w-full h-full object-cover" />
              <button 
                onClick={() => setSelectedProduct(null)}
                className="absolute top-4 right-4 bg-black/20 text-white p-2 rounded-full backdrop-blur-md hover:bg-black/40"
              >
                <X size={20} />
              </button>
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-6 pt-20">
                <h2 className="text-white text-2xl font-bold">{selectedProduct.name}</h2>
                <p className="text-white/90 flex items-center mt-1 text-sm">
                  <MapPin size={14} className="mr-1" /> {selectedProduct.location}
                </p>
              </div>
            </div>

            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <p className="text-sm text-gray-400">Price</p>
                  <p className="text-3xl font-bold text-green-600">₹{selectedProduct.price}<span className="text-sm text-gray-500 font-normal">/{selectedProduct.unit}</span></p>
                </div>
                <div className="flex space-x-2">
                  <button onClick={() => speakText(selectedProduct.description)} className="flex items-center space-x-1 px-3 py-2 bg-green-50 text-green-700 rounded-xl font-bold text-xs">
                    <Volume2 size={14} />
                    <span>Listen</span>
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <h3 className="font-bold text-gray-800 text-sm mb-2">{t('Product Details')}</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400 text-xs">{t('Quality')}</p>
                      <p className="font-medium">{selectedProduct.quality}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">{t('Seller')}</p>
                      <p className="font-medium">{selectedProduct.seller} ⭐ {selectedProduct.rating}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-gray-600 text-sm leading-relaxed">
                    {selectedProduct.description}
                  </p>
                  
                  {/* Maps Grounding Trigger */}
                  <button 
                     onClick={() => checkLocation(selectedProduct.location)}
                     className="mt-3 text-xs flex items-center text-blue-600 hover:underline font-medium"
                     disabled={checkingLocation}
                  >
                     {checkingLocation ? <Loader2 size={12} className="animate-spin mr-1" /> : <MapPin size={12} className="mr-1" />}
                     {checkingLocation ? "Verifying location..." : "Check Location Details"}
                  </button>
                  {locationCheck && (
                      <p className="text-xs text-blue-700 mt-1 bg-blue-50 p-2 rounded border border-blue-100">{locationCheck}</p>
                  )}
                </div>

                {/* AI Suggestions */}
                <div className="bg-gradient-to-br from-yellow-50 to-amber-50 p-4 rounded-2xl border border-yellow-100">
                  <div className="flex items-center mb-2">
                    <span className="bg-yellow-400 text-white p-1 rounded mr-2"><Loader2 size={12} className={analyzing ? "animate-spin" : ""} /></span>
                    <h3 className="font-bold text-gray-800 text-sm">{t('AgriBee AI Insights')}</h3>
                  </div>
                  {analyzing ? (
                    <div className="h-12 flex items-center justify-center">
                      <p className="text-xs text-gray-400 animate-pulse">Checking online prices...</p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-700 leading-relaxed italic">
                      "{aiAnalysis}"
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button 
                    onClick={() => handleCall(selectedProduct.seller)}
                    className="flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-green-200 transition-all active:scale-95"
                  >
                    <Phone size={18} />
                    <span>{t('Call Seller')}</span>
                  </button>
                  <button 
                    onClick={() => handleOpenChat(selectedProduct.seller)}
                    className="flex items-center justify-center space-x-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 py-3.5 rounded-xl font-bold transition-all active:scale-95"
                  >
                    <MessageCircle size={18} />
                    <span>{t('Chat')}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sell Modal Form */}
      {showSellModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowSellModal(false)} />
          <div className="bg-gray-50 w-full max-w-lg rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl overflow-hidden relative animate-slide-up flex flex-col max-h-[95vh]">
            <div className="bg-[#1FAF55] p-5 flex justify-between items-center text-white">
              <h2 className="font-bold text-lg">{t('Sell Your Crop')}</h2>
              <button onClick={() => setShowSellModal(false)}><X size={24} /></button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Crop Name / Variety</label>
                <input 
                    type="text" 
                    placeholder="e.g. Sharbati Wheat" 
                    value={sellFormCropName}
                    onChange={(e) => setSellFormCropName(e.target.value)}
                    className="w-full p-4 rounded-xl border-none bg-white shadow-sm focus:ring-2 focus:ring-green-500 outline-none" 
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1">Price (₹)</label>
                  <input 
                    type="number" 
                    min="1" 
                    placeholder="0.00"
                    value={sellFormPrice}
                    onChange={(e) => setSellFormPrice(e.target.value)}
                    className="w-full p-4 rounded-xl border-none bg-white shadow-sm focus:ring-2 focus:ring-green-500 outline-none" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1">Quantity</label>
                  <div className="flex space-x-2">
                    <input 
                        type="number" 
                        min="1" 
                        placeholder="10"
                        value={sellFormQuantity}
                        onChange={(e) => setSellFormQuantity(e.target.value)} 
                        className="w-2/3 p-4 rounded-xl border-none bg-white shadow-sm focus:ring-2 focus:ring-green-500 outline-none" 
                    />
                    <div className="w-1/3 relative">
                        <select 
                            value={sellFormUnit}
                            onChange={(e) => setSellFormUnit(e.target.value)}
                            className="w-full h-full rounded-xl border-none bg-white shadow-sm focus:ring-2 focus:ring-green-500 outline-none text-xs px-2 appearance-none"
                        >
                            <option value="quintal">Quintal</option>
                            <option value="kg">Kg</option>
                            <option value="ton">Ton</option>
                            <option value="crate">Crate</option>
                            <option value="box">Box</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                  </div>
                  {sellFormUnit === 'other' && (
                      <input 
                        type="text" 
                        placeholder="Enter unit (e.g. Dozen)"
                        value={sellFormCustomUnit}
                        onChange={(e) => setSellFormCustomUnit(e.target.value)}
                        className="w-full p-2 mt-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                      />
                  )}
                </div>
              </div>

              {/* Nearby Buyers Preview - Dynamically Shown */}
              {showBuyers && (
                  <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 animate-fade-in">
                    <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-blue-800 text-sm">{t('Nearby Interested Buyers')}</h3>
                    <span className="text-[10px] text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full flex items-center">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1 animate-pulse"></div> Live Match
                    </span>
                    </div>
                    {nearbyBuyers.length > 0 ? (
                        <div className="space-y-3 max-h-40 overflow-y-auto pr-1">
                            {nearbyBuyers.map((buyer, idx) => (
                                <div key={idx} className="flex items-center bg-white p-2.5 rounded-xl shadow-sm border border-blue-50/50">
                                    <div className="relative">
                                    <img src={buyer.avatar} className="w-9 h-9 rounded-full mr-3 object-cover" alt={buyer.name} />
                                    <div className="absolute bottom-0 right-3 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center">
                                        <p className="text-xs font-bold text-gray-800 truncate">{buyer.name} <span className="text-[10px] font-normal text-gray-400">({buyer.role})</span></p>
                                        <span className="text-[10px] font-bold text-green-600 bg-green-50 px-1.5 rounded">{buyer.distance}</span>
                                    </div>
                                    <p className="text-[10px] text-gray-500 truncate">Wants: {buyer.interest}</p>
                                    </div>
                                    <button 
                                      onClick={() => handleOpenChat(buyer.name)}
                                      className="ml-2 p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 active:scale-95"
                                    >
                                      <MessageCircle size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-gray-500 text-xs py-2 italic">No specific buyers found nearby for {sellFormCropName}. Your listing will be broadcast to all traders in the area.</p>
                    )}
                  </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Description (Or Speak)</label>
                <div className="relative">
                   <textarea 
                     value={sellFormDescription}
                     onChange={(e) => setSellFormDescription(e.target.value)}
                     placeholder="Describe quality, harvest date, etc." 
                     className="w-full p-4 rounded-xl border-none bg-white shadow-sm focus:ring-2 focus:ring-green-500 outline-none min-h-[100px]" 
                   />
                   <button 
                      onClick={toggleListening}
                      className={`absolute bottom-3 right-3 p-2 rounded-full transition-all ${isListening ? 'bg-red-500 text-white animate-pulse shadow-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                      title={isListening ? "Stop Listening" : "Speak Description"}
                   >
                      {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                   </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Upload Photos</label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center bg-white text-gray-400 hover:bg-gray-50 hover:border-green-400 transition-all cursor-pointer">
                  <div className="bg-gray-100 p-3 rounded-full mb-2"><Plus size={20} /></div>
                  <span className="text-xs font-medium">Tap to upload images</span>
                </div>
              </div>

              <button 
                onClick={handlePostListing}
                disabled={isPosting}
                className="w-full bg-green-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-green-200 hover:bg-green-700 active:scale-95 transition-all mt-4 flex items-center justify-center"
              >
                {isPosting ? <Loader2 size={20} className="animate-spin" /> : "Post Listing"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SELLER CHAT MODAL */}
      {activeChatSeller && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4 font-sans">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setActiveChatSeller(null)} />
              <div className="bg-white w-full h-full sm:h-[600px] sm:w-[400px] sm:rounded-3xl shadow-2xl relative z-10 flex flex-col animate-slide-up overflow-hidden">
                  {/* Chat Header */}
                  <div className="bg-[#1FAF55] p-4 flex items-center justify-between text-white shadow-md">
                      <div className="flex items-center">
                          <div className="relative">
                              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-lg font-bold">
                                  {activeChatSeller.charAt(0)}
                              </div>
                              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-[#1FAF55] rounded-full"></div>
                          </div>
                          <div className="ml-3">
                              <h3 className="font-bold text-sm">{activeChatSeller}</h3>
                              <p className="text-[10px] text-green-100">Online now</p>
                          </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button onClick={() => handleCall(activeChatSeller)} className="p-2 hover:bg-white/10 rounded-full">
                            <Phone size={20} />
                        </button>
                        <button onClick={() => setActiveChatSeller(null)} className="p-2 hover:bg-white/10 rounded-full">
                            <X size={24} />
                        </button>
                      </div>
                  </div>

                  {/* Chat Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                      {chatMessages.map((msg) => (
                          <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[80%] p-3 rounded-2xl text-sm shadow-sm ${
                                  msg.sender === 'me' 
                                  ? 'bg-green-600 text-white rounded-br-none' 
                                  : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                              }`}>
                                  <p>{msg.text}</p>
                                  <p className={`text-[10px] mt-1 text-right ${msg.sender === 'me' ? 'text-green-200' : 'text-gray-400'}`}>{msg.time}</p>
                              </div>
                          </div>
                      ))}
                      <div ref={chatEndRef} />
                  </div>

                  {/* Chat Input */}
                  <div className="p-3 bg-white border-t border-gray-100 flex items-center">
                      <input 
                        type="text" 
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()}
                        placeholder="Type a message..." 
                        className="flex-1 bg-gray-100 rounded-full px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all"
                      />
                      <button 
                        onClick={handleSendChatMessage}
                        disabled={!chatInput.trim()}
                        className="ml-2 p-3 bg-green-600 text-white rounded-full shadow-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                      >
                          <Send size={18} />
                      </button>
                  </div>
              </div>
          </div>
      )}

      <AIChatBot />
      
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          animation: marquee 25s linear infinite;
        }
      `}</style>
    </div>
  );
};
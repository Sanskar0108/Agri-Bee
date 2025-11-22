import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { MainLayout } from '../components/MainLayout';
import { WeatherWidget } from '../components/WeatherWidget';
import { CalendarStrip } from '../components/CalendarStrip';
import { TaskWidget } from '../components/TaskWidget';
import { BottomNav } from '../components/BottomNav';
import { AIChatBot } from '../components/AIChatBot';
import { Bell, X, Cloud, CloudRain, Sun, Loader2, Sparkles, Droplets, Calendar, MapPin, AlertTriangle, Info, CloudLightning, CloudSnow } from 'lucide-react';
import { Page, AppSettings, UserCoordinates } from '../App';

interface HomeScreenProps {
  onNavigate: (page: Page) => void;
  currentTab: string;
  userName?: string;
  appSettings: AppSettings;
  userLocation?: string;
  userCoordinates?: UserCoordinates | null;
}

// Weather Data Interfaces
interface CurrentWeather {
  temp: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  isDay: boolean;
  code: number;
  min?: number;
  max?: number;
}

interface ForecastItem {
  time: string;
  temp: number;
  code: number;
  fullDate?: Date;
}

interface DailyForecastItem {
  day: string;
  min: number;
  max: number;
  condition: string;
  code: number;
}

// Notification Types
interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'urgent' | 'normal';
  timestamp: string;
  read: boolean;
}

// Helper to convert WMO code to string
const getConditionText = (code: number) => {
  if (code === 0) return "Clear Sky";
  if (code === 1 || code === 2 || code === 3) return "Partly Cloudy";
  if (code >= 45 && code <= 48) return "Foggy";
  if (code >= 51 && code <= 55) return "Drizzle";
  if (code >= 56 && code <= 57) return "Freezing Drizzle";
  if (code >= 61 && code <= 65) return "Rain";
  if (code >= 66 && code <= 67) return "Freezing Rain";
  if (code >= 71 && code <= 77) return "Snow";
  if (code >= 80 && code <= 82) return "Rain Showers";
  if (code >= 85 && code <= 86) return "Snow Showers";
  if (code >= 95) return "Thunderstorm";
  if (code >= 96 && code <= 99) return "Heavy Storm";
  return "Unknown";
};

// Helper to get Icon Component
const getWeatherIcon = (code: number) => {
  if (code === 0 || code === 1) return Sun;
  if (code === 2 || code === 3) return Cloud;
  if (code >= 45 && code <= 48) return Cloud;
  if (code >= 51 && code <= 67) return CloudRain;
  if (code >= 71 && code <= 77) return CloudSnow;
  if (code >= 80 && code <= 82) return CloudRain;
  if (code >= 95 && code <= 99) return CloudLightning;
  return Sun;
};

// Fallback Notifications when API Limit Exceeded
const FALLBACK_NOTIFICATIONS: Notification[] = [
  { id: 101, title: "Market Update", message: "Wheat prices are steady at ₹2125/quintal in local mandis.", type: 'normal', timestamp: 'Just now', read: false },
  { id: 102, title: "Farming Tip", message: "Ensure proper drainage in fields to prevent root rot.", type: 'normal', timestamp: '1 hour ago', read: false },
  { id: 103, title: "Government Scheme", message: "New subsidy available for solar pumps. Check details.", type: 'normal', timestamp: '3 hours ago', read: false },
  { id: 104, title: "Weather Alert", message: "Light rain expected tomorrow. Plan irrigation accordingly.", type: 'normal', timestamp: '5 hours ago', read: false }
];

export const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigate, currentTab, userName = "Farmer", appSettings, userLocation, userCoordinates }) => {
  // Default to current date
  const [selectedDate, setSelectedDate] = useState<number>(new Date().getDate());
  const [showWeatherModal, setShowWeatherModal] = useState(false);
  const [weatherAnalysis, setWeatherAnalysis] = useState<string>('');
  const [analyzingWeather, setAnalyzingWeather] = useState(false);

  // Weather State
  const [currentWeather, setCurrentWeather] = useState<CurrentWeather | null>(null);
  const [hourlyForecast, setHourlyForecast] = useState<ForecastItem[]>([]);
  const [weeklyForecast, setWeeklyForecast] = useState<DailyForecastItem[]>([]);
  const [weatherLoading, setWeatherLoading] = useState(false);

  // Notification State
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [urgentPopup, setUrgentPopup] = useState<Notification | null>(null);
  const [processingNotifs, setProcessingNotifs] = useState(false);
  
  // Ref to prevent double processing
  const notifProcessedRef = useRef(false);

  // Fetch Weather Data
  useEffect(() => {
    if (userCoordinates) {
      const fetchWeather = async () => {
        setWeatherLoading(true);
        try {
          // Fetch from Open-Meteo (Free API)
          const res = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${userCoordinates.lat}&longitude=${userCoordinates.lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,is_day&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=7`
          );
          const data = await res.json();

          if (!data || !data.current) throw new Error("Invalid weather data");

          // Process Current Weather
          setCurrentWeather({
            temp: data.current.temperature_2m,
            condition: getConditionText(data.current.weather_code),
            humidity: data.current.relative_humidity_2m,
            windSpeed: data.current.wind_speed_10m,
            isDay: data.current.is_day === 1,
            code: data.current.weather_code,
            min: data.daily?.temperature_2m_min?.[0],
            max: data.daily?.temperature_2m_max?.[0]
          });

          // Process Hourly (Next 6 hours)
          // Defensive check: ensure data.hourly and data.hourly.time exist
          const hourlyTime = data.hourly?.time || [];
          const hourlyTemps = data.hourly?.temperature_2m || [];
          const hourlyCodes = data.hourly?.weather_code || [];

          const nextHours = hourlyTime.slice(0, 24).map((time: string, i: number) => {
             const date = new Date(time);
             // Only take future hours or current
             return {
               time: date.toLocaleTimeString([], { hour: 'numeric', hour12: true }),
               temp: Math.round(hourlyTemps[i] || 0),
               code: hourlyCodes[i] || 0,
               fullDate: date
             };
          }).filter((h: any) => h.fullDate >= new Date()).slice(0, 6);
          
          setHourlyForecast(nextHours);

          // Process Daily (Next 7 days)
          const dailyTime = data.daily?.time || [];
          const dailyMin = data.daily?.temperature_2m_min || [];
          const dailyMax = data.daily?.temperature_2m_max || [];
          const dailyCodes = data.daily?.weather_code || [];

          const nextDays = dailyTime.map((time: string, i: number) => {
            const date = new Date(time);
            const dayName = i === 0 ? "Today" : i === 1 ? "Tomorrow" : date.toLocaleDateString('en-US', { weekday: 'short' });
            return {
              day: dayName,
              min: Math.round(dailyMin[i] || 0),
              max: Math.round(dailyMax[i] || 0),
              condition: getConditionText(dailyCodes[i] || 0),
              code: dailyCodes[i] || 0
            };
          });
          setWeeklyForecast(nextDays);

        } catch (error) {
          console.error("Weather fetch failed:", error);
        } finally {
          setWeatherLoading(false);
        }
      };

      fetchWeather();
    }
  }, [userCoordinates]);

  const analyzeWeather = async () => {
    if (!currentWeather) return;

    setAnalyzingWeather(true);
    setWeatherAnalysis('');
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `
        You are AgriBee AI, an expert agricultural meteorologist.
        Analyze this real-time weather for a farm in ${userLocation}:
        - Current: ${currentWeather.temp}°C, ${currentWeather.condition}, Humidity ${currentWeather.humidity}%, Wind ${currentWeather.windSpeed}km/h.
        - Forecast: Next few days highs around ${currentWeather.max}°C and lows ${currentWeather.min}°C.
        
        Provide a short, concise advice summary (max 50 words) regarding crop safety, irrigation need, or pest risks.
      `;

      // Using Flash-Lite for fast, low-latency responses as requested
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-lite-latest',
        contents: { parts: [{ text: prompt }] },
      });
      setWeatherAnalysis(response.text || 'Weather looks stable, keep monitoring.');
    } catch (error: any) {
      console.warn("Weather Analysis AI Error:", error);
      // Silent fallback for analysis
      setWeatherAnalysis('Standard seasonal conditions. Monitor field moisture levels.');
    } finally {
      setAnalyzingWeather(false);
    }
  };

  const processNotifications = async () => {
    // Only process if we have context, or at least default
    const locationContext = userLocation || "India";
    const weatherContext = currentWeather 
      ? `${currentWeather.temp}°C, ${currentWeather.condition}, Humidity ${currentWeather.humidity}%` 
      : "Data unavailable";

    setProcessingNotifs(true);
    try {
       const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
       
       const prompt = `
         You are AgriBee AI, a real-time farm alert system.
         Generate 4 realistic agricultural notifications for a farmer based on this LIVE context:
         
         User Location: ${locationContext}
         Real-time Weather: ${weatherContext}
         Time: ${new Date().toLocaleTimeString()}
         
         Requirements:
         1. Analyze the weather. If it is severe (Storm, Heavy Rain, Extreme Heat > 40C, High Wind), generate an 'urgent' alert about crop protection.
         2. Include a market price trend relevant to crops grown in ${locationContext} (e.g., Wheat, Rice, Cotton, Onion).
         3. Include a seasonal pest or disease warning suitable for the current climate in this region.
         4. Include a general farming tip or government scheme update.
         
         Return valid JSON object with property "notifications" containing an array.
         Each item must have:
         - title: Short headline
         - message: Concise details (max 15 words)
         - type: 'urgent' (if threat exists) or 'normal'
       `;

       const response = await ai.models.generateContent({
         model: 'gemini-2.5-flash',
         contents: { parts: [{ text: prompt }] },
         config: { 
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                notifications: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      message: { type: Type.STRING },
                      type: { type: Type.STRING }
                    },
                    required: ["title", "message", "type"]
                  }
                }
              }
            }
         }
       });
       
       if (response.text) {
          // Clean potential markdown code blocks using regex
          const cleanText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();

          const parsed = JSON.parse(cleanText);
          if (parsed && parsed.notifications) {
            const newNotifs: Notification[] = parsed.notifications.map((n: any, i: number) => ({
               ...n,
               id: Date.now() + i,
               timestamp: 'Just now',
               read: false
            }));
            
            setNotifications(newNotifs);

            // Check for urgent popups - ONLY IF SETTING IS ENABLED
            if (appSettings.urgentAlerts) {
              const urgent = newNotifs.find(n => n.type === 'urgent');
              if (urgent) {
                setTimeout(() => setUrgentPopup(urgent), 2000); // Delay for effect
              }
            }
          }
       }
    } catch (e: any) {
       console.error("AI Notification Error", e);
       
       // Check for Quota Exceeded or other API errors
       if (e.message?.includes("429") || e.status === "RESOURCE_EXHAUSTED") {
         console.log("Using fallback notifications due to quota limits.");
       }

       // Load Fallback Data
       setNotifications(FALLBACK_NOTIFICATIONS);
       
    } finally {
       setProcessingNotifs(false);
    }
  };

  useEffect(() => {
    if (showWeatherModal && !weatherAnalysis && currentWeather) {
      analyzeWeather();
    }
  }, [showWeatherModal, currentWeather]);

  // Trigger notifications when weather or location changes
  useEffect(() => {
    if (currentWeather && userLocation && !notifProcessedRef.current) {
        processNotifications();
        notifProcessedRef.current = true; // prevent loop/double call
    }
  }, [currentWeather, userLocation]);

  const unreadCount = notifications.filter(n => !n.read).length;
  const urgentNotifications = notifications.filter(n => n.type === 'urgent');
  const normalNotifications = notifications.filter(n => n.type === 'normal');

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <MainLayout>
      {!showWeatherModal && (
        <div className="p-5 pt-8 animate-fade-in relative">
          
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div></div> 
            {/* Notification Bell */}
            <div className="relative z-30">
                <button 
                  onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                  className="bg-white/60 backdrop-blur-md p-2.5 rounded-xl shadow-sm border border-white/40 cursor-pointer active:scale-95 transition-transform relative hover:bg-white"
                >
                  <Bell className={unreadCount > 0 ? "text-gray-800" : "text-gray-500"} size={24} />
                  {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                  )}
                </button>

                {/* Notification Dropdown */}
                {showNotifDropdown && (
                  <div className="absolute right-0 top-14 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-fade-in origin-top-right">
                    <div className="bg-gray-50 p-3 border-b border-gray-100 flex justify-between items-center">
                      <h3 className="font-bold text-gray-700 text-sm">Notifications ({unreadCount})</h3>
                      <button onClick={markAllRead} className="text-[10px] text-green-600 font-bold hover:underline">Mark all read</button>
                    </div>
                    
                    <div className="max-h-[60vh] overflow-y-auto">
                      {processingNotifs ? (
                         <div className="p-6 text-center text-gray-400 text-xs flex flex-col items-center">
                            <Loader2 size={16} className="animate-spin mb-2" />
                            AgriBee AI checking {userLocation || 'location'}...
                         </div>
                      ) : notifications.length === 0 ? (
                         <div className="p-6 text-center text-gray-400 text-xs">No notifications yet</div>
                      ) : (
                        <>
                           {/* Urgent Section */}
                           {urgentNotifications.length > 0 && (
                             <div>
                               <div className="bg-red-50 px-3 py-1.5 text-[10px] font-bold text-red-500 uppercase tracking-wide">⚠️ Urgent Alerts</div>
                               {urgentNotifications.map(n => (
                                 <div key={n.id} className={`p-3 border-b border-gray-50 hover:bg-red-50/30 transition-colors ${!n.read ? 'bg-white' : 'bg-gray-50/50'}`}>
                                    <div className="flex items-start space-x-3">
                                       <div className="bg-red-100 p-1.5 rounded-full flex-shrink-0">
                                          <AlertTriangle size={14} className="text-red-600" />
                                       </div>
                                       <div>
                                          <h4 className="text-sm font-bold text-gray-800 leading-tight mb-1">{n.title}</h4>
                                          <p className="text-xs text-gray-600 leading-relaxed">{n.message}</p>
                                          <p className="text-[10px] text-gray-400 mt-1">{n.timestamp}</p>
                                       </div>
                                    </div>
                                 </div>
                               ))}
                             </div>
                           )}
                           
                           {/* Normal Section */}
                           {normalNotifications.length > 0 && (
                             <div>
                               <div className="bg-blue-50 px-3 py-1.5 text-[10px] font-bold text-blue-500 uppercase tracking-wide">ℹ️ Updates</div>
                               {normalNotifications.map(n => (
                                 <div key={n.id} className={`p-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${!n.read ? 'bg-white' : 'bg-gray-50/50'}`}>
                                    <div className="flex items-start space-x-3">
                                       <div className="bg-blue-100 p-1.5 rounded-full flex-shrink-0">
                                          <Info size={14} className="text-blue-600" />
                                       </div>
                                       <div>
                                          <h4 className="text-sm font-bold text-gray-800 leading-tight mb-1">{n.title}</h4>
                                          <p className="text-xs text-gray-600 leading-relaxed">{n.message}</p>
                                          <p className="text-[10px] text-gray-400 mt-1">{n.timestamp}</p>
                                       </div>
                                    </div>
                                 </div>
                               ))}
                             </div>
                           )}
                        </>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Backdrop for dropdown */}
                {showNotifDropdown && <div className="fixed inset-0 z-[-1]" onClick={() => setShowNotifDropdown(false)} />}
            </div>
          </div>

          {/* Greeting */}
          <div className="mb-6 animate-slide-up">
            <h1 className="text-3xl font-bold text-gray-800 leading-tight">
              Welcome, <br />
              <span className="text-green-600 drop-shadow-sm">{userName}</span> 🌾
            </h1>
            <p className="text-gray-500 text-sm mt-1 font-medium">Let's make today productive!</p>
          </div>

          {/* Widgets */}
          <div className="space-y-5 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <WeatherWidget 
                onClick={() => setShowWeatherModal(true)} 
                location={userLocation} 
                data={currentWeather || undefined}
            />
            <CalendarStrip selectedDate={selectedDate} onSelectDate={setSelectedDate} />
            <TaskWidget selectedDate={selectedDate} />
          </div>
          
          {/* Spacer for bottom nav */}
          <div className="h-24"></div>
          <BottomNav onNavigate={onNavigate} activeTab={currentTab} />
        </div>
      )}

      {/* Full Screen Weather Detail Page */}
      {showWeatherModal && currentWeather && (
        <div className="fixed inset-0 z-[100] bg-white overflow-y-auto animate-fade-in text-gray-800">
          
          {/* Custom Header for Weather Page - HAMBURGER REMOVED */}
          <div className="bg-white sticky top-0 z-10 px-5 py-4 flex justify-between items-center shadow-sm">
             <div className="flex items-center">
                <h2 className="text-lg font-bold text-gray-800 ml-1">Forecast</h2>
             </div>
             <button onClick={() => setShowWeatherModal(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 text-gray-600">
               <X size={22} />
             </button>
          </div>

          <div className="p-5 space-y-6">
             
             {/* Blue Box - Current Weather */}
             <div className="bg-gradient-to-br from-[#2193b0] to-[#6dd5ed] rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
                {/* Decorative Elements for Better Visibilty */}
                <div className="absolute top-[-50px] right-[-50px] w-40 h-40 bg-white/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-[-30px] left-[-30px] w-32 h-32 bg-blue-900/10 rounded-full blur-2xl"></div>

                <div className="relative z-10">
                  <div className="flex justify-between items-start">
                    <div>
                       <div className="flex items-center space-x-1 bg-white/20 w-fit px-3 py-1 rounded-full backdrop-blur-sm border border-white/10 mb-4">
                          <MapPin size={14} className="text-white" />
                          <span className="text-xs font-bold tracking-wide uppercase truncate max-w-[150px]">{userLocation || "My Farm"}</span>
                       </div>
                       <h1 className="text-7xl font-bold tracking-tighter drop-shadow-sm">{Math.round(currentWeather.temp)}°</h1>
                       <p className="text-xl font-medium mt-1 opacity-90">{currentWeather.condition}</p>
                    </div>
                    <div className="bg-white/20 p-4 rounded-3xl backdrop-blur-md border border-white/20 shadow-inner">
                       {React.createElement(getWeatherIcon(currentWeather.code), { size: 48, className: "text-yellow-300 animate-pulse-slow" })}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-8 border-t border-white/20 pt-4">
                     <div className="text-center">
                        <p className="text-blue-100 text-xs font-medium uppercase mb-1">High</p>
                        <p className="font-bold text-lg">{Math.round(currentWeather.max || currentWeather.temp + 2)}°</p>
                     </div>
                     <div className="w-[1px] h-8 bg-white/20"></div>
                     <div className="text-center">
                        <p className="text-blue-100 text-xs font-medium uppercase mb-1">Low</p>
                        <p className="font-bold text-lg">{Math.round(currentWeather.min || currentWeather.temp - 2)}°</p>
                     </div>
                     <div className="w-[1px] h-8 bg-white/20"></div>
                     <div className="text-center">
                        <p className="text-blue-100 text-xs font-medium uppercase mb-1">Wind</p>
                        <p className="font-bold text-lg">{currentWeather.windSpeed}<span className="text-xs">km/h</span></p>
                     </div>
                  </div>
                </div>
             </div>

             {/* Hourly Forecast */}
             <div>
                <h3 className="font-bold text-gray-800 mb-4 text-base flex items-center">
                  <ClockIcon className="w-4 h-4 mr-2 text-blue-500" />
                  Hourly Forecast
                </h3>
                <div className="flex space-x-4 overflow-x-auto pb-2 no-scrollbar px-1">
                  {hourlyForecast.map((hour, idx) => (
                    <div key={idx} className="flex flex-col items-center bg-white p-4 rounded-3xl min-w-[80px] shadow-md border border-gray-100 transition-transform hover:scale-105">
                      <span className="text-xs font-bold text-gray-400 mb-3">{hour.time}</span>
                      {React.createElement(getWeatherIcon(hour.code), { size: 28, className: hour.code <= 1 ? "text-yellow-500" : "text-blue-400" })}
                      <span className="font-bold text-xl text-gray-800 mt-3">{hour.temp}°</span>
                    </div>
                  ))}
                </div>
             </div>

             {/* AgriBee AI Insights - Moved Below Forecast */}
             <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-5 rounded-3xl border border-amber-200 shadow-sm relative overflow-hidden">
                 <div className="absolute right-0 top-0 w-24 h-24 bg-yellow-400/10 rounded-bl-full"></div>
                 <div className="flex items-center mb-3 text-amber-700 relative z-10">
                    <div className="bg-amber-100 p-2 rounded-full mr-3">
                      <Sparkles size={18} className="text-amber-600" />
                    </div>
                    <h3 className="font-bold text-base">AgriBee AI Analysis</h3>
                 </div>
                 
                 <div className="relative z-10">
                   {analyzingWeather ? (
                     <div className="flex items-center space-x-3 text-gray-500 text-sm py-2">
                       <Loader2 size={20} className="animate-spin text-amber-600" />
                       <span>Analyzing crop impact...</span>
                     </div>
                   ) : (
                     <p className="text-sm text-gray-800 leading-relaxed font-medium">
                       "{weatherAnalysis}"
                     </p>
                   )}
                 </div>
             </div>

             {/* 7 Day Forecast */}
             <div className="pb-10">
               <h3 className="font-bold text-gray-800 mb-4 text-base flex items-center">
                 <Calendar size={16} className="mr-2 text-blue-500" /> 
                 7-Day Forecast
               </h3>
               <div className="space-y-3">
                 {weeklyForecast.map((day, idx) => (
                   <div key={idx} className="flex items-center justify-between bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
                      <div className="flex items-center w-1/3">
                         <div className="bg-gray-50 p-2 rounded-full mr-3">
                           {React.createElement(getWeatherIcon(day.code), { size: 20, className: "text-gray-500" })}
                         </div>
                         <span className="font-bold text-gray-700 text-sm">{day.day}</span>
                      </div>
                      <div className="flex items-center justify-center w-1/3">
                         <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                           day.condition.includes('Rain') ? 'bg-blue-100 text-blue-600' :
                           day.condition.includes('Sunny') || day.condition.includes('Clear') ? 'bg-yellow-100 text-yellow-600' :
                           'bg-gray-100 text-gray-600'
                         }`}>{day.condition}</span>
                      </div>
                      <div className="w-1/3 text-right">
                         <span className="font-bold text-gray-800 text-base">{day.min}° / {day.max}°</span>
                      </div>
                   </div>
                 ))}
               </div>
             </div>

             {/* Irrigation Advice */}
             {currentWeather.condition.includes("Rain") || weeklyForecast[0]?.condition.includes("Rain") ? (
               <div className="p-5 bg-blue-50 rounded-3xl flex items-start space-x-4 border border-blue-100 mb-10">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <Droplets className="text-blue-600" size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-blue-900 text-sm">Irrigation Alert</h4>
                    <p className="text-xs text-blue-700 mt-1 leading-relaxed font-medium">Rain is expected. Consider delaying watering to save resources and prevent waterlogging.</p>
                  </div>
               </div>
             ) : (
               <div className="p-5 bg-green-50 rounded-3xl flex items-start space-x-4 border border-green-100 mb-10">
                  <div className="bg-green-100 p-3 rounded-full">
                    <Sun className="text-green-600" size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-green-900 text-sm">Irrigation Advice</h4>
                    <p className="text-xs text-green-700 mt-1 leading-relaxed font-medium">It's dry and sunny. Ensure crops are adequately watered early in the morning.</p>
                  </div>
               </div>
             )}

          </div>
        </div>
      )}

      {/* URGENT ALERT POPUP */}
      {urgentPopup && appSettings.urgentAlerts && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-xs rounded-[2rem] shadow-2xl overflow-hidden animate-bounce-slow border-2 border-red-100">
            <div className="bg-red-500 p-6 text-white text-center relative overflow-hidden">
               <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full blur-xl -mr-5 -mt-5"></div>
               <AlertTriangle size={48} className="mx-auto mb-3 text-white animate-pulse" />
               <h2 className="text-2xl font-bold">Warning Issued</h2>
            </div>
            <div className="p-6 text-center">
               <h3 className="text-lg font-bold text-gray-800 mb-2">{urgentPopup.title}</h3>
               <p className="text-gray-600 text-sm leading-relaxed mb-6">{urgentPopup.message}</p>
               <button 
                 onClick={() => {
                   setUrgentPopup(null);
                   setNotifications(prev => prev.map(n => n.id === urgentPopup.id ? { ...n, read: true } : n));
                 }}
                 className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-red-200 transition-all active:scale-95"
               >
                 I Understand
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
      `}</style>
    </MainLayout>
  );
};

// Helper Icon
function ClockIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}
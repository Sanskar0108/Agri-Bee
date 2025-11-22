import React from 'react';
import { CloudSun, CloudRain, Droplets, Sun, Cloud, CloudSnow, CloudLightning, Wind } from 'lucide-react';

interface WeatherWidgetProps {
  onClick?: () => void;
  location?: string;
  data?: {
    temp: number;
    condition: string;
    humidity: number;
    windSpeed: number;
    isDay: boolean;
    code: number;
  };
}

// Helper to map WMO code to Icon
const getWeatherIcon = (code: number, isDay: boolean) => {
  if (code === 0 || code === 1) return isDay ? Sun : CloudSun;
  if (code === 2 || code === 3) return Cloud;
  if (code >= 45 && code <= 48) return Cloud;
  if (code >= 51 && code <= 67) return CloudRain;
  if (code >= 71 && code <= 77) return CloudSnow;
  if (code >= 80 && code <= 82) return CloudRain;
  if (code >= 95 && code <= 99) return CloudLightning;
  return Sun;
};

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({ onClick, location, data }) => {
  // Default mock data if real data isn't loaded yet
  const weather = data || {
    temp: 25,
    condition: "Sunny",
    humidity: 65,
    windSpeed: 12,
    isDay: true,
    code: 0
  };

  const WeatherIcon = getWeatherIcon(weather.code, weather.isDay);

  return (
    <div 
      onClick={onClick}
      className="w-full bg-gradient-to-br from-green-400 to-emerald-600 rounded-3xl p-5 text-white shadow-lg relative overflow-hidden transform transition-all duration-300 hover:scale-[1.02] cursor-pointer active:scale-95"
    >
      {/* Background decorative circles */}
      <div className="absolute top-[-20px] right-[-20px] w-24 h-24 bg-white/20 rounded-full blur-xl"></div>
      <div className="absolute bottom-[-10px] left-[-10px] w-16 h-16 bg-yellow-300/20 rounded-full blur-lg"></div>

      <div className="relative z-10 flex justify-between items-start">
        <div>
          <h3 className="text-green-50 font-medium text-sm mb-1 truncate max-w-[150px]">{location || "My Farm"}</h3>
          <div className="flex items-baseline">
            <span className="text-5xl font-bold tracking-tighter">{Math.round(weather.temp)}°</span>
            <span className="text-xl ml-1 opacity-90">C</span>
          </div>
          <p className="text-green-100 font-medium mt-1">{weather.condition}</p>
        </div>
        <div className="bg-white/20 backdrop-blur-md p-3 rounded-2xl shadow-inner">
          <WeatherIcon size={32} className={weather.isDay ? "text-yellow-300" : "text-gray-200"} />
        </div>
      </div>

      <div className="mt-6 flex justify-between items-center bg-black/10 rounded-xl p-3 backdrop-blur-sm border border-white/10">
        <div className="flex items-center space-x-2">
          <Wind size={16} className="text-green-100" />
          <div className="text-xs">
            <p className="opacity-70">Wind</p>
            <p className="font-semibold">{weather.windSpeed} km/h</p>
          </div>
        </div>
        <div className="h-8 w-[1px] bg-white/20"></div>
        <div className="flex items-center space-x-2">
          <Droplets size={16} className="text-green-100" />
          <div className="text-xs">
            <p className="opacity-70">Humidity</p>
            <p className="font-semibold">{weather.humidity}%</p>
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-2 right-3 opacity-0 hover:opacity-100 transition-opacity">
        <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">Tap for details</span>
      </div>
    </div>
  );
};
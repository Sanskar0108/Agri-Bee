import React, { useState } from 'react';
import { SideMenu } from '../components/SideMenu';
import { Page, AppSettings } from '../App';
import { Bell, Globe, Shield, HelpCircle, Info, ChevronRight, Smartphone, Volume2, Lock, FileText, AlertTriangle, Check, X } from 'lucide-react';

interface SettingsScreenProps {
  onNavigate: (page: Page) => void;
  currentTab: string;
  userName?: string;
  appSettings: AppSettings;
  updateSettings: (settings: Partial<AppSettings>) => void;
  language: string;
  setLanguage: (lang: string) => void;
}

const LANGUAGES = [
  { code: 'en-US', name: 'English' },
  { code: 'hi-IN', name: 'Hindi (हिंदी)' },
  { code: 'mr-IN', name: 'Marathi (मराठी)' },
  { code: 'te-IN', name: 'Telugu (తెలుగు)' },
  { code: 'ta-IN', name: 'Tamil (தமிழ்)' },
  { code: 'kn-IN', name: 'Kannada (ಕನ್ನಡ)' },
  { code: 'gu-IN', name: 'Gujarati (ગુજરાતી)' },
  { code: 'pa-IN', name: 'Punjabi (ਪੰਜਾਬੀ)' },
  { code: 'bn-IN', name: 'Bengali (বাংলা)' },
  { code: 'ml-IN', name: 'Malayalam (മലയാളം)' },
];

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ 
  onNavigate, 
  currentTab, 
  userName, 
  appSettings, 
  updateSettings,
  language,
  setLanguage
}) => {
  const [showLangModal, setShowLangModal] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 font-poppins transition-colors duration-300 relative">
      {/* Header */}
      <div className="bg-[#1FAF55] pt-8 pb-16 px-5 rounded-b-[3rem] shadow-lg relative transition-colors duration-300">
        <div className="flex justify-between items-center mb-4">
          <SideMenu onNavigate={onNavigate} currentPage={currentTab} whiteIcon={true} userName={userName} />
          <div>
            <h1 className="text-2xl font-bold text-white text-right">Settings</h1>
            <p className="text-green-100 text-xs opacity-90 text-right">Preferences & Controls</p>
          </div>
        </div>
      </div>

      <div className="px-5 -mt-10 relative z-10 pb-10 space-y-6">
        
        {/* Notifications & Sound */}
        <div className="bg-white rounded-3xl shadow-lg p-6 border border-gray-100 transition-colors duration-300">
           <h3 className="text-gray-800 font-bold text-lg mb-4 flex items-center">
              <Bell className="mr-2 text-blue-500" size={20} />
              Notifications & Sounds
           </h3>
           
           <div className="space-y-4">
             {/* Push Notifications */}
             <div className="flex items-center justify-between">
                <div className="flex items-center">
                    <div className="bg-blue-50 p-2 rounded-full mr-3 text-blue-500">
                        <Bell size={20} />
                    </div>
                    <span className="text-sm font-bold text-gray-700">Push Notifications</span>
                </div>
                <button 
                  onClick={() => updateSettings({ notifications: !appSettings.notifications })}
                  className={`w-12 h-7 rounded-full p-1 transition-colors duration-300 ${appSettings.notifications ? 'bg-green-500' : 'bg-gray-300'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ${appSettings.notifications ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
             </div>

             {/* Sounds */}
             <div className="flex items-center justify-between">
                <div className="flex items-center">
                    <div className="bg-purple-50 p-2 rounded-full mr-3 text-purple-500">
                        <Volume2 size={20} />
                    </div>
                    <span className="text-sm font-bold text-gray-700">App Sounds</span>
                </div>
                <button 
                  onClick={() => updateSettings({ sounds: !appSettings.sounds })}
                  className={`w-12 h-7 rounded-full p-1 transition-colors duration-300 ${appSettings.sounds ? 'bg-green-500' : 'bg-gray-300'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ${appSettings.sounds ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
             </div>

             {/* Urgent Alerts Toggle */}
             <div className="flex items-center justify-between border-t border-gray-100 pt-3 mt-2">
                <div className="flex items-center">
                    <div className="bg-red-50 p-2 rounded-full mr-3 text-red-500">
                        <AlertTriangle size={20} />
                    </div>
                    <div>
                        <span className="text-sm font-bold text-gray-700">Urgent Farm Alerts</span>
                        <p className="text-[10px] text-gray-400">Popup warnings for weather/pests</p>
                    </div>
                </div>
                <button 
                  onClick={() => updateSettings({ urgentAlerts: !appSettings.urgentAlerts })}
                  className={`w-12 h-7 rounded-full p-1 transition-colors duration-300 ${appSettings.urgentAlerts ? 'bg-red-500' : 'bg-gray-300'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ${appSettings.urgentAlerts ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
             </div>
           </div>
        </div>

        {/* General Settings */}
        <div className="bg-white rounded-3xl shadow-lg p-6 border border-gray-100 transition-colors duration-300">
            <h3 className="text-gray-800 font-bold text-lg mb-4">General</h3>
            <div className="space-y-1">
                <button 
                    onClick={() => setShowLangModal(true)}
                    className="w-full flex items-center justify-between py-3 hover:bg-gray-50 px-2 rounded-xl transition-colors"
                >
                    <div className="flex items-center">
                        <div className="bg-orange-50 text-orange-500 p-2 rounded-full mr-3">
                            <Globe size={18} />
                        </div>
                        <span className="text-sm font-medium text-gray-700">Language</span>
                    </div>
                    <div className="flex items-center">
                        <span className="text-xs text-gray-400 mr-2">
                            {LANGUAGES.find(l => l.code === language)?.name || 'English'}
                        </span>
                        <ChevronRight size={16} className="text-gray-300" />
                    </div>
                </button>

                <SettingItem icon={Shield} color="text-green-500" bg="bg-green-50" label="Security" />
                <SettingItem icon={Lock} color="text-red-500" bg="bg-red-50" label="Privacy Policy" />
                <SettingItem icon={FileText} color="text-gray-500" bg="bg-gray-100" label="Terms of Service" />
            </div>
        </div>

        {/* Support */}
        <div className="bg-white rounded-3xl shadow-lg p-6 border border-gray-100 transition-colors duration-300">
            <h3 className="text-gray-800 font-bold text-lg mb-4">Support</h3>
            <div className="space-y-1">
                <SettingItem icon={HelpCircle} color="text-teal-500" bg="bg-teal-50" label="Help Center" />
                <SettingItem icon={Info} color="text-blue-500" bg="bg-blue-50" label="About AgriBee" value="v1.0.0" />
            </div>
        </div>

      </div>

      {/* Language Selection Modal */}
      {showLangModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowLangModal(false)} />
            <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl relative z-10 overflow-hidden animate-slide-up">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-gray-800">Select Language</h3>
                    <button onClick={() => setShowLangModal(false)} className="p-2 rounded-full hover:bg-gray-200">
                        <X size={20} />
                    </button>
                </div>
                <div className="max-h-[60vh] overflow-y-auto p-2">
                    {LANGUAGES.map(lang => (
                        <button
                            key={lang.code}
                            onClick={() => {
                                setLanguage(lang.code);
                                setShowLangModal(false);
                            }}
                            className={`w-full flex items-center justify-between p-4 rounded-xl mb-1 transition-colors ${
                                language === lang.code 
                                ? 'bg-green-50 text-green-700 font-bold' 
                                : 'hover:bg-gray-50 text-gray-700'
                            }`}
                        >
                            <span>{lang.name}</span>
                            {language === lang.code && <Check size={18} />}
                        </button>
                    ))}
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

interface SettingItemProps {
    icon: React.ElementType;
    color: string;
    bg: string;
    label: string;
    value?: string;
}

const SettingItem: React.FC<SettingItemProps> = ({ icon: Icon, color, bg, label, value }) => (
    <button className="w-full flex items-center justify-between py-3 hover:bg-gray-50 px-2 rounded-xl transition-colors">
        <div className="flex items-center">
            <div className={`${bg} ${color} p-2 rounded-full mr-3`}>
                <Icon size={18} />
            </div>
            <span className="text-sm font-medium text-gray-700">{label}</span>
        </div>
        <div className="flex items-center">
            {value && <span className="text-xs text-gray-400 mr-2">{value}</span>}
            <ChevronRight size={16} className="text-gray-300" />
        </div>
    </button>
);
import React, { useState, useEffect } from 'react';
import { SignupScreen } from './pages/SignupScreen';
import { LoginScreen } from './pages/LoginScreen';
import { HomeScreen } from './pages/HomeScreen';
import { ScanCropScreen } from './pages/ScanCropScreen';
import { MarketplaceScreen } from './pages/MarketplaceScreen';
import { OrderHistoryScreen } from './pages/OrderHistoryScreen';
import { SettingsScreen } from './pages/SettingsScreen';
import { ProfileScreen } from './pages/ProfileScreen';
import { DroneScreen } from './pages/DroneScreen';

export type Page = 'signup' | 'login' | 'home' | 'scan' | 'market' | 'orders' | 'settings' | 'profile' | 'drone';

export interface AppSettings {
  notifications: boolean;
  sounds: boolean;
  urgentAlerts: boolean;
}

export interface UserCoordinates {
  lat: number;
  lon: number;
}

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('signup');
  const [userName, setUserName] = useState<string>('Farmer');
  const [userLocation, setUserLocation] = useState<string>('Locating...');
  const [userCoordinates, setUserCoordinates] = useState<UserCoordinates | null>(null);
  
  // Global App Settings
  const [language, setLanguage] = useState('en-US');
  const [appSettings, setAppSettings] = useState<AppSettings>({
    notifications: true,
    sounds: true,
    urgentAlerts: true,
  });

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('agribee_settings');
    if (savedSettings) {
      setAppSettings(JSON.parse(savedSettings));
    }

    const savedLang = localStorage.getItem('agribee_language');
    if (savedLang) {
      setLanguage(savedLang);
    }
    
    const savedName = localStorage.getItem('agribee_username');
    if (savedName) {
      setUserName(savedName);
    }

    // Get Real-time Location
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Store coordinates for Weather API
        setUserCoordinates({ lat: latitude, lon: longitude });

        try {
          // Reverse Geocoding using OpenStreetMap Nominatim (Free, No Key)
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await response.json();
          
          const city = data.address.city || data.address.village || data.address.town || data.address.county || "My Farm";
          const state = data.address.state;
          
          const formattedLocation = state ? `${city}, ${state}` : city;
          setUserLocation(formattedLocation);
        } catch (error) {
          console.error("Error fetching location name:", error);
          setUserLocation("My Farm (GPS)");
        }
      }, (error) => {
        console.error("Geolocation error:", error);
        setUserLocation("India (Default)");
        // Default coordinates for India (approx center/capital) if auth denied, 
        // enables weather demo to still work
        setUserCoordinates({ lat: 20.5937, lon: 78.9629 }); 
      });
    } else {
      setUserLocation("Location Unavailable");
      setUserCoordinates({ lat: 20.5937, lon: 78.9629 });
    }

  }, []);

  // Save settings whenever they change
  useEffect(() => {
    localStorage.setItem('agribee_settings', JSON.stringify(appSettings));
    localStorage.setItem('agribee_language', language);
    localStorage.setItem('agribee_username', userName);
  }, [appSettings, language, userName]);

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setAppSettings(prev => ({ ...prev, ...newSettings }));
  };

  return (
    <div className="h-full">
      <div className="antialiased text-gray-900 h-full bg-gray-50 transition-colors duration-300">
        {currentPage === 'signup' && (
          <SignupScreen 
            onNavigateToLogin={() => setCurrentPage('login')}
            onLoginSuccess={() => setCurrentPage('home')}
            setUserName={setUserName}
          />
        )}
        
        {currentPage === 'login' && (
          <LoginScreen 
            onNavigateToSignup={() => setCurrentPage('signup')}
            onLoginSuccess={() => setCurrentPage('home')}
            setUserName={setUserName}
          />
        )}

        {currentPage === 'home' && (
          <HomeScreen 
            onNavigate={setCurrentPage} 
            currentTab="home" 
            userName={userName}
            appSettings={appSettings}
            userLocation={userLocation}
            userCoordinates={userCoordinates}
          />
        )}

        {currentPage === 'scan' && (
          <ScanCropScreen 
            onNavigate={setCurrentPage} 
            currentTab="scan" 
            userName={userName}
          />
        )}

        {currentPage === 'market' && (
          <MarketplaceScreen 
            onNavigate={setCurrentPage} 
            currentTab="market" 
            userName={userName}
            userLocation={userLocation}
          />
        )}

        {currentPage === 'orders' && (
          <OrderHistoryScreen 
            onNavigate={setCurrentPage} 
            currentTab="orders" 
            userName={userName}
          />
        )}

        {currentPage === 'settings' && (
          <SettingsScreen 
            onNavigate={setCurrentPage} 
            currentTab="settings" 
            userName={userName}
            appSettings={appSettings}
            updateSettings={updateSettings}
            language={language}
            setLanguage={setLanguage}
          />
        )}

        {currentPage === 'profile' && (
          <ProfileScreen 
            onNavigate={setCurrentPage} 
            currentTab="profile" 
            userName={userName}
            setUserName={setUserName}
          />
        )}

        {currentPage === 'drone' && (
          <DroneScreen 
            onNavigate={setCurrentPage}
            currentTab="drone"
            userName={userName}
          />
        )}
      </div>
    </div>
  );
};

export default App;
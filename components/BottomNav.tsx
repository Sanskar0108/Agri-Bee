
import React from 'react';
import { Home, ScanLine, Store, FileClock } from 'lucide-react';
import { Page } from '../App';

interface BottomNavProps {
  onNavigate: (page: Page) => void;
  activeTab: string;
}

export const BottomNav: React.FC<BottomNavProps> = ({ onNavigate, activeTab }) => {
  
  const handleDroneClick = () => {
    onNavigate('drone');
  };

  return (
    <div className="fixed bottom-6 left-4 right-4 z-50">
      <div className="bg-white/90 backdrop-blur-xl border border-white/50 rounded-3xl shadow-2xl h-16 flex items-center justify-around px-2 relative">
        
        <NavItem 
          icon={Home} 
          label="Home" 
          active={activeTab === 'home'} 
          onClick={() => onNavigate('home')} 
        />
        <NavItem 
          icon={ScanLine} 
          label="Scan" 
          active={activeTab === 'scan'} 
          onClick={() => onNavigate('scan')} 
        />
        
        {/* Floating Drone Button */}
        <div className="relative -top-6 group">
          <button 
            onClick={handleDroneClick}
            className={`bg-white p-1 rounded-full shadow-lg shadow-green-500/30 transform transition-all active:scale-90 hover:scale-110 border-4 flex items-center justify-center w-16 h-16 overflow-hidden relative z-10 ${activeTab === 'drone' ? 'border-green-500 ring-2 ring-green-200' : 'border-gray-50'}`}
          >
            <img 
              src="https://images.unsplash.com/photo-1473968512647-3e447244af8f?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80" 
              alt="Drone" 
              className="w-full h-full object-cover rounded-full"
            />
            {activeTab !== 'drone' && (
              <div className="absolute inset-0 bg-black/10 rounded-full group-hover:bg-transparent transition-colors"></div>
            )}
          </button>
        </div>

        <NavItem 
          icon={Store} 
          label="Market" 
          active={activeTab === 'market'} 
          onClick={() => onNavigate('market')} 
        />
        
        <NavItem 
          icon={FileClock} 
          label="Orders" 
          active={activeTab === 'orders'} 
          onClick={() => onNavigate('orders')} 
        />

      </div>
    </div>
  );
};

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon: Icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 ${active ? 'text-green-600' : 'text-gray-400 hover:text-green-500'}`}
  >
    <Icon size={24} strokeWidth={active ? 2.5 : 2} />
    <span className="text-[10px] mt-0.5 font-medium">{label}</span>
    {active && <div className="w-1 h-1 bg-green-600 rounded-full mt-1" />}
  </button>
);
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Menu, X, Home, ScanLine, Store, FileClock, User, Settings, LogOut, ChevronRight } from 'lucide-react';
import { Page } from '../App';

interface SideMenuProps {
  onNavigate: (page: Page) => void;
  currentPage: string;
  whiteIcon?: boolean;
  userName?: string;
}

export const SideMenu: React.FC<SideMenuProps> = ({ onNavigate, currentPage, whiteIcon = false, userName = "Farmer" }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleNavigate = (page: Page) => {
    onNavigate(page);
    setIsOpen(false);
  };

  const menuContent = (
    <>
      {/* Overlay - High z-index to ensure it sits above everything */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9990] transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Drawer - Highest z-index */}
      <div className={`fixed top-0 left-0 h-full w-80 bg-white dark:bg-gray-900 z-[9999] shadow-2xl transform transition-transform duration-300 ease-out flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* Header */}
        <div className="bg-[#1C6E3E] p-6 pb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
          <button 
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 p-1 rounded-full"
          >
            <X size={20} />
          </button>

          <div className="flex items-center space-x-4 relative z-10 mt-4">
            <div className="w-16 h-16 rounded-full border-2 border-white/50 overflow-hidden bg-white">
               <img src="https://i.pravatar.cc/150?img=11" alt="User" className="w-full h-full object-cover" />
            </div>
            <div>
               <h2 className="text-white font-bold text-xl">{userName}</h2>
               <p className="text-green-200 text-xs">Premium Member</p>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-2 bg-gray-50 dark:bg-gray-900">
          <MenuItem 
            icon={Home} 
            label="Home" 
            active={currentPage === 'home'} 
            onClick={() => handleNavigate('home')} 
          />
          <MenuItem 
            icon={ScanLine} 
            label="Scan Crop" 
            active={currentPage === 'scan'} 
            onClick={() => handleNavigate('scan')} 
          />
          <MenuItem 
            icon={Store} 
            label="Marketplace" 
            active={currentPage === 'market'} 
            onClick={() => handleNavigate('market')} 
          />
          <MenuItem 
            icon={FileClock} 
            label="Order History" 
            active={currentPage === 'orders'} 
            onClick={() => handleNavigate('orders')} 
          />
          
          <div className="my-4 border-t border-gray-200 dark:border-gray-800 mx-4"></div>

          <MenuItem 
            icon={User} 
            label="My Profile" 
            active={currentPage === 'profile'}
            onClick={() => handleNavigate('profile')} 
          />
          <MenuItem 
            icon={Settings} 
            label="Settings" 
            active={currentPage === 'settings'}
            onClick={() => handleNavigate('settings')} 
          />
          
          {/* Logout */}
          <button 
            onClick={() => handleNavigate('login')}
            className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-200 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 group"
          >
            <div className="flex items-center">
              <LogOut size={22} className="mr-4 group-hover:text-red-600" />
              <span className="font-medium">Logout</span>
            </div>
          </button>

        </div>
        
        {/* Footer Info */}
        <div className="p-4 bg-white dark:bg-gray-900 text-center border-t border-gray-100 dark:border-gray-800">
           <p className="text-xs text-gray-400 dark:text-gray-600">AgriBee v1.0.0</p>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Trigger Button */}
      <button 
        onClick={() => setIsOpen(true)} 
        className={`p-2 rounded-xl transition-transform active:scale-95 ${whiteIcon ? 'text-white hover:bg-white/20' : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800'}`}
      >
        <Menu size={28} strokeWidth={2.5} />
      </button>

      {/* Render Menu via Portal */}
      {createPortal(menuContent, document.body)}
    </>
  );
};

interface MenuItemProps {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  onClick: () => void;
}

const MenuItem: React.FC<MenuItemProps> = ({ icon: Icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-200 group ${
      active 
        ? 'bg-green-600 text-white shadow-lg shadow-green-200 dark:shadow-none' 
        : 'text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 hover:shadow-sm'
    }`}
  >
    <div className="flex items-center">
      <Icon size={22} className={`${active ? 'text-white' : 'text-gray-500 dark:text-gray-400 group-hover:text-green-600'} mr-4`} />
      <span className={`font-medium ${active ? 'font-bold' : ''}`}>{label}</span>
    </div>
    {active && <ChevronRight size={18} className="text-green-200" />}
  </button>
);
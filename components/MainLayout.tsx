import React from 'react';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="fixed inset-0 w-full h-full bg-gray-50 overflow-hidden transition-colors duration-300">
      {/* Background Image */}
      <div className="absolute inset-0 z-0 pointer-events-none select-none">
        <img 
          src="https://picsum.photos/seed/wheatfield/1920/1080" 
          alt="Wheat Field" 
          className="w-full h-full object-cover opacity-20 filter sepia brightness-110"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-white/30 to-green-50/50 mix-blend-overlay"></div>
      </div>

      {/* Content Container */}
      <div className="absolute inset-0 w-full h-full overflow-y-auto overflow-x-hidden z-10 pb-24">
        <div className="max-w-md mx-auto min-h-full relative">
            {children}
        </div>
      </div>
    </div>
  );
};
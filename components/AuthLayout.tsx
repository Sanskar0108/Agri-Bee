import React from 'react';
import { Sprout } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="fixed inset-0 w-full h-full bg-gradient-to-b from-amber-300 via-amber-400 to-yellow-600 overflow-hidden">
      
      {/* Background Texture/Image overlay to simulate wheat field feeling */}
      <div className="absolute bottom-0 w-full h-1/2 z-0 pointer-events-none select-none">
        <img 
          src="https://picsum.photos/seed/wheatfield/1920/1080" 
          alt="Wheat Field" 
          className="w-full h-full object-cover opacity-40 mix-blend-overlay mask-image-gradient filter sepia brightness-90 contrast-125"
          style={{ maskImage: 'linear-gradient(to top, black 50%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to top, black 50%, transparent 100%)' }}
        />
      </div>

      {/* Decorative Overlay Circles */}
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[10%] left-[-10%] w-80 h-80 bg-yellow-200/20 rounded-full blur-3xl pointer-events-none" />

      {/* Scrollable Container for Responsiveness */}
      <div className="absolute inset-0 w-full h-full overflow-y-auto overflow-x-hidden">
        <div className="min-h-full w-full flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          
          {/* Main Content Container */}
          <div className="z-10 w-full max-w-md flex flex-col items-center animate-fade-in">
            
            {/* Logo */}
            <div className="bg-white rounded-2xl p-5 shadow-xl mb-8 transform hover:scale-105 transition-transform duration-300">
                <Sprout className="text-amber-500 w-10 h-10" />
            </div>

            {/* Glassmorphic Card */}
            <div className="w-full bg-white/20 backdrop-blur-md border border-white/40 rounded-3xl p-6 sm:p-8 shadow-2xl">
              {children}
            </div>

            {/* Footer Links Area */}
            <div className="mt-6 text-center z-10 mb-4">
              <span className="text-white/80 text-sm">Protected by reCAPTCHA</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
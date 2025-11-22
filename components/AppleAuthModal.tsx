import React, { useState, useEffect } from 'react';
import { X, Loader2, ArrowRight, Lock, Fingerprint } from 'lucide-react';

interface AppleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (email: string) => void;
}

export const AppleAuthModal: React.FC<AppleAuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState<'id' | 'password' | 'processing'>('id');
  const [appleId, setAppleId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setStep('id');
      setAppleId('');
      setPassword('');
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleIdSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appleId.includes('@')) {
      setError('Enter a valid Apple ID (email)');
      return;
    }
    setStep('processing');
    setTimeout(() => {
      setStep('password');
      setError('');
    }, 800);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 4) {
      setError('Your Apple ID or password was incorrect.');
      return;
    }
    setStep('processing');
    setTimeout(() => {
      onSuccess(appleId);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 font-sans">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="bg-white w-full max-w-[500px] rounded-2xl shadow-2xl relative z-10 overflow-hidden animate-fade-in flex flex-col min-h-[500px]">
        
        {/* Header */}
        <div className="p-4 flex justify-end">
             <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 bg-gray-100 rounded-full transition-colors">
                 <X size={16} />
             </button>
        </div>

        <div className="flex flex-col items-center px-12 pb-12 flex-1">
            
            {/* Apple Logo */}
            <div className="mb-6">
                <svg className="w-12 h-12" viewBox="0 0 24 24" fill="currentColor">
                   <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.78 1.18-.19 2.31-.89 3.51-.84 1.54.06 2.77.79 3.45 1.9C16.1 10.9 18.29 13.1 17.05 20.28zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                </svg>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">
               {step === 'processing' ? 'Working...' : 'Sign In with Apple'}
            </h2>
            
            <p className="text-center text-gray-500 mb-8 text-lg">
               {step === 'id' && 'Enter your Apple ID to continue to AgriBee.'}
               {step === 'password' && 'Enter your password for'}
               {step === 'password' && <span className="block font-medium text-gray-800 mt-1">{appleId}</span>}
            </p>

            {step === 'processing' ? (
               <div className="flex-1 flex items-center justify-center">
                  <Loader2 size={48} className="text-gray-400 animate-spin" />
               </div>
            ) : (
               <form onSubmit={step === 'id' ? handleIdSubmit : handlePasswordSubmit} className="w-full space-y-6">
                  
                  <div className="space-y-4">
                    <div className="relative group">
                        {step === 'id' ? (
                            <input 
                                type="email" 
                                value={appleId}
                                onChange={(e) => setAppleId(e.target.value)}
                                placeholder="Apple ID"
                                className={`w-full bg-transparent border-b border-gray-300 py-2 text-lg outline-none focus:border-blue-500 transition-colors placeholder-gray-400 ${error ? 'border-red-500' : ''}`}
                                autoFocus
                            />
                        ) : (
                             <div className="relative">
                                <input 
                                    type="password" 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Password"
                                    className={`w-full bg-transparent border-b border-gray-300 py-2 text-lg outline-none focus:border-blue-500 transition-colors placeholder-gray-400 pr-10 ${error ? 'border-red-500' : ''}`}
                                    autoFocus
                                />
                                <Lock size={18} className="absolute right-0 top-3 text-gray-400" />
                            </div>
                        )}
                        {error && <p className="text-red-500 text-xs mt-2 text-center">{error}</p>}
                    </div>
                  </div>

                  <div className="flex justify-center pt-4">
                      <button 
                        type="button" 
                        className="w-12 h-12 rounded-full border border-gray-200 hover:border-gray-400 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                        onClick={step === 'id' ? handleIdSubmit : handlePasswordSubmit}
                      >
                         <ArrowRight size={24} className="text-gray-700" />
                      </button>
                  </div>

                  {step === 'id' && (
                      <div className="text-center pt-6 border-t border-gray-100 mt-6">
                          <div className="flex items-center justify-center space-x-2 text-blue-500 cursor-pointer hover:underline">
                              <span className="text-sm">Create Apple ID</span>
                          </div>
                          <div className="flex items-center justify-center space-x-2 text-blue-500 cursor-pointer hover:underline mt-2">
                              <span className="text-sm">Forgot Apple ID or password?</span>
                          </div>
                      </div>
                  )}
               </form>
            )}
        </div>
        
        {/* Footer */}
        <div className="bg-gray-50 p-4 text-center text-xs text-gray-400 border-t border-gray-100">
            Copyright © 2024 Apple Inc. All rights reserved. | Privacy Policy
        </div>
      </div>
    </div>
  );
};
import React, { useState, useEffect } from 'react';
import { X, Loader2, AlertTriangle, ShieldCheck } from 'lucide-react';

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (email: string) => void;
}

export const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState<'email' | 'password' | 'verify' | 'loading'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setStep('email');
      setEmail('');
      setPassword('');
      setOtp('');
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Strict Gmail Regex: Alphanumeric + dots/underscores + @gmail.com
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    
    if (!email) {
      setError('Enter an email or phone number');
      return;
    }

    if (!gmailRegex.test(email)) {
      setError("Couldn't find your Google Account. Make sure it's a valid @gmail.com address.");
      return;
    }
    
    // Simulate network lookup
    setStep('loading');
    setTimeout(() => {
      setStep('password');
      setError('');
    }, 1000);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('Enter a password');
      return;
    }
    if (password.length < 8) { 
      setError('Wrong password. Try again or click Forgot password to reset it.');
      return;
    }
    
    // Simulate auth check
    setStep('loading');
    setTimeout(() => {
      setStep('verify'); // Move to 2FA simulation
      setError('');
    }, 1200);
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 6 || !/^\d+$/.test(otp)) {
        setError('Invalid code. Enter the 6-digit code sent to your email.');
        return;
    }
    
    // Simulate final verification
    setStep('loading');
    setTimeout(() => {
      onSuccess(email);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 font-sans">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="bg-white w-full max-w-[450px] rounded-2xl shadow-2xl relative z-10 overflow-hidden animate-fade-in flex flex-col min-h-[500px]">
        {step === 'loading' ? (
           <div className="flex flex-col items-center justify-center flex-1 p-8">
             <Loader2 size={48} className="text-blue-500 animate-spin mb-6" />
             <p className="text-gray-800 font-medium text-lg">
                {password && !otp ? 'Verifying password...' : otp ? 'Checking code...' : 'Checking info...'}
             </p>
           </div>
        ) : (
          <div className="p-8 pt-10 flex-1 flex flex-col">
            <div className="flex justify-center mb-6">
               <svg viewBox="0 0 24 24" className="w-12 h-12">
                 <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                 <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                 <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                 <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
               </svg>
            </div>
            
            <h2 className="text-2xl text-center font-medium text-gray-800 mb-2">
              {step === 'email' ? 'Sign in' : step === 'password' ? 'Welcome' : '2-Step Verification'}
            </h2>
            
            <div className="text-center text-gray-600 text-base mb-8">
              {step === 'email' && <span>to continue to AgriBee</span>}
              
              {step === 'password' && (
                <button onClick={() => setStep('email')} className="flex items-center justify-center border border-gray-200 rounded-full px-3 py-1.5 text-sm font-medium mx-auto hover:bg-gray-50 transition-colors cursor-pointer">
                   <div className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs mr-2 font-bold">
                     {email.charAt(0).toUpperCase()}
                   </div>
                   <span className="mr-2 text-gray-800">{email}</span>
                   <X size={14} />
                </button>
              )}

              {step === 'verify' && (
                <div className="flex flex-col items-center">
                  <span className="mb-2">To help keep your account safe, Google wants to make sure it’s really you trying to sign in.</span>
                  <div className="flex items-center bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold border border-blue-100">
                    <ShieldCheck size={12} className="mr-1" /> 
                    Code sent to {email}
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={step === 'email' ? handleEmailSubmit : step === 'password' ? handlePasswordSubmit : handleOtpSubmit} className="flex-1 flex flex-col">
               <div className="flex-1">
                 {/* EMAIL STEP */}
                 {step === 'email' && (
                   <div className="relative">
                     <input 
                        type="text" 
                        className={`w-full border rounded px-3 py-4 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all peer placeholder-transparent text-base ${error ? 'border-red-500' : 'border-gray-300'}`}
                        placeholder="Email or phone"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoFocus
                        id="google-email"
                     />
                     <label 
                        htmlFor="google-email"
                        className="absolute left-3 -top-2.5 bg-white px-1 text-xs text-blue-600 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-600 peer-placeholder-shown:top-4 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-blue-600"
                     >
                        Email or phone
                     </label>
                     {error && <p className="text-red-600 text-xs mt-2 flex items-center"><AlertTriangle size={14} className="mr-1"/> {error}</p>}
                     <button type="button" className="text-blue-600 text-sm font-bold mt-3 hover:bg-blue-50 p-1 -ml-1 rounded">Forgot email?</button>
                   </div>
                 )}

                 {/* PASSWORD STEP */}
                 {step === 'password' && (
                    <div className="relative animate-slide-up">
                     <input 
                        type="password" 
                        className={`w-full border rounded px-3 py-4 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all peer placeholder-transparent text-base ${error ? 'border-red-500' : 'border-gray-300'}`}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoFocus
                        id="google-pass"
                     />
                     <label 
                        htmlFor="google-pass"
                        className="absolute left-3 -top-2.5 bg-white px-1 text-xs text-blue-600 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-600 peer-placeholder-shown:top-4 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-blue-600"
                     >
                        Enter your password
                     </label>
                     {error && <p className="text-red-600 text-xs mt-2 flex items-center"><AlertTriangle size={14} className="mr-1"/> {error}</p>}
                     <div className="flex items-center mt-3">
                        <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" id="show-pass" onClick={() => {
                            const input = document.getElementById('google-pass') as HTMLInputElement;
                            if (input) input.type = input.type === 'password' ? 'text' : 'password';
                        }}/>
                        <label htmlFor="show-pass" className="text-sm text-gray-600 ml-2 cursor-pointer">Show password</label>
                     </div>
                   </div>
                 )}

                 {/* VERIFICATION STEP */}
                 {step === 'verify' && (
                   <div className="relative animate-slide-up">
                      <div className="mb-4">
                        <p className="text-sm font-bold text-gray-700 mb-1">Enter the code</p>
                        <div className="flex items-center space-x-2">
                           <span className="text-lg font-bold text-gray-400">G -</span>
                           <input 
                              type="text" 
                              maxLength={6}
                              className={`w-32 border-b-2 px-2 py-1 text-center text-xl font-bold tracking-widest outline-none focus:border-blue-500 transition-colors ${error ? 'border-red-500' : 'border-gray-300'}`}
                              value={otp}
                              onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                              autoFocus
                              placeholder="______"
                           />
                        </div>
                      </div>
                      {error && <p className="text-red-600 text-xs mt-2 flex items-center"><AlertTriangle size={14} className="mr-1"/> {error}</p>}
                      <p className="text-xs text-gray-500 mt-4">
                         A text message with a 6-digit verification code was just sent to your email/phone associated with this account. <span className="font-bold text-gray-400">(Demo: Any 6 digits)</span>
                      </p>
                   </div>
                 )}
               </div>

               <div className="flex justify-between items-center mt-10">
                  {step === 'email' ? (
                    <button type="button" className="text-blue-600 text-sm font-bold hover:bg-blue-50 px-3 py-2 rounded">Create account</button>
                  ) : (
                    <button type="button" onClick={() => setStep('email')} className="text-blue-600 text-sm font-bold hover:bg-blue-50 px-3 py-2 rounded">Try another way</button>
                  )}
                  
                  <button 
                    type="submit" 
                    className="bg-[#0b57d0] hover:bg-[#0b57d0]/90 text-white font-bold py-2.5 px-8 rounded-full transition-colors shadow-sm"
                  >
                    Next
                  </button>
               </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
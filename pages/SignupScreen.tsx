import React, { useState } from 'react';
import { AuthLayout } from '../components/AuthLayout';
import { InputField } from '../components/InputField';
import { PrimaryButton } from '../components/PrimaryButton';
import { SocialButton } from '../components/SocialButton';
import { GoogleAuthModal } from '../components/GoogleAuthModal';
import { AppleAuthModal } from '../components/AppleAuthModal';
import { User, Lock } from 'lucide-react';

interface SignupScreenProps {
  onNavigateToLogin: () => void;
  onLoginSuccess: () => void;
  setUserName: (name: string) => void;
}

export const SignupScreen: React.FC<SignupScreenProps> = ({ onNavigateToLogin, onLoginSuccess, setUserName }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [showAppleModal, setShowAppleModal] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      alert("Password Mismatched");
      return;
    }

    console.log('Signup:', formData);
    
    // Set the username to global state so it persists if they login right after
    setUserName(formData.username);
    
    // Redirect to login
    onNavigateToLogin();
  };

  const handleSocialLogin = (provider: 'google' | 'apple') => {
    if (provider === 'google') {
      setShowGoogleModal(true);
    } else {
      setShowAppleModal(true);
    }
  };

  const handleGoogleSuccess = (email: string) => {
    const nameFromEmail = email.split('@')[0];
    const formattedName = nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1);
    setUserName(formattedName);
    onLoginSuccess();
  };

  const handleAppleSuccess = (email: string) => {
    const nameFromEmail = email.split('@')[0];
    const formattedName = nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1);
    setUserName(formattedName);
    onLoginSuccess();
  };

  return (
    <>
      <AuthLayout>
        <h2 className="text-2xl font-bold text-white text-center mb-6 drop-shadow-sm">Create Account</h2>
        
        <form onSubmit={handleSubmit} className="space-y-2">
          <InputField
            name="username"
            type="text"
            placeholder="Username"
            icon={User}
            value={formData.username}
            onChange={handleChange}
            required
          />
          <InputField
            name="password"
            type="password"
            placeholder="Password"
            icon={Lock}
            value={formData.password}
            onChange={handleChange}
            required
          />
          <InputField
            name="confirmPassword"
            type="password"
            placeholder="Re-enter password"
            icon={Lock}
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />

          <div className="pt-2">
            <PrimaryButton type="submit">Sign Up</PrimaryButton>
          </div>
        </form>

        <div className="mt-6 text-center flex flex-col items-center">
          <p className="text-white text-sm mb-4">
            Already have an account?{' '}
            <button 
              onClick={onNavigateToLogin}
              className="font-bold hover:underline decoration-2 decoration-green-400"
            >
              Login
            </button>
          </p>
          
          <div className="relative flex py-3 items-center w-full">
            <div className="flex-grow border-t border-white/40"></div>
            <span className="flex-shrink mx-4 text-white/80 text-xs">OR</span>
            <div className="flex-grow border-t border-white/40"></div>
          </div>

          <div className="space-y-2 mt-2 w-full">
            <SocialButton provider="google" onClick={() => handleSocialLogin('google')} />
            <SocialButton provider="apple" onClick={() => handleSocialLogin('apple')} />
          </div>

          <button className="mt-6 text-white/90 text-sm hover:text-white transition-colors py-3 px-6 rounded-xl hover:bg-white/10 w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-white/40">
              Forgot Password?
          </button>
        </div>
      </AuthLayout>
      
      <GoogleAuthModal 
        isOpen={showGoogleModal} 
        onClose={() => setShowGoogleModal(false)} 
        onSuccess={handleGoogleSuccess} 
      />

      <AppleAuthModal 
        isOpen={showAppleModal} 
        onClose={() => setShowAppleModal(false)} 
        onSuccess={handleAppleSuccess} 
      />
    </>
  );
};
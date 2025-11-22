import React, { useState, useRef } from 'react';
import { SideMenu } from '../components/SideMenu';
import { Page } from '../App';
import { Camera, User, Phone, MapPin, Mail, Lock, Save, AlertCircle, Check } from 'lucide-react';

interface ProfileScreenProps {
  onNavigate: (page: Page) => void;
  currentTab: string;
  userName: string;
  setUserName: (name: string) => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onNavigate, currentTab, userName, setUserName }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);
  
  // Profile State
  const [profile, setProfile] = useState({
    name: userName,
    phone: '+91 98765 43210',
    location: 'Rampur Village, MP',
    email: 'farmer.ramesh@agribee.com',
  });

  // Password State
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  const [avatar, setAvatar] = useState('https://i.pravatar.cc/150?img=11');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setUserName(profile.name); // Update global state
    setMessage({ text: 'Profile updated successfully!', type: 'success' });
    setIsEditing(false);
    setTimeout(() => setMessage(null), 3000);
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      setMessage({ text: 'New passwords do not match.', type: 'error' });
      return;
    }
    if (passwords.new.length < 6) {
      setMessage({ text: 'Password must be at least 6 characters.', type: 'error' });
      return;
    }
    
    // Simulate API call
    console.log('Password changed');
    setPasswords({ current: '', new: '', confirm: '' });
    setMessage({ text: 'Password changed successfully!', type: 'success' });
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-poppins pb-10">
      {/* Header */}
      <div className="bg-[#1FAF55] pt-8 pb-24 px-5 rounded-b-[3rem] shadow-lg relative">
        <div className="flex justify-between items-center mb-4">
          <SideMenu onNavigate={onNavigate} currentPage={currentTab} whiteIcon={true} userName={userName} />
          <div>
            <h1 className="text-2xl font-bold text-white text-right">My Profile</h1>
            <p className="text-green-100 text-xs opacity-90 text-right">Manage Account Details</p>
          </div>
        </div>
      </div>

      <div className="px-5 -mt-20 relative z-10 space-y-6">
        
        {/* Profile Card */}
        <div className="bg-white rounded-3xl shadow-xl p-6 border border-gray-100 text-center relative">
          <div className="relative inline-block mb-4">
            <div className="w-32 h-32 rounded-full p-1 bg-white shadow-lg mx-auto overflow-hidden border-4 border-green-50">
              <img src={avatar} alt="Profile" className="w-full h-full object-cover rounded-full" />
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-2 right-0 bg-green-600 text-white p-2.5 rounded-full shadow-md hover:bg-green-700 transition-colors active:scale-95"
            >
              <Camera size={16} />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-800">{profile.name}</h2>
          <p className="text-gray-500 text-sm">Premium Farmer Account</p>

          {message && (
            <div className={`mt-4 p-3 rounded-xl text-sm flex items-center justify-center animate-fade-in ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {message.type === 'success' ? <Check size={16} className="mr-2" /> : <AlertCircle size={16} className="mr-2" />}
              {message.text}
            </div>
          )}
        </div>

        {/* Edit Details Form */}
        <div className="bg-white rounded-3xl shadow-lg p-6 border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-gray-800 text-lg">Personal Details</h3>
            <button 
              onClick={() => setIsEditing(!isEditing)}
              className="text-sm font-bold text-green-600 hover:text-green-700 hover:underline"
            >
              {isEditing ? 'Cancel' : 'Edit Details'}
            </button>
          </div>

          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  disabled={!isEditing}
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm outline-none transition-colors ${isEditing ? 'bg-white border-green-500 ring-2 ring-green-100' : 'bg-gray-50 border-gray-200 text-gray-600'}`}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">Phone Number</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Phone size={18} />
                </div>
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  disabled={!isEditing}
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm outline-none transition-colors ${isEditing ? 'bg-white border-green-500 ring-2 ring-green-100' : 'bg-gray-50 border-gray-200 text-gray-600'}`}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">Location / Village</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <MapPin size={18} />
                </div>
                <input
                  type="text"
                  value={profile.location}
                  onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                  disabled={!isEditing}
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm outline-none transition-colors ${isEditing ? 'bg-white border-green-500 ring-2 ring-green-100' : 'bg-gray-50 border-gray-200 text-gray-600'}`}
                />
              </div>
            </div>

            <div className="space-y-1 opacity-75">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-100 text-gray-500 text-sm cursor-not-allowed"
                />
              </div>
            </div>

            {isEditing && (
              <button 
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-green-200 transition-all active:scale-95 flex items-center justify-center mt-4"
              >
                <Save size={18} className="mr-2" /> Save Changes
              </button>
            )}
          </form>
        </div>

        {/* Security Section */}
        <div className="bg-white rounded-3xl shadow-lg p-6 border border-gray-100 mb-8">
          <h3 className="font-bold text-gray-800 text-lg mb-4">Security</h3>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">Current Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  value={passwords.current}
                  onChange={(e) => setPasswords({...passwords, current: e.target.value})}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-sm outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">New Password</label>
                <input
                  type="password"
                  value={passwords.new}
                  onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Confirm</label>
                <input
                  type="password"
                  value={passwords.confirm}
                  onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={!passwords.current || !passwords.new || !passwords.confirm}
              className="w-full bg-gray-800 hover:bg-gray-900 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all active:scale-95"
            >
              Update Password
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
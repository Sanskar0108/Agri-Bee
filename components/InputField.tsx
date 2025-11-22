import React from 'react';
import { LucideIcon } from 'lucide-react';

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: LucideIcon;
  label?: string;
}

export const InputField: React.FC<InputFieldProps> = ({ icon: Icon, label, className = '', ...props }) => {
  return (
    <div className="w-full mb-4">
      {label && <label className="block text-white text-sm mb-1 ml-1 font-medium">{label}</label>}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
            <Icon size={18} />
          </div>
        )}
        <input
          className={`w-full bg-white/80 backdrop-blur-sm border border-white/50 text-gray-800 placeholder-gray-400 rounded-xl py-3 ${Icon ? 'pl-10' : 'pl-4'} pr-4 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 shadow-sm ${className}`}
          {...props}
        />
      </div>
    </div>
  );
};
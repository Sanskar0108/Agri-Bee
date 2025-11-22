import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, Calendar as CalendarIcon } from 'lucide-react';

interface CalendarStripProps {
  selectedDate: number;
  onSelectDate: (date: number) => void;
}

export const CalendarStrip: React.FC<CalendarStripProps> = ({ selectedDate, onSelectDate }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showPast, setShowPast] = useState(false);
  
  const today = new Date().getDate();
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  
  // Generate days based on view mode
  // If showPast is false, start from today. If true, start from 1.
  const startDay = showPast ? 1 : today;
  const days = Array.from({ length: (daysInMonth - startDay + 1) }, (_, i) => startDay + i);

  // Auto scroll to selected date if needed, mostly relevant when showing full month
  useEffect(() => {
    if (scrollRef.current && selectedDate && showPast) {
       const index = selectedDate - 1;
       const element = scrollRef.current.children[index] as HTMLElement;
       if (element) {
         scrollRef.current.scrollTo({
           left: element.offsetLeft - scrollRef.current.offsetLeft - 20,
           behavior: 'smooth'
         });
       }
    }
  }, [selectedDate, showPast]);

  return (
    <div className="w-full bg-white/60 backdrop-blur-lg border border-white/40 rounded-3xl p-5 shadow-sm my-4 transition-all duration-300">
      <div 
        className="flex justify-between items-center mb-3 px-1 group cursor-pointer"
        onClick={() => setShowPast(!showPast)}
      >
        <div className="flex items-center gap-2">
           <h3 className="text-green-800 font-bold text-lg">Crop Scheduling</h3>
           <div className="bg-green-100 p-1 rounded-full text-green-600 group-hover:bg-green-200 transition-colors">
             {showPast ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
           </div>
        </div>
        <div className="flex items-center space-x-1 text-xs text-green-600 bg-green-100 px-2 py-1 rounded-lg font-medium">
          <CalendarIcon size={12} />
          <span>{new Date().toLocaleString('default', { month: 'long' })}</span>
        </div>
      </div>
      
      {!showPast && (
        <p className="text-[10px] text-gray-400 mb-2 px-1">
          Showing from today. Tap <span className="font-bold text-green-600">Header</span> to see past days.
        </p>
      )}

      <div 
        ref={scrollRef}
        className="flex overflow-x-auto pb-2 space-x-3 scrollbar-hide -mx-1 px-1 scroll-smooth"
      >
        {days.map((day) => (
          <button
            key={day}
            onClick={() => onSelectDate(day)}
            className={`flex-shrink-0 w-12 h-16 flex flex-col items-center justify-center rounded-2xl transition-all duration-300 border ${
              selectedDate === day
                ? 'bg-green-600 text-white border-green-600 shadow-green-500/30 shadow-lg scale-110'
                : 'bg-white text-gray-500 border-transparent hover:bg-green-50'
            }`}
          >
            <span className={`text-[10px] font-medium opacity-80 ${selectedDate === day ? 'text-green-100' : ''}`}>
                {['S','M','T','W','T','F','S'][new Date(new Date().getFullYear(), new Date().getMonth(), day).getDay()]}
            </span>
            <span className={`text-lg font-bold ${selectedDate === day ? 'text-white' : 'text-gray-800'}`}>
              {day}
            </span>
            {day === today && selectedDate !== today && (
               <div className="w-1 h-1 bg-green-500 rounded-full mt-1"></div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
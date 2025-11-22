import React, { useState, useEffect } from 'react';
import { CheckCircle, Circle, Plus, Trash2, CalendarX, X, Clock } from 'lucide-react';

interface Task {
  id: number;
  title: string;
  completed: boolean;
  time: string;
}

interface TaskWidgetProps {
  selectedDate: number;
}

export const TaskWidget: React.FC<TaskWidgetProps> = ({ selectedDate }) => {
  const today = new Date().getDate();
  const isPast = selectedDate < today;

  // Initial Tasks Mock Data
  const initialTasks = {
    20: [
        { id: 101, title: "Buy Wheat Seeds", completed: true, time: "09:00" },
        { id: 102, title: "Clean Tractor", completed: true, time: "17:00" }
    ],
    21: [
        { id: 201, title: "Call Mandi Agent", completed: false, time: "11:00" },
        { id: 202, title: "Fix Irrigation Pipe", completed: true, time: "14:30" }
    ],
    [today]: [
        { id: 1, title: "Water the Wheat Field", completed: false, time: "08:00" },
        { id: 2, title: "Check Soil pH Level", completed: true, time: "10:30" },
    ]
  };

  // Store tasks grouped by date (day number)
  const [allTasks, setAllTasks] = useState<Record<number, Task[]>>(() => {
    try {
      const saved = localStorage.getItem('agribee_tasks');
      return saved ? JSON.parse(saved) : initialTasks;
    } catch (e) {
      return initialTasks;
    }
  });

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskTime, setNewTaskTime] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Save to localStorage whenever tasks change
  useEffect(() => {
    localStorage.setItem('agribee_tasks', JSON.stringify(allTasks));
  }, [allTasks]);

  // Reset form when date changes or closing add mode
  useEffect(() => {
    setNewTaskTitle('');
    // Default to current time formatted HH:MM
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    setNewTaskTime(`${hours}:${minutes}`);
    setIsAdding(false);
  }, [selectedDate]);

  // Get tasks for current selected date, or empty array
  const currentTasks = allTasks[selectedDate] || [];

  const toggleTask = (id: number) => {
    setAllTasks(prev => ({
      ...prev,
      [selectedDate]: prev[selectedDate].map(t => 
        t.id === id ? { ...t, completed: !t.completed } : t
      )
    }));
  };

  const deleteTask = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this task?")) {
        setAllTasks(prev => ({
            ...prev,
            [selectedDate]: prev[selectedDate].filter(t => t.id !== id)
        }));
    }
  };

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask: Task = {
      id: Date.now(),
      title: newTaskTitle,
      completed: false,
      time: newTaskTime || '00:00'
    };

    setAllTasks(prev => ({
      ...prev,
      [selectedDate]: [...(prev[selectedDate] || []), newTask].sort((a, b) => a.time.localeCompare(b.time))
    }));

    setNewTaskTitle('');
    setIsAdding(false);
  };

  // Helper to format time for display (HH:MM to 12h format)
  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
  };

  return (
    <div className="w-full bg-white/80 backdrop-blur-xl rounded-3xl p-5 shadow-sm border border-white/50 transition-all duration-300">
      <div className="flex justify-between items-center mb-4">
        <div>
            <h3 className="text-gray-800 font-bold text-lg">Tasks</h3>
            <p className="text-xs text-gray-400 font-medium">
                {selectedDate === today ? 'Today, ' : ''} 
                {new Date().toLocaleString('default', { month: 'long' })} {selectedDate}
            </p>
        </div>
        <div className="flex items-center space-x-2">
            {currentTasks.length > 0 && (
                <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full">
                {currentTasks.filter(t => t.completed).length}/{currentTasks.length} Done
                </span>
            )}
            
            {isPast ? (
                <button 
                    onClick={() => alert("You cannot add tasks for past dates.")}
                    className="bg-gray-200 text-gray-400 p-1.5 rounded-lg cursor-not-allowed"
                    title="Cannot add to past dates"
                >
                    <CalendarX size={16} />
                </button>
            ) : (
                <button 
                    onClick={() => setIsAdding(!isAdding)}
                    className={`p-1.5 rounded-lg shadow-md active:scale-95 transition-all ${isAdding ? 'bg-red-500 text-white' : 'bg-green-600 text-white hover:bg-green-700'}`}
                >
                    {isAdding ? <X size={16} /> : <Plus size={16} />}
                </button>
            )}
        </div>
      </div>

      {/* Add Task Form */}
      {isAdding && !isPast && (
        <form onSubmit={addTask} className="mb-4 p-3 bg-green-50 rounded-2xl border border-green-100 animate-fade-in">
            <div className="flex flex-col gap-2">
                <input 
                    type="text" 
                    autoFocus
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="What needs to be done?" 
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500"
                />
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                            <Clock size={14} />
                        </div>
                        <input 
                            type="time" 
                            value={newTaskTime}
                            onChange={(e) => setNewTaskTime(e.target.value)}
                            className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-2 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500"
                        />
                    </div>
                    <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm active:scale-95">
                        Add Task
                    </button>
                </div>
            </div>
        </form>
      )}

      <div className="space-y-3 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
        {currentTasks.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm bg-white/50 rounded-2xl border-dashed border-2 border-gray-200 flex flex-col items-center justify-center">
                {isPast ? (
                    <span>No tasks were recorded for this day.</span>
                ) : (
                    <>
                        <span className="mb-2">No tasks for this day.</span>
                        <button 
                            onClick={() => setIsAdding(true)}
                            className="text-green-600 font-bold hover:underline"
                        >
                            Tap to add one
                        </button>
                    </>
                )}
            </div>
        ) : (
            currentTasks.map((task) => (
            <div
                key={task.id}
                onClick={() => toggleTask(task.id)}
                className={`flex items-center justify-between p-3 rounded-2xl transition-all duration-200 cursor-pointer group relative border ${
                task.completed 
                    ? 'bg-green-50/50 border-green-100' 
                    : 'bg-white border-transparent hover:border-green-100 hover:shadow-sm'
                }`}
            >
                <div className="flex items-center space-x-3 flex-1 overflow-hidden">
                    <div className={`flex-shrink-0 transition-colors duration-300 ${task.completed ? 'text-green-500' : 'text-gray-300 group-hover:text-green-400'}`}>
                        {task.completed ? <CheckCircle size={22} fill="currentColor" className="text-white" /> : <Circle size={22} />}
                    </div>
                    <div className="min-w-0">
                        <p className={`font-medium text-sm truncate ${task.completed ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                        {task.title}
                        </p>
                        <div className="flex items-center text-[10px] text-gray-400 mt-0.5">
                            <Clock size={10} className="mr-1" />
                            {formatTime(task.time)}
                        </div>
                    </div>
                </div>
                
                <button 
                    onClick={(e) => deleteTask(task.id, e)}
                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all flex-shrink-0"
                    title="Delete Task"
                >
                    <Trash2 size={16} />
                </button>
            </div>
            ))
        )}
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #E5E7EB;
            border-radius: 2px;
        }
      `}</style>
    </div>
  );
};

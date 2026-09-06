import React, { createContext, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { getDueNotifications } from '../api/tasks';
import { Bell } from 'lucide-react';
import { formatTime12h } from '../utils/timeUtils';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    // Check if user is logged in by checking localStorage for token (MVP check)
    const token = localStorage.getItem('access');
    if (!token) return;

    // Polling interval every 60 seconds
    const interval = setInterval(async () => {
      try {
        const dueTasks = await getDueNotifications();
        if (dueTasks && dueTasks.length > 0) {
          dueTasks.forEach(task => {
            addToast(`Time to start: ${task.name}`, `Scheduled for ${formatTime12h(task.start_time)}`);
          });
        }
      } catch (err) {
        console.error("Failed to fetch due notifications", err);
      }
    }, 60000);

    // Initial check
    setTimeout(() => {
      getDueNotifications().then(dueTasks => {
        if (dueTasks && dueTasks.length > 0) {
          dueTasks.forEach(task => {
            addToast(`Time to start: ${task.name}`, `Scheduled for ${formatTime12h(task.start_time)}`);
          });
        }
      }).catch(console.error);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const addToast = (title, message) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, title, message }]);
    
    // Auto remove after 8 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 8000);
  };

  return (
    <NotificationContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className="bg-slate-900 border border-blue-500/50 shadow-2xl p-4 rounded-2xl flex items-start gap-4 min-w-[300px] pointer-events-auto"
            >
              <div className="bg-blue-500/20 p-2 rounded-full text-blue-400">
                <Bell className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-white text-sm">{toast.title}</h4>
                <p className="text-xs text-gray-400 mt-1">{toast.message}</p>
              </div>
              <button 
                onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                className="text-gray-500 hover:text-white"
              >
                &times;
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
};

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CalendarDays, Target, BarChart3, Settings } from 'lucide-react';

const tabs = [
  { path: '/', label: 'Home', icon: CalendarDays },
  { path: '/goals', label: 'Roadmap', icon: Target },
  { path: '/progress', label: 'Progress', icon: BarChart3 },
  { path: '/settings', label: 'Settings', icon: Settings },
];

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Don't show on auth pages or admin
  const hiddenPaths = ['/login', '/register', '/verify-otp', '/admin/dashboard'];
  if (hiddenPaths.some(p => location.pathname.startsWith(p))) return null;

  // Also hide during onboarding
  if (location.pathname.startsWith('/onboarding')) return null;

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/' || location.pathname === '/timeline';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-xl border-t border-white/10 safe-area-bottom">
      <div className="max-w-lg mx-auto flex justify-around items-center h-16 px-2">
        {tabs.map(tab => {
          const active = isActive(tab.path);
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className="flex flex-col items-center justify-center gap-1 flex-1 py-2 relative"
            >
              {active && (
                <motion.div
                  layoutId="bottomnav-indicator"
                  className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-8 h-[3px] bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <tab.icon className={`w-5 h-5 transition-colors ${active ? 'text-blue-400' : 'text-gray-500'}`} />
              <span className={`text-[10px] font-medium transition-colors ${active ? 'text-blue-400' : 'text-gray-500'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;

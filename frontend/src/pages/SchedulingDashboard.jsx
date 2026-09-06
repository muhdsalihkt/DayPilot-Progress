import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getSchedules, generateSchedule } from '../api/scheduling';
import { Loader2, Calendar, Clock, Zap, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatTime12h } from '../utils/timeUtils';

const SchedulingDashboard = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      const data = await getSchedules();
      setSchedules(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      // In a real app we might loop through 7 days, for MVP we just generate tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];
      
      await generateSchedule(dateStr);
      await fetchSchedules();
    } catch (err) {
      console.error("Failed to generate schedule", err);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return <div className="text-white text-center mt-20">Loading Timeline...</div>;

  const formatTime = formatTime12h;

  const getBlockColor = (type) => {
    switch(type) {
      case 'SLEEP': return 'border-indigo-500/50 bg-indigo-500/10 text-indigo-300';
      case 'FIXED': return 'border-orange-500/50 bg-orange-500/10 text-orange-300';
      case 'EVERYDAY': return 'border-gray-500/50 bg-gray-500/10 text-gray-300';
      case 'TASK': return 'border-green-500/50 bg-green-500/10 text-green-300';
      case 'BREAK': return 'border-blue-500/50 bg-blue-500/10 text-blue-300';
      default: return 'border-white/20 bg-white/5 text-white';
    }
  };

  const getBlockIcon = (type) => {
    switch(type) {
      case 'TASK': return <Target className="w-4 h-4" />;
      case 'FIXED': return <Clock className="w-4 h-4" />;
      default: return <Zap className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-8 pb-24">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 bg-white/5 border border-white/10 p-5 md:p-8 rounded-3xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-64 h-64 bg-green-500/10 blur-3xl rounded-full mix-blend-screen" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-1.5 sm:mb-2">
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" />
              <h1 className="text-2xl sm:text-3xl font-bold">Scheduling Engine</h1>
            </div>
            <p className="text-gray-400 text-xs sm:text-sm">View and generate your daily timeline.</p>
          </div>
          <div className="relative z-10 flex flex-col sm:flex-row gap-2.5 sm:gap-4 w-full sm:w-auto">
            <button onClick={() => navigate('/')} className="bg-white/10 hover:bg-white/20 px-4 py-2.5 rounded-xl text-sm transition-colors border border-white/10 font-medium text-center">
              Dashboard
            </button>
            <button 
              onClick={handleGenerate}
              disabled={generating}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 py-2.5 px-6 rounded-xl font-medium transition-all shadow-lg shadow-green-500/20 flex items-center justify-center gap-2"
            >
              {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Generate Tomorrow'}
            </button>
          </div>
        </header>

        {schedules.length === 0 && !generating && (
          <div className="text-center p-8 sm:p-12 border border-white/10 rounded-3xl">
            <p className="text-gray-400 text-sm">No schedules generated yet. Click generate to plan tomorrow.</p>
          </div>
        )}

        {schedules.map((schedule) => (
          <div key={schedule.id} className="space-y-4 sm:space-y-6">
            <h2 className="text-xl sm:text-2xl font-bold border-b border-white/10 pb-3 sm:pb-4">Schedule for {schedule.date}</h2>
            
            <div className="space-y-3">
              {schedule.blocks.map((block) => (
                <motion.div 
                  key={block.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 p-3 sm:p-4 rounded-xl border ${getBlockColor(block.block_type)}`}
                >
                  <div className="w-24 sm:w-32 flex-shrink-0 font-mono text-xs sm:text-sm opacity-80">
                    {formatTime(block.start_time)} - {formatTime(block.end_time)}
                  </div>
                  <div className="flex items-center gap-2.5 font-medium text-sm sm:text-base">
                    {getBlockIcon(block.block_type)}
                    {block.title}
                  </div>
                  <div className="ml-auto text-[10px] sm:text-xs font-bold tracking-wider opacity-60">
                    {block.block_type}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SchedulingDashboard;

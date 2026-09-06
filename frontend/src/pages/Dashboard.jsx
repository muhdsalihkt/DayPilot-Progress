import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getGoals } from '../api/goals';
import { useNavigate } from 'react-router-dom';
import { Target, ArrowRight, Activity, CalendarDays } from 'lucide-react';
import { DashboardSkeleton } from '../components/SkeletonLoader';

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.4, ease: 'easeOut' }
  }),
};

const Dashboard = () => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchGoals = async () => {
      try {
        const data = await getGoals();
        setGoals(data);
      } catch (err) {
        console.error("Failed to fetch goals", err);
      } finally {
        setLoading(false);
      }
    };
    fetchGoals();
  }, []);

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-8 pb-24">
      <div className="max-w-6xl mx-auto space-y-10">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
              Your Goals
            </h1>
            <p className="text-gray-400 mt-1 text-xs sm:text-sm">Manage your AI-generated roadmaps.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 w-full sm:w-auto">
            <button onClick={() => navigate('/')} className="bg-green-600/20 hover:bg-green-600/30 text-green-400 px-4 py-2.5 rounded-xl text-sm border border-green-500/20 transition-colors flex items-center justify-center gap-2 font-medium">
              Daily Timeline
            </button>
            <button onClick={() => navigate('/onboarding')} className="bg-white/10 hover:bg-white/20 px-4 py-2.5 rounded-xl text-sm border border-white/10 transition-colors text-center font-medium">
              + New Goal
            </button>
          </div>
        </header>

        {goals.length === 0 ? (
          <div className="text-center p-16 bg-white/5 rounded-3xl border border-white/10">
            <Target className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">You don't have any active goals yet.</p>
            <button onClick={() => navigate('/onboarding')} className="mt-4 text-blue-400 hover:text-blue-300 text-sm">Set one up now &rarr;</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {goals.map((goal, idx) => (
              <motion.div 
                key={goal.id}
                custom={idx}
                initial="hidden"
                animate="visible"
                variants={cardVariants}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white/5 border border-white/10 p-6 rounded-3xl flex flex-col justify-between cursor-pointer"
                onClick={() => navigate(`/goals/${goal.id}/roadmap`)}
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-bold">{goal.name}</h3>
                    <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-1 rounded-md border border-blue-500/30 whitespace-nowrap">
                      {goal.goal_type}
                    </span>
                  </div>
                  
                  <div className="space-y-1.5 text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4" />
                      Level: {goal.initial_estimate_level}/10
                    </div>
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-4 h-4" />
                      Phases: {goal.phases?.length || 0}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-5">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-gray-500">Progress</span>
                      <span className="font-bold text-blue-400">{goal.progress_percentage || 0}%</span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden border border-white/10">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${goal.progress_percentage || 0}%` }}
                        transition={{ duration: 1, delay: idx * 0.1 + 0.3, ease: "easeOut" }}
                        className="bg-gradient-to-r from-blue-500 to-indigo-500 h-1.5 rounded-full"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between text-sm text-gray-400 pt-4 border-t border-white/5">
                  <span>View Roadmap</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

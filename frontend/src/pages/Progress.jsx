import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSchedules, toggleBlockComplete } from '../api/scheduling';
import { getGoals } from '../api/goals';
import { formatTime12h } from '../utils/timeUtils';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart3, CheckCircle2, Clock, Target, TrendingUp, CalendarDays, 
  Zap, Award, Activity, Sparkles, ArrowRight, Check, X, Shield, RefreshCw 
} from 'lucide-react';

const Progress = () => {
  const [schedules, setSchedules] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'timeline' | 'goals'
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [schedulesData, goalsData] = await Promise.all([
        getSchedules(),
        getGoals()
      ]);
      setSchedules(schedulesData || []);
      setGoals(goalsData || []);
    } catch (err) {
      console.error("Failed to load progress data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBlock = async (blockId) => {
    try {
      const res = await toggleBlockComplete(blockId);
      setSchedules(prev => prev.map(sched => ({
        ...sched,
        blocks: sched.blocks.map(b => b.id === blockId ? { ...b, is_completed: res.is_completed } : b)
      })));
    } catch (err) {
      console.error("Failed to toggle block status", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-gray-400 text-sm font-medium">Calculating progress metrics...</p>
        </div>
      </div>
    );
  }

  // --- Calculate Daily Timeline Progress ---
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySchedule = schedules.find(s => s.date === todayStr) || schedules[0] || null;
  const todayBlocks = todaySchedule ? todaySchedule.blocks.filter(b => b.block_type !== 'SLEEP') : [];
  
  const completedBlocks = todayBlocks.filter(b => b.is_completed || b.task?.status === 'COMPLETED');
  const pendingBlocks = todayBlocks.filter(b => !b.is_completed && b.task?.status !== 'COMPLETED' && b.task?.status !== 'SKIPPED');
  const skippedBlocks = todayBlocks.filter(b => b.task?.status === 'SKIPPED');

  const timelineCompletionPct = todayBlocks.length > 0
    ? Math.round((completedBlocks.length / todayBlocks.length) * 100)
    : 0;

  const getBlockMinutes = (block) => {
    if (block.task?.duration_minutes) return block.task.duration_minutes;
    const [sh, sm] = block.start_time.split(':').map(Number);
    const [eh, em] = block.end_time.split(':').map(Number);
    const mins = (eh * 60 + em) - (sh * 60 + sm);
    return mins > 0 ? mins : 30;
  };

  const totalMinutesPlanned = todayBlocks.reduce((acc, b) => acc + getBlockMinutes(b), 0);
  const totalMinutesCompleted = completedBlocks.reduce((acc, b) => acc + getBlockMinutes(b), 0);
  const plannedHours = (totalMinutesPlanned / 60).toFixed(1);
  const completedHours = (totalMinutesCompleted / 60).toFixed(1);

  // --- Calculate Goals & Roadmap Progress ---
  const totalGoals = goals.length;
  const avgGoalProgress = totalGoals > 0
    ? Math.round(goals.reduce((acc, g) => acc + (g.progress_percentage || 0), 0) / totalGoals)
    : 0;

  let totalObjectives = 0;
  let completedObjectives = 0;
  goals.forEach(goal => {
    if (goal.phases) {
      goal.phases.forEach(phase => {
        if (phase.objectives) {
          totalObjectives += phase.objectives.length;
          completedObjectives += phase.objectives.filter(o => o.is_completed).length;
        }
      });
    }
  });

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-8 pb-24">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Page Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 bg-white/5 border border-white/10 p-5 md:p-8 rounded-3xl relative overflow-hidden backdrop-blur-xl">
          <div className="absolute top-0 right-0 w-72 h-72 bg-blue-500/10 blur-3xl rounded-full mix-blend-screen pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-1.5 sm:mb-2">
              <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg shadow-blue-500/20">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400">
                Progress & Performance
              </h1>
            </div>
            <p className="text-gray-400 text-xs sm:text-sm">
              Real-time analytics for your daily timeline and AI roadmaps.
            </p>
          </div>

          <div className="relative z-10 flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={() => navigate('/')}
              className="bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-xl text-sm border border-white/10 transition-colors flex items-center justify-center gap-2 w-full sm:w-auto font-medium"
            >
              <CalendarDays className="w-4 h-4 text-blue-400" />
              View Timeline
            </button>
          </div>
        </header>

        {/* Tab Filters */}
        <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/10 gap-1 w-full max-w-md mx-auto sm:mx-0">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'all'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'timeline'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Daily Timeline
          </button>
          <button
            onClick={() => setActiveTab('goals')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'goals'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Goal Roadmaps
          </button>
        </div>

        {/* Metric Highlights Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          {/* Daily Completion Card */}
          <motion.div
            whileHover={{ y: -3 }}
            className="bg-white/5 border border-white/10 p-4 sm:p-5 rounded-3xl relative overflow-hidden flex flex-col justify-between"
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full blur-2xl -mr-5 -mt-5" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-400 font-medium">Timeline Done</span>
              <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl border border-blue-500/30">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-blue-400">{timelineCompletionPct}%</div>
              <p className="text-[11px] text-gray-400 mt-1">
                {completedBlocks.length} of {todayBlocks.length} blocks completed
              </p>
            </div>
          </motion.div>

          {/* Productive Time Card */}
          <motion.div
            whileHover={{ y: -3 }}
            className="bg-white/5 border border-white/10 p-4 sm:p-5 rounded-3xl relative overflow-hidden flex flex-col justify-between"
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/10 rounded-full blur-2xl -mr-5 -mt-5" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-400 font-medium">Completed Time</span>
              <div className="p-2 bg-green-500/20 text-green-400 rounded-xl border border-green-500/30">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-green-400">{completedHours}h</div>
              <p className="text-[11px] text-gray-400 mt-1">
                Out of {plannedHours}h planned today
              </p>
            </div>
          </motion.div>

          {/* Goals Avg Card */}
          <motion.div
            whileHover={{ y: -3 }}
            className="bg-white/5 border border-white/10 p-4 sm:p-5 rounded-3xl relative overflow-hidden flex flex-col justify-between"
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 rounded-full blur-2xl -mr-5 -mt-5" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-400 font-medium">Avg Goal Progress</span>
              <div className="p-2 bg-purple-500/20 text-purple-400 rounded-xl border border-purple-500/30">
                <Target className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-purple-400">{avgGoalProgress}%</div>
              <p className="text-[11px] text-gray-400 mt-1">
                Across {totalGoals} active {totalGoals === 1 ? 'goal' : 'goals'}
              </p>
            </div>
          </motion.div>

          {/* Roadmap Objectives Card */}
          <motion.div
            whileHover={{ y: -3 }}
            className="bg-white/5 border border-white/10 p-4 sm:p-5 rounded-3xl relative overflow-hidden flex flex-col justify-between"
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-orange-500/10 rounded-full blur-2xl -mr-5 -mt-5" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-400 font-medium">Roadmap Tasks</span>
              <div className="p-2 bg-orange-500/20 text-orange-400 rounded-xl border border-orange-500/30">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-orange-400">{completedObjectives}</div>
              <p className="text-[11px] text-gray-400 mt-1">
                {totalObjectives > 0 ? `of ${totalObjectives} roadmap objectives done` : 'No objectives defined yet'}
              </p>
            </div>
          </motion.div>
        </div>

        {/* SECTION 1: DAILY TIMELINE PROGRESS */}
        {(activeTab === 'all' || activeTab === 'timeline') && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 border border-white/10 rounded-3xl p-5 sm:p-8 space-y-6 relative overflow-hidden"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-white/10">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-400" />
                  Today's Daily Timeline Progress
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  Track schedule execution and mark off activities in real-time.
                </p>
              </div>

              <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-full text-xs font-semibold text-blue-400">
                <Sparkles className="w-3.5 h-3.5" />
                {todaySchedule ? todaySchedule.date : 'No Schedule Today'}
              </div>
            </div>

            {/* Circular / Large Bar Visual Progress */}
            <div className="bg-black/30 border border-white/10 rounded-2xl p-5 sm:p-6 flex flex-col md:flex-row items-center gap-6">
              {/* Radial Meter / Progress Bar */}
              <div className="flex-1 w-full space-y-3">
                <div className="flex justify-between items-center text-sm font-semibold">
                  <span className="text-gray-300">Daily Execution Target</span>
                  <span className="text-blue-400 font-bold text-base">{timelineCompletionPct}%</span>
                </div>

                <div className="w-full bg-white/5 h-3.5 rounded-full overflow-hidden border border-white/10 p-0.5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${timelineCompletionPct}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full"
                  />
                </div>

                <div className="flex justify-between text-xs text-gray-400 pt-1">
                  <span>{completedBlocks.length} Completed</span>
                  <span>{pendingBlocks.length} Pending</span>
                  <span>{skippedBlocks.length} Skipped</span>
                </div>
              </div>

              {/* Time Breakdown Pill */}
              <div className="w-full md:w-auto bg-white/5 border border-white/10 p-4 rounded-xl flex items-center justify-around md:justify-center gap-6">
                <div className="text-center">
                  <p className="text-xs text-gray-400">Done Time</p>
                  <p className="text-lg font-bold text-green-400">{completedHours} hrs</p>
                </div>
                <div className="h-8 w-px bg-white/10" />
                <div className="text-center">
                  <p className="text-xs text-gray-400">Total Planned</p>
                  <p className="text-lg font-bold text-gray-200">{plannedHours} hrs</p>
                </div>
              </div>
            </div>

            {/* Blocks List & Interactive Toggles */}
            <div className="space-y-3 pt-2">
              <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider">Today's Schedule Breakdown</h3>
              
              {todayBlocks.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-white/10 rounded-2xl text-gray-400 text-sm">
                  <CalendarDays className="w-8 h-8 mx-auto mb-2 opacity-40 text-gray-400" />
                  No schedule blocks found for today.
                  <button onClick={() => navigate('/schedule')} className="block mx-auto mt-2 text-blue-400 hover:text-blue-300 font-medium">
                    Generate today's schedule &rarr;
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {todayBlocks.map((block) => {
                    const isDone = block.is_completed || block.task?.status === 'COMPLETED';
                    const isSkipped = block.task?.status === 'SKIPPED';

                    return (
                      <motion.div
                        key={block.id}
                        layout
                        className={`flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border transition-all ${
                          isDone 
                            ? 'bg-green-500/10 border-green-500/30' 
                            : isSkipped 
                            ? 'bg-orange-500/10 border-orange-500/30 opacity-70' 
                            : 'bg-white/5 border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0 flex-1">
                          <button
                            onClick={() => handleToggleBlock(block.id)}
                            className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all flex-shrink-0 ${
                              isDone
                                ? 'bg-green-500 border-green-500 text-black'
                                : 'border-white/30 hover:border-blue-400 text-transparent'
                            }`}
                            title={isDone ? 'Mark as incomplete' : 'Mark as done'}
                          >
                            <Check className="w-4 h-4 stroke-[3]" />
                          </button>

                          <div className="min-w-0 flex-1">
                            <p className={`font-semibold text-sm sm:text-base truncate ${isDone ? 'line-through text-gray-400' : 'text-white'}`}>
                              {block.title}
                            </p>
                            <p className="text-xs text-gray-400 flex items-center gap-2 mt-0.5">
                              <span className="font-mono">{formatTime12h(block.start_time)} - {formatTime12h(block.end_time)}</span>
                              <span>•</span>
                              <span className="uppercase text-[10px] font-bold tracking-wider">{block.block_type}</span>
                            </p>
                          </div>
                        </div>

                        <div className="ml-3 flex-shrink-0">
                          {isDone ? (
                            <span className="text-xs font-semibold bg-green-500/20 text-green-300 px-2.5 py-1 rounded-full border border-green-500/30">
                              Done
                            </span>
                          ) : isSkipped ? (
                            <span className="text-xs font-semibold bg-orange-500/20 text-orange-300 px-2.5 py-1 rounded-full border border-orange-500/30">
                              Skipped
                            </span>
                          ) : (
                            <span className="text-xs font-semibold bg-blue-500/20 text-blue-300 px-2.5 py-1 rounded-full border border-blue-500/30">
                              Pending
                            </span>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* SECTION 2: GOAL ROADMAP PROGRESS */}
        {(activeTab === 'all' || activeTab === 'goals') && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 border border-white/10 rounded-3xl p-5 sm:p-8 space-y-6"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-white/10">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Target className="w-5 h-5 text-purple-400" />
                  Goal Roadmaps Progress
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  Step-by-step milestone progression for active goals.
                </p>
              </div>

              <button
                onClick={() => navigate('/onboarding')}
                className="text-xs bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 px-3.5 py-2 rounded-xl border border-purple-500/30 transition-colors font-medium flex items-center gap-1.5"
              >
                + New Goal
              </button>
            </div>

            {goals.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-white/10 rounded-2xl text-gray-400 text-sm">
                <Target className="w-8 h-8 mx-auto mb-2 opacity-40 text-gray-400" />
                No active goals created yet.
                <button onClick={() => navigate('/onboarding')} className="block mx-auto mt-2 text-purple-400 hover:text-purple-300 font-medium">
                  Set up your first goal &rarr;
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {goals.map((goal) => {
                  const pct = goal.progress_percentage || 0;
                  const totalObjs = goal.phases ? goal.phases.reduce((acc, p) => acc + (p.objectives?.length || 0), 0) : 0;
                  const doneObjs = goal.phases ? goal.phases.reduce((acc, p) => acc + (p.objectives?.filter(o => o.is_completed).length || 0), 0) : 0;

                  return (
                    <motion.div
                      key={goal.id}
                      whileHover={{ y: -3 }}
                      onClick={() => navigate(`/goals/${goal.id}/roadmap`)}
                      className="bg-black/30 border border-white/10 p-5 rounded-2xl flex flex-col justify-between cursor-pointer hover:border-purple-500/40 transition-all group"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="font-bold text-lg text-white group-hover:text-purple-300 transition-colors">
                            {goal.name}
                          </h3>
                          <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2.5 py-1 rounded-md border border-purple-500/30 font-semibold whitespace-nowrap">
                            {goal.goal_type}
                          </span>
                        </div>

                        <div className="text-xs text-gray-400 space-y-1 mb-4">
                          <p>Skill Estimate: Level {goal.initial_estimate_level}/10</p>
                          <p>Roadmap Phases: {goal.phases?.length || 0} Phase(s)</p>
                          <p>Objectives Done: {doneObjs} of {totalObjs}</p>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-gray-400">Roadmap Completion</span>
                            <span className="text-purple-400">{pct}%</span>
                          </div>
                          <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden border border-white/10">
                            <div
                              style={{ width: `${pct}%` }}
                              className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-700"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-purple-400 font-semibold">
                        <span>View Strategy Roadmap</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

      </div>
    </div>
  );
};

export default Progress;

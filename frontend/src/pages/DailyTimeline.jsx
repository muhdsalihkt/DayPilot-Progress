import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSchedules, deleteSchedule, generateSchedule, toggleBlockComplete } from '../api/scheduling';
import { updateTaskStatus, editTask } from '../api/tasks';
import { CheckCircle, XCircle, FastForward, Edit3, CalendarDays, Clock, Trash2, RefreshCw, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TimelineSkeleton } from '../components/SkeletonLoader';
import { formatTime12h, formatDateTo12h } from '../utils/timeUtils';

const DailyTimeline = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetting, setResetting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSchedules();
  }, []);

  // Live clock tick every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(interval);
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

  const handleDeleteAndRegenerate = async () => {
    setResetting(true);
    setConfirmReset(false);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      await deleteSchedule(todayStr);
      await generateSchedule(todayStr);
      await fetchSchedules();
    } catch (err) {
      console.error('Failed to reset timeline', err);
    } finally {
      setResetting(false);
    }
  };

  const handleToggleBlock = async (blockId) => {
    try {
      const result = await toggleBlockComplete(blockId);
      // Optimistic update — update local state without a full refetch
      setSchedules(prev => prev.map(schedule => ({
        ...schedule,
        blocks: schedule.blocks.map(b =>
          b.id === blockId ? { ...b, is_completed: result.is_completed } : b
        )
      })));
    } catch (err) {
      console.error('Failed to toggle block', err);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await updateTaskStatus(taskId, newStatus);
      fetchSchedules();
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await editTask(selectedTask.id, {
        duration_minutes: selectedTask.duration_minutes,
        priority: selectedTask.priority
      });
      setSelectedTask(null);
      fetchSchedules();
    } catch (err) {
      console.error("Failed to edit task", err);
    }
  };

  if (loading) return <TimelineSkeleton />;

  const formatTime = formatTime12h;
  
  const nowHHMM = `${String(currentTime.getHours()).padStart(2, '0')}:${String(currentTime.getMinutes()).padStart(2, '0')}`;
  const nowFormatted = formatDateTo12h(currentTime);
  const todayStr = currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  // Determine if a block is "current" (now falls between start and end)
  const isCurrentBlock = (block, scheduleDate) => {
    const today = currentTime.toISOString().split('T')[0];
    if (scheduleDate !== today) return false;
    const start = block.start_time.substring(0, 5);
    const end = block.end_time.substring(0, 5);
    return nowHHMM >= start && nowHHMM < end;
  };

  const getBlockStyles = (block, isCurrent) => {
    if (block.is_completed && block.block_type !== 'SLEEP') {
      return 'border-green-500/30 bg-green-500/8 opacity-60';
    }
    if (isCurrent) {
      return 'border-blue-400 bg-blue-500/15 ring-2 ring-blue-500/30 shadow-lg shadow-blue-500/10';
    }
    if (block.block_type === 'SLEEP') {
      return 'border-white/5 bg-white/3 opacity-40';
    }
    if (block.block_type === 'BREAK') {
      return 'border-teal-500/20 bg-teal-500/5';
    }
    if (block.block_type !== 'TASK') {
      return 'border-white/10 bg-white/5 opacity-70';
    }
    const status = block.task?.status;
    switch(status) {
      case 'COMPLETED': return 'border-green-500/30 bg-green-500/10 opacity-70';
      case 'INCOMPLETE': return 'border-red-500/30 bg-red-500/10 opacity-70';
      case 'SKIPPED': return 'border-orange-500/30 bg-orange-500/10 opacity-70';
      case 'IN_PROGRESS': return 'border-blue-500 bg-blue-500/20';
      default: return 'border-white/10 bg-white/5 hover:border-blue-500/40';
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-8 pb-24">
      <div className="max-w-2xl mx-auto space-y-6 relative">
        
        {/* Header */}
        <header className="bg-white/5 border border-white/10 p-4 md:p-5 rounded-3xl sticky top-2 sm:top-4 z-40 backdrop-blur-xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
            <div>
              <h1 className="text-lg sm:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
                Today's Timeline
              </h1>
              <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5">{todayStr}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
              <div className="flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 px-2.5 sm:px-3 py-1.5 rounded-full">
                <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                <span className="text-[11px] sm:text-xs font-mono font-bold text-blue-400">{nowFormatted}</span>
              </div>

              {schedules.length > 0 && !confirmReset && !resetting && (
                <button 
                  onClick={() => setConfirmReset(true)}
                  className="text-xs bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/30 text-gray-400 hover:text-red-300 px-2.5 sm:px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5"
                >
                  <Trash2 className="w-3 h-3" /> Reset
                </button>
              )}

              {confirmReset && (
                <div className="flex items-center gap-1.5">
                  <button 
                    onClick={handleDeleteAndRegenerate}
                    className="text-xs bg-red-600 hover:bg-red-500 text-white px-2.5 sm:px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 font-medium"
                  >
                    <RefreshCw className="w-3 h-3" /> Confirm
                  </button>
                  <button 
                    onClick={() => setConfirmReset(false)}
                    className="text-xs bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white px-2.5 sm:px-3 py-1.5 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {resetting && (
                <div className="flex items-center gap-1.5 text-xs text-blue-400">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Regenerating...
                </div>
              )}

              <button onClick={() => navigate('/schedule')} className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl transition-colors font-medium">
                Generate
              </button>
            </div>
          </div>
        </header>

        {schedules.length === 0 && (
          <div className="text-center p-16 bg-white/5 border border-white/10 rounded-3xl">
            <CalendarDays className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400 mb-2">No schedule for today</p>
            <button 
              onClick={() => navigate('/schedule')} 
              className="text-blue-400 hover:text-blue-300 text-sm"
            >
              Generate your first schedule &rarr;
            </button>
          </div>
        )}

        {/* Timeline */}
        <div className="space-y-10 relative">
          {/* Vertical Timeline Line */}
          <div className="absolute left-[3.75rem] top-0 bottom-0 w-px bg-gradient-to-b from-blue-500/40 via-purple-500/20 to-transparent z-0" />

          {schedules.map((schedule) => (
            <div key={schedule.id} className="space-y-3 relative z-10">
              <h2 className="text-sm font-bold px-3 py-1 inline-block bg-white/10 rounded-full text-blue-300 mb-2">
                <CalendarDays className="inline w-3.5 h-3.5 mr-1.5" />
                {schedule.date}
              </h2>
              
              {schedule.warning_message && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 px-4 py-3 rounded-2xl text-sm mb-4">
                  <strong>AI Scheduler Alert:</strong> {schedule.warning_message}
                </div>
              )}
              
              <div className="space-y-2">
                {schedule.blocks.map((block, blockIdx) => {
                  const isCurrent = isCurrentBlock(block, schedule.date);
                  return (
                    <motion.div 
                      key={block.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: blockIdx * 0.03 }}
                      className={`flex items-stretch gap-3 p-3 md:p-4 rounded-2xl border transition-all relative ${getBlockStyles(block, isCurrent)}`}
                    >
                      {/* "NOW" indicator dot on the timeline */}
                      {isCurrent && (
                        <div className="absolute -left-[0.45rem] top-1/2 -translate-y-1/2 w-3 h-3 bg-blue-400 rounded-full ring-4 ring-blue-400/20 z-20" />
                      )}
                      
                      {/* Time Column */}
                      <div className="w-16 flex flex-col justify-between flex-shrink-0 font-mono text-[10px] md:text-[11px] opacity-60 text-right mt-1">
                        <span>{formatTime(block.start_time)}</span>
                        <span>{formatTime(block.end_time)}</span>
                      </div>
                      
                      {/* Content Column */}
                      <div className="flex-1 flex flex-col justify-center min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold text-sm md:text-base truncate ${isCurrent ? 'text-blue-300' : ''} ${block.is_completed ? 'line-through text-gray-500' : ''}`}>
                            {block.title}
                          </span>
                          {isCurrent && (
                            <span className="text-[10px] font-bold bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full whitespace-nowrap flex items-center gap-1">
                              <Clock className="w-3 h-3" /> NOW
                            </span>
                          )}
                          {block.is_completed && (
                            <span className="text-[10px] font-bold bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full whitespace-nowrap">
                              Done
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] opacity-50 flex items-center gap-2 mt-0.5">
                          <span className="uppercase tracking-wider font-bold">{block.block_type}</span>
                          {block.task && <span>• P{block.task.priority}</span>}
                        </div>

                        {/* Non-Task Block: simple done toggle */}
                        {block.block_type !== 'TASK' && block.block_type !== 'SLEEP' && (
                          <div className="flex justify-end mt-2">
                            <motion.button
                              whileTap={{ scale: 0.85 }}
                              onClick={() => handleToggleBlock(block.id)}
                              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl font-medium transition-all ${
                                block.is_completed
                                  ? 'bg-green-500/20 text-green-400 hover:bg-red-500/10 hover:text-red-400'
                                  : 'bg-white/5 text-gray-400 hover:bg-green-500/10 hover:text-green-400'
                              }`}
                              title={block.is_completed ? 'Mark as not done' : 'Mark as done'}
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              {block.is_completed ? 'Undo' : 'Done'}
                            </motion.button>
                          </div>
                        )}
                        {/* Task Actions */}
                        {block.block_type === 'TASK' && block.task && (
                          <div className="flex gap-1.5 mt-3">
                            {block.task.status !== 'COMPLETED' && (
                              <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleStatusChange(block.task.id, 'COMPLETED')}
                                className="p-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/40 transition-colors"
                                title="Complete"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </motion.button>
                            )}
                            {block.task.status !== 'SKIPPED' && (
                              <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleStatusChange(block.task.id, 'SKIPPED')}
                                className="p-1.5 rounded-lg bg-orange-500/20 text-orange-400 hover:bg-orange-500/40 transition-colors"
                                title="Skip"
                              >
                                <FastForward className="w-4 h-4" />
                              </motion.button>
                            )}
                            {block.task.status !== 'INCOMPLETE' && (
                              <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleStatusChange(block.task.id, 'INCOMPLETE')}
                                className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/40 transition-colors"
                                title="Incomplete"
                              >
                                <XCircle className="w-4 h-4" />
                              </motion.button>
                            )}
                            <div className="ml-auto flex gap-1.5">
                              <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={async () => {
                                  await editTask(block.task.id, { notify: !block.task.notify });
                                  fetchSchedules();
                                }}
                                className={`p-1.5 rounded-lg transition-colors ${block.task.notify ? 'bg-yellow-500/20 text-yellow-400' : 'bg-white/10 text-gray-500 hover:bg-white/20'}`}
                                title={block.task.notify ? "Notifications On" : "Notifications Off"}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill={block.task.notify ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
                              </motion.button>
                              <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setSelectedTask(block.task)}
                                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                                title="Edit"
                              >
                                <Edit3 className="w-4 h-4" />
                              </motion.button>
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {selectedTask && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className="bg-slate-900 border border-white/10 p-6 rounded-t-3xl md:rounded-3xl w-full max-w-sm shadow-2xl"
            >
              <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4 md:hidden" />
              <h3 className="text-lg font-bold mb-1">Edit Task</h3>
              <p className="text-sm text-gray-400 mb-5 truncate">{selectedTask.name}</p>
              
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Duration (minutes)</label>
                  <input 
                    type="number" 
                    value={selectedTask.duration_minutes}
                    onChange={(e) => setSelectedTask({...selectedTask, duration_minutes: parseInt(e.target.value)})}
                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3 focus:outline-none focus:border-blue-500 transition-colors"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Priority</label>
                  <select 
                    value={selectedTask.priority}
                    onChange={(e) => setSelectedTask({...selectedTask, priority: parseInt(e.target.value)})}
                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3 focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value={1}>Low</option>
                    <option value={2}>Medium</option>
                    <option value={3}>High</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setSelectedTask(null)}
                    className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold transition-colors"
                  >
                    Save
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DailyTimeline;

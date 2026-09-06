import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getGoals, generateRoadmap } from '../api/goals';
import { motion } from 'framer-motion';
import { Loader2, ArrowLeft, Target, CalendarDays, CheckCircle2, AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';

const GoalRoadmap = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [goal, setGoal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [confirmRegenerate, setConfirmRegenerate] = useState(false);

  useEffect(() => {
    fetchGoal();
  }, [id]);

  const fetchGoal = async () => {
    try {
      const data = await getGoals();
      const current = data.find(g => String(g.id) === String(id));
      setGoal(current);
    } catch (err) {
      console.error(err);
      setError('Failed to load goal details.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateRoadmap = async () => {
    setGenerating(true);
    setError(null);
    try {
      const updatedGoal = await generateRoadmap(id);
      setGoal(updatedGoal);
    } catch (err) {
      console.error("Failed to generate roadmap", err);
      const errorMessage = err.response?.data?.detail || err.response?.data?.error || err.message || 'Failed to generate roadmap. Please try again.';
      setError(errorMessage);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return <div className="text-white text-center mt-20">Loading...</div>;
  if (!goal) return <div className="text-white text-center mt-20">Goal not found.</div>;

  const hasRoadmap = goal.phases && goal.phases.length > 0;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <button onClick={() => navigate('/')} className="text-gray-400 hover:text-white flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        <header className="bg-white/5 border border-white/10 rounded-2xl md:rounded-3xl p-6 md:p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-3xl rounded-full mix-blend-screen" />
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start gap-6 md:gap-0">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Target className="w-6 h-6 text-blue-400" />
                <h1 className="text-3xl font-bold">{goal.name}</h1>
              </div>
              <p className="text-gray-400">Roadmap Strategy</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {!hasRoadmap && (
                <button 
                  onClick={handleGenerateRoadmap}
                  disabled={generating}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 py-3 px-6 rounded-xl font-medium transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 w-full md:w-auto"
                >
                  {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Generate AI Roadmap'}
                </button>
              )}

              {hasRoadmap && !confirmRegenerate && (
                <button 
                  onClick={() => setConfirmRegenerate(true)}
                  disabled={generating}
                  className="bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/30 text-gray-300 hover:text-red-300 py-3 px-6 rounded-xl font-medium transition-all flex items-center justify-center gap-2 w-full md:w-auto"
                >
                  <Trash2 className="w-4 h-4" /> Delete & Regenerate
                </button>
              )}

              {hasRoadmap && confirmRegenerate && (
                <div className="flex flex-wrap md:flex-nowrap items-center gap-2 w-full md:w-auto">
                  <button 
                    onClick={() => {
                      setConfirmRegenerate(false);
                      handleGenerateRoadmap();
                    }}
                    disabled={generating}
                    className="bg-red-600 hover:bg-red-500 py-3 px-6 rounded-xl font-medium transition-all shadow-lg shadow-red-500/20 flex items-center justify-center gap-2 flex-1 md:flex-none"
                  >
                    {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <><RefreshCw className="w-4 h-4" /> Yes, Regenerate</>}
                  </button>
                  <button 
                    onClick={() => setConfirmRegenerate(false)}
                    className="bg-white/5 hover:bg-white/10 border border-white/10 py-3 px-4 rounded-xl text-gray-400 hover:text-white transition-all flex-1 md:flex-none text-center"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 md:p-6 flex items-start gap-3 md:gap-4 flex-col sm:flex-row"
          >
            <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5 hidden sm:block" />
            <div>
              <h4 className="font-medium text-red-300">Roadmap Generation Failed</h4>
              <p className="text-red-400/80 text-sm mt-1">{error}</p>
              <button 
                onClick={handleGenerateRoadmap} 
                disabled={generating}
                className="mt-3 text-sm bg-red-500/20 hover:bg-red-500/30 text-red-300 px-4 py-2 rounded-lg border border-red-500/30 transition-colors"
              >
                Try Again
              </button>
            </div>
          </motion.div>
        )}

        {generating && (
          <div className="text-center py-20 space-y-4">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto" />
            <h3 className="text-xl font-medium text-white">Gemini is planning your journey...</h3>
            <p className="text-gray-400">Analyzing your assessment and constructing a step-by-step roadmap.</p>
          </div>
        )}

        {hasRoadmap && !generating && (
          <div className="space-y-8">
            {goal.phases.map((phase, pIdx) => (
              <motion.div 
                key={phase.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: pIdx * 0.1 }}
                className="relative pl-6 md:pl-8 border-l border-white/10"
              >
                <div className="absolute -left-3.5 md:-left-4 top-0 w-7 h-7 md:w-8 md:h-8 bg-blue-900/50 border border-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-blue-300 text-sm font-bold">{pIdx + 1}</span>
                </div>
                
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 md:p-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-0 mb-4">
                    <div>
                      <h3 className="text-xl md:text-2xl font-bold text-blue-100">{phase.title}</h3>
                      <p className="text-gray-400 mt-1">{phase.description}</p>
                    </div>
                    <span className="text-xs bg-white/10 text-gray-300 px-3 py-1 rounded-full flex items-center gap-2">
                      <CalendarDays className="w-3 h-3" /> {phase.estimated_weeks} Weeks
                    </span>
                  </div>

                  <div className="mt-6 space-y-3">
                    {phase.objectives.map((obj, oIdx) => (
                      <div key={obj.id} className="flex gap-3 md:gap-4 p-3 md:p-4 bg-black/30 rounded-xl border border-white/5">
                        <CheckCircle2 className={`w-5 h-5 mt-0.5 flex-shrink-0 ${obj.is_completed ? 'text-green-500' : 'text-gray-600'}`} />
                        <div>
                          <h4 className="font-medium text-gray-200">Week {oIdx + 1}: {obj.title}</h4>
                          <p className="text-sm text-gray-500 mt-1">{obj.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GoalRoadmap;

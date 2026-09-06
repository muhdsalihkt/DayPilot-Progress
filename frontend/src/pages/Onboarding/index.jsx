import React, { useState, useContext, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Loader2, Target, CheckCircle2, Trash2 } from 'lucide-react';
import { assessGoal, completeOnboarding } from '../../api/onboarding';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const OnboardingWizard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (user?.onboarding_completed && step < 4) {
      setStep(4);
    }
  }, [user, step]);
  
  // Master State
  const [data, setData] = useState({
    profile: { age: '', wake_up_time: '07:00' },
    fixed_commitments: [], // [{ name, category, start_time, end_time, days_of_week }]
    everyday_activities: [], // [{ name, duration_minutes }]
    goals: [] // [{ name, goal_type, priority, initial_estimate_level, assessment_data: {} }]
  });

  const [customActivity, setCustomActivity] = useState({ name: '', duration_minutes: 15 });

  // Current Goal Input State (for Step 4/5)
  const [currentGoal, setCurrentGoal] = useState({
    name: '', goal_type: 'TIME_BOUND', priority: 2, initial_estimate_level: 5, deadline: '', daily_target_hours: 2
  });
  const [assessmentQuestions, setAssessmentQuestions] = useState([]);
  const [assessmentAnswers, setAssessmentAnswers] = useState({});

  const nextStep = () => setStep(s => Math.min(s + 1, 5));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  // --- STEPS RENDERERS ---

  const renderStep1 = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Basic Information</h2>
      <p className="text-gray-400">Let's start with your routine.</p>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">How old are you?</label>
        <input 
          type="number" 
          value={data.profile.age} 
          onChange={e => setData({...data, profile: {...data.profile, age: e.target.value}})}
          className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500/50"
          placeholder="e.g. 25"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Preferred Wake-up Time</label>
        <input 
          type="time" 
          value={data.profile.wake_up_time} 
          onChange={e => setData({...data, profile: {...data.profile, wake_up_time: e.target.value}})}
          className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500/50"
        />
      </div>
      
      <p className="text-sm text-blue-400 bg-blue-500/10 p-4 rounded-xl border border-blue-500/20">
        We'll automatically calculate your ideal bedtime based on your age!
      </p>

      <button onClick={nextStep} disabled={!data.profile.age || !data.profile.wake_up_time} className="w-full btn-primary">
        Next <ArrowRight className="ml-2 w-4 h-4" />
      </button>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Fixed Commitments</h2>
      <p className="text-gray-400">Add things like work, classes, or regular meetings.</p>
      
      <button onClick={() => {
        setData({...data, fixed_commitments: [...data.fixed_commitments, {name: 'Work', category: 'WORK', start_time: '09:00', end_time: '17:00', days_of_week: '1,2,3,4,5'}]})
      }} className="w-full p-3 border border-dashed border-white/20 rounded-xl text-gray-400 hover:text-white hover:border-white/40 transition-colors">
        + Add Commitment
      </button>

      {data.fixed_commitments.map((c, i) => (
        <div key={i} className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-3">
          <div className="flex gap-2 items-center">
            <input 
              type="text" value={c.name} 
              onChange={e => {
                const newC = [...data.fixed_commitments];
                newC[i].name = e.target.value;
                setData({...data, fixed_commitments: newC});
              }}
              className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-white text-sm"
              placeholder="Commitment Name"
            />
            <button 
              onClick={() => {
                const newC = [...data.fixed_commitments];
                newC.splice(i, 1);
                setData({...data, fixed_commitments: newC});
              }}
              className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors flex-shrink-0"
              title="Remove Commitment"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-3">
            <input type="time" value={c.start_time} onChange={e => {
              const newC = [...data.fixed_commitments];
              newC[i].start_time = e.target.value;
              setData({...data, fixed_commitments: newC});
            }} className="w-1/2 bg-black/30 border border-white/10 rounded-lg p-2 text-white text-sm" />
            <input type="time" value={c.end_time} onChange={e => {
              const newC = [...data.fixed_commitments];
              newC[i].end_time = e.target.value;
              setData({...data, fixed_commitments: newC});
            }} className="w-1/2 bg-black/30 border border-white/10 rounded-lg p-2 text-white text-sm" />
          </div>
        </div>
      ))}

      <div className="flex gap-3">
        <button onClick={prevStep} className="w-1/3 btn-secondary">Back</button>
        <button onClick={nextStep} className="w-2/3 btn-primary">Next</button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Everyday Activities</h2>
      <p className="text-gray-400">Add daily habits (brushing, showering, etc).</p>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 mb-4">
        {['Brushing (15m)', 'Bathing (20m)', 'Breakfast (30m)'].map(activity => (
          <button 
            key={activity}
            onClick={() => {
              const name = activity.split(' (')[0];
              const mins = parseInt(activity.split('(')[1]);
              setData({...data, everyday_activities: [...data.everyday_activities, {name, duration_minutes: mins}]})
            }}
            className="p-2.5 sm:p-3 border border-white/10 rounded-xl text-gray-300 hover:bg-white/10 transition-colors text-xs sm:text-sm font-medium"
          >
            + {activity}
          </button>
        ))}
      </div>

      <div className="p-3.5 sm:p-4 bg-white/5 border border-white/10 rounded-xl space-y-3 mb-6">
        <h3 className="text-xs sm:text-sm font-medium text-gray-300">Add Custom Habit</h3>
        <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
          <input 
            type="text" 
            value={customActivity.name} 
            onChange={e => setCustomActivity({...customActivity, name: e.target.value})}
            placeholder="E.g., Reading"
            className="flex-1 bg-black/30 border border-white/10 rounded-lg p-2.5 text-white text-sm"
          />
          <div className="flex gap-2">
            <div className="relative flex-1 sm:w-24">
              <input 
                type="number" 
                value={customActivity.duration_minutes} 
                onChange={e => setCustomActivity({...customActivity, duration_minutes: parseInt(e.target.value) || 0})}
                className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-white text-sm pr-8"
                placeholder="15"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 text-sm">m</span>
            </div>
            <button 
              onClick={() => {
                if (customActivity.name && customActivity.duration_minutes > 0) {
                  setData({...data, everyday_activities: [...data.everyday_activities, { name: customActivity.name, duration_minutes: customActivity.duration_minutes }]});
                  setCustomActivity({ name: '', duration_minutes: 15 });
                }
              }}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium whitespace-nowrap"
            >
              Add
            </button>
          </div>
        </div>
      </div>

      {data.everyday_activities.map((a, i) => (
        <div key={i} className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/10">
          <span className="text-white text-sm">{a.name}</span>
          <div className="flex items-center gap-3">
            <span className="text-gray-400 text-sm">{a.duration_minutes}m</span>
            <button 
              onClick={() => {
                const newA = [...data.everyday_activities];
                newA.splice(i, 1);
                setData({...data, everyday_activities: newA});
              }}
              className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
              title="Remove Activity"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}

      <div className="flex gap-3">
        <button onClick={prevStep} className="w-1/3 btn-secondary">Back</button>
        <button onClick={nextStep} className="w-2/3 btn-primary">Next</button>
      </div>
    </div>
  );

  const handleAssessGoal = async () => {
    if (!currentGoal.name) return;
    setLoading(true);
    try {
      const response = await assessGoal(currentGoal.name, currentGoal.goal_type, currentGoal.initial_estimate_level);
      setAssessmentQuestions(response.questions);
      setStep(5); // Go to Assessment step
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Target className="w-8 h-8 text-blue-500" />
        <h2 className="text-2xl font-bold text-white">Set a Goal</h2>
      </div>
      <p className="text-gray-400">What is something you want to achieve?</p>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Goal Name</label>
        <input 
          type="text" 
          value={currentGoal.name} 
          onChange={e => setCurrentGoal({...currentGoal, name: e.target.value})}
          className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500/50"
          placeholder="e.g. Learn React, Run a Marathon..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Current Skill Level (1-10)</label>
        <input 
          type="range" min="1" max="10" 
          value={currentGoal.initial_estimate_level} 
          onChange={e => setCurrentGoal({...currentGoal, initial_estimate_level: parseInt(e.target.value)})}
          className="w-full"
        />
        <div className="text-center text-white font-bold mt-2">{currentGoal.initial_estimate_level} / 10</div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Daily Time Commitment (Hours)</label>
        <input 
          type="range" min="0.5" max="12" step="0.5"
          value={currentGoal.daily_target_hours} 
          onChange={e => setCurrentGoal({...currentGoal, daily_target_hours: parseFloat(e.target.value)})}
          className="w-full"
        />
        <div className="text-center text-white font-bold mt-2">{currentGoal.daily_target_hours} Hours/Day</div>
        <p className="text-xs text-gray-500 text-center mt-1">Our AI will optimally place these hours into your free schedule.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Target Deadline (Optional)</label>
        <input 
          type="date" 
          value={currentGoal.deadline || ''} 
          onChange={e => setCurrentGoal({...currentGoal, deadline: e.target.value})}
          className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500/50"
          min={new Date().toISOString().split('T')[0]}
        />
        <p className="text-xs text-gray-500 mt-2">Leave blank and our AI will suggest a realistic deadline based on your goal.</p>
      </div>

      <div className="flex gap-3">
        <button onClick={user?.onboarding_completed ? () => navigate('/') : prevStep} className="w-1/3 btn-secondary">Back</button>
        <button onClick={handleAssessGoal} disabled={!currentGoal.name || loading} className="w-2/3 btn-primary flex justify-center items-center">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'AI Assessment'}
        </button>
      </div>
    </div>
  );

  const handleFinish = async () => {
    setLoading(true);
    
    // Add current goal to data
    const finalData = { ...data };
    finalData.goals.push({
      ...currentGoal,
      assessment_data: assessmentAnswers
    });

    try {
      await completeOnboarding(finalData);
      navigate('/'); // Go to dashboard
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const renderStep5 = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">AI Assessment</h2>
      <p className="text-gray-400">Answer these quick questions so our AI can personalize your roadmap.</p>
      
      {assessmentQuestions.map((q) => (
        <div key={q.id} className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-3">
          <label className="block text-sm font-medium text-gray-200">{q.question_text}</label>
          {q.question_type === 'choice' && q.options ? (
            <select 
              className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-white text-sm"
              onChange={e => setAssessmentAnswers({...assessmentAnswers, [q.id]: e.target.value})}
            >
              <option value="">Select...</option>
              {q.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          ) : (
            <input 
              type="text" 
              className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-white text-sm"
              onChange={e => setAssessmentAnswers({...assessmentAnswers, [q.id]: e.target.value})}
            />
          )}
        </div>
      ))}

      <div className="flex gap-3">
        <button onClick={() => setStep(4)} className="w-1/3 btn-secondary">Back</button>
        <button onClick={handleFinish} disabled={loading} className="w-2/3 btn-primary bg-green-600 hover:bg-green-700 flex justify-center items-center">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle2 className="w-5 h-5 mr-2" /> Finish Setup</>}
        </button>
      </div>
    </div>
  );

  const steps = [renderStep1, renderStep2, renderStep3, renderStep4, renderStep5];

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a2e] to-[#0a0a0a] z-0" />
      
      <div className="w-full max-w-lg relative z-10">
        
        {/* Progress Bar */}
        <div className="flex justify-between mb-6 sm:mb-8 relative">
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-white/10 -z-10 -translate-y-1/2 rounded-full"></div>
          <div className="absolute top-1/2 left-0 h-1 bg-blue-500 -z-10 -translate-y-1/2 rounded-full transition-all duration-500" style={{ width: `${((step - 1) / 4) * 100}%` }}></div>
          {[1,2,3,4,5].map(s => (
            <div key={s} className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold transition-colors duration-300 ${step >= s ? 'bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-gray-800 text-gray-500 border border-white/10'}`}>
              {s}
            </div>
          ))}
        </div>

        <motion.div 
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 sm:p-8 shadow-2xl"
        >
          {steps[step - 1]()}
        </motion.div>
      </div>

      <style>{`
        .btn-primary {
          @apply py-3 px-4 rounded-xl font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed;
        }
        .btn-secondary {
          @apply py-3 px-4 rounded-xl font-medium text-white bg-white/10 hover:bg-white/20 transition-colors border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed;
        }
      `}</style>
    </div>
  );
};

export default OnboardingWizard;

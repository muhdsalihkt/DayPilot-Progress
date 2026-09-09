import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Settings as SettingsIcon, AlertOctagon, RefreshCcw, Loader2,
  Plus, Trash2, Activity, CheckCircle, Clock, LogOut, User
} from 'lucide-react';
import { resetAccount } from '../api/onboarding';
import { getActivities, addActivity, deleteActivity, deleteSchedule, generateSchedule } from '../api/scheduling';
import { AuthContext } from '../context/AuthContext';

const CATEGORY_OPTIONS = [
  { value: 'BRUSHING', label: '🪥 Brushing' },
  { value: 'BATHING', label: '🚿 Bathing' },
  { value: 'MORNING_ROUTINE', label: '🌅 Morning Routine' },
  { value: 'EVENING_ROUTINE', label: '🌇 Evening Routine' },
  { value: 'PERSONAL_CARE', label: '💆 Personal Care' },
  { value: 'OTHER', label: '⚡ Other' },
];

const PREFERRED_TIME_OPTIONS = [
  { value: '', label: 'Any Time' },
  { value: 'MORNING', label: '🌅 Morning' },
  { value: 'AFTERNOON', label: '☀️ Afternoon' },
  { value: 'EVENING', label: '🌆 Evening' },
  { value: 'NIGHT', label: '🌙 Night' },
];

const Settings = () => {
  const { user, logout } = useContext(AuthContext);
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetting, setResetting] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Activities state
  const [activities, setActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [regenerateMsg, setRegenerateMsg] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newActivity, setNewActivity] = useState({
    name: '', category: 'OTHER', duration_minutes: 15, preferred_time: ''
  });
  const [addLoading, setAddLoading] = useState(false);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      const data = await getActivities();
      setActivities(data);
    } catch (err) {
      console.error('Failed to fetch activities', err);
    } finally {
      setActivitiesLoading(false);
    }
  };

  const handleAddActivity = async (e) => {
    e.preventDefault();
    if (!newActivity.name.trim()) return;
    setAddLoading(true);
    try {
      await addActivity(newActivity);
      await fetchActivities();
      setNewActivity({ name: '', category: 'OTHER', duration_minutes: 15, preferred_time: '' });
      setShowAddForm(false);
      await triggerRegenerate();
    } catch (err) {
      console.error('Failed to add activity', err);
    } finally {
      setAddLoading(false);
    }
  };

  const handleDeleteActivity = async (id) => {
    setDeletingId(id);
    try {
      await deleteActivity(id);
      setActivities(prev => prev.filter(a => a.id !== id));
      await triggerRegenerate();
    } catch (err) {
      console.error('Failed to delete activity', err);
    } finally {
      setDeletingId(null);
    }
  };

  const triggerRegenerate = async () => {
    setRegenerating(true);
    setRegenerateMsg('');
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      // Try to delete existing schedule, ignore if none exists
      try { await deleteSchedule(todayStr); } catch (_) {}
      await generateSchedule(todayStr);
      setRegenerateMsg("✅ Timeline regenerated with your updated activities!");
      setTimeout(() => setRegenerateMsg(''), 4000);
    } catch (err) {
      console.error('Failed to regenerate schedule', err);
      setRegenerateMsg("⚠️ Timeline regeneration failed. Try refreshing manually.");
    } finally {
      setRegenerating(false);
    }
  };

  const handleResetAccount = async () => {
    setResetting(true);
    setConfirmReset(false);
    try {
      await resetAccount();
      navigate('/onboarding');
    } catch (err) {
      console.error('Failed to reset account', err);
      setResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-8 pb-24">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <header className="bg-white/5 border border-white/10 p-5 rounded-3xl sticky top-4 z-40 backdrop-blur-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SettingsIcon className="w-6 h-6 text-gray-400" />
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-200 to-gray-500">
              Settings
            </h1>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
            Log Out
          </button>
        </header>

        {/* Account & Session Card */}
        <div className="bg-white/5 border border-white/10 p-5 sm:p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-500/10 p-3 rounded-2xl border border-blue-500/20">
                <User className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Account & Session</h2>
                <p className="text-gray-400 text-xs mt-0.5">
                  Signed in as <span className="text-blue-300 font-semibold">{user?.email || user?.phone || 'User'}</span>
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-300 px-4 py-2.5 rounded-2xl text-sm font-bold transition-all shadow-lg shadow-red-500/10"
            >
              <LogOut className="w-4 h-4" />
              Log Out
            </button>
          </div>
        </div>


        {/* Regenerating Banner */}
        <AnimatePresence>
          {(regenerating || regenerateMsg) && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`px-5 py-3 rounded-2xl border text-sm font-medium flex items-center gap-2 ${
                regenerating
                  ? 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                  : 'bg-green-500/10 border-green-500/30 text-green-300'
              }`}
            >
              {regenerating ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> AI is regenerating today's timeline…</>
              ) : (
                <><CheckCircle className="w-4 h-4" /> {regenerateMsg}</>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Everyday Activities Manager */}
        <div className="bg-white/5 border border-white/10 p-6 rounded-3xl space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-purple-500/10 p-3 rounded-2xl border border-purple-500/20">
                <Activity className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Everyday Activities</h2>
                <p className="text-gray-400 text-xs mt-0.5">AI will place these optimally in your timeline</p>
              </div>
            </div>
            <button
              onClick={() => setShowAddForm(v => !v)}
              className="flex items-center gap-1.5 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 px-3 py-2 rounded-xl text-sm font-medium transition-all"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>

          {/* Add Activity Form */}
          <AnimatePresence>
            {showAddForm && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleAddActivity}
                className="overflow-hidden"
              >
                <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 sm:p-4 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="col-span-1 sm:col-span-2">
                      <label className="block text-xs text-gray-400 mb-1">Activity Name</label>
                      <input
                        type="text"
                        value={newActivity.name}
                        onChange={e => setNewActivity({ ...newActivity, name: e.target.value })}
                        placeholder="e.g. Breakfast, Yoga, Reading..."
                        className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-purple-500/50 transition-colors"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Category</label>
                      <select
                        value={newActivity.category}
                        onChange={e => setNewActivity({ ...newActivity, category: e.target.value })}
                        className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-purple-500/50 transition-colors"
                      >
                        {CATEGORY_OPTIONS.map(c => (
                          <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Duration (minutes)</label>
                      <input
                        type="number"
                        min="5"
                        max="180"
                        value={newActivity.duration_minutes}
                        onChange={e => setNewActivity({ ...newActivity, duration_minutes: parseInt(e.target.value) })}
                        className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-purple-500/50 transition-colors"
                      />
                    </div>
                    <div className="col-span-1 sm:col-span-2">
                      <label className="block text-xs text-gray-400 mb-1">Preferred Time (Optional)</label>
                      <select
                        value={newActivity.preferred_time}
                        onChange={e => setNewActivity({ ...newActivity, preferred_time: e.target.value })}
                        className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-purple-500/50 transition-colors"
                      >
                        {PREFERRED_TIME_OPTIONS.map(p => (
                          <option key={p.value} value={p.value}>{p.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 text-sm transition-colors font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={addLoading || !newActivity.name.trim()}
                      className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                    >
                      {addLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" /> Save & Regenerate</>}
                    </button>
                  </div>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Activities List */}
          {activitiesLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              <Activity className="w-8 h-8 mx-auto mb-2 opacity-30" />
              No activities yet. Add your first one!
            </div>
          ) : (
            <div className="space-y-2">
              {activities.map(a => (
                <motion.div
                  key={a.id}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="flex items-center justify-between bg-white/5 border border-white/10 px-4 py-3 rounded-2xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center justify-center text-sm">
                      {CATEGORY_OPTIONS.find(c => c.value === a.category)?.label.split(' ')[0] || '⚡'}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{a.name}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {a.duration_minutes} min
                        {a.preferred_time && ` • ${a.preferred_time}`}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteActivity(a.id)}
                    disabled={deletingId === a.id}
                    className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors disabled:opacity-40"
                    title="Delete activity"
                  >
                    {deletingId === a.id
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Trash2 className="w-4 h-4" />
                    }
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Danger Zone */}
        <div className="bg-white/5 border border-white/10 p-6 rounded-3xl space-y-4">
          <div className="flex items-start gap-4">
            <div className="bg-red-500/10 p-3 rounded-2xl border border-red-500/20">
              <AlertOctagon className="w-6 h-6 text-red-500" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-red-400">Danger Zone</h2>
              <p className="text-gray-400 text-sm mt-1">
                Factory reset your account. This will permanently delete your goals, timelines, everyday activities, and fixed commitments.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-white/10">
            {!confirmReset && !resetting && (
              <button
                onClick={() => setConfirmReset(true)}
                className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 py-3 rounded-xl font-bold transition-all"
              >
                Reset Account
              </button>
            )}

            {confirmReset && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                <p className="text-red-300 font-medium mb-4 text-center">Are you absolutely sure?</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setConfirmReset(false)}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 py-3 rounded-xl transition-all font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleResetAccount}
                    className="flex-1 bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-500/20 py-3 rounded-xl transition-all font-bold flex items-center justify-center gap-2"
                  >
                    <RefreshCcw className="w-4 h-4" /> Yes, Reset Everything
                  </button>
                </div>
              </div>
            )}

            {resetting && (
              <div className="w-full bg-white/5 border border-white/10 py-4 rounded-xl flex items-center justify-center gap-3 text-red-400">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="font-bold">Resetting your account...</span>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Settings;

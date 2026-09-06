import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getAdminDashboardStats } from '../api/admin';
import { Users, UserCheck, UserX, UserPlus, ShieldCheck, ShieldAlert, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await getAdminDashboardStats();
      setStats(data);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 403) {
        setError("You do not have permission to access the Admin Dashboard.");
      } else {
        setError("Failed to load admin statistics.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white"><Loader2 className="animate-spin w-8 h-8" /></div>;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-white p-4">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
        <p className="text-gray-400 mb-6">{error}</p>
        <button onClick={() => navigate('/')} className="bg-white/10 hover:bg-white/20 px-6 py-3 rounded-xl transition-colors">
          Return Home
        </button>
      </div>
    );
  }

  const cards = [
    { title: "Total Users", value: stats.total_users, icon: Users, color: "from-blue-400 to-blue-600" },
    { title: "Active Users", value: stats.active_users, icon: UserCheck, color: "from-green-400 to-green-600" },
    { title: "Inactive Users", value: stats.inactive_users, icon: UserX, color: "from-red-400 to-red-600" },
    { title: "New Users (7d)", value: stats.new_users, icon: UserPlus, color: "from-purple-400 to-purple-600" },
    { title: "Verified Users", value: stats.verified_users, icon: ShieldCheck, color: "from-teal-400 to-teal-600" },
    { title: "Unverified Users", value: stats.unverified_users, icon: ShieldAlert, color: "from-orange-400 to-orange-600" },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-8 pb-24">
      <div className="max-w-6xl mx-auto space-y-8 sm:space-y-12">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-white/10 pb-6 gap-4">
          <div>
            <h1 className="text-2xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500 flex items-center gap-3 sm:gap-4">
              <ShieldCheck className="w-8 h-8 sm:w-10 sm:h-10 text-purple-500 flex-shrink-0" />
              Super Admin Dashboard
            </h1>
            <p className="text-gray-400 text-xs sm:text-sm mt-1 sm:mt-2">Aggregate metrics for the AI Roadmap platform.</p>
          </div>
          <button onClick={() => navigate('/')} className="bg-white/10 hover:bg-white/20 px-4 py-2.5 rounded-xl text-sm border border-white/10 transition-colors w-full sm:w-auto font-medium text-center">
            Exit Admin
          </button>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {cards.map((card, idx) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white/5 border border-white/10 p-5 sm:p-6 rounded-3xl relative overflow-hidden"
            >
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${card.color} opacity-10 rounded-full blur-3xl -mr-10 -mt-10`} />
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-400 text-sm sm:text-base font-medium">{card.title}</h3>
                <div className={`p-2.5 sm:p-3 rounded-xl bg-gradient-to-br ${card.color} bg-opacity-20`}>
                  <card.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
              </div>
              <div className="text-3xl sm:text-5xl font-bold">{card.value}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

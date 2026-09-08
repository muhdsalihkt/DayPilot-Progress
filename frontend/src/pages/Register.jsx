import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { requestOtp } from '../api/auth';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const isEmail = identifier.includes('@');
      if (isEmail) {
        await requestOtp(identifier);
        // Pass identifier to OTP verification page for email verification
        navigate('/verify-otp', { state: { identifier, isEmail: true, skipOtp: false } });
      } else {
        // Phone signup - bypass OTP step and navigate straight to Set Password (step 2)
        navigate('/verify-otp', { state: { identifier, isEmail: false, skipOtp: true } });
      }
    } catch (err) {
      setError(err.response?.data?.identifier?.[0] || 'Failed to process signup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a2e] to-[#0a0a0a] z-0" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10"
      >
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Create Account</h1>
          <p className="text-gray-400 text-xs sm:text-sm mt-1 sm:mt-2">Join us to start planning your life</p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center"
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleRequestOtp} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Email or Phone Number</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-500" />
              </div>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-white/10 rounded-xl bg-black/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-colors"
                placeholder="you@example.com or +1234567890"
                required
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">We will send you a one-time password to verify.</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-[#0a0a0a] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (
              <Loader2 className="animate-spin h-5 w-5" />
            ) : (
              <>
                Continue
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-blue-400 hover:text-blue-300 transition-colors">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Register;

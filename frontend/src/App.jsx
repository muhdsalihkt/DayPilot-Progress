import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import OTPVerify from './pages/OTPVerify';
import Dashboard from './pages/Dashboard';
import OnboardingWizard from './pages/Onboarding';
import GoalRoadmap from './pages/GoalRoadmap';
import SchedulingDashboard from './pages/SchedulingDashboard';
import DailyTimeline from './pages/DailyTimeline';
import AdminDashboard from './pages/AdminDashboard';
import Settings from './pages/Settings';
import Progress from './pages/Progress';
import { NotificationProvider } from './components/NotificationProvider';
import { AuthProvider } from './context/AuthContext';
import BottomNav from './components/BottomNav';
import ErrorBoundary from './components/ErrorBoundary';

// Simple auth check for MVP
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('access_token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <NotificationProvider>
        <Router>
          <Routes>
            {/* Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-otp" element={<OTPVerify />} />
            
            {/* Home = Timeline (PRD: "The timeline is the primary interface") */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <DailyTimeline />
                </ProtectedRoute>
              } 
            />
            
            {/* Goals Dashboard */}
            <Route 
              path="/goals" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* Dedicated Progress & Analytics Page */}
            <Route 
              path="/progress" 
              element={
                <ProtectedRoute>
                  <Progress />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/onboarding" 
              element={
                <ProtectedRoute>
                  <OnboardingWizard />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/goals/:id/roadmap" 
              element={
                <ProtectedRoute>
                  <GoalRoadmap />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/schedule" 
              element={
                <ProtectedRoute>
                  <SchedulingDashboard />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/settings" 
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              } 
            />
            
            {/* Legacy route redirect */}
            <Route path="/timeline" element={<Navigate to="/" replace />} />
            
            <Route 
              path="/admin/dashboard" 
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
          </Routes>
          
          {/* Mobile Bottom Navigation */}
          <BottomNav />
        </Router>
        </NotificationProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;

import React from 'react';
import { motion } from 'framer-motion';

const shimmer = {
  initial: { backgroundPosition: '-200% 0' },
  animate: { 
    backgroundPosition: '200% 0',
    transition: { repeat: Infinity, duration: 1.5, ease: 'linear' }
  },
};

const SkeletonBlock = ({ className = '' }) => (
  <motion.div
    variants={shimmer}
    initial="initial"
    animate="animate"
    className={`rounded-xl bg-gradient-to-r from-white/5 via-white/10 to-white/5 bg-[length:200%_100%] ${className}`}
  />
);

// Full-page skeleton for timeline-style pages
export const TimelineSkeleton = () => (
  <div className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-8">
    <div className="max-w-2xl mx-auto space-y-6">
      <SkeletonBlock className="h-20 rounded-3xl" />
      <SkeletonBlock className="h-10 w-48 rounded-full" />
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex gap-4 items-stretch">
          <SkeletonBlock className="w-16 h-24 flex-shrink-0" />
          <SkeletonBlock className="flex-1 h-24" />
        </div>
      ))}
    </div>
  </div>
);

// Grid skeleton for dashboard cards
export const DashboardSkeleton = () => (
  <div className="min-h-screen bg-[#0a0a0a] text-white p-8">
    <div className="max-w-6xl mx-auto space-y-12">
      <div className="flex justify-between items-end">
        <div className="space-y-3">
          <SkeletonBlock className="h-10 w-64" />
          <SkeletonBlock className="h-4 w-48" />
        </div>
        <div className="flex gap-3">
          <SkeletonBlock className="h-10 w-32 rounded-lg" />
          <SkeletonBlock className="h-10 w-28 rounded-lg" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <SkeletonBlock key={i} className="h-56 rounded-3xl" />
        ))}
      </div>
    </div>
  </div>
);

export default SkeletonBlock;

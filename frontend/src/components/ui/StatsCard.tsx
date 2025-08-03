'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: string;
  trend: string;
  className?: string;
}

export default function StatsCard({ title, value, icon, trend, className = '' }: StatsCardProps) {
  const isPositiveTrend = trend.startsWith('+');
  
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6 ${className}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
          <span className="text-2xl">{icon}</span>
        </div>
        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-sm ${
          isPositiveTrend 
            ? 'bg-green-500/20 text-green-400' 
            : 'bg-red-500/20 text-red-400'
        }`}>
          {isPositiveTrend ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {trend}
        </div>
      </div>
      
      <div>
        <h3 className="text-3xl font-bold text-white mb-1">{value}</h3>
        <p className="text-slate-400 text-sm">{title}</p>
      </div>
    </motion.div>
  );
}

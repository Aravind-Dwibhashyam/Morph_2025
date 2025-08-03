'use client';

import { motion } from 'framer-motion';

interface CategoryItemProps {
  name: string;
  spent: number;
  limit: number;
  color: string;
  className?: string;
}

export default function CategoryItem({ name, spent, limit, color, className = '' }: CategoryItemProps) {
  const percentage = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
  const isOverBudget = spent > limit;
  const remaining = Math.max(limit - spent, 0);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors ${className}`}
    >
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-white font-semibold">{name}</h4>
        <div className="text-right">
          <p className="text-white font-bold">${spent.toFixed(2)}</p>
          <p className="text-slate-400 text-sm">of ${limit.toFixed(2)}</p>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="w-full bg-slate-700 rounded-full h-3 mb-2">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className={`h-3 rounded-full transition-colors ${
            isOverBudget 
              ? 'bg-red-500' 
              : percentage > 80 
                ? 'bg-yellow-500' 
                : color
          }`}
        />
      </div>
      
      <div className="flex justify-between items-center text-sm">
        <span className={`${
          isOverBudget 
            ? 'text-red-400' 
            : percentage > 80 
              ? 'text-yellow-400' 
              : 'text-slate-400'
        }`}>
          {percentage.toFixed(1)}% used
        </span>
        <span className="text-slate-400">
          ${remaining.toFixed(2)} remaining
        </span>
      </div>
      
      {isOverBudget && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-2 text-red-400 text-xs flex items-center gap-1"
        >
          ⚠️ Over budget by ${(spent - limit).toFixed(2)}
        </motion.div>
      )}
    </motion.div>
  );
}

'use client';

import { motion } from 'framer-motion';
import { ExternalLink, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

interface TransactionRowProps {
  id?: string;
  vendor: string;
  category: string;
  amount: number;
  timestamp: string;
  status: 'pending' | 'completed' | 'failed';
  isEmergency?: boolean;
  txHash?: string;
  className?: string;
}

export default function TransactionRow({ 
  vendor, 
  category, 
  amount, 
  timestamp, 
  status, 
  isEmergency = false,
  txHash,
  className = '' 
}: TransactionRowProps) {
  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={16} className="text-green-400" />;
      case 'pending':
        return <Clock size={16} className="text-yellow-400" />;
      case 'failed':
        return <AlertTriangle size={16} className="text-red-400" />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'completed':
        return 'text-green-400';
      case 'pending':
        return 'text-yellow-400';
      case 'failed':
        return 'text-red-400';
      default:
        return 'text-slate-400';
    }
  };

  const getCategoryEmoji = (cat: string) => {
    const categoryMap: { [key: string]: string } = {
      'food': '🍽️',
      'education': '📚',
      'entertainment': '🎮',
      'transport': '🚗',
      'others': '🛍️'
    };
    return categoryMap[cat.toLowerCase()] || '💳';
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
      className={`p-4 rounded-xl border border-white/10 hover:border-white/20 transition-all ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Category Icon */}
          <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
            <span className="text-lg">{getCategoryEmoji(category)}</span>
          </div>
          
          {/* Transaction Details */}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="text-white font-medium">{vendor}</h4>
              {isEmergency && (
                <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-lg">
                  Emergency
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span>{category}</span>
              <span>•</span>
              <span>{timestamp}</span>
            </div>
          </div>
        </div>
        
        {/* Amount and Status */}
        <div className="text-right">
          <p className="text-white font-semibold">
            -${amount.toFixed(3)} ETH
          </p>
          <div className="flex items-center gap-2 justify-end">
            {getStatusIcon()}
            <span className={`text-sm capitalize ${getStatusColor()}`}>
              {status}
            </span>
            {txHash && (
              <button
                onClick={() => window.open(`https://explorer.morphl2.io/tx/${txHash}`, '_blank')}
                className="text-blue-400 hover:text-blue-300 transition-colors"
                title="View on Explorer"
              >
                <ExternalLink size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Progress bar for pending transactions */}
      {status === 'pending' && (
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: '100%' }}
          transition={{ duration: 2, repeat: Infinity }}
          className="mt-3 h-1 bg-yellow-500 rounded-full opacity-50"
        />
      )}
    </motion.div>
  );
}

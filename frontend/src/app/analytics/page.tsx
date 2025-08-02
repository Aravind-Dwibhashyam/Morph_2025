'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useFamilyWallet } from '@/hooks/useContract';
import { BarChart3, PieChart, TrendingUp, Download } from 'lucide-react';

export default function Analytics() {
  const { familyMembers, transactions, analytics } = useFamilyWallet();
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [selectedMember, setSelectedMember] = useState<string>('all');

  const categoryData = [
    { name: 'Food & Dining', amount: 450, percentage: 35, color: 'bg-blue-500' },
    { name: 'Education', amount: 300, percentage: 23, color: 'bg-green-500' },
    { name: 'Transport', amount: 180, percentage: 14, color: 'bg-yellow-500' },
    { name: 'Entertainment', amount: 120, percentage: 9, color: 'bg-purple-500' },
    { name: 'Others', amount: 90, percentage: 7, color: 'bg-red-500' }
  ];

  const monthlyData = [
    { month: 'Jan', amount: 850 },
    { month: 'Feb', amount: 920 },
    { month: 'Mar', amount: 780 },
    { month: 'Apr', amount: 1100 },
    { month: 'May', amount: 950 },
    { month: 'Jun', amount: 1140 }
  ];

  const exportData = () => {
    // Implementation for exporting analytics data
    console.log('Exporting analytics data...');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                Analytics Dashboard 📊
              </h1>
              <p className="text-slate-300">
                Detailed insights into your family spending patterns
              </p>
            </div>
            <button
              onClick={exportData}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-colors"
            >
              <Download size={20} />
              Export Report
            </button>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6 mb-8"
        >
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-slate-300 mb-2">Time Period</label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value as 'week' | 'month' | 'year')}
                className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
                <option value="year">Last Year</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-300 mb-2">Family Member</label>
              <select
                value={selectedMember}
                onChange={(e) => setSelectedMember(e.target.value)}
                className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Members</option>
                {familyMembers?.map((member) => (
                  <option key={member.address} value={member.address}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </motion.div>

        {/* Key Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <TrendingUp className="text-blue-400" size={24} />
              </div>
              <span className="text-green-400 text-sm">+12.5%</span>
            </div>
            <h3 className="text-2xl font-bold text-white">$1,240</h3>
            <p className="text-slate-400">Total Spent</p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                <BarChart3 className="text-green-400" size={24} />
              </div>
              <span className="text-red-400 text-sm">-5.2%</span>
            </div>
            <h3 className="text-2xl font-bold text-white">$860</h3>
            <p className="text-slate-400">Average Monthly</p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <PieChart className="text-purple-400" size={24} />
              </div>
              <span className="text-green-400 text-sm">+3 new</span>
            </div>
            <h3 className="text-2xl font-bold text-white">45</h3>
            <p className="text-slate-400">Transactions</p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                <span className="text-yellow-400 text-xl">🎯</span>
              </div>
              <span className="text-green-400 text-sm">On track</span>
            </div>
            <h3 className="text-2xl font-bold text-white">78%</h3>
            <p className="text-slate-400">Budget Used</p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Category Breakdown */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6">
              <h2 className="text-2xl font-bold text-white mb-6">Spending by Category</h2>
              <div className="space-y-4">
                {categoryData.map((category, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-white font-medium">{category.name}</span>
                      <span className="text-slate-300">${category.amount}</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-3">
                      <div
                        className={`${category.color} h-3 rounded-full transition-all duration-500`}
                        style={{ width: `${category.percentage}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">{category.percentage}% of total</span>
                      <span className="text-slate-400">
                        vs ${Math.round(category.amount * 0.9)} last month
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Monthly Trend */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6">
              <h2 className="text-2xl font-bold text-white mb-6">Monthly Spending Trend</h2>
              <div className="space-y-4">
                {monthlyData.map((month, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <span className="text-slate-300 w-12">{month.month}</span>
                    <div className="flex-1 bg-slate-700 rounded-full h-8 relative">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-8 rounded-full flex items-center justify-end pr-3 transition-all duration-500"
                        style={{ width: `${(month.amount / 1200) * 100}%` }}
                      >
                        <span className="text-white text-sm font-medium">${month.amount}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Family Member Analysis */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8"
        >
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Family Member Spending</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {familyMembers?.map((member, index) => (
                <div key={index} className="bg-white/5 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold">
                        {member.name[0]?.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">{member.name}</h3>
                      <p className="text-slate-400 text-sm">{member.role}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Spent:</span>
                      <span className="text-white">${member.totalSpent}</span>
                    </div>
                    {member.role === 'child' && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Limit:</span>
                          <span className="text-white">${member.monthlyLimit}</span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{
                              width: `${Math.min((member.totalSpent / member.monthlyLimit) * 100, 100)}%`
                            }}
                          ></div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

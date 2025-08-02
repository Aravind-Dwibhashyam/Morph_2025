'use client';

import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import StatsCard from '@/components/ui/StatsCard';
import CategoryItem from '@/components/ui/CategoryItem';
import TransactionRow from '@/components/ui/TransactionRow';
import { useFamilyWallet } from '@/hooks/useContract';

export default function Dashboard() {
  const { address, isConnected } = useAccount();
  console.log("Temp solution so that it gets built")
  const router = useRouter();
  const { familyData, transactions, loading } = useFamilyWallet();


  if (!isConnected || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  const stats = [
    { title: 'Total Balance', value: familyData?.balance || '0', icon: '💰', trend: '+5.2%' },
    { title: 'This Month Spent', value: familyData?.monthlySpent || '0', icon: '📊', trend: '-2.1%' },
    { title: 'Family Members', value: familyData?.memberCount || '0', icon: '👨‍👩‍👧‍👦', trend: '+1' },
    { title: 'Active Vendors', value: familyData?.vendorCount || '0', icon: '🏪', trend: '+3' }
  ];

  const categories = [
    { name: 'Food & Dining', spent: 450, limit: 800, color: 'bg-blue-500' },
    { name: 'Education', spent: 300, limit: 500, color: 'bg-green-500' },
    { name: 'Entertainment', spent: 120, limit: 200, color: 'bg-purple-500' },
    { name: 'Transport', spent: 180, limit: 300, color: 'bg-yellow-500' },
    { name: 'Others', spent: 90, limit: 150, color: 'bg-red-500' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2">
            Welcome back! 👋
          </h1>
          <p className="text-slate-300">
            Here&apos;s what&apos;s happening with your family wallet today.
          </p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {stats.map((stat, index) => (
            <StatsCard key={index} {...stat} />
          ))}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Category Spending */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6">
              <h2 className="text-2xl font-bold text-white mb-6">Category Spending</h2>
              <div className="space-y-4">
                {categories.map((category, index) => (
                  <CategoryItem key={index} {...category} />
                ))}
              </div>
            </div>
          </motion.div>

          {/* Recent Transactions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6">
              <h2 className="text-xl font-bold text-white mb-6">Recent Transactions</h2>
              <div className="space-y-3">
                {transactions?.slice(0, 5).map((transaction, index) => (
                  <TransactionRow key={index} {...transaction} />
                )) || (
                  <p className="text-slate-400 text-center py-4">No recent transactions</p>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8"
        >
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6">
            <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl transition-colors">
                💳 Make Payment
              </button>
              <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-xl transition-colors">
                👨‍👩‍👧‍👦 Add Family Member
              </button>
              <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-xl transition-colors">
                🏪 Add Vendor
              </button>
              <button className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-3 rounded-xl transition-colors">
                📊 View Analytics
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

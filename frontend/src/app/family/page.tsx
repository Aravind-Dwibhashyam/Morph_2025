'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useFamilyWallet } from '@/hooks/useContract';
import { Plus, UserMinus, Settings, Shield } from 'lucide-react';

interface FamilyMember {
  address: string;
  name: string;
  role: 'parent' | 'child';
  totalSpent: number;
  monthlyLimit: number;
  joinedDate: string;
}

export default function FamilyManagement() {
  const { familyMembers, addChild, removeChild, setLimit, loading } = useFamilyWallet();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showLimitForm, setShowLimitForm] = useState<string | null>(null);

  const handleAddChild = async (childAddress: string) => {
    try {
      await addChild(childAddress);
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding child:', error);
    }
  };

  const handleRemoveChild = async (childAddress: string) => {
    try {
      await removeChild(childAddress);
    } catch (error) {
      console.error('Error removing child:', error);
    }
  };

  const handleSetLimit = async (childAddress: string, category: number, amount: number) => {
    try {
      await setLimit(childAddress, category, amount);
      setShowLimitForm(null);
    } catch (error) {
      console.error('Error setting limit:', error);
    }
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
                Family Management 👨‍👩‍👧‍👦
              </h1>
              <p className="text-slate-300">
                Manage your family members and their spending limits
              </p>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-colors"
            >
              <Plus size={20} />
              Add Child
            </button>
          </div>
        </motion.div>

        {/* Family Members Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {familyMembers?.map((member, index) => (
            <div
              key={member.address}
              className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6"
            >
              {/* Member Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    {member.role === 'parent' ? <Shield size={24} /> : '👤'}
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">{member.name}</h3>
                    <p className="text-slate-400 text-sm capitalize">{member.role}</p>
                  </div>
                </div>
                {member.role === 'child' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowLimitForm(member.address)}
                      className="text-blue-400 hover:text-blue-300 p-1"
                      title="Set Limits"
                    >
                      <Settings size={16} />
                    </button>
                    <button
                      onClick={() => handleRemoveChild(member.address)}
                      className="text-red-400 hover:text-red-300 p-1"
                      title="Remove Child"
                    >
                      <UserMinus size={16} />
                    </button>
                  </div>
                )}
              </div>

              {/* Member Stats */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Address:</span>
                  <span className="text-white text-sm font-mono">
                    {member.address.slice(0, 6)}...{member.address.slice(-4)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Spent:</span>
                  <span className="text-white">${member.totalSpent}</span>
                </div>
                {member.role === 'child' && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Monthly Limit:</span>
                    <span className="text-white">${member.monthlyLimit}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400">Joined:</span>
                  <span className="text-white">{member.joinedDate}</span>
                </div>
              </div>

              {/* Progress Bar for Children */}
              {member.role === 'child' && (
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-400">Spending Progress</span>
                    <span className="text-white">
                      {Math.round((member.totalSpent / member.monthlyLimit) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min((member.totalSpent / member.monthlyLimit) * 100, 100)}%`
                      }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </motion.div>

        {/* Add Child Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6 w-full max-w-md mx-4"
            >
              <h2 className="text-xl font-bold text-white mb-4">Add New Child</h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target as HTMLFormElement);
                  handleAddChild(formData.get('address') as string);
                }}
              >
                <div className="mb-4">
                  <label className="block text-slate-300 mb-2">Child Address</label>
                  <input
                    name="address"
                    type="text"
                    required
                    placeholder="0x..."
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Adding...' : 'Add Child'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 bg-slate-600 hover:bg-slate-700 text-white py-3 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Set Limit Modal */}
        {showLimitForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6 w-full max-w-md mx-4"
            >
              <h2 className="text-xl font-bold text-white mb-4">Set Spending Limits</h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target as HTMLFormElement);
                  handleSetLimit(
                    showLimitForm,
                    parseInt(formData.get('category') as string),
                    parseFloat(formData.get('amount') as string)
                  );
                }}
              >
                <div className="mb-4">
                  <label className="block text-slate-300 mb-2">Category</label>
                  <select
                    name="category"
                    required
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="0">Food & Dining</option>
                    <option value="1">Education</option>
                    <option value="2">Entertainment</option>
                    <option value="3">Transport</option>
                    <option value="4">Others</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-slate-300 mb-2">Monthly Limit ($)</label>
                  <input
                    name="amount"
                    type="number"
                    step="0.01"
                    required
                    placeholder="100.00"
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Setting...' : 'Set Limit'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowLimitForm(null)}
                    className="flex-1 bg-slate-600 hover:bg-slate-700 text-white py-3 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}

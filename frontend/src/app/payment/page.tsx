'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useFamilyWallet } from '@/hooks/useContract';
import { CreditCard, Store, AlertTriangle, Clock } from 'lucide-react';

const categories = [
  { id: 0, name: 'Food & Dining', icon: '🍽️', color: 'bg-blue-500' },
  { id: 1, name: 'Education', icon: '📚', color: 'bg-green-500' },
  { id: 2, name: 'Entertainment', icon: '🎮', color: 'bg-purple-500' },
  { id: 3, name: 'Transport', icon: '🚗', color: 'bg-yellow-500' },
  { id: 4, name: 'Others', icon: '🛍️', color: 'bg-red-500' }
];

export default function PaymentInterface() {
  const { makePayment, emergencyPayment, vendors, userLimits, loading } = useFamilyWallet();
  const [selectedCategory, setSelectedCategory] = useState<number>(0);
  const [selectedVendor, setSelectedVendor] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isEmergency, setIsEmergency] = useState(false);

  const handlePayment = async () => {
    try {
      if (isEmergency) {
        await emergencyPayment(selectedVendor, parseFloat(amount), description);
      } else {
        await makePayment(selectedVendor, selectedCategory, parseFloat(amount), description);
      }
      // Reset form
      setAmount('');
      setDescription('');
      setSelectedVendor('');
    } catch (error) {
      console.error('Payment failed:', error);
    }
  };

  const currentLimit = userLimits?.[selectedCategory] || 0;
  const spent = 0; // This would come from contract
  const remaining = currentLimit - spent;
  const canAfford = parseFloat(amount) <= remaining;

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
            Make Payment 💳
          </h1>
          <p className="text-slate-300">
            Send payments to approved vendors within your limits
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Payment Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2"
          >
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6">
              <h2 className="text-2xl font-bold text-white mb-6">Payment Details</h2>
              
              {/* Emergency Toggle */}
              <div className="mb-6">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isEmergency}
                    onChange={(e) => setIsEmergency(e.target.checked)}
                    className="w-5 h-5 rounded border-white/20 bg-white/10 text-red-500 focus:ring-red-500"
                  />
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={20} className="text-red-400" />
                    <span className="text-white">Emergency Payment (No Limits)</span>
                  </div>
                </label>
              </div>

              {/* Category Selection */}
              {!isEmergency && (
                <div className="mb-6">
                  <label className="block text-slate-300 mb-3">Category</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`p-4 rounded-xl border transition-all ${
                          selectedCategory === category.id
                            ? 'border-blue-500 bg-blue-500/20'
                            : 'border-white/20 bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        <div className="text-2xl mb-2">{category.icon}</div>
                        <div className="text-white text-sm font-medium">{category.name}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Vendor Selection */}
              <div className="mb-6">
                <label className="block text-slate-300 mb-3">Select Vendor</label>
                <select
                  value={selectedVendor}
                  onChange={(e) => setSelectedVendor(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                  required
                >
                  <option value="">Choose a vendor...</option>
                  {vendors?.map((vendor) => (
                    <option key={vendor.address} value={vendor.address}>
                      {vendor.name} - {vendor.category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount Input */}
              <div className="mb-6">
                <label className="block text-slate-300 mb-3">Amount (ETH)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.001"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.000"
                    className={`w-full bg-white/10 border rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none ${
                      amount && !canAfford && !isEmergency
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-white/20 focus:border-blue-500'
                    }`}
                    required
                  />
                  {amount && !canAfford && !isEmergency && (
                    <p className="text-red-400 text-sm mt-1">
                      Exceeds category limit! Remaining: {remaining.toFixed(3)} ETH
                    </p>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <label className="block text-slate-300 mb-3">Description (Optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What is this payment for?"
                  rows={3}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              {/* Submit Button */}
              <button
                onClick={handlePayment}
                disabled={loading || !selectedVendor || !amount || (!canAfford && !isEmergency)}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:opacity-50 text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <CreditCard size={20} />
                {loading ? 'Processing...' : isEmergency ? 'Send Emergency Payment' : 'Send Payment'}
              </button>
            </div>
          </motion.div>

          {/* Payment Summary */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* Category Limits */}
            {!isEmergency && (
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6">
                <h3 className="text-xl font-bold text-white mb-4">Category Limits</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-slate-300">Current Category:</span>
                    <span className="text-white">{categories[selectedCategory]?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Monthly Limit:</span>
                    <span className="text-white">{currentLimit.toFixed(3)} ETH</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Already Spent:</span>
                    <span className="text-white">{spent.toFixed(3)} ETH</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Remaining:</span>
                    <span className={`font-semibold ${remaining > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {remaining.toFixed(3)} ETH
                    </span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-400">Usage</span>
                      <span className="text-white">
                        {currentLimit > 0 ? Math.round((spent / currentLimit) * 100) : 0}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          spent / currentLimit > 0.8 ? 'bg-red-500' : 'bg-blue-500'
                        }`}
                        style={{
                          width: `${Math.min((spent / currentLimit) * 100, 100)}%`
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Stats */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6">
              <h3 className="text-xl font-bold text-white mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Store size={20} className="text-blue-400" />
                  <div>
                    <p className="text-slate-300">Available Vendors</p>
                    <p className="text-white font-semibold">{vendors?.length || 0}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock size={20} className="text-green-400" />
                  <div>
                    <p className="text-slate-300">This Month</p>
                    <p className="text-white font-semibold">12 Payments</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Emergency Warning */}
            {isEmergency && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <AlertTriangle size={24} className="text-red-400" />
                  <h3 className="text-xl font-bold text-red-400">Emergency Payment</h3>
                </div>
                <p className="text-red-300 text-sm">
                  Emergency payments bypass all spending limits and will be recorded separately. 
                  Use only for genuine emergencies.
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
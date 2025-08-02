'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useFamilyWallet } from '@/hooks/useContract';
import { Plus, Store, Search, Shield, AlertTriangle } from 'lucide-react';

export default function Vendors() {
  const { vendors, addVendor, loading } = useFamilyWallet();
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredVendors = vendors?.filter(vendor =>
    vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddVendor = async (vendorAddress: string, name: string) => {
    try {
      await addVendor(vendorAddress, name);
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding vendor:', error);
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
                Vendor Management 🏪
              </h1>
              <p className="text-slate-300">
                Manage approved vendors for family payments
              </p>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-colors"
            >
              <Plus size={20} />
              Add Vendor
            </button>
          </div>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search vendors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-xl pl-12 pr-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>
        </motion.div>

        {/* Vendors Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredVendors?.map((vendor, index) => (
            <div
              key={vendor.address}
              className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6"
            >
              {/* Vendor Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <Store size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">{vendor.name}</h3>
                    <p className="text-slate-400 text-sm">{vendor.category}</p>
                  </div>
                </div>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-sm ${
                  vendor.isApproved 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {vendor.isApproved ? <Shield size={14} /> : <AlertTriangle size={14} />}
                  {vendor.isApproved ? 'Approved' : 'Pending'}
                </div>
              </div>

              {/* Vendor Details */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Address:</span>
                  <span className="text-white text-sm font-mono">
                    {vendor.address.slice(0, 6)}...{vendor.address.slice(-4)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Category:</span>
                  <span className="text-white">{vendor.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status:</span>
                  <span className={vendor.isApproved ? 'text-green-400' : 'text-red-400'}>
                    {vendor.isApproved ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="flex gap-2">
                  <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
                    Edit
                  </button>
                  <button className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors">
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Empty State */}
        {filteredVendors?.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Store size={48} className="text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No vendors found</h3>
            <p className="text-slate-400 mb-6">
              {searchTerm ? 'Try adjusting your search terms' : 'Add your first vendor to get started'}
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl transition-colors"
            >
              Add Vendor
            </button>
          </motion.div>
        )}

        {/* Add Vendor Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6 w-full max-w-md mx-4"
            >
              <h2 className="text-xl font-bold text-white mb-4">Add New Vendor</h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target as HTMLFormElement);
                  handleAddVendor(
                    formData.get('address') as string,
                    formData.get('name') as string
                  );
                }}
              >
                <div className="mb-4">
                  <label className="block text-slate-300 mb-2">Vendor Name</label>
                  <input
                    name="name"
                    type="text"
                    required
                    placeholder="Amazon, Uber, etc."
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-slate-300 mb-2">Vendor Address</label>
                  <input
                    name="address"
                    type="text"
                    required
                    placeholder="0x..."
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-slate-300 mb-2">Category</label>
                  <select
                    name="category"
                    required
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Select category...</option>
                    <option value="Food">Food & Dining</option>
                    <option value="Education">Education</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Transport">Transport</option>
                    <option value="Others">Others</option>
                  </select>
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Adding...' : 'Add Vendor'}
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
      </div>
    </div>
  );
}

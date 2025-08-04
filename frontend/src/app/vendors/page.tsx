'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContracts,
} from 'wagmi';
import { Abi, formatEther, isAddress, parseEther } from 'viem';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Store, Search, Shield } from 'lucide-react';

import FamilySharedWalletJSON from '../../abis/FamilySharedWallet.json';
import { useRouter } from 'next/navigation';

const CATEGORIES = ['Food', 'Education', 'Entertainment', 'Transport', 'Others'] as const;
type Category = typeof CATEGORIES[number];

type Vendor = {
  address: `0x${string}`;
  category: Category;
  isActive: boolean;
  spendingLimit: bigint;
  spentThisMonth: bigint;
  name: string; // placeholder name as not stored on-chain
};

type ChildProps = {
  onFamilyCreated?: () => void;
};

type AddVendorModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onAddVendor: (vendorAddress: `0x${string}`, categoryIndex: number) => void;
  isProcessing: boolean;
  statusMessage: string;
};

function useFamilyVendors() {
  const { address: connectedAddress } = useAccount();
  const FamilySharedWalletABI = FamilySharedWalletJSON.abi as Abi;
  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;

  const { data: familyId, isLoading: isLoadingFamilyId } = useReadContract({
    account: connectedAddress,
    address: contractAddress,
    abi: FamilySharedWalletABI,
    functionName: 'getUserFamily',
    args: [connectedAddress],
    query: { enabled: !!connectedAddress },
  });

  const { data: vendorAddresses, isLoading: isLoadingAddresses, refetch: refetchVendors } = useReadContract({
    account: connectedAddress,
    address: contractAddress,
    abi: FamilySharedWalletABI,
    functionName: 'getFamilyVendors',
    args: [familyId],
    query: { enabled: !!familyId && Number(familyId) > 0 },
  });

  // Prepare batch read contracts for each vendor's details
  const vendorContracts = useMemo(() => {
    const typedAddresses = vendorAddresses as readonly `0x${string}`[] | undefined;
    if (!typedAddresses || !familyId) return [];
    return typedAddresses.map((vendorAddress) => ({
      address: contractAddress,
      abi: FamilySharedWalletABI,
      functionName: 'familyVendors',
      args: [familyId, vendorAddress],
    }));
  }, [vendorAddresses, familyId, contractAddress, FamilySharedWalletABI]);

  const { data: vendorDetails, isLoading: isLoadingDetails } = useReadContracts({
    account: connectedAddress,
    contracts: vendorContracts,
    query: { enabled: !!vendorAddresses && (vendorAddresses as readonly `0x${string}`[]).length > 0 },
  });

  // Map raw data into Vendor type array
  const vendors = useMemo(() => {
    if (!vendorAddresses || !vendorDetails) return [];
    return (vendorAddresses as `0x${string}`[]).map((address, index) => {
      const detail = vendorDetails[index];
      if (detail.status === 'success' && detail.result) {
        const [categoryIndex, isActive, spendingLimit, spentThisMonth] = detail.result as readonly [number, boolean, bigint, bigint];
        return {
          address,
          category: CATEGORIES[categoryIndex] ?? 'Others',
          isActive,
          spendingLimit,
          spentThisMonth,
          name: `Vendor ${address.slice(0, 6)}...`, // Placeholder name
        };
      }
      return null;
    }).filter((v): v is Vendor => v !== null);
  }, [vendorAddresses, vendorDetails]);

  const loading = isLoadingFamilyId || isLoadingAddresses || isLoadingDetails;

  return { vendors, familyId, loading, refetchVendors, userHasFamily: !!familyId && Number(familyId) > 0 };
}

const AddVendorModal = ({
  isOpen,
  onClose,
  onAddVendor,
  isProcessing,
  statusMessage,
}: AddVendorModalProps) => {
  const [vendorAddress, setVendorAddress] = useState('');
  const [category, setCategory] = useState<number | ''>('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAddress(vendorAddress)) {
      setError('Please enter a valid Ethereum address.');
      return;
    }
    if (category === '') {
      setError('Please select a category.');
      return;
    }
    setError('');
    onAddVendor(vendorAddress as `0x${string}`, category);
  };

  useEffect(() => {
    if (!isOpen) {
      setVendorAddress('');
      setCategory('');
      setError('');
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-slate-800 rounded-2xl border border-white/20 p-6 w-full max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-white mb-4">Add New Vendor</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-slate-300 mb-2">Vendor Address</label>
                <input
                  name="address"
                  type="text"
                  required
                  value={vendorAddress}
                  onChange={(e) => setVendorAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  disabled={isProcessing}
                />
              </div>
              <div className="mb-6">
                <label className="block text-slate-300 mb-2">Category</label>
                <select
                  name="category"
                  required
                  value={category}
                  onChange={(e) => setCategory(Number(e.target.value))}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                  disabled={isProcessing}
                >
                  <option value="" disabled>
                    Select category...
                  </option>
                  {CATEGORIES.map((cat, index) => (
                    <option key={cat} value={index}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl transition-colors disabled:opacity-50"
                >
                  {statusMessage}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isProcessing}
                  className="flex-1 bg-slate-600 hover:bg-slate-700 text-white py-3 rounded-xl transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

type VendorLimitModalProps = {
  isOpen: boolean;
  onClose: () => void;
  vendor: Vendor | null;
  onSetLimit: (limitEth: string) => void;
  isProcessing: boolean;
  statusMessage: string;
};

const VendorLimitModal = ({
  isOpen,
  onClose,
  vendor,
  onSetLimit,
  isProcessing,
  statusMessage,
}: VendorLimitModalProps) => {
  const [limitInput, setLimitInput] = useState('');

  useEffect(() => {
    if (vendor) {
      setLimitInput(vendor.spendingLimit === BigInt(0) ? '' : (Number(vendor.spendingLimit) / 1e18).toString());
    }
  }, [vendor]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (limitInput === '') {
      // Allow empty string as unlimited (0 in contract)
      onSetLimit('0');
    } else if (isNaN(Number(limitInput)) || Number(limitInput) < 0) {
      alert('Please enter a valid non-negative number.');
    } else {
      onSetLimit(limitInput);
    }
  };

  if (!isOpen || !vendor) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-slate-800 rounded-2xl border border-white/20 p-6 w-full max-w-md mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-xl font-bold text-white mb-4">Set Spending Limit for Vendor</h2>
          <form onSubmit={handleSubmit}>
            <p className="text-white mb-4 break-all">{vendor.address}</p>
            <input
              type="number"
              step="any"
              min="0"
              placeholder="ETH (leave blank for unlimited)"
              value={limitInput}
              onChange={(e) => setLimitInput(e.target.value)}
              disabled={isProcessing}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white mb-4 focus:outline-none focus:border-green-500"
            />
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isProcessing}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl transition-colors disabled:opacity-50"
              >
                {statusMessage}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                className="flex-1 bg-slate-600 hover:bg-slate-700 text-white py-3 rounded-xl transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default function Vendors({ onFamilyCreated } : ChildProps) {
  const { address: connectedAddress } = useAccount();
  const { vendors, familyId, loading, refetchVendors, userHasFamily } = useFamilyVendors();
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [hash, setHash] = useState<`0x${string}`>();
  const [editVendor, setEditVendor] = useState<Vendor | null>(null);

  const { isConnected } = useAccount();
  const router = useRouter();

  useEffect(() => {
    if (!isConnected) {
      router.push('/');
    }
  }, [isConnected, router]);

  const { writeContract, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  const {
    writeContract: writeSetVendorLimit,
    isPending: isSettingLimit,
    error: setLimitError,
  } = useWriteContract();
  const { isLoading: isSettingLimitConfirming, isSuccess: isSettingLimitConfirmed } = useWaitForTransactionReceipt({ hash: hash });

  useEffect(() => {
    if (isConfirmed) {
      refetchVendors();
      setShowAddForm(false);
      setHash(undefined);
      setEditVendor(null);
    }
  }, [isConfirmed, refetchVendors]);

  useEffect(() => {
    if (isSettingLimitConfirmed) {
      refetchVendors();
      setHash(undefined);
      setEditVendor(null);
    }
  }, [isSettingLimitConfirmed, refetchVendors]);

  const filteredVendors = useMemo(
    () =>
      vendors?.filter(
        (vendor) =>
          vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          vendor.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
          vendor.category.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [vendors, searchTerm]
  );

  const handleAddVendor = async (vendorAddress: `0x${string}`, categoryIndex: number) => {
    if (!familyId) return;
    writeContract(
      {
        address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`,
        abi: FamilySharedWalletJSON.abi,
        functionName: 'addVendorToFamily',
        args: [familyId, vendorAddress, categoryIndex],
      },
      {
        onSuccess: (sentHash) => {
          setHash(sentHash);
        },
      }
    );
  };

  const handleRemoveVendor = async (vendorAddress: `0x${string}`) => {
    if (!familyId) return;
    writeContract(
      {
        account: connectedAddress,
        address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`,
        abi: FamilySharedWalletJSON.abi,
        functionName: 'removeVendorFromFamily',
        args: [familyId, vendorAddress],
      },
      {
        onSuccess: (sentHash) => {
          setHash(sentHash);
        },
      }
    );
  };

  const handleSetVendorLimit = (limitEth: string) => {
    if (!familyId || !editVendor) return;

    const limitParsed = limitEth === '' ? BigInt(0) : BigInt(parseEther(limitEth));
    writeSetVendorLimit(
      {
        account: connectedAddress,
        address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`,
        abi: FamilySharedWalletJSON.abi,
        functionName: 'setVendorLimit',
        args: [familyId, editVendor.address, limitParsed],
      },
      {
        onSuccess: (sentHash) => {
          setHash(sentHash);
        },
      }
    );
  };

  const isProcessing = isPending || isConfirming || isSettingLimit || isSettingLimitConfirming;
  const statusMessage = isPending || isSettingLimit ? 'Submitting...' : isConfirming || isSettingLimitConfirming ? 'Confirming...' : 'Add Vendor';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-6 py-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Vendor Management 🏪</h1>
              <p className="text-slate-300">Manage approved vendors for family payments</p>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-colors"
              disabled={isProcessing}
            >
              <Plus size={20} /> Add Vendor
            </button>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search by name, address, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-xl pl-12 pr-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
              disabled={isProcessing}
            />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVendors?.map((vendor) => {
            const limitEth = vendor.spendingLimit === BigInt(0)
              ? 'Unlimited'
              : parseFloat(formatEther(vendor.spendingLimit)).toFixed(4) + ' ETH';

            const spentEth = parseFloat(formatEther(vendor.spentThisMonth)).toFixed(4) + ' ETH';

            return (
              <div key={vendor.address} className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6">
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
                  <div
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-sm ${
                      vendor.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    <Shield size={14} /> {vendor.isActive ? 'Active' : 'Inactive'}
                  </div>
                </div>
                <div className="space-y-3 text-white text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Address:</span>
                    <span className="font-mono">{vendor.address.slice(0, 6)}...{vendor.address.slice(-4)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Limit:</span>
                    <span>{limitEth}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Spent this month:</span>
                    <span>{spentEth}</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditVendor(vendor)}
                      disabled={isProcessing}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                    >
                      Edit Limit
                    </button>
                    <button
                      onClick={() => handleRemoveVendor(vendor.address)}
                      disabled={isProcessing}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </motion.div>

        {(loading || !filteredVendors) && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-400 mx-auto"></div>
          </div>
        )}

        {!loading && filteredVendors?.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
            <Store size={48} className="text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No vendors found</h3>
            <p className="text-slate-400 mb-6">{searchTerm ? 'Try adjusting your search terms' : 'Add your first vendor to get started'}</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl transition-colors"
              disabled={isProcessing}
            >
              Add Vendor
            </button>
          </motion.div>
        )}

        <AddVendorModal
          isOpen={showAddForm}
          onClose={() => setShowAddForm(false)}
          onAddVendor={handleAddVendor}
          isProcessing={isProcessing}
          statusMessage={statusMessage}
        />

        <VendorLimitModal
          isOpen={!!editVendor}
          onClose={() => setEditVendor(null)}
          vendor={editVendor}
          onSetLimit={handleSetVendorLimit}
          isProcessing={isSettingLimit || isSettingLimitConfirming}
          statusMessage={isSettingLimit || isSettingLimitConfirming ? 'Submitting...' : 'Set Limit'}
        />

        {error && (
          <p className="text-red-400 mt-4 text-center fixed bottom-4 left-1/2 -translate-x-1/2 bg-slate-800 p-3 rounded-lg">
            Error: {error.message}
          </p>
        )}

        {setLimitError && (
          <p className="text-red-400 mt-4 text-center fixed bottom-16 left-1/2 -translate-x-1/2 bg-slate-800 p-3 rounded-lg">
            Error updating limit: {setLimitError.message}
          </p>
        )}
      </div>
    </div>
  );
}

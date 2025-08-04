'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useReadContracts } from 'wagmi';
import { isAddress, Abi, parseEther, formatEther } from 'viem';
import { motion } from 'framer-motion';
import { CreditCard, Store, AlertTriangle, Clock } from 'lucide-react';

import FamilySharedWalletJSON from '@/abis/FamilySharedWallet.json';
import { useRouter } from 'next/navigation';

// --- TYPE DEFINITIONS ---
const CATEGORIES = [
  { id: 0, name: 'Food', icon: '🍽️' },
  { id: 1, name: 'Education', icon: '📚' },
  { id: 2, name: 'Entertainment', icon: '🎮' },
  { id: 3, name: 'Transport', icon: '🚗' },
  { id: 4, name: 'Others', icon: '🛍️' }
] as const;
type CategoryName = typeof CATEGORIES[number]['name'];

type Vendor = {
  address: `0x${string}`;
  category: CategoryName;
  isActive: boolean;
  spendingLimit: bigint;
  spentThisMonth: bigint;
  name: string;
};

type UserLimits = {
    [key in CategoryName]: {
        limit: number;
        spent: number;
        remaining: number;
    }
};

type ChildProps = {
  onFamilyCreated?: () => void;
};

// --- HOOK: usePayments ---
function usePayments() {
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

  const { data: vendorAddresses, isLoading: isLoadingAddresses } = useReadContract({
    account: connectedAddress,
    address: contractAddress,
    abi: FamilySharedWalletABI,
    functionName: 'getFamilyVendors',
    args: [familyId],
    query: { enabled: !!familyId && Number(familyId) > 0 },
  });

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

  const vendors = useMemo(() => {
    if (!vendorAddresses || !vendorDetails) return [];

    return (vendorAddresses as readonly `0x${string}`[]).map((address, index) => {
      const detail = vendorDetails[index];
      if (detail.status === 'success' && detail.result) {
        // Now fetch all four returned tuple elements:
        const [categoryIndex, isActive, spendingLimit, spentThisMonth] = detail.result as readonly [number, boolean, bigint, bigint];
        return {
          address,
          category: CATEGORIES[categoryIndex]?.name ?? 'Others',
          isActive,
          spendingLimit,
          spentThisMonth,
          name: `Vendor ${address.slice(0, 6)}...`,
        };
      }
      return null;
    }).filter((v): v is Vendor & { spendingLimit: bigint; spentThisMonth: bigint } => v !== null && v.isActive);
  }, [vendorAddresses, vendorDetails]);

  const { data: userReport, isLoading: isLoadingReport, refetch: refetchLimits } = useReadContract({
      account: connectedAddress,
      address: contractAddress,
      abi: FamilySharedWalletABI,
      functionName: 'getDetailedReport',
      args: [familyId, connectedAddress],
      query: { enabled: !!familyId && Number(familyId) > 0 && !!connectedAddress },
  });

  const userLimits = useMemo<UserLimits | null>(() => {
      if (!userReport) return null;
      const [spentArray, limitsArray] = userReport as readonly [readonly bigint[], readonly bigint[]];
      const limits: Partial<UserLimits> = {};
      CATEGORIES.forEach((cat, i) => {
          const limit = parseFloat(formatEther(limitsArray[i]));
          const spent = parseFloat(formatEther(spentArray[i]));
          limits[cat.name] = { limit, spent, remaining: limit - spent };
      });
      return limits as UserLimits;
  }, [userReport]);

  const loading = isLoadingFamilyId || isLoadingAddresses || isLoadingDetails || isLoadingReport;

  return { vendors, userLimits, familyId, loading, refetchLimits, userHasFamily: !!familyId && Number(familyId) > 0 };
}


// --- PAGE: PaymentInterface ---
export default function PaymentInterface({ onFamilyCreated } : ChildProps) {
  const { vendors, userLimits, familyId, loading, refetchLimits, userHasFamily } = usePayments();
  const [selectedVendor, setSelectedVendor] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [isEmergency, setIsEmergency] = useState(false);
  const [hash, setHash] = useState<`0x${string}`>();

  const { isConnected } = useAccount();
  const router = useRouter();

  useEffect(() => {
    if (!isConnected) {
      router.push('/');
    }
  }, [isConnected, router]);

  const { writeContract, isPending, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
      if (isConfirmed) {
          refetchLimits();
          setAmount('');
          setSelectedVendor('');
          setHash(undefined);
      }
  }, [isConfirmed, refetchLimits]);

  const selectedVendorDetails = useMemo(() => vendors.find(v => v.address === selectedVendor), [vendors, selectedVendor]);
  const selectedCategoryIndex = useMemo(() => CATEGORIES.findIndex(c => c.name === selectedVendorDetails?.category), [selectedVendorDetails]);

  const handlePayment = async () => {
    if (!selectedVendor || !amount || !familyId) return;
    
    const functionName = isEmergency ? 'makeEmergencyPayment' : 'makePayment';
    
    writeContract({
        address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`,
        abi: FamilySharedWalletJSON.abi as Abi,
        functionName,
        args: [selectedVendor],
        value: parseEther(amount),
    }, {
        onSuccess: (sentHash) => {
            setHash(sentHash);
        }
    });
  };

  // Convert BigInt to number in ETH
  const vendorLimit = selectedVendorDetails?.spendingLimit ? Number(formatEther(selectedVendorDetails.spendingLimit)) : 0;
  const vendorSpent = selectedVendorDetails?.spentThisMonth ? Number(formatEther(selectedVendorDetails.spentThisMonth)) : 0;
  const vendorRemaining = vendorLimit - vendorSpent;

  // Use vendor limits for validation and display
  const currentLimits = {
    limit: vendorLimit,
    spent: vendorSpent,
    remaining: vendorRemaining,
  };

  const canAfford = parseFloat(amount || '0') <= currentLimits.remaining;
  const isProcessing = isPending || isConfirming;
  const statusMessage = isPending ? 'Submitting...' : isConfirming ? 'Confirming...' : isEmergency ? 'Send Emergency Payment' : 'Send Payment';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-6 py-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Make Payment 💳</h1>
          <p className="text-slate-300">Send payments to approved vendors within your limits</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-2">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6">
              <h2 className="text-2xl font-bold text-white mb-6">Payment Details</h2>
              
              <div className="mb-6">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={isEmergency} onChange={(e) => setIsEmergency(e.target.checked)} className="w-5 h-5 rounded border-white/20 bg-white/10 text-red-500 focus:ring-red-500"/>
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={20} className="text-red-400" />
                    <span className="text-white">Emergency Payment (Bypasses Limits)</span>
                  </div>
                </label>
              </div>

              <div className="mb-6">
                <label className="block text-slate-300 mb-3">Select Vendor</label>
                <select value={selectedVendor} onChange={(e) => setSelectedVendor(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-black focus:outline-none focus:border-blue-500 " required>
                  <option value="">Choose a vendor...</option>
                  {vendors?.map((vendor) => (
                    <option key={vendor.address} value={vendor.address}>
                      {vendor.name} - {vendor.category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-slate-300 mb-3">Amount (ETH)</label>
                <div className="relative">
                  <input type="number" step="0.001" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.000" className={`w-full bg-white/10 border rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none ${amount && !canAfford && !isEmergency ? 'border-red-500 focus:border-red-500' : 'border-white/20 focus:border-blue-500'}`} required/>
                  {amount && !canAfford && !isEmergency && (
                    <p className="text-red-400 text-sm mt-1">Exceeds category limit! Remaining: {currentLimits.remaining.toFixed(3)} ETH</p>
                  )}
                </div>
              </div>

              <button onClick={handlePayment} disabled={isProcessing || !selectedVendor || !amount || (!canAfford && !isEmergency)} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:opacity-50 text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors">
                <CreditCard size={20} /> {statusMessage}
              </button>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="space-y-6">
            {!isEmergency && (
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6">
                <h3 className="text-xl font-bold text-white mb-4">Category Limits</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-slate-300">Selected Category:</span>
                    <span className="text-white">{selectedVendorDetails?.category ?? 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Monthly Limit:</span>
                    <span className="text-white">{currentLimits.limit.toFixed(3)} ETH</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Already Spent:</span>
                    <span className="text-white">{currentLimits.spent.toFixed(3)} ETH</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Remaining:</span>
                    <span className={`font-semibold ${currentLimits.remaining > 0 ? 'text-green-400' : 'text-red-400'}`}>{currentLimits.remaining.toFixed(3)} ETH</span>
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-400">Usage</span>
                      <span className="text-white">{currentLimits.limit > 0 ? Math.round((currentLimits.spent / currentLimits.limit) * 100) : 0}%</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div className={`h-2 rounded-full transition-all duration-300 ${currentLimits.spent / currentLimits.limit > 0.8 ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${Math.min((currentLimits.spent / currentLimits.limit) * 100, 100)}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

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
              </div>
            </div>

            {isEmergency && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <AlertTriangle size={24} className="text-red-400" />
                  <h3 className="text-xl font-bold text-red-400">Emergency Mode</h3>
                </div>
                <p className="text-red-300 text-sm">Emergency payments bypass all spending limits and will be recorded separately. Use only for genuine emergencies.</p>
              </div>
            )}
            {writeError && <p className="text-red-400 mt-4 text-center">Error: {writeError.message}</p>}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

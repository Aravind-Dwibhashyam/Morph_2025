'use client';

import React, { useMemo, useState, useEffect } from 'react';
import {
  useAccount,
  useReadContract,
  useReadContracts,
  useWriteContract,
  useWaitForTransactionReceipt
} from 'wagmi';
import { Abi, formatEther, parseEther } from 'viem';
import { AnimatePresence, motion } from 'framer-motion';

import FamilySharedWalletJSON from '../../abis/FamilySharedWallet.json';
import { useRouter } from 'next/navigation';

type StatsCardProps = {
  title: string;
  value: string;
  icon: string;
  trend: string;
};

type CategoryItemProps = {
  name: string;
  spent: number;
  limit: number;
};

type VendorBalance = {
  address: `0x${string}`;
  category: string;
  isActive: boolean;
  spendingLimit: bigint;
  spentThisMonth: bigint;
};

type Transaction = {
  fromMember: string;
  toVendor: string;
  amount: string;
  category: string;
  timestamp: Date;
};

type ChildReportResult = {
  status: 'success' | 'failure';
  result?: readonly [readonly bigint[], readonly bigint[], readonly bigint[]];
  error?: Error;
};

type AddFundsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onAddFunds: (amount: string) => void;
  isProcessing: boolean;
  statusMessage: string;
};

type DashboardProps = {
  onFamilyCreated?: () => void;
};

const AddFundsModal = ({
  isOpen,
  onClose,
  onAddFunds,
  isProcessing,
  statusMessage,
}: AddFundsModalProps) => {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setError('Please enter a valid ETH amount.');
      return;
    }
    setError('');
    onAddFunds(amount);
  };

  useEffect(() => {
    if (!isOpen) setAmount(''); // Clear amount on close
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-slate-800 rounded-2xl p-8 border border-white/20 w-full max-w-md"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold text-white mb-4">Add Funds to Family</h2>
            <p className="text-slate-400 mb-6">Enter the amount of ETH you want to add to your family wallet.</p>
            <input
              type="text"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="Amount in ETH"
              className="w-full bg-slate-700 text-white rounded-lg p-3 mb-2 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500"
              disabled={isProcessing}
            />
            {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
            <div className="flex justify-end gap-4 mt-6">
              <button onClick={onClose} className="text-slate-300 hover:text-white transition-colors px-4 py-2 rounded-lg" disabled={isProcessing}>Cancel</button>
              <button
                onClick={handleSubmit}
                disabled={isProcessing}
                className="bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-2 rounded-lg transition-colors disabled:bg-slate-500"
              >
                {statusMessage}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

function useFamilySharedWallet() {
  const { address: connectedAddress } = useAccount();
  const FamilySharedWalletABI = FamilySharedWalletJSON.abi as Abi;
  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;

  const { data: familyId, isLoading: isLoadingFamilyId, refetch: refetchFamilyId } = useReadContract({
    account: connectedAddress,
    address: contractAddress,
    abi: FamilySharedWalletABI,
    functionName: 'getUserFamily',
    args: [connectedAddress],
    query: { enabled: !!connectedAddress },
  });

  const { data: familyInfo, isLoading: isLoadingFamilyInfo } = useReadContract({
    account: connectedAddress,
    address: contractAddress,
    abi: FamilySharedWalletABI,
    functionName: 'getFamilyInfo',
    args: [familyId],
    query: { enabled: !!familyId && Number(familyId) > 0 },
  });

  const { data: children, isLoading: isLoadingChildren } = useReadContract({
    account: connectedAddress,
    address: contractAddress,
    abi: FamilySharedWalletABI,
    functionName: 'getFamilyChildren',
    args: [familyId],
    query: { enabled: !!familyId && Number(familyId) > 0 },
  });

  const childrenContracts = useMemo(() => {
    const typedChildren = children as readonly `0x${string}`[] | undefined;
    if (!typedChildren || !familyId) return [];
    return typedChildren.map((childAddress: `0x${string}`) => ({
      address: contractAddress,
      abi: FamilySharedWalletABI,
      functionName: 'getDetailedReport',
      args: [familyId, childAddress],
    }));
  }, [children, familyId, contractAddress, FamilySharedWalletABI]);

  const { data: childrenReports, isLoading: isLoadingReports } = useReadContracts({
    account: connectedAddress,
    contracts: childrenContracts,
    query: { enabled: !!children && (children as readonly `0x${string}`[]).length > 0 },
  });

  // New: fetch vendor addresses
  const { data: vendorAddresses, isLoading: isLoadingVendorAddresses } = useReadContract({
    account: connectedAddress,
    address: contractAddress,
    abi: FamilySharedWalletABI,
    functionName: 'getFamilyVendors',
    args: [familyId],
    query: { enabled: !!familyId && Number(familyId) > 0 },
  });

  // New: fetch vendor details (category, isActive, spendingLimit, spentThisMonth)
  const vendorContracts = useMemo(() => {
    const typedVendors = vendorAddresses as readonly `0x${string}`[] | undefined;
    if (!typedVendors || !familyId) return [];
    return typedVendors.map((vendorAddr) => ({
      address: contractAddress,
      abi: FamilySharedWalletABI,
      functionName: 'familyVendors',
      args: [familyId, vendorAddr],
    }));
  }, [vendorAddresses, familyId, contractAddress, FamilySharedWalletABI]);

  const { data: vendorDetails, isLoading: isLoadingVendorDetails } = useReadContracts({
    account: connectedAddress,
    contracts: vendorContracts,
    query: { enabled: !!vendorAddresses && (vendorAddresses as readonly `0x${string}`[]).length > 0 },
  });

  const vendors = useMemo(() => {
    if (!vendorAddresses || !vendorDetails) return [];
    return (vendorAddresses as `0x${string}`[]).map((address, index) => {
      const detail = vendorDetails[index];
      if (detail.status === 'success' && detail.result) {
        // Expecting familyVendors to return: [categoryIndex (number), isActive (boolean), spendingLimit (bigint), spentThisMonth (bigint)]
        const [categoryIndex, isActive, spendingLimit, spentThisMonth] = detail.result as readonly [number, boolean, bigint, bigint];
        return {
          address,
          category: ['Food', 'Education', 'Entertainment', 'Transport', 'Others'][categoryIndex] ?? 'Others',
          isActive,
          spendingLimit,
          spentThisMonth,
        };
      }
      return null;
    }).filter((v): v is VendorBalance => v !== null);
  }, [vendorAddresses, vendorDetails]);

  const processedData = useMemo(() => {
    if (!familyInfo || !childrenReports) return null;

    const [, , , , parentCount, childCount, vendorCount, familyBalance] = familyInfo as readonly [
      bigint,
      `0x${string}`,
      boolean,
      number,
      bigint,
      bigint,
      bigint,
      bigint
    ];

    let totalSpent = 0;
    const categorySpending = {
      Food: { spent: 0, limit: 0 },
      Education: { spent: 0, limit: 0 },
      Entertainment: { spent: 0, limit: 0 },
      Transport: { spent: 0, limit: 0 },
      Others: { spent: 0, limit: 0 },
    };
    const categoryNames = Object.keys(categorySpending);

    (childrenReports as ChildReportResult[]).forEach((report) => {
      if (report.status === 'success' && report.result) {
        const [spentArray, limitsArray] = report.result;
        for (let i = 0; i < spentArray.length; i++) {
          const categoryName = categoryNames[i] as keyof typeof categorySpending;
          const spent = parseFloat(formatEther(spentArray[i]));
          const limit = parseFloat(formatEther(limitsArray[i]));

          categorySpending[categoryName].spent += spent;
          categorySpending[categoryName].limit += limit;
          totalSpent += spent;
        }
      }
    });

    return {
      balance: typeof familyBalance === 'bigint' ? parseFloat(formatEther(familyBalance)).toFixed(4) : '0.0000',
      monthlySpent: totalSpent.toFixed(2),
      memberCount: (Number(parentCount) + Number(childCount)).toString(),
      vendorCount: Number(vendorCount).toString(),
      categories: Object.entries(categorySpending).map(([name, data]) => ({
        name,
        ...data,
      })),
      vendors, // include the vendor balances here
    };
  }, [familyInfo, childrenReports, vendors]);

  const loading =
    isLoadingFamilyId ||
    isLoadingFamilyInfo ||
    isLoadingChildren ||
    isLoadingReports ||
    isLoadingVendorAddresses ||
    isLoadingVendorDetails;

  const transactions: Transaction[] = [];

  return {
    familyData: processedData,
    transactions,
    loading,
    userHasFamily: !!familyId && Number(familyId) > 0,
    refetchFamilyId,
    familyId,
  };
}

const StatsCard = ({ title, value, icon, trend }: StatsCardProps) => (
  <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6">
    <div className="flex justify-between items-start">
      <div className="flex flex-col">
        <p className="text-slate-300 mb-1">{title}</p>
        <p className="text-3xl font-bold text-white">{value}</p>
      </div>
      <div className="text-3xl bg-slate-900/50 p-3 rounded-lg">{icon}</div>
    </div>
    {trend && (
      <p className={`text-sm mt-4 ${trend.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
        {trend}
      </p>
    )}
  </div>
);

const CategoryItem = ({ name, spent, limit }: CategoryItemProps) => {
  const percentage = limit > 0 ? (spent / limit) * 100 : 0;
  const colors: { [key: string]: string } = {
    Food: 'bg-blue-500',
    Education: 'bg-green-500',
    Entertainment: 'bg-purple-500',
    Transport: 'bg-yellow-500',
    Others: 'bg-red-500',
  };
  const color = colors[name] || 'bg-gray-500';

  return (
    <div>
      <div className="flex justify-between items-center mb-1 text-white">
        <span className="font-semibold">{name}</span>
        <span>
          {spent.toFixed(4)} / <span className="text-slate-400">{limit.toFixed(4)} ETH</span>
        </span>
      </div>
      <div className="w-full bg-slate-700 rounded-full h-2.5">
        <div className={`${color} h-2.5 rounded-full`} style={{ width: `${percentage}%` }}></div>
      </div>
    </div>
  );
};

export default function Dashboard({ onFamilyCreated } : DashboardProps) {
  const {
    familyData,
    loading,
    userHasFamily,
    refetchFamilyId,
    familyId,
  } = useFamilySharedWallet();

  const [hash, setHash] = useState<`0x${string}`>();

  const {
    writeContract,
    isPending,
    error,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  const [isFundsModalOpen, setIsFundsModalOpen] = useState(false);
  const [addFundsHash, setAddFundsHash] = useState<`0x${string}`>();

  const {
    writeContract: writeAddFunds,
    isPending: isAddingFunds,
    error: addFundsError,
  } = useWriteContract();

  const { isLoading: isFundsConfirming, isSuccess: isFundsConfirmed } = useWaitForTransactionReceipt({ hash: addFundsHash });

  const { isConnected } = useAccount();
  const router = useRouter();

  useEffect(() => {
    if (!isConnected) {
      router.push('/');
    }
  }, [isConnected, router]);

  useEffect(() => {
    if (isConfirmed) {
      refetchFamilyId();
      setHash(undefined);
    }
  }, [isConfirmed, refetchFamilyId]);

  useEffect(() => {
    if (isFundsConfirmed) {
      setIsFundsModalOpen(false);
      setAddFundsHash(undefined);
      refetchFamilyId();
    }
  }, [isFundsConfirmed, refetchFamilyId]);

  useEffect(() => {
    if (isConfirmed) {
      refetchFamilyId();
      setHash(undefined);
      if (onFamilyCreated) onFamilyCreated(); // Notify AppShell to update header
    }
  }, [isConfirmed, refetchFamilyId, onFamilyCreated]);

  const handleCreateFamily = () => {
    writeContract(
      {
        address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`,
        abi: FamilySharedWalletJSON.abi as Abi,
        value: parseEther('0.05'),
        functionName: 'createFamily',
      },
      {
        onSuccess: (sentHash) => {
          setHash(sentHash);
        },
      }
    );
    window.location.reload();
  };

  const { address: connectedAddress } = useAccount();
  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;

  const handleAddFunds = (amount: string) => {
    if (!familyId) return;
    writeAddFunds(
      {
        account: connectedAddress,
        address: contractAddress,
        abi: FamilySharedWalletJSON.abi as Abi,
        functionName: 'addFunds',
        args: [familyId],
        value: parseEther(amount),
      },
      {
        onSuccess: (sentHash) => setAddFundsHash(sentHash),
      }
    );
  };

  // Aggregates vendor spending and limits by category/type (Food, Education, ...)
  const vendorTypeAggregates = React.useMemo(() => {
    if (!familyData?.vendors) return null;
    // Initialize accumulator for all categories
    const acc: { [cat: string]: { spent: number; limit: number } } = {};
    for (const category of ['Food', 'Education', 'Entertainment', 'Transport', 'Others']) {
      acc[category] = { spent: 0, limit: 0 };
    }
    // Sum up by category
    familyData.vendors.forEach((vendor) => {
      if (!acc[vendor.category]) return;
      acc[vendor.category].spent += Number(formatEther(vendor.spentThisMonth));
      // If vendor.spendingLimit is 0, treat it as unlimited. Else, sum.
      if (vendor.spendingLimit !== BigInt(0)) {
        acc[vendor.category].limit += Number(formatEther(vendor.spendingLimit));
      }
    });
    // Convert to array for easy render
    return Object.entries(acc).map(([cat, vals]) => ({
      name: cat,
      spent: vals.spent,
      limit: vals.limit,
    }));
  }, [familyData?.vendors]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  if (!userHasFamily) {
    const isProcessing = isPending || isConfirming;
    const statusMessage = isPending ? 'Submitting...' : isConfirming ? 'Confirming...' : 'Create Your Family';
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-white p-4 text-center">
        <h1 className="text-4xl font-bold mb-4">Welcome!</h1>
        <p className="text-slate-300 mb-8 max-w-md">You are not part of a family yet. Create one to get started.</p>
        <button
          onClick={handleCreateFamily}
          disabled={isProcessing}
          className="bg-green-600 active:scale-95 text-white font-bold py-3 px-6 rounded-xl transition-transform ease-in-out hover:scale-105 disabled:bg-slate-500 disabled:cursor-not-allowed"
        >
          {statusMessage}
        </button>
        {error && <p className="text-red-400 mt-4">Error: {error.message}</p>}
      </div>
    );
  }

  const stats: StatsCardProps[] = [
    { title: 'Family Balance (ETH)', value: familyData?.balance || '0', icon: '💰', trend: '' },
    { title: 'This Month Spent (ETH)', value: familyData?.monthlySpent || '0', icon: '📊', trend: '' },
    { title: 'Family Members', value: familyData?.memberCount || '0', icon: '👨‍👩‍👧‍👦', trend: '' },
    { title: 'Active Vendors', value: familyData?.vendorCount || '0', icon: '🏪', trend: '' },
  ];

  return (
    <>
      <AddFundsModal
        isOpen={isFundsModalOpen}
        onClose={() => setIsFundsModalOpen(false)}
        onAddFunds={handleAddFunds}
        isProcessing={isAddingFunds || isFundsConfirming}
        statusMessage={isAddingFunds ? 'Submitting...' : isFundsConfirming ? 'Confirming...' : 'Add Funds'}
      />
      {addFundsError && (
        <p className="text-red-400 mt-4 text-center">Error adding funds: {addFundsError.message}</p>
      )}
      <div className="container mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-center justify-between"
        >
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Welcome back! 👋</h1>
            <p className="text-slate-300">Here's your family's financial overview.</p>
          </div>
          <button
            onClick={() => setIsFundsModalOpen(true)}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-xl transition-transform active:scale-95 ml-4"
          >
            + Add Funds
          </button>
        </motion.div>

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

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 mb-8"
        >
          <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Aggregated Contract Spending</h2>
            <div className="space-y-4">
              {vendorTypeAggregates ? (
                vendorTypeAggregates.map((category, index) => {
                  // If limit = 0, treat as Unlimited (handle in UI as you like)
                  const limitForDisplay = category.limit === 0 ? 9999 : category.limit; // Use a big number for Unlimited in bar
                  
                  return (
                    <CategoryItem
                      key={index}
                      name={category.name}
                      spent={category.spent}
                      limit={limitForDisplay}
                    />
                  );
                })
              ) : (
                // Fallback to existing categories data while loading vendor aggregates
                familyData?.categories.map((category, index) => (
                  <CategoryItem key={index} {...category} />
                ))
              )}
            </div>
          </div>
        </motion.div>

        {/* New Vendor Balances Section */}
        {familyData?.vendors && familyData.vendors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2"
          >
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6">
              <h2 className="text-2xl font-bold text-white mb-6">Vendor Spending Limits</h2>
              <div className="space-y-4 max-h-80 overflow-y-auto">
                {familyData.vendors.map((vendor, idx) => {
                  const limitEth = vendor.spendingLimit === BigInt(0) ? 'Unlimited' : parseFloat(formatEther(vendor.spendingLimit)).toFixed(4) + ' ETH';
                  const spentEth = parseFloat(formatEther(vendor.spentThisMonth)).toFixed(4) + ' ETH';

                  return (
                    <div key={vendor.address} className="flex justify-between items-center bg-white/10 rounded-lg p-3">
                      <div>
                        <p className="font-semibold text-white">{vendor.address.slice(0, 6)}...{vendor.address.slice(-4)}</p>
                        <p className="text-sm text-slate-400">{vendor.category}</p>
                      </div>
                      <div className="text-right text-white text-sm">
                        <p>Limit: <span className="font-mono">{limitEth}</span></p>
                        <p>Spent: <span className="font-mono">{spentEth}</span></p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </>
  );
}

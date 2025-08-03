'use client';

import React, { useMemo, useState, useEffect } from 'react';
// In a real app, these would be imported from the actual libraries
import { useAccount, useReadContract, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Abi, formatEther, parseEther } from 'viem';
import { motion } from 'framer-motion';

// Import the ABI from the JSON file as requested.
// The '@' symbol is typically an alias for the 'src' directory in Next.js.
import FamilySharedWalletJSON from '../../abis/FamilySharedWallet.json';

// --- TYPE DEFINITIONS ---
// Defines the structure for the props of each UI component to prevent 'any' type errors.
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

type TransactionRowProps = {
  memberName: string;
  vendorName: string;
  amount: string;
  category: string;
  timestamp: Date;
};

// Defines the structure for a transaction object.
type Transaction = {
  // This would be populated by listening to contract events.
  // Example structure:
  fromMember: string;
  toVendor: string;
  amount: string;
  category: string;
  timestamp: Date;
};

// Type for the result of the useReadContracts hook for children reports
type ChildReportResult = {
    status: 'success' | 'failure';
    result?: readonly [readonly bigint[], readonly bigint[], readonly bigint[]];
    error?: Error;
}

// --- HOOK: useFamilySharedWallet ---
// This hook encapsulates all the logic for interacting with the FamilySharedWallet smart contract.
function useFamilySharedWallet() {
  const { address: connectedAddress } = useAccount();
  const FamilySharedWalletABI = FamilySharedWalletJSON.abi as Abi;

  // IMPORTANT: Replace this with your actual deployed contract address
  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;

  // 1. Get the family ID for the current user
  const { data: familyId, isLoading: isLoadingFamilyId, refetch: refetchFamilyId } = useReadContract({
    account:connectedAddress,
    address: contractAddress,
    abi: FamilySharedWalletABI,
    functionName: 'getUserFamily',
    args: [connectedAddress],
    query: { enabled: !!connectedAddress },
  });

  // 2. Get the general family info (member counts, vendor counts, and now family balance)
  const { data: familyInfo, isLoading: isLoadingFamilyInfo } = useReadContract({
    account: connectedAddress,
    address: contractAddress,
    abi: FamilySharedWalletABI,
    functionName: 'getFamilyInfo',
    args: [familyId],
    query: { enabled: !!familyId && Number(familyId) > 0 },
  });

  // 3. Get the list of all children in the family
  const { data: children, isLoading: isLoadingChildren } = useReadContract({
      account: connectedAddress,
      address: contractAddress,
      abi: FamilySharedWalletABI,
      functionName: 'getFamilyChildren',
      args: [familyId],
      query: { enabled: !!familyId && Number(familyId) > 0 },
  });

  // 4. Prepare contract calls to get detailed spending reports for EACH child
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

  // 5. Execute the batch call for all children's reports
  const { data: childrenReports, isLoading: isLoadingReports } = useReadContracts({
      account: connectedAddress,
      contracts: childrenContracts,
      query: { enabled: !!children && (children as readonly `0x${string}`[]).length > 0 },
  });

  // 6. Process and aggregate all the fetched data into a UI-friendly format
  const processedData = useMemo(() => {
    if (!familyInfo || !childrenReports) return null;

    // Updated destructuring to match the new ABI which includes familyBalance
    const [, , , , parentCount, childCount, vendorCount, familyBalance] = familyInfo as readonly [bigint, `0x${string}`, boolean, number, bigint, bigint, bigint, bigint];
    
    let totalSpent = 0;
    const categorySpending = {
        'Food': { spent: 0, limit: 0 },
        'Education': { spent: 0, limit: 0 },
        'Entertainment': { spent: 0, limit: 0 },
        'Transport': { spent: 0, limit: 0 },
        'Others': { spent: 0, limit: 0 },
    };
    const categoryNames = Object.keys(categorySpending);

    (childrenReports as ChildReportResult[]).forEach((report: ChildReportResult) => {
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
    };
  }, [familyInfo, childrenReports]);

  const loading = isLoadingFamilyId || isLoadingFamilyInfo || isLoadingChildren || isLoadingReports;
  
  const transactions: Transaction[] = [];

  return { familyData: processedData, transactions, loading, userHasFamily: !!familyId && Number(familyId) > 0, refetchFamilyId };
}


// --- UI COMPONENT: StatsCard ---
const StatsCard = ({ title, value, icon, trend }: StatsCardProps) => (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6">
      <div className="flex justify-between items-start">
        <div className="flex flex-col">
          <p className="text-slate-300 mb-1">{title}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
        </div>
        <div className="text-3xl bg-slate-900/50 p-3 rounded-lg">{icon}</div>
      </div>
      {trend && <p className={`text-sm mt-4 ${trend.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>{trend}</p>}
    </div>
);
  
// --- UI COMPONENT: CategoryItem ---
const CategoryItem = ({ name, spent, limit }: CategoryItemProps) => {
    const percentage = limit > 0 ? (spent / limit) * 100 : 0;
    const colors: { [key: string]: string } = {
      'Food': 'bg-blue-500',
      'Education': 'bg-green-500',
      'Entertainment': 'bg-purple-500',
      'Transport': 'bg-yellow-500',
      'Others': 'bg-red-500'
    };
    const color = colors[name] || 'bg-gray-500';
  
    return (
      <div>
        <div className="flex justify-between items-center mb-1 text-white">
          <span className="font-semibold">{name}</span>
          <span>{spent.toFixed(4)} / <span className="text-slate-400">{limit.toFixed(4)} ETH</span></span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2.5">
          <div className={`${color} h-2.5 rounded-full`} style={{ width: `${percentage}%` }}></div>
        </div>
      </div>
    );
};
  
// --- UI COMPONENT: TransactionRow ---
const TransactionRow = ({ memberName, vendorName, amount, category, timestamp }: TransactionRowProps) => (
    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5">
      <div className="flex items-center">
        <div className="p-3 bg-slate-700 rounded-lg mr-4">
          <span>{category === 'Food' ? '🍔' : category === 'Transport' ? '🚗' : '🛍️'}</span>
        </div>
        <div>
          <p className="font-semibold text-white">Paid to {vendorName}</p>
          <p className="text-sm text-slate-400">by {memberName} on {timestamp.toLocaleDateString()}</p>
        </div>
      </div>
      <div className="text-right">
          <p className="font-bold text-red-400">-${amount}</p>
          <p className="text-xs text-slate-500">{category}</p>
      </div>
    </div>
);

// --- PAGE: Dashboard ---
export default function Dashboard() {
    const { familyData, loading, userHasFamily, refetchFamilyId } = useFamilySharedWallet();
    const [hash, setHash] = useState<`0x${string}`>();
    const { writeContract, isPending, error } = useWriteContract();
    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

    useEffect(() => {
        if (isConfirmed) {
            refetchFamilyId();
            setHash(undefined);
        }
    }, [isConfirmed, refetchFamilyId]);

    const handleCreateFamily = () => {
        writeContract({
            address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`,  
            abi: FamilySharedWalletJSON.abi as Abi,
            value: parseEther("0.05"),
            functionName: 'createFamily',
        }, {
            onSuccess: (sentHash) => {
                setHash(sentHash);
            }
        });
    };
  
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
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-xl disabled:bg-slate-500 disabled:cursor-not-allowed"
                >
                    {statusMessage}
                </button>
                {error && <p className="text-red-400 mt-4">Error: {error.message}</p>}
            </div>
        )
    }
  
    const stats: StatsCardProps[] = [
      { title: 'Family Balance (ETH)', value: familyData?.balance || '0', icon: '💰', trend: '' },
      { title: 'This Month Spent (ETH)', value: familyData?.monthlySpent || '0', icon: '📊', trend: '' },
      { title: 'Family Members', value: familyData?.memberCount || '0', icon: '👨‍👩‍👧‍👦', trend: '' },
      { title: 'Active Vendors', value: familyData?.vendorCount || '0', icon: '🏪', trend: '' }
    ];
  
    return (
      <div className="container mx-auto px-6 py-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Welcome back! 👋</h1>
          <p className="text-slate-300">Here&apos;s your family's financial overview.</p>
        </motion.div>
  
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {stats.map((stat, index) => <StatsCard key={index} {...stat} />)}
        </motion.div>
  
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6">
              <h2 className="text-2xl font-bold text-white mb-6">Aggregated Category Spending</h2>
              <div className="space-y-4">
                {familyData?.categories.map((category, index) => <CategoryItem key={index} {...category} />)}
              </div>
            </div>
          </motion.div>
  
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6">
              <h2 className="text-xl font-bold text-white mb-6">Recent Transactions</h2>
              <div className="space-y-3 text-slate-400 text-center py-4">
                <p>Transaction history requires listening to contract events.</p>
                <p className="text-xs text-slate-500">This feature would be implemented using `useWatchContractEvent` in a full application.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useAccount, useReadContract, useReadContracts } from 'wagmi';
import { motion } from 'framer-motion';
import { BarChart3, PieChart, TrendingUp, Download } from 'lucide-react';
import { Abi, formatEther } from 'viem';

import FamilySharedWalletJSON from '../../abis/FamilySharedWallet.json';
import { useRouter } from 'next/navigation';

// --- TYPE DEFINITIONS ---
const CATEGORIES = ["Food", "Education", "Entertainment", "Transport", "Others"] as const;
type CategoryName = typeof CATEGORIES[number];

type Member = {
  address: `0x${string}`;
  name: string;
  role: 'Parent' | 'Child';
  totalSpent: number;
  monthlyLimit: number; // For children, this is the sum of their category limits
  categorySpending: { [key in CategoryName]: number };
};

type CategoryData = {
    name: CategoryName;
    amount: number;
    percentage: number;
    color: string;
};

type ChildReportResult = {
    status: 'success' | 'failure';
    result?: readonly [readonly bigint[], readonly bigint[], readonly bigint[]];
    error?: Error;
}

type ChildProps = {
  onFamilyCreated?: () => void;
};

// --- HOOK: useAnalyticsData ---
function useAnalyticsData() {
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

  const { data: parents, isLoading: isLoadingParents } = useReadContract({
    account: connectedAddress,
    address: contractAddress,
    abi: FamilySharedWalletABI,
    functionName: 'getFamilyParents',
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
    return typedChildren.map((childAddress) => ({
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

  const analyticsData = useMemo(() => {
    if (!parents || !children || !childrenReports) return null;

    const childMembers: Member[] = (children as `0x${string}`[]).map((address, index) => {
      let totalSpent = 0;
      let monthlyLimit = 0;
      const categorySpending: { [key in CategoryName]: number } = { Food: 0, Education: 0, Entertainment: 0, Transport: 0, Others: 0 };
      const report = childrenReports[index] as ChildReportResult;

      if (report.status === 'success' && report.result) {
        const [spentArray, limitsArray] = report.result;
        spentArray.forEach((spent: bigint, i: number) => {
            const spentAmount = parseFloat(formatEther(spent));
            totalSpent += spentAmount;
            categorySpending[CATEGORIES[i]] = spentAmount;
        });
        limitsArray.forEach((limit: bigint) => monthlyLimit += parseFloat(formatEther(limit)));
      }
      return { address, name: `Child ${index + 1}`, role: 'Child', totalSpent, monthlyLimit, categorySpending };
    });

    const parentMembers: Member[] = (parents as `0x${string}`[]).map((address, index) => ({
        address, name: `Parent ${index + 1}`, role: 'Parent', totalSpent: 0, monthlyLimit: 0, categorySpending: { Food: 0, Education: 0, Entertainment: 0, Transport: 0, Others: 0 }
    }));

    return {
        familyMembers: [...parentMembers, ...childMembers],
    };
  }, [parents, children, childrenReports]);

  const loading = isLoadingFamilyId || isLoadingParents || isLoadingChildren || isLoadingReports;

  return { analyticsData, loading, userHasFamily: !!familyId && Number(familyId) > 0 };
}

// --- PAGE: Analytics ---
export default function Analytics({ onFamilyCreated } : ChildProps) {
  const { analyticsData, loading } = useAnalyticsData();
  const [selectedMember, setSelectedMember] = useState<string>('all');

  const { isConnected } = useAccount();
  const router = useRouter();

  useEffect(() => {
    if (!isConnected) {
      router.push('/');
    }
  }, [isConnected, router]);

  const processedData = useMemo(() => {
    if (!analyticsData) return null;

    const membersToProcess = selectedMember === 'all' 
        ? analyticsData.familyMembers.filter(m => m.role === 'Child') 
        : analyticsData.familyMembers.filter(m => m.address === selectedMember);

    let totalSpent = 0;
    let totalBudget = 0;
    const categoryTotals: { [key in CategoryName]: number } = { Food: 0, Education: 0, Entertainment: 0, Transport: 0, Others: 0 };

    membersToProcess.forEach(member => {
        totalSpent += member.totalSpent;
        totalBudget += member.monthlyLimit;
        for (const cat of CATEGORIES) {
            categoryTotals[cat] += member.categorySpending[cat];
        }
    });
    
    const categoryColors: { [key in CategoryName]: string } = { Food: 'bg-blue-500', Education: 'bg-green-500', Entertainment: 'bg-purple-500', Transport: 'bg-yellow-500', Others: 'bg-red-500' };
    
    const categoryData: CategoryData[] = CATEGORIES.map(cat => ({
        name: cat,
        amount: categoryTotals[cat],
        percentage: totalSpent > 0 ? (categoryTotals[cat] / totalSpent) * 100 : 0,
        color: categoryColors[cat]
    })).sort((a, b) => b.amount - a.amount);

    return {
        familyMembers: analyticsData.familyMembers,
        categoryData,
        totalSpent,
        totalBudgetUsedPercentage: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0,
        transactionCount: 'N/A', // Requires event indexing
    };
  }, [analyticsData, selectedMember]);

  const exportData = () => {
    console.log('Exporting analytics data...');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-6 py-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Analytics Dashboard 📊</h1>
              <p className="text-slate-300">Detailed insights into your family spending patterns</p>
            </div>
            <button onClick={exportData} className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-colors">
              <Download size={20} /> Export Report
            </button>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6 mb-8">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-slate-300 mb-2">Family Member</label>
              <select value={selectedMember} onChange={(e) => setSelectedMember(e.target.value)} className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-black focus:outline-none focus:border-blue-500">
                <option value="all">All Children</option>
                {analyticsData?.familyMembers?.map((member) => (
                  <option key={member.address} value={member.address}>{member.name} ({member.role})</option>
                ))}
              </select>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6">
                <div className="flex items-center justify-between mb-4"><div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center"><TrendingUp className="text-blue-400" size={24} /></div></div>
                <h3 className="text-2xl font-bold text-white">{processedData?.totalSpent.toFixed(4) ?? '0.00'} ETH</h3>
                <p className="text-slate-400">Total Spent</p>
            </div>
             <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6">
                <div className="flex items-center justify-between mb-4"><div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center"><BarChart3 className="text-green-400" size={24} /></div></div>
                <h3 className="text-2xl font-bold text-white">{analyticsData?.familyMembers.length ?? 0}</h3>
                <p className="text-slate-400">Total Members</p>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6">
                <div className="flex items-center justify-between mb-4"><div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center"><PieChart className="text-purple-400" size={24} /></div></div>
                <h3 className="text-2xl font-bold text-white">{processedData?.transactionCount ?? 'N/A'}</h3>
                <p className="text-slate-400">Transactions</p>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6">
                <div className="flex items-center justify-between mb-4"><div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center"><span className="text-yellow-400 text-xl">🎯</span></div></div>
                <h3 className="text-2xl font-bold text-white">{processedData?.totalBudgetUsedPercentage.toFixed(0) ?? '0'}%</h3>
                <p className="text-slate-400">Budget Used</p>
            </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6">
              <h2 className="text-2xl font-bold text-white mb-6">Spending by Category</h2>
              <div className="space-y-4">
                {processedData?.categoryData.map((category, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center"><span className="text-white font-medium">{category.name}</span><span className="text-slate-300">{category.amount.toFixed(4)} ETH</span></div>
                    <div className="w-full bg-slate-700 rounded-full h-3"><div className={`${category.color} h-3 rounded-full`} style={{ width: `${category.percentage}%` }}></div></div>
                    <div className="flex justify-between text-sm"><span className="text-slate-400">{category.percentage.toFixed(1)}% of total</span></div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6">
              <h2 className="text-2xl font-bold text-white mb-6">Family Member Spending</h2>
              <div className="space-y-4">
                {analyticsData?.familyMembers.map((member, index) => (
                  <div key={index} className="bg-white/5 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center"><span className="text-white font-semibold">{member.name[0]?.toUpperCase()}</span></div>
                      <div>
                        <h3 className="text-white font-semibold">{member.name}</h3>
                        <p className="text-slate-400 text-sm">{member.role}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between"><span className="text-slate-400">Spent:</span><span className="text-white">{member.totalSpent.toFixed(4)} ETH</span></div>
                      {member.role === 'Child' && (
                        <>
                          <div className="flex justify-between"><span className="text-slate-400">Limit:</span><span className="text-white">{member.monthlyLimit?.toFixed(4)} ETH</span></div>
                          <div className="w-full bg-slate-700 rounded-full h-2">
                            <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${Math.min((member.totalSpent / (member.monthlyLimit || 1)) * 100, 100)}%` }}></div>
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
    </div>
  );
}

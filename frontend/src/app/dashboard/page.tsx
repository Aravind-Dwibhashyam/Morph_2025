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
import { useUserRole } from '@/hooks/useUserRole'; 

// --- TYPE DEFINITIONS ---
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

// Corrected CATEGORIES to be an array of objects, which fixes the type errors.
const CATEGORIES = [
    { id: 0, name: "Food" },
    { id: 1, name: "Education" },
    { id: 2, name: "Entertainment" },
    { id: 3, name: "Transport" },
    { id: 4, name: "Others" }
] as const;
type CategoryName = typeof CATEGORIES[number]['name'];

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

type SetLimitModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onSetLimit: (childAddress: `0x${string}`, categoryIndex: number, amount: string) => void;
    isProcessing: boolean;
    statusMessage: string;
    childrenList: readonly `0x${string}`[] | undefined;
};

// --- MODAL COMPONENTS ---
const AddFundsModal = ({ isOpen, onClose, onAddFunds, isProcessing, statusMessage }: AddFundsModalProps) => {
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

  useEffect(() => { if (!isOpen) setAmount(''); }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
          <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-slate-800 rounded-2xl p-8 border border-white/20 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-white mb-4">Add Funds to Family</h2>
            <p className="text-slate-400 mb-6">Enter the amount of ETH you want to add to your family wallet.</p>
            <input type="text" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount in ETH" className="w-full bg-slate-700 text-white rounded-lg p-3 mb-2 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500" disabled={isProcessing} />
            {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
            <div className="flex justify-end gap-4 mt-6">
              <button onClick={onClose} className="text-slate-300 hover:text-white transition-colors px-4 py-2 rounded-lg" disabled={isProcessing}>Cancel</button>
              <button onClick={handleSubmit} disabled={isProcessing} className="bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-2 rounded-lg transition-colors disabled:bg-slate-500">{statusMessage}</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const SetLimitModal = ({ isOpen, onClose, onSetLimit, isProcessing, statusMessage, childrenList }: SetLimitModalProps) => {
    const [childAddress, setChildAddress] = useState<`0x${string}` | ''>('');
    const [category, setCategory] = useState<number | ''>('');
    const [amount, setAmount] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = () => {
        if (!childAddress) { setError('Please select a child.'); return; }
        if (category === '') { setError('Please select a category.'); return; }
        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) { setError('Please enter a valid limit amount.'); return; }
        setError('');
        onSetLimit(childAddress, category, amount);
    };

    useEffect(() => {
        if (!isOpen) {
            setChildAddress('');
            setCategory('');
            setAmount('');
            setError('');
        }
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
                    <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-slate-800 rounded-2xl p-8 border border-white/20 w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <h2 className="text-2xl font-bold text-white mb-4">Set Spending Limit</h2>
                        <p className="text-slate-400 mb-6">Set a monthly spending limit for a child in a specific category.</p>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-slate-300 mb-2">Child</label>
                                <select value={childAddress} onChange={e => setChildAddress(e.target.value as `0x${string}`)} className="w-full bg-slate-700 text-white rounded-lg p-3 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500">
                                    <option value="" disabled>Select a child...</option>
                                    {childrenList?.map(child => <option key={child} value={child}>{child.slice(0, 8)}...{child.slice(-6)}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-slate-300 mb-2">Category</label>
                                <select value={category} onChange={e => setCategory(Number(e.target.value))} className="w-full bg-slate-700 text-white rounded-lg p-3 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500">
                                    <option value="" disabled>Select a category...</option>
                                    {CATEGORIES.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-slate-300 mb-2">Limit (ETH)</label>
                                <input type="text" value={amount} onChange={e => setAmount(e.target.value)} placeholder="e.g., 0.5" className="w-full bg-slate-700 text-white rounded-lg p-3 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500" />
                            </div>
                        </div>
                        {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
                        <div className="flex justify-end gap-4 mt-6">
                            <button onClick={onClose} className="text-slate-300 hover:text-white transition-colors px-4 py-2 rounded-lg" disabled={isProcessing}>Cancel</button>
                            <button onClick={handleSubmit} disabled={isProcessing} className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-6 py-2 rounded-lg transition-colors disabled:bg-slate-500">{statusMessage}</button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};


// --- HOOK: useDashboardData ---
function useDashboardData() {
    const { address: connectedAddress } = useAccount();
    const FamilySharedWalletABI = FamilySharedWalletJSON.abi as Abi;
    const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;
    const { role, familyId } = useUserRole(contractAddress);

    const { data: familyInfo, isLoading: isLoadingFamilyInfo, refetch: refetchFamilyData } = useReadContract({
        account: connectedAddress,
        address: contractAddress,
        abi: FamilySharedWalletABI,
        functionName: 'getFamilyInfo',
        args: [familyId],
        query: { enabled: !!familyId && Number(familyId) > 0 },
    });

    const { data: children, isLoading: isLoadingChildren, refetch: refetchChildren } = useReadContract({
        account: connectedAddress,
        address: contractAddress,
        abi: FamilySharedWalletABI,
        functionName: 'getFamilyChildren',
        args: [familyId],
        query: { enabled: !!familyId && role === 'parent' },
    });

    const reportContracts = useMemo(() => {
        if (!familyId) return [];
        if (role === 'parent' && children) {
            return (children as readonly `0x${string}`[]).map(childAddress => ({
                address: contractAddress, abi: FamilySharedWalletABI, functionName: 'getDetailedReport', args: [familyId, childAddress],
            }));
        }
        if (role === 'child' && connectedAddress) {
            return [{
                address: contractAddress, abi: FamilySharedWalletABI, functionName: 'getDetailedReport', args: [familyId, connectedAddress],
            }];
        }
        return [];
    }, [role, familyId, children, connectedAddress, contractAddress, FamilySharedWalletABI]);

    const { data: reports, isLoading: isLoadingReports, refetch: refetchReports } = useReadContracts({
        account: connectedAddress,
        contracts: reportContracts,
        query: { enabled: reportContracts.length > 0 },
    });

    const processedData = useMemo(() => {
        if (!familyInfo || !reports) return null;
        const [, , , , parentCount, childCount, vendorCount, familyBalance] = familyInfo as readonly [bigint, `0x${string}`, boolean, number, bigint, bigint, bigint, bigint];
        let totalSpent = 0;
        const categorySpending: { [key in CategoryName]: { spent: number; limit: number } } = { Food: { spent: 0, limit: 0 }, Education: { spent: 0, limit: 0 }, Entertainment: { spent: 0, limit: 0 }, Transport: { spent: 0, limit: 0 }, Others: { spent: 0, limit: 0 } };

        (reports as ChildReportResult[]).forEach((report) => {
            if (report.status === 'success' && report.result) {
                const [spentArray, limitsArray] = report.result;
                for (let i = 0; i < spentArray.length; i++) {
                    const categoryName = CATEGORIES[i].name;
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
            categories: Object.entries(categorySpending).map(([name, data]) => ({ name, ...data })),
        };
    }, [familyInfo, reports]);

    const loading = isLoadingFamilyInfo || (role === 'parent' && isLoadingChildren) || isLoadingReports;
    
    const refetchDashboardData = () => {
        refetchFamilyData();
        refetchChildren();
        refetchReports();
    };

    return { familyData: processedData, loading, userHasFamily: !!familyId && Number(familyId) > 0, familyId, children: children as readonly `0x${string}`[] | undefined, refetchDashboardData };
}


const StatsCard = ({ title, value, icon, trend }: StatsCardProps) => (
  <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6">
    <div className="flex justify-between items-start"><div className="flex flex-col"><p className="text-slate-300 mb-1">{title}</p><p className="text-3xl font-bold text-white">{value}</p></div><div className="text-3xl bg-slate-900/50 p-3 rounded-lg">{icon}</div></div>
    {trend && <p className={`text-sm mt-4 ${trend.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>{trend}</p>}
  </div>
);

const CategoryItem = ({ name, spent, limit }: CategoryItemProps) => {
  const percentage = limit > 0 ? (spent / limit) * 100 : 0;
  const colors: { [key: string]: string } = { Food: 'bg-blue-500', Education: 'bg-green-500', Entertainment: 'bg-purple-500', Transport: 'bg-yellow-500', Others: 'bg-red-500' };
  const color = colors[name] || 'bg-gray-500';
  return (
    <div>
      <div className="flex justify-between items-center mb-1 text-white"><span className="font-semibold">{name}</span><span>{spent.toFixed(4)} / <span className="text-slate-400">{limit.toFixed(4)} ETH</span></span></div>
      <div className="w-full bg-slate-700 rounded-full h-2.5"><div className={`${color} h-2.5 rounded-full`} style={{ width: `${percentage}%` }}></div></div>
    </div>
  );
};

export default function Dashboard() {
  const { familyData, loading, userHasFamily, familyId, children, refetchDashboardData } = useDashboardData();
  const { role } = useUserRole(process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`);
  const [createFamilyHash, setCreateFamilyHash] = useState<`0x${string}`>();
  const [addFundsHash, setAddFundsHash] = useState<`0x${string}`>();
  const [setLimitHash, setSetLimitHash] = useState<`0x${string}`>();

  const { writeContract: createFamily, isPending: isCreatingFamily } = useWriteContract();
  const { writeContract: addFunds, isPending: isAddingFunds } = useWriteContract();
  const { writeContract: setLimit, isPending: isSettingLimit } = useWriteContract();

  const { isLoading: isConfirmingCreate, isSuccess: isConfirmedCreate } = useWaitForTransactionReceipt({ hash: createFamilyHash });
  const { isLoading: isConfirmingFunds, isSuccess: isConfirmedFunds } = useWaitForTransactionReceipt({ hash: addFundsHash });
  const { isLoading: isConfirmingLimit, isSuccess: isConfirmedLimit } = useWaitForTransactionReceipt({ hash: setLimitHash });

  const [isFundsModalOpen, setIsFundsModalOpen] = useState(false);
  const [isLimitModalOpen, setIsLimitModalOpen] = useState(false);

  useEffect(() => { if (isConfirmedCreate || isConfirmedFunds || isConfirmedLimit) { refetchDashboardData(); setCreateFamilyHash(undefined); setAddFundsHash(undefined); setSetLimitHash(undefined); setIsFundsModalOpen(false); setIsLimitModalOpen(false); } }, [isConfirmedCreate, isConfirmedFunds, isConfirmedLimit, refetchDashboardData]);

  const handleCreateFamily = () => { createFamily({ address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`, abi: FamilySharedWalletJSON.abi as Abi, value: parseEther('0.05'), functionName: 'createFamily' }, { onSuccess: setCreateFamilyHash }); };
  const handleAddFunds = (amount: string) => { if (!familyId) return; addFunds({ address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`, abi: FamilySharedWalletJSON.abi as Abi, functionName: 'addFunds', args: [familyId], value: parseEther(amount) }, { onSuccess: setAddFundsHash }); };
  const handleSetLimit = (childAddress: `0x${string}`, categoryIndex: number, amount: string) => { if (!familyId) return; setLimit({ address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`, abi: FamilySharedWalletJSON.abi as Abi, functionName: 'setLimitForChild', args: [familyId, childAddress, categoryIndex, parseEther(amount)] }, { onSuccess: setSetLimitHash }); };

  if (loading || role === 'loading') {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-400"></div></div>;
  }

  if (!userHasFamily) {
    const isProcessing = isCreatingFamily || isConfirmingCreate;
    const statusMessage = isCreatingFamily ? 'Submitting...' : isConfirmingCreate ? 'Confirming...' : 'Create Your Family';
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-white p-4 text-center">
        <h1 className="text-4xl font-bold mb-4">Welcome!</h1>
        <p className="text-slate-300 mb-8 max-w-md">You are not part of a family yet. Create one to get started.</p>
        <button onClick={handleCreateFamily} disabled={isProcessing} className="bg-green-600 active:scale-95 text-white font-bold py-3 px-6 rounded-xl transition-transform ease-in-out hover:scale-105 disabled:bg-slate-500 disabled:cursor-not-allowed">{statusMessage}</button>
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
      <AddFundsModal isOpen={isFundsModalOpen} onClose={() => setIsFundsModalOpen(false)} onAddFunds={handleAddFunds} isProcessing={isAddingFunds || isConfirmingFunds} statusMessage={isAddingFunds ? 'Submitting...' : isConfirmingFunds ? 'Confirming...' : 'Add Funds'} />
      <SetLimitModal isOpen={isLimitModalOpen} onClose={() => setIsLimitModalOpen(false)} onSetLimit={handleSetLimit} isProcessing={isSettingLimit || isConfirmingLimit} statusMessage={isSettingLimit ? 'Submitting...' : isConfirmingLimit ? 'Confirming...' : 'Set Limit'} childrenList={children} />
      
      <div className="container mx-auto px-6 py-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Welcome back! 👋</h1>
            <p className="text-slate-300">Here's your family's financial overview.</p>
          </div>
          {role === 'parent' && (
            <div className="flex gap-4">
                <button onClick={() => setIsLimitModalOpen(true)} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-xl transition-transform active:scale-95">Set Child Limit</button>
                <button onClick={() => setIsFundsModalOpen(true)} className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-xl transition-transform active:scale-95">+ Add Funds</button>
            </div>
          )}
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => <StatsCard key={index} {...stat} />)}
        </motion.div>
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2 mb-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Spending by Category</h2>
            <div className="space-y-4">
              {familyData?.categories.map((category, index) => <CategoryItem key={index} {...category} />)}
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}

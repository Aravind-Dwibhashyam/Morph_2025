'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { isAddress } from 'viem';
import { motion, AnimatePresence } from 'framer-motion';

import FamilySharedWalletJSON from '../../abis/FamilySharedWallet.json';


type Member = {
  address: `0x${string}`;
  role: 'Parent' | 'Child';
};

type AddChildModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onAddChild: (childAddress: `0x${string}`) => void;
  isProcessing: boolean; // Combined state for pending and confirming
  statusMessage: string; // To show detailed status
};

// --- HOOK: useFamilyMembers ---
// This hook fetches and processes the list of family members from the smart contract.
function useFamilyMembers() {
  const { address: connectedAddress } = useAccount();
  const FamilySharedWalletABI = FamilySharedWalletJSON.abi;
  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;

  // 1. Get the family ID for the current user.
  const { data: familyId, isLoading: isLoadingFamilyId } = useReadContract({
    account: connectedAddress,
    address: contractAddress,
    abi: FamilySharedWalletABI,
    functionName: 'getUserFamily',
    args: [connectedAddress],
    query: { enabled: !!connectedAddress },
  });

  // 2. Get the list of parents.
  const { data: parents, isLoading: isLoadingParents, refetch: refetchParents } = useReadContract({
    account: connectedAddress,
    address: contractAddress,
    abi: FamilySharedWalletABI,
    functionName: 'getFamilyParents',
    args: [familyId],
    query: { enabled: !!familyId && Number(familyId) > 0 },
  });

  // 3. Get the list of children.
  const { data: children, isLoading: isLoadingChildren, refetch: refetchChildren } = useReadContract({
    account: connectedAddress,
    address: contractAddress,
    abi: FamilySharedWalletABI,
    functionName: 'getFamilyChildren',
    args: [familyId],
    query: { enabled: !!familyId && Number(familyId) > 0 },
  });

  // 4. Combine parents and children into a single list for display.
  const members = useMemo(() => {
    const parentMembers: Member[] = (parents as `0x${string}`[] || []).map(p => ({ address: p, role: 'Parent' }));
    const childMembers: Member[] = (children as `0x${string}`[] || []).map(c => ({ address: c, role: 'Child' }));
    return [...parentMembers, ...childMembers];
  }, [parents, children]);

  const loading = isLoadingFamilyId || isLoadingParents || isLoadingChildren;

  const refetchMembers = () => {
    refetchParents();
    refetchChildren();
  };

  return { members, familyId, loading, refetchMembers, userHasFamily: !!familyId && Number(familyId) > 0 };
}

// --- UI COMPONENT: AddChildModal ---
// A modal dialog for adding a new child's address.
const AddChildModal = ({ isOpen, onClose, onAddChild, isProcessing, statusMessage }: AddChildModalProps) => {
  const [childAddress, setChildAddress] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!isAddress(childAddress)) {
      setError('Please enter a valid Ethereum address.');
      return;
    }
    setError('');
    onAddChild(childAddress as `0x${string}`);
  };

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
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold text-white mb-4">Add Family Member</h2>
            <p className="text-slate-400 mb-6">Enter the wallet address of the child you want to add.</p>
            <input
              type="text"
              value={childAddress}
              onChange={(e) => setChildAddress(e.target.value)}
              placeholder="0x..."
              className="w-full bg-slate-700 text-white rounded-lg p-3 mb-2 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
            <div className="flex justify-end gap-4 mt-6">
              <button onClick={onClose} className="text-slate-300 hover:text-white transition-colors px-4 py-2 rounded-lg">Cancel</button>
              <button onClick={handleSubmit} disabled={isProcessing} className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-6 py-2 rounded-lg transition-colors disabled:bg-slate-500">
                {statusMessage}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// --- UI COMPONENT: MemberRow ---
// Displays a single family member's information.
const MemberRow = ({ address, role }: Member) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex items-center justify-between bg-white/5 p-4 rounded-xl"
  >
    <div className="flex items-center gap-4">
      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${role === 'Parent' ? 'bg-blue-500/20' : 'bg-green-500/20'}`}>
        <span className="text-2xl">{role === 'Parent' ? '👑' : '🧑‍'}</span>
      </div>
      <div>
        <p className={`font-bold ${role === 'Parent' ? 'text-blue-300' : 'text-green-300'}`}>{role}</p>
        <p className="text-sm text-slate-400 font-mono truncate">{address}</p>
      </div>
    </div>
    <button className="text-slate-400 hover:text-white text-xl">...</button>
  </motion.div>
);


// --- PAGE: Family ---
export default function FamilyPage() {
  const { members, familyId, loading, refetchMembers, userHasFamily } = useFamilyMembers();
  const { address: connectedAddress } = useAccount();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hash, setHash] = useState<`0x${string}`>();

  const { writeContract, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (isConfirmed) {
      refetchMembers();
      setIsModalOpen(false);
      setHash(undefined); // Reset hash after success
    }
  }, [isConfirmed, refetchMembers]);

  const handleAddChild = (childAddress: `0x${string}`) => {
    if (!familyId) return;
    writeContract({
      account: connectedAddress,
      address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`,
      abi: FamilySharedWalletJSON.abi,
      functionName: 'addChildToFamily',
      args: [familyId, childAddress],
    }, {
      onSuccess: (sentHash) => {
        setHash(sentHash);
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-400"></div>
      </div>
    );
  }
  
  if (!userHasFamily) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center text-white p-4 text-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            <h1 className="text-4xl font-bold mb-4">No Family Found</h1>
            <p className="text-slate-300 mb-8 max-w-md">Please create or join a family from the dashboard to manage members.</p>
        </div>
    )
  }

  const isProcessing = isPending || isConfirming;
  const statusMessage = isPending ? 'Submitting...' : isConfirming ? 'Confirming...' : 'Add Child';

  return (
    <>
      <AddChildModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onAddChild={handleAddChild}
        isProcessing={isProcessing}
        statusMessage={statusMessage}
      />
      <div className="container mx-auto px-6 py-8 text-white">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold">Family Members</h1>
            <p className="text-slate-300">Manage parents and children in your wallet.</p>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-xl transition-colors">
            Add Member
          </button>
        </motion.div>

        <div className="space-y-4">
          {members.map((member) => (
            <MemberRow key={member.address} {...member} />
          ))}
        </div>

        {error && <p className="text-red-400 mt-4 text-center">Error adding child: {error.message}</p>}
      </div>
    </>
  );
}

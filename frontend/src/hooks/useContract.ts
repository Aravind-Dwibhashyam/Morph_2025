'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { parseEther, formatEther } from 'viem';

// Contract ABI (you'll need to import the actual ABI)
const FAMILY_WALLET_ABI = [
  // Add your contract ABI here
  // This is a simplified version for demonstration
  {
    "inputs": [{"name": "child", "type": "address"}],
    "name": "addChild",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "child", "type": "address"}],
    "name": "removeChild",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "child", "type": "address"},
      {"name": "category", "type": "uint8"},
      {"name": "amount", "type": "uint256"}
    ],
    "name": "setLimit",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "vendor", "type": "address"}, {"name": "name", "type": "string"}],
    "name": "addVendor",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "vendor", "type": "address"},
      {"name": "category", "type": "uint8"},
      {"name": "amount", "type": "uint256"},
      {"name": "description", "type": "string"}
    ],
    "name": "makePayment",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "vendor", "type": "address"},
      {"name": "amount", "type": "uint256"},
      {"name": "description", "type": "string"}
    ],
    "name": "emergencyPayment",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  }
] as const;

// Contract address (replace with your deployed contract address)
const CONTRACT_ADDRESS = '0x...' as const;

// Types
interface FamilyMember {
  address: string;
  name: string;
  role: 'parent' | 'child';
  totalSpent: number;
  monthlyLimit: number;
  joinedDate: string;
}

interface Vendor {
  address: string;
  name: string;
  category: string;
  isApproved: boolean;
}

interface Transaction {
  id: string;
  vendor: string;
  category: string;
  amount: number;
  timestamp: string;
  status: 'pending' | 'completed' | 'failed';
  isEmergency: boolean;
  txHash?: string;
}

export function useFamilyWallet() {
  const { address, isConnected } = useAccount();
  const { writeContract } = useWriteContract();
  
  // State
  const [loading, setLoading] = useState(false);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [userRole, setUserRole] = useState<'parent' | 'child' | null>(null);
  const [userLimits, setUserLimits] = useState<number[]>([]);

  // Contract reads
  const { data: balance } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: FAMILY_WALLET_ABI,
    functionName: 'getBalance', // You'll need to add this function to your contract
    account: address,
  });

  // Helper functions
  const loadFamilyData = useCallback(async () => {
    try {
      // Mock data - replace with actual contract calls
      setFamilyMembers([
        {
          address: address || '',
          name: 'You',
          role: 'parent',
          totalSpent: 1240,
          monthlyLimit: 2000,
          joinedDate: '2024-01-15'
        }
      ]);
    } catch (error) {
      console.error('Error loading family data:', error);
    }
  }, [address])

  const loadVendors = useCallback(async () => {
    try {
      // Mock data - replace with actual contract calls
      setVendors([
        {
          address: '0x123...',
          name: 'Amazon',
          category: 'Others',
          isApproved: true
        },
        {
          address: '0x456...',
          name: 'Uber',
          category: 'Transport',
          isApproved: true
        }
      ]);
    } catch (error) {
      console.error('Error loading vendors:', error);
    }
  }, [address]);

  const loadTransactions = useCallback(async () => {
    try {
      // Mock data - replace with actual contract calls
      setTransactions([
        {
          id: '1',
          vendor: 'Amazon',
          category: 'Others',
          amount: 45.99,
          timestamp: '2 hours ago',
          status: 'completed',
          isEmergency: false,
          txHash: '0xabc123...'
        },
        {
          id: '2',
          vendor: 'Uber',
          category: 'Transport',
          amount: 23.50,
          timestamp: '5 hours ago',
          status: 'completed',
          isEmergency: false,
          txHash: '0xdef456...'
        }
      ]);
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  }, [address]);

  const checkUserRole = useCallback(async () => {
    try {
      // Mock logic - replace with actual contract call
      setUserRole('parent');
      setUserLimits([800, 500, 200, 300, 150]); // Food, Education, Entertainment, Transport, Others
    } catch (error) {
      console.error('Error checking user role:', error);
    }
  }, [address]);

  // Effects
  useEffect(() => {
    if (isConnected && address) {
      loadFamilyData();
      loadVendors();
      loadTransactions();
      checkUserRole();
    }
  }, [isConnected, address, loadFamilyData, loadVendors, loadTransactions, checkUserRole]);

  // Contract interaction functions
  const addChild = async (childAddress: string) => {
    if (!isConnected) throw new Error('Wallet not connected');
    
    setLoading(true);
    try {
      const result = await writeContract({
        address: CONTRACT_ADDRESS,
        abi: FAMILY_WALLET_ABI,
        functionName: 'addChild',
        args: [childAddress as `0x${string}`],
      });
      
      // Refresh data after transaction
      await loadFamilyData();
      return result;
    } catch (error) {
      console.error('Error adding child:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const removeChild = async (childAddress: string) => {
    if (!isConnected) throw new Error('Wallet not connected');
    
    setLoading(true);
    try {
      const result = await writeContract({
        address: CONTRACT_ADDRESS,
        abi: FAMILY_WALLET_ABI,
        functionName: 'removeChild',
        args: [childAddress as `0x${string}`],
      });
      
      await loadFamilyData();
      return result;
    } catch (error) {
      console.error('Error removing child:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const setLimit = async (childAddress: string, category: number, amount: number) => {
    if (!isConnected) throw new Error('Wallet not connected');
    
    setLoading(true);
    try {
      const result = await writeContract({
        address: CONTRACT_ADDRESS,
        abi: FAMILY_WALLET_ABI,
        functionName: 'setLimit',
        args: [childAddress as `0x${string}`, category, parseEther(amount.toString())],
      });
      
      await loadFamilyData();
      return result;
    } catch (error) {
      console.error('Error setting limit:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const addVendor = async (vendorAddress: string, name: string) => {
    if (!isConnected) throw new Error('Wallet not connected');
    
    setLoading(true);
    try {
      const result = await writeContract({
        address: CONTRACT_ADDRESS,
        abi: FAMILY_WALLET_ABI,
        functionName: 'addVendor',
        args: [vendorAddress as `0x${string}`, name],
      });
      
      await loadVendors();
      return result;
    } catch (error) {
      console.error('Error adding vendor:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const makePayment = async (
    vendorAddress: string, 
    category: number, 
    amount: number, 
    description: string
  ) => {
    if (!isConnected) throw new Error('Wallet not connected');
    
    setLoading(true);
    try {
      const result = await writeContract({
        address: CONTRACT_ADDRESS,
        abi: FAMILY_WALLET_ABI,
        functionName: 'makePayment',
        args: [vendorAddress as `0x${string}`, category, parseEther(amount.toString()), description],
        value: parseEther(amount.toString()),
      });
      
      await loadTransactions();
      await loadFamilyData();
      return result;
    } catch (error) {
      console.error('Error making payment:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const emergencyPayment = async (
    vendorAddress: string, 
    amount: number, 
    description: string
  ) => {
    if (!isConnected) throw new Error('Wallet not connected');
    
    setLoading(true);
    try {
      const result = await writeContract({
        address: CONTRACT_ADDRESS,
        abi: FAMILY_WALLET_ABI,
        functionName: 'emergencyPayment',
        args: [vendorAddress as `0x${string}`, parseEther(amount.toString()), description],
        value: parseEther(amount.toString()),
      });
      
      await loadTransactions();
      return result;
    } catch (error) {
      console.error('Error making emergency payment:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    // State
    loading,
    familyMembers,
    vendors,
    transactions,
    userRole,
    userLimits,
    
    // Data
    familyData: {
      balance: balance ? formatEther(balance) : '0',
      memberCount: familyMembers.length,
      vendorCount: vendors.length,
      monthlySpent: familyMembers.reduce((sum, member) => sum + member.totalSpent, 0),
      userAddress: address,
    },
    
    // Actions
    addChild,
    removeChild,
    setLimit,
    addVendor,
    makePayment,
    emergencyPayment,
    
    // Utilities
    refresh: () => {
      loadFamilyData();
      loadVendors();
      loadTransactions();
    }
  };
}

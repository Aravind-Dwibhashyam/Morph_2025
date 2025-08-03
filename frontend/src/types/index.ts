import type { LucideIcon } from "lucide-react";

// Contract Types
export interface FamilyMember {
  address: string;
  name: string;
  role: 'parent' | 'child';
  totalSpent: number;
  monthlyLimit: number;
  joinedDate: string;
}

export interface Vendor {
  address: string;
  name: string;
  category: string;
  isApproved: boolean;
}

export interface Transaction {
  id: string;
  vendor: string;
  category: string;
  amount: number;
  timestamp: string;
  status: 'pending' | 'completed' | 'failed';
  isEmergency: boolean;
  txHash?: string;
}

// Smart Contract Categories
export enum SpendingCategory {
  FOOD = 0,
  EDUCATION = 1,
  ENTERTAINMENT = 2,
  TRANSPORT = 3,
  OTHERS = 4
}

// Contract Events
export interface PaymentEvent {
  payer: string;
  vendor: string;
  category: SpendingCategory;
  amount: bigint;
  description: string;
  timestamp: bigint;
  isEmergency: boolean;
}

export interface LimitSetEvent {
  parent: string;
  child: string;
  category: SpendingCategory;
  newLimit: bigint;
  timestamp: bigint;
}

export interface ChildAddedEvent {
  parent: string;
  child: string;
  timestamp: bigint;
}

export interface VendorAddedEvent {
  parent: string;
  vendor: string;
  name: string;
  timestamp: bigint;
}

// UI Component Props
export interface StatsCardProps {
  title: string;
  value: string;
  icon: string;
  trend: string;
  className?: string;
}

export interface CategoryItemProps {
  name: string;
  spent: number;
  limit: number;
  color: string;
  className?: string;
}

export interface TransactionRowProps {
  id?: string;
  vendor: string;
  category: string;
  amount: number;
  timestamp: string;
  status: 'pending' | 'completed' | 'failed';
  isEmergency?: boolean;
  txHash?: string;
  className?: string;
}

// App State Types
export interface FamilyData {
  balance: string;
  memberCount: number;
  vendorCount: number;
  monthlySpent: number;
  userAddress?: string;
}

export interface Analytics {
  totalSpent: number;
  averageMonthly: number;
  transactionCount: number;
  budgetUsed: number;
  categoryBreakdown: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
  monthlyTrend: Array<{
    month: string;
    amount: number;
  }>;
}

// Form Types
export interface AddChildFormData {
  address: string;
}

export interface SetLimitFormData {
  childAddress: string;
  category: SpendingCategory;
  amount: number;
}

export interface AddVendorFormData {
  address: string;
  name: string;
  category: string;
}

export interface PaymentFormData {
  vendorAddress: string;
  category: SpendingCategory;
  amount: number;
  description: string;
  isEmergency: boolean;
}

// API Response Types
export interface ContractResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  txHash?: string;
}

// Wallet State
export interface WalletState {
  isConnected: boolean;
  address?: string;
  chainId?: number;
  isCorrectNetwork: boolean;
}

// Navigation Types
export interface NavigationItem {
  name: string;
  href: string;
  icon: LucideIcon; // Lucide icon component
  badge?: string;
}

// Settings Types
export interface UserSettings {
  notifications: {
    paymentAlerts: boolean;
    limitWarnings: boolean;
    monthlyReports: boolean;
    emergencyAlerts: boolean;
  };
  appearance: {
    theme: 'dark' | 'light' | 'midnight';
    accentColor: string;
    reducedMotion: boolean;
  };
  general: {
    language: string;
    currency: string;
    timezone: string;
    autoRefresh: boolean;
    analyticsTracking: boolean;
  };
}

'use client';

import React, { useEffect } from 'react';
import { useAccount } from 'wagmi';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation'; // Using next/navigation for client components

// --- PAGE: HomePage ---
// This serves as the main landing page for the application.
export default function HomePage() {
  const { isConnected } = useAccount();
  const router = useRouter();

  // useEffect is the correct place for side effects like navigation.
  // This effect will run after the component renders, and whenever isConnected or router changes.
  useEffect(() => {
    // If the user is connected, redirect them straight to the dashboard.
    if (isConnected) {
      router.push('/dashboard');
    }
  }, [isConnected, router]);

  // If the user is connected, we can render a loading/redirecting message
  // while the useEffect hook prepares to navigate.
  if (isConnected) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-purple-900 text-white">
            <p>Connecting, redirecting to dashboard...</p>
        </div>
    );
  }

  // If not connected, show the landing page content.
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-white p-4 text-center bg-gradient-to-br from-slate-900 to-purple-900">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-5xl md:text-6xl font-bold mb-4">
          Welcome to FamilyWallet
        </h1>
        <p className="text-slate-300 mb-8 max-w-2xl mx-auto">
          The decentralized solution for managing your family's finances. Set budgets for children, approve vendors, and track spending, all on the blockchain.
        </p>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {/* This is a placeholder. In a real app, this would be your main ConnectKit/RainbowKit button */}
        <button 
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-xl transition-all duration-300 transform hover:scale-105"
        >
            Connect Wallet to Get Started
        </button>
      </motion.div>
    </div>
  );
}

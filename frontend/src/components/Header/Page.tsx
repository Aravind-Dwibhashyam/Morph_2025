'use client';

import React, { useEffect } from 'react';
import { useAccount } from 'wagmi';
import { motion } from 'framer-motion';
import { useRouter, usePathname } from 'next/navigation'; // Make sure to import usePathname

// --- PAGE: HomePage ---
// This serves as the main landing page for the application.
export default function HomePage() {
  const { isConnected } = useAccount();
  const router = useRouter();
  const pathname = usePathname(); // Get the current URL path

  // This effect now correctly handles the redirect logic.
  useEffect(() => {
    // **THE FIX**: Only redirect if the user is connected AND is currently on the homepage (`/`).
    // This prevents the redirect from happening when you navigate to other pages like /payment.
    if (isConnected && pathname === '/') {
      router.push('/dashboard');
    }
  }, [isConnected, router, pathname]); // Add pathname to the dependency array

  // This loading message will now only show when redirecting from the homepage.
  if (isConnected && pathname === '/') {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-purple-900 text-white">
            <p>Connecting, redirecting to dashboard...</p>
        </div>
    );
  }

  // If the user is on any page other than the homepage while connected, this component will render nothing,
  // preventing it from interfering with other pages.
  if (isConnected && pathname !== '/') {
      return null;
  }

  // If not connected, render the landing page content.
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
          The decentralized solution for managing your family&apos;s finances. Set budgets for children, approve vendors, and track spending, all on the blockchain.
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

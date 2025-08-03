'use client';

import React, { useState } from 'react';
import { useAccount, useSwitchChain, useChains, useChainId, useDisconnect } from 'wagmi';
import { AnimatePresence, motion } from 'framer-motion';

// --- UI COMPONENT: NetworkSwitcher ---
// A dropdown component to display and change the current blockchain network.
const NetworkSwitcher = () => {
    const chainId = useChainId();
    const chains = useChains();
    const { switchChain } = useSwitchChain();
    const [isOpen, setIsOpen] = useState(false);

    const currentChain = chains.find(chain => chain.id === chainId);

    return (
        <div className="relative">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 bg-slate-800 text-white px-3 py-2 rounded-lg font-mono text-sm"
            >
                {currentChain?.name ?? 'Unknown Network'}
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path fillRule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/>
                </svg>
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-50"
                    >
                        <ul className="p-1">
                            {chains.map((chain) => (
                                <li key={chain.id}>
                                    <button
                                        onClick={() => {
                                            if (switchChain) switchChain({ chainId: chain.id });
                                            setIsOpen(false);
                                        }}
                                        className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 rounded-md"
                                    >
                                        {chain.name}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};


// --- UI COMPONENT: WalletInfo ---
// Displays the connected wallet's address, network, and a disconnect option.
const WalletInfo = () => {
    const { address, isConnected } = useAccount();
    const { disconnect } = useDisconnect();
    const [isOpen, setIsOpen] = useState(false);
    
    if (isConnected) {
        return (
            <div className="flex items-center gap-4">
                <div className="relative">
                    <button 
                        onClick={() => setIsOpen(!isOpen)}
                        className="bg-slate-800 text-white px-4 py-2 rounded-lg font-mono text-sm hidden sm:block"
                    >
                        {address?.slice(0, 6)}...{address?.slice(-4)}
                    </button>
                    <AnimatePresence>
                        {isOpen && (
                             <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-50"
                            >
                                <ul className="p-1">
                                    <li>
                                        <button
                                            onClick={() => disconnect()}
                                            className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-slate-700 rounded-md"
                                        >
                                            Disconnect
                                        </button>
                                    </li>
                                </ul>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
                <NetworkSwitcher />
            </div>
        );
    }
    
    // This button is a placeholder. In a real app, it would trigger a connection modal.
    return (
        <button className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg">
            Connect Wallet
        </button>
    );
};


// --- UI COMPONENT: Header ---
// The main navigation header for the application.
const Header = () => {
    const navLinks = [
      { name: 'Dashboard', href: '/dashboard' },
      { name: 'Family', href: '/family' },
      {name: 'Vendor', href: '/vendors'},
      // Add other top-level page links here
    ];
  
    return (
      <header className="sticky top-0 z-40 w-full bg-slate-900/70 backdrop-blur-lg border-b border-slate-300/10">
        <div className="container mx-auto px-6">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <a href="/dashboard" className="text-xl font-bold text-purple-400">
                FamilyWallet
              </a>
              <nav className="hidden md:flex gap-6">
                {navLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
                  >
                    {link.name}
                  </a>
                ))}
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <WalletInfo />
            </div>
          </div>
        </div>
      </header>
    );
};


// --- LAYOUT: DashboardLayout ---
// This is the main layout component that wraps all pages.
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Header />
        <main>
            {children}
        </main>
    </div>
  );
}

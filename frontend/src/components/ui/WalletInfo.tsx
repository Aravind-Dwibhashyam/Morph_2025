import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { useAccount, useDisconnect } from "wagmi";
import NetworkSwitcher from "./NetworkSwitcher";

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

export default WalletInfo
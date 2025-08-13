import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { useChainId, useChains, useSwitchChain } from "wagmi";

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

export default NetworkSwitcher;
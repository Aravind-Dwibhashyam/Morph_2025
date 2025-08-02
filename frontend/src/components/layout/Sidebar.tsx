'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter, usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  BarChart3, 
  Settings, 
  Store,
  ChevronLeft,
  ChevronRight,
  LogOut
} from 'lucide-react';
import { useAccount, useDisconnect } from 'wagmi';

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className = '' }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Family', href: '/family', icon: Users },
    { name: 'Payments', href: '/payments', icon: CreditCard },
    { name: 'Vendors', href: '/vendors', icon: Store },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const handleNavigation = (href: string) => {
    router.push(href);
  };

  const handleDisconnect = () => {
    disconnect();
    router.push('/');
  };

  if (!isConnected) {
    return null;
  }

  return (
    <motion.div
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      className={`fixed left-0 top-0 h-screen bg-white/10 backdrop-blur-lg border-r border-white/20 z-50 ${
        isCollapsed ? 'w-20' : 'w-72'
      } transition-all duration-300 ${className}`}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-6 border-b border-white/20">
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <h1 className="text-xl font-bold text-white">SafeSpend</h1>
                <p className="text-slate-400 text-sm">Family Wallet</p>
              </motion.div>
            )}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors"
            >
              {isCollapsed ? (
                <ChevronRight size={20} className="text-white" />
              ) : (
                <ChevronLeft size={20} className="text-white" />
              )}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <motion.button
                key={item.name}
                onClick={() => handleNavigation(item.href)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon size={20} />
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="font-medium"
                  >
                    {item.name}
                  </motion.span>
                )}
              </motion.button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/20">
          <motion.button
            onClick={handleDisconnect}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/20 transition-colors"
          >
            <LogOut size={20} />
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="font-medium"
              >
                Disconnect
              </motion.span>
            )}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

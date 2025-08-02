'use client';

import { useAccount } from 'wagmi';
import Sidebar from '@/components/layout/Sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { isConnected } = useAccount();

  if (!isConnected) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-72 transition-all duration-300">
        {children}
      </main>
    </div>
  );
}

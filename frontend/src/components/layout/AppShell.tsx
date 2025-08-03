'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import WalletInfo from '../ui/WalletInfo';
import NetworkSwitcher from '../ui/NetworkSwitcher';

const Header = () => {
  const pathname = usePathname();
  const navLinks = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Family', href: '/family' },
    { name: 'Vendor', href: '/vendors' },
    { name: 'Payments', href: '/payments' },
    { name: 'Analytics', href: '/analytics' },
    { name: 'Settings', href: '/settings' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-900/70 backdrop-blur-lg border-b border-slate-300/10">
      <div className="container mx-auto px-6">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <a href="/dashboard" className="text-xl font-bold text-purple-400">FamilyWallet</a>
            <nav className="hidden md:flex gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`text-sm font-medium transition-colors ${
                    pathname.startsWith(link.href)
                      ? 'text-white border-b-2 border-purple-500 pb-0.5'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {link.name}
                </Link>
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

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Header />
      <main>{children}</main>
    </div>
  );
}

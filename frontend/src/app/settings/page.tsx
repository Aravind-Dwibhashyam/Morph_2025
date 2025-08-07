'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useFamilyWallet } from '@/hooks/useContract';
import { User, Bell, Shield, Palette, Globe, LogOut } from 'lucide-react';

export default function Settings() {
  const { userRole, familyData } = useFamilyWallet();
  const [activeTab, setActiveTab] = useState<string>('profile');
  const [notifications, setNotifications] = useState({
    paymentAlerts: true,
    limitWarnings: true,
    monthlyReports: false,
    emergencyAlerts: true
  });

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'appearance', name: 'Appearance', icon: Palette },
    { id: 'general', name: 'General', icon: Globe }
  ];

  const handleNotificationChange = (key: keyof typeof notifications) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-white mb-4">Profile Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 mb-2">Display Name</label>
                  <input
                    type="text"
                    defaultValue="John Doe"
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-2">Role</label>
                  <input
                    type="text"
                    value={userRole || 'Unknown'}
                    disabled
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-2">Email (Optional)</label>
                  <input
                    type="email"
                    placeholder="john@example.com"
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-2">Phone (Optional)</label>
                  <input
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-white mb-4">Wallet Information</h3>
              <div className="bg-white/5 rounded-xl p-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Connected Address:</span>
                  <span className="text-white font-mono text-sm">
                    {familyData?.userAddress || 'Not connected'}
                  </span>
                </div>
              </div>
            </div>

            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl transition-colors">
              Save Changes
            </button>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white mb-4">Notification Preferences</h3>
            <div className="space-y-4">
              {Object.entries(notifications).map(([key, value]) => (
                <label key={key} className="flex items-center justify-between p-4 bg-white/5 rounded-xl cursor-pointer">
                  <div>
                    <span className="text-white font-medium">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </span>
                    <p className="text-slate-400 text-sm">
                      {key === 'paymentAlerts' && 'Get notified when payments are made'}
                      {key === 'limitWarnings' && 'Receive alerts when approaching spending limits'}
                      {key === 'monthlyReports' && 'Monthly spending summary reports'}
                      {key === 'emergencyAlerts' && 'Immediate alerts for emergency payments'}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={() => handleNotificationChange(key as keyof typeof notifications)}
                    className="w-5 h-5 rounded border-white/20 bg-white/10 text-blue-500 focus:ring-blue-500"
                  />
                </label>
              ))}
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white mb-4">Security Settings</h3>
            
            <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="text-yellow-400" size={20} />
                <span className="text-yellow-400 font-semibold">Security Notice</span>
              </div>
              <p className="text-yellow-300 text-sm">
                Your wallet security is managed by your connected wallet provider. 
                Always keep your private keys secure and never share them.
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-white/5 rounded-xl">
                <h4 className="text-white font-semibold mb-2">Two-Factor Authentication</h4>
                <p className="text-slate-400 text-sm mb-3">
                  Add an extra layer of security to your account
                </p>
                <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors">
                  Enable 2FA
                </button>
              </div>

              <div className="p-4 bg-white/5 rounded-xl">
                <h4 className="text-white font-semibold mb-2">Session Management</h4>
                <p className="text-slate-400 text-sm mb-3">
                  Manage your active sessions and devices
                </p>
                <button className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-colors">
                  View Sessions
                </button>
              </div>

              <div className="p-4 bg-white/5 rounded-xl">
                <h4 className="text-white font-semibold mb-2">Backup & Recovery</h4>
                <p className="text-slate-400 text-sm mb-3">
                  Set up account recovery options
                </p>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
                  Setup Recovery
                </button>
              </div>
            </div>
          </div>
        );

      case 'appearance':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white mb-4">Appearance Settings</h3>
            
            <div>
              <h4 className="text-white font-semibold mb-3">Theme</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-white/5 rounded-xl border-2 border-blue-500 cursor-pointer">
                  <div className="w-full h-20 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-lg mb-2"></div>
                  <span className="text-white font-medium">Dark (Current)</span>
                </div>
                <div className="p-4 bg-white/5 rounded-xl border-2 border-transparent hover:border-white/20 cursor-pointer">
                  <div className="w-full h-20 bg-gradient-to-br from-white via-gray-100 to-gray-200 rounded-lg mb-2"></div>
                  <span className="text-white font-medium">Light</span>
                </div>
                <div className="p-4 bg-white/5 rounded-xl border-2 border-transparent hover:border-white/20 cursor-pointer">
                  <div className="w-full h-20 bg-gradient-to-br from-blue-900 via-purple-800 to-indigo-900 rounded-lg mb-2"></div>
                  <span className="text-white font-medium">Midnight</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-3">Accent Color</h4>
              <div className="flex gap-3">
                {['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 'bg-yellow-500'].map((color, index) => (
                  <button
                    key={index}
                    className={`w-8 h-8 ${color} rounded-full ${index === 0 ? 'ring-2 ring-white' : ''}`}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-5 h-5 rounded border-white/20 bg-white/10 text-blue-500 focus:ring-blue-500"
                />
                <span className="text-white">Reduced motion</span>
              </label>
            </div>
          </div>
        );

      case 'general':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white mb-4">General Settings</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-slate-300 mb-2">Language</label>
                <select className="w-full md:w-auto bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500">
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                  <option value="de">Deutsch</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-2">Currency</label>
                <select className="w-full md:w-auto bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500">
                  <option value="eth">ETH</option>
                  <option value="usd">USD</option>
                  <option value="eur">EUR</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-2">Timezone</label>
                <select className="w-full md:w-auto bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500">
                  <option value="utc">UTC</option>
                  <option value="est">Eastern Time</option>
                  <option value="pst">Pacific Time</option>
                  <option value="cet">Central European Time</option>
                </select>
              </div>

              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-5 h-5 rounded border-white/20 bg-white/10 text-blue-500 focus:ring-blue-500"
                  />
                  <span className="text-white">Auto-refresh data</span>
                </label>
              </div>

              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-5 h-5 rounded border-white/20 bg-white/10 text-blue-500 focus:ring-blue-500"
                  />
                  <span className="text-white">Analytics tracking</span>
                </label>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2">
            Settings ⚙️
          </h1>
          <p className="text-slate-300">
            Customize your SafeSpend experience
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6">
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                        activeTab === tab.id
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-300 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <Icon size={20} />
                      {tab.name}
                    </button>
                  );
                })}
                
                <div className="border-t border-white/20 pt-4 mt-4">
                  <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/20 transition-colors">
                    <LogOut size={20} />
                    Disconnect Wallet
                  </button>
                </div>
              </nav>
            </div>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-3"
          >
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6">
              {renderTabContent()}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

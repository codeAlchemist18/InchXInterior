/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  LayoutDashboard,
  BookOpen,
  Users2,
  History,
  FileSpreadsheet,
  TrendingUp,
  UserCheck,
  Sun,
  Moon,
  X,
  Calendar,
  DollarSign,
  Settings,
  Briefcase,
  Trash2,
  Banknote
} from 'lucide-react';
import { User } from '../types';
import FactoryResetModal from './FactoryResetModal';
import { useState } from 'react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  currentUser: User | null;
  isDarkMode: boolean;
  toggleTheme: () => void;
  resetToSeedData: () => void;
  factoryReset: (password: string) => Promise<{ success: boolean; error?: string }>;
  getStatistics: () => { currentBalance: number };
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  onAddToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  companySettings?: any;
}

export default function Sidebar({
  currentTab,
  setCurrentTab,
  currentUser,
  isDarkMode,
  toggleTheme,
  resetToSeedData,
  factoryReset,
  getStatistics,
  mobileOpen,
  setMobileOpen,
  onAddToast,
  companySettings
}: SidebarProps) {
  const stats = getStatistics();
  const [showResetModal, setShowResetModal] = useState(false);

  // Define menu items and associate them with role restrictions
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'projects', label: 'Project Tracker', icon: Briefcase },
    { id: 'ledger', label: 'Digital Ledger', icon: BookOpen },
    { id: 'staff_salary', label: 'Staff Management', icon: Banknote },
    { id: 'contractors', label: 'Workers & Suppliers', icon: Users2, adminOnly: true },
    { id: 'schedules', label: 'Schedule Manager', icon: Calendar, adminOnly: true },
    { id: 'profit_loss', label: 'Profit & Loss', icon: DollarSign, adminOnly: true },
    { id: 'history', label: 'Transaction History', icon: History },
    { id: 'invoices', label: 'Invoice Generator', icon: FileSpreadsheet },
    { id: 'reports', label: 'Financial Reports', icon: TrendingUp, adminOnly: true },
    { id: 'settings', label: 'Company Settings', icon: Settings, adminOnly: true },
    { id: 'auth', label: 'My Profile', icon: UserCheck }
  ].filter(item => !item.adminOnly || currentUser?.role === 'admin');

  const formatCurrency = (amount: number) => {
    const currency = companySettings?.currency || 'INR';
    const locale = currency === 'INR' ? 'en-IN' : 'en-US';
    const formatted = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0
    }).format(amount);
    
    if (currency === 'INR') {
      return formatted.replace(/^INR\s*/, '₹').replace(/^Rs\.\s*/, '₹');
    }
    return formatted;
  };

  return (
    <>
      {/* Mobile Sidebar overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 w-64 bg-slate-50 dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 z-45 transform lg:transform-none transition-transform duration-300 ease-out flex flex-col justify-between ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Branding Section */}
        <div>
          <div className="h-20 flex items-center justify-between px-6 border-b border-slate-200/80 dark:border-slate-800 bg-slate-100/30 dark:bg-slate-950/30">
            <div className="flex flex-col min-w-0 w-full">
              <div className="flex items-center gap-2">
                {companySettings?.logo ? (
                  <img src={companySettings.logo} alt="Logo" className="h-8 w-8 object-contain rounded-lg shrink-0" referrerPolicy="no-referrer" />
                ) : (
                  <div className="h-8 w-8 bg-slate-950 border border-amber-500/30 text-amber-400 rounded-lg flex items-center justify-center font-serif font-black text-base select-none shrink-0">
                    {companySettings?.name ? companySettings.name.charAt(0).toUpperCase() : 'I'}
                  </div>
                )}
                <div className="flex flex-col min-w-0">
                  <span className="font-serif font-extrabold text-xs tracking-wider text-slate-900 dark:text-amber-400 uppercase truncate">
                    {companySettings?.name || 'INCHX'}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-amber-500/80 font-black tracking-widest uppercase truncate">
                    INTERIO
                  </span>
                </div>
              </div>
              <span className="text-[8px] text-slate-400 dark:text-amber-500/40 mt-1.5 uppercase tracking-wider font-black whitespace-nowrap overflow-hidden text-ellipsis">
                EXCELLENCE AT YOUR DOOR STEP
              </span>
            </div>
            <button
              onClick={() => setMobileOpen(false)}
              className="p-1 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800 text-slate-500 lg:hidden shrink-0"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Running Ledger Balance Widget */}
          <div className="p-4 mx-3 my-4 bg-slate-100/50 dark:bg-slate-950/50 border border-slate-200/60 dark:border-amber-500/20 rounded-xl">
            <div className="text-[10px] font-bold text-slate-500 dark:text-amber-500/80 uppercase tracking-widest">
              Ledger Net Balance
            </div>
            <div className="text-xl font-serif font-extrabold tracking-wide text-slate-900 dark:text-amber-400 mt-1">
              {formatCurrency(stats.currentBalance)}
            </div>
            <div className="text-[9px] text-slate-400 dark:text-slate-500 mt-1.5 flex items-center gap-1.5 font-bold uppercase tracking-wider">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse animate-duration-1000"></span>
              Secured Ledger Entry
            </div>
          </div>

          {/* Main Navigation List */}
          <nav className="px-3 space-y-1">
            {menuItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentTab(item.id);
                    setMobileOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-slate-900 text-white dark:bg-white/5 dark:text-amber-400 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/5'
                  }`}
                >
                  <IconComponent className="h-4.5 w-4.5 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom User Profile & Settings Area */}
        <div className="p-4 border-t border-slate-200/80 dark:border-slate-800 space-y-4">
          {currentUser ? (
            <div className="p-3 bg-slate-100/50 dark:bg-slate-950/40 rounded-xl border border-slate-200/30 dark:border-slate-800/40 text-center shadow-2xs">
              <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">
                Logged in as:
              </div>
              <div className="text-xs font-black tracking-widest text-slate-900 dark:text-amber-400 uppercase mt-0.5">
                {currentUser.role === 'admin' ? 'Admin' : 'Manager'}
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-500 text-center p-2 font-bold uppercase tracking-wider">
              No authenticated user
            </div>
          )}

          {/* Quick theme toggles & actions */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              onClick={toggleTheme}
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="flex-1 py-2 px-3 border border-slate-200 dark:border-slate-800 hover:bg-slate-200/40 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg flex items-center justify-center gap-2 text-xs font-bold transition-all"
            >
              {isDarkMode ? (
                <>
                  <Sun className="h-3.5 w-3.5" />
                  <span>Light</span>
                </>
              ) : (
                <>
                  <Moon className="h-3.5 w-3.5" />
                  <span>Dark</span>
                </>
              )}
            </button>

            {currentUser?.role === 'admin' && (
              <>
                <button
                  onClick={() => setShowResetModal(true)}
                  title="Factory Reset Ledger"
                  className="py-2 px-3 border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 hover:bg-rose-100 hover:text-rose-600 dark:bg-rose-950/10 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 text-rose-500 rounded-lg flex items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Reset Data</span>
                </button>

                <FactoryResetModal
                  isOpen={showResetModal}
                  onClose={() => setShowResetModal(false)}
                  onFactoryReset={factoryReset}
                  onAddToast={onAddToast}
                />
              </>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

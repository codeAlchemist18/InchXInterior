/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { User, UserRole } from '../types';
import { Shield, Users, Lock, Sparkles, CheckCircle2 } from 'lucide-react';

interface AuthScreenProps {
  currentUser: User | null;
  users: any[];
  loginAsUser: (user: User) => void;
  logoutUser: () => Promise<void>;
  onAddToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export default function AuthScreen({
  currentUser,
  users,
  loginAsUser,
  logoutUser,
  onAddToast
}: AuthScreenProps) {

  const handleRoleSelect = (role: 'admin' | 'manager') => {
    const name = role === 'admin' ? 'System Admin' : 'Project Manager';
    const email = role === 'admin' ? 'admin@inchx.com' : 'manager@inchx.com';
    
    const selectedUser: User = {
      id: role === 'admin' ? 'u-1' : 'u-2',
      name,
      email,
      role
    };

    loginAsUser(selectedUser);
    onAddToast(`Logged in successfully as ${name} (${role.toUpperCase()})`, 'success');
  };

  const getRoleAbilities = (role: 'admin' | 'manager') => {
    if (role === 'admin') {
      return [
        'Full control over Digital Ledger and cash flows',
        'Staff management, worker profiles, and contractor salaries',
        'Post, update, and manage all invoices & billing statements',
        'Access to full business analytical & financial reports',
        'Modify global company configurations & settings'
      ];
    } else {
      return [
        'Access to personal Dashboard analytics',
        'Manage projects and review active worksite milestones',
        'Input new transaction ledger entries (overheads, materials)',
        'Draft and issue client invoice sheets',
        'Manage personal profile settings'
      ];
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center p-4 md:p-8 transition-colors duration-200">
      <div className="max-w-4xl w-full space-y-8">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 bg-slate-900 dark:bg-amber-500/10 border border-amber-500/30 rounded-2xl items-center justify-center text-amber-400 font-serif font-black text-xl mb-2 select-none shadow-md">
            I
          </div>
          <h1 className="text-3xl md:text-4xl font-serif text-slate-900 dark:text-amber-400 uppercase tracking-widest font-black leading-none">
            INCHX INTERIO
          </h1>
          <p className="text-slate-500 dark:text-amber-500/70 font-bold text-xs uppercase tracking-[0.3em]">
            EXCELLENCE AT YOUR DOOR STEP
          </p>
          <div className="max-w-md mx-auto pt-2">
            <p className="text-slate-400 dark:text-slate-500 text-[11px] leading-relaxed font-semibold">
              Bespoke digital financial ledger & studio management console. Select a system security role below to access the interface.
            </p>
          </div>
        </div>

        {/* Role Selector Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto pt-4">
          
          {/* Admin Selector Card */}
          <button
            onClick={() => handleRoleSelect('admin')}
            className="group relative text-left bg-white dark:bg-slate-900/40 border border-slate-200 hover:border-amber-500/60 dark:border-slate-900 dark:hover:border-amber-500/40 p-6 rounded-3xl shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between space-y-6 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-amber-500"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                  <Shield className="h-5 w-5" />
                </div>
                <span className="text-[9px] bg-amber-500/10 text-amber-500 font-black uppercase px-2.5 py-1 rounded-full border border-amber-500/20 tracking-wider">
                  Full Administrator
                </span>
              </div>
              
              <div>
                <h3 className="text-lg font-serif font-extrabold text-slate-900 dark:text-white uppercase tracking-wider group-hover:text-amber-500 transition-colors">
                  Studio Admin
                </h3>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-widest mt-0.5">
                  Clearance Level 1 &bull; admin@inchx.com
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-900">
                <span className="block text-[8px] text-slate-400 uppercase tracking-widest font-black">
                  Permitted Clearances:
                </span>
                <ul className="space-y-1.5 text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                  {getRoleAbilities('admin').map((ability, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{ability}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="w-full py-2.5 bg-slate-950 hover:bg-slate-900 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400 text-amber-400 text-center rounded-xl font-bold uppercase tracking-wider text-xs transition-all group-hover:scale-[1.02]">
              Launch Admin Dashboard &rarr;
            </div>
          </button>

          {/* Manager Selector Card */}
          <button
            onClick={() => handleRoleSelect('manager')}
            className="group relative text-left bg-white dark:bg-slate-900/40 border border-slate-200 hover:border-amber-500/60 dark:border-slate-900 dark:hover:border-amber-500/40 p-6 rounded-3xl shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between space-y-6 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-amber-500"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                  <Users className="h-5 w-5" />
                </div>
                <span className="text-[9px] bg-slate-500/10 text-slate-400 font-black uppercase px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-800 tracking-wider">
                  Operations & Billing
                </span>
              </div>
              
              <div>
                <h3 className="text-lg font-serif font-extrabold text-slate-900 dark:text-white uppercase tracking-wider group-hover:text-amber-500 transition-colors">
                  Project Manager
                </h3>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-widest mt-0.5">
                  Clearance Level 2 &bull; manager@inchx.com
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-900">
                <span className="block text-[8px] text-slate-400 uppercase tracking-widest font-black">
                  Permitted Clearances:
                </span>
                <ul className="space-y-1.5 text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                  {getRoleAbilities('manager').map((ability, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{ability}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="w-full py-2.5 bg-slate-950 hover:bg-slate-900 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400 text-amber-400 text-center rounded-xl font-bold uppercase tracking-wider text-xs transition-all group-hover:scale-[1.02]">
              Launch Manager Dashboard &rarr;
            </div>
          </button>

        </div>

        {/* Footer Notes */}
        <div className="text-center text-[10px] text-slate-400 dark:text-slate-600 font-bold uppercase tracking-widest pt-4">
          <div className="flex items-center justify-center gap-1.5">
            <Lock className="h-3.5 w-3.5" />
            <span>Interactive UI Simulation Panel &bull; Offline Local Data Engine</span>
          </div>
        </div>

      </div>
    </div>
  );
}

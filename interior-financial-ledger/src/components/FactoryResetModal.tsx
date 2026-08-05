/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShieldAlert, Trash2, X, Lock } from 'lucide-react';

interface FactoryResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFactoryReset: (password: string) => Promise<{ success: boolean; error?: string; isExpired?: boolean }>;
  onAddToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export default function FactoryResetModal({
  isOpen,
  onClose,
  onFactoryReset,
  onAddToast
}: FactoryResetModalProps) {
  const [confirmText, setConfirmText] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmText !== 'RESET') {
      onAddToast('Please type "RESET" exactly to confirm.', 'error');
      return;
    }
    if (!password.trim()) {
      onAddToast('Administrator password is required.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await onFactoryReset(password);
      if (res.success) {
        onAddToast('Factory Reset completed successfully. The application has been restored to its initial installation state.', 'success');
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        if (res.isExpired) {
          window.location.reload();
          return;
        }
        onAddToast(res.error || 'Factory Reset failed.', 'error');
        setIsSubmitting(false);
      }
    } catch (err) {
      onAddToast('An error occurred during factory reset.', 'error');
      setIsSubmitting(false);
    }
  };

  const isFormValid = confirmText === 'RESET' && password.trim().length > 0;

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-900/60 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5 text-rose-600 dark:text-rose-400">
            <ShieldAlert className="h-6 w-6" />
            <h2 className="text-sm font-serif font-black uppercase tracking-wider">
              Reset User Accounts
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-xl p-4 text-xs space-y-2 text-rose-900 dark:text-rose-200 font-semibold">
          <div className="font-black uppercase tracking-wider flex items-center gap-1.5 text-rose-700 dark:text-rose-300">
            <span>WARNING!</span>
          </div>
          <p className="leading-relaxed">
            This action will permanently delete all user accounts (Super Admin, Admin, and Accountant) and invalidate all active sessions without affecting business records (projects, transactions, invoices, or suppliers).
          </p>
          <p className="font-bold text-[11px] opacity-90">
            The system will return to the initial Setup Wizard / Create Super Admin page.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-extrabold mb-1.5">
              Type <span className="text-rose-600 dark:text-rose-400 font-black">"RESET"</span> to confirm
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type RESET here"
              disabled={isSubmitting}
              className="w-full px-3.5 py-2.5 bg-[#1A1A1A] border border-slate-700 rounded-xl text-white font-bold caret-white placeholder:text-[#9CA3AF] focus:outline-none focus:border-rose-500"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-extrabold mb-1.5 flex items-center gap-1">
              <Lock className="h-3 w-3 text-rose-500" />
              <span>Super Admin Password Confirmation</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your administrator password"
              disabled={isSubmitting}
              className="w-full px-3.5 py-2.5 bg-[#1A1A1A] border border-slate-700 rounded-xl text-white font-bold caret-white placeholder:text-[#9CA3AF] focus:outline-none focus:border-rose-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-black rounded-xl shadow-lg shadow-rose-600/20 transition-all flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              <Trash2 className="h-4 w-4" />
              <span>{isSubmitting ? 'Resetting Accounts...' : 'Reset User Accounts'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

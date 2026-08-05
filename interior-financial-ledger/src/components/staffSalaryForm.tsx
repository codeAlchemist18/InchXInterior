/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  User,
  Hash,
  Briefcase,
  Phone,
  IndianRupee,
  Calendar,
  CreditCard,
  FileText,
  RotateCcw,
  Save,
  CheckCircle2,
  Clock,
  AlertTriangle
} from 'lucide-react';

export type SalaryRole = 'Manager' | 'Supervisor' | 'Designer' | 'Worker' | 'Accountant' | 'Helper';
export type SalaryStatus = 'Paid' | 'Pending' | 'Overdue';
export type PaymentMethod = 'Cash' | 'Bank Transfer' | 'UPI' | 'Cheque';

export interface StaffSalary {
  id: string;
  employeeId: string;
  employeeName: string;
  role: SalaryRole;
  phoneNumber: string;
  monthlySalary: number;
  salaryMonth: string;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  status: SalaryStatus;
  remarks: string;
}

interface StaffSalaryFormProps {
  initialData?: StaffSalary | null;
  onSave: (data: Omit<StaffSalary, 'id'> & { id?: string }) => void;
  onCancel: () => void;
  onAddToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
  currency?: string;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const YEARS = ['2024', '2025', '2026', '2027'];

export default function StaffSalaryForm({
  initialData,
  onSave,
  onCancel,
  onAddToast,
  currency = 'INR'
}: StaffSalaryFormProps) {
  const [employeeName, setEmployeeName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [role, setRole] = useState<SalaryRole>('Designer');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [monthlySalary, setMonthlySalary] = useState<string>('');
  const [salaryMonthName, setSalaryMonthName] = useState('August');
  const [salaryYear, setSalaryYear] = useState('2026');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Bank Transfer');
  const [status, setStatus] = useState<SalaryStatus>('Pending');
  const [remarks, setRemarks] = useState('');

  // Populate initial values if editing
  useEffect(() => {
    if (initialData) {
      setEmployeeName(initialData.employeeName);
      setEmployeeId(initialData.employeeId);
      setRole(initialData.role);
      setPhoneNumber(initialData.phoneNumber);
      setMonthlySalary(initialData.monthlySalary.toString());
      
      const parts = (initialData.salaryMonth || '').split(' ');
      setSalaryMonthName(parts[0] || 'August');
      setSalaryYear(parts[1] || '2026');
      
      setPaymentDate(initialData.paymentDate || new Date().toISOString().slice(0, 10));
      setPaymentMethod(initialData.paymentMethod || 'Bank Transfer');
      setStatus(initialData.status);
      setRemarks(initialData.remarks || '');
    } else {
      // Auto-generate employee ID suggest
      const randomNum = Math.floor(100 + Math.random() * 900);
      setEmployeeId(`EMP-${randomNum}`);
      setEmployeeName('');
      setPhoneNumber('');
      setMonthlySalary('');
      setSalaryMonthName('August');
      setSalaryYear('2026');
      setPaymentDate(new Date().toISOString().slice(0, 10));
      setPaymentMethod('Bank Transfer');
      setStatus('Pending');
      setRemarks('');
    }
  }, [initialData]);

  const numMonthly = Number(monthlySalary) || 0;

  const formatCurrency = (val: number) => {
    const locale = currency === 'INR' ? 'en-IN' : 'en-US';
    const formatted = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0
    }).format(val);
    if (currency === 'INR') {
      return formatted.replace(/^INR\s*/, '₹').replace(/^Rs\.\s*/, '₹');
    }
    return formatted;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!employeeName.trim()) {
      onAddToast?.('Please enter employee name', 'error');
      return;
    }
    if (!employeeId.trim()) {
      onAddToast?.('Please enter employee ID', 'error');
      return;
    }
    if (!phoneNumber.trim()) {
      onAddToast?.('Please enter phone number', 'error');
      return;
    }
    if (numMonthly <= 0) {
      onAddToast?.('Monthly salary must be greater than zero', 'error');
      return;
    }

    onSave({
      id: initialData?.id,
      employeeId: employeeId.trim().toUpperCase(),
      employeeName: employeeName.trim(),
      role,
      phoneNumber: phoneNumber.trim(),
      monthlySalary: numMonthly,
      salaryMonth: `${salaryMonthName} ${salaryYear}`,
      paymentDate: status === 'Pending' ? '' : paymentDate,
      paymentMethod,
      status,
      remarks: remarks.trim()
    });
  };

  const handleReset = () => {
    if (initialData) {
      setEmployeeName(initialData.employeeName);
      setEmployeeId(initialData.employeeId);
      setRole(initialData.role);
      setPhoneNumber(initialData.phoneNumber);
      setMonthlySalary(initialData.monthlySalary.toString());
      
      const parts = (initialData.salaryMonth || '').split(' ');
      setSalaryMonthName(parts[0] || 'August');
      setSalaryYear(parts[1] || '2026');
      
      setPaymentDate(initialData.paymentDate || new Date().toISOString().slice(0, 10));
      setPaymentMethod(initialData.paymentMethod || 'Bank Transfer');
      setStatus(initialData.status);
      setRemarks(initialData.remarks || '');
    } else {
      setEmployeeName('');
      setEmployeeId(`EMP-${Math.floor(100 + Math.random() * 900)}`);
      setRole('Designer');
      setPhoneNumber('');
      setMonthlySalary('');
      setSalaryMonthName('August');
      setSalaryYear('2026');
      setPaymentDate(new Date().toISOString().slice(0, 10));
      setPaymentMethod('Bank Transfer');
      setStatus('Pending');
      setRemarks('');
    }
    onAddToast?.('Form fields reset', 'info');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-amber-500/15 p-6 rounded-3xl shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-amber-500 dark:text-slate-400 dark:hover:text-amber-400 mb-2 transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Staff Salary List</span>
          </button>
          <h2 className="text-xl font-serif font-black text-slate-900 dark:text-amber-400 tracking-wide uppercase">
            {initialData ? 'Edit Staff Salary Record' : 'Add New Staff Salary'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {initialData
              ? `Update employee remuneration details for ${initialData.employeeName}`
              : 'Enter employee profile and salary payout details.'}
          </p>
        </div>

        {/* Live Calculation Preview Badge */}
        <div className="bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-3.5 rounded-2xl flex items-center gap-4 shrink-0">
          <div>
            <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Monthly Salary
            </div>
            <div className="text-lg font-serif font-black text-amber-600 dark:text-amber-400">
              {formatCurrency(numMonthly)}
            </div>
          </div>
          <div className="h-8 w-px bg-slate-200 dark:bg-slate-800" />
          <div>
            <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Status Preview
            </div>
            <div className="mt-0.5">
              {status === 'Paid' && (
                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  <CheckCircle2 className="h-3 w-3" /> Paid
                </span>
              )}
              {status === 'Pending' && (
                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                  <Clock className="h-3 w-3" /> Pending
                </span>
              )}
              {status === 'Overdue' && (
                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                  <AlertTriangle className="h-3 w-3" /> Overdue
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Form Card */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-amber-500/15 p-6 sm:p-8 rounded-3xl shadow-md space-y-6">
        
        {/* Section 1: Employee Information */}
        <div>
          <h3 className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-2">
            <User className="h-4 w-4" />
            <span>1. Employee Profile & Compensation</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Employee Name */}
            <div>
              <label className="block text-slate-600 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1.5">
                Employee Name *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={employeeName}
                  onChange={(e) => setEmployeeName(e.target.value)}
                  placeholder="e.g. Rajesh Kumar"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-semibold text-xs focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                />
                <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              </div>
            </div>

            {/* Employee ID */}
            <div>
              <label className="block text-slate-600 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1.5">
                Employee ID *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  placeholder="e.g. EMP-101"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-bold text-xs uppercase focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                />
                <Hash className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              </div>
            </div>

            {/* Role */}
            <div>
              <label className="block text-slate-600 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1.5">
                Role *
              </label>
              <div className="relative">
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as SalaryRole)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-semibold text-xs focus:ring-1 focus:ring-amber-500 focus:outline-hidden cursor-pointer"
                >
                  <option value="Manager">Manager</option>
                  <option value="Supervisor">Supervisor</option>
                  <option value="Designer">Designer</option>
                  <option value="Worker">Worker</option>
                  <option value="Accountant">Accountant</option>
                  <option value="Helper">Helper</option>
                </select>
                <Briefcase className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-slate-600 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1.5">
                Phone Number *
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-semibold text-xs focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                />
                <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              </div>
            </div>

            {/* Monthly Salary */}
            <div>
              <label className="block text-slate-600 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1.5">
                Monthly Salary ({currency}) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  required
                  min="0"
                  step="100"
                  value={monthlySalary}
                  onChange={(e) => setMonthlySalary(e.target.value)}
                  placeholder="e.g. 50000"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-serif font-bold text-sm focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                />
                <span className="absolute left-3 top-2.5 font-serif font-bold text-slate-400 text-sm">₹</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Disbursal Period & Method */}
        <div>
          <h3 className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-2">
            <Calendar className="h-4 w-4" />
            <span>2. Disbursal Period & Method</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Salary Month */}
            <div>
              <label className="block text-slate-600 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1.5">
                Salary Month *
              </label>
              <div className="relative">
                <select
                  value={salaryMonthName}
                  onChange={(e) => setSalaryMonthName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-semibold text-xs focus:ring-1 focus:ring-amber-500 focus:outline-hidden cursor-pointer"
                >
                  {MONTHS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              </div>
            </div>

            {/* Salary Year */}
            <div>
              <label className="block text-slate-600 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1.5">
                Salary Year *
              </label>
              <div className="relative">
                <select
                  value={salaryYear}
                  onChange={(e) => setSalaryYear(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-semibold text-xs focus:ring-1 focus:ring-amber-500 focus:outline-hidden cursor-pointer"
                >
                  {YEARS.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              </div>
            </div>

            {/* Payment Date */}
            <div>
              <label className="block text-slate-600 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1.5">
                Payment Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-semibold text-xs focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                />
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-slate-600 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1.5">
                Payment Method *
              </label>
              <div className="relative">
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-semibold text-xs focus:ring-1 focus:ring-amber-500 focus:outline-hidden cursor-pointer"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cheque">Cheque</option>
                </select>
                <CreditCard className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-slate-600 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1.5">
                Status *
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as SalaryStatus)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-bold text-xs focus:ring-1 focus:ring-amber-500 focus:outline-hidden cursor-pointer"
              >
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
                <option value="Overdue">Overdue</option>
              </select>
            </div>

            {/* Remarks */}
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-slate-600 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1.5">
                Remarks & Notes
              </label>
              <div className="relative">
                <textarea
                  rows={2}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Salary credited successfully."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-semibold text-xs focus:ring-1 focus:ring-amber-500 focus:outline-hidden resize-none"
                />
                <FileText className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="py-2.5 px-5 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="py-2.5 px-4 border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 hover:bg-amber-100 dark:bg-amber-950/20 dark:hover:bg-amber-950/40 text-amber-700 dark:text-amber-400 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset</span>
          </button>

          <button
            type="submit"
            className="py-2.5 px-6 bg-slate-950 hover:bg-slate-900 text-amber-400 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <Save className="h-4 w-4" />
            <span>Save Salary</span>
          </button>
        </div>
      </form>
    </div>
  );
}

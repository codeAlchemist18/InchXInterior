/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  IndianRupee,
  Briefcase,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { StaffSalary } from './staffSalaryForm';

interface StaffDetailsProps {
  employeeId: string;
  salaries: StaffSalary[];
  onBack: () => void;
  onAddToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
  currency?: string;
}

export default function StaffDetails({
  employeeId,
  salaries,
  onBack,
  onAddToast,
  currency = 'INR'
}: StaffDetailsProps) {
  // Find all payment records for this employee
  const employeePayments = salaries.filter(s => s.employeeId === employeeId);
  
  // Find primary/most recent record to extract profile details
  const primaryRecord = employeePayments[0] || {
    employeeId: employeeId,
    employeeName: 'Unknown Employee',
    role: 'Staff Member',
    phoneNumber: 'N/A',
    monthlySalary: 0,
    remarks: ''
  };

  // Derive extra details based on name/id or provide consistent fallback
  const getMockEmail = (name: string) => {
    return `${name.toLowerCase().replace(/[^a-z0-9]/g, '')}@inchx.com`;
  };

  const getMockAddress = (name: string) => {
    const locations = [
      'Plot 45, Gachibowli High Street, Hyderabad, TS',
      'Flat 302, Green Meadows, Jubilee Hills, Hyderabad',
      'H.No 12-4-89, Lane 3, Banjara Hills, Hyderabad',
      'Plot 104, Madhapur IT Corridor, Hyderabad'
    ];
    // Hash based on name length
    return locations[name.length % locations.length];
  };

  const getMockJoiningDate = (id: string) => {
    const dates = [
      '12-Jan-2024',
      '05-May-2024',
      '18-Aug-2024',
      '22-Oct-2024',
      '01-Dec-2024',
      '15-Feb-2025'
    ];
    // Simple deterministic pick
    const digits = id.replace(/\D/g, '');
    const num = digits ? Number(digits) : 0;
    return dates[num % dates.length];
  };

  const employeeName = primaryRecord.employeeName;
  const role = primaryRecord.role;
  const phoneNumber = primaryRecord.phoneNumber;
  const currentSalary = primaryRecord.monthlySalary;
  const remarks = primaryRecord.remarks;
  const email = getMockEmail(employeeName);
  const address = getMockAddress(employeeName);
  const joiningDate = getMockJoiningDate(employeeId);

  const formatCurrency = (amount: number) => {
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

  const formatPaymentDate = (dateStr: string, status?: string) => {
    if (!dateStr || status === 'Pending') return '—';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      const day = String(date.getDate()).padStart(2, '0');
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    } catch (e) {
      return dateStr;
    }
  };

  const handleExportEmployeeToExcel = () => {
    // Construct CSV Header
    const headers = [
      'Employee ID',
      'Employee Name',
      'Role',
      'Phone',
      'Email',
      'Joining Date',
      'Monthly Salary',
      'Salary Month',
      'Payment Date',
      'Payment Method',
      'Salary Status',
      'Remarks'
    ];

    // Construct CSV rows for each payment record in history
    const rows = employeePayments.map(p => {
      const [mName, yNum] = p.salaryMonth.split(' ');
      return [
        employeeId,
        `"${employeeName.replace(/"/g, '""')}"`,
        role,
        phoneNumber,
        email,
        joiningDate,
        p.monthlySalary,
        p.salaryMonth,
        p.paymentDate || '—',
        p.paymentMethod || '—',
        p.status,
        `"${(p.remarks || '').replace(/"/g, '""')}"`
      ];
    });

    // If no payments exist, export at least the profile row
    if (rows.length === 0) {
      rows.push([
        employeeId,
        `"${employeeName.replace(/"/g, '""')}"`,
        role,
        phoneNumber,
        email,
        joiningDate,
        currentSalary,
        '—',
        '—',
        '—',
        '—',
        `"${(remarks || '').replace(/"/g, '""')}"`
      ]);
    }

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Staff_Details_${employeeId}_${employeeName.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onAddToast?.(`Exported payroll report for ${employeeName} successfully!`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header and back control */}
      <div className="bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-amber-500/15 p-6 rounded-3xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-amber-500 dark:text-slate-400 dark:hover:text-amber-400 mb-2 transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Staff Roster</span>
          </button>
          <h1 className="text-2xl font-serif font-black text-slate-900 dark:text-amber-400 uppercase tracking-wide flex items-center gap-2">
            <User className="h-6 w-6 text-amber-500" />
            <span>Staff Management Details</span>
          </h1>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            View detailed employee dossier, pay histories, and profile records.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportEmployeeToExcel}
          className="py-3 px-5 bg-slate-950 hover:bg-slate-900 text-amber-400 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer shrink-0"
        >
          <FileSpreadsheet className="h-4 w-4" />
          <span>Export Employee Excel</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Profile Card */}
        <div className="bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-amber-500/15 p-6 rounded-3xl shadow-md space-y-6">
          <div className="flex flex-col items-center text-center">
            {/* Elegant initials circle */}
            <div className="h-24 w-24 rounded-full bg-slate-900 text-amber-400 dark:bg-amber-500 dark:text-slate-950 font-black text-3xl flex items-center justify-center uppercase select-none border-4 border-slate-100 dark:border-slate-800 shadow-sm mb-4">
              {employeeName.charAt(0)}
            </div>
            
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 font-mono font-bold text-[10px] uppercase tracking-widest border border-amber-500/20 mb-2">
              {employeeId}
            </span>
            
            <h2 className="text-xl font-serif font-extrabold text-slate-900 dark:text-white">
              {employeeName}
            </h2>
            
            <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">
              {role}
            </p>
          </div>

          <hr className="border-slate-100 dark:border-slate-900" />

          {/* Core Profile Attributes */}
          <div className="space-y-4 text-xs">
            <div className="flex items-start gap-3">
              <Phone className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Phone Number</span>
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{phoneNumber}</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Corporate Email</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{email}</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Residential Address</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300 leading-normal">{address}</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Joining Date</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{joiningDate}</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <IndianRupee className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Current Compensation</span>
                <span className="font-serif font-black text-slate-900 dark:text-white text-sm">{formatCurrency(currentSalary)}</span>
              </div>
            </div>
          </div>

          {remarks && (
            <>
              <hr className="border-slate-100 dark:border-slate-900" />
              <div className="space-y-1.5 text-xs">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5" />
                  <span>Dossier Remarks</span>
                </span>
                <p className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-800/80 text-slate-600 dark:text-slate-300 leading-normal">
                  {remarks}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Right Columns: Payment History table */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-amber-500/15 p-6 rounded-3xl shadow-md space-y-4">
            <h3 className="text-sm font-serif font-bold text-slate-900 dark:text-amber-400 uppercase tracking-wide flex items-center gap-2">
              <Briefcase className="h-4.5 w-4.5 text-amber-500" />
              <span>Compensation Disbursal & Payment History</span>
            </h3>

            <div className="overflow-x-auto border border-slate-100 dark:border-slate-900 rounded-2xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 font-bold uppercase text-[9px] tracking-wider border-b border-slate-100 dark:border-slate-900">
                    <th className="py-2.5 px-4">Billing Month</th>
                    <th className="py-2.5 px-3 text-right">Disbursed Salary</th>
                    <th className="py-2.5 px-3 text-center">Payment Date</th>
                    <th className="py-2.5 px-3">Method</th>
                    <th className="py-2.5 px-4 text-center">Disbursal Status</th>
                    <th className="py-2.5 px-4">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-900/60 font-semibold text-slate-800 dark:text-slate-200">
                  {employeePayments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 dark:text-slate-500">
                        No payment disbursement logs registered for this staff member yet.
                      </td>
                    </tr>
                  ) : (
                    employeePayments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                          {p.salaryMonth}
                        </td>
                        <td className="py-3 px-3 text-right font-serif font-extrabold text-slate-900 dark:text-white">
                          {formatCurrency(p.monthlySalary)}
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-[11px] text-slate-500">
                          {formatPaymentDate(p.paymentDate, p.status)}
                        </td>
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                          {p.paymentMethod || '—'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {p.status === 'Paid' && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                              <CheckCircle2 className="h-2.5 w-2.5" /> Paid
                            </span>
                          )}
                          {p.status === 'Pending' && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                              <Clock className="h-2.5 w-2.5" /> Pending
                            </span>
                          )}
                          {p.status === 'Overdue' && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                              <AlertTriangle className="h-2.5 w-2.5" /> Overdue
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-500 dark:text-slate-400 text-[11px] font-normal max-w-[160px] truncate" title={p.remarks}>
                          {p.remarks || '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

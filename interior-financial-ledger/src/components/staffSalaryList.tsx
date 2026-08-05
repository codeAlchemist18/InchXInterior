/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { StaffSalary, SalaryRole, SalaryStatus } from './staffSalaryForm';
import {
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  Users,
  IndianRupee,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  FileSpreadsheet,
  Printer
} from 'lucide-react';

interface StaffSalaryListProps {
  salaries: StaffSalary[];
  onAddNew: () => void;
  onEdit: (salary: StaffSalary) => void;
  onDelete: (id: string) => void;
  onViewDetails?: (employeeId: string) => void;
  onAddToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
  currency?: string;
}

const MONTHS_FILTER = [
  'All', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const YEARS_FILTER = ['All', '2024', '2025', '2026', '2027'];

const STATUS_FILTERS = ['All', 'Paid', 'Pending', 'Overdue'];

const ROLE_FILTERS: (SalaryRole | 'All')[] = [
  'All',
  'Manager',
  'Supervisor',
  'Designer',
  'Worker',
  'Accountant',
  'Helper'
];

export default function StaffSalaryList({
  salaries,
  onAddNew,
  onEdit,
  onDelete,
  onViewDetails,
  onAddToast,
  currency = 'INR'
}: StaffSalaryListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<SalaryRole | 'All'>('All');
  const [selectedStatus, setSelectedStatus] = useState<SalaryStatus | 'All'>('All');
  const [selectedMonth, setSelectedMonth] = useState<string>('All');
  const [selectedYear, setSelectedYear] = useState<string>('All');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // View Modal State
  const [viewingItem, setViewingItem] = useState<StaffSalary | null>(null);

  // Delete Confirmation Modal State
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  const formatPaymentDate = (dateStr: string, status?: SalaryStatus) => {
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

  // Filter Logic
  const filteredSalaries = salaries.filter((item) => {
    const matchesSearch =
      item.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.phoneNumber.includes(searchTerm) ||
      item.role.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = selectedRole === 'All' || item.role === selectedRole;
    const matchesStatus = selectedStatus === 'All' || item.status === selectedStatus;
    
    // Check if salaryMonth starts with selectedMonth
    const matchesMonth = selectedMonth === 'All' || item.salaryMonth.split(' ')[0] === selectedMonth;
    // Check if salaryMonth ends with selectedYear
    const matchesYear = selectedYear === 'All' || item.salaryMonth.split(' ')[1] === selectedYear;

    return matchesSearch && matchesRole && matchesStatus && matchesMonth && matchesYear;
  });

  const handleExportAllToExcel = () => {
    if (filteredSalaries.length === 0) {
      onAddToast?.('No records to export.', 'error');
      return;
    }
    
    // Construct CSV Header
    const headers = [
      'Employee ID',
      'Employee Name',
      'Role',
      'Phone Number',
      'Monthly Salary',
      'Salary Month',
      'Payment Date',
      'Payment Method',
      'Status',
      'Remarks'
    ];
    
    // Construct CSV Rows
    const rows = filteredSalaries.map(item => [
      item.employeeId,
      `"${item.employeeName.replace(/"/g, '""')}"`,
      item.role,
      item.phoneNumber,
      item.monthlySalary,
      item.salaryMonth,
      item.paymentDate || '—',
      item.paymentMethod || '—',
      item.status,
      `"${(item.remarks || '').replace(/"/g, '""')}"`
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Staff_Management_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    onAddToast?.('Staff roster list exported successfully as Excel CSV!', 'success');
  };

  // Calculate Summary Statistics (without Advance displaying/calculations)
  const totalEmployees = salaries.length;
  const totalMonthlyPayroll = salaries.reduce((acc, curr) => acc + curr.monthlySalary, 0);
  const paidRemuneration = salaries
    .filter(s => s.status === 'Paid')
    .reduce((acc, curr) => acc + curr.monthlySalary, 0);
  const pendingRemuneration = salaries
    .filter(s => s.status !== 'Paid')
    .reduce((acc, curr) => acc + curr.monthlySalary, 0);

  // Pagination Math
  const totalPages = Math.ceil(filteredSalaries.length / itemsPerPage) || 1;
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * itemsPerPage;
  const paginatedSalaries = filteredSalaries.slice(startIndex, startIndex + itemsPerPage);

  const handleDeleteConfirm = () => {
    if (deletingId) {
      const item = salaries.find((s) => s.id === deletingId);
      onDelete(deletingId);
      onAddToast?.(`Deleted salary record for ${item?.employeeName || 'employee'}`, 'info');
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Title & Header Bar */}
      <div className="bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-amber-500/15 p-6 rounded-3xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-black text-slate-900 dark:text-amber-400 uppercase tracking-wide flex items-center gap-2">
            <FileSpreadsheet className="h-6 w-6 text-amber-500" />
            <span>Staff Management</span>
          </h1>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
            View all employees, profile dossiers, and their compensation records.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleExportAllToExcel}
            className="py-3 px-5 border border-slate-200 hover:bg-slate-100 dark:border-amber-500/15 dark:hover:bg-amber-950/20 text-slate-700 dark:text-amber-400 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Export Excel</span>
          </button>

          <button
            type="button"
            onClick={onAddNew}
            className="py-3 px-5 bg-slate-950 hover:bg-slate-900 text-amber-400 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Add Staff Record</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Employees */}
        <div className="bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl shadow-xs flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Total Employees
            </div>
            <div className="text-xl font-serif font-black text-slate-900 dark:text-white mt-0.5">
              {totalEmployees}
            </div>
          </div>
        </div>

        {/* Monthly Payroll */}
        <div className="bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl shadow-xs flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <IndianRupee className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Total Payroll
            </div>
            <div className="text-xl font-serif font-black text-slate-900 dark:text-white mt-0.5">
              {formatCurrency(totalMonthlyPayroll)}
            </div>
          </div>
        </div>

        {/* Paid Remuneration */}
        <div className="bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl shadow-xs flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Paid Remuneration
            </div>
            <div className="text-xl font-serif font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
              {formatCurrency(paidRemuneration)}
            </div>
          </div>
        </div>

        {/* Pending Remuneration */}
        <div className="bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl shadow-xs flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Unpaid Remuneration
            </div>
            <div className="text-xl font-serif font-black text-rose-600 dark:text-rose-400 mt-0.5">
              {formatCurrency(pendingRemuneration)}
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-amber-500/15 rounded-3xl shadow-md overflow-hidden space-y-4 p-5 sm:p-6">
        
        {/* Filters Panel above the table */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {/* Search Input */}
            <div className="relative">
              <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                Search Employee
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="ID, name, role..."
                  className="w-full pl-8 pr-7 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-semibold text-xs focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                />
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Month Dropdown */}
            <div>
              <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                Month Dropdown
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full py-2 px-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs font-bold focus:ring-1 focus:ring-amber-500 cursor-pointer"
              >
                <option value="All">All Months</option>
                {MONTHS_FILTER.slice(1).map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            {/* Year Dropdown */}
            <div>
              <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                Year Dropdown
              </label>
              <select
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full py-2 px-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs font-bold focus:ring-1 focus:ring-amber-500 cursor-pointer"
              >
                <option value="All">All Years</option>
                {YEARS_FILTER.slice(1).map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            {/* Status Dropdown */}
            <div>
              <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                Status Dropdown
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value as SalaryStatus | 'All');
                  setCurrentPage(1);
                }}
                className="w-full py-2 px-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs font-bold focus:ring-1 focus:ring-amber-500 cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
                <option value="Overdue">Overdue</option>
              </select>
            </div>

            {/* Role Filter */}
            <div>
              <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                Role Filter
              </label>
              <select
                value={selectedRole}
                onChange={(e) => {
                  setSelectedRole(e.target.value as SalaryRole | 'All');
                  setCurrentPage(1);
                }}
                className="w-full py-2 px-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs font-bold focus:ring-1 focus:ring-amber-500 cursor-pointer"
              >
                <option value="All">All Roles</option>
                {ROLE_FILTERS.slice(1).map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Staff Table */}
        <div className="overflow-x-auto border border-slate-200/80 dark:border-slate-800/80 rounded-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                <th className="py-3 px-4">Employee ID</th>
                <th className="py-3 px-4">Employee Name</th>
                <th className="py-3 px-3">Role</th>
                <th className="py-3 px-3">Phone Number</th>
                <th className="py-3 px-3 text-right">Monthly Salary</th>
                <th className="py-3 px-3">Salary Month</th>
                <th className="py-3 px-3 text-center">Payment Date</th>
                <th className="py-3 px-3">Payment Method</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-200">
              {paginatedSalaries.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Users className="h-8 w-8 text-slate-300 dark:text-slate-700" />
                      <p className="font-bold text-sm">No employee salary records found</p>
                      <p className="text-[11px] text-slate-400">
                        Try adjusting your search query or filters.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedSalaries.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors"
                  >
                    {/* Employee ID */}
                    <td className="py-3.5 px-4 font-mono font-bold text-amber-600 dark:text-amber-400">
                      {item.employeeId}
                    </td>

                    {/* Employee Name */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-full bg-slate-900 text-amber-400 dark:bg-amber-500 dark:text-slate-950 font-black text-[10px] flex items-center justify-center shrink-0 uppercase select-none">
                          {item.employeeName.charAt(0)}
                        </div>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {item.employeeName}
                        </span>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="py-3.5 px-3">
                      <span className="inline-block px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold text-[10px] uppercase tracking-wider">
                        {item.role}
                      </span>
                    </td>

                    {/* Phone Number */}
                    <td className="py-3.5 px-3 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                      {item.phoneNumber}
                    </td>

                    {/* Monthly Salary */}
                    <td className="py-3.5 px-3 text-right font-serif font-extrabold text-slate-900 dark:text-white">
                      {formatCurrency(item.monthlySalary)}
                    </td>

                    {/* Salary Month */}
                    <td className="py-3.5 px-3 text-slate-600 dark:text-slate-400">
                      {item.salaryMonth}
                    </td>

                    {/* Payment Date */}
                    <td className="py-3.5 px-3 text-center text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                      {formatPaymentDate(item.paymentDate, item.status)}
                    </td>

                    {/* Payment Method */}
                    <td className="py-3.5 px-3 text-slate-600 dark:text-slate-400">
                      {item.paymentMethod || '—'}
                    </td>

                    {/* Status Badges */}
                    <td className="py-3.5 px-4 text-center">
                      {item.status === 'Paid' && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                          <CheckCircle2 className="h-3 w-3" /> Paid
                        </span>
                      )}
                      {item.status === 'Pending' && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                          <Clock className="h-3 w-3" /> Pending
                        </span>
                      )}
                      {item.status === 'Overdue' && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                          <AlertTriangle className="h-3 w-3" /> Overdue
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {/* View Action */}
                        <button
                          type="button"
                          onClick={() => onViewDetails ? onViewDetails(item.employeeId) : setViewingItem(item)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-amber-400 dark:hover:bg-slate-900 transition-colors cursor-pointer"
                          title="View Employee Profile & History"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {/* Edit Action */}
                        <button
                          type="button"
                          onClick={() => onEdit(item)}
                          className="p-1.5 rounded-lg text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/40 transition-colors cursor-pointer"
                          title="Edit Salary Record"
                        >
                          <Edit className="h-4 w-4" />
                        </button>

                        {/* Delete Action */}
                        <button
                          type="button"
                          onClick={() => setDeletingId(item.id)}
                          className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                          title="Delete Record"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          {/* Total Employees Counter */}
          <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
            Showing <strong className="text-slate-900 dark:text-white">{filteredSalaries.length === 0 ? 0 : startIndex + 1}</strong> to{' '}
            <strong className="text-slate-900 dark:text-white">
              {Math.min(startIndex + itemsPerPage, filteredSalaries.length)}
            </strong>{' '}
            of <strong className="text-slate-900 dark:text-white">{filteredSalaries.length}</strong> employees
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center gap-3">
            {/* Rows per page selector */}
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold">
              <span>Per page:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="py-1 px-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white font-bold cursor-pointer"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={validCurrentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <span className="text-xs font-extrabold px-2 text-slate-700 dark:text-amber-400">
                {validCurrentPage} / {totalPages}
              </span>

              <button
                type="button"
                disabled={validCurrentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* VIEW DETAILS MODAL */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-amber-500/20 max-w-xl w-full rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={() => setViewingItem(null)}
              className="absolute right-5 top-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-900 pb-4">
              <div className="h-12 w-12 rounded-2xl bg-amber-500 text-slate-950 font-serif font-black text-lg flex items-center justify-center uppercase shrink-0">
                {viewingItem.employeeName.charAt(0)}
              </div>
              <div>
                <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400 font-mono uppercase tracking-widest">
                  {viewingItem.employeeId}
                </div>
                <h3 className="text-xl font-serif font-extrabold text-slate-900 dark:text-white">
                  {viewingItem.employeeName}
                </h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {viewingItem.role}
                </p>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800/60">
                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Employee Name</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{viewingItem.employeeName}</span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800/60">
                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Employee ID</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{viewingItem.employeeId}</span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800/60">
                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Role</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{viewingItem.role}</span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800/60">
                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Monthly Salary</span>
                <span className="font-serif font-black text-slate-900 dark:text-white">{formatCurrency(viewingItem.monthlySalary)}</span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800/60">
                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Salary Month</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{viewingItem.salaryMonth}</span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800/60">
                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Payment Date</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{formatPaymentDate(viewingItem.paymentDate, viewingItem.status)}</span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800/60">
                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Payment Method</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{viewingItem.paymentMethod || '—'}</span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800/60">
                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Status</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{viewingItem.status}</span>
              </div>
            </div>

            {/* Remarks */}
            {viewingItem.remarks && (
              <div className="text-xs space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Remarks / Notes</span>
                <p className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200/60 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                  {viewingItem.remarks}
                </p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="py-2 px-4 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-slate-900 cursor-pointer"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print Slip</span>
              </button>
              <button
                type="button"
                onClick={() => setViewingItem(null)}
                className="py-2 px-5 bg-slate-950 text-amber-400 dark:bg-amber-500 dark:text-slate-950 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingId && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-950 border border-rose-200 dark:border-rose-900/50 max-w-md w-full rounded-3xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-serif font-black text-slate-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-rose-500" />
              <span>Confirm Deletion</span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Are you sure you want to remove this staff salary record? This action will update your local frontend ledger immediately.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="py-2 px-4 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-900 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="py-2 px-5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer shadow-sm"
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

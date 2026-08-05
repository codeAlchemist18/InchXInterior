/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Transaction, Project, Worker, Supplier, PaymentMethod } from '../types';
import { Search, Filter, Download, ArrowUpCircle, ArrowDownCircle, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';

interface TransactionHistoryProps {
  transactions: Transaction[];
  projects: Project[];
  workers: Worker[];
  suppliers: Supplier[];
  onAddToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export default function TransactionHistory({
  transactions,
  projects,
  workers,
  suppliers,
  onAddToast
}: TransactionHistoryProps) {
  // Advanced Filter state
  const [search, setSearch] = useState<string>('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterProjId, setFilterProjId] = useState<string>('all');
  const [filterPartner, setFilterPartner] = useState<'all' | 'worker' | 'supplier'>('all');
  const [filterPayment, setFilterPayment] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Reset filters
  const handleClearFilters = () => {
    setSearch('');
    setFilterType('all');
    setFilterProjId('all');
    setFilterPartner('all');
    setFilterPayment('all');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
    onAddToast('Ledger filters reset successfully', 'info');
  };

  // Perform multi-dimensional filtration
  const getFilteredList = () => {
    return transactions.filter(t => {
      // 1. Search Query (Notes, Category, Amount)
      if (search.trim() !== '') {
        const q = search.toLowerCase();
        const matchesSearch =
          t.description.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q) ||
          t.amount.toString().includes(q);
        if (!matchesSearch) return false;
      }

      // 2. Debit / Credit
      if (filterType !== 'all' && t.type !== filterType) return false;

      // 3. Project
      if (filterProjId !== 'all' && t.projectId !== filterProjId) return false;

      // 4. Partner Type
      if (filterPartner !== 'all') {
        if (filterPartner === 'worker' && t.referenceType !== 'worker') return false;
        if (filterPartner === 'supplier' && t.referenceType !== 'supplier') return false;
      }

      // 5. Payment Channel
      if (filterPayment !== 'all' && t.paymentMethod !== filterPayment) return false;

      // 6. Dates
      if (startDate !== '') {
        const txDate = new Date(t.date).getTime();
        const filterStart = new Date(startDate).getTime();
        if (txDate < filterStart) return false;
      }

      if (endDate !== '') {
        const txDate = new Date(t.date).getTime();
        const filterEnd = new Date(endDate + 'T23:59:59').getTime();
        if (txDate > filterEnd) return false;
      }

      return true;
    });
  };

  const filteredList = getFilteredList();

  // Pagination calculations
  const totalRows = filteredList.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedList = filteredList.slice(startIndex, startIndex + rowsPerPage);

  // Export transactions to fully-formed CSV format
  const handleExportCSV = () => {
    if (filteredList.length === 0) {
      onAddToast('No records available to export', 'error');
      return;
    }

    // CSV Headers
    const headers = ['Transaction ID', 'Timestamp', 'Class', 'Associated Project', 'Billing Category', 'Payment Method', 'Description / Notes', 'Amount (INR)', 'Running Balance (INR)', 'Approved By'];

    // Generate Rows
    const rows = filteredList.map(t => {
      const proj = projects.find(p => p.id === t.projectId);
      const projName = t.projectId === 'studio' ? 'Studio Overheads' : proj?.name || 'Studio';
      const cleanDesc = t.description.replace(/"/g, '""'); // Escaping quotes in CSV
      return [
        t.id,
        new Date(t.date).toISOString(),
        t.type.toUpperCase(),
        `"${projName}"`,
        `"${t.category}"`,
        t.paymentMethod.toUpperCase(),
        `"${cleanDesc}"`,
        t.amount,
        t.runningBalance,
        `"${t.approvedBy || 'System'}"`
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Inchx_Interio_Ledger_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onAddToast(`Exported ${filteredList.length} transactions as CSV!`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* Module Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl font-serif">
            Inchx Interio Accounting History
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Browse, perform deep multi-dimensional filter queries, and export full accounting books.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all self-start sm:self-center cursor-pointer shadow-xs"
        >
          <Download className="h-4 w-4" />
          <span>Export to Excel/CSV</span>
        </button>
      </div>

      {/* Advanced Filters Panel */}
      <div className="bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 p-5 rounded-2xl shadow-xs text-xs font-semibold space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-900">
          <Filter className="h-4 w-4 text-slate-500" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Advanced Search & Audit Controls
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Text Search */}
          <div>
            <label className="block text-slate-500 dark:text-slate-400 mb-1">Search Keywords</label>
            <div className="relative">
              <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search memo, notes..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                className="w-full pl-8 pr-3 py-1.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 rounded-lg text-xs"
              />
            </div>
          </div>

          {/* Debit/Credit Class */}
          <div>
            <label className="block text-slate-500 dark:text-slate-400 mb-1">Inflow / Outflow Type</label>
            <select
              value={filterType}
              onChange={(e) => { setFilterType(e.target.value as any); setCurrentPage(1); }}
              className="w-full p-1.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-lg"
            >
              <option value="all">All Classes</option>
              <option value="income">Credits Only (Inflows)</option>
              <option value="expense">Debits Only (Outflows)</option>
            </select>
          </div>

          {/* Project File */}
          <div>
            <label className="block text-slate-500 dark:text-slate-400 mb-1">Project Worksite</label>
            <select
              value={filterProjId}
              onChange={(e) => { setFilterProjId(e.target.value); setCurrentPage(1); }}
              className="w-full p-1.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-lg"
            >
              <option value="all">All Project Sites</option>
              <option value="studio">Studio Overhead / Office</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Linked Partner */}
          <div>
            <label className="block text-slate-500 dark:text-slate-400 mb-1">Linked Procurement</label>
            <select
              value={filterPartner}
              onChange={(e) => { setFilterPartner(e.target.value as any); setCurrentPage(1); }}
              className="w-full p-1.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-lg"
            >
              <option value="all">All Procurement Links</option>
              <option value="worker">Contractors / Artisans</option>
              <option value="supplier">Material Suppliers</option>
            </select>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-slate-500 dark:text-slate-400 mb-1">Payment Method</label>
            <select
              value={filterPayment}
              onChange={(e) => { setFilterPayment(e.target.value); setCurrentPage(1); }}
              className="w-full p-1.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-lg"
            >
              <option value="all">All Payment Methods</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="upi">UPI / GPay</option>
              <option value="cash">Cash</option>
              <option value="cheque">Cheque</option>
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-slate-500 dark:text-slate-400 mb-1">Date From</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
              className="w-full p-1.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-lg"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-slate-500 dark:text-slate-400 mb-1">Date To</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
              className="w-full p-1.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-lg"
            />
          </div>

          {/* Clear Controls Button */}
          <div className="flex items-end">
            <button
              onClick={handleClearFilters}
              className="w-full py-1.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer font-bold transition-all h-[34px]"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Reset Query</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Ledger Table */}
      <div className="bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-900 text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider bg-slate-50/50 dark:bg-slate-950/20">
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Project Worksite</th>
                <th className="py-3 px-4">Ledger Category</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4">Linked Partner</th>
                <th className="py-3 px-4">Notes / Memo</th>
                <th className="py-3 px-4 text-right">Inflow/Outflow</th>
                <th className="py-3 px-4 text-right">Ledger Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-900 text-xs">
              {paginatedList.map((tx) => {
                const isIncome = tx.type === 'income';
                const proj = projects.find(p => p.id === tx.projectId);

                // Find linked partner name
                let partnerName = 'N/A';
                if (tx.referenceType === 'worker' && tx.referenceId) {
                  const wrk = workers.find(w => w.id === tx.referenceId);
                  partnerName = wrk ? `${wrk.name} (W)` : 'N/A';
                } else if (tx.referenceType === 'supplier' && tx.referenceId) {
                  const spl = suppliers.find(s => s.id === tx.referenceId);
                  partnerName = spl ? `${spl.name} (S)` : 'N/A';
                }

                return (
                  <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {new Date(tx.date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-white whitespace-nowrap">
                      {tx.projectId === 'studio' ? 'Studio Overhead' : proj?.name || 'Studio'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 font-semibold text-slate-600 dark:text-slate-300">
                        {tx.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 uppercase text-slate-500 font-medium whitespace-nowrap">
                      {tx.paymentMethod.replace('_', ' ')}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {partnerName}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate" title={tx.description}>
                      {tx.description}
                    </td>
                    <td className={`py-3.5 px-4 text-right font-black whitespace-nowrap ${
                      isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}>
                      {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {formatCurrency(tx.runningBalance)}
                    </td>
                  </tr>
                );
              })}

              {totalRows === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-16 text-slate-400 dark:text-slate-500">
                    No transaction entries match the current query filter. Try resetting the filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Dense Pagination Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 gap-4 bg-slate-50/50 dark:bg-slate-950/20 border-t border-slate-100 dark:border-slate-900 text-slate-500">
          <div className="flex items-center gap-2 text-xs">
            <span>Show</span>
            <select
              value={rowsPerPage}
              onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
              className="p-1 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-slate-700 dark:text-slate-300 rounded"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <span>records per page (Total: <strong>{totalRows}</strong>)</span>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-center text-xs font-bold">
            <span>Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong></span>
            <div className="flex gap-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
                className="p-1.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 rounded disabled:opacity-40 disabled:hover:bg-transparent"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
                className="p-1.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 rounded disabled:opacity-40 disabled:hover:bg-transparent"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

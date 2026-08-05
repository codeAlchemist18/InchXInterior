/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  TrendingUp,
  TrendingDown,
  Briefcase,
  Wallet,
  Clock,
  ArrowUpRight,
  PlusCircle,
  FilePlus,
  UserPlus
} from 'lucide-react';
import { Project, Transaction, Worker, Supplier } from '../types';
import { motion } from 'motion/react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, LabelList } from 'recharts';

interface DashboardProps {
  projects: Project[];
  transactions: Transaction[];
  workers: Worker[];
  suppliers: Supplier[];
  getStatistics: () => any;
  setCurrentTab: (tab: string) => void;
  onOpenQuickForm: (type: 'income' | 'expense') => void;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    
    // Format currency inline using the same Indian standard
    const formatCurrencyLocal = (amount: number) => {
      const formatted = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
      }).format(amount);
      return formatted.replace(/^INR\s*/, '₹').replace(/^Rs\.\s*/, '₹');
    };

    return (
      <div className="bg-slate-900 dark:bg-slate-950 border border-slate-800 p-3 rounded-xl shadow-xl text-xs space-y-1.5 text-white">
        <p className="font-extrabold text-slate-400 uppercase tracking-wider text-[10px]">
          {data.fullMonth || data.month}
        </p>
        <div className="space-y-1">
          <div className="flex items-center gap-4 justify-between">
            <span className="flex items-center gap-1.5 text-slate-300 font-medium">
              <span className="h-2 w-2 rounded-full bg-[#22C55E]" />
              Income:
            </span>
            <span className="font-extrabold text-[#22C55E]">
              {formatCurrencyLocal(data.Income)}
            </span>
          </div>
          <div className="flex items-center gap-4 justify-between">
            <span className="flex items-center gap-1.5 text-slate-300 font-medium">
              <span className="h-2 w-2 rounded-full bg-[#EF4444]" />
              Expense:
            </span>
            <span className="font-extrabold text-[#EF4444]">
              {formatCurrencyLocal(data.Expense)}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export default function Dashboard({
  projects,
  transactions,
  workers,
  suppliers,
  getStatistics,
  setCurrentTab,
  onOpenQuickForm
}: DashboardProps) {
  const stats = getStatistics();

  // Helper to format currency
  const formatCurrency = (amount: number) => {
    const formatted = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
    return formatted.replace(/^INR\s*/, '₹').replace(/^Rs\.\s*/, '₹');
  };

  // Helper to compute a nice rounded Y-axis maximum
  const getYAxisDomainMax = (max: number) => {
    if (max <= 0) return 10000;
    const paddedMax = max * 1.15; // Add 15% breathing room for labels
    if (paddedMax <= 1000) return 1000;
    if (paddedMax <= 5000) return 5000;
    if (paddedMax <= 10000) return 10000;
    if (paddedMax <= 50000) {
      return Math.ceil(paddedMax / 10000) * 10000;
    }
    if (paddedMax <= 100000) {
      return Math.ceil(paddedMax / 25000) * 25000;
    }
    if (paddedMax <= 1000000) {
      const step = paddedMax <= 250000 ? 50000 : 100000;
      return Math.ceil(paddedMax / step) * step;
    }
    if (paddedMax <= 5000000) {
      return Math.ceil(paddedMax / 500000) * 500000;
    }
    return Math.ceil(paddedMax / 1000000) * 1000000;
  };

  // Prepare chart data: Group transactions by Month for 2026 / 2025
  const getChartData = () => {
    const monthlyMap: Record<string, { month: string; fullMonth: string; Income: number; Expense: number }> = {
      '01': { month: 'Jan', fullMonth: 'January', Income: 0, Expense: 0 },
      '02': { month: 'Feb', fullMonth: 'February', Income: 0, Expense: 0 },
      '03': { month: 'Mar', fullMonth: 'March', Income: 0, Expense: 0 },
      '04': { month: 'Apr', fullMonth: 'April', Income: 0, Expense: 0 },
      '05': { month: 'May', fullMonth: 'May', Income: 0, Expense: 0 },
      '06': { month: 'Jun', fullMonth: 'June', Income: 0, Expense: 0 },
      '07': { month: 'Jul', fullMonth: 'July', Income: 0, Expense: 0 },
      '08': { month: 'Aug', fullMonth: 'August', Income: 0, Expense: 0 },
      '09': { month: 'Sep', fullMonth: 'September', Income: 0, Expense: 0 },
      '10': { month: 'Oct', fullMonth: 'October', Income: 0, Expense: 0 },
      '11': { month: 'Nov', fullMonth: 'November', Income: 0, Expense: 0 },
      '12': { month: 'Dec', fullMonth: 'December', Income: 0, Expense: 0 }
    };

    // Aggregate
    transactions.forEach(tx => {
      const dateObj = new Date(tx.date);
      const monthStr = String(dateObj.getMonth() + 1).padStart(2, '0');
      if (monthlyMap[monthStr]) {
        if (tx.type === 'income') {
          monthlyMap[monthStr].Income += tx.amount;
        } else {
          monthlyMap[monthStr].Expense += tx.amount;
        }
      }
    });

    return Object.values(monthlyMap);
  };

  const chartData = getChartData();
  const hasChartData = chartData.some(d => d.Income > 0 || d.Expense > 0);
  const maxChartValue = Math.max(...chartData.map(d => Math.max(d.Income, d.Expense)), 0);
  const yAxisMax = getYAxisDomainMax(maxChartValue);

  // Get active projects count
  const activeProjectsCount = projects.filter(p => p.status === 'in-progress').length;

  return (
    <div className="space-y-6">
      {/* Header Greeting */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl font-serif">
            INCHX INTERIO
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-semibold">
            Financial Management System &mdash; Built exclusively for INCHX INTERIO
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => onOpenQuickForm('income')}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Record Income</span>
          </button>
          <button
            onClick={() => onOpenQuickForm('expense')}
            className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 dark:bg-rose-600 dark:hover:bg-rose-500 text-white text-xs font-bold px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Record Expense</span>
          </button>
        </div>
      </div>

      {/* Summary Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Income */}
        <div className="bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 p-5 rounded-2xl flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
              Total Revenue
            </span>
            <div className="h-8 w-8 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-slate-900 dark:text-white truncate">
              {formatCurrency(stats.totalIncome)}
            </div>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1.5 flex items-center gap-1">
              <span>Client inflows synced</span>
            </p>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 p-5 rounded-2xl flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
              Total Debited
            </span>
            <div className="h-8 w-8 bg-rose-50 dark:bg-rose-950/30 rounded-lg flex items-center justify-center">
              <TrendingDown className="h-4.5 w-4.5 text-rose-600 dark:text-rose-400" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-slate-900 dark:text-white truncate">
              {formatCurrency(stats.totalExpenses)}
            </div>
            <p className="text-[10px] text-rose-600 dark:text-rose-400 font-bold mt-1.5 flex items-center gap-1">
              <span>Contractors & supply bills</span>
            </p>
          </div>
        </div>

        {/* Current Balance */}
        <div className="bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 p-5 rounded-2xl flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
              Free Reserve
            </span>
            <div className="h-8 w-8 bg-blue-50 dark:bg-blue-950/30 rounded-lg flex items-center justify-center">
              <Wallet className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-slate-900 dark:text-white truncate">
              {formatCurrency(stats.currentBalance)}
            </div>
            <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold mt-1.5 flex items-center gap-1">
              <span>Running book balance</span>
            </p>
          </div>
        </div>

        {/* Total Projects */}
        <div className="bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 p-5 rounded-2xl flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
              Studio Projects
            </span>
            <div className="h-8 w-8 bg-violet-50 dark:bg-violet-950/30 rounded-lg flex items-center justify-center">
              <Briefcase className="h-4.5 w-4.5 text-violet-600 dark:text-violet-400" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-slate-900 dark:text-white truncate">
              {stats.totalProjects}
            </div>
            <p className="text-[10px] text-violet-600 dark:text-violet-400 font-bold mt-1.5 flex items-center gap-1">
              <span>{activeProjectsCount} active execution site(s)</span>
            </p>
          </div>
        </div>

        {/* Pending Payments */}
        <div className="bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 p-5 rounded-2xl flex flex-col justify-between shadow-xs sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
              Outstanding Payables
            </span>
            <div className="h-8 w-8 bg-amber-50 dark:bg-amber-950/30 rounded-lg flex items-center justify-center">
              <Clock className="h-4.5 w-4.5 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400 truncate">
              {formatCurrency(stats.pendingPayments)}
            </div>
            <p className="text-[10px] text-amber-600 dark:text-amber-500 font-bold mt-1.5 flex items-center gap-1">
              <span>Workers & supplier reserves</span>
            </p>
          </div>
        </div>
      </div>

      {/* Main Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 p-5 rounded-2xl flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-900">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Cash Flow Breakdown (2026 Cumulative)
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Monthly trends of client income versus contractor & supplier payables.
              </p>
            </div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded">
              INR (₹)
            </span>
          </div>

          <div className="h-80 w-full mt-6 text-xs flex flex-col justify-center">
            {hasChartData ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 25, right: 20, left: 55, bottom: 5 }}>
                  <defs>
                    <linearGradient id="incomeColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22C55E" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#22C55E" stopOpacity={0.01}/>
                    </linearGradient>
                    <linearGradient id="expenseColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0.01}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:hidden" />
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" className="hidden dark:block" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} stroke="#64748b" dy={8} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    stroke="#64748b"
                    domain={[0, yAxisMax]}
                    tickCount={5}
                    tickFormatter={(val) => formatCurrency(val)}
                    dx={-8}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                  <Area
                    type="monotone"
                    dataKey="Income"
                    stroke="#22C55E"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#22C55E', stroke: '#ffffff', strokeWidth: 1.5 }}
                    activeDot={{ r: 6, fill: '#22C55E', stroke: '#ffffff', strokeWidth: 2 }}
                    fillOpacity={1}
                    fill="url(#incomeColor)"
                  >
                    <LabelList
                      dataKey="Income"
                      position="top"
                      offset={12}
                      formatter={(val: any) => val > 0 ? formatCurrency(val) : ''}
                      style={{ fill: '#22C55E', fontSize: 9, fontWeight: 700 }}
                    />
                  </Area>
                  <Area
                    type="monotone"
                    dataKey="Expense"
                    stroke="#EF4444"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#EF4444', stroke: '#ffffff', strokeWidth: 1.5 }}
                    activeDot={{ r: 6, fill: '#EF4444', stroke: '#ffffff', strokeWidth: 2 }}
                    fillOpacity={1}
                    fill="url(#expenseColor)"
                  >
                    <LabelList
                      dataKey="Expense"
                      position="top"
                      offset={12}
                      formatter={(val: any) => val > 0 ? formatCurrency(val) : ''}
                      style={{ fill: '#EF4444', fontSize: 9, fontWeight: 700 }}
                    />
                  </Area>
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col justify-center items-center text-center p-6 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-850">
                <TrendingUp className="h-8 w-8 text-slate-300 dark:text-slate-700 mb-2 animate-pulse" />
                <p className="text-slate-500 dark:text-slate-400 font-bold text-sm">
                  No financial data available for the selected period.
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5 uppercase tracking-wider">
                  Add a project transaction to view the cash flow graph.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Action & Stat Panels */}
        <div className="space-y-6">
          {/* Quick Shortcuts */}
          <div className="bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 p-5 rounded-2xl shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
              Quick Ledger Tools
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => setCurrentTab('ledger')}
                className="w-full flex items-center justify-between p-3 border border-slate-200/60 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-900/50 rounded-xl transition-all text-left"
              >
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-white">Record Project Transaction</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Post instant bill or customer receipt</div>
                </div>
                <ArrowUpRight className="h-4 w-4 text-slate-400 shrink-0" />
              </button>

              <button
                onClick={() => setCurrentTab('contractors')}
                className="w-full flex items-center justify-between p-3 border border-slate-200/60 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-900/50 rounded-xl transition-all text-left"
              >
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-white">Add Worker or Supplier</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Setup bank details & track ledger bills</div>
                </div>
                <UserPlus className="h-4 w-4 text-slate-400 shrink-0" />
              </button>

              <button
                onClick={() => setCurrentTab('invoices')}
                className="w-full flex items-center justify-between p-3 border border-slate-200/60 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-900/50 rounded-xl transition-all text-left"
              >
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-white">Generate Client Invoice</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Create itemized cost-sheet & print PDF</div>
                </div>
                <FilePlus className="h-4 w-4 text-slate-400 shrink-0" />
              </button>
            </div>
          </div>

          {/* Active Worksite Indicators */}
          <div className="bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 p-5 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Active Projects Cost Limit
              </h3>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">
                Budget vs Spent
              </span>
            </div>
            <div className="space-y-3.5">
              {projects.slice(0, 3).map(p => {
                const percent = Math.min(100, Math.round((p.spent / p.budget) * 100));
                return (
                  <div key={p.id} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-800 dark:text-white truncate max-w-[140px]">{p.name}</span>
                      <span className="text-slate-500 dark:text-slate-400 font-semibold">{percent}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          percent > 90 ? 'bg-rose-500' : percent > 70 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500">
                      <span>Spent: {formatCurrency(p.spent)}</span>
                      <span>Budget: {formatCurrency(p.budget)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Ledger Logs Section */}
      <div className="bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 p-5 rounded-2xl shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-900">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Recent Activity Stream
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Latest bookkeeping submissions approved in the system.
            </p>
          </div>
          <button
            onClick={() => setCurrentTab('history')}
            className="text-xs text-slate-900 dark:text-white font-bold hover:underline cursor-pointer"
          >
            View Full Log &rarr;
          </button>
        </div>

        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-900 text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3 px-2">Timestamp</th>
                <th className="py-3 px-2">Project</th>
                <th className="py-3 px-2">Category</th>
                <th className="py-3 px-2">Method</th>
                <th className="py-3 px-2">Description</th>
                <th className="py-3 px-2 text-right">Inflow / Outflow</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-900 text-xs">
              {transactions.slice(0, 5).map((tx) => {
                const isIncome = tx.type === 'income';
                const proj = projects.find(p => p.id === tx.projectId);
                return (
                  <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20">
                    <td className="py-3.5 px-2 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {new Date(tx.date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="py-3.5 px-2 font-bold text-slate-800 dark:text-white whitespace-nowrap">
                      {tx.projectId === 'studio' ? 'Studio Overhead' : proj?.name || 'Studio'}
                    </td>
                    <td className="py-3.5 px-2">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200/50 dark:border-slate-800/50">
                        {tx.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-2 font-medium text-slate-500 dark:text-slate-400 uppercase">
                      {tx.paymentMethod.replace('_', ' ')}
                    </td>
                    <td className="py-3.5 px-2 text-slate-600 dark:text-slate-400 truncate max-w-xs" title={tx.description}>
                      {tx.description}
                    </td>
                    <td className={`py-3.5 px-2 text-right font-bold whitespace-nowrap ${
                      isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}>
                      {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
                    </td>
                  </tr>
                );
              })}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400 dark:text-slate-500">
                    No transactions recorded in the system yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

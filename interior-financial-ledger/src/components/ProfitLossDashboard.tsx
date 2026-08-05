/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Project, Transaction } from '../types';
import { DollarSign, TrendingUp, TrendingDown, Award, PieChart as PieIcon, BarChart3, ShieldAlert } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';

interface ProfitLossDashboardProps {
  projects: Project[];
  transactions: Transaction[];
}

const COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#14b8a6', '#6366f1', '#6b7280'];

export default function ProfitLossDashboard({ projects, transactions }: ProfitLossDashboardProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // 1. Calculate General or Project-wise Metrics
  const projectMetrics = projects.map(proj => {
    const projectTxs = transactions.filter(t => t.projectId === proj.name || t.projectId === proj.id);
    const revenue = projectTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expenses = projectTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const profit = revenue - expenses;
    return {
      id: proj.id,
      name: proj.name,
      client: proj.clientName,
      revenue,
      expenses,
      profit,
      status: proj.status
    };
  });

  // Include general/overhead transactions that do not match a project
  const projectNames = projects.map(p => p.name);
  const overheadTxs = transactions.filter(t => t.projectId === 'studio' || (!projectNames.includes(t.projectId) && t.projectId !== 'all'));
  const overheadRevenue = overheadTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const overheadExpenses = overheadTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

  const totalRevenue = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const totalProfit = totalRevenue - totalExpenses;

  // Selected Project Metrics
  const isAll = selectedProjectId === 'all';
  const isOverhead = selectedProjectId === 'overhead';
  const selectedProj = projects.find(p => p.id === selectedProjectId);

  const displayRevenue = isAll
    ? totalRevenue
    : isOverhead
    ? overheadRevenue
    : projectMetrics.find(m => m.id === selectedProjectId)?.revenue || 0;

  const displayExpenses = isAll
    ? totalExpenses
    : isOverhead
    ? overheadExpenses
    : projectMetrics.find(m => m.id === selectedProjectId)?.expenses || 0;

  const displayProfit = displayRevenue - displayExpenses;

  // 2. Prepare Data for Charts
  // Project-wise Comparison Chart Data
  const comparisonData = projectMetrics.map(m => ({
    name: m.name.slice(0, 15) + (m.name.length > 15 ? '...' : ''),
    Revenue: m.revenue,
    Expenses: m.expenses,
    Profit: m.profit
  }));

  // Expense Category Breakdown Data
  const currentTxs = isAll
    ? transactions
    : isOverhead
    ? overheadTxs
    : transactions.filter(t => t.projectId === selectedProj?.name || t.projectId === selectedProj?.id);

  const categoryMap: { [key: string]: number } = {};
  currentTxs.filter(t => t.type === 'expense').forEach(t => {
    const cat = t.category || 'Miscellaneous';
    categoryMap[cat] = (categoryMap[cat] || 0) + t.amount;
  });

  const categoryData = Object.keys(categoryMap).map(cat => ({
    name: cat,
    value: categoryMap[cat]
  })).sort((a, b) => b.value - a.value);

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-serif font-black text-slate-900 dark:text-amber-400 uppercase tracking-wider">
            Profit & Loss Dashboard
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-widest mt-0.5">
            Admin Project-wise margins, revenue stream auditing, and expense analytics
          </p>
        </div>

        <select
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
          className="px-3 py-2 border border-slate-200 dark:border-amber-500/15 dark:bg-slate-900 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold outline-hidden cursor-pointer"
        >
          <option value="all">Analyze overall system portfolio</option>
          <option value="overhead">Overhead & Office Operations Only</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>Site: {p.name}</option>
          ))}
        </select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Revenue Card */}
        <div className="bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-900 rounded-2xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-between h-32">
          <div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Revenue Inflows</span>
            <div className="text-2xl font-serif font-black text-slate-900 dark:text-white tracking-wide mt-1">
              {formatCurrency(displayRevenue)}
            </div>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-emerald-500 font-bold uppercase tracking-wider">
            <TrendingUp className="h-4.5 w-4.5" />
            <span>Project Bill Clearings</span>
          </div>
        </div>

        {/* Expenses Card */}
        <div className="bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-900 rounded-2xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-between h-32">
          <div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Expense Outflows</span>
            <div className="text-2xl font-serif font-black text-slate-900 dark:text-white tracking-wide mt-1">
              {formatCurrency(displayExpenses)}
            </div>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-rose-500 font-bold uppercase tracking-wider">
            <TrendingDown className="h-4.5 w-4.5" />
            <span>Procurements & Contractors</span>
          </div>
        </div>

        {/* Profit Card */}
        <div className="bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-amber-500/15 rounded-2xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-between h-32 bg-slate-50 dark:bg-slate-900/10">
          <div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-amber-500/50 uppercase tracking-wider">Calculated Operating Profit</span>
            <div className={`text-2xl font-serif font-black tracking-wide mt-1 ${displayProfit >= 0 ? 'text-amber-500' : 'text-rose-500'}`}>
              {formatCurrency(displayProfit)}
            </div>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-amber-500 font-bold uppercase tracking-wider">
            <Award className="h-4.5 w-4.5" />
            <span>{displayProfit >= 0 ? 'Net Profit Margin' : 'Net Loss Recorded'}</span>
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Comparison Chart */}
        {isAll && (
          <div className="bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-900 p-5 rounded-2xl shadow-md space-y-4">
            <h2 className="text-xs font-serif font-bold text-slate-900 dark:text-amber-400 flex items-center gap-2 uppercase tracking-wide">
              <BarChart3 className="h-4.5 w-4.5 text-amber-500" />
              <span>Project portfolio margins</span>
            </h2>
            <div className="h-64 text-[10px] font-medium">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" opacity={0.1} />
                  <XAxis dataKey="name" stroke="#666" />
                  <YAxis stroke="#666" />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                  <Bar dataKey="Revenue" fill="#10b981" />
                  <Bar dataKey="Expenses" fill="#f43f5e" />
                  <Bar dataKey="Profit" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Expense Categories Breakdown */}
        <div className={`bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-900 p-5 rounded-2xl shadow-md space-y-4 ${!isAll ? 'lg:col-span-2' : ''}`}>
          <h2 className="text-xs font-serif font-bold text-slate-900 dark:text-amber-400 flex items-center gap-2 uppercase tracking-wide">
            <PieIcon className="h-4.5 w-4.5 text-amber-500" />
            <span>procurement cost category distribution</span>
          </h2>
          {categoryData.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400">
              <ShieldAlert className="h-8 w-8 mb-2 opacity-55 text-amber-500" />
              <span>No expense records logged to compile distribution chart</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center h-64">
              <div className="h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1.5 overflow-y-auto max-h-56 pr-2">
                {categoryData.map((item, idx) => (
                  <div key={item.name} className="flex items-center justify-between text-[11px] font-bold">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                      <span className="text-slate-500 dark:text-slate-400">{item.name}</span>
                    </div>
                    <span className="text-slate-900 dark:text-slate-200">{formatCurrency(item.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Project margins list table */}
      <div className="bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-900 rounded-2xl shadow-md overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-900">
          <h2 className="text-xs font-serif font-bold text-slate-900 dark:text-amber-400 uppercase tracking-widest">Project Profitability Audit Trail</h2>
        </div>
        <div className="overflow-x-auto text-xs font-semibold">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-900/50 text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-900">
                <th className="py-3 px-5">Site / Project Name</th>
                <th className="py-3 px-5">Client Name</th>
                <th className="py-3 px-5 text-right">Revenue Inflows</th>
                <th className="py-3 px-5 text-right">Expenses Outflows</th>
                <th className="py-3 px-5 text-right">Net Margin Profit / Loss</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-900 text-slate-700 dark:text-slate-300">
              {projectMetrics.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                  <td className="py-3 px-5 font-serif font-bold text-slate-900 dark:text-white">{m.name}</td>
                  <td className="py-3 px-5 text-slate-500">{m.client}</td>
                  <td className="py-3 px-5 text-right font-bold text-emerald-500">{formatCurrency(m.revenue)}</td>
                  <td className="py-3 px-5 text-right font-bold text-rose-500">{formatCurrency(m.expenses)}</td>
                  <td className={`py-3 px-5 text-right font-serif font-black ${m.profit >= 0 ? 'text-amber-500' : 'text-rose-500'}`}>
                    {formatCurrency(m.profit)}
                  </td>
                </tr>
              ))}
              {overheadExpenses > 0 && (
                <tr className="bg-slate-50/20 dark:bg-slate-900/10 italic">
                  <td className="py-3 px-5 font-bold">Studio Overheads & Office Costs</td>
                  <td className="py-3 px-5 text-slate-500">N/A</td>
                  <td className="py-3 px-5 text-right text-emerald-500">{formatCurrency(overheadRevenue)}</td>
                  <td className="py-3 px-5 text-right text-rose-500">{formatCurrency(overheadExpenses)}</td>
                  <td className={`py-3 px-5 text-right font-bold ${overheadRevenue - overheadExpenses >= 0 ? 'text-amber-500' : 'text-rose-500'}`}>
                    {formatCurrency(overheadRevenue - overheadExpenses)}
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

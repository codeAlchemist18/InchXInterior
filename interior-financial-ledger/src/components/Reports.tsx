/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Project, Transaction, Worker, Supplier } from '../types';
import { 
  TrendingUp, 
  FileText, 
  Download, 
  Briefcase, 
  Users, 
  PieChart as PieIcon, 
  ArrowUpRight, 
  ArrowDownRight, 
  Layers, 
  CreditCard, 
  Activity, 
  Calendar 
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  LineChart, 
  Line 
} from 'recharts';
import { jsPDF } from 'jspdf';

interface ReportsProps {
  projects: Project[];
  transactions: Transaction[];
  workers: Worker[];
  suppliers: Supplier[];
  onAddToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

type ReportTab = 'timeframe' | 'project' | 'category' | 'payment_method' | 'vendor' | 'cash_flow';

export default function Reports({
  projects,
  transactions,
  workers,
  suppliers,
  onAddToast
}: ReportsProps) {
  const [activeTab, setActiveTab] = useState<ReportTab>('timeframe');
  const [timeframePreset, setTimeframePreset] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Color palette: Luxury Black, Gold and balanced accent colors
  const CHART_COLORS = [
    '#D4AF37', // Gold
    '#1E293B', // Dark Slate
    '#10B981', // Emerald
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#06B6D4', // Cyan
    '#F59E0B', // Amber
    '#EC4899'  // Pink
  ];

  // Helper to safely get project name from transaction
  const getTransactionProjectName = (t: Transaction): string => {
    if (t.projectName) return t.projectName;
    const proj = projects.find(p => p.id === t.projectId);
    return proj ? proj.name : (t.projectId === 'studio' ? 'Office Overheads' : 'General Project');
  };

  // 1. Timeframe Data Processing
  const getFilteredTransactions = () => {
    const now = new Date();
    return transactions.filter(t => {
      const txDate = new Date(t.date);
      const diffTime = Math.abs(now.getTime() - txDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (timeframePreset === 'daily') return diffDays <= 1;
      if (timeframePreset === 'weekly') return diffDays <= 7;
      if (timeframePreset === 'monthly') return diffDays <= 30;
      return diffDays <= 365; // Yearly
    });
  };

  const timeframeTransactions = getFilteredTransactions();
  const totalInflows = timeframeTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalOutflows = timeframeTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const netMargin = totalInflows - totalOutflows;
  const marginPercent = totalInflows > 0 ? Math.round((netMargin / totalInflows) * 100) : 0;

  // 2. Project-wise Data Processing (Supports both master and typed custom projects)
  const getProjectReportData = () => {
    const projectSummaryMap: Record<string, { name: string; inflows: number; outflows: number }> = {};

    transactions.forEach(t => {
      const pName = getTransactionProjectName(t);
      if (!projectSummaryMap[pName]) {
        projectSummaryMap[pName] = { name: pName, inflows: 0, outflows: 0 };
      }
      if (t.type === 'income') {
        projectSummaryMap[pName].inflows += t.amount;
      } else {
        projectSummaryMap[pName].outflows += t.amount;
      }
    });

    return Object.values(projectSummaryMap).map(p => ({
      name: p.name,
      Inflow: p.inflows,
      Outflow: p.outflows,
      Margin: p.inflows - p.outflows
    }));
  };

  const projectReportData = getProjectReportData();

  // 3. Category-wise Expense Distribution
  const getCategoryReportData = () => {
    const map: Record<string, number> = {};

    transactions.filter(t => t.type === 'expense').forEach(t => {
      const cat = t.category || 'Miscellaneous';
      map[cat] = (map[cat] || 0) + t.amount;
    });

    return Object.entries(map)
      .map(([key, val]) => ({ name: key, value: val }))
      .sort((a, b) => b.value - a.value);
  };

  const categoryReportData = getCategoryReportData();

  // 4. Payment Method Distribution
  const getPaymentMethodReportData = () => {
    const map: Record<string, { name: string; Inflow: number; Outflow: number }> = {
      bank_transfer: { name: 'Bank Transfer', Inflow: 0, Outflow: 0 },
      upi: { name: 'UPI / GPay', Inflow: 0, Outflow: 0 },
      cash: { name: 'Cash Handover', Inflow: 0, Outflow: 0 },
      cheque: { name: 'Cheque Payment', Inflow: 0, Outflow: 0 }
    };

    transactions.forEach(t => {
      const key = t.paymentMethod || 'bank_transfer';
      if (map[key]) {
        if (t.type === 'income') {
          map[key].Inflow += t.amount;
        } else {
          map[key].Outflow += t.amount;
        }
      }
    });

    return Object.values(map);
  };

  const paymentMethodData = getPaymentMethodReportData();

  // 5. Vendor Summary Data Processing (Supplier + Contractors payouts)
  const getVendorReportData = () => {
    const map: Record<string, { name: string; type: 'Supplier' | 'Labour Contractor'; totalPaid: number; pending: number }> = {};

    // Seed master contractors & suppliers
    workers.forEach(w => {
      map[`w-${w.id}`] = { name: w.name, type: 'Labour Contractor', totalPaid: 0, pending: w.pendingAmount };
    });
    suppliers.forEach(s => {
      map[`s-${s.id}`] = { name: s.name, type: 'Supplier', totalPaid: 0, pending: s.pendingAmount };
    });

    // Aggregate payment history from ledger transactions
    transactions.filter(t => t.type === 'expense' && t.referenceType && t.referenceId).forEach(t => {
      const refKey = `${t.referenceType === 'worker' ? 'w' : 's'}-${t.referenceId}`;
      if (map[refKey]) {
        map[refKey].totalPaid += t.amount;
      } else {
        const fallbackName = t.referenceType === 'worker' 
          ? (workers.find(w => w.id === t.referenceId)?.name || 'Contractor / Artisan')
          : (suppliers.find(s => s.id === t.referenceId)?.name || 'Supplier');
        map[refKey] = { 
          name: fallbackName, 
          type: t.referenceType === 'worker' ? 'Labour Contractor' : 'Supplier', 
          totalPaid: t.amount, 
          pending: 0 
        };
      }
    });

    return Object.values(map).filter(v => v.totalPaid > 0 || v.pending > 0);
  };

  const vendorReportData = getVendorReportData();

  // 6. Cash Flow Trend Data
  const getCashFlowData = () => {
    // Sort transactions chronologically
    const sorted = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    let cumInflow = 0;
    let cumOutflow = 0;
    let balance = 0;

    return sorted.map(t => {
      if (t.type === 'income') {
        cumInflow += t.amount;
        balance += t.amount;
      } else {
        cumOutflow += t.amount;
        balance -= t.amount;
      }
      return {
        date: new Date(t.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
        'Inflow (Cumulative)': cumInflow,
        'Outflow (Cumulative)': cumOutflow,
        'Cash Treasury Balance': balance,
      };
    });
  };

  const cashFlowData = getCashFlowData();

  // Export PDF with Luxury Branding Summary
  const handleExportReportPDF = () => {
    const doc = new jsPDF();
    const goldColor = [197, 160, 89]; // Warm Gold Accent

    // Header Background
    doc.setFillColor(15, 23, 42); // Deep Slate/Black
    doc.rect(0, 0, 210, 42, 'F');

    // Title
    doc.setTextColor(goldColor[0], goldColor[1], goldColor[2]);
    doc.setFont('times', 'bold');
    doc.setFontSize(10);
    doc.text("INCHX INTERIO", 15, 12);
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('EXECUTIVE FINANCIAL PERFORMANCE SHEET', 15, 23);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(156, 163, 175); // gray-400
    doc.text('EXCELLENCE AT YOUR DOOR STEP  |  OFFICE BOOKKEEPING STATEMENT', 15, 30);
    doc.text(`AUDIT TYPE: ${activeTab.toUpperCase()}  |  GENERATED ON: ${new Date().toLocaleDateString('en-IN')}`, 15, 35);

    // Context Card
    doc.setFillColor(248, 250, 252);
    doc.rect(15, 48, 180, 26, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(15, 48, 180, 26, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text('TREASURY SNAPSHOT SUMMARY:', 20, 54);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(`Audited Inflows: INR ${totalInflows.toLocaleString('en-IN')}`, 20, 61);
    doc.text(`Audited Outflows: INR ${totalOutflows.toLocaleString('en-IN')}`, 20, 67);
    
    doc.setFont('helvetica', 'bold');
    doc.text(`Net Operating Margin: INR ${netMargin.toLocaleString('en-IN')} (${marginPercent}%)`, 110, 61);
    doc.text(`Active Audited Ledgers Count: ${timeframeTransactions.length} items`, 110, 67);

    // List recent ledger records in the timeframe
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text('STATEMENT CHRONOLOGICAL ENTRIES:', 15, 84);

    // Draw list table headers
    doc.setFillColor(15, 23, 42);
    doc.rect(15, 88, 180, 7, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('DATE', 18, 93);
    doc.text('PROJECT / NOTES', 42, 93);
    doc.text('CATEGORY', 110, 93);
    doc.text('PAYMENT METHOD', 142, 93);
    doc.text('AMOUNT (INR)', 172, 93);

    let currentY = 100;
    const listLimit = timeframeTransactions.slice(0, 18);

    listLimit.forEach((tx) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(51, 65, 85);

      const pName = getTransactionProjectName(tx);
      const shortDesc = tx.description.length > 45 ? tx.description.slice(0, 45) + '...' : tx.description;
      const displayNotes = `${pName} (${shortDesc})`;
      const displayMethod = tx.paymentMethod === 'bank_transfer' ? 'Bank' : tx.paymentMethod === 'upi' ? 'UPI' : tx.paymentMethod === 'cash' ? 'Cash' : 'Cheque';

      doc.text(new Date(tx.date).toLocaleDateString('en-IN'), 18, currentY);
      doc.text(displayNotes, 42, currentY);
      doc.text(tx.category || 'General', 110, currentY);
      doc.text(displayMethod, 142, currentY);

      doc.setFont('helvetica', 'bold');
      if (tx.type === 'income') {
        doc.setTextColor(16, 185, 129); // emerald-500
        doc.text(`+${tx.amount.toLocaleString('en-IN')}`, 172, currentY);
      } else {
        doc.setTextColor(239, 68, 68); // red-500
        doc.text(`-${tx.amount.toLocaleString('en-IN')}`, 172, currentY);
      }

      // Draw bottom divider line
      doc.setDrawColor(241, 245, 249);
      doc.setLineWidth(0.2);
      doc.line(15, currentY + 2, 195, currentY + 2);

      currentY += 7.5;
    });

    if (timeframeTransactions.length > 18) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text(`...And ${timeframeTransactions.length - 18} other matching records omitted from this page view.`, 15, currentY + 2);
    }

    // Signature/Footer
    doc.setDrawColor(197, 160, 89);
    doc.setLineWidth(0.4);
    doc.line(15, 275, 195, 275);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text("System generated auditing statement. Powered by INCHX INTERIO Office Division.", 15, 281);
    doc.text("Page 1 of 1", 182, 281);

    doc.save(`INCHX_Report_${activeTab}_${timeframePreset}.pdf`);
    onAddToast('Symmetric PDF financial statement generated', 'success');
  };

  // Export CSV Sheet
  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: any[][] = [];
    const filename = `INCHX_Financial_${activeTab}`;

    if (activeTab === 'project') {
      headers = ['Project Site Name', 'Inflows Received (INR)', 'Outflows Debited (INR)', 'Net Gross Profit Margin (INR)'];
      rows = projectReportData.map(p => [p.name, p.Inflow, p.Outflow, p.Margin]);
    } else if (activeTab === 'category') {
      headers = ['Procurement Category', 'Debit Spent Total (INR)'];
      rows = categoryReportData.map(c => [c.name, c.value]);
    } else if (activeTab === 'payment_method') {
      headers = ['Payment Gateway / Route', 'Total Inflows (INR)', 'Total Outflows (INR)'];
      rows = paymentMethodData.map(p => [p.name, p.Inflow, p.Outflow]);
    } else if (activeTab === 'vendor') {
      headers = ['Vendor Name', 'Vendor Segment Type', 'Paid / Settled To Date (INR)', 'Outstanding Liabilities (INR)'];
      rows = vendorReportData.map(v => [v.name, v.type, v.totalPaid, v.pending]);
    } else if (activeTab === 'cash_flow') {
      headers = ['Chronological Interval Date', 'Cumulative Revenue Received (INR)', 'Cumulative Spent Outflows (INR)', 'Net Balance (INR)'];
      rows = cashFlowData.map(cf => [cf.date, cf['Inflow (Cumulative)'], cf['Outflow (Cumulative)'], cf['Cash Treasury Balance']]);
    } else {
      headers = ['Date', 'Category', 'Entry Type', 'Amount (INR)', 'Project Location', 'Gateway', 'Description'];
      rows = timeframeTransactions.map(t => [
        t.date, 
        t.category, 
        t.type.toUpperCase(), 
        t.amount, 
        getTransactionProjectName(t), 
        t.paymentMethod, 
        t.description
      ]);
    }

    const csvContent = [headers.join(','), ...rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onAddToast('Statement CSV compiled and downloaded.', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Module Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-amber-500/10 pb-5">
        <div>
          <h1 className="text-xl font-serif font-black tracking-wide text-slate-900 dark:text-amber-400 uppercase">
            Symmetric Audit & Statement Sheets
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider">
            Analyze cash inflows, labor payouts, supplier liabilities, and treasury liquidity.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wider">
          <button
            onClick={handleExportReportPDF}
            className="flex items-center gap-2 border border-slate-200 dark:border-amber-500/20 text-slate-700 dark:text-amber-400 hover:bg-slate-50 dark:hover:bg-amber-950/20 px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-xs"
          >
            <FileText className="h-4 w-4 text-amber-500" />
            <span>PDF Performance Sheet</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-amber-500 text-slate-950 hover:bg-amber-400 px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-md"
          >
            <Download className="h-4 w-4" />
            <span>Excel / CSV Statement</span>
          </button>
        </div>
      </div>

      {/* Primary Report Tab Navigation */}
      <div className="flex flex-wrap gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-slate-800/60 max-w-5xl">
        {[
          { id: 'timeframe', label: 'Timeframe Audit', icon: Calendar },
          { id: 'project', label: 'Project Ledgers', icon: Briefcase },
          { id: 'category', label: 'Expense Categories', icon: Layers },
          { id: 'payment_method', label: 'Payment Routes', icon: CreditCard },
          { id: 'vendor', label: 'Vendor Summary', icon: Users },
          { id: 'cash_flow', label: 'Cash Flow Trends', icon: Activity }
        ].map(item => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`flex items-center gap-1.5 py-2 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer uppercase tracking-wider ${
                activeTab === item.id
                  ? 'bg-white text-slate-900 dark:bg-slate-950 dark:text-amber-400 shadow-sm border border-slate-200/50 dark:border-amber-500/20'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Timeframe preset bar (Only visible on Timeframe tab) */}
      {activeTab === 'timeframe' && (
        <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-850 p-4 rounded-2xl flex flex-wrap items-center gap-4 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Time Interval Range:
          </span>
          <div className="flex gap-2">
            {[
              { id: 'daily', label: 'Past 24 Hours' },
              { id: 'weekly', label: 'Past 7 Days' },
              { id: 'monthly', label: 'Past 30 Days' },
              { id: 'yearly', label: 'Full Year' }
            ].map(preset => (
              <button
                key={preset.id}
                onClick={() => setTimeframePreset(preset.id as any)}
                className={`py-1.5 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  timeframePreset === preset.id
                    ? 'bg-slate-950 text-amber-400 dark:bg-white dark:text-slate-950 border-transparent font-black shadow-sm'
                    : 'border-slate-200 text-slate-600 dark:border-slate-800 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Analytical KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-900 p-5 rounded-2xl shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Total Revenue Received</span>
            <span className="p-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600">
              <ArrowUpRight className="h-4 w-4" />
            </span>
          </div>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-2 font-serif">
            {formatCurrency(totalInflows)}
          </div>
          <div className="text-[9px] text-slate-400 mt-1 uppercase">Cumulative client payments received</div>
        </div>

        <div className="bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-900 p-5 rounded-2xl shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Total Outflow Debited</span>
            <span className="p-1 rounded-lg bg-rose-50 dark:bg-rose-950/30 text-rose-600">
              <ArrowDownRight className="h-4 w-4" />
            </span>
          </div>
          <div className="text-xl font-black text-rose-600 dark:text-rose-400 mt-2 font-serif">
            {formatCurrency(totalOutflows)}
          </div>
          <div className="text-[9px] text-slate-400 mt-1 uppercase">Material, labour & overhead debits</div>
        </div>

        <div className="bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-900 p-5 rounded-2xl shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Operating Cash Margin</span>
            <span className="p-1 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-600">
              <TrendingUp className="h-4 w-4" />
            </span>
          </div>
          <div className={`text-xl font-black mt-2 font-serif ${netMargin >= 0 ? 'text-blue-600 dark:text-amber-400' : 'text-rose-600'}`}>
            {formatCurrency(netMargin)}
          </div>
          <div className="text-[9px] text-slate-400 mt-1 uppercase">Retained earnings on active accounts</div>
        </div>

        <div className="bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-900 p-5 rounded-2xl shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Operating Margin %</span>
            <span className="p-1 rounded-lg bg-violet-50 dark:bg-violet-950/30 text-violet-600">
              <Activity className="h-4 w-4" />
            </span>
          </div>
          <div className="text-xl font-black text-violet-600 dark:text-violet-400 mt-2 font-serif">
            {marginPercent}%
          </div>
          <div className="text-[9px] text-slate-400 mt-1 uppercase">Profit capture ratio from total volume</div>
        </div>
      </div>

      {/* Main Charts & Detailed Analytical Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Dynamic Interactive Chart: 7 columns */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-amber-500/10 p-5 rounded-2xl shadow-xs">
          <h2 className="text-xs font-serif font-bold text-slate-900 dark:text-amber-400 mb-4 flex items-center gap-2 uppercase tracking-wider">
            <PieIcon className="h-4 w-4 text-amber-500 animate-pulse" />
            <span>Interactive Financial Visualization</span>
          </h2>

          <div className="h-80 w-full text-[10px] font-semibold">
            {activeTab === 'category' && (
              categoryReportData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryReportData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={4}
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {categoryReportData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Total Outflow']} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col justify-center items-center text-center p-6 text-slate-400">
                  <Layers className="h-8 w-8 text-slate-300 mb-2" />
                  No categorized expenses recorded in the ledger yet.
                </div>
              )
            )}

            {activeTab === 'project' && (
              projectReportData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={projectReportData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" strokeOpacity={0.1} />
                    <XAxis dataKey="name" stroke="#64748b" tickLine={false} />
                    <YAxis stroke="#64748b" tickLine={false} tickFormatter={(val) => `₹${val / 100000}L`} />
                    <Tooltip formatter={(value) => [formatCurrency(Number(value)), '']} />
                    <Legend iconType="circle" />
                    <Bar dataKey="Inflow" fill="#10B981" radius={[4, 4, 0, 0]} name="Received Inflow" />
                    <Bar dataKey="Outflow" fill="#EF4444" radius={[4, 4, 0, 0]} name="Paid Outflow" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col justify-center items-center text-center p-6 text-slate-400">
                  <Briefcase className="h-8 w-8 text-slate-300 mb-2" />
                  No active project records to trace.
                </div>
              )
            )}

            {activeTab === 'payment_method' && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={paymentMethodData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" strokeOpacity={0.1} />
                  <XAxis dataKey="name" stroke="#64748b" tickLine={false} />
                  <YAxis stroke="#64748b" tickLine={false} tickFormatter={(val) => `₹${val / 1000}k`} />
                  <Tooltip formatter={(value) => [formatCurrency(Number(value)), '']} />
                  <Legend iconType="circle" />
                  <Bar dataKey="Inflow" fill="#10B981" radius={[4, 4, 0, 0]} name="Received" />
                  <Bar dataKey="Outflow" fill="#F59E0B" radius={[4, 4, 0, 0]} name="Debited" />
                </BarChart>
              </ResponsiveContainer>
            )}

            {activeTab === 'vendor' && (
              vendorReportData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={vendorReportData} layout="vertical" margin={{ top: 10, right: 15, left: 35, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#1e293b" strokeOpacity={0.1} />
                    <XAxis type="number" stroke="#64748b" tickLine={false} tickFormatter={(val) => `₹${val / 1000}k`} />
                    <YAxis dataKey="name" type="category" stroke="#64748b" tickLine={false} width={80} />
                    <Tooltip formatter={(value) => [formatCurrency(Number(value)), '']} />
                    <Legend iconType="circle" />
                    <Bar dataKey="totalPaid" fill="#D4AF37" stackId="a" radius={[0, 4, 4, 0]} name="Paid (Settled)" />
                    <Bar dataKey="pending" fill="#1E293B" stackId="a" radius={[0, 4, 4, 0]} name="Outstanding Liabilities" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col justify-center items-center text-center p-6 text-slate-400">
                  <Users className="h-8 w-8 text-slate-300 mb-2" />
                  No material supplier or labor contractor payment transactions logged yet.
                </div>
              )
            )}

            {activeTab === 'cash_flow' && (
              cashFlowData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={cashFlowData} margin={{ top: 15, right: 15, left: 10, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorTreasury" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" strokeOpacity={0.06} />
                    <XAxis dataKey="date" stroke="#64748b" tickLine={false} />
                    <YAxis stroke="#64748b" tickLine={false} tickFormatter={(val) => `₹${val / 1000}k`} />
                    <Tooltip formatter={(value) => [formatCurrency(Number(value)), '']} />
                    <Legend iconType="circle" />
                    <Area type="monotone" dataKey="Cash Treasury Balance" stroke="#D4AF37" strokeWidth={2.5} fillOpacity={1} fill="url(#colorTreasury)" name="Liquid Treasury Reserve (INR)" />
                    <Line type="monotone" dataKey="Inflow (Cumulative)" stroke="#10B981" strokeWidth={1.5} dot={false} name="Cum Inflow" />
                    <Line type="monotone" dataKey="Outflow (Cumulative)" stroke="#EF4444" strokeWidth={1.5} dot={false} name="Cum Spent Outflow" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col justify-center items-center text-center p-6 text-slate-400">
                  <Activity className="h-8 w-8 text-slate-300 mb-2" />
                  Add ledger transactions to visualize cash treasury curves.
                </div>
              )
            )}

            {activeTab === 'timeframe' && (
              <div className="h-full flex flex-col justify-center items-center text-center p-6 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-dashed border-slate-200 dark:border-amber-500/10">
                <Calendar className="h-8 w-8 text-amber-500 mb-2" />
                <p className="text-slate-500 dark:text-slate-400 font-bold max-w-sm">
                  Chronological timeframe statements are processed above. Filter by interval or download the PDF or CSV statements to run audits.
                </p>
                <div className="text-[10px] text-slate-400 mt-2 uppercase tracking-wide">
                  Active audited entries in this span: {timeframeTransactions.length} records
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Aggregation Tabulated Ledger Sheet: 5 columns */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-amber-500/10 p-5 rounded-2xl shadow-xs overflow-hidden">
          <h2 className="text-xs font-serif font-bold text-slate-900 dark:text-amber-400 mb-4 flex items-center gap-2 uppercase tracking-wider">
            <FileText className="h-4 w-4 text-amber-500" />
            <span>Symmetric Aggregation Audit Ledger</span>
          </h2>

          <div className="overflow-y-auto max-h-80 text-[11px] font-semibold">
            {activeTab === 'category' && (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-900 text-[9px] text-slate-400 uppercase tracking-wider">
                    <th className="py-2.5">Category Segment</th>
                    <th className="py-2.5 text-right">Debit Spent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-900">
                  {categoryReportData.length > 0 ? (
                    categoryReportData.map(c => (
                      <tr key={c.name} className="hover:bg-slate-50/50 dark:hover:bg-amber-950/5">
                        <td className="py-2 text-slate-700 dark:text-slate-300">{c.name}</td>
                        <td className="py-2 text-right text-rose-600 dark:text-rose-400 font-bold">{formatCurrency(c.value)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={2} className="py-4 text-center text-slate-400">No records found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}

            {activeTab === 'project' && (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-900 text-[9px] text-slate-400 uppercase tracking-wider">
                    <th className="py-2.5">Interior Project Site</th>
                    <th className="py-2.5 text-right">Debit</th>
                    <th className="py-2.5 text-right">Credit Inflow</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-900">
                  {projectReportData.length > 0 ? (
                    projectReportData.map(p => (
                      <tr key={p.name} className="hover:bg-slate-50/50 dark:hover:bg-amber-950/5">
                        <td className="py-2 text-slate-800 dark:text-slate-200 font-bold truncate max-w-[120px]" title={p.name}>{p.name}</td>
                        <td className="py-2 text-right text-rose-600 dark:text-rose-400">{formatCurrency(p.Outflow)}</td>
                        <td className="py-2 text-right text-emerald-600 dark:text-emerald-400 font-black">{formatCurrency(p.Inflow)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="py-4 text-center text-slate-400">No records found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}

            {activeTab === 'payment_method' && (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-900 text-[9px] text-slate-400 uppercase tracking-wider">
                    <th className="py-2.5">Route Gateway</th>
                    <th className="py-2.5 text-right">Debit</th>
                    <th className="py-2.5 text-right">Credit Inflow</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-900">
                  {paymentMethodData.map(pm => (
                    <tr key={pm.name} className="hover:bg-slate-50/50 dark:hover:bg-amber-950/5">
                      <td className="py-2 text-slate-700 dark:text-slate-300 font-bold">{pm.name}</td>
                      <td className="py-2 text-right text-rose-600 dark:text-rose-400">{formatCurrency(pm.Outflow)}</td>
                      <td className="py-2 text-right text-emerald-600 dark:text-emerald-400 font-bold">{formatCurrency(pm.Inflow)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'vendor' && (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-900 text-[9px] text-slate-400 uppercase tracking-wider">
                    <th className="py-2.5">Vendor Name</th>
                    <th className="py-2.5">Segment</th>
                    <th className="py-2.5 text-right">Paid Outflow</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-900">
                  {vendorReportData.length > 0 ? (
                    vendorReportData.map(v => (
                      <tr key={v.name} className="hover:bg-slate-50/50 dark:hover:bg-amber-950/5">
                        <td className="py-2 text-slate-800 dark:text-slate-200 font-bold">{v.name}</td>
                        <td className="py-2 text-slate-400 text-[10px] uppercase">{v.type.split(' ')[0]}</td>
                        <td className="py-2 text-right text-amber-600 dark:text-amber-400 font-bold">{formatCurrency(v.totalPaid)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="py-4 text-center text-slate-400">No vendors registered with active ledger payouts.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}

            {activeTab === 'cash_flow' && (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-900 text-[9px] text-slate-400 uppercase tracking-wider">
                    <th className="py-2.5">Interval Date</th>
                    <th className="py-2.5 text-right">Reserve Liquidity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-900">
                  {cashFlowData.slice(-15).reverse().map((cf, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-amber-950/5">
                      <td className="py-2 text-slate-500">{cf.date}</td>
                      <td className={`py-2 text-right font-bold ${cf['Cash Treasury Balance'] >= 0 ? 'text-emerald-600 dark:text-amber-400' : 'text-rose-600'}`}>
                        {formatCurrency(cf['Cash Treasury Balance'])}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'timeframe' && (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-900 text-[9px] text-slate-400 uppercase tracking-wider">
                    <th className="py-2.5">Timestamp</th>
                    <th className="py-2.5">Category</th>
                    <th className="py-2.5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-900 text-[11px]">
                  {timeframeTransactions.slice(0, 15).map(t => (
                    <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-amber-950/5">
                      <td className="py-2 text-slate-400 whitespace-nowrap">{new Date(t.date).toLocaleDateString('en-IN')}</td>
                      <td className="py-2 text-slate-800 dark:text-slate-300 font-bold truncate max-w-[100px]" title={t.category}>{t.category}</td>
                      <td className={`py-2 text-right font-black ${t.type === 'income' ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

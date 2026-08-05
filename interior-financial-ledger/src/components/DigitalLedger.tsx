/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, FormEvent } from 'react';
import { Transaction, Worker, Supplier, TransactionType, PaymentMethod } from '../types';
import { Search, ArrowDownCircle, ArrowUpCircle, Landmark, Coins, FileText, Calendar, Check } from 'lucide-react';

interface DigitalLedgerProps {
  projects: any[];
  transactions: Transaction[];
  workers: Worker[];
  suppliers: Supplier[];
  currentUser: any;
  addTransaction: (tx: any) => void;
  addProject: (proj: any) => void;
  onAddToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const LEDGER_CATEGORIES = [
  'Material Purchase',
  'Contractor Payment',
  'Labour Payment',
  'Site Expense',
  'Transportation',
  'Design Consultation',
  'Electrical',
  'Plumbing',
  'Painting',
  'Carpentry',
  'False Ceiling',
  'Tiles & Marble',
  'Furniture',
  'Modular Kitchen',
  'Wardrobe',
  'Hardware',
  'Lighting',
  'Miscellaneous'
];

export default function DigitalLedger({
  transactions,
  currentUser,
  addTransaction,
  onAddToast
}: DigitalLedgerProps) {
  // Form states
  const [txType, setTxType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 16)); // Date and time input (YYYY-MM-DDTHH:MM)
  const [category, setCategory] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_transfer');
  const [projectId, setProjectId] = useState<string>(''); // Free-form project name field now!

  // Extended Transaction Fields
  const [contractGivenBy, setContractGivenBy] = useState<string>('');
  const [siteLocation, setSiteLocation] = useState<string>('');
  const [assignedPerson, setAssignedPerson] = useState<string>('');
  const [assignedPersonMobile, setAssignedPersonMobile] = useState<string>('');
  const [screenshotBase64, setScreenshotBase64] = useState<string>('');

  // Image lightbox preview modal
  const [lightboxImage, setLightboxImage] = useState<{ src: string; title: string } | null>(null);

  // Dynamic Payment Field States
  // Bank Transfer
  const [bankName, setBankName] = useState<string>('');
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [transactionReference, setTransactionReference] = useState<string>('');
  const [transferDate, setTransferDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [bankRemarks, setBankRemarks] = useState<string>('');

  // UPI / GPay
  const [upiId, setUpiId] = useState<string>('');
  const [upiTxId, setUpiTxId] = useState<string>('');
  const [upiDate, setUpiDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [screenshotName, setScreenshotName] = useState<string>('');

  // Cash
  const [cashReceivedBy, setCashReceivedBy] = useState<string>('');
  const [cashVoucherNumber, setCashVoucherNumber] = useState<string>('');
  const [cashRemarks, setCashRemarks] = useState<string>('');

  // Cheque
  const [chequeNumber, setChequeNumber] = useState<string>('');
  const [chequeBankName, setChequeBankName] = useState<string>('');
  const [chequeDate, setChequeDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [chequeStatus, setChequeStatus] = useState<string>('pending');

  // Ledger Filter states
  const [filterProjectName, setFilterProjectName] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Handle transaction submit
  const handlePostTransaction = (e: FormEvent) => {
    e.preventDefault();

    if (!amount || Number(amount) <= 0) {
      onAddToast('Please specify a valid transaction amount', 'error');
      return;
    }

    if (!projectId.trim()) {
      onAddToast('Please enter a target Project Name (e.g. Modern Villa - Jubilee Hills)', 'error');
      return;
    }

    if (!category) {
      onAddToast('Please select a financial category', 'error');
      return;
    }

    if (!description.trim()) {
      onAddToast('Please input transaction notes', 'error');
      return;
    }

    // Role security validation: Lead Designer is no longer a role, but we simulate authorization checks based on role
    const numericAmount = Number(amount);

    // Dynamic payment notes compilation
    let paymentDetailString = '';
    if (paymentMethod === 'bank_transfer') {
      paymentDetailString = `[Bank Transfer] Bank: ${bankName || 'N/A'} | Acct: ${accountNumber || 'N/A'} | Ref: ${transactionReference || 'N/A'} | Transfer Date: ${transferDate || 'N/A'}${bankRemarks ? ` | Remarks: ${bankRemarks}` : ''}`;
    } else if (paymentMethod === 'upi') {
      paymentDetailString = `[UPI / GPay] ID: ${upiId || 'N/A'} | Tx ID: ${upiTxId || 'N/A'} | Date: ${upiDate || 'N/A'}${screenshotName ? ` | Screenshot: ${screenshotName}` : ''}`;
    } else if (paymentMethod === 'cash') {
      paymentDetailString = `[Cash] Received By: ${cashReceivedBy || 'N/A'} | Voucher #: ${cashVoucherNumber || 'N/A'}${cashRemarks ? ` | Remarks: ${cashRemarks}` : ''}`;
    } else if (paymentMethod === 'cheque') {
      paymentDetailString = `[Cheque] No: ${chequeNumber || 'N/A'} | Bank: ${chequeBankName || 'N/A'} | Cheque Date: ${chequeDate || 'N/A'} | Status: ${chequeStatus.toUpperCase()}`;
    }

    const compiledNotes = `${paymentDetailString}\nNotes: ${description.trim()}`;

    // Format ISO string date
    const formattedDate = new Date(date).toISOString();

    addTransaction({
      type: txType,
      amount: numericAmount,
      date: formattedDate,
      category,
      description: compiledNotes,
      paymentMethod,
      projectId: projectId.trim(), // Storing typed string name directly
      referenceType: 'none',
      referenceId: undefined,
      contractGivenBy: contractGivenBy.trim() || undefined,
      siteLocation: siteLocation.trim() || undefined,
      assignedPerson: assignedPerson.trim() || undefined,
      assignedPersonMobile: assignedPersonMobile.trim() || undefined,
      receiptBase64: screenshotBase64 || undefined,
      receiptName: screenshotName || undefined
    });

    onAddToast(`Recorded ${txType} entry of ${formatCurrency(numericAmount)} successfully!`, 'success');

    // Reset Form
    setAmount('');
    setDescription('');
    setProjectId('');
    setCategory('');
    setContractGivenBy('');
    setSiteLocation('');
    setAssignedPerson('');
    setAssignedPersonMobile('');
    setScreenshotBase64('');
    setBankName('');
    setAccountNumber('');
    setTransactionReference('');
    setUpiId('');
    setUpiTxId('');
    setScreenshotName('');
    setCashReceivedBy('');
    setCashVoucherNumber('');
    setCashRemarks('');
    setChequeNumber('');
    setChequeBankName('');
  };

  // Dynamically extract unique project names from stored transactions for filtering
  const uniqueProjectNames = Array.from(
    new Set(transactions.map(t => t.projectId).filter(Boolean))
  ).sort();

  // Filter and process running transaction view
  const getFilteredTransactions = () => {
    let list = [...transactions];

    // Filter by project
    if (filterProjectName !== 'all') {
      list = list.filter(t => t.projectId === filterProjectName);
    }

    // Filter by search text
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      list = list.filter(t =>
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.projectId.toLowerCase().includes(q) ||
        t.amount.toString().includes(q)
      );
    }

    return list;
  };

  const filteredTxs = getFilteredTransactions();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column - Manual ledger logger */}
      <div className="space-y-6 lg:col-span-1">
        <div className="bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-amber-500/20 p-5 rounded-2xl shadow-md">
          <h2 className="text-sm font-serif font-bold text-slate-900 dark:text-amber-400 mb-4 flex items-center gap-2 uppercase tracking-wide">
            <Coins className="h-4.5 w-4.5 text-amber-500" />
            <span>Post Ledger Transaction</span>
          </h2>

          <form onSubmit={handlePostTransaction} className="space-y-4 text-xs font-semibold">
            {/* Debit/Credit Toggle Buttons */}
            <div>
              <label className="block text-[10px] text-slate-400 dark:text-amber-500/60 uppercase tracking-widest mb-2 font-black">
                Ledger Entry Class
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTxType('expense')}
                  className={`py-2 rounded-xl border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    txType === 'expense'
                      ? 'bg-rose-500/10 text-rose-500 border-rose-500/30 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/60 font-black'
                      : 'border-slate-200 text-slate-500 dark:border-slate-800 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/30'
                  }`}
                >
                  <ArrowDownCircle className="h-4 w-4" />
                  <span>Debit (Payout)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTxType('income')}
                  className={`py-2 rounded-xl border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    txType === 'income'
                      ? 'bg-amber-500/10 text-amber-500 border-amber-500/30 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/60 font-black'
                      : 'border-slate-200 text-slate-500 dark:border-slate-800 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/30'
                  }`}
                >
                  <ArrowUpCircle className="h-4 w-4" />
                  <span>Credit (Inflow)</span>
                </button>
              </div>
            </div>

            {/* Project Name (Free-Form Text Field) */}
            <div>
              <label className="block text-[10px] text-slate-400 dark:text-amber-500/60 uppercase tracking-widest mb-1.5 font-black">
                Project Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Modern Villa - Jubilee Hills"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white outline-hidden focus:border-amber-500 dark:focus:border-amber-500 transition-colors text-xs font-semibold"
              />
              <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-1 block">
                Examples: Office Interior - Hitech City, Skyline Apartment - Madhapur
              </span>
            </div>

            {/* Extended Fields: Contract Given By & Site Location */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-slate-400 dark:text-amber-500/60 uppercase tracking-widest mb-1.5 font-black">
                  Contract Given By
                </label>
                <input
                  type="text"
                  placeholder="e.g. Architect, Owner"
                  value={contractGivenBy}
                  onChange={(e) => setContractGivenBy(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white outline-hidden focus:border-amber-500 dark:focus:border-amber-500 transition-colors text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 dark:text-amber-500/60 uppercase tracking-widest mb-1.5 font-black">
                  Site Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. Jubilee Hills, Rd 10"
                  value={siteLocation}
                  onChange={(e) => setSiteLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white outline-hidden focus:border-amber-500 dark:focus:border-amber-500 transition-colors text-xs font-semibold"
                />
              </div>
            </div>

            {/* Extended Fields: Assigned Person & Mobile Number */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-slate-400 dark:text-amber-500/60 uppercase tracking-widest mb-1.5 font-black">
                  Assigned Person
                </label>
                <input
                  type="text"
                  placeholder="e.g. Suresh Kumar"
                  value={assignedPerson}
                  onChange={(e) => setAssignedPerson(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white outline-hidden focus:border-amber-500 dark:focus:border-amber-500 transition-colors text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 dark:text-amber-500/60 uppercase tracking-widest mb-1.5 font-black">
                  Assigned Mobile
                </label>
                <input
                  type="text"
                  placeholder="e.g. +91 98765 43210"
                  value={assignedPersonMobile}
                  onChange={(e) => setAssignedPersonMobile(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white outline-hidden focus:border-amber-500 dark:focus:border-amber-500 transition-colors text-xs font-semibold"
                />
              </div>
            </div>

            {/* Amount & Date */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-slate-400 dark:text-amber-500/60 uppercase tracking-widest mb-1.5 font-black">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  placeholder="₹ e.g. 45000"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white outline-hidden focus:border-amber-500 dark:focus:border-amber-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 dark:text-amber-500/60 uppercase tracking-widest mb-1.5 font-black">
                  Date & Time
                </label>
                <input
                  type="datetime-local"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white outline-hidden focus:border-amber-500 dark:focus:border-amber-500 transition-colors"
                />
              </div>
            </div>

            {/* Financial Category */}
            <div>
              <label className="block text-[10px] text-slate-400 dark:text-amber-500/60 uppercase tracking-widest mb-1.5 font-black">
                Financial Category
              </label>
              <select
                value={category}
                required
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white outline-hidden focus:border-amber-500 dark:focus:border-amber-500 transition-colors"
              >
                <option value="">-- Choose Category --</option>
                {LEDGER_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-[10px] text-slate-400 dark:text-amber-500/60 uppercase tracking-widest mb-1.5 font-black">
                Payment Channel
              </label>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {[
                  { id: 'bank_transfer', label: 'Bank Transfer' },
                  { id: 'upi', label: 'UPI / GPay' },
                  { id: 'cash', label: 'Cash' },
                  { id: 'cheque', label: 'Cheque' }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setPaymentMethod(item.id as PaymentMethod)}
                    className={`py-2 rounded-lg border text-[10px] transition-all flex items-center justify-center gap-1 cursor-pointer font-bold ${
                      paymentMethod === item.id
                        ? 'bg-slate-950 text-amber-400 border-amber-500 dark:bg-amber-500/10 dark:text-amber-400 font-extrabold'
                        : 'border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/40'
                    }`}
                  >
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>

              {/* Dynamic Sub-Form Fields based on Payment Channel */}
              {paymentMethod === 'bank_transfer' && (
                <div className="bg-slate-50/50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-200/50 dark:border-amber-500/10 space-y-2.5">
                  <div className="text-[10px] uppercase font-black tracking-widest text-amber-500">Bank Details</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] text-slate-400 dark:text-slate-500 mb-0.5">Bank Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. HDFC Bank"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        className="w-full p-2 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 rounded-lg text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-slate-400 dark:text-slate-500 mb-0.5">Account Number</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 5010094837"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        className="w-full p-2 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 rounded-lg text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] text-slate-400 dark:text-slate-500 mb-0.5">Transaction Ref</label>
                      <input
                        type="text"
                        required
                        placeholder="RTGS Ref Number"
                        value={transactionReference}
                        onChange={(e) => setTransactionReference(e.target.value)}
                        className="w-full p-2 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 rounded-lg text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-slate-400 dark:text-slate-500 mb-0.5">Transfer Date</label>
                      <input
                        type="date"
                        required
                        value={transferDate}
                        onChange={(e) => setTransferDate(e.target.value)}
                        className="w-full p-2 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 rounded-lg text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[9px] text-slate-400 dark:text-slate-500 mb-0.5">Transfer Remarks</label>
                    <input
                      type="text"
                      placeholder="e.g. Material vendor NEFT"
                      value={bankRemarks}
                      onChange={(e) => setBankRemarks(e.target.value)}
                      className="w-full p-2 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 rounded-lg text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              )}

              {paymentMethod === 'upi' && (
                <div className="bg-slate-50/50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-200/50 dark:border-amber-500/10 space-y-2.5">
                  <div className="text-[10px] uppercase font-black tracking-widest text-amber-500">UPI / GPay Details</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] text-slate-400 dark:text-slate-500 mb-0.5">UPI ID</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. client@okaxis"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        className="w-full p-2 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 rounded-lg text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-slate-400 dark:text-slate-500 mb-0.5">Transaction ID</label>
                      <input
                        type="text"
                        required
                        placeholder="UPI Ref ID"
                        value={upiTxId}
                        onChange={(e) => setUpiTxId(e.target.value)}
                        className="w-full p-2 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 rounded-lg text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] text-slate-400 dark:text-slate-500 mb-0.5">Transfer Date</label>
                      <input
                        type="date"
                        required
                        value={upiDate}
                        onChange={(e) => setUpiDate(e.target.value)}
                        className="w-full p-2 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 rounded-lg text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-slate-400 dark:text-slate-500 mb-0.5">Receipt Attachment</label>
                      <input
                        id="receipt-upload-input"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setScreenshotBase64(reader.result as string);
                              setScreenshotName(file.name);
                              onAddToast(`Receipt uploaded: ${file.name}`, 'success');
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      {screenshotBase64 ? (
                        <div className="flex items-center gap-2 mt-1 bg-slate-100 dark:bg-slate-950 p-2 rounded-xl border border-slate-200/50 dark:border-amber-500/10">
                          <img
                            src={screenshotBase64}
                            alt="Receipt Preview"
                            onClick={() => setLightboxImage({ src: screenshotBase64, title: screenshotName })}
                            className="h-12 w-12 object-cover rounded-lg border border-slate-300 dark:border-slate-800 cursor-pointer hover:opacity-80 transition-opacity shrink-0"
                            referrerPolicy="no-referrer"
                          />
                          <div className="min-w-0 flex-1 space-y-1">
                            <p className="text-[9px] text-slate-800 dark:text-slate-200 font-bold truncate">{screenshotName}</p>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => document.getElementById('receipt-upload-input')?.click()}
                                className="text-[9px] text-amber-600 hover:underline font-extrabold uppercase cursor-pointer"
                              >
                                Replace
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setScreenshotBase64('');
                                  setScreenshotName('');
                                  onAddToast('Receipt attachment removed', 'info');
                                }}
                                className="text-[9px] text-rose-600 hover:underline font-extrabold uppercase cursor-pointer"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <button
                            type="button"
                            onClick={() => document.getElementById('receipt-upload-input')?.click()}
                            className="w-full py-2 px-3 border border-dashed border-slate-300 dark:border-slate-800 hover:border-amber-500 dark:hover:border-amber-500 rounded-lg text-[10px] text-slate-500 dark:text-slate-400 font-bold transition-all bg-white dark:bg-slate-950 text-center cursor-pointer"
                          >
                            Upload Screenshot
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === 'cash' && (
                <div className="bg-slate-50/50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-200/50 dark:border-amber-500/10 space-y-2.5">
                  <div className="text-[10px] uppercase font-black tracking-widest text-amber-500">Cash Settlement</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] text-slate-400 dark:text-slate-500 mb-0.5">Received By</label>
                      <input
                        type="text"
                        required
                        placeholder="Full Name"
                        value={cashReceivedBy}
                        onChange={(e) => setCashReceivedBy(e.target.value)}
                        className="w-full p-2 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 rounded-lg text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-slate-400 dark:text-slate-500 mb-0.5">Voucher Number</label>
                      <input
                        type="text"
                        required
                        placeholder="Cash Slip Voucher"
                        value={cashVoucherNumber}
                        onChange={(e) => setCashVoucherNumber(e.target.value)}
                        className="w-full p-2 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 rounded-lg text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[9px] text-slate-400 dark:text-slate-500 mb-0.5">Remarks / Handover notes</label>
                    <input
                      type="text"
                      placeholder="e.g. Petty cash handed over for site expenses"
                      value={cashRemarks}
                      onChange={(e) => setCashRemarks(e.target.value)}
                      className="w-full p-2 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 rounded-lg text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              )}

              {paymentMethod === 'cheque' && (
                <div className="bg-slate-50/50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-200/50 dark:border-amber-500/10 space-y-2.5">
                  <div className="text-[10px] uppercase font-black tracking-widest text-amber-500">Cheque details</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] text-slate-400 dark:text-slate-500 mb-0.5">Cheque Number</label>
                      <input
                        type="text"
                        required
                        placeholder="6 Digit Cheque No."
                        value={chequeNumber}
                        onChange={(e) => setChequeNumber(e.target.value)}
                        className="w-full p-2 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 rounded-lg text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-slate-400 dark:text-slate-500 mb-0.5">Bank Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. HDFC, ICICI"
                        value={chequeBankName}
                        onChange={(e) => setChequeBankName(e.target.value)}
                        className="w-full p-2 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 rounded-lg text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] text-slate-400 dark:text-slate-500 mb-0.5">Cheque Date</label>
                      <input
                        type="date"
                        required
                        value={chequeDate}
                        onChange={(e) => setChequeDate(e.target.value)}
                        className="w-full p-2 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 rounded-lg text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-slate-400 dark:text-slate-500 mb-0.5">Clearing Status</label>
                      <select
                        value={chequeStatus}
                        onChange={(e) => setChequeStatus(e.target.value)}
                        className="w-full p-2 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 rounded-lg text-slate-900 dark:text-white"
                      >
                        <option value="pending">Pending Clearing</option>
                        <option value="cleared">Cleared</option>
                        <option value="bounced">Bounced</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bookkeeping Memo / Notes */}
            <div>
              <label className="block text-[10px] text-slate-400 dark:text-amber-500/60 uppercase tracking-widest mb-1.5 font-black">
                Transaction Notes
              </label>
              <textarea
                placeholder="Example: Advance payment for modular kitchen materials, Invoice #INV-2054, UPI Ref: 8456123897."
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white outline-hidden focus:border-amber-500 dark:focus:border-amber-500 transition-colors font-medium"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-slate-950 hover:bg-slate-900 text-amber-400 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400 rounded-xl font-bold transition-all mt-2 cursor-pointer shadow-sm text-center uppercase tracking-wider text-[11px]"
            >
              Post Ledger Entry
            </button>
          </form>
        </div>
      </div>

      {/* Right Column - Live Running ledger stream */}
      <div className="lg:col-span-2 space-y-4">
        {/* Digital Ledger Header Controls */}
        <div className="bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-amber-500/15 p-5 rounded-2xl shadow-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-serif font-bold text-slate-900 dark:text-amber-400 uppercase tracking-wider">
                INCHX Ledger Stream
              </h2>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                Credits shown in <span className="text-emerald-600 dark:text-emerald-400 font-bold">green</span>, Debits in <span className="text-rose-600 dark:text-rose-400 font-bold">red</span>. Indian Rupee (₹) format.
              </p>
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search ledger..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 rounded-lg text-[11px] outline-hidden w-40 font-semibold"
                />
              </div>

              <select
                value={filterProjectName}
                onChange={(e) => setFilterProjectName(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-lg text-[11px] font-semibold outline-hidden"
              >
                <option value="all">All Projects</option>
                {uniqueProjectNames.map(pName => (
                  <option key={pName} value={pName}>{pName}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Running Balance Stream Layout */}
          <div className="mt-6 space-y-3.5">
            {filteredTxs.map((tx) => {
              const isIncome = tx.type === 'income';
              
              // Simple extraction of real user notes without internal payment tags
              let displayedNotes = tx.description;
              let paymentTags = '';
              const notesSplit = tx.description.split('\nNotes:');
              if (notesSplit.length > 1) {
                paymentTags = notesSplit[0];
                displayedNotes = notesSplit[1];
              }

              return (
                <div
                  key={tx.id}
                  className="group relative flex items-start justify-between p-4 border border-slate-100 dark:border-slate-900 hover:border-slate-200 dark:hover:border-slate-800 hover:bg-slate-50/40 dark:hover:bg-slate-950/10 rounded-xl transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-xl shrink-0 ${
                      isIncome
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'
                        : 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400'
                    }`}>
                      {isIncome ? <ArrowUpCircle className="h-5 w-5" /> : <ArrowDownCircle className="h-5 w-5" />}
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                          {tx.projectId || 'General Studio Overhead'}
                        </span>
                        <span className="px-1.5 py-0.5 rounded-sm bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[9px] font-bold">
                          {tx.category}
                        </span>
                        {tx.invoiceNumber && (
                          <span className="px-1.5 py-0.5 rounded-sm bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-300 text-[9px] font-bold">
                            BILL: {tx.invoiceNumber}
                          </span>
                        )}
                      </div>
                      
                      <p className="text-xs text-slate-800 dark:text-slate-300 font-medium">
                        {displayedNotes}
                      </p>

                      {/* Extended Fields metadata display */}
                      {(tx.contractGivenBy || tx.siteLocation || tx.assignedPerson) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-[10px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/30 p-2 rounded-lg mt-1 border border-slate-200/40 dark:border-slate-800/20 font-bold">
                          {tx.contractGivenBy && (
                            <div>
                              <span className="text-slate-400">Contract By:</span> <span className="text-slate-800 dark:text-slate-200">{tx.contractGivenBy}</span>
                            </div>
                          )}
                          {tx.siteLocation && (
                            <div>
                              <span className="text-slate-400">Location:</span> <span className="text-slate-800 dark:text-slate-200">{tx.siteLocation}</span>
                            </div>
                          )}
                          {tx.assignedPerson && (
                            <div className="md:col-span-2">
                              <span className="text-slate-400">Assigned To:</span> <span className="text-slate-800 dark:text-slate-200">{tx.assignedPerson} {tx.assignedPersonMobile ? `(${tx.assignedPersonMobile})` : ''}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Receipt attachment preview thumbnail */}
                      {tx.receiptBase64 && (
                        <div className="mt-1.5 flex items-center gap-2 bg-amber-500/5 p-1.5 rounded-lg border border-amber-500/10 w-fit">
                          <span className="text-[9px] text-slate-400 font-bold uppercase">Receipt:</span>
                          <img
                            src={tx.receiptBase64}
                            alt="Receipt"
                            onClick={() => setLightboxImage({ src: tx.receiptBase64!, title: tx.receiptName || 'Receipt Attachment' })}
                            className="h-8 w-8 object-cover rounded border border-slate-200 dark:border-slate-800 cursor-pointer hover:scale-105 transition-transform"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}

                      {paymentTags && (
                        <p className="text-[10px] text-slate-500 dark:text-amber-500/60 italic font-medium leading-normal bg-slate-50 dark:bg-slate-900/40 p-1.5 rounded-md mt-1 border border-slate-200/50 dark:border-slate-800/40">
                          {paymentTags}
                        </p>
                      )}

                      <div className="text-[9px] text-slate-400 dark:text-slate-500 flex items-center gap-2 font-bold uppercase tracking-wider pt-1">
                        <span>
                          {new Date(tx.date).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        <span>•</span>
                        <span className="text-amber-500">{tx.paymentMethod.replace('_', ' ')}</span>
                        <span>•</span>
                        <span>Logged by: {tx.approvedBy || 'Office Staff'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 ml-4 flex flex-col justify-between items-end h-full">
                    <div className={`text-sm font-extrabold font-serif ${
                      isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}>
                      {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
                    </div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-4 font-bold">
                      Bal: <span className="text-slate-600 dark:text-amber-500/80 font-serif">{formatCurrency(tx.runningBalance)}</span>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredTxs.length === 0 && (
              <div className="text-center py-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                <p className="text-slate-400 dark:text-slate-500 text-xs">
                  No transaction history logged for this view.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox Preview Modal */}
      {lightboxImage && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xs flex flex-col items-center justify-center p-4">
          <div className="max-w-3xl w-full flex flex-col gap-3 relative">
            <div className="flex items-center justify-between text-white border-b border-white/10 pb-3">
              <span className="text-xs uppercase font-extrabold tracking-widest text-amber-400">{lightboxImage.title}</span>
              <button
                onClick={() => setLightboxImage(null)}
                className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-white font-extrabold uppercase cursor-pointer"
              >
                Close ✕
              </button>
            </div>
            
            <div className="bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center p-2 max-h-[70vh]">
              <img
                src={lightboxImage.src}
                alt="Enlarged Receipt"
                className="max-h-full max-w-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="flex justify-end gap-3 mt-2">
              <a
                href={lightboxImage.src}
                download={lightboxImage.title || 'receipt-attachment.png'}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black px-4 py-2 rounded-xl transition-colors shadow-lg uppercase tracking-wider text-center"
              >
                Download Receipt ➜
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { SystemUser } from '../types';
import {
  KeyRound,
  UserPlus,
  Trash2,
  Edit3,
  Building2,
  Shield,
  Upload,
  Globe,
  Palette,
  CheckCircle,
  FileCode,
  QrCode,
  FileText,
  Calendar,
  Coins,
  Eye,
  CheckSquare,
  Info,
  Layers,
  CreditCard,
  Percent
} from 'lucide-react';

interface AdminSettingsProps {
  users: SystemUser[];
  currentUser: any;
  adminUpdateUserCredentials: (userId: string, email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  adminAddAccountant: (name: string, email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  adminDeleteUser: (userId: string) => Promise<{ success: boolean; error?: string }>;
  onAddToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  companySettings?: any;
  updateCompanySettings?: (settings: any) => void;
}

export default function AdminSettings({
  users,
  currentUser,
  adminUpdateUserCredentials,
  adminAddAccountant,
  adminDeleteUser,
  onAddToast,
  companySettings,
  updateCompanySettings
}: AdminSettingsProps) {
  const [activeTab, setActiveTab] = useState<'company' | 'access'>('company');

  // Update credentials states
  const [selectedUserToEdit, setSelectedUserToEdit] = useState<string>('');
  const [editEmail, setEditEmail] = useState<string>('');
  const [editPassword, setEditPassword] = useState<string>('');

  // Add new accountant states
  const [newAccName, setNewAccName] = useState<string>('');
  const [newAccEmail, setNewAccEmail] = useState<string>('');
  const [newAccPassword, setNewAccPassword] = useState<string>('');

  // Refs for local file uploads
  const logoInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);
  const qrCodeInputRef = useRef<HTMLInputElement>(null);

  // SECTION 1 - Company Profile states
  const [companyName, setCompanyName] = useState(companySettings?.name || "KALKI'S INCHX INTERIO");
  const [companyAddress, setCompanyAddress] = useState(companySettings?.address || 'Skyline Business Enclave, Level 4, Jubilee Hills, Hyderabad');
  const [companyPhone, setCompanyPhone] = useState(companySettings?.phone || '+91 98765 43210');
  const [companyEmail, setCompanyEmail] = useState(companySettings?.email || 'studio@inchx.com');
  const [companyGst, setCompanyGst] = useState(companySettings?.gstNumber || '36AAFCD2948R1Z1');
  const [panNumber, setPanNumber] = useState(companySettings?.panNumber || 'ABCDE1234F');
  const [website, setWebsite] = useState(companySettings?.website || 'www.inchx.com');
  const [city, setCity] = useState(companySettings?.city || 'Hyderabad');
  const [state, setState] = useState(companySettings?.state || 'Telangana');
  const [country, setCountry] = useState(companySettings?.country || 'India');
  const [pincode, setPincode] = useState(companySettings?.pincode || '500033');
  const [logoBase64, setLogoBase64] = useState(companySettings?.logo || '');
  const [signatureBase64, setSignatureBase64] = useState(companySettings?.signature || '');

  // SECTION 2 - Invoice Settings states
  const [invoicePrefix, setInvoicePrefix] = useState(companySettings?.invoicePrefix || 'INC');
  const [invoiceFormat, setInvoiceFormat] = useState(companySettings?.invoiceFormat || 'INC-2026-001');
  const [defaultGst, setDefaultGst] = useState(companySettings?.defaultGst !== undefined ? companySettings.defaultGst : 18);
  const [paymentDueDays, setPaymentDueDays] = useState(companySettings?.paymentDueDays !== undefined ? companySettings.paymentDueDays : 15);
  const [termsAndConditions, setTermsAndConditions] = useState(companySettings?.termsAndConditions || '1. All payments should be made in favor of KALKI\'S INCHX INTERIO.\n2. 50% advance is required to initiate structural designing and layout development.\n3. Goods once sold cannot be taken back or exchanged.\n4. Subject to local jurisdiction.');
  const [invoiceFooterNotes, setInvoiceFooterNotes] = useState(companySettings?.invoiceFooterNotes || 'Thank you for your business! Renders under authorized local jurisdiction.');
  const [authorizedSignatoryName, setAuthorizedSignatoryName] = useState(companySettings?.authorizedSignatoryName || companySettings?.directorName || 'Kalki Prasad');
  const [designation, setDesignation] = useState(companySettings?.designation || 'Studio Principal Director');
  const [showSignatureOnInvoice, setShowSignatureOnInvoice] = useState(companySettings?.showSignatureOnInvoice !== undefined ? companySettings.showSignatureOnInvoice : true);

  // SECTION 3 - Bank Details states
  const [accountName, setAccountName] = useState(companySettings?.accountName || "KALKI'S INCHX INTERIO");
  const [bankName, setBankName] = useState(companySettings?.bankName || 'HDFC Bank Ltd');
  const [accountNumber, setAccountNumber] = useState(companySettings?.accountNumber || '50200084729402');
  const [ifscCode, setIfscCode] = useState(companySettings?.ifscCode || 'HDFC0000041');
  const [branchName, setBranchName] = useState(companySettings?.branchName || 'Jubilee Hills, Hyderabad');
  const [upiId, setUpiId] = useState(companySettings?.upiId || 'kalki-inchx@okhdfcbank');
  const [qrCodeBase64, setQrCodeBase64] = useState(companySettings?.qrCodeBase64 || '');

  // SECTION 4 - Financial Preferences states
  const [currency, setCurrency] = useState(companySettings?.currency || 'INR');
  const [theme, setTheme] = useState(companySettings?.theme || 'dark');
  const [financialYear, setFinancialYear] = useState(companySettings?.financialYear || '2026-2027');
  const [dateFormat, setDateFormat] = useState(companySettings?.dateFormat || 'DD-MM-YYYY');
  const [numberFormat, setNumberFormat] = useState(companySettings?.numberFormat || 'en-IN');
  const [autoInvoiceNumber, setAutoInvoiceNumber] = useState(companySettings?.autoInvoiceNumber !== undefined ? companySettings.autoInvoiceNumber : true);
  const [autoProjectCode, setAutoProjectCode] = useState(companySettings?.autoProjectCode !== undefined ? companySettings.autoProjectCode : true);

  // SECTION 5 - Export Preferences states
  const [exportIncludeLogo, setExportIncludeLogo] = useState(companySettings?.exportIncludeLogo !== undefined ? companySettings.exportIncludeLogo : true);
  const [exportIncludeSignature, setExportIncludeSignature] = useState(companySettings?.exportIncludeSignature !== undefined ? companySettings.exportIncludeSignature : true);
  const [exportIncludeGst, setExportIncludeGst] = useState(companySettings?.exportIncludeGst !== undefined ? companySettings.exportIncludeGst : true);
  const [exportIncludeBankDetails, setExportIncludeBankDetails] = useState(companySettings?.exportIncludeBankDetails !== undefined ? companySettings.exportIncludeBankDetails : true);
  const [exportIncludeFooterNotes, setExportIncludeFooterNotes] = useState(companySettings?.exportIncludeFooterNotes !== undefined ? companySettings.exportIncludeFooterNotes : true);
  const [exportWatermark, setExportWatermark] = useState(companySettings?.exportWatermark !== undefined ? companySettings.exportWatermark : false);

  // File readers
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        onAddToast('Logo image must be smaller than 2MB.', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setLogoBase64(base64);
        onAddToast('Logo uploaded successfully!', 'success');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1.5 * 1024 * 1024) {
        onAddToast('Signature image must be smaller than 1.5MB.', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setSignatureBase64(base64);
        onAddToast('Authorized Signature uploaded successfully!', 'success');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleQrCodeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1.5 * 1024 * 1024) {
        onAddToast('QR Code image must be smaller than 1.5MB.', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setQrCodeBase64(base64);
        onAddToast('QR Code uploaded successfully!', 'success');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveCompanySettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!updateCompanySettings) return;

    updateCompanySettings({
      name: companyName,
      address: companyAddress,
      phone: companyPhone,
      email: companyEmail,
      gstNumber: companyGst,
      directorName: authorizedSignatoryName, // Keep synced with directorName for older views
      invoicePrefix,
      currency,
      theme,
      logo: logoBase64,
      signature: signatureBase64,
      website,
      city,
      state,
      country,
      pincode,
      invoiceFormat,
      defaultGst: Number(defaultGst),
      termsAndConditions,
      bankName,
      accountName,
      accountNumber,
      ifscCode,
      branchName,
      upiId,
      panNumber,
      paymentDueDays: Number(paymentDueDays),
      invoiceFooterNotes,
      authorizedSignatoryName,
      designation,
      showSignatureOnInvoice,
      qrCodeBase64,
      financialYear,
      dateFormat,
      numberFormat,
      autoInvoiceNumber,
      autoProjectCode,
      exportIncludeLogo,
      exportIncludeSignature,
      exportIncludeGst,
      exportIncludeBankDetails,
      exportIncludeFooterNotes,
      exportWatermark
    });

    onAddToast('Company settings updated and propagated successfully!', 'success');
  };

  const handleSelectUser = (userId: string) => {
    setSelectedUserToEdit(userId);
    const u = users.find(usr => usr.id === userId);
    if (u) {
      setEditEmail(u.email);
    }
    setEditPassword('');
  };

  const handleUpdateCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserToEdit) {
      onAddToast('Please select a system user to edit.', 'error');
      return;
    }
    if (!editEmail.trim() || !editEmail.includes('@')) {
      onAddToast('Please enter a valid email address.', 'error');
      return;
    }

    const res = await adminUpdateUserCredentials(selectedUserToEdit, editEmail, editPassword);
    if (res.success) {
      onAddToast('Credentials updated successfully!', 'success');
      setEditPassword('');
      setSelectedUserToEdit('');
    } else {
      onAddToast(res.error || 'Failed to update credentials.', 'error');
    }
  };

  const handleAddAccountant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccName.trim()) {
      onAddToast('Please provide the accountant\'s name.', 'error');
      return;
    }
    if (!newAccEmail.trim() || !newAccEmail.includes('@')) {
      onAddToast('Please provide a valid email.', 'error');
      return;
    }
    if (!newAccPassword || newAccPassword.length < 4) {
      onAddToast('Password must be at least 4 characters.', 'error');
      return;
    }

    const res = await adminAddAccountant(newAccName, newAccEmail, newAccPassword);
    if (res.success) {
      onAddToast(`Accountant registered successfully: ${newAccName}`, 'success');
      setNewAccName('');
      setNewAccEmail('');
      setNewAccPassword('');
    } else {
      onAddToast(res.error || 'Failed to add accountant.', 'error');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const u = users.find(usr => usr.id === userId);
    if (!u) return;

    if (u.id === currentUser.id) {
      onAddToast('You cannot delete your own logged-in admin account!', 'error');
      return;
    }

    if (window.confirm(`Are you absolutely sure you want to delete the user account: ${u.name}?`)) {
      const res = await adminDeleteUser(userId);
      if (res.success) {
        onAddToast(`User "${u.name}" deleted successfully.`, 'success');
      } else {
        onAddToast(res.error || 'Failed to delete user.', 'error');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Settings Tab Selector Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-serif font-black text-slate-900 dark:text-amber-400 uppercase tracking-wider">
            Company Settings
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-widest mt-0.5">
            Manage profile, invoice defaults, banking coordinates, and dynamic outputs
          </p>
        </div>

        <div className="inline-flex bg-slate-100 dark:bg-slate-950 p-1.5 rounded-2xl border border-slate-200/50 dark:border-slate-900">
          <button
            onClick={() => setActiveTab('company')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'company'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-amber-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Building2 className="h-4 w-4" />
              Company Settings
            </span>
          </button>
          <button
            onClick={() => setActiveTab('access')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'access'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-amber-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Shield className="h-4 w-4" />
              Access Control
            </span>
          </button>
        </div>
      </div>

      {activeTab === 'company' ? (
        <form onSubmit={handleSaveCompanySettings} className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs font-semibold">
          
          {/* Main settings items (Left 2 Columns) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* SECTION 1 - Company Profile */}
            <div className="bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-900 p-6 rounded-3xl shadow-md space-y-4">
              <h2 className="text-xs font-serif font-black text-slate-900 dark:text-amber-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 dark:border-slate-900 pb-3">
                <Building2 className="h-4.5 w-4.5 text-amber-500" />
                <span>SECTION 1 - Company Profile</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-black">
                    Company Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. KALKI'S INCHX INTERIO"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white outline-hidden focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-black">
                    GSTIN (GST Registration No)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 36AAFCD2948R1Z1"
                    value={companyGst}
                    onChange={(e) => setCompanyGst(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white outline-hidden focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-black">
                    PAN Number (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ABCDE1234F"
                    value={panNumber}
                    onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white outline-hidden focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-black">
                    Company Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. studio@inchx.com"
                    value={companyEmail}
                    onChange={(e) => setCompanyEmail(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white outline-hidden focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-black">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. +91 98765 43210"
                    value={companyPhone}
                    onChange={(e) => setCompanyPhone(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white outline-hidden focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-black">
                    Website URL
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. www.inchx.com"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white outline-hidden focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="block text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-black">
                    Office Address
                  </label>
                  <textarea
                    required
                    rows={2}
                    placeholder="Skyline Business Enclave, Level 4, Jubilee Hills"
                    value={companyAddress}
                    onChange={(e) => setCompanyAddress(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white outline-hidden focus:border-amber-500 resize-none leading-normal"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-black">
                    City
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Hyderabad"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white outline-hidden focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-black">
                    State
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Telangana"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white outline-hidden focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-black">
                    Country
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. India"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white outline-hidden focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-black">
                    Pincode
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 500033"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white outline-hidden focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Company Logo & Signature Upload Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-900 pt-4 mt-2">
                {/* Logo Upload */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-black">
                    Company Logo Upload
                  </label>
                  <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-2xl border border-slate-200/40 dark:border-slate-800/60">
                    {logoBase64 ? (
                      <div className="relative group shrink-0">
                        <img src={logoBase64} alt="Logo" className="h-12 w-12 object-contain rounded-lg border border-slate-200 dark:border-slate-800 bg-white p-0.5" referrerPolicy="no-referrer" />
                        <button
                          type="button"
                          onClick={() => setLogoBase64('')}
                          className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white p-0.5 rounded-full text-[8px] hover:bg-rose-600 transition-colors cursor-pointer"
                        >
                          &times;
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        className="h-12 w-12 border border-dashed border-slate-300 dark:border-slate-800 hover:border-amber-500/50 rounded-lg flex flex-col items-center justify-center text-slate-400 hover:text-amber-500 transition-all cursor-pointer shrink-0"
                      >
                        <Upload className="h-4 w-4" />
                      </button>
                    )}
                    <div className="text-left">
                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        className="text-[10px] text-amber-500 font-bold hover:underline cursor-pointer uppercase tracking-wider"
                      >
                        Choose Logo Image
                      </button>
                      <div className="text-[8px] text-slate-400">PNG/JPG under 2MB</div>
                    </div>
                    <input type="file" ref={logoInputRef} onChange={handleLogoUpload} accept="image/png, image/jpeg" className="hidden" />
                  </div>
                </div>

                {/* Signature Upload */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-black">
                    Company Signature Upload
                  </label>
                  <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-2xl border border-slate-200/40 dark:border-slate-800/60">
                    {signatureBase64 ? (
                      <div className="relative group shrink-0">
                        <img src={signatureBase64} alt="Signature" className="h-12 w-20 object-contain rounded-lg border border-slate-200 dark:border-slate-800 bg-white p-0.5" referrerPolicy="no-referrer" />
                        <button
                          type="button"
                          onClick={() => setSignatureBase64('')}
                          className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white p-0.5 rounded-full text-[8px] hover:bg-rose-600 transition-colors cursor-pointer"
                        >
                          &times;
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => signatureInputRef.current?.click()}
                        className="h-12 w-12 border border-dashed border-slate-300 dark:border-slate-800 hover:border-amber-500/50 rounded-lg flex flex-col items-center justify-center text-slate-400 hover:text-amber-500 transition-all cursor-pointer shrink-0"
                      >
                        <Palette className="h-4 w-4" />
                      </button>
                    )}
                    <div className="text-left">
                      <button
                        type="button"
                        onClick={() => signatureInputRef.current?.click()}
                        className="text-[10px] text-amber-500 font-bold hover:underline cursor-pointer uppercase tracking-wider"
                      >
                        Choose Signature Image
                      </button>
                      <div className="text-[8px] text-slate-400">PNG/JPG under 1.5MB</div>
                    </div>
                    <input type="file" ref={signatureInputRef} onChange={handleSignatureUpload} accept="image/png, image/jpeg" className="hidden" />
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2 - Invoice Settings */}
            <div className="bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-900 p-6 rounded-3xl shadow-md space-y-4">
              <h2 className="text-xs font-serif font-black text-slate-900 dark:text-amber-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 dark:border-slate-900 pb-3">
                <FileCode className="h-4.5 w-4.5 text-amber-500" />
                <span>SECTION 2 - Invoice Settings</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-black">
                    Invoice Prefix
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. INC"
                    value={invoicePrefix}
                    onChange={(e) => setInvoicePrefix(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white outline-hidden focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-black">
                    Invoice Number Format
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. INC-2026-001"
                    value={invoiceFormat}
                    onChange={(e) => setInvoiceFormat(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white outline-hidden focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-black">
                    Default GST %
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    max={100}
                    placeholder="e.g. 18"
                    value={defaultGst}
                    onChange={(e) => setDefaultGst(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white outline-hidden focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-black">
                    Payment Due Days
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    placeholder="e.g. 15"
                    value={paymentDueDays}
                    onChange={(e) => setPaymentDueDays(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white outline-hidden focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-black">
                    Authorized Signatory Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kalki Prasad"
                    value={authorizedSignatoryName}
                    onChange={(e) => setAuthorizedSignatoryName(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white outline-hidden focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-black">
                    Designation
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Studio Principal Director"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white outline-hidden focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-3">
                  <label className="block text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-black">
                    Terms & Conditions
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Enter terms and conditions (renders on bottom of invoice)..."
                    value={termsAndConditions}
                    onChange={(e) => setTermsAndConditions(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white outline-hidden focus:border-amber-500 leading-normal"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-3">
                  <label className="block text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-black">
                    Invoice Footer Notes
                  </label>
                  <textarea
                    required
                    rows={2}
                    placeholder="Enter invoice footer notes..."
                    value={invoiceFooterNotes}
                    onChange={(e) => setInvoiceFooterNotes(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white outline-hidden focus:border-amber-500 leading-normal"
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200/40 dark:border-slate-800/60 md:col-span-3">
                  <div className="space-y-0.5">
                    <div className="text-[10px] uppercase font-black tracking-wider text-slate-800 dark:text-slate-200">Show Signature on Invoice</div>
                    <div className="text-[9px] text-slate-400">If toggled, the uploaded signature will be displayed on client bills.</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowSignatureOnInvoice(!showSignatureOnInvoice)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                      showSignatureOnInvoice ? 'bg-amber-500' : 'bg-slate-200 dark:bg-slate-800'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        showSignatureOnInvoice ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* SECTION 3 - Bank Details */}
            <div className="bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-900 p-6 rounded-3xl shadow-md space-y-4">
              <h2 className="text-xs font-serif font-black text-slate-900 dark:text-amber-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 dark:border-slate-900 pb-3">
                <CreditCard className="h-4.5 w-4.5 text-amber-500" />
                <span>SECTION 3 - Bank Details</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-black">
                    Account Holder Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. KALKI'S INCHX INTERIO"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white outline-hidden focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-black">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. HDFC Bank Ltd"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white outline-hidden focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-black">
                    Account Number
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 50200084729402"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white outline-hidden focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-black">
                    IFSC Code
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. HDFC0000041"
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white outline-hidden focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-black">
                    Branch Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Jubilee Hills, Hyderabad"
                    value={branchName}
                    onChange={(e) => setBranchName(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white outline-hidden focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-black">
                    UPI ID
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. kalki-inchx@okhdfcbank"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white outline-hidden focus:border-amber-500"
                  />
                </div>

                <div className="md:col-span-2 space-y-1.5 border-t border-slate-100 dark:border-slate-900 pt-4 mt-2">
                  <label className="block text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-black">
                    QR Code Upload (UPI Payments)
                  </label>
                  <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-2xl border border-slate-200/40 dark:border-slate-800/60">
                    {qrCodeBase64 ? (
                      <div className="relative group shrink-0">
                        <img src={qrCodeBase64} alt="QR Code" className="h-16 w-16 object-contain rounded-lg border border-slate-200 dark:border-slate-800 bg-white p-0.5" referrerPolicy="no-referrer" />
                        <button
                          type="button"
                          onClick={() => setQrCodeBase64('')}
                          className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white p-0.5 rounded-full text-[8px] hover:bg-rose-600 transition-colors cursor-pointer"
                        >
                          &times;
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => qrCodeInputRef.current?.click()}
                        className="h-16 w-16 border border-dashed border-slate-300 dark:border-slate-800 hover:border-amber-500/50 rounded-lg flex flex-col items-center justify-center text-slate-400 hover:text-amber-500 transition-all cursor-pointer shrink-0"
                      >
                        <QrCode className="h-5 w-5" />
                      </button>
                    )}
                    <div className="text-left">
                      <button
                        type="button"
                        onClick={() => qrCodeInputRef.current?.click()}
                        className="text-[10px] text-amber-500 font-bold hover:underline cursor-pointer uppercase tracking-wider"
                      >
                        Choose UPI QR Image
                      </button>
                      <div className="text-[8px] text-slate-400 mb-1">JPEG/PNG formatted QR code for dynamic bank remittance scans.</div>
                    </div>
                    <input type="file" ref={qrCodeInputRef} onChange={handleQrCodeUpload} accept="image/png, image/jpeg" className="hidden" />
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 4 - Financial Preferences */}
            <div className="bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-900 p-6 rounded-3xl shadow-md space-y-4">
              <h2 className="text-xs font-serif font-black text-slate-900 dark:text-amber-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 dark:border-slate-900 pb-3">
                <Coins className="h-4.5 w-4.5 text-amber-500" />
                <span>SECTION 4 - Financial Preferences</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-black">
                    Currency Symbol
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white outline-hidden focus:border-amber-500 cursor-pointer"
                  >
                    <option value="INR">INR (₹) - Indian Rupee</option>
                    <option value="USD">USD ($) - US Dollar</option>
                    <option value="EUR">EUR (€) - Euro</option>
                    <option value="GBP">GBP (£) - British Pound</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-black">
                    Financial Year
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 2026-2027"
                    value={financialYear}
                    onChange={(e) => setFinancialYear(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white outline-hidden focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-black">
                    Date Format
                  </label>
                  <select
                    value={dateFormat}
                    onChange={(e) => setDateFormat(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white outline-hidden focus:border-amber-500 cursor-pointer"
                  >
                    <option value="DD-MM-YYYY">DD-MM-YYYY (e.g. 05-08-2026)</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-08-05)</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 08/05/2026)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-black">
                    Number Format
                  </label>
                  <select
                    value={numberFormat}
                    onChange={(e) => setNumberFormat(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white outline-hidden focus:border-amber-500 cursor-pointer"
                  >
                    <option value="en-IN">Indian Format (Lakhs, Crores - ₹4,00,000.00)</option>
                    <option value="en-US">Western Format (Millions, Billions - $400,000.00)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-black">
                    Corporate Theme Scheme
                  </label>
                  <select
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white outline-hidden focus:border-amber-500 cursor-pointer"
                  >
                    <option value="dark">Calm Charcoal Theme (Dark)</option>
                    <option value="light">Refined Studio Scheme (Light)</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:col-span-2 pt-2 border-t border-slate-100 dark:border-slate-900">
                  {/* Auto Invoice Number Toggle */}
                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200/40 dark:border-slate-800/60">
                    <div className="space-y-0.5">
                      <div className="text-[10px] uppercase font-black tracking-wider text-slate-800 dark:text-slate-200">Auto Invoice Number</div>
                      <div className="text-[8px] text-slate-400">Generate increments automatically.</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAutoInvoiceNumber(!autoInvoiceNumber)}
                      className={`relative inline-flex h-4.5 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                        autoInvoiceNumber ? 'bg-amber-500' : 'bg-slate-200 dark:bg-slate-800'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          autoInvoiceNumber ? 'translate-x-3.5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Auto Project Code Toggle */}
                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200/40 dark:border-slate-800/60">
                    <div className="space-y-0.5">
                      <div className="text-[10px] uppercase font-black tracking-wider text-slate-800 dark:text-slate-200">Auto Project Code</div>
                      <div className="text-[8px] text-slate-400">Generate unique codes for projects.</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAutoProjectCode(!autoProjectCode)}
                      className={`relative inline-flex h-4.5 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                        autoProjectCode ? 'bg-amber-500' : 'bg-slate-200 dark:bg-slate-800'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          autoProjectCode ? 'translate-x-3.5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 5 - Export Preferences */}
            <div className="bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-900 p-6 rounded-3xl shadow-md space-y-4">
              <h2 className="text-xs font-serif font-black text-slate-900 dark:text-amber-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 dark:border-slate-900 pb-3">
                <Layers className="h-4.5 w-4.5 text-amber-500" />
                <span>SECTION 5 - Export Preferences</span>
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { id: 'logo', label: 'Include Logo', state: exportIncludeLogo, setter: setExportIncludeLogo, icon: Building2 },
                  { id: 'sig', label: 'Include Signature', state: exportIncludeSignature, setter: setExportIncludeSignature, icon: Palette },
                  { id: 'gst', label: 'Include GST Details', state: exportIncludeGst, setter: setExportIncludeGst, icon: Percent },
                  { id: 'bank', label: 'Include Bank Details', state: exportIncludeBankDetails, setter: setExportIncludeBankDetails, icon: CreditCard },
                  { id: 'footer', label: 'Include Footer Notes', state: exportIncludeFooterNotes, setter: setExportIncludeFooterNotes, icon: FileText },
                  { id: 'watermark', label: 'Draft Watermark', state: exportWatermark, setter: setExportWatermark, icon: Shield },
                ].map((pref) => {
                  const Icon = pref.icon;
                  return (
                    <button
                      key={pref.id}
                      type="button"
                      onClick={() => pref.setter(!pref.state)}
                      className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between gap-3 transition-all duration-200 hover:shadow-xs group cursor-pointer ${
                        pref.state
                          ? 'border-amber-500 bg-amber-500/10 text-slate-900 dark:text-amber-400'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex justify-between items-center w-full">
                        <Icon className={`h-4.5 w-4.5 ${pref.state ? 'text-amber-500' : 'text-slate-400 dark:text-slate-600 group-hover:text-slate-500'}`} />
                        <div className={`h-4.5 w-4.5 rounded-full border flex items-center justify-center transition-all ${
                          pref.state ? 'border-amber-500 bg-amber-500 text-slate-950' : 'border-slate-300 dark:border-slate-700'
                        }`}>
                          {pref.state && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                        </div>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-wider">{pref.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Save Settings Trigger bottom */}
            <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-900 p-4 rounded-3xl shadow-sm flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
                <Info className="h-4.5 w-4.5 text-amber-500/80 shrink-0" />
                <span className="text-[9px] uppercase font-bold tracking-tight">Changes are immediately validated and ready for PDF compiling.</span>
              </div>
              <button
                type="submit"
                className="px-6 py-3 bg-slate-950 hover:bg-slate-900 text-amber-400 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400 rounded-xl font-bold uppercase tracking-wider text-xs shadow-md transition-all cursor-pointer shrink-0"
              >
                Save Settings
              </button>
            </div>
          </div>

          {/* SECTION 6 - Invoice Preview (Right Column) */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-4">
              <div className="flex items-center justify-between px-2">
                <h2 className="text-xs font-serif font-black text-slate-900 dark:text-amber-400 uppercase tracking-widest flex items-center gap-2">
                  <Eye className="h-4 w-4 text-amber-500" />
                  <span>SECTION 6 - Invoice Preview</span>
                </h2>
                <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest">
                  Live Update
                </span>
              </div>

              {/* Dynamic Invoice Canvas sheet */}
              <div className="relative bg-white dark:bg-white text-slate-800 p-5 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-200 aspect-[1/1.4] max-w-sm mx-auto overflow-hidden flex flex-col justify-between text-[8px] select-none leading-normal font-sans">
                
                {/* Export Watermark Overlay */}
                {exportWatermark && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-5 select-none pointer-events-none rotate-12 uppercase text-2xl font-black text-amber-600 font-serif tracking-widest">
                    DRAFT COPY / PREVIEW
                  </div>
                )}

                <div>
                  {/* Preview Top Header bar */}
                  <div className="flex justify-between items-start border-b border-slate-100 pb-3 mb-3">
                    <div>
                      {exportIncludeLogo && logoBase64 ? (
                        <img src={logoBase64} alt="Brand Logo" className="h-8 max-w-[80px] object-contain mb-1.5" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="h-8 w-14 bg-slate-950 text-amber-400 flex items-center justify-center font-serif font-black text-[10px] rounded-lg border border-amber-500/20 uppercase tracking-widest mb-1.5">
                          {invoicePrefix || 'INC'}
                        </div>
                      )}
                      <h3 className="font-serif font-bold text-[9px] text-slate-900 tracking-tight leading-tight uppercase">
                        {companyName}
                      </h3>
                      <div className="text-[7px] text-slate-500 space-y-0.5 mt-0.5 max-w-[150px]">
                        <div>{companyAddress}</div>
                        <div>{city}, {state} - {pincode}</div>
                        <div>Phone: {companyPhone}</div>
                        <div>Email: {companyEmail}</div>
                        {website && <div>Web: {website}</div>}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-serif font-black text-[12px] text-amber-600 uppercase tracking-wider mb-1">
                        INVOICE
                      </div>
                      <div className="space-y-0.5 font-bold text-slate-700">
                        <div>No: <span className="text-slate-900">{invoiceFormat}</span></div>
                        <div>Date: <span className="text-slate-900">
                          {dateFormat === 'YYYY-MM-DD' ? '2026-08-05' : dateFormat === 'MM/DD/YYYY' ? '08/05/2026' : '05-08-2026'}
                        </span></div>
                        <div>Due: <span className="text-slate-900">
                          {(() => {
                            const d = new Date(Date.now() + paymentDueDays * 24 * 60 * 60 * 1000);
                            const dd = String(d.getDate()).padStart(2, '0');
                            const mm = String(d.getMonth() + 1).padStart(2, '0');
                            const yyyy = d.getFullYear();
                            if (dateFormat === 'YYYY-MM-DD') return `${yyyy}-${mm}-${dd}`;
                            if (dateFormat === 'MM/DD/YYYY') return `${mm}/${dd}/${yyyy}`;
                            return `${dd}-${mm}-${yyyy}`;
                          })()}
                        </span></div>
                        {exportIncludeGst && companyGst && <div className="text-[6.5px] text-slate-500">GSTIN: <span className="text-slate-800 font-black">{companyGst}</span></div>}
                        {panNumber && <div className="text-[6.5px] text-slate-500">PAN: <span className="text-slate-800 font-bold">{panNumber}</span></div>}
                      </div>
                    </div>
                  </div>

                  {/* Billed to info */}
                  <div className="mb-3.5 bg-slate-50 p-2 rounded-xl">
                    <span className="text-[6.5px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">BILLED TO CLIENT:</span>
                    <div className="font-bold text-slate-800 text-[8.5px]">MS. PRIYA REDDY</div>
                    <div className="text-[7.2px] text-slate-500">Gachibowli Flat No. 402, Hyderabad, India</div>
                  </div>

                  {/* Table header and body */}
                  <table className="w-full text-left border-collapse mb-3.5">
                    <thead>
                      <tr className="bg-slate-950 text-white uppercase text-[6.5px] font-bold tracking-wider">
                        <th className="py-1.5 px-2 rounded-l-lg">Description of Service</th>
                        <th className="py-1.5 px-2 text-center">Qty</th>
                        <th className="py-1.5 px-2 text-right">Rate</th>
                        <th className="py-1.5 px-2 text-right rounded-r-lg">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-bold text-slate-800">
                      <tr>
                        <td className="py-1.5 px-2 text-slate-900">Interior Design Layout & False Ceiling Consulting</td>
                        <td className="py-1.5 px-2 text-center">1</td>
                        <td className="py-1.5 px-2 text-right">
                          {currency === 'INR' ? '₹' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '£'}
                          {numberFormat === 'en-US' ? '150,000.00' : '1,50,000.00'}
                        </td>
                        <td className="py-1.5 px-2 text-right">
                          {currency === 'INR' ? '₹' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '£'}
                          {numberFormat === 'en-US' ? '150,000.00' : '1,50,000.00'}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-2 text-slate-900">Premium Oakwood Trim & Sourcing Procurement</td>
                        <td className="py-1.5 px-2 text-center">1</td>
                        <td className="py-1.5 px-2 text-right">
                          {currency === 'INR' ? '₹' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '£'}
                          {numberFormat === 'en-US' ? '250,000.00' : '2,50,000.00'}
                        </td>
                        <td className="py-1.5 px-2 text-right">
                          {currency === 'INR' ? '₹' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '£'}
                          {numberFormat === 'en-US' ? '250,000.00' : '2,50,000.00'}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Calculations total slip */}
                  <div className="flex justify-end mb-3 font-bold">
                    <div className="w-1/2 text-right space-y-1 text-slate-600 text-[7px]">
                      <div className="flex justify-between border-b border-slate-50 pb-1">
                        <span>Subtotal:</span>
                        <span className="text-slate-800 font-black">
                          {currency === 'INR' ? '₹' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '£'}
                          {numberFormat === 'en-US' ? '400,000.00' : '4,00,000.00'}
                        </span>
                      </div>
                      {exportIncludeGst && (
                        <div className="flex justify-between border-b border-slate-50 pb-1">
                          <span>GST ({defaultGst}%):</span>
                          <span className="text-slate-800 font-black">
                            {currency === 'INR' ? '₹' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '£'}
                            {numberFormat === 'en-US' 
                              ? ((400000 * defaultGst) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) 
                              : ((400000 * defaultGst) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                            }
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between text-[8.5px] text-amber-600 font-serif font-black pt-1">
                        <span>Grand Total:</span>
                        <span>
                          {currency === 'INR' ? '₹' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '£'}
                          {numberFormat === 'en-US'
                            ? (400000 + (400000 * defaultGst) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                            : (400000 + (400000 * defaultGst) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer notes, bank details, signatory block */}
                <div className="border-t border-slate-100 pt-3">
                  <div className="grid grid-cols-2 gap-3 items-end">
                    
                    {/* Bank remit info left */}
                    <div className="text-[6.5px]">
                      {exportIncludeBankDetails ? (
                        <div className="space-y-0.5 text-slate-500 font-semibold leading-tight">
                          <span className="text-[6.5px] font-black text-amber-600 block uppercase mb-0.5">BANK REMITTANCE DETAILS</span>
                          <div className="truncate">Bank: <span className="text-slate-800 font-bold">{bankName}</span></div>
                          <div className="truncate">A/C: <span className="text-slate-800 font-bold">{accountName}</span></div>
                          <div className="truncate">No: <span className="text-slate-800 font-bold">{accountNumber}</span></div>
                          <div className="truncate">IFSC: <span className="text-slate-800 font-bold">{ifscCode}</span></div>
                          <div className="truncate">Branch: <span className="text-slate-800">{branchName}</span></div>
                          {upiId && <div className="truncate">UPI ID: <span className="text-slate-800">{upiId}</span></div>}
                        </div>
                      ) : (
                        <div className="text-slate-300 italic">Bank details hidden by export preference.</div>
                      )}
                    </div>

                    {/* Signatory & QR right */}
                    <div className="flex flex-col items-end text-right">
                      {exportIncludeBankDetails && qrCodeBase64 && (
                        <img src={qrCodeBase64} alt="QR code" className="h-9 w-9 object-contain rounded-sm mb-1.5 border border-slate-100 p-0.5 bg-white" referrerPolicy="no-referrer" />
                      )}

                      <div className="w-full">
                        <span className="text-[5.5px] font-bold text-slate-400 block uppercase mb-1">AUTHORIZED SIGNATORY</span>
                        
                        {/* Dynamic Signature stamp placeholder */}
                        <div className="h-7 flex items-center justify-end relative">
                          {exportIncludeSignature && showSignatureOnInvoice && signatureBase64 ? (
                            <img src={signatureBase64} alt="Sig" className="h-6 max-w-[70px] object-contain" referrerPolicy="no-referrer" />
                          ) : (
                            exportIncludeSignature && showSignatureOnInvoice && (
                              <span className="font-serif italic text-amber-600 text-[10px] transform -rotate-3 select-none">
                                {authorizedSignatoryName}
                              </span>
                            )
                          )}
                          
                          {/* Fine luxury seal border outline */}
                          <div className="absolute right-1 w-6 h-6 rounded-full border border-dashed border-amber-500/20 flex items-center justify-center text-[4px] text-amber-500/10 uppercase select-none pointer-events-none transform scale-90">
                            SEAL
                          </div>
                        </div>

                        <div className="text-slate-900 font-black text-[7px] border-t border-slate-100 pt-0.5 mt-0.5">
                          {authorizedSignatoryName}
                        </div>
                        <div className="text-slate-400 text-[6px]">
                          {designation}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footnote notes at bottom */}
                  {exportIncludeFooterNotes && (
                    <div className="mt-3 pt-2 border-t border-slate-100 text-[6.2px] text-slate-400 font-medium leading-tight whitespace-pre-wrap max-h-[30px] overflow-hidden">
                      <span className="font-bold text-slate-500 uppercase block text-[5px] mb-0.5">Terms & Notes:</span>
                      {invoiceFooterNotes}
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Update credentials form */}
          <div className="bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-900 p-5 rounded-3xl shadow-md space-y-4 text-xs font-semibold">
            <h2 className="text-xs font-serif font-bold text-slate-900 dark:text-amber-400 uppercase tracking-widest flex items-center gap-2">
              <KeyRound className="h-4.5 w-4.5 text-amber-500" />
              <span>Update Credentials</span>
            </h2>

            <div className="space-y-3">
              <div>
                <label className="block text-[9px] text-slate-400 uppercase tracking-wider mb-1.5 font-black">
                  Select User to Edit
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {users.map(u => (
                    <button
                      key={u.id}
                      onClick={() => handleSelectUser(u.id)}
                      className={`py-2 px-3 border rounded-xl text-left transition-all ${
                        selectedUserToEdit === u.id
                          ? 'border-amber-500 bg-amber-500/10 text-amber-400 font-black'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'
                      }`}
                    >
                      <div className="font-bold truncate">{u.name}</div>
                      <div className="text-[9px] opacity-70 truncate">{u.role.toUpperCase()}</div>
                    </button>
                  ))}
                </div>
              </div>

              {selectedUserToEdit && (
                <form onSubmit={handleUpdateCredentials} className="space-y-4 pt-2">
                  <div>
                    <label className="block text-[10px] text-slate-400 dark:text-amber-500/60 uppercase tracking-widest mb-1.5 font-black">
                      New Login Email / Username
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="owner@inchx.com"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white outline-hidden focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 dark:text-amber-500/60 uppercase tracking-widest mb-1.5 font-black">
                      New Secure Password (Leave blank to keep current)
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white outline-hidden focus:border-amber-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-slate-950 hover:bg-slate-900 text-amber-400 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400 rounded-xl font-bold transition-all uppercase tracking-wider"
                  >
                    Save Credential Key
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Add accountant form */}
          <div className="bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-900 p-5 rounded-3xl shadow-md space-y-4 text-xs font-semibold">
            <h2 className="text-xs font-serif font-bold text-slate-900 dark:text-amber-400 uppercase tracking-widest flex items-center gap-2">
              <UserPlus className="h-4.5 w-4.5 text-amber-500" />
              <span>Add Registered Staff</span>
            </h2>

            <form onSubmit={handleAddAccountant} className="space-y-4">
              <div>
                <label className="block text-[10px] text-slate-400 dark:text-amber-500/60 uppercase tracking-widest mb-1.5 font-black">
                  Staff Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Chandra"
                  value={newAccName}
                  onChange={(e) => setNewAccName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white outline-hidden focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 dark:text-amber-500/60 uppercase tracking-widest mb-1.5 font-black">
                  Login Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="ramesh@inchx.com"
                  value={newAccEmail}
                  onChange={(e) => setNewAccEmail(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white outline-hidden focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 dark:text-amber-500/60 uppercase tracking-widest mb-1.5 font-black">
                  Secure Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={newAccPassword}
                  onChange={(e) => setNewAccPassword(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white outline-hidden focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-slate-950 hover:bg-slate-900 text-amber-400 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400 rounded-xl font-bold transition-all uppercase tracking-wider"
              >
                Register Project Manager
              </button>
            </form>
          </div>

          {/* System users table */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-900 rounded-3xl shadow-md overflow-hidden text-xs">
            <div className="p-5 border-b border-slate-100 dark:border-slate-900">
              <h2 className="text-xs font-serif font-bold text-slate-900 dark:text-amber-400 uppercase tracking-widest">System User Profiles & Security Roles</h2>
            </div>
            <div className="overflow-x-auto font-semibold">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-900/50 text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-900">
                    <th className="py-3 px-5">Name</th>
                    <th className="py-3 px-5">Email Username</th>
                    <th className="py-3 px-5">Role Permission</th>
                    <th className="py-3 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-900 text-slate-700 dark:text-slate-300">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                      <td className="py-3 px-5 font-bold text-slate-900 dark:text-white">{u.name}</td>
                      <td className="py-3 px-5 text-slate-500">{u.email}</td>
                      <td className="py-3 px-5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${
                          u.role === 'admin'
                            ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                            : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-5 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleSelectUser(u.id)}
                            className="p-1.5 text-slate-400 hover:text-amber-500 rounded-lg cursor-pointer transition-colors"
                            title="Edit User"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            disabled={u.id === currentUser?.id}
                            className={`p-1.5 rounded-lg transition-colors ${
                              u.id === currentUser?.id
                                ? 'text-slate-300 dark:text-slate-800 cursor-not-allowed'
                                : 'text-rose-500 hover:bg-rose-500/10 cursor-pointer'
                            }`}
                            title="Delete User"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

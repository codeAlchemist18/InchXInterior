/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  Briefcase,
  CreditCard,
  FileText,
  Upload,
  X,
  Save,
  Shield,
  Trash2,
  Lock
} from 'lucide-react';
import { StaffSalary, SalaryRole, StaffPaymentMethod, SalaryStatus } from '../types';

interface AddStaffProps {
  initialData?: StaffSalary | null;
  onSave: (data: Omit<StaffSalary, 'id'> & { id?: string }) => void;
  onCancel: () => void;
  onAddToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
  currency?: string;
}

const ROLES: SalaryRole[] = ['Manager', 'Supervisor', 'Designer', 'Accountant', 'Worker', 'Helper'];
const PAYMENT_METHODS: StaffPaymentMethod[] = ['Bank', 'Cash', 'UPI'];

export default function AddStaff({
  initialData,
  onSave,
  onCancel,
  onAddToast,
  currency = 'INR'
}: AddStaffProps) {
  const [employeeId, setEmployeeId] = useState('');
  const [employeeName, setEmployeeName] = useState('');
  const [role, setRole] = useState<SalaryRole>('Designer');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [joiningDate, setJoiningDate] = useState('');
  const [monthlySalary, setMonthlySalary] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<StaffPaymentMethod>('Bank');
  const [remarks, setRemarks] = useState('');
  const [profilePhoto, setProfilePhoto] = useState<string>('');
  const [referenceNumber, setReferenceNumber] = useState('');
  
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-generate employee ID or populate if editing
  useEffect(() => {
    if (initialData) {
      setEmployeeId(initialData.employeeId);
      setEmployeeName(initialData.employeeName);
      setRole(initialData.role);
      setPhoneNumber(initialData.phoneNumber);
      setEmail(initialData.email || '');
      setAddress(initialData.address || '');
      setJoiningDate(initialData.joiningDate || '');
      setMonthlySalary(initialData.monthlySalary.toString());
      // Map payment methods gracefully
      if (initialData.paymentMethod === 'Bank Transfer') {
        setPaymentMethod('Bank');
      } else if (PAYMENT_METHODS.includes(initialData.paymentMethod as any)) {
        setPaymentMethod(initialData.paymentMethod as StaffPaymentMethod);
      } else {
        setPaymentMethod('Bank');
      }
      setRemarks(initialData.remarks || '');
      setProfilePhoto(initialData.profilePhoto || '');
      setReferenceNumber(initialData.referenceNumber || '');
    } else {
      const randNum = Math.floor(100 + Math.random() * 900);
      setEmployeeId(`EMP-${randNum}`);
      setEmployeeName('');
      setRole('Designer');
      setPhoneNumber('');
      setEmail('');
      setAddress('');
      setJoiningDate(new Date().toISOString().slice(0, 10));
      setMonthlySalary('');
      setPaymentMethod('Bank');
      setRemarks('');
      setProfilePhoto('');
      setReferenceNumber('');
    }
  }, [initialData]);

  // Read file and convert to base64
  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      onAddToast?.('Please upload an image file.', 'error');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      onAddToast?.('Image size must be smaller than 2MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setProfilePhoto(reader.result);
        onAddToast?.('Profile photo uploaded successfully!', 'success');
      }
    };
    reader.onerror = () => {
      onAddToast?.('Failed to read image file.', 'error');
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleRemovePhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setProfilePhoto('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    onAddToast?.('Profile photo removed.', 'info');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validations
    if (!employeeId.trim()) {
      onAddToast?.('Employee ID is required.', 'error');
      return;
    }
    if (!employeeName.trim()) {
      onAddToast?.('Employee Name is required.', 'error');
      return;
    }
    if (!phoneNumber.trim()) {
      onAddToast?.('Phone Number is required.', 'error');
      return;
    }
    if (email.trim() && !/\S+@\S+\.\S+/.test(email)) {
      onAddToast?.('Please enter a valid email address.', 'error');
      return;
    }
    const salaryVal = parseFloat(monthlySalary);
    if (isNaN(salaryVal) || salaryVal <= 0) {
      onAddToast?.('Please enter a valid monthly salary.', 'error');
      return;
    }
    if (!joiningDate) {
      onAddToast?.('Joining Date is required.', 'error');
      return;
    }

    // Determine salary month & state for the new/edited record
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const today = new Date();
    const defaultSalaryMonth = `${monthNames[today.getMonth()]} ${today.getFullYear()}`;

    const staffData: Omit<StaffSalary, 'id'> & { id?: string } = {
      ...(initialData ? { id: initialData.id } : {}),
      employeeId: employeeId.trim().toUpperCase(),
      employeeName: employeeName.trim(),
      role: role,
      phoneNumber: phoneNumber.trim(),
      monthlySalary: salaryVal,
      salaryMonth: initialData?.salaryMonth || defaultSalaryMonth,
      paymentDate: initialData?.paymentDate || '',
      paymentMethod: paymentMethod,
      status: initialData?.status || 'Pending',
      remarks: remarks.trim(),
      email: email.trim(),
      address: address.trim(),
      joiningDate: joiningDate,
      profilePhoto: profilePhoto,
      referenceNumber: referenceNumber.trim()
    };

    onSave(staffData);
  };

  return (
    <div className="space-y-6" id="add-staff-form-container">
      {/* Form Header */}
      <div className="bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 p-6 rounded-3xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-amber-500 dark:text-slate-400 dark:hover:text-amber-400 mb-2 transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Cancel & Go Back</span>
          </button>
          <h1 className="text-xl font-serif font-black text-slate-900 dark:text-amber-400 uppercase tracking-wider">
            {initialData ? 'Edit Employee Dossier' : 'Add New Staff Employee'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-widest mt-0.5">
            Configure employee roles, compensation scales, and profile contact parameters.
          </p>
        </div>
      </div>

      {/* Main Form Box */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl shadow-xs overflow-hidden">
        <div className="p-6 lg:p-8 space-y-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Box: Photo Upload & Basic Details */}
            <div className="lg:col-span-1 space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-amber-500/80 uppercase tracking-wider mb-2">
                  Profile Photo
                </label>
                
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={triggerFileInput}
                  className={`relative group h-64 w-full border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all ${
                    isDragOver
                      ? 'border-amber-500 bg-amber-500/10'
                      : profilePhoto
                      ? 'border-slate-200 dark:border-slate-800'
                      : 'border-slate-300 dark:border-slate-800 hover:border-amber-500/50 hover:bg-slate-50 dark:hover:bg-slate-900/50'
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />

                  {profilePhoto ? (
                    <>
                      <img
                        src={profilePhoto}
                        alt="Profile Preview"
                        className="h-full w-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            triggerFileInput();
                          }}
                          className="p-2 bg-white text-slate-900 rounded-full hover:bg-amber-400 hover:scale-105 transition-all shadow-md"
                          title="Change Photo"
                        >
                          <Upload className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          className="p-2 bg-red-600 text-white rounded-full hover:bg-red-500 hover:scale-105 transition-all shadow-md"
                          title="Remove Photo"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-6 space-y-3">
                      <div className="mx-auto h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-amber-400 flex items-center justify-center">
                        <Upload className="h-5 w-5" />
                      </div>
                      <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                        <span className="text-amber-500 font-bold">Click to upload</span> or drag & drop
                      </div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                        PNG, JPG or WEBP up to 2MB
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Employee ID input - Readonly if editing to maintain ledger references */}
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-amber-500/80 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Employee ID</span>
                  {initialData && (
                    <span className="text-[9px] text-amber-500 font-mono font-bold flex items-center gap-1">
                      <Lock className="h-3 w-3" /> LOCKED
                    </span>
                  )}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <span className="font-mono text-xs font-extrabold font-serif">ID</span>
                  </div>
                  <input
                    type="text"
                    value={employeeId}
                    onChange={(e) => !initialData && setEmployeeId(e.target.value.toUpperCase())}
                    disabled={!!initialData}
                    placeholder="e.g. EMP-101"
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500/50 disabled:opacity-70 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* Right Box: All Form Inputs (Grid) */}
            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                
                {/* Employee Name */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 dark:text-amber-500/80 uppercase tracking-wider mb-2">
                    Employee Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={employeeName}
                      onChange={(e) => setEmployeeName(e.target.value)}
                      placeholder="e.g. Anand Kumar"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                    />
                  </div>
                </div>

                {/* Role dropdown */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-amber-500/80 uppercase tracking-wider mb-2">
                    Designation / Role <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Briefcase className="h-4 w-4" />
                    </div>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as SalaryRole)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500/50 appearance-none cursor-pointer"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Monthly Salary */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-amber-500/80 uppercase tracking-wider mb-2">
                    Monthly Salary ({currency}) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <DollarSign className="h-4 w-4" />
                    </div>
                    <input
                      type="number"
                      min="1"
                      required
                      value={monthlySalary}
                      onChange={(e) => setMonthlySalary(e.target.value)}
                      placeholder="e.g. 50000"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                    />
                  </div>
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-amber-500/80 uppercase tracking-wider mb-2">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Phone className="h-4 w-4" />
                    </div>
                    <input
                      type="tel"
                      required
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="e.g. +91 98490 12345"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-amber-500/80 uppercase tracking-wider mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="h-4 w-4" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. anand@inchx.com"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                    />
                  </div>
                </div>

                {/* Joining Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-amber-500/80 uppercase tracking-wider mb-2">
                    Joining Date <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <input
                      type="date"
                      required
                      value={joiningDate}
                      onChange={(e) => setJoiningDate(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                    />
                  </div>
                </div>

                {/* Default Payment Method */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-amber-500/80 uppercase tracking-wider mb-2">
                    Payment Method <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <CreditCard className="h-4 w-4" />
                    </div>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as StaffPaymentMethod)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500/50 appearance-none cursor-pointer"
                    >
                      {PAYMENT_METHODS.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Reference Number / Transaction ID */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-amber-500/80 uppercase tracking-wider mb-2">
                    Reference Number / Txn ID
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <FileText className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      value={referenceNumber}
                      onChange={(e) => setReferenceNumber(e.target.value)}
                      placeholder="e.g. TXN9876543210"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                    />
                  </div>
                </div>

                {/* Physical Address */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 dark:text-amber-500/80 uppercase tracking-wider mb-2">
                    Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 pt-3.5 flex items-start pointer-events-none text-slate-400">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <textarea
                      rows={2}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Enter physical residential address..."
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500/50 resize-none"
                    />
                  </div>
                </div>

                {/* Remarks */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 dark:text-amber-500/80 uppercase tracking-wider mb-2">
                    Remarks / Dossier Notes
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 pt-3.5 flex items-start pointer-events-none text-slate-400">
                      <FileText className="h-4 w-4" />
                    </div>
                    <textarea
                      rows={2}
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="Add system notes or dynamic employee observations..."
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500/50 resize-none"
                    />
                  </div>
                </div>

              </div>
            </div>

          </div>

        </div>

        {/* Form Action Footer */}
        <div className="px-6 py-5 bg-slate-50/50 dark:bg-slate-900/30 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-end gap-3.5">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 border border-slate-200 hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            className="px-6 py-3 bg-slate-950 hover:bg-slate-900 text-amber-400 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-md transition-all cursor-pointer"
          >
            <Save className="h-4 w-4" />
            <span>{initialData ? 'Save Changes' : 'Save Staff'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

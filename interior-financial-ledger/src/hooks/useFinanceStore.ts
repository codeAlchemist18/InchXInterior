/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Project, Worker, Supplier, Transaction, Invoice, User, SystemUser, StaffSalary } from '../types';

export const MOCK_STAFF_SALARIES: StaffSalary[] = [
  {
    id: 'sal-1',
    employeeId: 'EMP-101',
    employeeName: 'Ananya Deshmukh',
    role: 'Manager',
    phoneNumber: '+91 98490 11223',
    monthlySalary: 75000,
    salaryMonth: 'August 2026',
    paymentDate: '2026-08-05',
    paymentMethod: 'Bank Transfer',
    status: 'Paid',
    remarks: 'Salary credited successfully.'
  },
  {
    id: 'sal-2',
    employeeId: 'EMP-102',
    employeeName: 'Vikram Rathore',
    role: 'Supervisor',
    phoneNumber: '+91 99081 22334',
    monthlySalary: 45000,
    salaryMonth: 'July 2026',
    paymentDate: '2026-07-31',
    paymentMethod: 'UPI',
    status: 'Paid',
    remarks: 'Full monthly salary disbursed'
  },
  {
    id: 'sal-3',
    employeeId: 'EMP-103',
    employeeName: 'Sneha Reddy',
    role: 'Designer',
    phoneNumber: '+91 91212 33445',
    monthlySalary: 60000,
    salaryMonth: 'August 2026',
    paymentDate: '',
    paymentMethod: 'Bank Transfer',
    status: 'Pending',
    remarks: 'Payment pending invoice clearance'
  },
  {
    id: 'sal-4',
    employeeId: 'EMP-104',
    employeeName: 'Ramesh Varma',
    role: 'Worker',
    phoneNumber: '+91 98765 44556',
    monthlySalary: 20000,
    salaryMonth: 'June 2026',
    paymentDate: '2026-06-30',
    paymentMethod: 'Cash',
    status: 'Paid',
    remarks: 'Monthly wage paid'
  },
  {
    id: 'sal-5',
    employeeId: 'EMP-105',
    employeeName: 'Kavita Rao',
    role: 'Accountant',
    phoneNumber: '+91 99499 55667',
    monthlySalary: 50000,
    salaryMonth: 'August 2026',
    paymentDate: '2026-08-01',
    paymentMethod: 'Bank Transfer',
    status: 'Paid',
    remarks: 'Monthly salary credited'
  },
  {
    id: 'sal-6',
    employeeId: 'EMP-106',
    employeeName: 'Mohd. Shakeel',
    role: 'Helper',
    phoneNumber: '+91 97001 66778',
    monthlySalary: 20000,
    salaryMonth: 'August 2026',
    paymentDate: '',
    paymentMethod: 'UPI',
    status: 'Pending',
    remarks: 'Awaiting bank clearance'
  },
  {
    id: 'sal-7',
    employeeId: 'EMP-107',
    employeeName: 'Suresh Kumar',
    role: 'Supervisor',
    phoneNumber: '+91 98481 77889',
    monthlySalary: 42000,
    salaryMonth: 'July 2026',
    paymentDate: '2026-07-28',
    paymentMethod: 'Cheque',
    status: 'Overdue',
    remarks: 'Cheque under processing'
  }
];

export interface CompanySettings {
  logo: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  gstNumber: string;
  directorName: string;
  signature: string;
  invoicePrefix: string;
  currency: string;
  theme: 'light' | 'dark';
  website?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  invoiceFormat?: string;
  defaultGst?: number;
  termsAndConditions?: string;
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  ifscCode?: string;
  branchName?: string;
  upiId?: string;
  panNumber?: string;
  paymentDueDays?: number;
  invoiceFooterNotes?: string;
  authorizedSignatoryName?: string;
  designation?: string;
  showSignatureOnInvoice?: boolean;
  qrCodeBase64?: string;
  financialYear?: string;
  dateFormat?: string;
  numberFormat?: string;
  autoInvoiceNumber?: boolean;
  autoProjectCode?: boolean;
  exportIncludeLogo?: boolean;
  exportIncludeSignature?: boolean;
  exportIncludeGst?: boolean;
  exportIncludeBankDetails?: boolean;
  exportIncludeFooterNotes?: boolean;
  exportWatermark?: boolean;
}

const DEFAULT_SETTINGS: CompanySettings = {
  logo: '',
  name: "KALKI'S INCHX INTERIO",
  address: 'Skyline Business Enclave, Level 4, Jubilee Hills, Hyderabad',
  phone: '+91 98765 43210',
  email: 'studio@inchx.com',
  gstNumber: '36AAFCD2948R1Z1',
  directorName: 'Kalki Prasad',
  signature: '',
  invoicePrefix: 'INC',
  currency: 'INR',
  theme: 'dark',
  website: 'www.inchx.com',
  city: 'Hyderabad',
  state: 'Telangana',
  country: 'India',
  pincode: '500033',
  invoiceFormat: 'INC-2026-001',
  defaultGst: 18,
  termsAndConditions: '1. All payments should be made in favor of KALKI\'S INCHX INTERIO.\n2. 50% advance is required to initiate structural designing and layout development.\n3. Goods once sold cannot be taken back or exchanged.\n4. Subject to local jurisdiction.',
  bankName: 'HDFC Bank Ltd',
  accountName: "KALKI'S INCHX INTERIO",
  accountNumber: '50200084729402',
  ifscCode: 'HDFC0000041',
  branchName: 'Jubilee Hills, Hyderabad',
  upiId: 'kalki-inchx@okhdfcbank',
  panNumber: 'ABCDE1234F',
  paymentDueDays: 15,
  invoiceFooterNotes: 'Thank you for your business! Renders under authorized local jurisdiction.',
  authorizedSignatoryName: 'Kalki Prasad',
  designation: 'Studio Principal Director',
  showSignatureOnInvoice: true,
  qrCodeBase64: '',
  financialYear: '2026-2027',
  dateFormat: 'DD-MM-YYYY',
  numberFormat: 'en-IN',
  autoInvoiceNumber: true,
  autoProjectCode: true,
  exportIncludeLogo: true,
  exportIncludeSignature: true,
  exportIncludeGst: true,
  exportIncludeBankDetails: true,
  exportIncludeFooterNotes: true,
  exportWatermark: false
};

const MOCK_PROJECTS: Project[] = [
  {
    id: 'p-1',
    name: 'Luxury Villa Jubilee Hills',
    clientName: 'Mr. Anand Rao',
    clientEmail: 'anand.rao@gmail.com',
    clientPhone: '+91 98480 11223',
    address: 'Plot 42, Road No 10, Jubilee Hills, Hyderabad',
    budget: 4500000,
    spent: 1850000,
    status: 'in-progress',
    startDate: '2026-05-10',
    expectedCompletionDate: '2026-12-15',
    tasks: [
      { id: 't-site-measurement', name: 'Site Measurement', status: 'completed' },
      { id: 't-design', name: 'Design', status: 'completed' },
      { id: 't-material-procurement', name: 'Material Procurement', status: 'completed' },
      { id: 't-plumbing', name: 'Plumbing', status: 'in-progress' }
    ] as any[]
  },
  {
    id: 'p-2',
    name: 'Modern Minimalist Apt, Gachibowli',
    clientName: 'Ms. Priya Reddy',
    clientEmail: 'priya.reddy@yahoo.com',
    clientPhone: '+91 99001 88776',
    address: 'Apt 402, Oakwood Residency, Gachibowli, Hyderabad',
    budget: 1800000,
    spent: 1200000,
    status: 'in-progress',
    startDate: '2026-06-01',
    expectedCompletionDate: '2026-09-30',
    tasks: [
      { id: 't-site-measurement', name: 'Site Measurement', status: 'completed' },
      { id: 't-design', name: 'Design', status: 'completed' }
    ] as any[]
  },
  {
    id: 'p-3',
    name: 'Corporate Office, Hitech City',
    clientName: 'Vanguard Solutions',
    clientEmail: 'contact@vanguard.com',
    clientPhone: '+91 40 4500 9000',
    address: 'Level 5, Cyber Towers, Hitech City, Hyderabad',
    budget: 8500000,
    spent: 8500000,
    status: 'completed',
    startDate: '2025-09-15',
    expectedCompletionDate: '2026-02-10',
    tasks: [] as any[]
  }
];

const MOCK_WORKERS: Worker[] = [
  {
    id: 'w-1',
    name: 'Rajesh Kumar',
    type: 'contractor',
    specialty: 'Carpentry & Wooden Ceilings',
    contactNumber: '+91 98480 22334',
    email: 'rajesh.carpentry@gmail.com',
    status: 'active',
    totalPaid: 320000,
    pendingAmount: 45000
  },
  {
    id: 'w-2',
    name: 'Sunil Verma',
    type: 'artisan',
    specialty: 'Electrical Layout & Smart Automation',
    contactNumber: '+91 99001 12233',
    email: 'sunil.verma@yahoo.com',
    status: 'active',
    totalPaid: 95000,
    pendingAmount: 12000
  }
];

const MOCK_SUPPLIERS: Supplier[] = [
  {
    id: 's-1',
    name: 'Gopal Hegde',
    companyName: 'Deccan Timber Depot',
    businessType: 'Teak & Commercial Plywood',
    contactNumber: '+91 40 2300 4455',
    email: 'deccantimbers@gmail.com',
    status: 'active',
    totalPaid: 450000,
    pendingAmount: 150000,
    bills: [
      { id: 'b-1', projectId: 'p-1', projectName: 'Luxury Villa Jubilee Hills', material: 'Premium Teakwood Logs', purchaseDate: '2026-05-20', amount: 150000 }
    ]
  },
  {
    id: 's-2',
    name: 'Ketan Patel',
    companyName: 'Gres & Marble Galleria',
    businessType: 'Tiles & Sanitaryware',
    contactNumber: '+91 98855 00112',
    email: 'ketan.marbles@gmail.com',
    status: 'active',
    totalPaid: 280000,
    pendingAmount: 80000,
    bills: [
      { id: 'b-2', projectId: 'p-2', projectName: 'Modern Minimalist Apt, Gachibowli', material: 'Italian Marble Slabs', purchaseDate: '2026-06-10', amount: 80000 }
    ]
  }
];

const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-1',
    type: 'income',
    amount: 1000000,
    date: '2026-06-15',
    category: 'Client Advance Payment',
    description: 'Received milestone 1 advance for Jubilee Hills Villa',
    paymentMethod: 'bank_transfer',
    projectId: 'p-1',
    projectName: 'Luxury Villa Jubilee Hills',
    runningBalance: 1000000,
    approvedBy: 'Kalki Prasad'
  },
  {
    id: 'tx-2',
    type: 'expense',
    amount: 250000,
    date: '2026-06-20',
    category: 'Material Sourcing',
    description: 'Teakwood purchasing from Deccan Timber Depot',
    paymentMethod: 'cheque',
    projectId: 'p-1',
    projectName: 'Luxury Villa Jubilee Hills',
    runningBalance: 750000,
    approvedBy: 'Kalki Prasad'
  },
  {
    id: 'tx-3',
    type: 'income',
    amount: 500000,
    date: '2026-07-05',
    category: 'Client Advance Payment',
    description: 'Milestone payment for Gachibowli Flat',
    paymentMethod: 'upi',
    projectId: 'p-2',
    projectName: 'Modern Minimalist Apt, Gachibowli',
    runningBalance: 1250000,
    approvedBy: 'Kalki Prasad'
  },
  {
    id: 'tx-4',
    type: 'expense',
    amount: 120000,
    date: '2026-07-10',
    category: 'Labour Wages',
    description: 'Wages distributed to ceiling installation staff',
    paymentMethod: 'cash',
    projectId: 'p-1',
    projectName: 'Luxury Villa Jubilee Hills',
    runningBalance: 1130000,
    approvedBy: 'Kalki Prasad'
  }
];

const MOCK_INVOICES: Invoice[] = [
  {
    id: 'inv-1',
    invoiceNumber: 'INC-2026-001',
    date: '2026-06-12',
    clientName: 'Mr. Anand Rao',
    clientAddress: 'Plot 42, Road No 10, Jubilee Hills, Hyderabad',
    clientGst: '36ABCDE1234F1Z0',
    companyName: "KALKI'S INCHX INTERIO",
    companyAddress: 'Skyline Business Enclave, Level 4, Jubilee Hills, Hyderabad',
    companyGst: '36AAFCD2948R1Z1',
    projectId: 'p-1',
    projectName: 'Luxury Villa Jubilee Hills',
    items: [
      { id: 'it-1', description: 'Architectural Layout Consultation & Ceiling Designs', quantity: 1, rate: 400000, amount: 400000 },
      { id: 'it-2', description: 'Woodworking & False Ceiling Fabrication Materials', quantity: 1, rate: 600000, amount: 600000 }
    ],
    totalAmount: 1000000,
    paidAmount: 1000000,
    balanceAmount: 0,
    notes: 'Advance milestone billing fully settled.',
    status: 'paid',
    dueDate: '2026-06-25'
  }
];

const MOCK_SCHEDULES = [
  {
    id: 'ev-1',
    type: 'site_visit',
    title: 'Ceiling Woodwork Inspection',
    date: '2026-08-05',
    time: '11:00',
    location: 'Jubilee Hills Villa Site',
    personName: 'Rajesh Kumar (Carpenter)',
    projectName: 'Luxury Villa Jubilee Hills',
    notes: 'Verify spacing of cedar beams and safety of electrical conduits.',
    priority: 'high',
    reminderTime: '1h'
  },
  {
    id: 'ev-2',
    type: 'client_meeting',
    title: 'Material Selection & Finish Approval',
    date: '2026-08-08',
    time: '15:30',
    location: 'Inchx Design Studio',
    personName: 'Ms. Priya Reddy',
    projectName: 'Modern Minimalist Apt, Gachibowli',
    notes: 'Present marble samples and veneer choices.',
    priority: 'medium',
    reminderTime: '30m'
  }
];

export function useFinanceStore() {
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('vanguard_projects');
    return saved ? JSON.parse(saved) : MOCK_PROJECTS;
  });

  const [workers, setWorkers] = useState<Worker[]>(() => {
    const saved = localStorage.getItem('vanguard_workers');
    return saved ? JSON.parse(saved) : MOCK_WORKERS;
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem('vanguard_suppliers');
    return saved ? JSON.parse(saved) : MOCK_SUPPLIERS;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('vanguard_transactions');
    return saved ? JSON.parse(saved) : MOCK_TRANSACTIONS;
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem('vanguard_invoices');
    return saved ? JSON.parse(saved) : MOCK_INVOICES;
  });

  const [schedules, setSchedules] = useState<any[]>(() => {
    const saved = localStorage.getItem('vanguard_schedules');
    return saved ? JSON.parse(saved) : MOCK_SCHEDULES;
  });

  const [staffSalaries, setStaffSalaries] = useState<StaffSalary[]>(() => {
    const saved = localStorage.getItem('vanguard_staff_salaries');
    return saved ? JSON.parse(saved) : MOCK_STAFF_SALARIES;
  });

  const [companySettings, setCompanySettings] = useState<CompanySettings>(() => {
    const saved = localStorage.getItem('vanguard_company_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return DEFAULT_SETTINGS;
  });

  const [users, setUsers] = useState<SystemUser[]>([
    { id: 'u-1', name: 'System Admin', email: 'admin@inchx.com', role: 'admin', passwordHash: '' },
    { id: 'u-2', name: 'Project Manager', email: 'manager@inchx.com', role: 'manager' as any, passwordHash: '' }
  ]);

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('vanguard_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [setupComplete, setSetupComplete] = useState<boolean>(true);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);

  // Sync state to localStorage on modification
  useEffect(() => {
    localStorage.setItem('vanguard_projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem('vanguard_workers', JSON.stringify(workers));
  }, [workers]);

  useEffect(() => {
    localStorage.setItem('vanguard_suppliers', JSON.stringify(suppliers));
  }, [suppliers]);

  useEffect(() => {
    localStorage.setItem('vanguard_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('vanguard_invoices', JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem('vanguard_schedules', JSON.stringify(schedules));
  }, [schedules]);

  useEffect(() => {
    localStorage.setItem('vanguard_staff_salaries', JSON.stringify(staffSalaries));
  }, [staffSalaries]);

  useEffect(() => {
    localStorage.setItem('vanguard_company_settings', JSON.stringify(companySettings));
  }, [companySettings]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('vanguard_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('vanguard_current_user');
    }
  }, [currentUser]);

  // Handle instant dynamic theme integration based on settings theme selection
  useEffect(() => {
    if (companySettings.theme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, [companySettings.theme]);

  const toggleTheme = () => {
    const nextTheme = companySettings.theme === 'dark' ? 'light' : 'dark';
    updateCompanySettings({ theme: nextTheme });
  };

  const updateCompanySettings = (settings: Partial<CompanySettings>) => {
    setCompanySettings(prev => {
      const updated = { ...prev, ...settings };
      return updated;
    });
  };

  // Recompute balances helper
  const recomputeRunningBalances = (txs: Transaction[]): Transaction[] => {
    const sorted = [...txs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let currentBal = 0;
    return sorted.map(t => {
      if (t.type === 'income') {
        currentBal += t.amount;
      } else {
        currentBal -= t.amount;
      }
      return {
        ...t,
        runningBalance: currentBal
      };
    }).reverse();
  };

  // Auth Operations
  const loginUser = async (email: string, pass: string) => {
    // Legacy support, not used with frontend selector
    const found = users.find(u => u.email === email);
    if (found) {
      setCurrentUser(found);
      return { success: true, user: found };
    }
    return { success: false, error: 'User not found' };
  };

  const loginAsUser = (user: User) => {
    setCurrentUser(user);
  };

  const logoutUser = async () => {
    setCurrentUser(null);
  };

  const changeUserPassword = async (email: string, currentPass: string, newPass: string) => {
    return { success: true };
  };

  const clearSystemAccounts = async () => {
    // No-op
  };

  const resetUserAccounts = async () => {
    // No-op
    return { success: true };
  };

  const factoryReset = async () => {
    localStorage.clear();
    setProjects(MOCK_PROJECTS);
    setWorkers(MOCK_WORKERS);
    setSuppliers(MOCK_SUPPLIERS);
    setTransactions(MOCK_TRANSACTIONS);
    setInvoices(MOCK_INVOICES);
    setSchedules(MOCK_SCHEDULES);
    setCompanySettings(DEFAULT_SETTINGS);
    setCurrentUser(null);
    return { success: true };
  };

  const resetToSeedData = async () => {
    setProjects([]);
    setWorkers([]);
    setSuppliers([]);
    setTransactions([]);
    setInvoices([]);
    setSchedules([]);
  };

  // Project managers
  const addProject = (projectData: Omit<Project, 'id' | 'spent'>) => {
    const defaultTasks = [
      { id: 't-site-measurement', name: 'Site Measurement', status: 'not-started' },
      { id: 't-design', name: 'Design', status: 'not-started' },
      { id: 't-material-procurement', name: 'Material Procurement', status: 'not-started' },
      { id: 't-plumbing', name: 'Plumbing', status: 'not-started' },
      { id: 't-electrical', name: 'Electrical', status: 'not-started' },
      { id: 't-false-ceiling', name: 'False Ceiling', status: 'not-started' },
      { id: 't-flooring', name: 'Flooring', status: 'not-started' },
      { id: 't-painting', name: 'Painting', status: 'not-started' },
      { id: 't-modular-kitchen', name: 'Modular Kitchen', status: 'not-started' },
      { id: 't-furniture', name: 'Furniture', status: 'not-started' },
      { id: 't-cleaning', name: 'Cleaning', status: 'not-started' },
      { id: 't-final-handover', name: 'Final Handover', status: 'not-started' }
    ];

    const newProject: Project = {
      ...projectData,
      id: `p-${Date.now()}`,
      spent: 0,
      tasks: projectData.tasks || (defaultTasks as any[])
    };

    setProjects(prev => [...prev, newProject]);
    return newProject;
  };

  const updateProjectTasks = (projectId: string, tasks: any[]) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        const completedCount = tasks.filter(t => t.status === 'completed').length;
        const progressPercent = Math.round((completedCount / tasks.length) * 100);
        let status = p.status;
        if (progressPercent === 100) {
          status = 'completed';
        } else if (progressPercent > 0) {
          status = 'in-progress';
        } else {
          status = 'planning';
        }
        return { ...p, tasks, status };
      }
      return p;
    }));
  };

  const updateProject = (projectId: string, updatedData: Partial<Project>) => {
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, ...updatedData } : p));
  };

  const deleteProject = (projectId: string) => {
    setProjects(prev => prev.filter(p => p.id !== projectId));
  };

  // Staff managers
  const addWorker = (workerData: any) => {
    const newWorker: Worker = {
      ...workerData,
      id: `w-${Date.now()}`,
      totalPaid: 0,
      pendingAmount: Number(workerData.pendingAmount || 0)
    };
    setWorkers(prev => [...prev, newWorker]);
    return newWorker;
  };

  const addSupplier = (supplierData: any) => {
    const newSupplier: Supplier = {
      ...supplierData,
      id: `s-${Date.now()}`,
      totalPaid: 0,
      pendingAmount: Number(supplierData.pendingAmount || 0),
      bills: []
    };
    setSuppliers(prev => [...prev, newSupplier]);
    return newSupplier;
  };

  const updateWorker = (workerId: string, updatedData: Partial<Worker>) => {
    setWorkers(prev => prev.map(w => w.id === workerId ? { ...w, ...updatedData } : w));
  };

  const deleteWorker = (workerId: string) => {
    setWorkers(prev => prev.filter(w => w.id !== workerId));
  };

  const updateSupplier = (supplierId: string, updatedData: Partial<Supplier>) => {
    setSuppliers(prev => prev.map(s => s.id === supplierId ? { ...s, ...updatedData } : s));
  };

  const deleteSupplier = (supplierId: string) => {
    setSuppliers(prev => prev.filter(s => s.id !== supplierId));
  };

  const addSupplierBill = (supplierId: string, billData: any) => {
    const newBill = {
      ...billData,
      id: `b-${Date.now()}`
    };

    setSuppliers(prev => prev.map(s => {
      if (s.id === supplierId) {
        const bills = s.bills ? [...s.bills, newBill] : [newBill];
        const totalPurchased = bills.reduce((sum, b) => sum + Number(b.amount || 0), 0);
        const pendingAmount = Math.max(0, totalPurchased - s.totalPaid);
        return { ...s, bills, pendingAmount };
      }
      return s;
    }));

    return newBill;
  };

  const deleteSupplierBill = (supplierId: string, billId: string) => {
    setSuppliers(prev => prev.map(s => {
      if (s.id === supplierId) {
        const bills = s.bills ? s.bills.filter(b => b.id !== billId) : [];
        const totalPurchased = bills.reduce((sum, b) => sum + Number(b.amount || 0), 0);
        const pendingAmount = Math.max(0, totalPurchased - s.totalPaid);
        return { ...s, bills, pendingAmount };
      }
      return s;
    }));
  };

  const adjustWorkerPending = (workerId: string, amount: number, isAddition: boolean) => {
    setWorkers(prev => prev.map(w => {
      if (w.id === workerId) {
        const pendingAmount = isAddition ? w.pendingAmount + amount : Math.max(0, w.pendingAmount - amount);
        return { ...w, pendingAmount };
      }
      return w;
    }));
  };

  const adjustSupplierPending = (supplierId: string, amount: number, isAddition: boolean) => {
    setSuppliers(prev => prev.map(s => {
      if (s.id === supplierId) {
        const pendingAmount = isAddition ? s.pendingAmount + amount : Math.max(0, s.pendingAmount - amount);
        return { ...s, pendingAmount };
      }
      return s;
    }));
  };

  // Schedules
  const addScheduleEvent = (eventData: any) => {
    const newEvent = {
      ...eventData,
      id: `ev-${Date.now()}`
    };
    setSchedules(prev => [...prev, newEvent]);
    return newEvent;
  };

  const deleteScheduleEvent = (eventId: string) => {
    setSchedules(prev => prev.filter(e => e.id !== eventId));
  };

  // Bookkeeping / Transactions
  const addTransaction = (transactionData: any) => {
    const newTx: Transaction = {
      ...transactionData,
      id: `tx-${Date.now()}`,
      amount: Number(transactionData.amount),
      runningBalance: 0
    };

    setTransactions(prev => {
      const updated = [newTx, ...prev];
      return recomputeRunningBalances(updated);
    });

    // Update project budget spending if it's a project expense
    if (newTx.type === 'expense' && newTx.projectId && newTx.projectId !== 'studio') {
      setProjects(prev => prev.map(p => {
        if (p.id === newTx.projectId) {
          return { ...p, spent: p.spent + newTx.amount };
        }
        return p;
      }));
    }

    // Update worker or supplier payments
    if (newTx.referenceType === 'worker' && newTx.referenceId) {
      setWorkers(prev => prev.map(w => {
        if (w.id === newTx.referenceId) {
          return {
            ...w,
            totalPaid: w.totalPaid + newTx.amount,
            pendingAmount: Math.max(0, w.pendingAmount - newTx.amount)
          };
        }
        return w;
      }));
    } else if (newTx.referenceType === 'supplier' && newTx.referenceId) {
      setSuppliers(prev => prev.map(s => {
        if (s.id === newTx.referenceId) {
          return {
            ...s,
            totalPaid: s.totalPaid + newTx.amount,
            pendingAmount: Math.max(0, s.pendingAmount - newTx.amount)
          };
        }
        return s;
      }));
    }

    return newTx;
  };

  // Invoices
  const addInvoice = (invoiceData: any) => {
    const newInv: Invoice = {
      ...invoiceData,
      id: invoiceData.id || `inv-${Date.now()}`
    };

    setInvoices(prev => {
      const existingIdx = prev.findIndex(i => i.id === newInv.id);
      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx] = newInv;
        return updated;
      }
      return [...prev, newInv];
    });

    return newInv;
  };

  // Admin access adjustments
  const adminUpdateUserCredentials = async (userId: string, email: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, email } : u));
    return { success: true };
  };

  const adminAddAccountant = async (name: string, email: string) => {
    const newAcc: SystemUser = {
      id: `u-${Date.now()}`,
      name,
      email,
      role: 'manager' as any,
      passwordHash: ''
    };
    setUsers(prev => [...prev, newAcc]);
    return { success: true };
  };

  const adminDeleteUser = async (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
    return { success: true };
  };

  const getStatistics = () => {
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const currentBalance = totalIncome - totalExpenses;
    const totalProjectsCount = projects.length;

    const totalWorkerPending = workers.reduce((sum, w) => sum + w.pendingAmount, 0);
    const totalSupplierPending = suppliers.reduce((sum, s) => sum + s.pendingAmount, 0);
    const pendingPayments = totalWorkerPending + totalSupplierPending;

    return {
      totalIncome,
      totalExpenses,
      currentBalance,
      totalProjects: totalProjectsCount,
      pendingPayments,
      totalWorkerPending,
      totalSupplierPending
    };
  };

  // Staff Salary Handlers
  const addStaffSalary = (salaryData: Omit<StaffSalary, 'id'>) => {
    const newSalary: StaffSalary = {
      ...salaryData,
      id: `sal-${Date.now()}`
    };
    setStaffSalaries(prev => [newSalary, ...prev]);
    return newSalary;
  };

  const updateStaffSalary = (salaryData: StaffSalary) => {
    setStaffSalaries(prev => prev.map(s => s.id === salaryData.id ? salaryData : s));
  };

  const deleteStaffSalary = (id: string) => {
    setStaffSalaries(prev => prev.filter(s => s.id !== id));
  };

  return {
    projects,
    workers,
    suppliers,
    transactions,
    invoices,
    users,
    currentUser,
    setupComplete,
    isDarkMode,
    loading,
    schedules,
    staffSalaries,
    companySettings,
    updateCompanySettings,
    toggleTheme,
    loginAsUser,
    logoutUser,
    addProject,
    updateProject,
    deleteProject,
    updateProjectTasks,
    addWorker,
    updateWorker,
    deleteWorker,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    addSupplierBill,
    deleteSupplierBill,
    addScheduleEvent,
    deleteScheduleEvent,
    addStaffSalary,
    updateStaffSalary,
    deleteStaffSalary,
    adminUpdateUserCredentials,
    adminAddAccountant,
    adminDeleteUser,
    addTransaction,
    addInvoice,
    adjustWorkerPending,
    adjustSupplierPending,
    resetToSeedData,
    getStatistics,
    recomputeRunningBalances,
    registerSystemAccounts: async () => {},
    loginUser,
    changeUserPassword,
    clearSystemAccounts,
    factoryReset,
    resetUserAccounts: factoryReset
  };
}

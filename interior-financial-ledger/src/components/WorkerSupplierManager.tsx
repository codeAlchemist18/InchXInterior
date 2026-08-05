/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, FormEvent } from 'react';
import { Worker, Supplier, Project, Transaction } from '../types';
import { Search, UserPlus, FileText, DollarSign, Plus, Phone, Mail, FileCheck, Check, AlertCircle, Calendar, Filter, Briefcase, Store, User, Tag, ArrowRight, Eye, ShieldAlert, Edit, Trash2 } from 'lucide-react';

interface WorkerSupplierManagerProps {
  workers: Worker[];
  suppliers: Supplier[];
  projects: Project[];
  transactions: Transaction[];
  addWorker: (w: any) => void;
  addSupplier: (s: any) => void;
  updateWorker?: (id: string, updated: any) => void;
  deleteWorker?: (id: string) => void;
  updateSupplier?: (id: string, updated: any) => void;
  deleteSupplier?: (id: string) => void;
  adjustWorkerPending: (id: string, amt: number, addition: boolean) => void;
  adjustSupplierPending: (id: string, amt: number, addition: boolean) => void;
  addSupplierBill?: (supplierId: string, bill: any) => any;
  deleteSupplierBill?: (supplierId: string, billId: string) => void;
  onAddToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export default function WorkerSupplierManager({
  workers,
  suppliers,
  projects,
  transactions,
  addWorker,
  addSupplier,
  updateWorker,
  deleteWorker,
  updateSupplier,
  deleteSupplier,
  adjustWorkerPending,
  adjustSupplierPending,
  addSupplierBill,
  deleteSupplierBill,
  onAddToast
}: WorkerSupplierManagerProps) {
  const [activeTab, setActiveTab] = useState<'workers' | 'suppliers' | 'search'>('workers');
  const [searchName, setSearchName] = useState<string>('');
  const [filterProjectId, setFilterProjectId] = useState<string>('all');

  // Edit States
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // Advanced Global Search States
  const [globalSearchQuery, setGlobalSearchQuery] = useState<string>('');
  const [searchFilterStartDate, setSearchFilterStartDate] = useState<string>('');
  const [searchFilterEndDate, setSearchFilterEndDate] = useState<string>('');
  const [searchFilterProjectId, setSearchFilterProjectId] = useState<string>('all');
  const [searchFilterSupplierId, setSearchFilterSupplierId] = useState<string>('all');
  const [searchFilterStore, setSearchFilterStore] = useState<string>('');
  const [searchFilterContractorId, setSearchFilterContractorId] = useState<string>('all');
  const [searchFilterStaff, setSearchFilterStaff] = useState<string>('all');
  const [searchFilterCategory, setSearchFilterCategory] = useState<string>('all');
  const [searchFilterPaymentMethod, setSearchFilterPaymentMethod] = useState<string>('all');

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

  // Robust parser for material items (extract Quantity, Unit, Unit Rate)
  const parseMaterialDetails = (description: string, category: string, amount: number) => {
    let cleanDesc = description;
    const notesSplit = description.split('\nNotes:');
    if (notesSplit.length > 1) {
      cleanDesc = notesSplit[1];
    }
    
    let materialPurchased = cleanDesc.trim();
    let quantity = 1;
    let unit = 'Units';
    let unitRate = amount;

    // Try parsing patterns:
    // e.g. "50 bags @ 400"
    const qtyUnitPattern = /(\d+(?:\.\d+)?)\s*(bags|bag|kg|sqft|sft|rft|nos|no|pieces|piece|pcs|box|boxes|ton|tons|ltr|ltrs|liters|liter|mtr|mtrs|meters|meter|units|unit)\b/i;
    const ratePattern = /(?:@|at|rate|of|₹|rs\.?|inr)?\s*([\d,]+(?:\.\d+)?)\s*(?:\/|\s+per\s+)(?:bag|kg|sqft|sft|rft|no|piece|pcs|box|ton|ltr|liter|mtr|meter|unit)?/i;
    const generalRatePattern = /(?:@|at|rate|of)\s*(?:₹|rs\.?|inr)?\s*([\d,]+(?:\.\d+)?)/i;

    const qtyUnitMatch = cleanDesc.match(qtyUnitPattern);
    if (qtyUnitMatch) {
      quantity = parseFloat(qtyUnitMatch[1]);
      unit = qtyUnitMatch[2];
      
      const rateMatch = cleanDesc.match(ratePattern) || cleanDesc.match(generalRatePattern);
      if (rateMatch) {
        unitRate = parseFloat(rateMatch[1].replace(/,/g, ''));
      } else {
        unitRate = amount / (quantity || 1);
      }
    } else {
      // Simple format: "50 @ 300"
      const simplePattern = /(\d+(?:\.\d+)?)\s*@\s*([\d,]+(?:\.\d+)?)/;
      const simpleMatch = cleanDesc.match(simplePattern);
      if (simpleMatch) {
        quantity = parseFloat(simpleMatch[1]);
        unitRate = parseFloat(simpleMatch[2].replace(/,/g, ''));
        unit = 'Units';
      }
    }

    unitRate = Math.round(unitRate * 100) / 100;

    return {
      materialPurchased,
      quantity,
      unit,
      unitRate
    };
  };

  // Compile Searchable Dataset
  const allSearchItems: any[] = [];

  // Add all standard transactions
  transactions.forEach(t => {
    const matchedProject = projects.find(p => p.id === t.projectId || p.name === t.projectId);
    const clientName = matchedProject ? matchedProject.clientName : 'N/A';
    const siteLocation = t.siteLocation || (matchedProject ? matchedProject.address : 'N/A');

    let supplierName = 'N/A';
    let storeName = 'N/A';
    let contractorName = 'N/A';
    let contractorSpecialty = '';

    if (t.referenceType === 'supplier' && t.referenceId) {
      const sup = suppliers.find(s => s.id === t.referenceId);
      if (sup) {
        supplierName = sup.name;
        storeName = sup.companyName;
      }
    }
    if (t.referenceType === 'worker' && t.referenceId) {
      const wk = workers.find(w => w.id === t.referenceId);
      if (wk) {
        contractorName = wk.name;
        contractorSpecialty = wk.specialty;
      }
    }

    const { materialPurchased, quantity, unit, unitRate } = parseMaterialDetails(t.description, t.category, t.amount);

    allSearchItems.push({
      id: t.id,
      type: 'transaction',
      date: t.date.slice(0, 10),
      projectId: t.projectId,
      projectName: matchedProject ? matchedProject.name : t.projectId,
      clientName,
      siteLocation,
      supplierId: t.referenceType === 'supplier' ? t.referenceId : undefined,
      supplierName,
      storeName,
      contractorId: t.referenceType === 'worker' ? t.referenceId : undefined,
      contractorName,
      contractorSpecialty,
      materialPurchased,
      materialCategory: t.category,
      quantity,
      unit,
      unitRate,
      totalAmount: t.amount,
      paymentMethod: t.paymentMethod.replace('_', ' ').toUpperCase(),
      invoiceNumber: t.invoiceNumber || 'N/A',
      approvedBy: t.approvedBy || 'Office Staff',
      original: t
    });
  });

  // Add all Supplier purchase bills
  suppliers.forEach(s => {
    const sBills = s.bills || [];
    sBills.forEach(b => {
      const matchedProject = projects.find(p => p.id === b.projectId || p.name === b.projectName);
      const clientName = matchedProject ? matchedProject.clientName : 'N/A';
      const siteLocation = matchedProject ? matchedProject.address : 'N/A';

      const { materialPurchased, quantity, unit, unitRate } = parseMaterialDetails(b.material, 'Material Purchase', b.amount);

      allSearchItems.push({
        id: b.id,
        type: 'bill',
        date: b.purchaseDate,
        projectId: b.projectId,
        projectName: b.projectName || (matchedProject ? matchedProject.name : 'General Studio Overhead'),
        clientName,
        siteLocation,
        supplierId: s.id,
        supplierName: s.name,
        storeName: s.companyName,
        contractorName: 'N/A',
        materialPurchased,
        materialCategory: 'Material Purchase',
        quantity,
        unit,
        unitRate,
        totalAmount: b.amount,
        paymentMethod: 'BILL / CREDIT',
        invoiceNumber: b.id.slice(0, 8).toUpperCase(),
        approvedBy: 'Office Staff'
      });
    });
  });

  // Search filter and query runner
  const getSearchedAndFilteredItems = () => {
    let list = [...allSearchItems];

    if (globalSearchQuery.trim() !== '') {
      const query = globalSearchQuery.toLowerCase().trim();
      list = list.filter(item => {
        return (
          item.storeName.toLowerCase().includes(query) ||
          item.supplierName.toLowerCase().includes(query) ||
          item.contractorName.toLowerCase().includes(query) ||
          (item.contractorSpecialty && item.contractorSpecialty.toLowerCase().includes(query)) ||
          item.approvedBy.toLowerCase().includes(query) ||
          item.materialPurchased.toLowerCase().includes(query) ||
          item.materialCategory.toLowerCase().includes(query) ||
          item.projectName.toLowerCase().includes(query) ||
          item.clientName.toLowerCase().includes(query) ||
          item.siteLocation.toLowerCase().includes(query) ||
          (query === 'carpenter' && item.contractorSpecialty?.toLowerCase().includes('carpen')) ||
          (query === 'electrician' && item.contractorSpecialty?.toLowerCase().includes('electr')) ||
          (query === 'plumber' && item.contractorSpecialty?.toLowerCase().includes('plumb')) ||
          (query === 'painter' && item.contractorSpecialty?.toLowerCase().includes('paint'))
        );
      });
    }

    if (searchFilterStartDate) {
      list = list.filter(item => item.date >= searchFilterStartDate);
    }
    if (searchFilterEndDate) {
      list = list.filter(item => item.date <= searchFilterEndDate);
    }
    if (searchFilterProjectId !== 'all') {
      list = list.filter(item => item.projectName === searchFilterProjectId || item.projectId === searchFilterProjectId);
    }
    if (searchFilterSupplierId !== 'all') {
      list = list.filter(item => item.supplierId === searchFilterSupplierId);
    }
    if (searchFilterStore.trim() !== '') {
      const sQ = searchFilterStore.toLowerCase().trim();
      list = list.filter(item => item.storeName.toLowerCase().includes(sQ));
    }
    if (searchFilterContractorId !== 'all') {
      list = list.filter(item => item.contractorId === searchFilterContractorId);
    }
    if (searchFilterStaff !== 'all') {
      list = list.filter(item => item.approvedBy === searchFilterStaff);
    }
    if (searchFilterCategory !== 'all') {
      list = list.filter(item => item.materialCategory === searchFilterCategory);
    }
    if (searchFilterPaymentMethod !== 'all') {
      list = list.filter(item => item.paymentMethod.toLowerCase().includes(searchFilterPaymentMethod.toLowerCase()) || 
        (searchFilterPaymentMethod === 'CREDIT' && item.paymentMethod === 'BILL / CREDIT'));
    }

    return list;
  };

  const searchedAndFilteredItems = getSearchedAndFilteredItems();

  // Special matched entities stats computation
  const getMatchedSupplierStats = () => {
    if (globalSearchQuery.trim().length < 3) return null;
    const q = globalSearchQuery.toLowerCase().trim();
    const s = suppliers.find(sup => 
      sup.companyName.toLowerCase().includes(q) || 
      sup.name.toLowerCase().includes(q)
    );
    if (!s) return null;

    const sBills = s.bills || [];
    const sPayments = transactions.filter(t => t.referenceType === 'supplier' && t.referenceId === s.id);
    const totalTransactions = sBills.length + sPayments.length;
    const totalPurchaseValue = sBills.reduce((sum, b) => sum + b.amount, 0);
    const outstandingAmount = s.pendingAmount;

    let lastPurchaseDate = 'N/A';
    if (sBills.length > 0) {
      const sorted = [...sBills].sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime());
      lastPurchaseDate = new Date(sorted[0].purchaseDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    }

    return {
      supplierName: s.companyName,
      contactPerson: s.name,
      totalTransactions,
      totalPurchaseValue,
      outstandingAmount,
      lastPurchaseDate,
      originalSupplier: s
    };
  };

  const matchedSupplierStats = getMatchedSupplierStats();

  const getMatchedContractorStats = () => {
    if (globalSearchQuery.trim().length < 3) return null;
    const q = globalSearchQuery.toLowerCase().trim();
    const w = workers.find(wk => wk.name.toLowerCase().includes(q));
    if (!w) return null;

    const contractorTx = transactions.filter(t => t.referenceType === 'worker' && t.referenceId === w.id);
    const uniqueProjIds = Array.from(new Set(contractorTx.map(t => t.projectId).filter(Boolean)));
    const projectNames = uniqueProjIds.map(pId => {
      const p = projects.find(proj => proj.id === pId || proj.name === pId);
      return p ? p.name : pId;
    });

    const projectBills = suppliers.flatMap(s => s.bills || []).filter(b => uniqueProjIds.includes(b.projectId));
    const materialsList = Array.from(new Set(projectBills.map(b => b.material).filter(Boolean))).slice(0, 6);

    const totalSpent = contractorTx.reduce((sum, t) => sum + t.amount, 0) + w.pendingAmount;

    return {
      contractorName: w.name,
      specialty: w.specialty,
      type: w.type,
      projects: projectNames,
      workAssigned: w.specialty,
      materials: materialsList,
      numTransactions: contractorTx.length,
      totalAmountSpent: totalSpent,
      outstandingAmount: w.pendingAmount,
      paymentHistory: contractorTx.map(t => ({
        id: t.id,
        date: t.date,
        amount: t.amount,
        project: projects.find(p => p.id === t.projectId)?.name || t.projectId,
        method: t.paymentMethod
      }))
    };
  };

  const matchedContractorStats = getMatchedContractorStats();

  const getMatchedProjectStats = () => {
    if (globalSearchQuery.trim().length < 3) return null;
    const q = globalSearchQuery.toLowerCase().trim();
    const p = projects.find(proj => proj.name.toLowerCase().includes(q));
    if (!p) return null;

    const projTxs = transactions.filter(t => t.projectId === p.id || t.projectId === p.name);
    const projBills = suppliers.flatMap(s => s.bills || []).filter(b => b.projectId === p.id || b.projectName === p.name);

    const supplierIds = Array.from(new Set([
      ...projTxs.filter(t => t.referenceType === 'supplier').map(t => t.referenceId),
      ...suppliers.filter(s => (s.bills || []).some(b => b.projectId === p.id || b.projectName === p.name)).map(s => s.id)
    ]));
    const supplierNames = supplierIds.map(sId => {
      const s = suppliers.find(sup => sup.id === sId);
      return s ? `${s.companyName} (${s.name})` : 'Unknown Supplier';
    }).filter(Boolean);

    const workerIds = Array.from(new Set(projTxs.filter(t => t.referenceType === 'worker').map(t => t.referenceId)));
    const workerNames = workerIds.map(wId => {
      const wk = workers.find(w => w.id === wId);
      return wk ? `${wk.name} (${wk.specialty})` : 'Unknown Worker';
    }).filter(Boolean);

    const materials = Array.from(new Set(projBills.map(b => b.material)));
    const totalMaterialCost = projBills.reduce((sum, b) => sum + b.amount, 0);
    const totalLabourCost = projTxs.filter(t => t.category.toLowerCase().includes('labour') || t.category.toLowerCase().includes('contractor') || t.referenceType === 'worker').reduce((sum, t) => sum + t.amount, 0);

    return {
      projectName: p.name,
      clientName: p.clientName,
      location: p.address,
      status: p.status,
      suppliers: supplierNames,
      contractors: workerNames,
      materials,
      totalMaterialCost,
      totalLabourCost,
      numTransactions: projTxs.length + projBills.length,
      history: [
        ...projBills.map(b => ({
          id: b.id,
          date: b.purchaseDate,
          item: b.material,
          amount: b.amount,
          type: 'Purchase Bill'
        })),
        ...projTxs.map(t => ({
          id: t.id,
          date: t.date.slice(0, 10),
          item: t.description.split('\nNotes:')[1] || t.description,
          amount: t.amount,
          type: t.type === 'expense' ? 'Payment Out' : 'Receipt In'
        }))
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    };
  };

  const matchedProjectStats = getMatchedProjectStats();

  // Form registration state
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [workerName, setWorkerName] = useState<string>('');
  const [workerType, setWorkerType] = useState<'contractor' | 'artisan' | 'consultant'>('contractor');
  const [workerSpecialty, setWorkerSpecialty] = useState<string>('');
  const [workerPhone, setWorkerPhone] = useState<string>('');
  const [workerEmail, setWorkerEmail] = useState<string>('');
  const [workerBank, setWorkerBank] = useState<string>('');
  const [workerPending, setWorkerPending] = useState<string>('0');

  const [supplierName, setSupplierName] = useState<string>('');
  const [supplierCompany, setSupplierCompany] = useState<string>('');
  const [supplierType, setSupplierType] = useState<string>('');
  const [supplierPhone, setSupplierPhone] = useState<string>('');
  const [supplierEmail, setSupplierEmail] = useState<string>('');
  const [supplierGst, setSupplierGst] = useState<string>('');
  const [supplierPending, setSupplierPending] = useState<string>('0');

  // Interactive Payment History / Add Bill Overlay
  const [selectedEntity, setSelectedEntity] = useState<{ id: string; type: 'worker' | 'supplier'; name: string } | null>(null);
  const [billAmount, setBillAmount] = useState<string>('');
  const [billMemo, setBillMemo] = useState<string>('');
  const [billProjectId, setBillProjectId] = useState<string>('');
  const [billDate, setBillDate] = useState<string>('');

  // Supplier Ledger Modal and Filters
  const [selectedSupplierForLedger, setSelectedSupplierForLedger] = useState<Supplier | null>(null);
  const [ledgerProjectFilter, setLedgerProjectFilter] = useState<string>('all');
  const [ledgerMaterialFilter, setLedgerMaterialFilter] = useState<string>('');
  const [ledgerStartDate, setLedgerStartDate] = useState<string>('');
  const [ledgerEndDate, setLedgerEndDate] = useState<string>('');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Submit Worker
  const handleRegisterWorker = (e: FormEvent) => {
    e.preventDefault();
    if (!workerName.trim() || !workerSpecialty.trim()) {
      onAddToast('Please fill in Name and Specialty', 'error');
      return;
    }
    addWorker({
      name: workerName.trim(),
      type: workerType,
      specialty: workerSpecialty.trim(),
      contactNumber: workerPhone.trim() || '+91 99999 88888',
      email: workerEmail.trim() || `${workerName.toLowerCase().replace(/\s+/g, '')}@inchxinterio.com`,
      status: 'active',
      bankDetails: workerBank.trim(),
      pendingAmount: Number(workerPending) || 0
    });
    onAddToast(`Registered Contractor: ${workerName}`, 'success');
    setShowAddForm(false);
    // Reset Form
    setWorkerName('');
    setWorkerSpecialty('');
    setWorkerPhone('');
    setWorkerEmail('');
    setWorkerBank('');
    setWorkerPending('0');
  };

  // Submit Supplier
  const handleRegisterSupplier = (e: FormEvent) => {
    e.preventDefault();
    if (!supplierName.trim() || !supplierCompany.trim() || !supplierType.trim()) {
      onAddToast('Please fill in required fields', 'error');
      return;
    }
    addSupplier({
      name: supplierName.trim(),
      companyName: supplierCompany.trim(),
      businessType: supplierType.trim(),
      contactNumber: supplierPhone.trim() || '+91 40 2300 1122',
      email: supplierEmail.trim() || `${supplierName.toLowerCase().replace(/\s+/g, '')}@supplier.com`,
      status: 'active',
      gstNumber: supplierGst.trim(),
      pendingAmount: Number(supplierPending) || 0
    });
    onAddToast(`Registered Supplier: ${supplierCompany}`, 'success');
    setShowAddForm(false);
    // Reset Form
    setSupplierName('');
    setSupplierCompany('');
    setSupplierType('');
    setSupplierPhone('');
    setSupplierEmail('');
    setSupplierGst('');
    setSupplierPending('0');
  };

  // Update Worker
  const handleUpdateWorkerSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!editingWorker || !editingWorker.name.trim() || !editingWorker.specialty.trim()) {
      onAddToast('Please fill in Name and Specialty', 'error');
      return;
    }
    updateWorker?.(editingWorker.id, editingWorker);
    onAddToast(`Updated Contractor Profile: ${editingWorker.name}`, 'success');
    setEditingWorker(null);
  };

  // Update Supplier
  const handleUpdateSupplierSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!editingSupplier || !editingSupplier.name.trim() || !editingSupplier.companyName.trim() || !editingSupplier.businessType.trim()) {
      onAddToast('Please fill in required fields', 'error');
      return;
    }
    updateSupplier?.(editingSupplier.id, editingSupplier);
    onAddToast(`Updated Supplier Profile: ${editingSupplier.companyName}`, 'success');
    setEditingSupplier(null);
  };

  // Log a new Supplier/Worker Bill (increases their pending amount)
  const handleLogBill = (e: FormEvent) => {
    e.preventDefault();
    const amt = Number(billAmount);
    if (!selectedEntity || amt <= 0) return;

    if (selectedEntity.type === 'worker') {
      adjustWorkerPending(selectedEntity.id, amt, true);
    } else {
      if (addSupplierBill) {
        // Find matching project name if possible
        const matchedProj = projects.find(p => p.id === billProjectId);
        addSupplierBill(selectedEntity.id, {
          projectId: billProjectId || 'studio',
          projectName: matchedProj ? matchedProj.name : 'General Studio Overhead',
          material: billMemo.trim() || 'Materials Procurement',
          purchaseDate: billDate || new Date().toISOString().slice(0, 10),
          amount: amt
        });
      } else {
        adjustSupplierPending(selectedEntity.id, amt, true);
      }
    }

    onAddToast(`Logged outstanding bill of ${formatCurrency(amt)} from ${selectedEntity.name}`, 'success');
    setBillAmount('');
    setBillMemo('');
    setBillProjectId('');
    setBillDate('');
    setSelectedEntity(null);
  };

  // Filter workers
  const getFilteredWorkers = () => {
    let list = [...workers];
    if (searchName.trim() !== '') {
      list = list.filter(w => w.name.toLowerCase().includes(searchName.toLowerCase()) || w.specialty.toLowerCase().includes(searchName.toLowerCase()));
    }
    if (filterProjectId !== 'all') {
      // Find workers who had transactions in that project
      const workerIdsInProj = transactions
        .filter(t => t.projectId === filterProjectId && t.referenceType === 'worker')
        .map(t => t.referenceId);
      list = list.filter(w => workerIdsInProj.includes(w.id));
    }
    return list;
  };

  // Filter suppliers
  const getFilteredSuppliers = () => {
    let list = [...suppliers];
    if (searchName.trim() !== '') {
      list = list.filter(s =>
        s.name.toLowerCase().includes(searchName.toLowerCase()) ||
        s.companyName.toLowerCase().includes(searchName.toLowerCase()) ||
        s.businessType.toLowerCase().includes(searchName.toLowerCase())
      );
    }
    if (filterProjectId !== 'all') {
      // Find suppliers who had transactions in that project
      const supplierIdsInProj = transactions
        .filter(t => t.projectId === filterProjectId && t.referenceType === 'supplier')
        .map(t => t.referenceId);
      list = list.filter(s => supplierIdsInProj.includes(s.id));
    }
    return list;
  };

  const currentWorkers = getFilteredWorkers();
  const currentSuppliers = getFilteredSuppliers();

  // Find current supplier details in list to have the most up-to-date data (including newly added bills)
  const supplierForLedgerObj = selectedSupplierForLedger 
    ? suppliers.find(sup => sup.id === selectedSupplierForLedger.id) || selectedSupplierForLedger
    : null;

  // Let's gather all bills and actual ledger payments for the selected supplier
  const supplierBills = supplierForLedgerObj?.bills || [];
  const supplierPayments = selectedSupplierForLedger 
    ? transactions.filter(t => t.referenceType === 'supplier' && t.referenceId === selectedSupplierForLedger.id)
    : [];

  // Combine both bills and payments into a single array for chronological ledger streaming
  interface CombinedLedgerItem {
    id: string;
    type: 'bill' | 'payment';
    date: string;
    projectId: string;
    projectName: string;
    description: string;
    amount: number;
    paymentMethod?: string;
  }

  const combinedLedgerItems: CombinedLedgerItem[] = [];

  // Populate bills
  supplierBills.forEach(b => {
    combinedLedgerItems.push({
      id: b.id,
      type: 'bill',
      date: b.purchaseDate,
      projectId: b.projectId,
      projectName: b.projectName || 'General Studio Overhead',
      description: b.material,
      amount: b.amount
    });
  });

  // Populate payments
  supplierPayments.forEach(p => {
    let dispDesc = p.description;
    const notesSplit = p.description.split('\nNotes:');
    if (notesSplit.length > 1) {
      dispDesc = notesSplit[1];
    }
    combinedLedgerItems.push({
      id: p.id,
      type: 'payment',
      date: p.date.slice(0, 10),
      projectId: p.projectId,
      projectName: p.projectName || 'General Studio Overhead',
      description: dispDesc,
      amount: p.amount,
      paymentMethod: p.paymentMethod
    });
  });

  // Sort chronologically by date desc
  combinedLedgerItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Filter the items based on user criteria:
  const filteredLedgerItems = combinedLedgerItems.filter(item => {
    if (ledgerProjectFilter !== 'all' && item.projectId !== ledgerProjectFilter) {
      return false;
    }
    if (ledgerMaterialFilter.trim() !== '' && !item.description.toLowerCase().includes(ledgerMaterialFilter.toLowerCase())) {
      return false;
    }
    if (ledgerStartDate && item.date < ledgerStartDate) {
      return false;
    }
    if (ledgerEndDate && item.date > ledgerEndDate) {
      return false;
    }
    return true;
  });

  // Re-compute totals based on current filtered ledger:
  const filteredBilledTotal = filteredLedgerItems
    .filter(i => i.type === 'bill')
    .reduce((sum, i) => sum + i.amount, 0);

  const filteredPaidTotal = filteredLedgerItems
    .filter(i => i.type === 'payment')
    .reduce((sum, i) => sum + i.amount, 0);

  const filteredOutstandingTotal = filteredBilledTotal - filteredPaidTotal;

  return (
    <div className="space-y-6">
      {/* Module Title & Tab Selectors */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Procurement & Partner Ledger
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track bills, payments made, and pending liabilities for designers, artisans, and suppliers.
          </p>
        </div>

        {activeTab !== 'search' && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 text-xs font-bold px-4 py-2 rounded-xl transition-all self-start md:self-center cursor-pointer shadow-sm"
          >
            <UserPlus className="h-4 w-4" />
            <span>Register New Partner</span>
          </button>
        )}
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => { setActiveTab('workers'); setShowAddForm(false); }}
          className={`px-6 py-3 text-xs font-bold transition-all relative cursor-pointer ${
            activeTab === 'workers'
              ? 'text-slate-900 dark:text-white border-b-2 border-slate-900 dark:border-white'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          Contractors & Artisans ({workers.length})
        </button>
        <button
          onClick={() => { setActiveTab('suppliers'); setShowAddForm(false); }}
          className={`px-6 py-3 text-xs font-bold transition-all relative cursor-pointer ${
            activeTab === 'suppliers'
              ? 'text-slate-900 dark:text-white border-b-2 border-slate-900 dark:border-white'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          Material Suppliers ({suppliers.length})
        </button>
        <button
          onClick={() => { setActiveTab('search'); setShowAddForm(false); }}
          className={`px-6 py-3 text-xs font-bold transition-all relative cursor-pointer ${
            activeTab === 'search'
              ? 'text-slate-900 dark:text-white border-b-2 border-slate-900 dark:border-white'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          🔍 Advanced Search
        </button>
      </div>

      {/* Register Partner Form Drawer */}
      {showAddForm && (
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-900">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              {activeTab === 'workers' ? 'Register New Contractor / Designer' : 'Register New Material Supplier'}
            </h3>
            <button
              onClick={() => setShowAddForm(false)}
              className="text-xs font-bold text-slate-500 hover:text-slate-800"
            >
              Close Form
            </button>
          </div>

          {activeTab === 'workers' ? (
            <form onSubmit={handleRegisterWorker} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1">Contractor Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Ramesh Kumar"
                  value={workerName}
                  onChange={(e) => setWorkerName(e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 rounded-lg text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1">Type *</label>
                <select
                  value={workerType}
                  onChange={(e: any) => setWorkerType(e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 rounded-lg text-slate-900 dark:text-white"
                >
                  <option value="contractor">Contractor (Labour/Execution)</option>
                  <option value="artisan">Artisan (Custom craftsmanship)</option>
                  <option value="consultant">Consultant (Lighting/Structural)</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1">Specialty / Scope *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Civil alterations, veneer carpenter"
                  value={workerSpecialty}
                  onChange={(e) => setWorkerSpecialty(e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 rounded-lg text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1">Contact Phone</label>
                <input
                  type="text"
                  placeholder="+91 99887 76655"
                  value={workerPhone}
                  onChange={(e) => setWorkerPhone(e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 rounded-lg text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1">Contact Email</label>
                <input
                  type="email"
                  placeholder="ramesh@gmail.com"
                  value={workerEmail}
                  onChange={(e) => setWorkerEmail(e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 rounded-lg text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1">Initial Opening Outstanding Debt (â‚¹)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={workerPending}
                  onChange={(e) => setWorkerPending(e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 rounded-lg text-slate-900 dark:text-white"
                />
              </div>
              <div className="md:col-span-2 lg:col-span-3">
                <label className="block text-slate-500 dark:text-slate-400 mb-1">Bank Settlement Details</label>
                <input
                  type="text"
                  placeholder="Bank Name, IFSC, Account number"
                  value={workerBank}
                  onChange={(e) => setWorkerBank(e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 rounded-lg text-slate-900 dark:text-white"
                />
              </div>
              <div className="md:col-span-2 lg:col-span-3 pt-2">
                <button
                  type="submit"
                  className="w-full py-2 bg-slate-900 text-white dark:bg-white dark:text-slate-950 font-bold rounded-lg text-center cursor-pointer"
                >
                  Create Master Contractor Profile
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegisterSupplier} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1">Supplier/Contact Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Mohit Sharma"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 rounded-lg text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1">Company Registered Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Luxura Lightings Ltd"
                  value={supplierCompany}
                  onChange={(e) => setSupplierCompany(e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 rounded-lg text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1">Supply Business Type *</label>
                <input
                  type="text"
                  required
                  placeholder="Italian Marble, Custom Fabrics, LED Fixtures"
                  value={supplierType}
                  onChange={(e) => setSupplierType(e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 rounded-lg text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1">Contact Phone</label>
                <input
                  type="text"
                  placeholder="+91 40 4433 2211"
                  value={supplierPhone}
                  onChange={(e) => setSupplierPhone(e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 rounded-lg text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1">Supplier Email</label>
                <input
                  type="email"
                  placeholder="sales@luxura.com"
                  value={supplierEmail}
                  onChange={(e) => setSupplierEmail(e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 rounded-lg text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1">Initial Opening Outstanding Debt (â‚¹)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={supplierPending}
                  onChange={(e) => setSupplierPending(e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 rounded-lg text-slate-900 dark:text-white"
                />
              </div>
              <div className="md:col-span-2 lg:col-span-3">
                <label className="block text-slate-500 dark:text-slate-400 mb-1">Business GST Identification Number</label>
                <input
                  type="text"
                  placeholder="36AAFCDXXXXR1Z1"
                  value={supplierGst}
                  onChange={(e) => setSupplierGst(e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 rounded-lg text-slate-900 dark:text-white"
                />
              </div>
              <div className="md:col-span-2 lg:col-span-3 pt-2">
                <button
                  type="submit"
                  className="w-full py-2 bg-slate-900 text-white dark:bg-white dark:text-slate-950 font-bold rounded-lg text-center cursor-pointer"
                >
                  Create Master Supplier Profile
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Dynamic Filter / Search Bar */}
      <div className="bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 p-4 rounded-xl flex flex-wrap items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder={activeTab === 'workers' ? 'Search by contractor name or skill...' : 'Search by supplier, company, materials...'}
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 rounded-lg text-xs outline-hidden"
          />
        </div>

        <select
          value={filterProjectId}
          onChange={(e) => setFilterProjectId(e.target.value)}
          className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold outline-hidden cursor-pointer"
        >
          <option value="all">Filter by active site: All</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {/* Interactive Bill Logging Form (Modals) */}
      {selectedEntity && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl max-w-md w-full shadow-lg text-xs font-semibold space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-900">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Log New Liability Invoice
              </h3>
              <button onClick={() => setSelectedEntity(null)} className="text-slate-400 hover:text-slate-600">Close</button>
            </div>
            <p className="text-slate-500">
              Add a newly received bill or labor expense invoice from <strong className="text-slate-800 dark:text-white">{selectedEntity.name}</strong>. This increases their outstanding pending amount in the ledger.
            </p>
            <form onSubmit={handleLogBill} className="space-y-4">
              <div>
                <label className="block text-slate-500 mb-1">Invoice Amount (INR) *</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 50000"
                  value={billAmount}
                  onChange={(e) => setBillAmount(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg"
                />
              </div>

              {selectedEntity.type === 'supplier' && (
                <>
                  <div>
                    <label className="block text-slate-500 mb-1">Select Project Site *</label>
                    <select
                      required
                      value={billProjectId}
                      onChange={(e) => setBillProjectId(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg"
                    >
                      <option value="">-- Choose Project Site --</option>
                      <option value="studio">General Studio / Office</option>
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1">Purchase Date *</label>
                    <input
                      type="date"
                      required
                      value={billDate}
                      onChange={(e) => setBillDate(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-slate-500 mb-1">Billing Items description</label>
                <textarea
                  placeholder="Civil plaster completion, Italian marble delivery batch 2..."
                  value={billMemo}
                  onChange={(e) => setBillMemo(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg"
                  rows={2}
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 font-bold rounded-lg"
              >
                Post Liability to Partner Ledger
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Partner Directory Table / Cards View */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {activeTab === 'workers' ? (
          currentWorkers.map((w) => {
            // Find historic ledger payments to this worker
            const history = transactions.filter(t => t.referenceType === 'worker' && t.referenceId === w.id);
            return (
              <div
                key={w.id}
                className="bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-900 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                        {w.type}
                      </span>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white mt-1">
                        {w.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">{w.specialty}</p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        w.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${w.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                        {w.status}
                      </span>
                      <button
                        onClick={() => setEditingWorker(w)}
                        className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer transition-colors"
                        title="Edit Master Contractor"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to delete contractor "${w.name}"?`)) {
                            deleteWorker?.(w.id);
                            onAddToast(`Deleted contractor: ${w.name}`, 'success');
                          }
                        }}
                        className="p-1 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/20 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer transition-colors"
                        title="Delete Master Contractor"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Contact details */}
                  <div className="mt-3.5 space-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Phone className="h-3 w-3 shrink-0" />
                      <span>{w.contactNumber}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Mail className="h-3 w-3 shrink-0" />
                      <span>{w.email}</span>
                    </div>
                    {w.bankDetails && (
                      <div className="pt-1.5 border-t border-slate-100 dark:border-slate-900 mt-1.5 text-[10px] text-slate-400 dark:text-slate-500 font-mono truncate" title={w.bankDetails}>
                        Settlement: {w.bankDetails}
                      </div>
                    )}
                  </div>
                </div>

                {/* Ledger metrics */}
                <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200/40 dark:border-slate-800/40 text-center">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">Cumulative Paid</span>
                    <div className="text-xs font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {formatCurrency(w.totalPaid)}
                    </div>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">Outstanding Balance</span>
                    <div className={`text-xs font-black mt-0.5 ${w.pendingAmount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`}>
                      {formatCurrency(w.pendingAmount)}
                    </div>
                  </div>
                </div>

                {/* Interactive Operations Buttons */}
                <div className="flex items-center gap-2 pt-1 text-xs font-bold">
                  <button
                    onClick={() => setSelectedEntity({ id: w.id, type: 'worker', name: w.name })}
                    className="flex-1 py-1.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-lg text-center cursor-pointer transition-colors"
                  >
                    + Log Labor Bill
                  </button>

                  <button
                    onClick={() => {
                      if (history.length === 0) {
                        alert(`No financial transfers have been posted to ${w.name} in the ledger yet.`);
                      } else {
                        const logs = history.map(h => `${new Date(h.date).toLocaleDateString()} - Paid: ${formatCurrency(h.amount)} (${h.description})`).join('\n');
                        alert(`Complete transfer history for ${w.name}:\n\n${logs}`);
                      }
                    }}
                    className="py-1.5 px-3 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-500 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-colors"
                    title="View Payment Logs"
                  >
                    <FileText className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          currentSuppliers.map((s) => {
            const history = transactions.filter(t => t.referenceType === 'supplier' && t.referenceId === s.id);
            return (
              <div
                key={s.id}
                className="bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-900 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                        {s.businessType}
                      </span>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white mt-1">
                        {s.companyName}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Rep: {s.name}</p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        s.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${s.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                        {s.status || 'active'}
                      </span>
                      <button
                        onClick={() => setEditingSupplier(s)}
                        className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer transition-colors"
                        title="Edit Master Supplier"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to delete supplier "${s.companyName}"?`)) {
                            deleteSupplier?.(s.id);
                            onAddToast(`Deleted supplier: ${s.companyName}`, 'success');
                          }
                        }}
                        className="p-1 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/20 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer transition-colors"
                        title="Delete Master Supplier"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Contact info */}
                  <div className="mt-3.5 space-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Phone className="h-3 w-3 shrink-0" />
                      <span>{s.contactNumber}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Mail className="h-3 w-3 shrink-0" />
                      <span>{s.email}</span>
                    </div>
                    {s.gstNumber && (
                      <div className="pt-1.5 border-t border-slate-100 dark:border-slate-900 mt-1.5 text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                        GSTIN: {s.gstNumber}
                      </div>
                    )}
                  </div>
                </div>

                {/* Ledger metrics */}
                <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200/40 dark:border-slate-800/40 text-center">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">Paid Total</span>
                    <div className="text-xs font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {formatCurrency(s.totalPaid)}
                    </div>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">Outstanding Bills</span>
                    <div className={`text-xs font-black mt-0.5 ${s.pendingAmount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`}>
                      {formatCurrency(s.pendingAmount)}
                    </div>
                  </div>
                </div>

                {/* Operations */}
                <div className="flex items-center gap-2 pt-1 text-xs font-bold">
                  <button
                    onClick={() => setSelectedEntity({ id: s.id, type: 'supplier', name: s.companyName })}
                    className="flex-1 py-1.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-lg text-center cursor-pointer transition-colors"
                  >
                    + Log Material Bill
                  </button>

                  <button
                    onClick={() => {
                      setSelectedSupplierForLedger(s);
                      setLedgerProjectFilter('all');
                      setLedgerMaterialFilter('');
                      setLedgerStartDate('');
                      setLedgerEndDate('');
                    }}
                    className="py-1.5 px-3 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-500 hover:text-amber-500 dark:hover:text-amber-400 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-colors"
                    title="View Master Ledger"
                  >
                    <FileText className="h-4 w-4" />
                    <span className="text-[9px] uppercase font-bold tracking-wider pl-1 hidden lg:inline">Ledger</span>
                  </button>
                </div>
              </div>
            );
          })
        )}

        {(activeTab === 'workers' ? currentWorkers.length : currentSuppliers.length) === 0 && (
          <div className="md:col-span-2 text-center py-16 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-950">
            <AlertCircle className="h-8 w-8 text-slate-400 mx-auto mb-2" />
            <p className="text-slate-500 text-xs">No matching partners found. Register a new partner using the button above.</p>
          </div>
        )}
      </div>

      {/* Supplier Master Ledger Modal */}
      {selectedSupplierForLedger && supplierForLedgerObj && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-amber-500/15 p-6 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl space-y-5 text-xs">
            
            {/* Header */}
            <div className="flex justify-between items-start pb-4 border-b border-slate-100 dark:border-slate-900">
              <div>
                <span className="px-2 py-0.5 rounded bg-amber-500/10 text-[9px] font-bold text-amber-600 dark:text-amber-400 border border-amber-500/20 uppercase tracking-widest">
                  Supplier Master Ledger
                </span>
                <h3 className="text-base font-black text-slate-900 dark:text-white mt-1">
                  {supplierForLedgerObj.companyName}
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5 font-bold uppercase tracking-wider">
                  Representative: {supplierForLedgerObj.name} • {supplierForLedgerObj.businessType}
                </p>
              </div>
              <button
                onClick={() => setSelectedSupplierForLedger(null)}
                className="text-slate-400 hover:text-slate-600 font-extrabold text-sm p-1.5 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            {/* Master Filters Section */}
            <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200/50 dark:border-amber-500/5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-[10px] text-slate-400 font-black uppercase tracking-wider mb-1">
                  Project Site Filter
                </label>
                <select
                  value={ledgerProjectFilter}
                  onChange={(e) => setLedgerProjectFilter(e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 text-slate-800 dark:text-white rounded-lg font-bold"
                >
                  <option value="all">All Project Sites</option>
                  <option value="studio">General Studio / Office</option>
                  {projects.map(proj => (
                    <option key={proj.id} value={proj.id}>{proj.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-black uppercase tracking-wider mb-1">
                  Material Name Search
                </label>
                <input
                  type="text"
                  placeholder="e.g. Marble, Plywood, LED"
                  value={ledgerMaterialFilter}
                  onChange={(e) => setLedgerMaterialFilter(e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 text-slate-800 dark:text-white rounded-lg font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-black uppercase tracking-wider mb-1">
                  From Date
                </label>
                <input
                  type="date"
                  value={ledgerStartDate}
                  onChange={(e) => setLedgerStartDate(e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 text-slate-800 dark:text-white rounded-lg font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-black uppercase tracking-wider mb-1">
                  To Date
                </label>
                <input
                  type="date"
                  value={ledgerEndDate}
                  onChange={(e) => setLedgerEndDate(e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 text-slate-800 dark:text-white rounded-lg font-bold"
                />
              </div>
            </div>

            {/* Financial Summary KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div className="bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-xl">
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Filtered Total Paid</span>
                <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 font-serif block mt-1">
                  {formatCurrency(filteredPaidTotal)}
                </span>
              </div>
              <div className="bg-amber-500/5 border border-amber-500/10 p-3 rounded-xl">
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Filtered Total Purchased</span>
                <span className="text-base font-extrabold text-amber-600 dark:text-amber-400 font-serif block mt-1">
                  {formatCurrency(filteredBilledTotal)}
                </span>
              </div>
              <div className="bg-rose-500/5 border border-rose-500/10 p-3 rounded-xl">
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Net Liability / Outstanding</span>
                <span className={`text-base font-extrabold font-serif block mt-1 ${filteredOutstandingTotal > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}`}>
                  {formatCurrency(filteredOutstandingTotal)}
                </span>
              </div>
            </div>

            {/* Ledger Stream Timeline */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-amber-500/60 pb-1 border-b border-slate-100 dark:border-slate-900">
                Purchase & Payment Stream Logs ({filteredLedgerItems.length})
              </h4>

              <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
                {filteredLedgerItems.map((item) => {
                  const isBill = item.type === 'bill';
                  return (
                    <div
                      key={item.id}
                      className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                        isBill
                          ? 'bg-amber-500/[0.02] dark:bg-amber-500/[0.01] border-amber-500/15'
                          : 'bg-emerald-500/[0.02] dark:bg-emerald-500/[0.01] border-emerald-500/15'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-1.5 py-0.5 rounded-sm text-[8px] font-extrabold uppercase tracking-wider ${
                            isBill
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          }`}>
                            {isBill ? 'Purchase Bill' : 'Payment Settled'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-black uppercase">
                            {new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-900 text-[8px] font-black text-slate-500 uppercase tracking-wider">
                            SITE: {item.projectName}
                          </span>
                        </div>

                        <p className="text-xs text-slate-800 dark:text-slate-200 font-bold leading-normal">
                          {item.description}
                        </p>

                        {!isBill && item.paymentMethod && (
                          <p className="text-[9px] text-amber-500 uppercase font-black tracking-wider">
                            Settlement Mode: {item.paymentMethod.replace('_', ' ')}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-center">
                        <div className={`text-sm font-black font-serif ${isBill ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                          {isBill ? '+' : '-'}{formatCurrency(item.amount)}
                        </div>

                        {/* Ability to Delete Material Bills directly from visual ledger */}
                        {isBill && deleteSupplierBill && (
                          <button
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this material purchase bill? This will recalculate the supplier balance.')) {
                                deleteSupplierBill(supplierForLedgerObj.id, item.id);
                                onAddToast('Material bill removed successfully', 'info');
                              }
                            }}
                            className="text-slate-400 hover:text-rose-500 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors cursor-pointer text-[10px]"
                            title="Delete Bill"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {filteredLedgerItems.length === 0 && (
                  <div className="text-center py-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    <p className="text-slate-400 dark:text-slate-500 text-xs">
                      No material purchases or settlement logs matched the current filters.
                    </p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Edit Contractor Overlay */}
      {editingWorker && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl max-w-lg w-full shadow-lg text-xs font-semibold space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-900">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Modify Contractor Profile
              </h3>
              <button onClick={() => setEditingWorker(null)} className="text-slate-400 hover:text-slate-600 font-bold">✕ Close</button>
            </div>

            <form onSubmit={handleUpdateWorkerSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-500 mb-1">Contractor Name *</label>
                  <input
                    type="text"
                    required
                    value={editingWorker.name}
                    onChange={(e) => setEditingWorker({ ...editingWorker, name: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Type *</label>
                  <select
                    value={editingWorker.type}
                    onChange={(e: any) => setEditingWorker({ ...editingWorker, type: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg cursor-pointer"
                  >
                    <option value="contractor">Contractor (Labour/Execution)</option>
                    <option value="artisan">Artisan (Custom craftsmanship)</option>
                    <option value="consultant">Consultant (Lighting/Structural)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-500 mb-1">Specialty / Scope *</label>
                  <input
                    type="text"
                    required
                    value={editingWorker.specialty}
                    onChange={(e) => setEditingWorker({ ...editingWorker, specialty: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Status *</label>
                  <select
                    value={editingWorker.status}
                    onChange={(e: any) => setEditingWorker({ ...editingWorker, status: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg cursor-pointer"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-500 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={editingWorker.contactNumber}
                    onChange={(e) => setEditingWorker({ ...editingWorker, contactNumber: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Contact Email</label>
                  <input
                    type="email"
                    value={editingWorker.email}
                    onChange={(e) => setEditingWorker({ ...editingWorker, email: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Bank Settlement Details</label>
                <input
                  type="text"
                  value={editingWorker.bankDetails || ''}
                  onChange={(e) => setEditingWorker({ ...editingWorker, bankDetails: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg"
                  placeholder="Bank Name, IFSC, Account number"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 font-bold rounded-lg cursor-pointer"
              >
                Save Contractor Profile Updates
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Supplier Overlay */}
      {editingSupplier && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl max-w-lg w-full shadow-lg text-xs font-semibold space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-900">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Modify Supplier Profile
              </h3>
              <button onClick={() => setEditingSupplier(null)} className="text-slate-400 hover:text-slate-600 font-bold">✕ Close</button>
            </div>

            <form onSubmit={handleUpdateSupplierSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-500 mb-1">Supplier Name *</label>
                  <input
                    type="text"
                    required
                    value={editingSupplier.name}
                    onChange={(e) => setEditingSupplier({ ...editingSupplier, name: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Company Registered Name *</label>
                  <input
                    type="text"
                    required
                    value={editingSupplier.companyName}
                    onChange={(e) => setEditingSupplier({ ...editingSupplier, companyName: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-500 mb-1">Supply Business Type *</label>
                  <input
                    type="text"
                    required
                    value={editingSupplier.businessType}
                    onChange={(e) => setEditingSupplier({ ...editingSupplier, businessType: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Status *</label>
                  <select
                    value={editingSupplier.status}
                    onChange={(e: any) => setEditingSupplier({ ...editingSupplier, status: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg cursor-pointer"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-500 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={editingSupplier.contactNumber}
                    onChange={(e) => setEditingSupplier({ ...editingSupplier, contactNumber: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Supplier Email</label>
                  <input
                    type="email"
                    value={editingSupplier.email}
                    onChange={(e) => setEditingSupplier({ ...editingSupplier, email: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Business GST Identification Number</label>
                <input
                  type="text"
                  value={editingSupplier.gstNumber || ''}
                  onChange={(e) => setEditingSupplier({ ...editingSupplier, gstNumber: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg"
                  placeholder="36AAFCDXXXXR1Z1"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 font-bold rounded-lg cursor-pointer"
              >
                Save Supplier Profile Updates
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

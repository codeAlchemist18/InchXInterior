/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'admin' | 'manager';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface SystemUser extends User {
  passwordHash: string;
}

export type ProjectStatus = 'planning' | 'in-progress' | 'completed' | 'on-hold';

export interface Project {
  id: string;
  name: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  address: string;
  budget: number;
  spent: number;
  status: ProjectStatus;
  startDate: string;
  endDate?: string;
  expectedCompletionDate?: string;
  tasks?: ProjectTask[];
}

export interface ProjectTask {
  id: string;
  name: string;
  status: 'completed' | 'pending' | 'not-started';
}

export type WorkerType = 'contractor' | 'artisan' | 'consultant';

export interface Worker {
  id: string;
  name: string;
  type: WorkerType;
  specialty: string;
  contactNumber: string;
  email: string;
  status: 'active' | 'inactive';
  bankDetails?: string;
  totalPaid: number;
  pendingAmount: number;
}

export interface Supplier {
  id: string;
  name: string;
  companyName: string;
  businessType: string;
  contactNumber: string;
  email: string;
  status: 'active' | 'inactive';
  gstNumber?: string;
  totalPaid: number;
  pendingAmount: number;
  bills?: SupplierBill[];
}

export interface SupplierBill {
  id: string;
  projectId: string;
  projectName?: string;
  material: string;
  purchaseDate: string;
  amount: number;
  billFile?: string; // base64
  billFileName?: string;
}

export type TransactionType = 'income' | 'expense';
export type PaymentMethod = 'bank_transfer' | 'cheque' | 'cash' | 'upi';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  date: string; // ISO String or YYYY-MM-DD
  category: string;
  description: string;
  paymentMethod: PaymentMethod;
  projectId: string; // "studio" for overheads, or a specific project ID
  projectName?: string;
  referenceType?: 'worker' | 'supplier' | 'none';
  referenceId?: string; // ID of Worker or Supplier
  runningBalance: number;
  approvedBy?: string; // User Name or ID
  invoiceNumber?: string;
  contractGivenBy?: string;
  siteLocation?: string;
  assignedPerson?: string;
  assignedPersonMobile?: string;
  receiptBase64?: string;
  receiptName?: string;
}

export interface ScheduleEvent {
  id: string;
  type: 'site_visit' | 'client_meeting' | 'supplier_meeting' | 'office_meeting' | 'personal_reminder';
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  location: string;
  personName: string;
  projectName: string;
  notes: string;
  priority: 'low' | 'medium' | 'high';
  reminderTime: '15m' | '30m' | '1h' | '1d';
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  clientName: string;
  clientAddress: string;
  clientGst?: string;
  companyName?: string;
  companyAddress?: string;
  companyGst?: string;
  projectId: string;
  projectName: string;
  items: InvoiceItem[];
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  notes?: string;
  status: 'unpaid' | 'partially-paid' | 'paid';
  dueDate: string;
}

export interface ExpenseCategorySummary {
  category: string;
  amount: number;
}

export type SalaryRole = 'Manager' | 'Supervisor' | 'Designer' | 'Accountant' | 'Worker' | 'Helper';
export type SalaryStatus = 'Paid' | 'Pending' | 'Overdue';
export type StaffPaymentMethod = 'Bank' | 'Cash' | 'UPI' | 'Cheque' | 'Bank Transfer';

export interface StaffSalary {
  id: string;
  employeeId: string;
  employeeName: string;
  role: SalaryRole;
  phoneNumber: string;
  monthlySalary: number;
  salaryMonth: string;
  paymentDate: string;
  paymentMethod: StaffPaymentMethod;
  status: SalaryStatus;
  remarks: string;
  email?: string;
  address?: string;
  joiningDate?: string;
  profilePhoto?: string;
  referenceNumber?: string;
}


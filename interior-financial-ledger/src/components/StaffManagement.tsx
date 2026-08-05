/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import ExcelJS from 'exceljs';
import {
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  Users,
  DollarSign,
  Briefcase,
  Phone,
  Mail,
  MapPin,
  Calendar,
  FileSpreadsheet,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Clock,
  HelpCircle,
  X,
  CreditCard,
  FileText
} from 'lucide-react';
import { StaffSalary, SalaryRole, SalaryStatus, StaffPaymentMethod } from '../types';

interface StaffManagementProps {
  salaries: StaffSalary[];
  currency?: string;
  onAddNew: () => void;
  onEdit: (salary: StaffSalary) => void;
  onDelete: (id: string) => void;
  onAddStaffSalary: (salary: Omit<StaffSalary, 'id'>) => void;
  onUpdateStaffSalary?: (salary: StaffSalary) => void;
  onAddToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const YEARS = Array.from({ length: 16 }, (_, i) => (2020 + i).toString());

const ROLES: SalaryRole[] = ['Manager', 'Supervisor', 'Designer', 'Accountant', 'Worker', 'Helper'];
const STATUSES: (SalaryStatus | 'Not Yet Due')[] = ['Paid', 'Pending', 'Overdue', 'Not Yet Due'];

const cleanText = (val: any): string => {
  if (val === null || val === undefined) return '';
  return String(val)
    .replace(/â€”/g, '—')
    .replace(/â€“/g, '–')
    .replace(/â€™/g, "'")
    .replace(/â€œ/g, '"')
    .replace(/â€\u009d/g, '"')
    .replace(/â€¦/g, '...')
    .trim();
};

const applyStatusStyle = (cell: any, status: string) => {
  const normalized = String(status).trim().toLowerCase();
  if (normalized === 'paid') {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } };
    cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF15803D' } };
  } else if (normalized === 'pending') {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF9C3' } };
    cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFA16207' } };
  } else if (normalized === 'overdue') {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
    cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFB91C1C' } };
  } else {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
    cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF475569' } };
  }
};

export default function StaffManagement({
  salaries,
  currency = 'INR',
  onAddNew,
  onEdit,
  onDelete,
  onAddStaffSalary,
  onUpdateStaffSalary,
  onAddToast
}: StaffManagementProps) {
  // Selection/Filtering State
  const [selectedMonth, setSelectedMonth] = useState('August');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [methodFilter, setMethodFilter] = useState<string>('All');

  // Navigation State inside this component (View Dossier)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [historySortOrder, setHistorySortOrder] = useState<'newest' | 'oldest'>('newest');

  // Modal State for adding a payment record
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState<StaffPaymentMethod>('Bank');
  const [paymentStatus, setPaymentStatus] = useState<SalaryStatus>('Paid');
  const [paymentRemarks, setPaymentRemarks] = useState('');
  const [paymentRefNo, setPaymentRefNo] = useState('');
  const [paymentMonth, setPaymentMonth] = useState('August');
  const [paymentYear, setPaymentYear] = useState('2026');

  // Dedicated Status Update Modal & Confirmation State
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusTarget, setStatusTarget] = useState<{
    employeeId: string;
    employeeName: string;
    role: SalaryRole;
    phoneNumber: string;
    monthlySalary: number;
    salaryMonth: string;
    currentStatus: SalaryStatus | 'Not Yet Due';
    existingRecord: StaffSalary | null;
    email?: string;
    address?: string;
    joiningDate?: string;
    profilePhoto?: string;
  } | null>(null);

  const [newStatus, setNewStatus] = useState<SalaryStatus>('Paid');
  const [statusPaymentDate, setStatusPaymentDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [statusPaymentMethod, setStatusPaymentMethod] = useState<StaffPaymentMethod>('Bank Transfer');
  const [statusRefNo, setStatusRefNo] = useState<string>('');
  const [statusRemarks, setStatusRemarks] = useState<string>('');

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Deletion Modal State
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const selectedFullMonth = `${selectedMonth} ${selectedYear}`;

  const formatCurrency = (amount: number) => {
    const locale = currency === 'INR' ? 'en-IN' : 'en-US';
    const formatted = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0
    }).format(amount);
    if (currency === 'INR') {
      return formatted.replace(/^INR\s*/, '₹').replace(/^Rs\.\s*/, '₹');
    }
    return formatted;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      const day = String(date.getDate()).padStart(2, '0');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${day}-${monthNames[date.getMonth()]}-${date.getFullYear()}`;
    } catch (e) {
      return dateStr;
    }
  };

  // 1. Group unique employees by employeeId
  // We extract the latest demographic fields from their records
  const uniqueEmployees = React.useMemo(() => {
    const empMap: { [id: string]: StaffSalary } = {};
    // Sort in ascending order of ID/Date so that the latest records override
    const sorted = [...salaries].sort((a, b) => a.id.localeCompare(b.id));
    
    sorted.forEach((record) => {
      empMap[record.employeeId] = {
        ...record,
        // Ensure standard defaults
        email: record.email || `${record.employeeName.toLowerCase().replace(/[^a-z0-9]/g, '')}@inchx.com`,
        address: record.address || 'Gachibowli Main Street, Hyderabad, TS',
        joiningDate: record.joiningDate || '2025-01-01',
        profilePhoto: record.profilePhoto || ''
      };
    });
    return Object.values(empMap);
  }, [salaries]);

  // 2. Fetch payroll status for the selected month/year for each employee
  const employeesWithStatus = React.useMemo(() => {
    const selectedMonthIndex = MONTHS.indexOf(selectedMonth);
    const selectedYearNum = parseInt(selectedYear);
    const currentMonthIndex = 7; // August is index 7
    const currentYearNum = 2026;

    return uniqueEmployees.map((emp) => {
      // Find a specific payment record for this employee and this month/year
      const record = salaries.find(
        (s) => s.employeeId === emp.employeeId && s.salaryMonth === selectedFullMonth
      );

      let status: SalaryStatus | 'Not Yet Due' = 'Pending';
      let payDate = '—';
      let remarks = 'No payment logged.';
      let payRecordId = '';

      if (record) {
        status = record.status;
        payDate = record.paymentDate ? formatDate(record.paymentDate) : '—';
        remarks = record.remarks || '—';
        payRecordId = record.id;
      } else {
        // If no record exists, estimate status based on Selected vs Current date (August 2026)
        if (
          selectedYearNum > currentYearNum ||
          (selectedYearNum === currentYearNum && selectedMonthIndex > currentMonthIndex)
        ) {
          status = 'Not Yet Due';
          remarks = 'Salary period is in the future.';
        } else {
          status = 'Pending';
          remarks = 'No transaction logged for this period.';
        }
      }

      return {
        ...emp,
        selectedMonthStatus: status,
        selectedMonthPayDate: payDate,
        selectedMonthRemarks: remarks,
        selectedMonthRecordId: payRecordId,
        // Keep actual raw record if we want to edit/delete it directly
        rawRecord: record || null
      };
    });
  }, [uniqueEmployees, salaries, selectedFullMonth, selectedMonth, selectedYear]);

  // 3. Filter employees based on search, role, and payment status
  const filteredEmployees = React.useMemo(() => {
    return employeesWithStatus.filter((emp) => {
      const matchesSearch =
        emp.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.phoneNumber.includes(searchTerm);

      const matchesRole = roleFilter === 'All' || emp.role === roleFilter;
      const matchesStatus = statusFilter === 'All' || emp.selectedMonthStatus === statusFilter;

      // Filter by payment method
      const actualMethod = emp.rawRecord ? emp.rawRecord.paymentMethod : emp.paymentMethod;
      const matchesMethod = methodFilter === 'All' || actualMethod === methodFilter;

      return matchesSearch && matchesRole && matchesStatus && matchesMethod;
    });
  }, [employeesWithStatus, searchTerm, roleFilter, statusFilter, methodFilter]);

  // Calculations for KPI summary cards
  const totalRosterCount = uniqueEmployees.length;
  const totalPayrollValue = uniqueEmployees.reduce((sum, emp) => sum + emp.monthlySalary, 0);
  
  const paidCount = employeesWithStatus.filter((e) => e.selectedMonthStatus === 'Paid').length;
  const pendingCount = employeesWithStatus.filter((e) => e.selectedMonthStatus === 'Pending').length;
  const overdueCount = employeesWithStatus.filter((e) => e.selectedMonthStatus === 'Overdue').length;

  const handleExportAllToExcel = async () => {
    if (filteredEmployees.length === 0) {
      onAddToast?.('No records to export.', 'error');
      return;
    }

    try {
      // Create workbook
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'INCHX INTERIO';
      workbook.lastModifiedBy = 'INCHX INTERIO';
      workbook.created = new Date();
      workbook.modified = new Date();

      const worksheet = workbook.addWorksheet('Staff Payroll', {
        views: [{ state: 'frozen', ySplit: 6 }]
      });

      // 1. Add Title Block
      // Row 1: Brand Title
      const titleCell = worksheet.getCell('A1');
      titleCell.value = 'INCHX INTERIO';
      titleCell.font = { name: 'Segoe UI', size: 16, bold: true, color: { argb: 'FF0F172A' } };
      worksheet.getRow(1).height = 30;

      // Row 2: Report subtitle
      const subtitleCell = worksheet.getCell('A2');
      subtitleCell.value = 'Staff Payroll Report';
      subtitleCell.font = { name: 'Segoe UI', size: 12, bold: true, color: { argb: 'FF475569' } };
      worksheet.getRow(2).height = 20;

      // Row 3: Report Period
      const periodCell = worksheet.getCell('A3');
      periodCell.value = `Report Period: ${cleanText(selectedMonth)} ${selectedYear}`;
      periodCell.font = { name: 'Segoe UI', size: 10, italic: true, color: { argb: 'FF64748B' } };
      worksheet.getRow(3).height = 18;

      // Row 4: Generation Date
      const genCell = worksheet.getCell('A4');
      genCell.value = `Generated On: ${formatDate(new Date().toISOString().split('T')[0])}`;
      genCell.font = { name: 'Segoe UI', size: 10, italic: true, color: { argb: 'FF64748B' } };
      worksheet.getRow(4).height = 18;

      // Row 5: Blank Row
      worksheet.getRow(5).height = 12;

      // Row 6: Table Headers (Exactly matching user requirement)
      const headers = [
        'Employee ID',
        'Employee Name',
        'Role',
        'Phone Number',
        'Email',
        'Joining Date',
        'Monthly Salary',
        'Salary Month',
        'Payment Date',
        'Payment Method',
        'Payment Status',
        'Remarks'
      ];

      const headerRow = worksheet.getRow(6);
      headerRow.height = 32;
      headers.forEach((header, index) => {
        const cell = headerRow.getCell(index + 1);
        cell.value = header;
        cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF0F172A' } // Dark Slate background
        };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cell.border = {
          top: { style: 'medium', color: { argb: 'FF1E293B' } },
          left: { style: 'thin', color: { argb: 'FF334155' } },
          bottom: { style: 'medium', color: { argb: 'FF1E293B' } },
          right: { style: 'thin', color: { argb: 'FF334155' } }
        };
      });

      // 2. Add Data Rows
      filteredEmployees.forEach((emp, rowIndex) => {
        const rec = emp.rawRecord;
        const rowData = [
          cleanText(emp.employeeId),
          cleanText(emp.employeeName),
          cleanText(emp.role),
          cleanText(emp.phoneNumber),
          cleanText(emp.email || ''),
          formatDate(emp.joiningDate || ''),
          Number(emp.monthlySalary),
          cleanText(selectedFullMonth),
          cleanText(emp.selectedMonthPayDate),
          cleanText(rec ? rec.paymentMethod : emp.paymentMethod),
          cleanText(emp.selectedMonthStatus),
          cleanText(emp.selectedMonthRemarks)
        ];

        const rowNumber = rowIndex + 7;
        const dataRow = worksheet.getRow(rowNumber);
        dataRow.height = 24;

        rowData.forEach((value, colIndex) => {
          const cell = dataRow.getCell(colIndex + 1);
          cell.value = value;
          
          // Default font
          cell.font = { name: 'Segoe UI', size: 10, color: { argb: 'FF334155' } };
          cell.alignment = { vertical: 'middle', horizontal: 'left' };
          
          // Outer borders for all grid cells
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
          };

          // Alternating row colors
          if (rowIndex % 2 === 1) {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFF8FAFC' } // Slate 50
            };
          } else {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFFFFFFF' } // Pure White
            };
          }

          // Format specific columns professionally
          // Column 1: Employee ID
          if (colIndex === 0) {
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.font = { name: 'Consolas', size: 10, bold: true, color: { argb: 'FF1E293B' } };
          }
          // Column 4: Phone Number (Explicit text format '@' to prevent scientific notation)
          else if (colIndex === 3) {
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.font = { name: 'Consolas', size: 10, color: { argb: 'FF334155' } };
            cell.numFmt = '@';
          }
          // Column 6: Joining Date
          else if (colIndex === 5) {
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
          }
          // Column 7: Monthly Salary (Right aligned, formatted as Indian Rupees)
          else if (colIndex === 6) {
            cell.alignment = { horizontal: 'right', vertical: 'middle' };
            cell.font = { name: 'Consolas', size: 10, color: { argb: 'FF0F172A' } };
            cell.numFmt = '"₹"#,##0';
          }
          // Column 8: Salary Month
          else if (colIndex === 7) {
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
          }
          // Column 9: Payment Date
          else if (colIndex === 8) {
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
          }
          // Column 10: Payment Method
          else if (colIndex === 9) {
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
          }
          // Column 11: Payment Status (Conditional highlighting)
          else if (colIndex === 10) {
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            applyStatusStyle(cell, String(value));
          }
          // Column 12: Remarks (Wrapped & top aligned)
          else if (colIndex === 11) {
            cell.alignment = { horizontal: 'left', vertical: 'top', wrapText: true };
          }
        });
      });

      // 3. Auto-fit column widths
      worksheet.columns.forEach((col, colIndex) => {
        let maxLength = 0;
        col.eachCell({ includeEmpty: true }, (cell, rowNum) => {
          if (rowNum < 6) return; // Ignore titles
          let cellLen = 0;
          if (cell.value !== null && cell.value !== undefined) {
            if (colIndex === 6 && typeof cell.value === 'number') {
              const formatted = '₹' + cell.value.toLocaleString('en-IN');
              cellLen = formatted.length;
            } else {
              cellLen = String(cell.value).length;
            }
          }
          if (cellLen > maxLength) {
            maxLength = cellLen;
          }
        });
        col.width = Math.max(maxLength + 4, 12);
      });

      // 4. Set auto-filter for Row 6
      worksheet.autoFilter = {
        from: { row: 6, column: 1 },
        to: { row: 6, column: headers.length }
      };

      // 5. Generate and download file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Staff_Payroll_Report_${selectedMonth}_${selectedYear}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      onAddToast?.(`Payroll report exported as formatted Excel for ${selectedFullMonth}!`, 'success');
    } catch (error) {
      console.error('Error generating Excel:', error);
      onAddToast?.('Failed to export Excel report.', 'error');
    }
  };

  const handleDeleteConfirm = () => {
    if (deletingId) {
      onDelete(deletingId);
      onAddToast?.('Employee record deleted successfully.', 'success');
      setDeletingId(null);
    }
  };

  // Sub-view: Detailed Dossier for Selected Employee
  const selectedEmployee = uniqueEmployees.find((e) => e.employeeId === selectedEmployeeId);
  const employeeHistory = salaries
    .filter((s) => s.employeeId === selectedEmployeeId);

  const getSalaryMonthValue = (salaryMonthStr: string) => {
    if (!salaryMonthStr) return 0;
    const parts = salaryMonthStr.split(' ');
    if (parts.length < 2) return 0;
    const monthIndex = MONTHS.indexOf(parts[0]);
    const year = parseInt(parts[1], 10);
    return year * 12 + (monthIndex >= 0 ? monthIndex : 0);
  };

  const sortedHistory = React.useMemo(() => {
    return [...employeeHistory].sort((a, b) => {
      const valA = getSalaryMonthValue(a.salaryMonth);
      const valB = getSalaryMonthValue(b.salaryMonth);
      return historySortOrder === 'newest' ? valB - valA : valA - valB;
    });
  }, [employeeHistory, historySortOrder]);

  // Determine current month's status for the selected employee in Details view
  const currentMonthHistoryRecord = employeeHistory.find((h) => h.salaryMonth === selectedFullMonth);
  const detailsMonthStatus = currentMonthHistoryRecord ? currentMonthHistoryRecord.status : 'Pending';
  const detailsMonthPayDate = currentMonthHistoryRecord?.paymentDate ? formatDate(currentMonthHistoryRecord.paymentDate) : '—';
  const detailsMonthRemarks = currentMonthHistoryRecord?.remarks || 'No payment logged.';

  const handleExportEmployeeToExcel = async () => {
    if (!selectedEmployee) return;

    try {
      // Create workbook
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'INCHX INTERIO';
      workbook.lastModifiedBy = 'INCHX INTERIO';
      workbook.created = new Date();
      workbook.modified = new Date();

      const worksheet = workbook.addWorksheet('Payroll History', {
        views: [{ state: 'frozen', ySplit: 6 }]
      });

      // 1. Add Title Block
      // Row 1: Brand Title
      const titleCell = worksheet.getCell('A1');
      titleCell.value = 'INCHX INTERIO';
      titleCell.font = { name: 'Segoe UI', size: 16, bold: true, color: { argb: 'FF0F172A' } };
      worksheet.getRow(1).height = 30;

      // Row 2: Report subtitle
      const subtitleCell = worksheet.getCell('A2');
      subtitleCell.value = 'Staff Payroll History';
      subtitleCell.font = { name: 'Segoe UI', size: 12, bold: true, color: { argb: 'FF475569' } };
      worksheet.getRow(2).height = 20;

      // Row 3: Employee Details
      const periodCell = worksheet.getCell('A3');
      periodCell.value = `Employee: ${cleanText(selectedEmployee.employeeName)} (${cleanText(selectedEmployee.employeeId)}) - ${cleanText(selectedEmployee.role)}`;
      periodCell.font = { name: 'Segoe UI', size: 10, italic: true, color: { argb: 'FF64748B' } };
      worksheet.getRow(3).height = 18;

      // Row 4: Generation Date
      const genCell = worksheet.getCell('A4');
      genCell.value = `Generated On: ${formatDate(new Date().toISOString().split('T')[0])}`;
      genCell.font = { name: 'Segoe UI', size: 10, italic: true, color: { argb: 'FF64748B' } };
      worksheet.getRow(4).height = 18;

      // Row 5: Blank Row
      worksheet.getRow(5).height = 12;

      // Row 6: Table Headers (Exactly matching user requirement)
      const headers = [
        'Employee ID',
        'Employee Name',
        'Role',
        'Phone Number',
        'Email',
        'Joining Date',
        'Monthly Salary',
        'Salary Month',
        'Payment Date',
        'Payment Method',
        'Payment Status',
        'Remarks'
      ];

      const headerRow = worksheet.getRow(6);
      headerRow.height = 32;
      headers.forEach((header, index) => {
        const cell = headerRow.getCell(index + 1);
        cell.value = header;
        cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF0F172A' } // Dark Slate background
        };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cell.border = {
          top: { style: 'medium', color: { argb: 'FF1E293B' } },
          left: { style: 'thin', color: { argb: 'FF334155' } },
          bottom: { style: 'medium', color: { argb: 'FF1E293B' } },
          right: { style: 'thin', color: { argb: 'FF334155' } }
        };
      });

      // 2. Add Data Rows
      const recordsToExport = sortedHistory.length > 0 ? sortedHistory : [null];

      recordsToExport.forEach((p, rowIndex) => {
        let rowData;
        if (p) {
          const parts = p.salaryMonth.split(' ');
          const month = parts[0] || '—';
          const year = parts[1] || '—';
          rowData = [
            cleanText(selectedEmployee.employeeId),
            cleanText(selectedEmployee.employeeName),
            cleanText(selectedEmployee.role),
            cleanText(selectedEmployee.phoneNumber),
            cleanText(selectedEmployee.email || ''),
            formatDate(selectedEmployee.joiningDate || ''),
            Number(p.monthlySalary),
            cleanText(p.salaryMonth),
            p.paymentDate ? formatDate(p.paymentDate) : '—',
            cleanText(p.paymentMethod),
            cleanText(p.status),
            cleanText(p.remarks || '')
          ];
        } else {
          rowData = [
            cleanText(selectedEmployee.employeeId),
            cleanText(selectedEmployee.employeeName),
            cleanText(selectedEmployee.role),
            cleanText(selectedEmployee.phoneNumber),
            cleanText(selectedEmployee.email || ''),
            formatDate(selectedEmployee.joiningDate || ''),
            Number(selectedEmployee.monthlySalary),
            '—',
            '—',
            '—',
            'No History',
            'No payments logged'
          ];
        }

        const rowNumber = rowIndex + 7;
        const dataRow = worksheet.getRow(rowNumber);
        dataRow.height = 24;

        rowData.forEach((value, colIndex) => {
          const cell = dataRow.getCell(colIndex + 1);
          cell.value = value;
          
          // Default font
          cell.font = { name: 'Segoe UI', size: 10, color: { argb: 'FF334155' } };
          cell.alignment = { vertical: 'middle', horizontal: 'left' };
          
          // Outer borders for all grid cells
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
          };

          // Alternating row colors
          if (rowIndex % 2 === 1) {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFF8FAFC' } // Slate 50
            };
          } else {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFFFFFFF' } // Pure White
            };
          }

          // Format specific columns professionally
          // Column 1: Employee ID
          if (colIndex === 0) {
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.font = { name: 'Consolas', size: 10, bold: true, color: { argb: 'FF1E293B' } };
          }
          // Column 4: Phone Number (Explicit text format '@' to prevent scientific notation)
          else if (colIndex === 3) {
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.font = { name: 'Consolas', size: 10, color: { argb: 'FF334155' } };
            cell.numFmt = '@';
          }
          // Column 6: Joining Date
          else if (colIndex === 5) {
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
          }
          // Column 7: Monthly Salary (Right aligned, formatted as Indian Rupees)
          else if (colIndex === 6) {
            cell.alignment = { horizontal: 'right', vertical: 'middle' };
            cell.font = { name: 'Consolas', size: 10, color: { argb: 'FF0F172A' } };
            cell.numFmt = '"₹"#,##0';
          }
          // Column 8: Salary Month
          else if (colIndex === 7) {
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
          }
          // Column 9: Payment Date
          else if (colIndex === 8) {
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
          }
          // Column 10: Payment Method
          else if (colIndex === 9) {
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
          }
          // Column 11: Payment Status (Conditional highlighting)
          else if (colIndex === 10) {
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            applyStatusStyle(cell, String(value));
          }
          // Column 12: Remarks (Wrapped & top aligned)
          else if (colIndex === 11) {
            cell.alignment = { horizontal: 'left', vertical: 'top', wrapText: true };
          }
        });
      });

      // 3. Auto-fit column widths
      worksheet.columns.forEach((col, colIndex) => {
        let maxLength = 0;
        col.eachCell({ includeEmpty: true }, (cell, rowNum) => {
          if (rowNum < 6) return; // Ignore titles
          let cellLen = 0;
          if (cell.value !== null && cell.value !== undefined) {
            if (colIndex === 6 && typeof cell.value === 'number') {
              const formatted = '₹' + cell.value.toLocaleString('en-IN');
              cellLen = formatted.length;
            } else {
              cellLen = String(cell.value).length;
            }
          }
          if (cellLen > maxLength) {
            maxLength = cellLen;
          }
        });
        col.width = Math.max(maxLength + 4, 12);
      });

      // 4. Set auto-filter for Row 6
      worksheet.autoFilter = {
        from: { row: 6, column: 1 },
        to: { row: 6, column: headers.length }
      };

      // 5. Generate and download file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const sanitizedName = selectedEmployee.employeeName.replace(/\s+/g, '_');
      link.download = `Payroll_History_Report_${selectedEmployee.employeeId}_${sanitizedName}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      onAddToast?.(`Payroll history for ${selectedEmployee.employeeName} exported as formatted Excel across all years!`, 'success');
    } catch (error) {
      console.error('Error generating Excel:', error);
      onAddToast?.('Failed to export Excel report.', 'error');
    }
  };

  const handleAddPaymentRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeId) return;

    const amt = parseFloat(paymentAmount);
    if (isNaN(amt) || amt <= 0) {
      onAddToast?.('Please enter a valid salary amount.', 'error');
      return;
    }

    const newSalaryMonth = `${paymentMonth} ${paymentYear}`;

    // Verify if record for this month already exists
    const duplicate = salaries.find(
      (s) => s.employeeId === selectedEmployeeId && s.salaryMonth === newSalaryMonth
    );

    if (duplicate) {
      onAddToast?.(`A payment record for ${newSalaryMonth} already exists.`, 'error');
      return;
    }

    onAddStaffSalary({
      employeeId: selectedEmployeeId,
      employeeName: selectedEmployee?.employeeName || '',
      role: selectedEmployee?.role || 'Designer',
      phoneNumber: selectedEmployee?.phoneNumber || '',
      monthlySalary: amt,
      salaryMonth: newSalaryMonth,
      paymentDate: paymentStatus === 'Paid' ? paymentDate : '',
      paymentMethod: paymentMethod,
      status: paymentStatus,
      remarks: paymentRemarks,
      email: selectedEmployee?.email || '',
      address: selectedEmployee?.address || '',
      joiningDate: selectedEmployee?.joiningDate || '',
      profilePhoto: selectedEmployee?.profilePhoto || '',
      referenceNumber: paymentRefNo.trim()
    });

    onAddToast?.(`Added salary record for ${newSalaryMonth}!`, 'success');
    setShowAddPaymentModal(false);
    
    // Clear Form Fields
    setPaymentRemarks('');
    setPaymentAmount('');
    setPaymentRefNo('');
  };

  const openAddPaymentModal = () => {
    if (selectedEmployee) {
      setPaymentAmount(selectedEmployee.monthlySalary.toString());
      setPaymentMonth(selectedMonth);
      setPaymentYear(selectedYear);
      setPaymentRefNo('');
      setShowAddPaymentModal(true);
    }
  };

  const openStatusUpdateModal = (
    emp: {
      employeeId: string;
      employeeName: string;
      role: SalaryRole;
      phoneNumber: string;
      monthlySalary: number;
      email?: string;
      address?: string;
      joiningDate?: string;
      profilePhoto?: string;
    },
    salaryMonth: string,
    currentStatus: SalaryStatus | 'Not Yet Due',
    existingRecord: StaffSalary | null
  ) => {
    setStatusTarget({
      employeeId: emp.employeeId,
      employeeName: emp.employeeName,
      role: emp.role,
      phoneNumber: emp.phoneNumber,
      monthlySalary: emp.monthlySalary,
      salaryMonth,
      currentStatus,
      existingRecord,
      email: emp.email,
      address: emp.address,
      joiningDate: emp.joiningDate,
      profilePhoto: emp.profilePhoto
    });

    const initStatus = currentStatus === 'Overdue' ? 'Paid' : currentStatus === 'Pending' ? 'Paid' : (currentStatus as SalaryStatus);
    setNewStatus(initStatus || 'Paid');
    setStatusPaymentDate(existingRecord?.paymentDate || new Date().toISOString().slice(0, 10));
    setStatusPaymentMethod(existingRecord?.paymentMethod || 'Bank Transfer');
    setStatusRefNo(existingRecord?.referenceNumber || '');
    setStatusRemarks(existingRecord?.remarks || '');

    setShowStatusModal(true);
  };

  const handleInitiateStatusUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusTarget) return;

    if (statusTarget.currentStatus === 'Paid' && newStatus === 'Pending') {
      onAddToast?.('Status cannot be changed from Paid back to Pending.', 'error');
      return;
    }

    if (newStatus === 'Paid' && !statusPaymentDate) {
      onAddToast?.('Please enter a valid payment date.', 'error');
      return;
    }

    setShowConfirmDialog(true);
  };

  const executeStatusUpdate = () => {
    if (!statusTarget) return;

    if (statusTarget.existingRecord) {
      const updatedRecord: StaffSalary = {
        ...statusTarget.existingRecord,
        status: newStatus,
        paymentDate: newStatus === 'Paid' ? statusPaymentDate : '',
        paymentMethod: statusPaymentMethod,
        referenceNumber: statusRefNo.trim(),
        remarks: statusRemarks.trim()
      };
      if (onUpdateStaffSalary) {
        onUpdateStaffSalary(updatedRecord);
      } else {
        onAddStaffSalary(updatedRecord);
      }
    } else {
      const newRecord: Omit<StaffSalary, 'id'> = {
        employeeId: statusTarget.employeeId,
        employeeName: statusTarget.employeeName,
        role: statusTarget.role,
        phoneNumber: statusTarget.phoneNumber,
        monthlySalary: statusTarget.monthlySalary,
        salaryMonth: statusTarget.salaryMonth,
        paymentDate: newStatus === 'Paid' ? statusPaymentDate : '',
        paymentMethod: statusPaymentMethod,
        status: newStatus,
        remarks: statusRemarks.trim(),
        referenceNumber: statusRefNo.trim(),
        email: statusTarget.email || '',
        address: statusTarget.address || '',
        joiningDate: statusTarget.joiningDate || '',
        profilePhoto: statusTarget.profilePhoto || ''
      };
      onAddStaffSalary(newRecord);
    }

    onAddToast?.(`Updated salary status for ${statusTarget.employeeName} (${statusTarget.salaryMonth}) to ${newStatus}`, 'success');
    setShowConfirmDialog(false);
    setShowStatusModal(false);
    setStatusTarget(null);
  };

  // Status Badge Rendering Helper
  const renderStatusBadge = (status: SalaryStatus | 'Not Yet Due') => {
    switch (status) {
      case 'Paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 font-bold text-[10px] uppercase tracking-wider border border-emerald-500/15">
            <CheckCircle className="h-3 w-3" />
            <span>PAID</span>
          </span>
        );
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-500 font-bold text-[10px] uppercase tracking-wider border border-amber-500/15 animate-pulse">
            <Clock className="h-3 w-3" />
            <span>PENDING</span>
          </span>
        );
      case 'Overdue':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-500 font-bold text-[10px] uppercase tracking-wider border border-rose-500/15">
            <AlertCircle className="h-3 w-3" />
            <span>OVERDUE</span>
          </span>
        );
      case 'Not Yet Due':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-500/10 text-slate-400 font-bold text-[10px] uppercase tracking-wider border border-slate-500/15">
            <HelpCircle className="h-3 w-3" />
            <span>Not Yet Due</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6" id="staff-management-dashboard">
      
      {/* ------------------- SCREEN 2: DETAILS SUB-VIEW ------------------- */}
      {selectedEmployeeId && selectedEmployee ? (
        <div className="space-y-6" id="staff-details-panel">
          {/* Back Header */}
          <div className="bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 p-6 rounded-3xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => setSelectedEmployeeId(null)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-amber-500 dark:text-slate-400 dark:hover:text-amber-400 mb-2 transition-colors cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Staff Roster</span>
              </button>
              <h1 className="text-xl font-serif font-black text-slate-900 dark:text-amber-400 uppercase tracking-wider flex items-center gap-2">
                <Users className="h-5 w-5 text-amber-500" />
                <span>Employee Profile Dossier</span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-widest mt-0.5">
                Verify credentials, historical logs, and mark active disbursements.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleExportEmployeeToExcel}
                className="py-3 px-5 border border-slate-200 hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-900/40 text-slate-700 dark:text-amber-400 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>Export Employee Excel</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Profile Dossier Column */}
            <div className="bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 p-6 rounded-3xl shadow-xs space-y-6 h-fit">
              <div className="flex flex-col items-center text-center">
                {selectedEmployee.profilePhoto ? (
                  <img
                    src={selectedEmployee.profilePhoto}
                    alt={selectedEmployee.employeeName}
                    className="h-24 w-24 rounded-full object-cover border-4 border-slate-100 dark:border-slate-900 shadow-sm mb-4"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="h-24 w-24 rounded-full bg-slate-900 text-amber-400 dark:bg-amber-500 dark:text-slate-950 font-black text-3xl flex items-center justify-center uppercase border-4 border-slate-100 dark:border-slate-900 shadow-sm mb-4 select-none">
                    {selectedEmployee.employeeName.charAt(0)}
                  </div>
                )}
                
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 font-mono font-bold text-[10px] uppercase tracking-widest border border-amber-500/15 mb-2">
                  {selectedEmployee.employeeId}
                </span>

                <h2 className="text-lg font-serif font-extrabold text-slate-900 dark:text-white">
                  {selectedEmployee.employeeName}
                </h2>

                <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">
                  {selectedEmployee.role}
                </p>
              </div>

              <hr className="border-slate-100 dark:border-slate-900/60" />

              {/* Core dossier parameters */}
              <div className="space-y-4 text-xs font-semibold">
                
                <div className="flex items-start gap-3.5">
                  <Phone className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phone</div>
                    <div className="text-slate-700 dark:text-slate-200 mt-0.5">{selectedEmployee.phoneNumber}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <Mail className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</div>
                    <div className="text-slate-700 dark:text-slate-200 mt-0.5 break-all">{selectedEmployee.email}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <Calendar className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Joining Date</div>
                    <div className="text-slate-700 dark:text-slate-200 mt-0.5">{formatDate(selectedEmployee.joiningDate || '')}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <DollarSign className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Monthly Salary</div>
                    <div className="text-slate-700 dark:text-slate-200 mt-0.5 font-bold text-sm">
                      {formatCurrency(selectedEmployee.monthlySalary)}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Residential Address</div>
                    <div className="text-slate-700 dark:text-slate-200 mt-0.5 leading-relaxed">{selectedEmployee.address}</div>
                  </div>
                </div>

              </div>
            </div>

            {/* History and current status area */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Current Selected Month Status Banner */}
              <div className="bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 p-6 rounded-3xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Current Period Tracking ({selectedFullMonth})
                  </div>
                  <div className="flex items-center gap-3 mt-1.5">
                    {renderStatusBadge(detailsMonthStatus)}
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Disbursed on: <strong className="text-slate-800 dark:text-slate-200">{detailsMonthPayDate}</strong>
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 italic">
                    "{detailsMonthRemarks}"
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openStatusUpdateModal(selectedEmployee, selectedFullMonth, detailsMonthStatus, currentMonthHistoryRecord || null)}
                    className="py-2.5 px-4 bg-slate-950 hover:bg-slate-900 text-amber-400 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                  >
                    <CreditCard className="h-4 w-4" />
                    <span>Update Status</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onEdit(selectedEmployee)}
                    className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800/80 text-slate-800 dark:text-amber-400 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Edit className="h-4 w-4" />
                    <span>Edit Profile</span>
                  </button>
                </div>
              </div>

              {/* History Table Container */}
              <div className="bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl shadow-xs overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-900/60 flex items-center justify-between gap-4 flex-wrap">
                  <div className="space-y-1">
                    <h3 className="text-sm font-serif font-black text-slate-900 dark:text-white uppercase tracking-wider">
                      Disbursement Logs
                    </h3>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                      Historical payments and monthly ledger transactions
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Sort Order Selector */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sort:</span>
                      <select
                        value={historySortOrder}
                        onChange={(e) => setHistorySortOrder(e.target.value as 'newest' | 'oldest')}
                        className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-amber-400 border border-slate-200 dark:border-slate-800 rounded-xl text-[10px] font-bold uppercase tracking-wider cursor-pointer focus:outline-none"
                      >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={openAddPaymentModal}
                      className="py-2.5 px-4 bg-slate-950 hover:bg-slate-900 text-amber-400 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer animate-none"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Log Payment</span>
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-900 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-900/20">
                        <th className="py-4 px-6">Month</th>
                        <th className="py-4 px-6">Year</th>
                        <th className="py-4 px-6">Monthly Salary</th>
                        <th className="py-4 px-6">Payment Date</th>
                        <th className="py-4 px-6">Payment Method</th>
                        <th className="py-4 px-6">Reference Number</th>
                        <th className="py-4 px-6">Status</th>
                        <th className="py-4 px-6">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-900/60 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {sortedHistory.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-slate-400 uppercase tracking-widest font-semibold text-[10px]">
                            No payments recorded yet for this employee.
                          </td>
                        </tr>
                      ) : (
                        sortedHistory.map((item) => {
                          const parts = item.salaryMonth.split(' ');
                          const monthStr = parts[0] || '—';
                          const yearStr = parts[1] || '—';
                          return (
                            <tr key={item.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-900/10">
                              <td className="py-4 px-6 text-slate-900 dark:text-white font-serif font-bold">
                                {monthStr}
                              </td>
                              <td className="py-4 px-6 text-slate-900 dark:text-white font-serif font-bold">
                                {yearStr}
                              </td>
                              <td className="py-4 px-6 font-mono font-bold">
                                {formatCurrency(item.monthlySalary)}
                              </td>
                              <td className="py-4 px-6 text-slate-500">
                                {item.paymentDate ? formatDate(item.paymentDate) : '—'}
                              </td>
                              <td className="py-4 px-6 text-slate-500">
                                {item.paymentMethod}
                              </td>
                              <td className="py-4 px-6 text-slate-500 font-mono">
                                {item.referenceNumber || '—'}
                              </td>
                              <td className="py-4 px-6">
                                <div className="flex items-center gap-2">
                                  {renderStatusBadge(item.status)}
                                  <button
                                    type="button"
                                    onClick={() => openStatusUpdateModal(selectedEmployee, item.salaryMonth, item.status, item)}
                                    className="p-1 text-slate-400 hover:text-amber-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 transition-all cursor-pointer"
                                    title="Update Status"
                                  >
                                    <Edit className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </td>
                              <td className="py-4 px-6 text-slate-500 max-w-xs truncate" title={item.remarks}>
                                {item.remarks || '—'}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

          </div>
        </div>
      ) : (
        /* ------------------- SCREEN 1: DASHBOARD MAIN ROSTER ------------------- */
        <div className="space-y-6" id="staff-dashboard-panel">
          {/* Dashboard Header Panel */}
          <div className="bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 p-6 rounded-3xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div>
              <h1 className="text-xl font-serif font-black text-slate-900 dark:text-amber-400 uppercase tracking-wider flex items-center gap-2">
                <Users className="h-5 w-5 text-amber-500" />
                <span>Staff Management</span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-widest mt-0.5">
                Manage employees, salaries and monthly payment status.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Dynamic Month Tracker Selectors */}
              <div className="inline-flex bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-800/60">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-3 py-1.5 bg-transparent border-none text-slate-700 dark:text-amber-400 text-xs font-bold uppercase tracking-wider cursor-pointer focus:outline-none"
                >
                  {MONTHS.map((m) => (
                    <option key={m} value={m} className="bg-white dark:bg-slate-950">
                      {m}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="px-3 py-1.5 bg-transparent border-none text-slate-700 dark:text-amber-400 text-xs font-bold uppercase tracking-wider cursor-pointer focus:outline-none"
                >
                  {YEARS.map((y) => (
                    <option key={y} value={y} className="bg-white dark:bg-slate-950">
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleExportAllToExcel}
                className="py-3 px-5 border border-slate-200 hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-900 text-slate-700 dark:text-amber-400 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>Export Excel</span>
              </button>

              <button
                type="button"
                onClick={onAddNew}
                className="py-3 px-5 bg-slate-950 hover:bg-slate-900 text-amber-400 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer shrink-0"
              >
                <Plus className="h-4 w-4" />
                <span>+ Add Staff</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 p-5 rounded-2xl shadow-xs flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Staff Strength</div>
                <div className="text-xl font-serif font-black text-slate-900 dark:text-white mt-0.5">{totalRosterCount}</div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 p-5 rounded-2xl shadow-xs flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Paid for {selectedMonth}</div>
                <div className="text-xl font-serif font-black text-slate-900 dark:text-white mt-0.5">{paidCount}</div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 p-5 rounded-2xl shadow-xs flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending for {selectedMonth}</div>
                <div className="text-xl font-serif font-black text-slate-900 dark:text-white mt-0.5">{pendingCount}</div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 p-5 rounded-2xl shadow-xs flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Overdue for {selectedMonth}</div>
                <div className="text-xl font-serif font-black text-slate-900 dark:text-white mt-0.5">{overdueCount}</div>
              </div>
            </div>

          </div>

          {/* Table Search & Filters Controls */}
          <div className="bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 p-5 rounded-2xl shadow-xs space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              
              {/* Search Employee input */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Search className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search Employee by Name, ID, Phone..."
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                />
              </div>

              {/* Filter by Role dropdown */}
              <div>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-slate-900 dark:text-slate-300 rounded-xl text-xs font-bold uppercase tracking-wider focus:outline-none focus:ring-1 focus:ring-amber-500/50 cursor-pointer"
                >
                  <option value="All">All Roles</option>
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter by Payment Status dropdown */}
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-slate-900 dark:text-slate-300 rounded-xl text-xs font-bold uppercase tracking-wider focus:outline-none focus:ring-1 focus:ring-amber-500/50 cursor-pointer"
                >
                  <option value="All">All Payment Statuses</option>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter by Payment Method dropdown */}
              <div>
                <select
                  value={methodFilter}
                  onChange={(e) => setMethodFilter(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-slate-900 dark:text-slate-300 rounded-xl text-xs font-bold uppercase tracking-wider focus:outline-none focus:ring-1 focus:ring-amber-500/50 cursor-pointer"
                >
                  <option value="All">All Payment Methods</option>
                  <option value="Bank">BANK</option>
                  <option value="Cash">CASH</option>
                  <option value="UPI">UPI</option>
                </select>
              </div>

            </div>
          </div>

          {/* Roster Table Grid */}
          <div className="bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-900 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-900/20">
                    <th className="py-4 px-6">Employee ID</th>
                    <th className="py-4 px-6">Employee Name</th>
                    <th className="py-4 px-6">Role</th>
                    <th className="py-4 px-6">Phone Number</th>
                    <th className="py-4 px-6">Monthly Salary</th>
                    <th className="py-4 px-6">Salary Month</th>
                    <th className="py-4 px-6">Payment Date</th>
                    <th className="py-4 px-6">Payment Status</th>
                    <th className="py-4 px-6">Remarks</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-900/60 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-400 uppercase tracking-widest font-semibold text-[10px]">
                        No staff records matched the active filter queries.
                      </td>
                    </tr>
                  ) : (
                    filteredEmployees.map((emp) => (
                      <tr key={emp.employeeId} className="hover:bg-slate-50/40 dark:hover:bg-slate-900/10">
                        <td className="py-4.5 px-6">
                          <span className="font-mono font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md text-[10px] border border-amber-500/15">
                            {emp.employeeId}
                          </span>
                        </td>
                        <td className="py-4.5 px-6 font-bold text-slate-900 dark:text-white">
                          <div className="flex items-center gap-3">
                            {emp.profilePhoto ? (
                              <img
                                src={emp.profilePhoto}
                                alt={emp.employeeName}
                                className="h-8 w-8 rounded-full object-cover shrink-0"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-slate-900 text-amber-400 dark:bg-amber-500/20 dark:text-amber-400 text-xs font-black flex items-center justify-center uppercase shrink-0">
                                {emp.employeeName.charAt(0)}
                              </div>
                            )}
                            <span>{emp.employeeName}</span>
                          </div>
                        </td>
                        <td className="py-4.5 px-6 text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                          {emp.role}
                        </td>
                        <td className="py-4.5 px-6 text-slate-500">{emp.phoneNumber}</td>
                        <td className="py-4.5 px-6 font-mono font-bold">{formatCurrency(emp.monthlySalary)}</td>
                        <td className="py-4.5 px-6 font-serif font-bold text-slate-500">{selectedFullMonth}</td>
                        <td className="py-4.5 px-6 text-slate-500">{emp.selectedMonthPayDate}</td>
                        <td className="py-4.5 px-6">
                          <div className="flex items-center gap-2">
                            {renderStatusBadge(emp.selectedMonthStatus)}
                            <button
                              type="button"
                              onClick={() => openStatusUpdateModal(emp, selectedFullMonth, emp.selectedMonthStatus, emp.rawRecord)}
                              className="p-1 text-slate-400 hover:text-amber-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 transition-all cursor-pointer"
                              title="Update Status"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                        <td className="py-4.5 px-6 text-slate-400 max-w-xs truncate" title={emp.selectedMonthRemarks}>
                          {emp.selectedMonthRemarks}
                        </td>
                        <td className="py-4.5 px-6 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* Update Status Action */}
                            <button
                              type="button"
                              onClick={() => openStatusUpdateModal(emp, selectedFullMonth, emp.selectedMonthStatus, emp.rawRecord)}
                              className="p-1.5 text-slate-500 hover:text-amber-500 dark:text-slate-400 dark:hover:text-amber-400 rounded-lg transition-all cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900"
                              title="Update Salary Status"
                            >
                              <CreditCard className="h-4.5 w-4.5" />
                            </button>
                            {/* View Action */}
                            <button
                              type="button"
                              onClick={() => setSelectedEmployeeId(emp.employeeId)}
                              className="p-1.5 text-slate-500 hover:text-amber-500 dark:text-slate-400 dark:hover:text-amber-400 rounded-lg transition-all cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900"
                              title="View dossier details"
                            >
                              <Eye className="h-4.5 w-4.5" />
                            </button>
                            {/* Edit Action */}
                            <button
                              type="button"
                              onClick={() => onEdit(emp)}
                              className="p-1.5 text-slate-500 hover:text-emerald-500 dark:text-slate-400 dark:hover:text-emerald-400 rounded-lg transition-all cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900"
                              title="Edit employee"
                            >
                              <Edit className="h-4.5 w-4.5" />
                            </button>
                            {/* Delete Action (only if they have a raw record for the current month, or the employee record itself) */}
                            <button
                              type="button"
                              onClick={() => {
                                // Delete the actual monthly salary disbursement record if it exists, otherwise delete employee profile (latest record)
                                const targetId = emp.selectedMonthRecordId || emp.id;
                                setDeletingId(targetId);
                              }}
                              className="p-1.5 text-slate-500 hover:text-rose-500 dark:text-slate-400 dark:hover:text-rose-400 rounded-lg transition-all cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900"
                              title="Delete transaction or record"
                            >
                              <Trash2 className="h-4.5 w-4.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ------------------- PAY DISBURSEMENT MODAL inside Staff Details ------------------- */}
      {showAddPaymentModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="p-6 border-b border-slate-100 dark:border-slate-900/60 flex items-center justify-between">
              <div>
                <h3 className="text-base font-serif font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Disburse Monthly Salary
                </h3>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                  Log a payment transaction for {selectedEmployee?.employeeName}
                </p>
              </div>
              <button
                onClick={() => setShowAddPaymentModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddPaymentRecord} className="p-6 space-y-4">
              
              <div className="grid grid-cols-2 gap-3.5">
                {/* Select Month */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Salary Month
                  </label>
                  <select
                    value={paymentMonth}
                    onChange={(e) => setPaymentMonth(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-slate-900 dark:text-slate-300 rounded-xl text-xs font-semibold focus:outline-none appearance-none cursor-pointer"
                  >
                    {MONTHS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Select Year */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Salary Year
                  </label>
                  <select
                    value={paymentYear}
                    onChange={(e) => setPaymentYear(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-slate-900 dark:text-slate-300 rounded-xl text-xs font-semibold focus:outline-none appearance-none cursor-pointer"
                  >
                    {YEARS.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Salary Amount */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Salary Amount ({currency})
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl text-xs font-semibold focus:outline-none"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Payment Status
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Paid', 'Pending', 'Overdue'] as SalaryStatus[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setPaymentStatus(st)}
                      className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all cursor-pointer ${
                        paymentStatus === st
                          ? 'bg-slate-950 border-slate-950 text-amber-400 dark:bg-amber-500 dark:border-amber-500 dark:text-slate-950 shadow-xs'
                          : 'bg-transparent border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Disbursement Date */}
              {paymentStatus === 'Paid' && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Disbursement Date
                  </label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl text-xs font-semibold focus:outline-none"
                  />
                </div>
              )}

              {/* Payment Method */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Bank', 'Cash', 'UPI'] as StaffPaymentMethod[]).map((met) => (
                    <button
                      key={met}
                      type="button"
                      onClick={() => setPaymentMethod(met)}
                      className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all cursor-pointer ${
                        paymentMethod === met
                          ? 'bg-slate-950 border-slate-950 text-amber-400 dark:bg-amber-500 dark:border-amber-500 dark:text-slate-950 shadow-xs'
                          : 'bg-transparent border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                      }`}
                    >
                      {met}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reference Number */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Reference Number / Txn ID
                </label>
                <input
                  type="text"
                  value={paymentRefNo}
                  onChange={(e) => setPaymentRefNo(e.target.value)}
                  placeholder="e.g. TXN9876543210"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl text-xs font-semibold focus:outline-none"
                />
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Transaction Remarks
                </label>
                <textarea
                  rows={2}
                  value={paymentRemarks}
                  onChange={(e) => setPaymentRemarks(e.target.value)}
                  placeholder="e.g. Cleared via bank draft..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl text-xs font-semibold focus:outline-none resize-none"
                />
              </div>

              <div className="pt-3.5 flex items-center justify-end gap-2.5 border-t border-slate-100 dark:border-slate-900/60">
                <button
                  type="button"
                  onClick={() => setShowAddPaymentModal(false)}
                  className="px-4 py-2.5 border border-slate-200 hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-slate-950 hover:bg-slate-900 text-amber-400 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span>Disburse</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------- DELETE CONFIRMATION MODAL ------------------- */}
      {deletingId && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="p-6 text-center space-y-4">
              <div className="mx-auto h-12 w-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-sm font-serif font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Delete Record?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Are you absolutely sure you want to delete this payment transaction? This ledger action is irreversible.
                </p>
              </div>
            </div>

            <div className="px-6 py-4.5 bg-slate-50 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-900/60 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="px-4 py-2.5 border border-slate-200 hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer"
              >
                No, Keep
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------- UPDATE SALARY STATUS MODAL ------------------- */}
      {showStatusModal && statusTarget && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="p-6 border-b border-slate-100 dark:border-slate-900/60 flex items-center justify-between">
              <div>
                <h3 className="text-base font-serif font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-amber-500" />
                  <span>Update Salary Status</span>
                </h3>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mt-0.5">
                  {statusTarget.employeeName} ({statusTarget.employeeId}) — {statusTarget.salaryMonth}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowStatusModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleInitiateStatusUpdate} className="p-6 space-y-5">
              
              {/* Employee Summary Card */}
              <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Salary Period</div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{statusTarget.salaryMonth}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Monthly Salary</div>
                  <div className="text-sm font-bold font-mono text-slate-900 dark:text-amber-400 mt-0.5">{formatCurrency(statusTarget.monthlySalary)}</div>
                </div>
              </div>

              {/* Status Selector */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Select Salary Payment Status
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Pending', 'Paid', 'Overdue'] as SalaryStatus[]).map((st) => {
                    const isPaidToPending = statusTarget.currentStatus === 'Paid' && st === 'Pending';
                    const isCurrent = statusTarget.currentStatus === st;
                    return (
                      <button
                        key={st}
                        type="button"
                        disabled={isPaidToPending}
                        onClick={() => setNewStatus(st)}
                        className={`py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-wider border transition-all flex flex-col items-center justify-center gap-1 ${
                          isPaidToPending
                            ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400'
                            : newStatus === st
                            ? 'bg-slate-950 border-slate-950 text-amber-400 dark:bg-amber-500 dark:border-amber-500 dark:text-slate-950 shadow-xs cursor-pointer'
                            : 'bg-transparent border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 cursor-pointer'
                        }`}
                      >
                        <span>{st}</span>
                        {isCurrent && (
                          <span className="text-[9px] font-semibold opacity-75">(Current)</span>
                        )}
                      </button>
                    );
                  })}
                </div>
                {statusTarget.currentStatus === 'Paid' && (
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1.5 font-medium">
                    Note: Changing from Paid back to Pending is not permitted.
                  </p>
                )}
              </div>

              {/* Fields for "Paid" Status */}
              {newStatus === 'Paid' && (
                <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-900/60">
                  {/* Payment Date */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Payment Date <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={statusPaymentDate}
                      onChange={(e) => setStatusPaymentDate(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  {/* Payment Method */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Payment Method <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {(['Cash', 'Bank Transfer', 'UPI', 'Cheque'] as StaffPaymentMethod[]).map((met) => (
                        <button
                          key={met}
                          type="button"
                          onClick={() => setStatusPaymentMethod(met)}
                          className={`py-2 px-2 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                            statusPaymentMethod === met
                              ? 'bg-slate-900 border-slate-900 text-amber-400 dark:bg-amber-500/20 dark:border-amber-500 dark:text-amber-400'
                              : 'bg-transparent border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                          }`}
                        >
                          {met}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Transaction Reference Number */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Transaction Reference Number <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={statusRefNo}
                      onChange={(e) => setStatusRefNo(e.target.value)}
                      placeholder="e.g. UTR / Cheque No / UPI Ref"
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                    />
                  </div>
                </div>
              )}

              {/* Remarks */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Remarks <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={statusRemarks}
                  onChange={(e) => setStatusRemarks(e.target.value)}
                  placeholder="e.g. Disbursed via online portal..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl text-xs font-semibold focus:outline-none resize-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100 dark:border-slate-900/60">
                <button
                  type="button"
                  onClick={() => setShowStatusModal(false)}
                  className="px-4 py-2.5 border border-slate-200 hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-slate-950 hover:bg-slate-900 text-amber-400 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
                >
                  <span>Proceed to Update</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------- CONFIRMATION DIALOG (Requirement 6) ------------------- */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="p-6 text-center space-y-4">
              <div className="mx-auto h-12 w-12 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-serif font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Update Salary Status
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                  Are you sure you want to change this employee's salary status?
                </p>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-900 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmDialog(false)}
                className="px-4 py-2.5 border border-slate-200 hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeStatusUpdate}
                className="px-4 py-2.5 bg-slate-950 hover:bg-slate-900 text-amber-400 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-sm"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

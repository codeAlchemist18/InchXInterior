/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Project, Invoice, InvoiceItem } from '../types';
import { FileSpreadsheet, Plus, Trash2, Printer, Download } from 'lucide-react';
import { jsPDF } from 'jspdf';

interface InvoiceGeneratorProps {
  projects: Project[];
  invoices: Invoice[];
  addInvoice: (inv: any) => void;
  onAddToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  companySettings?: any;
}

export default function InvoiceGenerator({
  projects,
  invoices,
  addInvoice,
  onAddToast,
  companySettings
}: InvoiceGeneratorProps) {
  // Client Metadata
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [customProjectName, setCustomProjectName] = useState<string>('');
  const [clientName, setClientName] = useState<string>('');
  const [clientAddress, setClientAddress] = useState<string>('');
  const [clientGst, setClientGst] = useState<string>('');

  // Selected existing invoice for preview/editing
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('');

  // Invoice Metadata
  const prefix = companySettings?.invoicePrefix || 'INC';
  const [invoiceNumber, setInvoiceNumber] = useState<string>(`${prefix}-2026-001`);
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState<string>(
    new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [gstPercent, setGstPercent] = useState<number>(18);
  const [discountAmount, setDiscountAmount] = useState<string>('0');
  const [paidAmount, setPaidAmount] = useState<string>('0');
  const [notes, setNotes] = useState<string>('');

  // Itemized breakdown items
  const [items, setItems] = useState<Omit<InvoiceItem, 'id'>[]>([]);

  // Sync state when list of invoices changes or company settings update
  useEffect(() => {
    if (!selectedInvoiceId) {
      const pfx = companySettings?.invoicePrefix || 'INC';
      const sequenceNum = String(invoices.length + 1).padStart(3, '0');
      let formattedInvoiceNumber = `${pfx}-2026-${sequenceNum}`;
      if (companySettings?.invoiceFormat) {
        const formatParts = companySettings.invoiceFormat.split('-');
        if (formatParts.length === 3) {
          formattedInvoiceNumber = `${pfx}-${formatParts[1]}-${sequenceNum}`;
        }
      }
      setInvoiceNumber(formattedInvoiceNumber);
      setGstPercent(companySettings?.defaultGst !== undefined ? Number(companySettings.defaultGst) : 18);
      setNotes(companySettings?.termsAndConditions || `Thank you for partnering with ${companySettings?.name || "INCHX INTERIO"}! Settlement is requested within 15 days of bill publication.`);
    }
  }, [invoices.length, selectedInvoiceId, companySettings]);

  // Load selected invoice's details into the editor
  const handleInvoiceSelect = (invoiceId: string) => {
    setSelectedInvoiceId(invoiceId);
    if (!invoiceId) {
      // Reset to defaults
      setSelectedProjectId('');
      setCustomProjectName('');
      setClientName('');
      setClientAddress('');
      setClientGst('');
      const pfx = companySettings?.invoicePrefix || 'INC';
      const sequenceNum = String(invoices.length + 1).padStart(3, '0');
      let formattedInvoiceNumber = `${pfx}-2026-${sequenceNum}`;
      if (companySettings?.invoiceFormat) {
        const formatParts = companySettings.invoiceFormat.split('-');
        if (formatParts.length === 3) {
          formattedInvoiceNumber = `${pfx}-${formatParts[1]}-${sequenceNum}`;
        }
      }
      setInvoiceNumber(formattedInvoiceNumber);
      setDate(new Date().toISOString().slice(0, 10));
      setDueDate(new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
      setGstPercent(companySettings?.defaultGst !== undefined ? Number(companySettings.defaultGst) : 18);
      setDiscountAmount('0');
      setPaidAmount('0');
      setNotes(companySettings?.termsAndConditions || `Thank you for partnering with ${companySettings?.name || "INCHX INTERIO"}! Settlement is requested within 15 days of bill publication.`);
      setItems([]);
      onAddToast('Reset to fresh invoice template', 'info');
      return;
    }

    const inv = invoices.find(i => i.id === invoiceId);
    if (inv) {
      setSelectedProjectId(inv.projectId);
      setCustomProjectName(inv.projectName || '');
      setClientName(inv.clientName);
      setClientAddress(inv.clientAddress);
      setClientGst(inv.clientGst || '');
      setInvoiceNumber(inv.invoiceNumber);
      setDate(inv.date);
      setDueDate(inv.dueDate);
      setGstPercent(18);
      setDiscountAmount((inv as any).discountAmount?.toString() || '0');
      setPaidAmount(inv.paidAmount.toString());
      setNotes(inv.notes || '');
      setItems(inv.items.map(it => ({
        description: it.description,
        quantity: it.quantity,
        rate: it.rate,
        amount: it.amount
      })));
      onAddToast(`Loaded Invoice ${inv.invoiceNumber} for editing & preview`, 'success');
    }
  };

  const formatCurrency = (amount: number) => {
    const currency = companySettings?.currency || 'INR';
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

  // Auto-fill client details when project changes
  const handleProjectSelect = (projId: string) => {
    setSelectedProjectId(projId);
    if (projId === 'custom' || !projId) {
      setClientName('');
      setClientAddress('');
      return;
    }
    const proj = projects.find(p => p.id === projId);
    if (proj) {
      setClientName(proj.clientName);
      setClientAddress(proj.address);
      setCustomProjectName(proj.name);
      onAddToast(`Imported details for ${proj.clientName}`, 'info');
    } else {
      setClientName('');
      setClientAddress('');
    }
  };

  // Remove itemized row
  const handleRemoveItemRow = (index: number) => {
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
  };

  // Math totals
  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const numericDiscount = Number(discountAmount) || 0;
  const subtotalAfterDiscount = Math.max(0, subtotal - numericDiscount);
  const gstAmount = Math.round(subtotalAfterDiscount * (gstPercent / 100));
  const totalAmount = subtotalAfterDiscount + gstAmount;
  const numericPaid = Number(paidAmount) || 0;
  const balanceAmount = Math.max(0, totalAmount - numericPaid);

  const currentProjectName = projects.find(p => p.id === selectedProjectId)?.name || customProjectName || 'General Project Site';

  // Submit invoice to store (creates or updates)
  const handlePublishInvoice = () => {
    if (!currentProjectName.trim()) {
      onAddToast('Please enter or select a project site for this invoice', 'error');
      return;
    }
    if (!clientName.trim()) {
      onAddToast('Please specify a client name', 'error');
      return;
    }
    if (items.length === 0) {
      onAddToast('Invoice must contain at least one billing line item', 'error');
      return;
    }

    addInvoice({
      id: selectedInvoiceId || undefined,
      invoiceNumber,
      date,
      clientName: clientName.trim(),
      clientAddress: clientAddress.trim() || 'Worksite Project Site, Hyderabad, India',
      clientGst: clientGst.trim(),
      companyName: companySettings?.name || "KALKI'S INCHX INTERIO",
      companyAddress: companySettings?.address || 'Skyline Business Enclave, Level 4, Jubilee Hills, Hyderabad',
      companyGst: companySettings?.gstNumber || '36AAFCD2948R1Z1',
      projectId: selectedProjectId || 'custom',
      projectName: currentProjectName.trim(),
      items: items.map((it, idx) => ({ ...it, id: `it-${Date.now()}-${idx}` })),
      totalAmount,
      paidAmount: numericPaid,
      balanceAmount,
      notes,
      status: numericPaid >= totalAmount ? 'paid' : numericPaid > 0 ? 'partially-paid' : 'unpaid',
      dueDate,
      discountAmount: numericDiscount
    });

    onAddToast(
      selectedInvoiceId 
        ? `Invoice ${invoiceNumber} updated successfully!` 
        : `Invoice ${invoiceNumber} successfully logged!`, 
      'success'
    );
  };

  // Generate and download a high-quality, pixel-perfect PDF using jsPDF
  const handleDownloadPDF = () => {
    const doc = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4'
    });

    // Luxury palette
    const primaryColor = [15, 23, 42]; // Slate-900 (#0f172a)
    const secondaryColor = [100, 116, 139]; // Slate-500
    const lightBg = [248, 250, 252]; // Slate-50
    const goldColor = [197, 160, 89]; // Warm Gold Accent (#C5A059)

    // --- Premium Dynamic Branding Header ---
    const companyNameUpper = (companySettings?.name || "KALKI'S INCHX INTERIO").toUpperCase();
    const companyAddrUpper = (companySettings?.address || "Skyline Business Enclave, Level 4, Jubilee Hills, Hyderabad").toUpperCase();
    const companyPhoneUpper = companySettings?.phone || "+91 40 4567 8900";
    const companyEmailUpper = (companySettings?.email || "studio@inchx.com").toUpperCase();
    const companyGstUpper = (companySettings?.gstNumber || "36AAFCD2948R1Z1").toUpperCase();

    // Check if we have a company logo and if it's base64
    const logoImg = companySettings?.logo || '';
    let hasLogo = false;
    
    if (logoImg && logoImg.startsWith('data:image/')) {
      try {
        // Draw logo centered
        doc.addImage(logoImg, 'PNG', 95, 8, 20, 20);
        hasLogo = true;
      } catch (err) {
        console.error('Failed to add logo to PDF', err);
      }
    }

    if (!hasLogo) {
      doc.setFont('times', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(0, 0, 0); // Black
      doc.text(companyNameUpper, 105 - doc.getTextWidth(companyNameUpper) / 2, 22);
    } else {
      doc.setFont('times', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text(companyNameUpper, 105 - doc.getTextWidth(companyNameUpper) / 2, 34);
    }

    // Tagline / Address info (centered below)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139); // Slate-500
    const taglineText = "E X C E L L E N C E   A T   Y O U R   D O O R   S T E P";
    doc.text(taglineText, 105 - doc.getTextWidth(taglineText) / 2, hasLogo ? 40 : 28);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184); // Slate-400
    doc.text(companyAddrUpper, 105 - doc.getTextWidth(companyAddrUpper) / 2, hasLogo ? 45 : 33);
    const contactLineText = `GSTIN: ${companyGstUpper} | TEL: ${companyPhoneUpper} | EMAIL: ${companyEmailUpper}`;
    doc.text(contactLineText, 105 - doc.getTextWidth(contactLineText) / 2, hasLogo ? 49 : 37);

    // Elegant Gold Border Separator
    const headerLineY = hasLogo ? 53 : 42;
    doc.setDrawColor(goldColor[0], goldColor[1], goldColor[2]);
    doc.setLineWidth(0.4);
    doc.line(15, headerLineY, 195, headerLineY);

    // Client Billing Details Section
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('BILL TO CLIENT:', 15, headerLineY + 11);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Client Name: ${clientName || 'N/A'}`, 15, headerLineY + 17);
    doc.text(`Project Location: ${clientAddress || 'N/A'}`, 15, headerLineY + 22);
    if (clientGst) {
      doc.text(`Client GST: ${clientGst}`, 15, headerLineY + 27);
    }

    // Invoice Meta (Due Date, etc.)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('BILLING STATEMENT', 125, headerLineY + 11);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Invoice #: ${invoiceNumber}`, 125, headerLineY + 17);
    doc.text(`Published: ${date}`, 125, headerLineY + 22);
    doc.text(`Due Date: ${dueDate}`, 125, headerLineY + 27);
    doc.text(`Project File: ${currentProjectName}`, 125, headerLineY + 32);

    // Draw Divider Line
    const tableDividerY = headerLineY + 39;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(15, tableDividerY, 195, tableDividerY);

    // Table Header
    const tableHeaderY = tableDividerY + 6;
    doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
    doc.rect(15, tableHeaderY, 180, 8, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('Scope / Line-Item description', 18, tableHeaderY + 5);
    doc.text('Qty', 120, tableHeaderY + 5);
    const currSym = companySettings?.currency || 'INR';
    doc.text(`Unit Rate (${currSym})`, 138, tableHeaderY + 5);
    doc.text(`Line Total (${currSym})`, 168, tableHeaderY + 5);

    // Table rows
    let currentY = tableHeaderY + 14;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);

    items.forEach((item) => {
      // Draw bottom border for rows
      doc.setDrawColor(241, 245, 249);
      doc.line(15, currentY + 3, 195, currentY + 3);

      doc.text(item.description, 18, currentY);
      doc.text(item.quantity.toString(), 121, currentY);
      doc.text(`${item.rate.toLocaleString()}`, 138, currentY);
      doc.text(`${item.amount.toLocaleString()}`, 168, currentY);

      currentY += 10;
    });

    // Summary calculation rows
    currentY += 5;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Subtotal:', 125, currentY);
    doc.text(`${subtotal.toLocaleString()}`, 168, currentY);

    if (numericDiscount > 0) {
      currentY += 7;
      doc.text('Discount:', 125, currentY);
      doc.text(`- ${numericDiscount.toLocaleString()}`, 168, currentY);
    }

    currentY += 7;
    doc.text(`Taxes (GST ${gstPercent}%):`, 125, currentY);
    doc.text(`${gstAmount.toLocaleString()}`, 168, currentY);

    currentY += 8;
    // Highlight Grand Total Box
    doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
    doc.rect(122, currentY - 5, 73, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('Grand Total (Gross):', 125, currentY);
    doc.text(`${totalAmount.toLocaleString()}`, 168, currentY);

    currentY += 7;
    doc.setFont('helvetica', 'normal');
    doc.text('Paid Advance:', 125, currentY);
    doc.text(`${numericPaid.toLocaleString()}`, 168, currentY);

    currentY += 7;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(190, 24, 74); // Rose-700
    doc.text('Outstanding Balance:', 125, currentY);
    doc.text(`${balanceAmount.toLocaleString()}`, 168, currentY);

    // Bank Remittance Details & Terms & Notes
    currentY += 15;
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('BANK REMITTANCE DETAILS:', 15, currentY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(`Bank Name: ${companySettings?.bankName || 'HDFC Bank Ltd'}`, 15, currentY + 4);
    doc.text(`Account Name: ${companySettings?.accountName || "KALKI'S INCHX INTERIO"}`, 15, currentY + 7);
    doc.text(`Account No: ${companySettings?.accountNumber || '50200084729402'}`, 15, currentY + 10);
    doc.text(`IFSC Code: ${companySettings?.ifscCode || 'HDFC0000041'}`, 15, currentY + 13);
    if (companySettings?.branchName) {
      doc.text(`Branch: ${companySettings.branchName}`, 15, currentY + 16);
    }
    if (companySettings?.upiId) {
      doc.text(`UPI ID: ${companySettings.upiId}`, 15, currentY + 19);
    }

    const termsY = currentY + (companySettings?.upiId ? 25 : 22);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('TERMS & NOTES:', 15, termsY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    const splitNotes = doc.splitTextToSize(notes, 110);
    doc.text(splitNotes, 15, termsY + 4);

    // Adjusted dynamic seal positioning
    const sealX = 110;
    const sealY = termsY + 15;
    const sealRadius = 9;
    doc.setDrawColor(goldColor[0], goldColor[1], goldColor[2]);
    doc.setLineWidth(0.4);
    doc.circle(sealX, sealY, sealRadius);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5);
    doc.setTextColor(goldColor[0], goldColor[1], goldColor[2]);
    const sealTxt1 = (companySettings?.name || 'INCHX').substring(0, 15).toUpperCase();
    doc.text(sealTxt1, sealX - doc.getTextWidth(sealTxt1) / 2, sealY - 1);
    doc.text("SEAL", sealX - doc.getTextWidth("SEAL") / 2, sealY + 3);

    // Signature Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('AUTHORIZED SIGNATORY', 140, termsY);

    const sigImg = companySettings?.signature || '';
    if (sigImg && sigImg.startsWith('data:image/')) {
      try {
        doc.addImage(sigImg, 'PNG', 140, termsY + 2, 45, 12);
      } catch (err) {
        console.error('Failed to draw signature image in PDF', err);
        doc.setFont('times', 'italic');
        doc.setFontSize(14);
        doc.setTextColor(goldColor[0], goldColor[1], goldColor[2]);
        doc.text(companySettings?.directorName || 'Kalki Prasad', 140, termsY + 10);
      }
    } else {
      doc.setFont('times', 'italic');
      doc.setFontSize(14);
      doc.setTextColor(goldColor[0], goldColor[1], goldColor[2]);
      doc.text(companySettings?.directorName || 'Kalki Prasad', 140, termsY + 10);
    }

    doc.setDrawColor(203, 213, 225);
    doc.line(140, termsY + 14, 190, termsY + 14);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(companySettings?.directorName || 'Kalki Prasad', 140, termsY + 18);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text('Studio Principal Director', 140, termsY + 22);

    // Footer
    doc.setDrawColor(226, 232, 240);
    doc.line(15, 280, 195, 280);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setFontSize(8);
    doc.text(`System-generated invoice. No physical seal required. Powered by ${companySettings?.name || "INCHX INTERIO"}.`, 15, 285);
    doc.text('Page 1 of 1', 185, 285);

    // Trigger Native File Save
    doc.save(`Invoice_${invoiceNumber}.pdf`);
    onAddToast('Symmetric PDF compiled. Initiating download.', 'success');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left Form Panel: 5 columns */}
      <div className="lg:col-span-5 space-y-4">
        <div className="bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-amber-500/15 p-5 rounded-3xl shadow-md text-xs font-semibold space-y-4">
          <h2 className="text-sm font-serif font-bold text-slate-900 dark:text-amber-400 flex items-center gap-2 uppercase tracking-wide">
            <FileSpreadsheet className="h-4.5 w-4.5 text-amber-500" />
            <span>Invoice Configurator</span>
          </h2>

          {/* Load Existing Invoice Option */}
          <div>
            <label className="block text-slate-500 dark:text-amber-500/60 mb-1 font-bold uppercase tracking-wider text-[10px]">Edit Existing Invoice</label>
            <select
              value={selectedInvoiceId}
              onChange={(e) => handleInvoiceSelect(e.target.value)}
              className="w-full p-2.5 border border-amber-300 dark:border-amber-900/60 bg-amber-50/25 dark:bg-amber-950/10 rounded-xl text-slate-900 dark:text-white font-bold focus:ring-1 focus:ring-amber-500 cursor-pointer"
            >
              <option value="">-- Create Fresh New Invoice --</option>
              {invoices.map(inv => (
                <option key={inv.id} value={inv.id}>
                  {inv.invoiceNumber} &bull; {inv.clientName} ({formatCurrency(inv.totalAmount)})
                </option>
              ))}
            </select>
          </div>

          {/* Project Target */}
          <div>
            <label className="block text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider text-[10px]">Project Name / Site *</label>
            {projects.length > 0 ? (
              <div className="space-y-2">
                <select
                  value={selectedProjectId}
                  onChange={(e) => handleProjectSelect(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 rounded-xl text-slate-900 dark:text-white cursor-pointer"
                >
                  <option value="">-- Choose Master Project --</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.clientName})</option>
                  ))}
                  <option value="custom">-- Type Custom Project --</option>
                </select>
                
                {(selectedProjectId === 'custom' || !selectedProjectId) && (
                  <input
                    type="text"
                    required
                    placeholder="e.g. Skyline Duplex - Gachibowli"
                    value={customProjectName}
                    onChange={(e) => setCustomProjectName(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 rounded-xl text-slate-900 dark:text-white font-bold"
                  />
                )}
              </div>
            ) : (
              <input
                type="text"
                required
                placeholder="e.g. Modern Villa - Jubilee Hills"
                value={customProjectName}
                onChange={(e) => setCustomProjectName(e.target.value)}
                className="w-full p-2.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 rounded-xl text-slate-900 dark:text-white font-bold"
              />
            )}
          </div>

          {/* Client Details */}
          <div>
            <label className="block text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider text-[10px]">Client Name *</label>
            <input
              type="text"
              required
              value={clientName}
              placeholder="Client Name"
              onChange={(e) => setClientName(e.target.value)}
              className="w-full p-2.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 rounded-xl text-slate-900 dark:text-white font-semibold"
            />
          </div>

          <div>
            <label className="block text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider text-[10px]">Client Location Address *</label>
            <textarea
              required
              rows={2}
              value={clientAddress}
              placeholder="Full mailing/site address"
              onChange={(e) => setClientAddress(e.target.value)}
              className="w-full p-2.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 rounded-xl text-slate-900 dark:text-white font-semibold resize-none"
            />
          </div>

          <div>
            <label className="block text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider text-[10px]">Client GSTIN (Optional)</label>
            <input
              type="text"
              value={clientGst}
              placeholder="GSTIN Code"
              onChange={(e) => setClientGst(e.target.value)}
              className="w-full p-2.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 rounded-xl text-slate-900 dark:text-white uppercase font-semibold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider text-[10px]">Invoice Code *</label>
              <input
                type="text"
                required
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full p-2.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 rounded-xl text-slate-900 dark:text-white font-bold"
              />
            </div>
            <div>
              <label className="block text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider text-[10px]">Taxes (GST %)</label>
              <input
                type="number"
                required
                value={gstPercent}
                onChange={(e) => setGstPercent(Number(e.target.value))}
                className="w-full p-2.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 rounded-xl text-slate-900 dark:text-white font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider text-[10px]">Published Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 rounded-xl text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider text-[10px]">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full p-2.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 rounded-xl text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Current Items List in Configurator */}
          <div className="space-y-3 border-t border-slate-100 dark:border-slate-800/60 pt-4">
            <div className="flex items-center justify-between">
              <label className="block text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">Line Items ({items.length})</label>
            </div>
            
            {items.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-slate-200 dark:border-slate-800/60 rounded-xl bg-slate-50/50 dark:bg-slate-900/10 text-slate-400 dark:text-slate-500 text-xs font-medium">
                No line items added yet. Click "+ Add Row Item" below to create one.
              </div>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {items.map((item, idx) => (
                  <div key={idx} className="p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/40 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1">
                        <label className="block text-[8px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-extrabold mb-0.5">Description</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Italian Marble layout design"
                          value={item.description}
                          onChange={(e) => {
                            const updated = items.map((it, i) => i === idx ? { ...it, description: e.target.value } : it);
                            setItems(updated);
                          }}
                          className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 text-xs text-slate-850 dark:text-slate-200 font-bold focus:ring-1 focus:ring-amber-500 outline-hidden"
                        />
                      </div>
                      <div className="shrink-0 pt-3">
                        <button
                          type="button"
                          onClick={() => handleRemoveItemRow(idx)}
                          className="text-rose-500 hover:text-rose-700 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 cursor-pointer shrink-0"
                          title="Remove Row"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <label className="block text-[8px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-extrabold mb-0.5">Quantity</label>
                        <input
                          type="number"
                          placeholder="Qty"
                          value={item.quantity || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            const qty = val === '' ? 0 : Math.max(0, Number(val));
                            const updated = items.map((it, i) => i === idx ? { ...it, quantity: qty, amount: qty * it.rate } : it);
                            setItems(updated);
                          }}
                          className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-1.5 py-0.5 font-semibold text-slate-850 dark:text-slate-200 text-center"
                        />
                      </div>
                      <div>
                        <label className="block text-[8px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-extrabold mb-0.5">Rate ({companySettings?.currency || 'INR'})</label>
                        <input
                          type="number"
                          placeholder="Rate"
                          value={item.rate || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            const rate = val === '' ? 0 : Math.max(0, Number(val));
                            const updated = items.map((it, i) => i === idx ? { ...it, rate, amount: it.quantity * rate } : it);
                            setItems(updated);
                          }}
                          className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-1.5 py-0.5 font-semibold text-slate-850 dark:text-slate-200 text-center"
                        />
                      </div>
                      <div className="text-right flex flex-col justify-end pb-1 pr-1">
                        <span className="block text-[8px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-extrabold mb-0.5">Total</span>
                        <span className="font-black text-slate-700 dark:text-amber-400/90 font-serif">
                          {formatCurrency(item.amount)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* + Add Row Item Button */}
            <button
              type="button"
              onClick={() => {
                setItems([
                  ...items,
                  { description: '', quantity: 1, rate: 0, amount: 0 }
                ]);
              }}
              className="w-full py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/30 dark:hover:bg-slate-900/60 text-slate-700 dark:text-slate-200 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center gap-1 cursor-pointer font-bold text-xs"
            >
              <Plus className="h-3.5 w-3.5 text-amber-500" /> Add Row Item
            </button>
          </div>

          {/* Discount and Paid Advance inputs */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider text-[10px]">Discount (Optional {companySettings?.currency || 'INR'})</label>
              <input
                type="number"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(e.target.value)}
                placeholder="0"
                className="w-full p-2.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 rounded-xl text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider text-[10px]">Paid Advance (Deductions {companySettings?.currency || 'INR'}) *</label>
              <input
                type="number"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                className="w-full p-2.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 rounded-xl text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Custom Notes */}
          <div>
            <label className="block text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider text-[10px]">Settlement Notes & Terms</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 rounded-xl text-slate-900 dark:text-white resize-none"
            />
          </div>

          <div className="pt-2 flex gap-2">
            <button
              onClick={handlePublishInvoice}
              className="flex-1 py-2.5 bg-slate-950 hover:bg-slate-900 text-amber-400 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400 rounded-xl font-bold transition-all text-center cursor-pointer uppercase tracking-wider text-xs"
            >
              {selectedInvoiceId ? 'Update & Save Invoice' : 'Post to Bookkeeping'}
            </button>
          </div>
        </div>
      </div>

      {/* Right Paper Invoice Preview Panel: 7 columns */}
      <div className="lg:col-span-7 space-y-4">
        {/* Actions bar */}
        <div className="bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-amber-500/15 p-3 rounded-xl flex items-center justify-between gap-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2">
            Invoice Preview Panel
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => window.print()}
              className="py-1.5 px-3 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-900 flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              <span>Print layout</span>
            </button>
            <button
              onClick={handleDownloadPDF}
              className="py-1.5 px-3 bg-amber-500 text-slate-950 rounded-lg text-xs font-bold hover:bg-amber-400 flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
            >
              <Download className="h-4 w-4" />
              <span>Download PDF File</span>
            </button>
          </div>
        </div>

        {/* Paper visualizer */}
        <div className="forced-light bg-white text-slate-900 p-8 rounded-2xl border border-slate-200 shadow-md max-w-2xl mx-auto print:border-none print:shadow-none font-sans text-xs space-y-6">
          
          {/* Dynamic Header branding */}
          <div className="flex flex-col items-center text-center pb-6 border-b border-amber-500/30">
            {companySettings?.logo ? (
              <img src={companySettings.logo} alt="Company Logo" className="h-16 w-16 object-contain mb-2" referrerPolicy="no-referrer" />
            ) : (
              <div 
                style={{ fontFamily: "'Cinzel', serif" }} 
                className="text-[11px] font-bold tracking-[0.25em] text-[#C5A059] mb-1.5 uppercase"
              >
                STUDIO DIRECTIVE
              </div>
            )}
            <h1 
              style={{ fontFamily: "'Cinzel', serif" }} 
              className="text-4xl font-black tracking-[0.1em] leading-none text-slate-900 uppercase"
            >
              {companySettings?.name || "INCHX INTERIO"}
            </h1>
            <p 
              style={{ fontFamily: "'Montserrat', sans-serif" }} 
              className="text-[7.5px] font-medium tracking-[0.3em] text-slate-500 uppercase mt-2.5"
            >
              EXCELLENCE AT YOUR DOOR STEP
            </p>
            <p className="text-[9px] text-slate-400 mt-3.5 leading-normal uppercase tracking-wider max-w-md">
              {companySettings?.address || "Skyline Business Enclave, Level 4, Jubilee Hills, Hyderabad"}<br />
              GSTIN: {companySettings?.gstNumber || "36AAFCD2948R1Z1"} | Tel: {companySettings?.phone || "+91 40 4567 8900"}
            </p>
          </div>

          {/* Customer Metadata & Info */}
          <div className="grid grid-cols-2 gap-6 pt-2">
            <div>
              <span className="text-[9px] font-bold text-amber-600 uppercase tracking-wider block mb-1">
                BILL TO CLIENT:
              </span>
              <div className="font-bold text-slate-800 text-xs">
                {clientName || '--- Enter Client Name ---'}
              </div>
              <p className="text-[10px] text-slate-500 mt-1 leading-normal max-w-[240px]">
                {clientAddress || 'Enter project address details in the configurator form.'}
              </p>
              {clientGst && <div className="text-[9px] text-slate-400 mt-1">GSTIN: {clientGst}</div>}
            </div>

            <div className="text-right">
              <span className="text-[9px] font-bold text-amber-600 uppercase tracking-wider block mb-1">
                BILLING STATEMENT:
              </span>
              <div className="text-[10px] text-slate-600 mt-1 space-y-1">
                <div>Invoice Code: <strong className="text-slate-800">{invoiceNumber}</strong></div>
                <div>Date: <strong className="text-slate-800">{date}</strong></div>
                <div>Due Date: <strong className="text-rose-700">{dueDate}</strong></div>
                <div>Project File: <strong className="text-slate-850 uppercase font-bold">{currentProjectName}</strong></div>
              </div>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="pt-4">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-bold uppercase text-[9px] tracking-wider border-b border-slate-200">
                  <th className="py-2.5 px-3">Scope / Line-Item Description</th>
                  <th className="py-2.5 px-2 text-center w-12">Qty</th>
                  <th className="py-2.5 px-2 text-right w-32">Unit Rate ({companySettings?.currency || 'INR'})</th>
                  <th className="py-2.5 px-3 text-right w-36">Gross Total ({companySettings?.currency || 'INR'})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[11px] font-medium text-slate-700">
                {items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-3 px-3 text-slate-800 font-semibold">{item.description}</td>
                    <td className="py-3 px-2 text-center">{item.quantity}</td>
                    <td className="py-3 px-2 text-right">{formatCurrency(item.rate)}</td>
                    <td className="py-3 px-3 text-right text-slate-900 font-bold">{formatCurrency(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Math calculations rows */}
          <div className="flex justify-end pt-4">
            <div className="w-72 space-y-2 text-[11px] font-medium text-slate-600 border-t border-slate-100 pt-3">
              <div className="flex justify-between">
                <span>Subtotal (Net):</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {numericDiscount > 0 && (
                <div className="flex justify-between text-rose-600 font-semibold">
                  <span>Discount:</span>
                  <span>-{formatCurrency(numericDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Taxes (GST {gstPercent}%):</span>
                <span>{formatCurrency(gstAmount)}</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-slate-900 bg-slate-50 p-2 rounded">
                <span>Grand Total (Gross):</span>
                <span>{formatCurrency(totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Paid Advance / Credit:</span>
                <span className="text-emerald-600">{formatCurrency(numericPaid)}</span>
              </div>
              <div className="flex justify-between text-xs font-black text-rose-700 border-t border-dashed border-slate-200 pt-2">
                <span>Outstanding Balance Due:</span>
                <span>{formatCurrency(balanceAmount)}</span>
              </div>
            </div>
          </div>

          {/* Terms, Bank Details & Footer */}
          <div className="pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-[9px] font-bold text-amber-600 uppercase tracking-wider block mb-1">
                BANK REMITTANCE DETAILS:
              </span>
              <div className="text-[9.5px] text-slate-600 leading-normal space-y-0.5 font-semibold">
                <div>Bank Name: <span className="text-slate-800 font-bold">{companySettings?.bankName || 'HDFC Bank Ltd'}</span></div>
                <div>Account Name: <span className="text-slate-800 font-bold">{companySettings?.accountName || "KALKI'S INCHX INTERIO"}</span></div>
                <div>Account No: <span className="text-slate-800 font-bold">{companySettings?.accountNumber || '50200084729402'}</span></div>
                <div>IFSC Code: <span className="text-slate-800 font-bold">{companySettings?.ifscCode || 'HDFC0000041'}</span></div>
                {companySettings?.branchName && <div>Branch: <span className="text-slate-800 font-bold">{companySettings.branchName}</span></div>}
                {companySettings?.upiId && <div>UPI ID: <span className="text-slate-800 font-bold">{companySettings.upiId}</span></div>}
              </div>
            </div>

            <div>
              <span className="text-[9px] font-bold text-amber-600 block mb-1 uppercase tracking-wider">
                NOTES & SETTLEMENT TERMS:
              </span>
              <p className="text-[9px] text-slate-500 leading-normal whitespace-pre-wrap font-medium">
                {notes}
              </p>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex justify-between items-end">
            <div className="text-[8px] text-slate-400 max-w-[200px] uppercase font-bold tracking-tight">
              Symmetric billing token registered. Powered by Kalki's Inchx Interio.
            </div>

            {/* Premium Dynamic Signatory Panel with Seal */}
            <div className="flex flex-col items-center text-center w-52 pt-2 relative shrink-0">
              {/* Company Seal Circular Graphic */}
              <div className="absolute -left-12 -top-6 h-16 w-16 rounded-full border border-dashed border-[#C5A059]/50 flex items-center justify-center rotate-12 bg-[#C5A059]/5 select-none z-10 pointer-events-none">
                <div className="text-[5.5px] text-[#C5A059] font-extrabold uppercase tracking-tighter text-center leading-[6px]">
                  {(companySettings?.name || 'INCHX').substring(0, 15)}<br />
                  <span className="text-[4px] text-slate-400">OFFICIAL SEAL</span>
                </div>
              </div>

              {/* Dynamic Signature Display (Image or script font fallback) */}
              <div className="h-10 flex items-center justify-center mb-1 z-20">
                {companySettings?.signature ? (
                  <img src={companySettings.signature} alt="Signature" className="max-h-10 max-w-[130px] object-contain" referrerPolicy="no-referrer" />
                ) : (
                  <span className="font-serif italic text-[#C5A059] text-base tracking-widest select-none" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
                    {companySettings?.directorName || 'Kalki Prasad'}
                  </span>
                )}
              </div>

              <div className="w-full border-t border-slate-300 pt-1">
                <div className="font-bold text-slate-800 text-[9px] uppercase tracking-wide truncate">
                  {companySettings?.directorName || 'Kalki Prasad'}
                </div>
                <div className="text-[8px] text-slate-400 uppercase font-bold tracking-tight">
                  Studio Principal Director
                </div>
                <div className="text-[7.5px] text-slate-300 uppercase tracking-wider font-extrabold mt-0.5">
                  Authorized Signatory
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

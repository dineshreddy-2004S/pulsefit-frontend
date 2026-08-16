import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { formatDate } from './dateFormatter';

// 1. Export Analytics & Members to PDF
export const exportToPDF = ({ gymName, ownerName, timeRangeLabel, metrics, members }) => {
  const doc = new jsPDF('p', 'pt', 'a4');

  // Brand Header
  doc.setFillColor(7, 9, 14);
  doc.rect(0, 0, 595.28, 90, 'F');

  doc.setTextColor(0, 242, 254);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(gymName || 'PULSE FIT FACILITY', 40, 40);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Financial & Membership Report • Period: ${timeRangeLabel}`, 40, 58);
  doc.text(`Gym Owner: ${ownerName || 'Management'}  |  Generated: ${formatDate(new Date())}`, 40, 72);

  // Financial Summary Cards in PDF
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Financial Summary Breakdown', 40, 120);

  const summaryData = [
    ['Collected Revenue', `INR ${Number(metrics.collected).toLocaleString('en-IN')}`],
    ['Pending Dues', `INR ${Number(metrics.dues).toLocaleString('en-IN')}`],
    ['Total Billed', `INR ${Number(metrics.billed).toLocaleString('en-IN')}`],
    ['Enrollment Count in Period', `${metrics.count} Members`]
  ];

  autoTable(doc, {
    startY: 130,
    head: [['Metric', 'Amount / Value']],
    body: summaryData,
    theme: 'grid',
    headStyles: { fillColor: [11, 15, 25], textColor: [0, 242, 254], fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 5 }
  });

  // Detailed Members Table
  const finalY = doc.lastAutoTable.finalY + 25;
  doc.text('Enrolled Members Roster', 40, finalY);

  const tableRows = members.map((m, idx) => [
    idx + 1,
    m.full_name,
    m.phone,
    m.plan_type,
    `INR ${Number(m.amount_paid).toLocaleString('en-IN')}`,
    `INR ${Number(m.balance_due).toLocaleString('en-IN')}`,
    formatDate(m.start_date),
    formatDate(m.expiry_date)
  ]);

  autoTable(doc, {
    startY: finalY + 10,
    head: [['#', 'Member Name', 'Phone', 'Plan', 'Paid', 'Due', 'Joined', 'Expires']],
    body: tableRows,
    theme: 'striped',
    headStyles: { fillColor: [121, 40, 202], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 4 },
    alternateRowStyles: { fillColor: [245, 247, 250] }
  });

  // Save File
  const cleanName = (gymName || 'PulseFit').replace(/\s+/g, '_');
  doc.save(`${cleanName}_Financial_Report_${timeRangeLabel.replace(/\s+/g, '_')}.pdf`);
};

// 2. Export Analytics & Members to Excel (.xlsx)
export const exportToExcel = ({ gymName, timeRangeLabel, metrics, members }) => {
  const summarySheetData = [
    ['PULSE FIT GYM MANAGEMENT SYSTEM - FINANCIAL REPORT'],
    ['Gym / Brand Name:', gymName || 'Pulse Fit Facility'],
    ['Report Period:', timeRangeLabel],
    ['Export Date:', formatDate(new Date())],
    [],
    ['METRIC SUMMARY', 'VALUE (INR)'],
    ['Collected Revenue', Number(metrics.collected)],
    ['Pending Dues', Number(metrics.dues)],
    ['Total Billed Fee', Number(metrics.billed)],
    ['Member Enrollments', metrics.count]
  ];

  const membersSheetData = [
    ['#', 'Full Name', 'Phone Number', 'Email', 'Plan Duration', 'Total Fee (INR)', 'Paid (INR)', 'Due (INR)', 'Payment Status', 'Joining Date', 'Expiry Date']
  ];

  members.forEach((m, idx) => {
    membersSheetData.push([
      idx + 1,
      m.full_name,
      m.phone,
      m.email || '—',
      m.plan_type,
      Number(m.total_amount || m.amount_paid),
      Number(m.amount_paid),
      Number(m.balance_due || 0),
      m.payment_status || 'PAID',
      formatDate(m.start_date),
      formatDate(m.expiry_date)
    ]);
  });

  const wb = XLSX.utils.book_new();
  const wsSummary = XLSX.utils.aoa_to_sheet(summarySheetData);
  const wsMembers = XLSX.utils.aoa_to_sheet(membersSheetData);

  XLSX.utils.book_append_sheet(wb, wsSummary, 'Revenue Summary');
  XLSX.utils.book_append_sheet(wb, wsMembers, 'Members Details');

  const cleanName = (gymName || 'PulseFit').replace(/\s+/g, '_');
  XLSX.writeFile(wb, `${cleanName}_Analytics_${timeRangeLabel.replace(/\s+/g, '_')}.xlsx`);
};
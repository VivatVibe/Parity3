import { Invoice } from '../domain/storage';
import { aggregatePnd90, TAX_CATEGORIES, TaxCategory } from '../domain/tax';

function escapeCsvCell(cell: string | number | undefined | null): string {
  if (cell === undefined || cell === null) return '""';
  const str = String(cell);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

export function generatePnd90Csv(invoices: Invoice[]): string {
  const summary = aggregatePnd90(invoices);
  const rows: string[][] = [];

  // Header 1: Overall Summary
  rows.push(['รายงานสรุปข้อมูลภาษีเงินได้บุคคลธรรมดา (ภ.ง.ด. 90) และภาษีหัก ณ ที่จ่าย 3%']);
  rows.push([`วันที่ออกรายงาน: ${new Date().toLocaleDateString('th-TH')} ${new Date().toLocaleTimeString('th-TH')}`]);
  rows.push([]);

  // Section 1: KPI Summary
  rows.push(['--- ข้อมูลสรุปภาพรวม ---']);
  rows.push(['รายการ', 'จำนวนเงิน (บาท)']);
  rows.push(['รายรับรวมทุกช่องทาง (Gross Income)', summary.totalGrossIncome.toFixed(2)]);
  rows.push(['ภาษีถูกหัก ณ ที่จ่ายสะสม 3% (Tax Credit)', summary.totalWhtCredit.toFixed(2)]);
  rows.push(['ยอดเงินโอนสุทธิที่ได้รับจริง (Net Total)', (summary.totalGrossIncome - summary.totalWhtCredit).toFixed(2)]);
  rows.push(['จำนวนใบหัก ณ ที่จ่าย (50 ทวิ) ที่ได้รับแล้ว', `${summary.received50TawiTotal} ฉบับ`]);
  rows.push(['จำนวนใบหัก ณ ที่จ่าย (50 ทวิ) ที่ยังรอทวงถาม', `${summary.pending50TawiTotal} ฉบับ`]);
  rows.push([]);

  // Section 2: Breakdown by P.N.D. 90 Category
  rows.push(['--- สรุปแยกตามหมวดเงินได้พึงประเมิน (ภ.ง.ด. 90) ---']);
  rows.push(['หมวดเงินได้', 'จำนวนบิล', 'ยอดเงินได้รวม (บาท)', 'ภาษีถูกหัก 3% (บาท)', 'เกณฑ์หักค่าใช้จ่ายเหมาตามกฎหมาย']);

  (Object.keys(summary.byCategory) as TaxCategory[]).forEach(catKey => {
    const cat = summary.byCategory[catKey];
    const meta = TAX_CATEGORIES[catKey];
    rows.push([
      meta.nameThai,
      cat.invoiceCount.toString(),
      cat.grossIncome.toFixed(2),
      cat.whtDeducted.toFixed(2),
      meta.expenseDeductionRule
    ]);
  });
  rows.push([]);

  // Section 3: Detailed Invoice Transactions
  rows.push(['--- รายละเอียดรายการวางบิลทั้งหมด ---']);
  rows.push([
    'เลขที่บิล',
    'วันที่ออกเอกสาร',
    'ครบกำหนด',
    'ชื่อลูกค้า/ผู้ว่าจ้าง',
    'เลขผู้เสียภาษีลูกค้า',
    'หมวดเงินได้',
    'ยอดรวมก่อนหัก (บาท)',
    'หัก ณ ที่จ่าย 3% (บาท)',
    'ยอดสุทธิ (บาท)',
    'สถานะใบ 50 ทวิ',
    'สถานะเอกสาร',
    'หมายเหตุ'
  ]);

  invoices.forEach(inv => {
    const meta = TAX_CATEGORIES[inv.category];
    rows.push([
      inv.invoiceNumber,
      inv.issueDate,
      inv.dueDate,
      inv.clientName,
      inv.clientTaxId || '-',
      meta?.categoryLabel || inv.category,
      inv.subtotal.toFixed(2),
      inv.whtAmount.toFixed(2),
      inv.netTotal.toFixed(2),
      inv.has50Tawi ? 'ได้รับแล้ว' : 'รอทวงถาม',
      inv.status,
      inv.notes || ''
    ]);
  });

  // UTF-8 BOM \uFEFF ensures Microsoft Excel on Windows & Mac opens Thai characters correctly
  const csvContent = '\uFEFF' + rows.map(row => row.map(escapeCsvCell).join(',')).join('\r\n');
  return csvContent;
}

export function downloadPnd90Csv(invoices: Invoice[]): void {
  const csvData = generatePnd90Csv(invoices);
  const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const dateStr = new Date().toISOString().slice(0, 10);
  link.setAttribute('download', `PND90_Tax_Summary_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

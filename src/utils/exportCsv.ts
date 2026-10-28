import { Invoice } from '../domain/storage';
import { aggregatePnd90, estimatePnd90Tax, TAX_BRACKETS, TAX_CATEGORIES, TaxCategory, TaxDeductionProfile } from '../domain/tax';

function escapeCsvCell(cell: string | number | undefined | null): string {
  if (cell === undefined || cell === null) return '""';
  const str = String(cell);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

export function generatePnd90Csv(invoices: Invoice[], deductions?: TaxDeductionProfile | number): string {
  const summary = aggregatePnd90(invoices);
  const taxEstimate = estimatePnd90Tax(summary, deductions);
  const rows: string[][] = [];

  // Header 1: Title and Export Timestamp
  rows.push(['รายงานสรุปข้อมูลภาษีเงินได้บุคคลธรรมดา (ภ.ง.ด. 90) และภาษีหัก ณ ที่จ่าย 3%']);
  rows.push([`วันที่ออกรายงาน: ${new Date().toLocaleDateString('th-TH')} ${new Date().toLocaleTimeString('th-TH')}`]);
  rows.push([]);

  // Section 1: KPI Summary
  rows.push(['--- 1. ข้อมูลสรุปภาพรวมรายรับและเครดิตภาษี ---']);
  rows.push(['รายการ', 'จำนวนเงิน (บาท)']);
  rows.push(['รายรับรวมทุกช่องทาง (Gross Income)', summary.totalGrossIncome.toFixed(2)]);
  rows.push(['ภาษีถูกหัก ณ ที่จ่ายสะสม 3% (Tax Credit)', summary.totalWhtCredit.toFixed(2)]);
  rows.push(['ยอดเงินโอนสุทธิที่ได้รับจริง (Net Received)', (summary.totalGrossIncome - summary.totalWhtCredit).toFixed(2)]);
  rows.push(['จำนวนใบหัก ณ ที่จ่าย (50 ทวิ) ที่ได้รับแล้ว', `${summary.received50TawiTotal} ฉบับ`]);
  rows.push(['จำนวนใบหัก ณ ที่จ่าย (50 ทวิ) ที่ยังรอทวงถาม', `${summary.pending50TawiTotal} ฉบับ`]);
  rows.push([]);

  // Section 2: Comprehensive Tax Computation & Settlement
  rows.push(['--- 2. สรุปการคำนวณภาษีเงินได้สุทธิ และยอดขอคืนภาษี (ภ.ง.ด. 90) ---']);
  rows.push(['ขั้นตอนการคำนวณภาษีตามกฎหมายสรรพากร', 'จำนวนเงิน (บาท)']);
  rows.push(['1. เงินได้พึงประเมินรวมทั้งปี', taxEstimate.totalGrossIncome.toFixed(2)]);
  rows.push(['2. หักค่าใช้จ่ายเหมาตามกฎหมายสรรพากร', `-${taxEstimate.totalExpenses.toFixed(2)}`]);
  rows.push(['   -> เงินได้หลังหักค่าใช้จ่าย', (taxEstimate.totalGrossIncome - taxEstimate.totalExpenses).toFixed(2)]);
  rows.push(['3. รายการหักลดหย่อนภาษีที่ใช้สิทธิ์:']);
  rows.push(['   - ค่าลดหย่อนส่วนตัวผู้มีเงินได้', `-${taxEstimate.deductionsBreakdown.personal.toFixed(2)}`]);
  if (taxEstimate.deductionsBreakdown.socialSecurity > 0) {
    rows.push(['   - เงินสมทบประกันสังคม (ม.33/39/40)', `-${taxEstimate.deductionsBreakdown.socialSecurity.toFixed(2)}`]);
  }
  if (taxEstimate.deductionsBreakdown.insurance > 0) {
    rows.push(['   - เบี้ยประกันสุขภาพและประกันชีวิต (เพดาน 100k)', `-${taxEstimate.deductionsBreakdown.insurance.toFixed(2)}`]);
  }
  if (taxEstimate.deductionsBreakdown.retirementFunds > 0) {
    rows.push(['   - กองทุนเกษียณ / Thai ESG / RMF / SSF (เพดาน 30%)', `-${taxEstimate.deductionsBreakdown.retirementFunds.toFixed(2)}`]);
  }
  if (taxEstimate.deductionsBreakdown.other > 0) {
    rows.push(['   - ค่าลดหย่อนอื่นๆ', `-${taxEstimate.deductionsBreakdown.other.toFixed(2)}`]);
  }
  rows.push(['   -> รวมค่าลดหย่อนภาษีทั้งหมด', `-${taxEstimate.totalDeductions.toFixed(2)}`]);
  rows.push(['4. เงินได้สุทธิที่ต้องนำไปคำนวณภาษี (Net Taxable Income)', taxEstimate.netTaxableIncome.toFixed(2)]);
  rows.push([]);

  // Section 2.1: Progressive Bracket Breakdown
  rows.push(['--- 2.1 รายละเอียดการคำนวณตามอัตราภาษีเงินได้ก้าวหน้า (Tax Brackets) ---']);
  rows.push(['ช่วงเงินได้สุทธิ (บาท)', 'อัตราภาษี', 'เงินได้ในขั้น (บาท)', 'ภาษีคำนวณได้ (บาท)']);
  TAX_BRACKETS.forEach(bracket => {
    if (taxEstimate.netTaxableIncome > bracket.min) {
      const taxableInBracket = Math.min(taxEstimate.netTaxableIncome, bracket.max) - bracket.min;
      const taxForBracket = bracket.rate > 0 ? (taxableInBracket * bracket.rate) : 0;
      const maxLabel = bracket.max === Infinity ? 'ขึ้นไป' : bracket.max.toLocaleString();
      rows.push([
        `${bracket.min.toLocaleString()} - ${maxLabel}`,
        `${(bracket.rate * 100).toFixed(0)}%`,
        taxableInBracket.toFixed(2),
        taxForBracket.toFixed(2)
      ]);
    }
  });
  rows.push(['รวมภาษีคำนวณได้ตามเกณฑ์ทั้งสิ้น', '', '', taxEstimate.finalCalculatedTax.toFixed(2)]);
  rows.push(['หัก เครดิตภาษีหัก ณ ที่จ่าย 3% สะสม (ใบ 50 ทวิ)', '', '', `-${taxEstimate.whtCredit.toFixed(2)}`]);
  rows.push([]);

  // Settlement Result Row
  if (taxEstimate.isRefund) {
    rows.push(['>>> ผลสรุป: สิทธิ์ขอคืนเงินภาษีสุทธิ (Tax Refund) <<<', `+${taxEstimate.balance.toFixed(2)} บาท`]);
  } else if (taxEstimate.balance > 0) {
    rows.push(['>>> ผลสรุป: ประมาณการภาษีที่ต้องชำระเพิ่ม (Tax Payable) <<<', `-${taxEstimate.balance.toFixed(2)} บาท`]);
  } else {
    rows.push(['>>> ผลสรุป: พอดีเกณฑ์ (ไม่มีภาษีต้องชำระเพิ่มและไม่มีสิทธิ์ขอคืน) <<<', '0.00 บาท']);
  }
  rows.push([]);

  // Section 3: Breakdown by P.N.D. 90 Category
  rows.push(['--- 3. สรุปแยกตามหมวดเงินได้พึงประเมิน (ภ.ง.ด. 90) ---']);
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

  // Section 4: Detailed Invoice Transactions
  rows.push(['--- 4. รายละเอียดรายการวางบิลทั้งหมด ---']);
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

export function downloadPnd90Csv(invoices: Invoice[], deductions?: TaxDeductionProfile | number): void {
  const csvData = generatePnd90Csv(invoices, deductions);
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

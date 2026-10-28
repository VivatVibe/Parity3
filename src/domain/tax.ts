export type TaxCategory = '40_2' | '40_6' | '40_8';

export interface TaxCategoryMeta {
  code: TaxCategory;
  nameThai: string;
  categoryLabel: string;
  expenseDeductionRule: string;
  typicalJobs: string;
  description: string;
}

export const TAX_CATEGORIES: Record<TaxCategory, TaxCategoryMeta> = {
  '40_2': {
    code: '40_2',
    nameThai: 'มาตรา 40(2) จ้างทำของ / ฟรีแลนซ์',
    categoryLabel: '40(2) จ้างทำของ',
    expenseDeductionRule: 'หักเหมา 50% สูงสุด 100,000 บาท (คำนวณรวมกับ 40(1))',
    typicalJobs: 'โปรแกรมเมอร์, ที่ปรึกษา, กราฟิกดีไซน์, การตลาดอิสระ',
    description: 'เงินได้เนื่องจากหน้าที่หรือตำแหน่งงานที่ทำ หรือจากการรับทำงานให้'
  },
  '40_6': {
    code: '40_6',
    nameThai: 'มาตรา 40(6) วิชาชีพอิสระ',
    categoryLabel: '40(6) วิชาชีพอิสระ',
    expenseDeductionRule: 'หักเหมา 30% หรือ 60% (แพทย์หักได้ 60%, บัญชี/ทนาย/วิศวะ/สถาปัตย์ 30%) หรือตามจริง',
    typicalJobs: 'แพทย์, นักบัญชี, ทนายความ, วิศวกร, สถาปนิก, ประณีตศิลปกรรม',
    description: 'เงินได้จากวิชาชีพอิสระที่มีใบอนุญาตประกอบวิชาชีพตามกฎหมาย'
  },
  '40_8': {
    code: '40_8',
    nameThai: 'มาตรา 40(8) คอนเทนต์ / การค้า / ธุรกิจพาณิชย์',
    categoryLabel: '40(8) คอนเทนต์/การค้า',
    expenseDeductionRule: 'หักเหมา 60% หรือหักค่าใช้จ่ายตามจริงตามเอกสาร',
    typicalJobs: 'YouTuber, อินฟลูเอนเซอร์, สปอนเซอร์รีวิว, ขายของออนไลน์',
    description: 'เงินได้จากการธุรกิจ การพาณิชย์ หรือเงินได้อื่นๆ ที่ไม่อยู่ใน 40(1)-40(7)'
  }
};

export const WHT_RATE = 0.03; // 3%

export function roundCurrency(val: number): number {
  return Math.round((val + Number.EPSILON) * 100) / 100;
}

export function calculateBilling(subtotal: number, whtRate = WHT_RATE) {
  // Normalize rate: accept either fraction (0.03) or whole percentage (3)
  const normalizedRate = whtRate > 1 ? whtRate / 100 : (whtRate || WHT_RATE);
  const roundedSubtotal = roundCurrency(subtotal);
  const whtAmount = roundCurrency(roundedSubtotal * normalizedRate);
  const netTotal = roundCurrency(roundedSubtotal - whtAmount);
  return {
    subtotal: roundedSubtotal,
    whtRate: normalizedRate,
    whtAmount,
    netTotal
  };
}

export interface Pnd90CategorySummary {
  category: TaxCategory;
  meta: TaxCategoryMeta;
  invoiceCount: number;
  grossIncome: number;
  whtDeducted: number;
  pending50TawiCount: number;
  received50TawiCount: number;
}

export interface Pnd90Summary {
  totalGrossIncome: number;
  totalWhtCredit: number;
  pending50TawiTotal: number;
  received50TawiTotal: number;
  byCategory: Record<TaxCategory, Pnd90CategorySummary>;
}

export function aggregatePnd90(invoices: Array<{
  category: TaxCategory;
  subtotal: number;
  whtAmount: number;
  has50Tawi: boolean;
  status: string;
}>): Pnd90Summary {
  const byCategory: Record<TaxCategory, Pnd90CategorySummary> = {
    '40_2': {
      category: '40_2',
      meta: TAX_CATEGORIES['40_2'],
      invoiceCount: 0,
      grossIncome: 0,
      whtDeducted: 0,
      pending50TawiCount: 0,
      received50TawiCount: 0
    },
    '40_6': {
      category: '40_6',
      meta: TAX_CATEGORIES['40_6'],
      invoiceCount: 0,
      grossIncome: 0,
      whtDeducted: 0,
      pending50TawiCount: 0,
      received50TawiCount: 0
    },
    '40_8': {
      category: '40_8',
      meta: TAX_CATEGORIES['40_8'],
      invoiceCount: 0,
      grossIncome: 0,
      whtDeducted: 0,
      pending50TawiCount: 0,
      received50TawiCount: 0
    }
  };

  let totalGrossIncome = 0;
  let totalWhtCredit = 0;
  let pending50TawiTotal = 0;
  let received50TawiTotal = 0;

  for (const inv of invoices) {
    if (inv.status === 'cancelled') continue;

    const cat = byCategory[inv.category] || byCategory['40_2'];
    cat.invoiceCount += 1;
    cat.grossIncome = roundCurrency(cat.grossIncome + inv.subtotal);
    cat.whtDeducted = roundCurrency(cat.whtDeducted + inv.whtAmount);

    if (inv.has50Tawi) {
      cat.received50TawiCount += 1;
      received50TawiTotal += 1;
    } else {
      cat.pending50TawiCount += 1;
      pending50TawiTotal += 1;
    }

    totalGrossIncome = roundCurrency(totalGrossIncome + inv.subtotal);
    totalWhtCredit = roundCurrency(totalWhtCredit + inv.whtAmount);
  }

  return {
    totalGrossIncome,
    totalWhtCredit,
    pending50TawiTotal,
    received50TawiTotal,
    byCategory
  };
}

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

export interface TaxBracket {
  min: number;
  max: number;
  rate: number;
  maxTaxInBracket: number;
}

export const TAX_BRACKETS: TaxBracket[] = [
  { min: 0, max: 150000, rate: 0, maxTaxInBracket: 0 },
  { min: 150000, max: 300000, rate: 0.05, maxTaxInBracket: 7500 },
  { min: 300000, max: 500000, rate: 0.10, maxTaxInBracket: 20000 },
  { min: 500000, max: 750000, rate: 0.15, maxTaxInBracket: 37500 },
  { min: 750000, max: 1000000, rate: 0.20, maxTaxInBracket: 50000 },
  { min: 1000000, max: 2000000, rate: 0.25, maxTaxInBracket: 250000 },
  { min: 2000000, max: 5000000, rate: 0.30, maxTaxInBracket: 900000 },
  { min: 5000000, max: Infinity, rate: 0.35, maxTaxInBracket: Infinity }
];

export const PERSONAL_ALLOWANCE = 60000; // ค่าลดหย่อนส่วนตัวผู้มีเงินได้ 60,000 บาท

export function calculateStandardExpense(
  category: TaxCategory,
  grossIncome: number,
  professionSubType: 'general' | 'medical' = 'general'
): number {
  if (grossIncome <= 0) return 0;
  switch (category) {
    case '40_2':
      // 50% capped at 100,000 THB
      return Math.min(roundCurrency(grossIncome * 0.5), 100000);
    case '40_6':
      // 60% for medical, 30% for others (lawyer, auditor, engineer, architect, fine arts)
      return roundCurrency(grossIncome * (professionSubType === 'medical' ? 0.6 : 0.3));
    case '40_8':
      // 60% standard rate
      return roundCurrency(grossIncome * 0.6);
    default:
      return 0;
  }
}

export function calculateProgressiveTax(netTaxableIncome: number): number {
  if (netTaxableIncome <= 0) return 0;
  let totalTax = 0;

  for (const bracket of TAX_BRACKETS) {
    if (netTaxableIncome > bracket.min) {
      const taxableInBracket = Math.min(netTaxableIncome, bracket.max) - bracket.min;
      if (taxableInBracket > 0 && bracket.rate > 0) {
        totalTax += roundCurrency(taxableInBracket * bracket.rate);
      }
    }
  }

  return roundCurrency(totalTax);
}

export interface Pnd90TaxEstimate {
  totalGrossIncome: number;
  totalExpenses: number;
  personalAllowance: number;
  netTaxableIncome: number;
  progressiveTax: number;
  flatTax05Percent: number; // มาตรา 48(2) วิธีเหมา 0.5% (ถ้าเงินได้ >= 120,000 และภาษี > 5,000)
  effectiveTaxMethod: 'progressive' | 'flat_05_percent';
  finalCalculatedTax: number;
  whtCredit: number; // ภาษีที่ถูกหัก ณ ที่จ่าย 3% ไว้แล้ว
  balance: number; // ยอดภาษีสุทธิ (ถ้าเป็นลบคือได้รับคืน, ถ้าเป็นบวกคือต้องจ่ายเพิ่ม)
  isRefund: boolean; // ได้รับเงินคืนภาษี
  effectiveTaxRate: number; // อัตราภาษีที่แท้จริง %
}

export function estimatePnd90Tax(
  summary: Pnd90Summary,
  customPersonalAllowance = PERSONAL_ALLOWANCE
): Pnd90TaxEstimate {
  const cat40_2Expense = calculateStandardExpense('40_2', summary.byCategory['40_2'].grossIncome);
  const cat40_6Expense = calculateStandardExpense('40_6', summary.byCategory['40_6'].grossIncome);
  const cat40_8Expense = calculateStandardExpense('40_8', summary.byCategory['40_8'].grossIncome);
  const totalExpenses = roundCurrency(cat40_2Expense + cat40_6Expense + cat40_8Expense);

  const personalAllowance = Math.max(0, customPersonalAllowance);
  const netTaxableIncome = Math.max(0, roundCurrency(summary.totalGrossIncome - totalExpenses - personalAllowance));

  const progressiveTax = calculateProgressiveTax(netTaxableIncome);

  // Flat 0.5% minimum tax rule (Section 48(2))
  let flatTax05Percent = 0;
  if (summary.totalGrossIncome >= 120000) {
    const rawFlat = roundCurrency(summary.totalGrossIncome * 0.005);
    // Exempted if not exceeding 5,000 THB
    if (rawFlat > 5000) {
      flatTax05Percent = rawFlat;
    }
  }

  const useFlatMethod = flatTax05Percent > progressiveTax;
  const finalCalculatedTax = useFlatMethod ? flatTax05Percent : progressiveTax;
  const whtCredit = summary.totalWhtCredit;
  const balance = roundCurrency(finalCalculatedTax - whtCredit);
  const isRefund = balance < 0;
  const effectiveTaxRate = summary.totalGrossIncome > 0
    ? roundCurrency((finalCalculatedTax / summary.totalGrossIncome) * 100)
    : 0;

  return {
    totalGrossIncome: summary.totalGrossIncome,
    totalExpenses,
    personalAllowance,
    netTaxableIncome,
    progressiveTax,
    flatTax05Percent,
    effectiveTaxMethod: useFlatMethod ? 'flat_05_percent' : 'progressive',
    finalCalculatedTax,
    whtCredit,
    balance,
    isRefund,
    effectiveTaxRate
  };
}

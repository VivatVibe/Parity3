import { TaxCategory, calculateBilling } from './tax';

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  category: TaxCategory;
  clientName: string;
  clientTaxId: string;
  clientAddress: string;
  items: InvoiceItem[];
  subtotal: number;
  whtRate: number;
  whtAmount: number;
  netTotal: number;
  status: 'draft' | 'sent' | 'paid' | 'cancelled';
  has50Tawi: boolean;
  tawiDocNumber?: string;
  notes?: string;
  slipImage?: string;
  tawiImage?: string;
}

export interface IssuerProfile {
  name: string;
  taxId: string;
  address: string;
  phone: string;
  promptPayId: string;
  bankName: string;
  bankAccount: string;
  bankAccountName: string;
  signatureMode?: 'auto' | 'drawn' | 'none';
  signatureDataUrl?: string;
  logoUrl?: string;
}

const STORAGE_INVOICES_KEY = 'thai_freelancer_invoices';
const STORAGE_ISSUER_KEY = 'thai_freelancer_issuer';
const STORAGE_DRAFT_KEY = 'thai_freelancer_invoice_draft';

export interface KnownClient {
  clientName: string;
  clientTaxId: string;
  clientAddress: string;
  lastUsedDate: string;
}

export function getKnownClients(invoices: Invoice[]): KnownClient[] {
  const map = new Map<string, KnownClient>();
  for (const inv of invoices) {
    const trimmed = inv.clientName.trim();
    if (!trimmed) continue;
    if (!map.has(trimmed) || inv.issueDate > map.get(trimmed)!.lastUsedDate) {
      map.set(trimmed, {
        clientName: trimmed,
        clientTaxId: inv.clientTaxId || '',
        clientAddress: inv.clientAddress || '',
        lastUsedDate: inv.issueDate
      });
    }
  }
  return Array.from(map.values()).sort((a, b) => b.lastUsedDate.localeCompare(a.lastUsedDate));
}

export function loadDraftInvoice(): Partial<Invoice> | null {
  try {
    const raw = localStorage.getItem(STORAGE_DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveDraftInvoice(draft: Partial<Invoice>): void {
  try {
    localStorage.setItem(STORAGE_DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // ignore quota errors
  }
}

export function clearDraftInvoice(): void {
  try {
    localStorage.removeItem(STORAGE_DRAFT_KEY);
  } catch {
    // ignore
  }
}

export const DEFAULT_ISSUER: IssuerProfile = {
  name: 'วรวิทย์ เทคไพโอเนียร์ (Vivat TechPioneer)',
  taxId: '1100400987654',
  address: '123/45 ถนนสุขุมวิท แขวงคลองเตยเหนือ เขตวัฒนา กรุงเทพฯ 10110',
  phone: '0812345678',
  promptPayId: '0812345678',
  bankName: 'ธนาคารกสิกรไทย (KBANK)',
  bankAccount: '045-2-98765-4',
  bankAccountName: 'นาย วรวิทย์ เทคไพโอเนียร์',
  signatureMode: 'auto',
  signatureDataUrl: ''
};

export const SEED_INVOICES: Invoice[] = [
  {
    id: 'inv-1',
    invoiceNumber: 'INV-2026-001',
    issueDate: '2026-03-01',
    dueDate: '2026-03-15',
    category: '40_2',
    clientName: 'บริษัท สยามคลาวด์ ซอฟต์แวร์ จำกัด (มหาชน)',
    clientTaxId: '0107558000123',
    clientAddress: '888 อาคารสยามทาวเวอร์ ชั้น 18 ถนนพระราม 9 ห้วยขวาง กรุงเทพฯ 10310',
    items: [
      { id: '1', description: 'บริการให้คำปรึกษาและวางสถาปัตยกรรม Fullstack Cloud App (ประจำเดือน ก.พ.)', quantity: 1, unitPrice: 45000, amount: 45000 }
    ],
    ...calculateBilling(45000),
    status: 'paid',
    has50Tawi: true,
    tawiDocNumber: '50TW-69-0301-09',
    notes: 'ชำระและได้รับใบ 50 ทวิ เรียบร้อยแล้ว'
  },
  {
    id: 'inv-2',
    invoiceNumber: 'INV-2026-002',
    issueDate: '2026-03-10',
    dueDate: '2026-03-25',
    category: '40_6',
    clientName: 'คลินิกทันตกรรม โมเดิร์นสไมล์ จำกัด',
    clientTaxId: '0105562098765',
    clientAddress: '55/9 ถนนพหลโยธิน แขวงลาดยาว เขตจตุจักร กรุงเทพฯ 10900',
    items: [
      { id: '1', description: 'งานออกแบบและวิเคราะห์ระบบสถาปัตยกรรมซอฟต์แวร์ทางการแพทย์ (Medical System Architecture)', quantity: 1, unitPrice: 30000, amount: 30000 }
    ],
    ...calculateBilling(30000),
    status: 'sent',
    has50Tawi: false,
    notes: 'รอรับใบ 50 ทวิ ทางไปรษณีย์หลังวางบิล'
  },
  {
    id: 'inv-3',
    invoiceNumber: 'INV-2026-003',
    issueDate: '2026-03-20',
    dueDate: '2026-04-05',
    category: '40_8',
    clientName: 'บริษัท ดิจิทัล คอนเทนต์ มาร์เก็ตติ้ง จำกัด',
    clientTaxId: '0105559011223',
    clientAddress: '19/12 ตรอกจันทน์ แขวงทุ่งวัดดอน เขตสาทร กรุงเทพฯ 10120',
    items: [
      { id: '1', description: 'สปอนเซอร์รีวิวเครื่องมือ AI Developer Tool บนช่อง YouTube & Blog 1 ตอน', quantity: 1, unitPrice: 20000, amount: 20000 }
    ],
    ...calculateBilling(20000),
    status: 'paid',
    has50Tawi: true,
    tawiDocNumber: '50TW-69-0322-44',
    notes: 'แนบหลักฐานหักภาษี 3% ในระบบแล้ว'
  }
];

export function loadInvoices(): Invoice[] {
  try {
    const raw = localStorage.getItem(STORAGE_INVOICES_KEY);
    if (!raw) {
      saveInvoices(SEED_INVOICES);
      return SEED_INVOICES;
    }
    return JSON.parse(raw);
  } catch {
    return SEED_INVOICES;
  }
}

export function saveInvoices(invoices: Invoice[]): void {
  localStorage.setItem(STORAGE_INVOICES_KEY, JSON.stringify(invoices));
}

export function loadIssuer(): IssuerProfile {
  try {
    const raw = localStorage.getItem(STORAGE_ISSUER_KEY);
    if (!raw) {
      saveIssuer(DEFAULT_ISSUER);
      return DEFAULT_ISSUER;
    }
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_ISSUER,
      ...parsed,
      signatureMode: parsed.signatureMode || 'auto'
    };
  } catch {
    return DEFAULT_ISSUER;
  }
}

export function saveIssuer(issuer: IssuerProfile): void {
  localStorage.setItem(STORAGE_ISSUER_KEY, JSON.stringify(issuer));
}

import { Invoice, IssuerProfile } from '../domain/storage';

export interface BackupPayload {
  app: 'thai_freelancer_billing';
  version: 1;
  exportedAt: string;
  issuer: IssuerProfile;
  invoices: Invoice[];
}

export function createBackupPayload(issuer: IssuerProfile, invoices: Invoice[]): BackupPayload {
  return {
    app: 'thai_freelancer_billing',
    version: 1,
    exportedAt: new Date().toISOString(),
    issuer,
    invoices
  };
}

export function downloadBackupFile(issuer: IssuerProfile, invoices: Invoice[]): void {
  const payload = createBackupPayload(issuer, invoices);
  const jsonString = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const dateStr = new Date().toISOString().slice(0, 10);
  link.setAttribute('download', `Freelancer_Billing_Backup_${dateStr}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function validateBackupPayload(raw: unknown): BackupPayload {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error('รูปแบบไฟล์ไม่ถูกต้อง: ข้อมูลไม่ใช่ JSON Object');
  }

  const obj = raw as Record<string, unknown>;

  if (obj.app !== 'thai_freelancer_billing') {
    throw new Error('ไฟล์นี้ไม่ใช่ไฟล์สำรองข้อมูลของระบบ Multi-Income Billing');
  }

  if (obj.version !== 1) {
    throw new Error(`ไม่รองรับไฟล์เวอร์ชัน ${obj.version}`);
  }

  if (!Array.isArray(obj.invoices)) {
    throw new Error('ข้อมูลไม่ถูกต้อง: ไม่พบรายการใบแจ้งหนี้ (invoices array)');
  }

  // Validate critical fields in each invoice
  for (let i = 0; i < obj.invoices.length; i++) {
    const inv = obj.invoices[i];
    if (typeof inv !== 'object' || inv === null) {
      throw new Error(`ข้อมูลบิลลำดับที่ ${i + 1} ไม่ถูกต้อง`);
    }
    const item = inv as Record<string, unknown>;
    if (!item.id || !item.invoiceNumber || typeof item.subtotal !== 'number') {
      throw new Error(`ข้อมูลบิลลำดับที่ ${i + 1} ขาดฟิลด์สำคัญ (id, invoiceNumber, subtotal)`);
    }
  }

  return raw as BackupPayload;
}

export async function parseBackupFile(file: File): Promise<BackupPayload> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('เกิดข้อผิดพลาดในการอ่านไฟล์'));
    reader.onload = () => {
      try {
        const text = reader.result as string;
        const parsed = JSON.parse(text);
        const validated = validateBackupPayload(parsed);
        resolve(validated);
      } catch (err: any) {
        reject(err instanceof Error ? err : new Error(String(err)));
      }
    };
    reader.readAsText(file);
  });
}

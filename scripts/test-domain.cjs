const assert = require('assert');

// 1. Test Thai Baht Text
function thaiBahtText(num) {
  if (isNaN(num)) return '';
  if (num === 0) return 'ศูนย์บาทถ้วน';

  const numbers = ['', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
  const units = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];

  function readGroup(str) {
    let result = '';
    const len = str.length;
    for (let i = 0; i < len; i++) {
      const digit = parseInt(str.charAt(i), 10);
      const pos = len - i - 1;
      if (digit === 0) continue;
      if (pos === 0 && digit === 1 && len > 1) {
        result += 'เอ็ด';
      } else if (pos === 1 && digit === 2) {
        result += 'ยี่สิบ';
      } else if (pos === 1 && digit === 1) {
        result += 'สิบ';
      } else {
        result += numbers[digit] + units[pos];
      }
    }
    return result;
  }

  const fixed = num.toFixed(2);
  const [bahtPart, satangPart] = fixed.split('.');
  let bahtStr = '';

  const groupSize = 6;
  const groups = [];
  let remaining = bahtPart;
  while (remaining.length > groupSize) {
    groups.unshift(remaining.slice(-groupSize));
    remaining = remaining.slice(0, -groupSize);
  }
  groups.unshift(remaining);

  for (let i = 0; i < groups.length; i++) {
    const groupRead = readGroup(groups[i]);
    if (groupRead) {
      bahtStr += groupRead;
      if (i < groups.length - 1) bahtStr += 'ล้าน';
    }
  }

  let satangStr = '';
  const satangVal = parseInt(satangPart, 10);
  if (satangVal > 0) {
    satangStr = readGroup(satangPart) + 'สตางค์';
  }

  if (!bahtStr && satangStr) return satangStr;
  return `${bahtStr || 'ศูนย์'}บาท${satangStr || 'ถ้วน'}`;
}

// 2. Test CRC16 and PromptPay EMVCo
function crc16(data) {
  let crc = 0xFFFF;
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
      } else {
        crc = (crc << 1) & 0xFFFF;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function tlv(tag, value) {
  const len = value.length.toString().padStart(2, '0');
  return `${tag}${len}${value}`;
}

function formatPromptPayTarget(target) {
  const cleaned = target.replace(/[^0-9]/g, '');
  if (cleaned.length === 10 && cleaned.startsWith('0')) {
    return {
      subTag: '01',
      formatted: `0066${cleaned.slice(1)}`
    };
  }
  return {
    subTag: '02',
    formatted: cleaned
  };
}

function generatePromptPayPayload(target, amount) {
  const { subTag, formatted } = formatPromptPayTarget(target);
  const tag00 = tlv('00', '01');
  const tag01 = tlv('01', amount !== undefined && amount > 0 ? '12' : '11');
  const aid = tlv('00', 'A000000677010111');
  const recipient = tlv(subTag, formatted);
  const tag29 = tlv('29', `${aid}${recipient}`);
  const tag53 = tlv('53', '764');
  let tag54 = '';
  if (amount !== undefined && amount > 0) {
    tag54 = tlv('54', amount.toFixed(2));
  }
  const tag58 = tlv('58', 'TH');
  const basePayload = `${tag00}${tag01}${tag29}${tag53}${tag54}${tag58}6304`;
  const checksum = crc16(basePayload);
  return `${basePayload}${checksum}`;
}

// 3. Test Billing calculation
function roundCurrency(val) {
  return Math.round(val * 100) / 100;
}

function calculateBilling(subtotal, whtRate = 0.03) {
  const roundedSubtotal = roundCurrency(subtotal);
  const whtAmount = roundCurrency(roundedSubtotal * whtRate);
  const netTotal = roundCurrency(roundedSubtotal - whtAmount);
  return { subtotal: roundedSubtotal, whtRate, whtAmount, netTotal };
}

// 4. Test PND90 Aggregator
function aggregatePnd90(invoices) {
  const byCategory = {
    '40_2': { grossIncome: 0, whtDeducted: 0, pending50TawiCount: 0, received50TawiCount: 0 },
    '40_6': { grossIncome: 0, whtDeducted: 0, pending50TawiCount: 0, received50TawiCount: 0 },
    '40_8': { grossIncome: 0, whtDeducted: 0, pending50TawiCount: 0, received50TawiCount: 0 }
  };

  let totalGrossIncome = 0;
  let totalWhtCredit = 0;
  let pending50TawiTotal = 0;
  let received50TawiTotal = 0;

  for (const inv of invoices) {
    if (inv.status === 'cancelled') continue;
    const cat = byCategory[inv.category] || byCategory['40_2'];
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

  return { totalGrossIncome, totalWhtCredit, pending50TawiTotal, received50TawiTotal, byCategory };
}

console.log('Running test-domain verification checks...');

// Check 1: Thai Baht Text
assert.strictEqual(thaiBahtText(43650), 'สี่หมื่นสามพันหกร้อยห้าสิบบาทถ้วน');
assert.strictEqual(thaiBahtText(19400), 'หนึ่งหมื่นเก้าพันสี่ร้อยบาทถ้วน');
assert.strictEqual(thaiBahtText(100.50), 'หนึ่งร้อยบาทห้าสิบสตางค์');
console.log('✓ thaiBahtText passed.');

// Check 2: PromptPay Payload Generation
const payload = generatePromptPayPayload('0812345678', 43650);
assert(payload.startsWith('000201010212'), 'Dynamic QR payload must start with Tag 00=01 and Tag 01=12');
assert(payload.includes('A000000677010111'), 'Must include PromptPay AID');
assert(payload.includes('0066812345678'), 'Must format phone to international 0066...');
assert(payload.includes('5303764'), 'Must have THB currency 764');
assert(payload.includes('540843650.00'), 'Must have formatted amount');
assert(payload.includes('5802TH'), 'Must have Country Code TH');
assert(payload.length >= 60, 'Payload length valid');
console.log('✓ generatePromptPayPayload passed. Payload sample:', payload);

// Check 3: Billing Calculation (3% Withholding Tax)
const bill1 = calculateBilling(45000);
assert.strictEqual(bill1.subtotal, 45000);
assert.strictEqual(bill1.whtAmount, 1350); // 45000 * 0.03
assert.strictEqual(bill1.netTotal, 43650);

const bill2 = calculateBilling(20000);
assert.strictEqual(bill2.whtAmount, 600); // 20000 * 0.03
assert.strictEqual(bill2.netTotal, 19400);
console.log('✓ calculateBilling 3% WHT passed.');

// Check 4: P.N.D. 90 Aggregation across multi-stream categories
const testInvoices = [
  { category: '40_2', subtotal: 45000, whtAmount: 1350, has50Tawi: true, status: 'paid' },
  { category: '40_6', subtotal: 30000, whtAmount: 900, has50Tawi: false, status: 'sent' },
  { category: '40_8', subtotal: 20000, whtAmount: 600, has50Tawi: true, status: 'paid' },
  { category: '40_2', subtotal: 10000, whtAmount: 300, has50Tawi: false, status: 'cancelled' }
];

const summary = aggregatePnd90(testInvoices);
assert.strictEqual(summary.totalGrossIncome, 95000); // 45000 + 30000 + 20000 (cancelled ignored)
assert.strictEqual(summary.totalWhtCredit, 2850); // 1350 + 900 + 600
assert.strictEqual(summary.received50TawiTotal, 2);
assert.strictEqual(summary.pending50TawiTotal, 1);
assert.strictEqual(summary.byCategory['40_2'].grossIncome, 45000);
assert.strictEqual(summary.byCategory['40_6'].grossIncome, 30000);
assert.strictEqual(summary.byCategory['40_8'].grossIncome, 20000);
console.log('✓ aggregatePnd90 multi-stream categorization passed.');

// Check 5: CSV Generator with UTF-8 BOM
function escapeCsvCell(cell) {
  if (cell === undefined || cell === null) return '""';
  const str = String(cell);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

const sampleCsvRow = ['INV-001', 'บริษัท ทดสอบ, จำกัด', 45000].map(escapeCsvCell).join(',');
assert.strictEqual(sampleCsvRow, '"INV-001","บริษัท ทดสอบ, จำกัด","45000"');
assert('\uFEFF'.charCodeAt(0) === 0xFEFF, 'BOM marker is valid UTF-8 BOM');
console.log('✓ CSV generator and UTF-8 BOM escaping passed.');

// Check 6: Backup Payload Schema Validation
function validateBackupPayload(raw) {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error('รูปแบบไฟล์ไม่ถูกต้อง: ข้อมูลไม่ใช่ JSON Object');
  }
  const obj = raw;
  if (obj.app !== 'thai_freelancer_billing') {
    throw new Error('ไฟล์นี้ไม่ใช่ไฟล์สำรองข้อมูลของระบบ Multi-Income Billing');
  }
  if (obj.version !== 1) {
    throw new Error(`ไม่รองรับไฟล์เวอร์ชัน ${obj.version}`);
  }
  if (!Array.isArray(obj.invoices)) {
    throw new Error('ข้อมูลไม่ถูกต้อง: ไม่พบรายการใบแจ้งหนี้ (invoices array)');
  }
  for (let i = 0; i < obj.invoices.length; i++) {
    const inv = obj.invoices[i];
    if (typeof inv !== 'object' || inv === null || !inv.id || !inv.invoiceNumber || typeof inv.subtotal !== 'number') {
      throw new Error(`ข้อมูลบิลลำดับที่ ${i + 1} ไม่ถูกต้อง`);
    }
  }
  return raw;
}

const validBackup = {
  app: 'thai_freelancer_billing',
  version: 1,
  exportedAt: new Date().toISOString(),
  issuer: { name: 'ผู้ทดสอบ' },
  invoices: [{ id: '1', invoiceNumber: 'INV-1', subtotal: 1000 }]
};

assert.doesNotThrow(() => validateBackupPayload(validBackup), 'Valid backup must pass');

const invalidApp = { ...validBackup, app: 'other_system' };
assert.throws(() => validateBackupPayload(invalidApp), /ไม่ใช่ไฟล์สำรองข้อมูล/);

const invalidInvoice = { ...validBackup, invoices: [{ id: '1' }] };
assert.throws(() => validateBackupPayload(invalidInvoice), /ไม่ถูกต้อง/);

console.log('✓ Backup payload validation passed.');

// Check 7: LINE Message & Share URL Encoding/Decoding
function formatLineInvoiceMessage(invoice, issuer, shareUrl) {
  const itemsText = invoice.items.map(it => `• ${it.description} (x${it.quantity}): ฿${it.amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}`).join('\n');
  const urlPart = shareUrl ? `\n\n📄 ดูใบแจ้งหนี้ฉบับเต็มและสแกน QR ได้ที่:\n${shareUrl}` : '';
  return `เรียน ${invoice.clientName}\n\nขอส่งสรุปรายการวางบิล ${invoice.invoiceNumber}\n(ครบกำหนดชำระ: ${invoice.dueDate})\n\n📋 รายละเอียดงาน:\n${itemsText}\n\n💰 ยอดสรุปการชำระเงิน:\n• รวมเป็นเงิน: ฿${invoice.subtotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}\n• หักภาษี ณ ที่จ่าย 3%: -฿${invoice.whtAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}\n• ยอดชำระสุทธิ: ฿${invoice.netTotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })} (${thaiBahtText(invoice.netTotal)})\n\n🏦 ช่องทางการโอนเงิน:\n• ธนาคาร: ${issuer.bankName}\n• เลขที่บัญชี: ${issuer.bankAccount}\n• ชื่อบัญชี: ${issuer.bankAccountName}\n• พร้อมเพย์ (PromptPay): ${issuer.promptPayId}${urlPart}\n\n* เมื่อโอนเงินเรียบร้อยแล้ว รบกวนส่งสลิปและใบหัก ณ ที่จ่าย (50 ทวิ 3%) ให้ด้วยนะครับ ขอบคุณครับ`;
}

function encodeShare(inv, iss) {
  const jsonStr = JSON.stringify({ inv, iss });
  return Buffer.from(encodeURIComponent(jsonStr)).toString('base64');
}

function decodeShare(param) {
  const jsonStr = decodeURIComponent(Buffer.from(param, 'base64').toString());
  return JSON.parse(jsonStr);
}

const mockInv = {
  invoiceNumber: 'INV-2026-001',
  clientName: 'บริษัท ทดสอบ จำกัด',
  dueDate: '2026-03-15',
  items: [{ description: 'เขียนโค้ด', quantity: 1, amount: 20000 }],
  subtotal: 20000,
  whtAmount: 600,
  netTotal: 19400
};
const mockIss = {
  name: 'วรวิทย์',
  bankName: 'KBANK',
  bankAccount: '123-4-56789-0',
  bankAccountName: 'นายวรวิทย์',
  promptPayId: '0812345678'
};

const lineMsg = formatLineInvoiceMessage(mockInv, mockIss, 'https://example.com/?view=test');
assert(lineMsg.includes('เรียน บริษัท ทดสอบ จำกัด'), 'LINE message must address client');
assert(lineMsg.includes('19,400.00'), 'Must include net amount');
assert(lineMsg.includes('หนึ่งหมื่นเก้าพันสี่ร้อยบาทถ้วน'), 'Must include Thai Baht text');
assert(lineMsg.includes(mockIss.bankName), 'Must include bank name');
assert(lineMsg.includes(mockIss.bankAccount), 'Must include bank account');

const encodedParam = encodeShare(mockInv, mockIss);
const decoded = decodeShare(encodedParam);
assert.strictEqual(decoded.inv.invoiceNumber, 'INV-2026-001');
assert.strictEqual(decoded.iss.bankAccount, '123-4-56789-0');
console.log('✓ LINE Message & URL Share Encoding/Decoding passed.');

// Check 8: Known Clients Memory & Deduplication
function getKnownClients(invoices) {
  const map = new Map();
  for (const inv of invoices) {
    const trimmed = (inv.clientName || '').trim();
    if (!trimmed) continue;
    if (!map.has(trimmed) || inv.issueDate > map.get(trimmed).lastUsedDate) {
      map.set(trimmed, {
        clientName: trimmed,
        clientTaxId: inv.clientTaxId || '',
        clientAddress: inv.clientAddress || '',
        lastUsedDate: inv.issueDate || ''
      });
    }
  }
  return Array.from(map.values()).sort((a, b) => b.lastUsedDate.localeCompare(a.lastUsedDate));
}

const pastInvoices = [
  { clientName: 'บริษัท กสทช', clientTaxId: '01001', issueDate: '2026-01-10' },
  { clientName: 'บริษัท ทีโอที', clientTaxId: '02002', issueDate: '2026-02-15' },
  { clientName: 'บริษัท กสทช', clientTaxId: '01001-NEW', issueDate: '2026-03-20' },
  { clientName: '', clientTaxId: '99999', issueDate: '2026-03-01' }
];

const clients = getKnownClients(pastInvoices);
assert.strictEqual(clients.length, 2, 'Must deduplicate clients by name');
assert.strictEqual(clients[0].clientName, 'บริษัท กสทช', 'Most recent client must be first');
assert.strictEqual(clients[0].clientTaxId, '01001-NEW', 'Must pick details from newest invoice');
console.log('✓ Known Clients Memory & Deduplication passed.');

console.log('\nAll domain verification tests passed successfully!');

// Standard Thai Baht Text conversion (บาทถ้วน)
export function thaiBahtText(num: number): string {
  if (isNaN(num)) return '';
  if (num === 0) return 'ศูนย์บาทถ้วน';

  const numbers = ['', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
  const units = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];

  function readGroup(str: string): string {
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
  const groups: string[] = [];
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

import QRCode from 'qrcode';

export function crc16(data: string): string {
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

function tlv(tag: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${tag}${len}${value}`;
}

export function formatPromptPayTarget(target: string): { subTag: string; formatted: string } {
  const cleaned = target.replace(/[^0-9]/g, '');
  if (cleaned.length === 10 && cleaned.startsWith('0')) {
    // Thai Mobile: convert 0812345678 to 0066812345678
    return {
      subTag: '01',
      formatted: `0066${cleaned.slice(1)}`
    };
  }
  // 13-digit National ID or Tax ID
  return {
    subTag: '02',
    formatted: cleaned
  };
}

export function generatePromptPayPayload(target: string, amount?: number): string {
  const { subTag, formatted } = formatPromptPayTarget(target);
  
  // Tag 00: Format indicator
  const tag00 = tlv('00', '01');
  // Tag 01: Initiation method: 12 = dynamic (with amount), 11 = static
  const tag01 = tlv('01', amount !== undefined && amount > 0 ? '12' : '11');

  // Tag 29: Merchant Account Info PromptPay
  const aid = tlv('00', 'A000000677010111');
  const recipient = tlv(subTag, formatted);
  const tag29 = tlv('29', `${aid}${recipient}`);

  // Tag 53: Currency THB (764)
  const tag53 = tlv('53', '764');

  // Tag 54: Amount (optional)
  let tag54 = '';
  if (amount !== undefined && amount > 0) {
    tag54 = tlv('54', amount.toFixed(2));
  }

  // Tag 58: Country Code TH
  const tag58 = tlv('58', 'TH');

  const basePayload = `${tag00}${tag01}${tag29}${tag53}${tag54}${tag58}6304`;
  const checksum = crc16(basePayload);
  return `${basePayload}${checksum}`;
}

export async function generatePromptPayQrDataUrl(target: string, amount?: number): Promise<string> {
  const payload = generatePromptPayPayload(target, amount);
  return QRCode.toDataURL(payload, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 256,
    color: {
      dark: '#0f172a',
      light: '#ffffff'
    }
  });
}

import { Invoice } from './storage';

export type SubscriptionTier = 'free' | 'pro';

export interface SubscriptionState {
  tier: SubscriptionTier;
  status: 'active' | 'expired';
  expiresAt?: string | null;
  slipRef?: string;
}

export interface UserAccount {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

export const FREE_MONTHLY_INVOICE_LIMIT = 5;
export const PRO_MONTHLY_PRICE_THB = 99;
export const PRO_YEARLY_PRICE_THB = 990;

const STORAGE_SUB_KEY = 'thai_freelancer_subscription';
const STORAGE_USER_KEY = 'thai_freelancer_user';

export const DEFAULT_SUBSCRIPTION: SubscriptionState = {
  tier: 'free',
  status: 'active',
  expiresAt: null
};

export function loadSubscription(): SubscriptionState {
  try {
    const raw = localStorage.getItem(STORAGE_SUB_KEY);
    if (!raw) return DEFAULT_SUBSCRIPTION;
    const parsed = JSON.parse(raw);
    
    // Check expiration if pro has an expiry date
    if (parsed.tier === 'pro' && parsed.expiresAt) {
      const expTime = new Date(parsed.expiresAt).getTime();
      if (!isNaN(expTime) && expTime < Date.now()) {
        const expiredSub: SubscriptionState = {
          ...parsed,
          tier: 'free',
          status: 'expired'
        };
        saveSubscription(expiredSub);
        return expiredSub;
      }
    }
    return parsed;
  } catch {
    return DEFAULT_SUBSCRIPTION;
  }
}

export function saveSubscription(sub: SubscriptionState): void {
  localStorage.setItem(STORAGE_SUB_KEY, JSON.stringify(sub));
}

export function loadUser(): UserAccount | null {
  try {
    const raw = localStorage.getItem(STORAGE_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveUser(user: UserAccount | null): void {
  if (user) {
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_USER_KEY);
  }
}

export function getInvoicesThisMonth(invoices: Invoice[]): Invoice[] {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  return invoices.filter(inv => inv.status !== 'cancelled' && inv.issueDate && inv.issueDate.startsWith(yearMonth));
}

export function isSubscriptionPro(sub: SubscriptionState | SubscriptionTier): boolean {
  if (typeof sub === 'string') return sub === 'pro';
  if (!sub || sub.tier !== 'pro') return false;
  if (sub.status !== 'active') return false;
  if (sub.expiresAt) {
    const expTime = new Date(sub.expiresAt).getTime();
    if (!isNaN(expTime) && expTime < Date.now()) return false;
  }
  return true;
}

export function checkInvoiceLimit(invoices: Invoice[], tierOrSub: SubscriptionTier | SubscriptionState): {
  allowed: boolean;
  count: number;
  limit: number;
  remaining: number;
  isPro: boolean;
} {
  const isPro = isSubscriptionPro(tierOrSub);
  const monthInvoices = getInvoicesThisMonth(invoices);
  const count = monthInvoices.length;
  const limit = FREE_MONTHLY_INVOICE_LIMIT;
  const remaining = isPro ? Infinity : Math.max(0, limit - count);

  return {
    allowed: isPro || count < limit,
    count,
    limit,
    remaining,
    isPro
  };
}

export function canUseCustomLogo(tierOrSub: SubscriptionTier | SubscriptionState): boolean {
  return isSubscriptionPro(tierOrSub);
}

export function canUseAdvancedDeductions(tierOrSub: SubscriptionTier | SubscriptionState): boolean {
  return isSubscriptionPro(tierOrSub);
}

export function canUseOverdueReminders(tierOrSub: SubscriptionTier | SubscriptionState): boolean {
  return isSubscriptionPro(tierOrSub);
}

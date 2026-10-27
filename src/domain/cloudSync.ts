import { Invoice, IssuerProfile } from './storage';
import { UserAccount, SubscriptionState, saveSubscription } from './subscription';

export interface SyncResult {
  success: boolean;
  offline?: boolean;
  error?: string;
  syncedAt?: string;
  invoicesCount?: number;
}

export interface CloudDataResponse {
  success: boolean;
  issuerProfile: IssuerProfile | null;
  invoices: Invoice[];
  subscription: SubscriptionState | null;
  error?: string;
}

export async function uploadToCloud(
  user: UserAccount,
  invoices: Invoice[],
  issuerProfile: IssuerProfile
): Promise<SyncResult> {
  if (!navigator.onLine) {
    return { success: false, offline: true, error: 'อุปกรณ์กำลังออฟไลน์ ข้อมูลถูกบันทึกไว้ในเครื่องเรียบร้อยแล้ว' };
  }

  try {
    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        issuerProfile,
        invoices
      })
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      return { success: false, error: errJson.error || `HTTP ${res.status}` };
    }

    const data = await res.json();
    return {
      success: true,
      syncedAt: data.syncedAt || new Date().toISOString(),
      invoicesCount: invoices.length
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Sync network error' };
  }
}

export async function downloadFromCloud(user: UserAccount): Promise<CloudDataResponse> {
  if (!navigator.onLine) {
    return {
      success: false,
      issuerProfile: null,
      invoices: [],
      subscription: null,
      error: 'Device is offline'
    };
  }

  try {
    const res = await fetch(`/api/sync?userId=${encodeURIComponent(user.id)}`);
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      return {
        success: false,
        issuerProfile: null,
        invoices: [],
        subscription: null,
        error: errJson.error || `HTTP ${res.status}`
      };
    }

    const data = await res.json();
    if (data.subscription) {
      saveSubscription(data.subscription);
    }

    return {
      success: true,
      issuerProfile: data.issuerProfile || null,
      invoices: Array.isArray(data.invoices) ? data.invoices : [],
      subscription: data.subscription || null
    };
  } catch (err: any) {
    return {
      success: false,
      issuerProfile: null,
      invoices: [],
      subscription: null,
      error: err.message || 'Network error'
    };
  }
}

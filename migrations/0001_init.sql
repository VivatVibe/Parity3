-- Cloudflare D1 Migration: 0001_init.sql
-- Multi-Income Freelancer Billing & Tax Database Schema

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  picture TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subscriptions (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  tier TEXT DEFAULT 'free' CHECK(tier IN ('free', 'pro')),
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'expired', 'pending')),
  expires_at DATETIME,
  slip_ref TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS issuer_profiles (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  tax_id TEXT,
  address TEXT,
  phone TEXT,
  promptpay_id TEXT,
  bank_name TEXT,
  bank_account TEXT,
  bank_account_name TEXT,
  signature_mode TEXT DEFAULT 'auto',
  signature_data_url TEXT,
  logo_url TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  issue_date TEXT NOT NULL,
  due_date TEXT NOT NULL,
  category TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_tax_id TEXT,
  client_address TEXT,
  items_json TEXT NOT NULL,
  subtotal REAL NOT NULL,
  wht_rate REAL DEFAULT 3,
  wht_amount REAL NOT NULL,
  net_total REAL NOT NULL,
  status TEXT DEFAULT 'draft',
  has_50_tawi INTEGER DEFAULT 0,
  tawi_doc_number TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(issue_date);

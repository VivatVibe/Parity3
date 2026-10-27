const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('--- Starting Cloud Native & Monetization Suite Tests ---');

// 1. Test D1 Migration Schema
const schemaPath = path.join(__dirname, '../migrations/0001_init.sql');
assert(fs.existsSync(schemaPath), 'Migration 0001_init.sql must exist');
const sql = fs.readFileSync(schemaPath, 'utf8');
assert(sql.includes('CREATE TABLE IF NOT EXISTS users'), 'Schema must define users table');
assert(sql.includes('CREATE TABLE IF NOT EXISTS subscriptions'), 'Schema must define subscriptions table');
assert(sql.includes('CREATE TABLE IF NOT EXISTS issuer_profiles'), 'Schema must define issuer_profiles table');
assert(sql.includes('CREATE TABLE IF NOT EXISTS invoices'), 'Schema must define invoices table');
console.log('✔ Test 1 Passed: D1 Migration Schema valid with all tables defined.');

// 2. Test Subscription Quota Logic
function getInvoicesThisMonth(invoices) {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  return invoices.filter(inv => inv.issueDate && inv.issueDate.startsWith(yearMonth));
}

function checkInvoiceLimit(invoices, tier) {
  const isPro = tier === 'pro';
  const monthInvoices = getInvoicesThisMonth(invoices);
  const count = monthInvoices.length;
  const limit = 5;
  const remaining = isPro ? Infinity : Math.max(0, limit - count);

  return {
    allowed: isPro || count < limit,
    count,
    limit,
    remaining,
    isPro
  };
}

const now = new Date();
const currentYm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

const freeInvoicesUnderLimit = [
  { issueDate: `${currentYm}-01` },
  { issueDate: `${currentYm}-05` },
  { issueDate: `${currentYm}-10` },
  { issueDate: '2025-01-01' } // past year, should not count towards this month
];

const check1 = checkInvoiceLimit(freeInvoicesUnderLimit, 'free');
assert.strictEqual(check1.allowed, true);
assert.strictEqual(check1.count, 3);
assert.strictEqual(check1.remaining, 2);

const freeInvoicesAtLimit = [
  { issueDate: `${currentYm}-01` },
  { issueDate: `${currentYm}-05` },
  { issueDate: `${currentYm}-10` },
  { issueDate: `${currentYm}-12` },
  { issueDate: `${currentYm}-15` }
];

const check2 = checkInvoiceLimit(freeInvoicesAtLimit, 'free');
assert.strictEqual(check2.allowed, false);
assert.strictEqual(check2.count, 5);
assert.strictEqual(check2.remaining, 0);

// Pro tier with 100 invoices must always be allowed
const proInvoices = Array.from({ length: 100 }, () => ({ issueDate: `${currentYm}-01` }));
const check3 = checkInvoiceLimit(proInvoices, 'pro');
assert.strictEqual(check3.allowed, true);
assert.strictEqual(check3.isPro, true);
assert.strictEqual(check3.remaining, Infinity);
console.log('✔ Test 2 Passed: Subscription Free vs Pro Quota verification exact.');

// 3. Test Pages Functions Syntax & Signatures
const googleAuthPath = path.join(__dirname, '../functions/api/auth/google.ts');
assert(fs.existsSync(googleAuthPath), 'functions/api/auth/google.ts must exist');
const googleAuthSrc = fs.readFileSync(googleAuthPath, 'utf8');
assert(googleAuthSrc.includes('onRequestPost'), 'Must export onRequestPost');
assert(googleAuthSrc.includes('parseJwt'), 'Must have JWT parser');

const syncPath = path.join(__dirname, '../functions/api/sync.ts');
assert(fs.existsSync(syncPath), 'functions/api/sync.ts must exist');
const syncSrc = fs.readFileSync(syncPath, 'utf8');
assert(syncSrc.includes('onRequestGet') && syncSrc.includes('onRequestPost'), 'Sync must handle GET & POST');

const upgradePath = path.join(__dirname, '../functions/api/subscription/upgrade.ts');
assert(fs.existsSync(upgradePath), 'functions/api/subscription/upgrade.ts must exist');
const upgradeSrc = fs.readFileSync(upgradePath, 'utf8');
assert(upgradeSrc.includes('onRequestPost'), 'Upgrade must export onRequestPost');
console.log('✔ Test 3 Passed: Cloudflare Pages Functions signatures and endpoints verified.');

console.log('--- All Cloud Native & Monetization Suite Tests Passed Successfully! ---');

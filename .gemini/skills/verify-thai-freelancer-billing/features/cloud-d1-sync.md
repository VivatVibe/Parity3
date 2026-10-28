# Cloudflare D1 Native Sync

Enables cross-device synchronization and Google Identity login without external third-party backends, powered by Cloudflare Pages Functions and Cloudflare D1 Serverless SQL.

## Sub-features

- `auth-google`: Official Google Identity Services integration verifying Google JWT on Cloudflare Edge.
- `d1-cloud-sync`: Bidirectional upload and download between browser storage and D1 database `freelancer_billing_db`.
- `offline-first`: App operates transparently offline via `localStorage` and syncs when connectivity is restored.

## How to get to it (user POV)

- Click the Google login button in the top navigation bar.
- Once authenticated, click the "ซิงค์คลาวด์" button with the refresh icon to trigger manual cloud sync.

## Driving it with control-thai-freelancer-billing

Preconditions:
- Cloudflare Pages Functions running locally or deployed to `https://thai-freelancer-billing.pages.dev`.

- **Test D1 schema & functions syntax.** Run `node scripts/test-cloud-native.cjs`. Assert all 3 tests pass (D1 Schema valid, Quota logic exact, Pages Function signatures verified).
- **Test live sync endpoints.** Run `curl -s -X POST https://thai-freelancer-billing.pages.dev/api/sync -H "Content-Type: application/json" -d '{"userId":"test_agent_verify","issuerProfile":{"name":"Test Sync"},"invoices":[]}'`. Assert response contains `{"success":true}`.
- **Test data retrieval.** Run `curl -s "https://thai-freelancer-billing.pages.dev/api/sync?userId=test_agent_verify"`. Assert response contains the saved profile and subscription state.

## Gotchas

- D1 SQL schema strictly requires foreign key references to `users(id)`. Cloudflare Pages Functions must ensure a user record exists before inserting into `issuer_profiles` or `invoices`.
- Field names between client and server are normalized to accept both `issuerProfile` and `issuer`.

---
name: verify-thai-freelancer-billing
description: Drive and verify the Thai Freelancer Multi-Income Invoicing & Tax Web App the way a real user does. Use for verifying UI, A4 PDF printing, PromptPay QR, Google Auth, and Cloudflare D1 Sync.
---

# Verify Thai Freelancer Billing & Tax

This skill drives the web application, simulates user interactions across screen sizes (mobile, tablet, desktop), generates PDF prints, and proves behavior against Cloudflare Pages Functions and D1 Database.

## Launch

Start the local application for verification:

```bash
# Check if already running or launch detached background instance
node scripts/verify.cjs launch
```

Ready indicator: HTTP GET `http://127.0.0.1:5173/` returns status 200 within 5 seconds.

Teardown:
```bash
node scripts/verify.cjs cleanup
```

## Doctor

Run a non-destructive pre-flight check to verify that Chrome DevTools, Vite dev server, and output paths are functional:

```bash
node scripts/verify.cjs doctor
```

Exit code `0` indicates the environment is healthy and ready to be driven.

## Drive

Drive individual features using the automated verification harness:

```bash
# Drive commercial landing page and live 3% WHT calculator
node scripts/verify.cjs drive landing

# Drive invoice creation, signature pad, and A4 print layout
node scripts/verify.cjs drive invoice

# Drive PromptPay QR subscription and Pro tier activation
node scripts/verify.cjs drive commercial

# Drive domain calculations (3% WHT, ภ.ง.ด. 90, Baht text)
node scripts/verify.cjs drive domain

# Drive Cloudflare Pages Functions & D1 Sync integrity
node scripts/verify.cjs drive d1
```

For custom manual driving with headless Chrome:
- Use `scripts/audit-commercial.cjs` or `scripts/audit-ux.cjs`.
- Target selectors:
  - Landing conversion: `button:has-text("เข้าใช้งานระบบ")`, `button:has-text("ทดลองออกบิลได้ทันที")`
  - Return to landing: `button:has-text("หน้าแรก")`
  - Print trigger: `button:has-text("สั่งพิมพ์ / PDF")`
  - Invoice document root: `#printable-invoice`
  - Signature block: `.signature-block`
  - PromptPay QR image: `img[alt="PromptPay QR"]`

## Evidence

Every verification run produces tangible artifacts in `screenshots/`:
- `screenshots/commercial-landing-desktop.png`: 1440px desktop landing page with live simulator.
- `screenshots/commercial-landing-mobile.png`: 375px mobile responsive view.
- `screenshots/commercial-upgrade-success.png`: Pro Tier instant activation modal with TxID.
- `screenshots/sample-invoice.pdf`: Real 1-page A4 PDF rendered via Chrome DevTools.
- `screenshots/mobile-375-*.png`, `screenshots/tablet-768-*.png`, `screenshots/desktop-1440-*.png`: Cross-device UI snapshots.

Artifacts survive cleanup and are preserved for code review.

## Cleanup

```bash
node scripts/verify.cjs cleanup
```

Stops temporary test sessions while retaining all evidence files in `screenshots/`.

## Feature Map

Detailed feature journeys are maintained in the [`features/`](./features/README.md) directory.

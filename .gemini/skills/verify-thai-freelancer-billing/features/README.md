# Thai Freelancer Billing & Tax Feature Verification Map

This directory is the maintained source for verifying the user-facing behavior of the Thai Freelancer Billing & Tax web application. Read this index before driving the app, then use the matching feature file as the execution recipe.

## Baseline Preconditions

- Launch app locally at `http://127.0.0.1:5173`.
- Run `node scripts/verify.cjs doctor` and require exit code `0`.
- Automated test scripts use `puppeteer-core` with macOS Google Chrome binary.
- Seed data loads automatically if `localStorage` is empty.

## Driving Conventions

- Start each journey from the baseline state unless noted otherwise.
- Prefer visible text, button names, and semantic element roles.
- Run automated suites through `node scripts/verify.cjs drive <feature>`.
- Proof artifacts are saved to `screenshots/` and must survive cleanup.

## Features

- [Landing Page and Conversion Funnel](./landing-and-conversion.md): Landing page default, live 3% WHT simulator, pricing table, and switching to dashboard.
- [Invoice Creation and A4 Print](./invoice-and-a4-print.md): Form input, 6-row ledger grid, zero-pixel signature alignment, and PDF export.
- [PromptPay QR and Pro Upgrade](./promptpay-and-pro-upgrade.md): PromptPay QR code generation, 99 THB subscription modal, and slip TxID activation.
- [P.N.D. 90 Tax Dashboard](./pnd90-tax-dashboard.md): Categorization under 40(2), 40(6), 40(8), tracking 50 Tawi certificates, and annual tax deductions.
- [Cloudflare D1 Native Sync](./cloud-d1-sync.md): Google identity authentication, cloud synchronization, and offline fallback.

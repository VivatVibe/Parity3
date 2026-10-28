# Landing Page and Conversion Funnel

The landing page introduces freelancers to the application, allows simulating 3% WHT and net earnings without signing up, presents Free vs Pro pricing, and guides users into the app dashboard.

## Sub-features

- `landing-default`: Visitors opening root URL (`/`) see the commercial landing page first.
- `landing-simulator`: Live calculator calculates 3% WHT and net amount instantly as numbers are typed.
- `landing-convert`: Buttons ("เข้าใช้งานระบบ", "ทดลองออกบิลได้ทันที") smoothly transition into the billing dashboard.
- `landing-return`: App header provides a "หน้าแรก" button to return to the landing page anytime.

## How to get to it (user POV)

- Open `http://127.0.0.1:5173/` or `https://thai-freelancer-billing.pages.dev/`.
- From inside the app dashboard, click the "หน้าแรก" button on the top navigation bar.

## Driving it with control-thai-freelancer-billing

Preconditions:
- Dev server running at `http://127.0.0.1:5173`.
- User is not logged in.

- **Verify landing page presence.** Navigate to `http://127.0.0.1:5173/`. Assert heading contains "ออกใบวางบิลมืออาชีพ" and pricing shows "฿99 / เดือน".
- **Test live calculator.** Focus the number input inside the calculator card. Enter `50000`. Assert Subtotal shows `฿50,000`, 3% WHT shows `-฿1,500`, and Net Total shows `฿48,500`.
- **Switch to app dashboard.** Click the button labeled "เข้าใช้งานระบบ". Assert the view transitions to show invoice tabs ("รายการวางบิล", "สรุปภาษี ภ.ง.ด. 90").
- **Return to landing page.** Click the button labeled "หน้าแรก" in the header. Assert the landing page hero section is displayed again.
- **Proof.** Run `node scripts/verify.cjs drive landing`. Proof artifacts saved to `screenshots/commercial-landing-desktop.png` and `screenshots/commercial-landing-mobile.png`.

## Gotchas

- If a user was previously logged in, `App.tsx` defaults to the dashboard unless URL contains `?page=landing`. Clear `localStorage` or open in an incognito window to verify the fresh visitor flow.

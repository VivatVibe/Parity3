# PromptPay QR and Pro Upgrade

Users can scan dynamic PromptPay QR codes to receive payments, or scan a 99 THB QR code to upgrade to Pro tier with instant slip reference (TxID) activation.

## Sub-features

- `promptpay-invoice-qr`: Generates EMVCo standard dynamic PromptPay QR containing exact net amount after 3% WHT.
- `pro-quota-check`: Enforces 5 invoice/month limit on Free tier; unlimited on Pro tier.
- `pro-upgrade-modal`: Displays Free vs Pro comparison and dynamic 99 THB PromptPay QR.
- `pro-activation`: Verifies slip transaction reference and instantly activates Pro features.

## How to get to it (user POV)

- Click "อัปเกรด Pro" in the top header or pricing table.
- Attempting to create a 6th invoice in a single month prompts the Pro upgrade modal.
- Pro logo upload button in "โปรไฟล์ผู้รับเงิน" opens the upgrade flow if currently on Free tier.

## Driving it with control-thai-freelancer-billing

Preconditions:
- App dashboard is open at `http://127.0.0.1:5173/`.

- **Open upgrade modal.** Click the button labeled "อัปเกรด Pro". Assert modal heading reads "อัปเกรดเป็น Thai Freelancer PRO".
- **Verify QR code.** Inspect `img[alt="PromptPay QR"]`. Assert image src is a valid data URL containing PNG data.
- **Enter slip TxID.** In the slip reference textbox, enter `202603289999`.
- **Submit activation.** Click "ยืนยันการชำระเงินและเปิดใช้งาน Pro ทันที". Assert success message "ยินดีต้อนรับสู่ PRO Member!" appears.
- **Verify Pro state.** Return to dashboard. Assert Header now displays the golden "PRO" badge and quota limit restrictions are lifted.
- **Proof.** Run `node scripts/verify.cjs drive commercial`. Proof artifact saved to `screenshots/commercial-upgrade-success.png`.

## Gotchas

- Free tier quota tracks invoices created within the current calendar month (`YYYY-MM`). Past year invoices do not count against the current month's limit.

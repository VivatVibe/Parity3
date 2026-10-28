# P.N.D. 90 Tax Dashboard

Aggregates multiple freelancer income streams into Thai Revenue Department categories (40(2) Service/Hire-of-work, 40(6) Liberal professions, 40(8) Business/Influencer), tracks 50 Tawi certificates, and estimates progressive personal income tax.

## Sub-features

- `tax-aggregate`: Groups all issued invoices by income category and sums gross revenue and 3% WHT withheld.
- `tax-deductions`: Calculates standard 50% expense deductions (capped at 100,000 THB for 40(1)/40(2)) and 60,000 THB personal allowance.
- `tax-bracket`: Projects progressive personal income tax (0% up to 150,000 THB, 5% to 300,000 THB, etc.) and calculates refund or balance due.
- `tax-50tawi`: Toggles and tracks receipt of Section 50 Tawi tax withholding certificates from clients.

## How to get to it (user POV)

- From the top navigation bar, click the tab labeled "สรุปภาษี ภ.ง.ด. 90".

## Driving it with control-thai-freelancer-billing

Preconditions:
- App dashboard is open at `http://127.0.0.1:5173/`.
- Seed invoices are present in storage.

- **Navigate to tax tab.** Click button labeled "สรุปภาษี ภ.ง.ด. 90". Assert heading reads "ภาษีเงินได้บุคคลธรรมดา ภ.ง.ด. 90".
- **Inspect Bento Summary.** Verify cards for "เงินได้พึงประเมินรวม", "ภาษีหัก ณ ที่จ่ายสะสม (3%)", and "ภาษีที่ต้องชำระ/ขอคืน".
- **Check Category Breakdown.** Verify income categorized under 40(2), 40(6), and 40(8). Assert expense deduction formulas match Thai tax law.
- **Proof.** Run `node scripts/verify.cjs drive domain`. Output confirms `aggregatePnd90 multi-stream categorization passed`.

## Gotchas

- Income category deduction caps must never exceed the 100,000 THB ceiling for 40(1) and 40(2) combined.
- Only invoices with status `paid` or `sent` count toward taxable gross income.

# Invoice Creation and A4 Print

Freelancers can create standard Thai withholding tax invoices, sign with HTML5 retina digital signature, and export perfectly balanced 1-page A4 PDFs with zero bottom void.

## Sub-features

- `invoice-create`: Form with customer search suggestions, auto 3% WHT calculation, and draft autosave.
- `invoice-grid`: Ledger table automatically pads empty placeholder rows to ensure a clean 6-row layout.
- `invoice-signature`: Dual signature options (auto cursive with certified timestamp or HTML5 drawn canvas).
- `invoice-a4-print`: Bottom-anchored payment & signature block with zero pixel vertical drift across columns.

## How to get to it (user POV)

- From the app dashboard, click "ออกบิลใหม่" or press keyboard shortcut `⌘+N`.
- To preview and print, select any invoice from the list and click "สั่งพิมพ์ / PDF".

## Driving it with control-thai-freelancer-billing

Preconditions:
- App dashboard is open at `http://127.0.0.1:5173/`.

- **Open form.** Click "ออกบิลใหม่". Assert form modal appears with title "ออกใบวางบิลใหม่".
- **Fill invoice details.** Enter client name "บริษัท ตัวอย่าง จำกัด", item description "บริการพัฒนาเว็บ", and amount `30000`. Assert 3% WHT calculates to `900` and net total is `29100`.
- **Save invoice.** Click "บันทึกและสร้างเอกสาร". The new invoice is prepended to the invoice list and automatically opened in the preview modal.
- **Inspect A4 layout.** Verify `#printable-invoice` contains `.invoice-body-bottom` with CSS `margin-top: auto`. Assert minimum 6 rows exist in `#printable-invoice table tbody`.
- **Export PDF.** Run `node scripts/test-pdf-print.cjs`. Chrome DevTools emulates `@media print` and writes `screenshots/sample-invoice.pdf`. Assert file exists and size is greater than 50 KB.

## Gotchas

- On desktop (>= 1024px), selecting an invoice in the left column updates the right split-view pane; on mobile (< 1024px), clicking opens the full-screen preview modal.
- Always check that printed output does not spill over onto a blank second page (total page count strictly 1).

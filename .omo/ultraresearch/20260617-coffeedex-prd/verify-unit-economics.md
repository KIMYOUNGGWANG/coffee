# Verification: CoffeeDex Unit Economics

## Inputs

- Gemini 2.5 Flash: USD 0.30/M input tokens; USD 2.50/M output/thinking tokens.
- Base scan: 1,698 input tokens, 750 output/thinking tokens, 1.05 retry factor.
- FX assumption: KRW 1,400/USD.
- Base saved image: 1 MiB, 10 views first month, Firestore 1 write + 20 reads.
- Toss general card rate: 3.4%, fee VAT separate.

## Formula and result

`scan_krw = 1400 * 1.05 * ((1698 * 0.30 / 1e6) + (750 * 2.50 / 1e6)) = KRW 3.51`

Estimated base first-month passport infrastructure is KRW 1.70, producing KRW 5.20 per scanned-and-saved coffee. After illustrative output VAT and published PG fee, a KRW 14,900 lifetime purchase contributes roughly KRW 12,988 before support/refunds/hosting, or about 2,496 base scanned-and-saved coffees.

## Verdict

PARTIAL: ordinary user economics support free scanning and a lifetime archive offer, but unlimited AI is not economically bounded. Real image token usage, compression, views, fraud and negotiated payment rates require pilot measurement.

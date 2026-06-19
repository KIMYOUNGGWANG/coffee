# CoffeeDex Privacy, Consent, Portability, and Deletion Research

Research date: 2026-06-17 (America/Vancouver)
Scope: Korea PIPA; GDPR/CCPA relevance; Gemini image processing; Firebase retention/deletion; privacy notice and consent; accountless trial; CSV/JSON/PDF exports.
Status: Product/legal research, not legal advice. Korean counsel should confirm the chosen PIPA legal bases and the exact overseas-transfer notice before launch.

## Executive Decision

CoffeeDex is Korea-first, so PIPA is the baseline, not an optional threshold law. GDPR applies only if CoffeeDex has an EU establishment or targets/monitors people in the EEA; mere web accessibility is not enough. CCPA applies only if CoffeeDex is a for-profit business doing business in California and meets a statutory threshold, currently including annual revenue of at least USD 26.625 million, processing 100,000 California residents/households, or deriving at least 50% of revenue from selling/sharing their personal information.

Do not send user images through unpaid Gemini Developer API quota. Google's Gemini API terms effective 2026-03-23 state that unpaid content and responses may be used to improve Google products and reviewed by humans, and explicitly direct developers not to submit personal information. Use only a billed Cloud project/Paid Service under Google's processor DPA. This is mandatory for API clients offered in the EEA, Switzerland, or UK. Even paid Gemini logs prompts/responses for a limited but unspecified period for abuse prevention and may transiently store/cache data in any country where Google or its agents operate; obtain a contractually usable retention/location statement or select a regional enterprise configuration before promising exact deletion.

The repository is not currently Firebase-backed: it documents and implements Supabase Auth/Postgres/Storage. Firebase findings below are requirements for a proposed Firebase deployment or migration. The current app has card-level deletion and paid PDF export, but no account-deletion route, no CSV/JSON portability route, no public-share revocation route, and no end-to-end image-object deletion evidence.

## PIPA Baseline

1. **Lawful basis and minimization.** PIPA Articles 15 and 16 require a lawful basis and minimum necessary collection. Consent is one basis, but data objectively necessary to enter/perform the user-requested service may use the contract basis. When relying on consent, disclose purpose, items, retention/use period, the right to refuse, and consequences of refusal. Do not bundle optional analytics/marketing with core service processing.
2. **Consent design.** Article 22 requires distinguishable consent requests; Article 22-2 requires legal-representative consent for a child under 14. Use separate, unticked choices for optional analytics/marketing and a separate overseas-transfer consent if counsel determines Article 28-8's contract-necessity route is unavailable. A privacy-policy acknowledgment is not itself consent.
3. **Processor governance.** Article 26 requires processor/entrustment governance and disclosure. A paid Gemini service governed by a processor DPA fits this posture more closely. Unpaid Gemini's product-improvement and human-review purposes make a pure processor characterization unsafe and may amount to third-party provision or additional-purpose processing.
4. **Overseas transfer.** Article 28-8 treats overseas provision, access, entrusted processing, and storage as transfers. A controller may use separate consent, or for processing/storage necessary to perform a contract, disclose or communicate the required transfer details. The notice must identify transferred items, country, date/timing and method, recipient and contact, recipient purpose and retention, refusal method, and consequences. Google's generic "any country" language is not a comfortably precise PIPA notice; resolve this contractually.
5. **Retention/deletion.** Article 21 requires destruction without delay when data is no longer necessary, while data retained under another law must be stored separately. Establish category-specific periods, not "as necessary." Korean e-commerce retention commonly includes five years for contract/withdrawal and payment/supply records, three years for consumer complaints/disputes, and six months for advertising records; confirm which records CoffeeDex actually creates under the Electronic Commerce Act and keep only the mandated fields.
6. **Security and breach readiness.** Article 29 requires administrative, technical, and physical safeguards. Use encryption, least privilege, RLS/security rules, secret management, audit controls, upload validation, and an incident playbook.
7. **Policy and rights.** Article 30 requires a public privacy policy. Articles 35-37 support access, correction/deletion, suspension, and consent withdrawal. The policy must describe purposes/items/legal bases, periods, third parties/processors, overseas transfers, destruction, rights and request procedure, privacy officer/contact, remedies, safeguards, and automatic collection where relevant.
8. **PIPA transmission right.** Article 35-2 took effect in 2025, but implementation is staged by designated sectors/controllers (initially medical/telecom, then other selected sectors). CoffeeDex is unlikely to be directly subject today merely as a coffee app; this is legal uncertainty and should be rechecked as culture/leisure and retail phases expand. Ordinary PIPA access rights still require a usable copy even if statutory MyData transmission does not yet apply.

## GDPR Relevance

- GDPR Article 3 applies to an EU establishment and to a non-EU controller intentionally offering goods/services to, or monitoring, people in the EU. Korean language, KRW pricing, and Korea-only launch reduce but do not conclusively eliminate targeting; EU languages/currencies, EU ads, shipping, or behavioral profiling increase risk.
- If applicable, document an Article 6 lawful basis; provide Article 13 information at collection; bind processors under Article 28; use a Chapter V transfer mechanism for onward transfers; and answer rights requests under Articles 15-22 within one month (extendable by two months with notice).
- Korea has an EU adequacy decision dated 2021-12-17, allowing EU-to-Korea flows without another safeguard. It does not automatically validate CoffeeDex's onward Korea-to-US/Google transfers; those require the provider's applicable DPF/SCC or other mechanism.
- Article 17 requires erasure without undue delay when a ground applies, subject to exceptions. Backups may age out if put beyond ordinary use, protected, and not restored into production without reapplying deletion tombstones; explain this precisely.
- Article 20 portability applies to data "provided" by the user, processed automatically on consent/contract, and requires a structured, commonly used, machine-readable format. Include actively supplied and observed data; label inferred/derived AI outputs separately. PDF alone is not sufficient. JSON and CSV are appropriate, with direct controller-to-controller transmission only where technically feasible.

## CCPA/CPRA Relevance

- Current coverage thresholds are described above. If none is met and CoffeeDex is not controlled by a covered business under common branding, CCPA rights are not mandatory, though a single global rights workflow is operationally preferable.
- If covered, provide notice at or before collection and an updated privacy policy; limit collection/use/retention to reasonably necessary and proportionate disclosed purposes; support know/access, delete, correct, opt-out of sale/sharing, limit sensitive-data use, and non-discrimination.
- Confirm receipt of know/delete/correct requests within 10 business days and respond within 45 calendar days, extendable once by 45 days with notice. Tell service providers/contractors to delete as required.
- Access output must be portable and, where technically feasible, readily usable. Accountless users still need a request path and proportionate verification; do not force account creation merely to exercise a right.
- Using unpaid Gemini for Google's own product improvement risks losing a clean CCPA service-provider/contractor characterization. Whether it constitutes a "sale" or "sharing" is fact-specific legal uncertainty; avoid the issue through paid processor terms and no advertising use.

## Gemini Image Requirements

1. Use server-side Paid Gemini only; enforce a startup/deployment check that the project has active billing. Never silently fall back to unpaid quota.
2. Before upload, show a just-in-time notice: image goes to Google for label extraction; transferred data; country/location; transfer method; provider purpose/retention; whether refusal disables scanning; link to full policy.
3. Treat every image as potentially personal. Package photos may contain names, addresses, order labels, faces/hands, reflections, location metadata, or unique account associations. Strip EXIF, downscale/crop client-side, reject unsupported MIME types and oversized files, and tell users not to upload people, IDs, shipping labels, or confidential material.
4. Do not log request bodies/base64, prompts with user content, signed URLs, or model responses containing personal data. Use opaque request IDs and redacted metrics.
5. Do not retain the raw scan image by default. Hold it in memory only for the request, unless the user separately chooses to save it. Store the extracted draft only after user review and confirmation.
6. Record provider, model/version, billed/processor mode, notice version, transfer basis, request time, and deletion/expiry class. Do not record the raw image in the consent ledger.
7. Google paid terms say prompts/responses are logged for a "limited period" but provide no duration in the terms. This blocks a truthful exact retention promise. Obtain written clarification/DPA schedule or use an enterprise offering with documented zero-data-retention/regional controls. Mark residual provider copies as expiring under provider retention, not as immediately erased.

## Firebase Retention and Deletion

These requirements apply only if Firebase is actually adopted.

- **Authentication:** Firebase says logged IP addresses are retained for a few weeks. Other authentication information remains until the customer deletes the user, then is removed from live and backup systems within 180 days. Deleting an Auth user does not by itself prove deletion of application databases or Storage; orchestrate all systems.
- **Firestore live data:** Deleting a parent document does not delete subcollections. Use recursive/bulk server-side deletion. TTL usually deletes within 24 hours after expiration and also does not delete subcollections, so TTL is not a complete account-erasure mechanism.
- **PITR/backups:** PITR retains document versions for seven days. Scheduled backups are configurable up to 14 weeks; deleting the source database or backup schedule does not delete existing backups. Delete backups where operationally feasible and maintain deletion tombstones so restore jobs immediately re-delete erased subjects.
- **Cloud Storage:** Soft delete is enabled by default and deleted objects are typically recoverable for seven days. Decide whether to shorten/disable it or disclose the recovery period. Delete every original, thumbnail, transformed copy, and stale multipart upload by an indexed object prefix.
- **Firebase DPA:** During the term, Google commits to carry out customer deletion instructions as soon as reasonably practicable and within 180 days unless law requires storage. At term end there can be a recovery period of up to 30 days before deletion processing. Customer data may be processed where Google/subprocessors operate; review the current subprocessor list and transfer solution.
- **Firebase AI Logic:** Firebase says AI Logic itself does not store model input/output, but the chosen Gemini provider's retention governs; optional AI monitoring sends data to Google Cloud Observability and creates a separate retention surface.
- **Installations/telemetry:** Anonymous Auth UID, Firebase Installation ID, IP address, device/browser identifiers, App Check tokens, and analytics identifiers can still be personal data. Delete the installation ID and disable optional analytics/crash monitoring until consent where required.

## Accountless Trial

Preferred design: no Firebase/Supabase account, no database write, no Storage upload, no nonessential cookie, and no persistent analytics identifier. Generate an opaque per-request ID, process the cropped image through paid Gemini, return the editable draft, and discard request content from CoffeeDex memory. A local browser draft can expire on tab close or within 24 hours.

If an anonymous Firebase account is used, do not call it "anonymous" in the sense of non-personal data. It creates a persistent UID and may involve installation IDs, IPs, and device data. Namespace all trial artifacts under the UID; set an `expiresAt`; recursively delete Firestore data, Storage objects, Auth user, installation ID, and logs; run a retryable cleanup queue; and disclose the provider residual periods above.

The upload screen still needs collection/overseas-transfer notice even without account creation. For rights verification, issue a one-time recovery/deletion secret stored locally, or provide a request ID plus proof-of-possession mechanism. Do not collect email solely to support deletion if a less intrusive mechanism works. Age-gate or design out under-14 use unless verified legal-representative consent is implemented.

## Export Contract

Offer a free self-service privacy export independent of the paid decorative PDF product:

- `manifest.json`: schema version, generated time, account ID, data categories, files, checksums, and exclusions.
- `profile.json`, `cards.json`, `brewing-notes.json`, `shelf.json`, `brewing-logs.json`: lossless typed records with timestamps and stable IDs.
- CSV equivalents for tabular user records, UTF-8 and RFC 4180-compatible; neutralize spreadsheet formula injection for cells beginning with `=`, `+`, `-`, or `@`.
- Original user-uploaded images/files in a media directory, plus a mapping from record IDs to files. Do not export temporary signed URLs.
- `ai-outputs.json`: clearly separate user inputs/observations from inferred or generated fields and include correction status.
- `shares.json`, consent/notice history, rights-request history, and relevant subscription/transaction metadata; exclude secrets, password hashes, full card data, internal fraud signals, other users' data, and legally privileged material.
- PDF remains an optional human-readable keepsake, not the portability artifact. ZIP the package, require recent authentication for accounts, encrypt or use a short-lived authenticated download, expire it quickly (for example 24 hours), and audit generation/download/deletion without logging contents.

## Deletion Contract

Build one idempotent deletion orchestrator and a data inventory. On account deletion: reauthenticate; revoke all public links first; cancel or detach subscriptions as appropriate; delete originals/derivatives from Storage; recursively delete cards, notes, shelf/log data and profile rows; redact or segregate legally retained Stripe/support records; remove analytics identifiers and exports; record provider residual-expiry status; delete Auth last; and send a completion receipt that distinguishes active deletion from backup/provider expiry.

Keep a minimal deletion ledger containing only request ID, subject hash, scope, timestamps, status, legal holds, and system acknowledgments. On backup restore, replay this ledger before serving traffic. Legal holds must be field-specific, access-restricted, separately stored, and automatically expired; "security/audit" is not an unlimited retention purpose.

## Repository Findings

- `app/api/v1/cards/scan/route.ts:189-227` sends the complete base64 image to `generativelanguage.googleapis.com` and does not verify paid mode, obtain/show transfer notice, or expose provider retention.
- `app/legal/privacy/page.tsx:3-39` is materially incomplete: it lists broad categories and purposes but no controller/CPO identity, category-level legal basis/period, processor list, overseas transfer details, destruction method, rights procedure/timing, safeguards, automatic collection, minors, or public sharing. Its deletion-via-support statement is not backed by an account-deletion endpoint found in the repository.
- `app/api/v1/cards/[id]/route.ts:152-181` deletes only the database card. It does not delete an image object referenced by `image_url`, provider copies, generated exports, or related public links outside the row.
- `app/api/v1/pdf/route.ts:26-118` produces a paid PDF from a subset of card fields. No CSV/JSON privacy export route exists, and PDF is not a machine-readable portability format.
- `supabase/migrations/20260614000005_add_public_card_sharing.sql:4-25` defaults cards to private, which is good, but creates a permanent token for every card. `app/api/v1/cards/[id]/share/route.ts` publishes a card but no revoke/rotation endpoint was found.
- Foreign and payment recipients include at least Google/Gemini and Stripe, while deployment docs identify Supabase for auth/database/storage. The policy names Stripe only and omits the others and their overseas-transfer details.
- Database cascades cover many user-owned rows, but `stripe_events.user_id` uses `ON DELETE SET NULL` and the event payload/Stripe identifiers can remain. Define statutory/payment-defense retention and redact unnecessary payload fields at expiry.

## Launch Priority

**Block launch:** paid Gemini enforcement; exact AI/overseas-transfer notice and legal basis; complete privacy policy; self-service account deletion; full storage/database/public-link deletion; retention schedule; no raw-content logging.

**Before broad release:** JSON/CSV/media export; rights-request workflow and deadlines; anonymous-trial TTL/cleanup; under-14 policy; processor DPAs and subprocessor inventory; restore-time tombstone replay; public-share revoke/rotate.

**Before EU/California targeting:** GDPR representative/transfer/lawful-basis assessment as applicable; GDPR one-month rights SLA; CCPA threshold review, notices, request methods, opt-out/GPC logic if selling/sharing, and 10-business-day/45-calendar-day workflow.

## Official Sources

All accessed 2026-06-17 unless a source date is stated.

1. Korea Personal Information Protection Act, including Articles 15, 21, 22, 26, 28-8, 29, 30, and 35-37: https://law.go.kr/LSW/lsInfoP.do?chrClsCd=010203&lsiSeq=248613&urlMode=engLsInfoR&viewCls=engLsInfoR
2. Korea PIPA Article 35-2 transmission right (effective 2025-03-13): https://www.law.go.kr/LSW/lsInfoP.do?ancNo=19234&ancYd=20230314&ancYnChk=0&chrClsCd=010202&efGubun=Y&efYd=20240315&lsiSeq=248613&nwJoYnInfo=Y
3. PIPA Enforcement Decree, including overseas processing/storage notice method: https://www.law.go.kr/LSW/lsInfoP.do?chrClsCd=010203&lsiSeq=261095&urlMode=engLsInfoR&viewCls=engLsInfoR
4. PIPC, 2026 revised privacy-policy guidance announcement: https://www.pipc.go.kr/np/cop/bbs/selectBoardArticle.do?bbsId=BS074&mCode=&nttId=12021
5. PIPC, staged MyData/transmission-right implementation (energy phase, 2026-06-01): https://www.pipc.go.kr/np/cop/bbs/selectBoardArticle.do?bbsId=BS074&mCode=&nttId=12133
6. GDPR official text, Articles 3, 12-22, 28, and 44-49: https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng
7. EDPB Guidelines 3/2018 on territorial scope, final 2019-11-12: https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-32018-territorial-scope-gdpr-article-3-version_en
8. EDPB/WP29 portability guideline WP242 rev.01: https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-right-data-portability-under-regulation-2016679_en
9. European Commission adequacy decisions, including Republic of Korea decision dated 2021-12-17: https://commission.europa.eu/law/law-topic/data-protection/international-dimension-data-protection/adequacy-decisions_en
10. California Privacy Protection Agency CCPA FAQ: https://cppa.ca.gov/faq
11. CPPA adjusted CCPA monetary thresholds, effective 2025-01-01: https://cppa.ca.gov/regulations/cpi_adjustment.html
12. California Attorney General CCPA overview, updated 2024-03-13: https://oag.ca.gov/privacy/ccpa
13. Gemini API Additional Terms, effective 2026-03-23: https://ai.google.dev/gemini-api/terms
14. Google processor DPA referenced by paid Gemini: https://business.safety.google/processorterms/
15. Firebase privacy/security and service-specific retention: https://firebase.google.com/support/privacy
16. Firebase Data Processing and Security Terms: https://firebase.google.com/terms/data-processing-terms
17. Firestore deletion and subcollection warning: https://firebase.google.com/docs/firestore/manage-data/delete-data
18. Firestore TTL behavior: https://firebase.google.com/docs/firestore/ttl
19. Firestore PITR seven-day window: https://firebase.google.com/docs/firestore/pitr
20. Firestore scheduled backups and 14-week maximum: https://firebase.google.com/docs/firestore/backups
21. Cloud Storage for Firebase soft-delete behavior: https://firebase.google.com/docs/storage/web/delete-files
22. Firebase Authentication user management: https://firebase.google.com/docs/auth/admin/manage-users

## Legal Uncertainties to Resolve

- Whether CoffeeDex can rely on PIPA Article 28-8 contract necessity for each Gemini/Supabase/Firebase/Stripe overseas processing operation, or needs separate transfer consent.
- Exact countries and exact paid-Gemini prompt/image retention period for the selected project, model, endpoint, safety configuration, and logging/monitoring options.
- Whether CoffeeDex becomes a designated Article 35-2 transmission-obligated controller as Korean MyData expands into culture/leisure or retail.
- Which Korean e-commerce/payment records CoffeeDex must retain and whether any communications-log rule applies to its actual service classification.
- GDPR targeting/monitoring based on the final distribution, languages, currencies, marketing, and analytics configuration.
- CCPA coverage based on corporate group, annual revenue, California volume, and any advertising/data-sharing practices.

## EXPAND

none - Primary laws, regulators, current provider terms, retention mechanics, code paths, and two follow-up expansion passes converged. Remaining items require CoffeeDex's final contracts, deployment regions, customer geography, and counsel, not more public-source searching.

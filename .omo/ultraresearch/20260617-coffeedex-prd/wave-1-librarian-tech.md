# Wave 1: Gemini, PWA, Firebase

## Findings

- Gemini supports image understanding plus schema-constrained JSON, but official docs do not establish OCR-grade accuracy on reflective, folded, multilingual coffee bags. Stable paid models and high media resolution are the prudent baseline.
- Paid Gemini terms are materially preferable to free-tier processing for user photos; zero-data-retention has feature constraints.
- PWA is feasible for capture, picker upload, foreground sharing and offline drafts. iOS lacks a Chrome-style install prompt and reliable background upload must not be assumed.
- Firebase is viable for rapid delivery if images are per-user in Storage, metadata in Firestore, App Check is enforced, and deletion/export is server-orchestrated. Index/rule reads and image bandwidth are the main cost traps.

## Key sources

- https://ai.google.dev/gemini-api/docs/image-understanding
- https://ai.google.dev/gemini-api/docs/structured-output
- https://ai.google.dev/gemini-api/docs/pricing
- https://ai.google.dev/gemini-api/docs/zdr
- https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share
- https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/
- https://firebase.google.com/docs/firestore/pricing
- https://firebase.google.com/docs/storage/security
- https://firebase.google.com/docs/app-check

## EXPAND markers

- LEAD: real-bag accuracy benchmark — WHY: official docs do not quantify the core promise — ANGLE: benchmark representative bag photos and field-level corrections.
- LEAD: Gemini vs OCR pipeline — WHY: determine fallback and cost — ANGLE: compare schema extraction with OCR+LLM.
- LEAD: scan/report unit cost — WHY: validate free unlimited scanning and lifetime pricing — ANGLE: low/medium/high volume model.
- LEAD: Firestore schema and delete lifecycle — WHY: trust and cost depend on ownership boundaries — ANGLE: access matrix and idempotent deletion.
- DEAD END: no basis for guaranteeing background upload completion on iOS PWA.

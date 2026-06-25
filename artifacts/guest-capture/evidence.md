# Guest capture evidence

## Guest scan, edit, confirm, and auth handoff

- Scenario: At 375x812, a guest selects a package photo, receives only mocked package facts with uncertainty, keeps all three taste axes at neutral user-owned values, edits memory fields, explicitly confirms, and receives a 401 only on durable save.
- Invocation: `npx playwright test test/guest-capture.test.ts test/guest-save-resume.test.ts --config=artifacts/guest-capture/playwright.localhost.config.ts --reporter=line`
- Binary observable: `3 passed (1.7s)`; the create payload contains `confirmed: true`, `imageUrl: null`, the user-edited taste values, and corrected package process; local storage contains no image data after navigation to `/auth?redirect=%2Fcapture%3Fresume%3D1`.
- Artifacts: `artifacts/guest-capture/playwright-final.log`, `artifacts/guest-capture/mobile-editor.png`, `artifacts/guest-capture/mobile-auth-gate.png`.

## Blank manual capture

- Scenario: At 375x812, a guest chooses manual entry without invoking scan.
- Invocation: Same targeted Playwright invocation above.
- Binary observable: Manual title and roaster fields are empty, no sample-bean text is present, and scan request count is zero.
- Artifact: `artifacts/guest-capture/playwright-final.log`.

## Failed save and successful resume

- Scenario: A confirmed stored draft resumes at `/capture?resume=1`; the first POST returns 500 and retains the draft; retry returns 201 and clears it before navigation to `/dashboard`.
- Invocation: Same targeted Playwright invocation above.
- Binary observable: Exactly two POST attempts; local draft is present after 500 and absent after 201.
- Artifacts: `artifacts/guest-capture/playwright-final.log`, `artifacts/guest-capture/mobile-save-retry.png`.

## Contract and static verification

- Scenario: Existing guest draft TTL/image exclusion and guest scan boundary contracts.
- Invocation: `node --test test/guest-draft.test.mjs test/guest-scan-contract.test.mjs`.
- Binary observable: `tests 9`, `pass 9`, `fail 0`.
- Artifact: `artifacts/guest-capture/node-contracts.log`.
- Scenario: Repository TypeScript compilation.
- Invocation: `npm run typecheck`.
- Binary observable: exit code 0.
- Artifact: `artifacts/guest-capture/typecheck-final.log`.
- Scenario: OMO TypeScript no-excuse audit for all five created/modified TypeScript test and feature modules.
- Invocation: `check-no-excuse-rules.ts app/capture/page.tsx components/guest-capture-client.tsx components/coffee-memory-editor.tsx test/guest-capture.test.ts test/guest-save-resume.test.ts`.
- Binary observable: `No violations in 5 file(s)`.
- Artifact: `artifacts/guest-capture/no-excuse-final.log`.

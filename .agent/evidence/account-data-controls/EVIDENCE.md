# Account Data Controls Evidence

## Implementation

- Settings route: `app/settings/page.tsx`
- Account controls: `components/account-data-controls.tsx`
- Dashboard settings destination: `components/dashboard-navigation.tsx`
- Browser coverage: `test/account-data-controls.test.ts`

## Success criteria

### Free JSON and CSV downloads

- Scenario: a user opens `/settings` and downloads both formats without an entitlement check.
- Invocation: `ACCOUNT_CONTROLS_BASE_URL=http://127.0.0.1:3100 npx playwright test test/account-data-controls.test.ts --reporter=line`
- Binary observable: both download events fire and Chromium reports `coffeedex-memories-2026-06-18.json` and `coffeedex-memories-2026-06-18.csv` from mocked `Content-Disposition` headers.
- Captured artifacts: `playwright.log`, `happy-mobile.png`, `happy-tablet.png`, `happy-desktop.png`.

### Exact destructive confirmation and acknowledgement

- Scenario: deletion remains disabled before confirmation, remains disabled with only the exact phrase, and enables only after the permanent-deletion checkbox is checked.
- Invocation: same focused Playwright command above.
- Binary observable: disabled/enabled assertions pass and the captured DELETE body equals `{ confirmation: "내 CoffeeDex 계정을 영구 삭제합니다", acknowledgePermanentDeletion: true }`.
- Captured artifacts: `playwright.log`, `happy-mobile.png`.

### Recoverable API failure

- Scenario: the first DELETE returns a mocked 500 response, preserves confirmation state, re-enables retry, and the second DELETE succeeds.
- Invocation: same focused Playwright command above.
- Binary observable: error alert is visible, input still has the exact phrase, delete button is enabled, attempt count equals two, and success status appears.
- Captured artifacts: `playwright.log`, `failure-recoverable-mobile.png`.

### Type and production integration

- Scenario: all shared TypeScript contracts compile and `/settings` is included in a production Next.js build.
- Invocations: `npm run typecheck`; `npm run build`.
- Binary observable: both commands exit zero; build route table reports `/settings` as statically prerendered.
- Captured artifacts: `typecheck.log`, `build.log`.

## Visual QA

- Breakpoints inspected: 375px, 768px, and 1280px.
- States inspected: disabled, confirmed, API error/retry, and deletion success.
- Result: no horizontal overflow; visible focus styles and mobile-sized controls; panels follow CoffeeDex dark shelf, amber, cream, and danger tokens.

## Integration assumptions

- `/api/v1/export` and `/api/v1/account` use the browser's same-origin authenticated cookies.
- Export filenames are authoritative from the API `Content-Disposition` response header.
- A successful account DELETE removes the auth identity server-side; the client reports completion and does not call logout or couple deletion to a sign-out action.
- Port 3100 was used only for evidence isolation because port 3000 was occupied by another agent's reused dev server.

## Architecture review

- Each changed file has one responsibility and stays below 200 pure lines.
- API error JSON is parsed with Zod at the client boundary.
- No `any`, type assertions, non-null assertions, or TypeScript suppression directives were added.
- Browser tests fail if downloads, exact acknowledgement gating, retry state preservation, or the DELETE payload regress.

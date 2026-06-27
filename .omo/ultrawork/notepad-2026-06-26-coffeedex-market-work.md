# UltraWork Notepad: CoffeeDex Market Opportunities Sprint

Session: codex:019f05f2-4e36-7570-af5a-24b467e68cbf
Started: 2026-06-26
Mode: ULTRAWORK

## Skills

- omo:ulw-plan: required by user; used to create the decision-complete Prometheus plan.
- omo:start-work: required by user; used to execute the plan via delegated workers only.
- codegraph: used for repo grounding before planning/execution.
- oma-market/oma-search: already used in the prior research turn; output is `docs/market-opportunities-2026-06-26.md`.

## Tier

HEAVY. The requested work is an open-ended product sprint from market research, likely touching multiple UI/domain surfaces and verification channels.

## Objective

Create a Prometheus plan for the market-opportunity slice, then start execution. Default scope is the smallest high-leverage slice: Quick Add Memory Mode plus lightweight Korean flavor guidance and rebuy/recipe recall affordance, with no marketplace/community/referral layer and no DB migration unless the plan reviewer proves it is unavoidable.

## Success Criteria

1. `.omo/plans/coffeedex-market-opportunities-sprint.md` exists, scaffolded by `ulw-plan`, and has decision-complete todos with exact QA scenarios.
2. `.omo/boulder.json` points to the selected plan with this session id before implementation starts.
3. Every executed checkbox is delegated to workers; root does not edit product files or run QA itself.
4. Each completed checkbox records RED->GREEN proof, manual QA artifact, adversarial checks, and cleanup receipt in `.omo/start-work/ledger.jsonl`.

## Adopted Defaults

- Intent route: UNCLEAR/start-work bootstrap. User asked to plan and start from broad market research without selecting one exact feature.
- Product default: ship the first validated slice, not the full six-item roadmap.
- Boundary default: no roaster marketplace, referrals, social graph, public community, DB migrations, or external integration in this sprint.
- Dirty worktree default: preserve all existing modified/untracked files unless a worker is explicitly assigned that path.

## Evidence / State

- Market research brief: `docs/market-opportunities-2026-06-26.md`.
- Project contracts: `docs/golden-flows.md`, `docs/api-spec.md`, AGENTS instructions.
- Boulder before start: `.omo/boulder.json` exists with `active_work_id: null`.
- Dirty worktree includes unrelated mobile/design changes plus prior KPI snapshot files; workers must not revert them.

## Active Agents

- Planner `019f0620-23e9-79b3-ba25-490a82ba1317`: generating `.omo/plans/coffeedex-market-opportunities-sprint.md`.

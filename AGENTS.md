# AGENTS.md — Unified AI Agent Governance

## Project Mission
- Core: Orchestrator Hub - A reusable operations hub for AI-assisted software projects.
- Target: Orchestrator 7.5 - Lean Surface with Codex Primary, UltraPlan automation, and Antigravity verification.

## Hub Stack
- Runtime: Bash, Markdown, JSON, symlink-based project linking
- Interface: IDE workflows, command prompts, project memory files
- Validation: shell checks, smoke scripts, contract and audit utilities

## Default App Stack (For Connected Client Projects)
- Frontend: Next.js 16+ (App Router), TypeScript, Tailwind CSS
- UI: Shadcn/UI, Premium Aesthetics
- State: Zustand
- Data: TanStack Query (React Query v5)
- Backend: Supabase (Auth, DB, Storage)

> Official baseline: `starters/starter-saas-next-supabase`

## Core Development Rules
- Truthfulness first: docs, scripts, and workflows must describe commands that really exist.
- Prefer recoverable automation: safe defaults, backups, and explicit diagnostics over magic.
- Architecture: FSD Lite (Function-based grouping)
- Naming: Descriptive, no abbreviations (e.g., `request` instead of `req`)
- Clean Code: Small units (< 20 lines), single responsibility
- Components: Server Components by default in connected app projects
- Safety: Strict Type Safety (Zod), no `any`

## Role Split — 3-Way Division

```
Codex        →  설계/계획/구현/수정
Claude Code  →  선택적 고급 리뷰
Gemini CLI   →  오케스트레이션/QA/검증
(Antigravity)
```

| 역할 | 담당 도구 |
|------|----------|
| 미션 컨트롤 · 전체 오케스트레이션 | **Gemini CLI (Antigravity)** |
| 의도 분류 / IntentGate | Codex 또는 Antigravity |
| 요구사항 분석 · API Spec · 아키텍처 설계 | Codex |
| **코드 구현 (태스크 수 무관, 항상)** | **Codex** |
| QA · E2E · 게이트 검증 | Gemini CLI (Antigravity) |
| 최종 리뷰 · 승인 | Codex 기본, Claude 선택 |
| 메모리 · task_board 관리 | Codex |

> 파이프라인: `Codex(Plan+Build) → Antigravity(Verify) → Codex(Fix) → Antigravity(Ship)`

## Agent Surfaces
- `.agents/commands` and `.agents/skills` are the source surfaces.
- Discovery commands are `brainstorm` and `office-hours`; use them before `plan` when the direction, user, pain, or wedge is still fuzzy.
- User-facing commands use the lean primary surface: `status`, `plan`, `develop`, `qa`, `ship`, `fix`.
- Codex-visible command aliases live in `.agents/skills/commands/<command>/SKILL.md` for those six primary commands only; each alias points back to `.agents/commands/<command>.md`.
- Revenue OS work stays inside the primary loop: idea validation, offer design, landing/MVP/automation delivery, viral content, manual metrics, and weekly review are template packs, not new top-level commands.
- Revenue evidence state lives under `.agent/memory/revenue/experiments/<slug>.json`; the latest score is `.agent/memory/revenue/latest-score.json`.
- Do not create or track `.agents/skills/source-command-*`; those are generated command wrappers, not source skills.
- `.claude/` links commands and skills for Claude Code.
- `.codex/agents/` contains generated Codex planner/builder role descriptors; `AGENTS.md` remains authoritative.
- `.gemini/agents/` contains generated Antigravity/Gemini role descriptors; `GEMINI.md` remains authoritative.
- External `oma` and `oh-my-openagent` runtimes are not default dependencies.
- `ultraplan.sh` is bounded automation: dry-run by default, clean tree by default, no auto-ship by default.

## Imported Claude Cowork project instructions

# AGENTS.md — test/

## 목적
단위 및 통합 테스트.

## 규칙
- 실제 Supabase DB 접근 금지 — mock 사용.
- 테스트 파일명: *.test.ts(x).
- 각 테스트는 독립적으로 실행 가능해야 함.

## 주의
- 이 파일은 `bash .agent/scripts/init-deep.sh` 로 자동 생성되었습니다.
- 프로젝트 특화 내용은 직접 편집하세요.

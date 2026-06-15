# AGENTS.md — app/

## 목적
Next.js App Router 페이지 및 레이아웃. 각 파일은 route segment를 정의한다.

## 규칙
- Server Component 기본. 'use client' 는 최소화.
- layout.tsx / page.tsx / error.tsx / loading.tsx 컨벤션 준수.
- 데이터 페칭은 서버 컴포넌트에서 직접 처리.

## 주의
- 이 파일은 `bash .agent/scripts/init-deep.sh` 로 자동 생성되었습니다.
- 프로젝트 특화 내용은 직접 편집하세요.

# Dealer365 TypeA — Backlog (Post A-Core)

> 원칙: **기존 토큰/레이아웃/구조/동작은 유지**하고, 신규 기능은 “추가” 방식으로만 확장.

## C. Login (Mock) — 필요, 이번 단계 미구현
- **목표**: `/login`에서 딜러/사용자/역할 선택 → 앱 진입(목업)
- **요구사항**
  - **Role 선택**: Technician / Advisor / Dispatcher / Sales / Manager
  - **Theme 선택**: Light / Dark (토큰 기반)
  - **세션 저장**: role/theme/landing을 `localStorage`에 저장(선택적)
  - **진입 후 동작**: 기존 `RootLayout`의 흐름(네비/역할 전환/테마 토글) 유지
- **화면 구성(Shadcn 조합)**
  - Dealer selector(콤보박스), user selector(리스트), role selector(라디오/세그먼트)
  - “Continue” primary CTA, “Demo mode” secondary CTA

## B. Placeholder modules — 순차 구현(각 네비 항목당 1개 실화면)
- **공통 규칙**
  - Role-adaptive: 화면을 역할별로 “분리”하지 않고, 같은 화면에서 섹션/컬럼/CTA만 역할에 맞게 다르게
  - Queue → Workspace → Tool 흐름 유지
  - 토큰 유틸(`bg-background`, `text-foreground`, `border-border`, 등)만 사용
  - 모바일: 테이블 → 카드, 터치 타겟 \(>= 48px\)

- **Sales**
  - Leads Queue (triage + next-best-action)
  - Deals Workspace (deal summary + steps + docs)
  - Inventory Search (filters + compare)

- **Service**
  - Parts Queue (backorder, ETA, alternatives)
  - Approvals Center (pending approvals + templates)
  - Customer Comms (templates + logs)

- **DMS / Ops**
  - Reports (role-based KPI view)
  - Operations (tasks, alerts, audit)
  - Admin (users/roles, preferences)

## Tech debt / Quality
- `npm audit` 경고 처리(가능하면 **breaking change 없이** 해결)
- 접근성 점검: focus ring, 키보드 이동, `prefers-reduced-motion` 준수 범위 확대(필요 시)


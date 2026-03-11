# Dealer365 TypeA — A(Core) Regression Checklist

목표: **기존 토큰/레이아웃/구조/동작을 변경하지 않고** A(Core) 화면 고도화 후 회귀를 빠르게 확인한다.

## 변경 금지(Freeze) 범위
- **토큰 시스템**: `src/styles/theme.css`의 CSS 변수 정의 및 다크모드 토큰 구조
- **쉘 구조**: `src/app/pages/RootLayout.tsx`의 레이아웃 골격(사이드바/헤더/메인 영역 분할)
- **역할 기반 네비**: `src/app/components/d365/data.ts`의 `ROLE_CONFIGS` 및 `Sidebar` 렌더링 방식
- **페이지 연결 방식**: URL 라우팅이 아니라 `RootLayout`의 `activeNav` 조건부 렌더링 흐름

## A(Core) 범위 화면(현재 구현 기준)
- **App shell**
  - `src/app/pages/RootLayout.tsx`
  - `src/app/components/d365/TopHeader.tsx`
  - `src/app/components/d365/Sidebar.tsx`
  - `src/app/components/d365/CommandPalette.tsx`
- **Core pages**
  - `src/app/pages/DashboardPage.tsx`
  - `src/app/pages/AppointmentQueuePage.tsx`
  - `src/app/pages/ServiceWorkbenchPage.tsx`
  - `src/app/pages/DispatchBoardPage.tsx`
  - `src/app/pages/RODetailPage.tsx`
  - `src/app/pages/WalkaroundPage.tsx`
  - `src/app/pages/InspectionToolPage.tsx`
  - `src/app/pages/ConsultationWorkspacePage.tsx`

## 공통 회귀 체크(모든 페이지에서)
- **테마**: 라이트/다크 토글 시 배경/텍스트 대비가 유지되고, 스크롤/스티키 헤더가 깨지지 않는다.
- **역할 전환**: Technician/Advisor/Dispatcher/Sales/Manager 전환 시 네비/CTA가 변경되고 크래시가 없다.
- **반응형**: Desktop(>=lg), Tablet(sm~md), Mobile(xs)에서 overflow/레이아웃 붕괴가 없다.
- **키보드**:
  - `Cmd/Ctrl + K`로 Command Palette 열림/닫힘
  - `/` 단축키가 검색 input focus를 방해하지 않고, 입력 중일 때는 트리거되지 않는다(해당 페이지에 구현된 경우)
- **접근성(기본)**: 포커스 링이 보이고(탭 이동), 클릭 가능한 요소의 최소 터치 타겟이 유지된다.

## 화면별 스모크 시나리오
### Appointment Queue (`AppointmentQueuePage`)
- **필터**: Type/Status/검색이 정상 동작하고, 빈 상태(Empty) UI가 깨지지 않는다.
- **CTA 일관성**: 리스트 1차 CTA와 디테일 패널 1차 CTA 라벨이 동일하다.
- **내비게이션**: Primary CTA가 `onNavigate`로 올바른 `activeNav`를 호출한다(예: Walkaround/RO 등).

### Service Workbench (`ServiceWorkbenchPage`)
- **탭/필터**: 탭(Active/Parts/QC/Completed/All) 전환, 검색, Priority/Advisor/Tech 필터가 정상 동작한다.
- **디테일 패널**: RO 선택 → 슬라이드오버 열림/닫힘이 정상, 배경 스크롤 잠금이 어색하지 않다.
- **Technician role**: “My jobs”에 준하는 필터가 유지된다(기존 로직이 깨지지 않는다).

### Dispatch Board (`DispatchBoardPage`)
- **DND**: 카드 드래그 → 컬럼 이동, drop highlight, invalid drop handling이 정상.
- **Assign flow**: Assign modal 열림/닫힘, “AI Apply All” 적용이 정상.
- **로딩**: role 전환 시 skeleton → content 전환이 정상.

### RO Workspace (`RODetailPage`)
- **RO 전환**: RO selector로 다른 RO 선택 시 로딩/탭 초기화가 정상.
- **컨텍스트 패널**: 토글 시 레이아웃이 깨지지 않는다(데스크탑).
- **탭**: role별 가시 탭 규칙이 유지되고, 탭 언더라인 애니메이션이 정상.

### Walkaround (`WalkaroundPage`)
- **스텝**: step forward/back, progress bar, summary 단계 진입이 정상.
- **다이어그램**: zone 선택/해제, photo count 증가/감소, damage badge 표시가 정상.
- **서명**: signature pad 드로잉/clear가 크래시 없이 동작한다.

### Inspection Tool (`InspectionToolPage`)
- **체크리스트**: verdict 변경, 확장 영역(expand) 동작, 추정 금액 합계 계산이 정상.
- **AI Summary**: AI 패널 열림/로딩/완료 상태가 정상.
- **제출**: 제출 후 bottom-sheet 출력 패널 열림/닫힘이 정상.

### Sales Consultation Workspace (`ConsultationWorkspacePage`)
- **탭 전환**: Overview/Test Drive 탭 이동 및 CTA 바가 정상.
- **AI Deal Brief**: 패널 열림/로딩/완료 상태가 정상.


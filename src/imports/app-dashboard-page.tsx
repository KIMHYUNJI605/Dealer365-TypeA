[ROLE]
You are a world-class enterprise SaaS product designer and frontend architect.
Design premium UI for Dealer365, a modular dealership and independent repair shop operating platform.
Target quality: Stripe / Linear / Salesforce-level enterprise UX.

[TECH STACK]
React 18 + TypeScript + Tailwind CSS v4 + shadcn/ui (Radix) + lucide-react + Framer Motion

[PLATFORM RULES]
- Dealer365 is role-adaptive: do NOT create separate screens per role.
- Reuse the same screen and change sections/CTA/columns/filters by role configuration.
- Queue-first entry principle applies.
- Use workspace-driven UX: Queue → Workspace → Tool.
- Customer and Vehicle context must stay visible together on all service-related screens.
- Customer Portal is a separate domain and not part of internal UI screens.

[DESIGN SYSTEM RULES]
- Token-only styling. No hardcoded HEX colors.
- Support dark mode and light mode.
- Use shadcn/ui as the base component system.
- Domain components may exist only under components/d365/*.
- Use micro-interactions with Framer Motion.
- Respect prefers-reduced-motion.

[RESPONSIVE RULES]
- Platform default = Tablet-first
- Technician UI = Mobile-first
- Desktop: 12 columns
- Tablet: 8 columns
- Mobile: 4 columns
- Use 8px spacing system
- Touch target >= 48px
- Primary CTA >= 56px

[GLOBAL UX PATTERNS]
- Include Global Command Palette integration
- Include Persistent Context Panel where applicable
- Include Work Tabs where multi-record work is likely
- Include loading / empty / error / disabled states
- Include role-specific Next Best Action

[SEARCH RULES]
- 3+ characters triggers auto-search
- Search supports RO / VIN / Customer / Appointment / Deal
- Search supports keyboard, voice, image, and AI intent search

[ACCESSIBILITY]
- WCAG AA
- keyboard navigation
- visible focus states
- no color-only meaning

[SCREEN]
Design Dealer365 Dashboard as a role-adaptive queue-first landing screen.

[GOAL]
The dashboard must be the first screen after login and must prioritize current work, not abstract analytics.

[ROLE VARIATIONS]
Technician:
- Primary section: Assigned Jobs Queue
- Secondary: Today summary count only
- No heavy KPI widgets

Service Advisor:
- Primary section: Today's Appointments Queue
- Secondary: Waiting Approval / Check-in needed / Delayed summary

Dispatcher:
- Primary section: Dispatch Board snapshot or direct board
- Secondary: Unassigned / Waiting Parts / Blocked summary

Sales Consultant:
- Primary section: Today's Consultations Queue
- Secondary: upcoming test drives / leads needing follow-up

Manager:
- Primary section: Operations Overview
- Secondary: service bottlenecks / sales summary / blockers

[LAYOUT]
- Tablet-first
- Header with search / role switcher / notifications
- Left navigation
- Main workspace with queue cards or compact list
- Optional right summary rail only for manager

[COMPONENTS]
- Queue cards or compact list rows
- Status chips
- Next Best Action button
- Empty state
- Skeletons
- Search bar

[INTERACTIONS]
- Row/card hover
- Press feedback
- Quick open to workspace
- Keyboard support for queue navigation

[OUTPUT FILE]
app/dashboard/page.tsx

[SCREEN]
Design Service Workbench as the primary operational workspace for IDSS.

[GOAL]
This is the core service workspace. It must support service queues, work status, blockers, and smooth transition into RO workspaces.

[PRIMARY VIEWS]
- Assigned Jobs
- Unassigned Queue
- Waiting Approval
- Waiting Parts
- Delayed

[IMPORTANT RULE]
Do not create separate screens per role. Use the same workbench and adapt sections/filters/default views by role.

[ROLE VARIATIONS]
Technician:
- default = Assigned Jobs
- mobile-first
- simplified layout
- minimal extra panels

Service Advisor:
- default = waiting approvals / today service queue
- stronger customer communication actions

Dispatcher:
- stronger unassigned and blocked visibility
- shortcut to dispatch board

Manager:
- queue health summary and blockers

[LAYOUT]
- Tablet-first except technician
- Main queue area
- Optional context drawer
- Work Tabs available for open RO work

[COMPONENTS]
- queue list
- segmented view tabs
- search
- chips
- quick action buttons
- open-in-workspace CTA

[OUTPUT FILE]
app/service/workbench/page.tsx
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
Design RO Detail as a reusable role-adaptive workspace screen.

[GOAL]
This screen must be the central workspace for a repair order, used by technicians, advisors, dispatchers, and managers with role-configured sections.

[NON-NEGOTIABLE]
Always show Customer + Vehicle context together.
Include Activity Timeline.
Use Work Tabs support.

[ROLE VARIATIONS]
Technician:
- repair tasks
- DVI / MPI shortcut
- parts
- final inspection shortcut

Service Advisor:
- customer communication
- VHC approval status
- invoice / payment prep
- walkaround summary

Manager:
- workflow status
- blocker flags
- timeline
- KPI snippets

[SECTIONS]
- Header with RO identity + status + Next Best Action
- Context panel
- Main detail tabs
- Timeline
- Related tools

[TABS EXAMPLE]
- Overview
- Tasks
- Inspection
- Parts
- Communication
- Timeline
- Billing

[OUTPUT FILE]
app/service/ro/[id]/page.tsx
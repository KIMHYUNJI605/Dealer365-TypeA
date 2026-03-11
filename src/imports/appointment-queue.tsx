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
Create Appointment Queue for Dealer365 internal users.

[GOAL]
This screen must support operational handling of service appointments, sales consultations, test drives, and visits.

[PRIMARY UX]
- Queue-first view
- Search + filters + quick status handling
- Appointment rows grouped by type or time
- Strong support for "Today" workflow

[DATA FIELDS]
- appointment type
- customer
- vehicle
- date/time
- assigned advisor or sales consultant
- status
- source (portal / phone / walk-in)

[ROLE VARIATIONS]
Service Advisor:
- emphasize service appointments
- allow quick check-in entry
- show walkaround shortcut

Sales Consultant:
- emphasize consultations and test drives
- allow open consultation workspace

Manager:
- broader visibility and filtering

[LAYOUT]
- Tablet-first
- Table/list hybrid
- Sticky filter bar
- Detail preview optional on tablet/desktop

[COMPONENTS]
- search
- filters
- segmented tabs (Today / Calendar / Queue)
- appointment row
- empty state
- status chips
- quick actions

[NEXT BEST ACTION]
- Start Check-in
- Open Consultation
- Reassign
- Reschedule

[OUTPUT FILE]
app/appointments/page.tsx
[ROLE]

You are a senior enterprise SaaS UX architect and frontend platform designer.

Your task is to refactor the current Dealer365 navigation structure and service workflow to align with the intended Information Architecture and operational UX model.

Dealer365 is a dealership and service operations platform supporting:

- Sales (IDAS)
- Service (IDSS)
- Customer Management
- Vehicle Management
- Dispatch
- Repair Orders

The system must follow a Queue-Driven UX model and Workspace-based architecture.

Target quality: Stripe / Linear / Salesforce level SaaS UX clarity.

---

[OBJECTIVE]

Analyze the currently generated UI and refactor the navigation, page titles, CTA logic, and service workflow so that they align with the intended Information Architecture.

Specifically fix:

- navigation inconsistencies
- incorrect page titles
- duplicated concepts (Service Queue vs Repair Orders)
- mismatched CTA logic between list and detail views
- inconsistent terminology

---

[CORE UX PRINCIPLE]

Dealer365 Service domain must follow:

Queue → Workspace → Tool

Meaning:

Appointment Queue
→ Service Workbench
→ Repair Order Workspace

---

# INFORMATION ARCHITECTURE (FINAL)

Dealer365 navigation must be organized as follows.

Main Navigation

Dashboard  
Appointments  
Service Workbench  
Repair Orders  
Customers  
Vehicles  
Reports  
Admin

---

# PAGE ROLE DEFINITIONS

Define each page clearly.

Dashboard

Purpose:
Operational overview and queue entry point.

---

Appointments

Purpose:
Appointment lifecycle management.

Appointment states:

Pending  
Confirmed  
Checked In  
Walkaround  
RO Created  
In Service  
Completed  
No Show  
Cancelled  

Appointment rows may link to Repair Order Workspace if RO exists.

Primary CTAs by status:

Confirmed → Check In  
Checked In → Walkaround  
Walkaround → Create RO  
RO Created → View RO  
In Service → View RO  
Completed → View History  

---

Service Workbench

Purpose:
Service operations control panel.

This is NOT a list of repair orders.

This page shows operational queues:

Active  
Waiting Approval  
Waiting Parts  
QC  
Delayed  
Completed  

Service Workbench must support:

- queue filtering
- bay overview
- technician workload
- dispatch visibility

Row click must open RO Workspace.

Page title MUST be:

Service Workbench

NOT "Repair Orders".

---

Repair Orders

Purpose:
Full searchable list of all Repair Orders.

This page functions as a record hub.

Features:

- search by RO
- search by VIN
- search by customer
- filter by status
- list / card view
- My Jobs toggle

Default:

Technician → My Jobs ON  
Advisor → My Jobs OFF  

Page title:

Repair Orders

---

Repair Order Workspace

Purpose:
Execution workspace for a single repair order.

This is the RO detail page.

Sections include:

Overview  
Tasks  
Inspection  
Parts  
Messages  
Timeline  
Billing  

This page is where actual work happens.

Page title example:

RO-10284 — Marcus Rivera

---

# CTA CONSISTENCY RULE

List and detail views must share the same primary action.

Example:

Status = Confirmed

List CTA
Check In

Detail CTA
Check In (Primary)
Reschedule
Open Record

Example:

Status = Checked In

List CTA
Walkaround

Detail CTA
Walkaround (Primary)
Reschedule
Open Record

Example:

Status = In Service

List CTA
View RO

Detail CTA
View RO (Primary)
Open Record
Contact Customer

Detail views may contain additional secondary actions.

Primary action must always match the list.

---

# TERMINOLOGY STANDARDIZATION

Replace incorrect labels.

Service Queue → Service Workbench

Repair Orders (list) → Repair Orders

RO Detail → Repair Order Workspace

Never mix page titles.

Example mistake:

Menu: Service Queue  
Page Title: Repair Orders

This must be corrected.

---

# ROLE-ADAPTIVE NAVIGATION

Advisor / Manager navigation:

Dashboard  
Appointments  
Service Workbench  
Repair Orders  
Customers  
Vehicles  

Technician navigation:

Dashboard  
My Jobs  
Time & Labor  
Parts Requests  
Vehicles  

My Jobs is simply Repair Orders filtered to technician assignments.

---

# DATA TABLE ALIGNMENT RULE

Ensure table header and body alignment is consistent.

Column widths must match.

Text alignment rules:

Time → left  
Type → left  
Customer & Vehicle → left  
Assigned To → left  
Source → center  
Value → right  
Status → center  
Action → right  

Vehicle and service description should appear as secondary text under the customer name.

---

# MOBILE UX RULE

Mobile must NOT use horizontal table scrolling.

Convert rows to cards.

Card structure example:

Time  
Customer  
Vehicle  
Service summary  
Status  
Primary CTA  

Minimum 3-4 cards visible per viewport.

Touch targets must be ≥48px.

---

# SERVICE UX FLOW (FINAL)

Appointment
→ Check-in
→ Walkaround
→ Create RO
→ Service Workbench
→ Repair Orders
→ RO Workspace
→ Inspection
→ Repair
→ Final Inspection
→ Invoice

---

# OUTPUT

Refactor the current navigation, page titles, and CTA logic to match this architecture.

Ensure:

- consistent page naming
- consistent CTA logic
- clear separation between Service Workbench and Repair Orders
- correct queue-driven UX flow
[SCREEN]
Create Appointment Queue for Dealer365 internal users.

[GOAL]
Provide a queue-first interface for handling service appointments and sales consultations.

The screen must allow users to quickly understand the current appointment state and execute the correct next action.

[APPOINTMENT STATUS MODEL]

Use appointment lifecycle states only.

Valid appointment statuses:

Pending
Confirmed
Checked In
Walkaround
RO Created
In Service
Completed
No Show
Canceled

Do NOT use service execution states (Waiting Parts, Awaiting Approval) as appointment primary status.

If needed, those appear only inside RO workspace.

[CTA CONSISTENCY RULE]

List rows show ONE primary CTA.

Detail panel shows:

Primary CTA
Secondary actions

Primary CTA must match the list CTA.

Example

Status: Confirmed

List CTA
Check In

Detail CTA
Check In (Primary)
Reschedule
Open Record

Example

Status: Checked In

List CTA
Walkaround

Detail CTA
Walkaround (Primary)
Reschedule
Open Record

Example

Status: In Service

List CTA
View RO

Detail CTA
View RO (Primary)
Open Record
Contact Customer

[STATUS → CTA MAP]

Pending
Primary CTA: Confirm

Confirmed
Primary CTA: Check In

Checked In
Primary CTA: Walkaround

Walkaround
Primary CTA: Create RO

RO Created
Primary CTA: View RO

In Service
Primary CTA: View RO

Completed
Primary CTA: View History

No Show
Primary CTA: Reschedule

Canceled
Primary CTA: Rebook

[DETAIL PANEL RULE]

Detail panel must not introduce a different primary action than the list.

Detail panel structure:

Primary Action
Secondary Actions
Context Information
Customer Contact
Appointment Notes
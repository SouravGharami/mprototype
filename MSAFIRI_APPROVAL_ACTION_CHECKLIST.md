# Msafiri — Approval Action Checklist

Prototype only; synthetic data; all government, PMS, scan/OCR, webhook, sandbox, notification and export behaviour is **simulated**. Documentation only — no application code, data, schema, permission, workflow or integration changed. **No requirement or decision below is approved; no stakeholder response exists.** Not production-ready; no compliance claim.

**Detail lives elsewhere (not repeated here):** full register `STAGE_8_8_DECISION_REGISTER.md`; fill-in response blocks `STAGE_8_9_STAKEHOLDER_APPROVAL_PACKAGE.md`; evidence trail `STAGE_8_8_REQUIREMENTS_BASELINE_REPORT.md`, `STAGE8_4_CLOSURE_REPORT.md`. Item wording below is copied from the register unchanged.

## 1. Confirmed facts / provisional assumptions / proposed next steps
**Confirmed facts (checked against files or run results)**
- The approved URS v2.0 and any signed extract are absent from the project, the uploads folder and the workspace (searched in Stages 8.8, the post-8.8 verification and 8.10; the 8.10 intake found no new file).
- No project file records an approved roadmap, an approver, or any approved decision. All 33 response blocks in the Stage 8.9 package are blank.
- Register status: 33 items — 19 `OPEN — BLOCKED (SOURCE REQUIRED)`, 14 `OPEN — DECISION REQUIRED`, 0 approved.
- Application code is byte-identical to the Stage 8.7 build; 14 suites passed with 0 failures against it (post-8.7 audit). Stages 8.8–8.10 changed no code.
- Stage 8.10 produced no report file; its finding (no new evidence, implementation not resumable) is recorded in this checklist and in the chat reply only.

**Provisional assumptions (not approved)**
- All `MSF-FR-nnn` / `MSF-NFR-nnn` IDs come from the reconstructed `MSAFIRI-URS-PROVISIONAL-2.0` (not in the package).
- Every "current state" the prototype shows (fields, validation limits, lifecycle, roles, scripted submission outcomes) is what was built, not what was required — including Stage 8.7's choices (register A1).

**Proposed next steps (suggestions only)**
- Send the request in §6 to the authorised stakeholder; the requester names "Joy Sir" (role and authority not documented — B3).
- Resume implementation only after §2 items B1–B3 are answered and the relevant §3–§5 decisions are recorded; scope work strictly from what is approved. No further stage is proposed or assumed.

## 2. Baseline blockers (answer these first)

| ID | Question (register wording) | Evidence / answer needed | Who provides | Work blocked until answered |
|---|---|---|---|---|
| **B1** | Provide the approved URS v2.0 (or a signed extract with requirement IDs and version). | The approved document itself, with version, date and approval record. | Not recorded in project files | No requirement can be traced or verified; every conformance statement stays impossible. |
| **B2** | Is there an approved roadmap / stage plan / acceptance criteria for Stages 8.x and beyond? If so, supply it. | The approved stage plan with acceptance criteria per stage. | Not recorded in project files | Next stage cannot be identified as approved; scope keeps being self-set. |
| **B3** | Who is the authorised stakeholder for requirement and scope decisions, and what is their approval route? | A named approver and role, recorded by the project owner. | Not recorded in project files | Decisions cannot be attributed or accepted as approved. |
| **B4** | Status of the reconstructed `MSAFIRI-URS-PROVISIONAL-2.0` (v2.0-P, 21 Oct 2026): accept, replace or discard as a working baseline? | A recorded decision by the authorised stakeholder; the .docx itself is not in the project package. | Not recorded in project files | Provisional IDs risk being mistaken for approved ones. |

## 3. Requirement decisions T1–T17 (all depend on B1)

| ID | Question (register wording) | Evidence / answer needed | Who provides | Work blocked until answered |
|---|---|---|---|---|
| **T1** | Which guest-registration fields are mandatory? | URS field list with required/optional flags. | Not recorded in project files | Fields may be missing or wrongly mandatory for real reporting. |
| **T2** | Which hotel/establishment fields are mandatory? | URS establishment field list. | Not recorded in project files | Establishment data may not meet reporting needs. |
| **T3** | Are the document-number, DOB and date rules correct? | URS validation rules. | Not recorded in project files | Valid guests may be rejected or invalid ones accepted. |
| **T4** | DOB plausibility limits and the accepted document-type list? | URS rule and approved document-type reference list. | Not recorded in project files | Implausible data accepted; unsupported document types offered. |
| **T5** | What is a duplicate guest (key fields, time window) and is it blocked or warned? (Stage 7.1 item L1.) | Definition of duplicate and the required behaviour. | Not recorded in project files | Duplicate registrations and double reporting remain possible. |
| **T6** | Is authentication required (prototype / pilot / production), and which identity provider, sessions, MFA? | Authentication requirement and identity-provider decision. | Not recorded in project files | No real user identity; blocks any non-demo use. |
| **T7** | What is the approved role and permission matrix? | Approved roles and permissions. | Not recorded in project files | Roles may not match the organisation; permissions unverified. |
| **T8** | Where must authorisation be enforced, and is front-end enforcement acceptable? | Architecture/security decision. | Not recorded in project files | Access control is demonstration-grade only. |
| **T9** | Must the hotel portal isolate data between several establishments? | In/out-of-scope decision; if in scope, a multi-establishment model. | Not recorded in project files | Cross-establishment data exposure cannot be assessed. |
| **T10** | Official stay lifecycle and transition rules? | Documented states and transitions. | Not recorded in project files | Transitions may differ from the official process. |
| **T11** | Submission, acknowledgement, rejection and offline-queue rules? | Reporting workflow specification. | Not recorded in project files | Simulated flow may not reflect the real reporting process. |
| **T12** | Required audited events? | Required audit event list. | Not recorded in project files | Audit coverage may be incomplete or excessive. |
| **T13** | Audit-log immutability, retention and export requirements? | Tamper-resistance, retention and export requirement. | Not recorded in project files | Audit trail cannot be relied on as evidence. |
| **T14** | Masking/unmasking rules and permitted purposes? | Masking and purpose rules. | Not recorded in project files | Sensitive data protection unverified. |
| **T15** | Access restrictions for government search, audit and reports? | Access rules per role. | Not recorded in project files | Government-side access unverified. |
| **T16** | Report categories, formats, thresholds and deadlines? | Reporting schema and obligations. | Not recorded in project files | No real reporting can be specified or built. |
| **T17** | Retention, residency, encryption and backup requirements? | Data-handling requirements. | Not recorded in project files | No lawful data-handling position. |

## 4. Placeholder pages P1–P6 — authorised direction needed

| ID | Question (register wording) | Evidence / answer needed | Who provides | Work blocked until answered |
|---|---|---|---|---|
| **P1** | Hotel › Check-in page: build, merge into Guest Registration, or remove? | Scope decision. | Not recorded in project files | Menu item with no function; possible duplicate of existing flow. |
| **P2** | Hotel › In-House Guests page: required, and with what content? | Scope decision. | Not recorded in project files | No dedicated in-house view. |
| **P3** | Hotel › Check-out, Amend & Cancel page: separate page or keep the record dialog? | Scope decision. | Not recorded in project files | Menu item with no function. |
| **P4** | Hotel › PMS Connection & Manual Fallback page: required, and what PMS/interface? | Scope decision and PMS interface requirement. | Not recorded in project files | PMS behaviour unspecified; no real connector. |
| **P5** | Hotel › Compliance & Reports page: required, and what reports? | Scope decision (depends on T16). | Not recorded in project files | Hotel-side reporting unspecified. |
| **P6** | Admin › Connector Status page: required, and for which connectors? | Scope decision. | Not recorded in project files | Menu item with no function. |

Exact navigation names: Hotel Portal — **Check-in**, **In-House Guests**, **Check-out, Amend & Cancel**, **PMS Connection & Manual Fallback**, **Compliance & Reports**; Admin Portal — **Connector Status** (in the order of P1–P6). Each shows a "Soon" tag today. Choose per page: build / merge into an existing page / remove / defer.

## 5. Other open items and Stage 8.7 assumption

| ID | Question (register wording) | Evidence / answer needed | Who provides | Work blocked until answered |
|---|---|---|---|---|
| **X1** | Unknown-id fallbacks across routes (Stage 7.1 L4). | Required behaviour. | Not recorded in project files | Inconsistent handling of bad links. |
| **X2** | Should Reporting Alerts "mark all" also clear static bell items? (L5) | Design decision. | Not recorded in project files | Bell count may look inconsistent. |
| **X3** | "Test connection" on a disabled integration (L8). | Intended behaviour. | Not recorded in project files | Possible confusing feedback. |
| **X4** | Unsaved registration form on navigation: keep, warn or discard? | UX decision. | Not recorded in project files | Data-entry loss. |
| **X5** | Should any seeded role hold the export permission (`reports:create`)? | Role decision (depends on T7, T16). | Not recorded in project files | Simulated export unusable without admin grant. |
| **A1** | Confirm or change Stage 8.7's technical choices: two-part name required; name ≤80 / room ≤20 characters; cancel reason 1–200 characters; retry only from Rejected. | Approval or replacement values (relates to T1, T3, T10, T11). | Not recorded in project files | Choices could conflict with real rules (e.g., single-name guests). |

## 5b. Additional gaps explicitly recorded in earlier reports (not decisions)
- The original Stage 1–5B test scripts were never supplied (README, Stage 6.x notes); Journeys 1–3 in `tests/journeys_1_3.py` are reconstructions because the originals were not supplied (Stage 8.3 report). Supply them if regression against the original journeys is required.
- The provisional URS `.docx` is not in the project package (Stage 8.4 addendum) — see B4.
- Never tested, as recorded: other browsers, screen readers, keyboard-only walkthrough, accessibility conformance; no lint or build tooling exists (Stages 8.3–8.7). Needs a testing-scope decision if required — not blocked by the URS alone.
- Production gaps (no backend, real authentication, server-side authorisation, tamper-resistant audit, persistence, retention/encryption, real integrations) are covered by T6–T9, T13, T17 and are out of scope of the prototype until decided.

## 6. Message template (draft — nothing has been agreed)
> **Subject:** Msafiri prototype — documents and decisions needed to continue
>
> Dear Joy Sir,
>
> The Msafiri prototype is paused because implementation must follow approved requirements, and none are available to the project team. Could you please send, or confirm who can send:
> 1. The approved URS v2.0 (with version, date and approval record), or a signed extract with requirement IDs.
> 2. Any approved stage plan or acceptance criteria.
> 3. The name and role of the person authorised to approve requirements and scope.
>
> We also attach `STAGE_8_9_STAKEHOLDER_APPROVAL_PACKAGE.md`, which lists 33 open decisions (including the six placeholder pages). For each, please tick Approved / Rejected / Deferred / Needs Clarification, add comments, your name, role and date. Until we receive these, no feature work will be done.
>
> Thank you,
> [sender]

*Checklist status: every item above is open.*

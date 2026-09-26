# Record checks and their sources

Checked 26 September 2026. These checks flag missing or inconsistent records. They do not certify legal compliance, file tax returns or calculate filing deadlines. The partner confirms jurisdiction, service scope, due dates, evidence and retention. This system manages practice work; it is not a tax, payroll or payment engine.

| Rule | What is checked | Source and boundary |
|---|---|---|
| AU-RECORD | Completed AU work needs a recorded outcome and evidence reference | [TPB, Obligation to keep proper client records](https://www.tpb.gov.au/obligation-keep-proper-client-records), section 30 of the Code Determination. The CLI requires these fields on completion. A reference alone does not prove the underlying records meet every obligation. |
| AU-RETENTION | Retain-until must reach five years after service completion | [TPB record guidance](https://www.tpb.gov.au/tpb-gs-52-2024-obligation-keep-proper-client-records-tax-agent-services-provided). Record a longer period where the engagement or another obligation requires it. No automatic deletion exists. |
| NZ-RETENTION | Completed NZ work must have a practitioner-confirmed retention date, with a seven-year-from-completion minimum | [IRD record keeping](https://www.ird.govt.nz/managing-my-tax/record-keeping) says at least seven tax years. The software floor is a practice policy, not a substitute for counting tax years. Use the relevant tax-year end and any extension when setting the date. |
| PRACTICE-ENGAGEMENT | Signed engagement date missing | Practice policy: confirm scope before completing work. Not presented as a universal statutory signature requirement. |
| PRACTICE-DATE | Open work lacks a deadline or its source | Practice policy: use each client's confirmed agent or agreed date, never a universal guessed tax date. |
| PRACTICE-REVIEW | Review-by date passed while waiting for review | Practice policy: clear the review queue before the filing deadline. |
| IMPORT-SCOPE | Client jurisdiction remains UNKNOWN | Import control: confirm AU or NZ before applying a retention rule. |

Store workpaper references, not tax identifiers or document contents. The importer allowlists columns and reports ignored ones; it does not preserve arbitrary tax-identifier columns. Free-text notes are still the operator's responsibility. The local version relies on device access controls. Shared installations need database roles, restricted network access, backups, an evidence store and a documented retention procedure. The free version has no application-level per-client permissions or immutable audit store. TLS certificate checking stays on for hosted databases.

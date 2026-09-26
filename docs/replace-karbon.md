# Replace Karbon in a day

Start with one client group, compare counts and deadlines, then move the rest. Keep your original exports and a live-database backup. No export includes everything by default.

## Export from Karbon

1. As an administrator, open Contacts and use the Export/Import icon. Download the contact update file. Karbon documents Colleagues, Organizations and People tabs. A full contact export can be requested from support. [Karbon: Bulk Update your Contacts](https://help.karbonhq.com/en/articles/6143054-bulk-update-your-contacts).
2. Export the work view you intend to move. Karbon supports Excel exports for contacts and work. Check the selected view includes the intended completed and active jobs. [Karbon: contact and work exports](https://karbonhq.com/release-notes/november-5-2017/).
3. Keep XLSX or save the selected sheet as UTF-8 CSV. Dates in CSV must be YYYY-MM-DD. Actual spreadsheet date cells work directly. Exports vary by view and account. The import reports unknown columns and rejects unknown statuses, unmatched staff, unmatched clients and ambiguous names. It never guesses regional dates.

## Import

Create staff first with `add staff`, matching Karbon's owner and assignee names. Use a clean database (`DATA_DIR` set to a new directory, `npm run migrate`) for real records. Do not mix the demo with client records.

```bash
npm run practice -- import karbon Contacts.xlsx --kind=clients --sheet=Organizations --jurisdiction=NZ
npm run practice -- import karbon Contacts.xlsx --kind=clients --sheet=Organizations --jurisdiction=NZ --apply
npm run practice -- import karbon Work.xlsx --kind=jobs --currency=NZD
npm run practice -- import karbon Work.xlsx --kind=jobs --currency=NZD --apply
```

Without `--apply`, all rows are validated inside a transaction which is rolled back. Applying is atomic: any bad row rolls back the whole file. Separate mixed-jurisdiction client files before applying. Choose the sheet explicitly in multi-sheet workbooks. Source keys are prefixed by record type; repeat imports skip existing keys, never overwrite live changes. A file with no source keys falls back to a stable name hash and reports that choice. Supply stable keys when names repeat. Same-name client entities are never merged automatically when they have different keys.

## Field map

| Kind | Accepted Karbon headings | Destination |
|---|---|---|
| Clients | Contact Key / Contact ID / Key / Client Identifier | source identity |
| Clients | Name / Organization Name / Organisation Name / Full Name, or First Name + Last Name | client name |
| Clients | Email / Email Address / Primary Email Address, Client Group / Group | contact email and family group |
| Clients | Client Owner / Client Manager | existing staff name |
| Work | Work Key / Work ID / Key, Work Title / Title / Work Name / Name | source identity and job name |
| Work | Client / Client Name / Contact / Contact Name | existing client name or UUID prefix |
| Work | Assignee / Assigned To / Work Assignee | existing staff name |
| Work | Status / Work Status, Due Date / Due, Work Type / Type, Budget Hours / Budgeted Hours, Period / Accounting Period | job status, date, type, hour budget and period |

The help pages verify the export path, not every account's column layout. Review this map against your file first. Custom headings and statuses need explicit mapping. Complete/Completed imports as review because an exported status does not supply reviewer, outcome, evidence or retention. Ready, Planned, Ready to Start and Not Started map to ready. In Progress maps to in_progress. Waiting for Client maps to waiting. In Review maps to review. Cancelled stays cancelled. Unknown statuses fail with the row number. Fee defaults to zero: record agreed fees after import; a zero is not proof of a free engagement.

## What needs a separate pass

Tasks, attachments, original email bodies, portal access, permissions, automation rules, recurring schedules, time history, budgets by staff and historical invoices are not reconstructed by a contact/work export. Preserve those exports and files. Enterprise DNA maps them as part of migration, or ask your coding agent to add and test the exact mapping. For a manually mapped mail index, `--kind=emails` accepts Message ID, Subject, Job, Received Date and Owner. This is a local index, not Karbon email extraction or a live connection.

Reconcile `clients`, `jobs`, `deadlines`, `budgets` and `compliance` against Karbon. Confirm every source date and add signed engagements. Finish with `npm run practice -- export --out=after-import.json`. Use `/customise` for your job statuses and extra fields.

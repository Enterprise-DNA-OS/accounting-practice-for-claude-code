# CLI reference

Run `npm run practice -- <command>`. Flags use `--name=value`. Quote values containing spaces. All commands accept `--json`. Name matching is case-insensitive: exact name first, then partial name or UUID prefix. Ambiguous matches list candidates and exit 1. Dates use YYYY-MM-DD. Amounts are decimal currency units, time is hours. Currency totals never mix AUD and NZD.

## Read

`clients`, `jobs`, `deadlines` (next sixty days, overdue and missing dates), `attention`, `client-chase`, `review-queue`, `workload`, `wip`, `budgets`, `tasks`, `timesheets`, `triage`, `recurring`, `groups`, `activity`, `audit`, `compliance`, `weekly-review`, `client <name>`, `job <name>`, `help`.

Workload counts remaining budget hours on open jobs due in the next seven days, including overdue jobs. This is a capacity estimate, not a calendar or a prediction. Over-budget jobs have zero remaining budget; inspect attention before reassigning. The fee less time value figure is not accounting profit: rates are charge-out rates, not staff costs. WIP excludes non-billable and already invoiced entries. Missing dates remain visible. Email triage reads imported subjects and owners, not a live inbox.

## Write

```bash
npm run practice -- add staff --name="Jo Smith" --role=Accountant --hours=32
npm run practice -- add client --name="Sample Ltd" --email=owner@example.com --jurisdiction=NZ --group=Sample
npm run practice -- set client "Sample Ltd" --engagement=2026-09-01
npm run practice -- add job --name="Sample year end" --client="Sample Ltd" --owner="Jo Smith" --due=2026-10-31 --source="Client-specific date confirmed by partner" --budget=12 --fee=2400 --currency=NZD --type="Annual accounts"
npm run practice -- set job "Sample year end" --review-due=2026-10-25 --budget=14
npm run practice -- add task --job="Sample year end" --name="Review workpapers" --due=2026-10-25
npm run practice -- add request --job="Sample year end" --name="Bank statements" --due=2026-10-10
npm run practice -- log "Sample year end" --kind=call --actor="Jo Smith" --text="Client confirmed records will arrive Friday"
npm run practice -- time "Sample year end" --staff="Jo Smith" --hours=2.5 --rate=180 --note="Prepared workpapers"
npm run practice -- task-done "Review workpapers"
npm run practice -- request-received "Bank statements"
npm run practice -- assign "Sample year end" --owner="Mia Chen"
npm run practice -- status "Sample year end" review
npm run practice -- complete "Sample year end" --reviewer="Mia Chen" --date=2026-09-26 --retain=2034-03-31 --outcome="Accounts reviewed and delivered" --evidence="secure-drive/workpapers/sample"
npm run practice -- mark-billed "Sample year end" --invoice=INV-100
npm run practice -- roll-forward "Koru monthly books" --period=2026-10 --currency=NZD
npm run practice -- email-resolve "Stock count still outstanding"
npm run practice -- draft-chase "Harbour annual accounts"
npm run practice -- export --out=practice-backup.json
```

`set client` permits engagement, jurisdiction, email, group. `set job` permits due, source, review-due, budget, fee, retain. Completion requires a signed engagement, resolved tasks and requests, reviewer, outcome, evidence reference and a retention date. AU requires at least five years from service completion. NZ uses a conservative seven-year-from-completion floor; confirm the end of the relevant tax year and any extensions before setting a date. These are record controls, not evidence that a return was filed.

`roll-forward` creates one next occurrence and advances its schedule by the configured number of months. Each run deliberately advances one more period. Scheduled dates are planning dates until confirmed. New recurring schedules are added with `/customise`, with a migration or parameterised insert reviewed by the operator. `mark-billed` records an existing invoice reference; it creates no invoice and takes no payment. Drafts never update last_chased because drafting is not sending. `time` accepts `--date` and `--non-billable`. An audit row records each successful write. No deletion or send command exists.

## Import and export

See [replace-karbon.md](replace-karbon.md). Export creates a new JSON file containing all ten domain tables. It refuses to overwrite an existing file. It is a portable snapshot; restoring it requires mapping the records or a database backup restore. Back up the live database separately.

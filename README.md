# Accounting Practice for Claude Code

Your clients, deadlines, missing records, review queue and unbilled time in a database you own. Free MIT-licensed software from Enterprise DNA. Runs with Claude Code, Codex, OpenCode or Cursor.

| Do it yourself | We customise it | We run it for you |
|---|---|---|
| Free. Clone, run the demo, import and own it. | Your fields, rules, Karbon records, web front end or different stack. | Installed, connected and operated through Omni by Enterprise DNA. Setup fee, then a retainer. |
| [Quick start](#quick-start) | [Get your version built](https://enterprisedna.co/omni/book/?offer=replace-software&utm_source=github&utm_campaign=karbon&utm_medium=customise) | [Book a call](https://enterprisedna.co/omni/book/?offer=replace-software&utm_source=github&utm_campaign=karbon&utm_medium=managed) |

## What it does

An accounting practice runs on a weekly rhythm: chase missing records, prepare work, clear partner review, meet the confirmed client date and bill the time. This replaces that operating record with Postgres and plain-language recipes. It does not calculate tax, file returns, take payments or send email.

The demo includes overdue Harbour annual accounts waiting for stock records, a trust missing a signed engagement, a Banksia BAS stuck in review, unassigned year-end work with no date and thirty-day-old unbilled time. All clients are fictional. Demo dates move with the day you seed; they are not statutory deadlines.

## Quick start

Node 20 or later, on Windows or Linux:

```bash
git clone https://github.com/Enterprise-DNA-OS/accounting-practice-for-claude-code.git
cd accounting-practice-for-claude-code
npm install
npm run demo
npm test
```

No database server required. PGlite stores the demo in `.data/db`. Open the folder in your coding agent and ask `/attention` or “Which jobs are overdue and what is missing?” Codex, OpenCode and Cursor follow AGENTS.md and the same recipes in `.claude/commands/`.

For shared Postgres, set DATABASE_URL using `.env.example`, then run `npm run migrate`. TLS verification is enabled for hosted databases. Set DATA_DIR to a fresh directory for real local data, migrate it, and import before adding real work. Demo seeding is idempotent and does not reset existing records. Never seed a live practice database.

## The commands

| Command | Purpose |
|---|---|
| `/clients` | Clients. See the exact arguments in the CLI guide. |
| `/jobs` | Jobs. See the exact arguments in the CLI guide. |
| `/deadlines` | Deadlines. See the exact arguments in the CLI guide. |
| `/attention` | Attention. See the exact arguments in the CLI guide. |
| `/client-chase` | Client chase. See the exact arguments in the CLI guide. |
| `/review-queue` | Review queue. See the exact arguments in the CLI guide. |
| `/workload` | Workload. See the exact arguments in the CLI guide. |
| `/wip` | Wip. See the exact arguments in the CLI guide. |
| `/budgets` | Budgets. See the exact arguments in the CLI guide. |
| `/tasks` | Tasks. See the exact arguments in the CLI guide. |
| `/timesheets` | Timesheets. See the exact arguments in the CLI guide. |
| `/triage` | Triage. See the exact arguments in the CLI guide. |
| `/recurring` | Recurring. See the exact arguments in the CLI guide. |
| `/groups` | Groups. See the exact arguments in the CLI guide. |
| `/activity` | Activity. See the exact arguments in the CLI guide. |
| `/audit` | Audit. See the exact arguments in the CLI guide. |
| `/compliance` | Compliance. See the exact arguments in the CLI guide. |
| `/weekly-review` | Weekly review. See the exact arguments in the CLI guide. |
| `/client` | Client. See the exact arguments in the CLI guide. |
| `/job` | Job. See the exact arguments in the CLI guide. |
| `/add` | Add. See the exact arguments in the CLI guide. |
| `/set` | Set. See the exact arguments in the CLI guide. |
| `/log` | Log. See the exact arguments in the CLI guide. |
| `/time` | Time. See the exact arguments in the CLI guide. |
| `/task-done` | Task done. See the exact arguments in the CLI guide. |
| `/request-received` | Request received. See the exact arguments in the CLI guide. |
| `/email-resolve` | Email resolve. See the exact arguments in the CLI guide. |
| `/assign` | Assign. See the exact arguments in the CLI guide. |
| `/status` | Status. See the exact arguments in the CLI guide. |
| `/complete` | Complete. See the exact arguments in the CLI guide. |
| `/roll-forward` | Roll forward. See the exact arguments in the CLI guide. |
| `/mark-billed` | Mark billed. See the exact arguments in the CLI guide. |
| `/draft-chase` | Draft chase. See the exact arguments in the CLI guide. |
| `/import` | Import. See the exact arguments in the CLI guide. |
| `/export` | Export. See the exact arguments in the CLI guide. |
| `/customise` | Add a field, rename a stage or change a rule with a tested migration. |
| `/new-view` | Add a read-only dashboard answering your question. |

[CLI reference](docs/cli.md) lists every argument and calculation. Default output is a human table; use `--json` for analysis. Partial IDs and case-insensitive names work. Ambiguous names list candidates and exit 1. Every successful record write adds an audit entry.

## Your documents and views

`npm run docs` produces branded client status reports, records-request letters and service-completion records under docs-out/. These are drafts for review. `npm run view` renders the practice week and fees dashboards under views/. Change business name, colours and logo in brand.json. Logo paths can be absolute or data URLs. Documents use stable IDs as filenames, so same-name entities do not overwrite one another. No email is sent.

## Record checks

`/compliance` checks seven record conditions. AU completion records use the TPB five-year minimum from completed service. NZ records use a seven-year floor and require the practitioner to confirm the relevant tax-year end. Engagement, source-date and review checks are labelled practice policy. [Every rule and source](docs/compliance.md) is explicit. A clean result means these fields passed these checks, not that the practice is legally compliant.

## Ten questions to ask beyond a fixed dashboard

These combine the practice's own records. Each is answered by a shipped command today. No claim is made that Karbon cannot provide a similar report or custom analysis.

1. Which overdue jobs are also waiting for client records, and who owns them? `/attention`
2. Which family groups have the most unfinished records and unbilled time? `/groups`
3. Which jobs have used more time value than the agreed fee? `/budgets`
4. How much unbilled work is over thirty days old, in each currency? `/wip`
5. Who has more remaining work due this week than their weekly capacity? `/workload`
6. Which partner reviews are late while a client deadline approaches? `/review-queue`
7. Which missing records have not been chased since last week? `/client-chase`
8. Which imported email subjects are still unresolved against overdue work? `/triage`
9. Which open jobs have no deadline, no owner or no recent activity? `/attention`
10. Which completed services have missing evidence or short retention dates? `/compliance`

## Your first hour: ten things to ask for

1. Put our practice name and colours on the reports.
2. Add our staff and their real weekly capacity.
3. Import one client group from Karbon and compare the counts.
4. Show every job with a missing deadline or owner.
5. Record the source of each confirmed lodgement date.
6. Draft a request for the oldest missing client records.
7. Add a review step to our annual accounts process.
8. Add our billing code as a new field and migrate it.
9. Show unbilled time by family group, with currencies separate.
10. Add a dashboard for the partner's Monday review.

## Instead of Karbon

[The migration guide](docs/replace-karbon.md) covers Karbon XLSX and CSV contact/work exports, supported headings, dry runs, repeat-import protection and the records requiring separate mapping. The importer defaults to a test run and reports ignored columns. It does not import arbitrary spreadsheet data or reconnect a mailbox.

## Why no front end

Read [what this gives and what a screen gives](docs/why-no-front-end.md). This base has read-only HTML snapshots, a local mail index and a shared database option. A mobile app, client portal, live inbox connection and individual user permissions require a scoped installation. Enterprise DNA builds those into the version your practice needs.

## Validation and operations

`npm test` migrates and seeds a temporary PGlite directory, exercises every CLI action and document/view renderer, checks the financial calculations, completion controls, ambiguous names, transactional imports and repeat imports, then removes the temporary data. No credentials or real practice data are used. Hosted Postgres uses the same SQL; configure its roles, backups and network access before sharing it. The local database is for one operator at a time. Export snapshots include client records and must be protected.

## Licence and relationship

MIT. Not affiliated with or endorsed by Karbon or Anthropic. Hosting and coding-agent usage have their own costs. [Omni by Enterprise DNA](https://enterprisedna.co/omni/instead-of/karbon) installs, customises and runs the practice system for you. [Book 30 minutes with Sam](https://enterprisedna.co/omni/book/?offer=replace-software&utm_source=github&utm_campaign=karbon&utm_medium=readme).

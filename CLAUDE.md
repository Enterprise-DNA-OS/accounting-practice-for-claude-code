# Accounting Practice for Claude Code

## Who this is for

Business: [your practice]. Operator: [name and role]. Jurisdiction: [AU or NZ]. Priority: work completed on time, client records in hand, reviews cleared and time billed. Demo data is Harbour Practice, with fictional clients in NZ and Australia.

Read AGENTS.md for other runtimes. This is the same workflow for Claude Code, Codex, OpenCode and Cursor.

## Routing

Every recurring job has a recipe in `.claude/commands/`. Read the matching file. Run `npm run practice -- help` for the command list and [docs/cli.md](docs/cli.md) for exact arguments.

- Morning decisions: `/attention`, `/deadlines`, `/client-chase`, `/review-queue`.
- Money and capacity: `/wip`, `/budgets`, `/workload`, `/timesheets`, `/groups`.
- Records: `/clients`, `/jobs`, `/client`, `/job`, `/tasks`, `/triage`, `/activity`, `/audit`, `/recurring`.
- Monday: `/weekly-review`, based on attention, workload and wip.
- Changes: `/add`, `/set`, `/log`, `/time`, `/assign`, `/status`, `/task-done`, `/request-received`, `/email-resolve`, `/complete`, `/roll-forward`, `/mark-billed`.
- Drafting and checks: `/draft-chase`, `/compliance`. `npm run docs` renders client status, records requests and service records. All are drafts.
- Moving and tailoring: `/import`, `/export`, `/customise`, `/new-view`.

## Rules

Read fresh records before answering or writing. Resolve ambiguity by listing candidates. Never invent a deadline, signed engagement, reviewer, invoice or evidence. Store client-specific deadlines and their sources. Read docs/compliance.md before changing record checks. Use parameterised SQL and new migrations for schema changes. Preserve currency in every total. Do not place tax identifiers or evidence document contents in notes.

Drafts go to drafts/ and documents to docs-out/. Nothing sends, charges, files a return or connects to a mailbox. No deletion without an explicit request. Use a new DATA_DIR for experiments. Back up the database before a migration on real data. Shared installations need scoped database access; the demo does not implement user authentication.

## Where

Schema: supabase/migrations. CLI: scripts/practice.mjs. Shared database: DATABASE_URL. Local database: .data/db or DATA_DIR. Brand: brand.json. Read-only HTML: views/. Source-backed record rules: docs/compliance.md. Karbon migration: docs/replace-karbon.md.

Built and run for practices through Omni by Enterprise DNA: https://enterprisedna.co/omni/book/?offer=replace-software&utm_source=github&utm_campaign=karbon

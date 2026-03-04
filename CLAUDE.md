# Project: relay-lab

CLI task manager (Node.js, ESM, zero external dependencies).

## Docs Index

| Topic | File | When to read |
|-------|------|-------------|
| Architecture & schema | `docs/ARCHITECTURE.md` | Before writing any code |
| Decision records | `docs/decisions/` | When you need "why" context |

## Rules

- Zero external dependencies — Node.js built-ins only
- Every change must have tests (`node --test`)
- Tests use subprocess with HOME override for isolation
- Conventional commits: `feat:`, `fix:`, `docs:`
- ESM modules (`import`/`export`, `"type": "module"`)

## HANDOFF Protocol

When working on an Issue:
1. Update Issue body status → 🟡 In Progress
2. Implement + test
3. Update Issue body → 🟢 Complete (fill Completed, Decisions Made, Gotchas, Next Session Start Here)

After completing an Issue, update project docs if needed:
- `docs/ARCHITECTURE.md` — new files, commands, schema fields
- `docs/decisions/NNN-topic.md` — new architectural decision (add index row below)
- Known Gotchas below — new pitfalls

## Key Decisions

| # | Topic | File |
|---|-------|------|
| 001 | Data format & ID generation | `docs/decisions/001-data-format.md` |
| 002 | No external dependencies | `docs/decisions/002-no-external-deps.md` |
| 003 | Test isolation via HOME override | `docs/decisions/003-test-isolation.md` |
| 004 | Presentation functions in cli.js | `docs/decisions/004-presentation-in-cli.md` |

## Known Gotchas

- CI: use explicit test file paths in package.json, glob doesn't expand on Ubuntu
- GitHub: OAuth token needs `workflow` scope to push workflow files
- Schema: tasks without new fields must fallback with `|| default`

# Project: relay-lab

CLI task manager (Node.js, ESM, zero external dependencies).

## Architecture

```
src/store.js   — data layer: load, save, getAll, add, remove, toggle
                 data file: ~/.relay-lab/tasks.json
                 schema: { nextId: number, tasks: [{ id, text, done, priority, dueDate, createdAt }] }

src/cli.js     — CLI entry: process.argv + switch routing
                 commands: add, list, done, remove, search, export, stats
                 flags: -p (priority), -d (due date), --sort (priority|due)
```

## Rules

- Zero external dependencies — Node.js built-ins only
- Every change must have tests (`node --test`)
- Tests use subprocess with HOME override for isolation
- Conventional commits: `feat:`, `fix:`, `docs:`
- ESM modules (`import`/`export`, `"type": "module"`)

## HANDOFF Protocol

When working on an Issue, always update the Issue body:
- Set Status to 🟡 In Progress when starting
- Set Status to 🟢 Complete when done
- Fill in: Completed, Decisions Made, Gotchas, Next Session Start Here
- Check all Acceptance Criteria boxes that are satisfied

After completing an Issue, update THIS FILE (CLAUDE.md) if any of the following changed:
- Architecture section: new files, new commands, new fields in schema
- Rules section: new conventions discovered or established
- Decisions section: choices that affect future development
- Gotchas section: pitfalls that future agents should know

This ensures knowledge accumulates across Issues, not just within each Issue.

## Key Decisions

Decisions are archived in `docs/decisions/`. Read relevant ones when you need context on why something was built a certain way.

| # | Topic | File |
|---|-------|------|
| 001 | Data format & ID generation | `docs/decisions/001-data-format.md` |
| 002 | No external dependencies | `docs/decisions/002-no-external-deps.md` |
| 003 | Test isolation via HOME override | `docs/decisions/003-test-isolation.md` |
| 004 | Presentation functions in cli.js | `docs/decisions/004-presentation-in-cli.md` |

When making a new architectural decision, create a new file in `docs/decisions/` and add a row to this table.

## Known Gotchas

- CI: use explicit test file paths in package.json, glob doesn't expand on Ubuntu
- GitHub: OAuth token needs `workflow` scope to push workflow files
- Schema: tasks without `priority` or `dueDate` must fallback with `|| default`

## Code Style

- No semicolons in test files
- Use `const` by default, `let` only when reassignment needed
- Error messages: `"Error: <description>"` format
- CLI output: `"Added: #1 text"`, `"Removed: #1 text"` format

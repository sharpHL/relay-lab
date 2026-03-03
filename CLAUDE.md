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

## Key Decisions (accumulated from Issues)

- Data format uses `nextId` counter in file, not max(id) scan (#1)
- `done` command toggles (not one-way), more useful for corrections (#2)
- No external arg parser — `process.argv` + switch is sufficient (#2)
- Search uses simple `String.includes`, no regex (#3)
- Priority stored as string not number — more readable in JSON (#9)
- Existing tasks without new fields fallback gracefully (e.g. `priority || "medium"`) (#9)
- Presentation functions (export, stats) live in cli.js not store.js (#12, #14)
- Entry-point guard `fileURLToPath(import.meta.url)` for testable exports (#12)

## Known Gotchas

- CI glob `src/**/*.test.js` doesn't expand on Ubuntu — use explicit file list in package.json
- OAuth token needs `workflow` scope to push .github/workflows/ files
- Tasks without `priority` or `dueDate` field must be handled with `|| default` in display code

## Code Style

- No semicolons in test files
- Use `const` by default, `let` only when reassignment needed
- Error messages: `"Error: <description>"` format
- CLI output: `"Added: #1 text"`, `"Removed: #1 text"` format

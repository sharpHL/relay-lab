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

## Code Style

- No semicolons in test files
- Use `const` by default, `let` only when reassignment needed
- Error messages: `"Error: <description>"` format
- CLI output: `"Added: #1 text"`, `"Removed: #1 text"` format

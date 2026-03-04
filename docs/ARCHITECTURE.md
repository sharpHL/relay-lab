# Architecture

## File Structure

```
src/store.js   — data layer: load, save, getAll, add, remove, toggle
                 data file: ~/.relay-lab/tasks.json
                 schema: { nextId: number, tasks: [{ id, text, done, priority, dueDate, createdAt }] }

src/cli.js     — CLI entry: process.argv + switch routing
                 commands: add, list, done, remove, search, export, stats
                 flags: -p (priority), -d (due date), --sort (priority|due)
                 exports: tasksToCSV(), taskStats() (guarded by entry-point check)

src/store.test.js — store unit tests (subprocess + HOME override)
src/cli.test.js   — CLI integration tests + unit tests for exported functions
```

## Data Flow

```
User → cli.js (parse args) → store.js (CRUD) → ~/.relay-lab/tasks.json
```

## Schema

```json
{
  "nextId": 5,
  "tasks": [
    {
      "id": 1,
      "text": "Buy groceries",
      "done": false,
      "priority": "high",
      "dueDate": "2026-03-10",
      "createdAt": "2026-03-03T10:00:00.000Z"
    }
  ]
}
```

## Adding a New Command

1. Add case in `src/cli.js` switch block
2. Add usage line in `USAGE` string
3. If new data field: extend schema in `store.js` `add()`, handle fallback `|| default` in display code
4. Write tests in `src/cli.test.js`
5. Update `package.json` test list if new test file

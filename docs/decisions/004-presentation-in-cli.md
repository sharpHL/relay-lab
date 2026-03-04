# 004: Presentation Functions in cli.js

**Issue:** #12, #14
**Decision:** Export/stats formatting functions live in cli.js, not store.js

**Context:**
`tasksToCSV()` and `taskStats()` are presentation logic, not data logic.

**Options considered:**
- In store.js (rejected) — mixes data access with formatting
- In cli.js with entry-point guard (chosen) — keeps separation, testable via import

**Consequences:**
- cli.js uses `fileURLToPath(import.meta.url)` guard so `main()` only runs as entry point
- Test files can `import { tasksToCSV, taskStats } from "./cli.js"` for unit tests
- New presentation functions follow same pattern

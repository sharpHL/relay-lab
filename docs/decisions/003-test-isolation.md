# 003: Test Isolation via HOME Override

**Issue:** #1, #2
**Decision:** Tests run in subprocess with `HOME` set to temp directory

**Context:**
store.js writes to `~/.relay-lab/tasks.json`. Tests must not pollute real user data.

**Options considered:**
- Dependency injection for file path (rejected) — changes production API for test convenience
- HOME env override in subprocess (chosen) — zero production code change, full isolation
- Mock fs module (rejected) — complex, fragile

**Consequences:**
- Each test gets clean state via `beforeEach` rm + mkdir
- Tests are slightly slower (subprocess per assertion) but reliable
- Any new module using homedir() automatically inherits isolation

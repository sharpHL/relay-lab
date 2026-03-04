# 001: Task Data Format

**Issue:** #1
**Decision:** Use `{ nextId: number, tasks: Task[] }` with nextId counter in file

**Context:**
Need a way to generate unique IDs for tasks without a database.

**Options considered:**
- nextId counter in file (chosen) — O(1), no scan needed
- max(id) + 1 from tasks array — requires scanning all tasks, fragile if tasks deleted

**Consequences:**
- File always has nextId ready, even after deletions
- IDs never reuse (by design)

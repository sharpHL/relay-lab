# 002: No External Dependencies

**Issue:** #2
**Decision:** Use only Node.js built-ins, no npm packages

**Context:**
CLI arg parsing could use commander/yargs, but project is simple enough.

**Options considered:**
- commander/yargs (rejected) — overkill for 7 commands
- process.argv + switch (chosen) — zero deps, clear routing

**Consequences:**
- No node_modules, instant install
- Flag parsing is manual (`-p`, `-d`, `--sort`) but predictable
- Adding complex arg patterns (e.g. subcommands) would need rethinking

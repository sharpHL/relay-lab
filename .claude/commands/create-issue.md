Create a GitHub Issue for the relay-lab project and add it to the Project Board.

## Input

The user will provide: $ARGUMENTS

Parse the input to extract:
- **Title**: a concise imperative title (e.g., "Add task export to CSV")
- **Type**: feature or bug (default: feature)
- **Auto-start**: whether to add `agent:ready` label for immediate Agent execution

If the input is brief (e.g., "add a delete-all command"), expand it into a full Issue with proper acceptance criteria based on the existing codebase.

## Steps

1. Read the existing codebase to understand current architecture:
   - `src/store.js` for data layer functions
   - `src/cli.js` for CLI commands and patterns
   - Check existing tests for conventions

2. Generate the Issue body using this HANDOFF template:

```markdown
## Goal
[Expand the user's brief description into a clear goal]

## Acceptance Criteria
- [ ] [Specific, testable criteria based on codebase understanding]
- [ ] Unit tests

## Technical Notes
- [Reference relevant existing code: which files to modify, which functions to use]
- [Note any dependencies on other Issues if applicable]

---

## Status: 🔵 Not Started

## Current Context
- Branch: N/A
- Last session: N/A
- Working on: N/A

## Completed

## Decisions Made

## Gotchas

## Next Session Start Here
```

3. Create the Issue:
```bash
gh issue create --title "TITLE" --label "TYPE" --body "BODY"
```

4. Ask the user if they want to add `agent:ready` label to trigger immediate Agent execution.

5. If yes, add the label:
```bash
gh issue edit N --add-label "agent:ready"
```

6. Report the Issue URL and Board status.

## Rules
- Always read existing code before writing acceptance criteria — criteria must reference actual file paths and function signatures
- Keep the title under 60 characters, imperative form
- Technical Notes must reference specific files from the codebase
- Do NOT create the Issue until the user confirms the content

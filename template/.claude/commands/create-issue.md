Create a GitHub Issue for this project and optionally trigger Agent execution.

## Input

The user will provide: $ARGUMENTS

Parse the input to extract:
- **Title**: a concise imperative title
- **Type**: feature or bug (default: feature)

If the input is brief, expand it into a full Issue with proper acceptance criteria based on the existing codebase.

## Steps

1. Read the existing codebase to understand current architecture (check CLAUDE.md first)

2. Generate the Issue body using this HANDOFF template:

```markdown
## Goal
[Expand the user's brief description into a clear goal]

## Acceptance Criteria
- [ ] [Specific, testable criteria based on codebase understanding]
- [ ] Unit tests

## Technical Notes
- [Reference relevant existing code: which files to modify, which functions to use]

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

3. Show the generated Issue to the user for confirmation before creating.

4. Create the Issue:
```bash
gh issue create --title "TITLE" --label "TYPE" --body "BODY"
```

5. Ask the user if they want to add `agent:ready` label to trigger immediate Agent execution.

6. Report the Issue URL.

## Rules
- Always read existing code before writing acceptance criteria
- Keep the title under 60 characters, imperative form
- Technical Notes must reference specific files from the codebase
- Do NOT create the Issue until the user confirms the content

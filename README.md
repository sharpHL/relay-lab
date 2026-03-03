# relay-lab

A simple CLI task manager — experimental project for validating the continuous AI-driven development workflow.

## Purpose

This project exists to test and validate:
- GitHub Project Board as task queue
- Structured HANDOFF mechanism for cross-session context
- Automated CI/CD pipeline with auto-merge
- Agent-driven continuous development loop

## The CLI Tool

A minimal `task` CLI that manages todos from the terminal:

```bash
task add "Buy groceries"
task list
task done 1
task search "groceries"
```

Deliberately simple so the focus stays on the development workflow, not the product.

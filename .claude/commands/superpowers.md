---
description: List the 14 skills bundled in the superpowers plugin and invoke the one picked
---

Show the user this numbered menu of the 14 skills from the `superpowers` plugin, each with its one-line purpose:

1. **using-superpowers** — Use when starting any conversation; establishes how to find and use skills, requiring skill invocation before any response.
2. **brainstorming** — Use before any creative work (new features, components, behavior changes); explores intent, requirements, and design before implementation.
3. **writing-plans** — Use once you have a spec or requirements for a multi-step task, before touching code.
4. **executing-plans** — Use to execute a written implementation plan in a separate session, with review checkpoints.
5. **subagent-driven-development** — Use to execute implementation plans with independent tasks in the current session; dispatches a subagent per task with review between tasks.
6. **dispatching-parallel-agents** — Use when facing 2+ independent tasks that have no shared state or sequential dependency.
7. **test-driven-development** — Use for any feature or bugfix: write the test first, watch it fail, write minimal code, then refactor.
8. **systematic-debugging** — Use for any bug, test failure, or unexpected behavior, before proposing fixes.
9. **using-git-worktrees** — Use when starting feature work that needs isolation from the current workspace, or before executing a plan; sets up an isolated workspace.
10. **requesting-code-review** — Use when completing tasks or before merging, to verify the work meets requirements.
11. **receiving-code-review** — Use when acting on review feedback, especially if it seems unclear or questionable; requires verification, not blind agreement.
12. **verification-before-completion** — Use before claiming work is complete, fixed, or passing; requires running verification commands and confirming the output first.
13. **finishing-a-development-branch** — Use once implementation is done and tests pass, to decide how to integrate the work.
14. **writing-skills** — Use when creating a new skill, editing an existing one, or verifying a skill works before deployment.

Then ask the user which skill they want to use (by number or name). Once they answer, invoke it with the Skill tool using its exact name from the list above.

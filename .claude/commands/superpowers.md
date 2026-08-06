---
description: List the 14 skills bundled in the superpowers plugin and invoke the one picked
---

This plugin bundles 14 skills, grouped below into 4 categories with their one-line purpose:

**Démarrage**
- **using-superpowers** — Use when starting any conversation; establishes how to find and use skills, requiring skill invocation before any response.
- **brainstorming** — Use before any creative work (new features, components, behavior changes); explores intent, requirements, and design before implementation.
- **writing-plans** — Use once you have a spec or requirements for a multi-step task, before touching code.
- **using-git-worktrees** — Use when starting feature work that needs isolation from the current workspace, or before executing a plan; sets up an isolated workspace.

**Exécution**
- **executing-plans** — Use to execute a written implementation plan in a separate session, with review checkpoints.
- **subagent-driven-development** — Use to execute implementation plans with independent tasks in the current session; dispatches a subagent per task with review between tasks.
- **dispatching-parallel-agents** — Use when facing 2+ independent tasks that have no shared state or sequential dependency.
- **test-driven-development** — Use for any feature or bugfix: write the test first, watch it fail, write minimal code, then refactor.

**Qualité**
- **systematic-debugging** — Use for any bug, test failure, or unexpected behavior, before proposing fixes.
- **requesting-code-review** — Use when completing tasks or before merging, to verify the work meets requirements.
- **receiving-code-review** — Use when acting on review feedback, especially if it seems unclear or questionable; requires verification, not blind agreement.
- **verification-before-completion** — Use before claiming work is complete, fixed, or passing; requires running verification commands and confirming the output first.

**Finalisation**
- **finishing-a-development-branch** — Use once implementation is done and tests pass, to decide how to integrate the work.
- **writing-skills** — Use when creating a new skill, editing an existing one, or verifying a skill works before deployment.

Use the AskUserQuestion tool, if available, to let the user pick interactively in two steps: first a single question with the 4 category names above as options (header "Catégorie"), then a second question listing that category's skills as options (header "Skill"), using each skill's one-line purpose above as its option description. If AskUserQuestion is not available, print the grouped list above as text and ask the user to reply with a skill name instead. Once a skill is chosen, invoke it with the Skill tool using its exact name.

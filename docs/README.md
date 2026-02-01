# Documentation Guide

Use this structure for requirement, design, and delivery docs that PMs and developers can fill in quickly.

## Structure
- `docs/requirements/README.md` - Product requirement template (PRD).
- `docs/design/README.md` - System/component design template.
- `docs/api/README.md` - API spec template.
- `docs/testing/README.md` - Test plan template.
- `docs/release/README.md` - Release and deployment checklist.
- `docs/ops/README.md` - Runbook and operations notes.

## How to use with Claude/Codex
1. Copy the relevant template into a new markdown file and replace placeholders.
2. Paste the template plus your context into Claude/Codex and ask to draft or refine sections.
3. Example prompts:
   - "Fill this PRD template for the new habit streak feature; focus on goals/non-goals and acceptance criteria."
   - "Turn the requirement doc into an API spec with request/response examples and error codes."
   - "Draft a design doc that highlights key trade-offs and ADRs for the notification module."

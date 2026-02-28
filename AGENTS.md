# AGENTS.md

This file guides automated coding agents working in this repository.

## Repository Overview

- Purpose: Documentation-only repository (currently contains `docs/design.md`).
- Code: No application source code detected.
- Build/Test: No build system or test runner detected.

## Commands (Build / Lint / Test)

No build, lint, or test commands were found in the repo root.

If you add a build system in the future, update this section with:

- Build: `<command>`
- Lint: `<command>`
- Test (all): `<command>`
- Test (single): `<command with test selector>`

### Current Status

- Build: Not defined
- Lint: Not defined
- Test: Not defined
- Single test: Not defined

## Cursor / Copilot Rules

No Cursor rules found in `.cursor/rules/` or `.cursorrules`.
No Copilot rules found in `.github/copilot-instructions.md`.

If these files are added later, summarize them here and align behavior to them.

## Documentation Style Guide

This repo is documentation-only, so consistency and clarity matter most.

### General Writing

- Prefer concise, direct sentences.
- Use plain technical language; avoid marketing tone.
- Keep paragraphs short (2–4 sentences).
- Use lists for procedures and constraints.
- Define acronyms on first use.
- Avoid Unicode unless the document already uses it.

### Markdown Conventions

- Use ATX headings (`#`, `##`, `###`).
- Keep heading hierarchy consistent and shallow.
- Use fenced code blocks with language tags (e.g., `ts`, `bash`).
- Use ordered lists for sequences; unordered lists for collections.
- Keep lines reasonably short for reviewability (~100–120 chars).

### Terminology

- Use consistent term casing (e.g., `Geometry Engine`, `Rendering Engine`).
- Reuse existing names from `docs/design.md`.
- Avoid renaming established entities unless explicitly required.

## Code Style (If Code Is Added Later)

These guidelines apply if code is introduced in the future.

### Imports

- Group imports by origin: built-in, external, internal.
- Avoid default imports unless the library encourages it.
- Prefer explicit named imports.
- Keep import lists sorted alphabetically within a group.

### Formatting

- Use a consistent formatter (e.g., Prettier or Black) once adopted.
- Avoid mixed indentation; use spaces only.
- Keep lines under 100–120 characters when practical.

### Types

- Prefer explicit types for public APIs and module boundaries.
- Use type aliases for complex object shapes.
- Avoid `any`/`unknown` unless required; document why.

### Naming

- Use `camelCase` for variables and functions.
- Use `PascalCase` for types and classes.
- Use `SCREAMING_SNAKE_CASE` for constants only when truly constant.
- Avoid abbreviations unless standard (e.g., `id`, `ctx`).

### Error Handling

- Use descriptive error messages with context.
- Prefer typed errors or error codes if a system grows complex.
- Avoid swallowing errors; log or propagate them.
- In UI code, surface errors to the user in a recoverable way.

### Testing

- Use test names that describe behavior, not implementation.
- Keep tests deterministic and isolated.
- Prefer fixtures or factory helpers for setup.

## Editing Existing Docs

When changing `docs/design.md`:

- Preserve the high-level structure and numbering.
- Add “実装仕様” blocks when clarifying behavior.
- Avoid removing existing statements unless they are incorrect.
- Make changes incremental and traceable.

## Agent Workflow

- Read relevant docs before making changes.
- Keep edits minimal and focused.
- Avoid introducing new files unless necessary.
- Do not run destructive git commands.
- If adding build tooling, update this file with commands.
- After implementing changes, run the app (if applicable) and execute tests.
- If failures occur, read the error messages, fix the code, and re-run checks.
- Repeat run/check cycles until results are clean.
- After substantial implementation work, run the formatter to maintain quality.

## Example Command Placeholders

These are examples only; replace once actual tooling exists.

- Build: `npm run build`
- Lint: `npm run lint`
- Test (all): `npm test`
- Test (single): `npm test -- <pattern>`

## When Unsure

- Prefer documenting assumptions explicitly.
- Ask for clarification only when blocked by missing requirements.
- Default to small, reversible changes.

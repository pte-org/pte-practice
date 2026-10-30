@AGENTS.md
@../docs/CODING_STANDARDS_WEB.md

# pte-practice — AI Code Generation Rules

Student practice app (Next.js, TypeScript, npm). Source layout: `app/` (routes), `features/{name}/` (domain code), `common/` (shared components, hooks, i18n, providers). Tests live in `tests/unit/`, mirroring this tree.

## Critical Rules (enforce on every file you write)

1. **Read the coding standard first** — `../docs/CODING_STANDARDS_WEB.md` (imported above) applies to every change here.
2. **No hardcoded user-facing strings in JSX or handlers** — use feature constants or `common/i18n`.
3. **No `any` type** and no `// @ts-ignore` — narrow `unknown` or define an interface.
4. **File ≤ 300 lines, component function ≤ 150 lines** — AI-generated code is not exempt.
5. **Tests go in `tests/unit/` only** — never beside production code; import with the `@/` alias. See "Test file placement" in `AGENTS.md`.
6. **Secrets** — `NEXT_PUBLIC_*` only for non-sensitive public config.

## When Updating Coding Standards

A change to `../docs/CODING_STANDARDS_WEB.md` that affects this app must also update `AGENTS.md` and this file in the same change.

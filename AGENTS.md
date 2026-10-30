<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# PTE Practice coding rules

Before inspecting a change in depth or writing code, read [../docs/CODING_STANDARDS_WEB.md](../docs/CODING_STANDARDS_WEB.md) and follow its rules. This app is checked out inside the `pte-org` workspace next to `docs/`; if that file cannot be opened, stop and report it instead of coding from memory. The same standard applies to `pte-web`, which keeps its own copy in its `docs/` folder.

## Responsibilities and messages

- Keep route files in `app/` thin. Separate rendering, data fetching, state/actions, types, constants and utilities by responsibility.
- Follow the standard's limits: component functions under 150 lines and files under 300 lines. Extract focused components/hooks when necessary; do not split merely to hide complexity.
- Put user-facing labels, messages, validation/error copy and configuration in feature constants or the shared `common/i18n` catalogs. No inline user-facing messages in JSX or handlers, and no raw API/machine errors displayed to users.
- Search `common/components` and existing features before creating UI, and reuse what covers the requirement.
- Keep domain logic in its feature under `features/`; only domain-neutral code belongs in `common/`.

## Verification

### Test file placement

- All test code lives in the top-level `tests/` directory, outside the production folders `app/`, `features/` and `common/`.
- Unit/component tests belong in `tests/unit/`, mirroring the source tree: `features/chat/api.ts` is tested by `tests/unit/features/chat/api.test.ts`. Use `tests/integration/` and `tests/e2e/` for those suites.
- Never put `.test.*`, `.spec.*`, `__tests__`, test fixtures, mocks, or test helpers beside production components, hooks, API code, or types. Test-only fixtures and helpers go under `tests/`, and production code must never import from `tests/`.
- Import the code under test through the `@/` alias (for example `@/features/chat/api`), not long `../` chains. A test that reads a repository file by path, such as a CSS file or the backend contract, must resolve it from its own location in `tests/`.
- Vitest discovers tests only under `tests/` (see `vitest.config.ts`); a test left beside production code will not run, so it must be moved, not left. Tests are included in the TypeScript check (`tsc --noEmit`).
- Tests that skip themselves when a file is missing, such as the backend contract checks, must be confirmed as actually run after any move.
- Before handoff, verify no test files remain under production folders, then run `npm run test:unit` and `npx tsc --noEmit` plus scoped lint. Report skipped or failing checks explicitly, and separate failures that already existed from ones you caused.
- Review the relevant coding-standard checklist before handing off, and preserve unrelated worktree changes.

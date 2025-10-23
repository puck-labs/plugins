# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**puck-labs** is a monorepo for experimental Puck editor extensions, starting with JSONata expression support and motion.dev animations. This is a 16-hour MVP project (4 hours/day × 4 days) targeting open-source release.

**Primary goal:** Add dynamic expression evaluation to Puck's static config system without breaking existing functionality.

## Monorepo Architecture

This is a **Bun workspace-based monorepo** with the following structure:

- `apps/*` - Application packages (web demos, native apps, etc.)
- `packages/*` - Shared library packages (core functionality)
  - `packages/jsonata/` - JSONata expression engine for Puck (see its CLAUDE.md for details)

**Key principle:** Libraries in `packages/*` are implementation details. Applications in `apps/*` are consumer-facing demos.

## Development Commands

```bash
# Install all workspace dependencies
bun install

# Run all workspaces in development mode (parallel)
bun dev

# Run specific workspace only
bun dev:web        # Web application demo
bun dev:native     # Native application demo

# Build all workspaces for production
bun build

# Type-check all workspaces
bun check-types

# Lint and format all code (Biome via Ultracite)
bun check
```

**Workspace filtering:** Use `--filter` to target specific workspaces:

```bash
bun run --filter <workspace-name> <script>
bun run --filter jsonata test
bun run --filter web build
```

## Build System

**Package manager:** Bun 1.2.23+ (required)
**Task runner:** Turborepo 2.5.8 (intelligent caching + parallel execution)
**Linker mode:** Isolated (configured in `bunfig.toml`)
**Module system:** ESM with `verbatimModuleSyntax`

### Turborepo Task Orchestration

Turborepo provides intelligent caching and parallel task execution:

```bash
# Run tasks across all workspaces (uses Turborepo)
bun dev          # Parallel dev servers with hot reload
bun build        # Cached builds with dependency awareness
bun check-types  # Type-check all packages in parallel
bun run test         # Run all tests
```

**Key features:**

- **Build caching:** Skips unchanged packages
- **Dependency awareness:** Builds packages in correct order
- **Parallel execution:** Runs independent tasks concurrently
- **Remote caching:** Share cache across team (requires Vercel account)

Configuration in `turbo.json` defines task dependencies and outputs.

### Library Building: tsdown

Libraries in `packages/*` use **tsdown 0.15.6** for TypeScript bundling:

**Features:**

- Automatic TypeScript declaration (.d.ts) generation
- Dual ESM/CJS output for maximum compatibility
- Built on Rolldown (Rust) for fast builds
- Zero-config for standard use cases

**Example package structure:**

```
packages/jsonata/
├── src/
│   ├── index.ts         # Entry point
│   └── styles.css       # Optional styles
├── dist/                # Built output
│   ├── index.js         # ESM bundle
│   ├── index.cjs        # CommonJS bundle
│   ├── index.d.ts       # TypeScript declarations
│   └── styles.css       # Copied CSS
├── tsdown.config.ts     # Build configuration
└── package.json         # With exports field
```

### TypeScript Configuration

Base config in `tsconfig.base.json` enforces strict safety:

- Target: ESNext with bundler module resolution
- Strict mode + additional checks:
  - `noUncheckedIndexedAccess: true` (array access safety)
  - `noUnusedLocals/Parameters: true` (no dead code)
  - `noFallthroughCasesInSwitch: true` (explicit breaks)
- Module: ESM only, no CommonJS

**Workspace tsconfigs extend from base:**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    /* workspace-specific overrides */
  }
}
```

## Code Quality (Ultracite)

This project uses **Ultracite 5.6.2** (zero-config Biome wrapper) with strict standards:

**Enforced rules:**

- No `any` types, TypeScript `enum`, or `namespace`
- Arrow functions preferred over `function` expressions
- `const` for single-assignment variables
- Explicit error handling (no silent failures)
- React: Hooks dependency arrays validated
- Accessibility: a11y compliance enforced

**Ignored paths** (see `biome.json`):

- `.next`, `dist`, `.turbo`, `dev-dist` (build outputs)
- `.zed`, `.vscode` (editor configs)
- `routeTree.gen.ts` (generated files)
- `src-tauri`, `.expo`, `.wrangler`, `.svelte-kit` (framework internals)

**Pre-commit workflow:**

```bash
bun check          # Auto-fix formatting and linting
bun check-types    # Verify TypeScript correctness
```

## Critical Constraints

### Timeline Budget

- **Total:** 16 hours over 4 days
- **Story points:** Use instead of time estimates
  - 1 point = Trivial (config change)
  - 3 points = Simple (CRUD with library)
  - 5 points = Standard (integration)
  - 8 points = Complex (architecture decision)
  - 13+ points = Too large, break down

### Technical Requirements

- **Zero breaking changes** to existing Puck configs
- **Library-first approach:** Use production libraries over custom code
- **Type safety:** Strict TypeScript with runtime validation where needed
- **Component transparency:** Puck components must be expression-agnostic

## Architecture Principles

### 1. Library-First (95% confidence)

**Before writing custom code, check:**

1. Does a production library exist? (npm, crates.io, etc.)
2. Is it maintained and battle-tested?
3. Does it solve 80%+ of the problem?

**If yes → Use it. If no → Justify in code review.**

**Example decisions:**

- JSONata evaluation: `jsonata` npm package (never build parser)
- Syntax highlighting: CodeMirror/Monaco extensions
- Type validation: Zod or similar (runtime checks)

### 2. Journey-Centric Code Organization

**Wrong (component-centric):**

```
/components/Button
/components/Form
/services/AuthService
```

**Right (journey-centric):**

```
/journeys/checkout/
  - CheckoutFlow.tsx
  - PaymentProcessor.ts
  - CheckoutTests.ts
```

**Why:** Cognitive load = (Components × Complexity) - Journey Coherence
Goal: Entire feature fits in one developer's head.

### 3. Make Illegal States Unrepresentable

**Wrong:**

```typescript
interface User {
  isLoggedIn: boolean;
  username?: string; // ❌ Can be logged in with no username
}
```

**Right:**

```typescript
type User =
  | { type: "anonymous" }
  | { type: "authenticated"; username: string; token: string };
```

### 4. Atomic Migrations Only

When changing boundaries, migrate EVERYTHING atomically:

- Change interface → Update ALL consumers NOW
- Delete old code → No `_old`, `_legacy`, `_v2` suffixes
- One version only → Eliminates cognitive split

**Forbidden:**

```typescript
function getUser(id: string): User; // Old way
function getUserV2(id: string, opts: Options): User; // ❌ Brain explodes
```

**Required:**

```typescript
function getUser(id: string, opts?: Options): User; // ✅ One truth
```

## Testing Strategy

**Test execution:**

```bash
# Run all tests in workspace
bun run test

# Run specific test file
bun run test path/to/file.test.ts

# Watch mode for TDD
bun run test --watch

# Coverage report
bun run test --coverage
```

**Required coverage areas:**

- Unit: Each public API function
- Integration: Cross-package interactions
- Type safety: Runtime validation matches TypeScript types
- Regression: Existing functionality unchanged

## Common Pitfalls

❌ **Building from scratch** → Use production libraries
❌ **Time estimates** → Use story points instead
❌ **Manager/Helper/Utils naming** → Use domain-specific names
❌ **try/catch for control flow** → Use Result types
❌ **Silent failures** → Fail loud and fast with helpful errors
❌ **interface_v2 patterns** → Atomic migration required
❌ **TypeScript enums** → Forbidden by Ultracite (use const objects)

## Decision Framework

### Reversibility Check (Before Major Decisions)

**Type 2A (Easy rollback):** < 1 minute → Just do it
**Type 2B (Rollback with effort):** < 5 minutes → Ship quickly with monitoring
**Type 1 (One-way door):** > 30 minutes → Deep analysis required

### Confidence Scale

- **95-100%:** Mathematical certainty (only for proven theorems)
- **85-95%:** Very confident → Ship immediately
- **70-85%:** Confident → Ship with monitoring
- **50-70%:** More likely than not → Try first with backup
- **30-50%:** Plausible alternative → Keep as backup only
- **0-30%:** Unlikely → Don't bet on it

## Version Management: Changesets

This project uses **Changesets 2.29.7** for versioning and changelog automation.

### Creating a Changeset

When you make changes that should trigger a release:

```bash
bun changeset
```

This will:

1. Prompt you to select which packages changed
2. Ask for the semver bump type (major/minor/patch)
3. Request a description for the changelog
4. Create a `.changeset/*.md` file

**When to create changesets:**

- New features → `minor`
- Bug fixes → `patch`
- Breaking changes → `major`
- Internal changes only (tests, docs) → No changeset needed

### Release Workflow

1. **Contributor** creates changeset in their PR
2. **CI** validates that PR contains a changeset file
3. **Maintainer** merges PR with changeset
4. **GitHub Action** creates "Version Packages" PR automatically
5. **Maintainer** reviews and merges version PR
6. **GitHub Action** publishes to npm automatically

```bash
# Manual version bump (local testing only)
bun version-packages

# Manual release (NOT recommended, use GitHub Actions)
bun release
```

**Critical:** Never manually edit version numbers in `package.json` - let Changesets handle it.

## Bundle Size Monitoring

Libraries use **size-limit 11.2.0** to prevent bundle bloat.

### Configuration

Each library package defines size limits in `package.json`:

```json
{
  "size-limit": [
    {
      "path": "dist/index.js",
      "limit": "50 KB",
      "name": "ESM bundle"
    },
    {
      "path": "dist/styles.css",
      "limit": "5 KB",
      "name": "Optional styles"
    }
  ]
}
```

### Running Size Checks

```bash
# Check bundle sizes in a specific package
cd packages/jsonata
bun size

# CI will fail if bundles exceed limits
```

**When size limit is exceeded:**

1. Analyze what caused the increase (new dependency?)
2. Consider code splitting or lazy loading
3. If justified, increase limit in PR with explanation
4. Document why the size increase is acceptable

## Demo Deployment

### Apps Structure

- `apps/web/` - **Next.js 15.5** demo application
  - Framework: Next.js App Router
  - Styling: Tailwind CSS 3.4.20
  - Purpose: Demonstrate JSONata expressions in Puck editor

### Local Development

```bash
# Run web demo only
bun dev:web

# Run all apps (if multiple exist)
bun dev
```

### Vercel Deployment

The web demo automatically deploys to Vercel on every push to `main`.

**Configuration** (`vercel.json`):

- Build command uses Turborepo for caching
- Only deploys `apps/web` (ignores packages)
- Bun is used for installation

**Environment setup:**

1. Connect GitHub repo to Vercel
2. Vercel auto-detects Next.js + Turborepo
3. Set build command: `turbo run build --filter=@puck-labs/web`
4. Deployments happen automatically

**Preview deployments:**

- Every PR gets a preview URL
- Test changes before merging
- Share demos with stakeholders

## CI/CD Pipeline

GitHub Actions run on every push and pull request.

### CI Workflow (`.github/workflows/ci.yml`)

Runs in parallel:

1. **Lint & Format** - Biome checks all files
2. **Type Check** - TypeScript validation across workspace
3. **Build** - Turborepo cached builds
4. **Test** - Run all tests with coverage
5. **Changeset Check** (PRs only) - Ensures PR has changeset

**All checks must pass before merge.**

### Release Workflow (`.github/workflows/release.yml`)

Runs on push to `main`:

1. Checks for pending changesets
2. If found: Creates "Version Packages" PR
3. If version PR merged: Publishes to npm

**Required secrets:**

- `GITHUB_TOKEN` - Auto-provided by GitHub
- `NPM_TOKEN` - Add in repo settings for publishing

### Running CI Locally

```bash
# Lint check (matches CI)
bunx biome ci .

# Full pre-push check
bun check && bun check-types && bun build && bun run test
```

## Workspace-Specific Guidance

### packages/jsonata

JSONata expression engine for Puck editor.

**See:** `/packages/jsonata/CLAUDE.md` for detailed architecture, data flow, and implementation requirements.

**Key responsibilities:**

- Config transformation (add static/dynamic mode)
- Expression evaluation with scoping
- Metadata stripping before Puck render
- Type validation at runtime

### apps/web

Next.js 15.5 demo application showcasing JSONata expressions.

**Stack:**

- Framework: Next.js 15.5 (App Router)
- Styling: Tailwind CSS 3.4.20
- Runtime: React 19
- Deployment: Vercel (automatic)

**Key features:**

- Demonstrates `@puck-labs/jsonata` integration
- Live expression evaluation examples
- Puck editor with dynamic properties
- Optional CSS styling showcase

**Development:**

```bash
bun dev:web              # Start dev server on localhost:3000
cd apps/web && bun build # Build for production
```

**Adding new pages:**

- Create `src/app/<route>/page.tsx` for App Router
- Use Tailwind CSS classes for styling
- Import `@puck-labs/jsonata` as workspace dependency

## Adding New Workspaces

1. Create directory: `packages/<name>` or `apps/<name>`
2. Add `package.json` with workspace-specific scripts
3. Extend `tsconfig.base.json` in workspace `tsconfig.json`
4. Add to root `package.json` workspaces array (auto-detected by pattern)
5. Run `bun install` to link workspace dependencies

**Workspace package.json template:**

```json
{
  "name": "@puck-labs/<workspace-name>",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "...",
    "build": "...",
    "check-types": "tsc --noEmit"
  }
}
```

## Puck Component Typing Patterns

### Idiomatic Type Usage

Based on [official Puck demo components](https://github.com/puckeditor/puck/tree/main/apps/demo/config/blocks), follow these patterns:

**1. Component Config Type Structure**

```typescript
// Props type uses Slot (array type) for field definitions
export type MyComponentProps = {
  title: string;
  items: Slot;  // NOT SlotComponent!
};

// Config object typed at the entire Config level
const config: Config<{
  MyComponent: MyComponentProps;
}> = {
  components: {
    MyComponent: {
      fields: {
        title: { type: "text" },
        items: { type: "slot" }
      },
      defaultProps: {
        title: "Default Title",
        items: []  // Array works because props use Slot type
      },
      render: ({ title, items: Items }) => (
        // Items is automatically transformed to SlotComponent by Puck
        <div>
          <h1>{title}</h1>
          <Items />  {/* Render as component */}
        </div>
      )
    }
  }
};
```

**2. Key Type Distinctions**

- **`Slot`** - Array type for field definitions and defaultProps (`Slot` = `ComponentData[]`)
- **`SlotComponent`** - Function component type that Puck transforms to during render
- **`ComponentConfig<Props>`** - Generic for individual component config objects
- **`Config<ComponentsMap>`** - Top-level config type mapping component names to prop types
- **`PuckComponent<Props>`** - Function component type with injected `puck` context

**3. Slot Field Pattern**

When using slot fields, use `PuckComponent<Props>` to handle the automatic transformation:

```typescript
// ✅ CORRECT - Props use Slot type, PuckComponent handles transformation
export type SlotContainerProps = {
  title: string;
  children: Slot;  // Field/config type (array)
};

// PuckComponent automatically transforms Slot → SlotComponent in render
const SlotContainer: PuckComponent<SlotContainerProps> = ({
  title,
  children: Children
}) => (
  <div>
    <h2>{title}</h2>
    <Children />  {/* Automatically a SlotComponent function */}
  </div>
);
```

**Why `PuckComponent`?** It transforms `Slot` (array in config) → `SlotComponent` (function in render) automatically. One props type, no duplication.

**4. Using PuckComponent Type**

Use `PuckComponent<Props>` when you need access to Puck context:

```typescript
import type { PuckComponent } from "@measured/puck";

export const Hero: PuckComponent<HeroProps> = ({
  title,
  description,
  puck,  // Auto-injected by PuckComponent type
}) => (
  <section>
    <h1>{title}</h1>
    <p>{description}</p>
    <button tabIndex={puck.isEditing ? -1 : undefined}>
      Click Me
    </button>
  </section>
);
```

**5. Anti-Patterns**

❌ **Don't use `satisfies` on individual components** - Type at Config level instead
❌ **Don't use `SlotComponent` in props type** - Use `Slot` and `PuckComponent<Props>` for render
❌ **Don't manually type render function parameters** - Let `PuckComponent<Props>` handle it
❌ **Don't create separate field vs render prop types** - One props type with `Slot`, `PuckComponent` transforms it
❌ **Don't use `any` or type assertions** - Puck's types are complete and accurate

**6. Official Examples**

See these official Puck components for reference:
- [Grid](https://github.com/puckeditor/puck/blob/main/apps/demo/config/blocks/Grid/index.tsx) - Slot field usage
- [Heading](https://github.com/puckeditor/puck/blob/main/apps/demo/config/blocks/Heading/index.tsx) - WithLayout pattern
- [Hero](https://github.com/puckeditor/puck/blob/main/apps/demo/config/blocks/Hero/Hero.tsx) - PuckComponent with context

## Notes for AI Assistants

When implementing features across this monorepo:

1. **Apply inversion first:** List all failure modes before proposing solutions
2. **Check for libraries:** Search npm/crates.io before writing custom code
3. **Provide confidence levels:** "X% confident because [specific evidence]"
4. **Offer alternatives:** "Alternative: [approach] (Y% confident because [tradeoffs])"
5. **Check reversibility:** State if decision is one-way door
6. **Use story points:** Never estimate in time (e.g., "5 story points" not "2 days")
7. **Atomic migrations:** When changing interfaces, update ALL consumers immediately
8. **Respect workspace boundaries:** Packages should never import from apps

**Response format for complex decisions:**

```xml
<inversion>Failure modes: [list all ways it could fail]</inversion>
<solution confidence="85%">Primary approach: [description with evidence]</solution>
<alternative confidence="60%">Backup approach: [description with tradeoffs]</alternative>
<reversibility>Yes/No because [specific reason]</reversibility>
<complexity>X story points</complexity>
```

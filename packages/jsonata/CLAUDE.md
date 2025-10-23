# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**puck-jsonata** is an open-source library that adds JSONata expression evaluation to Puck editor's configuration system. It allows users to switch between static values and dynamic expressions for component properties.

**Timeline Constraint:** 16 total hours (4 hours/day × 4 days)
**Goal:** Production-ready MVP with clear architectural foundation

## Core Architecture

### Data Flow Pipeline

```
Puck Config → Config Transformer → Expression Evaluation → Metadata Stripping → Puck Rendering
```

**Critical Principle:** Components must receive data in their original format with zero awareness of expressions.

### Key Components

1. **Config Transformation Layer**

   - Transforms Puck field config to add static/dynamic mode switcher
   - Static mode: Uses Puck's existing field rendering (no changes)
   - Dynamic mode: Shows JSONata expression editor with syntax highlighting

2. **Expression Evaluation Engine**

   - Evaluates JSONata expressions with correct scope
   - Handles scoped variables for array contexts (`$item`, `$index`)
   - Performs pre-render type checking to catch mismatches

3. **Metadata Stripping Pipeline**

   - Strips all expression metadata (`__expression__`, `__mode__`, etc.)
   - Returns clean data matching Puck's expected schema
   - Ensures components receive original data format

4. **Array Scoping System (HIGH PRIORITY)**
   - When field type is `array` with object fields for each item and slot
   - Injects `$item` (current array element) into expression scope
   - Injects `$index` (zero-based position) into expression scope
   - Example: `fields.items[array]` → each item expression gets `$item`, `$index`

## Development Commands

```bash
# Install dependencies
bun install

# Run all workspaces in development mode
bun dev

# Run specific workspace
bun dev:web        # Web application only
bun dev:native     # Native application only

# Build all workspaces
bun build

# Type checking across all workspaces
bun check-types

# Format and fix code (Biome via Ultracite)
bun check
```

## Monorepo Structure

This is a Bun workspace-based monorepo:

- `apps/*` - Application packages (web, native, etc.)
- `packages/*` - Shared library packages (core library lives here)
- Root `package.json` defines workspace configuration

## Type Safety Requirements

### TypeScript Configuration

- **Target:** ESNext with bundler module resolution
- **Strict mode:** Enabled with additional safety checks
  - `noUncheckedIndexedAccess: true`
  - `noUnusedLocals: true`
  - `noUnusedParameters: true`
  - `noFallthroughCasesInSwitch: true`
- **Module system:** ESM with `verbatimModuleSyntax`

### Expression Type Validation

Expressions must return correct data types:

- Primitives: `boolean`, `string`, `number`, `enum` values
- Arrays: Complex case requiring scoped variables
- Validation: Pre-render type checking to catch mismatches

## Code Quality Standards

This project uses **Ultracite** (Biome-based) for code quality enforcement with zero configuration.

Key standards enforced by Ultracite:

- Strict accessibility (a11y) compliance
- No `any` types, no TypeScript enums, no namespaces
- Arrow functions over function expressions
- `const` for single-assignment variables
- Explicit error handling (no silent failures)
- React hooks dependency array validation
- No unused imports/variables/parameters

Run `bun check` before committing to auto-fix issues.

## Critical Success Criteria

- [ ] Config transformer handles all Puck field types
- [ ] Array expressions correctly access `$item` and `$index`
- [ ] Type mismatches caught before render (with helpful errors)
- [ ] Components receive identical data structure (expression-agnostic)
- [ ] Zero breaking changes to existing Puck configs
- [ ] Production-ready error handling (graceful degradation)

## Architectural Decisions

### Library-First Approach (95% confidence)

- **JSONata evaluation:** Use official `jsonata` npm package (never build parser)
- **Syntax highlighting:** Use existing CodeMirror/Monaco extensions
- **Type validation:** Runtime validation using Zod or similar (85% confident vs TypeScript inference 60%)

### Config Transformation Strategy (85% confidence)

- **Approach:** Higher-order function that wraps Puck config
- **Alternative:** Babel/SWC plugin (40% confident - too complex for MVP)
- **Reversible:** Yes - can be removed by unwrapping config

### Metadata Stripping (90% confidence)

- **Approach:** Recursive traversal before passing to Puck
- **Critical:** Must handle nested objects, arrays, and circular references
- **Irreversible decision:** Once stripped, cannot recover expression metadata

### Array Scoping Implementation (70% confidence)

- **Approach:** Context provider pattern with scope injection
- **Complexity:** 8 story points (architecture decision required)
- **Risk:** Nested arrays may require recursive scope stacking

## Failure Modes (Ranked by Impact)

### CATASTROPHIC

1. **Metadata leakage to components** - Components break on unexpected properties
2. **Type mismatch not caught** - Runtime errors in production render

### HIGH

3. **Array scoping fails** - `$item`/`$index` undefined in expressions
4. **Expression syntax error** - No helpful error message to user
5. **Circular reference in data** - Infinite loop during metadata stripping

### MEDIUM

6. **Missing syntax highlighting** - Poor developer experience
7. **Slow evaluation** - UI lag on complex expressions

### LOW

8. **No expression validation** - Valid JSONata but semantically wrong
9. **Missing type hints** - User doesn't know available variables

## Dependencies

**Build tools:**

- Bun 1.2.23+ (package manager and runtime)
- Biome via Ultracite 5.6.2 (linting/formatting)

**Core libraries (to be added):**

- `jsonata` - Official JSONata implementation
- `@puckjs/puck` - Puck editor core
- TBD: Syntax highlighting library
- TBD: Type validation library (likely Zod)

## Testing Strategy

**Required test coverage:**

- Unit tests: Config transformer for each Puck field type
- Integration tests: Expression evaluation with scoping
- Type validation: Mismatch detection for primitives and arrays
- Metadata stripping: Nested objects, arrays, edge cases
- Regression tests: Existing Puck configs work unchanged

**Test execution:**

- Individual test: `bun run test <file-path>`
- Watch mode: `bun run test --watch`
- Coverage: `bun run test --coverage`

## Common Pitfalls to Avoid

❌ **Don't build a JSONata parser** - Use `jsonata` npm package
❌ **Don't modify Puck's internals** - Wrap config only
❌ **Don't assume array depth** - Handle arbitrary nesting
❌ **Don't strip metadata before evaluation** - Evaluate first, then strip
❌ **Don't ignore type validation** - Fail fast with helpful errors
❌ **Don't leak implementation details** - Components stay expression-agnostic
❌ **Don't use TypeScript enums** - Ultracite forbids them (use const objects)

## Story Point Reference

- **1 point:** Trivial (rename, config change)
- **3 points:** Simple (CRUD, basic feature with library)
- **5 points:** Standard (integration, business logic)
- **8 points:** Complex (architecture decision, migration)
- **13+ points:** Too big - break down into smaller tasks

**Target:** All tasks must fit within 16 hours of development time.

## Decision Framework

### Reversibility Check (before major decisions)

1. **Type 2A (Easy rollback):** < 1 minute - Just do it
2. **Type 2B (Rollback with effort):** < 5 minutes - Ship quickly
3. **Type 1 (One-way door):** > 30 minutes - Deep analysis required

### Confidence Scale

- **70-85%:** Confident - Ship with monitoring
- **85-95%:** Very confident - Ship immediately
- **50-70%:** More likely than not - Try first with backup plan
- **30-50%:** Plausible alternative - Keep as backup only

## File Organization Principles

Follow **journey-centric design** (not component-centric):

- Group files by user journey or feature domain
- Keep related logic together (avoid utils/helpers sprawl)
- Example: `/config-transformer/` contains all transformation logic

**Forbidden patterns:**

- `Manager`, `Helper`, `Utils` in file names (vague responsibility)
- Multiple versions of same interface (`interfaceV2`, `interface_old`)
- Silent failures or swallowed errors

## Notes for AI Assistants

When implementing features:

1. **Apply inversion first:** List all failure modes before solutions
2. **Check for libraries:** Search npm before writing custom code
3. **Provide confidence levels:** "X% confident because [evidence]"
4. **Offer alternatives:** "Alternative: [approach] (Y% confident)"
5. **Check reversibility:** State if decision is one-way door
6. **Use story points:** Never estimate in time ("2 days" → "5 story points")
7. **Structure responses:** Use XML tags for clarity in complex explanations

**Atomic migrations only:** When changing interfaces, update ALL consumers immediately. Never maintain two versions (v1/v2).

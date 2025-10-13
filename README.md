# Puck Labs

Experimental extensions for [Puck](https://puckeditor.com) - the open-source visual editor for React.

## Features

- **JSONata Expressions** - Add dynamic expression evaluation to Puck component properties
- **Headless-first** - Optional styling with zero dependencies
- **Type-safe** - Full TypeScript support with runtime validation

## Quick Start

```bash
# Install dependencies
bun install

# Start demo application
bun dev:web

# Build all packages
bun build

# Run tests
bun test
```

## Project Structure

```
puck-labs/
 packages/
    jsonata/          # Expression engine library
 apps/
    web/              # Next.js 15 demo
```

## Development

### Commands

| Command           | Description                                 |
| ----------------- | ------------------------------------------- |
| `bun dev`         | Start all workspaces in development mode    |
| `bun build`       | Build all packages (uses Turborepo caching) |
| `bun check`       | Lint and format code                        |
| `bun check-types` | TypeScript validation                       |
| `bun test`        | Run all tests                               |

### Creating a Changeset

Before submitting a PR, create a changeset:

```bash
bun changeset
```

This documents your changes for automatic versioning and changelogs.

### Package Usage

```typescript
import { withExpressions } from "@puck-labs/jsonata";
import "@puck-labs/jsonata/styles.css"; // Optional

const config = withExpressions({
  // Your Puck config
});
```

## Documentation

- [CLAUDE.md](./CLAUDE.md) - Complete development guide
- [packages/jsonata/CLAUDE.md](./packages/jsonata/CLAUDE.md) - Library architecture

## Tech Stack

- **Build System:** Turborepo 2.5.8 + tsdown 0.15.6
- **Package Manager:** Bun 1.2.23+
- **Framework:** Next.js 15.5 (demo)
- **Styling:** Tailwind CSS 4.1.14 (demo), Vanilla CSS (library)
- **Version Management:** Changesets 2.29.7
- **CI/CD:** GitHub Actions + Vercel

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `bun changeset` to document changes
5. Submit a pull request

All PRs require:

- Passing CI checks (lint, type-check, build, test)
- Changeset file (unless internal change only)

## License

MIT

---
"@puck-labs/jsonata": patch
---

Initial release of JSONata expression engine for Puck editor

**Core Features:**
- Dynamic expression evaluation for Puck primitive fields (text, number, textarea, select, radio)
- Monaco editor integration with JSONata syntax highlighting and autocomplete
- Expression context provider for scoped variable access
- Metadata stripping pipeline (removes internal `__mode__`, `__expression__`, `__value__` fields)
- Type-safe evaluation with automatic coercion
- Circular reference detection and graceful error handling

**Test Coverage:**
- 61/61 tests passing
- Unit tests for config transformer, expression resolver, and expression field component
- Edge cases: circular references, nested metadata, type coercion

**Bundle Size:**
- ESM bundle: 7.91 KB (84% under 50 KB limit)
- Optional CSS: 780 B (84% under 5 KB limit)

**Demo Application:**
- Next.js 15.5 showcase with comprehensive field examples
- Live expression evaluation demonstrations
- Expression context integration patterns

**Known Limitations:**
- Array scoping with `$item` and `$index` planned for v0.1.0
- Expression support currently limited to primitive fields

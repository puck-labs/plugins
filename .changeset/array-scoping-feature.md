---
"@puck-labs/jsonata": minor
---

Array scoping feature with `$item` and `$index` support

Enables array expressions to access current item and index via `ArrayScopeProvider` component.

**New Features:**
- `ArrayScopeProvider` component for scoping `$item` and `$index` in array contexts
- Nested context support with shadowing (like JavaScript closures)
- Recursive transformation of `arrayFields` in config transformer
- Full TypeScript support with type-safe implementation

**Improvements:**
- Array field expressions now have access to scoped variables
- 12 new comprehensive tests for array scoping functionality
- Detailed README documentation with examples
- Interactive demo in web application

**Breaking Changes:** None - fully backward compatible

**Usage Example:**

```tsx
import { ArrayScopeProvider } from '@puck-labs/jsonata';

render: ({ items }) => (
  <ul>
    {items.map((item, index) => (
      <ArrayScopeProvider key={index} item={item} index={index}>
        <li>{item.displayText}</li>
      </ArrayScopeProvider>
    ))}
  </ul>
)
```

Expressions in child components can now use:
- `$item` - Access current array element properties
- `$index` - Access zero-based array position

Example expression: `"Item #" & ($index + 1) & ": " & $item.name`

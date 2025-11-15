# Roadmap

## Version 0.0.1 (Initial Release) ✓

**Status:** Released

Core JSONata expression engine for Puck editor with support for primitive field types.

### Features
- ✓ Dynamic expression evaluation for primitive fields (text, number, textarea, select, radio)
- ✓ Monaco editor integration with JSONata syntax highlighting
- ✓ Expression context provider for scoped variables
- ✓ Metadata stripping pipeline
- ✓ Type-safe evaluation with coercion
- ✓ Circular reference detection
- ✓ Production-ready error handling
- ✓ Comprehensive test coverage (61/61 tests passing)
- ✓ Next.js demo application with field showcase

### Limitations
- Expression support limited to primitive fields only
- Array scoping (`$item`, `$index`) not yet implemented

---

## Version 0.1.0 (Array Scoping) → Next

**Status:** Planned
**Complexity:** 8 story points (~4-6 hours)
**Priority:** HIGH

Enable expressions within array items to access iteration context.

### User Story

As a Puck editor user, I want to use expressions in array field items that reference the current item value and index position, so I can create dynamic, data-driven lists.

**Example use case:**

```typescript
// Puck config with array field
const config = {
  components: {
    ProductList: {
      fields: {
        products: { type: "array" },
        titleTemplate: { type: "text" } // Expression: "Product #" & ($index + 1) & ": " & $item.name
      }
    }
  }
};

// Context data
const context = {
  products: [
    { name: "Widget", price: 10 },
    { name: "Gadget", price: 20 }
  ]
};

// Expected output when rendering:
// titleTemplate for products[0] → "Product #1: Widget"
// titleTemplate for products[1] → "Product #2: Gadget"
```

### Technical Design

#### 1. Config Transformer Enhancement

**Location:** `packages/jsonata/src/config-transformer.tsx`

**Current state:** Only wraps primitive fields (text, number, textarea, select, radio)

**Required changes:**
- Detect array fields in component config
- Wrap array field items with scoped `ExpressionProvider`
- Inject `$item` and `$index` into expression context for each iteration

**Implementation approach:**

```typescript
// Transform array fields to inject scoped context
if (field.type === "array") {
  const originalField = field;

  return {
    ...originalField,
    render: (props) => {
      const { value, onChange } = props;

      return (
        <div>
          {value.map((item, index) => (
            <ExpressionProvider
              key={index}
              context={{ $item: item, $index: index }}
            >
              {/* Render array item fields with scoped context */}
              {originalField.renderItem?.(item, index, onChange)}
            </ExpressionProvider>
          ))}
        </div>
      );
    }
  };
}
```

#### 2. Context Provider Pattern

**Location:** `packages/jsonata/src/components/expression-provider.tsx`

**Enhancement needed:**
- Support nested context providers (parent context + scoped context merge)
- Ensure `$item` and `$index` shadow parent values in nested arrays
- Preserve other context variables during scoping

**Context merging logic:**

```typescript
const mergedContext = {
  ...parentContext,  // Global variables from app
  $item: itemValue,  // Current array element
  $index: position   // Current array position
};
```

#### 3. Test Coverage

**Location:** `packages/jsonata/src/__tests__/expression-resolver.test.ts:64-67`

**Planned tests:**
- Array scoping: `$item` access in simple arrays
- Array scoping: `$index` access for position-based logic
- Nested arrays: Multiple levels of `$item` scoping
- Type safety: Ensure `$item` types match array element types
- Edge cases: Empty arrays, single-item arrays, deeply nested structures

**Example test:**

```typescript
it("evaluates expressions with array scoping ($item and $index)", () => {
  const context = {
    products: [
      { name: "Widget", price: 10 },
      { name: "Gadget", price: 20 }
    ]
  };

  const expression = '"Item #" & ($index + 1) & ": " & $item.name';

  // Expected results when applied to each array item
  expect(resolveExpression(expression, { ...context, $item: context.products[0], $index: 0 }))
    .toBe("Item #1: Widget");

  expect(resolveExpression(expression, { ...context, $item: context.products[1], $index: 1 }))
    .toBe("Item #2: Gadget");
});
```

#### 4. Demo Application Update

**Location:** `apps/web/src/app/demo-vanilla/config.tsx`

**New demo component:**

```typescript
{
  type: "ArrayScoping",
  fields: {
    items: {
      type: "array",
      arrayFields: {
        value: { type: "text" }
      }
    },
    displayTemplate: {
      type: "text",
      label: "Display Template (Expression)",
      // Example: "Item " & ($index + 1) & ": " & $item.value
    }
  },
  defaultProps: {
    items: [
      { value: "First" },
      { value: "Second" },
      { value: "Third" }
    ],
    displayTemplate: "Item " & ($index + 1) & ": " & $item.value
  },
  render: ({ items, displayTemplate }) => (
    <ul>
      {items.map((item, index) => (
        <li key={index}>
          {/* displayTemplate evaluated with $item and $index */}
          {evaluatedDisplayTemplate}
        </li>
      ))}
    </ul>
  )
}
```

### Implementation Checklist

- [ ] Modify `config-transformer.tsx` to detect array fields
- [ ] Wrap array items with scoped `ExpressionProvider`
- [ ] Update `ExpressionProvider` to support nested context merging
- [ ] Add test suite for array scoping (simple, nested, edge cases)
- [ ] Update demo application with array scoping examples
- [ ] Document `$item` and `$index` in package README
- [ ] Create changeset for 0.1.0 release (minor version bump)

### Success Criteria

- [ ] Array expressions correctly access `$item` (current element value)
- [ ] Array expressions correctly access `$index` (0-based position)
- [ ] Nested arrays maintain separate scoping contexts
- [ ] Type safety preserved for `$item` based on array element type
- [ ] No breaking changes to existing configs
- [ ] Test coverage maintains 100% for new code paths
- [ ] Demo shows practical use case (dynamic lists, templates)

### Rollback Plan

**Reversibility:** Type 2B (Easy rollback)
**Estimated rollback time:** < 5 minutes

If array scoping introduces bugs:
1. Revert commits introducing array field transformation
2. Config transformer ignores array fields (current v0.0.1 behavior)
3. Users can still use expressions in primitive fields (no functionality loss)

---

## Future Considerations (Post-0.1.0)

### Object Field Expression Support
- **Complexity:** 5 story points
- **Priority:** MEDIUM
- Enable expressions in object field properties
- Similar scoping pattern to arrays but with `$key` instead of `$index`

### External Field Integration
- **Complexity:** 8 story points
- **Priority:** LOW
- Support expressions for external data sources
- Requires async expression evaluation
- Potential caching layer needed

### Performance Optimization
- **Complexity:** 5 story points
- **Priority:** LOW
- Memoize expression compilation
- Cache evaluation results for identical contexts
- Benchmark with large datasets (>1000 components)

### Expression Debugging UI
- **Complexity:** 13 story points
- **Priority:** LOW
- Visual debugger for expression evaluation
- Show context variables and intermediate results
- Error highlighting with suggestions

---

## Release Strategy

### 0.0.1 Release Process
1. ✓ Changeset created (`.changeset/initial-release.md`)
2. Merge PR to main branch
3. GitHub Actions creates "Version Packages" PR automatically
4. Review and merge version PR
5. GitHub Actions publishes to npm
6. Update Vercel deployment

### 0.1.0 Release Process (After Array Scoping Complete)
1. Create changeset during implementation: `bun changeset`
2. Select `minor` version bump (new feature)
3. Describe array scoping feature in changeset
4. Follow same merge → version PR → publish workflow

---

## Questions / Open Issues

1. **Should `$item` and `$index` be reserved keywords?**
   - Risk: User context variables named `$item` would be shadowed
   - Mitigation: Document reserved keywords in README
   - Decision: Yes, shadow parent context (similar to JavaScript closures)

2. **How to handle deeply nested arrays (3+ levels)?**
   - Option A: Each level shadows previous `$item`/`$index`
   - Option B: Create `$item1`, `$item2`, `$item3` naming
   - Decision: TBD during implementation

3. **Should array scoping work with object arrays only?**
   - Current assumption: Yes (most common use case)
   - Edge case: Primitive arrays like `["a", "b", "c"]`
   - Decision: Support both, `$item` is primitive value for primitive arrays

---

## Confidence Levels

- **0.0.1 Release:** 95% confident (production-ready, well-tested)
- **Array scoping implementation:** 85% confident (clear design, established patterns)
- **Timeline (8 story points):** 70% confident (architecture decisions may surface edge cases)

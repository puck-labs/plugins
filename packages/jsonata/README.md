# @puck-labs/jsonata

JSONata expression engine for [Puck](https://github.com/measuredco/puck) editor. Add dynamic expression evaluation to Puck component properties with zero component changes.

[![npm version](https://img.shields.io/npm/v/@puck-labs/jsonata.svg)](https://www.npmjs.com/package/@puck-labs/jsonata)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- ✅ **Static/Dynamic Mode Switcher** - Toggle between static values and JSONata expressions
- ✅ **Monaco Editor Integration** - Syntax highlighting and autocomplete for expressions
- ✅ **Array Scoping** - Access `$item` and `$index` in array expressions
- ✅ **Type-Safe Evaluation** - Automatic type coercion for field types
- ✅ **Expression Context** - Pass global variables to expressions
- ✅ **Zero Component Changes** - Components remain expression-agnostic
- ✅ **Production Ready** - Comprehensive error handling and test coverage

## Installation

```bash
bun add @puck-labs/jsonata
# or
npm install @puck-labs/jsonata
# or
pnpm add @puck-labs/jsonata
```

## Quick Start

```typescript
import { Puck } from "@measured/puck";
import { withExpressions, ExpressionProvider } from "@puck-labs/jsonata";
import "@puck-labs/jsonata/styles.css";

// 1. Define your Puck config
const config = {
  components: {
    Hero: {
      fields: {
        title: { type: "text", label: "Title" },
        count: { type: "number", label: "Count" },
      },
      render: ({ title, count }) => (
        <div>
          <h1>{title}</h1>
          <p>Count: {count}</p>
        </div>
      ),
    },
  },
};

// 2. Wrap config with expression support
const expressionConfig = withExpressions(config);

// 3. Provide expression context (optional)
function App() {
  const expressionContext = {
    user: { name: "John Doe", role: "admin" },
    apiUrl: "https://api.example.com",
  };

  return (
    <ExpressionProvider value={expressionContext}>
      <Puck config={expressionConfig} data={initialData} />
    </ExpressionProvider>
  );
}
```

Now users can switch any text/number/textarea/select/radio field to "Dynamic" mode and use JSONata expressions:

```jsonata
'Hello, ' & user.name & '!'
```

## Expression Context

Provide global variables accessible in all expressions via `ExpressionProvider`:

```typescript
const context = {
  user: { name: "Alice", role: "editor" },
  apiUrl: "https://api.example.com",
  currentDate: new Date().toISOString(),
};

<ExpressionProvider value={context}>
  <Puck config={config} data={data} />
</ExpressionProvider>
```

Access context variables in expressions:

```jsonata
'API: ' & apiUrl
user.role = 'admin' ? 'Full Access' : 'Limited Access'
$substring(currentDate, 0, 10)
```

## Array Scoping

Use `$item` and `$index` in expressions for array items by wrapping with `ArrayScopeProvider`:

```typescript
import { ArrayScopeProvider } from "@puck-labs/jsonata";

const ProductList = ({ products }) => (
  <ul>
    {products.map((product, index) => (
      <ArrayScopeProvider key={index} item={product} index={index}>
        <li>
          {/* Expressions in child components can now access $item and $index */}
          <ProductCard product={product} />
        </li>
      </ArrayScopeProvider>
    ))}
  </ul>
);
```

**Example expressions with array scoping:**

```jsonata
// Access current item
$item.name & ' - $' & $item.price

// Use index for numbering
'#' & ($index + 1) & ': ' & $item.title

// Conditional based on index
$index = 0 ? '⭐ ' & $item.name : $item.name

// Access nested properties
$item.metadata.category & ' > ' & $item.name
```

### Array Scoping Example Component

```typescript
export type ProductListProps = {
  title: string;
  products: Array<{
    name: string;
    price: number;
    category: string;
  }>;
  itemTemplate: string; // Expression field
};

const ProductList = ({ title, products, itemTemplate }: ProductListProps) => (
  <div>
    <h2>{title}</h2>
    {products.map((product, index) => (
      <ArrayScopeProvider key={index} item={product} index={index}>
        <div>
          {/* itemTemplate can use $item.name, $item.price, $index */}
          {itemTemplate}
        </div>
      </ArrayScopeProvider>
    ))}
  </div>
);

// Puck config
const config = withExpressions({
  components: {
    ProductList: {
      fields: {
        title: { type: "text" },
        products: {
          type: "array",
          arrayFields: {
            name: { type: "text" },
            price: { type: "number" },
            category: { type: "text" },
          },
        },
        itemTemplate: { type: "text" }, // Users can use expressions here
      },
      render: ProductList,
    },
  },
});
```

**Example `itemTemplate` expression:**

```jsonata
'Product #' & ($index + 1) & ': ' & $item.name & ' - $' & $item.price
```

### Nested Arrays

`ArrayScopeProvider` can be nested for multi-level arrays. Inner scopes shadow outer scopes (like JavaScript closures):

```typescript
<ArrayScopeProvider item={category} index={categoryIndex}>
  {category.products.map((product, productIndex) => (
    <ArrayScopeProvider key={productIndex} item={product} index={productIndex}>
      {/* $item = product, $index = productIndex */}
      <ProductCard />
    </ArrayScopeProvider>
  ))}
</ArrayScopeProvider>
```

## Supported Field Types

| Field Type | Expression Support | Notes |
|------------|-------------------|-------|
| `text` | ✅ Full | String expressions |
| `textarea` | ✅ Full | Multi-line string expressions |
| `number` | ✅ Full | Numeric expressions with auto-coercion |
| `select` | ✅ Full | Expression must return valid option value |
| `radio` | ✅ Full | Expression must return valid option value |
| `array` | ✅ Nested | Array items can use expressions (transform arrayFields) |
| `object` | ❌ Planned | Future: Transform objectFields |
| `slot` | ➖ N/A | Not applicable (drag-and-drop zones) |
| `external` | ❌ Planned | Future: Expression-based data fetching |
| `custom` | ➖ Manual | Implement expression support in custom render |

## JSONata Syntax

This library uses [JSONata 2.0](https://docs.jsonata.org/) for expression evaluation.

**Common operators:**

- String concatenation: `'Hello ' & name`
- Arithmetic: `price * 1.1`, `quantity + 5`
- Comparison: `age >= 18`, `status = 'active'`
- Conditional: `condition ? 'yes' : 'no'`
- Array access: `items[0]`, `items[index]`
- Object access: `user.name`, `$item.metadata.category`

**Built-in functions:**

- `$string(value)` - Convert to string
- `$number(value)` - Convert to number
- `$substring(str, start, length?)` - Extract substring
- `$uppercase(str)`, `$lowercase(str)` - Case conversion
- `$sum(array)`, `$count(array)`, `$average(array)` - Array aggregation
- Many more: See [JSONata docs](https://docs.jsonata.org/overview.html)

## API Reference

### `withExpressions(config)`

Transforms a Puck config to add expression support to primitive fields.

**Parameters:**
- `config: Config` - Original Puck configuration

**Returns:** Transformed Puck config with expression-enabled fields

### `ExpressionProvider`

React Context Provider for expression evaluation scope.

**Props:**
- `value: Record<string, unknown>` - Variables accessible in expressions

### `ArrayScopeProvider`

React component for injecting `$item` and `$index` into expression context.

**Props:**
- `item: unknown` - Current array item (accessible as `$item`)
- `index: number` - Current array index (accessible as `$index`)
- `children: ReactNode` - Child components with scoped context

### `useExpressionContext()`

React hook to access current expression context.

**Returns:** `Record<string, unknown>` - Current context variables

### `evaluateExpression(expression, context)`

Manually evaluate a JSONata expression (for advanced use cases).

**Parameters:**
- `expression: string` - JSONata expression
- `context: Record<string, unknown>` - Evaluation context

**Returns:** `Promise<EvaluationResult<T>>`

## Type Safety

The library preserves TypeScript types and includes runtime type coercion:

```typescript
// Number field - expression result coerced to number
const numberField = {
  type: "number",
  label: "Count",
};
// Expression: "10 * 2" → Evaluated to 20 (number)

// Text field - objects/arrays serialized to JSON
const textField = {
  type: "text",
  label: "Data",
};
// Expression: "{ 'key': 'value' }" → Serialized to JSON string
```

## Error Handling

Expression errors are handled gracefully:

- **Syntax errors:** Displayed in Monaco editor with error markers
- **Evaluation errors:** Fallback to previous valid value
- **Type mismatches:** Automatic coercion with fallback to default

## Bundle Size

- **ESM bundle:** ~36 KB (gzipped: ~9.3 KB)
- **CSS (optional):** ~780 B (gzipped)
- Well under 50 KB limit for production use

## Contributing

Contributions welcome! This is an experimental library under active development.

**Development:**

```bash
# Install dependencies
bun install

# Run tests
bun test

# Watch mode
bun test:watch

# Type check
bun check-types

# Build
bun build
```

## License

MIT © Puck Labs

## Related

- [Puck Editor](https://github.com/measuredco/puck) - Visual editor for React
- [JSONata](https://jsonata.org/) - JSON query and transformation language

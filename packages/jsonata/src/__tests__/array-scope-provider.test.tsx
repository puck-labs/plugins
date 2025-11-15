/**
 * Tests for ArrayScopeProvider component
 *
 * Validates:
 * - Context merging ($item and $index injection)
 * - Nested array scoping (multiple levels)
 * - Parent context preservation
 * - Expression evaluation with scoped variables
 */

import { render } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { ArrayScopeProvider } from "../components/array-scope-provider";
import {
  ExpressionProvider,
  useExpressionContext,
} from "../expression-context";

// Test component that displays context values
function ContextDisplay() {
  const context = useExpressionContext();

  return (
    <div data-testid="context-display">{JSON.stringify(context, null, 2)}</div>
  );
}

describe("ArrayScopeProvider", () => {
  describe("basic scoping", () => {
    test("injects $item and $index into context", () => {
      const item = { name: "Test Item", value: 42 };
      const index = 5;

      const { getByTestId } = render(
        <ArrayScopeProvider index={index} item={item}>
          <ContextDisplay />
        </ArrayScopeProvider>
      );

      const contextDisplay = getByTestId("context-display");
      const context = JSON.parse(contextDisplay.textContent || "{}");

      expect(context.$item).toEqual(item);
      expect(context.$index).toBe(index);
    });

    test("works with primitive array items", () => {
      const item = "simple string";
      const index = 0;

      const { getByTestId } = render(
        <ArrayScopeProvider index={index} item={item}>
          <ContextDisplay />
        </ArrayScopeProvider>
      );

      const contextDisplay = getByTestId("context-display");
      const context = JSON.parse(contextDisplay.textContent || "{}");

      expect(context.$item).toBe(item);
      expect(context.$index).toBe(index);
    });

    test("handles null and undefined items", () => {
      const { getByTestId } = render(
        <ArrayScopeProvider index={0} item={null}>
          <ContextDisplay />
        </ArrayScopeProvider>
      );

      const contextDisplay = getByTestId("context-display");
      const context = JSON.parse(contextDisplay.textContent || "{}");

      expect(context.$item).toBeNull();
      expect(context.$index).toBe(0);
    });
  });

  describe("context merging", () => {
    test("merges with parent context", () => {
      const parentContext = {
        user: { name: "John Doe" },
        apiUrl: "https://api.example.com",
      };

      const item = { product: "Widget" };
      const index = 3;

      const { getByTestId } = render(
        <ExpressionProvider value={parentContext}>
          <ArrayScopeProvider index={index} item={item}>
            <ContextDisplay />
          </ArrayScopeProvider>
        </ExpressionProvider>
      );

      const contextDisplay = getByTestId("context-display");
      const context = JSON.parse(contextDisplay.textContent || "{}");

      // Parent context preserved
      expect(context.user).toEqual(parentContext.user);
      expect(context.apiUrl).toBe(parentContext.apiUrl);

      // Scoped variables added
      expect(context.$item).toEqual(item);
      expect(context.$index).toBe(index);
    });

    test("scoped variables shadow parent values (closure-like behavior)", () => {
      const parentContext = {
        $item: { old: "parent value" },
        $index: 999,
        other: "preserved",
      };

      const item = { new: "scoped value" };
      const index = 5;

      const { getByTestId } = render(
        <ExpressionProvider value={parentContext}>
          <ArrayScopeProvider index={index} item={item}>
            <ContextDisplay />
          </ArrayScopeProvider>
        </ExpressionProvider>
      );

      const contextDisplay = getByTestId("context-display");
      const context = JSON.parse(contextDisplay.textContent || "{}");

      // Scoped values shadow parent
      expect(context.$item).toEqual(item);
      expect(context.$index).toBe(index);

      // Other parent values preserved
      expect(context.other).toBe("preserved");
    });
  });

  describe("nested scoping", () => {
    test("handles nested arrays with separate scopes", () => {
      const outerItem = { name: "Outer", inner: [{ name: "Inner" }] };
      const outerIndex = 0;

      const innerItem = { name: "Inner Item" };
      const innerIndex = 2;

      const { getByTestId } = render(
        <ArrayScopeProvider index={outerIndex} item={outerItem}>
          <ArrayScopeProvider index={innerIndex} item={innerItem}>
            <ContextDisplay />
          </ArrayScopeProvider>
        </ArrayScopeProvider>
      );

      const contextDisplay = getByTestId("context-display");
      const context = JSON.parse(contextDisplay.textContent || "{}");

      // Inner scope shadows outer scope
      expect(context.$item).toEqual(innerItem);
      expect(context.$index).toBe(innerIndex);
    });

    test("three-level nesting maintains correct scoping", () => {
      const level1Item = { level: 1 };
      const level2Item = { level: 2 };
      const level3Item = { level: 3 };

      const { getByTestId } = render(
        <ArrayScopeProvider index={1} item={level1Item}>
          <ArrayScopeProvider index={2} item={level2Item}>
            <ArrayScopeProvider index={3} item={level3Item}>
              <ContextDisplay />
            </ArrayScopeProvider>
          </ArrayScopeProvider>
        </ArrayScopeProvider>
      );

      const contextDisplay = getByTestId("context-display");
      const context = JSON.parse(contextDisplay.textContent || "{}");

      // Innermost scope wins
      expect(context.$item).toEqual(level3Item);
      expect(context.$index).toBe(3);
    });
  });

  describe("edge cases", () => {
    test("handles empty object as item", () => {
      const { getByTestId } = render(
        <ArrayScopeProvider index={0} item={{}}>
          <ContextDisplay />
        </ArrayScopeProvider>
      );

      const contextDisplay = getByTestId("context-display");
      const context = JSON.parse(contextDisplay.textContent || "{}");

      expect(context.$item).toEqual({});
      expect(context.$index).toBe(0);
    });

    test("handles zero as index", () => {
      const item = { first: true };

      const { getByTestId } = render(
        <ArrayScopeProvider index={0} item={item}>
          <ContextDisplay />
        </ArrayScopeProvider>
      );

      const contextDisplay = getByTestId("context-display");
      const context = JSON.parse(contextDisplay.textContent || "{}");

      expect(context.$index).toBe(0);
    });

    test("handles large index values", () => {
      const item = { position: "far" };
      const largeIndex = 10_000;

      const { getByTestId } = render(
        <ArrayScopeProvider index={largeIndex} item={item}>
          <ContextDisplay />
        </ArrayScopeProvider>
      );

      const contextDisplay = getByTestId("context-display");
      const context = JSON.parse(contextDisplay.textContent || "{}");

      expect(context.$index).toBe(largeIndex);
    });

    test("handles complex nested objects as items", () => {
      const complexItem = {
        id: 123,
        nested: {
          deep: {
            value: "deeply nested",
            array: [1, 2, 3],
          },
        },
      };

      const { getByTestId } = render(
        <ArrayScopeProvider index={0} item={complexItem}>
          <ContextDisplay />
        </ArrayScopeProvider>
      );

      const contextDisplay = getByTestId("context-display");
      const context = JSON.parse(contextDisplay.textContent || "{}");

      expect(context.$item).toEqual(complexItem);
      expect(context.$item.nested.deep.value).toBe("deeply nested");
    });
  });

  describe("integration with expressions", () => {
    test("scoped context is accessible to child components", () => {
      // This test validates that expressions in child components
      // can access $item and $index from ArrayScopeProvider

      const items = [
        { name: "First", value: 10 },
        { name: "Second", value: 20 },
        { name: "Third", value: 30 },
      ];

      function ItemList() {
        return (
          <div>
            {items.map((item, index) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: Test array with stable items
              <ArrayScopeProvider index={index} item={item} key={index}>
                <ContextDisplay />
              </ArrayScopeProvider>
            ))}
          </div>
        );
      }

      const { container } = render(<ItemList />);
      const displays = container.querySelectorAll(
        '[data-testid="context-display"]'
      );

      expect(displays).toHaveLength(3);

      // Verify each item has correct scoped context
      const context0 = JSON.parse(displays[0]?.textContent || "{}");
      expect(context0.$item).toEqual(items[0]);
      expect(context0.$index).toBe(0);

      const context1 = JSON.parse(displays[1]?.textContent || "{}");
      expect(context1.$item).toEqual(items[1]);
      expect(context1.$index).toBe(1);

      const context2 = JSON.parse(displays[2]?.textContent || "{}");
      expect(context2.$item).toEqual(items[2]);
      expect(context2.$index).toBe(2);
    });
  });
});

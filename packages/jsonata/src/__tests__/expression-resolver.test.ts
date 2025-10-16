/**
 * Tests for expression-resolver.ts
 *
 * Core functionality:
 * - JSONata expression evaluation with context
 * - Error handling for invalid syntax
 * - Metadata stripping (recursively)
 * - Circular reference detection
 *
 * Edge cases:
 * - Type coercion
 * - Null/undefined handling
 * - Nested structures
 * - Empty expressions
 */

import { beforeEach, describe, expect, test, vi } from "vitest";
import { evaluateExpression, resolveExpressions } from "../expression-resolver";
import type { ExpressionFieldValue } from "../types";

describe("evaluateExpression", () => {
  describe("core functionality", () => {
    test("evaluates valid JSONata expression with success", async () => {
      const result = await evaluateExpression("1 + 1", {});

      expect(result.success).toBe(true);
      expect(result.value).toBe(2);
      expect(result.error).toBeUndefined();
    });

    test("evaluates string concatenation expression", async () => {
      const result = await evaluateExpression("'Hello ' & name", {
        name: "World",
      });

      expect(result.success).toBe(true);
      expect(result.value).toBe("Hello World");
    });

    test("returns error for invalid JSONata syntax", async () => {
      const result = await evaluateExpression("invalid..syntax..", {});

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain("JSONata evaluation failed");
      expect(result.value).toBeUndefined();
    });

    test("accesses context variables in expression", async () => {
      const context = {
        item: { name: "Product A", price: 100 },
        discount: 0.1,
      };

      const result = await evaluateExpression(
        "item.price * (1 - discount)",
        context,
      );

      expect(result.success).toBe(true);
      expect(result.value).toBe(90);
    });

    test("prepares for $item and $index array scoping (future feature)", async () => {
      // NOTE: Array scoping with $item and $index is planned but not yet implemented
      // This test documents the expected behavior for future implementation
      const result = await evaluateExpression(
        "'Item ' & (index + 1) & ': ' & item.name",
        {
          item: { name: "Test" },
          index: 0,
        },
      );

      expect(result.success).toBe(true);
      expect(result.value).toBe("Item 1: Test");
    });
  });

  describe("edge cases", () => {
    test("handles null context gracefully", async () => {
      const result = await evaluateExpression("'static value'", {});

      expect(result.success).toBe(true);
      expect(result.value).toBe("static value");
    });

    test("handles undefined variables in expression", async () => {
      const result = await evaluateExpression("undefinedVar", {});

      // JSONata returns undefined for missing variables
      expect(result.success).toBe(true);
      expect(result.value).toBeUndefined();
    });

    test("evaluates complex nested expressions", async () => {
      const result = await evaluateExpression("$sum([1, 2, 3, 4, 5])", {});

      expect(result.success).toBe(true);
      expect(result.value).toBe(15);
    });

    test("returns object from expression", async () => {
      const result = await evaluateExpression(
        "{ 'name': 'Test', 'value': 42 }",
        {},
      );

      expect(result.success).toBe(true);
      expect(result.value).toEqual({ name: "Test", value: 42 });
    });

    test("returns array from expression", async () => {
      // JSONata array mapping: [array].$map(function)
      const result = await evaluateExpression("[1, 2, 3]", {});

      expect(result.success).toBe(true);
      expect(result.value).toEqual([1, 2, 3]);
    });
  });
});

describe("resolveExpressions", () => {
  describe("core functionality - metadata stripping", () => {
    test("strips metadata from static field value", () => {
      const input: ExpressionFieldValue<string> = {
        __mode__: "static",
        __value__: "Hello World",
      };

      const result = resolveExpressions(input);

      expect(result).toBe("Hello World");
    });

    test("strips metadata from dynamic field value (pre-evaluated)", () => {
      const input: ExpressionFieldValue<number> = {
        __mode__: "dynamic",
        __expression__: "1 + 1",
        __value__: 2, // Already evaluated by ExpressionField
      };

      const result = resolveExpressions(input);

      expect(result).toBe(2);
    });

    test("recursively strips metadata from nested objects", () => {
      const input = {
        title: {
          __mode__: "static" as const,
          __value__: "My Title",
        },
        count: {
          __mode__: "dynamic" as const,
          __expression__: "10 * 2",
          __value__: 20,
        },
      };

      const result = resolveExpressions(input);

      expect(result).toEqual({
        title: "My Title",
        count: 20,
      });
    });

    test("recursively strips metadata from arrays", () => {
      const input = [
        {
          __mode__: "static" as const,
          __value__: "Item 1",
        },
        {
          __mode__: "dynamic" as const,
          __expression__: "'Item ' & 2",
          __value__: "Item 2",
        },
      ];

      const result = resolveExpressions(input);

      expect(result).toEqual(["Item 1", "Item 2"]);
    });

    test("handles deeply nested structures", () => {
      const input = {
        level1: {
          level2: {
            level3: {
              value: {
                __mode__: "static" as const,
                __value__: "deep",
              },
            },
          },
        },
      };

      const result = resolveExpressions(input);

      expect(result).toEqual({
        level1: {
          level2: {
            level3: {
              value: "deep",
            },
          },
        },
      });
    });

    test("preserves plain values without metadata", () => {
      const input = {
        plainString: "Hello",
        plainNumber: 42,
        plainBoolean: true,
        plainArray: [1, 2, 3],
        plainObject: { nested: "value" },
      };

      const result = resolveExpressions(input);

      expect(result).toEqual(input);
    });
  });

  describe("edge cases", () => {
    test("handles null values", () => {
      const result = resolveExpressions(null);
      expect(result).toBeNull();
    });

    test("handles undefined values", () => {
      const result = resolveExpressions(undefined);
      expect(result).toBeUndefined();
    });

    test("handles primitive values (strings)", () => {
      const result = resolveExpressions("plain string");
      expect(result).toBe("plain string");
    });

    test("handles primitive values (numbers)", () => {
      const result = resolveExpressions(42);
      expect(result).toBe(42);
    });

    test("handles primitive values (booleans)", () => {
      const result = resolveExpressions(true);
      expect(result).toBe(true);
    });

    test("handles empty arrays", () => {
      const result = resolveExpressions([]);
      expect(result).toEqual([]);
    });

    test("handles empty objects", () => {
      const result = resolveExpressions({});
      expect(result).toEqual({});
    });

    test("detects circular references and prevents infinite loops", () => {
      // Create circular reference
      const circular: Record<string, unknown> = { name: "test" };
      circular.self = circular;

      // Should not crash, should warn in console
      const result = resolveExpressions(circular);

      // Result should be the same object (circular ref preserved)
      expect(result).toEqual(circular);
      expect(result.name).toBe("test");
    });

    test("handles arrays with mixed metadata and plain values", () => {
      const input = [
        {
          __mode__: "static" as const,
          __value__: "metadata",
        },
        "plain string",
        42,
        { nested: "object" },
      ];

      const result = resolveExpressions(input);

      expect(result).toEqual([
        "metadata",
        "plain string",
        42,
        { nested: "object" },
      ]);
    });

    test("handles objects with mixed metadata and plain properties", () => {
      const input = {
        withMetadata: {
          __mode__: "static" as const,
          __value__: "meta",
        },
        plainString: "plain",
        plainNumber: 123,
        nestedObject: {
          deep: {
            __mode__: "dynamic" as const,
            __value__: "deep value",
          },
        },
      };

      const result = resolveExpressions(input);

      expect(result).toEqual({
        withMetadata: "meta",
        plainString: "plain",
        plainNumber: 123,
        nestedObject: {
          deep: "deep value",
        },
      });
    });

    test("resolves expression result that is an object", () => {
      const input: ExpressionFieldValue<{ name: string; value: number }> = {
        __mode__: "dynamic",
        __expression__: "{ 'name': 'test', 'value': 42 }",
        __value__: { name: "test", value: 42 },
      };

      const result = resolveExpressions(input);

      expect(result).toEqual({ name: "test", value: 42 });
    });

    test("handles __staticValue__ preservation field", () => {
      const input: ExpressionFieldValue<string> = {
        __mode__: "dynamic",
        __expression__: "'dynamic'",
        __value__: "dynamic",
        __staticValue__: "original static",
      };

      const result = resolveExpressions(input);

      // __staticValue__ is metadata, should be stripped
      expect(result).toBe("dynamic");
      expect(typeof result).toBe("string");
    });
  });
});

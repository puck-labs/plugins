/**
 * Expression resolver - evaluates JSONata expressions and transforms data
 *
 * Core responsibilities:
 * 1. Recursively traverse data objects/arrays
 * 2. Evaluate dynamic expressions using JSONata
 * 3. Strip metadata (__mode__, __expression__, __value__)
 * 4. Handle errors gracefully with fallback to __value__
 * 5. Detect circular references to prevent stack overflow
 */

import jsonata from "jsonata";
import type {
  EvaluationResult,
  ExpressionContext,
  ExpressionFieldValue,
} from "./types";

/**
 * Check if a value is an expression field value with metadata
 */
function isExpressionFieldValue(value: unknown): value is ExpressionFieldValue {
  if (!value || typeof value !== "object") {
    return false;
  }

  const v = value as Record<string, unknown>;
  return (
    "__mode__" in v &&
    "__value__" in v &&
    (v.__mode__ === "static" || v.__mode__ === "dynamic")
  );
}

/**
 * Evaluate a single JSONata expression with error handling
 *
 * @param expression - JSONata expression string
 * @param context - Variables available in expression scope
 * @returns Promise with evaluation result (success flag and value or error)
 *
 * @example
 * ```typescript
 * await evaluateExpression("'Hello ' & name", { name: "World" })
 * // => { success: true, value: "Hello World" }
 *
 * await evaluateExpression("invalid...", {})
 * // => { success: false, error: "JSONata syntax error: ..." }
 * ```
 */
export async function evaluateExpression<T = unknown>(
  expression: string,
  context: ExpressionContext
): Promise<EvaluationResult<T>> {
  try {
    // Compile and evaluate JSONata expression (async in 2.0+)
    const compiled = jsonata(expression);
    const result = (await compiled.evaluate(context)) as T;

    return {
      success: true,
      value: result,
    };
  } catch (error) {
    // JSONata throws errors for syntax issues or evaluation failures
    const errorMessage = error instanceof Error ? error.message : String(error);

    return {
      success: false,
      error: `JSONata evaluation failed: ${errorMessage}`,
    };
  }
}

/**
 * Resolve a single expression field value
 *
 * **Note:** In dynamic mode, `__value__` is pre-evaluated in ExpressionField's useEffect.
 * This function just unwraps the value - no evaluation happens here.
 *
 * @param fieldValue - Expression field with pre-evaluated value
 * @returns Plain value (already evaluated or static)
 */
function resolveFieldValue<T>(fieldValue: ExpressionFieldValue<T>): T {
  // Just return __value__ - it's always current
  // In static mode: __value__ is the literal value
  // In dynamic mode: __value__ is pre-evaluated by ExpressionField
  return fieldValue.__value__;
}

/**
 * Recursively resolve all expressions in a data structure
 *
 * Strips expression metadata and returns plain values.
 * In dynamic mode, values are already evaluated by ExpressionField.
 *
 * @param data - Data object/array/primitive potentially containing expression metadata
 * @param visited - WeakSet to detect circular references (internal use)
 * @returns Data with all metadata stripped
 *
 * @example
 * ```typescript
 * // Static field
 * resolveExpressions({ title: { __mode__: "static", __value__: "Hello" } })
 * // => { title: "Hello" }
 *
 * // Dynamic field (already evaluated)
 * resolveExpressions({ title: { __mode__: "dynamic", __value__: "John" } })
 * // => { title: "John" }
 * ```
 */
export function resolveExpressions<T = unknown>(
  data: T,
  visited: WeakSet<object> = new WeakSet()
): T {
  // Primitive types - return as-is
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data !== "object") {
    return data;
  }

  // Circular reference detection
  if (visited.has(data as object)) {
    console.warn(
      "[puck-jsonata] Circular reference detected, skipping to prevent infinite loop"
    );
    return data;
  }

  visited.add(data as object);

  // Check if this is an expression field value
  if (isExpressionFieldValue(data)) {
    const resolved = resolveFieldValue(data);
    // If resolved value is an object, recursively resolve it too
    if (resolved !== null && typeof resolved === "object") {
      return resolveExpressions(resolved, visited);
    }
    return resolved as T;
  }

  // Arrays - recursively resolve each item
  if (Array.isArray(data)) {
    return data.map((item) => resolveExpressions(item, visited)) as T;
  }

  // Objects - recursively resolve each property
  const result: Record<string, unknown> = {};

  for (const key in data) {
    if (!Object.hasOwn(data, key)) {
      continue;
    }

    const value = (data as Record<string, unknown>)[key];
    result[key] = resolveExpressions(value, visited);
  }

  return result as T;
}

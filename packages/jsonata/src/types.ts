/**
 * Type definitions for JSONata expression system
 */

import type { Field } from "@measured/puck";

export type ExpressionMode = "static" | "dynamic";

/**
 * Wrapped field value with expression metadata
 * Generic type preserves the original field value type
 */
export type ExpressionFieldValue<T = unknown> = {
  __mode__: ExpressionMode;
  __expression__?: string; // JSONata expression (only in dynamic mode)
  __value__: T; // Actual value (static or evaluated result)
};

/**
 * Legacy type for backwards compatibility
 * @deprecated Use ExpressionFieldValue instead
 */
export type ExpressionConfig = {
  mode: ExpressionMode;
  value: unknown;
  expression?: string;
};

export type ExpressionContext = {
  $item?: unknown;
  $index?: number;
  [key: string]: unknown;
};

export type EvaluationResult<T = unknown> = {
  success: boolean;
  value?: T;
  error?: string;
};

/**
 * Primitive field types that can be wrapped with expression support
 * Arrays, objects, slots, external, and custom fields are handled separately
 */
export type PrimitiveFieldType =
  | "text"
  | "textarea"
  | "number"
  | "select"
  | "radio";

/**
 * Type guard to check if a field is a primitive type
 */
export function isPrimitiveField(
  field: Field,
): field is Field & { type: PrimitiveFieldType } {
  return ["text", "textarea", "number", "select", "radio"].includes(field.type);
}

/**
 * Type definitions for JSONata expression system
 */

export type ExpressionMode = "static" | "dynamic";

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

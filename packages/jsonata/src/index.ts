/**
 * @puck-labs/jsonata
 * JSONata expression support for Puck editor
 *
 * Provides dynamic expression evaluation for Puck component properties
 * while maintaining zero awareness in components (headless-first architecture).
 */

// Re-export jsonata for convenience
export { default as jsonata } from "jsonata";
export { withExpressions } from "./config-transformer";
export { ExpressionField } from "./components/ExpressionField";
export type {
  ExpressionConfig,
  ExpressionMode,
  ExpressionFieldValue,
  PrimitiveFieldType,
  ExpressionContext,
  EvaluationResult,
} from "./types";
export { isPrimitiveField } from "./types";

// Expression evaluation functions
export { resolveExpressions, evaluateExpression } from "./expression-resolver";

// React Context for expression scope
export {
  ExpressionContext,
  ExpressionProvider,
  useExpressionContext,
} from "./expression-context";

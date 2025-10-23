/**
 * @puck-labs/jsonata
 * JSONata expression support for Puck editor
 *
 * Provides dynamic expression evaluation for Puck component properties
 * while maintaining zero awareness in components (headless-first architecture).
 */

// Re-export jsonata for convenience
export { default as jsonata } from "jsonata";
export { ExpressionField } from "./components/expression-field";
export { withExpressions } from "./config-transformer";
// React Context for expression scope
export {
  ExpressionContext,
  ExpressionProvider,
  useExpressionContext,
} from "./expression-context";
// Expression evaluation functions
export { evaluateExpression, resolveExpressions } from "./expression-resolver";
export type {
  EvaluationResult,
  ExpressionConfig,
  ExpressionFieldValue,
  ExpressionMode,
  PrimitiveFieldType,
} from "./types";
export { isPrimitiveField } from "./types";

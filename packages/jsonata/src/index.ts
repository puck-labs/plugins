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
export type { ExpressionConfig, ExpressionMode } from "./types";

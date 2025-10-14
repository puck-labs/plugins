/**
 * React Context for expression evaluation scope
 *
 * Provides variables accessible in JSONata expressions (user data, $item, $index, etc.)
 * Components that need expression evaluation should wrap with ExpressionProvider.
 *
 * @example
 * ```typescript
 * import { ExpressionProvider } from '@puck-labs/jsonata';
 *
 * function App() {
 *   const expressionContext = {
 *     user: { name: "John Doe", role: "admin" },
 *     currentTime: new Date().toISOString(),
 *   };
 *
 *   return (
 *     <ExpressionProvider value={expressionContext}>
 *       <Puck config={config} data={data} />
 *     </ExpressionProvider>
 *   );
 * }
 * ```
 */

import { createContext, useContext } from "react";
import type { ExpressionContext as ExpressionContextType } from "./types";

/**
 * React Context for expression evaluation scope
 * Contains variables available in JSONata expressions
 */
export const ExpressionContext = createContext<ExpressionContextType>({});

/**
 * Provider component for expression context
 * Alias for ExpressionContext.Provider for cleaner usage
 *
 * @example
 * ```typescript
 * <ExpressionProvider value={{ user: { name: "John" } }}>
 *   <Puck config={config} data={data} />
 * </ExpressionProvider>
 * ```
 */
export const ExpressionProvider = ExpressionContext.Provider;

/**
 * Hook to access expression context
 * Returns current expression evaluation scope
 *
 * @returns Expression context with available variables
 *
 * @example
 * ```typescript
 * function MyComponent() {
 *   const context = useExpressionContext();
 *   // context = { user: { name: "John" }, ... }
 * }
 * ```
 */
export function useExpressionContext(): ExpressionContextType {
  return useContext(ExpressionContext);
}

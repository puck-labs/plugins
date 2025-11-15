/**
 * ArrayScopeProvider - Helper component for providing scoped context to array items
 *
 * This component allows users to manually add $item and $index context for array expressions.
 * Use this in your component's render function to wrap array item rendering.
 *
 * @example
 * ```typescript
 * render: ({ items }) => (
 *   <ul>
 *     {items.map((item, index) => (
 *       <ArrayScopeProvider key={index} item={item} index={index}>
 *         <li>{item.label}</li>
 *       </ArrayScopeProvider>
 *     ))}
 *   </ul>
 * )
 * ```
 */

import type { ReactNode } from "react";
import { ExpressionContext, useExpressionContext } from "../expression-context";

export type ArrayScopeProviderProps = {
  /**
   * Current array item value (accessible as $item in expressions)
   */
  item: unknown;

  /**
   * Current array index position (accessible as $index in expressions)
   */
  index: number;

  /**
   * Child components that will have access to scoped context
   */
  children: ReactNode;
};

/**
 * ArrayScopeProvider component
 * Merges parent context with scoped $item and $index variables
 */
export function ArrayScopeProvider({
  item,
  index,
  children,
}: ArrayScopeProviderProps) {
  // Get parent context
  const parentContext = useExpressionContext();

  // Merge parent context with scoped variables
  // $item and $index shadow any parent values (like JavaScript closures)
  const scopedContext = {
    ...parentContext,
    $item: item,
    $index: index,
  };

  return (
    <ExpressionContext.Provider value={scopedContext}>
      {children}
    </ExpressionContext.Provider>
  );
}

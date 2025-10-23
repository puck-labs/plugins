/**
 * Config transformer for adding JSONata expression support
 *
 * Transforms Puck config to wrap primitive fields with ExpressionField component,
 * enabling static/dynamic mode switching for text, number, textarea, select, and radio fields.
 */

import type { Config, Field } from "@measured/puck";
import { ExpressionField } from "./components/expression-field";
import { resolveExpressions } from "./expression-resolver";
import { isPrimitiveField } from "./types";

/**
 * Transform a Puck config to add expression support to primitive fields
 *
 * @param config - Original Puck configuration
 * @returns Transformed config with expression-enabled fields
 *
 * @example
 * ```typescript
 * import { withExpressions } from '@puck-labs/jsonata';
 *
 * const config = {
 *   components: {
 *     MyComponent: {
 *       fields: {
 *         title: { type: 'text', label: 'Title' },
 *         count: { type: 'number', label: 'Count' },
 *       },
 *       render: MyComponent,
 *     },
 *   },
 * };
 *
 * const expressionConfig = withExpressions(config);
 * ```
 */
export function withExpressions<T extends Config>(config: T): T {
  // Shallow clone to avoid mutating original, but preserve function references
  const transformedConfig = { ...config, components: { ...config.components } };

  // Traverse each component in the config
  for (const componentKey in transformedConfig.components) {
    if (!Object.hasOwn(transformedConfig.components, componentKey)) {
      continue;
    }

    const component = config.components[componentKey];

    if (!component?.fields) {
      continue;
    }

    // Clone component and transform its fields + render function
    // Create wrapper component to resolve expression metadata
    const OriginalRender = component.render;
    const RenderWithExpressions = (props: unknown) => {
      // Strip expression metadata from props
      // Values are already evaluated in ExpressionField
      const resolvedProps = resolveExpressions(props);

      // Call original render with clean props
      return OriginalRender(resolvedProps as any);
    };

    transformedConfig.components[componentKey] = {
      ...component,
      fields: transformFields(component.fields),
      render: RenderWithExpressions,
    };
  }

  return transformedConfig as T;
}

/**
 * Transform fields object recursively
 * Wraps primitive fields with ExpressionField, leaves complex fields unchanged
 */
function transformFields(fields: unknown): Record<string, Field> {
  const transformedFields: Record<string, Field> = {};

  // Type guard to ensure fields is an object
  if (!fields || typeof fields !== "object") {
    return transformedFields;
  }

  const fieldsObj = fields as Record<string, Field>;

  for (const fieldKey in fieldsObj) {
    if (!Object.hasOwn(fieldsObj, fieldKey)) {
      continue;
    }

    const field = fieldsObj[fieldKey];

    if (!field) {
      continue;
    }

    // Check if this is a primitive field that should be wrapped
    if (isPrimitiveField(field)) {
      // Transform primitive field to custom field with ExpressionField render
      transformedFields[fieldKey] = {
        type: "custom",
        label: field.label,
        render: ({ id, onChange, value }) => {
          // ✅ Use JSX for proper React reconciliation
          return (
            <ExpressionField
              field={field}
              id={id}
              onChange={onChange}
              value={value}
            />
          );
        },
      };
    } else {
      // Leave complex fields unchanged (array, object, slot, external, custom)
      // These will be handled in future iterations
      transformedFields[fieldKey] = field;
    }
  }

  return transformedFields;
}

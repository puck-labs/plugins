/**
 * ExpressionField - Custom field wrapper with static/dynamic mode tabs
 *
 * This component wraps any Puck field to add JSONata expression support.
 * - Static tab: Renders the original field using AutoField
 * - Dynamic tab: Shows Monaco editor for JSONata expressions with async evaluation
 */

import { useState, useEffect, useRef } from "react";
import { AutoField, FieldLabel } from "@measured/puck";
import type { Field } from "@measured/puck";
import { Editor } from "@monaco-editor/react";
import type { ExpressionFieldValue, ExpressionMode } from "../types";
import { evaluateExpression } from "../expression-resolver";
import { useExpressionContext } from "../expression-context";

/**
 * Coerce evaluation result to match field type
 * Prevents React crashes when expressions return objects for primitive fields
 */
function coerceValueForField<T>(value: unknown, field: Field): T {
  const fieldType = field.type;

  // For text/textarea fields, serialize objects/arrays to JSON
  if (fieldType === "text" || fieldType === "textarea") {
    if (typeof value === "object" && value !== null) {
      return JSON.stringify(value, null, 2) as T;
    }
    return String(value) as T;
  }

  // For number fields, parse to number
  if (fieldType === "number") {
    if (typeof value === "number") return value as T;
    const parsed = Number(value);
    return (Number.isNaN(parsed) ? 0 : parsed) as T;
  }

  // For select/radio, ensure string value
  if (fieldType === "select" || fieldType === "radio") {
    return String(value) as T;
  }

  // For other field types, return as-is
  return value as T;
}

export type ExpressionFieldProps<T = unknown> = {
  /**
   * The original Puck field configuration
   */
  field: Field;

  /**
   * Field identifier
   */
  id?: string;

  /**
   * Current field value (wrapped with expression metadata)
   */
  value: ExpressionFieldValue<T>;

  /**
   * Callback when value changes
   */
  onChange: (value: ExpressionFieldValue<T>) => void;

  /**
   * Read-only mode
   */
  readOnly?: boolean;
};

/**
 * ExpressionField component
 * Provides static/dynamic tabs with async expression evaluation
 */
export function ExpressionField<T = unknown>({
  field,
  id,
  value,
  onChange,
  readOnly = false,
}: ExpressionFieldProps<T>) {
  // Normalize incoming value
  const normalizedValue: ExpressionFieldValue<T> =
    value && typeof value === "object" && "__mode__" in value
      ? (value as ExpressionFieldValue<T>)
      : {
          __mode__: "static",
          __value__: value as T,
          __expression__: undefined,
        };

  const [currentMode, setCurrentMode] = useState<ExpressionMode>(
    normalizedValue.__mode__,
  );

  // Debounced expression state (300ms delay)
  const [debouncedExpression, setDebouncedExpression] = useState<
    string | undefined
  >(normalizedValue.__expression__);

  // Race protection: version counter for async evaluations
  const evaluationVersion = useRef(0);

  // Get expression context for evaluation
  const context = useExpressionContext();

  // Update mode when value changes externally
  useEffect(() => {
    setCurrentMode(normalizedValue.__mode__);
  }, [normalizedValue.__mode__]);

  // Debounce expression changes (typing)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedExpression(normalizedValue.__expression__);
    }, 300);

    return () => clearTimeout(timer);
  }, [normalizedValue.__expression__]);

  // Async evaluation effect
  useEffect(() => {
    // Only evaluate in dynamic mode with non-empty expression
    if (
      currentMode !== "dynamic" ||
      !debouncedExpression ||
      !debouncedExpression.trim()
    ) {
      return;
    }

    // Increment version for race protection
    evaluationVersion.current += 1;
    const currentVersion = evaluationVersion.current;

    // Evaluate async
    (async () => {
      const result = await evaluateExpression<T>(
        debouncedExpression.trim(),
        context,
      );

      // Only apply if this is still the latest evaluation
      if (currentVersion === evaluationVersion.current) {
        // Coerce result to match field type (prevents React crashes)
        const coercedValue = result.success
          ? coerceValueForField<T>(result.value, field)
          : normalizedValue.__value__;

        onChange({
          __mode__: "dynamic",
          __expression__: normalizedValue.__expression__,
          __value__: coercedValue,
        });
      }
    })();
  }, [debouncedExpression, context, currentMode]); // Context changes trigger re-evaluation

  const handleModeChange = (newMode: ExpressionMode) => {
    setCurrentMode(newMode);
    onChange({
      ...normalizedValue,
      __mode__: newMode,
    });
  };

  const handleStaticValueChange = (newValue: T) => {
    onChange({
      ...normalizedValue,
      __value__: newValue,
    });
  };

  const handleExpressionChange = (newExpression: string | undefined) => {
    onChange({
      ...normalizedValue,
      __expression__: newExpression,
    });
  };

  return (
    <div className="puck-jsonata-field">
      {/* Field Label */}
      {field.label && (
        <FieldLabel label={field.label} icon={undefined} el="label" />
      )}

      {/* Tab Switcher */}
      <div className="puck-jsonata-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={currentMode === "static"}
          className="puck-jsonata-tab"
          data-active={currentMode === "static"}
          onClick={() => handleModeChange("static")}
          disabled={readOnly}
        >
          Static
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={currentMode === "dynamic"}
          className="puck-jsonata-tab"
          data-active={currentMode === "dynamic"}
          onClick={() => handleModeChange("dynamic")}
          disabled={readOnly}
        >
          Dynamic
        </button>
      </div>

      {/* Tab Content */}
      <div className="puck-jsonata-content">
        {currentMode === "static" ? (
          <div role="tabpanel">
            <AutoField
              field={field}
              id={id}
              onChange={handleStaticValueChange}
              value={normalizedValue.__value__}
              readOnly={readOnly}
            />
          </div>
        ) : (
          <div role="tabpanel">
            <div className="puck-jsonata-editor">
              <Editor
                height="200px"
                defaultLanguage="javascript"
                value={normalizedValue.__expression__ ?? ""}
                onChange={handleExpressionChange}
                options={{
                  minimap: { enabled: false },
                  lineNumbers: "on",
                  scrollBeyondLastLine: false,
                  wordWrap: "on",
                  readOnly,
                  fontSize: 13,
                  tabSize: 2,
                  theme: "vs",
                }}
              />
            </div>
            <p className="puck-jsonata-help">
              Enter a JSONata expression to evaluate dynamically
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

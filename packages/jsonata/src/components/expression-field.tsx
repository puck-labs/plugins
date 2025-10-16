/**
 * ExpressionField - Custom field wrapper with static/dynamic mode tabs
 *
 * This component wraps any Puck field to add JSONata expression support.
 * - Static tab: Renders the original field using AutoField
 * - Dynamic tab: Shows Monaco editor for JSONata expressions with async evaluation
 */

import type { Field } from "@measured/puck";
import { AutoField, FieldLabel } from "@measured/puck";
import { Editor, type OnMount } from "@monaco-editor/react";
import type * as Monaco from "monaco-editor";
import { useEffect, useRef, useState } from "react";
import { useExpressionContext } from "../expression-context";
import { evaluateExpression } from "../expression-resolver";
import { createJsonataCompletionProvider } from "../monaco/jsonata-completion";
import { registerJsonataLanguage } from "../monaco/jsonata-language";
import type { ExpressionFieldValue, ExpressionMode } from "../types";

/**
 * Debounce delay for expression evaluation (milliseconds)
 * Prevents excessive evaluations while user is typing
 */
const EXPRESSION_DEBOUNCE_MS = 300;

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
    if (typeof value === "number") {
      return value as T;
    }
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
          __staticValue__: value as T, // Preserve original static value
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

  // Store latest normalized value in ref to read in effect without triggering re-evaluation
  const normalizedValueRef = useRef(normalizedValue);
  normalizedValueRef.current = normalizedValue;

  // Store onChange in ref to avoid dependency issues
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Get expression context for evaluation
  const context = useExpressionContext();

  // Track if Monaco language has been registered
  const monacoRegisteredRef = useRef(false);

  // Handle Monaco editor mount - register JSONata language and completion
  const handleEditorMount: OnMount = (editor, monaco) => {
    if (monacoRegisteredRef.current) {
      return; // Already registered
    }

    try {
      // Register JSONata language with syntax highlighting
      registerJsonataLanguage(monaco);

      // Register JSONata completion provider
      const provider = createJsonataCompletionProvider(monaco, () => context);
      monaco.languages.registerCompletionItemProvider("jsonata", provider);

      monacoRegisteredRef.current = true;
    } catch (error) {
      console.error("Error registering JSONata language:", error);
    }
  };

  // Debounce expression changes (typing)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedExpression(normalizedValue.__expression__);
    }, EXPRESSION_DEBOUNCE_MS);

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

    // Capture current mode to check if it changed during async evaluation
    const modeAtEvalStart = currentMode;

    // Evaluate async
    (async () => {
      const result = await evaluateExpression<T>(
        debouncedExpression.trim(),
        context,
      );

      // Only apply if:
      // 1. This is still the latest evaluation (version check)
      // 2. Mode hasn't changed from dynamic to static during evaluation
      if (
        currentVersion === evaluationVersion.current &&
        modeAtEvalStart === currentMode &&
        currentMode === "dynamic"
      ) {
        const latestNormalizedValue = normalizedValueRef.current;

        // Coerce result to match field type (prevents React crashes)
        const coercedValue = result.success
          ? coerceValueForField<T>(result.value, field)
          : latestNormalizedValue.__value__;

        onChangeRef.current({
          __mode__: "dynamic",
          __expression__: latestNormalizedValue.__expression__,
          __value__: coercedValue,
          __staticValue__: latestNormalizedValue.__staticValue__, // Preserve original static value
        });
      }
    })();
  }, [debouncedExpression, context, currentMode, field]); // Context and field type changes trigger re-evaluation

  const handleModeChange = (newMode: ExpressionMode) => {
    setCurrentMode(newMode);

    // When switching to static mode, restore the original static value
    if (newMode === "static" && normalizedValue.__staticValue__ !== undefined) {
      onChange({
        ...normalizedValue,
        __mode__: newMode,
        __value__: normalizedValue.__staticValue__, // Restore original static value
      });
    } else {
      onChange({
        ...normalizedValue,
        __mode__: newMode,
      });
    }
  };

  const handleStaticValueChange = (newValue: T) => {
    onChange({
      ...normalizedValue,
      __value__: newValue,
      __staticValue__: newValue, // Keep static value in sync when user edits
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
        <FieldLabel el="label" icon={undefined} label={field.label} />
      )}

      {/* Tab Switcher */}
      <div className="puck-jsonata-tabs" role="tablist">
        <button
          aria-selected={currentMode === "static"}
          className="puck-jsonata-tab"
          data-active={currentMode === "static"}
          disabled={readOnly}
          onClick={() => handleModeChange("static")}
          role="tab"
          type="button"
        >
          Static
        </button>
        <button
          aria-selected={currentMode === "dynamic"}
          className="puck-jsonata-tab"
          data-active={currentMode === "dynamic"}
          disabled={readOnly}
          onClick={() => handleModeChange("dynamic")}
          role="tab"
          type="button"
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
              readOnly={readOnly}
              value={normalizedValue.__value__}
            />
          </div>
        ) : (
          <div role="tabpanel">
            <div className="puck-jsonata-editor">
              <Editor
                defaultLanguage="jsonata"
                height="200px"
                onChange={handleExpressionChange}
                onMount={handleEditorMount}
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
                value={normalizedValue.__expression__ ?? ""}
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

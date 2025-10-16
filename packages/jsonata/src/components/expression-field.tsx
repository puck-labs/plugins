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
import { useCallback, useEffect, useRef, useState } from "react";
import { useExpressionContext } from "../expression-context";
import { evaluateExpression } from "../expression-resolver";
import {
  createJsonataCompletionProvider,
  createJsonataHoverProvider,
} from "../monaco/jsonata-completion";
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
    normalizedValue.__mode__
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
  const contextRef = useRef(context);
  contextRef.current = context;

  // Monaco references
  const monacoRef = useRef<typeof Monaco | null>(null);
  const editorRef =
    useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const disposablesRef = useRef<Monaco.IDisposable[]>([]);

  // Track if Monaco language has been registered
  const monacoRegisteredRef = useRef(false);

  const [evaluationError, setEvaluationError] = useState<string | undefined>(
    normalizedValue.__error__
  );
  const evaluationErrorRef = useRef<string | undefined>(evaluationError);
  evaluationErrorRef.current = evaluationError;

  const emitChange = useCallback(
    (nextValue: ExpressionFieldValue<T>) => {
      normalizedValueRef.current = nextValue;
      try {
        onChangeRef.current(nextValue);
      } catch (error) {
        console.error("[puck-jsonata] onChange handler threw:", error);
      }
    },
    []
  );

  // Handle Monaco editor mount - register JSONata language and completion
  const handleEditorMount: OnMount = useCallback(
    (editor, monaco) => {
      editorRef.current = editor;
      monacoRef.current = monaco;

      if (!monacoRegisteredRef.current) {
        try {
          registerJsonataLanguage(monaco);
        } catch (error) {
          console.error("Error registering JSONata language:", error);
        }
        monacoRegisteredRef.current = true;
      }

      disposablesRef.current.forEach((disposable) => disposable.dispose());
      disposablesRef.current = [];

      try {
        disposablesRef.current.push(
          monaco.languages.registerCompletionItemProvider(
            "jsonata",
            createJsonataCompletionProvider(monaco, () => contextRef.current)
          )
        );

        disposablesRef.current.push(
          monaco.languages.registerHoverProvider(
            "jsonata",
            createJsonataHoverProvider(monaco, () => contextRef.current)
          )
        );
      } catch (error) {
        console.error("Error registering JSONata providers:", error);
      }
    },
    []
  );

  const handleEditorUnmount = useCallback(() => {
    const monaco = monacoRef.current;
    const editor = editorRef.current;
    if (monaco && editor) {
      const model = editor.getModel();
      if (model) {
        monaco.editor.setModelMarkers(model, "jsonata-evaluation", []);
      }
    }

    disposablesRef.current.forEach((disposable) => disposable.dispose());
    disposablesRef.current = [];

    editorRef.current = null;
    monacoRef.current = null;
  }, []);

  // Debounce expression changes (typing)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedExpression(normalizedValue.__expression__);
    }, EXPRESSION_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [normalizedValue.__expression__]);

  // Async evaluation effect
  useEffect(() => {
    if (currentMode !== "dynamic") {
      return;
    }

    const trimmedExpression = debouncedExpression?.trim();

    if (!trimmedExpression) {
      if (evaluationErrorRef.current !== undefined) {
        setEvaluationError(undefined);
      }

      const latest = normalizedValueRef.current;
      if (latest.__error__) {
        const clearedValue: ExpressionFieldValue<T> = {
          ...latest,
        };
        delete clearedValue.__error__;
        emitChange(clearedValue);
      }

      return;
    }

    evaluationVersion.current += 1;
    const currentVersion = evaluationVersion.current;
    const modeAtEvalStart = currentMode;

    (async () => {
      const result = await evaluateExpression<T>(trimmedExpression, context);

      if (
        currentVersion !== evaluationVersion.current ||
        modeAtEvalStart !== currentMode ||
        currentMode !== "dynamic"
      ) {
        return;
      }

      const latest = normalizedValueRef.current;
      const nextValue: ExpressionFieldValue<T> = {
        ...latest,
        __mode__: "dynamic",
        __expression__: latest.__expression__,
        __staticValue__: latest.__staticValue__,
      };

      if (result.success) {
        nextValue.__value__ = coerceValueForField<T>(result.value, field);
        if (evaluationErrorRef.current !== undefined) {
          setEvaluationError(undefined);
        }
        delete nextValue.__error__;
      } else {
        nextValue.__value__ = latest.__value__;
        nextValue.__error__ =
          result.error ?? "JSONata evaluation failed";
        if (evaluationErrorRef.current !== nextValue.__error__) {
          setEvaluationError(nextValue.__error__);
        }
      }

      emitChange(nextValue);
    })();
  }, [context, currentMode, debouncedExpression, emitChange, field]);

  // Sync local error state with incoming metadata
  useEffect(() => {
    if (currentMode !== "dynamic") {
      if (evaluationError !== undefined) {
        setEvaluationError(undefined);
      }
      return;
    }

    const incomingError = normalizedValue.__error__;
    if (incomingError && incomingError !== evaluationErrorRef.current) {
      setEvaluationError(incomingError);
    }
    if (!incomingError && evaluationErrorRef.current) {
      setEvaluationError(undefined);
    }
  }, [currentMode, normalizedValue.__error__]);

  // Update Monaco markers when error state changes
  useEffect(() => {
    const monaco = monacoRef.current;
    const editor = editorRef.current;
    if (!monaco || !editor) {
      return;
    }

    const model = editor.getModel();
    if (!model) {
      return;
    }

    if (currentMode !== "dynamic" || !evaluationError) {
      monaco.editor.setModelMarkers(model, "jsonata-evaluation", []);
      return;
    }

    const lastLine = Math.max(model.getLineCount(), 1);
    monaco.editor.setModelMarkers(model, "jsonata-evaluation", [
      {
        message: evaluationError,
        severity: monaco.MarkerSeverity.Error,
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: lastLine,
        endColumn: model.getLineMaxColumn(lastLine),
      },
    ]);
  }, [currentMode, evaluationError]);

  const handleModeChange = (newMode: ExpressionMode) => {
    setCurrentMode(newMode);

    const nextValue: ExpressionFieldValue<T> = {
      ...normalizedValue,
      __mode__: newMode,
    };

    delete nextValue.__error__;
    if (evaluationErrorRef.current !== undefined) {
      setEvaluationError(undefined);
    }

    if (newMode === "static") {
      if (normalizedValue.__staticValue__ !== undefined) {
        nextValue.__value__ = normalizedValue.__staticValue__;
      }
    }

    emitChange(nextValue);
  };

  const handleStaticValueChange = (newValue: T) => {
    const nextValue: ExpressionFieldValue<T> = {
      ...normalizedValue,
      __value__: newValue,
      __staticValue__: newValue,
    };

    delete nextValue.__error__;
    emitChange(nextValue);
  };

  const handleExpressionChange = (newExpression: string | undefined) => {
    if (evaluationErrorRef.current !== undefined) {
      setEvaluationError(undefined);
    }

    const nextValue: ExpressionFieldValue<T> = {
      ...normalizedValue,
      __expression__: newExpression,
    };

    delete nextValue.__error__;
    emitChange(nextValue);
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
                onUnmount={handleEditorUnmount}
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

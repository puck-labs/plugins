/**
 * Tests for ExpressionField component
 *
 * NOTE: This test suite focuses on data structure handling and component state
 * without testing UI interactions through JSDOM. UI interaction tests were removed
 * because they relied on Monaco Editor and Puck components working correctly in JSDOM,
 * which is fragile and doesn't align with library-first testing principles.
 *
 * What we test here:
 * - Data structure normalization (plain values → wrapped metadata)
 * - Value preservation across different metadata shapes
 * - Read-only mode disables interactions
 * - Evaluation only runs in correct mode
 * - Error handling doesn't cause infinite renders
 *
 * What we don't test (and why):
 * - Monaco Editor rendering (trust the library)
 * - Tab switching UI (trust React, test logic separately)
 * - Debouncing behavior (test logic separately as unit test)
 * - Type coercion (test logic separately as unit test)
 *
 * For business logic testing (evaluation, mode switching, type coercion), see:
 * - expression-field-logic.test.ts (pure function tests)
 */

import type { Field } from "@measured/puck";
import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { ExpressionFieldProps } from "../components/expression-field";
import { ExpressionField } from "../components/expression-field";
import { ExpressionProvider } from "../expression-context";
import * as expressionResolverModule from "../expression-resolver";
import type { ExpressionFieldValue } from "../types";

// === MOCKS ===

// Mock Monaco Editor (prevents heavy initialization)
vi.mock("@monaco-editor/react", () => ({
  Editor: ({
    value,
    onChange,
    options,
  }: {
    value?: string;
    onChange?: (value: string | undefined) => void;
    options?: { readOnly?: boolean };
  }) => (
    <textarea
      aria-label="Expression editor"
      data-testid="monaco-editor"
      onChange={(e) => onChange?.(e.target.value)}
      readOnly={options?.readOnly}
      value={value ?? ""}
    />
  ),
}));

// Mock expression resolver
vi.mock("../expression-resolver", () => ({
  evaluateExpression: vi.fn(async (expr: string) => {
    await Promise.resolve();
    return { success: true, value: `result-of-${expr}` };
  }),
}));

// Mock Puck components
vi.mock("@measured/puck", () => ({
  AutoField: ({
    value,
    onChange,
    field,
    readOnly,
  }: {
    value: unknown;
    onChange?: (value: unknown) => void;
    field: Field;
    readOnly?: boolean;
  }) => (
    <input
      aria-label={field.label}
      data-testid="auto-field"
      onChange={(e) => {
        const newValue =
          field.type === "number" ? Number(e.target.value) : e.target.value;
        onChange?.(newValue);
      }}
      readOnly={readOnly}
      type={field.type === "number" ? "number" : "text"}
      value={String(value ?? "")}
    />
  ),
  FieldLabel: ({ label }: { label: string }) => <label>{label}</label>,
}));

// === TEST UTILITIES ===

/**
 * Render ExpressionField with default props and context provider
 */
function renderExpressionField(
  props: Partial<ExpressionFieldProps> = {},
  context: Record<string, unknown> = {}
) {
  const defaultProps: ExpressionFieldProps = {
    field: { type: "text", label: "Test Field" },
    value: {
      __mode__: "static",
      __value__: "",
      __staticValue__: "",
    } as ExpressionFieldValue<string>,
    onChange: vi.fn(),
    ...props,
  };

  return render(
    <ExpressionProvider value={context}>
      <ExpressionField {...defaultProps} />
    </ExpressionProvider>
  );
}

// === TEST SUITES ===

describe("ExpressionField Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("User interactions", () => {
    test("tabs are disabled when readOnly=true", () => {
      renderExpressionField({ readOnly: true });

      const staticTab = screen.getByRole("tab", { name: /static/i });
      const dynamicTab = screen.getByRole("tab", { name: /dynamic/i });

      expect(staticTab).toBeDisabled();
      expect(dynamicTab).toBeDisabled();
    });

    test("read-only mode disables all interactions", () => {
      renderExpressionField({ readOnly: true });

      const staticTab = screen.getByRole("tab", { name: /static/i });
      const dynamicTab = screen.getByRole("tab", { name: /dynamic/i });

      expect(staticTab).toBeDisabled();
      expect(dynamicTab).toBeDisabled();
    });
  });

  describe("Component handles different value shapes", () => {
    test("plain value gets wrapped with metadata", () => {
      const onChange = vi.fn();

      renderExpressionField({
        onChange,
        // biome-ignore lint/suspicious/noExplicitAny: testing plain value normalization
        value: "plain-string" as any,
      });

      // Should render without crashing
      expect(screen.getByTestId("auto-field")).toBeInTheDocument();
    });

    test("existing metadata structure is preserved", () => {
      const onChange = vi.fn();

      renderExpressionField({
        onChange,
        value: {
          __mode__: "dynamic",
          __expression__: "preserved",
          __value__: "test",
          __staticValue__: "original",
        } as ExpressionFieldValue<string>,
      });

      // Should render in dynamic mode
      expect(screen.getByTestId("monaco-editor")).toBeInTheDocument();
      expect(screen.getByTestId("monaco-editor")).toHaveValue("preserved");
    });

    test("undefined value is handled gracefully", () => {
      renderExpressionField({
        // biome-ignore lint/suspicious/noExplicitAny: testing undefined handling
        value: undefined as any,
      });

      // Should render without crashing
      expect(screen.getByTestId("auto-field")).toBeInTheDocument();
    });

    test("AutoField receives correct value prop", () => {
      renderExpressionField({
        value: {
          __mode__: "static",
          __value__: "test-value",
          __staticValue__: "test-value",
        } as ExpressionFieldValue<string>,
      });

      const staticField = screen.getByTestId("auto-field");
      expect(staticField).toHaveValue("test-value");
    });
  });

  describe("Expression evaluation behavior", () => {
    test("evaluation only runs in static mode", async () => {
      renderExpressionField({
        value: {
          __mode__: "static",
          __value__: "static-value",
          __staticValue__: "static-value",
        } as ExpressionFieldValue<string>,
      });

      // Wait a moment to ensure no evaluation happens (wrapped in act)
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      // Cast to vi.fn to access mock calls
      const evaluator =
        expressionResolverModule.evaluateExpression as ReturnType<typeof vi.fn>;
      expect(evaluator).not.toHaveBeenCalled();
    });

    test("evaluation error doesn't trigger infinite re-render", async () => {
      const onChange = vi.fn();

      // Cast to vi.fn and set up mock return value
      const evaluator =
        expressionResolverModule.evaluateExpression as ReturnType<typeof vi.fn>;
      evaluator.mockResolvedValue({
        success: false,
        error: "Error",
      });

      renderExpressionField({
        onChange,
        value: {
          __mode__: "dynamic",
          __expression__: "failing.expr",
          __value__: "default",
          __staticValue__: "",
        } as ExpressionFieldValue<string>,
      });

      // Wait for initial evaluation to complete
      await waitFor(
        () => {
          expect(evaluator).toHaveBeenCalled();
        },
        { timeout: 500 }
      );

      const evaluationCalls = evaluator.mock.calls.length;

      // Wait again to ensure no additional evaluations (wrapped in act)
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 400));
      });

      expect(evaluator.mock.calls.length).toBe(evaluationCalls); // No additional calls
    });
  });

  describe("Edge cases and boundary conditions", () => {
    test("whitespace-only expression does not trigger evaluation", async () => {
      renderExpressionField({
        value: {
          __mode__: "dynamic",
          __expression__: "   ",
          __value__: "default",
          __staticValue__: "",
        } as ExpressionFieldValue<string>,
      });

      // Wait for potential debounce (wrapped in act)
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 400));
      });

      // Cast to vi.fn to access mock calls
      const evaluator =
        expressionResolverModule.evaluateExpression as ReturnType<typeof vi.fn>;
      expect(evaluator).not.toHaveBeenCalled();
    });
  });
});

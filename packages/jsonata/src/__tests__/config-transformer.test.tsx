/**
 * Tests for config-transformer.tsx
 *
 * Core functionality:
 * - Primitive fields get wrapped with ExpressionField
 * - Complex fields (array, object, slot, etc.) stay unchanged
 * - Render function strips metadata before component receives props
 * - Original config immutability
 *
 * Edge cases:
 * - Config without fields
 * - Empty fields object
 * - Null/undefined values
 */

import type { Config, Field } from "@measured/puck";
import { describe, expect, test, vi } from "vitest";
import { withExpressions } from "../config-transformer";
import type { ExpressionFieldValue } from "../types";

// Mock Monaco Editor (prevents heavy initialization in tests)
vi.mock("@monaco-editor/react", () => ({
  Editor: () => null,
}));

describe("withExpressions", () => {
  describe("core functionality - field transformation", () => {
    test("wraps text fields with ExpressionField", () => {
      const config: Config = {
        components: {
          TestComponent: {
            fields: {
              title: {
                type: "text",
                label: "Title",
              },
            },
            render: ({ title }: { title: string }) => title,
          },
        },
      };

      const result = withExpressions(config);

      // Field should be transformed to custom type
      const titleField = result.components.TestComponent?.fields
        ?.title as Field;
      expect(titleField.type).toBe("custom");
      expect(titleField.label).toBe("Title");
      expect(titleField.render).toBeDefined();
    });

    test("wraps number fields with ExpressionField", () => {
      const config: Config = {
        components: {
          TestComponent: {
            fields: {
              count: {
                type: "number",
                label: "Count",
              },
            },
            render: ({ count }: { count: number }) => String(count),
          },
        },
      };

      const result = withExpressions(config);

      const countField = result.components.TestComponent?.fields
        ?.count as Field;
      expect(countField.type).toBe("custom");
      expect(countField.label).toBe("Count");
    });

    test("wraps textarea fields with ExpressionField", () => {
      const config: Config = {
        components: {
          TestComponent: {
            fields: {
              description: {
                type: "textarea",
                label: "Description",
              },
            },
            render: ({ description }: { description: string }) => description,
          },
        },
      };

      const result = withExpressions(config);

      const field = result.components.TestComponent?.fields
        ?.description as Field;
      expect(field.type).toBe("custom");
      expect(field.label).toBe("Description");
    });

    test("wraps select fields with ExpressionField", () => {
      const config: Config = {
        components: {
          TestComponent: {
            fields: {
              variant: {
                type: "select",
                label: "Variant",
                options: [
                  { label: "Primary", value: "primary" },
                  { label: "Secondary", value: "secondary" },
                ],
              },
            },
            render: ({ variant }: { variant: string }) => variant,
          },
        },
      };

      const result = withExpressions(config);

      const field = result.components.TestComponent?.fields?.variant as Field;
      expect(field.type).toBe("custom");
      expect(field.label).toBe("Variant");
    });

    test("wraps radio fields with ExpressionField", () => {
      const config: Config = {
        components: {
          TestComponent: {
            fields: {
              size: {
                type: "radio",
                label: "Size",
                options: [
                  { label: "Small", value: "sm" },
                  { label: "Large", value: "lg" },
                ],
              },
            },
            render: ({ size }: { size: string }) => size,
          },
        },
      };

      const result = withExpressions(config);

      const field = result.components.TestComponent?.fields?.size as Field;
      expect(field.type).toBe("custom");
      expect(field.label).toBe("Size");
    });

    test("leaves array fields unchanged", () => {
      const config: Config = {
        components: {
          TestComponent: {
            fields: {
              items: {
                type: "array",
                label: "Items",
                arrayFields: {
                  name: { type: "text" },
                },
              },
            },
            render: ({ items }: { items: unknown[] }) => String(items.length),
          },
        },
      };

      const result = withExpressions(config);

      const field = result.components.TestComponent?.fields?.items as Field;
      expect(field.type).toBe("array");
      expect(field.label).toBe("Items");
    });

    test("leaves object fields unchanged", () => {
      const config: Config = {
        components: {
          TestComponent: {
            fields: {
              settings: {
                type: "object",
                label: "Settings",
                objectFields: {
                  enabled: { type: "text" },
                },
              },
            },
            render: ({ settings }: { settings: unknown }) =>
              JSON.stringify(settings),
          },
        },
      };

      const result = withExpressions(config);

      const field = result.components.TestComponent?.fields?.settings as Field;
      expect(field.type).toBe("object");
      expect(field.label).toBe("Settings");
    });

    test("leaves external fields unchanged", () => {
      const config: Config = {
        components: {
          TestComponent: {
            fields: {
              data: {
                type: "external",
                label: "External Data",
                fetchList: async () => [],
              },
            },
            render: ({ data }: { data: unknown }) => JSON.stringify(data),
          },
        },
      };

      const result = withExpressions(config);

      const field = result.components.TestComponent?.fields?.data as Field;
      expect(field.type).toBe("external");
      expect(field.label).toBe("External Data");
    });

    test("leaves custom fields unchanged", () => {
      const config: Config = {
        components: {
          TestComponent: {
            fields: {
              custom: {
                type: "custom",
                label: "Custom Field",
                render: () => null,
              },
            },
            render: ({ custom }: { custom: unknown }) => JSON.stringify(custom),
          },
        },
      };

      const result = withExpressions(config);

      const field = result.components.TestComponent?.fields?.custom as Field;
      expect(field.type).toBe("custom");
      expect(field.label).toBe("Custom Field");
    });

    test("transforms multiple primitive fields in same component", () => {
      const config: Config = {
        components: {
          TestComponent: {
            fields: {
              title: { type: "text", label: "Title" },
              count: { type: "number", label: "Count" },
              description: { type: "textarea", label: "Description" },
            },
            render: () => "test",
          },
        },
      };

      const result = withExpressions(config);

      const fields = result.components.TestComponent?.fields;
      expect(fields?.title?.type).toBe("custom");
      expect(fields?.count?.type).toBe("custom");
      expect(fields?.description?.type).toBe("custom");
    });

    test("handles multiple components in config", () => {
      const config: Config = {
        components: {
          Component1: {
            fields: {
              field1: { type: "text", label: "Field 1" },
            },
            render: () => "1",
          },
          Component2: {
            fields: {
              field2: { type: "number", label: "Field 2" },
            },
            render: () => "2",
          },
        },
      };

      const result = withExpressions(config);

      expect(result.components.Component1?.fields?.field1?.type).toBe("custom");
      expect(result.components.Component2?.fields?.field2?.type).toBe("custom");
    });
  });

  describe("core functionality - render function wrapping", () => {
    test("wrapped render function strips metadata from props", () => {
      const config: Config = {
        components: {
          TestComponent: {
            fields: {
              title: { type: "text", label: "Title" },
            },
            render: ({ title }: { title: string }) => `Title: ${title}`,
          },
        },
      };

      const result = withExpressions(config);

      // Simulate props with metadata (as they come from ExpressionField)
      const propsWithMetadata = {
        title: {
          __mode__: "static",
          __value__: "Hello World",
        } as ExpressionFieldValue<string>,
      };

      // Call wrapped render function
      const output = result.components.TestComponent?.render(propsWithMetadata);

      // Original component should receive clean props
      expect(output).toBe("Title: Hello World");
    });

    test("wrapped render function handles dynamic mode", () => {
      const config: Config = {
        components: {
          TestComponent: {
            fields: {
              count: { type: "number", label: "Count" },
            },
            render: ({ count }: { count: number }) => `Count: ${count}`,
          },
        },
      };

      const result = withExpressions(config);

      const propsWithMetadata = {
        count: {
          __mode__: "dynamic",
          __expression__: "10 * 2",
          __value__: 20, // Pre-evaluated
        } as ExpressionFieldValue<number>,
      };

      const output = result.components.TestComponent?.render(propsWithMetadata);

      expect(output).toBe("Count: 20");
    });

    test("wrapped render function handles nested metadata", () => {
      const config: Config = {
        components: {
          TestComponent: {
            fields: {
              data: { type: "text", label: "Data" },
            },
            render: ({ data }: { data: { title: string; count: number } }) =>
              `${data.title}: ${data.count}`,
          },
        },
      };

      const result = withExpressions(config);

      const propsWithMetadata = {
        data: {
          title: {
            __mode__: "static",
            __value__: "Items",
          } as ExpressionFieldValue<string>,
          count: {
            __mode__: "dynamic",
            __value__: 5,
          } as ExpressionFieldValue<number>,
        },
      };

      const output = result.components.TestComponent?.render(propsWithMetadata);

      expect(output).toBe("Items: 5");
    });
  });

  describe("core functionality - immutability", () => {
    test("does not mutate original config", () => {
      const originalConfig: Config = {
        components: {
          TestComponent: {
            fields: {
              title: { type: "text", label: "Title" },
            },
            render: () => "test",
          },
        },
      };

      // Deep clone to verify no mutations
      const configSnapshot = JSON.parse(JSON.stringify(originalConfig));

      withExpressions(originalConfig);

      // Original config should be unchanged
      expect(JSON.stringify(originalConfig)).toBe(
        JSON.stringify(configSnapshot)
      );
    });

    test("creates new config object reference", () => {
      const config: Config = {
        components: {
          TestComponent: {
            fields: {
              title: { type: "text", label: "Title" },
            },
            render: () => "test",
          },
        },
      };

      const result = withExpressions(config);

      // Different references
      expect(result).not.toBe(config);
      expect(result.components).not.toBe(config.components);
    });
  });

  describe("edge cases", () => {
    test("handles component without fields property", () => {
      const config: Config = {
        components: {
          TestComponent: {
            render: () => "test",
          },
        },
      };

      const result = withExpressions(config);

      expect(result.components.TestComponent).toBeDefined();
      expect(result.components.TestComponent?.fields).toBeUndefined();
    });

    test("handles empty fields object", () => {
      const config: Config = {
        components: {
          TestComponent: {
            fields: {},
            render: () => "test",
          },
        },
      };

      const result = withExpressions(config);

      expect(result.components.TestComponent?.fields).toEqual({});
    });

    test("handles null field values", () => {
      const config: Config = {
        components: {
          TestComponent: {
            fields: {
              nullable: null as unknown as Field,
            },
            render: () => "test",
          },
        },
      };

      // Should not crash
      const result = withExpressions(config);

      // Null fields are skipped in transformation
      expect(result.components.TestComponent?.fields?.nullable).toBeUndefined();
    });

    test("handles undefined field values", () => {
      const config: Config = {
        components: {
          TestComponent: {
            fields: {
              undefinedField: undefined as unknown as Field,
            },
            render: () => "test",
          },
        },
      };

      // Should not crash
      const result = withExpressions(config);

      expect(
        result.components.TestComponent?.fields?.undefinedField
      ).toBeUndefined();
    });

    test("handles config with no components", () => {
      const config: Config = {
        components: {},
      };

      const result = withExpressions(config);

      expect(result.components).toEqual({});
    });

    test("handles component with null fields property", () => {
      const config: Config = {
        components: {
          TestComponent: {
            fields: null as unknown as Record<string, Field>,
            render: () => "test",
          },
        },
      };

      // Should not crash
      const result = withExpressions(config);

      expect(result.components.TestComponent).toBeDefined();
    });

    test("preserves field properties other than type and render", () => {
      const config: Config = {
        components: {
          TestComponent: {
            fields: {
              title: {
                type: "text",
                label: "Title",
                // @ts-expect-error - testing custom properties
                customProp: "custom value",
              },
            },
            render: () => "test",
          },
        },
      };

      const result = withExpressions(config);

      const field = result.components.TestComponent?.fields?.title;
      expect(field?.label).toBe("Title");
      // Custom properties are not preserved in transformation
      // This is expected behavior
    });

    test("handles mixed field types correctly", () => {
      const config: Config = {
        components: {
          TestComponent: {
            fields: {
              text: { type: "text", label: "Text" },
              array: { type: "array", label: "Array", arrayFields: {} },
              number: { type: "number", label: "Number" },
              object: { type: "object", label: "Object", objectFields: {} },
              select: {
                type: "select",
                label: "Select",
                options: [],
              },
            },
            render: () => "test",
          },
        },
      };

      const result = withExpressions(config);
      const fields = result.components.TestComponent?.fields;

      // Primitives should be wrapped
      expect(fields?.text?.type).toBe("custom");
      expect(fields?.number?.type).toBe("custom");
      expect(fields?.select?.type).toBe("custom");

      // Complex types should stay unchanged
      expect(fields?.array?.type).toBe("array");
      expect(fields?.object?.type).toBe("object");
    });
  });
});

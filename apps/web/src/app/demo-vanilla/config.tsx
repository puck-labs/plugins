"use client";

import type { Config, Slot } from "@measured/puck";
import { type ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { withExpressions } from "@puck-labs/jsonata";
import "@puck-labs/jsonata/styles.css";

// ============================================================================
// CVA VARIANT DEFINITIONS
// ============================================================================

// Field card variants for showcase sections
const fieldCardVariants = cva("pl-5 py-3 rounded-r-lg border-l-4", {
  variants: {
    color: {
      blue: "border-blue-500 bg-blue-50",
      green: "border-green-500 bg-green-50",
      purple: "border-purple-500 bg-purple-50",
      amber: "border-amber-500 bg-amber-50",
      red: "border-red-500 bg-red-50",
      indigo: "border-indigo-500 bg-indigo-50",
      pink: "border-pink-500 bg-pink-50",
      teal: "border-teal-500 bg-teal-50",
      orange: "border-orange-500 bg-orange-50",
    },
  },
  defaultVariants: {
    color: "blue",
  },
});

const fieldCardTitleVariants = cva("font-semibold text-lg mb-2", {
  variants: {
    color: {
      blue: "text-blue-900",
      green: "text-green-900",
      purple: "text-purple-900",
      amber: "text-amber-900",
      red: "text-red-900",
      indigo: "text-indigo-900",
      pink: "text-pink-900",
      teal: "text-teal-900",
      orange: "text-orange-900",
    },
  },
  defaultVariants: {
    color: "blue",
  },
});

const textVariants = cva("text-slate-700 py-2", {
  variants: {
    size: {
      small: "text-sm leading-relaxed",
      medium: "text-base leading-relaxed",
      large: "text-lg leading-relaxed",
    },
  },
  defaultVariants: {
    size: "medium",
  },
});

const buttonVariants = cva(
  "px-6 py-2.5 rounded-lg font-semibold transition-all duration-200",
  {
    variants: {
      variant: {
        primary:
          "bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg",
        secondary:
          "bg-slate-600 text-white hover:bg-slate-700 shadow-md hover:shadow-lg",
        outline:
          "border-2 border-blue-600 text-blue-600 hover:bg-blue-50 bg-white shadow-sm hover:shadow-md",
      },
    },
    defaultVariants: {
      variant: "primary",
    },
  },
);

// ============================================================================
// REUSABLE FIELD CARD COMPONENT
// ============================================================================

type FieldCardColor =
  | "blue"
  | "green"
  | "purple"
  | "amber"
  | "red"
  | "indigo"
  | "pink"
  | "teal"
  | "orange";

type FieldCardProps = {
  color: FieldCardColor;
  title: string;
  children: ReactNode;
};

const FieldCard = ({ color, title, children }: FieldCardProps) => {
  return (
    <div className={fieldCardVariants({ color })}>
      <h3 className={fieldCardTitleVariants({ color })}>{title}</h3>
      <div className="text-slate-600 text-sm">{children}</div>
    </div>
  );
};

// ============================================================================
// FIELD SHOWCASE COMPONENT
// Demonstrates all Puck field types in one place
// ============================================================================

export type FieldShowcaseProps = {
  // TEXT FIELD - Single line text input
  textField: string;

  // NUMBER FIELD - Number input with constraints
  numberField: number;

  // TEXTAREA FIELD - Multi-line text input
  textareaField: string;

  // SELECT FIELD - Dropdown selection
  selectField: string;

  // RADIO FIELD - Radio button selection
  radioField: "option1" | "option2" | "option3";

  // ARRAY FIELD - Dynamic list of items
  arrayField: Array<{
    label: string;
    value: string;
    enabled: boolean;
  }>;

  // OBJECT FIELD - Nested object with fields
  objectField: {
    title: string;
    description: string;
    settings: {
      enabled: boolean;
      priority: number;
    };
  };

  // EXTERNAL FIELD - Async data source (simulated)
  externalField?: {
    id: string;
    name: string;
  };

  // CUSTOM FIELD - Custom render component
  customField: string;

  // Note: SLOT FIELD is demonstrated separately as it requires DropZone
};

const FieldShowcase = ({
  textField,
  numberField,
  textareaField,
  selectField,
  radioField,
  arrayField,
  objectField,
  externalField,
  customField,
}: FieldShowcaseProps) => {
  return (
    <div className="max-w-4xl mx-auto p-12 min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="bg-white rounded-2xl p-10 shadow-xl">
        <h2 className="text-4xl font-extrabold mb-3 text-slate-900 tracking-tight">
          Puck Field Types Showcase
        </h2>
        <p className="text-base text-slate-500 mb-10">
          Complete demonstration of all field types supported by Puck editor
        </p>

        <div className="flex flex-col gap-6">
          {/* Text Field */}
          <FieldCard color="blue" title="Text Field">
            {textField}
          </FieldCard>

          {/* Number Field */}
          <FieldCard color="green" title="Number Field">
            Value: <span className="font-bold">{numberField}</span>
          </FieldCard>

          {/* Textarea Field */}
          <FieldCard color="purple" title="Textarea Field">
            <span className="whitespace-pre-wrap">{textareaField}</span>
          </FieldCard>

          {/* Select Field */}
          <FieldCard color="amber" title="Select Field">
            Selected:{" "}
            <span className="bg-amber-200 px-2 py-0.5 rounded font-medium">
              {selectField}
            </span>
          </FieldCard>

          {/* Radio Field */}
          <FieldCard color="red" title="Radio Field">
            Selected:{" "}
            <span className="bg-red-200 px-2 py-0.5 rounded font-medium">
              {radioField}
            </span>
          </FieldCard>

          {/* Array Field */}
          <FieldCard color="indigo" title="Array Field">
            <ul className="list-none space-y-2">
              {arrayField.map((item, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                  <span>
                    <strong>{item.label}</strong>: {item.value}
                  </span>
                  <span className="ml-auto text-lg">
                    {item.enabled ? "✓" : "✗"}
                  </span>
                </li>
              ))}
            </ul>
          </FieldCard>

          {/* Object Field */}
          <FieldCard color="pink" title="Object Field">
            <div className="space-y-1.5">
              <p>
                <strong className="text-slate-900">Title:</strong>{" "}
                {objectField.title}
              </p>
              <p>
                <strong className="text-slate-900">Description:</strong>{" "}
                {objectField.description}
              </p>
              <p>
                <strong className="text-slate-900">Settings:</strong> Enabled:{" "}
                {objectField.settings.enabled ? "Yes" : "No"}, Priority:{" "}
                {objectField.settings.priority}
              </p>
            </div>
          </FieldCard>

          {/* External Field */}
          {externalField && (
            <FieldCard color="teal" title="External Field">
              <p>
                <strong>ID:</strong> {externalField.id}
                <br />
                <strong>Name:</strong> {externalField.name}
              </p>
            </FieldCard>
          )}

          {/* Custom Field */}
          <FieldCard color="orange" title="Custom Field">
            <p className="font-mono bg-amber-100 p-3 rounded-md">
              {customField}
            </p>
          </FieldCard>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// SLOT SHOWCASE COMPONENT
// Demonstrates the slot field type (drag-and-drop zones)
// ============================================================================

export type SlotShowcaseProps = {
  title: string;
  children: Slot;
};

const SlotShowcase = ({ title, children: Children }: SlotShowcaseProps) => {
  return (
    <div className="max-w-4xl mx-auto p-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-lg">
      <h2 className="text-3xl font-bold text-slate-900 mb-4">{title}</h2>
      <div className="border-2 border-dashed border-indigo-300 rounded-xl p-8 min-h-[250px] bg-white/80 backdrop-blur-sm">
        <Children />
      </div>
      <p className="text-sm text-slate-600 italic mt-4 text-center">
        ↑ This is a Slot field - drag components here!
      </p>
    </div>
  );
};

// ============================================================================
// SIMPLE COMPONENTS FOR SLOT DEMONSTRATION
// ============================================================================

export type TextBlockProps = {
  text: string;
  size: "small" | "medium" | "large";
};

const TextBlock = ({ text, size }: TextBlockProps) => {
  return <p className={textVariants({ size })}>{text}</p>;
};

export type ButtonBlockProps = {
  label: string;
  variant: "primary" | "secondary" | "outline";
};

const ButtonBlock = ({ label, variant }: ButtonBlockProps) => {
  return (
    <button type="button" className={buttonVariants({ variant })}>
      {label}
    </button>
  );
};

// ============================================================================
// PUCK CONFIG
// ============================================================================

// Simulated external data source
const mockExternalData = [
  { id: "1", name: "Alpha Project", category: "Development" },
  { id: "2", name: "Beta Initiative", category: "Marketing" },
  { id: "3", name: "Gamma Campaign", category: "Sales" },
  { id: "4", name: "Delta Research", category: "Development" },
  { id: "5", name: "Epsilon Launch", category: "Marketing" },
];

const baseConfig: Config<{
  FieldShowcase: FieldShowcaseProps;
  SlotShowcase: SlotShowcaseProps;
  TextBlock: TextBlockProps;
  ButtonBlock: ButtonBlockProps;
}> = {
  components: {
    FieldShowcase: {
      fields: {
        // TEXT FIELD
        textField: {
          type: "text",
          label: "Text Field",
        },

        // NUMBER FIELD
        numberField: {
          type: "number",
          label: "Number Field",
          min: 0,
          max: 100,
          step: 5,
        },

        // TEXTAREA FIELD
        textareaField: {
          type: "textarea",
          label: "Textarea Field",
        },

        // SELECT FIELD
        selectField: {
          type: "select",
          label: "Select Field",
          options: [
            { label: "Option A", value: "a" },
            { label: "Option B", value: "b" },
            { label: "Option C", value: "c" },
            { label: "Option D", value: "d" },
          ],
        },

        // RADIO FIELD
        radioField: {
          type: "radio",
          label: "Radio Field",
          options: [
            { label: "First Option", value: "option1" },
            { label: "Second Option", value: "option2" },
            { label: "Third Option", value: "option3" },
          ],
        },

        // ARRAY FIELD
        arrayField: {
          type: "array",
          label: "Array Field (Dynamic List)",
          min: 1,
          max: 5,
          arrayFields: {
            label: {
              type: "text",
              label: "Label",
            },
            value: {
              type: "text",
              label: "Value",
            },
            enabled: {
              type: "radio",
              label: "Enabled",
              options: [
                { label: "Yes", value: true },
                { label: "No", value: false },
              ],
            },
          },
          defaultItemProps: {
            label: "New Item",
            value: "value",
            enabled: true,
          },
          getItemSummary: (item) => item.label || "Unnamed Item",
        },

        // OBJECT FIELD
        objectField: {
          type: "object",
          label: "Object Field (Nested Fields)",
          objectFields: {
            title: {
              type: "text",
              label: "Title",
            },
            description: {
              type: "textarea",
              label: "Description",
            },
            settings: {
              type: "object",
              label: "Settings",
              objectFields: {
                enabled: {
                  type: "radio",
                  label: "Enabled",
                  options: [
                    { label: "Yes", value: true },
                    { label: "No", value: false },
                  ],
                },
                priority: {
                  type: "number",
                  label: "Priority",
                  min: 1,
                  max: 10,
                },
              },
            },
          },
        },

        // EXTERNAL FIELD
        externalField: {
          type: "external",
          label: "External Field (Async Data)",
          placeholder: "Search for a project...",
          fetchList: async ({ query, filters }) => {
            // Simulate API delay
            await new Promise((resolve) => setTimeout(resolve, 300));

            return mockExternalData
              .filter((item) => {
                // Filter by category if provided
                if (filters?.category && item.category !== filters.category) {
                  return false;
                }

                // Filter by search query
                if (query) {
                  const lowerQuery = query.toLowerCase();
                  return (
                    item.name.toLowerCase().includes(lowerQuery) ||
                    item.category.toLowerCase().includes(lowerQuery)
                  );
                }

                return true;
              })
              .map((item) => ({
                ...item,
                title: item.name,
                description: item.category,
              }));
          },
          mapProp: (value) => ({
            id: value.id,
            name: value.name,
          }),
          getItemSummary: (item) => item?.name || "No selection",
          filterFields: {
            category: {
              type: "select",
              options: [
                { label: "All Categories", value: "" },
                { label: "Development", value: "Development" },
                { label: "Marketing", value: "Marketing" },
                { label: "Sales", value: "Sales" },
              ],
            },
          },
        },

        // CUSTOM FIELD
        customField: {
          type: "custom",
          label: "Custom Field (Custom Render)",
          render: ({ value, onChange }) => (
            <div className="space-y-2">
              <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Custom input with emoji picker..."
              />
              <div className="flex gap-2">
                {["🎉", "🚀", "✨", "💡", "🔥", "⚡"].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => onChange(value + emoji)}
                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ),
        },
      },
      defaultProps: {
        textField: "Hello, Puck!",
        numberField: 42,
        textareaField:
          "This is a multi-line text field.\nYou can write longer content here.\nGreat for descriptions!",
        selectField: "b",
        radioField: "option2",
        arrayField: [
          { label: "Item One", value: "value1", enabled: true },
          { label: "Item Two", value: "value2", enabled: false },
        ],
        objectField: {
          title: "Example Object",
          description: "This demonstrates nested object fields",
          settings: {
            enabled: true,
            priority: 5,
          },
        },
        customField: "Type here and add emojis! ",
      },
      render: FieldShowcase,
    },

    SlotShowcase: {
      fields: {
        title: {
          type: "text",
          label: "Container Title",
        },
        children: {
          type: "slot",
          label: "Drop Zone",
          allow: ["TextBlock", "ButtonBlock"],
        },
      },
      defaultProps: {
        title: "Slot Field Container",
        children: [],
      },
      render: SlotShowcase,
    },

    TextBlock: {
      fields: {
        text: {
          type: "text",
          label: "Text Content",
        },
        size: {
          type: "radio",
          label: "Size",
          options: [
            { label: "Small", value: "small" },
            { label: "Medium", value: "medium" },
            { label: "Large", value: "large" },
          ],
        },
      },
      defaultProps: {
        text: "Sample text block",
        size: "medium",
      },
      render: TextBlock,
    },

    ButtonBlock: {
      fields: {
        label: {
          type: "text",
          label: "Button Label",
        },
        variant: {
          type: "select",
          label: "Variant",
          options: [
            { label: "Primary", value: "primary" },
            { label: "Secondary", value: "secondary" },
            { label: "Outline", value: "outline" },
          ],
        },
      },
      defaultProps: {
        label: "Click Me",
        variant: "primary",
      },
      render: ButtonBlock,
    },
  },
};

export const initialData = {
  content: [
    {
      type: "FieldShowcase",
      props: {
        id: "FieldShowcase-1",
        ...baseConfig.components.FieldShowcase.defaultProps,
      },
    },
    {
      type: "SlotShowcase",
      props: {
        id: "SlotShowcase-1",
        title: "Slot Field Demo - Drag Components Below",
      },
    },
  ],
  root: {},
};

// Wrap config with expression support for primitive fields
export const config = withExpressions(baseConfig);

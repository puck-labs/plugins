/**
 * JSONata Completion Provider for Monaco Editor
 * Based on official JSONata functions.js
 */

import type * as Monaco from "monaco-editor";

/**
 * JSONata built-in functions from functions.js
 * All functions start with $ prefix
 */
const JSONATA_FUNCTIONS: Array<{
  label: string;
  insertText: string;
  detail: string;
  documentation: string;
}> = [
  // String functions
  {
    label: "$string",
    insertText: "$string(${1:value})",
    detail: "(value) → string",
    documentation: "Casts value to a string",
  },
  {
    label: "$substring",
    insertText: "$substring(${1:str}, ${2:start}, ${3:length})",
    detail: "(str, start, length?) → string",
    documentation: "Returns a substring of a string",
  },
  {
    label: "$substringBefore",
    insertText: "$substringBefore(${1:str}, ${2:chars})",
    detail: "(str, chars) → string",
    documentation: "Returns substring before the first occurrence of chars",
  },
  {
    label: "$substringAfter",
    insertText: "$substringAfter(${1:str}, ${2:chars})",
    detail: "(str, chars) → string",
    documentation: "Returns substring after the first occurrence of chars",
  },
  {
    label: "$lowercase",
    insertText: "$lowercase(${1:str})",
    detail: "(str) → string",
    documentation: "Converts string to lowercase",
  },
  {
    label: "$uppercase",
    insertText: "$uppercase(${1:str})",
    detail: "(str) → string",
    documentation: "Converts string to uppercase",
  },
  {
    label: "$length",
    insertText: "$length(${1:str})",
    detail: "(str) → number",
    documentation: "Returns the number of characters in a string",
  },
  {
    label: "$trim",
    insertText: "$trim(${1:str})",
    detail: "(str) → string",
    documentation: "Removes leading and trailing whitespace",
  },
  {
    label: "$pad",
    insertText: "$pad(${1:str}, ${2:width}, ${3:char})",
    detail: "(str, width, char?) → string",
    documentation: "Pads string to minimum width",
  },
  {
    label: "$contains",
    insertText: "$contains(${1:str}, ${2:pattern})",
    detail: "(str, pattern) → boolean",
    documentation: "Returns true if string contains pattern",
  },
  {
    label: "$split",
    insertText: "$split(${1:str}, ${2:separator}, ${3:limit})",
    detail: "(str, separator, limit?) → array",
    documentation: "Splits string into array of substrings",
  },
  {
    label: "$join",
    insertText: "$join(${1:array}, ${2:separator})",
    detail: "(array, separator?) → string",
    documentation: "Joins array of strings into a single string",
  },
  {
    label: "$match",
    insertText: "$match(${1:str}, ${2:regex}, ${3:limit})",
    detail: "(str, regex, limit?) → array",
    documentation: "Returns array of matches for regex pattern",
  },
  {
    label: "$replace",
    insertText:
      "$replace(${1:str}, ${2:pattern}, ${3:replacement}, ${4:limit})",
    detail: "(str, pattern, replacement, limit?) → string",
    documentation: "Replaces occurrences of pattern in string",
  },
  {
    label: "$base64encode",
    insertText: "$base64encode(${1:str})",
    detail: "(str) → string",
    documentation: "Base64 encodes a string",
  },
  {
    label: "$base64decode",
    insertText: "$base64decode(${1:str})",
    detail: "(str) → string",
    documentation: "Base64 decodes a string",
  },
  {
    label: "$encodeUrlComponent",
    insertText: "$encodeUrlComponent(${1:str})",
    detail: "(str) → string",
    documentation: "Encodes string for use in URL component",
  },
  {
    label: "$encodeUrl",
    insertText: "$encodeUrl(${1:str})",
    detail: "(str) → string",
    documentation: "Encodes string for use in URL",
  },
  {
    label: "$decodeUrlComponent",
    insertText: "$decodeUrlComponent(${1:str})",
    detail: "(str) → string",
    documentation: "Decodes URL component string",
  },
  {
    label: "$decodeUrl",
    insertText: "$decodeUrl(${1:str})",
    detail: "(str) → string",
    documentation: "Decodes URL string",
  },

  // Number functions
  {
    label: "$number",
    insertText: "$number(${1:value})",
    detail: "(value) → number",
    documentation: "Casts value to a number",
  },
  {
    label: "$abs",
    insertText: "$abs(${1:number})",
    detail: "(number) → number",
    documentation: "Returns absolute value",
  },
  {
    label: "$floor",
    insertText: "$floor(${1:number})",
    detail: "(number) → number",
    documentation: "Rounds down to integer",
  },
  {
    label: "$ceil",
    insertText: "$ceil(${1:number})",
    detail: "(number) → number",
    documentation: "Rounds up to integer",
  },
  {
    label: "$round",
    insertText: "$round(${1:number}, ${2:precision})",
    detail: "(number, precision?) → number",
    documentation: "Rounds to nearest integer or decimal places",
  },
  {
    label: "$sqrt",
    insertText: "$sqrt(${1:number})",
    detail: "(number) → number",
    documentation: "Returns square root",
  },
  {
    label: "$power",
    insertText: "$power(${1:base}, ${2:exponent})",
    detail: "(base, exponent) → number",
    documentation: "Raises base to the power of exponent",
  },
  {
    label: "$random",
    insertText: "$random()",
    detail: "() → number",
    documentation: "Returns random number between 0 and 1",
  },
  {
    label: "$formatNumber",
    insertText: "$formatNumber(${1:value}, ${2:picture}, ${3:options})",
    detail: "(value, picture, options?) → string",
    documentation: "Formats number using picture string",
  },
  {
    label: "$formatBase",
    insertText: "$formatBase(${1:value}, ${2:radix})",
    detail: "(value, radix?) → string",
    documentation: "Converts number to string in specified base (2-36)",
  },

  // Aggregation functions
  {
    label: "$sum",
    insertText: "$sum(${1:array})",
    detail: "(array) → number",
    documentation: "Returns sum of numeric array",
  },
  {
    label: "$count",
    insertText: "$count(${1:array})",
    detail: "(array) → number",
    documentation: "Returns number of items in array",
  },
  {
    label: "$max",
    insertText: "$max(${1:array})",
    detail: "(array) → number",
    documentation: "Returns maximum value from numeric array",
  },
  {
    label: "$min",
    insertText: "$min(${1:array})",
    detail: "(array) → number",
    documentation: "Returns minimum value from numeric array",
  },
  {
    label: "$average",
    insertText: "$average(${1:array})",
    detail: "(array) → number",
    documentation: "Returns average of numeric array",
  },

  // Boolean functions
  {
    label: "$boolean",
    insertText: "$boolean(${1:value})",
    detail: "(value) → boolean",
    documentation: "Casts value to boolean",
  },
  {
    label: "$not",
    insertText: "$not(${1:value})",
    detail: "(value) → boolean",
    documentation: "Returns boolean NOT of value",
  },
  {
    label: "$exists",
    insertText: "$exists(${1:value})",
    detail: "(value) → boolean",
    documentation: "Returns true if value exists (not undefined)",
  },

  // Array functions
  {
    label: "$map",
    insertText: "$map(${1:array}, ${2:function})",
    detail: "(array, function) → array",
    documentation: "Applies function to each item in array",
  },
  {
    label: "$filter",
    insertText: "$filter(${1:array}, ${2:function})",
    detail: "(array, function) → array",
    documentation: "Returns items that match predicate function",
  },
  {
    label: "$reduce",
    insertText: "$reduce(${1:array}, ${2:function}, ${3:init})",
    detail: "(array, function, init?) → value",
    documentation: "Reduces array to single value using function",
  },
  {
    label: "$zip",
    insertText: "$zip(${1:array1}, ${2:array2})",
    detail: "(array1, array2, ...) → array",
    documentation: "Convolves (zips) values from multiple arrays",
  },
  {
    label: "$append",
    insertText: "$append(${1:array1}, ${2:array2})",
    detail: "(array1, array2) → array",
    documentation: "Appends second array to first",
  },
  {
    label: "$sort",
    insertText: "$sort(${1:array}, ${2:function})",
    detail: "(array, function?) → array",
    documentation: "Sorts array using optional comparator",
  },
  {
    label: "$reverse",
    insertText: "$reverse(${1:array})",
    detail: "(array) → array",
    documentation: "Reverses order of array items",
  },
  {
    label: "$shuffle",
    insertText: "$shuffle(${1:array})",
    detail: "(array) → array",
    documentation: "Randomly shuffles array items",
  },
  {
    label: "$distinct",
    insertText: "$distinct(${1:array})",
    detail: "(array) → array",
    documentation: "Returns array with duplicates removed",
  },
  {
    label: "$single",
    insertText: "$single(${1:array}, ${2:function})",
    detail: "(array, function?) → value",
    documentation: "Returns the single element matching condition",
  },

  // Object functions
  {
    label: "$keys",
    insertText: "$keys(${1:object})",
    detail: "(object) → array",
    documentation: "Returns array of object keys",
  },
  {
    label: "$lookup",
    insertText: "$lookup(${1:object}, ${2:key})",
    detail: "(object, key) → value",
    documentation: "Returns value of key in object",
  },
  {
    label: "$spread",
    insertText: "$spread(${1:object})",
    detail: "(object) → array",
    documentation: "Splits object into array of single-property objects",
  },
  {
    label: "$merge",
    insertText: "$merge(${1:array})",
    detail: "(array) → object",
    documentation: "Merges array of objects into single object",
  },
  {
    label: "$each",
    insertText: "$each(${1:object}, ${2:function})",
    detail: "(object, function) → array",
    documentation: "Applies function to each key/value pair",
  },
  {
    label: "$sift",
    insertText: "$sift(${1:object}, ${2:function})",
    detail: "(object, function) → object",
    documentation: "Returns object with entries that pass predicate",
  },

  // Utility functions
  {
    label: "$type",
    insertText: "$type(${1:value})",
    detail: "(value) → string",
    documentation:
      "Returns type of value (null, number, string, boolean, array, object, function)",
  },
  {
    label: "$assert",
    insertText: "$assert(${1:condition}, ${2:message})",
    detail: "(condition, message?) → undefined",
    documentation: "Throws error if condition is false",
  },
  {
    label: "$error",
    insertText: "$error(${2:message})",
    detail: "(message?) → never",
    documentation: "Throws error with optional message",
  },
];

/**
 * JSONata operators for completion
 */
const JSONATA_OPERATORS = [
  {
    label: "~>",
    insertText: "~>",
    detail: "Chain operator",
    documentation: "Function chaining / application",
  },
  {
    label: ":=",
    insertText: ":=",
    detail: "Variable binding",
    documentation: "Binds value to a variable",
  },
  {
    label: "??",
    insertText: "??",
    detail: "Coalescing operator",
    documentation: "Returns first non-undefined value",
  },
  {
    label: "?:",
    insertText: "?:",
    detail: "Elvis operator",
    documentation: "Returns left if truthy, otherwise right",
  },
  {
    label: "..",
    insertText: "..",
    detail: "Range operator",
    documentation: "Creates range between two numbers",
  },
  {
    label: "&",
    insertText: "&",
    detail: "String concatenation",
    documentation: "Concatenates strings",
  },
  {
    label: "**",
    insertText: "**",
    detail: "Descendant wildcard",
    documentation: "Selects all descendants",
  },
  {
    label: "@",
    insertText: "@",
    detail: "Focus variable bind",
    documentation: "Binds current focus to variable",
  },
  {
    label: "#",
    insertText: "#",
    detail: "Index variable bind",
    documentation: "Binds current index to variable",
  },
  {
    label: "^",
    insertText: "^",
    detail: "Order-by",
    documentation: "Sorts array by expression",
  },
];

type ContextEntry = {
  label: string;
  detail: string;
  documentation: Monaco.IMarkdownString;
  insertText: string;
};

function escapeInlineMarkdown(value: string): string {
  return value.replace(/[`\\]/g, (match) => `\\${match}`).replace(/\n/g, " ");
}

function describeContextValue(value: unknown): { type: string; preview?: string } {
  if (value === null) {
    return { type: "null" };
  }

  if (value === undefined) {
    return { type: "undefined" };
  }

  if (Array.isArray(value)) {
    const length = value.length;
    let preview: string | undefined;
    if (length > 0) {
      try {
        const serialized = JSON.stringify(value.slice(0, 3));
        preview = length > 3 ? `${serialized?.slice(0, 60)}…` : serialized;
      } catch {
        preview = undefined;
      }
    }
    return { type: `array(${length})`, preview };
  }

  if (value instanceof Date) {
    return { type: "date", preview: value.toISOString() };
  }

  const valueType = typeof value;

  if (valueType === "object") {
    try {
      const json = JSON.stringify(value);
      if (json) {
        return {
          type: "object",
          preview: json.length > 80 ? `${json.slice(0, 77)}…` : json,
        };
      }
    } catch {
      return { type: "object" };
    }
    return { type: "object" };
  }

  if (valueType === "function") {
    return {
      type: "function",
      preview: (value as () => unknown).name || "anonymous",
    };
  }

  const stringValue = String(value);
  return {
    type: valueType,
    preview: stringValue.length > 80 ? `${stringValue.slice(0, 77)}…` : stringValue,
  };
}

function buildContextEntries(
  monaco: typeof Monaco,
  context: Record<string, unknown>,
): ContextEntry[] {
  const entries: ContextEntry[] = [];
  const seen = new Set<string>();

  for (const [key, value] of Object.entries(context)) {
    if (!key || seen.has(key)) {
      continue;
    }

    seen.add(key);

    const { type, preview } = describeContextValue(value);
    const markdown = new monaco.MarkdownString();
    markdown.appendMarkdown(`**${key}**\n\n`);
    markdown.appendMarkdown(`Type: \`${type}\``);

    if (preview) {
      markdown.appendMarkdown(`\n\nPreview: \`${escapeInlineMarkdown(preview)}\``);
    }

    if (key === "$item") {
      markdown.appendMarkdown(
        "\n\nCurrent array item available when editing repeatable fields.",
      );
    }

    if (key === "$index") {
      markdown.appendMarkdown(
        "\n\nZero-based index for the current array item in repeatable fields.",
      );
    }

    const detailPrefix =
      key === "$item" || key === "$index" ? "Array scope" : "Context variable";

    entries.push({
      label: key,
      detail: `${detailPrefix} (${type})`,
      documentation: markdown,
      insertText: key,
    });
  }

  return entries.sort((a, b) => a.label.localeCompare(b.label));
}

/**
 * Create JSONata completion provider
 */
export function createJsonataCompletionProvider(
  monaco: typeof Monaco,
  getContextVariables: () => Record<string, unknown>,
): Monaco.languages.CompletionItemProvider {
  return {
    provideCompletionItems: (model, position) => {
      const suggestions: Monaco.languages.CompletionItem[] = [];

      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      // Add JSONata built-in functions
      for (const func of JSONATA_FUNCTIONS) {
        suggestions.push({
          label: func.label,
          kind: monaco.languages.CompletionItemKind.Function,
          detail: func.detail,
          documentation: func.documentation,
          insertText: func.insertText,
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range,
        });
      }

      // Add JSONata operators
      for (const op of JSONATA_OPERATORS) {
        suggestions.push({
          label: op.label,
          kind: monaco.languages.CompletionItemKind.Operator,
          detail: op.detail,
          documentation: op.documentation,
          insertText: op.insertText,
          range,
        });
      }

      // Add special JSONata variables
      suggestions.push({
        label: "$",
        kind: monaco.languages.CompletionItemKind.Variable,
        detail: "Current context value",
        documentation:
          "Refers to the current value in the location path. Can be used to reference the context explicitly (e.g., $.user.name is the same as user.name).",
        insertText: "$",
        range,
      });

      suggestions.push({
        label: "$$",
        kind: monaco.languages.CompletionItemKind.Variable,
        detail: "Root of input document",
        documentation:
          "Refers to the root of the input JSON document. Used for cross-referencing or joining data when you need to break out of the current context.",
        insertText: "$$",
        range,
      });

      // Add context variables
      const contextEntries = buildContextEntries(monaco, getContextVariables());
      for (const entry of contextEntries) {
        suggestions.push({
          label: entry.label,
          kind: monaco.languages.CompletionItemKind.Variable,
          detail: entry.detail,
          documentation: entry.documentation,
          insertText: entry.insertText,
          range,
        });
      }

      // Add common JSONata keywords
      const keywords = ["and", "or", "in", "true", "false", "null", "function"];
      for (const keyword of keywords) {
        suggestions.push({
          label: keyword,
          kind: monaco.languages.CompletionItemKind.Keyword,
          detail: "Keyword",
          documentation: `JSONata keyword: ${keyword}`,
          insertText: keyword,
          range,
        });
      }

      return { suggestions };
    },
  };
}

export function createJsonataHoverProvider(
  monaco: typeof Monaco,
  getContextVariables: () => Record<string, unknown>,
): Monaco.languages.HoverProvider {
  return {
    provideHover: (model, position) => {
      const word = model.getWordAtPosition(position);
      if (!word) {
        return null;
      }

      const contextEntries = buildContextEntries(monaco, getContextVariables());
      const candidateLabels = new Set([word.word, `$${word.word}`]);
      const entry = contextEntries.find((item) =>
        candidateLabels.has(item.label)
      );

      if (!entry) {
        return null;
      }

      return {
        range: new monaco.Range(
          position.lineNumber,
          word.startColumn,
          position.lineNumber,
          word.endColumn,
        ),
        contents: [entry.documentation],
      };
    },
  };
}

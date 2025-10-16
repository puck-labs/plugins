/**
 * JSONata Language Definition for Monaco Editor
 * Based on official JSONata parser: https://github.com/jsonata-js/jsonata
 */

import type * as Monaco from "monaco-editor";

/**
 * JSONata operators extracted from parser.js
 */
export const JSONATA_OPERATORS = [
  ".", // map operator
  "[", // filter/index
  "]",
  "{", // object constructor
  "}",
  "(", // function call/grouping
  ")",
  ",",
  "@", // focus variable bind
  "#", // index variable bind
  ";",
  ":",
  "?", // conditional
  "+",
  "-",
  "*",
  "/",
  "%",
  "|", // transform
  "=",
  "<",
  ">",
  "^", // order-by
  "**", // power/descendant wildcard
  "..", // range operator
  ":=", // variable binding
  "!=",
  "<=",
  ">=",
  "~>", // chain function
  "?:", // elvis/default operator
  "??", // coalescing operator
  "&", // string concatenation
  "!", // not operator
  "~",
] as const;

/**
 * JSONata keywords
 */
export const JSONATA_KEYWORDS = [
  "and",
  "or",
  "in",
  "true",
  "false",
  "null",
  "function",
  "λ", // lambda function
] as const;

/**
 * Register JSONata language with Monaco Editor
 */
export function registerJsonataLanguage(monaco: typeof Monaco): void {
  // Register the language
  monaco.languages.register({ id: "jsonata" });

  // Configure language features
  monaco.languages.setLanguageConfiguration("jsonata", {
    comments: {
      blockComment: ["/*", "*/"],
    },
    brackets: [
      ["{", "}"],
      ["[", "]"],
      ["(", ")"],
    ],
    autoClosingPairs: [
      { open: "{", close: "}" },
      { open: "[", close: "]" },
      { open: "(", close: ")" },
      { open: '"', close: '"' },
      { open: "'", close: "'" },
      { open: "`", close: "`" },
    ],
    surroundingPairs: [
      { open: "{", close: "}" },
      { open: "[", close: "]" },
      { open: "(", close: ")" },
      { open: '"', close: '"' },
      { open: "'", close: "'" },
      { open: "`", close: "`" },
    ],
  });

  // Set syntax highlighting rules
  monaco.languages.setMonarchTokensProvider("jsonata", {
    keywords: ["and", "or", "in", "true", "false", "null", "function"],
    operators: [
      ":=",
      "~>",
      "??",
      "?:",
      "**",
      "..",
      "!=",
      "<=",
      ">=",
      "=",
      "<",
      ">",
      "&",
      "+",
      "-",
      "*",
      "/",
      "%",
      "^",
      "|",
      "?",
      "@",
      "#",
    ],

    tokenizer: {
      root: [
        // Comments
        [/\/\*/, "comment", "@comment"],

        // Keywords
        [
          /\b(?:and|or|in|true|false|null|function)\b/,
          {
            cases: {
              "@keywords": "keyword",
              "@default": "identifier",
            },
          },
        ],

        // Lambda symbol
        [/λ/, "keyword"],

        // Built-in functions (start with $)
        [
          /\$[a-zA-Z_]\w*/,
          {
            cases: {
              "@default": "predefined",
            },
          },
        ],

        // Variables (start with $)
        [/\$[a-zA-Z_]\w*/, "variable"],

        // Numbers (including scientific notation)
        [/-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[Ee][-+]?[0-9]+)?/, "number"],

        // Strings (double-quoted)
        [/"([^"\\]|\\.)*"/, "string"],

        // Strings (single-quoted)
        [/'([^'\\]|\\.)*'/, "string"],

        // Quoted names (backticks)
        [/`[^`]*`/, "identifier"],

        // Regex literals
        [/\/(?:[^/\\\n]|\\.)+\/[img]*/, "regexp"],

        // Operators (multi-char first)
        [/:=|~>|\?\?|\?:|\.\.|\*\*|!=|<=|>=/, "operator"],

        // Single-char operators
        [/[.[\]{}(),@#;:?+\-*/%|=<>^&!~]/, "operator"],

        // Identifiers
        [/[a-zA-Z_]\w*/, "identifier"],

        // Whitespace
        [/\s+/, "white"],
      ],

      comment: [
        [/[^/*]+/, "comment"],
        [/\*\//, "comment", "@pop"],
        [/[/*]/, "comment"],
      ],
    },
  });
}

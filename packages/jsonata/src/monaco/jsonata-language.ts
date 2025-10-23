/**
 * JSONata Language Definition for Monaco Editor
 * Based on official JSONata parser: https://github.com/jsonata-js/jsonata
 */

import type * as Monaco from "monaco-editor";

/**
 * Regex patterns for Monaco tokenizer
 * Extracted to module level for performance (avoid recreation on each tokenization)
 */
const COMMENT_START_REGEX = /\/\*/;
const KEYWORDS_REGEX = /\b(?:and|or|in|true|false|null|function)\b/;
const LAMBDA_SYMBOL_REGEX = /λ/;
const DOLLAR_IDENTIFIER_REGEX = /\$[a-zA-Z_]\w*/;
const NUMBER_REGEX = /-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[Ee][-+]?[0-9]+)?/;
const DOUBLE_QUOTED_STRING_REGEX = /"([^"\\]|\\.)*"/;
const SINGLE_QUOTED_STRING_REGEX = /'([^'\\]|\\.)*'/;
const BACKTICK_IDENTIFIER_REGEX = /`[^`]*`/;
const REGEX_LITERAL_REGEX = /\/(?:[^/\\\n]|\\.)+\/[img]*/;
const MULTI_CHAR_OPERATOR_REGEX = /:=|~>|\?\?|\?:|\.\.|\*\*|!=|<=|>=/;
const SINGLE_CHAR_OPERATOR_REGEX = /[.[\]{}(),@#;:?+\-*/%|=<>^&!~]/;
const IDENTIFIER_REGEX = /[a-zA-Z_]\w*/;
const WHITESPACE_REGEX = /\s+/;
const COMMENT_CONTENT_REGEX = /[^/*]+/;
const COMMENT_END_REGEX = /\*\//;
const COMMENT_CHARS_REGEX = /[/*]/;

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
        [COMMENT_START_REGEX, "comment", "@comment"],

        // Keywords
        [
          KEYWORDS_REGEX,
          {
            cases: {
              "@keywords": "keyword",
              "@default": "identifier",
            },
          },
        ],

        // Lambda symbol
        [LAMBDA_SYMBOL_REGEX, "keyword"],

        // Built-in functions (start with $)
        [
          DOLLAR_IDENTIFIER_REGEX,
          {
            cases: {
              "@default": "predefined",
            },
          },
        ],

        // Variables (start with $)
        [DOLLAR_IDENTIFIER_REGEX, "variable"],

        // Numbers (including scientific notation)
        [NUMBER_REGEX, "number"],

        // Strings (double-quoted)
        [DOUBLE_QUOTED_STRING_REGEX, "string"],

        // Strings (single-quoted)
        [SINGLE_QUOTED_STRING_REGEX, "string"],

        // Quoted names (backticks)
        [BACKTICK_IDENTIFIER_REGEX, "identifier"],

        // Regex literals
        [REGEX_LITERAL_REGEX, "regexp"],

        // Operators (multi-char first)
        [MULTI_CHAR_OPERATOR_REGEX, "operator"],

        // Single-char operators
        [SINGLE_CHAR_OPERATOR_REGEX, "operator"],

        // Identifiers
        [IDENTIFIER_REGEX, "identifier"],

        // Whitespace
        [WHITESPACE_REGEX, "white"],
      ],

      comment: [
        [COMMENT_CONTENT_REGEX, "comment"],
        [COMMENT_END_REGEX, "comment", "@pop"],
        [COMMENT_CHARS_REGEX, "comment"],
      ],
    },
  });
}

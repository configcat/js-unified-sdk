import eslint from "@eslint/js";
import stylisticTs from "@stylistic/eslint-plugin-ts";
import importPlugin from "eslint-plugin-import";
import globals from "globals";
import tseslint from "typescript-eslint";

export default [
  /* Base configuration (@eslint/js, eslint-plugin-import) */
  eslint.configs.recommended,
  importPlugin.flatConfigs.recommended,
  {
    linterOptions: {
      reportUnusedDisableDirectives: "error",
    },
    rules: {
      /* Suggestions (https://eslint.org/docs/latest/rules/#suggestions) */
      "curly": [
        "error",
        "multi-line",
        "consistent"
      ],
      "eqeqeq": [
        "error",
        "always",
        {
          "null": "ignore"
        }
      ],
      "grouped-accessor-pairs": "warn",
      "no-case-declarations": "off",
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-prototype-builtins": "warn",
      "no-sparse-arrays": "warn",
      "no-undef-init": "warn",
      "no-undefined": "error",
      "no-useless-catch": "warn",
      "no-useless-constructor": "warn",
      "no-useless-escape": "warn",
      "no-useless-return": "warn",
      "prefer-promise-reject-errors": "warn",
      "prefer-rest-params": "warn",
      "require-await": "warn",
      "sort-imports": [
        "warn",
        {
          "ignoreCase": false,
          "ignoreDeclarationSort": true,
          "ignoreMemberSort": false,
          "memberSyntaxSortOrder": ["none", "all", "multiple", "single"],
          "allowSeparatedGroups": true
        }
      ],
      /* Layout & Formatting (https://eslint.org/docs/latest/rules/#layout--formatting) */
      "array-bracket-spacing": [
        "warn",
        "never"
      ],
      "arrow-spacing": [
        "warn",
        {
          "before": true,
          "after": true
        }
      ],
      "block-spacing": [
        "warn",
        "always"
      ],
      "brace-style": [
        "warn",
        "stroustrup",
        {
          "allowSingleLine": true
        }
      ],
      "comma-spacing": [
        "warn",
        {
          "after": true
        }
      ],
      "computed-property-spacing": [
        "warn",
        "never"
      ],
      "dot-location": [
        "warn",
        "property"
      ],
      "eol-last": [
        "warn",
        "always"
      ],
      "func-call-spacing": [
        "warn",
        "never"
      ],
      "generator-star-spacing": [
        "warn",
        {
          "before": false,
          "after": true,
          "method": {
            "before": true,
            "after": false
          }
        }
      ],
      "indent": [
        "warn",
        2,
        {
          "SwitchCase": 1,
          "flatTernaryExpressions": true
        }
      ],
      "key-spacing": [
        "warn",
        {
          "beforeColon": false,
          "afterColon": true,
          "mode": "strict"
        }
      ],
      "keyword-spacing": [
        "warn",
        {
          "before": true,
          "after": true
        }
      ],
      "max-len": [
        "off",
        {
          "code": 160,
          "ignoreStrings": true,
          "ignoreTemplateLiterals": true,
          "ignoreRegExpLiterals": true
        }
      ],
      "no-multi-spaces": "warn",
      "no-multiple-empty-lines": [
        "warn",
        {
          "max": 1,
          "maxBOF": 0
        }
      ],
      "no-tabs": "warn",
      "no-trailing-spaces": "warn",
      "no-whitespace-before-property": "warn",
      "object-curly-spacing": [
        "warn",
        "always"
      ],
      "quotes": [
        "warn",
        "double",
        {
          "avoidEscape": true
        }
      ],
      "rest-spread-spacing": [
        "warn",
        "never"
      ],
      "semi": [
        "error",
        "always"
      ],
      "semi-spacing": [
        "warn",
        {
          "before": false,
          "after": true
        }
      ],
      "semi-style": "warn",
      "space-before-blocks": [
        "warn",
        "always"
      ],
      "space-before-function-paren": [
        "warn",
        {
          "anonymous": "never",
          "named": "never",
          "asyncArrow": "always"
        }
      ],
      "space-in-parens": [
        "warn",
        "never"
      ],
      "space-infix-ops": "warn",
      "space-unary-ops": [
        "warn",
        {
          "words": true,
          "nonwords": false
        }
      ],
      "switch-colon-spacing": [
        "warn",
        {
          "before": false,
          "after": true
        }
      ],
      "template-curly-spacing": [
        "warn",
        "never"
      ],
      "template-tag-spacing": [
        "warn",
        "never"
      ],
      "yield-star-spacing": [
        "warn",
        "after"
      ],
      // Import declarations (https://github.com/import-js/eslint-plugin-import)
      "import/order": [
        "warn",
        {
          "groups": [
            ["builtin", "external"],
            "internal",
            "parent",
            "sibling",
            "index",
            "unknown"
          ],
          "newlines-between": "never",
          "alphabetize": {
            "order": "asc",
            "caseInsensitive": true
          }
        }
      ],
      "import/newline-after-import": "warn",
      // This rule seems broken, so we disable it for now.
      "import/no-unresolved": "off",
    }
  },
  /* Additional configuration for build scripts */
  {
    files: ["**/*.{js,cjs,mjs}"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.node
    }
  },
  /* Configuration for src & test files (typescript-eslint) */
  ...tseslint.config(
    {
      files: ["**/*.ts"],
      extends: [
        ...tseslint.configs.strictTypeChecked,
        ...tseslint.configs.stylisticTypeChecked,
      ],
      plugins: {
        "@stylistic/ts": stylisticTs
      },
      languageOptions: {
        parserOptions: {
          ecmaVersion: "latest",
          sourceType: "module",
          project: "tsconfig.json"
        },
      },
      rules: {
        // Supported rules (https://typescript-eslint.io/rules/#supported-rules)
        "@typescript-eslint/array-type": ["error", {
          "default": "array",
          "readonly": "generic" // to support older TS versions
        }],
        "@typescript-eslint/consistent-indexed-object-style": "off",
        "@typescript-eslint/consistent-type-assertions": "off",
        "@typescript-eslint/consistent-type-definitions": "off",
        "@typescript-eslint/dot-notation": "off",
        "@typescript-eslint/no-confusing-void-expression": "off",
        "@typescript-eslint/no-dynamic-delete": "off",
        // https://github.com/typescript-eslint/typescript-eslint/issues/1824#issuecomment-1378327382
        "indent": "off",
        "@stylistic/ts/indent": [
          "warn",
          2,
          {
            "SwitchCase": 1,
            "flatTernaryExpressions": true,
            "ignoredNodes": [
              "TSUnionType"
            ]
          }
        ],
        "@typescript-eslint/no-empty-function": "off",
        "@typescript-eslint/no-empty-interface": "off",
        "@typescript-eslint/no-empty-object-type": "off",
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-floating-promises": "off",
        "@typescript-eslint/no-inferrable-types": "warn",
        "@typescript-eslint/no-invalid-void-type": "warn",
        "@typescript-eslint/no-mixed-enums": "warn",
        "@typescript-eslint/no-non-null-assertion": "off",
        "@typescript-eslint/no-non-null-asserted-nullish-coalescing": "warn",
        "@typescript-eslint/no-require-imports": "error",
        // This rule would be useful but produces too many false positives when `noUncheckedIndexedAccess`
        // is disabled. However, enabling that would cause a lot of other false positives.
        // So we turn this lint rule off until `noUncheckedIndexedAccess` is improved.
        // See also: https://github.com/typescript-eslint/typescript-eslint/issues/6264
        "@typescript-eslint/no-unnecessary-condition": "off",
        "@typescript-eslint/no-unsafe-declaration-merging": "warn",
        "@typescript-eslint/no-unsafe-enum-comparison": "off",
        "@typescript-eslint/no-unsafe-function-type": "off",
        "@typescript-eslint/no-unused-expressions": "off",
        "@typescript-eslint/no-wrapper-object-types": "off",
        "no-unused-vars": "off",
        "@typescript-eslint/no-unused-vars": [
          "warn",
          {
            "args": "none"
          }
        ],
        "no-useless-constructor": "off",
        "@typescript-eslint/no-useless-constructor": "warn",
        "@typescript-eslint/prefer-for-of": "off", // for compatibility reasons
        "@typescript-eslint/prefer-includes": "off",
        "@typescript-eslint/prefer-readonly": "warn",
        "@typescript-eslint/prefer-return-this-type": "warn",
        "@typescript-eslint/prefer-string-starts-ends-with": "off",
        "@typescript-eslint/restrict-plus-operands": "off",
        "@typescript-eslint/restrict-template-expressions": "off",
        "@typescript-eslint/switch-exhaustiveness-check": "warn",
        "@stylistic/ts/type-annotation-spacing": "warn",

        "@typescript-eslint/explicit-member-accessibility": [
          "warn",
          {
            "accessibility": "no-public"
          }
        ],
        "@typescript-eslint/explicit-module-boundary-types": [
          "warn",
          {
            "allowArgumentsExplicitlyTypedAsAny": true
          }
        ],
        "@stylistic/ts/member-delimiter-style": "warn",
        // Based on: https://typescript-eslint.io/rules/naming-convention/#enforce-the-codebase-follows-eslints-camelcase-conventions
        "@typescript-eslint/naming-convention": [
          "warn",
          {
            "selector": "variable",
            "format": [
              "camelCase",
              "UPPER_CASE"
            ]
          },
          {
            "selector": "parameter",
            "format": [
              "camelCase"
            ],
            "leadingUnderscore": "allow"
          },
          {
            "selector": "variableLike",
            "format": [
              "camelCase"
            ]
          },
          {
            "selector": "enumMember",
            "format": [
              "PascalCase"
            ]
          },
          {
            "selector": [
              "classProperty",
              "objectLiteralProperty",
              "typeProperty",
              "accessor"
            ],
            "modifiers": [
              "requiresQuotes"
            ],
            "format": null
          },
          {
            "selector": [
              "classProperty",
              "objectLiteralProperty",
              "typeProperty",
              "accessor"
            ],
            "format": [
              "camelCase",
              "UPPER_CASE"
            ]
          },
          {
            "selector": "memberLike",
            "format": [
              "camelCase"
            ]
          },
          {
            "selector": "typeLike",
            "format": [
              "PascalCase"
            ]
          }
        ],
      },
    },
    /* Additional configuration for src files */
    {
      files: ["src/**/*.ts"],
      rules: {
        // NOTE: Deno doesn't like type exports without the "type" keyword.
        "@typescript-eslint/consistent-type-exports": [
          "error",
          {
            "fixMixedExportsWithInlineTypeSpecifier": false
          }
        ],
        "@typescript-eslint/consistent-type-imports": [
          "error",
          {
            "prefer": "type-imports",
            "fixStyle": "separate-type-imports"
          }
        ],
        "@typescript-eslint/no-import-type-side-effects": "warn"
      }
    },
    /* Additional configuration for test files */
    {
      files: ["test/**/*.ts"],
      rules: {
        "@typescript-eslint/await-thenable": "off",
        "@typescript-eslint/class-literal-property-style": "off",
        "@typescript-eslint/no-misused-promises": "off",
        "@typescript-eslint/no-redundant-type-constituents": "off",
        "@typescript-eslint/no-unsafe-assignment": "off",
        "@typescript-eslint/no-unsafe-argument": "off",
        "@typescript-eslint/no-unsafe-call": "off",
        "@typescript-eslint/no-unsafe-member-access": "off",
        "@typescript-eslint/no-unsafe-return": "off",
        "@typescript-eslint/only-throw-error": "off",
        "@typescript-eslint/unbound-method": "off",
      }
    },
  ),
  /* Ignored files (https://github.com/eslint/eslint/issues/17400) */
  {
    ignores: [
      "build/",
      "coverage/",
      "dist/",
      "extra-checks/",
      "lib/",
      "node_modules/",
      "samples/",
      "src/Hash.ts",
      "src/Semver.ts",
      "test/cloudflare-worker/dist/"
    ]
  }
];

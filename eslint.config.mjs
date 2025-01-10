import eslint from "@eslint/js";
import stylisticJs from "@stylistic/eslint-plugin-js";
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
    plugins: {
      "@stylistic/js": stylisticJs,
      "@stylistic/ts": stylisticTs,
    },
    rules: {
      /* Suggestions (https://eslint.org/docs/latest/rules/#suggestions) */
      "curly": [
        "error",
        "multi-line",
        "consistent",
      ],
      "eqeqeq": [
        "error",
        "always",
        {
          "null": "ignore",
        },
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
          "allowSeparatedGroups": true,
        },
      ],
      /* Layout & Formatting (https://eslint.style/packages/js, https://eslint.style/packages/ts) */
      // NOTE: When a rule has both TS and JS version, use the TS one!
      "@stylistic/js/array-bracket-spacing": ["warn", "never"],
      "@stylistic/js/arrow-spacing": [
        "warn",
        {
          "before": true,
          "after": true,
        },
      ],
      "@stylistic/ts/block-spacing": ["warn", "always"],
      "@stylistic/ts/brace-style": [
        "warn",
        "1tbs",
        {
          "allowSingleLine": true,
        },
      ],
      "@stylistic/ts/comma-dangle": [
        "warn",
        {
          "arrays": "always-multiline",
          "objects": "always-multiline",
          "imports": "always-multiline",
          "exports": "always-multiline",
          "functions": "never",
          "importAttributes": "always-multiline",
          "dynamicImports": "never",
          "enums": "always-multiline",
          "generics": "never",
          "tuples": "always-multiline",
        },
      ],
      "@stylistic/ts/comma-spacing": [
        "warn",
        {
          "after": true,
        },
      ],
      "@stylistic/js/computed-property-spacing": ["warn", "never"],
      "@stylistic/js/dot-location": ["warn", "property"],
      "@stylistic/js/eol-last": ["warn", "always"],
      "@stylistic/ts/func-call-spacing": ["warn", "never"],
      "@stylistic/js/generator-star-spacing": [
        "warn",
        {
          "before": false,
          "after": true,
          "method": {
            "before": true,
            "after": false,
          },
        },
      ],
      "@stylistic/ts/indent": [
        "warn",
        2,
        {
          "SwitchCase": 1,
          "flatTernaryExpressions": true,
          "ignoredNodes": [
            // https://github.com/typescript-eslint/typescript-eslint/issues/1824#issuecomment-1378327382
            "TSUnionType",
          ],
        },
      ],
      "@stylistic/ts/key-spacing": [
        "warn",
        {
          "beforeColon": false,
          "afterColon": true,
          "mode": "strict",
        },
      ],
      "@stylistic/ts/keyword-spacing": [
        "warn",
        {
          "before": true,
          "after": true,
        },
      ],
      "@stylistic/js/max-len": [
        "warn",
        {
          "code": 180,
          "ignoreStrings": true,
          "ignoreTemplateLiterals": true,
          "ignoreRegExpLiterals": true,
        },
      ],
      "@stylistic/ts/member-delimiter-style": "warn",
      "@stylistic/js/new-parens": "warn",
      "@stylistic/ts/no-extra-semi": "warn",
      "@stylistic/js/no-multi-spaces": "warn",
      "@stylistic/js/no-multiple-empty-lines": [
        "warn",
        {
          "max": 1,
          "maxBOF": 0,
        },
      ],
      "@stylistic/js/no-tabs": "warn",
      "@stylistic/js/no-trailing-spaces": "warn",
      "@stylistic/js/no-whitespace-before-property": "warn",
      "@stylistic/ts/object-curly-spacing": ["warn", "always"],
      "@stylistic/js/operator-linebreak": [
        "warn",
        "after",
        {
          "overrides": {
            "**": "before",
            "*": "before",
            "/": "before",
            "%": "before",
            "+": "before",
            "-": "before",
            "<<": "before",
            ">>": "before",
            ">>>": "before",
            "&&": "before",
            "||": "before",
            "??": "before",
            "&": "before",
            "|": "before",
            "^": "before",
            "?": "before",
            ":": "before",
          },
        },
      ],
      "@stylistic/ts/quote-props": ["warn", "consistent"],
      "@stylistic/ts/quotes": [
        "warn",
        "double",
        {
          "avoidEscape": true,
        },
      ],
      "@stylistic/js/rest-spread-spacing": ["warn", "never"],
      "@stylistic/ts/semi": ["warn", "always"],
      "@stylistic/js/semi-spacing": [
        "warn",
        {
          "before": false,
          "after": true,
        },
      ],
      "@stylistic/js/semi-style": "warn",
      "@stylistic/ts/space-before-blocks": ["warn", "always"],
      "@stylistic/ts/space-before-function-paren": [
        "warn",
        {
          "anonymous": "never",
          "named": "never",
          "asyncArrow": "always",
        },
      ],
      "@stylistic/js/space-in-parens": ["warn", "never"],
      "@stylistic/ts/space-infix-ops": "warn",
      "@stylistic/js/space-unary-ops": [
        "warn",
        {
          "words": true,
          "nonwords": false,
        },
      ],
      "@stylistic/js/switch-colon-spacing": [
        "warn",
        {
          "before": false,
          "after": true,
        },
      ],
      "@stylistic/js/template-curly-spacing": ["warn", "never"],
      "@stylistic/js/template-tag-spacing": ["warn", "never"],
      "@stylistic/ts/type-annotation-spacing": "warn",
      "@stylistic/js/yield-star-spacing": ["warn", "after"],
      /* Import declarations (https://github.com/import-js/eslint-plugin-import) */
      "import/order": [
        "warn",
        {
          "groups": [
            ["builtin", "external"],
            "internal",
            "parent",
            "sibling",
            "index",
            "unknown",
          ],
          "newlines-between": "never",
          "alphabetize": {
            "order": "asc",
            "caseInsensitive": true,
          },
        },
      ],
      "import/newline-after-import": "warn",
      // This rule seems broken, so we disable it for now.
      "import/no-unresolved": "off",
    },
  },
  /* Additional configuration for build scripts */
  {
    files: ["**/*.{js,cjs,mjs}"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.node,
    },
  },
  /* Configuration for src & test files (typescript-eslint) */
  ...tseslint.config(
    {
      files: ["**/*.ts"],
      extends: [
        ...tseslint.configs.strictTypeChecked,
        ...tseslint.configs.stylisticTypeChecked,
      ],
      languageOptions: {
        parserOptions: {
          ecmaVersion: "latest",
          sourceType: "module",
          project: "tsconfig.json",
        },
      },
      rules: {
        // Supported rules (https://typescript-eslint.io/rules/#supported-rules)
        "@typescript-eslint/array-type": ["error", {
          "default": "array",
          "readonly": "generic", // to support older TS versions
        }],
        "@typescript-eslint/consistent-indexed-object-style": "off",
        "@typescript-eslint/consistent-type-assertions": "off",
        "@typescript-eslint/consistent-type-definitions": "off",
        "@typescript-eslint/dot-notation": "off",
        "@typescript-eslint/no-confusing-void-expression": "off",
        "@typescript-eslint/no-dynamic-delete": "off",
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
            "args": "none",
          },
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
        "@typescript-eslint/unbound-method": ["error", { ignoreStatic: true }],

        "@typescript-eslint/explicit-member-accessibility": [
          "warn",
          {
            "accessibility": "no-public",
          },
        ],
        "@typescript-eslint/explicit-module-boundary-types": [
          "warn",
          {
            "allowArgumentsExplicitlyTypedAsAny": true,
          },
        ],
        // Based on: https://typescript-eslint.io/rules/naming-convention/#enforce-the-codebase-follows-eslints-camelcase-conventions
        "@typescript-eslint/naming-convention": [
          "warn",
          {
            "selector": "variable",
            "format": [
              "camelCase",
              "UPPER_CASE",
            ],
          },
          {
            "selector": "parameter",
            "format": [
              "camelCase",
            ],
            "leadingUnderscore": "allow",
          },
          {
            "selector": "variableLike",
            "format": [
              "camelCase",
            ],
          },
          {
            "selector": "enumMember",
            "format": [
              "PascalCase",
            ],
          },
          {
            "selector": [
              "classProperty",
              "objectLiteralProperty",
              "typeProperty",
              "accessor",
            ],
            "modifiers": [
              "requiresQuotes",
            ],
            "format": null,
          },
          {
            "selector": [
              "classProperty",
              "objectLiteralProperty",
              "typeProperty",
              "accessor",
            ],
            "format": [
              "camelCase",
              "UPPER_CASE",
            ],
          },
          {
            "selector": "memberLike",
            "format": [
              "camelCase",
            ],
          },
          {
            "selector": "typeLike",
            "format": [
              "PascalCase",
            ],
          },
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
            "fixMixedExportsWithInlineTypeSpecifier": false,
          },
        ],
        "@typescript-eslint/consistent-type-imports": [
          "error",
          {
            "prefer": "type-imports",
            "fixStyle": "separate-type-imports",
          },
        ],
        "@typescript-eslint/no-import-type-side-effects": "warn",
      },
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
      },
    }
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
      "test/cloudflare-worker/dist/",
    ],
  },
];

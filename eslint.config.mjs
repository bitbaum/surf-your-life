import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // Allow _ prefix for intentionally unused variables (e.g. destructuring discard)
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { varsIgnorePattern: "^_", argsIgnorePattern: "^_" },
      ],
      // An empty .catch() discards a real failure. Six batch email senders did
      // this and turned a total delivery outage into {"success":true,"sent":40}.
      // If a failure genuinely must not propagate, use a helper that logs it
      // (lib/email's sendEmailSafe / sendEmailFire) so it stays observable.
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "CallExpression[callee.property.name='catch'] > ArrowFunctionExpression > BlockStatement[body.length=0]",
          message:
            "Empty .catch() swallows the failure silently. Log it (see sendEmailSafe in lib/email) or let it propagate.",
        },
      ],
    },
  },
]);

export default eslintConfig;

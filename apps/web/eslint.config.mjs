import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
  {
    // scripts/ son utilidades operativas de un solo uso (alta de owner y de
    // motoboy) que se ejecutan a mano con node, fuera del bundle de Next.
    // Usan require() a propósito porque apps/web no declara "type": "module".
    // La regla de Next está pensada para el código de la aplicación, no para
    // estos scripts: aplicarla ahí hacía fallar `pnpm lint` de forma permanente
    // (error preexistente), y desde ISSUE-816 el lint es bloqueante en CI.
    files: ["scripts/**/*.js"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
];

export default eslintConfig;

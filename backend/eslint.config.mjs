import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";
import importPlugin from "eslint-plugin-import";

export default defineConfig([
    {
        files: ["**/*.{js,cjs}"],
        plugins: {
            js,
            import: importPlugin,
        },
        extends: ["js/recommended"],
        languageOptions: {
            sourceType: "commonjs",
            globals: globals.node,
        },
        rules: {
            "import/no-unresolved": "error",
            "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
            "no-undef": "error",
        },
        settings: {
            "import/resolver": {
                node: true,
            },
        },
    },
]);

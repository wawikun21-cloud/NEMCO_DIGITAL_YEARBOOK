import js from "@eslint/js"
import { defineConfig, globalIgnores } from "eslint/config"

export default defineConfig([
  globalIgnores(["node_modules", "dist"]),
  {
    files: ["**/*.js"],
    ...js.configs.recommended,
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        console: "readonly",
        process: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        Buffer: "readonly",
        URL: "readonly",
      },
    },
  },
])

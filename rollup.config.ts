import { defineConfig } from "rollup";
import typescript from "@rollup/plugin-typescript";
import dts from "rollup-plugin-dts";

export default defineConfig([
  {
    input: "src/index.ts",
    output: [
      { file: "dist/index.js", generatedCode: "es2015" },
      {
        file: "dist/index.cjs",
        generatedCode: "es2015",
        format: "commonjs",
        exports: "auto",
      },
    ],
    external: /^[@\w]/,
    plugins: [typescript()],
  },
  {
    input: "src/index.ts",
    output: { file: "dist/index.d.ts" },
    plugins: [dts()],
  },
]);

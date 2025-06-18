/// <reference types="vitest" />
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
    plugins: [tsconfigPaths(), react()],
    test: {
        globals: true,
        environment: "jsdom",
        setupFiles: "./src/test-setup.tsx", // Updated to .tsx
        css: true,
        include: ["**/*.test.{ts,tsx}"], // Only include files ending with .test.ts or .test.tsx
        exclude: ["**/node_modules/**", "**/dist/**", "**/e2e/**"], // Exclude e2e directory
        coverage: {
            provider: "v8", // or 'istanbul'
            reporter: [["cobertura", { file: "cobertura-coverage.xml" }]],
        },
    },
});

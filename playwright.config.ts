// playwright.config.ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
    testDir: "./e2e",
    outputDir: "playwright-report/test-results",
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: [
        ["line"],
        ["json"],
        ["html", { open: "never", outputFolder: "playwright-report/html-report" }],
    ],

    timeout: 60000, // Increased global timeout
    use: {
        baseURL: "http://localhost:3000", // Ensure your dev server runs on this port
        trace: "on-first-retry",
        actionTimeout: 60 * 1000, // Increased action timeout
        navigationTimeout: 60 * 1000, // Increased navigation timeout
    },
    projects: [
        {
            name: "chromium",
            use: { ...devices["Desktop Chrome"] },
        },
        // {
        //   name: 'firefox',
        //   use: { ...devices['Desktop Firefox'] },
        // },
        // {
        //   name: 'webkit',
        //   use: { ...devices['Desktop Safari'] },
        // },
    ],
    webServer: {
        command: "npx http-server out -p 3000",
        url: "http://localhost:3000",
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000, // Increase timeout for CI
    },
});

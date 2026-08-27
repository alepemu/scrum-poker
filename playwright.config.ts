import { defineConfig, devices } from '@playwright/test';

/*
 * End-to-end cover for the guarantees vitest cannot reach: anything that needs
 * two browsers, a real socket, or a page reload. `npm run dev` already starts
 * the API and Vite together, and Vite proxies /socket.io through to :3001, so
 * the tests only ever talk to one origin.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },

  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    // Reuse a dev server the developer already has running; CI always starts clean.
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: 'ignore',
  },
});

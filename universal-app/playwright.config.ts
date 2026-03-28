import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Test Configuration
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // Test directory
  testDir: './src/tests/e2e',
  
  // Test file pattern
  testMatch: '**/*.spec.ts',
  
  // Output directory for test artifacts
  outputDir: './test-results',
  
  // Run tests in parallel
  fullyParallel: true,
  
  // Fail the build if you accidentally left test.only in the source
  forbidOnly: !!process.env.CI,
  
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  
  // Workers: use 50% of CPUs on CI, else half available
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter configuration
  reporter: process.env.CI
    ? [
        ['html', { outputFolder: './playwright-report' }],
        ['json', { outputFile: './test-results/results.json' }],
        ['github'],
      ]
    : [
        ['html', { outputFolder: './playwright-report', open: 'never' }],
        ['list'],
      ],
  
  // Global setup/teardown
  // globalSetup: './src/tests/e2e/global-setup.ts',
  // globalTeardown: './src/tests/e2e/global-teardown.ts',
  
  // Shared settings for all projects
  use: {
    // Base URL for navigation
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
    
    // Collect trace on first retry
    trace: 'on-first-retry',
    
    // Take screenshot on failure
    screenshot: 'only-on-failure',
    
    // Record video on retry
    video: 'on-first-retry',
    
    // Default timeout for actions
    actionTimeout: 15000,
    
    // Navigation timeout
    navigationTimeout: 30000,
    
    // Locale and timezone
    locale: 'en-GB',
    timezoneId: 'Europe/London',
    
    // Extra HTTP headers
    extraHTTPHeaders: {
      'Accept-Language': 'en-GB,en',
    },
  },
  
  // Configure projects for major browsers
  projects: [
    // Desktop browsers
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    
    // Mobile browsers
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 13'] },
    },
    
    // Tablet
    {
      name: 'tablet',
      use: { ...devices['iPad Pro 11'] },
    },
  ],
  
  // Timeout for each test
  timeout: 60000,
  
  // Expect timeout
  expect: {
    timeout: 10000,
    toHaveScreenshot: {
      maxDiffPixels: 100,
    },
  },
  
  // Dev server configuration (optional)
  webServer: process.env.CI
    ? undefined
    : {
        command: 'npm run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
        timeout: 120000,
      },
});

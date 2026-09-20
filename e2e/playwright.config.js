const { defineConfig, devices } = require('@playwright/test')

const BACKEND_PORT = 5050
const FRONTEND_PORT = 5175
const E2E_DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/crewhub_e2e?schema=public'

module.exports = defineConfig({
  testDir: './tests',
  globalSetup: require.resolve('./global-setup.js'),
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${FRONTEND_PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: { executablePath: '/opt/pw-browsers/chromium' },
      },
    },
  ],
  webServer: [
    {
      command: 'node ../backend/src/server.js',
      url: `http://localhost:${BACKEND_PORT}/api/health`,
      reuseExistingServer: false,
      timeout: 30000,
      env: {
        DATABASE_URL: E2E_DATABASE_URL,
        PORT: String(BACKEND_PORT),
        FRONTEND_URL: `http://localhost:${FRONTEND_PORT}`,
        JWT_SECRET: 'e2e_test_secret',
        JWT_EXPIRES_IN: '1h',
        SEED_ADMIN_EMAIL: 'admin@crewhub.com',
        SEED_ADMIN_PASSWORD: 'Admin@12345',
      },
    },
    {
      command: `npx vite --port ${FRONTEND_PORT}`,
      cwd: '../frontend',
      url: `http://localhost:${FRONTEND_PORT}`,
      reuseExistingServer: false,
      timeout: 30000,
      env: {
        VITE_API_URL: `http://localhost:${BACKEND_PORT}/api`,
      },
    },
  ],
})

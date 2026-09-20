const { execSync } = require('child_process')

const E2E_DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/crewhub_e2e?schema=public'

module.exports = async function globalSetup() {
  const env = {
    ...process.env,
    DATABASE_URL: E2E_DATABASE_URL,
    SEED_ADMIN_EMAIL: 'admin@crewhub.com',
    SEED_ADMIN_PASSWORD: 'Admin@12345',
  }

  execSync('npx prisma migrate deploy', { cwd: '../backend', env, stdio: 'inherit' })
  execSync('npm run seed', { cwd: '../backend', env, stdio: 'inherit' })
}

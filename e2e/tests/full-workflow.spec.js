const { test, expect } = require('@playwright/test')

async function selectByPartialLabel(page, selectSelector, partialText) {
  const value = await page
    .locator(selectSelector)
    .locator('option', { hasText: partialText })
    .first()
    .getAttribute('value')
  await page.locator(selectSelector).selectOption(value)
}

// Encodes the platform's fixed workflow end-to-end:
// Admin creates Client -> Admin creates Project -> Admin assigns Freelancer ->
// Admin creates Task -> Freelancer updates Task status -> Admin monitors progress.
test('fixed workflow: admin creates and assigns work, freelancer completes it, admin sees progress', async ({ page }) => {
  const runId = Date.now()
  const clientEmail = `e2e-client-${runId}@test.com`
  const freelancerEmail = `e2e-dev-${runId}@test.com`
  const projectName = `E2E Project ${runId}`
  const taskTitle = `E2E Task ${runId}`

  // --- Admin creates a client ---
  await page.goto('/login')
  await page.fill('#email', 'admin@crewhub.com')
  await page.fill('#password', 'Admin@12345')
  await page.click('button[type=submit]')
  await expect(page.getByText('Welcome, Agency Admin')).toBeVisible()

  await page.goto('/clients/new')
  await page.fill('input[type=email]', clientEmail)
  await page.locator('label:has-text("Full name") + input').fill(`E2E Client ${runId}`)
  await page.locator('label:has-text("Company name") + input').fill(`E2E Co ${runId}`)
  await page.click('button:has-text("Create client")')
  await expect(page.getByText('Client account created')).toBeVisible()
  await page.click('text=Back to clients')

  // --- Admin creates a freelancer ---
  await page.goto('/freelancers/new')
  await page.fill('input[type=email]', freelancerEmail)
  await page.locator('label:has-text("Full name") + input').fill(`E2E Dev ${runId}`)
  await page.click('button:has-text("Create freelancer")')
  await expect(page.getByText('Freelancer account created')).toBeVisible()
  const freelancerPasswordLine = await page.locator('p:has-text("Temporary password:")').textContent()
  const password = freelancerPasswordLine.replace('Temporary password:', '').trim()
  await page.click('text=Back to freelancers')

  // --- Admin creates a project for the client ---
  await page.goto('/projects/new')
  await page.locator('input').first().fill(projectName)
  await selectByPartialLabel(page, 'select >> nth=0', `E2E Co ${runId}`)
  await page.click('button:has-text("Create project")')
  await expect(page.getByText('Team')).toBeVisible()
  const projectUrl = page.url()

  // --- Admin assigns the freelancer to the project ---
  await selectByPartialLabel(page, 'select >> nth=1', `E2E Dev ${runId}`)
  await page.click('button:has-text("Assign")')
  await expect(page.getByText(`E2E Dev ${runId}`)).toBeVisible()

  // --- Admin creates a task assigned to the freelancer ---
  await page.click('text=Add Task')
  await page.locator('input').first().fill(taskTitle)
  await page.waitForFunction(() => document.querySelectorAll('select')[1]?.options.length > 1)
  await selectByPartialLabel(page, 'select >> nth=1', `E2E Dev ${runId}`)
  await page.click('button:has-text("Create task")')
  await expect(page.getByText('Assigned to')).toBeVisible()

  // --- Freelancer logs in, sees the task, and marks it completed ---
  await page.click('text=Logout')
  await expect(page.getByText('Sign in to your account')).toBeVisible()

  await page.fill('#email', freelancerEmail)
  await page.fill('#password', password)
  await page.click('button[type=submit]')
  await expect(page.getByText(`Welcome, E2E Dev ${runId}`)).toBeVisible()

  await page.click('text=Tasks')
  await expect(page.getByText(taskTitle)).toBeVisible()
  await page.selectOption('table select', 'COMPLETED')
  await expect(page.locator('table select')).toHaveValue('COMPLETED')

  // --- Admin verifies the project progress reflects the completed task ---
  await page.click('text=Logout')
  await expect(page.getByText('Sign in to your account')).toBeVisible()

  await page.fill('#email', 'admin@crewhub.com')
  await page.fill('#password', 'Admin@12345')
  await page.click('button[type=submit]')
  await expect(page.getByText('Welcome, Agency Admin')).toBeVisible()

  await page.goto(projectUrl)
  await expect(page.getByText('100%')).toBeVisible()
})

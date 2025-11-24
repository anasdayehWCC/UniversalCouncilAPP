import { test, expect } from '@playwright/test'

test.describe('Export flow (smoke)', () => {
  test.skip(true, 'Requires backend + auth; enable in CI env with PLAYWRIGHT=1')

  test('minutes page shows export buttons', async ({ page }) => {
    await page.goto(process.env.BASE_URL || 'http://localhost:3000/transcriptions/demo')
    await expect(page.getByText(/Export DOCX/i)).toBeVisible()
    await expect(page.getByText(/Export PDF/i)).toBeVisible()
  })
})

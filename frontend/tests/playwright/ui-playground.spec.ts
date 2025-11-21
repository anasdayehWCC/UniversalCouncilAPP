import { test, expect } from '@playwright/test'

test.describe('UI Playground snapshots', () => {
  test.skip(!process.env.PLAYWRIGHT, 'Run only when PLAYWRIGHT=1')

  test('renders token primitives', async ({ page }) => {
    const base = process.env.BASE_URL || 'http://localhost:3000'
    await page.goto(`${base}/ui-playground`)
    await expect(page.getByRole('heading', { name: 'UI Playground (dev only)' })).toBeVisible()
    await page.getByText('PressableSurface').waitFor()
    await page.screenshot({ path: 'artifacts/ui-playground.png', fullPage: true })
  })
})

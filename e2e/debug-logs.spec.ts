import { test } from '@playwright/test'

test('Debug logs', async ({ page }) => {
  const EMAIL = `dl_${Date.now()}@test.com`

  page.on('console', msg => {
    const t = msg.text()
    if (t.includes('[AUTH]') || t.includes('[BAND]')) {
      console.log(t)
    }
  })

  // Kayıt
  await page.goto('http://localhost:3000/auth/register')
  await page.fill('input[type="text"]', 'DL User')
  await page.fill('input[type="email"]', EMAIL)
  await page.fill('input[type="password"]', 'testpass123')
  await page.click('button[type="submit"]')
  await page.waitForTimeout(8000)

  console.log('=== URL:', page.url(), '===')
  await page.waitForTimeout(5000)
})

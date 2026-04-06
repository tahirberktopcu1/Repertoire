import { test } from '@playwright/test'

test('Debug redirect', async ({ page }) => {
  const EMAIL = `dr_${Date.now()}@test.com`

  page.on('console', msg => {
    const t = msg.text()
    if (t.includes('[AUTH]') || t.includes('[BAND]') || t.includes('[SHELL]')) {
      console.log(t)
    }
  })

  // Kayıt
  await page.goto('http://localhost:3000/auth/register')
  await page.fill('input[type="text"]', 'DR User')
  await page.fill('input[type="email"]', EMAIL)
  await page.fill('input[type="password"]', 'testpass123')
  await page.click('button[type="submit"]')

  // 20 saniye bekle ve URL'yi izle
  for (let i = 0; i < 10; i++) {
    await page.waitForTimeout(2000)
    console.log(`[${(i+1)*2}s] URL: ${page.url()}`)
    if (page.url().includes('bands/create')) {
      console.log('✅ bands/create\'e yönlendirildi!')
      break
    }
  }

  await page.screenshot({ path: 'e2e/screenshots/debug-redirect.png' })
})

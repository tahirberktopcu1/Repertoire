import { test, expect } from '@playwright/test'

test('Debug3: click testi', async ({ page }) => {
  const EMAIL = `d3_${Date.now()}@test.com`

  // Konsol loglarını yakala
  page.on('console', msg => console.log(`[CONSOLE ${msg.type()}]`, msg.text()))

  // Kayıt
  await page.goto('http://localhost:3000/auth/register')
  await page.fill('input[type="text"]', 'Debug3')
  await page.fill('input[type="email"]', EMAIL)
  await page.fill('input[type="password"]', 'testpass123')
  await page.click('button[type="submit"]')
  await page.waitForTimeout(5000)

  console.log('URL:', page.url())

  if (page.url().includes('bands/create')) {
    // Sayfanın tamamen yüklenmesini bekle
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Butonları say
    const buttons = await page.locator('button').count()
    console.log('Button count:', buttons)

    // İlk butona tıkla (Yeni Grup Oluştur)
    const firstBtn = page.locator('button').first()
    const btnText = await firstBtn.textContent()
    console.log('First button text:', btnText)

    await firstBtn.click()
    await page.waitForTimeout(2000)
    await page.screenshot({ path: 'e2e/screenshots/debug3-after-click.png' })

    // input var mı?
    const inputs = await page.locator('input').count()
    console.log('Input count after click:', inputs)

    if (inputs > 0) {
      const placeholders = await page.locator('input').evaluateAll(els => els.map(e => (e as HTMLInputElement).placeholder))
      console.log('Input placeholders:', placeholders)
    }
  }
})

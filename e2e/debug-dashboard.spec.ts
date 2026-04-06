import { test } from '@playwright/test'

test('Debug dashboard loading', async ({ page }) => {
  const EMAIL = `dd_${Date.now()}@test.com`

  page.on('console', msg => {
    if (msg.type() === 'error' || msg.type() === 'warn') {
      console.log(`[${msg.type()}]`, msg.text().substring(0, 200))
    }
  })

  page.on('response', response => {
    if (response.url().includes('supabase') && response.status() >= 400) {
      console.log(`[HTTP ${response.status()}]`, response.url().substring(0, 150))
    }
  })

  // Kayıt
  await page.goto('http://localhost:3000/auth/register')
  await page.fill('input[type="text"]', 'DD User')
  await page.fill('input[type="email"]', EMAIL)
  await page.fill('input[type="password"]', 'testpass123')
  await page.click('button[type="submit"]')
  await page.waitForTimeout(8000)

  console.log('URL:', page.url())

  // Eğer bands/create ise grup oluştur
  if (page.url().includes('bands/create')) {
    await page.waitForTimeout(2000)
    await page.locator('button').first().click()
    await page.waitForTimeout(1000)
    await page.fill('input[placeholder*="örneğin"]', 'DD Band')
    await page.locator('button:has-text("Grup Oluştur")').click()
    await page.waitForTimeout(8000)
    console.log('After create URL:', page.url())
  }

  // Dashboard'da mı?
  if (page.url().includes('dashboard')) {
    // 15 saniye daha bekle ve HTTP hatalarını izle
    for (let i = 0; i < 5; i++) {
      await page.waitForTimeout(3000)
      const nav = await page.locator('nav').isVisible().catch(() => false)
      console.log(`[${(i+1)*3}s] nav visible: ${nav}`)
      if (nav) {
        console.log('✅ Dashboard yüklendi!')
        await page.screenshot({ path: 'e2e/screenshots/dd-success.png' })
        break
      }
    }
    await page.screenshot({ path: 'e2e/screenshots/dd-final.png' })
  }
})

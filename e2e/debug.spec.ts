import { test, expect } from '@playwright/test'

const BASE = 'http://localhost:3000'
const EMAIL = `debug_${Date.now()}@test.com`
const PASS = 'testpass123'

test('Debug: kayıt → grup oluştur → dashboard', async ({ page }) => {
  // 1. Kayıt ol
  await page.goto(`${BASE}/auth/register`)
  await page.fill('input[type="text"]', 'Debug User')
  await page.fill('input[type="email"]', EMAIL)
  await page.fill('input[type="password"]', PASS)
  await page.click('button[type="submit"]')

  // Yönlendirmeyi bekle
  await page.waitForTimeout(5000)
  await page.screenshot({ path: 'e2e/screenshots/01-after-register.png' })
  console.log('After register URL:', page.url())

  // 2. Eğer bands/create'e geldiyse
  if (page.url().includes('bands/create')) {
    console.log('On bands/create page')

    // Sayfada ne var kontrol et
    const bodyText = await page.textContent('body')
    console.log('Page text (first 500):', bodyText?.substring(0, 500))

    // Hoş Geldiniz yazısını bul
    const hosgeldin = page.locator('text=Hoş Geldiniz')
    const isVisible = await hosgeldin.isVisible().catch(() => false)
    console.log('Hoş Geldiniz visible:', isVisible)

    if (isVisible) {
      await page.click('text=Yeni Grup Oluştur')
      await page.waitForTimeout(500)
      await page.screenshot({ path: 'e2e/screenshots/02-create-form.png' })

      await page.fill('input[placeholder*="örneğin"]', 'Debug Band')
      await page.click('button:has-text("Grup Oluştur")')
      await page.waitForTimeout(5000)
      await page.screenshot({ path: 'e2e/screenshots/03-after-create.png' })
      console.log('After create URL:', page.url())
    } else {
      // Loading'de mi kaldı?
      await page.screenshot({ path: 'e2e/screenshots/02-bands-create-stuck.png' })
      console.log('bands/create sayfası boş veya loading')
    }
  } else if (page.url().includes('dashboard')) {
    console.log('Direkt dashboard\'a geldi')
    await page.screenshot({ path: 'e2e/screenshots/01-dashboard.png' })
  } else {
    console.log('Beklenmeyen URL:', page.url())
    await page.screenshot({ path: 'e2e/screenshots/01-unexpected.png' })
  }
})

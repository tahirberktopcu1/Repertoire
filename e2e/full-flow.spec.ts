import { test, expect } from '@playwright/test'

const BASE = 'http://localhost:3000'
const EMAIL = `flow_${Date.now()}@test.com`
const PASS = 'testpass123'

test('Tam akış: kayıt → grup → dashboard → havuz → repertuvar → ayarlar → eksikler', async ({ page }) => {
  test.setTimeout(90000)

  // 1. Kayıt ol
  console.log('1. Kayıt...')
  await page.goto(`${BASE}/auth/register`)
  await page.fill('input[type="text"]', 'Flow Tester')
  await page.fill('input[type="email"]', EMAIL)
  await page.fill('input[type="password"]', PASS)
  await page.click('button[type="submit"]')
  await page.waitForTimeout(5000)
  console.log('   URL:', page.url())

  // 2. Eğer bands/create'e geldiyse grup oluştur
  if (page.url().includes('bands/create')) {
    console.log('2. Grup oluştur...')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    await page.locator('button').first().click()
    await page.waitForTimeout(1000)
    await page.fill('input[placeholder*="örneğin"]', 'Flow Band')

    await Promise.all([
      page.waitForNavigation({ timeout: 20000 }).catch(() => {}),
      page.locator('button:has-text("Grup Oluştur")').click(),
    ])
    await page.waitForTimeout(5000)
    console.log('   URL:', page.url())
  }

  // 3. Dashboard'a gel
  console.log('3. Dashboard...')
  if (!page.url().includes('dashboard')) {
    await page.goto(`${BASE}/dashboard`)
  }
  await page.waitForTimeout(5000)
  await page.screenshot({ path: 'e2e/screenshots/flow-dashboard.png' })

  const navBar = await page.locator('nav').isVisible().catch(() => false)
  console.log('   NavBar:', navBar)

  if (!navBar) {
    // Hala loading — daha uzun bekle
    await page.waitForTimeout(5000)
    await page.screenshot({ path: 'e2e/screenshots/flow-dashboard-retry.png' })
  }

  // 4. Havuz
  console.log('4. Havuz...')
  await page.click('a[href="/songs"]')
  await page.waitForTimeout(3000)
  await page.screenshot({ path: 'e2e/screenshots/flow-havuz.png' })
  const havuz = await page.locator('text=Şarkı Havuzu').isVisible().catch(() => false)
  console.log('   Şarkı Havuzu:', havuz)

  // 5. Repertuvar
  console.log('5. Repertuvar...')
  await page.click('a[href="/repertoire"]')
  await page.waitForTimeout(3000)
  await page.screenshot({ path: 'e2e/screenshots/flow-repertuvar.png' })

  // 6. Ayarlar
  console.log('6. Ayarlar...')
  await page.click('a[href="/settings"]')
  await page.waitForTimeout(3000)
  await page.screenshot({ path: 'e2e/screenshots/flow-ayarlar.png' })
  const davet = await page.locator('text=Davet Kodu').isVisible().catch(() => false)
  console.log('   Davet Kodu:', davet)

  // 7. Eksikler
  console.log('7. Eksikler...')
  await page.click('a[href="/deficiencies"]')
  await page.waitForTimeout(3000)
  await page.screenshot({ path: 'e2e/screenshots/flow-eksikler.png' })

  console.log('✅ TEST TAMAMLANDI')
})

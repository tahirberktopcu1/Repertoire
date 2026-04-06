import { test, expect } from '@playwright/test'

test('FINAL: Kayıt → Grup → Dashboard → Tüm Sayfalar', async ({ page }) => {
  test.setTimeout(90000)
  const EMAIL = `final_${Date.now()}@test.com`

  // 1. KAYIT
  console.log('1. Kayıt')
  await page.goto('http://localhost:3000/auth/register')
  await page.fill('input[type="text"]', 'Final User')
  await page.fill('input[type="email"]', EMAIL)
  await page.fill('input[type="password"]', 'testpass123')
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/(dashboard|bands)/, { timeout: 15000 })
  console.log('  ✅ URL:', page.url())

  // 2. GRUP OLUŞTUR
  // bands/create'e yönlendirilene kadar bekle
  await page.waitForURL('**/bands/create', { timeout: 15000 })
  console.log('2. Grup oluştur')
  await page.waitForSelector('text=Hoş Geldiniz', { timeout: 10000 })
  await page.locator('button').first().click()
  await page.waitForTimeout(1000)
  await page.fill('input[placeholder*="örneğin"]', 'Final Band')
  await page.locator('button:has-text("Grup Oluştur")').click()
  await page.waitForURL('**/dashboard', { timeout: 15000 })
  console.log('  ✅ Grup oluşturuldu, URL:', page.url())

  // 3. DASHBOARD BEKLE
  console.log('3. Dashboard')
  await page.waitForSelector('nav', { timeout: 20000 })
  await page.screenshot({ path: 'e2e/screenshots/final-dashboard.png' })
  console.log('  ✅ Dashboard yüklendi!')

  // 4. TÜM SAYFALAR
  const pages = [
    { href: '/songs', name: 'Havuz', check: 'Şarkı Havuzu' },
    { href: '/repertoire', name: 'Repertuvar', check: 'Repertuvar' },
    { href: '/deficiencies', name: 'Eksikler', check: 'Eksikler' },
    { href: '/settings', name: 'Ayarlar', check: 'Davet Kodu' },
  ]

  for (const p of pages) {
    console.log(`4. ${p.name}`)
    await page.click(`a[href="${p.href}"]`)
    await page.waitForTimeout(3000)
    const visible = await page.locator(`text=${p.check}`).first().isVisible().catch(() => false)
    await page.screenshot({ path: `e2e/screenshots/final-${p.name.toLowerCase()}.png` })
    console.log(`  ${visible ? '✅' : '❌'} ${p.name}`)
    expect(visible).toBe(true)
  }

  console.log('🎉 TÜM TESTLER BAŞARILI!')
})

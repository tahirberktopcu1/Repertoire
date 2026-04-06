import { test, expect } from '@playwright/test'

const BASE = 'http://localhost:3000'
const TEST_EMAIL = `e2e_${Date.now()}@test.com`
const TEST_PASS = 'testpass123'
const TEST_NAME = 'E2E Tester'

test.describe('Repertoire App E2E', () => {

  test('1. Kayıt sayfası açılır', async ({ page }) => {
    await page.goto(`${BASE}/auth/register`)
    await expect(page.locator('h2')).toContainText('Kayıt Ol')
  })

  test('2. Yeni kullanıcı kayıt olabilir', async ({ page }) => {
    await page.goto(`${BASE}/auth/register`)
    await page.fill('input[type="text"]', TEST_NAME)
    await page.fill('input[type="email"]', TEST_EMAIL)
    await page.fill('input[type="password"]', TEST_PASS)
    await page.click('button[type="submit"]')

    // Dashboard veya bands/create'e yönlendirmeli
    await page.waitForURL(/\/(dashboard|bands\/create)/, { timeout: 15000 })
    const url = page.url()
    expect(url).toMatch(/\/(dashboard|bands\/create)/)
  })

  test('3. Giriş yapabilir', async ({ page }) => {
    await page.goto(`${BASE}/auth/login`)
    await page.fill('input[type="email"]', TEST_EMAIL)
    await page.fill('input[type="password"]', TEST_PASS)
    await page.click('button[type="submit"]')

    await page.waitForURL(/\/(dashboard|bands\/create)/, { timeout: 15000 })
  })

  test('4. Grup oluşturabilir ve dashboard açılır', async ({ page }) => {
    // Giriş yap
    await page.goto(`${BASE}/auth/login`)
    await page.fill('input[type="email"]', TEST_EMAIL)
    await page.fill('input[type="password"]', TEST_PASS)
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/(dashboard|bands\/create)/, { timeout: 15000 })

    // Eğer bands/create'e yönlendildiyse grup oluştur
    if (page.url().includes('bands/create')) {
      // "Yeni Grup Oluştur" butonuna tıkla
      await page.click('text=Yeni Grup Oluştur')
      await page.waitForTimeout(500)

      // Grup adı gir
      await page.fill('input[placeholder*="örneğin"]', 'Test Grubu')
      await page.click('button:has-text("Grup Oluştur")')

      await page.waitForURL('**/dashboard', { timeout: 15000 })
    }

    // Dashboard yüklendi
    await expect(page.locator('text=Prova Oluştur')).toBeVisible({ timeout: 10000 })
  })

  test('5. Tüm akış: giriş → dashboard → havuz → şarkı ekle', async ({ page }) => {
    // Giriş
    await page.goto(`${BASE}/auth/login`)
    await page.fill('input[type="email"]', TEST_EMAIL)
    await page.fill('input[type="password"]', TEST_PASS)
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/(dashboard|bands)/, { timeout: 15000 })

    // Eğer grup yoksa oluştur
    if (page.url().includes('bands/create')) {
      await page.click('text=Yeni Grup Oluştur')
      await page.waitForTimeout(500)
      await page.fill('input[placeholder*="örneğin"]', 'Test Grubu')
      await page.click('button:has-text("Grup Oluştur")')
      await page.waitForURL('**/dashboard', { timeout: 15000 })
    }

    // Havuza git
    await page.click('text=Havuz')
    await page.waitForURL('**/songs', { timeout: 5000 })
    await expect(page.locator('text=Şarkı Havuzu')).toBeVisible()

    // Şarkı öner
    await page.click('text=Şarkı Öner')
    await page.waitForTimeout(300)

    // Spotify linki gir
    await page.fill('input[placeholder*="spotify"]', 'https://open.spotify.com/track/abc123')
    await page.waitForTimeout(1000) // Detection wait

    // Şarkı adı ve sanatçı düzenle
    const titleInput = page.locator('input[placeholder*="Şarkı adı"]')
    if (await titleInput.isVisible()) {
      await titleInput.clear()
      await titleInput.fill('Test Şarkı')
      const artistInput = page.locator('input[placeholder*="Sanatçı"]')
      await artistInput.clear()
      await artistInput.fill('Test Sanatçı')
      await page.click('button:has-text("Öner")')
      await page.waitForTimeout(1000)
    }

    // Repertuvara git
    await page.click('text=Repertuvar')
    await page.waitForURL('**/repertoire', { timeout: 5000 })
    await expect(page.locator('text=Repertuvar')).toBeVisible()

    // Ayarlara git
    await page.click('text=Ayarlar')
    await page.waitForURL('**/settings', { timeout: 5000 })
    await expect(page.locator('text=Profil')).toBeVisible()
    await expect(page.locator('text=Davet Kodu')).toBeVisible()

    // Eksiklere git
    await page.click('text=Eksikler')
    await page.waitForURL('**/deficiencies', { timeout: 5000 })
  })
})

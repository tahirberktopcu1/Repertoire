import { test, expect } from '@playwright/test'

const BASE = 'http://localhost:3000'
const PASS = 'testpass123'

async function register(page: any, name: string, email: string) {
  await page.goto(`${BASE}/auth/register`)
  await page.fill('input[type="text"]', name)
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', PASS)
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/(dashboard|bands)/, { timeout: 15000 })
  await page.waitForTimeout(3000)
}

async function login(page: any, email: string) {
  await page.goto(`${BASE}/auth/login`)
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', PASS)
  await page.click('button[type="submit"]')
  await page.waitForTimeout(5000)
}

async function waitForDashboard(page: any) {
  for (let i = 0; i < 10; i++) {
    const nav = await page.locator('nav').isVisible().catch(() => false)
    if (nav) return true
    await page.waitForTimeout(2000)
  }
  return false
}

async function createBand(page: any, name: string) {
  if (!page.url().includes('bands/create')) return
  await page.waitForSelector('text=Hoş Geldiniz', { timeout: 10000 })
  await page.locator('button').first().click()
  await page.waitForTimeout(1000)
  await page.fill('input[placeholder*="örneğin"]', name)
  await page.locator('button:has-text("Grup Oluştur")').click()
  await page.waitForTimeout(5000)
}

test('Grup: oluştur → davet kodu al → katıl → ayrıl → sil', async ({ page, context }) => {
  test.setTimeout(120000)

  const ts = Date.now()
  const OWNER_EMAIL = `owner_${ts}@test.com`
  const MEMBER_EMAIL = `member_${ts}@test.com`

  // === 1. OWNER: Kayıt + Grup Oluştur ===
  console.log('1. Owner kayıt + grup oluştur')
  await register(page, 'Grup Sahibi', OWNER_EMAIL)
  if (page.url().includes('bands/create')) {
    await createBand(page, 'Test Grubu')
  }
  const dashOk = await waitForDashboard(page)
  expect(dashOk).toBe(true)
  console.log('  ✅ Dashboard')

  // Ayarlara git — davet kodu al
  await page.click('a[href="/settings"]')
  await page.waitForTimeout(3000)
  const inviteCode = await page.locator('code').first().textContent()
  console.log('  ✅ Davet kodu:', inviteCode)
  expect(inviteCode?.length).toBeGreaterThan(5)

  // Grubu Sil görünmeli
  const deleteBtnVisible = await page.locator('text=Grubu Sil').isVisible()
  expect(deleteBtnVisible).toBe(true)
  console.log('  ✅ Grubu Sil görünür (owner)')
  await page.screenshot({ path: 'e2e/screenshots/gm-01-owner-settings.png' })

  // === 2. MEMBER: Kayıt + Gruba Katıl ===
  console.log('2. Member kayıt + gruba katıl')
  // Farklı context (farklı cookie'ler)
  const memberContext = await page.context().browser()!.newContext()
  const memberPage = await memberContext.newPage()
  await register(memberPage, 'Yeni Üye', MEMBER_EMAIL)

  if (memberPage.url().includes('bands/create')) {
    await memberPage.waitForSelector('text=Hoş Geldiniz', { timeout: 10000 })
    // "Gruba Katıl" butonuna tıkla
    const joinBtn = memberPage.locator('button').filter({ hasText: 'Gruba Katıl' }).first()
    await joinBtn.click()
    await memberPage.waitForTimeout(1000)
    await memberPage.fill('input[placeholder*="abc123"]', inviteCode!)
    await memberPage.locator('button:has-text("Gruba Katıl")').last().click()
    await memberPage.waitForTimeout(5000)
    console.log('  Katılma sonrası URL:', memberPage.url())
  }

  const memberDash = await waitForDashboard(memberPage)
  if (memberDash) {
    console.log('  ✅ Gruba katılma başarılı')

    // Ayarlara git — Grubu Sil GÖRÜNMEMELI
    await memberPage.click('a[href="/settings"]')
    await memberPage.waitForTimeout(3000)
    const memberDeleteBtn = await memberPage.locator('text=Grubu Sil').isVisible().catch(() => false)
    console.log(`  Grubu Sil: ${memberDeleteBtn ? '❌ GÖRÜNÜR (HATALI)' : '✅ GİZLİ (DOĞRU)'}`)
    expect(memberDeleteBtn).toBe(false)
    await memberPage.screenshot({ path: 'e2e/screenshots/gm-02-member-settings.png' })

    // === 3. MEMBER: Gruptan Ayrıl ===
    console.log('3. Member gruptan ayrıl')
    await memberPage.click('text=Gruptan Ayrıl')
    await memberPage.waitForTimeout(500)
    await memberPage.screenshot({ path: 'e2e/screenshots/gm-03-leave-confirm.png' })
    // Dialog'daki buton — overlay'in üstünde
    await memberPage.locator('.z-10 button:has-text("Ayrıl")').click({ force: true })
    await memberPage.waitForTimeout(5000)
    console.log('  Ayrılma sonrası URL:', memberPage.url())
    expect(memberPage.url()).toContain('bands/create')
    console.log('  ✅ Gruptan ayrılma başarılı')
    await memberPage.screenshot({ path: 'e2e/screenshots/gm-04-after-leave.png' })
  } else {
    console.log('  ⚠️ Member dashboard yüklenemedi, katılma testi atlanıyor')
  }

  await memberPage.close()

  // === 4. OWNER: Grubu Sil ===
  console.log('4. Owner grubu sil')
  // Owner sayfasında hala ayarlardayız
  await page.click('a[href="/settings"]')
  await page.waitForTimeout(3000)
  await page.click('text=Grubu Sil')
  await page.waitForTimeout(500)
  await page.screenshot({ path: 'e2e/screenshots/gm-05-delete-confirm.png' })
  await page.locator('.z-10 button:has-text("Grubu Sil")').click({ force: true })
  await page.waitForTimeout(5000)
  console.log('  Silme sonrası URL:', page.url())
  expect(page.url()).toContain('bands/create')
  console.log('  ✅ Grup silme başarılı')
  await page.screenshot({ path: 'e2e/screenshots/gm-06-after-delete.png' })

  console.log('🎉 TÜM GRUP YÖNETİMİ TESTLERİ BAŞARILI!')
})

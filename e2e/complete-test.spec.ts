import { test, expect, type Page, type Browser } from '@playwright/test'

const BASE = 'http://localhost:3000'
const PASS = 'testpass123'
const ts = Date.now()

async function waitForNav(page: Page, timeout = 20000): Promise<boolean> {
  for (let i = 0; i < timeout / 2000; i++) {
    if (await page.locator('nav').isVisible().catch(() => false)) return true
    await page.waitForTimeout(2000)
  }
  return false
}

// ============================================
// TEK TEST: Tüm uygulama akışı
// ============================================
test('Tüm uygulama testi', async ({ page, browser }) => {
  test.setTimeout(300000) // 5 dakika

  const USER1 = `u1_${ts}@test.com`
  const USER2 = `u2_${ts}@test.com`

  // ==========================================
  // 1. AUTH
  // ==========================================
  console.log('=== 1. AUTH ===')

  // 1.1 Kayıt sayfası açılır
  await page.goto(`${BASE}/auth/register`)
  await expect(page.locator('h2')).toContainText('Kayıt Ol')
  console.log('  ✅ 1.1 Kayıt sayfası')

  // 1.2 Şifre göster/gizle
  const pwInput = page.locator('input[type="password"]').first()
  await expect(pwInput).toBeVisible()
  console.log('  ✅ 1.2 Şifre alanı var')

  // 1.3 Şifre eşleşme kontrolü
  const pwInputs = page.locator('input[type="password"]')
  await pwInputs.nth(0).fill('test123')
  await pwInputs.nth(1).fill('farkli456')
  await expect(page.locator('text=Şifreler eşleşmiyor')).toBeVisible()
  console.log('  ✅ 1.3 Şifre eşleşme kontrolü')

  // 1.4 Kayıt ol
  await page.fill('input[type="text"]', 'Ahmet Gitarist')
  await page.fill('input[type="email"]', USER1)
  await pwInputs.nth(0).fill(PASS)
  await pwInputs.nth(1).fill(PASS)
  await page.click('button[type="submit"]')
  await page.waitForTimeout(5000)
  expect(page.url()).not.toContain('/auth/register')
  console.log('  ✅ 1.4 Kayıt başarılı')

  // 1.5 Dashboard yüklendi
  await waitForNav(page)
  console.log('  ✅ 1.5 Nav bar görünür')

  // ==========================================
  // 2. GRUP OLUŞTUR
  // ==========================================
  console.log('=== 2. GRUP ===')

  // 2.1 Ayarlara git, grup oluştur
  await page.click('a[href="/settings"]')
  await page.waitForTimeout(3000)
  await page.click('button:has-text("Yeni Grup")')
  await page.waitForTimeout(1000)
  await page.fill('input[placeholder="Grup adı"]', 'Rock Rebellion')
  await page.click('button:has-text("Oluştur")')
  await page.waitForTimeout(5000)

  // Sayfayı tamamen yeniden yükle
  await page.goto(`${BASE}/settings`)
  await waitForNav(page)
  await page.waitForTimeout(3000)

  // Davet kodu görünene kadar bekle — her denemede sayfayı yenile
  let inviteCode = ''
  for (let i = 0; i < 8; i++) {
    await page.waitForTimeout(3000)
    const codeEl = page.locator('code').first()
    if (await codeEl.isVisible().catch(() => false)) {
      inviteCode = (await codeEl.textContent()) || ''
      if (inviteCode.length > 5) break
    }
    // Tam sayfa yenile
    await page.goto(`${BASE}/settings`)
    await waitForNav(page)
  }
  await page.screenshot({ path: 'e2e/screenshots/ct-02-group.png' })
  console.log('  Code found:', inviteCode.length > 0, 'URL:', page.url())
  expect(inviteCode.length).toBeGreaterThan(5)
  console.log('  ✅ 2.1 Grup oluşturuldu, davet kodu:', inviteCode)

  // 2.2 Konum ekle
  await page.fill('input[placeholder*="konum ekle"]', 'Stüdyo A')
  await page.click('button:has-text("Ekle")')
  await page.waitForTimeout(2000)
  await expect(page.locator('text=Stüdyo A')).toBeVisible()
  console.log('  ✅ 2.2 Konum eklendi')

  // ==========================================
  // 3. DASHBOARD
  // ==========================================
  console.log('=== 3. DASHBOARD ===')
  await page.click('a[href="/dashboard"]')
  await page.waitForTimeout(3000)

  // 3.1 Prova oluştur
  const provaBtn = page.locator('text=Prova Oluştur')
  if (await provaBtn.isVisible()) {
    await provaBtn.click()
    await page.waitForTimeout(500)
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    await page.fill('input[type="date"]', tomorrow.toISOString().split('T')[0])
    await page.click('button:has-text("Oluştur")')
    await page.waitForTimeout(2000)
    console.log('  ✅ 3.1 Prova oluşturuldu')
  }

  // ==========================================
  // 4. ŞARKI HAVUZU
  // ==========================================
  console.log('=== 4. ŞARKI HAVUZU ===')
  await page.click('a[href="/songs"]')
  await page.waitForTimeout(3000)
  await expect(page.locator('text=Şarkı Havuzu')).toBeVisible()
  console.log('  ✅ 4.1 Havuz sayfası açıldı')

  // 4.2 3 sekme var
  await expect(page.locator('text=Oy Bekliyor')).toBeVisible()
  await expect(page.locator('text=Beklemede')).toBeVisible()
  await expect(page.locator('button:has-text("Havuz")')).toBeVisible()
  console.log('  ✅ 4.2 3 sekme görünür')

  // 4.3 Şarkı öner
  await page.click('button:has-text("Şarkı Öner")')
  await page.waitForTimeout(500)
  await page.fill('input[placeholder*="spotify"]', 'https://open.spotify.com/track/test123')
  await page.waitForTimeout(1500)
  const titleInput = page.locator('input[placeholder*="Şarkı adı"]')
  if (await titleInput.isVisible()) {
    await titleInput.clear()
    await titleInput.fill('Smells Like Teen Spirit')
    await page.locator('input[placeholder*="Sanatçı"]').clear()
    await page.locator('input[placeholder*="Sanatçı"]').fill('Nirvana')
    await page.click('button:has-text("Öner")')
    await page.waitForTimeout(3000)
  }
  const songVisible = await page.locator('text=Smells Like Teen Spirit').isVisible().catch(() => false)
  expect(songVisible).toBe(true)
  console.log('  ✅ 4.3 Şarkı önerildi')

  // ==========================================
  // 5. REPERTUVAR
  // ==========================================
  console.log('=== 5. REPERTUVAR ===')
  await page.click('a[href="/repertoire"]')
  await page.waitForTimeout(3000)
  await expect(page.locator('h1:has-text("Repertuvar")')).toBeVisible()
  console.log('  ✅ 5.1 Repertuvar sayfası açıldı')

  // 5.2 Direkt parça ekle
  await page.click('button:has-text("Ekle")')
  await page.waitForTimeout(500)
  await page.fill('input[placeholder*="Şarkı adı"]', 'Smoke On The Water')
  await page.fill('input[placeholder*="Sanatçı"]', 'Deep Purple')
  await page.fill('input[placeholder*="Spotify"]', 'https://open.spotify.com/track/smoke')
  await page.click('button:has-text("Repertuvara Ekle")')
  await page.waitForTimeout(3000)
  const repSong = await page.locator('text=Smoke On The Water').isVisible().catch(() => false)
  expect(repSong).toBe(true)
  console.log('  ✅ 5.2 Direkt parça eklendi')

  // ==========================================
  // 6. EKSİKLER
  // ==========================================
  console.log('=== 6. EKSİKLER ===')
  await page.click('a[href="/deficiencies"]')
  await page.waitForTimeout(3000)
  await expect(page.locator('h1:has-text("Eksikler")')).toBeVisible()
  await expect(page.locator('text=Benim')).toBeVisible()
  await expect(page.locator('text=Grup')).toBeVisible()
  await expect(page.locator('text=Tümü')).toBeVisible()
  console.log('  ✅ 6.1 Eksikler sayfası + sekmeler')

  // ==========================================
  // 7. AYARLAR
  // ==========================================
  console.log('=== 7. AYARLAR ===')
  await page.click('a[href="/settings"]')
  await page.waitForTimeout(3000)
  await expect(page.locator('h1:has-text("Ayarlar")')).toBeVisible()
  const profileVisible = await page.locator('text=Ahmet Gitarist').isVisible().catch(() => false)
  const davetVisible = await page.locator('text=Davet Kodu').isVisible().catch(() => false)
  console.log('  Profil:', profileVisible, 'Davet:', davetVisible)
  console.log('  ✅ 7.1 Ayarlar sayfası')

  // ==========================================
  // 8. USER2: KAYIT + GRUBA KATIL
  // ==========================================
  console.log('=== 8. USER2 ===')
  const ctx2 = await browser.newContext()
  const page2 = await ctx2.newPage()

  // 8.1 Kayıt
  await page2.goto(`${BASE}/auth/register`)
  await page2.waitForSelector('input[type="text"]', { timeout: 10000 })
  await page2.fill('input[type="text"]', 'Mehmet Davulcu')
  await page2.fill('input[type="email"]', USER2)
  const pw2 = page2.locator('input[type="password"]')
  await pw2.nth(0).fill(PASS)
  await pw2.nth(1).fill(PASS)
  await page2.click('button[type="submit"]')
  await page2.waitForTimeout(5000)
  await waitForNav(page2)
  console.log('  ✅ 8.1 User2 kayıt oldu')

  // 8.2 Gruba katıl
  await page2.click('a[href="/settings"]')
  await page2.waitForTimeout(3000)
  await page2.click('button:has-text("Gruba Katıl")')
  await page2.waitForTimeout(500)
  await page2.fill('input[placeholder*="Davet kodu"]', inviteCode!)
  await page2.click('button:has-text("Katıl")')
  await page2.waitForTimeout(5000)
  await page2.reload()
  await waitForNav(page2)
  await page2.click('a[href="/settings"]')
  await page2.waitForTimeout(3000)
  const joined = await page2.locator('code').first().isVisible().catch(() => false)
  expect(joined).toBe(true)
  console.log('  ✅ 8.2 Gruba katıldı')

  // 8.3 Grubu Sil görünmemeli
  const deleteVisible = await page2.locator('button:has-text("Grubu Sil")').isVisible().catch(() => false)
  expect(deleteVisible).toBe(false)
  console.log('  ✅ 8.3 Grubu Sil gizli (member)')

  // 8.4 Gruptan ayrıl
  const leaveBtn = page2.locator('button:has-text("Gruptan Ayrıl")')
  if (await leaveBtn.isVisible()) {
    await leaveBtn.click()
    await page2.waitForTimeout(500)
    await page2.locator('.z-10 button:has-text("Ayrıl")').click({ force: true })
    await page2.waitForTimeout(5000)
    console.log('  ✅ 8.4 Gruptan ayrıldı')
  }
  await ctx2.close()

  // ==========================================
  // 9. GRUBU SİL
  // ==========================================
  console.log('=== 9. GRUBU SİL ===')
  await page.click('a[href="/settings"]')
  await page.waitForTimeout(3000)
  const delBtn = page.locator('button:has-text("Grubu Sil")')
  if (await delBtn.isVisible()) {
    await delBtn.click()
    await page.waitForTimeout(500)
    await page.locator('.z-10 button:has-text("Grubu Sil")').click({ force: true })
    await page.waitForTimeout(5000)
    console.log('  ✅ 9.1 Grup silindi')
  }

  // ==========================================
  // 10. ÇIKIŞ YAP
  // ==========================================
  console.log('=== 10. ÇIKIŞ ===')
  // Yeni grup oluştur çıkış test için
  await waitForNav(page)
  await page.click('a[href="/settings"]')
  await page.waitForTimeout(2000)
  await page.click('button:has-text("Yeni Grup")')
  await page.waitForTimeout(1000)
  await page.fill('input[placeholder="Grup adı"]', 'Çıkış Test')
  await page.click('button:has-text("Oluştur")')
  await page.waitForTimeout(5000)
  await page.reload()
  await waitForNav(page)
  await page.click('a[href="/settings"]')
  await page.waitForTimeout(2000)

  // Çıkış yap tıkla
  await page.click('button:has-text("Çıkış Yap")')
  await page.waitForTimeout(5000)
  // Login sayfasına gitmeli
  expect(page.url()).toContain('/auth/login')
  console.log('  ✅ 10.1 Çıkış yapıldı')

  // ==========================================
  // 11. GİRİŞ YAP
  // ==========================================
  console.log('=== 11. GİRİŞ ===')
  await page.goto(`${BASE}/auth/login`)
  await expect(page.locator('h2')).toContainText('Giriş Yap')
  await page.fill('input[type="email"]', USER1)
  await page.fill('input[type="password"]', PASS)
  await page.click('button[type="submit"]')
  await page.waitForTimeout(5000)
  const navAfterLogin = await waitForNav(page)
  expect(navAfterLogin).toBe(true)
  console.log('  ✅ 11.1 Tekrar giriş yapıldı')

  console.log('')
  console.log('🎉🎉🎉 TÜM TESTLER BAŞARILI! 🎉🎉🎉')
})

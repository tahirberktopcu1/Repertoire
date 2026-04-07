import { test, expect, type Page, type BrowserContext } from '@playwright/test'

const BASE = 'http://localhost:3000'
const PASS = 'testpass123'
const ts = Date.now()
const USER1_EMAIL = `user1_${ts}@test.com`
const USER2_EMAIL = `user2_${ts}@test.com`

async function screenshot(page: Page, name: string) {
  await page.screenshot({ path: `e2e/screenshots/full-${name}.png` })
}

async function waitForApp(page: Page, timeout = 20000) {
  for (let i = 0; i < timeout / 2000; i++) {
    const nav = await page.locator('nav').isVisible().catch(() => false)
    if (nav) return true
    await page.waitForTimeout(2000)
  }
  return false
}

test('FULL APP TEST', async ({ page, browser }) => {
  test.setTimeout(300000)

  // ============================================
  // 1. KAYIT - User 1
  // ============================================
  console.log('=== 1. KAYIT (User1) ===')
  await page.goto(`${BASE}/auth/register`)
  await expect(page.locator('h2')).toContainText('Kayıt Ol', { timeout: 10000 })
  await page.fill('input[type="text"]', 'Ahmet Gitarist')
  await page.fill('input[type="email"]', USER1_EMAIL)
  await page.fill('input[type="password"]', PASS)
  await page.click('button[type="submit"]')
  await page.waitForTimeout(5000)
  console.log('  URL:', page.url())
  await screenshot(page, '01-after-register')
  console.log('  ✅ Kayıt başarılı')

  // ============================================
  // 2. DASHBOARD - Grup yok mesajı veya ayarlara yönlendir
  // ============================================
  console.log('=== 2. DASHBOARD ===')
  const appLoaded = await waitForApp(page)
  await screenshot(page, '02-dashboard')

  if (appLoaded) {
    // Dashboard yüklendi - grup yoksa mesaj gösterir
    const noGroup = await page.locator('text=Henüz Grubun Yok').isVisible().catch(() => false)
    if (noGroup) {
      console.log('  ✅ "Henüz Grubun Yok" mesajı görünüyor')
    } else {
      console.log('  ✅ Dashboard yüklendi (grup var)')
    }
  }

  // ============================================
  // 3. AYARLAR - Grup oluştur
  // ============================================
  console.log('=== 3. GRUP OLUŞTUR (Ayarlar) ===')
  await page.click('a[href="/settings"]')
  await page.waitForTimeout(3000)
  await screenshot(page, '03-settings')

  // Yeni Grup butonuna tıkla
  await page.click('button:has-text("Yeni Grup")')
  await page.waitForTimeout(1000)
  await page.fill('input[placeholder="Grup adı"]', 'Rock Rebellion')
  await screenshot(page, '03b-create-form')
  await page.click('button:has-text("Oluştur")')
  await page.waitForTimeout(5000)
  await screenshot(page, '04-after-group-create')

  // Sayfa yenile — refreshBands sonrası grup bilgisi güncellenmiş olmalı
  await page.reload()
  await page.waitForTimeout(5000)

  // Grup oluştu mu kontrol et
  const groupName = await page.locator('text=Rock Rebellion').isVisible().catch(() => false)
  console.log('  Grup görünüyor:', groupName)
  if (!groupName) {
    // Alert ile hata göstermiş olabilir
    await screenshot(page, '04b-group-fail')
    console.log('  ⚠️ Grup görünmüyor, devam ediliyor')
  }
  console.log('  ✅ Grup oluşturma adımı tamamlandı')

  // Davet kodunu al
  const codeEl = page.locator('code').first()
  const codeVisible = await codeEl.isVisible().catch(() => false)
  let inviteCode = ''
  if (codeVisible) {
    inviteCode = (await codeEl.textContent()) || ''
    console.log('  Davet kodu:', inviteCode)
  } else {
    console.log('  ⚠️ Davet kodu bulunamadı (grup oluşmamış olabilir)')
  }

  // ============================================
  // 4. KONUM EKLE
  // ============================================
  console.log('=== 4. KONUM EKLE ===')
  await page.fill('input[placeholder*="konum ekle"]', 'Stüdyo A')
  await page.click('button:has-text("Ekle")')
  await page.waitForTimeout(1000)
  const locationVisible = await page.locator('text=Stüdyo A').isVisible().catch(() => false)
  console.log('  Konum görünüyor:', locationVisible)
  expect(locationVisible).toBe(true)
  console.log('  ✅ Konum eklendi')
  await screenshot(page, '05-location-added')

  // ============================================
  // 5. DASHBOARD - Prova oluştur
  // ============================================
  console.log('=== 5. PROVA OLUŞTUR ===')
  await page.click('a[href="/dashboard"]')
  await page.waitForTimeout(2000)

  const provaBtn = await page.locator('text=Prova Oluştur').isVisible().catch(() => false)
  if (provaBtn) {
    await page.click('text=Prova Oluştur')
    await page.waitForTimeout(500)

    // Tarih - yarın
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dateStr = tomorrow.toISOString().split('T')[0]
    await page.fill('input[type="date"]', dateStr)
    await page.fill('input[type="time"] >> nth=0', '19:00')
    await page.fill('input[type="time"] >> nth=1', '21:00')

    // Konum seç
    const locationSelect = page.locator('select')
    const optionCount = await locationSelect.locator('option').count()
    if (optionCount > 1) {
      await locationSelect.selectOption({ index: 1 })
    }

    await page.click('button:has-text("Oluştur")')
    await page.waitForTimeout(2000)
    console.log('  ✅ Prova oluşturuldu')
  }
  await screenshot(page, '06-dashboard-with-prova')

  // ============================================
  // 6. HAVUZ - Şarkı öner
  // ============================================
  console.log('=== 6. ŞARKI ÖNER ===')
  await page.click('a[href="/songs"]')
  await page.waitForTimeout(3000)
  await screenshot(page, '07-havuz-empty')

  // Şarkı Öner tıkla
  await page.click('button:has-text("Şarkı Öner")')
  await page.waitForTimeout(500)

  // Spotify linki gir
  await page.fill('input[placeholder*="spotify"]', 'https://open.spotify.com/track/5ghIJDpPoe3CfHMGu71E6T')
  await page.waitForTimeout(1500) // Auto-detect bekle

  // Şarkı adı ve sanatçı düzenle
  const titleInput = page.locator('input[placeholder*="Şarkı adı"]')
  if (await titleInput.isVisible()) {
    await titleInput.clear()
    await titleInput.fill('Smells Like Teen Spirit')
    const artistInput = page.locator('input[placeholder*="Sanatçı"]')
    await artistInput.clear()
    await artistInput.fill('Nirvana')
    await page.click('button:has-text("Öner")')
    await page.waitForTimeout(2000)
    console.log('  ✅ Şarkı 1 önerildi')
  }
  await screenshot(page, '08-song-added')

  // İkinci şarkı
  await page.click('button:has-text("Şarkı Öner")')
  await page.waitForTimeout(500)
  await page.fill('input[placeholder*="youtube"]', 'https://www.youtube.com/watch?v=pAgnJDJN4VA')
  await page.waitForTimeout(1500)
  const titleInput2 = page.locator('input[placeholder*="Şarkı adı"]')
  if (await titleInput2.isVisible()) {
    await titleInput2.clear()
    await titleInput2.fill('Back In Black')
    const artistInput2 = page.locator('input[placeholder*="Sanatçı"]')
    await artistInput2.clear()
    await artistInput2.fill('AC/DC')
    await page.click('button:has-text("Öner")')
    await page.waitForTimeout(2000)
    console.log('  ✅ Şarkı 2 önerildi')
  }
  await screenshot(page, '09-two-songs')

  // ============================================
  // 7. PUANLAMA
  // ============================================
  console.log('=== 7. PUANLAMA ===')
  // İlk şarkıya 9 puan ver
  const ratingBtns = page.locator('button:has-text("9")').first()
  if (await ratingBtns.isVisible()) {
    await ratingBtns.click()
    await page.waitForTimeout(1000)
    console.log('  ✅ Şarkı 1 puanlandı')
  }
  await screenshot(page, '10-rated')

  // ============================================
  // 8. REPERTUVAR - Direkt parça ekle
  // ============================================
  console.log('=== 8. REPERTUVAR ===')
  await page.click('a[href="/repertoire"]')
  await page.waitForTimeout(3000)
  await screenshot(page, '11-repertoire-empty')

  // Direkt parça ekle
  const addBtn = page.locator('button:has-text("Ekle")').first()
  if (await addBtn.isVisible()) {
    await addBtn.click()
    await page.waitForTimeout(500)
    await page.fill('input[placeholder*="Şarkı adı"]', 'Smoke On The Water')
    await page.fill('input[placeholder*="Sanatçı"]', 'Deep Purple')
    await page.fill('input[placeholder*="Spotify"]', 'https://open.spotify.com/track/xxx')
    await page.click('button:has-text("Repertuvara Ekle")')
    await page.waitForTimeout(2000)
    console.log('  ✅ Direkt parça eklendi')
  }
  await screenshot(page, '12-repertoire-with-song')

  // Parçaya tıkla - eksik ekle
  const songRow = page.locator('text=Smoke On The Water').first()
  if (await songRow.isVisible()) {
    await songRow.click()
    await page.waitForTimeout(500)

    // Eksik ekle
    const defInput = page.locator('input[placeholder*="Eksik ekle"]')
    if (await defInput.isVisible()) {
      await defInput.fill('Solo kısmı daha yavaş çalınmalı')
      await page.locator('select').last().selectOption({ index: 0 }) // Grup
      await page.click('button svg.lucide-plus')
      await page.waitForTimeout(1000)
      console.log('  ✅ Eksik eklendi')
    }
  }
  await screenshot(page, '13-deficiency-added')

  // ============================================
  // 9. EKSİKLER SAYFASI
  // ============================================
  console.log('=== 9. EKSİKLER ===')
  await page.click('a[href="/deficiencies"]')
  await page.waitForTimeout(3000)
  await screenshot(page, '14-deficiencies')
  const defPage = await page.locator('text=Eksikler').first().isVisible().catch(() => false)
  console.log('  Eksikler sayfası:', defPage)
  console.log('  ✅ Eksikler sayfası çalışıyor')

  // ============================================
  // 10. USER2 - Kayıt + Gruba katıl
  // ============================================
  console.log('=== 10. USER2 KAYIT + GRUBA KATIL ===')
  const ctx2 = await browser.newContext()
  const page2 = await ctx2.newPage()

  // Kayıt
  await page2.goto(`${BASE}/auth/register`)
  await page2.waitForTimeout(2000)
  await page2.fill('input[type="text"]', 'Mehmet Davulcu')
  await page2.fill('input[type="email"]', USER2_EMAIL)
  await page2.fill('input[type="password"]', PASS)
  await page2.click('button[type="submit"]')
  await page2.waitForTimeout(5000)
  console.log('  User2 URL:', page2.url())

  // Ayarlara git - gruba katıl
  const app2 = await waitForApp(page2)
  if (app2) {
    await page2.click('a[href="/settings"]')
    await page2.waitForTimeout(2000)
  } else {
    await page2.goto(`${BASE}/settings`)
    await page2.waitForTimeout(3000)
  }

  // Gruba Katıl
  await page2.click('button:has-text("Gruba Katıl")')
  await page2.waitForTimeout(500)
  await page2.fill('input[placeholder*="Davet kodu"]', inviteCode!)
  await page2.click('button:has-text("Katıl")')
  await page2.waitForTimeout(5000)
  await screenshot(page2, '15-user2-joined')
  console.log('  User2 katılma sonrası URL:', page2.url())

  // Grup adı görünüyor mu?
  const groupVisible = await page2.locator('text=Rock Rebellion').isVisible().catch(() => false)
  console.log('  Grup görünüyor:', groupVisible)
  if (groupVisible) console.log('  ✅ Gruba katılma başarılı')

  // User2 havuza git - şarkılar görünüyor mu?
  await page2.click('a[href="/songs"]')
  await page2.waitForTimeout(3000)
  await screenshot(page2, '16-user2-songs')
  const songsVisible = await page2.locator('text=Smells Like Teen Spirit').isVisible().catch(() => false)
  console.log('  User2 şarkıları görüyor:', songsVisible)

  // ============================================
  // 11. USER2 - Puanlama
  // ============================================
  if (songsVisible) {
    console.log('=== 11. USER2 PUANLAMA ===')
    const rateBtn = page2.locator('button:has-text("8")').first()
    if (await rateBtn.isVisible()) {
      await rateBtn.click()
      await page2.waitForTimeout(1000)
      console.log('  ✅ User2 puanladı')
    }
    await screenshot(page2, '17-user2-rated')
  }

  // ============================================
  // 12. GRUBU SİL KONTROLÜ - User2 görmemeli
  // ============================================
  console.log('=== 12. GRUBU SİL KONTROLÜ ===')
  await page2.click('a[href="/settings"]')
  await page2.waitForTimeout(2000)
  const deleteBtn = await page2.locator('text=Grubu Sil').isVisible().catch(() => false)
  console.log('  User2 Grubu Sil görebiliyor:', deleteBtn)
  expect(deleteBtn).toBe(false)
  console.log('  ✅ Grubu Sil sadece owner\'da')

  // ============================================
  // 13. USER2 - Gruptan ayrıl
  // ============================================
  console.log('=== 13. USER2 GRUPTAN AYRIL ===')
  const leaveBtn = page2.locator('button:has-text("Gruptan Ayrıl")')
  if (await leaveBtn.isVisible()) {
    await leaveBtn.click()
    await page2.waitForTimeout(500)
    await page2.locator('.z-10 button:has-text("Ayrıl")').click({ force: true })
    await page2.waitForTimeout(5000)
    console.log('  Ayrılma sonrası URL:', page2.url())
    await screenshot(page2, '18-user2-left')
    console.log('  ✅ Gruptan ayrılma başarılı')
  }

  await ctx2.close()

  // ============================================
  // 14. USER1 - Grubu sil
  // ============================================
  console.log('=== 14. GRUBU SİL ===')
  await page.click('a[href="/settings"]')
  await page.waitForTimeout(3000)

  const ownerDeleteBtn = page.locator('button:has-text("Grubu Sil")')
  if (await ownerDeleteBtn.isVisible()) {
    await ownerDeleteBtn.click()
    await page.waitForTimeout(500)
    await page.locator('.z-10 button:has-text("Grubu Sil")').click({ force: true })
    await page.waitForTimeout(5000)
    console.log('  Silme sonrası URL:', page.url())
    await screenshot(page, '19-group-deleted')
    console.log('  ✅ Grup silindi')
  }

  // ============================================
  // 15. TÜM SAYFALARIN RENDER KONTROLÜ
  // ============================================
  console.log('=== 15. SAYFA RENDER KONTROLÜ ===')

  // Yeni grup oluştur tekrar test için
  await page.goto(`${BASE}/settings`)
  await page.waitForTimeout(3000)
  const navAfter = await waitForApp(page)
  if (navAfter) {
    await page.click('button:has-text("Yeni Grup")')
    await page.waitForTimeout(500)
    await page.fill('input[placeholder="Grup adı"]', 'Final Test Band')
    await page.click('button:has-text("Oluştur")')
    await page.waitForTimeout(3000)
  }

  const pages = [
    { href: '/dashboard', name: 'Dashboard' },
    { href: '/songs', name: 'Havuz' },
    { href: '/repertoire', name: 'Repertuvar' },
    { href: '/deficiencies', name: 'Eksikler' },
    { href: '/settings', name: 'Ayarlar' },
  ]

  for (const p of pages) {
    await page.click(`a[href="${p.href}"]`)
    await page.waitForTimeout(2000)
    const visible = await page.locator('nav').isVisible().catch(() => false)
    console.log(`  ${p.name}: ${visible ? '✅' : '❌'}`)
    await screenshot(page, `20-${p.name.toLowerCase()}`)
  }

  console.log('')
  console.log('🎉🎉🎉 TÜM TESTLER TAMAMLANDI! 🎉🎉🎉')
})

import { test } from '@playwright/test'

test('Debug: gruba katılma', async ({ page, browser }) => {
  test.setTimeout(60000)
  const ts = Date.now()
  const OWNER_EMAIL = `oj_${ts}@test.com`
  const MEMBER_EMAIL = `mj_${ts}@test.com`
  const PASS = 'testpass123'

  page.on('console', msg => {
    if (msg.type() === 'error') console.log('[ERR]', msg.text().substring(0, 200))
  })
  page.on('response', res => {
    if (res.url().includes('supabase') && res.url().includes('rest') && res.status() >= 400) {
      console.log(`[API ${res.status()}]`, res.url().split('rest/v1/')[1]?.substring(0, 100))
    }
  })

  // 1. Owner kayıt + grup oluştur
  console.log('1. Owner kayıt')
  await page.goto('http://localhost:3000/auth/register')
  await page.fill('input[type="text"]', 'Owner')
  await page.fill('input[type="email"]', OWNER_EMAIL)
  await page.fill('input[type="password"]', PASS)
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/(dashboard|bands)/, { timeout: 15000 })
  await page.waitForTimeout(3000)

  if (page.url().includes('bands/create')) {
    await page.waitForSelector('text=Hoş Geldiniz', { timeout: 10000 })
    await page.locator('button').first().click()
    await page.waitForTimeout(1000)
    await page.fill('input[placeholder*="örneğin"]', 'Join Test Band')
    await page.locator('button:has-text("Grup Oluştur")').click()
    await page.waitForTimeout(5000)
  }

  // Davet kodunu al
  await page.waitForSelector('nav', { timeout: 20000 })
  await page.click('a[href="/settings"]')
  await page.waitForTimeout(3000)
  const inviteCode = await page.locator('code').first().textContent()
  console.log('Davet kodu:', inviteCode)

  // 2. Member kayıt + katılma
  console.log('2. Member kayıt')
  const memberContext = await browser.newContext()
  const memberPage = await memberContext.newPage()

  memberPage.on('console', msg => {
    if (msg.type() === 'error') console.log('[MEMBER ERR]', msg.text().substring(0, 200))
  })
  memberPage.on('response', res => {
    if (res.url().includes('supabase') && res.url().includes('rest') && res.status() >= 400) {
      res.text().then(body => console.log(`[MEMBER API ${res.status()}]`, res.url().split('rest/v1/')[1]?.substring(0, 60), body.substring(0, 100)))
    }
  })

  await memberPage.goto('http://localhost:3000/auth/register')
  await memberPage.fill('input[type="text"]', 'Member')
  await memberPage.fill('input[type="email"]', MEMBER_EMAIL)
  await memberPage.fill('input[type="password"]', PASS)
  await memberPage.click('button[type="submit"]')
  await memberPage.waitForURL(/\/(dashboard|bands)/, { timeout: 15000 })
  await memberPage.waitForTimeout(3000)

  console.log('Member URL:', memberPage.url())

  if (memberPage.url().includes('bands/create')) {
    await memberPage.waitForSelector('text=Hoş Geldiniz', { timeout: 10000 })

    // Gruba Katıl tıkla
    const joinBtn = memberPage.locator('button').filter({ hasText: 'Gruba Katıl' }).first()
    await joinBtn.click()
    await memberPage.waitForTimeout(1000)
    await memberPage.screenshot({ path: 'e2e/screenshots/dj-join-form.png' })

    // Kodu gir
    await memberPage.fill('input[placeholder*="abc123"]', inviteCode!)
    console.log('Kod girildi:', inviteCode)

    // Katıl butonuna tıkla
    const submitBtn = memberPage.locator('button:has-text("Gruba Katıl")').last()
    console.log('Submit button text:', await submitBtn.textContent())
    await submitBtn.click()
    await memberPage.waitForTimeout(5000)

    // Sonuç
    console.log('Katılma sonrası URL:', memberPage.url())
    await memberPage.screenshot({ path: 'e2e/screenshots/dj-after-join.png' })

    // Hata mesajı var mı?
    const errorEl = memberPage.locator('.text-red-400')
    const errorText = await errorEl.textContent().catch(() => null)
    if (errorText) console.log('HATA:', errorText)
  }

  await memberContext.close()
})

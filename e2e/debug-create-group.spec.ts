import { test } from '@playwright/test'

test('Debug: grup oluşturma', async ({ page }) => {
  test.setTimeout(60000)
  const email = `dcg_${Date.now()}@test.com`

  page.on('console', msg => {
    if (msg.type() === 'error' || msg.text().includes('alert')) {
      console.log(`[${msg.type()}]`, msg.text().substring(0, 200))
    }
  })

  page.on('dialog', async dialog => {
    console.log('[ALERT]', dialog.message())
    await dialog.dismiss()
  })

  page.on('response', res => {
    if (res.url().includes('supabase') && res.url().includes('rest')) {
      console.log(`[API ${res.status()}]`, res.url().split('rest/v1/')[1]?.substring(0, 80))
    }
  })

  // Kayıt
  await page.goto('http://localhost:3000/auth/register')
  await page.waitForSelector('input[type="text"]', { timeout: 10000 })
  await page.fill('input[type="text"]', 'DCG User')
  await page.fill('input[type="email"]', email)
  const pwInputs = page.locator('input[type="password"]')
  await pwInputs.nth(0).fill('testpass123')
  await pwInputs.nth(1).fill('testpass123')
  await page.click('button[type="submit"]')
  await page.waitForTimeout(8000)
  console.log('URL after register:', page.url())

  // Ayarlara git
  const nav = await page.locator('nav').isVisible().catch(() => false)
  if (nav) {
    await page.click('a[href="/settings"]')
  } else {
    await page.goto('http://localhost:3000/settings')
  }
  await page.waitForTimeout(3000)

  // Yeni Grup tıkla
  console.log('Clicking Yeni Grup...')
  await page.click('button:has-text("Yeni Grup")')
  await page.waitForTimeout(1000)

  // Input görünüyor mu?
  const input = page.locator('input[placeholder="Grup adı"]')
  const inputVisible = await input.isVisible().catch(() => false)
  console.log('Input visible:', inputVisible)

  if (inputVisible) {
    await input.fill('Debug Band')
    console.log('Clicking Oluştur...')
    await page.click('button:has-text("Oluştur")')
    await page.waitForTimeout(8000)
    await page.screenshot({ path: 'e2e/screenshots/dcg-after-create.png' })
    console.log('URL after create:', page.url())

    // Grup görünüyor mu?
    await page.reload()
    await page.waitForTimeout(5000)
    const groupVisible = await page.locator('text=Debug Band').isVisible().catch(() => false)
    console.log('Group visible after reload:', groupVisible)
    await page.screenshot({ path: 'e2e/screenshots/dcg-after-reload.png' })
  }
})

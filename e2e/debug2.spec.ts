import { test, expect } from '@playwright/test'

test('Debug2: loading state kontrolü', async ({ page }) => {
  const EMAIL = `d2_${Date.now()}@test.com`

  // Kayıt ol
  await page.goto('http://localhost:3000/auth/register')
  await page.fill('input[type="text"]', 'Debug2')
  await page.fill('input[type="email"]', EMAIL)
  await page.fill('input[type="password"]', 'testpass123')
  await page.click('button[type="submit"]')

  // Bekle
  await page.waitForTimeout(3000)
  console.log('URL after register:', page.url())

  // 10 saniye daha bekle ve her 2 saniyede screenshot al
  for (let i = 0; i < 5; i++) {
    await page.waitForTimeout(2000)
    const url = page.url()
    const bodyText = await page.textContent('body').catch(() => '')
    console.log(`[${(i+1)*2}s] URL: ${url}, body length: ${bodyText?.length}, has "Hoş": ${bodyText?.includes('Hoş')}, has "Prova": ${bodyText?.includes('Prova')}, has spinner: ${bodyText?.includes('')}`)
    await page.screenshot({ path: `e2e/screenshots/debug2-${i}.png` })

    // Eğer bands/create'e yönlendirildiyse ve Hoş Geldiniz varsa
    if (url.includes('bands/create') && bodyText?.includes('Hoş')) {
      console.log('bands/create sayfası yüklendi!')
      break
    }
  }

  // Son durum
  const finalUrl = page.url()
  console.log('Final URL:', finalUrl)

  // Konsol hatalarını yakala
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('Console error:', msg.text())
  })
})

import { test } from '@playwright/test'

test('Debug: auth state', async ({ page }) => {
  const EMAIL = `ds_${Date.now()}@test.com`

  page.on('console', msg => {
    const text = msg.text()
    if (text.includes('[AUTH]') || text.includes('[BAND]') || text.includes('error') || text.includes('Error')) {
      console.log(`[CONSOLE]`, text.substring(0, 300))
    }
  })

  page.on('response', response => {
    if (response.url().includes('supabase') && response.url().includes('rest')) {
      console.log(`[API ${response.status()}]`, response.url().split('rest/v1/')[1]?.substring(0, 80) || response.url().substring(0, 80))
    }
  })

  // Kayıt
  await page.goto('http://localhost:3000/auth/register')
  await page.fill('input[type="text"]', 'DS User')
  await page.fill('input[type="email"]', EMAIL)
  await page.fill('input[type="password"]', 'testpass123')
  await page.click('button[type="submit"]')
  await page.waitForTimeout(10000)

  console.log('URL:', page.url())

  // JS ile auth state kontrol et
  const authState = await page.evaluate(async () => {
    // @ts-ignore
    const ls = { ...localStorage }
    const keys = Object.keys(ls).filter(k => k.includes('supabase') || k.includes('auth'))
    return { keys, values: keys.map(k => ls[k]?.substring(0, 100)) }
  })
  console.log('Auth storage keys:', authState.keys)
  console.log('Auth storage values:', authState.values)
})

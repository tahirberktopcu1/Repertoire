import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import webPush from 'web-push'

webPush.setVapidDetails(
  'mailto:app@repertoire.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: Request) {
  try {
    const { bandId, title, body, url, excludeUserId } = await request.json()

    if (!bandId || !title) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 })
    }

    // Bu grubun tüm subscription'larını al
    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('band_id', bandId)

    if (!subs || subs.length === 0) {
      return NextResponse.json({ sent: 0 })
    }

    const payload = JSON.stringify({
      title,
      body,
      url: url || '/dashboard',
      tag: `band-${bandId}-${Date.now()}`,
    })

    let sent = 0
    const failures: string[] = []

    for (const sub of subs) {
      // Gönderen kişiye bildirim gönderme
      if (excludeUserId && sub.user_id === excludeUserId) continue

      try {
        await webPush.sendNotification(sub.subscription, payload)
        sent++
      } catch (err: any) {
        // Subscription geçersiz — sil
        if (err.statusCode === 410 || err.statusCode === 404) {
          await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
          failures.push(sub.endpoint)
        }
      }
    }

    return NextResponse.json({ sent, failures: failures.length })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

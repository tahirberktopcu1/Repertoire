import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: Request) {
  try {
    const { subscription, userId, bandId } = await request.json()

    if (!subscription || !userId) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 })
    }

    // Upsert — aynı endpoint varsa güncelle
    await supabase.from('push_subscriptions').upsert(
      {
        user_id: userId,
        band_id: bandId,
        endpoint: subscription.endpoint,
        subscription: subscription,
      },
      { onConflict: 'endpoint' }
    )

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

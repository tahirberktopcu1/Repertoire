import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')

  if (!url) {
    return NextResponse.json({ error: 'URL gerekli' }, { status: 400 })
  }

  try {
    // Spotify
    if (url.includes('spotify.com') || url.includes('spotify:')) {
      // Direkt Spotify sayfasından meta tag'ları çek
      const pageRes = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)' }
      })

      if (pageRes.ok) {
        const html = await pageRes.text()

        // og:title = şarkı adı
        let title = ''
        const titleMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]*)"/)
        if (titleMatch) title = titleMatch[1]

        // og:description = "Sanatçı · Albüm · Song · Yıl"
        let artist = ''
        const descMatch = html.match(/<meta\s+property="og:description"\s+content="([^"]*)"/)
        if (descMatch) {
          const parts = descMatch[1].split('·').map((s: string) => s.trim())
          if (parts.length > 0) artist = parts[0]
        }

        if (title || artist) {
          return NextResponse.json({ title, artist, platform: 'spotify' })
        }
      }

      // Fallback: oEmbed (sadece şarkı adı)
      const oembedRes = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`)
      if (oembedRes.ok) {
        const data = await oembedRes.json()
        return NextResponse.json({ title: data.title || '', artist: '', platform: 'spotify' })
      }
    }

    // YouTube
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const res = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(url)}`)
      if (res.ok) {
        const data = await res.json()
        let title = data.title || ''
        let artist = data.author_name || ''

        // Temizle
        title = title.replace(/\s*[\(\[](official|resmi|lyric|audio|video|music|clip|hd|hq|4k|live|unplugged|acoustic)[\s\w]*[\)\]]/gi, '').trim()

        if (title.includes(' - ')) {
          const parts = title.split(' - ')
          artist = parts[0].trim()
          title = parts.slice(1).join(' - ').trim()
        } else if (title.includes(' – ')) {
          const parts = title.split(' – ')
          artist = parts[0].trim()
          title = parts.slice(1).join(' – ').trim()
        }

        return NextResponse.json({ title, artist, platform: 'youtube' })
      }
    }

    return NextResponse.json({ title: '', artist: '', platform: null })
  } catch {
    return NextResponse.json({ title: '', artist: '', platform: null })
  }
}

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
      // Spotify oEmbed — şarkı adı
      const oembedRes = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`)
      if (oembedRes.ok) {
        const data = await oembedRes.json()
        let title = data.title || ''
        let artist = ''

        // Spotify embed sayfasından sanatçı bilgisi çek
        const trackIdMatch = url.match(/track\/([a-zA-Z0-9]+)/)
        if (trackIdMatch) {
          try {
            // Spotify embed sayfasını fetch et — sanatçı bilgisi meta tag'larda var
            const embedRes = await fetch(`https://open.spotify.com/embed/track/${trackIdMatch[1]}`, {
              headers: { 'User-Agent': 'Mozilla/5.0' }
            })
            if (embedRes.ok) {
              const html = await embedRes.text()
              // <meta property="og:description" content="Nirvana · Song · 1991"> veya
              // <meta name="description" content="Listen to ... on Spotify. Nirvana · Song · 1991">
              const descMatch = html.match(/<meta[^>]*(?:property="og:description"|name="description")[^>]*content="([^"]*)"/)
              if (descMatch) {
                const desc = descMatch[1]
                // "Nirvana · Song · 1991" veya "Listen to ... Nirvana · Song · 1991"
                const artistMatch = desc.match(/^([^·]+)/)
                if (artistMatch) {
                  artist = artistMatch[1].replace(/Listen to.*on Spotify\.\s*/i, '').trim()
                }
              }
              // Alternatif: title meta tag "Smells Like Teen Spirit - song and lyrics by Nirvana | Spotify"
              const titleMatch = html.match(/<title>([^<]*)<\/title>/)
              if (titleMatch && !artist) {
                const fullTitle = titleMatch[1]
                // "Smells Like Teen Spirit - song and lyrics by Nirvana | Spotify"
                const byMatch = fullTitle.match(/by\s+(.+?)\s*\|/)
                if (byMatch) {
                  artist = byMatch[1].trim()
                }
              }
            }
          } catch {}
        }

        return NextResponse.json({ title, artist, platform: 'spotify' })
      }
    }

    // YouTube — noembed
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
  } catch (e) {
    return NextResponse.json({ title: '', artist: '', platform: null })
  }
}

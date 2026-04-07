// YouTube oEmbed API ile video bilgisi çek
export async function fetchYouTubeInfo(url: string): Promise<{ title: string; artist: string } | null> {
  try {
    const res = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(url)}`)
    if (!res.ok) return null
    const data = await res.json()
    if (!data.title) return null

    // YouTube başlığından sanatçı - şarkı adı ayır
    // Genelde "Sanatçı - Şarkı Adı" veya "Sanatçı - Şarkı Adı (Official Video)" formatında
    let title = data.title
    let artist = data.author_name || ''

    // "(Official Video)", "(Official Music Video)", "[Official Video]" vb. temizle
    title = title.replace(/\s*[\(\[](official|resmi|lyric|audio|video|music|clip|hd|hq|4k|live|unplugged|acoustic)[\s\w]*[\)\]]/gi, '').trim()

    // "Sanatçı - Şarkı" formatını ayır
    if (title.includes(' - ')) {
      const parts = title.split(' - ')
      artist = parts[0].trim()
      title = parts.slice(1).join(' - ').trim()
    } else if (title.includes(' – ')) {
      const parts = title.split(' – ')
      artist = parts[0].trim()
      title = parts.slice(1).join(' – ').trim()
    }

    // Ekstra boşlukları temizle
    title = title.replace(/\s+/g, ' ').trim()
    artist = artist.replace(/\s+/g, ' ').trim()

    return { title, artist }
  } catch {
    return null
  }
}

// Spotify track ID'den bilgi çek (Client Credentials olmadan çalışmaz)
// Şimdilik link'ten track adı tahmin et
export async function fetchSpotifyInfo(url: string): Promise<{ title: string; artist: string } | null> {
  // Spotify embed oEmbed endpoint'i
  try {
    const res = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`)
    if (!res.ok) return null
    const data = await res.json()
    if (!data.title) return null

    // Spotify oEmbed title genelde "Şarkı Adı" döner
    // author_name genelde sanatçı adı döner (bazen "Spotify" dönebilir)
    let title = data.title || ''
    let artist = ''

    // "Şarkı Adı - Sanatçı" veya sadece "Şarkı Adı"
    if (title.includes(' · ')) {
      // Bazen "Sanatçı · Şarkı" formatında
      const parts = title.split(' · ')
      if (parts.length >= 2) {
        artist = parts[0].trim()
        title = parts.slice(1).join(' · ').trim()
      }
    }

    return { title, artist }
  } catch {
    return null
  }
}

export function detectPlatform(url: string): 'spotify' | 'youtube' | null {
  if (url.includes('spotify.com') || url.includes('spotify:')) return 'spotify'
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube'
  return null
}

export async function detectSongInfo(url: string): Promise<{ title: string; artist: string; platform: 'spotify' | 'youtube' } | null> {
  const platform = detectPlatform(url)
  if (!platform) return null

  let info: { title: string; artist: string } | null = null

  if (platform === 'youtube') {
    info = await fetchYouTubeInfo(url)
  } else if (platform === 'spotify') {
    info = await fetchSpotifyInfo(url)
  }

  if (!info || (!info.title && !info.artist)) {
    return { title: '', artist: '', platform }
  }

  return { ...info, platform }
}

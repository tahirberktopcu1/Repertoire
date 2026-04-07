export function detectPlatform(url: string): 'spotify' | 'youtube' | null {
  if (url.includes('spotify.com') || url.includes('spotify:')) return 'spotify'
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube'
  return null
}

export async function detectSongInfo(url: string): Promise<{ title: string; artist: string; platform: 'spotify' | 'youtube' } | null> {
  const platform = detectPlatform(url)
  if (!platform) return null

  try {
    const res = await fetch(`/api/song-info?url=${encodeURIComponent(url)}`)
    if (!res.ok) return { title: '', artist: '', platform }
    const data = await res.json()
    return {
      title: data.title || '',
      artist: data.artist || '',
      platform: data.platform || platform,
    }
  } catch {
    return { title: '', artist: '', platform }
  }
}

'use client'

import { useState } from 'react'
import { detectSongInfo, detectPlatform } from '@/lib/song-detect'
import { Plus, X, Loader2 } from 'lucide-react'

function capitalizeWords(str: string): string {
  return str.replace(/(^|\s)\S/g, (char) => char.toUpperCase())
}

interface SongAddFormProps {
  onAdd: (data: { title: string; artist: string; spotifyUrl: string; youtubeUrl: string }) => Promise<void>
  submitLabel?: string
}

export default function SongAddForm({ onAdd, submitLabel = 'Öner' }: SongAddFormProps) {
  const [spotifyUrl, setSpotifyUrl] = useState('')
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [detecting, setDetecting] = useState(false)
  const [addLoading, setAddLoading] = useState(false)

  const handleUrlChange = async (url: string, type: 'spotify' | 'youtube') => {
    if (type === 'spotify') setSpotifyUrl(url)
    else setYoutubeUrl(url)

    const platform = detectPlatform(url)
    if (!platform) return

    setDetecting(true)
    const info = await detectSongInfo(url)
    setDetecting(false)

    if (info) {
      if (info.title) setTitle(capitalizeWords(info.title))
      if (info.artist) setArtist(capitalizeWords(info.artist))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !artist.trim()) return
    if (!spotifyUrl && !youtubeUrl) return

    setAddLoading(true)
    await onAdd({
      title: capitalizeWords(title.trim()),
      artist: capitalizeWords(artist.trim()),
      spotifyUrl: spotifyUrl.trim(),
      youtubeUrl: youtubeUrl.trim(),
    })
    setSpotifyUrl('')
    setYoutubeUrl('')
    setTitle('')
    setArtist('')
    setAddLoading(false)
  }

  const hasLink = !!(spotifyUrl || youtubeUrl)

  return (
    <form onSubmit={handleSubmit} className="bg-[var(--bg-card)] rounded-xl border border-[var(--border)] p-4 space-y-3">
      {/* Spotify linki */}
      <div>
        <label className="text-xs text-[var(--text-secondary)] mb-1 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#1db954]" />
          Spotify Linki
        </label>
        <input
          type="url"
          value={spotifyUrl}
          onChange={(e) => handleUrlChange(e.target.value, 'spotify')}
          className="w-full px-3 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] text-sm placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[#1db954] focus:border-transparent"
          placeholder="https://open.spotify.com/track/..."
        />
      </div>

      {/* YouTube linki */}
      <div>
        <label className="text-xs text-[var(--text-secondary)] mb-1 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#ff4444]" />
          YouTube Linki
        </label>
        <input
          type="url"
          value={youtubeUrl}
          onChange={(e) => handleUrlChange(e.target.value, 'youtube')}
          className="w-full px-3 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] text-sm placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[#ff4444] focus:border-transparent"
          placeholder="https://youtube.com/watch?v=..."
        />
      </div>

      {!hasLink && (
        <p className="text-[var(--text-muted)] text-xs">En az bir link girin (ikisi de olabilir)</p>
      )}

      {/* Algılama durumu */}
      {detecting && (
        <div className="flex items-center gap-2 text-[var(--text-secondary)] text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          Şarkı bilgileri alınıyor...
        </div>
      )}

      {/* Şarkı adı ve sanatçı — link girilince her zaman göster */}
      {hasLink && !detecting && (
        <>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(capitalizeWords(e.target.value))}
            className="w-full px-3 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] text-sm placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            placeholder="Şarkı Adı"
            required
          />
          <input
            type="text"
            value={artist}
            onChange={(e) => setArtist(capitalizeWords(e.target.value))}
            className="w-full px-3 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] text-sm placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            placeholder="Sanatçı"
            required
          />
          <button
            type="submit"
            disabled={addLoading || !title.trim() || !artist.trim()}
            className="w-full py-2.5 bg-[var(--accent)] hover:opacity-90 text-white font-medium rounded-lg text-sm transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {addLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Ekleniyor...</> : submitLabel}
          </button>
        </>
      )}
    </form>
  )
}

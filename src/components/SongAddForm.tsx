'use client'

import { useState } from 'react'
import { detectSongInfo, detectPlatform } from '@/lib/song-detect'
import { Plus, X, Edit3, Loader2, Link as LinkIcon } from 'lucide-react'

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
  const [detected, setDetected] = useState(false)
  const [addLoading, setAddLoading] = useState(false)

  const handleUrlChange = async (url: string, type: 'spotify' | 'youtube') => {
    if (type === 'spotify') setSpotifyUrl(url)
    else setYoutubeUrl(url)

    setDetected(false)

    const platform = detectPlatform(url)
    if (!platform) return

    setDetecting(true)
    const info = await detectSongInfo(url)
    setDetecting(false)

    if (info && (info.title || info.artist)) {
      if (info.title) setTitle(capitalizeWords(info.title))
      if (info.artist) setArtist(capitalizeWords(info.artist))
    }
    // Her durumda formu göster — bilgi bulunamadıysa boş gelir, kullanıcı yazar
    setDetected(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !artist) return
    if (!spotifyUrl && !youtubeUrl) return

    setAddLoading(true)
    await onAdd({
      title: title.trim(),
      artist: artist.trim(),
      spotifyUrl: spotifyUrl.trim(),
      youtubeUrl: youtubeUrl.trim(),
    })
    setSpotifyUrl('')
    setYoutubeUrl('')
    setTitle('')
    setArtist('')
    setDetected(false)
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

      {/* Platform badge */}
      {hasLink && !detecting && (
        <div className="flex gap-2">
          {spotifyUrl && detectPlatform(spotifyUrl) === 'spotify' && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#1db95422] text-[#1db954]">Spotify</span>
          )}
          {youtubeUrl && detectPlatform(youtubeUrl) === 'youtube' && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#ff000022] text-[#ff4444]">YouTube</span>
          )}
        </div>
      )}

      {/* Şarkı bilgileri formu */}
      {detected && !detecting && (
        <>
          <div className="bg-[var(--bg-secondary)] rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--text-muted)]">
                {title || artist ? 'Otomatik algılandı — düzenleme yapabilirsiniz' : 'Şarkı bilgilerini girin'}
              </span>
              <Edit3 className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(capitalizeWords(e.target.value))}
              className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              placeholder="Şarkı adı *"
              required
            />
            <input
              type="text"
              value={artist}
              onChange={(e) => setArtist(capitalizeWords(e.target.value))}
              className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              placeholder="Sanatçı *"
              required
            />
          </div>
          <button
            type="submit"
            disabled={addLoading || !title || !artist}
            className="w-full py-2.5 bg-[var(--accent)] hover:opacity-90 text-white font-medium rounded-lg text-sm transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {addLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Ekleniyor...</> : submitLabel}
          </button>
        </>
      )}

      {/* Manuel giriş butonu — link girildi ama algılama olmadı */}
      {hasLink && !detected && !detecting && (
        <button
          type="button"
          onClick={() => setDetected(true)}
          className="w-full py-2.5 bg-[var(--bg-secondary)] hover:bg-[var(--border)] text-[var(--text-primary)] font-medium rounded-lg text-sm transition-colors border border-[var(--border)]"
        >
          Şarkı Bilgilerini Gir
        </button>
      )}
    </form>
  )
}

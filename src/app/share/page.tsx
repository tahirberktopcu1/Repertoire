'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useSongs } from '@/contexts/SongsContext'
import AppShell from '@/components/AppShell'
import { Music, Loader2, Check, Edit3 } from 'lucide-react'

function capitalizeWords(str: string): string {
  return str.replace(/(^|\s)\S/g, (char) => char.toUpperCase())
}

function detectPlatform(url: string): 'spotify' | 'youtube' | null {
  if (url.includes('spotify.com') || url.includes('spotify:')) return 'spotify'
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube'
  return null
}

function extractUrl(text: string): string {
  // Paylaşılan metinden URL'yi çıkar
  const urlMatch = text.match(/https?:\/\/[^\s]+/)
  return urlMatch ? urlMatch[0] : text
}

export default function SharePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center"><Loader2 className="w-8 h-8 text-[var(--accent)] animate-spin" /></div>}>
      <ShareContent />
    </Suspense>
  )
}

function ShareContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { addSong } = useSongs()

  const sharedUrl = searchParams.get('url') || ''
  const sharedText = searchParams.get('text') || ''
  const sharedTitle = searchParams.get('title') || ''

  // URL'yi bul — url parametresinden veya text içinden
  const detectedUrl = sharedUrl || extractUrl(sharedText)
  const platform = detectPlatform(detectedUrl)

  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [detecting, setDetecting] = useState(true)
  const [added, setAdded] = useState(false)

  useEffect(() => {
    // Simulate AI detection
    const timer = setTimeout(() => {
      // Shared title'dan tahmin et
      if (sharedTitle) {
        const parts = sharedTitle.split(' - ')
        if (parts.length >= 2) {
          setArtist(parts[0].trim())
          setTitle(parts.slice(1).join(' - ').trim())
        } else {
          setTitle(sharedTitle)
        }
      } else {
        setTitle('Paylaşılan Şarkı')
        setArtist('Bilinmeyen Sanatçı')
      }
      setDetecting(false)
    }, 800)
    return () => clearTimeout(timer)
  }, [sharedTitle])

  const handleAdd = async () => {
    if (!title.trim()) return

    await addSong({
      title: title.trim(),
      artist: artist.trim() || null,
      spotify_url: platform === 'spotify' ? detectedUrl : null,
      youtube_url: platform === 'youtube' ? detectedUrl : null,
    })

    setAdded(true)
    setTimeout(() => router.push('/songs'), 1500)
  }

  if (added) {
    return (
      <AppShell>
        <div className="py-12 text-center">
          <Check className="w-16 h-16 text-[var(--success)] mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Şarkı önerildi!</h2>
          <p className="text-[var(--text-muted)] text-sm mt-1">Havuza yönlendiriliyorsunuz...</p>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="py-6 space-y-4">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[var(--accent-subtle)] mb-3">
            <Music className="w-7 h-7 text-[var(--accent)]" />
          </div>
          <h1 className="text-lg font-bold text-[var(--text-primary)]">Şarkı Paylaşıldı</h1>
        </div>

        {/* Platform badge */}
        {platform && (
          <div className="flex justify-center">
            <span className={`text-xs px-3 py-1 rounded-full font-medium ${
              platform === 'spotify' ? 'bg-[#1db95422] text-[#1db954]' : 'bg-[#ff000022] text-[#ff4444]'
            }`}>
              {platform === 'spotify' ? 'Spotify' : 'YouTube'}
            </span>
          </div>
        )}

        {/* Link preview */}
        <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border)] p-3">
          <p className="text-[var(--text-muted)] text-xs truncate">{detectedUrl}</p>
        </div>

        {detecting ? (
          <div className="flex items-center justify-center gap-2 py-4 text-[var(--text-secondary)] text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Şarkı bilgileri alınıyor...
          </div>
        ) : (
          <div className="space-y-3">
            <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border)] p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--text-muted)]">Düzenleme yapabilirsiniz</span>
                <Edit3 className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              </div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(capitalizeWords(e.target.value))}
                className="w-full px-3 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                placeholder="Şarkı adı *"
              />
              <input
                type="text"
                value={artist}
                onChange={(e) => setArtist(capitalizeWords(e.target.value))}
                className="w-full px-3 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                placeholder="Sanatçı *"
              />
            </div>

            <button
              onClick={handleAdd}
              disabled={!title.trim()}
              className="w-full py-3 bg-[var(--accent)] hover:opacity-90 disabled:opacity-50 text-white font-medium rounded-xl text-sm transition-opacity"
            >
              Havuza Öner
            </button>

            <button
              onClick={() => router.push('/songs')}
              className="w-full py-3 bg-[var(--bg-card)] hover:bg-[var(--bg-secondary)] text-[var(--text-muted)] font-medium rounded-xl text-sm transition-colors border border-[var(--border)]"
            >
              Vazgeç
            </button>
          </div>
        )}
      </div>
    </AppShell>
  )
}

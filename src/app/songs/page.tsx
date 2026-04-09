'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import AppShell from '@/components/AppShell'
import SongCard from '@/components/SongCard'
import { useSongs } from '@/contexts/SongsContext'
import { useRehearsal } from '@/contexts/RehearsalContext'
import { useAuth } from '@/contexts/AuthContext'
import { useBand } from '@/contexts/BandContext'
import type { SongWithVotes } from '@/lib/types'
import { Plus, Search, X, Loader2, AlertCircle, CheckCircle, Clock, Users } from 'lucide-react'
import { useToast } from '@/components/Toast'
import SongAddForm from '@/components/SongAddForm'

type TabType = 'unrated' | 'pending' | 'ready'

export default function SongsPage() {
  const { user } = useAuth()
  const { members } = useBand()
  const { songs, votes, addSong, removeSong, moveToRepertoire, rateSong, editSong } = useSongs()
  const { addSongToRehearsal } = useRehearsal()
  const { toast } = useToast()
  const userId = user?.id || ''

  const memberNames: Record<string, string> = {}
  members.forEach((m) => { memberNames[m.user_id] = (m.profiles as any)?.full_name || 'Bilinmeyen' })
  const [search, setSearch] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [tab, setTab] = useState<TabType>('unrated')

  const handleAddSong = async (data: { title: string; artist: string; spotifyUrl: string; youtubeUrl: string }) => {
    await addSong({
      title: data.title,
      artist: data.artist,
      spotify_url: data.spotifyUrl || null,
      youtube_url: data.youtubeUrl || null,
    })
    setShowAddForm(false)
    toast('Şarkı önerildi!')
  }

  const handleRate = async (songId: string, value: number, audienceValue: number | null) => {
    await rateSong(songId, value, audienceValue)
    toast('Puanınız kaydedildi!')
  }

  const memberCount = members.length
  const myVotedIds = new Set(votes.filter((v) => v.user_id === userId).map((v) => v.song_id))

  // Kategorize et
  const unratedSongs = songs.filter((s) => !myVotedIds.has(s.id)) // Ben oylamadım
  const pendingSongs = songs.filter((s) => {
    if (!myVotedIds.has(s.id)) return false // Ben oylamadım = unrated
    const songVoterCount = new Set(votes.filter((v) => v.song_id === s.id).map((v) => v.user_id)).size
    return songVoterCount < memberCount // Herkes oylamadı
  })
  const readySongs = [...songs.filter((s) => {
    if (!myVotedIds.has(s.id)) return false
    const songVoterCount = new Set(votes.filter((v) => v.song_id === s.id).map((v) => v.user_id)).size
    return songVoterCount >= memberCount // Herkes oyladı
  })].sort((a, b) => b.avg_score - a.avg_score)

  const currentSongs = (tab === 'unrated' ? unratedSongs : tab === 'pending' ? pendingSongs : readySongs)
    .filter((s) => {
      if (!search) return true
      const q = search.toLowerCase()
      return s.title.toLowerCase().includes(q) || (s.artist?.toLowerCase().includes(q) ?? false)
    })

  const tabs: { key: TabType; label: string; icon: any; count: number; color: string }[] = [
    { key: 'unrated', label: 'Oy Bekliyor', icon: AlertCircle, count: unratedSongs.length, color: 'var(--danger)' },
    { key: 'pending', label: 'Beklemede', icon: Clock, count: pendingSongs.length, color: 'var(--warning)' },
    { key: 'ready', label: 'Havuz', icon: CheckCircle, count: readySongs.length, color: 'var(--success)' },
  ]

  return (
    <AppShell>
      <div className="py-4 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-[var(--text-primary)]">Şarkı Havuzu</h1>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 px-3 py-2 bg-[var(--accent)] hover:opacity-90 text-white rounded-lg text-sm font-medium transition-opacity"
          >
            {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showAddForm ? 'Kapat' : 'Şarkı Öner'}
          </button>
        </div>

        {showAddForm && (
          <SongAddForm onAdd={handleAddSong} submitLabel="Öner" />
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] text-sm placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            placeholder="Şarkı ara..."
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-[var(--bg-secondary)] rounded-lg p-1">
          {tabs.map((t) => {
            const Icon = t.icon
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-md text-xs font-medium transition-colors ${
                  tab === t.key
                    ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" style={{ color: t.count > 0 ? t.color : undefined }} />
                <span className="hidden sm:inline">{t.label}</span>
                {t.count > 0 && (
                  <span className="text-[10px] px-1.5 rounded-full leading-4 text-white" style={{ backgroundColor: t.color }}>
                    {t.count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Tab description */}
        {tab === 'unrated' && unratedSongs.length > 0 && (
          <p className="text-xs text-[var(--danger)]">Bu şarkıları henüz puanlamadınız</p>
        )}
        {tab === 'pending' && pendingSongs.length > 0 && (
          <p className="text-xs text-[var(--warning)]">Tüm üyeler henüz oylamadı</p>
        )}
        {tab === 'ready' && readySongs.length > 0 && (
          <p className="text-xs text-[var(--success)]">Herkes oyunu kullandı — repertuvara eklenebilir</p>
        )}

        {/* Song list */}
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {currentSongs.map((song, i) => {
              const songVoters = new Set(votes.filter((v) => v.song_id === song.id).map((v) => v.user_id))
              const votedCount = songVoters.size
              const isReady = votedCount >= memberCount

              return (
                <motion.div
                  key={song.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                >
                  <SongCard
                    song={song}
                    userVote={votes.find((v) => v.song_id === song.id && v.user_id === userId) || null}
                    onRate={(value, audienceValue) => handleRate(song.id, value, audienceValue)}
                    onAddToRepertoire={isReady ? () => { moveToRepertoire(song.id); addSongToRehearsal(song.id); toast('Repertuvara eklendi!') } : undefined}
                    onRemove={() => { removeSong(song.id); toast('Şarkı silindi!') }}
                    onEdit={(t, a) => { editSong(song.id, t, a); toast('Şarkı güncellendi!') }}
                    rank={tab === 'ready' ? i + 1 : undefined}
                    notRated={tab === 'unrated'}
                    voteDetails={votes
                      .filter((v) => v.song_id === song.id)
                      .map((v) => ({ user_name: memberNames[v.user_id] || 'Bilinmeyen', value: v.value, audience_value: v.audience_value }))
                    }
                    statusBadge={undefined}
                  />
                </motion.div>
              )
            })}
          </AnimatePresence>

          {currentSongs.length === 0 && (
            <div className="text-center py-12">
              {tab === 'unrated' && (
                <>
                  <CheckCircle className="w-12 h-12 text-[var(--success)] mx-auto mb-3" />
                  <p className="text-[var(--text-primary)] font-medium">Tüm şarkıları oyladınız!</p>
                </>
              )}
              {tab === 'pending' && (
                <>
                  <Clock className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
                  <p className="text-[var(--text-muted)]">Bekleyen şarkı yok</p>
                </>
              )}
              {tab === 'ready' && (
                <>
                  <AlertCircle className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
                  <p className="text-[var(--text-muted)]">Henüz herkesin oyladığı şarkı yok</p>
                  <p className="text-[var(--text-muted)] text-sm mt-1">Tüm üyeler oylarını kullanınca şarkılar burada görünür</p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}

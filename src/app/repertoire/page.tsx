'use client'

import { useState } from 'react'
import AppShell from '@/components/AppShell'
import { useSongs } from '@/contexts/SongsContext'
import { useBand } from '@/contexts/BandContext'
import { useAuth } from '@/contexts/AuthContext'
import { ListMusic, Search, Play, ChevronUp, ChevronDown, Trash2, AlertCircle, Check, Star, Plus, X, Users, Loader2, ArrowUpDown, Pencil } from 'lucide-react'
import ConfirmDialog from '@/components/ConfirmDialog'
import SongAddForm from '@/components/SongAddForm'
import { useToast } from '@/components/Toast'

function capitalizeWords(str: string): string {
  return str.replace(/(^|\s)\S/g, (char) => char.toUpperCase())
}

function ScoreBar({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hoverValue, setHoverValue] = useState<number | null>(null)
  const displayValue = hoverValue ?? value

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHoverValue(n)}
          onMouseLeave={() => setHoverValue(null)}
          className={`w-full h-6 rounded transition-all cursor-pointer text-[9px] font-bold ${
            n <= displayValue
              ? n <= 3
                ? 'bg-[var(--danger)] text-white'
                : n <= 6
                ? 'bg-[var(--warning)] text-white'
                : 'bg-[var(--success)] text-white'
              : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:bg-[var(--border)]'
          }`}
        >
          {n}
        </button>
      ))}
    </div>
  )
}

export default function RepertoirePage() {
  const { user } = useAuth()
  const { members } = useBand()
  const { repertoire, deficiencies, removeFromRepertoire, reorderRepertoire, addDeficiency, resolveDeficiency, addDirectToRepertoire, rateRepertoireSong, repertoireVotes, editSong } = useSongs()
  const { toast } = useToast()
  const userId = user?.id || ''
  const memberNames: Record<string, string> = {}
  members.forEach((m) => { memberNames[m.user_id] = (m.profiles as any)?.full_name || 'Bilinmeyen' })
  const newSongIds = new Set(repertoire.filter((s) => !s.practiced_at).map((s) => s.id))
  const showNewSongs = newSongIds.size > 0
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [newDeficiency, setNewDeficiency] = useState('')
  const [assignedTo, setAssignedTo] = useState('group')

  const [showAddForm, setShowAddForm] = useState(false)
  const [sortBy, setSortBy] = useState<'score-asc' | 'score-desc' | 'date-asc' | 'date-desc'>('score-asc')
  const [editingSong, setEditingSong] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editArtist, setEditArtist] = useState('')
  const [confirmAction, setConfirmAction] = useState<{ type: 'delete' | 'resolve'; songId: string; defId?: string; songTitle: string } | null>(null)

  // Helper: compute finalScore for a song
  const getFinalScore = (song: typeof repertoire[0]) => {
    const songRepVotes = repertoireVotes.filter((v) => v.song_id === song.id)
    const rawAvg = songRepVotes.length > 0
      ? songRepVotes.reduce((s, v) => s + v.value, 0) / songRepVotes.length
      : 0
    const defs = deficiencies[song.id] || []
    const penalty = defs.length * 0.5
    return songRepVotes.length > 0 ? Math.max(0, rawAvg - penalty) : 0
  }

  // Yeni eklenenler sıralamadan bağımsız en üstte, geri kalanlar sıralanır
  const newSongsList = repertoire.filter((s) => newSongIds.has(s.id))
  const restSongs = repertoire.filter((s) => !newSongIds.has(s.id))

  const sortedRest = [...restSongs].sort((a, b) => {
    if (sortBy === 'score-asc') return getFinalScore(a) - getFinalScore(b)
    if (sortBy === 'score-desc') return getFinalScore(b) - getFinalScore(a)
    if (sortBy === 'date-asc') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    if (sortBy === 'date-desc') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    return 0
  })

  const sortedRepertoire = [...newSongsList, ...sortedRest]

  const filteredSongs = sortedRepertoire.filter((s) => {
    if (!search) return true
    const q = search.toLowerCase()
    return s.title.toLowerCase().includes(q) || (s.artist?.toLowerCase().includes(q) ?? false)
  })

  const getAssignedName = (id: string) => {
    if (id === 'group') return 'Grup'
    const member = members.find((m) => m.user_id === id)
    return (member?.profiles as any)?.full_name || 'Bilinmeyen'
  }

  const handleAddDeficiency = (songId: string) => {
    if (!newDeficiency.trim()) return
    addDeficiency(songId, newDeficiency.trim(), assignedTo, getAssignedName(assignedTo))
    setNewDeficiency('')
    toast('Eksik eklendi!')
  }

  const handleDirectAdd = async (data: { title: string; artist: string; spotifyUrl: string; youtubeUrl: string }) => {
    await addDirectToRepertoire(data.title, data.artist, data.spotifyUrl || undefined, data.youtubeUrl || undefined)
    setShowAddForm(false)
    toast('Parça eklendi!')
  }

  return (
    <AppShell>
      <div className="py-4 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <ListMusic className="w-5 h-5 text-[var(--accent)]" />
            Repertuvar
          </h1>
          <div className="flex items-center gap-2">
            <span className="text-[var(--text-muted)] text-sm">{repertoire.length} parça</span>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-1.5 px-3 py-2 bg-[var(--accent)] hover:opacity-90 text-white rounded-lg text-sm font-medium transition-opacity"
            >
              {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {showAddForm ? 'Kapat' : 'Şarkı Ekle'}
            </button>
          </div>
        </div>

        {showAddForm && (
          <SongAddForm onAdd={handleDirectAdd} submitLabel="Repertuvara Ekle" />
        )}

        {repertoire.length > 0 && (
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] text-sm placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                placeholder="Repertuvarda ara..."
              />
            </div>
            <div className="relative flex-shrink-0">
              <ArrowUpDown className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)] pointer-events-none" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="pl-8 pr-2 py-2.5 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] text-xs focus:outline-none focus:ring-2 focus:ring-[var(--accent)] appearance-none cursor-pointer"
              >
                <option value="score-asc">Puan ↑</option>
                <option value="score-desc">Puan ↓</option>
                <option value="date-desc">Tarih ↓</option>
                <option value="date-asc">Tarih ↑</option>
              </select>
            </div>
          </div>
        )}

        {showNewSongs && !search && (
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-[var(--orange)]" />
            <span className="text-sm font-medium text-[var(--orange)]">Yeni Eklenenler</span>
          </div>
        )}

        <div className="space-y-2">
          {filteredSongs.map((song, i) => {
            const isTop2 = showNewSongs && newSongIds.has(song.id) && !search
            const isExpanded = expandedId === song.id
            const defs = deficiencies[song.id] || []
            const originalIndex = repertoire.findIndex((s) => s.id === song.id)
            const userRepVote = repertoireVotes.find((v) => v.song_id === song.id && v.user_id === userId)
            const songRepVotes = repertoireVotes.filter((v) => v.song_id === song.id)
            const rawAvg = songRepVotes.length > 0
              ? songRepVotes.reduce((s, v) => s + v.value, 0) / songRepVotes.length
              : 0
            // Her eksik 0.5 puan düşürür
            const penalty = defs.length * 0.5
            const finalScore = songRepVotes.length > 0
              ? Math.round(Math.max(0, rawAvg - penalty) * 10) / 10
              : null

            // Ayırıcı
            const prevIsThisWeek = i > 0 && showNewSongs && newSongIds.has(filteredSongs[i - 1]?.id)
            const showSeparator = showNewSongs && !isTop2 && !search && prevIsThisWeek

            return (
              <div key={song.id}>
                {showSeparator && (
                  <div className="flex items-center gap-2 mt-4 mb-2">
                    <div className="flex-1 border-t border-[var(--border)]" />
                    <span className="text-xs text-[var(--text-muted)]">Diğer Parçalar</span>
                    <div className="flex-1 border-t border-[var(--border)]" />
                  </div>
                )}

                <div className={`rounded-xl border overflow-hidden cursor-pointer ${
                  isTop2
                    ? 'bg-[var(--bg-card)] border-[var(--orange)] shadow-[0_0_0_1px_var(--orange)]'
                    : 'bg-[var(--bg-card)] border-[var(--border)]'
                }`}>
                  <div
                    className="p-3 flex items-center gap-3"
                    onClick={() => setExpandedId(isExpanded ? null : song.id)}
                  >
                    {false && !search && !isTop2 && (
                      <div className="flex flex-col gap-0.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => reorderRepertoire(song.id, 'up')}
                          disabled={originalIndex === 0}
                          className={`p-0.5 rounded transition-colors ${
                            originalIndex === 0 ? 'text-[var(--border)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
                          }`}
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => reorderRepertoire(song.id, 'down')}
                          disabled={originalIndex === repertoire.length - 1}
                          className={`p-0.5 rounded transition-colors ${
                            originalIndex === repertoire.length - 1 ? 'text-[var(--border)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
                          }`}
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    <div className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center font-bold text-sm ${
                      isTop2
                        ? 'bg-[var(--orange)] text-white'
                        : 'bg-[var(--bg-secondary)] text-[var(--text-muted)]'
                    }`}>
                      {i + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                      {editingSong === song.id ? (
                        <div className="space-y-1.5" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="w-full px-2 py-1 bg-[var(--bg-secondary)] border border-[var(--accent)] rounded text-[var(--text-primary)] text-sm focus:outline-none"
                            placeholder="Şarkı adı"
                          />
                          <input
                            type="text"
                            value={editArtist}
                            onChange={(e) => setEditArtist(e.target.value)}
                            className="w-full px-2 py-1 bg-[var(--bg-secondary)] border border-[var(--accent)] rounded text-[var(--text-primary)] text-sm focus:outline-none"
                            placeholder="Sanatçı"
                          />
                          <div className="flex gap-1">
                            <button
                              onClick={() => { editSong(song.id, editTitle, editArtist); setEditingSong(null); toast('Şarkı güncellendi!') }}
                              className="px-2 py-1 bg-[var(--accent)] text-white rounded text-xs"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => setEditingSong(null)}
                              className="px-2 py-1 bg-[var(--bg-secondary)] text-[var(--text-muted)] rounded text-xs"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <h3 className="text-[var(--text-primary)] font-semibold text-sm truncate">{song.title}</h3>
                          {song.artist && (
                            <p className="text-[var(--text-muted)] text-xs truncate">{song.artist}</p>
                          )}
                        </>
                      )}
                    </div>

                    {/* Şarkı puanı */}
                    {finalScore !== null && (
                      <div className="flex-shrink-0 text-center">
                        <div className={`text-sm font-bold ${
                          finalScore >= 7 ? 'text-[var(--success)]' : finalScore >= 4 ? 'text-[var(--warning)]' : 'text-[var(--danger)]'
                        }`}>{finalScore}</div>
                      </div>
                    )}

                    <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      {song.spotify_url && (
                        <a href={song.spotify_url} target="_blank" rel="noopener noreferrer"
                          className="p-1.5 text-[#1db954] hover:opacity-80 transition-opacity">
                          <Play className="w-4 h-4" />
                        </a>
                      )}
                      {song.youtube_url && (
                        <a href={song.youtube_url} target="_blank" rel="noopener noreferrer"
                          className="p-1.5 text-[#ff4444] hover:opacity-80 transition-opacity">
                          <Play className="w-4 h-4" />
                        </a>
                      )}
                      <button
                        onClick={() => setConfirmAction({ type: 'delete', songId: song.id, songTitle: song.title })}
                        className="p-1.5 text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded: puanlama + eksikler */}
                  {isExpanded && (
                    <div className="border-t border-[var(--border)] p-4 bg-[var(--bg-secondary)] space-y-4">
                      {/* Düzenle butonu */}
                      {editingSong !== song.id && (
                        <div className="flex justify-end mb-3">
                          <button
                            onClick={(e) => { e.stopPropagation(); setEditingSong(song.id); setEditTitle(song.title); setEditArtist(song.artist || '') }}
                            className="flex items-center gap-2 px-4 py-2 bg-[var(--accent)] hover:opacity-90 text-white rounded-lg text-sm font-medium transition-opacity"
                          >
                            <Pencil className="w-4 h-4" />
                            Düzenle
                          </button>
                        </div>
                      )}

                      {/* Puanlama - Çalma Kalitesi */}
                      <div>
                        <h4 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">
                          Ne Kadar İyi Çaldık
                        </h4>
                        <ScoreBar
                          value={userRepVote?.value ?? 0}
                          onChange={(v) => {
                            rateRepertoireSong(song.id, v, userRepVote?.audience_value ?? null); toast('Puan kaydedildi!')
                          }}
                        />
                      </div>

                      {/* Puanlama - Seyirci Beğenisi (opsiyonel, toggle) */}
                      <div>
                        <h4 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">
                          Seyirci Ne Kadar Beğendi                        </h4>
                        <ScoreBar
                          value={userRepVote?.audience_value ?? 0}
                          onChange={(v) => {
                            const newAud = v === (userRepVote?.audience_value ?? 0) ? null : v
                            const rv = userRepVote?.value ?? 0
                            if (rv > 0) { rateRepertoireSong(song.id, rv, newAud); toast('Puan kaydedildi!') }
                          }}
                        />
                        {songRepVotes.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {songRepVotes.map((v) => (
                              <span
                                key={v.id}
                                className={`text-xs px-2 py-0.5 rounded-full ${
                                  v.value >= 7 ? 'bg-[#3fb95022] text-[var(--success)]'
                                  : v.value >= 4 ? 'bg-[#d2992222] text-[var(--warning)]'
                                  : 'bg-[#f8514922] text-[var(--danger)]'
                                }`}
                              >
                                {memberNames[v.user_id] || 'Bilinmeyen'}: {v.value}/{v.audience_value}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Skor özeti */}
                      {songRepVotes.length > 0 && (
                        <div className="bg-[var(--bg-card)] rounded-lg p-3 flex items-center justify-between">
                          <div className="text-xs text-[var(--text-muted)] space-y-0.5">
                            <div>Üye ortalaması: <span className="text-[var(--text-primary)] font-medium">{Math.round(rawAvg * 10) / 10}</span></div>
                            {defs.length > 0 && <div>Eksik cezası: <span className="text-[var(--danger)] font-medium">-{penalty}</span> ({defs.length} eksik × 0.5)</div>}
                          </div>
                          <div className={`text-lg font-bold ${
                            (finalScore ?? 0) >= 7 ? 'text-[var(--success)]' : (finalScore ?? 0) >= 4 ? 'text-[var(--warning)]' : 'text-[var(--danger)]'
                          }`}>
                            {finalScore ?? '—'}
                          </div>
                        </div>
                      )}

                      {/* Eksikler */}
                      <div>
                        <h4 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">
                          Eksikler
                        </h4>

                        <div className="space-y-2 mb-3">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={newDeficiency}
                              onChange={(e) => setNewDeficiency(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleAddDeficiency(song.id)}
                              className="flex-1 px-3 py-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] text-sm placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                              placeholder="Eksik ekle..."
                            />
                            <button
                              onClick={() => handleAddDeficiency(song.id)}
                              className="px-3 py-2 bg-[var(--accent)] text-white rounded-lg text-sm hover:opacity-90 transition-opacity"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                          <select
                            value={assignedTo}
                            onChange={(e) => setAssignedTo(e.target.value)}
                            className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                          >
                            <option value="group">Grup (herkes)</option>
                            {members.map((m) => (
                              <option key={m.user_id} value={m.user_id}>
                                {(m.profiles as any)?.full_name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1.5 max-h-48 overflow-y-auto">
                          {defs.map((def) => (
                            <div key={def.id} className="flex items-start gap-2 text-sm p-2 rounded-lg bg-[#d2992211]">
                              <button
                                onClick={() => setConfirmAction({ type: 'resolve', songId: song.id, defId: def.id, songTitle: def.content })}
                                className="mt-0.5 flex-shrink-0 w-5 h-5 rounded border border-[var(--border)] hover:border-[var(--success)] hover:bg-[var(--success)] hover:text-white flex items-center justify-center transition-all group"
                              >
                                <Check className="w-3 h-3 opacity-0 group-hover:opacity-100" />
                              </button>
                              <div className="flex-1">
                                <span className="text-[var(--text-primary)]">{def.content}</span>
                                <span className={`text-xs ml-2 px-1.5 py-0.5 rounded ${
                                  def.assigned_to === 'group'
                                    ? 'bg-[var(--accent-subtle)] text-[var(--accent)]'
                                    : 'bg-[#d2992222] text-[var(--warning)]'
                                }`}>
                                  {def.assigned_to_name}
                                </span>
                              </div>
                            </div>
                          ))}
                          {defs.length === 0 && (
                            <p className="text-[var(--text-muted)] text-sm">Henüz eksik yok</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          {repertoire.length === 0 && (
            <div className="text-center py-12">
              <ListMusic className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
              <p className="text-[var(--text-muted)]">Repertuvar boş</p>
              <p className="text-[var(--text-muted)] text-sm mt-1">Yukarıdaki "Şarkı Ekle" butonu ile parça ekleyin</p>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!confirmAction}
        title={confirmAction?.type === 'delete' ? 'Silmek İstediğinize Emin Misiniz?' : 'Tamamlandı Olarak İşaretlemek İstediğinize Emin Misiniz?'}
        message={confirmAction?.type === 'delete'
          ? `"${confirmAction?.songTitle}" repertuvardan çıkarılacak.`
          : `"${confirmAction?.songTitle}" eksikliği tamamlandı olarak işaretlenecek.`
        }
        confirmLabel={confirmAction?.type === 'delete' ? 'Sil' : 'Tamamlandı'}
        variant={confirmAction?.type === 'delete' ? 'danger' : 'warning'}
        onConfirm={() => {
          if (confirmAction?.type === 'delete') {
            removeFromRepertoire(confirmAction.songId)
            toast('Parça çıkarıldı!')
          } else if (confirmAction?.type === 'resolve' && confirmAction.defId) {
            resolveDeficiency(confirmAction.songId, confirmAction.defId)
            toast('Eksik tamamlandı!')
          }
          setConfirmAction(null)
        }}
        onCancel={() => setConfirmAction(null)}
      />
    </AppShell>
  )
}

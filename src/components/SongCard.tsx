'use client'

import { useState, useEffect, useRef } from 'react'
import type { SongWithVotes, Vote } from '@/lib/types'
import ConfirmDialog from './ConfirmDialog'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useBand } from '@/contexts/BandContext'
import {
  Play,
  CheckCircle,
  Trash2,
  AlertCircle,
  Check,
  Users,
  Pencil,
  X,
  MessageCircle,
  Send,
} from 'lucide-react'

interface VoteDetail {
  user_name: string
  value: number
  audience_value: number | null
}

interface SongCardProps {
  song: SongWithVotes
  userVote: Vote | null
  onRate?: (value: number, audienceValue: number | null) => void
  onAddToRepertoire?: () => void
  onRemove?: () => void
  onEdit?: (title: string, artist: string) => void
  showVoting?: boolean
  isTopSong?: boolean
  rank?: number
  notRated?: boolean
  statusBadge?: string
  voteDetails?: VoteDetail[]
  showDeficiencies?: boolean
  deficiencies?: { id: string; content: string; is_resolved: boolean; user_name: string }[]
  onAddDeficiency?: (content: string) => void
  onToggleDeficiency?: (id: string) => void
  voteLabel1?: string
  voteLabel2?: string
  audienceRequired?: boolean
}

function ScoreBar({ value, onChange, readonly = false }: { value: number; onChange?: (v: number) => void; readonly?: boolean }) {
  const [hoverValue, setHoverValue] = useState<number | null>(null)
  const displayValue = hoverValue ?? value

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(n)}
          onMouseEnter={() => !readonly && setHoverValue(n)}
          onMouseLeave={() => setHoverValue(null)}
          className={`w-full h-7 rounded transition-all text-[10px] font-bold ${
            readonly ? 'cursor-default' : 'cursor-pointer'
          } ${
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

export default function SongCard({
  song,
  userVote,
  onRate,
  onAddToRepertoire,
  onRemove,
  onEdit,
  showVoting = true,
  isTopSong = false,
  notRated = false,
  statusBadge,
  rank,
  voteDetails = [],
  showDeficiencies = false,
  deficiencies = [],
  onAddDeficiency,
  onToggleDeficiency,
  voteLabel1 = 'Beğenim',
  voteLabel2 = 'Seyirci Tahmini',
  audienceRequired = true,
}: SongCardProps) {
  const supabase = createClient()
  const { user } = useAuth()
  const { members } = useBand()
  const [showDefPanel, setShowDefPanel] = useState(false)
  const [newDeficiency, setNewDeficiency] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(song.title)
  const [editArtist, setEditArtist] = useState(song.artist || '')
  const [localRating, setLocalRating] = useState<number | null>(null)
  const [localAudienceRating, setLocalAudienceRating] = useState<number | null | undefined>(undefined)

  // Chat state
  const [showChat, setShowChat] = useState(false)
  const [comments, setComments] = useState<{ id: string; user_id: string; content: string; created_at: string; user_name: string }[]>([])
  const [commentCount, setCommentCount] = useState(0)
  const [newComment, setNewComment] = useState('')
  const chatEndRef = useRef<HTMLDivElement>(null)

  const memberNames: Record<string, string> = {}
  members.forEach((m: any) => { memberNames[m.user_id] = m.profiles?.full_name || 'Bilinmeyen' })

  // Yorum sayısını çek
  useEffect(() => {
    supabase.from('song_comments').select('id', { count: 'exact', head: true }).eq('song_id', song.id)
      .then(({ count }: any) => setCommentCount(count || 0))
  }, [song.id])

  // Chat yükle
  useEffect(() => {
    if (!showChat) return
    const loadComments = async () => {
      const { data } = await supabase
        .from('song_comments')
        .select('*, profiles:user_id(full_name)')
        .eq('song_id', song.id)
        .order('created_at', { ascending: true })
      if (data) { setCommentCount(data.length); setComments(data.map((c: any) => ({
        id: c.id, user_id: c.user_id, content: c.content, created_at: c.created_at,
        user_name: c.profiles?.full_name || 'Bilinmeyen',
      }))) }
    }
    loadComments()

    // Realtime
    const channel = supabase
      .channel(`comments-${song.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'song_comments' }, (payload: any) => {
        if (payload.eventType === 'INSERT' && payload.new.song_id === song.id) {
          setComments((prev) => {
            const updated = [...prev, {
              id: payload.new.id, user_id: payload.new.user_id, content: payload.new.content,
              created_at: payload.new.created_at, user_name: memberNames[payload.new.user_id] || 'Bilinmeyen',
            }]
            setCommentCount(updated.length)
            return updated
          })
        } else if (payload.eventType === 'DELETE') {
          setComments((prev) => {
            const updated = prev.filter((c) => c.id !== payload.old.id)
            setCommentCount(updated.length)
            return updated
          })
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [showChat, song.id])

  // Yeni mesajda scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [comments.length])

  const sendComment = async () => {
    if (!newComment.trim() || !user) return
    const text = newComment.trim()
    setNewComment('')
    const { error } = await supabase.from('song_comments').insert({ song_id: song.id, user_id: user.id, content: text })
    if (error) console.error('[sendComment] error:', error)
  }

  // userVote güncellenince local state'i sıfırla
  useEffect(() => {
    if (userVote) { setLocalRating(null); setLocalAudienceRating(undefined) }
  }, [userVote?.value, userVote?.audience_value])

  const addDeficiency = () => {
    if (!newDeficiency.trim() || !onAddDeficiency) return
    onAddDeficiency(newDeficiency.trim())
    setNewDeficiency('')
  }

  const unresolvedCount = deficiencies.filter((d) => !d.is_resolved).length

  const scoreColor = song.avg_score >= 7 ? 'text-[var(--success)]'
    : song.avg_score >= 4 ? 'text-[var(--warning)]'
    : song.avg_score > 0 ? 'text-[var(--danger)]'
    : 'text-[var(--text-muted)]'

  return (
    <div className={`rounded-xl border overflow-hidden transition-all bg-[var(--bg-card)] ${
      notRated ? 'border-[var(--danger)] shadow-[0_0_0_1px_var(--danger)]' : 'border-[var(--border)]'
    }`}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          {rank !== undefined && (
            <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm bg-[var(--bg-secondary)] text-[var(--text-muted)]">
              {rank}
            </div>
          )}

          <div className="flex-1 min-w-0">
            {editing ? (
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
                    onClick={() => { onEdit?.(editTitle, editArtist); setEditing(false) }}
                    className="px-2 py-1 bg-[var(--accent)] text-white rounded text-xs"
                  >
                    <Check className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => { setEditTitle(song.title); setEditArtist(song.artist || ''); setEditing(false) }}
                    className="px-2 py-1 bg-[var(--bg-secondary)] text-[var(--text-muted)] rounded text-xs"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h3 className="text-[var(--text-primary)] font-semibold truncate">{song.title}</h3>
                {song.artist && (
                  <p className="text-[var(--text-secondary)] text-sm truncate">{song.artist}</p>
                )}
              </>
            )}
            <div className="flex items-center gap-2 mt-1">
              <p className="text-[var(--text-muted)] text-xs">Öneren: {song.suggested_by_name}</p>
              {statusBadge && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--bg-secondary)] text-[var(--text-muted)] border border-[var(--border)]">
                  {statusBadge}
                </span>
              )}
            </div>
          </div>

          {/* Average score badge */}
          <div className="flex-shrink-0 text-center">
            <div className={`text-xl font-bold ${scoreColor}`}>
              {song.avg_score > 0 ? song.avg_score.toFixed(1) : '—'}
            </div>
            <div className="flex items-center gap-0.5 justify-center text-[var(--text-muted)] text-xs">
              <Users className="w-3 h-3" />
              {song.vote_count}
            </div>
          </div>
        </div>

        {/* Links */}
        <div className="flex gap-2 mt-3">
          {song.spotify_url && (
            <a
              href={song.spotify_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1db95422] text-[#1db954] rounded-full text-xs font-medium hover:bg-[#1db95433] transition-colors"
            >
              <Play className="w-3 h-3" />
              Spotify
            </a>
          )}
          {song.youtube_url && (
            <a
              href={song.youtube_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#ff000022] text-[#ff4444] rounded-full text-xs font-medium hover:bg-[#ff000033] transition-colors"
            >
              <Play className="w-3 h-3" />
              YouTube
            </a>
          )}
        </div>

        {/* Rating bars */}
        {showVoting && (() => {
          const currentValue = localRating ?? userVote?.value ?? 0
          const currentAudience = localAudienceRating !== undefined ? (localAudienceRating ?? 0) : (userVote?.audience_value ?? 0)

          return (
          <div className="mt-3 pt-3 border-t border-[var(--border)] space-y-3">
            <div>
              <label className="text-xs text-[var(--text-muted)] mb-1 block">{voteLabel1}</label>
              <ScoreBar
                value={currentValue}
                onChange={(v) => {
                  setLocalRating(v)
                  if (audienceRequired) {
                    // Zorunlu: ikisi de verilmişse kaydet
                    const aud = localAudienceRating !== undefined ? (localAudienceRating ?? 0) : (userVote?.audience_value ?? 0)
                    if (aud > 0) onRate?.(v, aud)
                  } else {
                    // Opsiyonel: beğeni yeterli
                    const aud = localAudienceRating !== undefined ? localAudienceRating : (userVote?.audience_value ?? null)
                    onRate?.(v, aud)
                  }
                }}
              />
            </div>
            <div>
              <label className="text-xs text-[var(--text-muted)] mb-1 block">{voteLabel2}</label>
              <ScoreBar
                value={currentAudience}
                onChange={(v) => {
                  if (audienceRequired) {
                    // Zorunlu: toggle yok, ikisi de verilmişse kaydet
                    setLocalAudienceRating(v)
                    const val = localRating ?? userVote?.value ?? 0
                    if (val > 0) onRate?.(val, v)
                  } else {
                    // Opsiyonel: toggle, aynı değere tıklarsa kaldır
                    const newAud = v === currentAudience ? null : v
                    setLocalAudienceRating(newAud)
                    const val = localRating ?? userVote?.value ?? 0
                    if (val > 0) onRate?.(val, newAud)
                  }
                }}
              />
              {audienceRequired && currentValue > 0 && currentAudience === 0 && (
                <p className="text-[var(--warning)] text-xs mt-1">Seyirci tahmini puanını da verin</p>
              )}
              {audienceRequired && currentAudience > 0 && currentValue === 0 && (
                <p className="text-[var(--warning)] text-xs mt-1">Beğeni puanını da verin</p>
              )}
            </div>
            {voteDetails.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {voteDetails.map((v) => {
                  const avg = v.audience_value != null ? Math.round(((v.value + v.audience_value) / 2) * 10) / 10 : v.value
                  return (
                    <span
                      key={v.user_name}
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        avg >= 7 ? 'bg-[#3fb95022] text-[var(--success)]'
                        : avg >= 4 ? 'bg-[#d2992222] text-[var(--warning)]'
                        : 'bg-[#f8514922] text-[var(--danger)]'
                      }`}
                    >
                      {v.user_name}: {v.value}{v.audience_value != null ? `/${v.audience_value}` : ''}
                    </span>
                  )
                })}
              </div>
            )}
          </div>
          )
        })()}

        {/* Actions row */}
        <div className="flex items-center gap-2 mt-3">
          {onEdit && (
            <button
              onClick={() => { setEditTitle(song.title); setEditArtist(song.artist || ''); setEditing(true) }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:text-[var(--accent)] transition-colors"
              title="Düzenle"
            >
              <Pencil className="w-4 h-4" />
              <span className="text-xs">Düzenle</span>
            </button>
          )}

          {onRemove && (
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-[var(--danger)] hover:bg-[#f8514922] transition-colors"
              title="Sil"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          {showDeficiencies && (
            <button
              onClick={() => setShowDefPanel(!showDefPanel)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                unresolvedCount > 0
                  ? 'text-[var(--warning)] bg-[#d2992222]'
                  : 'text-[var(--text-muted)] hover:bg-[var(--bg-secondary)]'
              }`}
            >
              <AlertCircle className="w-4 h-4" />
              Eksikler{unresolvedCount > 0 && ` (${unresolvedCount})`}
            </button>
          )}

          <button
            onClick={() => setShowChat(!showChat)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
              showChat ? 'text-[var(--accent)] bg-[var(--accent-subtle)]' : 'text-[var(--text-muted)] hover:bg-[var(--bg-secondary)]'
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            {commentCount > 0 && <span className="text-xs">{commentCount}</span>}
          </button>

          <div className="flex-1" />

          {onAddToRepertoire && (
            <button
              onClick={onAddToRepertoire}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-[var(--accent)] hover:bg-[var(--accent-subtle)] transition-colors"
              title="Repertuvara Ekle"
            >
              <CheckCircle className="w-4 h-4" />
              <span className="text-xs">Repertuvara Ekle</span>
            </button>
          )}
        </div>
      </div>

      {/* Deficiencies panel */}
      {showDefPanel && showDeficiencies && (
        <div className="border-t border-[var(--border)] p-4 bg-[var(--bg-secondary)]">
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newDeficiency}
              onChange={(e) => setNewDeficiency(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addDeficiency()}
              className="flex-1 px-3 py-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] text-sm placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
              placeholder="Eksik ekle..."
            />
            <button
              onClick={addDeficiency}
              className="px-3 py-2 bg-[var(--accent)] text-white rounded-lg text-sm hover:opacity-90 transition-opacity"
            >
              Ekle
            </button>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {deficiencies.map((def) => (
              <div
                key={def.id}
                className={`flex items-start gap-2 text-sm p-2 rounded-lg ${
                  def.is_resolved ? 'bg-[#3fb95011]' : 'bg-[#d2992211]'
                }`}
              >
                <button
                  onClick={() => onToggleDeficiency?.(def.id)}
                  className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                    def.is_resolved
                      ? 'bg-[var(--success)] border-[var(--success)] text-white'
                      : 'border-[var(--border)] hover:border-[var(--text-muted)]'
                  }`}
                >
                  {def.is_resolved && <Check className="w-3 h-3" />}
                </button>
                <div className="flex-1">
                  <span className={`${def.is_resolved ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text-primary)]'}`}>
                    {def.content}
                  </span>
                  <span className="text-[var(--text-muted)] text-xs ml-2">— {def.user_name}</span>
                </div>
              </div>
            ))}
            {deficiencies.length === 0 && (
              <p className="text-[var(--text-muted)] text-sm">Henüz eksik girilmemiş</p>
            )}
          </div>
        </div>
      )}

      {/* Chat panel */}
      {showChat && (
        <div className="border-t border-[var(--border)] bg-[var(--bg-secondary)]">
          <div className="max-h-48 overflow-y-auto p-3 space-y-2">
            {comments.map((c) => (
              <div key={c.id} className={`flex flex-col ${c.user_id === user?.id ? 'items-end' : 'items-start'}`}>
                <span className="text-[10px] text-[var(--text-muted)] mb-0.5">{c.user_name}</span>
                <div className={`px-3 py-1.5 rounded-xl text-sm max-w-[80%] ${
                  c.user_id === user?.id
                    ? 'bg-[var(--accent)] text-white rounded-br-sm'
                    : 'bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border)] rounded-bl-sm'
                }`}>
                  {c.content}
                </div>
              </div>
            ))}
            {comments.length === 0 && (
              <p className="text-[var(--text-muted)] text-xs text-center py-2">Henüz yorum yok</p>
            )}
            <div ref={chatEndRef} />
          </div>
          <div className="flex gap-2 p-3 pt-0">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendComment()}
              className="flex-1 px-3 py-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] text-sm placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              placeholder="Yorum yaz..."
            />
            <button
              onClick={sendComment}
              disabled={!newComment.trim()}
              className="p-2 bg-[var(--accent)] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmDelete}
        title="Silmek İstediğinize Emin Misiniz?"
        message={`"${song.title}" silinecek.`}
        confirmLabel="Sil"
        onConfirm={() => { setConfirmDelete(false); onRemove?.() }}
        onCancel={() => setConfirmDelete(false)}
        variant="danger"
      />
    </div>
  )
}

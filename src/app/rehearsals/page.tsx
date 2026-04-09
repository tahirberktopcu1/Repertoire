'use client'

import { useState } from 'react'
import AppShell from '@/components/AppShell'
import { useLocations } from '@/contexts/LocationsContext'
import { useSongs } from '@/contexts/SongsContext'
import { mockRehearsals as initialRehearsals, MOCK_USER_ID } from '@/lib/mock-data'
import type { Rehearsal } from '@/lib/types'
import { Calendar, Plus, X, Clock, MapPin, Music, Trash2, ChevronDown, ChevronUp, Star, AlertCircle, Check } from 'lucide-react'
import { format, parseISO, isPast, isToday } from 'date-fns'
import { tr } from 'date-fns/locale'

export default function RehearsalsPage() {
  const { locations } = useLocations()
  const { repertoire, deficiencies } = useSongs()
  const [rehearsals, setRehearsals] = useState<Rehearsal[]>(initialRehearsals)
  const [showAddForm, setShowAddForm] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('19:00')
  const [endTime, setEndTime] = useState('21:00')
  const [location, setLocation] = useState('')

  const newSongs = repertoire.filter((s) => !s.practiced_at)

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    const newRehearsal: Rehearsal = {
      id: `rehearsal-${Date.now()}`,
      band_id: 'mock-band-001',
      title: title || null,
      date,
      start_time: startTime + ':00',
      end_time: endTime ? endTime + ':00' : null,
      location: location || null,
      notes: null,
      created_by: MOCK_USER_ID,
      created_at: new Date().toISOString(),
    }
    setRehearsals([newRehearsal, ...rehearsals])
    setTitle('')
    setDate('')
    setStartTime('19:00')
    setEndTime('21:00')
    setLocation('')
    setShowAddForm(false)
  }

  const handleDelete = (id: string) => {
    setRehearsals(rehearsals.filter((r) => r.id !== id))
  }

  const upcomingRehearsals = rehearsals.filter(
    (r) => !isPast(parseISO(r.date)) || isToday(parseISO(r.date))
  )
  const pastRehearsals = rehearsals.filter(
    (r) => isPast(parseISO(r.date)) && !isToday(parseISO(r.date))
  )

  const RehearsalCard = ({ rehearsal }: { rehearsal: Rehearsal }) => {
    const isExpanded = expandedId === rehearsal.id
    const today = isToday(parseISO(rehearsal.date))

    return (
      <div className={`bg-[var(--bg-card)] rounded-xl border ${today ? 'border-[var(--accent)]' : 'border-[var(--border)]'} overflow-hidden`}>
        <button
          onClick={() => setExpandedId(isExpanded ? null : rehearsal.id)}
          className="w-full p-4 text-left"
        >
          <div className="flex items-start justify-between">
            <div>
              {today && (
                <span className="text-xs font-medium text-[var(--accent)] bg-[var(--accent-subtle)] px-2 py-0.5 rounded-full">
                  BUGÜN
                </span>
              )}
              <h3 className="text-[var(--text-primary)] font-semibold mt-1">
                {format(parseISO(rehearsal.date), 'd MMMM yyyy, EEEE', { locale: tr })}
              </h3>
              <div className="flex items-center gap-3 mt-1 text-sm text-[var(--text-muted)]">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {rehearsal.start_time.slice(0, 5)}
                  {rehearsal.end_time && ` - ${rehearsal.end_time.slice(0, 5)}`}
                </span>
                {rehearsal.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {rehearsal.location}
                  </span>
                )}
              </div>
            </div>
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-[var(--text-muted)]" />
            ) : (
              <ChevronDown className="w-5 h-5 text-[var(--text-muted)]" />
            )}
          </div>
        </button>

        {isExpanded && (
          <div className="border-t border-[var(--border)] p-4 space-y-4">

            {/* Yeni Eklenenler */}
            {newSongs.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-[var(--orange)] mb-2 flex items-center gap-1.5">
                  <Star className="w-4 h-4" />
                  Yeni Eklenenler
                </h4>
                <div className="space-y-1.5">
                  {newSongs.map((song, i) => {
                    const defs = (deficiencies[song.id] || []).filter((d) => !d.is_resolved)
                    return (
                      <div key={song.id} className="bg-[var(--bg-secondary)] rounded-lg px-3 py-2.5 border border-[var(--orange)]/30">
                        <div className="flex items-center gap-2">
                          <span className="bg-[var(--orange)] text-white text-xs font-bold w-5 h-5 rounded flex items-center justify-center flex-shrink-0">
                            {i + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-[var(--text-primary)] text-sm font-medium truncate">{song.title}</p>
                            {song.artist && <p className="text-[var(--text-muted)] text-xs truncate">{song.artist}</p>}
                          </div>
                          {defs.length > 0 && (
                            <span className="text-[var(--warning)] text-xs flex items-center gap-0.5 flex-shrink-0">
                              <AlertCircle className="w-3.5 h-3.5" />
                              {defs.length}
                            </span>
                          )}
                        </div>
                        {defs.length > 0 && (
                          <div className="mt-2 pl-7 space-y-1">
                            {defs.map((def) => (
                              <div key={def.id} className="flex items-start gap-1.5 text-xs">
                                <span className="text-[var(--warning)] mt-0.5">•</span>
                                <span className="text-[var(--text-secondary)]">{def.content}</span>
                                <span className="text-[var(--text-muted)]">— {def.assigned_to_name}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Diger repertuvar parcalari */}
            {repertoire.length > 2 && (
              <div>
                <h4 className="text-sm font-medium text-[var(--text-secondary)] mb-2 flex items-center gap-1">
                  <Music className="w-4 h-4" />
                  Tüm Repertuvar ({repertoire.length} parça)
                </h4>
                <div className="space-y-1.5">
                  {repertoire.slice(2).map((song, i) => {
                    const defs = (deficiencies[song.id] || []).filter((d) => !d.is_resolved)
                    return (
                      <div key={song.id} className="bg-[var(--bg-secondary)] rounded-lg px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[var(--text-muted)] text-xs w-5">{i + 3}.</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-[var(--text-primary)] text-sm truncate">{song.title}</p>
                            {song.artist && <p className="text-[var(--text-muted)] text-xs truncate">{song.artist}</p>}
                          </div>
                          {defs.length > 0 ? (
                            <span className="text-[var(--warning)] text-xs flex items-center gap-0.5 flex-shrink-0">
                              <AlertCircle className="w-3.5 h-3.5" />
                              {defs.length}
                            </span>
                          ) : (
                            <Check className="w-3.5 h-3.5 text-[var(--success)] flex-shrink-0" />
                          )}
                        </div>
                        {defs.length > 0 && (
                          <div className="mt-2 pl-7 space-y-1">
                            {defs.map((def) => (
                              <div key={def.id} className="flex items-start gap-1.5 text-xs">
                                <span className="text-[var(--warning)] mt-0.5">•</span>
                                <span className="text-[var(--text-secondary)]">{def.content}</span>
                                <span className="text-[var(--text-muted)]">— {def.assigned_to_name}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {repertoire.length === 0 && (
              <p className="text-[var(--text-muted)] text-sm">Repertuvarda parça yok</p>
            )}

            <button
              onClick={() => handleDelete(rehearsal.id)}
              className="flex items-center gap-1 text-[var(--danger)] hover:opacity-80 text-sm transition-opacity"
            >
              <Trash2 className="w-4 h-4" />
              Provayı Sil
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <AppShell>
      <div className="py-4 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[var(--accent)]" />
            Provalar
          </h1>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1 px-3 py-2 bg-[var(--accent)] hover:opacity-90 text-white rounded-lg text-sm font-medium transition-opacity"
          >
            {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showAddForm ? 'Kapat' : 'Prova Ekle'}
          </button>
        </div>

        {showAddForm && (
          <form onSubmit={handleAdd} className="bg-[var(--bg-card)] rounded-xl border border-[var(--border)] p-4 space-y-3">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              required
            />
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs text-[var(--text-muted)] mb-1 block">Başlangıç</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  required
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-[var(--text-muted)] mb-1 block">Bitiş</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-[var(--text-muted)] mb-1 block">Konum</label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              >
                <option value="">Konum seçin...</option>
                {locations.map((loc) => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-[var(--accent)] hover:opacity-90 text-white font-medium rounded-lg text-sm transition-opacity"
            >
              Prova Oluştur
            </button>
          </form>
        )}

        {upcomingRehearsals.length > 0 && (
          <div>
            <h2 className="text-xs font-medium text-[var(--text-muted)] mb-2 uppercase tracking-wider">Yaklaşan</h2>
            <div className="space-y-3">
              {upcomingRehearsals.map((r) => (
                <RehearsalCard key={r.id} rehearsal={r} />
              ))}
            </div>
          </div>
        )}

        {pastRehearsals.length > 0 && (
          <div>
            <h2 className="text-xs font-medium text-[var(--text-muted)] mb-2 uppercase tracking-wider">Geçmiş</h2>
            <div className="space-y-3">
              {pastRehearsals.map((r) => (
                <RehearsalCard key={r.id} rehearsal={r} />
              ))}
            </div>
          </div>
        )}

        {rehearsals.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
            <p className="text-[var(--text-muted)]">Henüz prova planlanmamış</p>
          </div>
        )}
      </div>
    </AppShell>
  )
}

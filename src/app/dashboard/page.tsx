'use client'

import { useEffect, useState } from 'react'
import { useBand } from '@/contexts/BandContext'
import { useSongs } from '@/contexts/SongsContext'
import { useRehearsal } from '@/contexts/RehearsalContext'
import AppShell from '@/components/AppShell'
import { checkRehearsalReminders } from '@/lib/notifications'
import {
  Calendar, Clock, MapPin, Star, AlertCircle, Check, Plus, X, Pencil, Trash2, Music,
} from 'lucide-react'
import ConfirmDialog from '@/components/ConfirmDialog'
import { useToast } from '@/components/Toast'
import { format, parseISO, isToday } from 'date-fns'
import { tr } from 'date-fns/locale'

export default function DashboardPage() {
  const { currentBand } = useBand()
  const { repertoire, deficiencies, resolveDeficiency } = useSongs()
  const { activeRehearsal, isRehearsalOver, createRehearsal, updateRehearsal, deleteRehearsal, clearRehearsal } = useRehearsal()
  const { toast } = useToast()

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [confirmResolve, setConfirmResolve] = useState<{ songId: string; defId: string; content: string } | null>(null)
  const [confirmDeleteRehearsal, setConfirmDeleteRehearsal] = useState(false)
  const [editing, setEditing] = useState(false)
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('19:00')
  const [endTime, setEndTime] = useState('21:00')
  const [location, setLocation] = useState('')

  // Bildirimler
  useEffect(() => {
    if (activeRehearsal) {
      checkRehearsalReminders([{
        id: activeRehearsal.id,
        title: null,
        date: activeRehearsal.date,
        start_time: activeRehearsal.start_time,
        location: activeRehearsal.location,
      }])
    }
  }, [activeRehearsal])

  const handleCreateRehearsal = (e: React.FormEvent) => {
    e.preventDefault()
    createRehearsal({ date, start_time: startTime, end_time: endTime, location })
    setShowCreateForm(false)
    resetForm()
    toast('Prova oluşturuldu!')
  }

  const startEditing = () => {
    if (!activeRehearsal) return
    setDate(activeRehearsal.date)
    setStartTime(activeRehearsal.start_time)
    setEndTime(activeRehearsal.end_time)
    setLocation(activeRehearsal.location)
    setEditing(true)
  }

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault()
    updateRehearsal({ date, start_time: startTime, end_time: endTime, location })
    setEditing(false)
    resetForm()
    toast('Prova güncellendi!')
  }

  const resetForm = () => {
    setDate('')
    setStartTime('19:00')
    setEndTime('21:00')
    setLocation('')
  }

  const handleTimeInput = (value: string, setter: (v: string) => void) => {
    // Sadece rakam ve : kabul et
    const digits = value.replace(/[^0-9]/g, '')
    if (digits.length <= 2) {
      setter(digits)
    } else {
      setter(digits.slice(0, 2) + ':' + digits.slice(2, 4))
    }
  }

  // Yeni Eklenenler: practiced_at null olan repertuvar şarkıları
  const newSongs = repertoire.filter((s) => !s.practiced_at)

  // Eksikleri olan parçalar
  const songsWithDefs = repertoire.filter((s) => {
    const defs = deficiencies[s.id] || []
    return defs.length > 0
  })

  const isRehearsalToday = activeRehearsal && isToday(parseISO(activeRehearsal.date))

  const rehearsalFormContent = (onSubmit: (e: React.FormEvent) => void, submitLabel: string) => (
    <form onSubmit={onSubmit} className="bg-[var(--bg-card)] rounded-xl border border-[var(--border)] p-4 space-y-3">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-medium text-[var(--text-primary)]">{editing ? 'Provayı Düzenle' : 'Yeni Prova'}</h3>
        <button type="button" onClick={() => { setShowCreateForm(false); setEditing(false) }} className="text-[var(--text-muted)]">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="relative" onClick={(e) => { const inp = (e.currentTarget as HTMLElement).querySelector('input'); inp?.showPicker?.(); inp?.focus() }}>
        <label className="text-xs text-[var(--text-muted)] mb-1 block">Tarih</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className={`w-full px-3 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] cursor-pointer ${date ? 'text-[var(--text-primary)]' : '[color:transparent] [&::-webkit-datetime-edit]:invisible'}`}
          required
        />
        {!date && (
          <span className="absolute left-3 bottom-2.5 text-[var(--text-muted)] text-sm pointer-events-none">
            Tarih seçiniz
          </span>
        )}
      </div>
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="text-xs text-[var(--text-muted)] mb-1 block">Başlangıç</label>
          <input
            type="text"
            inputMode="numeric"
            value={startTime}
            onChange={(e) => handleTimeInput(e.target.value, setStartTime)}
            placeholder="19:00"
            maxLength={5}
            className="w-full px-3 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] placeholder-[var(--text-muted)]"
            required
          />
        </div>
        <div className="flex-1">
          <label className="text-xs text-[var(--text-muted)] mb-1 block">Bitiş</label>
          <input
            type="text"
            inputMode="numeric"
            value={endTime}
            onChange={(e) => handleTimeInput(e.target.value, setEndTime)}
            placeholder="21:00"
            maxLength={5}
            className="w-full px-3 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] placeholder-[var(--text-muted)]"
            required
          />
        </div>
      </div>
      <div>
        <label className="text-xs text-[var(--text-muted)] mb-1 block">Konum</label>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Konum girin..."
          className="w-full px-3 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] placeholder-[var(--text-muted)]"
          required
        />
      </div>
      <button
        type="submit"
        className="w-full py-2.5 bg-[var(--accent)] hover:opacity-90 text-white font-medium rounded-lg text-sm transition-opacity"
      >
        {submitLabel}
      </button>
    </form>
  )

  if (!currentBand) {
    return (
      <AppShell>
        <div className="py-12 text-center">
          <Music className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Henüz Grubun Yok</h2>
          <p className="text-[var(--text-muted)] text-sm mb-4">Ayarlar sayfasından grup oluşturabilir veya davet koduyla mevcut bir gruba katılabilirsin.</p>
          <a href="/settings" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--accent)] hover:opacity-90 text-white rounded-lg text-sm font-medium transition-opacity">
            Ayarlara Git
          </a>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="py-4 space-y-5">

        {/* Aktif Prova - göster veya düzenle */}
        {activeRehearsal && !isRehearsalOver && !editing && (
          <div className={`bg-[var(--bg-card)] rounded-xl border p-4 ${
            isRehearsalToday ? 'border-[var(--accent)]' : 'border-[var(--border)]'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[var(--accent)]" />
                <span className="text-[var(--accent)] text-sm font-medium">
                  {isRehearsalToday ? 'Bugünün Provası' : 'Sıradaki Prova'}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={startEditing}
                  className="p-1.5 text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
                  title="Düzenle"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setConfirmDeleteRehearsal(true)}
                  className="p-1.5 text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors"
                  title="Sil"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <h3 className="text-[var(--text-primary)] font-semibold">
              {format(parseISO(activeRehearsal.date), 'd MMMM, EEEE', { locale: tr })}
            </h3>
            <div className="flex items-center gap-4 mt-1.5 text-sm text-[var(--text-secondary)]">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {activeRehearsal.start_time.slice(0, 5)} - {activeRehearsal.end_time.slice(0, 5)}
              </span>
              {activeRehearsal.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {activeRehearsal.location}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Düzenleme formu */}
        {editing && rehearsalFormContent(handleUpdate, 'Güncelle')}

        {/* Prova bitti */}
        {activeRehearsal && isRehearsalOver && (
          <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--success)] p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Check className="w-4 h-4 text-[var(--success)]" />
                  <span className="text-[var(--success)] text-sm font-medium">Prova Tamamlandı</span>
                </div>
                <p className="text-[var(--text-muted)] text-xs">
                  {format(parseISO(activeRehearsal.date), 'd MMMM', { locale: tr })} provası sona erdi.
                  Yeni prova oluşturabilirsiniz.
                </p>
              </div>
              <button
                onClick={clearRehearsal}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Prova yoksa oluştur */}
        {!activeRehearsal && !showCreateForm && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--accent)] hover:opacity-90 text-white rounded-xl text-sm font-medium transition-opacity"
          >
            <Plus className="w-4 h-4" />
            Prova Oluştur
          </button>
        )}

        {!activeRehearsal && showCreateForm &&
          rehearsalFormContent(handleCreateRehearsal, 'Oluştur')
        }

        {/* Yeni Eklenenler */}
        {newSongs.length > 0 && (
          <div>
            <h2 className="text-sm font-medium text-[var(--orange)] mb-2 flex items-center gap-1.5">
              <Star className="w-4 h-4" />
              Yeni Eklenenler
            </h2>
            <div className="space-y-1.5">
              {newSongs.map((song, i) => {
                const defs = deficiencies[song.id] || []
                return (
                  <div key={song.id} className="bg-[var(--bg-card)] rounded-xl border border-[var(--orange)]/30 px-3 py-2.5">
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
                          <div key={def.id} className="flex items-center gap-1.5 text-xs">
                            <button
                              onClick={() => setConfirmResolve({ songId: song.id, defId: def.id, content: def.content })}
                              className="w-4 h-4 rounded border border-[var(--border)] hover:border-[var(--success)] flex items-center justify-center flex-shrink-0 transition-colors"
                              title="Tamam olarak işaretle"
                            >
                            </button>
                            <span className="text-[var(--text-secondary)]">{def.content}</span>
                            <span className={`px-1 py-0.5 rounded ${
                              def.assigned_to === 'group' ? 'bg-[var(--accent-subtle)] text-[var(--accent)]' : 'bg-[#d2992222] text-[var(--warning)]'
                            }`}>{def.assigned_to_name}</span>
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

        {/* Eksikleri Olan Parçalar — her zaman görünür */}
        {songsWithDefs.length > 0 && (
          <div>
            <h2 className="text-sm font-medium text-[var(--warning)] mb-2 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4" />
              Eksikleri Olan Parçalar
            </h2>
            <div className="space-y-1.5">
              {songsWithDefs.map((song) => {
                  const defs = deficiencies[song.id] || []
                  return (
                    <div key={song.id} className="bg-[var(--bg-card)] rounded-xl border border-[var(--border)] px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-[var(--warning)] flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[var(--text-primary)] text-sm font-medium truncate">{song.title}</p>
                          {song.artist && <p className="text-[var(--text-muted)] text-xs truncate">{song.artist}</p>}
                        </div>
                      </div>
                      <div className="mt-2 pl-6 space-y-1">
                        {defs.map((def) => (
                          <div key={def.id} className="flex items-center gap-1.5 text-xs">
                            <button
                              onClick={() => setConfirmResolve({ songId: song.id, defId: def.id, content: def.content })}
                              className="w-4 h-4 rounded border border-[var(--border)] hover:border-[var(--success)] flex items-center justify-center flex-shrink-0 transition-colors"
                              title="Tamam olarak işaretle"
                            >
                            </button>
                            <span className="text-[var(--text-secondary)]">{def.content}</span>
                            <span className={`px-1 py-0.5 rounded ${
                              def.assigned_to === 'group' ? 'bg-[var(--accent-subtle)] text-[var(--accent)]' : 'bg-[#d2992222] text-[var(--warning)]'
                            }`}>{def.assigned_to_name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!confirmResolve}
        title="Tamamlandı Olarak İşaretlemek İstediğinize Emin Misiniz?"
        message={`"${confirmResolve?.content}" eksikliği tamamlandı olarak işaretlenecek.`}
        confirmLabel="Tamamlandı"
        variant="warning"
        onConfirm={() => {
          if (confirmResolve) {
            resolveDeficiency(confirmResolve.songId, confirmResolve.defId)
            toast('Eksik tamamlandı!')
          }
          setConfirmResolve(null)
        }}
        onCancel={() => setConfirmResolve(null)}
      />

      <ConfirmDialog
        open={confirmDeleteRehearsal}
        title="Provayı Silmek İstediğinize Emin Misiniz?"
        message="Aktif prova silinecek."
        confirmLabel="Sil"
        variant="danger"
        onConfirm={() => { deleteRehearsal(); setConfirmDeleteRehearsal(false); toast('Prova silindi!') }}
        onCancel={() => setConfirmDeleteRehearsal(false)}
      />
    </AppShell>
  )
}

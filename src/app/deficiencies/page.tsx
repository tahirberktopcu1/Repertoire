'use client'

import { useState } from 'react'
import AppShell from '@/components/AppShell'
import { useSongs } from '@/contexts/SongsContext'
import { useBand } from '@/contexts/BandContext'
import { useAuth } from '@/contexts/AuthContext'
import { AlertCircle, Check, Music, Users, User, UserCircle } from 'lucide-react'
import ConfirmDialog from '@/components/ConfirmDialog'
import { useToast } from '@/components/Toast'

type FilterType = 'mine' | 'group' | 'others' | 'all'

export default function DeficienciesPage() {
  const { user } = useAuth()
  const { members } = useBand()
  const { repertoire, allDeficiencies, resolveDeficiency } = useSongs()
  const { toast } = useToast()
  const [filter, setFilter] = useState<FilterType>('mine')
  const [confirmResolve, setConfirmResolve] = useState<{ songId: string; defId: string; content: string } | null>(null)

  const userId = user?.id || ''

  const filteredDefs = allDeficiencies.filter((d) => {
    if (filter === 'mine') return d.assigned_to === userId
    if (filter === 'group') return d.assigned_to === null
    if (filter === 'others') return d.assigned_to !== null && d.assigned_to !== userId
    return true
  })

  // Sarkilara gore grupla
  const songGroups = new Map<string, typeof filteredDefs>()
  filteredDefs.forEach((d) => {
    const existing = songGroups.get(d.song_id) || []
    songGroups.set(d.song_id, [...existing, d])
  })

  const getSongName = (songId: string) => {
    const song = repertoire.find((s) => s.id === songId)
    return song ? { title: song.title, artist: song.artist } : { title: 'Bilinmeyen', artist: null }
  }

  const myCount = allDeficiencies.filter((d) => d.assigned_to === userId).length
  const groupCount = allDeficiencies.filter((d) => d.assigned_to === null).length
  const othersCount = allDeficiencies.filter((d) => d.assigned_to !== null && d.assigned_to !== userId).length

  const tabs: { key: FilterType; label: string; icon: any; count: number }[] = [
    { key: 'mine', label: 'Benim', icon: User, count: myCount },
    { key: 'group', label: 'Grup', icon: Users, count: groupCount },
    { key: 'others', label: 'Diğer Üyeler', icon: UserCircle, count: othersCount },
    { key: 'all', label: 'Tümü', icon: AlertCircle, count: allDeficiencies.length },
  ]

  const emptyMessages: Record<FilterType, string> = {
    mine: 'Eksiğin yok!',
    group: 'Grup eksiği yok!',
    others: 'Diğer üyelerin eksiği yok!',
    all: 'Hiç eksik yok!',
  }

  return (
    <AppShell>
      <div className="py-4 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-[var(--warning)]" />
            Eksikler
          </h1>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 bg-[var(--bg-secondary)] rounded-lg p-1">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-md text-xs font-medium transition-colors ${
                  filter === tab.key
                    ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
                {tab.count > 0 && (
                  <span className="bg-[var(--warning)] text-white text-[10px] px-1.5 rounded-full leading-4">{tab.count}</span>
                )}
              </button>
            )
          })}
        </div>

        {/* Deficiencies grouped by song */}
        <div className="space-y-3">
          {Array.from(songGroups.entries()).map(([songId, defs]) => {
            const song = getSongName(songId)
            return (
              <div key={songId} className="bg-[var(--bg-card)] rounded-xl border border-[var(--border)] overflow-hidden">
                <div className="px-4 py-3 flex items-center gap-2 border-b border-[var(--border)]">
                  <Music className="w-4 h-4 text-[var(--accent)]" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[var(--text-primary)] text-sm font-semibold truncate">{song.title}</p>
                    {song.artist && <p className="text-[var(--text-muted)] text-xs truncate">{song.artist}</p>}
                  </div>
                  <span className="text-[var(--warning)] text-xs font-medium">{defs.length}</span>
                </div>
                <div className="p-3 space-y-2">
                  {defs.map((def) => (
                    <div key={def.id} className="flex items-start gap-2.5 bg-[var(--bg-secondary)] rounded-lg px-3 py-2.5">
                      <button
                        onClick={() => setConfirmResolve({ songId, defId: def.id, content: def.content })}
                        className="mt-0.5 flex-shrink-0 w-5 h-5 rounded border border-[var(--border)] hover:border-[var(--success)] hover:bg-[var(--success)] hover:text-white flex items-center justify-center transition-all group"
                        title="Tamamlandı"
                      >
                        <Check className="w-3 h-3 opacity-0 group-hover:opacity-100" />
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="text-[var(--text-primary)] text-sm">{def.content}</p>
                        <span className={`inline-block mt-1 text-xs px-1.5 py-0.5 rounded ${
                          def.assigned_to === null
                            ? 'bg-[var(--accent-subtle)] text-[var(--accent)]'
                            : def.assigned_to === userId
                            ? 'bg-[#d2992222] text-[var(--warning)]'
                            : 'bg-[var(--bg-card)] text-[var(--text-muted)]'
                        }`}>
                          {def.assigned_to_name}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}

          {filteredDefs.length === 0 && (
            <div className="text-center py-12">
              <Check className="w-12 h-12 text-[var(--success)] mx-auto mb-3" />
              <p className="text-[var(--text-primary)] font-medium">{emptyMessages[filter]}</p>
              <p className="text-[var(--text-muted)] text-sm mt-1">Harika, böyle devam!</p>
            </div>
          )}
        </div>
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
    </AppShell>
  )
}

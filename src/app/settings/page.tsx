'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useBand } from '@/contexts/BandContext'
import { useLocations } from '@/contexts/LocationsContext'
import AppShell from '@/components/AppShell'
import {
  Settings,
  Users,
  Copy,
  Check,
  LogOut,
  Link as LinkIcon,
  MapPin,
  Plus,
  X,
  Pencil,
  Trash2,
  DoorOpen,
} from 'lucide-react'
import ConfirmDialog from '@/components/ConfirmDialog'

export default function SettingsPage() {
  const { user, profile, signOut } = useAuth()
  const { currentBand, members, renameBand, deleteBand, leaveBand, refreshBands } = useBand()
  const [editingName, setEditingName] = useState(false)
  const [bandName, setBandName] = useState(currentBand?.name || '')
  const { locations, addLocation, removeLocation } = useLocations()
  const [copied, setCopied] = useState<string | null>(null)
  const [confirmAction, setConfirmAction] = useState<'delete' | 'leave' | null>(null)
  const [showJoinForm, setShowJoinForm] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [createLoading, setCreateLoading] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [joinError, setJoinError] = useState('')
  const [joinLoading, setJoinLoading] = useState(false)
  const supabase = createClient()
  const [newLocation, setNewLocation] = useState('')

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return
    setCreateLoading(true)

    // RLS auth.uid() otomatik kullanır — userId göndermeye gerek yok
    const { data: band, error: bandErr } = await supabase.from('bands')
      .insert({ name: newGroupName.trim() })
      .select().single()

    if (bandErr) { setCreateLoading(false); alert('Grup oluşturulamadı: ' + bandErr.message); return }

    if (band) {
      // band_members'a da ekle
      await supabase.from('band_members').insert({ band_id: band.id })
      await refreshBands()
    }
    setNewGroupName('')
    setShowCreateForm(false)
    setCreateLoading(false)
  }

  const handleJoin = async () => {
    if (!joinCode.trim()) { setJoinError('Davet kodu girin'); return }
    setJoinLoading(true)
    setJoinError('')

    const { data: band } = await supabase
      .from('bands')
      .select('*')
      .eq('invite_code', joinCode.trim())
      .maybeSingle()

    if (!band) {
      setJoinError('Geçersiz davet kodu')
      setJoinLoading(false)
      return
    }

    // user_id DEFAULT auth.uid() — Supabase RLS otomatik halleder
    const { error: insertErr } = await supabase.from('band_members').insert({ band_id: band.id })
    if (insertErr) {
      setJoinError('Katılma hatası: ' + insertErr.message)
      setJoinLoading(false)
      return
    }
    await refreshBands()
    setJoinCode('')
    setShowJoinForm(false)
    setJoinLoading(false)
  }

  const inviteLink = typeof window !== 'undefined' && currentBand
    ? `${window.location.origin}/invite/${currentBand.invite_code}`
    : ''

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleAddLocation = () => {
    if (!newLocation.trim()) return
    addLocation(newLocation.trim())
    setNewLocation('')
  }

  return (
    <AppShell>
      <div className="py-4 space-y-5">
        <h1 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
          <Settings className="w-5 h-5 text-[var(--accent)]" />
          Ayarlar
        </h1>

        {/* Profile */}
        <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border)] p-4">
          <h2 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-3">Profil</h2>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[var(--accent)] flex items-center justify-center">
              <span className="text-white text-lg font-bold">
                {profile?.full_name?.charAt(0)?.toUpperCase() || '?'}
              </span>
            </div>
            <div>
              <p className="text-[var(--text-primary)] font-medium">{profile?.full_name}</p>
              <p className="text-[var(--text-muted)] text-sm">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Band Info */}
        {currentBand && (
          <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border)] p-4">
            <h2 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-3">Grup</h2>
            {editingName ? (
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={bandName}
                  onChange={(e) => setBandName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { renameBand(bandName); setEditingName(false) }
                    if (e.key === 'Escape') { setBandName(currentBand.name); setEditingName(false) }
                  }}
                  autoFocus
                  className="flex-1 px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--accent)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                />
                <button
                  onClick={() => { renameBand(bandName); setEditingName(false) }}
                  className="px-3 py-2 bg-[var(--accent)] text-white rounded-lg text-sm hover:opacity-90"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => { setBandName(currentBand.name); setEditingName(false) }}
                  className="px-3 py-2 bg-[var(--bg-secondary)] text-[var(--text-muted)] rounded-lg text-sm hover:text-[var(--text-primary)]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 mb-3">
                <p className="text-[var(--text-primary)] font-semibold text-lg">{currentBand.name}</p>
                <button
                  onClick={() => { setBandName(currentBand.name); setEditingName(true) }}
                  className="p-1 text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="space-y-3">
              <div className="bg-[var(--bg-secondary)] rounded-lg p-3">
                <p className="text-[var(--text-muted)] text-xs mb-1.5">Davet Kodu</p>
                <div className="flex items-center gap-2">
                  <code className="text-[var(--accent)] font-mono text-sm flex-1">{currentBand.invite_code}</code>
                  <button
                    onClick={() => copyToClipboard(currentBand.invite_code, 'code')}
                    className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    {copied === 'code' ? <Check className="w-4 h-4 text-[var(--success)]" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="bg-[var(--bg-secondary)] rounded-lg p-3">
                <p className="text-[var(--text-muted)] text-xs mb-1.5">Davet Linki</p>
                <div className="flex items-center gap-2">
                  <p className="text-[var(--accent)] text-xs flex-1 truncate">{inviteLink}</p>
                  <button
                    onClick={() => copyToClipboard(inviteLink, 'link')}
                    className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors flex-shrink-0"
                  >
                    {copied === 'link' ? <Check className="w-4 h-4 text-[var(--success)]" /> : <LinkIcon className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Locations */}
        <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border)] p-4">
          <h2 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Konumlar / Stüdyolar
          </h2>

          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddLocation())}
              className="flex-1 px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] text-sm placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              placeholder="Yeni konum ekle..."
            />
            <button
              onClick={handleAddLocation}
              className="px-3 py-2 bg-[var(--accent)] text-white rounded-lg text-sm hover:opacity-90 transition-opacity flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              Ekle
            </button>
          </div>

          <div className="space-y-1.5">
            {locations.map((loc) => (
              <div key={loc} className="flex items-center justify-between bg-[var(--bg-secondary)] rounded-lg px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                  <span className="text-[var(--text-primary)] text-sm">{loc}</span>
                </div>
                <button
                  onClick={() => removeLocation(loc)}
                  className="text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            {locations.length === 0 && (
              <p className="text-[var(--text-muted)] text-sm py-2">Henüz konum eklenmemiş</p>
            )}
          </div>
        </div>

        {/* Members */}
        <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border)] p-4">
          <h2 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-3 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Üyeler ({members.length})
          </h2>
          <div className="space-y-1">
            {members.map((member) => (
              <div key={member.id} className="flex items-center gap-3 py-2">
                <div className="w-8 h-8 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center">
                  <span className="text-[var(--text-primary)] text-sm font-medium">
                    {(member.profiles as any)?.full_name?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                </div>
                <p className="text-[var(--text-primary)] text-sm">{(member.profiles as any)?.full_name}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Yeni grup / gruba katıl */}
        <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border)] p-4 space-y-3">
          <h2 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Grup İşlemleri</h2>

          <div className="flex gap-2">
            <button
              onClick={() => { setShowCreateForm(!showCreateForm); setShowJoinForm(false) }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-[var(--accent)] hover:opacity-90 text-white rounded-lg text-sm font-medium transition-opacity"
            >
              {showCreateForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {showCreateForm ? 'Kapat' : 'Yeni Grup'}
            </button>
            <button
              onClick={() => { setShowJoinForm(!showJoinForm); setShowCreateForm(false) }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-[var(--bg-secondary)] hover:bg-[var(--border)] text-[var(--text-primary)] rounded-lg text-sm font-medium transition-colors border border-[var(--border)]"
            >
              {showJoinForm ? <X className="w-4 h-4" /> : <LinkIcon className="w-4 h-4" />}
              {showJoinForm ? 'Kapat' : 'Gruba Katıl'}
            </button>
          </div>

          {showCreateForm && (
            <div className="flex gap-2">
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateGroup()}
                className="flex-1 px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] text-sm placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                placeholder="Grup adı"
              />
              <button
                onClick={handleCreateGroup}
                disabled={createLoading || !newGroupName.trim()}
                className="px-4 py-2 bg-[var(--accent)] hover:opacity-90 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-opacity"
              >
                {createLoading ? '...' : 'Oluştur'}
              </button>
            </div>
          )}

          {showJoinForm && (
            <div className="space-y-2">
              {joinError && (
                <p className="text-[var(--danger)] text-xs">{joinError}</p>
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                  className="flex-1 px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] text-sm placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-center tracking-widest"
                  placeholder="Davet kodu"
                />
                <button
                  onClick={handleJoin}
                  disabled={joinLoading}
                  className="px-4 py-2 bg-[var(--accent)] hover:opacity-90 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-opacity"
                >
                  {joinLoading ? '...' : 'Katıl'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Grup işlemleri */}
        {currentBand && (() => {
          const isOwner = user?.id === currentBand.created_by
          const otherMembers = members.filter((m) => m.user_id !== user?.id)
          const canLeave = !isOwner || otherMembers.length > 0 // Owner tek kişiyse ayrılamaz
          return (
            <div className="space-y-2">
              {canLeave && (
                <button
                  onClick={() => setConfirmAction('leave')}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-[#d2992211] hover:bg-[#d2992222] text-[var(--warning)] rounded-xl border border-[#d2992233] transition-colors"
                >
                  <DoorOpen className="w-4 h-4" />
                  {isOwner ? 'Gruptan Ayrıl (sahiplik devredilecek)' : 'Gruptan Ayrıl'}
                </button>
              )}

              {isOwner && (
                <button
                  onClick={() => setConfirmAction('delete')}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-[#f8514911] hover:bg-[#f8514922] text-[var(--danger)] rounded-xl border border-[#f8514933] transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Grubu Sil
                </button>
              )}
            </div>
          )
        })()}

        {/* Sign out */}
        <button
          onClick={signOut}
          className="w-full flex items-center justify-center gap-2 py-3 bg-[#f8514911] hover:bg-[#f8514922] text-[var(--danger)] rounded-xl border border-[#f8514933] transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Çıkış Yap
        </button>
      </div>

      <ConfirmDialog
        open={confirmAction === 'leave'}
        title="Gruptan Ayrılmak İstediğinize Emin Misiniz?"
        message={user?.id === currentBand?.created_by
          ? `"${currentBand?.name}" grubundan ayrılacaksınız. Grup sahipliği başka bir üyeye devredilecek.`
          : `"${currentBand?.name}" grubundan ayrılacaksınız.`
        }
        confirmLabel="Ayrıl"
        variant="warning"
        onConfirm={() => { leaveBand(); setConfirmAction(null) }}
        onCancel={() => setConfirmAction(null)}
      />

      <ConfirmDialog
        open={confirmAction === 'delete'}
        title="Grubu Silmek İstediğinize Emin Misiniz?"
        message={`"${currentBand?.name}" grubu ve tüm içeriği kalıcı olarak silinecek. Bu işlem geri alınamaz.`}
        confirmLabel="Grubu Sil"
        variant="danger"
        onConfirm={() => { deleteBand(); setConfirmAction(null) }}
        onCancel={() => setConfirmAction(null)}
      />
    </AppShell>
  )
}

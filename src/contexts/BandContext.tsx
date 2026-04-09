'use client'

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { createClient } from '@/lib/supabase'
import { useAuth } from './AuthContext'
import type { Band, BandMember } from '@/lib/types'

interface BandContextType {
  bands: Band[]
  currentBand: Band | null
  members: BandMember[]
  setCurrentBand: (band: Band | null) => void
  renameBand: (name: string) => void
  deleteBand: () => Promise<void>
  leaveBand: () => Promise<void>
  refreshBands: () => Promise<void>
  refreshMembers: () => Promise<void>
  loading: boolean
}

const BandContext = createContext<BandContextType>({
  bands: [],
  currentBand: null,
  members: [],
  setCurrentBand: () => {},
  renameBand: () => {},
  deleteBand: async () => {},
  leaveBand: async () => {},
  refreshBands: async () => {},
  refreshMembers: async () => {},
  loading: true,
})

export function BandProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [bands, setBands] = useState<Band[]>([])
  const [currentBand, setCurrentBand] = useState<Band | null>(null)
  const [members, setMembers] = useState<BandMember[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const refreshBands = useCallback(async () => {
    if (!user) { setLoading(false); return }

    const { data } = await supabase
      .from('band_members')
      .select('band_id, bands(*)')
      .eq('user_id', user.id)

    const userBands: Band[] = (data || []).map((d: any) => d.bands as Band).filter(Boolean)
    setBands(userBands)

    setCurrentBand((prev) => {
      if (!prev && userBands.length > 0) {
        const savedId = typeof window !== 'undefined' ? localStorage.getItem('currentBandId') : null
        const saved = userBands.find((b) => b.id === savedId)
        return saved || userBands[0]
      } else if (prev) {
        const updated = userBands.find((b) => b.id === prev.id)
        return updated || (userBands.length > 0 ? userBands[0] : null)
      }
      return prev
    })
    setLoading(false)
  }, [user])

  const refreshMembers = useCallback(async () => {
    if (!currentBand) return
    const { data } = await supabase
      .from('band_members')
      .select('*, profiles(*)')
      .eq('band_id', currentBand.id)
    if (data) setMembers(data as any)
  }, [currentBand?.id])

  useEffect(() => {
    if (user) {
      refreshBands()
    } else {
      setBands([])
      setCurrentBand(null)
      setLoading(false)
    }
  }, [user, refreshBands])

  useEffect(() => {
    if (currentBand) {
      if (typeof window !== 'undefined') localStorage.setItem('currentBandId', currentBand.id)
      refreshMembers()
    }
  }, [currentBand, refreshMembers])

  // Realtime: üye değişiklikleri, grup güncellemeleri anlık
  useEffect(() => {
    if (!currentBand) return

    const channel = supabase
      .channel(`band-mgmt-${currentBand.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'band_members' }, () => {
        refreshMembers()
        refreshBands()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bands' }, (payload: any) => {
        if (payload.eventType === 'DELETE') {
          window.location.href = '/dashboard'
        } else {
          refreshBands()
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentBand?.id, refreshMembers, refreshBands])

  const renameBand = async (name: string) => {
    if (!currentBand || !name.trim()) return
    await supabase.from('bands').update({ name: name.trim() }).eq('id', currentBand.id)
    const updated = { ...currentBand, name: name.trim() }
    setCurrentBand(updated)
    setBands(bands.map((b) => b.id === updated.id ? updated : b))
  }

  const deleteBand = async () => {
    if (!currentBand || !user) return
    // Sadece owner silebilir
    if (currentBand.created_by !== user.id) return
    // CASCADE ile bands silinince tüm bağlı veriler otomatik silinir
    await supabase.from('bands').delete().eq('id', currentBand.id)
    const remaining = bands.filter((b) => b.id !== currentBand.id)
    setBands(remaining)
    setCurrentBand(remaining.length > 0 ? remaining[0] : null)
    if (remaining.length === 0) {
      window.location.href = '/dashboard'
    }
  }

  const leaveBand = async () => {
    if (!currentBand || !user) return

    const isOwner = currentBand.created_by === user.id
    if (isOwner) {
      // Grupta başka üye var mı?
      const otherMembers = members.filter((m) => m.user_id !== user.id)
      if (otherMembers.length === 0) return // Tek kişiyse ayrılamaz, silmeli
      // Rastgele birine sahiplik ver
      const newOwner = otherMembers[0]
      await supabase.from('bands').update({ created_by: newOwner.user_id }).eq('id', currentBand.id)
    }

    await supabase.from('band_members').delete().eq('band_id', currentBand.id).eq('user_id', user.id)
    const remaining = bands.filter((b) => b.id !== currentBand.id)
    setBands(remaining)
    setCurrentBand(remaining.length > 0 ? remaining[0] : null)
    if (remaining.length === 0) {
      window.location.href = '/dashboard'
    }
  }

  return (
    <BandContext.Provider
      value={{ bands, currentBand, members, setCurrentBand, renameBand, deleteBand, leaveBand, refreshBands, refreshMembers, loading }}
    >
      {children}
    </BandContext.Provider>
  )
}

export const useBand = () => useContext(BandContext)

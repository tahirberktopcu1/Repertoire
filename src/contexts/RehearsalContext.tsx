'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { createClient } from '@/lib/supabase'
import { useAuth } from './AuthContext'
import { useBand } from './BandContext'

export interface Rehearsal {
  id: string
  date: string
  start_time: string
  end_time: string
  location: string
  is_active: boolean
  newSongIds: string[]
}

interface RehearsalContextType {
  activeRehearsal: Rehearsal | null
  isRehearsalOver: boolean
  pendingSongIds: string[]
  createRehearsal: (data: { date: string; start_time: string; end_time: string; location: string }) => Promise<void>
  updateRehearsal: (data: Partial<{ date: string; start_time: string; end_time: string; location: string }>) => Promise<void>
  deleteRehearsal: () => Promise<void>
  clearRehearsal: () => void
  addSongToRehearsal: (songId: string) => void
}

const RehearsalContext = createContext<RehearsalContextType>({
  activeRehearsal: null,
  isRehearsalOver: false,
  pendingSongIds: [],
  createRehearsal: async () => {},
  updateRehearsal: async () => {},
  deleteRehearsal: async () => {},
  clearRehearsal: () => {},
  addSongToRehearsal: () => {},
})

export function RehearsalProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { currentBand } = useBand()
  const supabase = createClient()

  const [activeRehearsal, setActiveRehearsal] = useState<Rehearsal | null>(null)
  const [isRehearsalOver, setIsRehearsalOver] = useState(false)
  const [pendingSongIds, setPendingSongIds] = useState<string[]>([])

  const loadRehearsal = useCallback(async () => {
    if (!currentBand) return
    const { data } = await supabase
      .from('rehearsals')
      .select('*')
      .eq('band_id', currentBand.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (data) {
      // Prova şarkılarını al
      const { data: rSongs } = await supabase
        .from('rehearsal_songs')
        .select('song_id')
        .eq('rehearsal_id', data.id)

      setActiveRehearsal({
        id: data.id,
        date: data.date,
        start_time: data.start_time,
        end_time: data.end_time,
        location: data.location || '',
        is_active: data.is_active,
        newSongIds: (rSongs || []).map((r: any) => r.song_id),
      })

      // Bitiş kontrolü
      const now = new Date()
      const [endH, endM] = data.end_time.split(':').map(Number)
      const rehearsalEnd = new Date(data.date + 'T00:00:00')
      rehearsalEnd.setHours(endH, endM, 0)
      if (now >= rehearsalEnd) {
        setIsRehearsalOver(true)
      }
    } else {
      setActiveRehearsal(null)
      setIsRehearsalOver(false)
    }
  }, [currentBand])

  useEffect(() => {
    loadRehearsal()
  }, [loadRehearsal])

  // Her dakika bitiş kontrolü
  useEffect(() => {
    const interval = setInterval(() => {
      if (!activeRehearsal) return
      const now = new Date()
      const [endH, endM] = activeRehearsal.end_time.split(':').map(Number)
      const rehearsalEnd = new Date(activeRehearsal.date + 'T00:00:00')
      rehearsalEnd.setHours(endH, endM, 0)
      if (now >= rehearsalEnd) setIsRehearsalOver(true)
    }, 60000)
    return () => clearInterval(interval)
  }, [activeRehearsal])

  // Gün geçince otomatik kapat
  useEffect(() => {
    if (!activeRehearsal) return
    const today = new Date().toISOString().split('T')[0]
    if (activeRehearsal.date < today) {
      supabase.from('rehearsals').update({ is_active: false }).eq('id', activeRehearsal.id)
      setActiveRehearsal(null)
      setIsRehearsalOver(false)
    }
  }, [activeRehearsal])

  const createRehearsal = async (data: { date: string; start_time: string; end_time: string; location: string }) => {
    if (!currentBand || !user) return
    const { data: newR } = await supabase.from('rehearsals').insert({
      band_id: currentBand.id,
      date: data.date,
      start_time: data.start_time,
      end_time: data.end_time,
      location: data.location || null,
      is_active: true,
      created_by: user.id,
    }).select('id').single()

    // Pending şarkıları ekle
    if (newR && pendingSongIds.length > 0) {
      await supabase.from('rehearsal_songs').insert(
        pendingSongIds.map((sid) => ({ rehearsal_id: newR.id, song_id: sid }))
      )
      setPendingSongIds([])
    }

    await loadRehearsal()
  }

  const updateRehearsal = async (data: Partial<{ date: string; start_time: string; end_time: string; location: string }>) => {
    if (!activeRehearsal) return
    await supabase.from('rehearsals').update(data).eq('id', activeRehearsal.id)
    await loadRehearsal()
  }

  const deleteRehearsal = async () => {
    if (!activeRehearsal) return
    await supabase.from('rehearsals').delete().eq('id', activeRehearsal.id)
    setActiveRehearsal(null)
    setIsRehearsalOver(false)
  }

  const clearRehearsal = () => {
    if (activeRehearsal) {
      supabase.from('rehearsals').update({ is_active: false }).eq('id', activeRehearsal.id)
    }
    setActiveRehearsal(null)
    setIsRehearsalOver(false)
  }

  const addSongToRehearsal = async (songId: string) => {
    if (activeRehearsal && !isRehearsalOver) {
      if (activeRehearsal.newSongIds.includes(songId)) return
      await supabase.from('rehearsal_songs').insert({ rehearsal_id: activeRehearsal.id, song_id: songId })
      setActiveRehearsal({
        ...activeRehearsal,
        newSongIds: [...activeRehearsal.newSongIds, songId],
      })
    } else {
      setPendingSongIds((prev) => prev.includes(songId) ? prev : [...prev, songId])
    }
  }

  return (
    <RehearsalContext.Provider value={{
      activeRehearsal, isRehearsalOver, pendingSongIds,
      createRehearsal, updateRehearsal, deleteRehearsal, clearRehearsal, addSongToRehearsal,
    }}>
      {children}
    </RehearsalContext.Provider>
  )
}

export const useRehearsal = () => useContext(RehearsalContext)

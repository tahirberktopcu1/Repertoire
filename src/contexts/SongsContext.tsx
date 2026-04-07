'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { createClient } from '@/lib/supabase'
import { useAuth } from './AuthContext'
import { useBand } from './BandContext'
import type { SongWithVotes, Vote } from '@/lib/types'
import { requestNotificationPermission, sendNotification } from '@/lib/notifications'
import { sendPushToGroup } from '@/lib/push'

export interface DeficiencyItem {
  id: string
  song_id: string
  content: string
  assigned_to: string | null
  assigned_to_name: string
  created_by: string
  is_resolved: boolean
}

interface SongsContextType {
  songs: SongWithVotes[]
  repertoire: SongWithVotes[]
  votes: Vote[]
  deficiencies: Record<string, DeficiencyItem[]>
  allDeficiencies: DeficiencyItem[]
  repertoireVotes: Vote[]
  trash: SongWithVotes[]
  loading: boolean
  addSong: (song: Partial<SongWithVotes>) => Promise<void>
  removeSong: (songId: string) => Promise<void>
  moveToRepertoire: (songId: string) => Promise<void>
  removeFromRepertoire: (songId: string) => Promise<void>
  reorderRepertoire: (songId: string, direction: 'up' | 'down') => void
  rateSong: (songId: string, value: number) => Promise<void>
  addDirectToRepertoire: (title: string, artist: string, spotifyUrl?: string, youtubeUrl?: string) => Promise<string>
  rateRepertoireSong: (songId: string, value: number) => Promise<void>
  editSong: (songId: string, title: string, artist: string) => Promise<void>
  addDeficiency: (songId: string, content: string, assignedTo: string | null, assignedToName: string) => Promise<void>
  resolveDeficiency: (songId: string, defId: string) => Promise<void>
  restoreFromTrash: (songId: string) => Promise<void>
  deleteFromTrash: (songId: string) => Promise<void>
  emptyTrash: () => Promise<void>
  refresh: () => Promise<void>
}

const SongsContext = createContext<SongsContextType>({
  songs: [], repertoire: [], votes: [], deficiencies: {}, allDeficiencies: [],
  repertoireVotes: [], trash: [], loading: true,
  addSong: async () => {}, removeSong: async () => {}, moveToRepertoire: async () => {},
  removeFromRepertoire: async () => {}, reorderRepertoire: () => {},
  rateSong: async () => {}, addDirectToRepertoire: async () => '',
  rateRepertoireSong: async () => {}, editSong: async () => {}, addDeficiency: async () => {},
  resolveDeficiency: async () => {}, restoreFromTrash: async () => {},
  deleteFromTrash: async () => {}, emptyTrash: async () => {}, refresh: async () => {},
})

export function SongsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { currentBand, members } = useBand()
  const supabase = createClient()

  const [songs, setSongs] = useState<SongWithVotes[]>([])
  const [repertoire, setRepertoire] = useState<SongWithVotes[]>([])
  const [votes, setVotes] = useState<Vote[]>([])
  const [repertoireVotes, setRepertoireVotes] = useState<Vote[]>([])
  const [deficiencies, setDeficiencies] = useState<Record<string, DeficiencyItem[]>>({})
  const [trash, setTrash] = useState<SongWithVotes[]>([])
  const [loading, setLoading] = useState(true)

  const allDeficiencies = Object.values(deficiencies).flat()

  useEffect(() => { requestNotificationPermission() }, [])

  const calcScores = (rawSongs: any[], allVotes: Vote[]): SongWithVotes[] => {
    return rawSongs.map((s) => {
      const songVotes = allVotes.filter((v) => v.song_id === s.id)
      const vote_count = songVotes.length
      const avg_score = vote_count > 0
        ? Math.round((songVotes.reduce((sum, v) => sum + v.value, 0) / vote_count) * 10) / 10
        : 0
      return {
        ...s,
        avg_score,
        vote_count,
        suggested_by_name: s.profiles?.full_name || s.suggested_by_name || '',
      }
    })
  }

  const refresh = useCallback(async () => {
    if (!currentBand) { setLoading(false); return }

    // Şarkılar
    const { data: songsData } = await supabase
      .from('songs')
      .select('*, profiles:suggested_by(full_name)')
      .eq('band_id', currentBand.id)
      .is('deleted_at', null)

    // Çöp kutusu
    const { data: trashData } = await supabase
      .from('songs')
      .select('*, profiles:suggested_by(full_name)')
      .eq('band_id', currentBand.id)
      .not('deleted_at', 'is', null)

    // Oylar
    const { data: votesData } = await supabase
      .from('votes')
      .select('*')
      .in('song_id', (songsData || []).map((s: any) => s.id))

    // Repertuvar oyları
    const { data: repVotesData } = await supabase
      .from('repertoire_votes')
      .select('*')
      .in('song_id', (songsData || []).map((s: any) => s.id))

    // Eksikler
    const { data: defsData } = await supabase
      .from('deficiencies')
      .select('*, assigned_profile:assigned_to(full_name)')
      .in('song_id', (songsData || []).map((s: any) => s.id))
      .eq('is_resolved', false)

    const votesList = (votesData || []) as Vote[]
    const repVotesList = (repVotesData || []) as Vote[]
    setVotes(votesList)
    setRepertoireVotes(repVotesList)

    const allSongsWithScores = calcScores(songsData || [], votesList)
    setSongs(allSongsWithScores.filter((s) => s.status === 'suggested'))
    // Repertoire: son eklenen en üstte
    setRepertoire(
      allSongsWithScores
        .filter((s) => s.status === 'approved')
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    )
    setTrash(calcScores(trashData || [], []))

    // Eksikleri grupla
    const defsMap: Record<string, DeficiencyItem[]> = {}
    ;(defsData || []).forEach((d: any) => {
      const item: DeficiencyItem = {
        id: d.id,
        song_id: d.song_id,
        content: d.content,
        assigned_to: d.assigned_to,
        assigned_to_name: d.assigned_to ? (d.assigned_profile?.full_name || 'Bilinmeyen') : 'Grup',
        created_by: d.created_by,
        is_resolved: d.is_resolved,
      }
      if (!defsMap[d.song_id]) defsMap[d.song_id] = []
      defsMap[d.song_id].push(item)
    })
    setDeficiencies(defsMap)
    setLoading(false)
  }, [currentBand])

  useEffect(() => {
    if (currentBand) refresh()
  }, [currentBand, refresh])

  // Realtime: tüm değişiklikleri anlık dinle
  useEffect(() => {
    if (!currentBand) return

    const channel = supabase
      .channel(`band-${currentBand.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'songs', filter: `band_id=eq.${currentBand.id}` }, () => refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'votes' }, () => refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'repertoire_votes' }, () => refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deficiencies' }, () => refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'band_members', filter: `band_id=eq.${currentBand.id}` }, () => refresh())
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentBand, refresh])

  const addSong = async (song: Partial<SongWithVotes>) => {
    if (!currentBand || !user) return
    const { error } = await supabase.from('songs').insert({
      band_id: currentBand.id,
      title: song.title,
      artist: song.artist,
      spotify_url: song.spotify_url || null,
      youtube_url: song.youtube_url || null,
      suggested_by: user.id,
      status: 'suggested',
    })
    if (!error) {
      sendNotification('Yeni Şarkı Önerisi!', `${song.title} - ${song.artist}`, `song-new`)
      // Push bildirim — uygulama kapalı olsa bile gider
      if (currentBand) {
        sendPushToGroup(currentBand.id, 'Yeni Şarkı Önerisi!', `${song.title} - ${song.artist}`, '/songs')
      }
      await refresh()
    }
  }

  const removeSong = async (songId: string) => {
    await supabase.from('songs').update({ deleted_at: new Date().toISOString() }).eq('id', songId)
    await refresh()
  }

  const moveToRepertoire = async (songId: string) => {
    await supabase.from('songs').update({ status: 'approved' }).eq('id', songId)
    await refresh()
  }

  const removeFromRepertoire = async (songId: string) => {
    await supabase.from('songs').update({ deleted_at: new Date().toISOString() }).eq('id', songId)
    await refresh()
  }

  const reorderRepertoire = (songId: string, direction: 'up' | 'down') => {
    const idx = repertoire.findIndex((s) => s.id === songId)
    if (idx === -1) return
    if (direction === 'up' && idx === 0) return
    if (direction === 'down' && idx === repertoire.length - 1) return
    const newList = [...repertoire]
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    ;[newList[idx], newList[swapIdx]] = [newList[swapIdx], newList[idx]]
    setRepertoire(newList)
  }

  const rateSong = async (songId: string, value: number) => {
    if (!user) return
    const existing = votes.find((v) => v.song_id === songId && v.user_id === user.id)
    if (existing) {
      if (existing.value === value) {
        await supabase.from('votes').delete().eq('id', existing.id)
      } else {
        await supabase.from('votes').update({ value }).eq('id', existing.id)
      }
    } else {
      await supabase.from('votes').insert({ song_id: songId, user_id: user.id, value })
    }
    await refresh()
  }

  const addDirectToRepertoire = async (title: string, artist: string, spotifyUrl?: string, youtubeUrl?: string): Promise<string> => {
    if (!currentBand || !user) return ''
    const { data } = await supabase.from('songs').insert({
      band_id: currentBand.id,
      title, artist,
      spotify_url: spotifyUrl || null,
      youtube_url: youtubeUrl || null,
      suggested_by: user.id,
      status: 'approved',
    }).select('id').single()
    await refresh()
    return data?.id || ''
  }

  const rateRepertoireSong = async (songId: string, value: number) => {
    if (!user) return
    const existing = repertoireVotes.find((v) => v.song_id === songId && v.user_id === user.id)
    if (existing) {
      if (existing.value === value) {
        await supabase.from('repertoire_votes').delete().eq('id', existing.id)
      } else {
        await supabase.from('repertoire_votes').update({ value }).eq('id', existing.id)
      }
    } else {
      await supabase.from('repertoire_votes').insert({ song_id: songId, user_id: user.id, value })
    }
    await refresh()
  }

  const editSong = async (songId: string, title: string, artist: string) => {
    await supabase.from('songs').update({ title, artist }).eq('id', songId)
    await refresh()
  }

  const addDeficiency = async (songId: string, content: string, assignedTo: string | null, _assignedToName: string) => {
    if (!user) return
    await supabase.from('deficiencies').insert({
      song_id: songId,
      content,
      assigned_to: assignedTo === 'group' ? null : assignedTo,
      created_by: user.id,
    })
    await refresh()
  }

  const resolveDeficiency = async (_songId: string, defId: string) => {
    await supabase.from('deficiencies').update({ is_resolved: true }).eq('id', defId)
    await refresh()
  }

  const restoreFromTrash = async (songId: string) => {
    await supabase.from('songs').update({ deleted_at: null }).eq('id', songId)
    await refresh()
  }

  const deleteFromTrash = async (songId: string) => {
    await supabase.from('songs').delete().eq('id', songId)
    await refresh()
  }

  const emptyTrash = async () => {
    const ids = trash.map((s) => s.id)
    if (ids.length > 0) await supabase.from('songs').delete().in('id', ids)
    await refresh()
  }

  return (
    <SongsContext.Provider value={{
      songs, repertoire, votes, deficiencies, allDeficiencies,
      repertoireVotes, trash, loading,
      addSong, removeSong, moveToRepertoire, removeFromRepertoire, reorderRepertoire,
      rateSong, addDirectToRepertoire, rateRepertoireSong,
      editSong, addDeficiency, resolveDeficiency, restoreFromTrash, deleteFromTrash, emptyTrash, refresh,
    }}>
      {children}
    </SongsContext.Provider>
  )
}

export const useSongs = () => useContext(SongsContext)

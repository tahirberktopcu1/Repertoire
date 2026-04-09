export interface Profile {
  id: string
  full_name: string
  avatar_url: string | null
  created_at: string
}

export interface Band {
  id: string
  name: string
  created_by: string
  invite_code: string
  created_at: string
}

export interface BandMember {
  id: string
  band_id: string
  user_id: string
  joined_at: string
  profiles?: Profile
}

export type SongStatus = 'suggested' | 'approved' | 'rejected'

export interface Song {
  id: string
  band_id: string
  title: string
  artist: string | null
  spotify_url: string | null
  youtube_url: string | null
  suggested_by: string
  status: SongStatus
  created_at: string
  practiced_at: string | null
}

export interface SongWithVotes extends Song {
  avg_score: number      // 0-10 ortalama
  vote_count: number     // kac kisi oylamis
  suggested_by_name: string
}

export interface Vote {
  id: string
  song_id: string
  user_id: string
  value: number // 1-10 (beğeni / çalma kalitesi)
  audience_value: number | null // 1-10 (seyirci tahmini / seyirci beğenisi), null = verilmemiş
  created_at: string
}

export interface Deficiency {
  id: string
  song_id: string
  content: string
  assigned_to: string // user id veya 'group'
  assigned_to_name: string
  created_by: string
  is_resolved: boolean
  created_at: string
}

export interface Repertoire {
  id: string
  band_id: string
  song_id: string
  added_by: string
  sort_order: number
  created_at: string
  songs?: Song
}

export interface Rehearsal {
  id: string
  band_id: string
  title: string | null
  date: string
  start_time: string
  end_time: string | null
  location: string | null
  notes: string | null
  created_by: string
  created_at: string
}

export interface RehearsalSong {
  id: string
  rehearsal_id: string
  song_id: string
  sort_order: number
  songs?: Song
}

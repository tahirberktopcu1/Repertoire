import type { Profile, Band, BandMember, SongWithVotes, Vote, Rehearsal } from './types'

export const MOCK_USER_ID = 'mock-user-001'

export const mockProfile: Profile = {
  id: MOCK_USER_ID,
  full_name: 'Tahir',
  avatar_url: null,
  created_at: '2026-01-01T00:00:00Z',
}

export const mockBand: Band = {
  id: 'mock-band-001',
  name: 'Rock Rebellion',
  created_by: MOCK_USER_ID,
  invite_code: 'abc123def456',
  created_at: '2026-01-01T00:00:00Z',
}

export const mockBand2: Band = {
  id: 'mock-band-002',
  name: 'Akustik Trio',
  created_by: 'mock-user-002',
  invite_code: 'xyz789',
  created_at: '2026-02-01T00:00:00Z',
}

export const mockMembers: BandMember[] = [
  {
    id: 'member-001',
    band_id: mockBand.id,
    user_id: MOCK_USER_ID,
    joined_at: '2026-01-01T00:00:00Z',
    profiles: mockProfile,
  },
  {
    id: 'member-002',
    band_id: mockBand.id,
    user_id: 'mock-user-002',
    joined_at: '2026-01-02T00:00:00Z',
    profiles: { id: 'mock-user-002', full_name: 'Ahmet', avatar_url: null, created_at: '2026-01-02T00:00:00Z' },
  },
  {
    id: 'member-003',
    band_id: mockBand.id,
    user_id: 'mock-user-003',
    joined_at: '2026-01-03T00:00:00Z',
    profiles: { id: 'mock-user-003', full_name: 'Mehmet', avatar_url: null, created_at: '2026-01-03T00:00:00Z' },
  },
  {
    id: 'member-004',
    band_id: mockBand.id,
    user_id: 'mock-user-004',
    joined_at: '2026-01-04T00:00:00Z',
    profiles: { id: 'mock-user-004', full_name: 'Zeynep', avatar_url: null, created_at: '2026-01-04T00:00:00Z' },
  },
]

export const mockSongs: SongWithVotes[] = [
  {
    id: 'song-001',
    band_id: mockBand.id,
    title: 'Smells Like Teen Spirit',
    artist: 'Nirvana',
    spotify_url: 'https://open.spotify.com/track/5ghIJDpPoe3CfHMGu71E6T',
    youtube_url: 'https://www.youtube.com/watch?v=hTWKbfoikeg',
    suggested_by: MOCK_USER_ID,
    status: 'suggested',
    created_at: '2026-03-01T00:00:00Z',
    avg_score: 8.5,
    vote_count: 4,
    suggested_by_name: 'Tahir',
  },
  {
    id: 'song-002',
    band_id: mockBand.id,
    title: 'Back in Black',
    artist: 'AC/DC',
    spotify_url: 'https://open.spotify.com/track/08mG3Y1vljYA6bvDt4Wqkj',
    youtube_url: 'https://www.youtube.com/watch?v=pAgnJDJN4VA',
    suggested_by: 'mock-user-002',
    status: 'suggested',
    created_at: '2026-03-02T00:00:00Z',
    avg_score: 7.3,
    vote_count: 3,
    suggested_by_name: 'Ahmet',
  },
  {
    id: 'song-003',
    band_id: mockBand.id,
    title: 'Paranoid',
    artist: 'Black Sabbath',
    spotify_url: 'https://open.spotify.com/track/457bBaEEcFJmIHRxMErhtx',
    youtube_url: null,
    suggested_by: 'mock-user-003',
    status: 'suggested',
    created_at: '2026-03-03T00:00:00Z',
    avg_score: 6.0,
    vote_count: 2,
    suggested_by_name: 'Mehmet',
  },
  {
    id: 'song-004',
    band_id: mockBand.id,
    title: 'Enter Sandman',
    artist: 'Metallica',
    spotify_url: null,
    youtube_url: 'https://www.youtube.com/watch?v=CD-E-LDc384',
    suggested_by: 'mock-user-004',
    status: 'suggested',
    created_at: '2026-03-04T00:00:00Z',
    avg_score: 5.0,
    vote_count: 2,
    suggested_by_name: 'Zeynep',
  },
  {
    id: 'song-005',
    band_id: mockBand.id,
    title: 'Highway to Hell',
    artist: 'AC/DC',
    spotify_url: 'https://open.spotify.com/track/2zYzyRzz6pRmhPzyfMEC8s',
    youtube_url: 'https://www.youtube.com/watch?v=l482T0yNkeo',
    suggested_by: MOCK_USER_ID,
    status: 'suggested',
    created_at: '2026-03-05T00:00:00Z',
    avg_score: 3.5,
    vote_count: 2,
    suggested_by_name: 'Tahir',
  },
]

export const mockRepertoireSongs: SongWithVotes[] = [
  {
    id: 'song-010',
    band_id: mockBand.id,
    title: 'Smoke on the Water',
    artist: 'Deep Purple',
    spotify_url: 'https://open.spotify.com/track/4DdkRBBYG4cOSHYmIoMEAM',
    youtube_url: 'https://www.youtube.com/watch?v=zUwEIt9ez7M',
    suggested_by: MOCK_USER_ID,
    status: 'approved',
    created_at: '2026-02-01T00:00:00Z',
    avg_score: 9.2,
    vote_count: 4,
    suggested_by_name: 'Tahir',
  },
  {
    id: 'song-011',
    band_id: mockBand.id,
    title: 'Sweet Child O\' Mine',
    artist: 'Guns N\' Roses',
    spotify_url: 'https://open.spotify.com/track/7o2CTH4ctstm8TNelqjb51',
    youtube_url: 'https://www.youtube.com/watch?v=1w7OgIMMRc4',
    suggested_by: 'mock-user-002',
    status: 'approved',
    created_at: '2026-02-02T00:00:00Z',
    avg_score: 8.8,
    vote_count: 4,
    suggested_by_name: 'Ahmet',
  },
  {
    id: 'song-012',
    band_id: mockBand.id,
    title: 'Wish You Were Here',
    artist: 'Pink Floyd',
    spotify_url: null,
    youtube_url: 'https://www.youtube.com/watch?v=IXdNnw99-Ic',
    suggested_by: 'mock-user-003',
    status: 'approved',
    created_at: '2026-02-03T00:00:00Z',
    avg_score: 7.5,
    vote_count: 4,
    suggested_by_name: 'Mehmet',
  },
]

// Her kullanicinin verdig puan (1-10)
export const mockVotes: Vote[] = [
  // Tahir
  { id: 'vote-001', song_id: 'song-001', user_id: MOCK_USER_ID, value: 9, created_at: '2026-03-01T00:00:00Z' },
  { id: 'vote-002', song_id: 'song-002', user_id: MOCK_USER_ID, value: 7, created_at: '2026-03-02T00:00:00Z' },
  { id: 'vote-003', song_id: 'song-004', user_id: MOCK_USER_ID, value: 4, created_at: '2026-03-04T00:00:00Z' },
  // Ahmet
  { id: 'vote-011', song_id: 'song-001', user_id: 'mock-user-002', value: 8, created_at: '2026-03-01T00:00:00Z' },
  { id: 'vote-012', song_id: 'song-002', user_id: 'mock-user-002', value: 8, created_at: '2026-03-02T00:00:00Z' },
  { id: 'vote-013', song_id: 'song-003', user_id: 'mock-user-002', value: 7, created_at: '2026-03-03T00:00:00Z' },
  // Mehmet
  { id: 'vote-021', song_id: 'song-001', user_id: 'mock-user-003', value: 9, created_at: '2026-03-01T00:00:00Z' },
  { id: 'vote-022', song_id: 'song-002', user_id: 'mock-user-003', value: 6, created_at: '2026-03-02T00:00:00Z' },
  { id: 'vote-023', song_id: 'song-004', user_id: 'mock-user-003', value: 6, created_at: '2026-03-04T00:00:00Z' },
  // Zeynep
  { id: 'vote-031', song_id: 'song-001', user_id: 'mock-user-004', value: 8, created_at: '2026-03-01T00:00:00Z' },
  { id: 'vote-032', song_id: 'song-002', user_id: 'mock-user-004', value: 8, created_at: '2026-03-02T00:00:00Z' },
  { id: 'vote-033', song_id: 'song-003', user_id: 'mock-user-003', value: 5, created_at: '2026-03-03T00:00:00Z' },
  { id: 'vote-034', song_id: 'song-005', user_id: 'mock-user-004', value: 3, created_at: '2026-03-05T00:00:00Z' },
]

// Kullanıcı id -> isim eşlemesi
export const mockUserNames: Record<string, string> = {
  [MOCK_USER_ID]: 'Tahir',
  'mock-user-002': 'Ahmet',
  'mock-user-003': 'Mehmet',
  'mock-user-004': 'Zeynep',
}

export const mockRehearsals: Rehearsal[] = [
  {
    id: 'rehearsal-001',
    band_id: mockBand.id,
    title: 'Haftalık Prova',
    date: new Date().toISOString().split('T')[0],
    start_time: '19:00:00',
    end_time: '21:00:00',
    location: 'Studio A',
    notes: 'Yeni şarkılara odaklanalım',
    created_by: MOCK_USER_ID,
    created_at: '2026-03-01T00:00:00Z',
  },
  {
    id: 'rehearsal-002',
    band_id: mockBand.id,
    title: 'Konser Provası',
    date: (() => { const d = new Date(); d.setDate(d.getDate() + 5); return d.toISOString().split('T')[0] })(),
    start_time: '18:00:00',
    end_time: '22:00:00',
    location: 'Studio B - Büyük Salon',
    notes: 'Full set listesi çalışılacak. Ses kontrolü dahil.',
    created_by: MOCK_USER_ID,
    created_at: '2026-03-02T00:00:00Z',
  },
  {
    id: 'rehearsal-003',
    band_id: mockBand.id,
    title: 'Akustik Prova',
    date: (() => { const d = new Date(); d.setDate(d.getDate() - 3); return d.toISOString().split('T')[0] })(),
    start_time: '20:00:00',
    end_time: '22:00:00',
    location: 'Evde',
    notes: null,
    created_by: 'mock-user-002',
    created_at: '2026-02-28T00:00:00Z',
  },
]

export const mockRehearsalSongsMap: Record<string, SongWithVotes[]> = {
  'rehearsal-001': [mockRepertoireSongs[0], mockRepertoireSongs[1]],
  'rehearsal-002': [...mockRepertoireSongs],
  'rehearsal-003': [mockRepertoireSongs[2]],
}

export const mockDeficiencies: Record<string, { id: string; song_id: string; content: string; assigned_to: string; assigned_to_name: string; created_by: string; is_resolved: boolean }[]> = {
  'song-010': [
    { id: 'def-001', song_id: 'song-010', content: 'Solo kısmı daha yavaş çalınmalı', assigned_to: 'mock-user-002', assigned_to_name: 'Ahmet', created_by: MOCK_USER_ID, is_resolved: false },
    { id: 'def-002', song_id: 'song-010', content: 'Giriş riff temiz değil', assigned_to: MOCK_USER_ID, assigned_to_name: 'Tahir', created_by: 'mock-user-002', is_resolved: false },
  ],
  'song-011': [
    { id: 'def-003', song_id: 'song-011', content: 'Nakarat kısmında ton düşük', assigned_to: 'mock-user-003', assigned_to_name: 'Mehmet', created_by: MOCK_USER_ID, is_resolved: false },
    { id: 'def-004', song_id: 'song-011', content: 'Tempo değişiminde herkes aynı anda girmeli', assigned_to: 'group', assigned_to_name: 'Grup', created_by: 'mock-user-004', is_resolved: false },
  ],
}

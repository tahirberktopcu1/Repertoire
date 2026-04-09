-- ============================================
-- Repertoire App - Veritabanı Şeması
-- ÖNCE TABLOLAR, SONRA POLİCY'LER
-- ============================================

create extension if not exists "uuid-ossp";

-- ============================================
-- 1. TÜM TABLOLAR
-- ============================================

create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null,
  avatar_url text,
  created_at timestamptz default now() not null
);

create table public.bands (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  created_by uuid references public.profiles(id) not null,
  invite_code text unique default encode(gen_random_bytes(6), 'hex'),
  created_at timestamptz default now() not null
);

create table public.band_members (
  id uuid default uuid_generate_v4() primary key,
  band_id uuid references public.bands(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  joined_at timestamptz default now() not null,
  unique(band_id, user_id)
);

create table public.songs (
  id uuid default uuid_generate_v4() primary key,
  band_id uuid references public.bands(id) on delete cascade not null,
  title text not null,
  artist text not null,
  spotify_url text,
  youtube_url text,
  suggested_by uuid references public.profiles(id) not null,
  status text default 'suggested' check (status in ('suggested', 'approved')) not null,
  created_at timestamptz default now() not null,
  deleted_at timestamptz,
  practiced_at timestamptz
);

create table public.votes (
  id uuid default uuid_generate_v4() primary key,
  song_id uuid references public.songs(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  value int not null check (value >= 1 and value <= 10),
  audience_value int check (audience_value >= 1 and audience_value <= 10),
  created_at timestamptz default now() not null,
  unique(song_id, user_id)
);

create table public.repertoire_votes (
  id uuid default uuid_generate_v4() primary key,
  song_id uuid references public.songs(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  value int not null check (value >= 1 and value <= 10),
  audience_value int check (audience_value >= 1 and audience_value <= 10),
  created_at timestamptz default now() not null,
  unique(song_id, user_id)
);

create table public.deficiencies (
  id uuid default uuid_generate_v4() primary key,
  song_id uuid references public.songs(id) on delete cascade not null,
  content text not null,
  assigned_to uuid references public.profiles(id),
  created_by uuid references public.profiles(id) not null,
  is_resolved boolean default false not null,
  created_at timestamptz default now() not null
);

create table public.rehearsals (
  id uuid default uuid_generate_v4() primary key,
  band_id uuid references public.bands(id) on delete cascade not null,
  date date not null,
  start_time time not null,
  end_time time not null,
  location text,
  is_active boolean default true not null,
  created_by uuid references public.profiles(id) not null,
  created_at timestamptz default now() not null
);

create table public.rehearsal_songs (
  id uuid default uuid_generate_v4() primary key,
  rehearsal_id uuid references public.rehearsals(id) on delete cascade not null,
  song_id uuid references public.songs(id) on delete cascade not null,
  unique(rehearsal_id, song_id)
);

create table public.locations (
  id uuid default uuid_generate_v4() primary key,
  band_id uuid references public.bands(id) on delete cascade not null,
  name text not null,
  created_at timestamptz default now() not null
);

create table public.song_comments (
  id uuid default uuid_generate_v4() primary key,
  song_id uuid references public.songs(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now() not null
);

-- ============================================
-- 2. HELPER FUNCTION - RLS recursive sorgu çözümü
-- ============================================

create or replace function public.get_my_band_ids()
returns setof uuid
language sql
security definer
stable
as $$
  select band_id from public.band_members where user_id = auth.uid();
$$;

-- ============================================
-- 3. TRIGGER - Otomatik profil oluşturma
-- ============================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================
-- 3. RLS AKTİFLEŞTİR
-- ============================================

alter table public.profiles enable row level security;
alter table public.bands enable row level security;
alter table public.band_members enable row level security;
alter table public.songs enable row level security;
alter table public.votes enable row level security;
alter table public.repertoire_votes enable row level security;
alter table public.deficiencies enable row level security;
alter table public.rehearsals enable row level security;
alter table public.rehearsal_songs enable row level security;
alter table public.locations enable row level security;
alter table public.song_comments enable row level security;

-- ============================================
-- 4. TÜM POLİCY'LER
-- ============================================

-- PROFILES
create policy "profiles_select" on public.profiles for select using (true);
create policy "profiles_insert" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update" on public.profiles for update using (auth.uid() = id);

-- BANDS
create policy "bands_select" on public.bands for select using (true);
create policy "bands_insert" on public.bands for insert with check (auth.uid() = created_by);
create policy "bands_update" on public.bands for update
  using (id in (select public.get_my_band_ids()));
create policy "bands_delete" on public.bands for delete
  using (auth.uid() = created_by);

-- BAND MEMBERS
create policy "band_members_select" on public.band_members for select
  using (band_id in (select public.get_my_band_ids()));
create policy "band_members_insert" on public.band_members for insert
  with check (user_id = auth.uid());
create policy "band_members_delete" on public.band_members for delete
  using (user_id = auth.uid());

-- SONGS
create policy "songs_select" on public.songs for select
  using (band_id in (select public.get_my_band_ids()));
create policy "songs_insert" on public.songs for insert
  with check (band_id in (select public.get_my_band_ids()));
create policy "songs_update" on public.songs for update
  using (band_id in (select public.get_my_band_ids()));
create policy "songs_delete" on public.songs for delete
  using (band_id in (select public.get_my_band_ids()));

-- VOTES
create policy "votes_select" on public.votes for select
  using (song_id in (select s.id from public.songs s where s.band_id in (select public.get_my_band_ids())));
create policy "votes_insert" on public.votes for insert with check (auth.uid() = user_id);
create policy "votes_update" on public.votes for update using (user_id = auth.uid());
create policy "votes_delete" on public.votes for delete using (user_id = auth.uid());

-- REPERTOIRE VOTES
create policy "rep_votes_select" on public.repertoire_votes for select
  using (song_id in (select s.id from public.songs s where s.band_id in (select public.get_my_band_ids())));
create policy "rep_votes_insert" on public.repertoire_votes for insert with check (auth.uid() = user_id);
create policy "rep_votes_update" on public.repertoire_votes for update using (user_id = auth.uid());
create policy "rep_votes_delete" on public.repertoire_votes for delete using (user_id = auth.uid());

-- DEFICIENCIES
create policy "deficiencies_select" on public.deficiencies for select
  using (song_id in (select s.id from public.songs s where s.band_id in (select public.get_my_band_ids())));
create policy "deficiencies_insert" on public.deficiencies for insert
  with check (song_id in (select s.id from public.songs s where s.band_id in (select public.get_my_band_ids())));
create policy "deficiencies_update" on public.deficiencies for update
  using (song_id in (select s.id from public.songs s where s.band_id in (select public.get_my_band_ids())));
create policy "deficiencies_delete" on public.deficiencies for delete
  using (song_id in (select s.id from public.songs s where s.band_id in (select public.get_my_band_ids())));

-- REHEARSALS
create policy "rehearsals_select" on public.rehearsals for select
  using (band_id in (select public.get_my_band_ids()));
create policy "rehearsals_insert" on public.rehearsals for insert
  with check (band_id in (select public.get_my_band_ids()));
create policy "rehearsals_update" on public.rehearsals for update
  using (band_id in (select public.get_my_band_ids()));
create policy "rehearsals_delete" on public.rehearsals for delete
  using (band_id in (select public.get_my_band_ids()));

-- REHEARSAL SONGS
create policy "rehearsal_songs_select" on public.rehearsal_songs for select
  using (rehearsal_id in (select r.id from public.rehearsals r where r.band_id in (select public.get_my_band_ids())));
create policy "rehearsal_songs_insert" on public.rehearsal_songs for insert
  with check (rehearsal_id in (select r.id from public.rehearsals r where r.band_id in (select public.get_my_band_ids())));
create policy "rehearsal_songs_delete" on public.rehearsal_songs for delete
  using (rehearsal_id in (select r.id from public.rehearsals r where r.band_id in (select public.get_my_band_ids())));

-- LOCATIONS
create policy "locations_select" on public.locations for select
  using (band_id in (select public.get_my_band_ids()));
create policy "locations_insert" on public.locations for insert
  with check (band_id in (select public.get_my_band_ids()));
create policy "locations_delete" on public.locations for delete
  using (band_id in (select public.get_my_band_ids()));

-- SONG COMMENTS
create policy "song_comments_select" on public.song_comments for select
  using (song_id in (select s.id from public.songs s where s.band_id in (select public.get_my_band_ids())));
create policy "song_comments_insert" on public.song_comments for insert
  with check (auth.uid() = user_id);
create policy "song_comments_delete" on public.song_comments for delete
  using (user_id = auth.uid());

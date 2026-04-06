'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useBand } from '@/contexts/BandContext'
import { useRouter } from 'next/navigation'
import { Music, Plus, Link as LinkIcon } from 'lucide-react'

export default function CreateBandPage() {
  const [mode, setMode] = useState<'choose' | 'create' | 'join'>('choose')
  const [name, setName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()
  const { refreshBands } = useBand()
  const router = useRouter()
  const supabase = createClient()

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) { setError('Oturum bulunamadı, lütfen tekrar giriş yapın'); setLoading(false); return }

    const { data: band, error: bandError } = await supabase
      .from('bands')
      .insert({ name, created_by: currentUser.id })
      .select()
      .single()

    if (bandError) {
      setError('Grup oluşturma hatası: ' + bandError.message)
      setLoading(false)
      return
    }

    const { error: memberError } = await supabase.from('band_members').insert({
      band_id: band.id,
      user_id: currentUser.id,
    })

    if (memberError) {
      setError('Üyelik hatası: ' + memberError.message)
      setLoading(false)
      return
    }

    await refreshBands()
    router.push('/dashboard')
    router.refresh()
  }

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    let currentUser = null
    try {
      const { data: { session } } = await supabase.auth.getSession()
      currentUser = session?.user
      if (!currentUser) {
        const { data: { user: u } } = await supabase.auth.getUser()
        currentUser = u
      }
    } catch {}
    if (!currentUser) { setError('Oturum bulunamadı, lütfen tekrar giriş yapın'); setLoading(false); return }

    const { data: band } = await supabase
      .from('bands')
      .select('*')
      .eq('invite_code', inviteCode.trim())
      .single()

    if (!band) {
      setError('Geçersiz davet kodu')
      setLoading(false)
      return
    }

    const { data: existing } = await supabase
      .from('band_members')
      .select('id')
      .eq('band_id', band.id)
      .eq('user_id', currentUser.id)
      .maybeSingle()

    if (existing) {
      setError('Bu gruba zaten üyesiniz')
      setLoading(false)
      return
    }

    await supabase.from('band_members').insert({
      band_id: band.id,
      user_id: currentUser.id,
    })

    await refreshBands()
    router.push('/dashboard')
    router.refresh()
  }

  if (mode === 'choose') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-600 mb-4">
              <Music className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Hoş Geldiniz!</h1>
            <p className="text-gray-400 mt-2">Bir gruba katılın veya yeni grup oluşturun</p>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => setMode('create')}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-2xl p-6 flex items-center gap-4 transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center">
                <Plus className="w-6 h-6" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-lg">Yeni Grup Oluştur</p>
                <p className="text-purple-200 text-sm">Kendi grubunuzu kurun ve üyelerinizi davet edin</p>
              </div>
            </button>

            <button
              onClick={() => setMode('join')}
              className="w-full bg-gray-800/50 hover:bg-gray-800 text-white rounded-2xl p-6 flex items-center gap-4 transition-colors border border-gray-700"
            >
              <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center">
                <LinkIcon className="w-6 h-6" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-lg">Gruba Katıl</p>
                <p className="text-gray-400 text-sm">Davet kodu ile mevcut bir gruba katılın</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700">
          <button
            onClick={() => setMode('choose')}
            className="text-gray-400 hover:text-white text-sm mb-4"
          >
            &larr; Geri
          </button>

          <h2 className="text-xl font-semibold text-white mb-6">
            {mode === 'create' ? 'Yeni Grup Oluştur' : 'Gruba Katıl'}
          </h2>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 mb-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {mode === 'create' ? (
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Grup Adı</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="örneğin: Rock Rebellion"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
              >
                {loading ? 'Oluşturuluyor...' : 'Grup Oluştur'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleJoin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Davet Kodu</label>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-center tracking-widest"
                  placeholder="abc123def456"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
              >
                {loading ? 'Katılınıyor...' : 'Gruba Katıl'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

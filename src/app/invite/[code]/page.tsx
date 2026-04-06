'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useBand } from '@/contexts/BandContext'
import { useRouter, useParams } from 'next/navigation'
import { Music, Loader2, CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'

export default function InvitePage() {
  const params = useParams()
  const code = params.code as string
  const { user, loading: authLoading } = useAuth()
  const { refreshBands } = useBand()
  const router = useRouter()
  const supabase = createClient()
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'auth_required'>('loading')
  const [bandName, setBandName] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      setStatus('auth_required')
      return
    }

    joinBand()
  }, [user, authLoading])

  const joinBand = async () => {
    // Find band
    const { data: band } = await supabase
      .from('bands')
      .select('*')
      .eq('invite_code', code)
      .single()

    if (!band) {
      setStatus('error')
      setErrorMsg('Geçersiz davet linki')
      return
    }

    setBandName(band.name)

    // Check if already member
    const { data: existing } = await supabase
      .from('band_members')
      .select('id')
      .eq('band_id', band.id)
      .eq('user_id', user!.id)
      .single()

    if (existing) {
      setStatus('success')
      await refreshBands()
      return
    }

    // Join
    const { error } = await supabase.from('band_members').insert({
      band_id: band.id,
      user_id: user!.id,
      role: 'member',
    })

    if (error) {
      setStatus('error')
      setErrorMsg(error.message)
    } else {
      setStatus('success')
      await refreshBands()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-600 mb-6">
          <Music className="w-8 h-8 text-white" />
        </div>

        {status === 'loading' && (
          <>
            <Loader2 className="w-8 h-8 text-purple-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Gruba katılınıyor...</p>
          </>
        )}

        {status === 'auth_required' && (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-4">Gruba Katılmak İçin Giriş Yapın</h2>
            <p className="text-gray-400 mb-6">Davet linkini kullanmak için önce giriş yapmanız gerekiyor.</p>
            <div className="space-y-3">
              <Link
                href={`/auth/login?next=/invite/${code}`}
                className="block w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
              >
                Giriş Yap
              </Link>
              <Link
                href={`/auth/register?next=/invite/${code}`}
                className="block w-full py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
              >
                Kayıt Ol
              </Link>
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Başarılı!</h2>
            <p className="text-gray-400 mb-6">{bandName} grubuna katıldınız.</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
            >
              Devam Et
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Hata</h2>
            <p className="text-gray-400 mb-6">{errorMsg}</p>
            <Link
              href="/dashboard"
              className="block w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
            >
              Ana Sayfaya Dön
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

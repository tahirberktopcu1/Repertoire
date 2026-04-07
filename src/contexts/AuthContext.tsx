'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { createClient } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/lib/types'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  signingOut: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signingOut: false,
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    let mounted = true

    const setUserAndProfile = async (u: User | null) => {
      if (!mounted) return
      setUser(u)
      if (u) {
        const { data } = await supabase.from('profiles').select('*').eq('id', u.id).single()
        if (mounted) setProfile(data)
      } else {
        setProfile(null)
      }
      if (mounted) setLoading(false)
    }

    // 1. getUser ile dene (en güvenilir, server'a sorar)
    supabase.auth.getUser().then(({ data }: any) => {
      if (data?.user && mounted) setUserAndProfile(data.user)
    }).catch(() => {})

    // 2. onAuthStateChange dinle
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event: any, session: any) => {
        if (!mounted) return
        await setUserAndProfile(session?.user ?? null)
      }
    )

    // 3. Fallback: 3 saniye içinde hiçbir şey olmazsa loading kapat
    const timeout = setTimeout(() => {
      if (mounted && loading) setLoading(false)
    }, 3000)

    return () => {
      mounted = false
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [])

  const signOut = async () => {
    setSigningOut(true)
    // Önce cookie'leri temizle
    document.cookie.split(';').forEach((c) => {
      const name = c.trim().split('=')[0]
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`
    })
    // localStorage temizle
    Object.keys(localStorage).forEach((key) => {
      if (key.includes('supabase') || key.includes('sb-')) localStorage.removeItem(key)
    })
    // Supabase signOut dene (asılı kalırsa sorun değil)
    try {
      const supabase = createClient()
      await Promise.race([
        supabase.auth.signOut(),
        new Promise((_, reject) => setTimeout(() => reject('timeout'), 3000))
      ])
    } catch {}
    setUser(null)
    setProfile(null)
    window.location.href = '/auth/login'
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signingOut, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { createClient } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/lib/types'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    let mounted = true

    // onAuthStateChange TEK kaynak olarak kullan
    // Bu hem ilk yükleme (INITIAL_SESSION) hem sonraki değişiklikleri yakalar
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: any, session: any) => {
        if (!mounted) return

        const currentUser = session?.user ?? null
        setUser(currentUser)

        if (currentUser) {
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentUser.id)
            .single()
          if (mounted) setProfile(data)
          // User bulundu — loading'i kapat
          if (mounted) setLoading(false)
        } else if (event !== 'INITIAL_SESSION') {
          // SIGNED_OUT gibi event'lerde loading'i kapat
          setProfile(null)
          if (mounted) setLoading(false)
        }
        // INITIAL_SESSION + user null → loading true kalsın, SIGNED_IN gelebilir
        // Fallback timeout ile yakalanacak
      }
    )

    // Fallback: 5 saniye içinde hiç event gelmezse loading'i kapat
    const timeout = setTimeout(() => {
      if (mounted && loading) {
        setLoading(false)
      }
    }, 2000)

    return () => {
      mounted = false
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [])

  const signOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    window.location.href = '/auth/login'
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

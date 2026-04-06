'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useBand } from '@/contexts/BandContext'
import Navigation from './Navigation'
import { Loader2 } from 'lucide-react'
import { useEffect } from 'react'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const { loading: bandLoading } = useBand()

  const isLoading = authLoading || (!!user && bandLoading)

  useEffect(() => {
    if (isLoading) return
    if (!user) {
      window.location.replace('/auth/login')
    }
  }, [isLoading, user])

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[var(--accent)] animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Navigation />
      <main className="pt-14 pb-20 max-w-lg mx-auto px-4">
        {children}
      </main>
    </div>
  )
}

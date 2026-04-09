'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Music, ListMusic, Home, Settings, ChevronDown, AlertCircle } from 'lucide-react'
import { useBand } from '@/contexts/BandContext'
import { useSongs } from '@/contexts/SongsContext'
import { useAuth } from '@/contexts/AuthContext'
import { useState } from 'react'

const navItems = [
  { href: '/dashboard', label: 'Ana Sayfa', icon: Home },
  { href: '/songs', label: 'Havuz', icon: Music },
  { href: '/repertoire', label: 'Repertuvar', icon: ListMusic },
  { href: '/deficiencies', label: 'Eksikler', icon: AlertCircle },
  { href: '/settings', label: 'Ayarlar', icon: Settings },
]

export default function Navigation() {
  const pathname = usePathname()
  const { bands, currentBand, setCurrentBand } = useBand()
  const { user } = useAuth()
  const { songs, votes, allDeficiencies } = useSongs()
  const [showBandMenu, setShowBandMenu] = useState(false)

  // Kullanıcının henüz oy vermediği şarkı sayısı
  const unratedCount = user ? songs.filter((s) => !votes.some((v) => v.song_id === s.id && v.user_id === user.id && v.value > 0)).length : 0

  // Benim + grup eksikleri sayısı
  const myDefCount = user ? allDeficiencies.filter((d) => d.assigned_to === user.id || d.assigned_to === null).length : 0

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-[var(--bg-secondary)] border-b border-[var(--border)]">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent)] flex items-center justify-center">
              <Music className="w-4 h-4 text-white" />
            </div>
            <span className="text-[var(--text-primary)] font-semibold text-lg">Repertoire</span>
          </div>

          {currentBand && bands.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowBandMenu(!showBandMenu)}
                className="flex items-center gap-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors bg-[var(--bg-card)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-sm"
              >
                {currentBand.name}
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {showBandMenu && (
                <>
                  <div className="fixed inset-0" onClick={() => setShowBandMenu(false)} />
                  <div className="absolute right-0 mt-2 w-48 bg-[var(--bg-card)] rounded-lg border border-[var(--border)] shadow-xl overflow-hidden">
                    {bands.map((band) => (
                      <button
                        key={band.id}
                        onClick={() => {
                          setCurrentBand(band)
                          setShowBandMenu(false)
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                          band.id === currentBand.id
                            ? 'bg-[var(--accent-subtle)] text-[var(--accent)]'
                            : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
                        }`}
                      >
                        {band.name}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </header>

      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--bg-secondary)] border-t border-[var(--border)] safe-bottom">
        <div className="max-w-lg mx-auto flex justify-around">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center py-2.5 px-3 min-w-0 transition-colors relative ${
                  isActive ? 'text-[var(--accent)]' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                }`}
              >
                <div className="relative">
                  <Icon className="w-5 h-5" />
                  {item.href === '/songs' && unratedCount > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 bg-red-500 text-white text-[9px] font-bold min-w-[16px] h-4 rounded-full flex items-center justify-center px-1">
                      {unratedCount}
                    </span>
                  )}
                  {item.href === '/deficiencies' && myDefCount > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 bg-red-500 text-white text-[9px] font-bold min-w-[16px] h-4 rounded-full flex items-center justify-center px-1">
                      {myDefCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] mt-1 truncate">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}

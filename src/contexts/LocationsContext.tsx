'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { createClient } from '@/lib/supabase'
import { useBand } from './BandContext'

interface LocationsContextType {
  locations: string[]
  addLocation: (name: string) => void
  removeLocation: (name: string) => void
}

const LocationsContext = createContext<LocationsContextType>({
  locations: [],
  addLocation: () => {},
  removeLocation: () => {},
})

export function LocationsProvider({ children }: { children: ReactNode }) {
  const { currentBand } = useBand()
  const [locations, setLocations] = useState<string[]>([])
  const supabase = createClient()

  const loadLocations = async () => {
    if (!currentBand) return
    const { data } = await supabase
      .from('locations')
      .select('name')
      .eq('band_id', currentBand.id)
    if (data) setLocations(data.map((d: any) => d.name))
  }

  useEffect(() => {
    if (!currentBand) return
    loadLocations()

    // Realtime: konum değişiklikleri anlık
    const channel = supabase
      .channel(`locations-${currentBand.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'locations' }, () => {
        loadLocations()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [currentBand?.id])

  const addLocation = async (name: string) => {
    if (!name.trim() || !currentBand || locations.includes(name.trim())) return
    await supabase.from('locations').insert({ band_id: currentBand.id, name: name.trim() })
    setLocations([...locations, name.trim()])
  }

  const removeLocation = async (name: string) => {
    if (!currentBand) return
    await supabase.from('locations').delete().eq('band_id', currentBand.id).eq('name', name)
    setLocations(locations.filter((l) => l !== name))
  }

  return (
    <LocationsContext.Provider value={{ locations, addLocation, removeLocation }}>
      {children}
    </LocationsContext.Provider>
  )
}

export const useLocations = () => useContext(LocationsContext)

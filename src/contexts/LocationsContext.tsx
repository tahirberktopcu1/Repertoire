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

  useEffect(() => {
    if (!currentBand) return
    const load = async () => {
      const { data } = await supabase
        .from('locations')
        .select('name')
        .eq('band_id', currentBand.id)
      if (data) setLocations(data.map((d: any) => d.name))
    }
    load()
  }, [currentBand])

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

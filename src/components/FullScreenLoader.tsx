'use client'

import { Loader2 } from 'lucide-react'

interface FullScreenLoaderProps {
  message?: string
}

export default function FullScreenLoader({ message = 'Yükleniyor...' }: FullScreenLoaderProps) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-10 h-10 text-white animate-spin" />
        <p className="text-white text-lg font-medium">{message}</p>
      </div>
    </div>
  )
}

'use client'

import { AlertTriangle } from 'lucide-react'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
  variant?: 'danger' | 'warning'
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Evet',
  cancelLabel = 'Hayır',
  onConfirm,
  onCancel,
  variant = 'danger',
}: ConfirmDialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60" onClick={onCancel} />
      <div className="relative z-10 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-5 w-full max-w-sm shadow-xl">
        <div className="flex items-start gap-3 mb-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
            variant === 'danger' ? 'bg-[#f8514922]' : 'bg-[#d2992222]'
          }`}>
            <AlertTriangle className={`w-5 h-5 ${
              variant === 'danger' ? 'text-[var(--danger)]' : 'text-[var(--warning)]'
            }`} />
          </div>
          <div>
            <h3 className="text-[var(--text-primary)] font-semibold text-sm">{title}</h3>
            <p className="text-[var(--text-muted)] text-xs mt-1">{message}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 bg-[var(--bg-secondary)] hover:bg-[var(--border)] text-[var(--text-primary)] rounded-lg text-sm font-medium transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-90 ${
              variant === 'danger'
                ? 'bg-[var(--danger)] text-white'
                : 'bg-[var(--warning)] text-white'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

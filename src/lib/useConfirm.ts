import { useState, useCallback } from 'react'

interface ConfirmState {
  open: boolean
  title: string
  message: string
  variant: 'danger' | 'warning'
  onConfirm: () => void
}

export function useConfirm() {
  const [state, setState] = useState<ConfirmState>({
    open: false,
    title: '',
    message: '',
    variant: 'danger',
    onConfirm: () => {},
  })

  const confirm = useCallback((opts: {
    title: string
    message: string
    variant?: 'danger' | 'warning'
    onConfirm: () => void
  }) => {
    setState({
      open: true,
      title: opts.title,
      message: opts.message,
      variant: opts.variant || 'danger',
      onConfirm: opts.onConfirm,
    })
  }, [])

  const close = useCallback(() => {
    setState((s) => ({ ...s, open: false }))
  }, [])

  const handleConfirm = useCallback(() => {
    state.onConfirm()
    close()
  }, [state, close])

  return { ...state, confirm, close, handleConfirm }
}

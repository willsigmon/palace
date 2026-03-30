'use client'

import { create } from 'zustand'
import { useEffect, useState } from 'react'

interface Toast {
  readonly id: string
  readonly message: string
  readonly type: 'success' | 'info' | 'error'
  readonly duration: number
}

interface ToastState {
  readonly toasts: readonly Toast[]
  readonly addToast: (message: string, type?: Toast['type'], duration?: number) => void
  readonly removeToast: (id: string) => void
}

export const useToast = create<ToastState>((set) => ({
  toasts: [],
  addToast: (message, type = 'success', duration = 3000) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    set((state) => ({
      toasts: [...state.toasts.slice(-2), { id, message, type, duration }],
    }))
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}))

const TYPE_STYLES = {
  success: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-400',
  info: 'border-accent/30 bg-accent/10 text-accent',
  error: 'border-red-400/30 bg-red-400/10 text-red-400',
} as const

function ToastItem({ toast }: { toast: Toast }) {
  const [visible, setVisible] = useState(false)
  const { removeToast } = useToast()

  useEffect(() => {
    // Enter animation
    requestAnimationFrame(() => setVisible(true))
    // Auto-dismiss
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(() => removeToast(toast.id), 200)
    }, toast.duration)
    return () => clearTimeout(timer)
  }, [toast.id, toast.duration, removeToast])

  return (
    <div
      className={`
        rounded-lg border px-4 py-2.5 text-[13px] font-medium shadow-elevated
        backdrop-blur-sm transition-all duration-200
        ${TYPE_STYLES[toast.type]}
        ${visible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}
      `}
    >
      {toast.message}
    </div>
  )
}

export function ToastContainer() {
  const { toasts } = useToast()

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-24 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center gap-2 md:bottom-8">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  )
}

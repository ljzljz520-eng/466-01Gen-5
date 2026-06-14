import { create } from 'zustand'
import type { Toast, ToastType } from '@/types'

function genId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

interface ToastState {
  toasts: Toast[]
  show: (type: ToastType, message: string, duration?: number) => void
  remove: (id: string) => void
  success: (message: string, duration?: number) => void
  error: (message: string, duration?: number) => void
  warning: (message: string, duration?: number) => void
  info: (message: string, duration?: number) => void
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],

  show: (type, message, duration = 3000) => {
    const id = genId()
    set((s) => ({ toasts: [...s.toasts, { id, type, message, duration }] }))
    if (duration > 0) {
      setTimeout(() => get().remove(id), duration)
    }
  },

  remove: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  success: (msg, dur) => get().show('success', msg, dur),
  error: (msg, dur) => get().show('error', msg, dur),
  warning: (msg, dur) => get().show('warning', msg, dur),
  info: (msg, dur) => get().show('info', msg, dur),
}))

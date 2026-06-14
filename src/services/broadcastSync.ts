export type SyncActionType =
  | 'data:updated'
  | 'user:login'
  | 'user:logout'
  | 'data:reset'
  | 'toast:show'

export interface SyncMessage {
  action: SyncActionType
  payload?: unknown
  source: string
  timestamp: number
}

const CHANNEL_NAME = 'pharmacy_sync_channel'
const SOURCE_ID = Math.random().toString(36).slice(2, 10)

type Listener = (msg: SyncMessage) => void

class BroadcastSyncService {
  private channel: BroadcastChannel | null = null
  private listeners = new Set<Listener>()

  connect() {
    if (typeof BroadcastChannel === 'undefined') return
    if (this.channel) return
    try {
      this.channel = new BroadcastChannel(CHANNEL_NAME)
      this.channel.onmessage = (e: MessageEvent<SyncMessage>) => {
        const msg = e.data
        if (!msg || msg.source === SOURCE_ID) return
        this.listeners.forEach((fn) => {
          try { fn(msg) } catch { /* ignore */ }
        })
      }
    } catch {
      this.channel = null
    }
  }

  disconnect() {
    if (this.channel) {
      try { this.channel.close() } catch { /* ignore */ }
      this.channel = null
    }
    this.listeners.clear()
  }

  broadcast(action: SyncActionType, payload?: unknown) {
    if (!this.channel) return
    const msg: SyncMessage = {
      action,
      payload,
      source: SOURCE_ID,
      timestamp: Date.now(),
    }
    try { this.channel.postMessage(msg) } catch { /* ignore */ }
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }
}

export const broadcastSync = new BroadcastSyncService()

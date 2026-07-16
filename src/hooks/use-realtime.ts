import { useEffect, useRef } from 'react'
import type { RecordModel, RecordSubscription } from 'pocketbase'

import pb from '@/lib/pocketbase/client'

let connectPromise: Promise<void> | null = null

function ensureRealtimeConnection(): Promise<void> {
  if (connectPromise) return connectPromise

  connectPromise = (async () => {
    try {
      if (typeof pb.realtime?.connect === 'function') {
        await pb.realtime.connect()
      }
    } finally {
      connectPromise = null
    }
  })()

  return connectPromise
}

export function useRealtime<TRecord extends RecordModel = RecordModel>(
  collectionName: string,
  callback: (data: RecordSubscription<TRecord>) => void,
  enabled: boolean = true,
) {
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useEffect(() => {
    if (!enabled) return

    let unsubscribeFn: (() => Promise<void>) | undefined
    let cancelled = false
    let retryTimeout: ReturnType<typeof setTimeout> | undefined

    const subscribeWithRetry = async (attempt: number = 0) => {
      if (cancelled) return

      try {
        await ensureRealtimeConnection()
        if (cancelled) return

        const fn = await pb.collection<TRecord>(collectionName).subscribe('*', (e) => {
          callbackRef.current(e)
        })

        if (cancelled) {
          fn().catch(() => {})
        } else {
          unsubscribeFn = fn
        }
      } catch {
        if (cancelled) return
        if (attempt >= 4) return
        const delay = Math.min(1000 * Math.pow(2, attempt), 8000)
        retryTimeout = setTimeout(() => subscribeWithRetry(attempt + 1), delay)
      }
    }

    subscribeWithRetry()

    return () => {
      cancelled = true
      if (retryTimeout) clearTimeout(retryTimeout)
      if (unsubscribeFn) {
        unsubscribeFn().catch(() => {})
      }
    }
  }, [collectionName, enabled])
}

export default useRealtime

import { useEffect, useRef } from 'react'
import type { RecordModel, RecordSubscription } from 'pocketbase'

import pb from '@/lib/pocketbase/client'

const MAX_RETRIES = 5
const BASE_DELAY = 1000

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

function isRealtimeReady(): boolean {
  try {
    return (
      pb.authStore.isValid &&
      typeof pb.realtime !== 'undefined' &&
      typeof pb.realtime.isConnected === 'function' &&
      pb.realtime.isConnected()
    )
  } catch {
    return false
  }
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
    if (!pb.authStore.isValid) return

    let unsubscribeFn: (() => Promise<void>) | undefined
    let cancelled = false
    let retryTimer: ReturnType<typeof setTimeout> | undefined
    let retryCount = 0

    const attemptSubscribe = async () => {
      if (cancelled) return

      if (!isRealtimeReady()) {
        if (retryCount < MAX_RETRIES) {
          retryCount++
          const delay = Math.min(BASE_DELAY * retryCount, 5000)
          retryTimer = setTimeout(() => {
            attemptSubscribe()
          }, delay)
          return
        }
        return
      }

      try {
        const fn = await pb.collection<TRecord>(collectionName).subscribe('*', (e) => {
          callbackRef.current(e)
        })
        if (cancelled) {
          fn().catch(() => {})
        } else {
          unsubscribeFn = fn
        }
      } catch {
        if (!cancelled && retryCount < MAX_RETRIES) {
          retryCount++
          const delay = Math.min(BASE_DELAY * retryCount, 5000)
          retryTimer = setTimeout(() => {
            attemptSubscribe()
          }, delay)
        }
      }
    }

    if (isRealtimeReady()) {
      attemptSubscribe()
    } else {
      pb.collection<TRecord>(collectionName)
        .subscribe('*', (e) => {
          callbackRef.current(e)
        })
        .then((fn) => {
          if (cancelled) {
            fn().catch(() => {})
          } else {
            unsubscribeFn = fn
          }
        })
        .catch(() => {
          if (!cancelled) {
            attemptSubscribe()
          }
        })
    }

    return () => {
      cancelled = true
      if (retryTimer) clearTimeout(retryTimer)
      if (unsubscribeFn) {
        unsubscribeFn().catch(() => {})
      }
    }
  }, [collectionName, enabled])
}

export default useRealtime

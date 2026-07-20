import { useEffect, useRef } from 'react'
import type { RecordModel, RecordSubscription } from 'pocketbase'

import pb from '@/lib/pocketbase/client'

/**
 * Hook for real-time subscriptions to a PocketBase collection.
 * ALWAYS use this hook instead of subscribing inline.
 * Uses the per-listener UnsubscribeFunc so multiple components
 * can safely subscribe to the same collection without conflicts.
 *
 * Includes defensive checks to prevent "Invalid realtime client" errors:
 * - Validates auth store before subscribing
 * - Wraps subscribe in try/catch for transient failures
 * - Guards unsubscribe against expired/invalid clientId
 */
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

    const subscribe = async () => {
      try {
        const fn = await pb.collection<TRecord>(collectionName).subscribe('*', (e) => {
          if (!cancelled) {
            callbackRef.current(e)
          }
        })
        if (cancelled) {
          try {
            await fn()
          } catch {
            // ignore — already cancelled
          }
        } else {
          unsubscribeFn = fn
        }
      } catch {
        // Transient connection failure — silently skip
        // The next remount or auth change will retry
      }
    }

    subscribe()

    return () => {
      cancelled = true
      if (unsubscribeFn) {
        try {
          unsubscribeFn().catch(() => {
            // Suppress "Invalid realtime client" or any
            // expired-clientId errors during cleanup
          })
        } catch {
          // Synchronous throw during unsubscribe — swallow
        }
        unsubscribeFn = undefined
      }
    }
  }, [collectionName, enabled])
}

export default useRealtime

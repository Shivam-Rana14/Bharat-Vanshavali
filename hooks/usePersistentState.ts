import { useEffect, useState } from 'react'

/**
 * Persist React state to localStorage under the given key.
 * Works in SSR-safe way (no window during server render).
 */
export function usePersistentState<T>(key: string, initial: T) {
  const [state, setState] = useState<T>(initial)

  // Load persisted value after mount to avoid hydration mismatch
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(key)
      if (stored) {
        setState(JSON.parse(stored) as T)
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Debounced save – waits 500 ms after last change
  useEffect(() => {
    const handler = setTimeout(() => {
      try {
        window.localStorage.setItem(key, JSON.stringify(state))
      } catch {
        /* ignore quota errors */
      }
    }, 500)
    return () => clearTimeout(handler)
  }, [key, state])

  const clear = () => {
    try {
      window.localStorage.removeItem(key)
    } catch {}
  }

  return [state, setState, clear] as const
}

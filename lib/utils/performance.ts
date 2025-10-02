// Performance monitoring utilities

export const measurePerformance = {
  // Measure API response time
  async measureApiCall<T>(
    apiCall: () => Promise<T>,
    endpoint: string
  ): Promise<{ data: T; duration: number }> {
    const start = performance.now()
    
    try {
      const data = await apiCall()
      const duration = performance.now() - start
      
      // Log slow API calls in development
      if (process.env.NODE_ENV === 'development' && duration > 1000) {
        console.warn(`Slow API call detected: ${endpoint} took ${duration.toFixed(2)}ms`)
      }
      
      return { data, duration }
    } catch (error) {
      const duration = performance.now() - start
      console.error(`API call failed: ${endpoint} took ${duration.toFixed(2)}ms`, error)
      throw error
    }
  },

  // Measure component render time
  measureRender: (componentName: string) => {
    if (typeof window === 'undefined') return

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach((entry) => {
        if (entry.name.includes(componentName)) {
          console.log(`${componentName} render time: ${entry.duration.toFixed(2)}ms`)
        }
      })
    })

    observer.observe({ entryTypes: ['measure'] })
    return observer
  },

  // Web Vitals reporting
  reportWebVitals: (metric: any) => {
    if (process.env.NODE_ENV === 'production') {
      // Send to analytics service
      if (typeof window !== 'undefined' && 'gtag' in window) {
        ;(window as any).gtag('event', metric.name, {
          event_category: 'Web Vitals',
          value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
          event_label: metric.id,
          non_interaction: true,
        })
      }
    } else {
      console.log('Web Vital:', metric)
    }
  }
}

// Image optimization utility
export const optimizeImage = (
  src: string, 
  width?: number, 
  height?: number, 
  quality: number = 75
): string => {
  // For cloud storage images, add optimization parameters if supported
  try {
    const url = new URL(src)
    if (width) url.searchParams.set('width', width.toString())
    if (height) url.searchParams.set('height', height.toString())
    url.searchParams.set('quality', quality.toString())
    url.searchParams.set('format', 'webp')
    return url.toString()
  } catch {
    // For Next.js images, let the built-in optimizer handle it
    return src
  }
}

// Lazy loading utility
export const createIntersectionObserver = (
  callback: (entries: IntersectionObserverEntry[]) => void,
  options: IntersectionObserverInit = {}
): IntersectionObserver | null => {
  if (typeof window === 'undefined') return null

  const defaultOptions: IntersectionObserverInit = {
    root: null,
    rootMargin: '50px',
    threshold: 0.1,
    ...options
  }

  return new IntersectionObserver(callback, defaultOptions)
}

// Memory management
export const cleanupMemory = {
  // Cleanup event listeners
  removeEventListeners: (element: Element, events: string[]) => {
    events.forEach(event => {
      element.removeEventListener(event, () => {})
    })
  },

  // Cleanup intervals/timeouts
  cleanupTimers: (timers: (NodeJS.Timeout | number)[]) => {
    timers.forEach(timer => {
      if (typeof timer === 'number') {
        clearTimeout(timer)
        clearInterval(timer)
      }
    })
  },

  // Cleanup refs - Note: ref.current is read-only, so we just clear references
  cleanupRefs: (refs: React.RefObject<any>[]) => {
    // Clear the refs array itself
    refs.length = 0
  }
}
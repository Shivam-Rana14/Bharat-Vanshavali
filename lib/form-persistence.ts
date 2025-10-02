// Form persistence utilities for better UX
export interface FormState {
  [key: string]: any
}

export class FormPersistence {
  private storageKey: string
  
  constructor(formName: string) {
    this.storageKey = `form_${formName}_data`
  }
  
  // Save form data to localStorage
  saveFormData(data: FormState): void {
    try {
      if (typeof window !== 'undefined') {
        // Don't save sensitive data like passwords
        const sanitizedData = { ...data }
        delete sanitizedData.password
        delete sanitizedData.confirmPassword
        
        localStorage.setItem(this.storageKey, JSON.stringify(sanitizedData))
      }
    } catch (error) {
      console.warn('Failed to save form data:', error)
    }
  }
  
  // Load form data from localStorage
  loadFormData(): FormState | null {
    try {
      if (typeof window !== 'undefined') {
        const savedData = localStorage.getItem(this.storageKey)
        return savedData ? JSON.parse(savedData) : null
      }
    } catch (error) {
      console.warn('Failed to load form data:', error)
    }
    return null
  }
  
  // Clear saved form data
  clearFormData(): void {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(this.storageKey)
      }
    } catch (error) {
      console.warn('Failed to clear form data:', error)
    }
  }
  
  // Auto-save form data with debouncing
  autoSave(data: FormState, delay: number = 1000): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout)
    }
    
    this.saveTimeout = setTimeout(() => {
      this.saveFormData(data)
    }, delay)
  }
  
  private saveTimeout: NodeJS.Timeout | null = null
}

// Hook for form persistence
export const useFormPersistence = (formName: string) => {
  const persistence = new FormPersistence(formName)
  
  return {
    saveForm: (data: FormState) => persistence.saveFormData(data),
    loadForm: () => persistence.loadFormData(),
    clearForm: () => persistence.clearFormData(),
    autoSave: (data: FormState, delay?: number) => persistence.autoSave(data, delay)
  }
}

// Network status utility
export const useNetworkStatus = () => {
  if (typeof window === 'undefined') {
    return { isOnline: true, wasOffline: false }
  }
  
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [wasOffline, setWasOffline] = useState(false)
  
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      if (wasOffline) {
        // Show reconnection message
        console.log('Connection restored')
      }
    }
    
    const handleOffline = () => {
      setIsOnline(false)
      setWasOffline(true)
    }
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [wasOffline])
  
  return { isOnline, wasOffline }
}

import { useState, useEffect } from 'react'

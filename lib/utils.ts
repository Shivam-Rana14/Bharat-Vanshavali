import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Generate unique family code
export async function generateFamilyCode(): Promise<string> {
  const { User } = await import('./mongodb/models')
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  let attempts = 0
  const maxAttempts = 10
  
  do {
    result = 'BV'
    for (let i = 0; i < 6; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length))
    }
    attempts++
    
    // Check if this code already exists
    const existingUser = await User.findOne({ familyCode: result })
    if (!existingUser) {
      break
    }
    
    if (attempts >= maxAttempts) {
      // If we can't find a unique code after max attempts, make it longer
      result = 'BV' + Date.now().toString().slice(-8) + Math.random().toString(36).substring(2, 4).toUpperCase()
      break
    }
  } while (attempts < maxAttempts)
  
  return result
}

// Generate unique login ID
export async function generateLoginId(): Promise<string> {
  const { User } = await import('./mongodb/models')
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  let attempts = 0
  const maxAttempts = 10
  
  do {
    result = 'BV'
    for (let i = 0; i < 6; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length))
    }
    attempts++
    
    // Check if this loginId already exists
    const existingUser = await User.findOne({ loginId: result })
    if (!existingUser) {
      break
    }
    
    if (attempts >= maxAttempts) {
      // If we can't find a unique loginId after max attempts, make it longer
      result = 'BV' + Date.now().toString().slice(-8) + Math.random().toString(36).substring(2, 4).toUpperCase()
      break
    }
  } while (attempts < maxAttempts)
  
  return result
}

// Format date utility
export function formatDate(date: Date | string): string {
  if (!date) return ''
  
  const d = new Date(date)
  return d.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Validate file type
export function isValidFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.includes(file.type)
}

// Format file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Generate random string
export function generateRandomString(length: number): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  
  return result
}

// Validate email
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Validate phone number (Indian format)
export function isValidPhoneNumber(phone: string): boolean {
  const phoneRegex = /^[6-9]\d{9}$/
  return phoneRegex.test(phone.replace(/\s+/g, ''))
}

// Sanitize filename
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .toLowerCase()
}
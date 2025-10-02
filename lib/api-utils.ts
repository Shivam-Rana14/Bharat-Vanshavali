import { NextRequest } from 'next/server'
import { authService } from '@/lib/auth'

export interface AuthenticatedUser {
  id: string
  type: 'admin' | 'citizen'
  familyCode?: string
}

// Helper: extract user from JWT cookie
export function getUserFromCookie(request: NextRequest): AuthenticatedUser | null {
  const token = request.cookies.get('auth-token')?.value
  if (!token) return null
  try {
    const payload = authService.verifyToken(token)
    return { 
      id: payload.id, 
      type: payload.type,
      familyCode: payload.familyCode 
    }
  } catch {
    return null
  }
}

// Modify getUserFromHeaders to include cookie fallback (renamed to getAuthenticatedUser)
export function getAuthenticatedUser(request: NextRequest): AuthenticatedUser | null {
  // 1. Try cookie
  const byCookie = getUserFromCookie(request)
  if (byCookie) return byCookie

  // 2. Fallback to custom headers (legacy)
  const userId = request.headers.get('x-user-id')
  const userType = request.headers.get('x-user-type')
  const familyCode = request.headers.get('x-family-code')
  if (!userId) return null
  return {
    id: userId,
    type: userType as 'admin' | 'citizen',
    familyCode: familyCode || undefined
  }
}

// Update requireAuth to use getAuthenticatedUser
export function requireAuth(request: NextRequest): AuthenticatedUser {
  const user = getAuthenticatedUser(request)
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}

// Adjust requireAdmin to use updated util
export function requireAdmin(request: NextRequest): AuthenticatedUser {
  const user = requireAuth(request)
  if (user.type !== 'admin') {
    throw new Error('Admin access required')
  }
  return user
}

// Helper: Check if user can access another user's data
export function canAccessUserData(authenticatedUser: AuthenticatedUser, targetUserId: string): boolean {
  // Admins can access anyone's data
  if (authenticatedUser.type === 'admin') {
    return true
  }
  // Users can only access their own data
  return authenticatedUser.id === targetUserId
}

// Helper: Check if user is in the same family
export function isInSameFamily(authenticatedUser: AuthenticatedUser, targetFamilyCode?: string): boolean {
  // Admins can access all families
  if (authenticatedUser.type === 'admin') {
    return true
  }
  // Check if user is in the same family
  if (!authenticatedUser.familyCode || !targetFamilyCode) {
    return false
  }
  return authenticatedUser.familyCode === targetFamilyCode
}

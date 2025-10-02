// User Types
export interface User {
  id: string
  name: string
  type: 'admin' | 'citizen'
  familyCode?: string
  email?: string
  phone?: string
  avatar?: string
}

// Family Member Types
export interface FamilyMember {
  id: string
  name: string
  relationship: string
  dateOfBirth?: string
  dateOfDeath?: string
  gender: 'male' | 'female' | 'other'
  isAlive: boolean
  photo?: string
  bio?: string
  location?: string
  occupation?: string
  spouse?: string
  children?: string[]
  parents?: string[]
  siblings?: string[]
  documents?: Document[]
  createdAt: string
  updatedAt: string
}

// Document Types
export interface Document {
  id: string
  title: string
  type: 'photo' | 'certificate' | 'document' | 'other'
  url: string
  description?: string
  uploadedBy: string
  uploadedAt: string
  isPublic: boolean
}

// Notification Types
export interface Notification {
  id: string
  type: 'verification' | 'member_added' | 'system' | 'family_update'
  title: string
  message: string
  timestamp: string
  read: boolean
  priority: 'low' | 'medium' | 'high'
  userId: string
}

// Family Tree Types
export interface FamilyTree {
  id: string
  name: string
  description?: string
  rootMember: string
  members: FamilyMember[]
  privacy: 'public' | 'private' | 'family_only'
  createdAt: string
  updatedAt: string
  createdBy: string
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Form Types
export interface LoginForm {
  loginId: string
  password: string
}

export interface RegisterForm {
  name: string
  email: string
  phone: string
  password: string
  confirmPassword: string
  userType: 'citizen' | 'admin'
  familyCode?: string
  acceptTerms: boolean
}

export interface AddMemberForm {
  name: string
  relationship: string
  gender: 'male' | 'female' | 'other'
  dateOfBirth?: string
  dateOfDeath?: string
  isAlive: boolean
  location?: string
  occupation?: string
  bio?: string
  photo?: File
}

// Dashboard Stats Types
export interface DashboardStats {
  totalMembers: number
  totalFamilies: number
  pendingVerifications: number
  recentActivities: number
  documentsUploaded: number
}

// Search Types
export interface SearchFilters {
  name?: string
  location?: string
  relationship?: string
  dateRange?: {
    start: string
    end: string
  }
}

// Pagination Types
export interface PaginationParams {
  page: number
  limit: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
} 
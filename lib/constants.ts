// App Constants
export const APP_NAME = "Bharat Vanshavali"
export const APP_DESCRIPTION = "India's first open genealogy platform for preserving heritage and building community"
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

// API Constants
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api"
export const API_TIMEOUT = 10000

// Authentication Constants
export const AUTH_TOKEN_KEY = "authToken"
export const USER_TYPE_KEY = "userType"
export const USER_ID_KEY = "userId"
export const USER_NAME_KEY = "userName"
export const FAMILY_CODE_KEY = "familyCode"

// User Types
export const USER_TYPES = {
  ADMIN: "admin",
  CITIZEN: "citizen"
} as const

// Gender Options
export const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" }
] as const

// Relationship Types
export const RELATIONSHIP_TYPES = [
  { value: "father", label: "Father" },
  { value: "mother", label: "Mother" },
  { value: "son", label: "Son" },
  { value: "daughter", label: "Daughter" },
  { value: "brother", label: "Brother" },
  { value: "sister", label: "Sister" },
  { value: "grandfather", label: "Grandfather" },
  { value: "grandmother", label: "Grandmother" },
  { value: "uncle", label: "Uncle" },
  { value: "aunt", label: "Aunt" },
  { value: "cousin", label: "Cousin" },
  { value: "spouse", label: "Spouse" },
  { value: "other", label: "Other" }
] as const

// Document Types
export const DOCUMENT_TYPES = [
  { value: "photo", label: "Photo" },
  { value: "certificate", label: "Certificate" },
  { value: "document", label: "Document" },
  { value: "other", label: "Other" }
] as const

// Notification Types
export const NOTIFICATION_TYPES = {
  VERIFICATION: "verification",
  MEMBER_ADDED: "member_added",
  SYSTEM: "system",
  FAMILY_UPDATE: "family_update"
} as const

// Notification Priorities
export const NOTIFICATION_PRIORITIES = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high"
} as const

// Privacy Levels
export const PRIVACY_LEVELS = {
  PUBLIC: "public",
  PRIVATE: "private",
  FAMILY_ONLY: "family_only"
} as const

// Pagination
export const DEFAULT_PAGE_SIZE = 10
export const MAX_PAGE_SIZE = 100

// File Upload
export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
export const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "application/pdf",
  "text/plain"
]

// Validation Rules
export const VALIDATION_RULES = {
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  EMAIL_MAX_LENGTH: 254,
  PHONE_MAX_LENGTH: 15,
  BIO_MAX_LENGTH: 1000
}

// Routes
export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  DASHBOARD: "/dashboard",
  FAMILY_TREE: "/family-tree",
  ADD_MEMBER: "/add-member",
  HELP: "/help",
  PRIVACY: "/privacy",
  TERMS: "/terms",
  ADMIN: {
    DASHBOARD: "/admin/dashboard",
    FAMILY_TREE: "/admin/family-tree"
  },
  CITIZEN: {
    DASHBOARD: "/citizen/dashboard",
    FAMILY_TREE: "/citizen/family-tree",
    ADD_MEMBER: "/citizen/add-member"
  }
} as const

// Error Messages
export const ERROR_MESSAGES = {
  REQUIRED_FIELD: "This field is required",
  INVALID_EMAIL: "Please enter a valid email address",
  INVALID_PHONE: "Please enter a valid phone number",
  PASSWORD_TOO_SHORT: "Password must be at least 8 characters long",
  PASSWORDS_DONT_MATCH: "Passwords do not match",
  FILE_TOO_LARGE: "File size must be less than 10MB",
  INVALID_FILE_TYPE: "Invalid file type",
  NETWORK_ERROR: "Network error. Please try again.",
  UNAUTHORIZED: "You are not authorized to perform this action",
  NOT_FOUND: "Resource not found",
  SERVER_ERROR: "Server error. Please try again later."
} as const

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: "Successfully logged in",
  LOGOUT_SUCCESS: "Successfully logged out",
  REGISTRATION_SUCCESS: "Account created successfully",
  MEMBER_ADDED: "Family member added successfully",
  MEMBER_UPDATED: "Family member updated successfully",
  MEMBER_DELETED: "Family member deleted successfully",
  DOCUMENT_UPLOADED: "Document uploaded successfully",
  PROFILE_UPDATED: "Profile updated successfully"
} as const

// Colors (for consistent theming)
export const COLORS = {
  PRIMARY: {
    ORANGE: "#f97316",
    GREEN: "#22c55e",
    RED: "#ef4444"
  },
  SECONDARY: {
    BLUE: "#3b82f6",
    PURPLE: "#8b5cf6",
    YELLOW: "#eab308"
  },
  NEUTRAL: {
    GRAY: "#6b7280",
    BLACK: "#111827",
    WHITE: "#ffffff"
  }
} as const 
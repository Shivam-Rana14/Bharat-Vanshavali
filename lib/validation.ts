// Validation utilities for forms
export interface ValidationError {
  field: string
  message: string
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
}

// Email validation
export const validateEmail = (email: string): ValidationError | null => {
  if (!email) return { field: 'email', message: 'Email is required' }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { field: 'email', message: 'Please enter a valid email address' }
  }
  
  return null
}

// Phone validation (Indian format)
export const validatePhone = (phone: string): ValidationError | null => {
  if (!phone) return { field: 'phone', message: 'Phone number is required' }
  
  // Remove all non-digits
  const digitsOnly = phone.replace(/\D/g, '')
  
  // Check if it's exactly 10 digits and starts with 6-9
  if (digitsOnly.length !== 10) {
    return { field: 'phone', message: 'Phone number must be exactly 10 digits' }
  }
  
  if (!/^[6-9]/.test(digitsOnly)) {
    return { field: 'phone', message: 'Phone number must start with 6, 7, 8, or 9' }
  }
  
  return null
}

// Password validation
export const validatePassword = (password: string): ValidationError | null => {
  if (!password) return { field: 'password', message: 'Password is required' }
  
  if (password.length < 6) {
    return { field: 'password', message: 'Password must be at least 6 characters long' }
  }
  
  if (password.length > 128) {
    return { field: 'password', message: 'Password must be less than 128 characters' }
  }
  
  // Check for at least one letter and one number
  if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(password)) {
    return { field: 'password', message: 'Password must contain at least one letter and one number' }
  }
  
  return null
}

// Name validation
export const validateName = (name: string, fieldName: string = 'name'): ValidationError | null => {
  if (!name) return { field: fieldName, message: `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required` }
  
  if (name.length < 2) {
    return { field: fieldName, message: `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be at least 2 characters long` }
  }
  
  if (name.length > 50) {
    return { field: fieldName, message: `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be less than 50 characters` }
  }
  
  // Only allow letters, spaces, hyphens, and apostrophes
  if (!/^[a-zA-Z\s'-]+$/.test(name)) {
    return { field: fieldName, message: `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} can only contain letters, spaces, hyphens, and apostrophes` }
  }
  
  return null
}

// Date validation
export const validateDate = (date: string, fieldName: string = 'date'): ValidationError | null => {
  if (!date) return { field: fieldName, message: `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required` }
  
  const parsedDate = new Date(date)
  if (isNaN(parsedDate.getTime())) {
    return { field: fieldName, message: 'Please enter a valid date' }
  }
  
  const today = new Date()
  const maxAge = new Date()
  maxAge.setFullYear(today.getFullYear() - 150)
  
  if (parsedDate > today) {
    return { field: fieldName, message: 'Date cannot be in the future' }
  }
  
  if (parsedDate < maxAge) {
    return { field: fieldName, message: 'Please enter a valid date' }
  }
  
  return null
}

// Registration form validation
export const validateRegistrationForm = (data: {
  email: string
  password: string
  confirmPassword: string
  fullName: string
  phone: string
  dateOfBirth?: string
  fatherName?: string
  motherName?: string
  reference1Name?: string
  reference1Phone?: string
  reference2Name?: string
  reference2Phone?: string
}): ValidationResult => {
  const errors: ValidationError[] = []
  
  // Required field validations
  const emailError = validateEmail(data.email)
  if (emailError) errors.push(emailError)
  
  const passwordError = validatePassword(data.password)
  if (passwordError) errors.push(passwordError)
  
  // Confirm password
  if (data.password !== data.confirmPassword) {
    errors.push({ field: 'confirmPassword', message: 'Passwords do not match' })
  }
  
  const nameError = validateName(data.fullName, 'fullName')
  if (nameError) errors.push(nameError)
  
  const phoneError = validatePhone(data.phone)
  if (phoneError) errors.push(phoneError)
  
  // Optional field validations
  if (data.dateOfBirth) {
    const dobError = validateDate(data.dateOfBirth, 'dateOfBirth')
    if (dobError) errors.push(dobError)
  }
  
  if (data.fatherName) {
    const fatherError = validateName(data.fatherName, 'fatherName')
    if (fatherError) errors.push(fatherError)
  }
  
  if (data.motherName) {
    const motherError = validateName(data.motherName, 'motherName')
    if (motherError) errors.push(motherError)
  }
  
  // Reference validations
  if (data.reference1Name && data.reference1Phone) {
    const ref1NameError = validateName(data.reference1Name, 'reference1Name')
    if (ref1NameError) errors.push(ref1NameError)
    
    const ref1PhoneError = validatePhone(data.reference1Phone)
    if (ref1PhoneError) errors.push({ ...ref1PhoneError, field: 'reference1Phone' })
  }
  
  if (data.reference2Name && data.reference2Phone) {
    const ref2NameError = validateName(data.reference2Name, 'reference2Name')
    if (ref2NameError) errors.push(ref2NameError)
    
    const ref2PhoneError = validatePhone(data.reference2Phone)
    if (ref2PhoneError) errors.push({ ...ref2PhoneError, field: 'reference2Phone' })
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// Login form validation
export const validateLoginForm = (data: {
  loginId: string
  password: string
}): ValidationResult => {
  const errors: ValidationError[] = []
  
  if (!data.loginId) {
    errors.push({ field: 'loginId', message: 'Login ID is required' })
  }
  
  if (!data.password) {
    errors.push({ field: 'password', message: 'Password is required' })
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// Format phone number for display
export const formatPhoneNumber = (phone: string): string => {
  const digitsOnly = phone.replace(/\D/g, '')
  if (digitsOnly.length === 10) {
    return `${digitsOnly.slice(0, 5)} ${digitsOnly.slice(5)}`
  }
  return phone
}

// Clean phone number for storage
export const cleanPhoneNumber = (phone: string): string => {
  return phone.replace(/\D/g, '')
}

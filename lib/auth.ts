import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { User } from './types'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export interface JWTPayload {
  id: string
  email: string
  type: 'admin' | 'citizen'
  familyCode?: string
}

export const authService = {
  // Hash password
  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10)
    return bcrypt.hash(password, salt)
  },

  // Compare password
  async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword)
  },

  // Generate JWT token
  generateToken(user: JWTPayload): string {
    return jwt.sign(user, JWT_SECRET, { expiresIn: '7d' })
  },

  // Verify JWT token
  verifyToken(token: string): JWTPayload {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  }
}

export const verifyToken = async (token: string): Promise<User | null> => {
  try {
    const payload = authService.verifyToken(token)
    return {
      id: payload.id,
      name: '', // Will be populated from database
      email: payload.email,
      type: payload.type,
      familyCode: payload.familyCode
    }
  } catch (error) {
    return null
  }
}

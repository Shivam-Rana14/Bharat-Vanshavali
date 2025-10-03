import mongoose, { Schema, Document } from 'mongoose'

export interface IUser extends Document {
  _id: string
  email: string
  password: string
  fullName: string
  loginId: string // Unique login identifier
  phone?: string
  avatarUrl?: string
  avatarData?: string // Base64 encoded image data
  userType: 'admin' | 'citizen'
  familyCode?: string
  verificationStatus: 'pending' | 'verified' | 'rejected'
  dateOfBirth?: Date
  placeOfBirth?: string
  gender?: 'male' | 'female' | 'other'
  nativePlace?: string
  caste?: string
  signupLatitude?: number
  signupLongitude?: number
  createdAt: Date
  updatedAt: Date
  verifiedAt?: Date
  verifiedBy?: string
}

const UserSchema = new Schema<IUser>({
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(email: string) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      },
      message: 'Please enter a valid email address'
    }
  },
  password: { type: String, required: true },
  fullName: { type: String, required: true, trim: true },
  loginId: { 
    type: String, 
    required: true, 
    unique: true,
    uppercase: true,
    trim: true,
    validate: {
      validator: function(loginId: string) {
        return /^BV[A-Z0-9]{6,}$/.test(loginId)
      },
      message: 'Login ID must start with BV followed by at least 6 alphanumeric characters'
    }
  },
  phone: { type: String },
  avatarUrl: { type: String },
  avatarData: { type: String }, // Base64 encoded image data
  userType: { type: String, enum: ['admin', 'citizen'], default: 'citizen' },
  familyCode: { type: String },
  verificationStatus: { 
    type: String, 
    enum: ['pending', 'verified', 'rejected'], 
    default: 'pending' 
  },
  dateOfBirth: { type: Date },
  placeOfBirth: { type: String },
  gender: { type: String, enum: ['male', 'female', 'other'] },
  nativePlace: { type: String },
  caste: { type: String },
  signupLatitude: { type: Number },
  signupLongitude: { type: Number },
  verifiedAt: { type: Date },
  verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
})

// Indexes for better performance (email and loginId already have unique indexes from schema)
UserSchema.index({ familyCode: 1 })
UserSchema.index({ verificationStatus: 1 })
UserSchema.index({ email: 1, loginId: 1 }) // Compound index for faster lookups
UserSchema.index({ userType: 1, verificationStatus: 1 }) // For admin queries

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema)

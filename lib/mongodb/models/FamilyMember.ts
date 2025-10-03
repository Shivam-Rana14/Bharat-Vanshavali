import mongoose, { Schema, Document } from 'mongoose'

export interface IFamilyMember extends Document {
  _id: string
  userId?: string
  familyTreeId: any
  fullName: string
  relationship: string // Original relationship (e.g., "father", "mother")
  relationshipToTarget?: string // Smart relationship (e.g., "Father of John")
  targetMemberId?: any // ID of the member this relationship is relative to
  gender: 'male' | 'female' | 'other'
  dateOfBirth?: Date
  dateOfDeath?: Date
  placeOfBirth?: string
  placeOfDeath?: string
  isAlive: boolean
  occupation?: string
  bio?: string
  photoUrl?: string
  spouseId?: string
  fatherId?: string
  motherId?: string
  verificationStatus: 'pending' | 'verified' | 'rejected'
  isRootMember: boolean // True if this member is the root of the family tree
  joinedAt: Date // When this member joined the family (for root member determination)
  createdBy: any
  createdAt: Date
  updatedAt: Date
  verifiedAt?: Date
  verifiedBy?: string
}

const FamilyMemberSchema = new Schema<IFamilyMember>({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  familyTreeId: { type: Schema.Types.ObjectId, ref: 'FamilyTree', required: true },
  fullName: { type: String, required: true },
  relationship: { type: String, required: true }, // Original relationship (e.g., "father", "mother")
  relationshipToTarget: { type: String }, // Smart relationship (e.g., "Father of John")
  targetMemberId: { type: Schema.Types.ObjectId, ref: 'FamilyMember' }, // ID of the member this relationship is relative to
  gender: { type: String, enum: ['male', 'female', 'other'], required: true },
  dateOfBirth: { type: Date },
  dateOfDeath: { type: Date },
  placeOfBirth: { type: String },
  placeOfDeath: { type: String },
  isAlive: { type: Boolean, default: true },
  occupation: { type: String },
  bio: { type: String },
  photoUrl: { type: String },
  spouseId: { type: Schema.Types.ObjectId, ref: 'FamilyMember' },
  fatherId: { type: Schema.Types.ObjectId, ref: 'FamilyMember' },
  motherId: { type: Schema.Types.ObjectId, ref: 'FamilyMember' },
  verificationStatus: { 
    type: String, 
    enum: ['pending', 'verified', 'rejected'], 
    default: 'pending' 
  },
  isRootMember: { type: Boolean, default: false }, // True if this member is the root of the family tree
  joinedAt: { type: Date, default: Date.now }, // When this member joined the family (for root member determination)
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  verifiedAt: { type: Date },
  verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
})

// Index for better performance
FamilyMemberSchema.index({ familyTreeId: 1 })
FamilyMemberSchema.index({ userId: 1 })
FamilyMemberSchema.index({ fatherId: 1 })
FamilyMemberSchema.index({ motherId: 1 })
FamilyMemberSchema.index({ spouseId: 1 })
FamilyMemberSchema.index({ targetMemberId: 1 })
FamilyMemberSchema.index({ isRootMember: 1 })
FamilyMemberSchema.index({ joinedAt: 1 })
FamilyMemberSchema.index({ fullName: 'text' })

export default mongoose.models.FamilyMember || mongoose.model<IFamilyMember>('FamilyMember', FamilyMemberSchema)

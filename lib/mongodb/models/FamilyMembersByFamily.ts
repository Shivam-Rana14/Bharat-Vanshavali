import mongoose, { Schema, Document } from 'mongoose'

export interface IFamilyMembersByFamily extends Document {
  _id: string
  familyCode: string
  familyTreeId: any
  familyName: string
  rootUserId: any
  // Array of all user IDs in this family
  memberUserIds: Array<any>
  // Detailed member information
  memberDetails: Array<{
    userId: any
    fullName: string
    loginId: string
    email: string
    gender?: string
    dateOfBirth?: Date
    placeOfBirth?: string
    verificationStatus: string
    isRoot: boolean
    joinedAt: Date
    nodePosition?: { x: number; y: number }
  }>
  // Family statistics
  stats: {
    totalMembers: number
    verifiedMembers: number
    pendingMembers: number
    maleMembers: number
    femaleMembers: number
    otherMembers: number
  }
  lastUpdated: Date
  createdAt: Date
  updatedAt: Date
}

const FamilyMembersByFamilySchema = new Schema<IFamilyMembersByFamily>({
  familyCode: { type: String, required: true, unique: true },
  familyTreeId: { type: Schema.Types.ObjectId, ref: 'FamilyTree', required: true },
  familyName: { type: String, required: true },
  rootUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Array of user IDs for quick reference
  memberUserIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  
  // Detailed member information
  memberDetails: [{
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    fullName: { type: String, required: true },
    loginId: { type: String, required: true },
    email: { type: String, required: true },
    gender: { type: String, enum: ['male', 'female', 'other'] },
    dateOfBirth: { type: Date },
    placeOfBirth: { type: String },
    verificationStatus: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
    isRoot: { type: Boolean, default: false },
    joinedAt: { type: Date, default: Date.now },
    nodePosition: {
      x: { type: Number, default: 0 },
      y: { type: Number, default: 0 }
    }
  }],
  
  // Family statistics for quick access
  stats: {
    totalMembers: { type: Number, default: 0 },
    verifiedMembers: { type: Number, default: 0 },
    pendingMembers: { type: Number, default: 0 },
    maleMembers: { type: Number, default: 0 },
    femaleMembers: { type: Number, default: 0 },
    otherMembers: { type: Number, default: 0 }
  },
  
  lastUpdated: { type: Date, default: Date.now }
}, {
  timestamps: true
})

// Indexes for better performance
FamilyMembersByFamilySchema.index({ familyCode: 1 }, { unique: true })
FamilyMembersByFamilySchema.index({ familyTreeId: 1 })
FamilyMembersByFamilySchema.index({ rootUserId: 1 })
FamilyMembersByFamilySchema.index({ 'memberUserIds': 1 })
FamilyMembersByFamilySchema.index({ 'memberDetails.userId': 1 })
FamilyMembersByFamilySchema.index({ 'memberDetails.verificationStatus': 1 })

export default mongoose.models.FamilyMembersByFamily || mongoose.model<IFamilyMembersByFamily>('FamilyMembersByFamily', FamilyMembersByFamilySchema)

import mongoose, { Schema, Document } from 'mongoose'

export interface IFamilyMembersByFamily extends Document {
  _id: string
  familyCode: string
  familyTreeId: any
  familyName: string
  rootUserId: any
  // Array of all user IDs in this family
  memberUserIds: Array<any>
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
// FamilyMembersByFamilySchema.index({ familyCode: 1 }, { unique: true }) // Already defined in schema
FamilyMembersByFamilySchema.index({ familyTreeId: 1 })
FamilyMembersByFamilySchema.index({ rootUserId: 1 })
FamilyMembersByFamilySchema.index({ 'memberUserIds': 1 })

export default mongoose.models.FamilyMembersByFamily || mongoose.model<IFamilyMembersByFamily>('FamilyMembersByFamily', FamilyMembersByFamilySchema)

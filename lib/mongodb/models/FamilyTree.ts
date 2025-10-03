import mongoose, { Schema, Document } from 'mongoose'

export interface IFamilyTree extends Document {
  _id: string
  name: string
  description?: string
  motto?: string
  originPlace?: string
  crestUrl?: string
  rootUserId: any // The user who manages this family tree (root member)
  familyCode: string
  privacy: 'public' | 'private' | 'family_only'
  createdBy: any
  memberCount: number // Track number of active members
  isActive: boolean // False if family tree is empty and should be deleted
  // Array of all family members with basic info
  members: Array<{
    userId: any
    fullName: string
    loginId: string
    email: string
    gender?: string
    dateOfBirth?: Date
    verificationStatus: string
    isRoot: boolean
    joinedAt: Date
  }>
  treeSettings: {
    backgroundColor?: string
    gridEnabled?: boolean
    snapToGrid?: boolean
    zoomLevel?: number
    centerPosition?: { x: number; y: number }
  }
  createdAt: Date
  updatedAt: Date
}

const FamilyTreeSchema = new Schema<IFamilyTree>({
  name: { type: String, required: true },
  description: { type: String },
  motto: { type: String },
  originPlace: { type: String },
  crestUrl: { type: String },
  rootUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // The user who manages this family tree
  familyCode: { type: String, required: true },
  privacy: {
    type: String,
    enum: ['public', 'private', 'family_only'],
    default: 'family_only'
  },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  memberCount: { type: Number, default: 0 }, // Track number of active members
  isActive: { type: Boolean, default: true }, // False if family tree is empty and should be deleted
  // Array of all family members with basic info
  members: [{
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    fullName: { type: String, required: true },
    loginId: { type: String, required: true },
    email: { type: String, required: true },
    gender: { type: String, enum: ['male', 'female', 'other'] },
    dateOfBirth: { type: Date },
    verificationStatus: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
    isRoot: { type: Boolean, default: false },
    joinedAt: { type: Date, default: Date.now }
  }],
  treeSettings: {
    backgroundColor: { type: String, default: '#f8f9fa' },
    gridEnabled: { type: Boolean, default: true },
    snapToGrid: { type: Boolean, default: false },
    zoomLevel: { type: Number, default: 1 },
    centerPosition: {
      x: { type: Number, default: 0 },
      y: { type: Number, default: 0 }
    }
  }
}, {
  timestamps: true
})

// Indexes for better performance
FamilyTreeSchema.index({ familyCode: 1 }, { unique: true })
FamilyTreeSchema.index({ createdBy: 1 })
FamilyTreeSchema.index({ rootUserId: 1 })
FamilyTreeSchema.index({ isActive: 1 })
FamilyTreeSchema.index({ memberCount: 1 })

export default mongoose.models.FamilyTree || mongoose.model<IFamilyTree>('FamilyTree', FamilyTreeSchema)

import mongoose, { Schema, Document } from 'mongoose'

export interface IFamilyTree extends Document {
  _id: string
  name: string
  description?: string
  motto?: string
  originPlace?: string
  crestUrl?: string
  rootMemberId?: any // Optional - can be null if no root member exists
  familyCode: string
  privacy: 'public' | 'private' | 'family_only'
  createdBy: string
  memberCount: number // Track number of active members
  isActive: boolean // False if family tree is empty and should be deleted
  createdAt: Date
  updatedAt: Date
}

const FamilyTreeSchema = new Schema<IFamilyTree>({
  name: { type: String, required: true },
  description: { type: String },
  motto: { type: String },
  originPlace: { type: String },
  crestUrl: { type: String },
  rootMemberId: { type: Schema.Types.ObjectId, ref: 'FamilyMember' }, // Optional - can be null
  familyCode: { type: String, required: true, unique: true },
  privacy: { 
    type: String, 
    enum: ['public', 'private', 'family_only'], 
    default: 'family_only' 
  },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  memberCount: { type: Number, default: 0 }, // Track number of active members
  isActive: { type: Boolean, default: true } // False if family tree is empty and should be deleted
}, {
  timestamps: true
})

// Index for better performance (familyCode already has unique index)
FamilyTreeSchema.index({ createdBy: 1 })
FamilyTreeSchema.index({ rootMemberId: 1 })
FamilyTreeSchema.index({ isActive: 1 })
FamilyTreeSchema.index({ memberCount: 1 })

export default mongoose.models.FamilyTree || mongoose.model<IFamilyTree>('FamilyTree', FamilyTreeSchema)

import mongoose, { Schema, Document } from 'mongoose'

export interface IFamilyInvitation extends Document {
  _id: string
  familyTreeId: string
  invitedBy: string
  invitedEmail: string
  invitedPhone?: string
  relationship: string
  status: 'pending' | 'accepted' | 'rejected' | 'expired'
  token: string
  expiresAt: Date
  createdAt: Date
  respondedAt?: Date
}

const FamilyInvitationSchema = new Schema<IFamilyInvitation>({
  familyTreeId: { type: Schema.Types.ObjectId, ref: 'FamilyTree', required: true },
  invitedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  invitedEmail: { type: String, required: true },
  invitedPhone: { type: String },
  relationship: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'accepted', 'rejected', 'expired'], 
    default: 'pending' 
  },
  token: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  respondedAt: { type: Date }
}, {
  timestamps: { createdAt: true, updatedAt: false }
})

// Index for better performance
FamilyInvitationSchema.index({ familyTreeId: 1 })
FamilyInvitationSchema.index({ invitedEmail: 1 })
FamilyInvitationSchema.index({ token: 1 }, { unique: true })
FamilyInvitationSchema.index({ status: 1 })
FamilyInvitationSchema.index({ expiresAt: 1 })

export default mongoose.models.FamilyInvitation || mongoose.model<IFamilyInvitation>('FamilyInvitation', FamilyInvitationSchema)

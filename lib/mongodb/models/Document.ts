import mongoose, { Schema, Document } from 'mongoose'

export interface IDocument extends Document {
  _id: string
  title: string
  description?: string
  documentType: 'aadhaar' | 'voter_id' | 'birth_certificate' | 'photo' | 'other'
  fileUrl: string
  fileData: string // Base64 encoded file data
  fileName: string
  fileSize: number
  mimeType: string
  uploadedBy: string
  ownerId?: string
  familyMemberId?: string
  isPublic: boolean
  createdAt: Date
  updatedAt: Date
}

const DocumentSchema = new Schema<IDocument>({
  title: { type: String, required: true },
  description: { type: String },
  documentType: { 
    type: String, 
    enum: ['aadhaar', 'voter_id', 'birth_certificate', 'photo', 'other'], 
    required: true 
  },
  fileUrl: { type: String },
  fileData: { type: String }, // Base64 encoded file data
  fileName: { type: String, required: true },
  fileSize: { type: Number, required: true },
  mimeType: { type: String, required: true },
  uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  ownerId: { type: Schema.Types.ObjectId, ref: 'User' },
  familyMemberId: { type: Schema.Types.ObjectId, ref: 'FamilyMember' },
  isPublic: { type: Boolean, default: false }
}, {
  timestamps: true
})

// Index for better performance
DocumentSchema.index({ ownerId: 1 })
DocumentSchema.index({ familyMemberId: 1 })
DocumentSchema.index({ uploadedBy: 1 })
DocumentSchema.index({ documentType: 1 })

export default mongoose.models.Document || mongoose.model<IDocument>('Document', DocumentSchema)

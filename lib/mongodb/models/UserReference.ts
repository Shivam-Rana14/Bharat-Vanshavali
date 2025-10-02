import mongoose, { Schema, Document } from 'mongoose'

export interface IUserReference extends Document {
  _id: string
  userId: string
  referenceName: string
  referencePhone: string
  referenceType: 1 | 2
  createdAt: Date
}

const UserReferenceSchema = new Schema<IUserReference>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  referenceName: { type: String, required: true },
  referencePhone: { type: String, required: true },
  referenceType: { type: Number, enum: [1, 2], required: true }
}, {
  timestamps: { createdAt: true, updatedAt: false }
})

// Index for better performance
UserReferenceSchema.index({ userId: 1 })

export default mongoose.models.UserReference || mongoose.model<IUserReference>('UserReference', UserReferenceSchema)

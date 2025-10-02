import mongoose, { Schema, Document } from 'mongoose'

export interface IActivityLog extends Document {
  _id: string
  userId?: string
  action: string
  tableName: string
  recordId: string
  oldData?: any
  newData?: any
  ipAddress?: string
  userAgent?: string
  createdAt: Date
}

const ActivityLogSchema = new Schema<IActivityLog>({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  action: { type: String, required: true },
  tableName: { type: String, required: true },
  recordId: { type: String, required: true },
  oldData: { type: Schema.Types.Mixed },
  newData: { type: Schema.Types.Mixed },
  ipAddress: { type: String },
  userAgent: { type: String }
}, {
  timestamps: { createdAt: true, updatedAt: false }
})

// Index for better performance
ActivityLogSchema.index({ userId: 1 })
ActivityLogSchema.index({ tableName: 1 })
ActivityLogSchema.index({ recordId: 1 })
ActivityLogSchema.index({ createdAt: -1 })
ActivityLogSchema.index({ action: 1 })

export default mongoose.models.ActivityLog || mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema)

import mongoose, { Schema, Document } from 'mongoose'

export interface INotification extends Document {
  _id: string
  userId: string
  type: 'verification' | 'member_added' | 'system' | 'family_update'
  title: string
  message: string
  priority: 'low' | 'medium' | 'high'
  read: boolean
  readAt?: Date
  data?: any
  createdAt: Date
}

const NotificationSchema = new Schema<INotification>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { 
    type: String, 
    enum: ['verification', 'member_added', 'system', 'family_update'], 
    required: true 
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  read: { type: Boolean, default: false },
  readAt: { type: Date },
  data: { type: Schema.Types.Mixed }
}, {
  timestamps: { createdAt: true, updatedAt: false }
})

// Index for better performance
NotificationSchema.index({ userId: 1, read: 1 })
NotificationSchema.index({ createdAt: -1 })

export default mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema)

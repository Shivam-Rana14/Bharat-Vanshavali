import mongoose, { Schema, Document } from 'mongoose'

export interface IPayment extends Document {
  _id: any
  userId: string           // The member being paid for
  paidByUserId: string     // Root member who made the payment
  familyCode: string
  razorpayOrderId: string  // Created before payment
  razorpayPaymentId?: string // After successful payment
  razorpaySignature?: string // For server-side verification
  amount: number           // In paise (10000 = ₹100, 1000 = ₹10)
  amountInRupees: number   // 100 or 10
  currency: string
  status: 'created' | 'paid' | 'failed'
  memberType: 'root' | 'member'
  paymentMethod?: string   // upi, card, netbanking etc.
  paidAt?: Date
  createdAt: Date
  updatedAt: Date
}

const PaymentSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  paidByUserId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  familyCode: {
    type: String,
    required: true,
    trim: true
  },
  razorpayOrderId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  razorpayPaymentId: {
    type: String,
    trim: true,
    sparse: true
  },
  razorpaySignature: {
    type: String,
    trim: true
  },
  amount: {
    type: Number,
    required: true  // In paise
  },
  amountInRupees: {
    type: Number,
    required: true  // 100 or 10
  },
  currency: {
    type: String,
    default: 'INR'
  },
  status: {
    type: String,
    enum: ['created', 'paid', 'failed'],
    default: 'created'
  },
  memberType: {
    type: String,
    enum: ['root', 'member'],
    required: true
  },
  paymentMethod: {
    type: String
  },
  paidAt: {
    type: Date
  }
}, {
  timestamps: true
})

// Indexes
PaymentSchema.index({ userId: 1 })
PaymentSchema.index({ paidByUserId: 1 })
PaymentSchema.index({ familyCode: 1 })
PaymentSchema.index({ status: 1 })
// Note: razorpayOrderId and razorpayPaymentId already have indexes
// from unique:true and sparse:true in the schema field definitions

export default mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema)

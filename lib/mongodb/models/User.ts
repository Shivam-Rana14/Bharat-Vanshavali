import mongoose, { Schema, Document } from 'mongoose'

export interface IUser extends Document {
  _id: any
  email?: string // Optional for placeholder users
  password?: string // Optional for placeholder users
  fullName: string
  loginId: string // Unique login identifier
  phone?: string
  userType: 'admin' | 'citizen'
  familyCode?: string
  verificationStatus: 'pending' | 'verified' | 'rejected'
  dateOfBirth?: Date
  placeOfBirth?: string
  gender?: 'male' | 'female' | 'other'
  nativePlace?: string
  caste?: string
  signupLatitude?: number
  signupLongitude?: number
  createdAt: Date
  updatedAt: Date
  verifiedAt?: Date
  verifiedBy?: string
  aadhaarNumber?: string
  panNumber?: string

  // New fields for Unified User Model
  isPlaceholder: boolean // True if created by another user (no login)
  managedBy?: string // ID of the user who manages this placeholder
  occupation?: string
  bio?: string
  fatherName?: string
  motherName?: string
  grandfatherName?: string
  spouseName?: string
  paymentStatus: 'pending' | 'paid'
}

const UserSchema = new Schema({
  email: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true,
    sparse: true, // Allow multiple null/undefined values
    validate: {
      validator: function (email: string) {
        // Only validate if email is present
        if (!email) return true
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      },
      message: 'Please enter a valid email address'
    }
  },
  password: { type: String }, // Not required for placeholder users
  fullName: { type: String, required: true, trim: true },
  loginId: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    validate: {
      validator: function (loginId: string) {
        return /^BV[A-Z0-9]{6,}$/.test(loginId)
      },
      message: 'Login ID must start with BV followed by at least 6 alphanumeric characters'
    }
  },
  phone: { type: String },
  userType: { type: String, enum: ['admin', 'citizen'], default: 'citizen' },
  familyCode: { type: String },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  dateOfBirth: { type: Date },
  placeOfBirth: { type: String },
  gender: { type: String, enum: ['male', 'female', 'other'] },
  nativePlace: { type: String },
  caste: { type: String },
  signupLatitude: { type: Number },
  signupLongitude: { type: Number },
  verifiedAt: { type: Date },
  verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  aadhaarNumber: { type: String, trim: true, unique: true, sparse: true },
  panNumber: { type: String, trim: true, uppercase: true, unique: true, sparse: true },

  // Extended Profile Fields (Available for all users)
  isPlaceholder: { type: Boolean, default: false },
  managedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  occupation: { type: String },
  bio: { type: String },
  fatherName: { type: String },
  motherName: { type: String },
  grandfatherName: { type: String },
  spouseName: { type: String },

  // Payment status for verification fee
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid'],
    default: 'pending'
  }
}, {
  timestamps: true
})

// Indexes for better performance
UserSchema.index({ familyCode: 1 })
UserSchema.index({ verificationStatus: 1 })
UserSchema.index({ email: 1, loginId: 1 }) // Compound index for faster lookups
UserSchema.index({ userType: 1, verificationStatus: 1 }) // For admin queries
UserSchema.index({ managedBy: 1 }) // For finding managed users

// ============================================================================
// MONGOOSE MIDDLEWARE - CASCADE OPERATIONS
// ============================================================================

// Cascade deletion when user is deleted
UserSchema.pre('findOneAndDelete', async function (next) {
  try {
    const userId = this.getQuery()._id

    // Get user's family info before deletion
    const user = await this.model.findById(userId)
    if (!user) return next()

    // Import models (avoid circular dependency)
    const FamilyTree = mongoose.models.FamilyTree || (await import('./FamilyTree')).default
    const FamilyTreeNode = mongoose.models.FamilyTreeNode || (await import('./FamilyTreeNode')).default
    const FamilyTreeConnection = mongoose.models.FamilyTreeConnection || (await import('./FamilyTreeConnection')).default
    // REMOVED: FamilyMember model no longer exists
    const FamilyMembersByFamily = mongoose.models.FamilyMembersByFamily || (await import('./FamilyMembersByFamily')).default
    const ActivityLog = mongoose.models.ActivityLog || (await import('./ActivityLog')).default

    // If user has a family code, check for cascade logic
    if (user.familyCode) {
      const familyTree = await FamilyTree.findOne({ familyCode: user.familyCode })

      if (familyTree) {
        // Check if user is root member with other active members
        const isRoot = familyTree.rootUserId.toString() === userId
        const otherMembersCount = await this.model.countDocuments({
          familyCode: user.familyCode,
          _id: { $ne: userId }
        })

        if (isRoot && otherMembersCount > 0) {
          throw new Error('Cannot delete user: User is root member of a family with other members. Please transfer root status first.')
        }

        // Find and delete user's node
        const userNode = await FamilyTreeNode.findOne({
          familyTreeId: familyTree._id,
          userId
        })

        if (userNode) {
          // Delete all connections involving this node
          await FamilyTreeConnection.deleteMany({
            $or: [
              { sourceNodeId: userNode._id },
              { targetNodeId: userNode._id }
            ]
          })

          // Delete the node
          await FamilyTreeNode.findByIdAndDelete(userNode._id)
        }

        // Check if family becomes empty
        if (otherMembersCount === 0) {
          await FamilyTree.findByIdAndDelete(familyTree._id)
          await FamilyMembersByFamily.deleteOne({ familyCode: user.familyCode })
          console.log(`[CASCADE] Deleted family tree ${familyTree._id} after last member deletion`)

          // Log activity
          await new ActivityLog({
            action: 'family_deleted',
            performedBy: userId,
            details: `Family ${familyTree.name} deleted after last member (${user.fullName}) was removed`,
            tableName: 'FamilyTree',
            recordId: familyTree._id,
            timestamp: new Date()
          }).save()
        } else {
          // Update family member arrays
          const { databaseService } = await import('../database')
          await databaseService.updateFamilyMemberArrays(user.familyCode)

          // Log activity
          await new ActivityLog({
            action: 'user_deleted',
            performedBy: userId,
            targetUserId: userId,
            familyCode: user.familyCode,
            details: `User ${user.fullName} deleted from family ${familyTree.name}`,
            tableName: 'User',
            recordId: userId,
            timestamp: new Date()
          }).save()
        }
      }
    }

    // Also delete any placeholder users managed by this user
    await this.model.deleteMany({ managedBy: userId })

    console.log(`[CASCADE] Cleaned up user ${userId}`)
    next()
  } catch (error) {
    next(error as Error)
  }
})

// Propagate profile updates to family collections
UserSchema.post('save', async function (doc) {
  if (!doc.familyCode) return

  try {
    const { databaseService } = await import('../database')
    await databaseService.updateFamilyMemberArrays(doc.familyCode)
    console.log(`[CASCADE] Updated family arrays after user ${doc._id} save`)
  } catch (error) {
    console.error('[CASCADE] Error updating family arrays:', error)
  }
})

UserSchema.post('findOneAndUpdate', async function (doc) {
  if (!doc || !doc.familyCode) return

  try {
    const { databaseService } = await import('../database')
    await databaseService.updateFamilyMemberArrays(doc.familyCode)
    console.log(`[CASCADE] Updated family arrays after user ${doc._id} update`)
  } catch (error) {
    console.error('[CASCADE] Error updating family arrays:', error)
  }
})

// Export User model
export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema)

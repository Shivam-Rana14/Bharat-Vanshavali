import mongoose, { Schema, Document } from 'mongoose'

export interface IFamilyTree extends Document {
  _id: string
  name: string
  description?: string
  motto?: string
  originPlace?: string
  rootUserId: any // The user who manages this family tree (root member)
  familyCode: string
  privacy: 'public' | 'private' | 'family_only'
  createdBy: any
  memberCount: number // Track number of active members
  isActive: boolean // False if family tree is empty and should be deleted
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

// ============================================================================
// MONGOOSE MIDDLEWARE - CASCADE OPERATIONS
// ============================================================================

// Cascade deletion when family tree is deleted
FamilyTreeSchema.pre('findOneAndDelete', async function (next) {
  try {
    const familyTreeId = this.getQuery()._id

    const familyTree = await this.model.findById(familyTreeId)
    if (!familyTree) return next()

    const familyCode = familyTree.familyCode

    // Import models (avoid circular dependency)
    const FamilyTreeNode = mongoose.models.FamilyTreeNode || (await import('./FamilyTreeNode')).default
    const FamilyTreeConnection = mongoose.models.FamilyTreeConnection || (await import('./FamilyTreeConnection')).default
    // REMOVED: FamilyMember model no longer exists
    const FamilyMembersByFamily = mongoose.models.FamilyMembersByFamily || (await import('./FamilyMembersByFamily')).default
    const User = mongoose.models.User || (await import('./User')).default
    const Notification = mongoose.models.Notification || (await import('./Notification')).default
    const ActivityLog = mongoose.models.ActivityLog || (await import('./ActivityLog')).default

    // Delete all nodes
    await FamilyTreeNode.deleteMany({ familyTreeId })

    // Delete all connections
    await FamilyTreeConnection.deleteMany({ familyTreeId })

    // Delete all family members
    // REMOVED: FamilyMember.deleteMany - collection no longer exists

    // Delete family member arrays
    await FamilyMembersByFamily.deleteOne({ familyCode })

    // Unset familyCode for all users
    await User.updateMany(
      { familyCode },
      { $unset: { familyCode: "" } }
    )

    // Delete related notifications (optional)
    await Notification.deleteMany({
      'data.familyTreeId': familyTreeId
    })

    // Log activity
    await new ActivityLog({
      action: 'family_tree_deleted',
      performedBy: familyTree.rootUserId,
      details: `Family tree "${familyTree.name}" (${familyCode}) and all related data deleted`,
      tableName: 'FamilyTree',
      recordId: familyTreeId,
      timestamp: new Date()
    }).save()

    console.log(`[CASCADE] Deleted family tree ${familyTreeId} and all related data`)
    next()
  } catch (error) {
    next(error as Error)
  }
})

// Prevent family code changes after creation
FamilyTreeSchema.pre('findOneAndUpdate', async function (next) {
  const update = this.getUpdate() as any

  if (update.familyCode || update.$set?.familyCode) {
    return next(new Error('Family code cannot be changed after creation'))
  }

  next()
})

export default mongoose.models.FamilyTree || mongoose.model<IFamilyTree>('FamilyTree', FamilyTreeSchema)

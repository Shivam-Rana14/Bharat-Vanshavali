import mongoose, { Schema, Document } from 'mongoose'

export interface IFamilyTreeNode extends Document {
  _id: string
  familyTreeId: any
  userId: any // Reference to the User this node represents
  position: {
    x: number
    y: number
  }
  nodeData: {
    width?: number
    height?: number
    color?: string
    isVisible: boolean
  }
  createdAt: Date
  updatedAt: Date
}

const FamilyTreeNodeSchema = new Schema<IFamilyTreeNode>({
  familyTreeId: { type: Schema.Types.ObjectId, ref: 'FamilyTree', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  position: {
    x: { type: Number, required: true, default: 0 },
    y: { type: Number, required: true, default: 0 }
  },
  nodeData: {
    width: { type: Number, default: 200 },
    height: { type: Number, default: 100 },
    color: { type: String, default: '#ffffff' },
    isVisible: { type: Boolean, default: true }
  }
}, {
  timestamps: true
})

// Indexes for better performance
FamilyTreeNodeSchema.index({ familyTreeId: 1 })
FamilyTreeNodeSchema.index({ userId: 1 })
FamilyTreeNodeSchema.index({ familyTreeId: 1, userId: 1 }, { unique: true }) // One node per user per family tree

// ============================================================================
// MONGOOSE MIDDLEWARE - CASCADE OPERATIONS
// ============================================================================

// Cascade deletion when node is deleted
FamilyTreeNodeSchema.pre('findOneAndDelete', async function (next) {
  try {
    const nodeId = this.getQuery()._id

    const node = await this.model.findById(nodeId).populate('familyTreeId')
    if (!node) return next()

    const familyTree = node.familyTreeId as any
    const userId = node.userId

    // Import models (avoid circular dependency)
    const FamilyTreeConnection = mongoose.models.FamilyTreeConnection || (await import('./FamilyTreeConnection')).default
    // REMOVED: FamilyMember model no longer exists
    const User = mongoose.models.User || (await import('./User')).default
    const FamilyTree = mongoose.models.FamilyTree || (await import('./FamilyTree')).default
    const FamilyMembersByFamily = mongoose.models.FamilyMembersByFamily || (await import('./FamilyMembersByFamily')).default
    const ActivityLog = mongoose.models.ActivityLog || (await import('./ActivityLog')).default

    // Delete all connections
    await FamilyTreeConnection.deleteMany({
      $or: [
        { sourceNodeId: nodeId },
        { targetNodeId: nodeId }
      ]
    })

    // REMOVED: FamilyMember.deleteMany - collection no longer exists

    // Unset User.familyCode
    await User.findByIdAndUpdate(userId, {
      $unset: { familyCode: "" }
    })

    // Check if family becomes empty
    const remainingNodes = await this.model.countDocuments({
      familyTreeId: familyTree._id,
      _id: { $ne: nodeId }
    })

    if (remainingNodes === 0) {
      await FamilyTree.findByIdAndDelete(familyTree._id)
      await FamilyMembersByFamily.deleteOne({ familyCode: familyTree.familyCode })
      console.log(`[CASCADE] Deleted empty family tree ${familyTree._id}`)

      // Log activity
      await new ActivityLog({
        action: 'family_deleted',
        performedBy: userId,
        details: `Family ${familyTree.name} deleted after last node removed`,
        tableName: 'FamilyTree',
        recordId: familyTree._id,
        timestamp: new Date()
      }).save()
    } else {
      // Update family member arrays
      const { databaseService } = await import('../database')
      await databaseService.updateFamilyMemberArrays(familyTree.familyCode)

      // Log activity
      await new ActivityLog({
        action: 'node_deleted',
        performedBy: userId,
        details: `Node for user ${userId} deleted from family ${familyTree.name}`,
        tableName: 'FamilyTreeNode',
        recordId: nodeId,
        timestamp: new Date()
      }).save()
    }

    console.log(`[CASCADE] Deleted node ${nodeId} and cleaned up related data`)
    next()
  } catch (error) {
    next(error as Error)
  }
})

export default mongoose.models.FamilyTreeNode || mongoose.model<IFamilyTreeNode>('FamilyTreeNode', FamilyTreeNodeSchema)

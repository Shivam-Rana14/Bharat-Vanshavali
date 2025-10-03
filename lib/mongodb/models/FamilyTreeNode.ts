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

export default mongoose.models.FamilyTreeNode || mongoose.model<IFamilyTreeNode>('FamilyTreeNode', FamilyTreeNodeSchema)

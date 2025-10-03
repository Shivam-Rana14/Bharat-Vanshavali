import mongoose, { Schema, Document } from 'mongoose'

export interface IFamilyTreeConnection extends Document {
  _id: string
  familyTreeId: any
  sourceNodeId: any // Source FamilyTreeNode ID
  targetNodeId: any // Target FamilyTreeNode ID
  sourceHandle?: string // Handle ID on source node (e.g., 'right-source', 'top-source')
  targetHandle?: string // Handle ID on target node (e.g., 'left-target', 'bottom-target')
  relationshipType: string // e.g., 'parent-child', 'spouse', 'sibling'
  relationshipLabel: string // e.g., 'Father', 'Mother', 'Husband', 'Wife', 'Brother', 'Sister'
  connectionData: {
    color?: string
    style?: 'solid' | 'dashed' | 'dotted'
    thickness?: number
  }
  createdBy: any // User who created this connection
  createdAt: Date
  updatedAt: Date
}

const FamilyTreeConnectionSchema = new Schema<IFamilyTreeConnection>({
  familyTreeId: { type: Schema.Types.ObjectId, ref: 'FamilyTree', required: true },
  sourceNodeId: { type: Schema.Types.ObjectId, ref: 'FamilyTreeNode', required: true },
  targetNodeId: { type: Schema.Types.ObjectId, ref: 'FamilyTreeNode', required: true },
  sourceHandle: { type: String }, // Handle ID on source node
  targetHandle: { type: String }, // Handle ID on target node
  relationshipType: { 
    type: String, 
    required: true,
    enum: [
      'parent-child', 'spouse', 'sibling', 'grandparent-grandchild', 
      'uncle-nephew', 'cousin', 'in-law', 'step-family', 'adopted', 
      'guardian-ward', 'friend', 'business', 'other'
    ]
  },
  relationshipLabel: { type: String, required: true }, // Human readable label
  connectionData: {
    color: { type: String, default: '#666666' },
    style: { type: String, enum: ['solid', 'dashed', 'dotted'], default: 'solid' },
    thickness: { type: Number, default: 2 }
  },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, {
  timestamps: true
})

// Indexes for better performance
FamilyTreeConnectionSchema.index({ familyTreeId: 1 })
FamilyTreeConnectionSchema.index({ sourceNodeId: 1 })
FamilyTreeConnectionSchema.index({ targetNodeId: 1 })
// Allow multiple different relationships between same nodes - only prevent exact duplicates
FamilyTreeConnectionSchema.index({ familyTreeId: 1, sourceNodeId: 1, targetNodeId: 1, relationshipType: 1, relationshipLabel: 1 }, { unique: true })

export default mongoose.models.FamilyTreeConnection || mongoose.model<IFamilyTreeConnection>('FamilyTreeConnection', FamilyTreeConnectionSchema)

import mongoose from 'mongoose'
import connectDB from './connection'
import { User, FamilyTree, FamilyTreeNode, FamilyTreeConnection, FamilyMembersByFamily, Notification, UserReference } from './models'
import ActivityLog from './models/ActivityLog'
import { authService } from '@/lib/auth'
import { generateFamilyCode, generateLoginId } from '@/lib/utils'
import { COLORS, DEFAULTS } from '@/lib/constants'

export interface SignUpData {
  email: string
  password: string
  fullName: string
  phone?: string
  dateOfBirth?: string
  placeOfBirth?: string
  gender?: string
  nativePlace?: string
  caste?: string
  reference1Name?: string
  reference1Phone?: string
  reference2Name?: string
  reference2Phone?: string
  familyCode?: string
  relationship?: string // relationship with root when joining existing family
  aadhaarNumber?: string
  panNumber?: string
}

export const databaseService = {
  // Validation helpers
  async checkEmailExists(email: string): Promise<boolean> {
    await connectDB()
    const user = await User.findOne({ email })
    return !!user
  },

  async checkLoginIdExists(loginId: string): Promise<boolean> {
    await connectDB()
    const user = await User.findOne({ loginId })
    return !!user
  },

  async checkAadhaarExists(aadhaarNumber: string): Promise<boolean> {
    await connectDB()
    const user = await User.findOne({ aadhaarNumber })
    return !!user
  },

  async checkPanExists(panNumber: string): Promise<boolean> {
    await connectDB()
    const user = await User.findOne({ panNumber })
    return !!user
  },

  // Authentication
  async signUp(data: SignUpData) {
    await connectDB()

    // Check if user already exists with email (comprehensive check)
    const existingUserByEmail = await User.findOne({ email: data.email })
    if (existingUserByEmail) {
      throw new Error('User already exists with this email')
    }

    // Hash password
    const hashedPassword = await authService.hashPassword(data.password)

    // Generate unique login ID with retry mechanism
    let loginId: string
    let loginIdAttempts = 0
    const maxLoginIdAttempts = 5

    do {
      loginId = await generateLoginId()
      const existingLoginId = await User.findOne({ loginId })
      if (!existingLoginId) {
        break
      }
      loginIdAttempts++
    } while (loginIdAttempts < maxLoginIdAttempts)

    if (loginIdAttempts >= maxLoginIdAttempts) {
      throw new Error('Unable to generate unique Login ID. Please try again.')
    }

    // Handle family code - use provided one or generate new one
    let familyCode = data.familyCode?.trim()

    // Normalize provided familyCode: trim spaces and convert to uppercase to avoid case mismatches
    if (familyCode) {
      familyCode = familyCode.toUpperCase()

      // Check if the provided family code exists in FamilyTree collection
      const existingTree = await FamilyTree.findOne({ familyCode })
      if (!existingTree) {
        throw new Error('Family code not found. Please check the code or leave empty to create a new family.')
      }

      // For now, we'll allow joining without a relationship since it's set visually in the node-based system
      // The relationship field is optional and mainly for reference
    } else {
      // Generate new family code if none provided
      familyCode = await generateFamilyCode()
    }

    // Create user with try-catch to handle MongoDB duplicate key errors
    try {
      const user = new User({
        email: data.email,
        password: hashedPassword,
        fullName: data.fullName,
        loginId,
        phone: data.phone,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
        placeOfBirth: data.placeOfBirth,
        gender: data.gender,
        nativePlace: data.nativePlace,
        caste: data.caste,
        familyCode,
        aadhaarNumber: data.aadhaarNumber,
        panNumber: data.panNumber
      })

      const savedUser = await user.save()

      // ---------------------------------------------
      // Create FamilyTree + Node (only when we generated a new familyCode)
      // ROOT MEMBER POLICY: Root is set ONLY here when creating new family
      // Root member NEVER changes automatically after this point
      // ---------------------------------------------
      if (!data.familyCode) {
        // Create family tree with the user as root
        const familyTree = await new FamilyTree({
          name: `${data.fullName}'s Family Tree`,
          description: `${data.fullName}'s lineage`,
          rootUserId: savedUser._id, // This user becomes the PERMANENT root/manager
          familyCode: familyCode,
          createdBy: savedUser._id,
          memberCount: 1,
          isActive: true
        }).save()

        // Create the first node for this user at center position
        await new FamilyTreeNode({
          familyTreeId: familyTree._id,
          userId: savedUser._id,
          position: { x: 0, y: 0 }, // Center position
          nodeData: {
            width: 200,
            height: 100,
            color: COLORS.FAMILY_TREE.ROOT_MEMBER, // Light blue for root
            isVisible: true
          }
        }).save()
      } else {
        // ---------------------------------------------
        // Joining existing family → add as unconnected node
        // ---------------------------------------------
        const existingTree = await FamilyTree.findOne({ familyCode })
        if (existingTree) {
          // Add user as an unconnected node (root will connect them later)
          const nodeCount = await FamilyTreeNode.countDocuments({ familyTreeId: existingTree._id })

          await new FamilyTreeNode({
            familyTreeId: existingTree._id,
            userId: savedUser._id,
            position: {
              x: (nodeCount % 5) * 250, // Arrange in a grid pattern
              y: Math.floor(nodeCount / 5) * 150
            },
            nodeData: {
              width: 200,
              height: 100,
              color: COLORS.FAMILY_TREE.REGULAR_MEMBER, // Light orange for new members
              isVisible: true
            }
          }).save()

          // memberCount will be recalculated by updateFamilyMemberArrays (line 204)
        }
      }

      // Add references if provided
      if (data.reference1Name && data.reference1Phone) {
        await new UserReference({
          userId: savedUser._id,
          referenceName: data.reference1Name,
          referencePhone: data.reference1Phone,
          referenceType: 1
        }).save()
      }

      if (data.reference2Name && data.reference2Phone) {
        await new UserReference({
          userId: savedUser._id,
          referenceName: data.reference2Name,
          referencePhone: data.reference2Phone,
          referenceType: 2
        }).save()
      }

      // Update family member arrays
      await this.updateFamilyMemberArrays(familyCode)

      return savedUser
    } catch (error: any) {
      // Handle MongoDB duplicate key errors
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0]
        if (field === 'email') {
          throw new Error('User already exists with this email')
        } else if (field === 'loginId') {
          throw new Error('Login ID already exists. Please try again.')
        } else {
          throw new Error(`Duplicate ${field}. Please use a different value.`)
        }
      }
      throw error
    }
  },

  async signIn(loginId: string, password: string) {
    await connectDB()

    let user
    if (loginId.includes('@')) {
      // Login with email
      user = await User.findOne({ email: loginId })
    } else {
      // Login with loginId or familyCode (backward compatibility)
      user = await User.findOne({
        $or: [
          { loginId: loginId },
          { familyCode: loginId }
        ]
      })
    }

    if (!user) {
      throw new Error('Invalid credentials')
    }

    const isValidPassword = await authService.comparePassword(password, user.password)
    if (!isValidPassword) {
      throw new Error('Invalid credentials')
    }

    return user
  },

  async getUserById(userId: string) {
    await connectDB()
    return User.findById(userId)
  },

  // Family Members
  // REMOVED: getFamilyMembers - use getFamilyMembersWithSmartRelationships instead
  // REMOVED: addFamilyMember - use addFamilyMemberWithRelationship instead
  // REMOVED: deleteFamilyMember - use removeFamilyMember instead

  // Documents - REMOVED (no document uploads in this system)
  // uploadDocument, getUserDocuments, getFamilyMemberDocuments methods removed

  async getFamilyMemberById(memberId: string) {
    await connectDB()

    // In node-based system, memberId is actually a nodeId
    const node = await FamilyTreeNode.findById(memberId)
      .populate('familyTreeId')
      .populate('userId', 'fullName email loginId phone dateOfBirth gender placeOfBirth verificationStatus')
      .lean()

    if (!node) return null

    // Transform node to match expected FamilyMember format for backward compatibility
    const familyTree = (node as any).familyTreeId
    const rootUserId = familyTree?.rootUserId?.toString()
    const nodeData = node as any
    const userData = nodeData.userId as any

    return {
      _id: nodeData._id,
      id: nodeData._id.toString(),
      userId: nodeData.userId,
      familyTreeId: nodeData.familyTreeId,
      fullName: userData?.fullName || 'Unknown',
      relationship: 'member',
      gender: userData?.gender || 'other',
      dateOfBirth: userData?.dateOfBirth,
      placeOfBirth: userData?.placeOfBirth,
      verificationStatus: userData?.verificationStatus || 'pending',
      isRootMember: userData?._id?.toString() === rootUserId,
      joinedAt: nodeData.createdAt,
      createdAt: nodeData.createdAt,
      updatedAt: nodeData.updatedAt
    }
  },

  // Notifications
  async getNotifications(userId: string, unreadOnly = false) {
    await connectDB()

    let query: any = { userId }
    if (unreadOnly) {
      query.read = false
    }

    return Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(50)
  },

  // Create a notification — centralized helper used throughout the app
  async createNotification(data: {
    userId: string
    type: 'verification' | 'member_added' | 'system' | 'family_update'
    title: string
    message: string
    priority?: 'low' | 'medium' | 'high'
  }) {
    await connectDB()
    return new Notification({
      userId: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      priority: data.priority || 'medium'
    }).save()
  },

  // Mark as read = delete from DB (keeps DB clean)
  async markNotificationAsRead(notificationId: string, userId: string) {
    await connectDB()
    return Notification.findOneAndDelete({ _id: notificationId, userId })
  },

  // Mark all as read = delete all for this user (keeps DB clean)
  async markAllNotificationsAsRead(userId: string) {
    await connectDB()
    return Notification.deleteMany({ userId })
  },

  // Admin functions
  async getPendingUsers() {
    await connectDB()

    return User.find({ verificationStatus: 'pending' })
      .select('-password')
      .sort({ createdAt: -1 })
  },

  async getVerifiedUsers() {
    await connectDB()

    return User.find({ verificationStatus: 'verified' })
      .select('-password')
      .sort({ createdAt: -1 })
  },

  async getDashboardStats() {
    await connectDB()

    const [
      totalUsers,
      totalFamilyTrees,
      totalMembers,
      pendingVerifications
    ] = await Promise.all([
      User.countDocuments(),
      FamilyTree.countDocuments(),
      FamilyTreeNode.countDocuments(),
      User.countDocuments({ verificationStatus: 'pending' })
    ])

    return {
      totalMembers: totalMembers,
      totalFamilies: totalFamilyTrees,
      pendingVerifications,
      recentActivities: totalUsers // Placeholder
    }
  },

  async verifyUser(userId: string, adminId: string) {
    await connectDB()

    const user = await User.findByIdAndUpdate(
      userId,
      {
        verificationStatus: 'verified',
        verifiedAt: new Date(),
        verifiedBy: adminId
      },
      { new: true }
    )

    if (!user) {
      throw new Error('User not found')
    }

    // Notify the user
    await this.createNotification({
      userId: user._id.toString(),
      type: 'verification',
      title: '✅ Account Verified',
      message: 'Your account has been verified by an administrator. You now have full access.',
      priority: 'high'
    })

    return user
  },

  async rejectUser(userId: string, adminId: string) {
    await connectDB()

    const user = await User.findByIdAndUpdate(
      userId,
      {
        verificationStatus: 'rejected',
        verifiedAt: new Date(),
        verifiedBy: adminId
      },
      { new: true }
    )

    if (!user) {
      throw new Error('User not found')
    }

    // Notify the user
    await this.createNotification({
      userId: user._id.toString(),
      type: 'verification',
      title: '❌ Verification Rejected',
      message: 'Your account verification has been rejected. Please contact the administrator for more information.',
      priority: 'high'
    })

    return user
  },

  // Family Trees
  async getFamilyTreeByCode(familyCode: string) {
    await connectDB()
    return FamilyTree.findOne({ familyCode })
  },

  // Ensure all users with a family code have corresponding nodes
  async ensureNodesForFamily(familyCode: string) {
    await connectDB()

    console.log(`[ensureNodesForFamily] Starting for family code: ${familyCode}`)

    // Find all users with this family code
    const users = await User.find({ familyCode }).lean()
    console.log(`[ensureNodesForFamily] Found ${users.length} users with family code ${familyCode}`)
    if (users.length === 0) {
      console.log(`[ensureNodesForFamily] No users found, returning`)
      return { success: true, created: 0, cleaned: 0, totalNodes: 0, totalUsers: 0 }
    }

    // Find or create family tree
    let familyTree = await FamilyTree.findOne({ familyCode })
    if (!familyTree) {
      console.log(`[ensureNodesForFamily] No family tree found, creating new one`)
      // Create family tree with first user as root
      const firstUser = users[0]
      familyTree = await new FamilyTree({
        name: `${firstUser.fullName}'s Family Tree`,
        description: `${firstUser.fullName}'s lineage`,
        rootUserId: firstUser._id,
        familyCode: familyCode,
        createdBy: firstUser._id,
        memberCount: users.length,
        isActive: true,
        treeSettings: {
          backgroundColor: COLORS.FAMILY_TREE.BACKGROUND_DEFAULT,
          gridEnabled: true,
          snapToGrid: false,
          zoomLevel: 1,
          centerPosition: { x: 0, y: 0 }
        }
      }).save()
      console.log(`[ensureNodesForFamily] Created family tree with ID: ${familyTree._id}`)
    } else {
      console.log(`[ensureNodesForFamily] Found existing family tree with ID: ${familyTree._id}`)
    }

    // Get existing nodes and clean up duplicates/orphans
    const existingNodes = await FamilyTreeNode.find({ familyTreeId: familyTree._id }).populate('userId')
    console.log(`[ensureNodesForFamily] Found ${existingNodes.length} existing nodes`)

    // Clean up duplicate nodes (keep only one node per user)
    const userNodeMap = new Map()
    const duplicateNodes = []

    for (const node of existingNodes) {
      const userId = node.userId?._id?.toString() || node.userId?.toString()
      if (!userId) {
        // Node with invalid user reference - mark for deletion
        duplicateNodes.push(node._id)
        console.log(`[ensureNodesForFamily] Found orphaned node: ${node._id}`)
        continue
      }

      if (userNodeMap.has(userId)) {
        // Duplicate node - mark for deletion
        duplicateNodes.push(node._id)
        console.log(`[ensureNodesForFamily] Found duplicate node for user ${userId}: ${node._id}`)
      } else {
        userNodeMap.set(userId, node)
      }
    }

    // Delete duplicate and orphaned nodes and their connections
    let cleanedCount = 0
    if (duplicateNodes.length > 0) {
      console.log(`[ensureNodesForFamily] Cleaning up ${duplicateNodes.length} duplicate/orphaned nodes`)

      // Delete all connections for these nodes
      const deletedConnections = await FamilyTreeConnection.deleteMany({
        $or: [
          { sourceNodeId: { $in: duplicateNodes } },
          { targetNodeId: { $in: duplicateNodes } }
        ]
      })
      console.log(`[ensureNodesForFamily] Deleted ${deletedConnections.deletedCount} connections for orphaned nodes`)

      await FamilyTreeNode.deleteMany({ _id: { $in: duplicateNodes } })
      cleanedCount = duplicateNodes.length
    }

    // Ensure each user has exactly one node
    let nodesCreated = 0
    for (let i = 0; i < users.length; i++) {
      const user = users[i]
      console.log(`[ensureNodesForFamily] Checking node for user: ${user.fullName} (${(user as any)._id})`)

      if (!userNodeMap.has((user as any)._id.toString())) {
        console.log(`[ensureNodesForFamily] Creating node for user: ${user.fullName}`)
        await new FamilyTreeNode({
          familyTreeId: familyTree._id,
          userId: (user as any)._id,
          position: {
            x: (i % 5) * 250 + Math.random() * 50, // Add some randomness to prevent overlap
            y: Math.floor(i / 5) * 150 + Math.random() * 50
          },
          nodeData: {
            width: 200,
            height: 100,
            color: familyTree.rootUserId.toString() === (user as any)._id.toString() ? COLORS.FAMILY_TREE.ROOT_MEMBER : COLORS.FAMILY_TREE.REGULAR_MEMBER,
            isVisible: true
          }
        }).save()
        nodesCreated++
      } else {
        console.log(`[ensureNodesForFamily] Node already exists for user: ${user.fullName}`)
      }
    }

    console.log(`[ensureNodesForFamily] Created ${nodesCreated} new nodes, cleaned ${cleanedCount} duplicates`)

    // Update family member arrays
    await this.updateFamilyMemberArrays(familyCode)

    return {
      success: true,
      created: nodesCreated,
      cleaned: cleanedCount,
      totalNodes: userNodeMap.size + nodesCreated,
      totalUsers: users.length
    }
  },

  async createFamilyTree(treeData: any, userId: string) {
    await connectDB()

    const familyTree = new FamilyTree({
      ...treeData,
      createdBy: userId
    })

    return familyTree.save()
  },

  async updateUserFamilyCode(userId: string, familyCode: string) {
    await connectDB()

    return User.findByIdAndUpdate(
      userId,
      { familyCode },
      { new: true }
    )
  },

  // User leaves family tree: remove node, connections & unset familyCode
  async leaveFamily(userId: string) {
    await connectDB()

    // Find user
    const user = await User.findById(userId)
    if (!user) throw new Error('User not found')

    const familyCode = user.familyCode
    if (!familyCode) return { success: true }

    // Find family tree
    const familyTree = await FamilyTree.findOne({ familyCode })
    if (!familyTree) {
      // Unset user's familyCode even if family tree doesn't exist
      user.familyCode = undefined
      await user.save()
      return { success: true }
    }

    // REMOVED: FamilyMember.deleteMany - no longer needed
    // 2. Find and remove the user's node
    const userNode = await FamilyTreeNode.findOne({
      familyTreeId: familyTree._id,
      userId
    })

    if (userNode) {
      const wasRootMember = familyTree.rootUserId.toString() === userId

      // Remove all connections involving this node
      await FamilyTreeConnection.deleteMany({
        $or: [
          { sourceNodeId: userNode._id },
          { targetNodeId: userNode._id }
        ]
      })

      // Remove the node
      await FamilyTreeNode.findByIdAndDelete(userNode._id)

      // memberCount will be recalculated by updateFamilyMemberArrays (line 797)

      // Check if family tree is now empty
      const remainingNodes = await FamilyTreeNode.countDocuments({
        familyTreeId: familyTree._id
      })

      if (remainingNodes === 0) {
        // HARD DELETE: If no nodes left, delete the entire family tree
        await FamilyTree.findByIdAndDelete(familyTree._id)
        await FamilyMembersByFamily.deleteOne({ familyCode })
        console.log(`[leaveFamily] Family tree ${familyTree._id} and arrays deleted as it became empty.`)
      } else if (wasRootMember) {
        // If root member left, assign root to the earliest remaining user
        const earliestNode = await FamilyTreeNode.findOne({
          familyTreeId: familyTree._id
        }).populate('userId').sort({ createdAt: 1 })

        if (earliestNode) {
          await FamilyTree.findByIdAndUpdate(familyTree._id, {
            rootUserId: earliestNode.userId
          })
        }
      }
    }

    // Unset user's familyCode
    user.familyCode = undefined
    await user.save()

    // Update family member arrays for the family they left (if it still exists)
    if (familyCode) {
      const stillExists = await FamilyTree.exists({ _id: familyTree._id })
      if (stillExists) {
        await this.updateFamilyMemberArrays(familyCode)
      }
    }

    return { success: true }
  },

  // Transfer root member status to another family member
  async transferRootMember(currentRootId: string, newRootId: string) {
    await connectDB()

    // 1. Verify current user is root
    const currentRoot = await User.findById(currentRootId)
    if (!currentRoot || !currentRoot.familyCode) throw new Error('Current user not found or not in a family')

    const familyTree = await FamilyTree.findOne({ familyCode: currentRoot.familyCode })
    if (!familyTree) throw new Error('Family tree not found')

    if (familyTree.rootUserId.toString() !== currentRootId) {
      throw new Error('Permission denied. You are not the root member of this family.')
    }

    // 2. Verify new root is in the same family
    const newRoot = await User.findById(newRootId)
    if (!newRoot) throw new Error('New root user not found')

    if (newRoot.familyCode !== currentRoot.familyCode) {
      throw new Error('Target user is not a member of your family')
    }

    // 3. Update FamilyTree rootUserId
    await FamilyTree.findByIdAndUpdate(familyTree._id, {
      rootUserId: newRootId
    })

    // 4. Update FamilyMembersByFamily
    await this.updateFamilyMemberArrays(currentRoot.familyCode)

    // 5. Send notifications
    // To new root
    await new Notification({
      userId: newRootId,
      type: 'family_update',
      title: 'You are now the Root Member',
      message: `You have been appointed as the Root Member of the "${familyTree.name}" family by ${currentRoot.fullName}. You now have full administrative control.`,
      priority: 'high'
    }).save()

    // To old root
    await new Notification({
      userId: currentRootId,
      type: 'family_update',
      title: 'Root Status Transferred',
      message: `You have successfully transferred root status to ${newRoot.fullName}. You are now a regular member.`,
      priority: 'medium'
    }).save()

    // 6. Log activity
    await new ActivityLog({
      action: 'root_transfer',
      performedBy: currentRootId,
      targetUserId: newRootId,
      familyCode: currentRoot.familyCode,
      details: `Root status transferred from ${currentRoot.fullName} to ${newRoot.fullName}`,
      tableName: 'FamilyTree',
      recordId: familyTree._id,
      timestamp: new Date()
    }).save()

    console.log(`[transferRootMember] Root transferred from ${currentRootId} to ${newRootId} for family ${currentRoot.familyCode}`)
    return { success: true }
  },

  async listFamilies() {
    await connectDB()

    const pipeline = [
      {
        $lookup: {
          from: 'familymembers',
          localField: '_id',
          foreignField: 'familyTreeId',
          as: 'members'
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          familyCode: 1,
          memberCount: { $size: '$members' }
        }
      },
      { $sort: { createdAt: -1 } }
    ]

    // @ts-ignore
    return FamilyTree.aggregate(pipeline)
  },

  async getFamilyMembersAdmin(familyCode: string, status?: string) {
    await connectDB()

    const tree = await FamilyTree.findOne({ familyCode })
    if (!tree) throw new Error('Family not found')

    // Get nodes instead of FamilyMembers
    const nodes = await FamilyTreeNode.find({ familyTreeId: tree._id })
      .populate('userId', 'fullName email loginId phone verificationStatus paymentStatus')
      .sort({ createdAt: -1 })
      .lean()

    // Filter by status if provided
    if (status) {
      return nodes.filter((node: any) => node.userId?.verificationStatus === status)
    }
    return nodes
  },

  // REMOVED: updateMemberStatus - use verifyUser or rejectUser instead

  // Root member is ONLY set when creating a new family tree
  // Root member NEVER changes automatically - only manual admin intervention allowed
  // This ensures stable family tree management

  // Manual root member management (for admin use only)
  async setRootMember(familyTreeId: string, newRootUserId: string, adminId: string) {
    await connectDB()

    // Verify admin permissions (you can add admin check here)
    // const admin = await User.findById(adminId)
    // if (!admin || admin.userType !== 'admin') {
    //   throw new Error('Only system admin can change root member')
    // }

    const familyTree = await FamilyTree.findById(familyTreeId)
    if (!familyTree) throw new Error('Family tree not found')

    const newRootUser = await User.findById(newRootUserId)
    if (!newRootUser) throw new Error('New root user not found')

    // Verify the user is part of this family
    if (newRootUser.familyCode !== familyTree.familyCode) {
      throw new Error('User is not part of this family')
    }

    // Update the root member
    await FamilyTree.findByIdAndUpdate(familyTreeId, {
      rootUserId: newRootUserId
    })

    console.log(`Root member changed from ${familyTree.rootUserId} to ${newRootUserId} by admin ${adminId}`)
    return { success: true, message: 'Root member updated successfully' }
  },

  async addFamilyMemberWithRelationship(memberData: any, userId: string, targetMemberId?: string) {
    await connectDB()
    const session = await mongoose.startSession()
    session.startTransaction()

    try {
      const familyTree = await FamilyTree.findById(memberData.familyTreeId).session(session)
      if (!familyTree) throw new Error('Family tree not found')

      // 1. Generate Login ID
      let loginId: string
      let loginIdAttempts = 0
      const maxLoginIdAttempts = 5

      do {
        loginId = await generateLoginId()
        const existingLoginId = await User.findOne({ loginId }).session(session)
        if (!existingLoginId) break
        loginIdAttempts++
      } while (loginIdAttempts < maxLoginIdAttempts)

      if (loginIdAttempts >= maxLoginIdAttempts) {
        throw new Error('Unable to generate unique Login ID.')
      }

      // 2. Create Placeholder User
      const newUser = new User({
        fullName: memberData.fullName,
        loginId: loginId,
        userType: 'citizen',
        familyCode: familyTree.familyCode,
        verificationStatus: 'pending',
        dateOfBirth: memberData.dateOfBirth,
        placeOfBirth: memberData.placeOfBirth,
        gender: memberData.gender,
        nativePlace: memberData.nativePlace,
        caste: memberData.caste,
        aadhaarNumber: memberData.aadhaarNumber,
        panNumber: memberData.panNumber,
        isPlaceholder: true,
        managedBy: userId,
        occupation: memberData.occupation,
        bio: memberData.bio,
      })

      const savedUser = await newUser.save({ session })

      // Create a node
      let position = { x: 0, y: 0 }
      if (targetMemberId) {
        const nodeCount = await FamilyTreeNode.countDocuments({ familyTreeId: familyTree._id }).session(session)
        position = {
          x: (nodeCount % 5) * 250 + (Math.random() * 40 - 20),
          y: Math.floor(nodeCount / 5) * 150 + 100 + (Math.random() * 40 - 20)
        }
      }

      const savedNode = await new FamilyTreeNode({
        familyTreeId: familyTree._id,
        userId: savedUser._id,
        position,
        nodeData: {
          width: 200,
          height: 100,
          color: COLORS.FAMILY_TREE.REGULAR_MEMBER,
          isVisible: true
        }
      }).save({ session })

      // Create connection
      if (targetMemberId) {
        const targetNode = await FamilyTreeNode.findOne({ familyTreeId: familyTree._id, userId: targetMemberId }).session(session)
        if (targetNode) {
          await new FamilyTreeConnection({
            familyTreeId: familyTree._id,
            sourceNodeId: targetNode._id,
            targetNodeId: savedNode._id,
            relationshipType: 'other',
            relationshipLabel: memberData.relationship || 'Family Member',
            sourceHandle: 'bottom-source',
            targetHandle: 'top-target',
            createdBy: userId || familyTree.rootUserId
          }).save({ session })
        }
      }

      await session.commitTransaction()

      // Post-transaction non-critical updates
      await this.updateFamilyMemberArrays(familyTree.familyCode)

      if (memberData.reference1Name && memberData.reference1Mobile) {
        await new UserReference({
          userId: savedUser._id,
          referenceName: memberData.reference1Name,
          referencePhone: memberData.reference1Mobile,
          referenceType: 1
        }).save()
      }

      if (memberData.reference2Name && memberData.reference2Mobile) {
        await new UserReference({
          userId: savedUser._id,
          referenceName: memberData.reference2Name,
          referencePhone: memberData.reference2Mobile,
          referenceType: 2
        }).save()
      }

      if (familyTree.createdBy.toString() !== userId) {
        await new Notification({
          userId: familyTree.createdBy,
          type: 'member_added',
          title: 'New Family Member Added',
          message: `A new family member "${memberData.fullName}" has been added to your family tree`,
          priority: 'medium'
        }).save()
      }

      return { success: true, user: savedUser }
    } catch (error) {
      await session.abortTransaction()
      throw error
    } finally {
      session.endSession()
    }
  },

  async removeFamilyMember(memberId: string, userId: string) {
    await connectDB()

    // In node-based system, memberId is actually a nodeId
    const node = await FamilyTreeNode.findById(memberId).populate('userId')
    if (!node) throw new Error('Family member not found')

    const familyTree = await FamilyTree.findById(node.familyTreeId)
    if (!familyTree) throw new Error('Family tree not found')

    // Check permissions
    const isRootMember = familyTree.rootUserId.toString() === userId
    const isFamilyCreator = familyTree.createdBy.toString() === userId
    const isSystemAdmin = false // TODO: Add system admin check

    if (!isRootMember && !isFamilyCreator && !isSystemAdmin) {
      throw new Error('Permission denied. Only root members, family creators, or system admins can remove members.')
    }

    const nodeUserId = (node.userId as any)._id || node.userId
    const familyCode = familyTree.familyCode

    // REMOVED: FamilyMember.deleteMany - no longer needed

    // 2. Remove all connections involving this node
    await FamilyTreeConnection.deleteMany({
      $or: [
        { sourceNodeId: node._id },
        { targetNodeId: node._id }
      ]
    })

    // 3. Remove the node
    await FamilyTreeNode.findByIdAndDelete(memberId)

    // 4. Unset User.familyCode (remove from family but keep user account)
    await User.findByIdAndUpdate(nodeUserId, {
      $unset: { familyCode: "" }
    })

    // 5. Check if family becomes empty
    const remainingNodes = await FamilyTreeNode.countDocuments({
      familyTreeId: familyTree._id
    })

    if (remainingNodes === 0) {
      // Delete family tree and related data
      await FamilyTree.findByIdAndDelete(familyTree._id)
      await FamilyMembersByFamily.deleteOne({ familyCode })
      console.log(`[removeFamilyMember] Family tree ${familyTree._id} deleted as it became empty.`)
    } else {
      // 6. Update family member arrays
      await this.updateFamilyMemberArrays(familyCode)
    }

    return { success: true }
  },

  async getFamilyMembersWithSmartRelationships(familyTreeId: string) {
    await connectDB()

    // Get nodes instead of FamilyMembers
    const nodes = await FamilyTreeNode.find({ familyTreeId })
      .populate('userId', 'fullName email loginId phone dateOfBirth gender placeOfBirth verificationStatus occupation bio fatherName motherName spouseName isPlaceholder managedBy')
      .sort({ createdAt: 1 })
      .lean()

    // Get family tree to determine root user
    const familyTree = await FamilyTree.findById(familyTreeId).lean() as any
    const rootUserId = familyTree?.rootUserId?.toString()

    // Transform nodes to match the expected FamilyMember format for backward compatibility
    return nodes.map((node: any) => ({
      _id: node._id,
      id: node._id.toString(),
      userId: node.userId,
      familyTreeId: node.familyTreeId,
      fullName: node.userId?.fullName || 'Unknown',
      relationship: 'member', // Generic relationship since relationships are now connections
      displayRelationship: 'Family Member',
      gender: node.userId?.gender || 'other',
      dateOfBirth: node.userId?.dateOfBirth,
      placeOfBirth: node.userId?.placeOfBirth,
      verificationStatus: node.userId?.verificationStatus || 'pending',
      isRootMember: node.userId?._id?.toString() === rootUserId,
      isRoot: node.userId?._id?.toString() === rootUserId,
      joinedAt: node.createdAt,
      createdAt: node.createdAt,
      updatedAt: node.updatedAt
    }))
  },

  async getFamilyMembersForSelection(familyTreeId: string) {
    await connectDB()

    // Get nodes instead of FamilyMembers
    const nodes = await FamilyTreeNode.find({ familyTreeId })
      .populate('userId', 'fullName verificationStatus')
      .sort({ createdAt: 1 })
      .lean()

    // Get family tree to determine root user
    const familyTree = await FamilyTree.findById(familyTreeId).lean() as any
    const rootUserId = familyTree?.rootUserId?.toString()

    // Filter out rejected users and transform for selection
    return nodes
      .filter((node: any) => node.userId?.verificationStatus !== 'rejected')
      .map((node: any) => ({
        _id: node._id,
        fullName: node.userId?.fullName || 'Unknown',
        relationship: 'member', // Generic since relationships are now connections
        isRootMember: node.userId?._id?.toString() === rootUserId
      }))
      .sort((a: any, b: any) => {
        // Sort root member first, then by name
        if (a.isRootMember && !b.isRootMember) return -1
        if (!a.isRootMember && b.isRootMember) return 1
        return a.fullName.localeCompare(b.fullName)
      })
  },

  async updateUserDataInFamilyMembers(userId: string, updateData: any) {
    await connectDB()

    // Deprecated: FamilyMember is now a link table. User data is stored in User model.
    // We don't need to sync data to FamilyMember anymore.
    return { success: true }

    return { success: true }
  },

  // Node-based Family Tree Methods
  async getFamilyTreeNodes(familyTreeId: string) {
    await connectDB()

    console.log(`[getFamilyTreeNodes] Fetching nodes for family tree ID: ${familyTreeId}`)
    const nodes = await FamilyTreeNode.find({ familyTreeId })
      .populate('userId', 'fullName loginId dateOfBirth verificationStatus paymentStatus')
      .lean()
    console.log(`[getFamilyTreeNodes] Found ${nodes.length} nodes`)
    return nodes
  },

  async getFamilyTreeConnections(familyTreeId: string) {
    await connectDB()

    return FamilyTreeConnection.find({ familyTreeId })
      .populate('sourceNodeId', '_id userId position nodeData')
      .populate('targetNodeId', '_id userId position nodeData')
      .lean()
  },

  async updateNodePosition(nodeId: string, position: { x: number; y: number }, userId: string) {
    await connectDB()

    const node = await FamilyTreeNode.findById(nodeId).populate('familyTreeId')
    if (!node) throw new Error('Node not found')

    // Check if user is root member
    const familyTree = node.familyTreeId as any
    if (familyTree.rootUserId.toString() !== userId) {
      throw new Error('Only root member can move nodes')
    }

    return FamilyTreeNode.findByIdAndUpdate(
      nodeId,
      { position },
      { new: true }
    )
  },

  async createConnection(connectionData: {
    familyTreeId: string
    sourceNodeId: string
    targetNodeId: string
    sourceHandle?: string
    targetHandle?: string
    relationshipType: string
    relationshipLabel: string
  }, userId: string) {
    await connectDB()

    console.log('Database createConnection called with:', {
      ...connectionData,
      userId
    })

    // Check if user is root member
    const familyTree = await FamilyTree.findById(connectionData.familyTreeId)
    if (!familyTree || familyTree.rootUserId.toString() !== userId) {
      throw new Error('Only root member can create connections')
    }

    // Allow multiple connections between nodes with different relationship types/labels
    // This supports all cardinalities: 1:1, 1:M, M:1, M:M, and 0 (no connections)
    // Only prevent exact duplicate relationships (same type AND label between same nodes in same direction)
    const duplicateConnection = await FamilyTreeConnection.findOne({
      familyTreeId: connectionData.familyTreeId,
      sourceNodeId: connectionData.sourceNodeId,
      targetNodeId: connectionData.targetNodeId,
      relationshipType: connectionData.relationshipType,
      relationshipLabel: connectionData.relationshipLabel
    })

    if (duplicateConnection) {
      throw new Error(`"${connectionData.relationshipLabel}" relationship already exists between these nodes`)
    }

    const connection = new FamilyTreeConnection({
      ...connectionData,
      createdBy: userId
    })

    return connection.save()
  },

  async updateConnection(connectionId: string, updateData: { relationshipType: string, relationshipLabel: string }, userId: string) {
    await connectDB()

    try {
      const connection = await FamilyTreeConnection.findById(connectionId).populate('familyTreeId')
      if (!connection) throw new Error('Connection not found')

      // Check if user is root member
      const familyTree = connection.familyTreeId as any
      if (!familyTree) throw new Error('Family tree not found')

      if (familyTree.rootUserId.toString() !== userId) {
        throw new Error('Only root member can update connections')
      }

      // Validate relationship type
      const validTypes = [
        'parent-child', 'spouse', 'sibling', 'grandparent-grandchild',
        'uncle-nephew', 'cousin', 'in-law', 'step-family', 'adopted',
        'guardian-ward', 'friend', 'business', 'other'
      ]

      if (!validTypes.includes(updateData.relationshipType)) {
        throw new Error(`Invalid relationship type: ${updateData.relationshipType}`)
      }

      return await FamilyTreeConnection.findByIdAndUpdate(
        connectionId,
        {
          relationshipType: updateData.relationshipType,
          relationshipLabel: updateData.relationshipLabel
        },
        { new: true }
      )
    } catch (error) {
      console.error('Error in updateConnection:', error)
      throw error
    }
  },

  async deleteConnection(connectionId: string, userId: string) {
    await connectDB()

    const connection = await FamilyTreeConnection.findById(connectionId).populate('familyTreeId')
    if (!connection) throw new Error('Connection not found')

    // Check if user is root member
    const familyTree = connection.familyTreeId as any
    if (familyTree.rootUserId.toString() !== userId) {
      throw new Error('Only root member can delete connections')
    }

    return FamilyTreeConnection.findByIdAndDelete(connectionId)
  },

  async deleteNodeWithConnections(nodeId: string, userId: string) {
    await connectDB()

    try {
      // Get the node to verify permissions
      const node = await FamilyTreeNode.findById(nodeId).populate('familyTreeId')
      if (!node) throw new Error('Node not found')

      const familyTree = (node as any).familyTreeId
      if (familyTree.rootUserId.toString() !== userId) {
        throw new Error('Only root member can delete nodes')
      }

      // Delete all connections involving this node
      const deletedConnections = await FamilyTreeConnection.deleteMany({
        $or: [
          { sourceNodeId: nodeId },
          { targetNodeId: nodeId }
        ]
      })

      // Delete the node itself
      await FamilyTreeNode.findByIdAndDelete(nodeId)

      console.log(`Deleted node ${nodeId} and ${deletedConnections.deletedCount} associated connections`)

      return {
        success: true,
        deletedConnections: deletedConnections.deletedCount
      }
    } catch (error) {
      console.error('Error deleting node with connections:', error)
      throw error
    }
  },

  async saveFamilyTreeLayout(familyTreeId: string, nodes: any[], connections: any[], userId: string) {
    await connectDB()

    // Check if user is root member
    const familyTree = await FamilyTree.findById(familyTreeId)
    if (!familyTree || familyTree.rootUserId.toString() !== userId) {
      throw new Error('Only root member can save tree layout')
    }

    // UNLIMITED EDITING: Root member can save layout as many times as needed
    // No restrictions on number of saves or edits
    // Update node positions and data
    const nodeUpdates = nodes.map(node =>
      FamilyTreeNode.findByIdAndUpdate(
        node.id,
        {
          position: node.position,
          nodeData: node.data
        }
      )
    )

    await Promise.all(nodeUpdates)

    // Note: Connections are managed separately through createConnection/deleteConnection
    return { success: true }
  },

  async isUserRootOfFamily(userId: string, familyTreeId: string): Promise<boolean> {
    await connectDB()

    const familyTree = await FamilyTree.findById(familyTreeId)
    return familyTree?.rootUserId.toString() === userId
  },

  // Helper method
  capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
  },

  // Methods to maintain family member arrays
  async updateFamilyMemberArrays(familyCode: string) {
    await connectDB()

    try {
      // Get family tree
      const familyTree = await FamilyTree.findOne({ familyCode }).lean() as any
      if (!familyTree) return

      // Get all users in this family
      const users = await User.find({ familyCode }).lean()

      // Get all nodes for position data
      const nodes = await FamilyTreeNode.find({ familyTreeId: familyTree._id })
        .populate('userId', 'fullName email loginId phone dateOfBirth gender placeOfBirth verificationStatus')
        .lean()



      // Calculate statistics
      const stats = {
        totalMembers: users.length,
        verifiedMembers: users.filter((u: any) => u.verificationStatus === 'verified').length,
        pendingMembers: users.filter((u: any) => u.verificationStatus === 'pending').length,
        maleMembers: users.filter((u: any) => u.gender === 'male').length,
        femaleMembers: users.filter((u: any) => u.gender === 'female').length,
        otherMembers: users.filter((u: any) => u.gender === 'other').length
      }

      // Update FamilyTree member count
      await FamilyTree.findByIdAndUpdate(familyTree._id, {
        memberCount: users.length
      })

      // Update or create FamilyMembersByFamily document
      await FamilyMembersByFamily.findOneAndUpdate(
        { familyCode },
        {
          familyCode,
          familyTreeId: familyTree._id,
          familyName: familyTree.name,
          rootUserId: familyTree.rootUserId,
          memberUserIds: users.map((u: any) => u._id),
          stats,
          lastUpdated: new Date()
        },
        { upsert: true, new: true }
      )

      return { success: true, memberCount: users.length }
    } catch (error) {
      console.error('Error updating family member arrays:', error)
      throw error
    }
  },

  async getFamilyMemberArrays(familyCode: string) {
    await connectDB()

    const familyMembersDoc = await FamilyMembersByFamily.findOne({ familyCode })
      .populate('memberUserIds', 'fullName email loginId verificationStatus')
      .lean()

    return familyMembersDoc
  },

  // ============================================================================
  // DATA VALIDATION & INTEGRITY
  // ============================================================================

  /**
   * Validate and fix data integrity issues for families
   * This function is designed to be run manually by admins
   * @param familyCode - Optional family code to validate specific family, or undefined for all families
   * @returns Object with issues found and fixes applied
   */
  async validateAndFixFamilyData(familyCode?: string) {
    await connectDB()

    const issues: any[] = []
    const fixes: string[] = []

    // Get families to validate
    const families = familyCode
      ? [await FamilyTree.findOne({ familyCode })]
      : await FamilyTree.find({})

    console.log(`[VALIDATION] Starting validation for ${families.length} families...`)

    for (const family of families) {
      if (!family) continue

      console.log(`[VALIDATION] Checking family ${family.familyCode}...`)

      // 1. Check memberCount accuracy
      const actualUserCount = await User.countDocuments({ familyCode: family.familyCode })
      if (family.memberCount !== actualUserCount) {
        issues.push({
          family: family.familyCode,
          issue: 'memberCount mismatch',
          expected: actualUserCount,
          actual: family.memberCount,
          severity: 'high'
        })

        // Fix it
        await this.updateFamilyMemberArrays(family.familyCode)
        fixes.push(`Fixed memberCount for ${family.familyCode} (was ${family.memberCount}, now ${actualUserCount})`)
      }

      // 2. Check for orphaned nodes (nodes without users)
      const nodes = await FamilyTreeNode.find({ familyTreeId: family._id })
      for (const node of nodes) {
        const userExists = await User.exists({ _id: node.userId })
        if (!userExists) {
          issues.push({
            family: family.familyCode,
            issue: 'orphaned node',
            nodeId: node._id.toString(),
            userId: node.userId.toString(),
            severity: 'high'
          })

          // Fix it - delete orphaned node
          await FamilyTreeNode.findByIdAndDelete(node._id)
          // Delete connections involving this node
          await FamilyTreeConnection.deleteMany({
            $or: [
              { sourceNodeId: node._id },
              { targetNodeId: node._id }
            ]
          })
          fixes.push(`Deleted orphaned node ${node._id} for non-existent user ${node.userId}`)
        }
      }

      // 3. Check for duplicate nodes (same user, same family)
      const nodeUserIds = nodes.map(n => n.userId.toString())
      const duplicateUserIds = nodeUserIds.filter((id, index) => nodeUserIds.indexOf(id) !== index)
      const uniqueDuplicates = [...new Set(duplicateUserIds)]

      if (uniqueDuplicates.length > 0) {
        issues.push({
          family: family.familyCode,
          issue: 'duplicate nodes',
          userIds: uniqueDuplicates,
          severity: 'medium'
        })

        // Fix it - keep first, delete rest
        for (const userId of uniqueDuplicates) {
          const dupeNodes = await FamilyTreeNode.find({
            familyTreeId: family._id,
            userId
          }).sort({ createdAt: 1 })

          for (let i = 1; i < dupeNodes.length; i++) {
            await FamilyTreeNode.findByIdAndDelete(dupeNodes[i]._id)
            fixes.push(`Deleted duplicate node ${dupeNodes[i]._id} for user ${userId}`)
          }
        }
      }

      // 4. Check for users with familyCode but no node
      const users = await User.find({ familyCode: family.familyCode })
      for (const user of users) {
        const nodeExists = await FamilyTreeNode.exists({
          familyTreeId: family._id,
          userId: user._id
        })

        if (!nodeExists) {
          issues.push({
            family: family.familyCode,
            issue: 'missing node',
            userId: user._id.toString(),
            userName: user.fullName,
            severity: 'high'
          })

          // Fix it - create node
          await new FamilyTreeNode({
            familyTreeId: family._id,
            userId: user._id,
            position: { x: 0, y: 0 },
            nodeData: {
              width: 200,
              height: 100,
              color: '#ffffff',
              isVisible: true
            }
          }).save()
          fixes.push(`Created missing node for user ${user.fullName} (${user._id})`)
        }
      }

      // 5. Check for orphaned FamilyMembersByFamily
      const arrayDoc = await FamilyMembersByFamily.findOne({ familyCode: family.familyCode })
      if (arrayDoc) {
        const familyExists = await FamilyTree.exists({ familyCode: family.familyCode })
        if (!familyExists) {
          issues.push({
            family: family.familyCode,
            issue: 'orphaned FamilyMembersByFamily',
            severity: 'medium'
          })

          // Fix it
          await FamilyMembersByFamily.deleteOne({ familyCode: family.familyCode })
          fixes.push(`Deleted orphaned FamilyMembersByFamily for ${family.familyCode}`)
        }
      }

      // 6. Check root member validity
      if (family.rootUserId) {
        const rootExists = await User.exists({ _id: family.rootUserId })
        if (!rootExists) {
          issues.push({
            family: family.familyCode,
            issue: 'invalid root member',
            rootUserId: family.rootUserId.toString(),
            severity: 'critical'
          })

          // Fix it - assign to earliest member
          const earliestNode = await FamilyTreeNode.findOne({
            familyTreeId: family._id
          }).populate('userId').sort({ createdAt: 1 })

          if (earliestNode) {
            await FamilyTree.findByIdAndUpdate(family._id, {
              rootUserId: earliestNode.userId
            })
            const newRoot = earliestNode.userId as any
            fixes.push(`Reassigned root member for ${family.familyCode} to ${newRoot.fullName}`)
          } else {
            // No members left - delete family
            await FamilyTree.findByIdAndDelete(family._id)
            await FamilyMembersByFamily.deleteOne({ familyCode: family.familyCode })
            fixes.push(`Deleted empty family ${family.familyCode} with invalid root`)
          }
        }
      }

      // 7. Check for broken connections (connections pointing to non-existent nodes)
      const connections = await FamilyTreeConnection.find({ familyTreeId: family._id })
      for (const conn of connections) {
        const sourceExists = await FamilyTreeNode.exists({ _id: conn.sourceNodeId })
        const targetExists = await FamilyTreeNode.exists({ _id: conn.targetNodeId })

        if (!sourceExists || !targetExists) {
          issues.push({
            family: family.familyCode,
            issue: 'broken connection',
            connectionId: conn._id.toString(),
            sourceExists,
            targetExists,
            severity: 'medium'
          })

          // Fix it - delete broken connection
          await FamilyTreeConnection.findByIdAndDelete(conn._id)
          fixes.push(`Deleted broken connection ${conn._id}`)
        }
      }
    }

    // Log summary
    console.log(`[VALIDATION] Validation complete!`)
    console.log(`[VALIDATION] Issues found: ${issues.length}`)
    console.log(`[VALIDATION] Fixes applied: ${fixes.length}`)

    return {
      success: true,
      issuesFound: issues.length,
      issuesFixed: fixes.length,
      issues,
      fixes,
      summary: {
        familiesChecked: families.filter(f => f !== null).length,
        criticalIssues: issues.filter(i => i.severity === 'critical').length,
        highIssues: issues.filter(i => i.severity === 'high').length,
        mediumIssues: issues.filter(i => i.severity === 'medium').length
      }
    }
  },

  async getAllFamiliesWithMembers() {
    await connectDB()

    return FamilyMembersByFamily.find({})
      .populate('rootUserId', 'fullName email loginId')
      .sort({ 'stats.totalMembers': -1 })
      .lean()
  },

  // Update family member details (for root member edit functionality)
  async updateFamilyMemberDetails(userId: string, updateData: any) {
    await connectDB()

    // Define allowed fields for update
    const allowedFields = [
      'fullName', 'dateOfBirth', 'placeOfBirth', 'gender',
      'nativePlace', 'caste', 'occupation', 'bio',
      'fatherName', 'motherName', 'grandfatherName', 'spouseName',
      'aadhaarNumber', 'panNumber'
    ]

    // Enum fields that cannot be empty strings (Mongoose validation would fail)
    const enumFields = ['gender']

    const setData: any = {}
    const unsetData: any = {}

    allowedFields.forEach(field => {
      const value = updateData[field]
      if (value === undefined) return // not included in request — skip

      if (value === '' || value === null) {
        // Empty/null: unset the field rather than storing invalid empty string
        unsetData[field] = ''
      } else if (enumFields.includes(field)) {
        // Enum field with a real value — set it
        setData[field] = value
      } else {
        setData[field] = value
      }
    })

    // Convert dateOfBirth to Date if provided
    if (setData.dateOfBirth) {
      setData.dateOfBirth = new Date(setData.dateOfBirth)
    }

    // Build the update operation
    const updateOp: any = {}
    if (Object.keys(setData).length > 0) updateOp.$set = setData
    if (Object.keys(unsetData).length > 0) updateOp.$unset = unsetData

    if (Object.keys(updateOp).length === 0) {
      // Nothing to update — just return current user
      const currentUser = await User.findById(userId).select('-password')
      if (!currentUser) throw new Error('User not found')
      return currentUser
    }

    // Update user (no runValidators on $unset to avoid enum errors on cleared fields)
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateOp,
      { new: true, runValidators: false }
    ).select('-password')

    if (!updatedUser) {
      throw new Error('User not found')
    }

    // Update family member arrays to reflect changes
    if (updatedUser.familyCode) {
      await this.updateFamilyMemberArrays(updatedUser.familyCode)
    }

    return updatedUser
  }
}

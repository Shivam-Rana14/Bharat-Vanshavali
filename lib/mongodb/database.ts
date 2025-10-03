import connectDB from './connection'
import { User, FamilyTree, FamilyMember, FamilyTreeNode, FamilyTreeConnection, FamilyMembersByFamily, Document, Notification, UserReference } from './models'
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
  selfieFile?: File | Blob | null
  location?: { lat: number; lng: number } | null
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
        signupLatitude: data.location?.lat,
        signupLongitude: data.location?.lng
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

          // Update family tree member count
          await FamilyTree.findByIdAndUpdate(existingTree._id, {
            $inc: { memberCount: 1 }
          })
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
  async getFamilyMembers(familyTreeId: string) {
    await connectDB()
    return FamilyMember.find({ familyTreeId })
      .populate('userId', 'fullName email loginId phone')
      .populate('spouseId', 'fullName')
      .populate('fatherId', 'fullName')
      .populate('motherId', 'fullName')
      .sort({ createdAt: -1 })
      .lean()
  },

  async addFamilyMember(memberData: any, userId: string) {
    await connectDB()
    
    const member = new FamilyMember({
      ...memberData,
      createdBy: userId
    })

    const savedMember = await member.save()
    
    // Create notification for family tree owner
    const familyTree = await FamilyTree.findById(memberData.familyTreeId)
    if (familyTree && familyTree.createdBy.toString() !== userId) {
      await new Notification({
        userId: familyTree.createdBy,
        type: 'member_added',
        title: 'New Family Member Added',
        message: `A new family member "${memberData.fullName}" has been added to your family tree`,
        priority: 'medium'
      }).save()
    }

    return savedMember
  },

  async updateFamilyMember(memberId: string, updateData: any, userId: string) {
    await connectDB()
    
    // In node-based system, memberId is actually a nodeId
    const node = await FamilyTreeNode.findById(memberId).populate('userId')
    if (!node) {
      throw new Error('Family member not found')
    }

    // Update the user data (since most family member data is now stored in User model)
    const userUpdateData: any = {}
    if (updateData.fullName) userUpdateData.fullName = updateData.fullName
    if (updateData.dateOfBirth) userUpdateData.dateOfBirth = updateData.dateOfBirth
    if (updateData.placeOfBirth) userUpdateData.placeOfBirth = updateData.placeOfBirth
    if (updateData.gender) userUpdateData.gender = updateData.gender
    if (updateData.phone) userUpdateData.phone = updateData.phone

    if (Object.keys(userUpdateData).length > 0) {
      await User.findByIdAndUpdate(node.userId, userUpdateData)
    }

    // Update node data if needed (position, color, etc.)
    const nodeUpdateData: any = {}
    if (updateData.nodeData) nodeUpdateData.nodeData = updateData.nodeData

    if (Object.keys(nodeUpdateData).length > 0) {
      await FamilyTreeNode.findByIdAndUpdate(memberId, nodeUpdateData)
    }

    // Return updated node in expected format
    return this.getFamilyMemberById(memberId)
  },

  async deleteFamilyMember(memberId: string, userId: string) {
    await connectDB()
    
    const member = await FamilyMember.findById(memberId)
    if (!member) {
      throw new Error('Family member not found')
    }

    // Check if user has permission to delete
    const familyTree = await FamilyTree.findById(member.familyTreeId)
    if (!familyTree || familyTree.createdBy.toString() !== userId) {
      throw new Error('Permission denied')
    }

    await FamilyMember.findByIdAndDelete(memberId)
    return { success: true }
  },

  async searchFamilyMembers(familyTreeId: string, filters: any) {
    await connectDB()
    
    let query: any = { familyTreeId }

    if (filters.userId) {
      query.userId = filters.userId
    }
    if (filters.query) {
      query.fullName = { $regex: filters.query, $options: 'i' }
    }
    if (filters.relationship) {
      query.relationship = filters.relationship
    }
    if (filters.gender) {
      query.gender = filters.gender
    }
    if (filters.location) {
      query.$or = [
        { placeOfBirth: { $regex: filters.location, $options: 'i' } },
        { placeOfDeath: { $regex: filters.location, $options: 'i' } }
      ]
    }

    return FamilyMember.find(query)
      .populate('userId', 'fullName email')
      .sort({ fullName: 1 })
      .limit(50)
  },

  // Documents
  async uploadDocument(documentData: any, userId: string) {
    await connectDB()
    
    const document = new Document({
      ...documentData,
      uploadedBy: userId
    })

    return document.save()
  },

  async getUserDocuments(userId: string) {
    await connectDB()
    
    return Document.find({ uploadedBy: userId })
      .sort({ createdAt: -1 })
      .lean()
  },

  async getFamilyMemberDocuments(familyMemberId: string) {
    await connectDB()
    
    return Document.find({ familyMemberId })
      .sort({ createdAt: -1 })
      .lean()
  },

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

  async markNotificationAsRead(notificationId: string, userId: string) {
    await connectDB()
    
    return Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { read: true, readAt: new Date() },
      { new: true }
    )
  },

  async markAllNotificationsAsRead(userId: string) {
    await connectDB()
    
    return Notification.updateMany(
      { userId, read: false },
      { read: true, readAt: new Date() }
    )
  },

  // Admin functions
  async getPendingUsers() {
    await connectDB()
    
    return User.find({ verificationStatus: 'pending' })
      .select('-password')
      .sort({ createdAt: -1 })
  },

  async getDashboardStats() {
    await connectDB()
    
    const [
      totalUsers,
      totalFamilyTrees,
      totalMembers,
      pendingVerifications,
      totalDocuments
    ] = await Promise.all([
      User.countDocuments(),
      FamilyTree.countDocuments(),
      FamilyMember.countDocuments(),
      User.countDocuments({ verificationStatus: 'pending' }),
      Document.countDocuments()
    ])

    return {
      totalMembers: totalMembers,
      totalFamilies: totalFamilyTrees,
      pendingVerifications,
      recentActivities: totalUsers, // Placeholder
      documentsUploaded: totalDocuments
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

    // Create notification
    await new Notification({
      userId: user._id,
      type: 'verification',
      title: 'Account Verified',
      message: 'Your account has been verified by an administrator',
      priority: 'high'
    }).save()

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

    // Create notification
    await new Notification({
      userId: user._id,
      type: 'verification',
      title: 'Account Verification Rejected',
      message: 'Your account verification has been rejected. Please contact support for more information.',
      priority: 'high'
    }).save()

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
      console.log(`[ensureNodesForFamily] Checking node for user: ${user.fullName} (${user._id})`)
      
      if (!userNodeMap.has(user._id.toString())) {
        console.log(`[ensureNodesForFamily] Creating node for user: ${user.fullName}`)
        await new FamilyTreeNode({
          familyTreeId: familyTree._id,
          userId: user._id,
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

    // Find the user's node
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

      // Update family tree member count
      await FamilyTree.findByIdAndUpdate(familyTree._id, {
        $inc: { memberCount: -1 }
      })

      // Check if family tree should be marked as inactive
      const remainingNodes = await FamilyTreeNode.countDocuments({
        familyTreeId: familyTree._id
      })

      if (remainingNodes === 0) {
        await FamilyTree.findByIdAndUpdate(familyTree._id, {
          isActive: false,
          memberCount: 0,
          rootUserId: null
        })
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

    // Update family member arrays for the family they left
    if (familyCode) {
      await this.updateFamilyMemberArrays(familyCode)
    }

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

    const query: any = { familyTreeId: tree._id }
    if (status) query.verificationStatus = status

    return FamilyMember.find(query)
      .populate('userId', 'fullName email loginId phone')
      .sort({ createdAt: -1 })
  },

  async updateMemberStatus(memberId: string, status: 'pending' | 'verified' | 'rejected', adminId: string) {
    await connectDB()

    const member = await FamilyMember.findByIdAndUpdate(
      memberId,
      {
        verificationStatus: status,
        verifiedBy: adminId,
        verifiedAt: new Date()
      },
      { new: true }
    )

    if (!member) throw new Error('Member not found')

    return member
  },

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
    
    const familyTree = await FamilyTree.findById(memberData.familyTreeId)
    if (!familyTree) throw new Error('Family tree not found')

    // If targetMemberId is provided, create smart relationship
    let relationshipToTarget = memberData.relationship
    if (targetMemberId) {
      const targetMember = await FamilyMember.findById(targetMemberId)
      if (targetMember) {
        relationshipToTarget = `${this.capitalizeFirst(memberData.relationship)} of ${targetMember.fullName}`
      }
    }

    const member = new FamilyMember({
      ...memberData,
      relationshipToTarget,
      targetMemberId,
      isRootMember: false,
      joinedAt: new Date(),
      createdBy: userId
    })

    const savedMember = await member.save()
    
    // Update family tree member count
    await FamilyTree.findByIdAndUpdate(memberData.familyTreeId, {
      $inc: { memberCount: 1 }
    })

    // Create notification for family tree owner
    if (familyTree.createdBy.toString() !== userId) {
      await new Notification({
        userId: familyTree.createdBy,
        type: 'member_added',
        title: 'New Family Member Added',
        message: `A new family member "${memberData.fullName}" has been added to your family tree`,
        priority: 'medium'
      }).save()
    }

    return savedMember
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

    // Remove all connections involving this node
    await FamilyTreeConnection.deleteMany({
      $or: [
        { sourceNodeId: node._id },
        { targetNodeId: node._id }
      ]
    })

    // Remove the node
    await FamilyTreeNode.findByIdAndDelete(memberId)

    // Update family tree member count
    await FamilyTree.findByIdAndUpdate(familyTree._id, {
      $inc: { memberCount: -1 }
    })

    // If no nodes left, mark family tree as inactive
    const remainingNodes = await FamilyTreeNode.countDocuments({
      familyTreeId: familyTree._id
    })

    if (remainingNodes === 0) {
      await FamilyTree.findByIdAndUpdate(familyTree._id, {
        isActive: false,
        memberCount: 0,
        rootUserId: null
      })
    }

    return { success: true }
  },

  async getFamilyMembersWithSmartRelationships(familyTreeId: string) {
    await connectDB()
    
    // Get nodes instead of FamilyMembers
    const nodes = await FamilyTreeNode.find({ familyTreeId })
      .populate('userId', 'fullName email loginId phone dateOfBirth gender placeOfBirth verificationStatus')
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
    
    // Update all family members linked to this user
    const updateFields: any = {}
    
    if (updateData.fullName) updateFields.fullName = updateData.fullName
    if (updateData.phone) updateFields.phone = updateData.phone
    if (updateData.email) updateFields.email = updateData.email

    if (Object.keys(updateFields).length > 0) {
      await FamilyMember.updateMany(
        { userId },
        { $set: updateFields }
      )
    }

    return { success: true }
  },

  async isUserRootMember(userId: string, familyTreeId: string): Promise<boolean> {
    await connectDB()
    
    const member = await FamilyMember.findOne({
      userId,
      familyTreeId,
      isRootMember: true,
      verificationStatus: { $ne: 'rejected' }
    })
    
    return !!member
  },

  // Node-based Family Tree Methods
  async getFamilyTreeNodes(familyTreeId: string) {
    await connectDB()
    
    console.log(`[getFamilyTreeNodes] Fetching nodes for family tree ID: ${familyTreeId}`)
    const nodes = await FamilyTreeNode.find({ familyTreeId })
      .populate('userId', 'fullName email loginId phone avatarUrl dateOfBirth gender verificationStatus')
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

      // Create member arrays
      const memberBasicInfo = users.map((user: any) => {
        const node = nodes.find((n: any) => (n as any).userId._id.toString() === user._id.toString())
        return {
          userId: user._id,
          fullName: user.fullName,
          loginId: user.loginId,
          email: user.email,
          gender: user.gender,
          dateOfBirth: user.dateOfBirth,
          verificationStatus: user.verificationStatus || 'pending',
          isRoot: familyTree.rootUserId.toString() === user._id.toString(),
          joinedAt: user.createdAt
        }
      })

      const memberDetails = users.map((user: any) => {
        const node = nodes.find((n: any) => (n as any).userId._id.toString() === user._id.toString())
        return {
          userId: user._id,
          fullName: user.fullName,
          loginId: user.loginId,
          email: user.email,
          gender: user.gender,
          dateOfBirth: user.dateOfBirth,
          placeOfBirth: user.placeOfBirth,
          verificationStatus: user.verificationStatus || 'pending',
          isRoot: familyTree.rootUserId.toString() === user._id.toString(),
          joinedAt: user.createdAt,
          nodePosition: node?.position || { x: 0, y: 0 }
        }
      })

      // Calculate statistics
      const stats = {
        totalMembers: users.length,
        verifiedMembers: users.filter((u: any) => u.verificationStatus === 'verified').length,
        pendingMembers: users.filter((u: any) => u.verificationStatus === 'pending').length,
        maleMembers: users.filter((u: any) => u.gender === 'male').length,
        femaleMembers: users.filter((u: any) => u.gender === 'female').length,
        otherMembers: users.filter((u: any) => u.gender === 'other').length
      }

      // Update FamilyTree with members array
      await FamilyTree.findByIdAndUpdate(familyTree._id, {
        members: memberBasicInfo,
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
          memberDetails,
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

  async getAllFamiliesWithMembers() {
    await connectDB()
    
    return FamilyMembersByFamily.find({})
      .populate('rootUserId', 'fullName email loginId')
      .sort({ 'stats.totalMembers': -1 })
      .lean()
  }
}

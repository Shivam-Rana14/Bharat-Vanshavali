import connectDB from './connection'
import { User, FamilyTree, FamilyMember, Document, Notification, UserReference } from './models'
import { authService } from '@/lib/auth'
import { generateFamilyCode, generateLoginId } from '@/lib/utils'

export interface SignUpData {
  email: string
  password: string
  fullName: string
  phone?: string
  dateOfBirth?: string
  placeOfBirth?: string
  gender?: string
  fatherName?: string
  motherName?: string
  grandfatherName?: string
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

      // Require relationship when joining existing family
      if (!data.relationship) {
        throw new Error('Relationship with root member is required when joining an existing family.')
      }
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
        fatherName: data.fatherName,
        motherName: data.motherName,
        grandfatherName: data.grandfatherName,
        nativePlace: data.nativePlace,
        caste: data.caste,
        familyCode,
        signupLatitude: data.location?.lat,
        signupLongitude: data.location?.lng
      })

      const savedUser = await user.save()

      // ---------------------------------------------
      // Create FamilyTree + root FamilyMember (only when we generated a new familyCode)
      // ---------------------------------------------
      if (!data.familyCode) {
        const rootMemberId = new (await import('mongoose')).default.Types.ObjectId()

        // Create family tree first referencing the future rootMemberId
        const familyTree = await new FamilyTree({
          name: `${data.fullName}'s Family Tree`,
          description: `${data.fullName}'s lineage`,
          rootMemberId: rootMemberId,
          familyCode: familyCode,
          createdBy: savedUser._id,
          memberCount: 1,
          isActive: true
        }).save()

        // Now create the root family member with the predetermined _id
        await new FamilyMember({
          _id: rootMemberId,
          userId: savedUser._id,
          familyTreeId: familyTree._id,
          fullName: data.fullName,
          relationship: 'Self',
          relationshipToTarget: 'Self', // Root member is self-referential
          gender: data.gender || 'other',
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
          placeOfBirth: data.placeOfBirth,
          occupation: undefined,
          isAlive: true,
          verificationStatus: 'verified',
          isRootMember: true, // This is the root member
          joinedAt: new Date(),
          createdBy: savedUser._id
        }).save()
      } else {
        // ---------------------------------------------
        // Joining existing family → add as FamilyMember with relationship provided
        // ---------------------------------------------
        const existingTree = await FamilyTree.findOne({ familyCode })
        if (existingTree) {
          const newMember = await new FamilyMember({
            userId: savedUser._id,
            familyTreeId: existingTree._id,
            fullName: data.fullName,
            relationship: data.relationship,
            gender: data.gender || 'other',
            isAlive: true,
            verificationStatus: 'pending',
            isRootMember: false, // Not root member initially
            joinedAt: new Date(),
            createdBy: savedUser._id
          }).save()

          // Update family tree member count
          await FamilyTree.findByIdAndUpdate(existingTree._id, {
            $inc: { memberCount: 1 }
          })

          // Check if we need to update root member (if current root left)
          await this.updateRootMemberIfNeeded(existingTree._id.toString())
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
    
    const member = await FamilyMember.findByIdAndUpdate(
      memberId,
      { ...updateData, updatedAt: new Date() },
      { new: true }
    )

    if (!member) {
      throw new Error('Family member not found')
    }

    return member
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
    
    return FamilyMember.findById(memberId)
      .populate('familyTreeId')
      .lean()
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

  // User leaves family tree: remove member record & unset familyCode
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

    // Find the user's family member record
    const memberRecord = await FamilyMember.findOne({ 
      familyTreeId: familyTree._id, 
      userId 
    })

    if (memberRecord) {
      const wasRootMember = memberRecord.isRootMember

      // Remove family member record
      await FamilyMember.findByIdAndDelete(memberRecord._id)

      // Update family tree member count
      await FamilyTree.findByIdAndUpdate(familyTree._id, {
        $inc: { memberCount: -1 }
      })

      // If this was the root member, update root member
      if (wasRootMember) {
        await this.updateRootMemberIfNeeded(familyTree._id.toString())
      }

      // Check if family tree should be marked as inactive
      const remainingMembers = await FamilyMember.countDocuments({
        familyTreeId: familyTree._id,
        verificationStatus: { $ne: 'rejected' }
      })

      if (remainingMembers === 0) {
        await FamilyTree.findByIdAndUpdate(familyTree._id, {
          isActive: false,
          memberCount: 0,
          rootMemberId: null
        })
      }
    }

    // Unset user's familyCode
    user.familyCode = undefined
    await user.save()

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

  // Smart Family Tree Methods
  async updateRootMemberIfNeeded(familyTreeId: string) {
    await connectDB()
    
    const familyTree = await FamilyTree.findById(familyTreeId)
    if (!familyTree) return

    // Check if current root member still exists and is active
    if (familyTree.rootMemberId) {
      const currentRoot = await FamilyMember.findById(familyTree.rootMemberId)
      if (currentRoot && currentRoot.verificationStatus !== 'rejected') {
        return // Root member is still valid
      }
    }

    // Find the earliest member who joined the family (excluding rejected members)
    const earliestMember = await FamilyMember.findOne({
      familyTreeId: familyTree._id,
      verificationStatus: { $ne: 'rejected' }
    }).sort({ joinedAt: 1 })

    if (earliestMember) {
      // Update all members to remove root status
      await FamilyMember.updateMany(
        { familyTreeId: familyTree._id },
        { isRootMember: false }
      )

      // Set new root member
      await FamilyMember.findByIdAndUpdate(earliestMember._id, {
        isRootMember: true,
        relationship: 'Self',
        relationshipToTarget: 'Self'
      })

      // Update family tree
      await FamilyTree.findByIdAndUpdate(familyTree._id, {
        rootMemberId: earliestMember._id
      })
    } else {
      // No members left, mark family tree as inactive
      await FamilyTree.findByIdAndUpdate(familyTree._id, {
        rootMemberId: null,
        isActive: false,
        memberCount: 0
      })
    }
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
    
    const member = await FamilyMember.findById(memberId)
    if (!member) throw new Error('Family member not found')

    const familyTree = await FamilyTree.findById(member.familyTreeId)
    if (!familyTree) throw new Error('Family tree not found')

    // Check permissions
    const isRootMember = member.isRootMember
    const isFamilyCreator = familyTree.createdBy.toString() === userId
    const isSystemAdmin = false // TODO: Add system admin check

    if (!isRootMember && !isFamilyCreator && !isSystemAdmin) {
      throw new Error('Permission denied. Only root members, family creators, or system admins can remove members.')
    }

    // Remove the member
    await FamilyMember.findByIdAndDelete(memberId)

    // Update family tree member count
    await FamilyTree.findByIdAndUpdate(familyTree._id, {
      $inc: { memberCount: -1 }
    })

    // If this was the root member, update root member
    if (isRootMember) {
      await this.updateRootMemberIfNeeded(familyTree._id.toString())
    }

    // If no members left, mark family tree as inactive
    const remainingMembers = await FamilyMember.countDocuments({
      familyTreeId: familyTree._id,
      verificationStatus: { $ne: 'rejected' }
    })

    if (remainingMembers === 0) {
      await FamilyTree.findByIdAndUpdate(familyTree._id, {
        isActive: false,
        memberCount: 0,
        rootMemberId: null
      })
    }

    return { success: true }
  },

  async getFamilyMembersWithSmartRelationships(familyTreeId: string) {
    await connectDB()
    
    const members = await FamilyMember.find({ familyTreeId })
      .populate('userId', 'fullName email loginId phone')
      .populate('spouseId', 'fullName')
      .populate('fatherId', 'fullName')
      .populate('motherId', 'fullName')
      .populate('targetMemberId', 'fullName')
      .sort({ isRootMember: -1, joinedAt: 1 })
      .lean()

    // Transform members to include smart relationship display
    return members.map((member: any) => ({
      ...member,
      displayRelationship: member.relationshipToTarget || member.relationship,
      isRoot: member.isRootMember
    }))
  },

  async getFamilyMembersForSelection(familyTreeId: string) {
    await connectDB()
    
    return FamilyMember.find({ 
      familyTreeId,
      verificationStatus: { $ne: 'rejected' }
    })
      .select('_id fullName relationship isRootMember')
      .sort({ isRootMember: -1, fullName: 1 })
      .lean()
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

  // Helper method
  capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
  }
}

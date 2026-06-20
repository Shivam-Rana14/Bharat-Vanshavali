import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-utils'
import { databaseService } from '@/lib/mongodb/database'
import { FamilyTree, FamilyTreeNode } from '@/lib/mongodb/models'
import { COLORS } from '@/lib/constants'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const user = requireAuth(request)
    const { familyCode, relationship } = await request.json()

    // Relationship is optional for joining, defaults to 'member'
    const relationshipType = relationship || 'member'

    if (!familyCode) {
      return NextResponse.json(
        { success: false, error: 'Family code is required' },
        { status: 400 }
      )
    }

    // Check if family code exists
    const normalizedFamilyCode = familyCode.trim().toUpperCase()
    const existingFamily = await databaseService.getFamilyTreeByCode(normalizedFamilyCode)
    if (!existingFamily) {
      return NextResponse.json(
        { success: false, error: 'Family code not found' },
        { status: 404 }
      )
    }

    // -----------------------------------------------------------------
    // RESTRICTION & MIGRATION LOGIC
    // -----------------------------------------------------------------
    if (user.familyCode) {
      // 1. Check if user is already in the target family
      if (user.familyCode === normalizedFamilyCode) {
        return NextResponse.json(
          { success: false, error: 'You are already a member of this family' },
          { status: 400 }
        )
      }

      // 2. Fetch current family details to check restriction
      const currentFamily = await databaseService.getFamilyTreeByCode(user.familyCode)

      if (currentFamily) {
        // RESTRICTION: Root member of a family with > 1 members cannot join another family
        const isRoot = currentFamily.rootUserId.toString() === user.id
        if (isRoot && currentFamily.memberCount > 1) {
          return NextResponse.json(
            { success: false, error: 'You cannot join another family while you are the root member of an active family with other members. Please transfer ownership or remove members first.' },
            { status: 400 }
          )
        }

        // MIGRATION: Leave current family before joining new one
        // This handles node removal, connection cleanup, and marking old tree inactive if empty
        await databaseService.leaveFamily(user.id)
      }
    }

    // Update user's family code
    const updatedUser = await databaseService.updateUserFamilyCode(user.id, normalizedFamilyCode)

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, error: 'Failed to join family' },
        { status: 500 }
      )
    }

    // -----------------------------------------------------------------
    // EXACT SIGNUP JOIN BEHAVIOR
    // -----------------------------------------------------------------

    // Count existing nodes for grid positioning (matching signup)
    const nodeCount = await FamilyTreeNode.countDocuments({
      familyTreeId: existingFamily._id
    })

    // Create FamilyTreeNode with grid positioning (EXACT signup logic)
    await new FamilyTreeNode({
      familyTreeId: existingFamily._id,
      userId: user.id,
      position: {
        x: (nodeCount % 5) * 250,           // Grid: 5 columns
        y: Math.floor(nodeCount / 5) * 150  // Grid: rows of 150px
      },
      nodeData: {
        width: 200,
        height: 100,
        color: COLORS.FAMILY_TREE.REGULAR_MEMBER,  // Orange for non-root members
        isVisible: true
      }
    }).save()

    // memberCount will be recalculated by updateFamilyMemberArrays (line 104)

    // Update family member arrays (matching signup)
    await databaseService.updateFamilyMemberArrays(normalizedFamilyCode)

    // -----------------------------------------------------------------
    // BONUS: Create connection to root (NOT in signup, but useful)
    // -----------------------------------------------------------------
    if (relationship) {
      try {
        // Find the root node
        const rootNode = await FamilyTreeNode.findOne({
          familyTreeId: existingFamily._id,
          userId: existingFamily.rootUserId
        })

        // Find the newly created user node
        const userNode = await FamilyTreeNode.findOne({
          familyTreeId: existingFamily._id,
          userId: user.id
        })

        if (userNode && rootNode) {
          console.log(`Creating connection: ${rootNode._id} -> ${userNode._id} (${relationship})`)
          await databaseService.createConnection({
            familyTreeId: existingFamily._id.toString(),
            sourceNodeId: rootNode._id.toString(),
            targetNodeId: userNode._id.toString(),
            relationshipType: 'blood',
            relationshipLabel: relationship
          }, user.id)
        } else {
          console.warn('Could not create connection: Nodes not found', {
            userNode: !!userNode,
            rootNode: !!rootNode
          })
        }
      } catch (connError) {
        console.error('Failed to create connection:', connError)
        // Don't fail the request if connection creation fails
      }
    }

    // Notify root member that someone joined their family
    const familyTree = existingFamily as any
    if (familyTree.rootUserId && familyTree.rootUserId.toString() !== user.id) {
      databaseService.createNotification({
        userId: familyTree.rootUserId.toString(),
        type: 'member_added',
        title: '👨‍👩‍👧 New Member Joined',
        message: `A new member has joined your family (${normalizedFamilyCode}).`,
        priority: 'medium'
      }).catch(() => {}) // fire-and-forget
    }

    // Notify the joining user
    databaseService.createNotification({
      userId: user.id,
      type: 'family_update',
      title: '🏠 Joined Family',
      message: `You have successfully joined family ${normalizedFamilyCode}.`,
      priority: 'low'
    }).catch(() => {})

    return NextResponse.json({
      success: true,
      familyCode: normalizedFamilyCode,
      message: 'Successfully joined family'
    })

  } catch (error) {
    console.error('Error joining family:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to join family' },
      { status: 500 }
    )
  }
}

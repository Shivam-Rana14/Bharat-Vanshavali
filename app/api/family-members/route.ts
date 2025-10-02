import { NextRequest, NextResponse } from 'next/server'
import { databaseService } from '@/lib/mongodb/database'
import { requireAuth } from '@/lib/api-utils'

export async function GET(request: NextRequest) {
  try {
    const user = requireAuth(request)
    const { searchParams } = new URL(request.url)
    const familyCodeParam = searchParams.get('familyCode')

    // Get user's family code from database
    const userProfile = await databaseService.getUserById(user.id)
    const userFamilyCode = userProfile?.familyCode

    // Use provided family code or user's family code
    let familyCode = familyCodeParam || userFamilyCode

    if (!familyCode) {
      return NextResponse.json({ success: true, members: [] })
    }

    // Security check: Citizens can only access their own family (unless admin)
    if (user.type !== 'admin' && familyCodeParam && familyCodeParam !== userFamilyCode) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. You can only access your own family members.' },
        { status: 403 }
      )
    }

    const familyTree: any = await databaseService.getFamilyTreeByCode(familyCode)
    if (!familyTree || !familyTree.isActive) {
      return NextResponse.json({ success: true, members: [] })
    }

    // Use new smart relationship method
    const members = await databaseService.getFamilyMembersWithSmartRelationships(familyTree._id.toString())
    
    // Transform members data to match frontend expectations
    const transformedMembers = members.map((member: any) => ({
      _id: member._id,
      id: member._id.toString(),
      // Prefer User's fullName if member is linked to a user, otherwise use member's fullName
      name: member.userId?.fullName || member.fullName || 'Unnamed',
      relation: member.displayRelationship || member.relationship || 'No relation',
      status: member.verificationStatus || 'pending',
      loginId: member.userId?.loginId || 'Not linked to user',
      dateOfBirth: member.dateOfBirth ? new Date(member.dateOfBirth).toISOString().split('T')[0] : null,
      placeOfBirth: member.placeOfBirth || null,
      mobile: member.userId?.phone || null,
      gender: member.gender,
      occupation: member.occupation,
      fatherName: member.fatherId?.fullName,
      motherName: member.motherId?.fullName,
      spouseName: member.spouseId?.fullName,
      isLinkedToUser: !!member.userId,
      linkedUserId: member.userId?._id?.toString(),
      isRoot: member.isRoot || false,
      targetMemberName: member.targetMemberId?.fullName,
      createdAt: member.createdAt,
      updatedAt: member.updatedAt
    }))
    
    return NextResponse.json({ success: true, members: transformedMembers })
  } catch (error) {
    console.error('Error fetching family members:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch family members' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = requireAuth(request)

    const { memberData, targetMemberId } = await request.json()
    
    // Get user's family code and find family tree
    const userProfile = await databaseService.getUserById(user.id)
    if (!userProfile?.familyCode) {
      return NextResponse.json(
        { success: false, error: 'Family tree not found' },
        { status: 404 }
      )
    }

    const familyTree: any = await databaseService.getFamilyTreeByCode(userProfile.familyCode)
    if (!familyTree || !familyTree.isActive) {
      return NextResponse.json(
        { success: false, error: 'Family tree not found or inactive' },
        { status: 404 }
      )
    }

    // Check permissions - only root members, family creators, or admins can add members
    const isRootMember = await databaseService.isUserRootMember(user.id, familyTree._id.toString())
    const isFamilyCreator = familyTree.createdBy.toString() === user.id
    const isSystemAdmin = user.type === 'admin'

    if (!isRootMember && !isFamilyCreator && !isSystemAdmin) {
      return NextResponse.json(
        { success: false, error: 'Permission denied. Only root members, family creators, or system admins can add family members.' },
        { status: 403 }
      )
    }

    const newMember = await databaseService.addFamilyMemberWithRelationship(
      {
        ...memberData,
        familyTreeId: familyTree._id.toString()
      },
      user.id,
      targetMemberId
    )

    return NextResponse.json({ success: true, data: newMember })
  } catch (error) {
    console.error('Error adding family member:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to add family member' },
      { status: 500 }
    )
  }
}
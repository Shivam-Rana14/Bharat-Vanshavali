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

    // Get family members for selection
    const members = await databaseService.getFamilyMembersForSelection(familyTree._id.toString())
    
    // Transform members data for selection dropdown
    const transformedMembers = members.map((member: any) => ({
      _id: member._id,
      id: member._id.toString(),
      fullName: member.fullName,
      relationship: member.relationship,
      isRootMember: member.isRootMember,
      displayName: `${member.fullName}${member.isRootMember ? ' (Root Member)' : ''}`
    }))
    
    return NextResponse.json({ success: true, members: transformedMembers })
  } catch (error) {
    console.error('Error fetching family members for selection:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch family members for selection' },
      { status: 500 }
    )
  }
}

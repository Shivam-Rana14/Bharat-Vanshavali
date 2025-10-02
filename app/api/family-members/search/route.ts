import { NextRequest, NextResponse } from 'next/server'
import { databaseService } from '@/lib/mongodb/database'
import { requireAuth } from '@/lib/api-utils'

export async function GET(request: NextRequest) {
  try {
    const user = requireAuth(request)

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const relationship = searchParams.get('relationship')
    const gender = searchParams.get('gender')
    const location = searchParams.get('location')

    // Get user's family code and find family tree
    const userProfile = await databaseService.getUserById(user.id)
    if (!userProfile?.familyCode) {
      return NextResponse.json({ success: true, data: [] })
    }

    const familyTree = await databaseService.getFamilyTreeByCode(userProfile.familyCode)
    if (!familyTree) {
      return NextResponse.json({ success: true, data: [] })
    }

    // Search family members with filters
    const filters = {
      query,
      relationship,
      gender,
      location
    }

    const members = await databaseService.searchFamilyMembers(familyTree._id.toString(), filters)
    return NextResponse.json({ success: true, data: members })
  } catch (error) {
    console.error('Error searching family members:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to search family members' },
      { status: 500 }
    )
  }
}
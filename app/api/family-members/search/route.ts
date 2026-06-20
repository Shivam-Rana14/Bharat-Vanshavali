import { NextRequest, NextResponse } from 'next/server'
import { databaseService } from '@/lib/mongodb/database'
import { requireAuth } from '@/lib/api-utils'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const user = requireAuth(request)

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')?.toLowerCase() || ''
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

    // Get all family members using the existing method
    const members = await databaseService.getFamilyMembersWithSmartRelationships(familyTree._id.toString())

    // Apply filters in-memory
    let filtered = members

    if (query) {
      filtered = filtered.filter((m: any) =>
        m.fullName?.toLowerCase().includes(query) ||
        m.gender?.toLowerCase().includes(query)
      )
    }

    if (gender) {
      filtered = filtered.filter((m: any) => m.gender === gender)
    }

    if (relationship) {
      filtered = filtered.filter((m: any) =>
        m.relationship === relationship || m.displayRelationship === relationship
      )
    }

    if (location) {
      filtered = filtered.filter((m: any) =>
        (m as any).placeOfBirth?.toLowerCase().includes(location.toLowerCase())
      )
    }

    return NextResponse.json({ success: true, data: filtered })
  } catch (error) {
    console.error('Error searching family members:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to search family members' },
      { status: 500 }
    )
  }
}
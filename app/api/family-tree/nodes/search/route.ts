import { NextRequest, NextResponse } from 'next/server'
import { databaseService } from '@/lib/mongodb/database'
import { requireAuth } from '@/lib/api-utils'

export async function GET(request: NextRequest) {
  try {
    const user = requireAuth(request)
    const { searchParams } = new URL(request.url)
    
    const query = searchParams.get('q') || ''
    const relationship = searchParams.get('relationship') || ''
    const gender = searchParams.get('gender') || ''
    const location = searchParams.get('location') || ''

    if (!user.familyCode) {
      return NextResponse.json({ success: false, error: 'User not part of any family' }, { status: 400 })
    }

    // Get family tree
    const familyTree = await databaseService.getFamilyTreeByCode(user.familyCode)
    if (!familyTree) {
      return NextResponse.json({ success: false, error: 'Family tree not found' }, { status: 404 })
    }

    // Get all nodes in the family
    const nodes = await databaseService.getFamilyTreeNodes(familyTree._id.toString())
    
    // Filter nodes based on search criteria
    let filteredNodes = nodes.filter((node: any) => {
      const userData = node.userId
      if (!userData) return false

      let matches = true

      // Text search in name
      if (query) {
        const searchLower = query.toLowerCase()
        matches = matches && (
          userData.fullName?.toLowerCase().includes(searchLower) ||
          userData.loginId?.toLowerCase().includes(searchLower) ||
          userData.email?.toLowerCase().includes(searchLower)
        )
      }

      // Gender filter
      if (gender) {
        matches = matches && userData.gender === gender
      }

      // Location filter (place of birth)
      if (location) {
        matches = matches && userData.placeOfBirth?.toLowerCase().includes(location.toLowerCase())
      }

      return matches
    })

    // Transform to expected format
    const searchResults = filteredNodes.map((node: any) => ({
      id: node._id.toString(),
      full_name: node.userId.fullName,
      relationship: 'Family Member', // In node system, relationships are connections, not user properties
      gender: node.userId.gender || 'other',
      date_of_birth: node.userId.dateOfBirth,
      place_of_birth: node.userId.placeOfBirth,
      occupation: node.userId.occupation,
      verification_status: node.userId.verificationStatus || 'pending',
      loginId: node.userId.loginId,
      email: node.userId.email
    }))

    return NextResponse.json({
      success: true,
      data: searchResults
    })
  } catch (error) {
    console.error('Error searching family members:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to search family members' },
      { status: 500 }
    )
  }
}

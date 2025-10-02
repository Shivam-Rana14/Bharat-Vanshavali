import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-utils'
import { databaseService } from '@/lib/mongodb/database'

export async function POST(request: NextRequest) {
  try {
    const user = requireAuth(request)
    const { familyCode, relationship } = await request.json()

    if (!relationship) {
      return NextResponse.json(
        { success: false, error: 'Relationship is required' },
        { status: 400 }
      )
    }

    if (!familyCode) {
      return NextResponse.json(
        { success: false, error: 'Family code is required' },
        { status: 400 }
      )
    }

    // Check if family code exists
    const existingFamily = await databaseService.getFamilyTreeByCode(familyCode)
    if (!existingFamily) {
      return NextResponse.json(
        { success: false, error: 'Family code not found' },
        { status: 404 }
      )
    }

    // Update user's family code
    const updatedUser = await databaseService.updateUserFamilyCode(user.id, familyCode)

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, error: 'Failed to join family' },
        { status: 500 }
      )
    }

    // -----------------------------------------------------------------
    // Add the joining user as a member of the family tree (if missing)
    // -----------------------------------------------------------------
    try {
      const existingMember = await databaseService.searchFamilyMembers(existingFamily._id.toString(), { userId: user.id })
      if (!existingMember || existingMember.length === 0) {
        await databaseService.addFamilyMember({
          userId: user.id,
          familyTreeId: existingFamily._id.toString(),
          fullName: updatedUser.fullName,
          relationship,
          gender: updatedUser.gender || 'other',
          isAlive: true,
          verificationStatus: 'pending'
        }, user.id)
      }
    } catch (e) {
      console.error('Failed to auto-add user as family member after join:', e)
      // Non-blocking – continue response
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully joined family',
      familyCode
    })
  } catch (error) {
    console.error('Family join error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to join family' },
      { status: 500 }
    )
  }
}

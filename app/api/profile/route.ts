import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-utils'
import { databaseService } from '@/lib/mongodb/database'

// GET /api/profile - Fetch the current user's own full profile
export async function GET(request: NextRequest) {
  try {
    const user = requireAuth(request)
    const profile = await databaseService.getUserById(user.id)

    if (!profile) {
      return NextResponse.json({ success: false, error: 'Profile not found' }, { status: 404 })
    }

    // Strip password from response
    const { password: _, ...safeProfile } = (profile as any).toObject ? (profile as any).toObject() : profile

    return NextResponse.json({ success: true, data: safeProfile })
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch profile' }, { status: 500 })
  }
}

// PUT /api/profile - Update the current user's own profile
export async function PUT(request: NextRequest) {
  try {
    const user = requireAuth(request)
    const updateData = await request.json()

    // Citizen can only update their own non-sensitive fields
    // Email, phone, password, loginId, familyCode, verificationStatus, userType are protected
    const allowedFields = [
      'fullName', 'dateOfBirth', 'placeOfBirth', 'gender',
      'nativePlace', 'caste', 'occupation', 'bio',
      'fatherName', 'motherName', 'grandfatherName', 'spouseName',
      'aadhaarNumber', 'panNumber'
    ]

    // Strip any fields not in allowedFields
    const protectedAttempts = Object.keys(updateData).filter(k => !allowedFields.includes(k))
    if (protectedAttempts.length > 0) {
      // Silently ignore protected fields instead of rejecting — just filter them out
      protectedAttempts.forEach(key => delete updateData[key])
    }

    // Use the existing updateFamilyMemberDetails which has all the empty-string/$unset logic
    const updatedProfile = await databaseService.updateFamilyMemberDetails(user.id, updateData)

    return NextResponse.json({
      success: true,
      data: updatedProfile,
      message: 'Profile updated successfully'
    })
  } catch (error: any) {
    console.error('Error updating profile:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update profile' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { databaseService } from '@/lib/mongodb/database'
import { requireAuth } from '@/lib/api-utils'

export async function GET(request: NextRequest) {
  try {
    const user = requireAuth(request)
    const { searchParams } = new URL(request.url)
    const familyCode = searchParams.get('familyCode')
    const action = searchParams.get('action') || 'get'

    if (action === 'all' && user.type === 'admin') {
      // Admin can get all families with their member arrays
      const allFamilies = await databaseService.getAllFamiliesWithMembers()
      return NextResponse.json({
        success: true,
        families: allFamilies
      })
    }

    if (!familyCode) {
      // Get user's own family if no family code provided
      const userProfile = await databaseService.getUserById(user.id)
      if (!userProfile?.familyCode) {
        return NextResponse.json({ success: false, error: 'User not part of any family' }, { status: 400 })
      }
      familyCode = userProfile.familyCode
    }

    // Security check: Users can only access their own family (unless admin)
    if (user.type !== 'admin') {
      const userProfile = await databaseService.getUserById(user.id)
      if (userProfile?.familyCode !== familyCode) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })
      }
    }

    if (action === 'update') {
      // Update/refresh the family member arrays
      const result = await databaseService.updateFamilyMemberArrays(familyCode)
      return NextResponse.json({
        success: true,
        message: 'Family member arrays updated successfully',
        memberCount: result?.memberCount || 0
      })
    }

    // Get family member arrays
    const familyArrays = await databaseService.getFamilyMemberArrays(familyCode)
    
    if (!familyArrays) {
      // If arrays don't exist, create them
      await databaseService.updateFamilyMemberArrays(familyCode)
      const newFamilyArrays = await databaseService.getFamilyMemberArrays(familyCode)
      
      return NextResponse.json({
        success: true,
        familyArrays: newFamilyArrays
      })
    }

    return NextResponse.json({
      success: true,
      familyArrays
    })
  } catch (error) {
    console.error('Error accessing family arrays:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to access family arrays' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = requireAuth(request)
    const { familyCode, action } = await request.json()

    if (!familyCode) {
      return NextResponse.json({ success: false, error: 'Family code is required' }, { status: 400 })
    }

    // Security check: Users can only update their own family (unless admin)
    if (user.type !== 'admin') {
      const userProfile = await databaseService.getUserById(user.id)
      if (userProfile?.familyCode !== familyCode) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })
      }
    }

    if (action === 'refresh') {
      // Refresh family member arrays
      const result = await databaseService.updateFamilyMemberArrays(familyCode)
      
      return NextResponse.json({
        success: true,
        message: 'Family member arrays refreshed successfully',
        memberCount: result?.memberCount || 0
      })
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error updating family arrays:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update family arrays' },
      { status: 500 }
    )
  }
}

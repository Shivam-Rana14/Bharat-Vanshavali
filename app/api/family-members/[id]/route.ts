import { NextRequest, NextResponse } from 'next/server'
import { databaseService } from '@/lib/mongodb/database'
import { requireAuth } from '@/lib/api-utils'

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = requireAuth(request)

    const memberId = params.id
    const memberData = await request.json()

    // Get family member to check family membership
    const member = await databaseService.getFamilyMemberById(memberId) as any
    
    if (!member) {
      return NextResponse.json(
        { success: false, error: 'Family member not found' },
        { status: 404 }
      )
    }

    const familyTree = member.familyTreeId

    // Security check: Citizens can only edit members from their own family
    if (user.type !== 'admin' && user.familyCode !== familyTree.familyCode) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. You can only edit members from your own family.' },
        { status: 403 }
      )
    }

    const updatedMember = await databaseService.updateFamilyMember(memberId, memberData, user.id)
    return NextResponse.json({ success: true, data: updatedMember })
  } catch (error) {
    console.error('Error updating family member:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update family member' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = requireAuth(request)

    const memberId = params.id

    // Get family member to check family membership
    const member = await databaseService.getFamilyMemberById(memberId) as any
    
    if (!member) {
      return NextResponse.json(
        { success: false, error: 'Family member not found' },
        { status: 404 }
      )
    }

    const familyTree = member.familyTreeId

    // Security check: Citizens can only delete members from their own family
    if (user.type !== 'admin' && user.familyCode !== familyTree.familyCode) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. You can only delete members from your own family.' },
        { status: 403 }
      )
    }

    // Use new smart remove method
    await databaseService.removeFamilyMember(memberId, user.id)
    
    return NextResponse.json({ success: true, message: 'Family member deleted successfully' })
  } catch (error) {
    console.error('Error deleting family member:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete family member' },
      { status: 500 }
    )
  }
}
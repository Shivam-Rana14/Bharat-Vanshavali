import { NextRequest, NextResponse } from 'next/server'
import { databaseService } from '@/lib/mongodb/database'
import { requireAuth } from '@/lib/api-utils'

export async function GET(
  request: NextRequest,
  { params }: { params: { memberId: string } }
) {
  try {
    const user = requireAuth(request)

    // Get family member to check family membership
    const member = await databaseService.getFamilyMemberById(params.memberId) as any
    
    if (!member) {
      return NextResponse.json(
        { success: false, error: 'Family member not found' },
        { status: 404 }
      )
    }

    // Get the family tree to check family code
    const familyTree = member.familyTreeId

    if (!familyTree) {
      return NextResponse.json(
        { success: false, error: 'Family tree not found' },
        { status: 404 }
      )
    }

    // Check authorization: Admin or same family
    if (user.type !== 'admin' && user.familyCode !== familyTree.familyCode) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. You can only access documents of your family members.' },
        { status: 403 }
      )
    }

    const documents = await databaseService.getFamilyMemberDocuments(params.memberId)

    return NextResponse.json({ 
      success: true, 
      documents 
    })
  } catch (error) {
    console.error('Error fetching member documents:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch documents' },
      { status: 500 }
    )
  }
}


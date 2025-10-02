import { NextRequest, NextResponse } from 'next/server'
import { databaseService } from '@/lib/mongodb/database'
import { requireAuth, canAccessUserData } from '@/lib/api-utils'

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const user = requireAuth(request)
    
    // Check if user can access this data
    if (!canAccessUserData(user, params.userId)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. You can only access your own documents.' },
        { status: 403 }
      )
    }

    const documents = await databaseService.getUserDocuments(params.userId)

    return NextResponse.json({ 
      success: true, 
      documents 
    })
  } catch (error) {
    console.error('Error fetching user documents:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch documents' },
      { status: 500 }
    )
  }
}


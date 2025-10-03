import { NextRequest, NextResponse } from 'next/server'
import { databaseService } from '@/lib/mongodb/database'
import { requireAuth } from '@/lib/api-utils'

export async function POST(request: NextRequest) {
  try {
    const user = requireAuth(request)
    const { familyCode } = await request.json()

    if (!familyCode) {
      return NextResponse.json({ success: false, error: 'Family code is required' }, { status: 400 })
    }

    // Security check: Users can only ensure nodes for their own family (unless admin)
    const userProfile = await databaseService.getUserById(user.id)
    if (user.type !== 'admin' && userProfile?.familyCode !== familyCode) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })
    }

    // Call the enhanced ensureNodesForFamily function
    const result = await databaseService.ensureNodesForFamily(familyCode)

    return NextResponse.json({ 
      success: true, 
      message: 'Nodes ensured successfully',
      ...result
    })
  } catch (error) {
    console.error('Error ensuring nodes:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to ensure nodes' },
      { status: 500 }
    )
  }
}


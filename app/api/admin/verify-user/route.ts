import { NextRequest, NextResponse } from 'next/server'
import { databaseService } from '@/lib/mongodb/database'
import { requireAdmin } from '@/lib/api-utils'

export async function POST(request: NextRequest) {
  try {
    const user = requireAdmin(request)

    const { userId, action } = await request.json()

    if (!userId || !action) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    let result
    if (action === 'verify') {
      result = await databaseService.verifyUser(userId, user.id)
    } else if (action === 'reject') {
      result = await databaseService.rejectUser(userId, user.id)
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `User ${action}d successfully`,
      data: result
    })
  } catch (error) {
    console.error('Error verifying user:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to verify user' },
      { status: 500 }
    )
  }
}
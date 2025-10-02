import { NextRequest, NextResponse } from 'next/server'
import { databaseService } from '@/lib/mongodb/database'
import { requireAdmin } from '@/lib/api-utils'

export async function GET(request: NextRequest) {
  try {
    const user = requireAdmin(request)

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    if (status === 'pending') {
      const pendingUsers = await databaseService.getPendingUsers()
      return NextResponse.json({ success: true, data: pendingUsers })
    }

    // Default: return dashboard stats
    const stats = await databaseService.getDashboardStats()
    return NextResponse.json({ success: true, data: stats })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}
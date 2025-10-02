import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-utils'
import { databaseService } from '@/lib/mongodb/database'

export async function POST(request: NextRequest) {
  try {
    const user = requireAuth(request)
    await databaseService.leaveFamily(user.id)

    return NextResponse.json({ success: true, message: 'Left family successfully' })
  } catch (e: any) {
    console.error('Leave family error:', e)
    return NextResponse.json({ success: false, error: e.message || 'Failed to leave family' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/api-utils'
import { databaseService } from '@/lib/mongodb/database'

export async function PATCH(request: NextRequest) {
  try {
    const admin = requireAdmin(request)
    const { memberId, status } = await request.json()

    if (!memberId || !status) {
      return NextResponse.json({ success: false, error: 'memberId and status are required' }, { status: 400 })
    }

    if (!['pending', 'verified', 'rejected'].includes(status)) {
      return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 })
    }

    const updated = await databaseService.updateMemberStatus(memberId, status as any, admin.id)
    return NextResponse.json({ success: true, data: updated })
  } catch (e: any) {
    console.error('Admin update member status error:', e)
    return NextResponse.json({ success: false, error: e.message || 'Failed to update status' }, { status: 500 })
  }
}

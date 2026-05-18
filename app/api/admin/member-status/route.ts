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

    // Get the user ID from the member (node) ID
    const node = await databaseService.getFamilyMemberById(memberId)
    if (!node || !node.userId) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    const userId = typeof node.userId === 'object' ? node.userId._id || node.userId.id : node.userId

    // Use verifyUser or rejectUser based on status
    let updated
    if (status === 'verified') {
      updated = await databaseService.verifyUser(userId.toString(), admin.id)
    } else if (status === 'rejected') {
      updated = await databaseService.rejectUser(userId.toString(), admin.id)
    } else {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    return NextResponse.json({ success: true, data: updated })
  } catch (e: any) {
    console.error('Admin update member status error:', e)
    return NextResponse.json({ success: false, error: e.message || 'Failed to update status' }, { status: 500 })
  }
}

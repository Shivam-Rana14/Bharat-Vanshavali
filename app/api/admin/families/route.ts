import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/api-utils'
import { databaseService } from '@/lib/mongodb/database'

export async function GET(request: NextRequest) {
  try {
    requireAdmin(request)

    const families = await databaseService.listFamilies()
    return NextResponse.json({ success: true, data: families })
  } catch (e) {
    console.error('Admin families error:', e)
    return NextResponse.json({ success: false, error: 'Failed to fetch families' }, { status: 500 })
  }
}

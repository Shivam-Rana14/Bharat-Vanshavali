import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/api-utils'
import { databaseService } from '@/lib/mongodb/database'

export async function GET(request: NextRequest) {
  try {
    requireAdmin(request)
    const { searchParams } = new URL(request.url)
    const familyCode = searchParams.get('familyCode')
    const status = searchParams.get('status') || undefined

    if (!familyCode) {
      return NextResponse.json({ success: false, error: 'familyCode is required' }, { status: 400 })
    }

    const members = await databaseService.getFamilyMembersAdmin(familyCode, status as any)
    return NextResponse.json({ success: true, data: members })
  } catch (e: any) {
    console.error('Admin family members error:', e)
    return NextResponse.json({ success: false, error: e.message || 'Failed to fetch members' }, { status: 500 })
  }
}

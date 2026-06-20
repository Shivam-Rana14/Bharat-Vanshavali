import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-utils'
import { databaseService } from '@/lib/mongodb/database'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const user = requireAuth(request)

    // Check if user is root member with other active members
    const userProfile = await databaseService.getUserById(user.id)
    if (userProfile?.familyCode) {
      const familyTree = await databaseService.getFamilyTreeByCode(userProfile.familyCode)

      if (familyTree) {
        const isRoot = familyTree.rootUserId.toString() === user.id

        // Count actual members in family
        const { default: User } = await import('@/lib/mongodb/models/User')
        const memberCount = await User.countDocuments({ familyCode: userProfile.familyCode })

        // Prevent root from leaving if there are other members
        if (isRoot && memberCount > 1) {
          return NextResponse.json({
            success: false,
            error: 'Root members cannot leave the family when there are other members. Please transfer root status first or remove all members.'
          }, { status: 403 })
        }
      }
    }

    await databaseService.leaveFamily(user.id)

    return NextResponse.json({ success: true, message: 'Left family successfully' })
  } catch (e: any) {
    console.error('Leave family error:', e)
    return NextResponse.json({ success: false, error: e.message || 'Failed to leave family' }, { status: 500 })
  }
}

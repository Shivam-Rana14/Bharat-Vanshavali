import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-utils'
import { databaseService } from '@/lib/mongodb/database'
import { User } from '@/lib/mongodb/models'

export async function GET(request: NextRequest) {
    try {
        const user = requireAuth(request)
        const { searchParams } = new URL(request.url)
        const code = searchParams.get('code')

        if (!code) {
            return NextResponse.json(
                { success: false, error: 'Family code is required' },
                { status: 400 }
            )
        }

        const normalizedCode = code.trim().toUpperCase()
        const familyTree = await databaseService.getFamilyTreeByCode(normalizedCode)

        if (!familyTree) {
            return NextResponse.json(
                { success: false, error: 'Family code not found' },
                { status: 404 }
            )
        }

        // Fetch root member details
        const rootUser = await User.findById(familyTree.rootUserId)

        return NextResponse.json({
            success: true,
            familyName: familyTree.name,
            rootMemberName: rootUser ? rootUser.fullName : 'Unknown',
            memberCount: familyTree.memberCount
        })

    } catch (error) {
        console.error('Validate code error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to validate code' },
            { status: 500 }
        )
    }
}

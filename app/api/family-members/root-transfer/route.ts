import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-utils'
import { databaseService } from '@/lib/mongodb/database'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
    try {
        const user = requireAuth(request)
        const body = await request.json()
        const { newRootId } = body

        if (!newRootId) {
            return NextResponse.json(
                { success: false, error: 'New root user ID is required' },
                { status: 400 }
            )
        }

        await databaseService.transferRootMember(user.id, newRootId)

        return NextResponse.json({
            success: true,
            message: 'Root member status transferred successfully'
        })
    } catch (e: any) {
        console.error('Root transfer error:', e)
        return NextResponse.json(
            { success: false, error: e.message || 'Failed to transfer root status' },
            { status: 500 }
        )
    }
}

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/api-utils'
import { databaseService } from '@/lib/mongodb/database'
import connectDB from '@/lib/mongodb/connection'
import { User } from '@/lib/mongodb/models'

export const dynamic = 'force-dynamic'

export async function GET(
    request: NextRequest,
    { params }: { params: { userId: string } }
) {
    try {
        requireAdmin(request)
        await connectDB()

        const userId = params.userId

        // Get user with ALL fields except password
        const user = await User.findById(userId).select('-password').lean()

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'User not found' },
                { status: 404 }
            )
        }

        return NextResponse.json({
            success: true,
            data: user
        })
    } catch (error) {
        console.error('Error fetching user details:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch user details' },
            { status: 500 }
        )
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { userId: string } }
) {
    try {
        requireAdmin(request)
        await connectDB()

        const userId = params.userId
        const updateData = await request.json()

        // Admin can update ALL fields
        const updatedUser = await databaseService.updateFamilyMemberDetails(userId, updateData)

        return NextResponse.json({
            success: true,
            data: updatedUser
        })
    } catch (error) {
        console.error('Error updating user:', error)
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Failed to update user' },
            { status: 500 }
        )
    }
}

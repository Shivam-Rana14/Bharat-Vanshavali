import { NextRequest, NextResponse } from 'next/server'
import { databaseService } from '@/lib/mongodb/database'
import { requireAdmin } from '@/lib/api-utils'
import connectDB from '@/lib/mongodb/connection'
import { User } from '@/lib/mongodb/models'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        requireAdmin(request)
        await connectDB()

        const stats = await databaseService.getDashboardStats()

        // Get verified users count
        const verifiedCount = await User.countDocuments({ verificationStatus: 'verified' })

        return NextResponse.json({
            success: true,
            data: {
                pendingVerifications: stats.pendingVerifications,
                verifiedCitizens: verifiedCount,
                totalFamilies: stats.totalFamilies,
                activeUsers: stats.totalMembers,
                totalUsers: stats.totalMembers
            }
        })
    } catch (error) {
        console.error('Error fetching admin stats:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch admin stats' },
            { status: 500 }
        )
    }
}

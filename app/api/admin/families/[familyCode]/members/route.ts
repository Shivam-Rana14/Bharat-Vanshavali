import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/api-utils'
import { databaseService } from '@/lib/mongodb/database'
import connectDB from '@/lib/mongodb/connection'
import { User, FamilyTree } from '@/lib/mongodb/models'

export const dynamic = 'force-dynamic'

export async function GET(
    request: NextRequest,
    { params }: { params: { familyCode: string } }
) {
    try {
        requireAdmin(request)
        await connectDB()

        const familyCode = params.familyCode

        // Get family tree info
        const familyTree = await FamilyTree.findOne({ familyCode })
            .populate('rootUserId', 'fullName email loginId')
            .lean()

        if (!familyTree) {
            return NextResponse.json(
                { success: false, error: 'Family not found' },
                { status: 404 }
            )
        }

        // Get all users in this family with ALL fields
        const members = await User.find({ familyCode })
            .select('-password') // Exclude only password
            .sort({ createdAt: 1 })
            .lean()

        // Transform to include isRootMember flag
        const rootUserId = ((familyTree as any).rootUserId as any)?._id?.toString() || (familyTree as any).rootUserId.toString()
        const membersWithRootFlag = members.map((member: any) => ({
            ...member,
            _id: member._id.toString(),
            isRootMember: member._id.toString() === rootUserId
        }))

        return NextResponse.json({
            success: true,
            data: {
                familyInfo: {
                    familyCode: (familyTree as any).familyCode,
                    familyName: (familyTree as any).name,
                    totalMembers: members.length,
                    rootUser: (familyTree as any).rootUserId
                },
                members: membersWithRootFlag
            }
        })
    } catch (e) {
        console.error('Admin family members error:', e)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch family members' },
            { status: 500 }
        )
    }
}

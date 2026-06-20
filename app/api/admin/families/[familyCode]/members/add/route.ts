import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/api-utils'
import { databaseService } from '@/lib/mongodb/database'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(
    request: NextRequest,
    { params }: { params: { familyCode: string } }
) {
    try {
        const adminUser = requireAdmin(request)
        const familyCode = params.familyCode

        const { memberData } = await request.json()

        // Get family tree
        const familyTree: any = await databaseService.getFamilyTreeByCode(familyCode)
        if (!familyTree || !familyTree.isActive) {
            return NextResponse.json(
                { success: false, error: 'Family tree not found or inactive' },
                { status: 404 }
            )
        }

        // Admin can add members to any family
        const newMember = await databaseService.addFamilyMemberWithRelationship(
            {
                ...memberData,
                familyTreeId: familyTree._id.toString()
            },
            adminUser.id,
            undefined // No target member for admin adds
        )

        return NextResponse.json({ success: true, data: newMember })
    } catch (error) {
        console.error('Error adding family member (admin):', error)
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Failed to add family member' },
            { status: 500 }
        )
    }
}

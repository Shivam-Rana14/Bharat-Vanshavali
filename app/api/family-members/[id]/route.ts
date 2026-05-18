import { NextRequest, NextResponse } from 'next/server'
import { databaseService } from '@/lib/mongodb/database'
import { requireAuth } from '@/lib/api-utils'

// GET /api/family-members/[id] - Fetch member details for editing
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const user = requireAuth(request)
        const memberId = params.id

        // Get the member details (this is a userId, not a nodeId)
        const memberDetails = await databaseService.getUserById(memberId)

        if (!memberDetails) {
            return NextResponse.json(
                { success: false, error: 'Member not found' },
                { status: 404 }
            )
        }

        // Get user's family tree to check permissions
        const userProfile = await databaseService.getUserById(user.id)
        if (!userProfile?.familyCode) {
            return NextResponse.json(
                { success: false, error: 'You are not part of a family' },
                { status: 403 }
            )
        }

        // Check if member is in the same family
        if (memberDetails.familyCode !== userProfile.familyCode) {
            return NextResponse.json(
                { success: false, error: 'Member is not in your family' },
                { status: 403 }
            )
        }

        // Check if user is root member
        const familyTree: any = await databaseService.getFamilyTreeByCode(userProfile.familyCode)
        if (!familyTree) {
            return NextResponse.json(
                { success: false, error: 'Family tree not found' },
                { status: 404 }
            )
        }

        const isRootMember = familyTree.rootUserId.toString() === user.id
        if (!isRootMember && user.type !== 'admin') {
            return NextResponse.json(
                { success: false, error: 'Permission denied. Only root members can edit family members.' },
                { status: 403 }
            )
        }

        // Return member details (excluding sensitive fields)
        const safeDetails = {
            _id: memberDetails._id,
            fullName: memberDetails.fullName,
            loginId: memberDetails.loginId,
            dateOfBirth: memberDetails.dateOfBirth,
            placeOfBirth: memberDetails.placeOfBirth,
            gender: memberDetails.gender,
            nativePlace: memberDetails.nativePlace,
            caste: memberDetails.caste,
            occupation: memberDetails.occupation,
            bio: memberDetails.bio,
            fatherName: memberDetails.fatherName,
            motherName: memberDetails.motherName,
            grandfatherName: memberDetails.grandfatherName,
            spouseName: memberDetails.spouseName,
            aadhaarNumber: memberDetails.aadhaarNumber,
            panNumber: memberDetails.panNumber,
            verificationStatus: memberDetails.verificationStatus,
            familyCode: memberDetails.familyCode
        }

        return NextResponse.json({ success: true, data: safeDetails })
    } catch (error) {
        console.error('Error fetching member details:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch member details' },
            { status: 500 }
        )
    }
}

// PUT /api/family-members/[id] - Update member details
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const user = requireAuth(request)
        const memberId = params.id
        const updateData = await request.json()

        // Get user's family tree to check permissions
        const userProfile = await databaseService.getUserById(user.id)
        if (!userProfile?.familyCode) {
            return NextResponse.json(
                { success: false, error: 'You are not part of a family' },
                { status: 403 }
            )
        }

        // Get member to update
        const memberToUpdate = await databaseService.getUserById(memberId)
        if (!memberToUpdate) {
            return NextResponse.json(
                { success: false, error: 'Member not found' },
                { status: 404 }
            )
        }

        // Check if member is in the same family
        if (memberToUpdate.familyCode !== userProfile.familyCode) {
            return NextResponse.json(
                { success: false, error: 'Member is not in your family' },
                { status: 403 }
            )
        }

        // Check if user is root member
        const familyTree: any = await databaseService.getFamilyTreeByCode(userProfile.familyCode)
        if (!familyTree) {
            return NextResponse.json(
                { success: false, error: 'Family tree not found' },
                { status: 404 }
            )
        }

        const isRootMember = familyTree.rootUserId.toString() === user.id
        if (!isRootMember && user.type !== 'admin') {
            return NextResponse.json(
                { success: false, error: 'Permission denied. Only root members can edit family members.' },
                { status: 403 }
            )
        }

        // Define protected fields that cannot be updated
        const protectedFields = [
            'email', 'password', 'phone', 'loginId', 'familyCode',
            'verificationStatus', 'createdAt', 'updatedAt', 'isPlaceholder',
            'managedBy', '_id', 'userType', 'signupLatitude', 'signupLongitude',
            'verifiedAt', 'verifiedBy'
        ]

        // Remove protected fields from update data
        protectedFields.forEach(field => {
            delete updateData[field]
        })

        // Update member details
        const updatedMember = await databaseService.updateFamilyMemberDetails(memberId, updateData)

        return NextResponse.json({
            success: true,
            data: updatedMember,
            message: 'Member details updated successfully'
        })
    } catch (error: any) {
        console.error('Error updating member details:', error)
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to update member details' },
            { status: 500 }
        )
    }
}

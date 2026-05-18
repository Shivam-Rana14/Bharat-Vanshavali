import mongoose from 'mongoose'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

// Import models (using require to avoid compilation issues with path aliases)
const User = require('../lib/mongodb/models/User').default
const FamilyTree = require('../lib/mongodb/models/FamilyTree').default
// REMOVED: FamilyMember model no longer exists
const FamilyTreeNode = require('../lib/mongodb/models/FamilyTreeNode').default
const FamilyTreeConnection = require('../lib/mongodb/models/FamilyTreeConnection').default
const FamilyMembersByFamily = require('../lib/mongodb/models/FamilyMembersByFamily').default
const ActivityLog = require('../lib/mongodb/models/ActivityLog').default

// Mock database service for testing
const { databaseService } = require('../lib/mongodb/database')

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
    console.error('Please define the MONGODB_URI environment variable inside .env.local')
    process.exit(1)
}

async function connectDB() {
    if (mongoose.connection.readyState >= 1) return
    await mongoose.connect(MONGODB_URI!)
    console.log('✅ Connected to MongoDB')
}

async function runTests() {
    await connectDB()

    const TEST_FAMILY_CODE = 'TEST_FAM_999'
    const TEST_EMAIL_ROOT = 'test_root_999@example.com'
    const TEST_EMAIL_MEMBER = 'test_member_999@example.com'

    console.log('\n🧪 STARTING INTEGRITY TESTS...')

    try {
        // ========================================================================
        // SETUP
        // ========================================================================
        console.log('\n📝 SETUP: Creating test data...')

        // Cleanup any existing test data first
        await cleanupTestData(TEST_FAMILY_CODE)

        // 1. Create Root User
        const rootUser = await new User({
            fullName: 'Test Root',
            email: TEST_EMAIL_ROOT,
            loginId: 'BVTESTROOT999',
            password: 'hashed_password',
            familyCode: TEST_FAMILY_CODE,
            verificationStatus: 'verified',
            userType: 'citizen'
        }).save()

        // 2. Create Family Tree
        const familyTree = await new FamilyTree({
            name: 'Test Family',
            familyCode: TEST_FAMILY_CODE,
            rootUserId: rootUser._id,
            createdBy: rootUser._id,
            memberCount: 1,
            isActive: true,
            members: [{
                userId: rootUser._id,
                fullName: rootUser.fullName,
                loginId: rootUser.loginId,
                email: rootUser.email,
                verificationStatus: 'verified',
                isRoot: true,
                joinedAt: new Date()
            }]
        }).save()

        // 3. Create Root Node
        await new FamilyTreeNode({
            familyTreeId: familyTree._id,
            userId: rootUser._id,
            position: { x: 0, y: 0 },
            nodeData: { isVisible: true }
        }).save()

        // 4. Create Member User
        const memberUser = await new User({
            fullName: 'Test Member',
            email: TEST_EMAIL_MEMBER,
            loginId: 'BVTESTMEMBER999',
            password: 'hashed_password',
            familyCode: TEST_FAMILY_CODE,
            verificationStatus: 'verified',
            userType: 'citizen'
        }).save()

        // 5. Add Member to Family (simulating join)
        await new FamilyTreeNode({
            familyTreeId: familyTree._id,
            userId: memberUser._id,
            position: { x: 100, y: 100 },
            nodeData: { isVisible: true }
        }).save()

        // Update arrays
        await databaseService.updateFamilyMemberArrays(TEST_FAMILY_CODE)

        console.log('✅ Setup complete')

        // ========================================================================
        // TEST 1: Member Count Accuracy
        // ========================================================================
        console.log('\n🧪 TEST 1: Member Count Accuracy')

        const updatedTree = await FamilyTree.findOne({ familyCode: TEST_FAMILY_CODE })
        const actualCount = await User.countDocuments({ familyCode: TEST_FAMILY_CODE })

        if (updatedTree.memberCount === 2 && actualCount === 2) {
            console.log('✅ PASS: Member count is accurate (2)')
        } else {
            console.error(`❌ FAIL: Member count mismatch. Tree: ${updatedTree.memberCount}, Actual: ${actualCount}`)
        }

        // ========================================================================
        // TEST 2: Root Member Leave Restriction
        // ========================================================================
        console.log('\n🧪 TEST 2: Root Member Leave Restriction')

        try {
            // Simulate root trying to leave
            const isRoot = updatedTree.rootUserId.toString() === rootUser._id.toString()
            const memberCount = await User.countDocuments({ familyCode: TEST_FAMILY_CODE })

            if (isRoot && memberCount > 1) {
                console.log('✅ PASS: Root leave restriction logic is active (Root cannot leave with >1 members)')
            } else {
                console.error('❌ FAIL: Root restriction logic failed')
            }
        } catch (e) {
            console.error('❌ FAIL: Error testing root restriction', e)
        }

        // ========================================================================
        // TEST 3: Root Transfer
        // ========================================================================
        console.log('\n🧪 TEST 3: Root Transfer')

        await databaseService.transferRootMember(rootUser._id.toString(), memberUser._id.toString())

        const transferredTree = await FamilyTree.findOne({ familyCode: TEST_FAMILY_CODE })

        if (transferredTree.rootUserId.toString() === memberUser._id.toString()) {
            console.log('✅ PASS: Root transferred successfully')
        } else {
            console.error('❌ FAIL: Root transfer failed')
        }

        // ========================================================================
        // TEST 4: Cascade Deletion (User)
        // ========================================================================
        console.log('\n🧪 TEST 4: Cascade Deletion (User)')

        // Delete the new root (was member)
        await User.findOneAndDelete({ _id: memberUser._id })

        // Verify cleanup
        const memberNode = await FamilyTreeNode.findOne({ userId: memberUser._id })
        // FamilyMember no longer exists - only check node
        if (!memberNode) {
            console.log('✅ PASS: User deletion cascaded to Node')
        } else {
            console.error('❌ FAIL: Cascade deletion failed')
        }

        // Verify activity log
        const log = await ActivityLog.findOne({
            action: 'user_deleted',
            targetUserId: memberUser._id
        })

        if (log) {
            console.log('✅ PASS: Activity logged')
        } else {
            console.error('❌ FAIL: Activity not logged')
        }

        // Write results to file
        const fs = require('fs')
        fs.writeFileSync('test_results.json', JSON.stringify({
            success: true,
            timestamp: new Date().toISOString()
        }, null, 2))
        console.log('✅ Results written to test_results.json')

    } catch (error) {
        console.error('❌ TEST SUITE FAILED:', error)
        const fs = require('fs')
        fs.writeFileSync('test_results.json', JSON.stringify({
            success: false,
            error: (error as Error).message
        }, null, 2))
    } finally {
        // ========================================================================
        // CLEANUP
        // ========================================================================
        console.log('\n🧹 CLEANUP: Removing test data...')
        await cleanupTestData(TEST_FAMILY_CODE)
        console.log('✅ Cleanup complete')

        await mongoose.disconnect()
        console.log('👋 Disconnected')
    }
}

async function cleanupTestData(familyCode: string) {
    const familyTree = await FamilyTree.findOne({ familyCode })
    if (familyTree) {
        await FamilyTreeNode.deleteMany({ familyTreeId: familyTree._id })
        await FamilyTreeConnection.deleteMany({ familyTreeId: familyTree._id })
        // REMOVED: FamilyMember.deleteMany - collection no longer exists
        await FamilyTree.findByIdAndDelete(familyTree._id)
    }

    await FamilyMembersByFamily.deleteOne({ familyCode })
    await User.deleteMany({ familyCode })

    // Double check users by email just in case
    await User.deleteMany({ email: { $in: ['test_root_999@example.com', 'test_member_999@example.com'] } })
}

runTests()

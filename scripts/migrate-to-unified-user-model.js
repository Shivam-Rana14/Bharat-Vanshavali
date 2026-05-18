import mongoose from 'mongoose'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
    console.error('Please define the MONGODB_URI environment variable inside .env.local')
    process.exit(1)
}

interface MigrationStats {
    usersUpdated: number
    familyMembersUpdated: number
    familyTreesUpdated: number
    familyMembersByFamilyUpdated: number
    errors: string[]
}

async function migrateDatabase() {
    const stats: MigrationStats = {
        usersUpdated: 0,
        familyMembersUpdated: 0,
        familyTreesUpdated: 0,
        familyMembersByFamilyUpdated: 0,
        errors: []
    }

    try {
        console.log('🔌 Connecting to MongoDB...')
        await mongoose.connect(MONGODB_URI!)
        console.log('✅ Connected to MongoDB\n')

        // Get database collections
        const db = mongoose.connection.db
        if (!db) {
            throw new Error("Database connection not established")
        }
        const usersCollection = db.collection('users')
        const familyMembersCollection = db.collection('familymembers')
        const familyTreesCollection = db.collection('familytrees')
        const familyMembersByFamilyCollection = db.collection('familymembersbyfamilies')

        // ============================================================================
        // STEP 1: Update User collection - Add new fields with defaults
        // ============================================================================
        console.log('📝 Step 1: Updating User collection...')

        const usersToUpdate = await usersCollection.find({
            $or: [
                { isPlaceholder: { $exists: false } },
                { isAlive: { $exists: false } }
            ]
        }).toArray()

        console.log(`   Found ${usersToUpdate.length} users to update`)

        for (const user of usersToUpdate) {
            try {
                await usersCollection.updateOne(
                    { _id: user._id },
                    {
                        $set: {
                            isPlaceholder: user.isPlaceholder ?? false,
                            isAlive: user.isAlive ?? true
                        },
                        $setOnInsert: {
                            occupation: user.occupation ?? undefined,
                            bio: user.bio ?? undefined,
                            dateOfDeath: user.dateOfDeath ?? undefined,
                            placeOfDeath: user.placeOfDeath ?? undefined,
                            fatherName: user.fatherName ?? undefined,
                            motherName: user.motherName ?? undefined,
                            grandfatherName: user.grandfatherName ?? undefined,
                            spouseName: user.spouseName ?? undefined,
                            managedBy: user.managedBy ?? undefined
                        }
                    }
                )
                stats.usersUpdated++
            } catch (error: any) {
                stats.errors.push(`User ${user._id}: ${error.message}`)
            }
        }
        console.log(`   ✅ Updated ${stats.usersUpdated} users\n`)

        // ============================================================================
        // STEP 2: Clean up FamilyMember collection - Remove personal data fields
        // ============================================================================
        console.log('📝 Step 2: Cleaning up FamilyMember collection...')

        const familyMembersToClean = await familyMembersCollection.find({
            $or: [
                { fullName: { $exists: true } },
                { gender: { $exists: true } },
                { dateOfBirth: { $exists: true } },
                { placeOfBirth: { $exists: true } },
                { occupation: { $exists: true } },
                { bio: { $exists: true } },
                { photoUrl: { $exists: true } }
            ]
        }).toArray()

        console.log(`   Found ${familyMembersToClean.length} family members to clean`)

        for (const member of familyMembersToClean) {
            try {
                await familyMembersCollection.updateOne(
                    { _id: member._id },
                    {
                        $unset: {
                            fullName: "",
                            gender: "",
                            dateOfBirth: "",
                            placeOfBirth: "",
                            occupation: "",
                            bio: "",
                            isAlive: "",
                            dateOfDeath: "",
                            placeOfDeath: "",
                            photoUrl: "",
                            fatherName: "",
                            motherName: "",
                            spouseName: ""
                        }
                    }
                )
                stats.familyMembersUpdated++
            } catch (error: any) {
                stats.errors.push(`FamilyMember ${member._id}: ${error.message}`)
            }
        }
        console.log(`   ✅ Cleaned ${stats.familyMembersUpdated} family members\n`)

        // ============================================================================
        // STEP 3: Clean up FamilyTree collection - Remove denormalized arrays
        // ============================================================================
        console.log('📝 Step 3: Cleaning up FamilyTree collection...')

        const familyTreesToClean = await familyTreesCollection.find({
            $or: [
                { members: { $exists: true } },
                { crestUrl: { $exists: true } }
            ]
        }).toArray()

        console.log(`   Found ${familyTreesToClean.length} family trees to clean`)

        for (const tree of familyTreesToClean) {
            try {
                await familyTreesCollection.updateOne(
                    { _id: tree._id },
                    {
                        $unset: {
                            members: "",
                            crestUrl: ""
                        }
                    }
                )
                stats.familyTreesUpdated++
            } catch (error: any) {
                stats.errors.push(`FamilyTree ${tree._id}: ${error.message}`)
            }
        }
        console.log(`   ✅ Cleaned ${stats.familyTreesUpdated} family trees\n`)

        // ============================================================================
        // STEP 4: Clean up FamilyMembersByFamily collection - Remove denormalized arrays
        // ============================================================================
        console.log('📝 Step 4: Cleaning up FamilyMembersByFamily collection...')

        const familyMembersByFamilyToClean = await familyMembersByFamilyCollection.find({
            memberDetails: { $exists: true }
        }).toArray()

        console.log(`   Found ${familyMembersByFamilyToClean.length} family member arrays to clean`)

        for (const familyArray of familyMembersByFamilyToClean) {
            try {
                await familyMembersByFamilyCollection.updateOne(
                    { _id: familyArray._id },
                    {
                        $unset: {
                            memberDetails: ""
                        }
                    }
                )
                stats.familyMembersByFamilyUpdated++
            } catch (error: any) {
                stats.errors.push(`FamilyMembersByFamily ${familyArray._id}: ${error.message}`)
            }
        }
        console.log(`   ✅ Cleaned ${stats.familyMembersByFamilyUpdated} family member arrays\n`)

        // ============================================================================
        // STEP 5: Verify data integrity
        // ============================================================================
        console.log('📝 Step 5: Verifying data integrity...')

        // Check for FamilyMembers without userId
        const membersWithoutUser = await familyMembersCollection.countDocuments({
            userId: { $exists: false }
        })

        if (membersWithoutUser > 0) {
            console.log(`   ⚠️  WARNING: Found ${membersWithoutUser} family members without userId`)
            stats.errors.push(`${membersWithoutUser} family members found without userId - these need manual review`)
        }

        // Check for users without required fields
        const usersWithoutLoginId = await usersCollection.countDocuments({
            loginId: { $exists: false }
        })

        if (usersWithoutLoginId > 0) {
            console.log(`   ⚠️  WARNING: Found ${usersWithoutLoginId} users without loginId`)
            stats.errors.push(`${usersWithoutLoginId} users found without loginId - these need manual review`)
        }

        console.log('   ✅ Data integrity check complete\n')

        // ============================================================================
        // Migration Summary
        // ============================================================================
        console.log('═══════════════════════════════════════════════════════════')
        console.log('📊 MIGRATION SUMMARY')
        console.log('═══════════════════════════════════════════════════════════')
        console.log(`✅ Users updated:                    ${stats.usersUpdated}`)
        console.log(`✅ FamilyMembers cleaned:            ${stats.familyMembersUpdated}`)
        console.log(`✅ FamilyTrees cleaned:              ${stats.familyTreesUpdated}`)
        console.log(`✅ FamilyMembersByFamily cleaned:    ${stats.familyMembersByFamilyUpdated}`)

        if (stats.errors.length > 0) {
            console.log(`\n⚠️  Errors encountered: ${stats.errors.length}`)
            stats.errors.forEach((error, index) => {
                console.log(`   ${index + 1}. ${error}`)
            })
        } else {
            console.log('\n✅ No errors encountered')
        }
        console.log('═══════════════════════════════════════════════════════════\n')

        console.log('🎉 Migration completed successfully!')

    } catch (error) {
        console.error('❌ Migration failed:', error)
        throw error
    } finally {
        await mongoose.disconnect()
        console.log('🔌 Disconnected from MongoDB')
    }
}

// Run migration
migrateDatabase()
    .then(() => {
        console.log('\n✅ All done!')
        process.exit(0)
    })
    .catch((error) => {
        console.error('\n❌ Migration failed with error:', error)
        process.exit(1)
    })

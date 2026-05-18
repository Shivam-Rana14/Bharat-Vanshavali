#!/usr/bin/env node
/**
 * Clean Test Data
 * Removes all test users and their related data
 */

const mongoose = require('mongoose')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found')
  process.exit(1)
}

async function main() {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Connected to MongoDB\n')
    
    const db = mongoose.connection.db
    const users = db.collection('users')
    const familyTrees = db.collection('familytrees')
    const familyTreeNodes = db.collection('familytreenodes')
    const familyTreeConnections = db.collection('familytreeconnections')
    const familyMembers = db.collection('familymembers')
    
    console.log('🔍 Finding test users...\n')
    
    const testUsers = await users.find({
      $or: [
        { email: /test@/i },
        { email: /@test\./i },
        { email: /@example\./i },
        { fullName: /test/i }
      ]
    }).toArray()
    
    console.log(`Found ${testUsers.length} test users\n`)
    
    if (testUsers.length === 0) {
      console.log('✅ No test users to clean')
      process.exit(0)
    }
    
    for (const user of testUsers) {
      console.log(`\n🧹 Removing: ${user.fullName} (${user.email})`)
      
      // Find and delete node
      const node = await familyTreeNodes.findOne({ userId: user._id })
      if (node) {
        // Delete connections
        const connResult = await familyTreeConnections.deleteMany({
          $or: [
            { sourceNodeId: node._id },
            { targetNodeId: node._id }
          ]
        })
        console.log(`   ✅ Deleted ${connResult.deletedCount} connections`)
        
        // Delete node
        await familyTreeNodes.deleteOne({ _id: node._id })
        console.log(`   ✅ Deleted node`)
        
        // Update family memberCount
        if (user.familyCode) {
          const family = await familyTrees.findOne({ familyCode: user.familyCode })
          if (family) {
            await familyTrees.updateOne(
              { _id: family._id },
              { 
                $inc: { memberCount: -1 },
                $set: { updatedAt: new Date() }
              }
            )
            console.log(`   ✅ Decremented family memberCount`)
          }
        }
      }
      
      // Delete family member records
      const fmResult = await familyMembers.deleteMany({ userId: user._id })
      if (fmResult.deletedCount > 0) {
        console.log(`   ✅ Deleted ${fmResult.deletedCount} family member records`)
      }
      
      // Delete user
      await users.deleteOne({ _id: user._id })
      console.log(`   ✅ Deleted user`)
    }
    
    console.log(`\n✅ Cleaned ${testUsers.length} test users`)
    console.log('\n⚠️  Remember to run fix-member-arrays.js to update FamilyMembersByFamily')
    process.exit(0)
    
  } catch (error) {
    console.error('\n❌ Error:', error.message)
    console.error(error.stack)
    process.exit(1)
  } finally {
    await mongoose.connection.close()
  }
}

main()

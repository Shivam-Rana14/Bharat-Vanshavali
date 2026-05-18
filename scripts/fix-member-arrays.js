#!/usr/bin/env node
/**
 * Fix FamilyMembersByFamily Arrays
 * Creates/updates member arrays for all families
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
    const familyMembersByFamily = db.collection('familymembersbyfamilies')
    
    console.log('🔍 Updating FamilyMembersByFamily arrays...\n')
    
    const families = await familyTrees.find({}).toArray()
    let createdCount = 0
    let updatedCount = 0
    
    for (const family of families) {
      console.log(`\n🏠 ${family.name} (${family.familyCode})`)
      
      // Get all users in this family
      const familyUsers = await users.find({ 
        familyCode: family.familyCode 
      }).toArray()
      
      console.log(`   Found ${familyUsers.length} users`)
      
      // Build members array
      const members = familyUsers.map(u => ({
        userId: u._id,
        fullName: u.fullName,
        email: u.email,
        loginId: u.loginId,
        phone: u.phone || '',
        gender: u.gender || 'other',
        dateOfBirth: u.dateOfBirth || null,
        placeOfBirth: u.placeOfBirth || ''
      }))
      
      // Check if record exists
      const existing = await familyMembersByFamily.findOne({ 
        familyTreeId: family._id 
      })
      
      if (!existing) {
        // Create new record
        const newDoc = {
          familyTreeId: family._id,
          members: members,
          memberCount: members.length,
          createdAt: new Date(),
          updatedAt: new Date()
        }
        await familyMembersByFamily.insertOne(newDoc)
        console.log(`   ✅ Created array with ${members.length} members`)
        createdCount++
      } else {
        // Update existing record
        await familyMembersByFamily.updateOne(
          { _id: existing._id },
          { 
            $set: { 
              members: members,
              memberCount: members.length,
              updatedAt: new Date()
            } 
          }
        )
        console.log(`   ✅ Updated array with ${members.length} members`)
        updatedCount++
      }
    }
    
    console.log(`\n✅ Created ${createdCount} new arrays`)
    console.log(`✅ Updated ${updatedCount} existing arrays`)
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

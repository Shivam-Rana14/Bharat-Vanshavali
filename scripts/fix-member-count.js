#!/usr/bin/env node
/**
 * Fix memberCount Mismatches
 * Updates FamilyTree.memberCount to match actual node count
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
    const familyTrees = db.collection('familytrees')
    const familyTreeNodes = db.collection('familytreenodes')
    
    console.log('🔍 Checking memberCount for all families...\n')
    
    const families = await familyTrees.find({}).toArray()
    let fixedCount = 0
    
    for (const family of families) {
      const actualCount = await familyTreeNodes.countDocuments({ 
        familyTreeId: family._id 
      })
      
      if (family.memberCount !== actualCount) {
        console.log(`❌ ${family.name} (${family.familyCode})`)
        console.log(`   Stored: ${family.memberCount}, Actual: ${actualCount}`)
        
        await familyTrees.updateOne(
          { _id: family._id },
          { 
            $set: { 
              memberCount: actualCount,
              updatedAt: new Date()
            } 
          }
        )
        
        console.log(`   ✅ Updated to ${actualCount}`)
        fixedCount++
      } else {
        console.log(`✅ ${family.name} (${family.familyCode}): ${actualCount} members`)
      }
    }
    
    console.log(`\n✅ Fixed ${fixedCount} memberCount mismatches`)
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

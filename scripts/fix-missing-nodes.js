#!/usr/bin/env node
/**
 * Fix Missing FamilyTreeNodes
 * Creates nodes for users who have familyCode but no corresponding node
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
    
    // Define collections
    const db = mongoose.connection.db
    const users = db.collection('users')
    const familyTrees = db.collection('familytrees')
    const familyTreeNodes = db.collection('familytreenodes')
    
    console.log('🔍 Finding users without nodes...\n')
    
    const allUsers = await users.find({ 
      familyCode: { $exists: true, $ne: null } 
    }).toArray()
    
    let fixedCount = 0
    
    for (const user of allUsers) {
      // Check if node exists
      const hasNode = await familyTreeNodes.findOne({ 
        userId: user._id 
      })
      
      if (!hasNode) {
        console.log(`❌ Missing node for: ${user.fullName} (${user.email})`)
        
        // Find family tree
        const family = await familyTrees.findOne({ 
          familyCode: user.familyCode 
        })
        
        if (!family) {
          console.log(`  ⚠️  Family tree not found for code: ${user.familyCode}`)
          continue
        }
        
        // Count existing nodes for positioning
        const nodeCount = await familyTreeNodes.countDocuments({ 
          familyTreeId: family._id 
        })
        
        // Create node
        const newNode = {
          familyTreeId: family._id,
          userId: user._id,
          position: {
            x: (nodeCount % 5) * 250,
            y: Math.floor(nodeCount / 5) * 150
          },
          nodeData: {
            width: 200,
            height: 100,
            color: '#F59E0B',
            isVisible: true
          },
          createdAt: new Date(),
          updatedAt: new Date()
        }
        
        await familyTreeNodes.insertOne(newNode)
        console.log(`  ✅ Created node at position (${newNode.position.x}, ${newNode.position.y})`)
        fixedCount++
      }
    }
    
    console.log(`\n✅ Fixed ${fixedCount} missing nodes`)
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

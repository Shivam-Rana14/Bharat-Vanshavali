#!/usr/bin/env node
/**
 * Simple Database Fix Script
 * Fixes memberCount, creates missing nodes, updates arrays
 */

const mongoose = require('mongoose')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found')
  process.exit(1)
}

// Models with strict: false to avoid schema issues
const User = mongoose.model('User', new mongoose.Schema({}, { strict: false, collection: 'users' }))
const FamilyTree = mongoose.model('FamilyTree', new mongoose.Schema({}, { strict: false, collection: 'familytrees' }))
const FamilyTreeNode = mongoose.model('FamilyTreeNode', new mongoose.Schema({}, { strict: false, collection: 'familytreenodes' }))
const FamilyMembersByFamily = mongoose.model('FamilyMembersByFamily', new mongoose.Schema({}, { strict: false, collection: 'familymembersbyfamilies' }))

async function main() {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Connected\n')
    
    const families = await FamilyTree.find({})
    console.log(`Found ${families.length} families\n`)
    
    for (const family of families) {
      console.log(`\n🏠 ${family.name} (${family.familyCode})`)
      
      // Get users
      const users = await User.find({ familyCode: family.familyCode })
      console.log(`  Users: ${users.length}`)
      
      // Fix missing nodes
      for (const user of users) {
        const hasNode = await FamilyTreeNode.exists({ 
          familyTreeId: family._id, 
          userId: user._id 
        })
        
        if (!hasNode) {
          console.log(`  Creating node for ${user.fullName}`)
          const nodeCount = await FamilyTreeNode.countDocuments({ familyTreeId: family._id })
          
          const newNode = new FamilyTreeNode({
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
            }
          })
          await newNode.save()
          console.log(`    ✅ Node created`)
        }
      }
      
      // Fix memberCount
      const actualNodes = await FamilyTreeNode.countDocuments({ familyTreeId: family._id })
      if (family.memberCount !== actualNodes) {
        console.log(`  Fixing memberCount: ${family.memberCount} → ${actualNodes}`)
        family.memberCount = actualNodes
        await family.save()
        console.log(`    ✅ Updated`)
      }
      
      // Fix FamilyMembersByFamily
      const members = users.map(u => ({
        userId: u._id,
        fullName: u.fullName,
        email: u.email,
        loginId: u.loginId,
        phone: u.phone,
        gender: u.gender,
        dateOfBirth: u.dateOfBirth,
        placeOfBirth: u.placeOfBirth
      }))
      
      let membersByFamily = await FamilyMembersByFamily.findOne({ familyTreeId: family._id })
      if (!membersByFamily) {
        console.log(`  Creating FamilyMembersByFamily`)
        membersByFamily = new FamilyMembersByFamily({
          familyTreeId: family._id,
          members: members,
          memberCount: users.length
        })
      } else {
        console.log(`  Updating FamilyMembersByFamily`)
        membersByFamily.members = members
        membersByFamily.memberCount = users.length
      }
      await membersByFamily.save()
      console.log(`    ✅ Updated (${members.length} members)`)
    }
    
    console.log('\n✅ ALL FIXES APPLIED\n')
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

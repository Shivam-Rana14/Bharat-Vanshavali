#!/usr/bin/env node
/**
 * Database Audit and Fix Script
 * 
 * Fixes:
 * 1. memberCount mismatches
 * 2. Missing FamilyTreeNodes for users
 * 3. FamilyMembersByFamily arrays
 * 4. Removes test data
 * 
 * Usage:
 *   node scripts/fix-database.js --audit        # Audit only
 *   node scripts/fix-database.js --fix          # Apply all fixes
 *   node scripts/fix-database.js --clean-test   # Remove test data
 */

const mongoose = require('mongoose')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in environment variables')
  console.error('Make sure .env.local exists with MONGODB_URI')
  process.exit(1)
}

// Parse args
const args = process.argv.slice(2)
const AUDIT_ONLY = args.includes('--audit')
const APPLY_FIXES = args.includes('--fix')
const CLEAN_TEST = args.includes('--clean-test')

if (!AUDIT_ONLY && !APPLY_FIXES && !CLEAN_TEST) {
  console.log('Usage:')
  console.log('  node scripts/fix-database.js --audit')
  console.log('  node scripts/fix-database.js --fix')
  console.log('  node scripts/fix-database.js --clean-test')
  process.exit(1)
}

// Simple schemas
const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }))
const FamilyTree = mongoose.model('FamilyTree', new mongoose.Schema({}, { strict: false }))
const FamilyTreeNode = mongoose.model('FamilyTreeNode', new mongoose.Schema({}, { strict: false }))
const FamilyMember = mongoose.model('FamilyMember', new mongoose.Schema({}, { strict: false }))
const FamilyMembersByFamily = mongoose.model('FamilyMembersByFamily', new mongoose.Schema({}, { strict: false }))
const FamilyTreeConnection = mongoose.model('FamilyTreeConnection', new mongoose.Schema({}, { strict: false }))

async function main() {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Connected to MongoDB\n')
    
    const issues = []
    
    // ========================================================================
    // AUDIT
    // ========================================================================
    console.log('🔍 DATABASE AUDIT')
    console.log('='.repeat(70))
    
    const families = await FamilyTree.find({}).lean()
    console.log(`\nFound ${families.length} families\n`)
    
    for (const family of families) {
      console.log(`\n🏠 ${family.name} (${family.familyCode})`)
      console.log('─'.repeat(70))
      
      const actualNodes = await FamilyTreeNode.countDocuments({ familyTreeId: family._id })
      const users = await User.find({ familyCode: family.familyCode }).lean()
      const membersByFamily = await FamilyMembersByFamily.findOne({ familyTreeId: family._id })
      
      console.log(`  Stored memberCount: ${family.memberCount}`)
      console.log(`  Actual nodes: ${actualNodes}`)
      console.log(`  Users with code: ${users.length}`)
      console.log(`  Members array: ${membersByFamily ? 'exists' : 'MISSING'}`)
      
      // Check memberCount
      if (family.memberCount !== actualNodes) {
        issues.push({
          type: 'MEMBER_COUNT',
          familyId: family._id,
          familyCode: family.familyCode,
          stored: family.memberCount,
          actual: actualNodes
        })
        console.log(`  ❌ memberCount mismatch: ${family.memberCount} vs ${actualNodes}`)
      }
      
      // Check for users without nodes
      for (const user of users) {
        const hasNode = await FamilyTreeNode.exists({ 
          familyTreeId: family._id, 
          userId: user._id 
        })
        if (!hasNode) {
          issues.push({
            type: 'MISSING_NODE',
            familyId: family._id,
            familyCode: family.familyCode,
            userId: user._id,
            userName: user.fullName
          })
          console.log(`  ❌ User "${user.fullName}" has no node`)
        }
      }
      
      // Check for missing array
      if (!membersByFamily) {
        issues.push({
          type: 'MISSING_ARRAY',
          familyId: family._id,
          familyCode: family.familyCode
        })
        console.log(`  ❌ Missing FamilyMembersByFamily`)
      }
      
      if (issues.filter(i => i.familyCode === family.familyCode).length === 0) {
        console.log(`  ✅ No issues`)
      }
    }
    
    // Check test data
    console.log(`\n\n🧪 TEST DATA`)
    console.log('='.repeat(70))
    
    const testUsers = await User.find({
      $or: [
        { email: /test@/i },
        { email: /@test\./i },
        { email: /@example\./i },
        { fullName: /test/i }
      ]
    }).lean()
    
    if (testUsers.length > 0) {
      console.log(`\n❌ Found ${testUsers.length} test users:`)
      testUsers.forEach(u => {
        console.log(`  - ${u.fullName} (${u.email})`)
        issues.push({ type: 'TEST_USER', userId: u._id, userName: u.fullName, userEmail: u.email })
      })
    } else {
      console.log(`✅ No test users`)
    }
    
    // Summary
    console.log(`\n\n📋 SUMMARY`)
    console.log('='.repeat(70))
    console.log(`Total issues: ${issues.length}`)
    
    const byType = {}
    issues.forEach(i => byType[i.type] = (byType[i.type] || 0) + 1)
    Object.entries(byType).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`)
    })
    
    if (AUDIT_ONLY) {
      console.log('\n✅ Audit complete')
      process.exit(0)
    }
    
    // ========================================================================
    // FIXES
    // ========================================================================
    if (APPLY_FIXES) {
      console.log('\n\n🔧 APPLYING FIXES')
      console.log('='.repeat(70))
      
      // Fix memberCount
      const countIssues = issues.filter(i => i.type === 'MEMBER_COUNT')
      for (const issue of countIssues) {
        console.log(`\nFixing memberCount for ${issue.familyCode}: ${issue.stored} → ${issue.actual}`)
        await FamilyTree.findByIdAndUpdate(
          issue.familyId,
          { memberCount: issue.actual }
        )
        console.log(`  ✅ Updated`)
      }
      
      // Fix missing nodes
      const nodeIssues = issues.filter(i => i.type === 'MISSING_NODE')
      for (const issue of nodeIssues) {
        console.log(`\nCreating node for ${issue.userName}`)
        
        const nodeCount = await FamilyTreeNode.countDocuments({ familyTreeId: issue.familyId })
        
        await FamilyTreeNode.create({
          familyTreeId: issue.familyId,
          userId: issue.userId,
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
        console.log(`  ✅ Created`)
      }
      
      // Fix member arrays
      console.log(`\n\nUpdating FamilyMembersByFamily arrays...`)
      for (const family of families) {
        const users = await User.find({ familyCode: family.familyCode })
          .select('_id fullName email loginId phone gender dateOfBirth placeOfBirth')
          .lean()
        
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
        
        await FamilyMembersByFamily.findOneAndUpdate(
          { familyTreeId: family._id },
          { 
            familyTreeId: family._id,
            members: members,
            memberCount: users.length
          },
          { upsert: true }
        )
        
        console.log(`  ✅ ${family.familyCode}: ${members.length} members`)
      }
      
      console.log('\n✅ All fixes applied')
    }
    
    // ========================================================================
    // CLEAN TEST DATA
    // ========================================================================
    if (CLEAN_TEST) {
      console.log('\n\n🧹 CLEANING TEST DATA')
      console.log('='.repeat(70))
      
      const testIssues = issues.filter(i => i.type === 'TEST_USER')
      
      for (const issue of testIssues) {
        console.log(`\nRemoving ${issue.userName} (${issue.userEmail})`)
        
        const user = await User.findById(issue.userId)
        if (user && user.familyCode) {
          const family = await FamilyTree.findOne({ familyCode: user.familyCode })
          if (family) {
            // Delete node
            const node = await FamilyTreeNode.findOne({ userId: user._id })
            if (node) {
              await FamilyTreeConnection.deleteMany({
                $or: [{ sourceNodeId: node._id }, { targetNodeId: node._id }]
              })
              await FamilyTreeNode.deleteOne({ _id: node._id })
              console.log(`  ✅ Removed node and connections`)
            }
            
            // Delete family member
            await FamilyMember.deleteMany({ userId: user._id })
          }
        }
        
        // Delete user
        await User.deleteOne({ _id: issue.userId })
        console.log(`  ✅ Removed user`)
      }
      
      console.log(`\n✅ Cleaned ${testIssues.length} test users`)
      
      // Update arrays after cleanup
      console.log(`\nUpdating arrays after cleanup...`)
      for (const family of families) {
        const users = await User.find({ familyCode: family.familyCode })
          .select('_id fullName email loginId phone gender dateOfBirth placeOfBirth')
          .lean()
        
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
        
        await FamilyMembersByFamily.findOneAndUpdate(
          { familyTreeId: family._id },
          { 
            members: members,
            memberCount: users.length
          },
          { upsert: true }
        )
        
        // Update family memberCount
        const actualNodes = await FamilyTreeNode.countDocuments({ familyTreeId: family._id })
        await FamilyTree.findByIdAndUpdate(
          family._id,
          { memberCount: actualNodes }
        )
      }
      console.log(`  ✅ Arrays updated`)
    }
    
    console.log('\n✅ DONE\n')
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

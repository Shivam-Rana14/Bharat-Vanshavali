#!/usr/bin/env node
/**
 * Verification Script: Signup Join vs Dashboard Join
 * 
 * Tests that both flows produce IDENTICAL database state
 */

require('dotenv').config()
const mongoose = require('mongoose')

// Import models
const User = require('../lib/mongodb/models/User').default
const FamilyTree = require('../lib/mongodb/models/FamilyTree').default
const FamilyTreeNode = require('../lib/mongodb/models/FamilyTreeNode').default
const FamilyMember = require('../lib/mongodb/models/FamilyMember').default
const FamilyMembersByFamily = require('../lib/mongodb/models/FamilyMembersByFamily').default

const MONGODB_URI = process.env.MONGODB_URI

async function connectDB() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Connected to MongoDB')
  }
}

async function cleanup() {
  console.log('\n🧹 Cleaning up test data...')
  
  // Delete test users
  await User.deleteMany({ email: { $in: ['signup-test@test.com', 'dashboard-test@test.com'] } })
  
  // Delete test family
  const testFamily = await FamilyTree.findOne({ familyCode: 'TEST123' })
  if (testFamily) {
    await FamilyTreeNode.deleteMany({ familyTreeId: testFamily._id })
    await FamilyMember.deleteMany({ familyTreeId: testFamily._id })
    await FamilyMembersByFamily.deleteMany({ familyTreeId: testFamily._id })
    await FamilyTree.deleteOne({ _id: testFamily._id })
  }
  
  console.log('✅ Cleanup complete')
}

async function createTestFamily() {
  console.log('\n📦 Creating test family...')
  
  // Create root user
  const rootUser = await new User({
    email: 'root@test.com',
    password: 'hashed_password',
    fullName: 'Root User',
    loginId: 'ROOT001',
    familyCode: 'TEST123',
    gender: 'male'
  }).save()
  
  // Create family tree
  const familyTree = await new FamilyTree({
    name: 'Test Family Tree',
    description: 'Test family',
    rootUserId: rootUser._id,
    familyCode: 'TEST123',
    createdBy: rootUser._id,
    memberCount: 1,
    isActive: true
  }).save()
  
  // Create root node
  await new FamilyTreeNode({
    familyTreeId: familyTree._id,
    userId: rootUser._id,
    position: { x: 0, y: 0 },
    nodeData: {
      width: 200,
      height: 100,
      color: '#3B82F6',
      isVisible: true
    }
  }).save()
  
  console.log('✅ Test family created:', familyTree.familyCode)
  return { rootUser, familyTree }
}

async function testSignupJoin() {
  console.log('\n🧪 Test 1: Signup Join Flow')
  console.log('━'.repeat(50))
  
  // Simulate signup with existing family code
  const databaseService = require('../lib/mongodb/database').databaseService
  
  const signupUser = await databaseService.signUp({
    email: 'signup-test@test.com',
    password: 'password123',
    fullName: 'Signup Test User',
    phone: '1234567890',
    gender: 'male',
    familyCode: 'TEST123'  // Join existing family
  })
  
  console.log('✅ User created via signup')
  
  // Verify database state
  const familyTree = await FamilyTree.findOne({ familyCode: 'TEST123' })
  const userNode = await FamilyTreeNode.findOne({ userId: signupUser._id })
  const familyMember = await FamilyMember.findOne({ userId: signupUser._id })
  const membersByFamily = await FamilyMembersByFamily.findOne({ familyTreeId: familyTree._id })
  
  console.log('\n📊 Signup Join Results:')
  console.log('  User.familyCode:', signupUser.familyCode)
  console.log('  FamilyTreeNode exists:', !!userNode)
  console.log('  Node position:', userNode?.position)
  console.log('  FamilyTree.memberCount:', familyTree.memberCount)
  console.log('  FamilyMember exists:', !!familyMember, '(should be FALSE)')
  console.log('  FamilyMembersByFamily updated:', !!membersByFamily)
  
  return {
    user: signupUser,
    node: userNode,
    memberCount: familyTree.memberCount,
    hasFamilyMember: !!familyMember,
    hasArrays: !!membersByFamily
  }
}

async function testDashboardJoin() {
  console.log('\n🧪 Test 2: Dashboard Join Flow')
  console.log('━'.repeat(50))
  
  // Create user first (simulating existing user)
  const dashboardUser = await new User({
    email: 'dashboard-test@test.com',
    password: 'hashed_password',
    fullName: 'Dashboard Test User',
    loginId: 'DASH001',
    phone: '0987654321',
    gender: 'female'
  }).save()
  
  console.log('✅ User created (no family)')
  
  // Simulate dashboard join API call
  const response = await fetch('http://localhost:3000/api/family-members/join', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `auth-token=test_token_for_${dashboardUser._id}`
    },
    body: JSON.stringify({
      familyCode: 'TEST123',
      relationship: 'sister'
    })
  })
  
  const result = await response.json()
  console.log('✅ Join API response:', result.success ? 'SUCCESS' : 'FAILED')
  
  // Verify database state
  const updatedUser = await User.findById(dashboardUser._id)
  const familyTree = await FamilyTree.findOne({ familyCode: 'TEST123' })
  const userNode = await FamilyTreeNode.findOne({ userId: dashboardUser._id })
  const familyMember = await FamilyMember.findOne({ userId: dashboardUser._id })
  const membersByFamily = await FamilyMembersByFamily.findOne({ familyTreeId: familyTree._id })
  
  console.log('\n📊 Dashboard Join Results:')
  console.log('  User.familyCode:', updatedUser.familyCode)
  console.log('  FamilyTreeNode exists:', !!userNode)
  console.log('  Node position:', userNode?.position)
  console.log('  FamilyTree.memberCount:', familyTree.memberCount)
  console.log('  FamilyMember exists:', !!familyMember, '(should be FALSE)')
  console.log('  FamilyMembersByFamily updated:', !!membersByFamily)
  
  return {
    user: updatedUser,
    node: userNode,
    memberCount: familyTree.memberCount,
    hasFamilyMember: !!familyMember,
    hasArrays: !!membersByFamily
  }
}

async function compareResults(signupResult, dashboardResult) {
  console.log('\n🔍 Comparing Results')
  console.log('━'.repeat(50))
  
  const checks = [
    {
      name: 'User has familyCode',
      signup: !!signupResult.user.familyCode,
      dashboard: !!dashboardResult.user.familyCode
    },
    {
      name: 'FamilyTreeNode created',
      signup: !!signupResult.node,
      dashboard: !!dashboardResult.node
    },
    {
      name: 'Node has grid positioning',
      signup: signupResult.node?.position?.x !== undefined,
      dashboard: dashboardResult.node?.position?.x !== undefined
    },
    {
      name: 'memberCount incremented',
      signup: signupResult.memberCount === 2,
      dashboard: dashboardResult.memberCount === 3
    },
    {
      name: 'FamilyMember NOT created',
      signup: !signupResult.hasFamilyMember,
      dashboard: !dashboardResult.hasFamilyMember
    },
    {
      name: 'FamilyMembersByFamily updated',
      signup: signupResult.hasArrays,
      dashboard: dashboardResult.hasArrays
    }
  ]
  
  let allPassed = true
  
  checks.forEach(check => {
    const passed = check.signup === check.dashboard && check.signup === true
    const icon = passed ? '✅' : '❌'
    console.log(`${icon} ${check.name}`)
    console.log(`   Signup: ${check.signup}, Dashboard: ${check.dashboard}`)
    if (!passed) allPassed = false
  })
  
  console.log('\n' + '━'.repeat(50))
  if (allPassed) {
    console.log('✅ ALL TESTS PASSED - Both flows produce identical results!')
  } else {
    console.log('❌ TESTS FAILED - Flows produce different results')
  }
  
  return allPassed
}

async function main() {
  try {
    await connectDB()
    
    // Cleanup any previous test data
    await cleanup()
    
    // Create test family
    await createTestFamily()
    
    // Test signup join
    const signupResult = await testSignupJoin()
    
    // Test dashboard join
    const dashboardResult = await testDashboardJoin()
    
    // Compare results
    const passed = await compareResults(signupResult, dashboardResult)
    
    // Cleanup
    await cleanup()
    
    process.exit(passed ? 0 : 1)
  } catch (error) {
    console.error('\n❌ Error:', error.message)
    console.error(error.stack)
    process.exit(1)
  } finally {
    await mongoose.connection.close()
  }
}

main()

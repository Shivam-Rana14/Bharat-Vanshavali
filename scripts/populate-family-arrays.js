// Script to populate existing families with member arrays
// Run this once to populate existing data

const mongoose = require('mongoose')
require('dotenv').config()

// Import models (simplified for script)
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bharat-vanshavali')
    console.log('Connected to MongoDB')
  } catch (error) {
    console.error('MongoDB connection error:', error)
    process.exit(1)
  }
}

const populateFamilyArrays = async () => {
  try {
    await connectDB()
    
    // Get all family trees
    const FamilyTree = mongoose.model('FamilyTree')
    const User = mongoose.model('User')
    const FamilyTreeNode = mongoose.model('FamilyTreeNode')
    const FamilyMembersByFamily = mongoose.model('FamilyMembersByFamily')
    
    const familyTrees = await FamilyTree.find({}).lean()
    console.log(`Found ${familyTrees.length} family trees`)
    
    for (const familyTree of familyTrees) {
      console.log(`Processing family: ${familyTree.name} (${familyTree.familyCode})`)
      
      // Get all users in this family
      const users = await User.find({ familyCode: familyTree.familyCode }).lean()
      console.log(`  Found ${users.length} users`)
      
      if (users.length === 0) continue
      
      // Get all nodes for position data
      const nodes = await FamilyTreeNode.find({ familyTreeId: familyTree._id }).lean()
      
      // Create member arrays
      const memberBasicInfo = users.map((user) => {
        const node = nodes.find((n) => n.userId.toString() === user._id.toString())
        return {
          userId: user._id,
          fullName: user.fullName,
          loginId: user.loginId,
          email: user.email,
          gender: user.gender,
          dateOfBirth: user.dateOfBirth,
          verificationStatus: user.verificationStatus || 'pending',
          isRoot: familyTree.rootUserId.toString() === user._id.toString(),
          joinedAt: user.createdAt
        }
      })

      const memberDetails = users.map((user) => {
        const node = nodes.find((n) => n.userId.toString() === user._id.toString())
        return {
          userId: user._id,
          fullName: user.fullName,
          loginId: user.loginId,
          email: user.email,
          gender: user.gender,
          dateOfBirth: user.dateOfBirth,
          placeOfBirth: user.placeOfBirth,
          verificationStatus: user.verificationStatus || 'pending',
          isRoot: familyTree.rootUserId.toString() === user._id.toString(),
          joinedAt: user.createdAt,
          nodePosition: node?.position || { x: 0, y: 0 }
        }
      })

      // Calculate statistics
      const stats = {
        totalMembers: users.length,
        verifiedMembers: users.filter((u) => u.verificationStatus === 'verified').length,
        pendingMembers: users.filter((u) => u.verificationStatus === 'pending').length,
        maleMembers: users.filter((u) => u.gender === 'male').length,
        femaleMembers: users.filter((u) => u.gender === 'female').length,
        otherMembers: users.filter((u) => u.gender === 'other').length
      }

      // Update FamilyTree with members array
      await FamilyTree.findByIdAndUpdate(familyTree._id, {
        members: memberBasicInfo,
        memberCount: users.length
      })

      // Create or update FamilyMembersByFamily document
      await FamilyMembersByFamily.findOneAndUpdate(
        { familyCode: familyTree.familyCode },
        {
          familyCode: familyTree.familyCode,
          familyTreeId: familyTree._id,
          familyName: familyTree.name,
          rootUserId: familyTree.rootUserId,
          memberUserIds: users.map((u) => u._id),
          memberDetails,
          stats,
          lastUpdated: new Date()
        },
        { upsert: true, new: true }
      )
      
      console.log(`  ✅ Updated arrays for family: ${familyTree.name}`)
    }
    
    console.log('✅ All family arrays populated successfully!')
    
  } catch (error) {
    console.error('Error populating family arrays:', error)
  } finally {
    await mongoose.disconnect()
    console.log('Disconnected from MongoDB')
  }
}

// Run the script
populateFamilyArrays()

const { MongoClient } = require('mongodb')

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bharat-vanshavali'

async function fixMissingNodes() {
  const client = new MongoClient(MONGODB_URI)
  
  try {
    await client.connect()
    console.log('Connected to MongoDB')
    
    const db = client.db()
    const usersCollection = db.collection('users')
    const familyTreesCollection = db.collection('familytrees')
    const nodesCollection = db.collection('familytreenodes')
    
    // Get all users who have a family code
    const users = await usersCollection.find({ 
      familyCode: { $exists: true, $ne: null } 
    }).toArray()
    
    console.log(`Found ${users.length} users with family codes`)
    
    for (const user of users) {
      console.log(`\nProcessing user: ${user.fullName} (${user.loginId}) - Family: ${user.familyCode}`)
      
      // Check if user already has a node
      const existingNode = await nodesCollection.findOne({ userId: user._id })
      if (existingNode) {
        console.log(`  ✓ User already has a node`)
        continue
      }
      
      // Find family tree for this family code
      let familyTree = await familyTreesCollection.findOne({ familyCode: user.familyCode })
      
      if (!familyTree) {
        console.log(`  ⚠ No family tree found for ${user.familyCode}, creating one...`)
        
        // Create family tree with this user as root
        familyTree = {
          name: `${user.fullName}'s Family Tree`,
          description: `${user.fullName}'s lineage`,
          rootUserId: user._id,
          familyCode: user.familyCode,
          createdBy: user._id,
          memberCount: 1,
          isActive: true,
          treeSettings: {
            backgroundColor: '#f8f9fa',
            gridEnabled: true,
            snapToGrid: false,
            zoomLevel: 1,
            centerPosition: { x: 0, y: 0 }
          },
          createdAt: new Date(),
          updatedAt: new Date()
        }
        
        const result = await familyTreesCollection.insertOne(familyTree)
        familyTree._id = result.insertedId
        console.log(`  ✓ Created family tree: ${familyTree._id}`)
      } else {
        console.log(`  ✓ Found existing family tree: ${familyTree.name}`)
        
        // Update member count
        await familyTreesCollection.updateOne(
          { _id: familyTree._id },
          { $inc: { memberCount: 1 } }
        )
      }
      
      // Create node for user
      const nodeCount = await nodesCollection.countDocuments({ familyTreeId: familyTree._id })
      
      const node = {
        familyTreeId: familyTree._id,
        userId: user._id,
        position: {
          x: (nodeCount % 5) * 250, // Arrange in a grid pattern
          y: Math.floor(nodeCount / 5) * 150
        },
        nodeData: {
          width: 200,
          height: 100,
          color: familyTree.rootUserId.toString() === user._id.toString() ? '#e3f2fd' : '#fff3e0',
          isVisible: true
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      await nodesCollection.insertOne(node)
      console.log(`  ✓ Created node for user at position (${node.position.x}, ${node.position.y})`)
    }
    
    console.log('\n✅ Migration completed successfully!')
    
    // Show summary
    const totalNodes = await nodesCollection.countDocuments()
    const totalTrees = await familyTreesCollection.countDocuments()
    console.log(`\n📊 Summary:`)
    console.log(`   - Total family trees: ${totalTrees}`)
    console.log(`   - Total nodes: ${totalNodes}`)
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
  } finally {
    await client.close()
  }
}

// Run migration if called directly
if (require.main === module) {
  fixMissingNodes()
}

module.exports = { fixMissingNodes }

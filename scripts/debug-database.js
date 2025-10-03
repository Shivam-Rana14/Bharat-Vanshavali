const { MongoClient } = require('mongodb')

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bharat-vanshavali'

async function debugDatabase() {
  const client = new MongoClient(MONGODB_URI)
  
  try {
    await client.connect()
    console.log('Connected to MongoDB')
    
    const db = client.db()
    
    // List all collections
    const collections = await db.listCollections().toArray()
    console.log('\n📋 Available collections:')
    collections.forEach(col => console.log(`   - ${col.name}`))
    
    // Try different possible collection names
    const possibleUserCollections = ['users', 'user', 'User']
    const possibleTreeCollections = ['familytrees', 'familytree', 'FamilyTree']
    const possibleNodeCollections = ['familytreenodes', 'familytreenode', 'FamilyTreeNode']
    
    let usersCollection, familyTreesCollection, nodesCollection
    let userCount = 0, treeCount = 0, nodeCount = 0
    
    // Find users collection
    for (const name of possibleUserCollections) {
      try {
        const collection = db.collection(name)
        const count = await collection.countDocuments()
        if (count > 0) {
          usersCollection = collection
          userCount = count
          console.log(`\n👥 Found users in collection '${name}': ${count} documents`)
          break
        }
      } catch (e) {}
    }
    
    if (usersCollection && userCount > 0) {
      const sampleUsers = await usersCollection.find({}).limit(5).toArray()
      console.log('\n📄 Sample users:')
      sampleUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.fullName} (${user.loginId}) - Family: ${user.familyCode || 'NONE'}`)
      })
    }
    
    // Find family trees collection
    for (const name of possibleTreeCollections) {
      try {
        const collection = db.collection(name)
        const count = await collection.countDocuments()
        if (count > 0) {
          familyTreesCollection = collection
          treeCount = count
          console.log(`\n🌳 Found family trees in collection '${name}': ${count} documents`)
          break
        }
      } catch (e) {}
    }
    
    if (familyTreesCollection && treeCount > 0) {
      const sampleTrees = await familyTreesCollection.find({}).toArray()
      console.log('\n📄 Family trees:')
      sampleTrees.forEach((tree, index) => {
        console.log(`   ${index + 1}. ${tree.name} - Code: ${tree.familyCode} - Root: ${tree.rootUserId}`)
      })
    }
    
    // Find nodes collection
    for (const name of possibleNodeCollections) {
      try {
        const collection = db.collection(name)
        const count = await collection.countDocuments()
        if (count > 0) {
          nodesCollection = collection
          nodeCount = count
          console.log(`\n🔗 Found nodes in collection '${name}': ${count} documents`)
          break
        }
      } catch (e) {}
    }
    
    if (nodesCollection && nodeCount > 0) {
      const sampleNodes = await nodesCollection.find({}).toArray()
      console.log('\n📄 Nodes:')
      sampleNodes.forEach((node, index) => {
        console.log(`   ${index + 1}. Node ${node._id} - User: ${node.userId} - Tree: ${node.familyTreeId}`)
      })
    }
    
    if (userCount === 0 && treeCount === 0 && nodeCount === 0) {
      console.log('\n⚠️  No data found in any expected collections!')
      console.log('This might indicate:')
      console.log('   - Wrong database connection')
      console.log('   - Data is in a different database')
      console.log('   - Collections have different names')
      console.log('   - No data has been created yet')
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error)
  } finally {
    await client.close()
  }
}

// Run debug if called directly
if (require.main === module) {
  debugDatabase()
}

module.exports = { debugDatabase }

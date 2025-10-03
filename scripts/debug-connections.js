/**
 * Debug script to analyze and clean up family tree connections
 * Usage: node scripts/debug-connections.js [familyCode]
 */

const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bharat-vanshavali';

async function debugConnections(familyCode) {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db();
    
    console.log(`🔍 Debugging connections for family: ${familyCode}\n`);
    
    // Find family tree
    const familyTree = await db.collection('familytrees').findOne({ familyCode });
    if (!familyTree) {
      console.log('❌ Family tree not found');
      return;
    }
    
    console.log(`📋 Family Tree: ${familyTree.name} (ID: ${familyTree._id})`);
    console.log(`👥 Members: ${familyTree.memberCount}\n`);
    
    // Get all nodes
    const nodes = await db.collection('familytreenodes').find({ 
      familyTreeId: familyTree._id 
    }).toArray();
    
    console.log(`🔗 Found ${nodes.length} nodes:`);
    nodes.forEach(node => {
      console.log(`  - ${node.nodeData?.user?.fullName || 'Unknown'} (${node._id})`);
    });
    console.log();
    
    // Get all connections
    const connections = await db.collection('familytreeconnections').find({ 
      familyTreeId: familyTree._id 
    }).toArray();
    
    console.log(`🔗 Found ${connections.length} connections:`);
    
    for (const conn of connections) {
      const sourceNode = nodes.find(n => n._id.toString() === conn.sourceNodeId.toString());
      const targetNode = nodes.find(n => n._id.toString() === conn.targetNodeId.toString());
      
      const sourceName = sourceNode?.nodeData?.user?.fullName || 'Unknown';
      const targetName = targetNode?.nodeData?.user?.fullName || 'Unknown';
      
      console.log(`  🔗 ${sourceName} → ${targetName}`);
      console.log(`     Label: ${conn.relationshipLabel}`);
      console.log(`     Type: ${conn.relationshipType}`);
      console.log(`     Handles: ${conn.sourceHandle || 'missing'} → ${conn.targetHandle || 'missing'}`);
      console.log(`     ID: ${conn._id}`);
      
      // Check for missing handle information
      if (!conn.sourceHandle || !conn.targetHandle) {
        console.log(`     ⚠️  MISSING HANDLE INFORMATION - This connection may not render properly`);
      }
      
      // Check for invalid node references
      if (!sourceNode || !targetNode) {
        console.log(`     ❌ INVALID NODE REFERENCE - This connection is broken`);
      }
      
      console.log();
    }
    
    // Identify problematic connections
    const problematicConnections = connections.filter(conn => 
      !conn.sourceHandle || !conn.targetHandle ||
      !nodes.find(n => n._id.toString() === conn.sourceNodeId.toString()) ||
      !nodes.find(n => n._id.toString() === conn.targetNodeId.toString())
    );
    
    if (problematicConnections.length > 0) {
      console.log(`⚠️  Found ${problematicConnections.length} problematic connections:`);
      problematicConnections.forEach(conn => {
        console.log(`   - ${conn._id}: ${conn.relationshipLabel}`);
        console.log(`     Issues: ${!conn.sourceHandle ? 'Missing sourceHandle ' : ''}${!conn.targetHandle ? 'Missing targetHandle ' : ''}`);
      });
      console.log();
      
      console.log(`🧹 To clean up these connections, run:`);
      console.log(`   node scripts/debug-connections.js ${familyCode} --clean`);
    } else {
      console.log(`✅ All connections look good!`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

async function cleanupConnections(familyCode) {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db();
    
    console.log(`🧹 Cleaning up connections for family: ${familyCode}\n`);
    
    // Find family tree
    const familyTree = await db.collection('familytrees').findOne({ familyCode });
    if (!familyTree) {
      console.log('❌ Family tree not found');
      return;
    }
    
    // Get all nodes for reference validation
    const nodes = await db.collection('familytreenodes').find({ 
      familyTreeId: familyTree._id 
    }).toArray();
    
    const nodeIds = new Set(nodes.map(n => n._id.toString()));
    
    // Delete connections with missing handle information
    const deleteResult1 = await db.collection('familytreeconnections').deleteMany({
      familyTreeId: familyTree._id,
      $or: [
        { sourceHandle: { $exists: false } },
        { targetHandle: { $exists: false } },
        { sourceHandle: null },
        { targetHandle: null },
        { sourceHandle: '' },
        { targetHandle: '' }
      ]
    });
    
    console.log(`🗑️  Removed ${deleteResult1.deletedCount} connections with missing handle information`);
    
    // Delete connections with invalid node references
    const allConnections = await db.collection('familytreeconnections').find({
      familyTreeId: familyTree._id
    }).toArray();
    
    let brokenConnectionsCount = 0;
    for (const conn of allConnections) {
      const sourceExists = nodeIds.has(conn.sourceNodeId.toString());
      const targetExists = nodeIds.has(conn.targetNodeId.toString());
      
      if (!sourceExists || !targetExists) {
        await db.collection('familytreeconnections').deleteOne({ _id: conn._id });
        brokenConnectionsCount++;
        console.log(`🗑️  Removed broken connection: ${conn.relationshipLabel} (${conn._id})`);
      }
    }
    
    console.log(`🗑️  Removed ${brokenConnectionsCount} connections with invalid node references`);
    console.log(`✅ Cleanup complete!`);
    
  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    await client.close();
  }
}

// Main execution
const args = process.argv.slice(2);
const familyCode = args[0];
const shouldClean = args.includes('--clean');

if (!familyCode) {
  console.log('Usage: node scripts/debug-connections.js <familyCode> [--clean]');
  console.log('');
  console.log('Examples:');
  console.log('  node scripts/debug-connections.js BV123456              # Debug connections');
  console.log('  node scripts/debug-connections.js BV123456 --clean      # Clean up problematic connections');
  process.exit(1);
}

if (shouldClean) {
  cleanupConnections(familyCode);
} else {
  debugConnections(familyCode);
}


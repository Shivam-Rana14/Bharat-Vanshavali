const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');

// Load environment variables
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
} else {
  require('dotenv').config();
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const API_URL = 'http://localhost:3000/api/family-members/join';

// Define Schemas (Minimal)
const UserSchema = new mongoose.Schema({}, { strict: false });
const FamilyTreeSchema = new mongoose.Schema({}, { strict: false });
const FamilyTreeNodeSchema = new mongoose.Schema({}, { strict: false });

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const FamilyTree = mongoose.models.FamilyTree || mongoose.model('FamilyTree', FamilyTreeSchema);
const FamilyTreeNode = mongoose.models.FamilyTreeNode || mongoose.model('FamilyTreeNode', FamilyTreeNodeSchema);

async function connectDB() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI missing');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB');
}

async function createTestUser(name, familyCode, isRoot = false) {
  const user = await User.create({
    email: `test-${Date.now()}-${Math.random()}@example.com`,
    password: 'hashedpassword',
    fullName: name,
    loginId: `BV${Date.now()}${Math.floor(Math.random()*1000)}`,
    userType: 'citizen',
    familyCode: familyCode,
    verificationStatus: 'verified'
  });
  return user;
}

async function createFamily(rootUser, memberCount = 1) {
  const familyCode = `TEST${Math.floor(Math.random() * 10000)}`;
  const tree = await FamilyTree.create({
    name: `${rootUser.fullName}'s Tree`,
    rootUserId: rootUser._id,
    familyCode: familyCode,
    createdBy: rootUser._id,
    memberCount: memberCount,
    isActive: true
  });
  
  // Create node for root
  await FamilyTreeNode.create({
    familyTreeId: tree._id,
    userId: rootUser._id,
    position: { x: 0, y: 0 },
    nodeData: { color: 'blue' }
  });

  // Update user family code
  await User.updateOne({ _id: rootUser._id }, { familyCode });

  return { tree, familyCode };
}

const logStream = fs.createWriteStream('verify_output.txt', { flags: 'a' });
function log(msg) {
  console.log(msg);
  logStream.write(msg + '\n');
}

async function runTest() {
  try {
    await connectDB();

    // 1. Setup Target Family
    const targetRoot = await createTestUser('Target Root', null);
    const { familyCode: targetCode } = await createFamily(targetRoot, 1);
    log(`\n🎯 Target Family Code: ${targetCode}`);

    // ---------------------------------------------------------
    // Scenario 1: Root with > 1 member (Should Fail)
    // ---------------------------------------------------------
    log('\n🧪 Testing Scenario 1: Root with > 1 member...');
    const rootMulti = await createTestUser('Root Multi', null);
    const { tree: treeMulti } = await createFamily(rootMulti, 2); // 2 members
    // Add dummy member to count
    await FamilyTreeNode.create({
        familyTreeId: treeMulti._id,
        userId: new mongoose.Types.ObjectId(), // Dummy user ID
        position: { x: 100, y: 0 },
        nodeData: { color: 'orange' }
    });

    const tokenMulti = jwt.sign({ id: rootMulti._id, type: 'citizen', familyCode: treeMulti.familyCode }, JWT_SECRET);
    
    const resMulti = await fetch(API_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': `auth-token=${tokenMulti}`
      },
      body: JSON.stringify({ familyCode: targetCode, relationship: 'brother' })
    });

    const dataMulti = await resMulti.json();
    if (resMulti.status === 400 && dataMulti.error.includes('cannot join another family')) {
      log('✅ Scenario 1 Passed: Restriction enforced.');
    } else {
      log('❌ Scenario 1 Failed: ' + JSON.stringify(dataMulti));
    }

    // ---------------------------------------------------------
    // Scenario 2: Root with 1 member (Should Succeed)
    // ---------------------------------------------------------
    log('\n🧪 Testing Scenario 2: Root with 1 member...');
    const rootSingle = await createTestUser('Root Single', null);
    const { tree: treeSingle } = await createFamily(rootSingle, 1);

    const tokenSingle = jwt.sign({ id: rootSingle._id, type: 'citizen', familyCode: treeSingle.familyCode }, JWT_SECRET);

    const resSingle = await fetch(API_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': `auth-token=${tokenSingle}`
      },
      body: JSON.stringify({ familyCode: targetCode, relationship: 'sister' })
    });

    const dataSingle = await resSingle.json();
    if (resSingle.ok && dataSingle.success) {
      log('✅ Scenario 2 Passed: Migration successful.');
      
      // Verify DB state
      const updatedUser = await User.findById(rootSingle._id);
      if (updatedUser.familyCode === targetCode) {
        log('   - User familyCode updated.');
      } else {
        log('   - User familyCode NOT updated.');
      }

      const oldTree = await FamilyTree.findById(treeSingle._id);
      if (!oldTree.isActive) {
        log('   - Old tree marked inactive.');
      } else {
        log('   - Old tree NOT marked inactive.');
      }

    } else {
      log('❌ Scenario 2 Failed: ' + JSON.stringify(dataSingle));
    }

    // ---------------------------------------------------------
    // Scenario 3: Regular Member (Should Succeed)
    // ---------------------------------------------------------
    log('\n🧪 Testing Scenario 3: Regular Member...');
    const rootForMember = await createTestUser('Root For Member', null);
    const { tree: treeForMember, familyCode: codeForMember } = await createFamily(rootForMember, 2);
    
    const regularMember = await createTestUser('Regular Member', codeForMember);
    // Add node for regular member
    await FamilyTreeNode.create({
        familyTreeId: treeForMember._id,
        userId: regularMember._id,
        position: { x: 100, y: 0 },
        nodeData: { color: 'orange' }
    });

    const tokenMember = jwt.sign({ id: regularMember._id, type: 'citizen', familyCode: codeForMember }, JWT_SECRET);

    const resMember = await fetch(API_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': `auth-token=${tokenMember}`
      },
      body: JSON.stringify({ familyCode: targetCode, relationship: 'son' })
    });

    const dataMember = await resMember.json();
    if (resMember.ok && dataMember.success) {
      log('✅ Scenario 3 Passed: Member migration successful.');
       // Verify DB state
       const updatedMember = await User.findById(regularMember._id);
       if (updatedMember.familyCode === targetCode) {
         log('   - Member familyCode updated.');
       } else {
         log('   - Member familyCode NOT updated.');
       }
    } else {
      log('❌ Scenario 3 Failed: ' + JSON.stringify(dataMember));
    }

  } catch (error) {
    log('Test Error: ' + error);
  } finally {
    await mongoose.disconnect();
    logStream.end();
  }
}

runTest();

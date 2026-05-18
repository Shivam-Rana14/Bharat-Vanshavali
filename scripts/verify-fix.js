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
const FamilyMemberSchema = new mongoose.Schema({}, { strict: false });

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const FamilyTree = mongoose.models.FamilyTree || mongoose.model('FamilyTree', FamilyTreeSchema);
const FamilyTreeNode = mongoose.models.FamilyTreeNode || mongoose.model('FamilyTreeNode', FamilyTreeNodeSchema);
const FamilyMember = mongoose.models.FamilyMember || mongoose.model('FamilyMember', FamilyMemberSchema);

async function connectDB() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI missing');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB');
}

async function createTestUser(name, familyCode) {
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

  // Create FamilyMember record
  await FamilyMember.create({
    userId: rootUser._id,
    familyTreeId: tree._id,
    fullName: rootUser.fullName,
    relationship: 'root',
    isAlive: true
  });

  // Update user family code
  await User.updateOne({ _id: rootUser._id }, { familyCode });

  return { tree, familyCode };
}

const logStream = fs.createWriteStream('verify_fix_output.txt', { flags: 'a' });
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
    // Scenario: Root with 1 member (Should Succeed & Cleanup)
    // ---------------------------------------------------------
    log('\n🧪 Testing Scenario: Root with 1 member joining another family...');
    const rootSingle = await createTestUser('Root Single', null);
    const { tree: treeSingle, familyCode: oldCode } = await createFamily(rootSingle, 1);
    log(`   - Created Old Family: ${oldCode} (ID: ${treeSingle._id})`);

    const tokenSingle = jwt.sign({ id: rootSingle._id, type: 'citizen', familyCode: treeSingle.familyCode }, JWT_SECRET);

    // Test case insensitivity
    const targetCodeLower = targetCode.toLowerCase();
    log(`   - Attempting to join with lowercase code: ${targetCodeLower}`);

    const resSingle = await fetch(API_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': `auth-token=${tokenSingle}`
      },
      body: JSON.stringify({ familyCode: targetCodeLower, relationship: 'sister' })
    });

    const dataSingle = await resSingle.json();
    
    if (resSingle.ok && dataSingle.success) {
      log('✅ Join successful.');
      
      // Verify DB state
      const updatedUser = await User.findById(rootSingle._id);
      if (updatedUser.familyCode === targetCode) {
        log('✅ User familyCode updated correctly.');
      } else {
        log(`❌ User familyCode NOT updated. Got: ${updatedUser.familyCode}`);
      }

      // CHECK HARD DELETE
      const oldTree = await FamilyTree.findById(treeSingle._id);
      if (!oldTree) {
        log('✅ Old family tree HARD DELETED.');
      } else {
        log('❌ Old family tree still exists (should be deleted).');
      }

      // CHECK MEMBER CLEANUP
      const oldMember = await FamilyMember.findOne({ userId: rootSingle._id, familyTreeId: treeSingle._id });
      if (!oldMember) {
        log('✅ Old FamilyMember record deleted.');
      } else {
        log('❌ Old FamilyMember record still exists.');
      }

    } else {
      log('❌ Join Failed: ' + JSON.stringify(dataSingle));
    }

    // ---------------------------------------------------------
    // Scenario: Join without relationship (Should Succeed now)
    // ---------------------------------------------------------
    log('\n🧪 Testing Scenario: Join without relationship...');
    const rootNoRel = await createTestUser('Root No Rel', null);
    const { tree: treeNoRel } = await createFamily(rootNoRel, 1);
    const tokenNoRel = jwt.sign({ id: rootNoRel._id, type: 'citizen', familyCode: treeNoRel.familyCode }, JWT_SECRET);

    const resNoRel = await fetch(API_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': `auth-token=${tokenNoRel}`
      },
      body: JSON.stringify({ familyCode: targetCode }) // No relationship
    });

    const dataNoRel = await resNoRel.json();
    if (resNoRel.ok && dataNoRel.success) {
      log('✅ Join without relationship successful.');
    } else {
      log('❌ Join without relationship Failed: ' + JSON.stringify(dataNoRel));
    }

  } catch (error) {
    log('Test Error: ' + error);
  } finally {
    await mongoose.disconnect();
    logStream.end();
  }
}

runTest();

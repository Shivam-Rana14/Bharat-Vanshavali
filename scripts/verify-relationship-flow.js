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
const BASE_URL = 'http://localhost:3000/api';

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

  // Update user family code
  await User.updateOne({ _id: rootUser._id }, { familyCode });

  return { tree, familyCode };
}

const logStream = fs.createWriteStream('verify_rel_flow_output.txt', { flags: 'a' });
function log(msg) {
  console.log(msg);
  logStream.write(msg + '\n');
}

async function runTest() {
  try {
    await connectDB();

    // 1. Setup Target Family
    const targetRoot = await createTestUser('Target Root', null);
    const { familyCode: targetCode, tree: targetTree } = await createFamily(targetRoot, 1);
    log(`\n🎯 Target Family Code: ${targetCode} (Root: ${targetRoot.fullName})`);

    // 2. Setup Joining User
    const joiningUser = await createTestUser('Joining User', null);
    const { tree: oldTree } = await createFamily(joiningUser, 1);
    const token = jwt.sign({ id: joiningUser._id, type: 'citizen', familyCode: oldTree.familyCode }, JWT_SECRET);

    // ---------------------------------------------------------
    // Step 1: Validate Code
    // ---------------------------------------------------------
    log('\n🧪 Step 1: Validating Family Code...');
    const validateRes = await fetch(`${BASE_URL}/family-tree/validate-code?code=${targetCode}`, {
      headers: { 'Cookie': `auth-token=${token}` }
    });
    const validateData = await validateRes.json();

    if (validateRes.ok && validateData.success) {
      log('✅ Validation Successful.');
      log(`   - Family Name: ${validateData.familyName}`);
      log(`   - Root Member: ${validateData.rootMemberName}`);
      
      if (validateData.rootMemberName === targetRoot.fullName) {
        log('✅ Root member name matches.');
      } else {
        log('❌ Root member name MISMATCH.');
      }
    } else {
      log('❌ Validation Failed: ' + JSON.stringify(validateData));
      return;
    }

    // ---------------------------------------------------------
    // Step 2: Join with Relationship
    // ---------------------------------------------------------
    log('\n🧪 Step 2: Joining with Relationship "brother"...');
    const joinRes = await fetch(`${BASE_URL}/family-members/join`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': `auth-token=${token}`
      },
      body: JSON.stringify({ 
        familyCode: targetCode,
        relationship: 'brother'
      })
    });

    const joinData = await joinRes.json();

    if (joinRes.ok && joinData.success) {
      log('✅ Join Successful.');

      // Verify Relationship in DB
      const memberRecord = await FamilyMember.findOne({ 
        familyTreeId: targetTree._id,
        userId: joiningUser._id 
      });

      if (memberRecord && memberRecord.relationship === 'brother') {
        log('✅ Relationship "brother" correctly saved in DB.');
      } else {
        log(`❌ Relationship NOT saved correctly. Got: ${memberRecord?.relationship}`);
      }

      // ---------------------------------------------------------
      // Step 3: Verify Node and Connection Creation
      // ---------------------------------------------------------
      log('\n🧪 Step 3: Verifying Visual Elements (Nodes & Connections)...');
      
      const userNode = await FamilyTreeNode.findOne({ 
        familyTreeId: targetTree._id, 
        userId: joiningUser._id 
      });

      if (userNode) {
        log('✅ Visual Node created for joining user.');
      } else {
        log('❌ Visual Node MISSING for joining user.');
      }

      const connection = await mongoose.connection.collection('familytreeconnections').findOne({
        sourceNodeId: { $exists: true },
        targetNodeId: userNode ? userNode._id : null
      });

      // Note: We check the raw collection because we didn't define the schema fully above
      if (connection) {
        log('✅ Connection created between Root and User.');
        log(`   - Label: ${connection.relationshipLabel}`);
      } else {
        log('❌ Connection MISSING between Root and User.');
      }

    } else {
      log('❌ Join Failed: ' + JSON.stringify(joinData));
    }

  } catch (error) {
    log('Test Error: ' + error);
  } finally {
    await mongoose.disconnect();
    logStream.end();
  }
}

runTest();

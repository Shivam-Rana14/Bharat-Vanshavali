const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// Load environment variables
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
} else {
  require('dotenv').config();
}

const FamilyTreeSchema = new mongoose.Schema({}, { strict: false });
const FamilyTree = mongoose.models.FamilyTree || mongoose.model('FamilyTree', FamilyTreeSchema);

async function checkFamilyCode() {
  try {
    if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI missing');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const codeToCheck = "BVUFDINN";
    console.log(`Checking for family code: ${codeToCheck}`);

    const tree = await FamilyTree.findOne({ familyCode: codeToCheck });
    
    if (tree) {
        console.log(`✅ Found Family Tree:`);
        console.log(`   - ID: ${tree._id}`);
        console.log(`   - Name: ${tree.name}`);
        console.log(`   - Active: ${tree.isActive}`);
    } else {
        console.log(`❌ Family Tree with code "${codeToCheck}" NOT FOUND.`);
        
        // List some existing codes to verify
        const someTrees = await FamilyTree.find().limit(5).select('familyCode name');
        console.log('\nSome existing family codes:');
        someTrees.forEach(t => console.log(`   - ${t.familyCode} (${t.name})`));
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkFamilyCode();

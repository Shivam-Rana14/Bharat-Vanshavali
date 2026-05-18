const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
} else {
  require('dotenv').config();
}

const UserSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function checkExactMatch() {
  try {
    if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI missing');
    await mongoose.connect(process.env.MONGODB_URI);
    
    const mixedCase = 'adminBharat@gmail.com';
    const lowerCase = 'adminbharat@gmail.com';

    const userMixed = await User.findOne({ email: mixedCase });
    console.log(`Search '${mixedCase}': ${userMixed ? 'FOUND' : 'NOT FOUND'}`);

    const userLower = await User.findOne({ email: lowerCase });
    console.log(`Search '${lowerCase}': ${userLower ? 'FOUND' : 'NOT FOUND'}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkExactMatch();

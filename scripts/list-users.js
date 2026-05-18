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

async function listUsers() {
  try {
    if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI missing');
    await mongoose.connect(process.env.MONGODB_URI);
    
    const users = await User.find({}, 'email fullName userType verificationStatus');
    
    if (users.length === 0) {
      console.log('No users found in the database.');
    } else {
      console.log('Found users:');
      users.forEach(u => {
        console.log(`- ${u.fullName} (${u.email}) [${u.userType || 'citizen'}] - ${u.verificationStatus}`);
      });
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

listUsers();

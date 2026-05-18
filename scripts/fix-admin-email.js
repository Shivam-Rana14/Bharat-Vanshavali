const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
} else {
  require('dotenv').config();
}

// Use strict: false to bypass schema transformations during find
const UserSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function fixAdminEmail() {
  try {
    if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI missing');
    await mongoose.connect(process.env.MONGODB_URI);
    
    const mixedCase = 'adminBharat@gmail.com';
    const lowerCase = 'adminbharat@gmail.com';

    // Find with mixed case (raw query)
    const user = await User.findOne({ email: mixedCase });
    
    if (user) {
      console.log(`Found user with mixed case: ${user.email}`);
      
      // Update to lowercase
      await User.updateOne(
        { _id: user._id },
        { $set: { email: lowerCase } }
      );
      console.log(`✅ Updated email to: ${lowerCase}`);
    } else {
      console.log('User with mixed case email not found.');
      
      // Check if already lowercase
      const userLower = await User.findOne({ email: lowerCase });
      if (userLower) {
        console.log('User already has lowercase email.');
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

fixAdminEmail();

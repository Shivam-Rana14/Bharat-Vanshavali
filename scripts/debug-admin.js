const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
} else {
  require('dotenv').config();
}

const UserSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function verifyAdmin() {
  try {
    if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI missing');
    await mongoose.connect(process.env.MONGODB_URI);
    
    const email = 'adminBharat@gmail.com';
    const user = await User.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });

    if (user) {
      console.log(`Found user: ${user.email}`);
      console.log(`User Type: ${user.userType}`);
      console.log(`Login ID: ${user.loginId}`);
      
      // Verify password manually
      const isMatch = await bcrypt.compare('admin123', user.password);
      console.log(`Password 'admin123' match: ${isMatch}`);
      
      if (!isMatch) {
          console.log('Resetting password to ensure it works...');
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash('admin123', salt);
          await User.updateOne({ _id: user._id }, { password: hashedPassword });
          console.log('Password reset to admin123');
      }

    } else {
      console.log('User not found!');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

verifyAdmin();

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

async function promoteAdmin() {
  try {
    if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI missing');
    await mongoose.connect(process.env.MONGODB_URI);
    
    const email = 'adminBharat@gmail.com';
    let user = await User.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });

    if (user) {
      console.log(`Found user: ${user.email}`);
      await User.updateOne(
        { _id: user._id },
        { 
          $set: { 
            userType: 'admin',
            verificationStatus: 'verified',
            verifiedAt: new Date()
          } 
        }
      );
      console.log('✅ User promoted to Admin successfully.');
    } else {
      console.log('User not found. Creating new Admin user...');
      // Create new admin user
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt); // Default password
      
      const newUser = await User.create({
        email: email,
        password: hashedPassword,
        fullName: 'Admin Bharat',
        loginId: 'ADMIN' + Date.now(),
        userType: 'admin',
        verificationStatus: 'verified',
        verifiedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log(`✅ Created new Admin user: ${email}`);
      console.log('Default password: admin123');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

promoteAdmin();

const mongoose = require('mongoose');
const readline = require('readline');
const path = require('path');
const fs = require('fs');

// Load environment variables from .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
} else {
  require('dotenv').config();
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function connectDB() {
  if (!process.env.MONGODB_URI) {
    console.error('Error: MONGODB_URI is not defined in .env.local');
    console.error('Please make sure you have a .env.local file with your database connection string.');
    process.exit(1);
  }
  
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
}

// Define a minimal schema to interact with the Users collection
// We use strict: false to avoid validation errors with fields we don't care about here
const userSchema = new mongoose.Schema({
  email: String,
  userType: String,
  fullName: String,
  verificationStatus: String,
  verifiedAt: Date
}, { strict: false });

const User = mongoose.models.User || mongoose.model('User', userSchema);

async function promoteToAdmin() {
  try {
    console.log('\n👑 Admin Promotion Tool 👑\n');
    await connectDB();

    rl.question('Enter the email of the user to promote to Admin: ', async (email) => {
      const cleanEmail = email.toLowerCase().trim();
      
      if (!cleanEmail) {
        console.log('❌ Email cannot be empty.');
        process.exit(1);
      }

      const user = await User.findOne({ email: cleanEmail });

      if (!user) {
        console.log(`\n❌ User with email "${cleanEmail}" not found.`);
        console.log('Please register the user first via the website registration page.');
        process.exit(1);
      }

      console.log(`\nFound user: ${user.fullName || 'Unknown Name'} (${user.email})`);
      console.log(`Current Role: ${user.userType || 'citizen'}`);
      console.log(`Current Status: ${user.verificationStatus || 'pending'}`);

      if (user.userType === 'admin') {
        console.log('\n⚠️  This user is already an Admin.');
        process.exit(0);
      }

      rl.question('\nAre you sure you want to promote this user to ADMIN? (yes/no): ', async (answer) => {
        if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
          
          // We use updateOne to safely update specific fields
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
          
          console.log('\n✅ Success! User has been promoted to Admin.');
          console.log('They can now access admin routes and features.');
        } else {
          console.log('\n🚫 Operation cancelled.');
        }
        
        await mongoose.disconnect();
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('\n❌ Unexpected Error:', error);
    process.exit(1);
  }
}

promoteToAdmin();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
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

// Define user schema
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  fullName: String,
  loginId: String,
  phone: String,
  userType: String,
  verificationStatus: String,
  verifiedAt: Date,
  dateOfBirth: Date,
  placeOfBirth: String,
  gender: String,
  nativePlace: String,
  caste: String,
  aadhaarNumber: String,
  panNumber: String,
  isPlaceholder: Boolean,
  createdAt: Date,
  updatedAt: Date
}, { strict: false, timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);

function generateLoginId(fullName) {
  // Generate a login ID in format: BV + first 2 letters of name + random 6 digits
  const namePrefix = fullName.replace(/\s+/g, '').substring(0, 2).toUpperCase();
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `BV${namePrefix}${randomNum}`;
}

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function createNewAdmin() {
  try {
    console.log('\n👑 Create New Admin User 👑\n');
    console.log('This script will create a new admin user with full access.\n');
    
    await connectDB();

    // Collect user information
    const fullName = await question('Enter full name: ');
    if (!fullName || fullName.trim().length === 0) {
      console.log('❌ Full name is required.');
      process.exit(1);
    }

    const email = await question('Enter email: ');
    if (!email || !email.includes('@')) {
      console.log('❌ Valid email is required.');
      process.exit(1);
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      console.log(`\n❌ User with email "${email}" already exists.`);
      console.log('Use the promote-admin-direct.js script to promote them to admin instead.');
      process.exit(1);
    }

    const phone = await question('Enter phone number (optional, press Enter to skip): ');
    
    const password = await question('Enter password (min 6 characters): ');
    if (!password || password.length < 6) {
      console.log('❌ Password must be at least 6 characters.');
      process.exit(1);
    }

    const confirmPassword = await question('Confirm password: ');
    if (password !== confirmPassword) {
      console.log('❌ Passwords do not match.');
      process.exit(1);
    }

    console.log('\n📋 Additional Information (Optional - Press Enter to skip):\n');
    
    const dateOfBirth = await question('Date of Birth (YYYY-MM-DD): ');
    const placeOfBirth = await question('Place of Birth: ');
    const gender = await question('Gender (male/female/other): ');
    const nativePlace = await question('Native Place: ');
    const caste = await question('Caste: ');
    const aadhaarNumber = await question('Aadhaar Number: ');
    const panNumber = await question('PAN Number: ');

    // Generate login ID
    const loginId = generateLoginId(fullName.trim());

    console.log('\n📝 Summary:');
    console.log('─────────────────────────────────────');
    console.log(`Full Name: ${fullName.trim()}`);
    console.log(`Email: ${email.toLowerCase().trim()}`);
    console.log(`Phone: ${phone || 'Not provided'}`);
    console.log(`Login ID: ${loginId}`);
    console.log(`User Type: admin`);
    console.log(`Status: verified (immediate)`);
    console.log('─────────────────────────────────────\n');

    const confirm = await question('Create this admin user? (yes/no): ');
    
    if (confirm.toLowerCase() !== 'yes' && confirm.toLowerCase() !== 'y') {
      console.log('\n🚫 Operation cancelled.');
      process.exit(0);
    }

    // Hash password
    console.log('\n🔐 Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin user
    console.log('👤 Creating admin user...');
    
    const adminData = {
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      fullName: fullName.trim(),
      loginId: loginId,
      phone: phone || undefined,
      userType: 'admin',
      verificationStatus: 'verified',
      verifiedAt: new Date(),
      isPlaceholder: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Add optional fields if provided
    if (dateOfBirth) {
      const dob = new Date(dateOfBirth);
      if (!isNaN(dob.getTime())) {
        adminData.dateOfBirth = dob;
      }
    }
    if (placeOfBirth) adminData.placeOfBirth = placeOfBirth.trim();
    if (gender && ['male', 'female', 'other'].includes(gender.toLowerCase())) {
      adminData.gender = gender.toLowerCase();
    }
    if (nativePlace) adminData.nativePlace = nativePlace.trim();
    if (caste) adminData.caste = caste.trim();
    if (aadhaarNumber) adminData.aadhaarNumber = aadhaarNumber.trim();
    if (panNumber) adminData.panNumber = panNumber.trim().toUpperCase();

    const newAdmin = await User.create(adminData);

    console.log('\n✅ Admin user created successfully!\n');
    console.log('🔑 Login Credentials:');
    console.log('─────────────────────────────────────');
    console.log(`Login ID: ${loginId}`);
    console.log(`Email: ${email.toLowerCase().trim()}`);
    console.log(`Password: [as entered]`);
    console.log('─────────────────────────────────────');
    console.log('\n💡 The admin can now login using either:');
    console.log(`   - Login ID: ${loginId}`);
    console.log(`   - Email: ${email.toLowerCase().trim()}`);
    console.log('\n🎉 Admin has immediate access to all admin features!');

    await mongoose.disconnect();
    rl.close();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error creating admin user:', error);
    if (error.code === 11000) {
      console.error('Duplicate key error - Email, Login ID, Aadhaar, or PAN already exists.');
    }
    await mongoose.disconnect();
    rl.close();
    process.exit(1);
  }
}

createNewAdmin();

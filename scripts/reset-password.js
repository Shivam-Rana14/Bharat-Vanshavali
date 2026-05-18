const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const path = require('path')
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') })

const TARGET_EMAIL = 'shivamrana@gmail.com'
const NEW_PASSWORD = 'Shivam@123456'

async function run() {
  await mongoose.connect(process.env.MONGODB_URI)
  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }))
  const hash = await bcrypt.hash(NEW_PASSWORD, 10)
  const res = await User.updateOne({ email: TARGET_EMAIL }, { $set: { password: hash } })
  if (res.matchedCount) {
    console.log(`Password reset: ${TARGET_EMAIL} -> ${NEW_PASSWORD}`)
  } else {
    console.log('User not found:', TARGET_EMAIL)
  }
  await mongoose.disconnect()
}
run().catch(e => { console.error(e.message); process.exit(1) })

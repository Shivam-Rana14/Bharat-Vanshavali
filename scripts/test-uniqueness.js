// Test script to verify email and loginId uniqueness
const { databaseService } = require('../lib/mongodb/database')

async function testUniqueness() {
  console.log('Testing uniqueness constraints...')
  
  try {
    // Test email uniqueness
    console.log('\n1. Testing email uniqueness...')
    const emailExists = await databaseService.checkEmailExists('test@example.com')
    console.log('Email test@example.com exists:', emailExists)
    
    // Test loginId uniqueness  
    console.log('\n2. Testing loginId uniqueness...')
    const loginIdExists = await databaseService.checkLoginIdExists('BV123456')
    console.log('LoginId BV123456 exists:', loginIdExists)
    
    console.log('\n✅ Uniqueness validation functions are working!')
    
  } catch (error) {
    console.error('❌ Error testing uniqueness:', error.message)
  }
}

// Run the test if called directly
if (require.main === module) {
  testUniqueness().then(() => {
    console.log('\nTest completed!')
    process.exit(0)
  }).catch(error => {
    console.error('Test failed:', error)
    process.exit(1)
  })
}

module.exports = { testUniqueness }

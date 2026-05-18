#!/usr/bin/env node
/**
 * Run All Database Fixes
 * Executes all fix scripts in the correct order
 */

const { execSync } = require('child_process')
const path = require('path')

console.log('🔧 DATABASE FIX SUITE')
console.log('='.repeat(70))
console.log('\nThis will run all fix scripts in order:\n')
console.log('1. Fix missing FamilyTreeNodes')
console.log('2. Fix memberCount mismatches')
console.log('3. Update FamilyMembersByFamily arrays')
console.log('4. Clean test data (optional)\n')

const args = process.argv.slice(2)
const CLEAN_TEST = args.includes('--clean-test')

const scripts = [
  'fix-missing-nodes.js',
  'fix-member-count.js',
  'fix-member-arrays.js'
]

if (CLEAN_TEST) {
  scripts.push('clean-test-data.js')
}

function runScript(scriptName) {
  console.log(`\n${'='.repeat(70)}`)
  console.log(`Running: ${scriptName}`)
  console.log('='.repeat(70))
  
  try {
    execSync(`node ${path.join(__dirname, scriptName)}`, {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    })
    return true
  } catch (error) {
    console.error(`\n❌ Script ${scriptName} failed`)
    return false
  }
}

async function main() {
  let allSuccess = true
  
  for (const script of scripts) {
    const success = runScript(script)
    if (!success) {
      allSuccess = false
      break
    }
  }
  
  console.log(`\n${'='.repeat(70)}`)
  if (allSuccess) {
    console.log('✅ ALL FIXES COMPLETED SUCCESSFULLY')
  } else {
    console.log('❌ SOME FIXES FAILED')
  }
  console.log('='.repeat(70))
  
  process.exit(allSuccess ? 0 : 1)
}

main()

# Database Fix Scripts

## Individual Scripts Created

1. **fix-missing-nodes.js** - Creates FamilyTreeNodes for users without nodes
2. **fix-member-count.js** - Updates FamilyTree.memberCount to match actual nodes
3. **fix-member-arrays.js** - Creates/updates FamilyMembersByFamily arrays
4. **clean-test-data.js** - Removes all test users and related data
5. **run-all-fixes.js** - Master script to run all fixes in order

## Usage

### Run Individual Scripts

```bash
# Fix missing nodes (including Harish Rana)
node scripts/fix-missing-nodes.js

# Fix memberCount mismatches
node scripts/fix-member-count.js

# Update FamilyMembersByFamily arrays
node scripts/fix-member-arrays.js

# Clean test data
node scripts/clean-test-data.js
```

### Run All Fixes at Once

```bash
# Run all fixes except test data cleanup
node scripts/run-all-fixes.js

# Run all fixes including test data cleanup
node scripts/run-all-fixes.js --clean-test
```

## Recommended Order

1. `fix-missing-nodes.js` - Creates missing nodes first
2. `fix-member-count.js` - Updates counts based on actual nodes
3. `fix-member-arrays.js` - Updates arrays with all users
4. `clean-test-data.js` - (Optional) Clean test data last

## What Each Script Does

### fix-missing-nodes.js
- Finds all users with `familyCode` but no `FamilyTreeNode`
- Creates nodes with grid positioning (5 columns)
- **Fixes Harish Rana's missing node**

### fix-member-count.js
- Counts actual nodes for each family
- Updates `FamilyTree.memberCount` if mismatch found
- Reports all changes

### fix-member-arrays.js
- Gets all users for each family
- Creates or updates `FamilyMembersByFamily` record
- Includes all user details in members array

### clean-test-data.js
- Finds users with test emails/names
- Deletes nodes, connections, and family member records
- Decrements family memberCount
- Deletes user records
- **Note:** Run `fix-member-arrays.js` after this

### run-all-fixes.js
- Runs all scripts in correct order
- Shows progress for each script
- Stops if any script fails

import { MongoClient } from 'mongodb'
import * as dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
    console.error('Please define the MONGODB_URI environment variable inside .env.local')
    process.exit(1)
}

async function fixIndexes() {
    const client = new MongoClient(MONGODB_URI as string)

    try {
        await client.connect()
        const db = client.db()
        const usersCollection = db.collection('users')

        // List current indexes
        const indexes = await usersCollection.indexes()

        // Find the email index
        const emailIndex = indexes.find(idx => idx.key.email === 1)

        if (emailIndex) {
            if (!emailIndex.sparse) {
                console.log('EMAIL_INDEX_STATUS: FOUND_NON_SPARSE - Dropping it...')
                await usersCollection.dropIndex(emailIndex.name!)
                console.log('EMAIL_INDEX_STATUS: DROPPED')
            } else {
                console.log('EMAIL_INDEX_STATUS: FOUND_SPARSE - OK')
            }
        } else {
            console.log('EMAIL_INDEX_STATUS: NOT_FOUND - OK')
        }

    } catch (error) {
        console.error('Error fixing indexes:', error)
    } finally {
        await client.close()
    }
}

fixIndexes()

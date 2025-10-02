import mongoose from 'mongoose'

declare global {
  var mongoose: any 
}

// We read the URI lazily inside connectDB so that API routes can still load and return a helpful
// JSON error instead of crashing at module-import time.
let cachedUri: string | undefined = undefined

let cached = global.mongoose

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null }
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn
  }
  if (!cached.promise) {
    // Resolve env at call time
    if (!cachedUri) {
      cachedUri = process.env.MONGODB_URI
    }
    if (!cachedUri) {
      throw new Error('MONGODB_URI environment variable is not defined')
    }

    const opts = { bufferCommands: false }
    cached.promise = mongoose.connect(cachedUri, opts).then((mongoose) => {
      return mongoose
    })
  }
  
  try {
    cached.conn = await cached.promise
  } catch (e) {
    cached.promise = null
    throw e
  }

  return cached.conn
}

export default connectDB

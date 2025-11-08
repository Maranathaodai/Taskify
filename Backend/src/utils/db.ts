import mongoose from 'mongoose'

function delay(ms: number): Promise<void> {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

export async function connectMongo() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/taskify'
  if (mongoose.connection.readyState === 1) return

  // Retry loop with exponential backoff. Helpful during intermittent network
  // outages (for example when laptop goes to sleep or loses connectivity).
  const maxAttempts = Number(process.env.MONGO_CONNECT_MAX_ATTEMPTS) || Infinity
  let attempt = 0

  while (true) {
    try {
      attempt++
      await mongoose.connect(uri, {
        
        serverSelectionTimeoutMS: 3000,
      } as any)
      console.log('Connected to MongoDB at', uri)
      return
    } catch (err: any) {
      console.error(`Failed to connect to MongoDB at ${uri} (attempt ${attempt})`, err?.message || err)
      if (attempt >= maxAttempts) {
        console.error('Exceeded max MongoDB connection attempts, giving up')
        throw err
      }

      // Exponential backoff with a ceiling
      const backoff = Math.min(30000, 1000 * Math.pow(2, Math.min(attempt, 6)))
      console.log(`Retrying MongoDB connection in ${backoff}ms...`)
      await delay(backoff)
      // Loop and try again
    }
  }
}



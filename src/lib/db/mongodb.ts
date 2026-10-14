import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongooseCache: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongooseCache || { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

function isMongoAuthenticationError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const mongoError = error as Error & { code?: number | string };
  return (
    mongoError.code === 18 ||
    mongoError.code === 8000 ||
    /bad auth|authentication failed/i.test(mongoError.message)
  );
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is missing.');
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((m) => m);
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    if (isMongoAuthenticationError(e)) {
      console.error("MongoDB rejected the configured database credentials.");
      throw new Error(
        "MongoDB authentication failed. Verify the database user's username and password in MongoDB Atlas, then update MONGODB_URI in this environment."
      );
    }
    throw e;
  }

  return cached.conn;
}

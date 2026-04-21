import mongoose from 'mongoose';
import { env } from '../config/env';

export async function connectDB(): Promise<void> {
  try {
    let uri = env.MONGODB_URI;

    if (env.NODE_ENV === 'development' && uri.includes('<')) {
      try {
        // @ts-ignore — dev-only package, not installed in production
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        const mongod = await MongoMemoryServer.create();
        uri = mongod.getUri();
        console.log('🧪 Using in-memory MongoDB (dev mode)');
      } catch {
        console.warn('mongodb-memory-server not available, using provided URI');
      }
    }

    await mongoose.connect(uri);
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err);
    process.exit(1);
  }
}

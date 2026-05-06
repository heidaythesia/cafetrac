import mongoose from 'mongoose';
import { env } from './env';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // Fail fast after 5s if DB is unreachable
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB connection error:`, error);
    // Removed process.exit(1) to allow server to stay online
  }
};

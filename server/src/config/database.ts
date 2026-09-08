import mongoose from 'mongoose';

let mongoServer: any = null;

export const connectDatabase = async (): Promise<void> => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/devflow';

  mongoose.set('strictQuery', true);

  try {
    console.log(`[Database] Attempting connection to ${mongoUri}...`);
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`[Database] MongoDB connected successfully to ${mongoose.connection.host}/${mongoose.connection.name}`);
  } catch (error: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[Database] Local MongoDB not reachable. Initializing embedded in-memory MongoDB for local dev...');
      try {
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();
        await mongoose.connect(uri);
        console.log(`[Database] Embedded In-Memory MongoDB connected successfully at ${uri}`);
        return;
      } catch (memError) {
        console.error('[Database] Failed to start in-memory MongoDB:', memError);
      }
    }

    console.error('[Database] MongoDB connection error:', error.message || error);
    process.exit(1);
  }

  mongoose.connection.on('disconnected', () => {
    console.warn('[Database] MongoDB connection lost. Attempting to reconnect...');
  });

  mongoose.connection.on('error', (err) => {
    console.error('[Database] MongoDB encountered an error:', err);
  });
};

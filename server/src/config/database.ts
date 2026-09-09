import mongoose from 'mongoose';

let mongoServer: any = null;
let isConnecting = false;

export const connectDatabase = async (): Promise<void> => {
  // If already connected, reuse connection (essential for serverless cold-start / connection pooling)
  if (mongoose.connection.readyState === 1) {
    return;
  }

  if (isConnecting) {
    while ((mongoose.connection.readyState as number) === 2) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    if ((mongoose.connection.readyState as number) === 1) return;
  }

  isConnecting = true;
  const rawUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/devflow';
  const mongoUri = rawUri.trim().replace(/[\r\n\s]+/g, '');

  mongoose.set('strictQuery', true);

  try {
    console.log(`[Database] Attempting connection to ${mongoUri.replace(/:([^:@]+)@/, ':****@')}...`);
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      bufferCommands: false,
    });
    console.log(`[Database] MongoDB connected successfully to ${mongoose.connection.host}/${mongoose.connection.name}`);
  } catch (error: any) {
    if (process.env.NODE_ENV !== 'production' && !process.env.NETLIFY) {
      console.warn('[Database] Local MongoDB not reachable. Initializing embedded in-memory MongoDB for local dev...');
      try {
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();
        await mongoose.connect(uri);
        console.log(`[Database] Embedded In-Memory MongoDB connected successfully at ${uri}`);
        isConnecting = false;
        return;
      } catch (memError) {
        console.error('[Database] Failed to start in-memory MongoDB:', memError);
      }
    }

    console.error('[Database] MongoDB connection error:', error.message || error);
    isConnecting = false;
    if (!process.env.NETLIFY && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
      process.exit(1);
    }
    throw error;
  } finally {
    isConnecting = false;
  }

  mongoose.connection.on('disconnected', () => {
    console.warn('[Database] MongoDB connection lost. Attempting to reconnect...');
  });

  mongoose.connection.on('error', (err) => {
    console.error('[Database] MongoDB encountered an error:', err);
  });
};


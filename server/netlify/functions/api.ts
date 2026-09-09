import serverless from 'serverless-http';
import app from '../../src/app';
import { connectDatabase } from '../../src/config/database';

const serverlessHandler = serverless(app);

export const handler = async (event: any, context: any) => {
  // Prevent Lambda from waiting for empty event loop (important for Mongoose connection reuse)
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    await connectDatabase();
    return await serverlessHandler(event, context);
  } catch (error: any) {
    console.error('[Netlify Function] Error handling request:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Internal Server Error',
        message: error.message || 'Database connection or handler failed',
      }),
    };
  }
};

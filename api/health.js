import { connectToDatabase } from '../lib/mongodb.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { db } = await connectToDatabase();
    
    await db.admin().ping();

    return res.status(200).json({ 
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected'
    });

  } catch (error) {
    console.error('Health check error:', error);
    return res.status(503).json({ 
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
}
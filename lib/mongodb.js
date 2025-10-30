// ============================================
// LIB /lib/mongodb.js - Connessione MongoDB
// ============================================

import { MongoClient } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('❌ MONGODB_URI non configurata! Aggiungi la variabile d\'ambiente su Vercel.');
}

const uri = process.env.MONGODB_URI;
const options = {
  maxPoolSize: 10,
  minPoolSize: 2,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

let client;
let clientPromise;

if (process.env.NODE_ENV === 'development') {
  // In development, usa una variabile globale per preservare il client tra gli hot reload
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production, crea un nuovo client per ogni richiesta
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

/**
 * Connetti al database MongoDB
 * @returns {Promise<{client: MongoClient, db: Db}>}
 */
export async function connectToDatabase() {
  try {
    const client = await clientPromise;
    const db = client.db('proclubhub');
    
    // Verifica la connessione
    await db.admin().ping();
    console.log('✅ MongoDB connesso con successo');
    
    return { client, db };
  } catch (error) {
    console.error('❌ Errore connessione MongoDB:', error);
    throw new Error('Impossibile connettersi al database');
  }
}

export default clientPromise;

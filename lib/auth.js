// ============================================
// LIB /lib/auth.js - AUTHENTICATION UTILITIES
// ============================================

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this';

/**
 * Genera un JWT token per l'utente
 */
export function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });
}

/**
 * Verifica e decodifica un JWT token
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    console.error('Token verification error:', error.message);
    return null;
  }
}

/**
 * Estrae il token Bearer dall'header Authorization
 */
export function extractTokenFromHeader(req) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  return null;
}

/**
 * Autentica una richiesta verificando il token JWT
 * Restituisce l'userId se autenticato, null altrimenti
 */
export async function authenticateRequest(req) {
  const token = extractTokenFromHeader(req);
  
  if (!token) {
    return null;
  }
  
  const decoded = verifyToken(token);
  return decoded ? decoded.userId : null;
}

/**
 * Genera un token casuale per il reset della password
 */
export function generateResetToken() {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

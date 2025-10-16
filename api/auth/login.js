import { connectToDatabase } from '../../lib/mongodb.js';
import { UserModel } from '../../models/User.js';
import { generateToken } from '../../lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email e password sono obbligatori' 
      });
    }

    const { db } = await connectToDatabase();
    const userModel = new UserModel(db);

    const user = await userModel.findByEmail(email);
    if (!user) {
      return res.status(401).json({ 
        error: 'Email o password non corretti' 
      });
    }

    const isValidPassword = await userModel.verifyPassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ 
        error: 'Email o password non corretti' 
      });
    }

    const token = generateToken(user._id.toString());
    const sanitizedUser = userModel.sanitizeUser(user);

    return res.status(200).json({
      message: 'Login effettuato con successo',
      token,
      user: sanitizedUser
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ 
      error: 'Errore durante il login. Riprova.' 
    });
  }
}

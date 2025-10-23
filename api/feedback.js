const { ObjectId } = require('mongodb');
const clientPromise = require('../lib/mongodb');
const { verifyToken } = require('../lib/auth');

module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method === 'GET') {
        const { userId, teamId } = req.query;

        // ✅ NUOVO: Se c'è userId o teamId, permetti accesso pubblico (per profili condivisi)
        if (userId || teamId) {
            try {
                const client = await clientPromise;
                const db = client.db('proclubhub');

                let query = {};
                if (userId) {
                    if (!ObjectId.isValid(userId)) {
                        return res.status(400).json({ error: 'ID utente non valido' });
                    }
                    query.userId = new ObjectId(userId);
                }
                if (teamId) {
                    if (!ObjectId.isValid(teamId)) {
                        return res.status(400).json({ error: 'ID squadra non valido' });
                    }
                    query.teamId = new ObjectId(teamId);
                }

                const feedbacks = await db.collection('feedbacks')
                    .find(query)
                    .sort({ createdAt: -1 })
                    .toArray();

                return res.status(200).json(feedbacks);
            } catch (error) {
                console.error('Errore nel recupero dei feedback:', error);
                return res.status(500).json({ error: 'Errore nel recupero dei feedback' });
            }
        }

        // ⚠️ Per tutte le altre richieste, richiedi autenticazione
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Non autenticato' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token);
        
        if (!decoded) {
            return res.status(401).json({ error: 'Token non valido' });
        }

        // ... resto del codice esistente
    }

    // ... resto del codice per POST, etc (richiede autenticazione)
};

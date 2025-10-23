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
        const { id } = req.query;

        // ✅ NUOVO: Se c'è un ID specifico, permetti accesso pubblico (per profili condivisi)
        if (id) {
            try {
                const client = await clientPromise;
                const db = client.db('proclubhub');

                // Verifica se l'ID è valido
                if (!ObjectId.isValid(id)) {
                    return res.status(404).json({ error: 'Profilo non trovato' });
                }

                const user = await db.collection('users').findOne(
                    { _id: new ObjectId(id) },
                    { projection: { password: 0 } } // Non includere la password
                );

                if (!user) {
                    return res.status(404).json({ error: 'Profilo non trovato' });
                }

                return res.status(200).json(user);
            } catch (error) {
                console.error('Errore nel recupero del profilo:', error);
                return res.status(500).json({ error: 'Errore nel caricamento del profilo' });
            }
        }

        // ⚠️ Per tutte le altre richieste (lista utenti, etc), richiedi autenticazione
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Non autenticato' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token);
        
        if (!decoded) {
            return res.status(401).json({ error: 'Token non valido' });
        }

        // ... resto del codice esistente per liste utenti, etc
        try {
            const client = await clientPromise;
            const db = client.db('proclubhub');
            
            const users = await db.collection('users')
                .find({}, { projection: { password: 0 } })
                .toArray();
            
            return res.status(200).json(users);
        } catch (error) {
            console.error('Errore nel recupero degli utenti:', error);
            return res.status(500).json({ error: 'Errore nel recupero degli utenti' });
        }
    }

    res.status(405).json({ error: 'Metodo non consentito' });
};

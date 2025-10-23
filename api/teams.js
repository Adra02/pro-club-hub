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
                    return res.status(404).json({ error: 'Squadra non trovata' });
                }

                const team = await db.collection('teams').findOne(
                    { _id: new ObjectId(id) }
                );

                if (!team) {
                    return res.status(404).json({ error: 'Squadra non trovata' });
                }

                return res.status(200).json(team);
            } catch (error) {
                console.error('Errore nel recupero della squadra:', error);
                return res.status(500).json({ error: 'Errore nel caricamento della squadra' });
            }
        }

        // ⚠️ Per tutte le altre richieste (lista squadre, etc), richiedi autenticazione
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Non autenticato' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token);
        
        if (!decoded) {
            return res.status(401).json({ error: 'Token non valido' });
        }

        // ... resto del codice esistente per liste squadre, etc
        try {
            const client = await clientPromise;
            const db = client.db('proclubhub');
            
            const teams = await db.collection('teams').find({}).toArray();
            
            return res.status(200).json(teams);
        } catch (error) {
            console.error('Errore nel recupero delle squadre:', error);
            return res.status(500).json({ error: 'Errore nel recupero delle squadre' });
        }
    }

    res.status(405).json({ error: 'Metodo non consentito' });
};

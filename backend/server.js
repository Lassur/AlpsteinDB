
const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

const uri = process.env.MONGO_URI || 'mongodb+srv://<username>:<password>@<cluster-url>/'; // oder manuell setzen
const client = new MongoClient(uri);

app.use(cors());
app.use(express.json());

// Neuer API-Endpunkt mit Jahr-Filterung
app.get('/api/eintraege-pro-gipfel', async (req, res) => {
  try {
    await client.connect();
    const db = client.db('GipfelbuchDatabase');
    const collection = db.collection('GipfelbuchCollection');

    const vonJahr = parseInt(req.query.von) || 1900;
    const bisJahr = parseInt(req.query.bis) || 2100;

    const result = await collection.aggregate([
      {
        $match: {
          Jahr: { $gte: vonJahr, $lte: bisJahr }
        }
      },
      {
        $group: {
          _id: "$Gipfel",
          count: { $sum: 1 }
        }
      }
    ]).toArray();

    const formatted = {};
    result.forEach(entry => {
      formatted[entry._id] = entry.count;
    });

    res.json(formatted);
  } catch (error) {
    console.error('Fehler bei /api/eintraege-pro-gipfel:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

app.listen(port, () => {
  console.log(`Server läuft auf Port ${port}`);
});

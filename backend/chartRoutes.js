const express = require('express');
const router = express.Router();
const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);
const dbName = 'GipfelbuchDatabase';
const collectionName = 'GipfelbuchCollection';

router.post('/jahr', async (req, res) => {
  const filters = req.body;

  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    const matchStage = {
      Gipfel: filters.gipfel,
      ...(filters.route && { Route: filters.route }),
      ...(filters.buch && { Buch: filters.buch }),
      ...(filters.buchtyp && { Buchtyp: filters.buchtyp }),
      ...(filters.erfassteJahre && { Erfasste_Jahre: filters.erfassteJahre }),
      ...(filters.jahr && { Jahr: Number(filters.jahr) }),
      ...(filters.monat && { Monat: Number(filters.monat) }),
    };

    const pipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: { jahr: "$Jahr", erfasst: "$Erfasste_Jahre" },
          count: { $sum: 1 }
        }
      }
    ];

    const results = await collection.aggregate(pipeline).toArray();

    const jahreSet = new Set();
    const gruppiert = {};

    results.forEach(r => {
      const jahr = r._id.jahr;
      const erfasst = r._id.erfasst;
      jahreSet.add(jahr);
      if (!gruppiert[erfasst]) gruppiert[erfasst] = {};
      gruppiert[erfasst][jahr] = r.count;
    });

    const jahre = Array.from(jahreSet).sort((a, b) => a - b);
    const datasets = Object.entries(gruppiert).map(([label, data]) => ({
      label,
      data: jahre.map(j => data[j] || 0),
      stack: 'stack1'
    }));

    res.json({ labels: jahre, datasets });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Fehler bei Datenabfrage' });
  }
});

router.get('/dropdowns', async (req, res) => {
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    const fields = ['Gipfel', 'Route', 'Buch', 'Buchtyp', 'Erfasste_Jahre', 'Jahr', 'Monat'];
    const data = {};

    for (const field of fields) {
      const values = await collection.distinct(field);
      data[field.toLowerCase()] = values.filter(v => v !== null).sort();
    }

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Fehler beim Laden der Dropdown-Daten' });
  }
});

module.exports = router;

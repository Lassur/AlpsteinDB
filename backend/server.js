
const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const app = express();
app.use(cors());

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);
const dbName = "GipfelbuchDatabase";
const collectionName = "GipfelbuchCollection";

// Limitierte Einträge (für Tabelle, Dropdowns, etc.)
app.get("/api/eintraege", async (req, res) => {
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);
    const daten = await collection.find({}).limit(10000).toArray();
    res.json(daten);
  } catch (err) {
    console.error("Fehler bei /api/eintraege", err);
    res.status(500).json({ error: err.message });
  }
});

// Aggregation für Chart (mit optionalen Filtern)
app.get("/api/chart/jahr", async (req, res) => {
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    const filter = {};
    if (req.query.gipfel) filter.Gipfel = req.query.gipfel;
    if (req.query.route) filter.Route = req.query.route;
    if (req.query.buch) filter.Buch = req.query.buch;
    if (req.query.buchtyp) filter.Buchtyp = req.query.buchtyp;
    if (req.query.erfasst) filter.Erfasste_Jahre = req.query.erfasst;
    if (req.query.jahr) filter.Jahr = parseInt(req.query.jahr);
    if (req.query.monat) filter.Monat = req.query.monat;
    if (!filter.Jahr) filter.Jahr = { $ne: null };

    const pipeline = [
      { $match: filter },
      {
        $group: {
          _id: { jahr: "$Jahr", status: "$Erfasste_Jahre" },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: "$_id.jahr",
          werte: {
            $push: {
              status: "$_id.status",
              count: "$count"
            }
          }
        }
      },
      { $sort: { _id: 1 } }
    ];

    const daten = await collection.aggregate(pipeline).toArray();
    res.json(daten);
  } catch (err) {
    console.error("Fehler bei /api/chart/jahr", err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("Server läuft auf Port " + PORT);
});

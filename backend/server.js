
const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const app = express();
app.use(cors());

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);
const dbName = "GipfelbuchDatabase";
const collectionName = "GipfelbuchCollection";

app.get('/api/eintraege', async (req, res) => {
  try {
    await client.connect();
    const collection = client.db(dbName).collection(collectionName);

    const {
      suchbegriff,
      gipfel,
      route,
      buch,
      jahr,
      erstbegehung
    } = req.query;

    let filter = {};

    // Volltextsuche
    if (suchbegriff) {
      const regex = new RegExp(suchbegriff, 'i');
      filter.$or = [
        { Gipfel: regex },
        { Route: regex },
        { Wer: regex },
        { Notiz: regex },
        { Buch: regex },
        { Jahr: regex },
        { Erstbegehung: regex }
      ];
    }

    // Spaltenfilter (werden mit AND verknüpft)
    if (gipfel) filter.Gipfel = gipfel;
    if (route) filter.Route = route;
    if (buch) filter.Buch = buch;
    if (jahr) filter.Jahr = jahr;
    if (erstbegehung) filter.Erstbegehung = erstbegehung;

    const daten = await collection.find(filter).limit(500).toArray();
    res.json(daten);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const port = process.env.PORT || 10000;
app.listen(port, () => console.log(`Server läuft auf Port ${port}`));

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

// Einträge abrufen
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

    if (gipfel) filter.Gipfel = gipfel;
    if (route) filter.Route = route;
    if (buch) filter.Buch = buch;
    if (jahr) filter.Jahr = jahr;
    if (erstbegehung) filter.Erstbegehung = erstbegehung;

    const hasFilter = suchbegriff || gipfel || route || buch || jahr || erstbegehung;
    const daten = await collection.find(filter).limit(hasFilter ? 10000 : 100).toArray();
    res.json(daten);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Dynamisch gefilterte Werte für Dropdowns
app.get('/api/werte', async (req, res) => {
  try {
    const feld = req.query.feld;
    if (!feld) return res.status(400).json({ error: "Parameter 'feld' fehlt." });

    await client.connect();
    const collection = client.db(dbName).collection(collectionName);

    const filter = {};
    const filterFields = ["Gipfel", "Route", "Buch", "Jahr", "Erstbegehung"];
    filterFields.forEach(f => {
      if (f !== feld && req.query[f.toLowerCase()]) {
        filter[f] = req.query[f.toLowerCase()];
      }
    });

    const werte = await collection.distinct(feld, filter);
    werte.sort((a, b) => (a > b ? 1 : a < b ? -1 : 0));
    res.json(werte);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const port = process.env.PORT || 10000;
app.listen(port, () => console.log(`Server läuft auf Port ${port}`));

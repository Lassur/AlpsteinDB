
const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 10000;

app.use(cors());

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

const dbName = "GipfelbuchDatabase";
const collectionName = "GipfelbuchCollection";

async function getCollection() {
  await client.connect();
  const db = client.db(dbName);
  return db.collection(collectionName);
}

app.get('/api/eintraege', async (req, res) => {
  try {
    const collection = await getCollection();

    const filter = {};
    ["gipfel", "route", "buch", "jahr", "erstbegehung", "suchbegriff"].forEach(key => {
      if (req.query[key]) {
        if (key === "suchbegriff") {
          const regex = new RegExp(req.query[key], "i");
          filter["$or"] = [
            { Gipfel: regex },
            { Route: regex },
            { Wer: regex },
            { Buch: regex },
            { Notiz: regex },
            { Kommentar_A_Koller: regex }
          ];
        } else {
          filter[key.charAt(0).toUpperCase() + key.slice(1)] = req.query[key];
        }
      }
    });

    const limit = parseInt(req.query.limit || "10000");
    const eintraege = await collection.find(filter).limit(limit).toArray();
    res.json(eintraege);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Fehler beim Abrufen der Einträge" });
  }
});

app.get('/api/werte', async (req, res) => {
  try {
    const collection = await getCollection();
    const feld = req.query.feld;
    const filter = {};

    ["gipfel", "route", "buch", "jahr", "erstbegehung", "suchbegriff"].forEach(key => {
      if (req.query[key] && key !== feld.toLowerCase()) {
        if (key === "suchbegriff") {
          const regex = new RegExp(req.query[key], "i");
          filter["$or"] = [
            { Gipfel: regex },
            { Route: regex },
            { Wer: regex },
            { Buch: regex },
            { Notiz: regex },
            { Kommentar_A_Koller: regex }
          ];
        } else {
          filter[key.charAt(0).toUpperCase() + key.slice(1)] = req.query[key];
        }
      }
    });

    const werte = await collection.distinct(feld, filter);
    res.json(werte);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Fehler beim Abrufen der Werte" });
  }
});

app.listen(port, () => {
  console.log(`Server läuft auf Port ${port}`);
});

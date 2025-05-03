
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

    for (const key in req.query) {
      let value = req.query[key];
      if (key === "jahr") {
        value = parseInt(value);
        filter["Jahr"] = value;
      } else {
        filter[key.charAt(0).toUpperCase() + key.slice(1)] = value;
      }
    }

    const limit = parseInt(req.query.limit || "10000");
    const eintraege = await collection.find(filter).limit(limit).toArray();
    res.json(eintraege);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Fehler beim Abrufen der Einträge" });
  }
});

app.listen(port, () => {
  console.log(`Server läuft auf Port ${port}`);
});

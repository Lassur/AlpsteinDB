
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

app.get("/api/chart/jahr", async (req, res) => {
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    const pipeline = [
      {
        $match: {
          Jahr: { $ne: null }
        }
      },
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
    res.status(500).json({ error: "Interner Fehler" });
  }
});

app.listen(10000, () => {
  console.log("Server läuft auf Port 10000");
});

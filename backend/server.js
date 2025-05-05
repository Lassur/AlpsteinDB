import express from 'express';
import { MongoClient } from 'mongodb';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(cors());

const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
const client = new MongoClient(uri);
const dbName = "GipfelbuchDatabase";
const collectionName = "GipfelbuchCollection";

const koordinaten = [  // Platzhalter: vollständige Liste muss hier eingefügt werden
  {"name": "Altmann", "lat": 47.23955855, "lng": 9.371543979},
  {"name": "Säntis", "lat": 47.24938821, "lng": 9.343263146}
];

app.get("/api/eintraege", async (req, res) => {
  try {
    await client.connect();
    const db = client.db(dbName);
    const col = db.collection(collectionName);
    const filter = {};
    if (req.query.suchbegriff) {
      const regex = new RegExp(req.query.suchbegriff, "i");
      filter.$or = [
        { Gipfel: regex }, { Route: regex }, { Buch: regex },
        { Buchtyp: regex }, { Notiz: regex }
      ];
    }
    ["Gipfel", "Route", "Buch", "Buchtyp", "Jahr"].forEach(f =>
      req.query[f.toLowerCase()] && (filter[f] = req.query[f.toLowerCase()])
    );
    const result = await col.find(filter).limit(10000).toArray();
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Interner Fehler" });
  }
});

app.get("/api/werte", async (req, res) => {
  try {
    await client.connect();
    const col = client.db(dbName).collection(collectionName);
    const werte = await col.distinct(req.query.feld);
    res.json(werte.filter(v => v !== null).sort());
  } catch (err) {
    res.status(500).json({ error: "Interner Fehler" });
  }
});

app.get("/api/chart/jahr", async (req, res) => {
  try {
    await client.connect();
    const col = client.db(dbName).collection(collectionName);
    const match = {};
    ["Gipfel", "Route", "Buch", "Buchtyp", "Jahr", "Monat"].forEach(f =>
      req.query[f.toLowerCase()] && (match[f] = req.query[f.toLowerCase()])
    );
    const daten = await col.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$Jahr",
          werte: { $push: "$Erfasste_Jahre" }
        }
      },
      {
        $project: {
          werte: {
            $map: {
              input: ["Komplett", "Unvollständig"],
              as: "status",
              in: {
                status: "$$status",
                count: {
                  $size: {
                    $filter: {
                      input: "$werte",
                      as: "v",
                      cond: { $eq: ["$$v", "$$status"] }
                    }
                  }
                }
              }
            }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]).toArray();
    res.json(daten);
  } catch (err) {
    res.status(500).json({ error: "Interner Fehler" });
  }
});

app.get("/api/mapdata", async (req, res) => {
  try {
    await client.connect();
    const col = client.db(dbName).collection(collectionName);
    const filter = {};
    if (req.query.jahr) filter.Jahr = req.query.jahr;
    if (req.query.buchtyp) filter.Buchtyp = req.query.buchtyp;

    const agg = await col.aggregate([
      { $match: filter },
      { $group: { _id: "$Gipfel", count: { $sum: 1 } } }
    ]).toArray();
    const map = Object.fromEntries(agg.map(e => [e._id, e.count]));
    const daten = koordinaten.map(k => ({
      name: k.name,
      lat: k.lat,
      lng: k.lng,
      count: map[k.name] || 0
    }));
    res.json(daten);
  } catch (err) {
    res.status(500).json({ error: "Interner Fehler" });
  }
});

app.listen(10000, () => console.log("Server läuft auf Port 10000"));

const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");
require("dotenv").config();

const app = express();
app.use(cors());

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);
const dbName = "GipfelbuchDatabase";
const collectionName = "GipfelbuchCollection";

// Einträge-Endpunkt
app.get("/api/eintraege", async (req, res) => {
  try {
    await client.connect();
    const collection = client.db(dbName).collection(collectionName);
    const filter = {};

    const suchbegriff = req.query.suchbegriff;
    if (suchbegriff) {
      filter.$or = [
        { Gipfel: { $regex: suchbegriff, $options: "i" } },
        { Route: { $regex: suchbegriff, $options: "i" } },
        { Buch: { $regex: suchbegriff, $options: "i" } },
        { Jahr: { $regex: suchbegriff, $options: "i" } },
        { Monat: { $regex: suchbegriff, $options: "i" } },
      ];
    }

    const felder = ["gipfel", "route", "buch", "buchtyp", "jahr", "monat"];
    felder.forEach((f) => {
      if (req.query[f]) {
        const key = f.charAt(0).toUpperCase() + f.slice(1);
        filter[key] = f === "jahr" ? parseInt(req.query[f]) : req.query[f];
      }
    });

    const limit = Object.keys(req.query).length > 0 ? 10000 : 100;
    const result = await collection.find(filter).limit(limit).toArray();
    res.json(result);
  } catch (err) {
    console.error("Fehler bei /api/eintraege", err);
    res.status(500).json({ error: err.message });
  }
});

// Top 10 Tage mit den meisten Einträgen
app.get("/api/top10tage", async (req, res) => {
  try {
    await client.connect();
    const collection = client.db(dbName).collection(collectionName);

    const filter = {};
    const suchbegriff = req.query.suchbegriff;
    if (suchbegriff) {
      filter.$or = [
        { Gipfel: { $regex: suchbegriff, $options: "i" } },
        { Route: { $regex: suchbegriff, $options: "i" } },
        { Buch: { $regex: suchbegriff, $options: "i" } },
        { Jahr: { $regex: suchbegriff, $options: "i" } },
        { Monat: { $regex: suchbegriff, $options: "i" } },
      ];
    }

    const felder = ["gipfel", "route", "buch", "buchtyp", "jahr", "monat"];
    felder.forEach((f) => {
      if (req.query[f]) {
        const key = f.charAt(0).toUpperCase() + f.slice(1);
        filter[key] = f === "jahr" ? parseInt(req.query[f]) : req.query[f];
      }
    });

    const result = await collection
      .aggregate([
        { $match: { ...filter, Datum_JMT: { $exists: true, $ne: "" } } },
        {
          $group: {
            _id: "$Datum_JMT",
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ])
      .toArray();

    const formatted = result.map(entry => {
      const date = new Date(entry._id);
      const wochentag = date.toLocaleDateString("de-DE", { weekday: "long" });
      const datum = entry._id;
      return {
        tag: `${wochentag} (${datum})`,
        count: entry.count
      };
    });

    res.json(formatted);
  } catch (err) {
    console.error("Fehler bei /api/top10tage", err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
});

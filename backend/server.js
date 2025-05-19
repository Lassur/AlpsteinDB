
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
        { Erstbegehung: { $regex: suchbegriff, $options: "i" } },
      ];
    }

    const felder = ["gipfel", "route", "buch", "buchtyp", "jahr", "monat", "erstbegehung"];
    felder.forEach((f) => {
      if (req.query[f]) {
        const key = f.charAt(0).toUpperCase() + f.slice(1);
        if (f !== "jahr" || (!req.query.von && !req.query.bis)) {
          filter[key] = f === "jahr" ? parseInt(req.query[f]) : req.query[f];
        }
      }
    });

    if (req.query.von || req.query.bis) {
      const von = parseInt(req.query.von) || 0;
      const bis = parseInt(req.query.bis) || 9999;
      filter.Jahr = { $gte: von, $lte: bis };
    }

    if (req.query.wer) {
      filter.Wer = { $regex: req.query.wer, $options: "i" };
    }

    const limit = Object.keys(req.query).length > 0 ? 10000 : 100;
    const result = await collection.find(filter).limit(limit).toArray();
    res.json(result);
  } catch (err) {
    console.error("Fehler bei /api/eintraege", err);
    res.status(500).json({ error: err.message });
  }
});

// Dropdown-Werte-Endpunkt
app.get("/api/werte", async (req, res) => {
  try {
    await client.connect();
    const collection = client.db(dbName).collection(collectionName);

    const { feld, ...filter } = req.query;
    if (!feld) return res.status(400).json({ error: "Feldparameter fehlt." });

    const mapped = {};
    Object.entries(filter).forEach(([key, val]) => {
      const name = key.charAt(0).toUpperCase() + key.slice(1);
      mapped[name] = val;
    });

    const werte = await collection.distinct(feld, mapped);
    const bereinigt = werte.filter((v) => v !== null && v !== "").sort();
    res.json(bereinigt);
  } catch (err) {
    console.error("Fehler bei /api/werte", err);
    res.status(500).json({ error: err.message });
  }
});

// Momente: Heute vor X Jahren – angepasst für ISO Format (YYYY-MM-DD)
app.get("/api/momente/heute", async (req, res) => {
  try {
    await client.connect();
    const collection = client.db(dbName).collection(collectionName);

    const heute = new Date();
    const tag = String(heute.getDate()).padStart(2, '0');
    const monat = String(heute.getMonth() + 1).padStart(2, '0');
    const regex = new RegExp(`^\\d{{4}}-${monat}-${tag}$`);

    const result = await collection.find({ Datum_JMT: { $regex: regex } }).toArray();
    res.json(result);
  } catch (err) {
    console.error("Fehler bei /api/momente/heute", err);
    res.status(500).json({ error: err.message });
  }
});

// Momente: Notizen des Monats (mit mindestens 5 Wörtern)
app.get("/api/momente/monat-notizen", async (req, res) => {
  try {
    await client.connect();
    const collection = client.db(dbName).collection(collectionName);

    const heute = new Date();
    const aktuellerMonat = heute.getMonth() + 1;

    const result = await collection.find({
      Monat: aktuellerMonat,
      Notiz: { $regex: /(?:\b\w+\b\s+){4,}\b\w+\b/, $options: 'i' }
    }).toArray();

    res.json(result);
  } catch (err) {
    console.error("Fehler bei /api/momente/monat-notizen", err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("Server läuft auf Port " + PORT);
});

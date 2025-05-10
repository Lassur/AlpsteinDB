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

// Chart: Einträge nach Jahren
app.get("/api/chart/jahr", async (req, res) => {
  try {
    await client.connect();
    const collection = client.db(dbName).collection(collectionName);

    const filter = {};
    if (req.query.gipfel) filter.Gipfel = req.query.gipfel;
    if (req.query.route) filter.Route = req.query.route;
    if (req.query.buch) filter.Buch = req.query.buch;
    if (req.query.buchtyp) filter.Buchtyp = req.query.buchtyp;
	if (req.query.erfasste_jahre) filter.Erfasste_Jahre = req.query.erfasste_jahre;
    if (req.query.jahr) filter.Jahr = parseInt(req.query.jahr);

    const pipeline = [
      { $match: filter },
      {
        $group: {
          _id: { jahr: "$Jahr", status: "$Erfasste_Jahre" },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: "$_id.jahr",
          werte: {
            $push: {
              status: "$_id.status",
              count: "$count",
            },
          },
        },
      },
      { $sort: { _id: 1 } },
    ];

    const daten = await collection.aggregate(pipeline).toArray();
    res.json(daten);
  } catch (err) {
    console.error("Fehler bei /api/chart/jahr", err);
    res.status(500).json({ error: err.message });
  }
});

// Chart: Einträge nach Monaten
app.get("/api/chart/monate", async (req, res) => {
  try {
    await client.connect();
    const collection = client.db(dbName).collection(collectionName);

    const filter = {};
    if (req.query.gipfel) filter.Gipfel = req.query.gipfel;
    if (req.query.route) filter.Route = req.query.route;
    if (req.query.buch) filter.Buch = req.query.buch;
    if (req.query.buchtyp) filter.Buchtyp = req.query.buchtyp;
	if (req.query.erfasste_jahre) filter.Erfasste_Jahre = req.query.erfasste_jahre;
    if (req.query.jahr) filter.Jahr = parseInt(req.query.jahr);

    const pipeline = [
      { $match: filter },
      {
        $group: {
          _id: "$Monat",
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ];

    const result = await collection.aggregate(pipeline).toArray();
    const total = result.reduce((sum, m) => sum + m.count, 0);

    const output = result.map((r) => ({
      monat: r._id,
      count: r.count,
      prozent: ((r.count / total) * 100).toFixed(1),
    }));

    res.json(output);
  } catch (err) {
    console.error("Fehler bei /api/chart/monate", err);
    res.status(500).json({ error: err.message });
  }
});

// Chart: Einträge nach Routen
app.get("/api/chart/route", async (req, res) => {
  try {
    await client.connect();
    const collection = client.db(dbName).collection(collectionName);

    const filter = {};
    if (req.query.gipfel) filter.Gipfel = req.query.gipfel;
    if (req.query.route) filter.Route = req.query.route;
    if (req.query.buch) filter.Buch = req.query.buch;
    if (req.query.buchtyp) filter.Buchtyp = req.query.buchtyp;
	if (req.query.erfasste_jahre) filter.Erfasste_Jahre = req.query.erfasste_jahre;
    if (req.query.jahr) filter.Jahr = parseInt(req.query.jahr);

    const pipeline = [
      { $match: filter },
      {
        $group: {
          _id: "$Route",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } }
    ];

    const result = await collection.aggregate(pipeline).toArray();
    const total = result.reduce((sum, r) => sum + r.count, 0);

    const output = result.map(r => ({
      route: r._id || "Unbekannt",
      count: r.count,
      prozent: ((r.count / total) * 100).toFixed(1)
    }));

    res.json(output);
  } catch (err) {
    console.error("Fehler bei /api/chart/route", err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 10000;

// API: Einträge pro Gipfel mit optionalem Jahrfilter
app.get("/api/eintraege-pro-gipfel", async (req, res) => {
  try {
    await client.connect();
    const collection = client.db(dbName).collection(collectionName);

    const vonJahr = parseInt(req.query.von) || 1890;
    const bisJahr = parseInt(req.query.bis) || 2100;

    const result = await collection.aggregate([
      {
        $match: {
          Jahr: { $gte: vonJahr, $lte: bisJahr }
        }
      },
      {
        $group: {
          _id: "$Gipfel",
          count: { $sum: 1 }
        }
      }
    ]).toArray();

    const formatted = {};
    result.forEach(entry => {
      formatted[entry._id] = entry.count;
    });

    res.json(formatted);
  } catch (err) {
    console.error("Fehler bei /api/eintraege-pro-gipfel", err);
    res.status(500).json({ error: err.message });
  }
});


app.listen(PORT, () => {
  console.log("Server läuft auf Port " + PORT);
});
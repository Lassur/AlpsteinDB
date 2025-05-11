
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

// Chart: Top 10 Tage (nur neue Version v2)
app.get("/api/chart/top10tage_v2", async (req, res) => {
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
          _id: "$Datum_JMT",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ];

    const daten = await collection.aggregate(pipeline).toArray();

    const output = daten.map(r => {
      const datumString = r._id;
      const dateObj = new Date(datumString + "T00:00:00");
      if (isNaN(dateObj.getTime())) return null;

      const formatted = new Intl.DateTimeFormat("de-DE", {
        weekday: "long",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      }).format(dateObj);

      return {
        datum: formatted,
        count: r.count
      };
    }).filter(Boolean);

    res.json(output);
  } catch (err) {
    console.error("Fehler bei /api/chart/top10tage_v2", err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("Server läuft auf Port " + PORT);
});

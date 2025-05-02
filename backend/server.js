
const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const app = express();
app.use(cors());

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);
const dbName = "GipfelbuchDatabase"; // korrigierter Name
const collectionName = "GipfelbuchCollection";

app.get('/api/eintraege', async (req, res) => {
    try {
        await client.connect();
        const collection = client.db(dbName).collection(collectionName);
        const daten = await collection.find({}).toArray();
        res.json(daten);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const port = process.env.PORT || 10000;
app.listen(port, () => console.log(`Server läuft auf Port ${port}`));

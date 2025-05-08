
app.get('/api/eintraege', (req, res) => {
  const filterParams = req.query;
  
  const limit = Object.keys(req.query).length > 0 ? 10000 : 100;

  collection.find(filterParams).limit(limit).toArray((err, results) => {
    if (err) {
      res.status(500).send("Datenbankfehler");
      return;
    }

    // Rückgabe der Einträge, einschließlich der "Database_" Spalte
    res.json({
      entries: results.map(entry => ({
        gipfel: entry.gipfel,
        datum: entry.datum,
        wer: entry.wer,
        route: entry.route,
        notiz: entry.notiz,
        jahr: entry.jahr,
        buch: entry.buch,
        erstbegehung: entry.erstbegehung,
        database: entry.Database_  // Füge den "Database_" Wert hinzu
      }))
    });
  });
});
    
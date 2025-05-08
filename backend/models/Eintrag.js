
const mongoose = require('mongoose');

const eintragSchema = new mongoose.Schema({
  Database_: { type: String },
  Gipfel: { type: String },
  Datum_JMT: { type: Date },
  Wer: { type: String },
  Route: { type: String },
  Notiz: { type: String },
  Monat: { type: String },
  Jahr: { type: Number },
  Buch: { type: String },
  Erstbegehung: { type: String } // z.B. 'Ja' oder 'Nein'
});

module.exports = mongoose.model('Eintrag', eintragSchema);

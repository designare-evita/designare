// api/track-visitor.js

// Firebase-SDKs importieren
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc } = require('firebase/firestore');

// Deine Firebase-Konfiguration hier einfügen
// Du findest diese in den Projekteinstellungen deiner Firebase-Konsole
const firebaseConfig = {
  apiKey: "AIzaSyC1KW-lxl33sKSspJ4uopEkl_SAmvuMHEk",
  authDomain: "visitor-tracker-designare.firebaseapp.com",
  projectId: "visitor-tracker-designare",
  storageBucket: "visitor-tracker-designare.firebasestorage.app",
  messagingSenderId: "544570726375",
  appId: "1:544570726375:web:8488cb038a58003080cf42"
};

// Firebase initialisieren und Firestore-Instanz erhalten
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

module.exports = async (req, res) => {
  // Wichtige Besucherinformationen aus dem Request-Header extrahieren
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const userAgent = req.headers['user-agent'];
  const timestamp = new Date().toISOString();
  const page = req.headers.referer || 'Unbekannt'; // Welche Seite wurde besucht

  // Datenobjekt für die Datenbank erstellen
  const visitorData = {
    ip,
    userAgent,
    timestamp,
    page
  };

  try {
    // Daten in die "visitors"-Collection in Firestore schreiben
    const docRef = await addDoc(collection(db, "visitors"), visitorData);
    console.log("Besucherdaten erfolgreich in Firestore gespeichert. Dokument-ID:", docRef.id);

    // Erfolgreiche Antwort zurücksenden
    res.status(200).send('Besuch erfolgreich protokolliert und in Firestore gespeichert.');
  } catch (e) {
    console.error("Fehler beim Hinzufügen des Dokuments:", e);
    // Fehlerantwort senden
    res.status(500).send('Fehler beim Speichern der Besucherdaten.');
  }
};

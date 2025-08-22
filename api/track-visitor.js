// api/track-visitor.js

const fs = require('fs');
const path = require('path');

module.exports = (req, res) => {
  // Wichtige Besucherinformationen aus dem Request-Header extrahieren
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const userAgent = req.headers['user-agent'];
  const timestamp = new Date().toISOString();
  const page = req.headers.referer || 'Unbekannt'; // Welche Seite wurde besucht

  // Die Zeile, die in die Log-Datei geschrieben wird
  const logEntry = `${timestamp}, IP: ${ip}, User-Agent: ${userAgent}, Seite: ${page}\n`;

  // Pfad zur Log-Datei. Wir speichern sie im Verzeichnis /tmp/, 
  // das von Serverless-Plattformen wie Vercel für temporäre Dateien genutzt wird.
  // WICHTIG: Auf Vercel werden diese Logs nach einiger Zeit gelöscht. 
  // Für eine dauerhafte Speicherung wäre eine Datenbank die bessere Lösung.
  const logFilePath = path.join('/tmp', 'visitor_log.txt');

  // Log-Eintrag in die Datei schreiben
  fs.appendFile(logFilePath, logEntry, (err) => {
    if (err) {
      console.error('Fehler beim Schreiben der Log-Datei:', err);
      // Sende eine Fehlerantwort, falls das Schreiben fehlschlägt
      return res.status(500).send('Fehler beim Protokollieren des Besuchs.');
    }

    // Sende eine erfolgreiche Antwort (200 OK) zurück
    res.status(200).send('Besuch erfolgreich protokolliert.');
  });
};

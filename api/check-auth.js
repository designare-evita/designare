// api/check-auth.js
export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
    
    const { password } = req.body;
    const MASTER_PASSWORD = process.env.SILAS_MASTER_PASSWORD;

    if (password === MASTER_PASSWORD) {
        return res.status(200).json({ success: true, message: "Zugriff gewährt" });
    } else {
        return res.status(401).json({ success: false, message: "Falsches Passwort" });
    }
}

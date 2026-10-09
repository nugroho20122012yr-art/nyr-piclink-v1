// Menyajikan gambar dari Realtime Database sebagai file gambar sungguhan (untuk background & hotlink)
// URL: /i/<UID16>.png  (ekstensi opsional)
const RTDB_URL = process.env.RTDB_URL || "https://imgtourl-ee5b7-default-rtdb.asia-southeast1.firebasedatabase.app"; // contoh: https://imgtourl-ee5b7-default-rtdb.asia-southeast1.firebasedatabase.app

module.exports = async (req, res) => {
  const m = String(req.query.file || "").match(/^([A-Za-z0-9]{16})(\.(png|jpg|jpeg|webp|gif))?$/);
  if (!m) return res.status(404).send("Not found");
  try {
    const r = await fetch(`${RTDB_URL.replace(/\/$/, "")}/images/${m[1]}.json`);
    const j = r.ok ? await r.json() : null;
    if (!j || !j.d || !/^image\/(png|jpeg|webp|gif)$/.test(j.t)) return res.status(404).send("Not found");
    res.setHeader("Content-Type", j.t);
    res.setHeader("Cache-Control", "public, max-age=31536000, s-maxage=31536000, immutable");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(200).send(Buffer.from(j.d, "base64"));
  } catch (e) { res.status(500).send("Error"); }
};

import { initializeApp } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js";
import { getDatabase, ref, set, serverTimestamp } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-database.js";
import { firebaseConfig } from "./firebase-config.js";
import { renderQR, downloadQR } from "./qr.js";

const db = getDatabase(initializeApp(firebaseConfig));
const MAX = 2000000;          // 2 MB per gambar (setelah dikompres)
const MAX_RAW = 25000000;     // batas file mentah yang mau dikompres
const $ = (id) => document.getElementById(id);

function uid(n = 16) {
  const abc = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const r = crypto.getRandomValues(new Uint8Array(n));
  return Array.from(r, (b) => abc[b % abc.length]).join("");
}

// Cek tipe asli lewat magic bytes, bukan ekstensi
async function realType(file) {
  const b = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const h = (a) => a.every((v, i) => b[i] === v);
  if (h([0x89, 0x50, 0x4e, 0x47])) return ["image/png", "png"];
  if (h([0xff, 0xd8, 0xff])) return ["image/jpeg", "jpg"];
  if (h([0x47, 0x49, 0x46, 0x38])) return ["image/gif", "gif"];
  if (h([0x52, 0x49, 0x46, 0x46]) && b[8] === 0x57 && b[9] === 0x45) return ["image/webp", "webp"];
  return null;
}

// Kompres otomatis (WebP) kalau file lebih dari 2 MB
async function shrink(file) {
  const bmp = await createImageBitmap(file);
  let scale = Math.min(1, 1920 / Math.max(bmp.width, bmp.height));
  for (let q = 0.85; q > 0.3; q -= 0.15) {
    const c = document.createElement("canvas");
    c.width = Math.round(bmp.width * scale); c.height = Math.round(bmp.height * scale);
    c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
    const blob = await new Promise((r) => c.toBlob(r, "image/webp", q));
    if (blob && blob.size <= MAX) return blob;
    scale *= 0.8;
  }
  return null;
}

const toB64 = (blob) => new Promise((ok, no) => {
  const r = new FileReader();
  r.onload = () => ok(r.result.split(",")[1]); r.onerror = no; r.readAsDataURL(blob);
});

function showErr(m) { const e = $("err"); e.textContent = m; e.style.display = m ? "block" : "none"; }

async function handle(file) {
  showErr("");
  if (!file) return;
  if (file.size > MAX_RAW) return showErr("File terlalu besar. Maksimal 25 MB.");
  const t = await realType(file);
  if (!t) return showErr("Format tidak didukung. Pakai PNG, JPG, WEBP, atau GIF.");

  let blob = file, type = t[0], ext = t[1];
  if (file.size > MAX) {
    if (type === "image/gif") return showErr("GIF maksimal 2 MB.");
    try { blob = await shrink(file); } catch { blob = null; }
    if (!blob) return showErr("Gambar terlalu besar dan gagal dikompres. Perkecil dulu.");
    type = "image/webp"; ext = "webp";
  }

  const id = uid();
  $("bar").style.display = "block"; $("fill").style.width = "40%";
  try {
    await set(ref(db, "images/" + id), { d: await toB64(blob), t: type, s: blob.size, c: serverTimestamp() });
  } catch (e) {
    $("bar").style.display = "none";
    return showErr("Upload gagal. Cek rules dan databaseURL, lalu coba lagi.");
  }
  $("fill").style.width = "100%";
  done(id, ext, blob);
}

function done(id, ext, blob) {
  const direct = `${location.origin}/i/${id}.${ext}`;
  const viewUrl = new URL(`view.html?id=${id}`, location.href).href;
  $("bar").style.display = "none";
  $("result").style.display = "block";
  $("preview").src = URL.createObjectURL(blob);
  $("direct").value = direct;
  $("view").value = viewUrl;
  $("css").value = `body {\n  background: url("${direct}") center / cover no-repeat fixed;\n}`;
  $("html").value = `<img src="${direct}" alt="">`;
  renderQR($("qr"), viewUrl, 220);
  $("result").scrollIntoView({ behavior: "smooth" });
}

$("file").addEventListener("change", (e) => handle(e.target.files[0]));
const drop = $("drop");
["dragenter", "dragover"].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add("over"); }));
["dragleave", "drop"].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove("over"); }));
drop.addEventListener("drop", (e) => handle(e.dataTransfer.files[0]));

document.querySelectorAll("[data-copy]").forEach((b) => b.addEventListener("click", async () => {
  await navigator.clipboard.writeText($(b.dataset.copy).value);
  const old = b.textContent; b.textContent = "Tersalin"; setTimeout(() => (b.textContent = old), 1200);
}));
$("dlqr").addEventListener("click", () => downloadQR($("qr")));

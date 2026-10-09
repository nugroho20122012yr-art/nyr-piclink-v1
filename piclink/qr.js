// qr.js — pembuat QR PicLink. Warna dikunci: QR hitam, latar putih (tidak bisa diubah).
// qrcodejs hanya dipakai sebagai encoder (matriks modul); gambar dirender sendiri
// ke canvas persegi supaya selalu 1:1 dengan margin putih (quiet zone) yang benar.
const DARK = "#000000", LIGHT = "#ffffff", QUIET = 4;
export const MAX_LEN = 200; // qrcodejs mendukung sampai versi 10 (~213 byte pada level M)

export function renderQR(el, text, size = 240) {
  el.innerHTML = "";
  if (!text) throw new Error("Isi link atau teks dulu.");
  if (text.length > MAX_LEN) throw new Error("Teks terlalu panjang. Maksimal " + MAX_LEN + " karakter.");
  let model;
  try {
    const tmp = document.createElement("div"); // wadah sementara, tidak dipasang ke halaman
    model = new QRCode(tmp, { text, width: 64, height: 64, correctLevel: QRCode.CorrectLevel.M })._oQRCode;
  } catch (e) { throw new Error("Teks terlalu panjang untuk dijadikan QR."); }

  const n = model.getModuleCount(), total = n + QUIET * 2;
  const cell = Math.max(4, Math.floor(size / total)); // piksel per modul (bilangan bulat)
  const c = document.createElement("canvas");
  c.width = c.height = total * cell;
  c.style.width = c.style.height = total * cell + "px";
  const x = c.getContext("2d");
  x.fillStyle = LIGHT; x.fillRect(0, 0, c.width, c.height);
  x.fillStyle = DARK;
  for (let r = 0; r < n; r++)
    for (let k = 0; k < n; k++)
      if (model.isDark(r, k)) x.fillRect((k + QUIET) * cell, (r + QUIET) * cell, cell, cell);
  el.appendChild(c);
}

// Unduh PNG tajam: diperbesar dengan kelipatan bilangan bulat sampai >= 1024 px
export function downloadQR(el, filename = "qr-piclink.png") {
  const src = el.querySelector("canvas");
  if (!src) return;
  const k = Math.ceil(1024 / src.width);
  const c = document.createElement("canvas");
  c.width = c.height = src.width * k;
  const x = c.getContext("2d");
  x.imageSmoothingEnabled = false;
  x.drawImage(src, 0, 0, c.width, c.height);
  const a = document.createElement("a");
  a.href = c.toDataURL("image/png"); a.download = filename; a.click();
}

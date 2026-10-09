/* anti-clone.js — verifikasi index.html
   Mode "gate"  : dipakai index.html root; kalau domain valid → lanjut ke aplikasi.
   Mode "guard" : dipakai halaman aplikasi; kalau domain tidak valid → halaman dikosongkan.
   NB: proteksi sisi-klien bisa dilewati orang yang paham; ini hanya penghalang awal. */
(function () {
  // Domain yang lolos (tanpa https://). Diawali titik = semua subdomain.
  var ALLOWED = ["nyr-piclink-v1.vercel.app"];
  var s = document.currentScript;
  var mode = s.getAttribute("data-mode") || "guard";
  var h = location.hostname;
  var ok = ALLOWED.some(function (d) { return d.charAt(0) === "." ? h.slice(-d.length) === d : h === d; });
  var framed = window.top !== window.self;

  function block() {
    document.documentElement.innerHTML =
      '<body style="margin:0;height:100vh;display:flex;align-items:center;justify-content:center;font:700 20px system-ui;background:#f1ebdd">' +
      "Domain tidak dikenali. Situs ini hanya berjalan di domain resminya.</body>";
  }
  if (!ok || framed) { block(); return; }
  if (mode === "gate") {
    var next = s.getAttribute("data-next");
    setTimeout(function () { location.replace(next); }, 600);
  }
})();

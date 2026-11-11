// Gemeinsamer Leser für alle drei Zeitungen.
// Ordner je Zeitung: ausgaben/index.json ({"ausgaben": ["JJJJ-MM-TT", …]}) und ausgaben/JJJJ-MM-TT.json.
// Neues Format: { gruss, aufmacher, seiten: [{ titel, artikel: [...], kasten? }], zumSchluss }.
// Altes Format (rubriken statt seiten) wird automatisch in Seiten umgewandelt.
(async function () {
  const root = document.getElementById("zeitung");
  const cfg = window.ZEITUNG || {};
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const absatz = t => String(t ?? "").split(/\n\s*\n/).map(p => `<p>${esc(p)}</p>`).join("");
  const tag = iso => new Date(iso + "T12:00:00");
  const datumLang = iso => tag(iso).toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const datumKurz = iso => tag(iso).toLocaleDateString("de-DE", { weekday: "short", day: "numeric", month: "numeric" });
  const quellen = q => (q && q.length) ? `<div class="quellen">Quelle: ${q.map(x => `<a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.name)}</a>`).join(" · ")}</div>` : "";
  const fehler = t => { root.innerHTML = `<p class="leer">${esc(t)}</p>`; };

  // ---------- Ausgaben-Liste ----------
  let index;
  try { index = await (await fetch("ausgaben/index.json", { cache: "no-cache" })).json(); }
  catch { return fehler("Die Zeitung konnte nicht geladen werden."); }
  const daten = (index.ausgaben || []).map(x => typeof x === "string" ? x : x.datum).filter(Boolean).sort().reverse();
  if (!daten.length) return fehler("Noch keine Ausgabe da.");
  const ladeAusgabe = d => fetch(`ausgaben/${d}.json`, { cache: "no-cache" }).then(r => { if (!r.ok) throw 0; return r.json(); });

  const params = new URLSearchParams(location.search);
  if (params.has("archiv")) return zeigeArchiv();

  const datum = daten.includes(params.get("datum")) ? params.get("datum") : daten[0];
  let a;
  try { a = await ladeAusgabe(datum); } catch { return fehler(`Die Ausgabe vom ${datumLang(datum)} fehlt.`); }
  const istNeueste = datum === daten[0];
  const nr = daten.length - daten.indexOf(datum);

  // ---------- Seiten zusammenstellen ----------
  let seiten = a.seiten && a.seiten.length ? a.seiten.slice()
    : (a.rubriken || []).map(r => ({ titel: r.name, artikel: r.artikel || [] }));
  if (a.zumSchluss && !seiten.some(s => s.zumSchluss)) {
    const letzte = seiten[seiten.length - 1];
    if (letzte && seiten.length >= 9) letzte.zumSchluss = a.zumSchluss;
    else seiten.push({ titel: a.zumSchluss.titel || "Zum Schluss", artikel: [], zumSchluss: a.zumSchluss });
  }
  if (cfg.sudoku && window.Sudoku) seiten.push({ titel: "Rätsel: Sudoku", sudoku: true, teaser: "Dein tägliches Sudoku zum Mitspielen" });
  const gesamt = seiten.length + 1; // Seite 1 = Titelseite

  const kopf = `
    <header class="kopf">
      <div class="kopfzeile"><span>${esc(datumLang(datum))}</span><span>Ausgabe Nr. ${nr}</span></div>
      <h1 class="titel"><a href="./">${esc(cfg.titel || "Zeitung")}</a></h1>
      <div class="unterzeile">${esc(cfg.unterzeile || "")}</div>
      <nav class="kopfnav"><a href="./" class="${istNeueste ? "aktiv" : ""}">Heute</a><a href="?archiv">Archiv</a></nav>
    </header>
    ${istNeueste ? "" : `<div class="hinweis">Du liest die Ausgabe vom ${esc(datumLang(datum))}. <a href="./">Zur neuesten Ausgabe →</a></div>`}`;

  const artikelHtml = (x, gross) => `<article class="artikel${gross || x.gross ? " gross" : ""}">
      ${x.rubrik ? `<div class="rubrik">${esc(x.rubrik)}</div>` : ""}
      <h4>${esc(x.titel)}</h4>${x.unterzeile ? `<div class="unter">${esc(x.unterzeile)}</div>` : ""}
      <div class="text">${absatz(x.text)}</div>${quellen(x.quellen)}
    </article>`;
  const kastenHtml = k => !k ? "" : `<aside class="kasten"><h5>${esc(k.titel || "")}</h5>
      ${k.punkte ? `<ul>${k.punkte.map(p => `<li>${esc(p)}</li>`).join("")}</ul>` : absatz(k.text)}${quellen(k.quellen)}</aside>`;

  function titelseite() {
    const auf = a.aufmacher;
    return `
      ${a.gruss ? `<p class="gruss">${esc(a.gruss)}</p>` : ""}
      ${istNeueste && cfg.wetter ? `<aside class="wetter" id="wetter">Wetter in Mülheim wird geladen …</aside>` : ""}
      ${auf ? `<article class="aufmacher">
          ${auf.rubrik ? `<div class="rubrik">${esc(auf.rubrik)}</div>` : ""}
          <h2>${esc(auf.titel)}</h2>${auf.unterzeile ? `<div class="unter">${esc(auf.unterzeile)}</div>` : ""}
          <div class="text">${absatz(auf.text)}</div>${quellen(auf.quellen)}
        </article>` : ""}
      <section class="inhalt"><h3 class="rubrikname">Heute in dieser Ausgabe</h3>
        <ol>${seiten.map((s, i) => `<li><a href="#s${i + 2}"><span class="snr">Seite ${i + 2}</span>
          <strong>${esc(s.titel)}</strong><span class="teaser">${esc((s.artikel && s.artikel[0] && s.artikel[0].titel) || (s.zumSchluss && s.zumSchluss.titel) || s.teaser || "")}</span></a></li>`).join("")}</ol>
      </section>`;
  }
  function seite(i) { // i = 0-basiert in seiten[]
    const s = seiten[i];
    if (s.sudoku) return `<h2 class="seitentitel"><span>Seite ${i + 2}</span>${esc(s.titel)}</h2><div id="sudoku-platz"></div>`;
    const art = s.artikel || [];
    return `
      <h2 class="seitentitel"><span>Seite ${i + 2}</span>${esc(s.titel)}</h2>
      <div class="seitengrid${s.kasten ? " mit-kasten" : ""}">
        <div class="artikelgrid">${art.map((x, j) => artikelHtml(x, j === 0 && art.length > 2)).join("")}</div>
        ${kastenHtml(s.kasten)}
      </div>
      ${s.zumSchluss ? `<section class="schluss"><h3>${esc(s.zumSchluss.titel || "Zum Schluss")}</h3>${absatz(s.zumSchluss.text)}</section>` : ""}`;
  }

  root.innerHTML = `${kopf}
    <nav class="blaettern oben" aria-label="Seiten"></nav>
    <div id="seite" class="seite"></div>
    <nav class="blaettern unten" aria-label="Seiten"></nav>
    <footer class="fuss"><a href="?archiv">Alle Ausgaben im Archiv</a><a href="https://dyver.de/">dyver.de</a></footer>`;
  document.title = `${cfg.titel || "Zeitung"} · ${tag(datum).toLocaleDateString("de-DE")}`;

  const box = document.getElementById("seite");
  let aktuell = 1;
  function nav() {
    const opts = [`<option value="1">Seite 1 · Titelseite</option>`]
      .concat(seiten.map((s, i) => `<option value="${i + 2}">Seite ${i + 2} · ${esc(s.titel)}</option>`)).join("");
    document.querySelectorAll(".blaettern").forEach(n => {
      n.innerHTML = `<button data-zu="${aktuell - 1}" ${aktuell <= 1 ? "disabled" : ""} aria-label="Vorige Seite">‹</button>
        <select aria-label="Seite wählen">${opts}</select>
        <button data-zu="${aktuell + 1}" ${aktuell >= gesamt ? "disabled" : ""} aria-label="Nächste Seite">›</button>`;
      n.querySelector("select").value = String(aktuell);
      n.querySelector("select").onchange = e => gehe(+e.target.value);
      n.querySelectorAll("button").forEach(b => b.onclick = () => gehe(+b.dataset.zu));
    });
  }
  function gehe(n, ohneScroll) {
    n = Math.max(1, Math.min(gesamt, n | 0));
    aktuell = n;
    box.innerHTML = n === 1 ? titelseite() : seite(n - 2);
    box.dataset.seite = n;
    nav();
    if (location.hash !== `#s${n}`) history.replaceState(null, "", n === 1 ? location.pathname + location.search : `#s${n}`);
    if (!ohneScroll) document.querySelector(".blaettern.oben").scrollIntoView({ behavior: "smooth", block: "start" });
    if (n === 1) wetter();
    const platz = document.getElementById("sudoku-platz");
    if (platz) window.Sudoku.mount(platz, datum, document.body.className);
  }
  addEventListener("hashchange", () => { const m = location.hash.match(/^#s(\d+)$/); if (m && +m[1] !== aktuell) gehe(+m[1]); });
  addEventListener("keydown", e => {
    if (e.target.closest("select, input, textarea, .sudoku")) return;
    if (e.key === "ArrowRight") gehe(aktuell + 1); else if (e.key === "ArrowLeft") gehe(aktuell - 1);
  });
  let x0 = null, y0 = null;
  box.addEventListener("touchstart", e => { if (e.target.closest(".sudoku")) { x0 = null; return; } x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
  box.addEventListener("touchend", e => {
    if (x0 == null) return;
    const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
    if (Math.abs(dx) > 70 && Math.abs(dx) > 2 * Math.abs(dy)) gehe(aktuell + (dx < 0 ? 1 : -1));
    x0 = null;
  });
  const start = (location.hash.match(/^#s(\d+)$/) || [])[1];
  gehe(start ? +start : 1, true);

  async function wetter() {
    const el = document.getElementById("wetter");
    if (!el) return;
    try {
      const u = "https://api.open-meteo.com/v1/forecast?latitude=51.43&longitude=6.88&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Europe%2FBerlin&forecast_days=1";
      const w = (await (await fetch(u)).json()).daily;
      const code = w.weather_code[0];
      const art = code === 0 ? "☀️ sonnig" : code <= 3 ? "⛅ wechselnd bewölkt" : code <= 48 ? "🌫️ neblig" : code <= 67 ? "🌧️ Regen" : code <= 77 ? "❄️ Schnee" : code <= 82 ? "🌦️ Schauer" : "⛈️ Gewitter";
      el.innerHTML = `<strong>Wetter heute in Mülheim:</strong> ${art}, ${Math.round(w.temperature_2m_min[0])} bis ${Math.round(w.temperature_2m_max[0])} °C, Regenrisiko ${w.precipitation_probability_max[0]} %`;
    } catch { el.remove(); }
  }

  // ---------- Archiv ----------
  async function zeigeArchiv() {
    document.title = `${cfg.titel || "Zeitung"} · Archiv`;
    const monate = {};
    for (const d of daten) (monate[d.slice(0, 7)] ||= []).push(d);
    root.innerHTML = `
      <header class="kopf">
        <div class="kopfzeile"><span>Archiv</span><span>${daten.length} Ausgabe${daten.length === 1 ? "" : "n"}</span></div>
        <h1 class="titel"><a href="./">${esc(cfg.titel || "Zeitung")}</a></h1>
        <div class="unterzeile">${esc(cfg.unterzeile || "")}</div>
        <nav class="kopfnav"><a href="./">Heute</a><a href="?archiv" class="aktiv">Archiv</a></nav>
      </header>
      ${Object.entries(monate).map(([m, ds]) => `
        <section class="archivmonat"><h3 class="rubrikname">${esc(tag(m + "-15").toLocaleDateString("de-DE", { month: "long", year: "numeric" }))}</h3>
          <ul class="archivliste">${ds.map(d => `<li><a href="?datum=${d}"><span class="adatum">${esc(datumKurz(d))}</span>
            <span class="aschlag" data-d="${d}">…</span></a></li>`).join("")}</ul></section>`).join("")}
      <footer class="fuss"><a href="./">Zur neuesten Ausgabe</a><a href="https://dyver.de/">dyver.de</a></footer>`;
    // Schlagzeilen nachladen (je 6 gleichzeitig)
    const els = [...root.querySelectorAll(".aschlag")];
    let k = 0;
    const arbeiter = async () => {
      while (k < els.length) {
        const el = els[k++];
        try { const x = await ladeAusgabe(el.dataset.d); el.textContent = x.aufmacher?.titel || "Ausgabe"; }
        catch { el.textContent = "Ausgabe"; }
      }
    };
    await Promise.all(Array.from({ length: 6 }, arbeiter));
  }
})();

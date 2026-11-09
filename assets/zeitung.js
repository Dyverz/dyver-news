// Gemeinsamer Renderer für alle drei Zeitungen.
// Jede Zeitung hat einen Ordner mit ausgaben/index.json (Liste der Daten) und ausgaben/JJJJ-MM-TT.json.
(async function () {
  const root = document.getElementById("zeitung");
  const cfg = window.ZEITUNG || {};
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const absatz = t => String(t ?? "").split(/\n\s*\n/).map(p => `<p>${esc(p)}</p>`).join("");
  const datumLang = iso => new Date(iso + "T12:00:00").toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const quellen = q => (q && q.length) ? `<div class="quellen">Quelle: ${q.map(x => `<a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.name)}</a>`).join(" · ")}</div>` : "";

  let index;
  try { index = await (await fetch("ausgaben/index.json", { cache: "no-cache" })).json(); }
  catch { root.innerHTML = `<p class="leer">Die Ausgabe konnte nicht geladen werden.</p>`; return; }
  const daten = (index.ausgaben || []).slice().sort().reverse();
  const wunsch = new URLSearchParams(location.search).get("datum");
  const datum = daten.includes(wunsch) ? wunsch : daten[0];
  if (!datum) { root.innerHTML = `<p class="leer">Noch keine Ausgabe da.</p>`; return; }

  let a;
  try { a = await (await fetch(`ausgaben/${datum}.json`, { cache: "no-cache" })).json(); }
  catch { root.innerHTML = `<p class="leer">Die Ausgabe vom ${esc(datum)} fehlt.</p>`; return; }

  const nr = daten.length - daten.indexOf(datum);
  const zeigWetter = cfg.wetter && datum === daten[0];
  const auf = a.aufmacher;
  root.innerHTML = `
    <header class="kopf">
      <div class="kopfzeile"><span>${esc(datumLang(datum))}</span><span>Ausgabe Nr. ${nr}</span></div>
      <h1 class="titel">${esc(cfg.titel || a.titel)}</h1>
      <div class="unterzeile">${esc(cfg.unterzeile || "")}</div>
    </header>
    ${a.gruss ? `<p class="gruss">${esc(a.gruss)}</p>` : ""}
    ${zeigWetter ? `<aside class="wetter" id="wetter">Wetter in Mülheim wird geladen …</aside>` : ""}
    ${auf ? `<article class="aufmacher">
        ${auf.rubrik ? `<div class="rubrik">${esc(auf.rubrik)}</div>` : ""}
        <h2>${esc(auf.titel)}</h2>
        <div class="text">${absatz(auf.text)}</div>${quellen(auf.quellen)}
      </article>` : ""}
    ${(a.rubriken || []).map(r => `
      <section class="rubrikblock">
        <h3 class="rubrikname">${esc(r.name)}</h3>
        <div class="artikelgrid">
          ${(r.artikel || []).map(x => `<article class="artikel">
            <h4>${esc(x.titel)}</h4><div class="text">${absatz(x.text)}</div>${quellen(x.quellen)}
          </article>`).join("")}
        </div>
      </section>`).join("")}
    ${a.zumSchluss ? `<section class="schluss"><h3>${esc(a.zumSchluss.titel || "Zum Schluss")}</h3>${absatz(a.zumSchluss.text)}</section>` : ""}
    <footer class="fuss">
      ${daten.length > 1 ? `<label>Frühere Ausgaben:
        <select onchange="location.search='?datum='+this.value">
          ${daten.map(d => `<option value="${d}" ${d === datum ? "selected" : ""}>${esc(datumLang(d))}</option>`).join("")}
        </select></label>` : ""}
      <a href="https://dyver.de/">dyver.de</a>
    </footer>`;
  document.title = `${cfg.titel || "Zeitung"} · ${new Date(datum + "T12:00:00").toLocaleDateString("de-DE")}`;

  if (zeigWetter) {
    try {
      const u = "https://api.open-meteo.com/v1/forecast?latitude=51.43&longitude=6.88&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Europe%2FBerlin&forecast_days=1";
      const w = (await (await fetch(u)).json()).daily;
      const code = w.weather_code[0];
      const art = code === 0 ? "☀️ sonnig" : code <= 3 ? "⛅ wechselnd bewölkt" : code <= 48 ? "🌫️ neblig" : code <= 67 ? "🌧️ Regen" : code <= 77 ? "❄️ Schnee" : code <= 82 ? "🌦️ Schauer" : "⛈️ Gewitter";
      document.getElementById("wetter").innerHTML =
        `<strong>Wetter heute in Mülheim:</strong> ${art}, ${Math.round(w.temperature_2m_min[0])} bis ${Math.round(w.temperature_2m_max[0])} °C, Regenrisiko ${w.precipitation_probability_max[0]} %`;
    } catch { document.getElementById("wetter").remove(); }
  }
})();

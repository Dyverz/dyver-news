// Tägliches Sudoku (mittlere Stärke). Jeder Tag hat sein eigenes Rätsel: Es wird aus dem Datum erzeugt,
// hat genau eine Lösung und ist für alle Geräte am selben Tag gleich. Der Spielstand bleibt im Browser.
// Nutzung: Sudoku.mount(element, "JJJJ-MM-TT", "mama")
(function () {
  const ZIEL_VORGABEN = 30; // mittlere Stärke: etwa 30 vorgegebene Zahlen, immer genau eine Lösung

  // ---------- Zufall aus dem Datum ----------
  function hash(s) { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { let a = seed; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const mische = (arr, r) => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };

  // ---------- Löser (Bitmasken, zählt bis zu 2 Lösungen) ----------
  const BOX = i => Math.floor(Math.floor(i / 9) / 3) * 3 + Math.floor((i % 9) / 3);
  function loese(g, r, max) { // g: Array(81) mit 0 = leer; füllt g mit der ersten Lösung, wenn r gegeben
    const row = new Array(9).fill(0), col = new Array(9).fill(0), box = new Array(9).fill(0);
    for (let i = 0; i < 81; i++) if (g[i]) { const b = 1 << g[i]; row[(i / 9) | 0] |= b; col[i % 9] |= b; box[BOX(i)] |= b; }
    let anzahl = 0, erste = null;
    (function suche() {
      if (anzahl >= max) return;
      let best = -1, bestFrei = 0, bestN = 10;
      for (let i = 0; i < 81; i++) if (!g[i]) {
        const frei = ~(row[(i / 9) | 0] | col[i % 9] | box[BOX(i)]) & 0x3FE;
        let n = 0; for (let m = frei; m; m &= m - 1) n++;
        if (n < bestN) { best = i; bestFrei = frei; bestN = n; if (n <= 1) break; }
      }
      if (best < 0) { anzahl++; if (!erste) erste = g.slice(); return; }
      if (!bestN) return;
      const ziffern = []; for (let d = 1; d <= 9; d++) if (bestFrei & (1 << d)) ziffern.push(d);
      if (r) mische(ziffern, r);
      const rr = (best / 9) | 0, cc = best % 9, bb = BOX(best);
      for (const d of ziffern) {
        const b = 1 << d; g[best] = d; row[rr] |= b; col[cc] |= b; box[bb] |= b;
        suche();
        g[best] = 0; row[rr] &= ~b; col[cc] &= ~b; box[bb] &= ~b;
        if (anzahl >= max) return;
      }
    })();
    return { anzahl, erste };
  }

  function erzeuge(seedText) {
    const r = rng(hash(seedText));
    const loesung = loese(new Array(81).fill(0), r, 1).erste;
    const raetsel = loesung.slice();
    let vorgaben = 81;
    for (const i of mische([...Array(81).keys()], r)) {
      if (vorgaben <= ZIEL_VORGABEN) break;
      const alt = raetsel[i]; raetsel[i] = 0;
      if (loese(raetsel.slice(), null, 2).anzahl !== 1) raetsel[i] = alt; else vorgaben--;
    }
    return { raetsel, loesung };
  }

  // ---------- Speicher (darf fehlen) ----------
  const lies = k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };
  const schreib = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

  // ---------- Spielfeld ----------
  function mount(el, datum, name) {
    const { raetsel, loesung } = erzeuge(`sudoku|${name || ""}|${datum}`);
    const KEY = `sudoku:${name || ""}:${datum}`;
    const gespeichert = lies(KEY);
    const feld = (gespeichert && Array.isArray(gespeichert.feld) && gespeichert.feld.length === 81) ? gespeichert.feld : raetsel.slice();
    for (let i = 0; i < 81; i++) if (raetsel[i]) feld[i] = raetsel[i];
    let markiert = new Set(), auswahl = feld.findIndex(v => !v), fertig = false;

    el.innerHTML = `
      <div class="sudoku">
        <p class="sd-info">Fülle jede Zeile, jede Spalte und jedes dicke 3×3-Kästchen mit den Zahlen 1 bis 9. Tippe auf ein Feld und dann auf eine Zahl.</p>
        <div class="sd-spiel">
          <div class="sd-brett" role="grid" aria-label="Sudoku"></div>
          <div class="sd-seite">
            <div class="sd-tasten"></div>
            <div class="sd-aktionen">
              <button type="button" data-a="loeschen">Löschen</button>
              <button type="button" data-a="pruefen">Prüfen</button>
              <button type="button" data-a="tipp">Tipp</button>
              <button type="button" data-a="neu">Von vorn</button>
            </div>
            <p class="sd-meldung" aria-live="polite"></p>
          </div>
        </div>
      </div>`;
    const brett = el.querySelector(".sd-brett"), tasten = el.querySelector(".sd-tasten"), meldung = el.querySelector(".sd-meldung");
    brett.innerHTML = Array.from({ length: 81 }, (_, i) =>
      `<button type="button" class="sd-zelle${raetsel[i] ? " vorgabe" : ""}${(i % 9) % 3 === 2 && i % 9 !== 8 ? " rechts" : ""}${((i / 9) | 0) % 3 === 2 && i < 72 ? " unten" : ""}" data-i="${i}"></button>`).join("");
    tasten.innerHTML = Array.from({ length: 9 }, (_, k) => `<button type="button" data-z="${k + 1}">${k + 1}</button>`).join("");
    const zellen = [...brett.children];

    const konflikt = i => {
      const v = feld[i]; if (!v) return false;
      const r = (i / 9) | 0, c = i % 9, b = BOX(i);
      for (let j = 0; j < 81; j++) if (j !== i && feld[j] === v && (((j / 9) | 0) === r || j % 9 === c || BOX(j) === b)) return true;
      return false;
    };
    function zeichne() {
      const sel = auswahl, wert = sel >= 0 ? feld[sel] : 0;
      zellen.forEach((z, i) => {
        z.textContent = feld[i] || "";
        const verwandt = sel >= 0 && (((i / 9) | 0) === ((sel / 9) | 0) || i % 9 === sel % 9 || BOX(i) === BOX(sel));
        z.classList.toggle("gewaehlt", i === sel);
        z.classList.toggle("verwandt", verwandt && i !== sel);
        z.classList.toggle("gleich", !!wert && feld[i] === wert && i !== sel);
        z.classList.toggle("konflikt", !raetsel[i] && konflikt(i));
        z.classList.toggle("falsch", markiert.has(i) && feld[i] && feld[i] !== loesung[i]);
        z.setAttribute("aria-label", `Zeile ${((i / 9) | 0) + 1}, Spalte ${(i % 9) + 1}: ${feld[i] || "leer"}`);
      });
      const anzahl = Array(10).fill(0); feld.forEach(v => anzahl[v]++);
      [...tasten.children].forEach((t, k) => t.classList.toggle("voll", anzahl[k + 1] >= 9));
    }
    function speichern() { schreib(KEY, { feld, fertig }); }
    function pruefeFertig() {
      if (feld.every((v, i) => v === loesung[i])) {
        fertig = true; auswahl = -1;
        meldung.innerHTML = "🎉 <strong>Geschafft!</strong> Das Sudoku ist richtig gelöst. Morgen gibt es ein neues.";
        el.querySelector(".sudoku").classList.add("geloest");
      }
    }
    function setze(z) {
      if (fertig || auswahl < 0 || raetsel[auswahl]) return;
      feld[auswahl] = feld[auswahl] === z ? 0 : z;
      markiert.delete(auswahl); meldung.textContent = "";
      pruefeFertig(); speichern(); zeichne();
    }

    brett.addEventListener("click", e => { const z = e.target.closest(".sd-zelle"); if (!z || fertig) return; auswahl = +z.dataset.i; zeichne(); });
    tasten.addEventListener("click", e => { const t = e.target.closest("button"); if (t) setze(+t.dataset.z); });
    el.querySelector(".sd-aktionen").addEventListener("click", e => {
      const a = e.target.closest("button")?.dataset.a; if (!a || (fertig && a !== "neu")) return;
      if (a === "loeschen") setze(0);
      if (a === "pruefen") {
        markiert = new Set(feld.map((v, i) => (v && !raetsel[i] && v !== loesung[i]) ? i : -1).filter(i => i >= 0));
        const leer = feld.filter(v => !v).length;
        meldung.textContent = markiert.size ? `${markiert.size} Zahl${markiert.size === 1 ? " ist" : "en sind"} noch falsch (rot markiert).`
          : leer ? `Bisher alles richtig! Noch ${leer} Felder frei.` : "";
        zeichne();
      }
      if (a === "tipp") {
        let i = (auswahl >= 0 && !raetsel[auswahl] && feld[auswahl] !== loesung[auswahl]) ? auswahl : -1;
        if (i < 0) i = feld.findIndex((v, j) => !raetsel[j] && v !== loesung[j]);
        if (i < 0) return;
        feld[i] = loesung[i]; auswahl = i; markiert.delete(i);
        meldung.textContent = `Tipp: In Zeile ${((i / 9) | 0) + 1}, Spalte ${(i % 9) + 1} gehört die ${loesung[i]}.`;
        pruefeFertig(); speichern(); zeichne();
      }
      if (a === "neu") {
        if (!confirm("Alle eigenen Zahlen löschen und von vorn anfangen?")) return;
        for (let i = 0; i < 81; i++) feld[i] = raetsel[i];
        fertig = false; markiert.clear(); auswahl = feld.findIndex(v => !v); meldung.textContent = "";
        el.querySelector(".sudoku").classList.remove("geloest"); speichern(); zeichne();
      }
    });
    el.addEventListener("keydown", e => {
      if (/^[1-9]$/.test(e.key)) { setze(+e.key); e.preventDefault(); }
      else if (e.key === "Backspace" || e.key === "Delete" || e.key === "0") { setze(0); e.preventDefault(); }
      else if (e.key.startsWith("Arrow") && auswahl >= 0) {
        const d = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -9, ArrowDown: 9 }[e.key];
        auswahl = (auswahl + d + 81) % 81; zeichne(); zellen[auswahl].focus(); e.preventDefault();
      }
    });

    if (fertig || (gespeichert && gespeichert.fertig)) pruefeFertig();
    zeichne();
  }

  window.Sudoku = { mount, erzeuge, loese };
})();

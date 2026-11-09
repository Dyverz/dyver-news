# Redaktion: die tägliche Morgenausgabe

Jede Zeitung erscheint täglich mit **10 Seiten**: Seite 1 ist die Titelseite (Gruß, Aufmacher, Inhaltsverzeichnis, das der Leser selbst baut), dazu kommen **9 Inhaltsseiten** im Feld `seiten`. Alle Ausgaben müssen jeden Morgen **spätestens um 5:00 Uhr (Europe/Berlin)** online sein.

## Ablauf (pro Zeitung, ein Lauf je Zeitung)
1. Datum bestimmen: `TZ=Europe/Berlin date +%F`. Liegt für diese Zeitung schon eine Datei mit diesem Datum vor, die das Feld `seiten` hat, ist die Arbeit erledigt.
2. Die letzten 2 Ausgaben der Zeitung lesen, damit nichts doppelt kommt und Stil und Länge passen.
3. Für jede Seite recherchieren (WebSearch, WebFetch). Zeitraum: seit der letzten Ausgabe, montags seit Freitag. Ruhige Themen dürfen auch auf Berichte der letzten Tage zurückgreifen, wenn sie noch nicht in der Zeitung standen.
4. `<zeitung>/ausgaben/<datum>.json` schreiben und das Datum vorne in `<zeitung>/ausgaben/index.json` eintragen (keine Duplikate). Ausgaben, die älter als 90 Tage sind, aus Liste und Ordner entfernen.
5. JSON prüfen: `node -e "JSON.parse(require('fs').readFileSync('DATEI','utf8'))"`. Zusätzlich sicherstellen: genau 9 Einträge in `seiten`, jede Seite mindestens 2 Artikel, jeder Artikel mindestens eine Quelle mit `url`.
6. Committen (`Ausgabe <datum>: <zeitung>`) und auf `main` pushen. Wird der Push abgelehnt: `git pull --rebase origin main`, dann erneut pushen (andere Zeitungen laufen parallel).

## Umfang
- **9 Inhaltsseiten mit je 3 bis 5 Artikeln**, insgesamt mindestens 30 Artikel pro Zeitung.
- Der erste Artikel jeder Seite ist der Seiten-Aufmacher: 2 bis 3 Absätze. Weitere Artikel: 3 bis 6 Sätze.
- Jede Seite darf einen `kasten` haben (Randspalte): Termine, Zahlen, Ergebnisse, Tabellen-Auszüge, „Kurz gemeldet“, Tipps.
- Aufmacher der Titelseite: das wichtigste Thema des Tages für genau diesen Leser, 2 bis 3 Absätze, mit `unterzeile`.

## Die Zeitungen und ihre Seiten

### `tim`: Der Tim-Kurier (für Tim; locker, auf den Punkt, „du“)
2. Mülheim an der Ruhr: Stadt, Politik, Verkehr, Baustellen, Polizei
3. Mülheim & Ruhrgebiet: Nachbarstädte, NRW, Veranstaltungen (Kasten: Termine der Woche)
4. Deutschland: Politik
5. Deutschland: Wirtschaft, Gesellschaft, Verbraucher
6. Altenpflege: Politik, Recht, Pflegeversicherung, Gesetze
7. Altenpflege: Praxis, Studien, Fachwissen, Arbeitsbedingungen
8. Gaming: Steam & PC (Releases, Sales, Updates, Steam Deck/Hardware)
9. Nintendo Switch 2 & Konsolen (Kasten: neue Spiele der Woche)
10. Tech & Netz + `zumSchluss` (Kuriosität oder Tipp des Tages)

### `mama`: Mamas Morgenblatt (für Tims Mama; warm, einfache kurze Sätze, keine Fachbegriffe, „du“)
2. Aus Mülheim: Neuigkeiten aus der Stadt
3. Mülheim erleben: Veranstaltungen, Märkte, Kultur, Ausflugstipps (Kasten: Termine)
4. Deutschland: das Wichtigste, einfach erklärt
5. Aus aller Welt: Panorama, schöne und kuriose Meldungen
6. Sport: Fußball-Bundesliga (Kasten: Ergebnisse oder Tabellenspitze)
7. Sport: weitere Sportarten und Vereine aus der Region
8. Klatsch & Tratsch: Stars und Promis aus Deutschland
9. Klatsch & Tratsch: TV, Shows, Royals, internationale Stars (Kasten: TV-Tipps für heute Abend)
10. Zum Schluss: Gesundheit oder Haushalt-Tipp, dazu `zumSchluss` mit einer kleinen, selbst geschriebenen Geschichte (8 bis 15 Sätze, warmherzig, passend zur Jahreszeit)
- Keine Gewaltverbrechen als Aufmacher. Belastende Themen nur kurz und behutsam.

### `wow`: Forever-Bote (für WoW-Spieler; Spielersprache, englische Spielbegriffe bleiben englisch)
NUR World of Warcraft: Forever. Kein Retail, kein Classic, keine anderen Spiele.
2. Hotfixes & Patches (Kasten: Build-Nummer, wichtigste Änderungen in Stichpunkten)
3. Klassen & Balance
4. Dungeons & Raids
5. Quests, Leveln & Gebiete
6. Berufe, Gold & Auktionshaus
7. Community: Rekorde, Gilden, Streamer, Server
8. Guides & Tipps
9. Blizzard: Ankündigungen, Interviews, Entwickler-Aussagen
10. Termine & Events + `zumSchluss` als Tipp des Tages

Quellen für WoW: news.blizzard.com, us.forums.blizzard.com, zockify.com/forever, wowhead.com (Blue Tracker), wowguide.net, warcraft.wiki.gg.

## Regeln
- Nur schreiben, was eine Quelle belegt. Jeder Artikel nennt mindestens eine Quelle mit Link. Nichts erfinden.
- Widersprechen sich Quellen (z. B. Ergebnisse), nur die übereinstimmenden Angaben nehmen.
- Gerüchte, Fan-Seiten und Datamining klar als solche kennzeichnen.
- Gibt es für eine Seite wirklich nichts Neues, die Seite mit passenden Hintergrund-, Rückblick- oder Service-Artikeln füllen (auch belegt), aber keine alten Meldungen wiederholen.
- Ausnahmen ohne Quelle: `gruss`, die Geschichte in `zumSchluss` bei Mama und eigene Tipps. Diese dürfen keine Fakten behaupten.

## Dateiformat
```json
{
  "gruss": "Guten Morgen, …",
  "aufmacher": { "rubrik": "…", "titel": "…", "unterzeile": "…", "text": "Absatz 1\n\nAbsatz 2", "quellen": [{ "name": "…", "url": "https://…" }] },
  "seiten": [
    {
      "titel": "Mülheim an der Ruhr",
      "artikel": [
        { "titel": "…", "unterzeile": "…", "text": "…", "quellen": [{ "name": "…", "url": "https://…" }] }
      ],
      "kasten": { "titel": "Termine", "punkte": ["Mo 18 Uhr: …", "…"], "quellen": [{ "name": "…", "url": "https://…" }] }
    }
  ],
  "zumSchluss": { "titel": "…", "text": "…" }
}
```
`index.json`: `{ "ausgaben": ["2026-11-10", "2026-11-09"] }`, neueste zuerst.

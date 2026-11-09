# Redaktion: die tägliche Morgenausgabe

So erstellt Claude jeden Morgen die drei Zeitungen auf news.dyver.de.

## Ablauf
1. Heutiges Datum bestimmen (Zeitzone Europe/Berlin), Format `JJJJ-MM-TT`.
2. Für jede Zeitung mit der Websuche die Nachrichten der letzten 24 Stunden (montags seit Freitag) recherchieren.
3. `news.dyver.de/<zeitung>/ausgaben/<datum>.json` schreiben und das Datum vorne in `news.dyver.de/<zeitung>/ausgaben/index.json` eintragen.
4. Alle drei Dateien mit `node -e "JSON.parse(...)"` prüfen und danach veröffentlichen.

## Die Zeitungen
| Ordner | Titel | Für | Themen | Ton |
|---|---|---|---|---|
| `tim` | Der Tim-Kurier | Tim | Mülheim an der Ruhr, Deutschland, Altenpflege (Pflegepolitik, Pflegeversicherung, Fachthemen), Gaming & Tech (Steam, Switch 2) | locker, auf den Punkt, „du“ |
| `mama` | Mamas Morgenblatt | Tims Mama | Mülheim an der Ruhr, Deutschland, Sport (vor allem Fußball-Bundesliga), Klatsch & Tratsch | warm, einfache kurze Sätze, keine Fachbegriffe, „du“ |
| `wow` | Forever-Bote | WoW-Spieler | NUR World of Warcraft: Forever (Hotfixes, Builds, Klassen, Dungeons, Wirtschaft/AH, Termine). Kein Retail, kein Classic | Spielersprache, englische Spielbegriffe bleiben englisch |

Gute Quellen: Radio Mülheim, Stadt Mülheim (Pressemitteilungen), WAZ Mülheim, Presseportal; zdfheute, tagesschau; altenheim.net, altenpflege-online.net, carevor9.de; nintendolife, mynintendonews, pcgamer, gamingonlinux; sportschau, kicker; zdfheute „Stars und Promis“, klatsch-tratsch.de; news.blizzard.com, zockify.com/forever, Wowhead Blue Tracker.

## Regeln
- Nur Dinge schreiben, die eine Quelle belegt. Jeder Artikel nennt mindestens eine Quelle mit Link.
- Widersprechen sich Quellen (z. B. Spielergebnisse), nur die übereinstimmenden Angaben nehmen.
- Gerüchte und Fan-Seiten klar als solche kennzeichnen.
- Je Zeitung 1 Aufmacher, 3 bis 5 Rubriken mit je 1 bis 4 Artikeln. Artikel 2 bis 4 Sätze, Aufmacher bis zu 2 Absätze.
- Bei Mama: keine Gewaltverbrechen oder belastende Nachrichten als Aufmacher; schwere Themen nur kurz und behutsam.
- `zumSchluss`: Bei Mama eine kleine, selbst geschriebene Geschichte oder etwas Schönes; bei Tim ein Tipp oder eine Kuriosität; bei WoW ein Tipp des Tages.
- Ist für ein Thema nichts Neues da, lieber die Rubrik weglassen als etwas Altes aufwärmen.

## Dateiformat
```json
{
  "gruss": "Guten Morgen, …",
  "aufmacher": { "rubrik": "…", "titel": "…", "text": "Absatz 1\n\nAbsatz 2", "quellen": [{ "name": "…", "url": "https://…" }] },
  "rubriken": [
    { "name": "…", "artikel": [ { "titel": "…", "text": "…", "quellen": [{ "name": "…", "url": "https://…" }] } ] }
  ],
  "zumSchluss": { "titel": "…", "text": "…" }
}
```
`index.json`: `{ "ausgaben": ["2026-11-10", "2026-11-09"] }`. Ausgaben, die älter als 60 Tage sind, aus der Liste und dem Ordner löschen.

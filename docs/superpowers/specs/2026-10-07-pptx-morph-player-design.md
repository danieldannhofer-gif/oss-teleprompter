# PPTX-Morph-Player – Design

Datum: 2026-10-07 · Status: freigegeben, Stufe 1 umgesetzt (`player/player.html`)

## Ziel

Eigene, mit morphkit erzeugte `.pptx`-Decks auf einem Gerät ohne Microsoft-Abo präsentieren,
inklusive echter Morph-Übergänge. Kein Anspruch auf beliebige PPTX-Dateien (siehe Nicht-Ziele).

## Entscheidungen (mit Daniel abgestimmt)

- Umfang: nur eigene Decks (morphkit-Struktur), später ggf. erweiterbar.
- Form: eine einzelne `player.html`, offline im Browser, `.pptx` per Drag & Drop laden.
- Referenzdeck für Stufe 1: `Downloads/Erfahrung_plus_KI_Keynote_4.pptx`
  (42 Slides, 21 Medien, 7,8 MB). Zweitdeck als Gegenprobe: `Kickoff_Fragestunde_FOM2026.pptx`.

## Was die Referenzdecks verlangen (aus dem XML gemessen)

- Objekte tragen `!!Namen`; gleiche Namen auf Folgeslides sind die Morph-Paare.
- Morph-Option überall `byObject`, Dauer im Attribut `p14:dur` (z. B. 900 ms).
- Formen: `rect`, `roundRect`, `ellipse`. Keine Custom-Geometrie, Tabellen oder Diagramme.
- Gruppen (`p:grpSp`), Bilder mit Zuschnitt (`a:srcRect`) und `alphaModFix`, Verläufe (`a:gradFill`).
- Effekte: `outerShdw` (Schatten) und `softEdge` (weiche Kanten).
- Schriften: Aptos / Aptos Display. Beides ist ohne Microsoft 365 nicht vorhanden.
- Genau ein `p:timing` im Deck (Slide 7). Vor dem Bau klären, was es steuert.
- XML ist UTF-8; der Loader muss explizit als UTF-8 lesen.

## Architektur

Fünf Bausteine in einer Datei, JSZip inline eingebettet.

1. **Loader** – entpackt die `.pptx`; liest Slide-Reihenfolge (`presentation.xml`), Beziehungen
   (`*.rels`), Medien als Blob-URLs.
2. **Parser** – Slide-XML zu Szenenmodell. Pro Actor: Name, Typ, Transform (Position, Größe,
   Drehung, Spiegelung), Gruppen-Eltern, Füllung (Farbe, Verlauf, Alpha), Linie, Schatten,
   weiche Kanten, Geometrie, Bildzuschnitt, Textläufe (Größe, Farbe, Fett, Ausrichtung, Spacing),
   Übergang (Typ, Option, Dauer, Auto-Advance), Hintergrund.
3. **Renderer** – Szenenmodell zu DOM. SVG für Formen, HTML für Text, `img` mit Zuschnitt für
   Bilder. 16:9-Bühne, skaliert aufs Fenster, Balken statt Verzerrung. EMU in Bühnenpixel.
4. **Morph-Engine** – paart Actors zwischen Slide N-1 und N über den Namen. Verbundene Objekte
   werden per Web Animations API von alt nach neu animiert (Position, Größe, Drehung, Farbe,
   Alpha, Zuschnitt, Schriftgröße), Easing ease-in-out, Dauer aus dem XML. Nicht verbundene
   Objekte blenden ein bzw. aus. Fade und Cut paaren nichts. Gruppen werden als ein Objekt
   bewegt, Kinder fahren mit.
5. **Player-UI** – Pfeiltasten, Klick, Leertaste, F für Vollbild, Esc, Foliennummer, Drop-Bereich.
   Ambient-Animationen starten nach dem Übergang von selbst.

## Umfang in Stufen

- **Stufe 1 (diese Spec):** alles oben Genannte, was die zwei Referenzdecks brauchen.
  Text-Morph zwischen Slides mit gleichem Actor-Namen als Überblendung des Textes plus
  Größen-/Positionsanimation der Box.
- **Stufe 2:** Glas/Frost, Knockout-Text, Custom-Geometrie, Ringsegmente, Ambient-Animationen
  (`anim=` aus morphkit).
- **Stufe 3:** `byWord` und `byChar` als echte Wort-/Zeichen-Animation.

## Nicht-Ziele

- Beliebige PPTX-Dateien aus anderen Quellen, Master-/Layout-Vererbung über das hinaus, was
  morphkit schreibt, Tabellen, Diagramme, SmartArt, Video, Audio, Redneransicht.
- Pixelgenaue Gleichheit mit PowerPoint. Ziel ist, dass Bewegung und Layout erkennbar stimmen.

## Fehlerverhalten

- Unbekanntes Element: überspringen und in der Konsole protokollieren, nie abstürzen.
- Fehlendes Medium: grauer Platzhalter (`#777`), Warnung in der Konsole.
- Slide mit Morph, aber ohne gleichnamige Partner: Überblendung.
- Schrift Aptos fehlt (auf diesem Gerät nicht vorhanden, geprüft): Fallback Segoe UI. Umbrüche können leicht abweichen (bekannte Grenze).

## Tests

- Automatisch: Parser-Tests gegen die beiden Referenzdecks (Anzahl Slides, Actor-Namen je Slide,
  Morph-Paare, Dauer, Transform-Werte einzelner Objekte).
- Visuell: Je Slide ein Screenshot im Ruhezustand, vom Menschen geprüft. Ein Vergleich mit LibreOffice-Renders entfällt, weil LibreOffice auf diesem Gerät nicht installiert ist.
- Morph: Zwischenbilder bei 0 %, 50 %, 100 % ausgewählter Übergänge (z. B. Slides 3-6 im Kickoff-Deck,
  Slides 22-28 im Keynote-Deck), per Hand geprüft.
- Abnahme: Daniel spielt das Keynote-Deck komplett durch.

## Offene Punkte

- ~~Was steuert das `p:timing` auf Slide 7?~~ Geklärt: lineare Bewegungspfade (`p:animMotion`, 16 s) der Bilderwall-Kacheln. Bereits in Stufe 1 umgesetzt, ebenso `softEdge` für Ellipsen (Maske).
- Bühnenskalierung bei Nicht-16:9-Fenstern: nur Balken, keine Option zum Strecken.

## Umsetzungsstand (2026-10-07)

- Tests in `player/test/`: `parser.py` (unabhängiges Python-Orakel gegen beide Referenzdecks), `behavior.py` (Tasten, Maus, schnelles Durchklicken, Skalierung), `morph.py` (Zwischenbilder), `sweep.py` (weitere Decks laden), `shots.py` (Screenshots).
- Beim Morph startet jedes Objekt dort, wo es gerade ist, auch wenn eine Ambient-Bewegung es verschoben hat (Slide 7 → 8, getestet nach 7 s Drift).
- Offen: Abnahme durch Daniel mit dem kompletten Keynote-Durchlauf, idealerweise auf dem Präsentationsrechner.

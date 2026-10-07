# Projekt: Our Digital Space

**Quelle:** Lovable-Projekt (bereits existierend, live abgefragt am 2026-09-11)

## Eckdaten

- **Name:** Our Digital Space
- **Zweck:** One-Page-Homepage für Daniel Dannhofer & Julia Pleyer als gemeinsame Marke "augmented work"
- **Lovable Project ID:** `d3c7c84b-bfb5-4964-8929-a21992646370`
- **Workspace ID:** `MJY68TsV862ToVvFeDdi` ("Daniel's Lovable")
- **Editor URL:** https://lovable.dev/projects/d3c7c84b-bfb5-4964-8929-a21992646370
- **Preview URL:** https://id-preview--d3c7c84b-bfb5-4964-8929-a21992646370.lovable.app
- **Tech-Stack:** TanStack Start (TypeScript), Tailwind v4, shadcn/ui
- **Status:** private, **noch nicht published**
- **Zielsetzung (vom Nutzer):** Soll die gemeinsame Webdomain für augmentedwork werden
- **Finale Domain (entschieden 2026-09-11): `www.augmentedwork.eu`**

## Design-Richtung

Aus 3 vorgeschlagenen Design-Directions gewählt: **"Warm workshop editorial"**

- Sensory Metaphor: "A well-lit workshop table where human craft and intelligent tools sit side by side"
- Energie: warm, confident, human-first — nicht tech-bro, nicht corporate-kalt
- Referenzen: Aesop, Dropbox Paper, IDEO Case-Studies, Monocle
- Nach Wahl der Richtung wurde das Farb-/Typo-System explizit aus der hochgeladenen Brand-Guideline-Datei übernommen (siehe [[brand]])

## Aktuelle Seitenstruktur (Stand: erste Iteration, Commit `31fe5b56`)

1. **Header** — Wortmarke "AUGMENTED—WORK" + "Practice · Vienna"
2. **Hero** — Werkbank-Foto, Zeile "A practice for people who work with their hands and their minds.", großer Serif-Headline "Augmented Work", CTA "Start a project"
3. **Practice (a)** — Statement zu Mensch+Tool, Portraits Daniel ("Strategy & systems") und Julia ("Design & craft")
4. **What we do (b)** — 3 Karten: Working system / Tool selection / Embedded practice
5. **Selected work (c)** — 2 Case-Studies + 1 Testimonial-Zitat
6. **Contact (d)** — Mailto-CTA, Standort "Vienna · by arrangement"

## Status 2026-09-11: Content-Überarbeitung abgeschlossen ✓

Lovable-Nachricht erfolgreich umgesetzt (Commit `3c9a5170b0cfedae37f61e2635d3a79a09ad6dbd`, 3 Credits):
- Seite komplett auf Deutsch (inkl. `lang="de"`, Meta-Tags, 404/Error-Seiten)
- "Selected work"-Sektion (Fake Case Studies + Testimonial) entfernt, Sektions-Labels neu durchnummeriert (a/b/c)
- KI-Portraits entfernt, ersetzt durch Serif-Initialen-Platzhalter ("DD" / "JP") in Paper-2-Boxen
- Rollen aktualisiert: Daniel = "AI Enablement Lead", Julia = "Leitung KI & Innovation, Marketing"
- Standort: "Wien" statt "Vienna"
- Kontakt-Mail: `hello@augmentedwork.eu`

Preview: https://id-preview--d3c7c84b-bfb5-4964-8929-a21992646370.lovable.app

**Noch offen:** echte Fotos von Daniel & Julia (siehe [[offene-fragen]] Punkt 4), Impressum-Unterseite (Punkt 7).

## Status 2026-09-16: Angebotsformate + erster Beleg ✓

Commits `ae207575` (Hauptänderung) und `d43c57e5` (Typo-Korrektur):
- **Sektion (b) umgebaut:** Überschrift "So arbeiten wir" → **"Wie wir kommen"**. Die drei Arbeitsweise-Karten (Working System / Tool-Auswahl / Mit am Tisch) ersetzt durch die drei **Angebotsformate**: Team-Workshop / Konferenz-Session / Keynote. Die herstellerneutrale Tool-Auswahl läuft jetzt inhaltlich im Team-Workshop-Text mit.
- **Erste echte Referenz auf der Seite:** Beleg-Zeile in Mono unter den Karten — "Zuletzt · TransformationCamp 2026" + Sessiontitel „KI-Agenten als neue Kolleg:innen“. Bewusst Mono statt Handschrift, weil die `hand-note` in (a) bereits die einzige erlaubte Caveat-Stelle belegt.
- **Julias Sektion** um ihre Lehraufträge ergänzt (FH Wien der WKW, Universität Krems, Leaders of AI). Daniels Sektion bewusst unverändert, beide bleiben minimal.

Entscheidungsgrundlage: [[offene-fragen]] Punkt 13 (Speaker Engagements, Markenzuordnung, Struktur von (b)).

**Noch offen dazu:** Freigabe zur Namensnennung von fifty1 (Punkt 13b) — erst danach kann fifty1 als Referenz dazukommen.

**Server-/Infrastruktur-Arbeiten (neuer Mautic-Container, Mandantentrennung, Domain-DNS-Setup für www.augmentedwork.eu) sind bewusst auf die nächste Session verschoben** — siehe [[mautic-setup-plan]].

## Wichtig: Platzhalter-Content, der vor Publish ersetzt werden muss

Der aktuelle Stand ist eine erste Lovable-Iteration mit **frei erfundenem Füll-Content**, nicht mit echten Daten:

- Case Studies "Kestrel Studio" und "Halver & Co." — **fiktiv**, keine echten Kunden
- Testimonial-Zitat von "Mara Lindqvist" — **fiktiv, erfunden**
- Portraits von Daniel und Julia (`daniel-portrait.jpg`, `julia-portrait.jpg`) — **KI-generiert**, keine echten Fotos
- Kontakt-Mail `hello@augmentedwork.studio` — abweichend von der in den Brand-Guidelines genannten Domain `augmentedwork.eu` (**zu klären**, siehe [[offene-fragen]])
- Standort "Vienna" — unbestätigt (**zu klären**)
- Gesamter Text ist auf **Englisch** — widerspricht der dokumentierten deutschen Voice in den Brand-Guidelines (siehe [[brand]] und [[offene-fragen]])

Siehe [[offene-fragen]] für alles, was vor einem Publish entschieden werden muss.

## Verlinkte Dateien

- [[brand]] — destilliertes Design-System aus den Brand-Guidelines
- [[menschen]] — Daniel & Julia, was über sie bekannt ist / fehlt
- [[offene-fragen]] — offene Entscheidungen vor Publish

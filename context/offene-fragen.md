# Offene Fragen — vor Publish zu klären

Diese Punkte sind **nicht** aus Guidelines oder Chatverlauf ableitbar. Nicht raten, bei Daniel/Julia erfragen.

## 1. Sprache — ENTSCHIEDEN 2026-09-11: Deutsch

Seite wird komplett auf Deutsch umgeschrieben, konsistent mit der Brand-Voice-Guideline (siehe [[brand]]).

## 2. Domain — ENTSCHIEDEN 2026-09-11

**Finale Domain: `www.augmentedwork.eu`**

- Deckt sich mit der Guideline (E-Mail-Signatur-Beispiel nutzte bereits `augmentedwork.eu`)
- Kontakt-Mail auf der aktuellen Lovable-Seite (`hello@augmentedwork.studio`) muss auf eine `@augmentedwork.eu`-Adresse geändert werden (z.B. `hello@augmentedwork.eu` oder `daniel@augmentedwork.eu`, siehe [[menschen]])
- Damit ist auch die Subdomain für die neue Mautic-Instanz festgelegt: `mautic.augmentedwork.eu` (siehe [[mautic-setup-plan]])

## 3. Platzhalter-Content — ENTSCHIEDEN 2026-09-11: Sektion entfernen

Die "Selected work"-Sektion mit den erfundenen Case Studies ("Kestrel Studio", "Halver & Co.") und dem erfundenen Testimonial ("Mara Lindqvist") wird komplett entfernt. Kein "Coming soon"-Platzhalter — einfach raus, bis es echte Referenzen gibt.

## 4. Portraits — ENTSCHIEDEN 2026-09-11: echte Fotos folgen

Die KI-generierten Platzhalter-Portraits werden entfernt/ersetzt. Daniel liefert echte Fotos von sich und Julia nach. Bis dahin: Platzhalter weglassen statt KI-Bilder zu behalten (Verstoß gegen die eigene Bildsprache-Regel, siehe [[brand]]).

## 5. Standort — ENTSCHIEDEN 2026-09-11: Wien ist korrekt

"Wien" als Standortangabe bleibt (auf Deutsch übersetzt, siehe Sprache oben).

## 6./Berufsbezeichnungen — ENTSCHIEDEN 2026-09-11

Die erfundenen Lovable-Rollen ("Strategy & systems" / "Design & craft") werden ersetzt durch die echten Berufsbezeichnungen:
- **Daniel Dannhofer:** AI Enablement Lead
- **Julia Pleyer:** Leitung KI & Innovation, Marketing (TOGETHER CCA)

## 7. Rechtliches — ENTSCHIEDEN 2026-09-11: Impressum einplanen

Impressum-Unterseite ist Pflichtbaustein (österreichische Impressumspflicht nach ECG/MedienG bei Sitz Wien, echte Namen + Kontaktdaten auf der Domain). Muss vor echtem Go-Live stehen, exakter Inhalt (Firmenname/-form, Adresse, UID falls vorhanden) noch mit Daniel/Julia zu klären — reine Umsetzung kann aber schon vorbereitet werden.

## 8. Second Brain

- Person-Nodes `person_daniel_dannhofer` und `person_julia_pleyer` wurden am 2026-09-11 angelegt/aktualisiert und verknüpft (KNOWS zueinander, FOUNDER_OF → Organisation Augmentedwork). Second Brain dient hier nur als Hintergrundwissen — primäre Quelle für dieses Projekt bleibt dieser `context/`-Ordner.
- Ein eigener Second-Brain-Node für das Projekt "Our Digital Space" selbst existiert noch nicht — bei Bedarf nachträglich anlegen.

## 9. Tracking mit Rybbit

- Nutzer will Analytics-Tracking über **Rybbit** (privacy-freundliche Alternative zu GA)
- MCP-Connector `claude_ai_Rybbit` ist verfügbar (authenticate/complete_authentication), aber noch nicht mit dem Lovable-Projekt verbunden
- **Zu klären:** Tracking-Snippet direkt ins TanStack-Start-Projekt einbauen, oder über Lovable-Connector-Mechanismus?

## 10. Kontaktformular → Mautic (neu) + Twenty (parallel)

**Entschieden 2026-09-11:**
- Twenty hat kein natives Formular-Feature. Statt eines Webhook-Umwegs: **neuer, separater Mautic-Container** nur für augmentedwork (getrennt von Daniels bestehender Mautic-Instanz auf dadavps, die für andere Kunden/RIB-Kontext läuft).
- **Architektur:** Kontaktformular auf der Website → Mautic-Formular fängt den Lead ab und pflegt ihn als Marketing-Kontakt (Segmente, Follow-up-Mails möglich, MCP-Tools `claude_ai_Mautic` bereits vorhanden: Contact_Create, Campaign_Contact_Add, Segment_Email_Send etc.) → qualifizierte Leads wandern zusätzlich/manuell nach **Twenty** als Sales-Pipeline. Mautic und Twenty laufen parallel, nicht als Ersatz füreinander.

**Noch offen — Infrastruktur-Setup:**
- Server/Docker-Compose-Setup für den neuen Mautic-Container auf dadavps (eigene Subdomain, DB, nginx-proxy-manager-Eintrag, SSL) — noch nicht umgesetzt
- Genauer Übergabepfad Mautic → Twenty (manuell? automatisiert via n8n als Brücke, sobald ein Lead in Mautic als "qualified" markiert wird?)
- Bestehende Mautic-Instanz auf dadavps läuft schon (Teil des Docker-Compose-Stacks neben Nextcloud, n8n, NocoDB) — neuer Container muss sauber danebengestellt werden, ohne den bestehenden Stack zu stören

## 11. Mandantentrennung: Kunden-Mautic vs. augmentedwork-Mautic

**Korrigiert 2026-09-11** (vorherige Fassung dieses Punkts ging fälschlich von einer Verlinkungs-Landingpage aus — das war eine Fehlinterpretation, verworfen).

Eigentliches Anliegen: Daniel betreibt bereits eine Mautic-Instanz für **Kundenprojekte** (z.B. fifty1/TOGETHER CCA-Kontext). Die neue augmentedwork-Mautic-Instanz (siehe [[mautic-setup-plan]]) soll davon **sauber getrennt** bleiben — kein gemeinsames Once-Login, keine gemischten Kontakt-Datenbanken, kein versehentliches Cross-Mailing zwischen Kundenlisten und der eigenen augmentedwork-Marke.

**Lösungsoptionen für saubere Trennung (Docker-Ebene):**
1. **Separate Container + separate DB je Instanz** (bereits im [[mautic-setup-plan]] so vorgesehen) — das ist die eigentliche Trennung. Zwei komplett unabhängige Mautic-Installationen, eigene Datenbank, eigene Subdomain, eigener Admin-Login. Kein gemeinsamer Zustand außer dem physischen Server.
2. **Eigenes Docker-Netzwerk pro Instanz** (statt beide im selben Compose-Netzwerk) — verhindert, dass Container versehentlich miteinander sprechen können, zusätzliche Isolationsebene über die DB-Trennung hinaus.
3. **Getrennte Volumes/Backups** — Backup-Jobs pro Instanz einzeln fahren, damit ein Restore nie Kundendaten mit augmentedwork-Daten vermischen kann.
4. Optional, falls noch mehr Isolation gewünscht: eigener System-User auf dadavps für den augmentedwork-Mautic-Container (Dateiberechtigungen getrennt) — meist Overkill bei Docker-Setups, da Container ohnehin isoliert laufen.

**Nicht empfohlen:** eine einzelne Mautic-Instanz mit mehreren "Companies"/Segmenten für Kunden vs. augmentedwork — Mautic trennt Kontakte darüber nicht wirklich hart (kein Mandantenfähigkeits-Feature wie ein echtes Multi-Tenant-System), das Risiko von Cross-Mailing bleibt bestehen.

→ Die im [[mautic-setup-plan]] beschriebene Lösung (separater Container, separate DB, eigene Subdomain) erfüllt die Trennungsanforderung bereits vollständig.

## 12. Docker-Übersicht auf dadavps

- Frage kam auf: gibt es ein Dashboard für die laufenden Docker-Container? Ja — Optionen wären **Portainer** (voll verwaltbares Web-UI: Start/Stop/Logs/Compose-Stacks) oder **Dozzle** (nur Log-Viewer, sehr leichtgewichtig).
- **Entscheidung 2026-09-11: jetzt nichts einrichten.** Bei Bedarf später per SSH/CLI direkt nachsehen, welche Container laufen (`docker ps`, `docker compose ls`).

## 13. Angebots-Struktur & Speaker Engagements (aufgeworfen 2026-09-16)

**Anlass:** Die Sektion (b) "What we do" beschreibt aktuell nur Team-Workshops. Tatsächlich gibt es mindestens drei Formate: Team-Workshops, Konferenz-Workshops/Sessions und Keynotes. Das ist eine strukturelle Lücke, kein fehlendes Testimonial.

### Inventar der Engagements (recherchiert im Second Brain, 2026-09-16)

**A — Belegbar, vergangen, öffentlich stattgefunden:**

- **TransformationCamp 2026** — Un-Conference für People & Culture/Change/Transformation, 16.–17. April 2026, FHWien der WKW, Motto "Bold Moves Only", veranstaltet von fifty1 GmbH.
  Session: *"KI-Agenten als neue Kolleg:innen: Wie Unternehmen mit AI-Mitarbeiter:innen die Arbeit neu denken"* — Daniel **und** Julia gemeinsam auf der Bühne.
  → Stärkster zitierbarer Beleg. Echtes Event, echter Sessiontitel, beide Namen, liegt in der Vergangenheit.
  Im Programm war Daniel als *"AI Excellence & Marketing, RIB Software"* gelistet — das ist die **Legitimation**, nicht der Auftraggeber (siehe 13a).

**B — Stattgefunden, Kundennennung noch nicht freigegeben:**

- **fifty1 GmbH** (Wien) — KI-Transformation/Enablement, Auftrag seit 29.07.2026, Workshops 14.08. und 04.09.2026 durchgeführt, erste Honorarnote über 5.000 EUR gestellt.
  **Abwicklung lief über Daniel privat** (eigene Honorarnote, Kleinunternehmerregelung § 6 Abs. 1 Z 27 UStG, eigene Bankverbindung) — Daniels erstes eigenes Consulting-Mandat, Nebentätigkeit außerhalb RIB Software. **Nicht** über TOGETHER CCA abgerechnet; TOGETHER CCA ist Julias Arbeitgeber, nicht der Auftragnehmer.
  → Damit das **direkteste augmented-work-Engagement überhaupt**: eigener Auftrag, eigene Rechnung, eigenes Mandat. Stärker als A in der Zuordnung, nur eben noch nicht öffentlich nennbar.
  ⚠️ Offen bleibt allein die **Kundenfreigabe**: darf fifty1 namentlich genannt werden? Siehe 13b.

**C — Geplant/eingereicht, NICHT als Referenz verwendbar:**

- **TU Wien Academy Short Courses** — 2-tägiges Seminar *"AI Adoption hands-on: Der Weg zum agentischen Arbeiten mit KI"*, Julia + Daniel als Co-Vortragende, Konzept V2 eingereicht an Barbara Orazume.
  Status: `planned`. Werkvertrag wird erst **vor** dem Seminar geschlossen, Durchführung Jänner–Juni 2027.
  ⚠️ **Nicht auf die Website.** Reichhaltigstes Material, aber noch nicht beauftragt — wäre eine Behauptung ohne Beleg.

**D — Julias eigene Credentials (aus der TU-Wien-Einreichung, von ihr selbst formuliert):**

- Langjährige Dozentin FH Wien der WKW
- Langjährige Dozentin bei Leaders of AI
- Dozentin Universität Krems (Digitalisierung & KI in der Versicherungsbranche)
- "Internationale Keynotes", maßgeschneiderte KI-Workshops
  → Verwendbar als **Bio-Credentials** in ihrer Personen-Sektion, nicht als augmented-work-Engagements.

### Daraus neu offene Fragen

**13a — Markenzuordnung — ENTSCHIEDEN 2026-09-16: die Personen tragen die Referenz**

Daniel & Julia standen dort **als Personen** auf der Bühne. Die Arbeitgeber (RIB Software, TOGETHER CCA) dienten nur als **Legitimation** — als Ausweis der Expertise, nicht als Auftraggeber, Auftragnehmer oder Urheber. Die Engagements gehören damit Daniel & Julia und dürfen unter augmented work geführt werden.

**Präzisierung 2026-09-16:** Das gilt erst recht für fifty1 — dieser Auftrag lief über Daniel **privat** (eigene Honorarnote als Kleinunternehmer), nicht über TOGETHER CCA. Formulierungen wie "unter dem Namen TOGETHER CCA" in [[menschen]] und [[projekt]] sind insofern irreführend und beschreiben nur Julias Arbeitgeberkontext, nicht die Abwicklung.

**Konsequenz für die Formulierung auf der Website:**
- Engagements in der **Ich-/Wir-Form** der Personen erzählen: "Wir haben beim TransformationCamp 2026 …", nicht "augmented work war Speaker bei …". Die Marke ist erst seit kurzem das Dach; die Erfahrung ist älter.
- Arbeitgeber **dürfen genannt werden, wo sie Glaubwürdigkeit stiften** (Rollenbezeichnungen in den Personen-Sektionen — stehen dort ohnehin schon), aber **nie so, dass ein Auftragsverhältnis zu augmented work suggeriert wird**.
- Keine Formulierung, die RIB oder TOGETHER CCA als Kunden von augmented work erscheinen lässt.
- Gilt sinngemäß auch für Julias Lehraufträge (Inventar D).

**13b — Freigabe fifty1:** Darf fifty1 GmbH namentlich als Kunde genannt werden? Das ist eine reine **Kundenfreigabe** — die Zuordnung ist mit 13a geklärt (Daniels eigenes Mandat, eigene Rechnung). Einzuholen, ggf. über Mirjam von Hofacker.
  Nebenbemerkung: fifty1 hat das TransformationCamp *veranstaltet* und ist *Kunde* — beides zusammen wäre eine starke Referenz, macht die Freigabe aber umso wichtiger.

**13c — Struktur von (b) — ENTSCHIEDEN 2026-09-16**

(b) zeigt künftig die drei **Angebotsformate** statt der Arbeitsweise-Karten:
- Überschrift: "Wie wir kommen" (statt "So arbeiten wir")
- Karten: **Team-Workshop / Konferenz-Session / Keynote** — ersetzen "Working System / Tool-Auswahl / Mit am Tisch" komplett
- Darunter eine **Beleg-Zeile in Mono** (nicht Handschrift): TransformationCamp 2026 + Sessiontitel
- Keine eigene Referenz-Sektion, keine Logo-Wand

**Warum Mono und nicht Caveat:** Die Handnotiz ist in (a) bereits vergeben ("So arbeiten wir."), Guideline erlaubt max. 1× pro Seite. Mono ist laut Guideline die Schrift für Metadaten/Labels — passt für eine Event-Angabe.

**Tool-Auswahl** (vendor-neutral, laut [[brand]] ein Kernthema) entfällt als eigene Karte und muss inhaltlich im Team-Workshop-Text mitlaufen.

**13d — Personen-Sektionen — ENTSCHIEDEN 2026-09-16:** Beide minimal halten, symmetrisch. Julia bekommt ihre Lehraufträge (FH Wien der WKW, Universität Krems, Leaders of AI) als Bio-Credentials unter der Rolle. Kein Zitat, bei keinem von beiden. Daniels Sektion bleibt unverändert.

## Verlinkte Dateien

- [[projekt]]
- [[brand]]
- [[menschen]]
- [[mautic-setup-plan]] — konkrete Schritte für den neuen Mautic-Container (noch nicht umgesetzt)

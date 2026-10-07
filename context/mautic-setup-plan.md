# Setup-Plan: Neuer Mautic-Container für augmentedwork

**Status:** noch nicht umgesetzt — reine Planung (Entscheidung 2026-09-11, siehe [[offene-fragen]])

## Ziel
Ein separater, eigenständiger Mautic-Container auf dadavps, ausschließlich für augmentedwork (getrennt von Daniels bestehender Mautic-Instanz für andere Kunden/RIB-Kontext). Fängt das Kontaktformular von "Our Digital Space" ab, pflegt Leads als Marketing-Kontakte. Qualifizierte Leads wandern zusätzlich/manuell nach Twenty (Sales-Pipeline).

## Bekannter Ist-Zustand auf dadavps
- Docker Compose-Stack, alle Services als Container auf gemeinsamem Netzwerk
- nginx-proxy-manager übernimmt SSL-Terminierung + host-basiertes Routing
- Bereits laufend: Nextcloud, n8n, NocoDB, Second-Brain-HelixDB-Server, **eine bestehende Mautic-Instanz**
- MySQL-Historie: mind. ein Upgrade 8.0 → 8.4 bereits durchgeführt

## Setup-Schritte (Entwurf, vor Ausführung verifizieren)
1. **SSH-Zugang zu dadavps** sicherstellen
2. Bestehenden Docker-Compose-Stack sichten (`docker compose ls`, vorhandene `.env`/`docker-compose.yml`-Struktur) — insbesondere prüfen, wie die bestehende Mautic-Instanz konfiguriert ist, um Namenskonflikte (Container-Namen, Ports, Volumes) zu vermeiden
3. Neuen Mautic-Service in eigenem Compose-Block definieren:
   - eigener Container-Name (z.B. `mautic-augmentedwork`)
   - eigene MySQL/MariaDB-Datenbank (eigenes Volume, nicht die der bestehenden Instanz mitnutzen)
   - eigenes Docker-Volume für Mautic-Daten/Uploads
4. **Subdomain festlegen** — Vorschlag: `mautic.augmentedwork.eu` (abhängig von der noch offenen Domain-Entscheidung, siehe [[offene-fragen]] Punkt 2)
5. DNS-Eintrag für die Subdomain auf dadavps' IP setzen
6. nginx-proxy-manager: neuen Proxy-Host für die Subdomain anlegen, SSL-Zertifikat (Let's Encrypt) ausstellen lassen
7. Mautic-Erstinstallation durchlaufen (Admin-Account, Cron-Jobs für Mautic einrichten — Segment-Updates, Kampagnen-Trigger, E-Mail-Queue)
8. Formular in Mautic anlegen (Felder passend zum Kontaktformular auf der Website), Embed-Code oder API-Endpunkt für Lovable/TanStack-Start-Seite generieren
9. Website-seitige Integration: Kontaktformular auf "Our Digital Space" postet an das Mautic-Formular (per Mautic JS-Embed oder direktem API-Call)
10. **Übergabepfad Mautic → Twenty klären und bauen** (noch offene Design-Frage, siehe [[offene-fragen]]):
    - Option A: manuell (Daniel/Julia sichten Mautic-Leads, tragen qualifizierte manuell in Twenty ein)
    - Option B: automatisiert via n8n — Trigger wenn Mautic-Kontakt ein bestimmtes Segment/Tag erreicht → n8n-Workflow legt Kontakt in Twenty an (Twenty-API)
11. Ressourcen-Check auf dadavps (RAM/Disk) vor dem Hochfahren des neuen Containers, damit der bestehende Stack nicht beeinträchtigt wird

## Offene Vorfragen, bevor Schritt 1 startet
- Finale Domain für augmentedwork (siehe [[offene-fragen]] Punkt 2) — bestimmt die Subdomain in Schritt 4
- Rybbit-Tracking-Einbindung (siehe [[offene-fragen]] Punkt 9) kann unabhängig davon parallel erfolgen
- Genaue URL/Subdomain der bestehenden Mautic-Instanz ermitteln (wird für die `marketing.augmentedwork.eu`-Landingpage gebraucht, siehe [[offene-fragen]] Punkt 11)

## Nachgelagert: marketing.augmentedwork.eu
Sobald diese neue Instanz läuft, bekommt sie einen Link auf einer kleinen Landingpage unter `marketing.augmentedwork.eu`, gemeinsam mit einem Link zur bestehenden Mautic-Instanz. Siehe [[offene-fragen]] Punkt 11 für Details — das ist ein separater, kleiner Schritt nach diesem Setup, kein Teil davon.

## Verlinkte Dateien
- [[projekt]]
- [[offene-fragen]]

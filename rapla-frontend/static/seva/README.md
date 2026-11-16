# SEVA-K Aufgaben

## Teamfreigabe (lokaler Entwurf, 13.10.2026)

Ein zweiter Link `/seva/?team=<Listeninhaber-ID>` und E-Mail-Freigaben sind im Code vorbereitet. Der bestehende Zugang aus dem Tagesplaner bleibt bestehen. `team-schema.sql` ist **nicht** in der produktiven Datenbank ausgeführt, und die Freigabeverwaltung bleibt in der Oberfläche verborgen. Teammitglieder können derzeit noch nicht auf denselben Bestand zugreifen.

Grund: Die alte Tabelle `user_planner_data` im selben Supabase-Projekt hat live eine offene Policy für anonyme und angemeldete Zugriffe. Vor der Zusage, dass Teammitglieder nur die SEVA-K Liste erreichen, muss der Planer-Abgleich auf kontogebundene Rechte umgestellt oder die Teamliste in getrennte Datenhaltung verlegt werden. Die Entscheidung des Nutzers steht aus. Die Team-Modultests sind lokal bestanden; ein echter Test mit verschiedenen E-Mail-Konten steht noch aus.

Eigenständige Aufgabenliste unter `/seva/` sowie als Dialog im Tagesplaner. Die bestehende Sevaka-Routine bleibt bestehen. Neue Zugänge liegen ausschließlich in SEVA-Zeitblöcken und in deren Routine.

## Stand

- Schnellerfassung, Bearbeitung, Status, Frist mit optionaler Uhrzeit, Wiedervorlage, Wichtigkeit, Seminarbezug, Notizen und Voraussetzung. Ohne Uhrzeit gilt die Frist bis zum Tagesende.
- Offene Aufgaben erscheinen bei weniger als 48 Stunden Restzeit automatisch oben in „Heute“ (überfällige bis zur Erledigung). Die automatische Anzeige wird aus der Frist berechnet und benötigt keine zusätzliche Synchronisierung; Noch nicht eingeordnete Fristaufgaben stehen zunächst oben. Alle Heute-Aufgaben lassen sich gemeinsam per Pfeilen oder Ziehen priorisieren; dabei erhält die gesamte sichtbare Liste eine gespeicherte Reihenfolge. Eingeordnete Aufgaben bleiben auch nach einer Friständerung ausgewählt, bis sie aus Heute genommen werden. Automatische Einträge lassen sich durch Erledigen oder Ändern/Entfernen der Frist aus der Ansicht nehmen.
- Regelbasierte Priorisierung mit Begründung; Neubewertung bei Änderung und alle 60 Sekunden bei sichtbarer Seite.
- Wissensnotizen und Verknüpfungen über dieselbe Seminarbezeichnung. Keine semantische KI-Auswertung und keine automatische Chat-Anbindung. Texte aus dem Chat können manuell als Wissen übernommen werden.
- Separater Papierkorb mit Wiederherstellung; Export/Import nur des SEVA-Bestands.
- Eigene installierbare PWA für iPhone (Safari → Teilen → Zum Home-Bildschirm); eingeschränkte Hintergrundausführung unter iOS. Keine dauerhafte Hintergrundsynchronisierung zugesagt.
- Authentifizierter Cloud-Abgleich alle 3 Sekunden bei sichtbarer Seite, sofort nach Änderungen, beim manuellen Abgleichen, bei Wiederverbindung und beim Öffnen/Fokussieren. Unveränderte Listen werden nicht neu gerendert; laufende Abfragen überlappen nicht. RLS trennt Konten. Lokale Aufgaben werden nur nach ausdrücklicher Übernahme in ein Konto übertragen.

## Datenhaltung

`zeitflow_seva_v1:<account>:op:<uuid>` enthält unveränderliche Feldänderungen. Einträge werden nach logischer Zeit und UUID deterministisch zusammengeführt. Verschiedene Felder bleiben bei parallelen Änderungen erhalten. Dasselbe Feld folgt der zuletzt einsortierten Änderung; keine interaktive Konfliktauflösung. Extrem falsch gestellte Geräteuhren können diese Reihenfolge beeinflussen.

Die neue Tabelle `public.seva_task_operations` liegt im vom Nutzer bestätigten Supabase-Projekt `Erfolgsplaner` (`oaxybpujrapbebstjxxr`). Sie wurde am 04.10.2026 mit der Migration `seva_private_task_operations` angelegt. `database-schema.sql` dokumentiert die ausgeführte Migration; nicht ungeprüft erneut ausführen.

Es gibt nur SELECT/INSERT für den angemeldeten Eigentümer, keine anonymen Datenrechte und kein clientseitiges UPDATE/DELETE. Löschen und Wiederherstellen sind eigene Änderungen. Der bestehende Inhalt von `user_planner_data` und dessen Konfiguration wurden nicht verändert. Die Cloud enthält keine Testaufgaben; SQL-Testdaten wurden zurückgerollt.

Die veröffentlichbare Client-Konfiguration steht in `config.js`. Sie enthält keine geheimen Schlüssel. Die separat eingebundene Supabase-Bibliothek ist auf Version 2.117.2 festgelegt und inklusive Lizenz lokal mitgeliefert, damit die App ohne CDN starten kann. Die alte Haupt-App verwendet weiterhin ihre bisherige SDK-Einbindung.

## Veröffentlichung und echter Geräteabgleich

Am 06.10.2026 wurde die veröffentlichte App unter https://tagesplaner-psi.vercel.app/seva/ im Browser geprüft. Lokaler main und origin/main stehen auf Commit `b861224`.

1. Supabase Auth Site URL und erlaubter Redirect wurden auf `https://tagesplaner-psi.vercel.app/seva/` gesetzt und im Dashboard bestätigt. Zuvor stand die Site URL auf localhost und es gab keine erlaubten Redirects.
2. Die erste E-Mail-Link-Anfrage (`signInWithOtp`) erfolgte irrtümlich über zeitflow-planner. Nach Nutzerkorrektur wurden Site URL und erlaubter Redirect für den produktiven Tagesplaner bestätigt. Der alte Redirect bleibt vorerst zusätzlich vorhanden. Nächsten Link direkt von der richtigen Tagesplaner-Adresse anfordern. Anmeldung und E-Mail-Eingang sind noch nicht bestätigt.

Vercel-Projekt ist ausdrücklich `tagesplaner`. `.vercel/project.json` verweist noch auf das nicht genutzte `zeitflow-planner`; vor CLI-Veröffentlichungen zuerst die korrekte Projekt-ID ermitteln und neu verknüpfen.
3. Anschließend auf zwei Geräten mit derselben E-Mail anmelden, eine Aufgabe auf Gerät A erfassen, auf B erledigen und auf A wieder öffnen; danach Offline-Änderung und Wiederverbindung prüfen. Dieser Test mit echten Sessions steht noch aus.

Bei späteren Änderungen am App-Shell auch den Cache-Namen in `seva/sw.js` erhöhen. Neue Worker aktivieren sich nach vollständigem Laden des App-Caches automatisch. `app-updates.js` lädt bestehende Seiten nach einem Versionswechsel neu, sobald keine Bearbeitung, ungespeicherte Texteingabe oder Ziehgeste offen ist. Für bereits vor dieser Änderung geöffnete Seiten ist einmaliges Neuladen nötig. Bei offener Bearbeitung läuft deren bereits geladener Code bis zum Schließen weiter. Der Haupt-Service-Worker löscht ausschließlich seine eigenen Cache-Namen und überlässt `/seva/` dem separaten Worker.

## Prüfungen

`node tests/verify_seva.js` prüft Wiederöffnen, Papierkorb/Wiederherstellung, parallele Feldänderungen, Priorisierung, Abhängigkeiten und Kreiserkennung, Datumsvalidierung, Kontentrennung, Fehlerwiederholung und Offline-Änderungen mit simuliertem Cloud-Client. `node tests/verify_masterplan.js` schützt den bestehenden Masterplan.

Browserprüfung: Schnellerfassung, Bearbeiten/Frist/Wichtigkeit, Neuladen, Erledigen/Wiederöffnen, Papierkorb/Wiederherstellung, beide Einstiege in dieselbe Liste, iPhone-Breite 390px ohne horizontalen Überlauf und erneutes Öffnen/Erfassen nach Abschalten des lokalen Webservers bestanden. Dies ersetzt keinen Test auf einem physischen iPhone.

SQL-Prüfung: Eigener Zugriff erlaubt, fremder Zugriff und anonymer Zugriff verweigert; Tests liefen innerhalb einer zurückgerollten Transaktion. Der Security Advisor meldet keine neue Warnung für die SEVA-Tabelle. Bestehende Warnung zur alten Funktion `public.update_updated_at_column`: [Supabase-Linter 0011](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable).

## Grenzen / nächste Ausbauschritte

- KI-Anbindung und automatischer Chat-Zugang benötigen eine gezielt eingerichtete, authentifizierte Schnittstelle und ein Modell-/Kostenkonzept.
- Alle Operationen bleiben für sichere Zusammenführung erhalten. Für sehr große Bestände sind Komprimierung/Snapshots und ein inkrementeller Cloud-Download sinnvoll; aktuell werden alle Operationen paginiert gelesen.
- Lokale Browserdaten können durch Gerätereinigung gelöscht werden. Cloud-Anmeldung und regelmäßige Sicherungen verwenden. Ein nicht erfolgreicher Cloud-Abgleich wird sichtbar als ausstehend markiert.
- Die Hintergrundnotizen beeinflussen die Priorität nicht automatisch. Die jetzige Bewertung verwendet nur ausdrücklich strukturierte Angaben.

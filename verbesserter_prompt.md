Bitte wandle die folgenden ausgelesenen Daten der 'Sevafreie Zeit'-Excel-Tabelle in ein strukturiertes JSON-Format um, das direkt im 'sevafrei'-Kalender unseres Systems genutzt werden kann.

**Anforderungen:**

1. **Filterung:** Berücksichtige ausschließlich Sevakas (Team-Mitglieder), die bereits in unserem Rapla-System hinterlegt sind. Ignoriere externe oder unbekannte Personen.

2. **Datenstruktur (JSON):** Erstelle ein Array von Objekten mit folgenden Schlüsseln:
   - `teacherName` (String): Name des Sevakas.
   - `startDate` (String, Format 'YYYY-MM-DD'): Startdatum der Abwesenheit.
   - `endDate` (String, Format 'YYYY-MM-DD'): Enddatum der Abwesenheit (bei einzelnen Tagen gleich dem Startdatum).
   - `type` (String): Art der Abwesenheit (z.B. 'Sevafrei', 'Seminartage', 'Krank', 'Urlaub', 'Seva außer Haus').
   - `notes` (String, optional): Zusätzliche relevante Hinweise (z.B. 'Hauptsaison', 'Schließzeit', 'SonderSevafrei').

3. **Zusammenfassung:** Fasse direkt aufeinanderfolgende Tage mit demselben Abwesenheitstyp für dieselbe Person zu einem einzigen zusammenhängenden Zeitraum (Start- bis Enddatum) zusammen, anstatt jeden Tag einzeln aufzulisten.

4. **Fehlerbereinigung:** Ignoriere leere Zellen und redundante Formatierungsinformationen. Nutze die folgende Legende, um Kürzel korrekt als Typ zu übersetzen:
   - u = Sevafrei
   - s = Seminartage
   - f = frei
   - ü = Ausgleich f. Mehrarbeit
   - x = Sevafrei unbezahlt
   - z = SonderSevafrei
   - SL = Seminarleitung/Seva außer Haus
   - g = Geplante Sevafreie Zeit

5. **Ergänzungen:** Füge sinnvolle Hinweise in das `notes`-Feld ein, falls es zeitliche Überschneidungen mit wichtigen, globalen Ereignissen (wie z.B. 'Hauptsaison', 'Schließzeit' oder 'TdoT') gibt, um die Anschaulichkeit für die spätere Planung zu erhöhen.

Hier sind die Rohdaten:

[FÜGE HIER DIE ROHDATEN EIN]

# 🧘 4-Wöchige Yogalehrer-Ausbildung (YLA) – Backup & Archiv

In diesem Ordner sind alle bisher entwickelten Datenstrukturen, Komponenten und Logiken für die 4-wöchige Yogalehrerausbildung vollständig gesichert.

## Gesicherte Dateien:
1. `yla_curriculum.json`: Vollständiger, aus der Excel-Tabelle (`UplanNordseeJuni2026_nur_Unterrichtsplan.xlsx`) extrahierter und aufbereiteter 4-Wochen-Lehrplan mit allen Einheiten, Zeiten, Kategorien und Abkürzungslegenden.
2. `ylaData.ts`: TypeScript-Modul für Datenmodelle, Zuweisungs-Management (`localStorage`), Suchfunktionen, Lehrermetadaten, Konfliktprüfung mit dem regulären Wochenplan und Statistiken.
3. `YlaScheduleView.svelte`: Interaktive Svelte 5-Komponente mit Responsive Wochenplan-Grid, Mobile-Agenda-Ansicht, Detail-Modals, Lehrer-Zuweisung, Vollbildmodus, Suche & Filterung und Fortschritts-Statistiken.

## Reaktivierung / Einbindung zu einem späteren Zeitpunkt:
Falls das Thema wieder aktiviert werden soll:
1. `yla_curriculum.json` nach `rapla-frontend/src/lib/data/` kopieren.
2. `ylaData.ts` nach `rapla-frontend/src/lib/` kopieren.
3. `YlaScheduleView.svelte` nach `rapla-frontend/src/lib/components/` kopieren.
4. In den gewünschten Routen (z. B. `src/routes/wochenplan/+page.svelte` oder `src/routes/schedule/+page.svelte`) die Komponente einbinden.

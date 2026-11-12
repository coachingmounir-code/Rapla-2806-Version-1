export interface UpcomingSeminarItem {
  id: string;
  title: string;
  date: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  isWE: boolean;
  location: string;
  maxTN: number;
  currentTN: number;
  extraStat?: number; // 3rd value from "Max. / TN / ?"
  leader: string;
  isStrikethrough?: boolean;
  leaderPrefixBadge?: string;
  note?: string;
}

/**
 * Historical August – early November 2026 seminars (kept for archive completeness)
 * followed by the complete 76-entry Seminar- und Kursliste Nordsee (Okt. 2025 – März 2027).
 */
export const HISTORICAL_SUMMER_AUTUMN_2026_SEMINARS: UpcomingSeminarItem[] = [
  { id: 'hist-2026-08-09-1', title: 'Yoga Ferienwoche', date: '09.–14.08.2026', startDate: '2026-08-09', endDate: '2026-08-14', isWE: false, location: 'Nordsee', maxTN: 10, currentTN: 19, extraStat: 1, leader: 'Beate Menkarski' },
  { id: 'hist-2026-08-09-2', title: 'Insel-Yoga', date: '09.–14.08.2026', startDate: '2026-08-09', endDate: '2026-08-14', isWE: false, location: 'Nordsee', maxTN: 10, currentTN: 13, extraStat: 1, leader: 'Ananda Schaak' },
  { id: 'hist-2026-08-09-3', title: 'Yoga für Kinder 7-12 Jahre', date: '09.–14.08.2026', startDate: '2026-08-09', endDate: '2026-08-14', isWE: false, location: 'Nordsee', maxTN: 8, currentTN: 2, extraStat: 1, leader: 'Suniti Jacob' },
  { id: 'hist-2026-08-09-4', title: 'Yoga für den Rücken', date: '09.–14.08.2026', startDate: '2026-08-09', endDate: '2026-08-14', isWE: false, location: 'Nordsee', maxTN: 10, currentTN: 0, extraStat: 1, leader: 'Kamala Lubina' },
  { id: 'hist-2026-08-09-5', title: 'Yin Yoga', date: '09.–14.08.2026', startDate: '2026-08-09', endDate: '2026-08-14', isWE: false, location: 'Nordsee', maxTN: 15, currentTN: 8, extraStat: 1, leader: 'Cornelia Surya Haag' },
  { id: 'hist-2026-08-14-1', title: 'Die Satsang-Trommeln der Kirtan-Musik', date: '14.–16.08.2026', startDate: '2026-08-14', endDate: '2026-08-16', isWE: true, location: 'Nordsee', maxTN: 10, currentTN: 11, extraStat: 2, leader: 'Bernardo Juni' },
  { id: 'hist-2026-08-14-2', title: 'Vinyasa Power Yoga - Meditation in Bewegung', date: '14.–16.08.2026', startDate: '2026-08-14', endDate: '2026-08-16', isWE: true, location: 'Nordsee', maxTN: 10, currentTN: 8, extraStat: 1, leader: 'Kamala Lubina' },
  { id: 'hist-2026-08-14-3', title: 'Weg mit der Brille - Yoga für die Augen', date: '14.–16.08.2026', startDate: '2026-08-14', endDate: '2026-08-16', isWE: true, location: 'Nordsee', maxTN: 10, currentTN: 3, extraStat: 1, leader: 'Susan Holze' },
  { id: 'hist-2026-08-16-1', title: 'Yoga Ferienwoche', date: '16.–21.08.2026', startDate: '2026-08-16', endDate: '2026-08-21', isWE: false, location: 'Nordsee', maxTN: 10, currentTN: 7, extraStat: 1, leader: 'Ananda Schaak' },
  { id: 'hist-2026-08-16-2', title: 'Shakti Yoga - Erwecke die Kraft deiner Weiblichkeit', date: '16.–21.08.2026', startDate: '2026-08-16', endDate: '2026-08-21', isWE: false, location: 'Nordsee', maxTN: 10, currentTN: 7, extraStat: 1, leader: 'Susan Holze' },
  { id: 'hist-2026-08-16-3', title: 'Swings, Vibrations, Rotations', date: '16.–21.08.2026', startDate: '2026-08-16', endDate: '2026-08-21', isWE: false, location: 'Nordsee', maxTN: 10, currentTN: 5, extraStat: 1, leader: 'Monika Adele Camara' },
  { id: 'hist-2026-08-16-4', title: 'Yogaferien mit Surfen', date: '16.–21.08.2026', startDate: '2026-08-16', endDate: '2026-08-21', isWE: false, location: 'Nordsee', maxTN: 8, currentTN: 3, extraStat: 0, leader: 'Abha Morkötter' },
  { id: 'hist-2026-08-21-1', title: 'Yoga und Meditation Einführung', date: '21.–23.08.2026', startDate: '2026-08-21', endDate: '2026-08-23', isWE: true, location: 'Nordsee', maxTN: 10, currentTN: 4, extraStat: 1, leader: 'Jnanadev David Ianni' },
  { id: 'hist-2026-08-21-2', title: 'Hawaiianischer Tanz und Yoga am Meer', date: '21.–23.08.2026', startDate: '2026-08-21', endDate: '2026-08-23', isWE: true, location: 'Nordsee', maxTN: 10, currentTN: 4, extraStat: 1, leader: 'Monika Adele Camara' },
  { id: 'hist-2026-08-21-3', title: 'Yogatherapie für die Atemwege an der Nordsee', date: '21.–23.08.2026', startDate: '2026-08-21', endDate: '2026-08-23', isWE: true, location: 'Nordsee', maxTN: 10, currentTN: 1, extraStat: 1, leader: 'Susan Holze' },
  { id: 'hist-2026-08-23-1', title: 'Yoga Ferienwoche', date: '23.–28.08.2026', startDate: '2026-08-23', endDate: '2026-08-28', isWE: false, location: 'Nordsee', maxTN: 10, currentTN: 11, extraStat: 1, leader: 'Jnanadev David Ianni' },
  { id: 'hist-2026-08-23-2', title: 'Yoga rund um die Geburt - Yogalehrer Weiterbildung', date: '23.–30.08.2026', startDate: '2026-08-23', endDate: '2026-08-30', isWE: false, location: 'Nordsee', maxTN: 10, currentTN: 2, extraStat: 1, leader: 'Susan Holze' },
  { id: 'hist-2026-08-23-3', title: 'Schamanisches Kundalini Retreat', date: '23.–28.08.2026', startDate: '2026-08-23', endDate: '2026-08-28', isWE: false, location: 'Nordsee', maxTN: 10, currentTN: 19, extraStat: 2, leader: 'Satyadevi Bretz, Yogita Sari' },
  { id: 'hist-2026-08-23-4', title: 'Yoga, Wandern und Fahrradfahren', date: '23.–28.08.2026', startDate: '2026-08-23', endDate: '2026-08-28', isWE: false, location: 'Nordsee', maxTN: 10, currentTN: 4, extraStat: 1, leader: 'Ananda Schaak' },
  { id: 'hist-2026-08-28-1', title: 'Yoga und Meditation Einführung', date: '28.–30.08.2026', startDate: '2026-08-28', endDate: '2026-08-30', isWE: true, location: 'Nordsee', maxTN: 10, currentTN: 6, extraStat: 0, leader: '' },
  { id: 'hist-2026-08-28-2', title: 'Meditation und Qi Gong', date: '28.–30.08.2026', startDate: '2026-08-28', endDate: '2026-08-30', isWE: true, location: 'Nordsee', maxTN: 10, currentTN: 3, extraStat: 1, leader: 'Michael Büchel' },
  { id: 'hist-2026-08-30-1', title: 'Yoga Ferienwoche - Yin Yoga', date: '30.08.–04.09.2026', startDate: '2026-08-30', endDate: '2026-09-04', isWE: false, location: 'Nordsee', maxTN: 10, currentTN: 6, extraStat: 1, leader: 'Beate Menkarski' },
  { id: 'hist-2026-08-30-2', title: 'Themenwoche: Indische Rituale und Rezitationen mit Swami Nivedanananda', date: '30.08.–04.09.2026', startDate: '2026-08-30', endDate: '2026-09-04', isWE: false, location: 'Nordsee', maxTN: 10, currentTN: 0, extraStat: 2, leader: 'Swami Nivedanananda' },
  { id: 'hist-2026-08-30-3', title: 'Yogalehrer Ausbildung Intensivkurs Woche 1', date: '30.08.–04.09.2026', startDate: '2026-08-30', endDate: '2026-09-04', isWE: false, location: 'Nordsee', maxTN: 5, currentTN: 3, extraStat: 0, leader: 'Karuna M. Wapke' },
  { id: 'hist-2026-08-30-4', title: 'Yogalehrer Ausbildung Intensivkurs', date: '30.08.–27.09.2026', startDate: '2026-08-30', endDate: '2026-09-27', isWE: false, location: 'Nordsee', maxTN: 10, currentTN: 3, extraStat: 0, leader: 'Karuna M. Wapke' },
  { id: 'hist-2026-08-30-5', title: 'Yogalehrer Ausbildung Intensivkurs Woche 1+2', date: '30.08.–11.09.2026', startDate: '2026-08-30', endDate: '2026-09-11', isWE: false, location: 'Nordsee', maxTN: 10, currentTN: 4, extraStat: 0, leader: 'Karuna M. Wapke' },
  { id: 'hist-2026-09-04-1', title: 'Yoga und Meditation Einführung', date: '04.–06.09.2026', startDate: '2026-09-04', endDate: '2026-09-06', isWE: true, location: 'Nordsee', maxTN: 10, currentTN: 3, extraStat: 0, leader: '' },
  { id: 'hist-2026-09-04-2', title: 'Erleben mit dem Bauchraum', date: '04.–06.09.2026', startDate: '2026-09-04', endDate: '2026-09-06', isWE: true, location: 'Nordsee', maxTN: 10, currentTN: 1, extraStat: 1, leader: 'Erkan Batmaz' },
  { id: 'hist-2026-09-04-3', title: 'Krishna Jayanti', date: '04.09.2026', startDate: '2026-09-04', endDate: '2026-09-04', isWE: false, location: 'Nordsee', maxTN: 2, currentTN: 0, extraStat: 0, leader: '' },
  { id: 'hist-2026-09-04-4', title: 'Yogalehrer Ausbildung Intensivkurs Woche 2', date: '04.–11.09.2026', startDate: '2026-09-04', endDate: '2026-09-11', isWE: false, location: 'Nordsee', maxTN: 8, currentTN: 4, extraStat: 0, leader: 'Karuna M. Wapke' },
  { id: 'hist-2026-09-06-1', title: 'Yoga Ferienwoche', date: '06.–11.09.2026', startDate: '2026-09-06', endDate: '2026-09-11', isWE: false, location: 'Nordsee', maxTN: 10, currentTN: 5, extraStat: 1, leader: 'Erkan Batmaz' },
  { id: 'hist-2026-09-06-2', title: 'Insel-Yoga', date: '06.–11.09.2026', startDate: '2026-09-06', endDate: '2026-09-11', isWE: false, location: 'Nordsee', maxTN: 10, currentTN: 5, extraStat: 0, leader: 'Pranava Heinz Pauly' },
  { id: 'hist-2026-09-08-1', title: 'Sivanandas Geburtstag', date: '08.09.2026', startDate: '2026-09-08', endDate: '2026-09-08', isWE: false, location: 'Nordsee', maxTN: 0, currentTN: 0, extraStat: 1, leader: '' },
  { id: 'hist-2026-09-11-1', title: 'Harmonium Lernseminar', date: '11.–13.09.2026', startDate: '2026-09-11', endDate: '2026-09-13', isWE: true, location: 'Nordsee', maxTN: 10, currentTN: 5, extraStat: 1, leader: 'Jürgen Wade' },
  { id: 'hist-2026-09-11-2', title: 'Yogalehrer Ausbildung Intensivkurs Woche 3', date: '11.–18.09.2026', startDate: '2026-09-11', endDate: '2026-09-18', isWE: false, location: 'Nordsee', maxTN: 5, currentTN: 4, extraStat: 0, leader: 'Karuna M. Wapke' },
  { id: 'hist-2026-09-11-3', title: 'Yogalehrer Ausbildung Intensivkurs Woche 3+4', date: '11.–27.09.2026', startDate: '2026-09-11', endDate: '2026-09-27', isWE: false, location: 'Nordsee', maxTN: 10, currentTN: 6, extraStat: 0, leader: 'Karuna M. Wapke' },
  { id: 'hist-2026-09-13-1', title: 'Yoga Ferienwoche', date: '13.–18.09.2026', startDate: '2026-09-13', endDate: '2026-09-18', isWE: false, location: 'Nordsee', maxTN: 10, currentTN: 4, extraStat: 2, leader: 'Madhavi Füllen, Gopala Kirill Serov' },
  { id: 'hist-2026-09-13-2', title: 'Yoga, Wandern und Fahrradfahren', date: '13.–18.09.2026', startDate: '2026-09-13', endDate: '2026-09-18', isWE: false, location: 'Nordsee', maxTN: 10, currentTN: 5, extraStat: 0, leader: 'Pranava Heinz Pauly' },
  { id: 'hist-2026-09-18-1', title: 'Yoga und Meditation Einführung', date: '18.–20.09.2026', startDate: '2026-09-18', endDate: '2026-09-20', isWE: true, location: 'Nordsee', maxTN: 10, currentTN: 4, extraStat: 1, leader: 'Gopala Kirill Serov' },
  { id: 'hist-2026-09-18-2', title: 'Schamanismus als Medizin', date: '18.–20.09.2026', startDate: '2026-09-18', endDate: '2026-09-20', isWE: true, location: 'Nordsee', maxTN: 0, currentTN: 1, extraStat: 2, leader: 'Maharani Fritsch de Navarrete' },
  { id: 'hist-2026-09-18-3', title: 'Yogalehrer Ausbildung Intensivkurs Woche 4', date: '18.–27.09.2026', startDate: '2026-09-18', endDate: '2026-09-27', isWE: false, location: 'Nordsee', maxTN: 5, currentTN: 1, extraStat: 0, leader: 'Karuna M. Wapke' },
  { id: 'hist-2026-09-20-1', title: 'Yoga Ferienwoche', date: '20.–25.09.2026', startDate: '2026-09-20', endDate: '2026-09-25', isWE: false, location: 'Nordsee', maxTN: 10, currentTN: 1, extraStat: 1, leader: 'Chandradevi Winterhalter' },
  { id: 'hist-2026-09-24-1', title: 'Yoga und Meditation Einführung', date: '24.–26.09.2026', startDate: '2026-09-24', endDate: '2026-09-26', isWE: true, location: 'Nordsee', maxTN: 10, currentTN: 0, extraStat: 1, leader: '' },
  { id: 'hist-2026-09-25-1', title: 'Acro Yoga', date: '25.–27.09.2026', startDate: '2026-09-25', endDate: '2026-09-27', isWE: true, location: 'Nordsee', maxTN: 10, currentTN: 3, extraStat: 1, leader: 'Jnanadev Wallaschkowski' },
  { id: 'hist-2026-09-25-2', title: 'Freude im Herzen - Mantra Singen und Yoga', date: '25.–27.09.2026', startDate: '2026-09-25', endDate: '2026-09-27', isWE: true, location: 'Nordsee', maxTN: 10, currentTN: 0, extraStat: 2, leader: 'Gruppe Mudita' },
  { id: 'hist-2026-09-25-3', title: 'YLA Prüfungswochenende', date: '25.–27.09.2026', startDate: '2026-09-25', endDate: '2026-09-27', isWE: true, location: 'Nordsee', maxTN: 5, currentTN: 0, extraStat: 1, leader: 'Karuna M. Wapke' },
  { id: 'hist-2026-09-27-1', title: 'Ayurvedisches Fasten für Pitta und Vata', date: '27.09.–02.10.2026', startDate: '2026-09-27', endDate: '2026-10-02', isWE: false, location: 'Nordsee', maxTN: 10, currentTN: 6, extraStat: 3, leader: 'Satyananda Wahl, Aziza Lena Alemi' },
  { id: 'hist-2026-09-27-2', title: 'Yoga Ferienwoche', date: '27.09.–02.10.2026', startDate: '2026-09-27', endDate: '2026-10-02', isWE: false, location: 'Nordsee', maxTN: 10, currentTN: 1, extraStat: 1, leader: 'Gita Irene Hofmann' },
  { id: 'hist-2026-10-02-1', title: 'Ayur-Yoga-Therapie für Schultern und Nacken', date: '02.–04.10.2026', startDate: '2026-10-02', endDate: '2026-10-04', isWE: true, location: 'Nordsee', maxTN: 10, currentTN: 5, extraStat: 1, leader: 'Gita Irene Hofmann' },
  { id: 'hist-2026-10-02-2', title: 'Yoga und Meditation Einführung', date: '02.–04.10.2026', startDate: '2026-10-02', endDate: '2026-10-04', isWE: true, location: 'Nordsee', maxTN: 10, currentTN: 0, extraStat: 1, leader: 'Parashakti Küttner' },
  { id: 'hist-2026-10-02-3', title: 'Meditation Intensiv Schweigend', date: '02.–04.10.2026', startDate: '2026-10-02', endDate: '2026-10-04', isWE: true, location: 'Nordsee', maxTN: 20, currentTN: 24, extraStat: 0, leader: 'Karuna M. Wapke' },
  { id: 'hist-2026-10-04-1', title: 'Aufrichtung in der Asana erleben und verstehen', date: '04.–09.10.2026', startDate: '2026-10-04', endDate: '2026-10-09', isWE: false, location: 'Nordsee', maxTN: 10, currentTN: 6, extraStat: 1, leader: 'Gita Irene Hofmann' },
  { id: 'hist-2026-10-04-2', title: 'Wellnesswoche: Ayurveda, Massagen, Yoga & Medi(t)', date: '04.–09.10.2026', startDate: '2026-10-04', endDate: '2026-10-09', isWE: false, location: 'Nordsee', maxTN: 8, currentTN: 10, extraStat: 2, leader: 'Madhavi Veronika Broszinski, Venulo Bernd Broszinski' },
  { id: 'hist-2026-10-04-3', title: 'Yin Yoga Übungsleiter Ausbildung', date: '04.–16.10.2026', startDate: '2026-10-04', endDate: '2026-10-16', isWE: false, location: 'Nordsee', maxTN: 10, currentTN: 3, extraStat: 0, leader: '' },
  { id: 'hist-2026-10-09-1', title: 'Raja Yoga 2', date: '09.–11.10.2026', startDate: '2026-10-09', endDate: '2026-10-11', isWE: true, location: 'Nordsee', maxTN: 20, currentTN: 1, extraStat: 1, leader: 'Karuna M. Wapke, Sukadev Bretz' },
  { id: 'hist-2026-10-11-1', title: 'Yoga Ferienwoche', date: '11.–16.10.2026', startDate: '2026-10-11', endDate: '2026-10-16', isWE: false, location: 'Nordsee', maxTN: 10, currentTN: 3, extraStat: 0, leader: 'Shankara Stefan Maune' },
  { id: 'hist-2026-10-11-2', title: 'Navaratri', date: '11.–20.10.2026', startDate: '2026-10-11', endDate: '2026-10-20', isWE: false, location: 'Nordsee', maxTN: 2, currentTN: 0, extraStat: 0, leader: '' },
  { id: 'hist-2026-10-11-3', title: 'Stärke deine Weiblichkeit im Frauentempel', date: '11.–16.10.2026', startDate: '2026-10-11', endDate: '2026-10-16', isWE: false, location: 'Nordsee', maxTN: 10, currentTN: 0, extraStat: 1, leader: 'Rajeshwari Gemnich' },
  { id: 'hist-2026-10-16-1', title: 'Yoga und Meditation Einführung', date: '16.–18.10.2026', startDate: '2026-10-16', endDate: '2026-10-18', isWE: true, location: 'Nordsee', maxTN: 10, currentTN: 0, extraStat: 0, leader: 'Pranava Heinz Pauly' },
  { id: 'hist-2026-10-16-2', title: 'Jnana Yoga, Vedanta, Meditation und Schweigen', date: '16.–18.10.2026', startDate: '2026-10-16', endDate: '2026-10-18', isWE: true, location: 'Nordsee', maxTN: 20, currentTN: 0, extraStat: 0, leader: 'Karuna M. Wapke' },
  { id: 'hist-2026-10-16-3', title: 'Mantra-Begleitung mit Ukulele | Aufbauseminar', date: '16.–18.10.2026', startDate: '2026-10-16', endDate: '2026-10-18', isWE: true, location: 'Nordsee', maxTN: 10, currentTN: 2, extraStat: 1, leader: 'Shankari Susanne Hill' },
  { id: 'hist-2026-10-18-1', title: 'Yoga Ferienwoche', date: '18.–23.10.2026', startDate: '2026-10-18', endDate: '2026-10-23', isWE: false, location: 'Nordsee', maxTN: 10, currentTN: 6, extraStat: 0, leader: 'Erkan Batmaz' },
  { id: 'hist-2026-10-18-2', title: 'Nordsee Special: Yoga und Klangthemenwoche', date: '18.–23.10.2026', startDate: '2026-10-18', endDate: '2026-10-23', isWE: false, location: 'Nordsee', maxTN: 10, currentTN: 2, extraStat: 2, leader: 'Wolfgang Meisel, Jutta Kremer' },
  { id: 'hist-2026-10-18-3', title: 'Time out statt Burn out', date: '18.–23.10.2026', startDate: '2026-10-18', endDate: '2026-10-23', isWE: false, location: 'Nordsee', maxTN: 10, currentTN: 1, extraStat: 1, leader: 'Nicole Padmini Neumann' },
  { id: 'hist-2026-10-20-1', title: 'Vijaya Dashami', date: '20.10.2026', startDate: '2026-10-20', endDate: '2026-10-20', isWE: false, location: 'Nordsee', maxTN: 2, currentTN: 0, extraStat: 0, leader: '' },
  { id: 'hist-2026-10-24-1', title: 'Tag der offenen Tür - Haus Yoga Vidya Nordsee', date: '24.10.2026', startDate: '2026-10-24', endDate: '2026-10-24', isWE: true, location: 'Nordsee', maxTN: 20, currentTN: 4, extraStat: 11, leader: 'Karuna M. Wapke' },
  { id: 'hist-2026-10-25-1', title: 'Hatha Yoga Prävention Ferienwoche', date: '25.–30.10.2026', startDate: '2026-10-25', endDate: '2026-10-30', isWE: false, location: 'Nordsee', maxTN: 10, currentTN: 2, extraStat: 0, leader: 'Pranava Heinz Pauly' },
  { id: 'hist-2026-10-25-2', title: 'Yin Yoga meets Vipassana', date: '25.–30.10.2026', startDate: '2026-10-25', endDate: '2026-10-30', isWE: false, location: 'Nordsee', maxTN: 10, currentTN: 3, extraStat: 1, leader: 'Christian Bliedtner' },
  { id: 'hist-2026-10-30-1', title: 'Yoga und Meditation Einführung', date: '30.10.–01.11.2026', startDate: '2026-10-30', endDate: '2026-11-01', isWE: true, location: 'Nordsee', maxTN: 10, currentTN: 2, extraStat: 0, leader: 'Gopala Kirill Serov' },
  { id: 'hist-2026-11-01-1', title: 'Yoga Ferienwoche', date: '01.–06.11.2026', startDate: '2026-11-01', endDate: '2026-11-06', isWE: false, location: 'Nordsee', maxTN: 10, currentTN: 6, extraStat: 0, leader: 'Narayani Kedenburg' },
  { id: 'hist-2026-11-01-2', title: 'Ayurveda Wohlfühl-Retreat', date: '01.–06.11.2026', startDate: '2026-11-01', endDate: '2026-11-06', isWE: false, location: 'Nordsee', maxTN: 10, currentTN: 5, extraStat: 0, leader: 'Dr. phil. Marlene Vogel' },
  { id: 'hist-2026-11-01-3', title: 'Ganzheitliche Faceyoga Ausbildung', date: '01.–06.11.2026', startDate: '2026-11-01', endDate: '2026-11-06', isWE: false, location: 'Nordsee', maxTN: 10, currentTN: 4, extraStat: 0, leader: 'Charry Devi Ruiz' }
];

/**
 * Complete 76-entry Seminar- und Kursliste – Nordsee
 * Bild 1: Oktober 2025 bis Januar 2027 (36 entries)
 * Bild 2: Januar bis März 2027 (40 entries)
 */
export const NORDSEE_SEMINAR_LIST_2026_2027: UpcomingSeminarItem[] = [
  // --- BILD 1: Oktober 2025 bis Januar 2027 (36 Einträge) ---
  {
    id: 'ns-b1-01',
    title: 'Die 10-Wochenend-Weiterbildung für Yogalehrer',
    date: '10.10.2025–09.05.2027',
    startDate: '2025-10-10',
    endDate: '2027-05-09',
    isWE: false,
    location: 'Nordsee',
    maxTN: 0,
    currentTN: 0,
    extraStat: 0,
    leader: ''
  },
  {
    id: 'ns-b1-02',
    title: 'Die 10-Wochenend-Weiterbildung für Yogalehrer',
    date: '05.12.2025–10.10.2027',
    startDate: '2025-12-05',
    endDate: '2027-10-10',
    isWE: false,
    location: 'Nordsee',
    maxTN: 0,
    currentTN: 0,
    extraStat: 0,
    leader: ''
  },
  {
    id: 'ns-b1-03',
    title: 'Die 10-Wochenend-Weiterbildung für Yogalehrer',
    date: '09.10.2026–21.05.2028',
    startDate: '2026-10-09',
    endDate: '2028-05-21',
    isWE: false,
    location: 'Nordsee',
    maxTN: 0,
    currentTN: 0,
    extraStat: 0,
    leader: ''
  },
  {
    id: 'ns-b1-04',
    title: 'Yoga Ferienwoche',
    date: '08.–13.11.2026',
    startDate: '2026-11-08',
    endDate: '2026-11-13',
    isWE: false,
    location: 'Nordsee',
    maxTN: 10,
    currentTN: 5,
    extraStat: 2,
    leader: 'Erkan Batmaz'
  },
  {
    id: 'ns-b1-05',
    title: 'Pawanmuktasana – Bewegung, die befreit – Yogalehrer Weiterbildung',
    date: '08.–13.11.2026',
    startDate: '2026-11-08',
    endDate: '2026-11-13',
    isWE: false,
    location: 'Nordsee',
    maxTN: 10,
    currentTN: 3,
    extraStat: 3,
    leader: 'Parashakti Küttner'
  },
  {
    id: 'ns-b1-06',
    title: 'Yoga für Nacken, Rücken, Schulterverspannungen',
    date: '08.–13.11.2026',
    startDate: '2026-11-08',
    endDate: '2026-11-13',
    isWE: false,
    location: 'Nordsee',
    maxTN: 10,
    currentTN: 0,
    extraStat: 0,
    leader: 'Erkan Batmaz'
  },
  {
    id: 'ns-b1-07',
    title: 'Räkel Yoga',
    date: '13.–15.11.2026',
    startDate: '2026-11-13',
    endDate: '2026-11-15',
    isWE: true,
    location: 'Nordsee',
    maxTN: 10,
    currentTN: 19,
    extraStat: 1,
    leader: 'Erkan Batmaz'
  },
  {
    id: 'ns-b1-08',
    title: 'Spirituelles Life Management',
    date: '13.–15.11.2026',
    startDate: '2026-11-13',
    endDate: '2026-11-15',
    isWE: true,
    location: 'Nordsee',
    maxTN: 10,
    currentTN: 2,
    extraStat: 0,
    leader: 'Darshini Schwirz'
  },
  {
    id: 'ns-b1-09',
    title: '2-Jahres-Ausbildung',
    date: '13.–15.11.2026',
    startDate: '2026-11-13',
    endDate: '2026-11-15',
    isWE: true,
    location: 'Nordsee',
    maxTN: 20,
    currentTN: 20,
    extraStat: 0,
    leader: 'Karuna M. Wapke'
  },
  {
    id: 'ns-b1-10',
    title: 'Yoga Ferienwoche',
    date: '15.–20.11.2026',
    startDate: '2026-11-15',
    endDate: '2026-11-20',
    isWE: false,
    location: 'Nordsee',
    maxTN: 10,
    currentTN: 2,
    extraStat: 1,
    leader: 'Erkan Batmaz'
  },
  {
    id: 'ns-b1-11',
    title: 'Yoga Retreat – Weg zu deinem Herzen',
    date: '15.–20.11.2026',
    startDate: '2026-11-15',
    endDate: '2026-11-20',
    isWE: false,
    location: 'Nordsee',
    maxTN: 10,
    currentTN: 0,
    extraStat: 0,
    leader: 'Darshini Schwirz',
    isStrikethrough: true,
    note: 'Im Original durchgestrichen (ob Absage, nicht bestätigt)'
  },
  {
    id: 'ns-b1-12',
    title: 'Yoga und Meditation Einführung',
    date: '20.–22.11.2026',
    startDate: '2026-11-20',
    endDate: '2026-11-22',
    isWE: true,
    location: 'Nordsee',
    maxTN: 10,
    currentTN: 1,
    extraStat: 1,
    leader: 'Monika Adele Camara'
  },
  {
    id: 'ns-b1-13',
    title: 'Selbsthilfe-Praktiken für Schatten-Bewusstsein',
    date: '20.–22.11.2026',
    startDate: '2026-11-20',
    endDate: '2026-11-22',
    isWE: true,
    location: 'Nordsee',
    maxTN: 5,
    currentTN: 0,
    extraStat: 1,
    leader: 'Erkan Batmaz'
  },
  {
    id: 'ns-b1-14',
    title: 'Yoga und Pilates',
    date: '20.–22.11.2026',
    startDate: '2026-11-20',
    endDate: '2026-11-22',
    isWE: true,
    location: 'Nordsee',
    maxTN: 10,
    currentTN: 17,
    extraStat: 1,
    leader: 'Carina van Anken'
  },
  {
    id: 'ns-b1-15',
    title: 'Yoga Ferienwoche',
    date: '22.–27.11.2026',
    startDate: '2026-11-22',
    endDate: '2026-11-27',
    isWE: false,
    location: 'Nordsee',
    maxTN: 10,
    currentTN: 4,
    extraStat: 1,
    leader: 'Beate Menkarski'
  },
  {
    id: 'ns-b1-16',
    title: 'Schweigeretreat an der Nordsee',
    date: '22.–27.11.2026',
    startDate: '2026-11-22',
    endDate: '2026-11-27',
    isWE: false,
    location: 'Nordsee',
    maxTN: 10,
    currentTN: 3,
    extraStat: 0,
    leader: 'Pranava Heinz Pauly'
  },
  {
    id: 'ns-b1-17',
    title: 'Autogene Entspannung',
    date: '27.–29.11.2026',
    startDate: '2026-11-27',
    endDate: '2026-11-29',
    isWE: true,
    location: 'Nordsee',
    maxTN: 8,
    currentTN: 0,
    extraStat: 1,
    leader: 'Roswitha Breitkopf'
  },
  {
    id: 'ns-b1-18',
    title: 'Hatha Yoga, Entspannung und Stress Management – Yogalehrer Weiterbildung',
    date: '27.–29.11.2026',
    startDate: '2026-11-27',
    endDate: '2026-11-29',
    isWE: true,
    location: 'Nordsee',
    maxTN: 15,
    currentTN: 3,
    extraStat: 1,
    leader: 'Michael Büchel'
  },
  {
    id: 'ns-b1-19',
    title: 'Yin Yoga & Selbstakupressur',
    date: '27.–29.11.2026',
    startDate: '2026-11-27',
    endDate: '2026-11-29',
    isWE: true,
    location: 'Nordsee',
    maxTN: 10,
    currentTN: 3,
    extraStat: 2,
    leader: 'Maharani Schons'
  },
  {
    id: 'ns-b1-20',
    title: 'Yoga Ferienwoche',
    date: '29.11.–04.12.2026',
    startDate: '2026-11-29',
    endDate: '2026-12-04',
    isWE: false,
    location: 'Nordsee',
    maxTN: 10,
    currentTN: 2,
    extraStat: 0,
    leader: ''
  },
  {
    id: 'ns-b1-21',
    title: 'YinThai – Erfahre deine innere Stille',
    date: '29.11.–04.12.2026',
    startDate: '2026-11-29',
    endDate: '2026-12-04',
    isWE: false,
    location: 'Nordsee',
    maxTN: 10,
    currentTN: 0,
    extraStat: 2,
    leader: 'Cara Osterholzer'
  },
  {
    id: 'ns-b1-22',
    title: 'Yoga und Meditation Einführung',
    date: '04.–06.12.2026',
    startDate: '2026-12-04',
    endDate: '2026-12-06',
    isWE: true,
    location: 'Nordsee',
    maxTN: 10,
    currentTN: 0,
    extraStat: 0,
    leader: ''
  },
  {
    id: 'ns-b1-23',
    title: '2-Jahres-YLA Praktische Prüfung, Samyama, Wiederholung Sanskrit',
    date: '04.–06.12.2026',
    startDate: '2026-12-04',
    endDate: '2026-12-06',
    isWE: true,
    location: 'Nordsee',
    maxTN: 20,
    currentTN: 4,
    extraStat: 0,
    leader: ''
  },
  {
    id: 'ns-b1-24',
    title: 'Yoga für den Beckenboden',
    date: '04.–06.12.2026',
    startDate: '2026-12-04',
    endDate: '2026-12-06',
    isWE: true,
    location: 'Nordsee',
    maxTN: 10,
    currentTN: 2,
    extraStat: 1,
    leader: 'Parashakti Küttner'
  },
  {
    id: 'ns-b1-25',
    title: 'Asana Intensiv – sanftes Üben',
    date: '18.–20.12.2026',
    startDate: '2026-12-18',
    endDate: '2026-12-20',
    isWE: true,
    location: 'Nordsee',
    maxTN: 8,
    currentTN: 2,
    extraStat: 0,
    leader: 'Karuna M. Wapke'
  },
  {
    id: 'ns-b1-26',
    title: 'Yoga und Meditation Einführung',
    date: '18.–20.12.2026',
    startDate: '2026-12-18',
    endDate: '2026-12-20',
    isWE: true,
    location: 'Nordsee',
    maxTN: 10,
    currentTN: 0,
    extraStat: 0,
    leader: ''
  },
  {
    id: 'ns-b1-27',
    title: 'Yoga Ferienwoche',
    date: '20.–25.12.2026',
    startDate: '2026-12-20',
    endDate: '2026-12-25',
    isWE: false,
    location: 'Nordsee',
    maxTN: 10,
    currentTN: 2,
    extraStat: 0,
    leader: ''
  },
  {
    id: 'ns-b1-28',
    title: 'Yoga, Klangtherapie und Entspannung',
    date: '20.–25.12.2026',
    startDate: '2026-12-20',
    endDate: '2026-12-25',
    isWE: false,
    location: 'Nordsee',
    maxTN: 10,
    currentTN: 2,
    extraStat: 0,
    leader: 'Pranava Heinz Pauly'
  },
  {
    id: 'ns-b1-29',
    title: 'Weihnachten an der Nordsee',
    date: '24.–27.12.2026',
    startDate: '2026-12-24',
    endDate: '2026-12-27',
    isWE: true,
    location: 'Nordsee',
    maxTN: 8,
    currentTN: 8,
    extraStat: 0,
    leader: ''
  },
  {
    id: 'ns-b1-30',
    title: 'Yin Yoga',
    date: '25.–27.12.2026',
    startDate: '2026-12-25',
    endDate: '2026-12-27',
    isWE: true,
    location: 'Nordsee',
    maxTN: 10,
    currentTN: 1,
    extraStat: 1,
    leader: 'Annika Bosshammer'
  },
  {
    id: 'ns-b1-31',
    title: 'Afrikanischer Tanz und Yoga',
    date: '27.12.2026–01.01.2027',
    startDate: '2026-12-27',
    endDate: '2027-01-01',
    isWE: false,
    location: 'Nordsee',
    maxTN: 10,
    currentTN: 5,
    extraStat: 1,
    leader: 'Monika Adele Camara'
  },
  {
    id: 'ns-b1-32',
    title: 'Silvesterwoche mit Yoga, Pilates und mehr',
    date: '27.12.2026–01.01.2027',
    startDate: '2026-12-27',
    endDate: '2027-01-01',
    isWE: false,
    location: 'Nordsee',
    maxTN: 15,
    currentTN: 9,
    extraStat: 1,
    leader: 'Carina van Anken'
  },
  {
    id: 'ns-b1-33',
    title: 'Tauche ein in die Rauhnächte',
    date: '27.12.2026–01.01.2027',
    startDate: '2026-12-27',
    endDate: '2027-01-01',
    isWE: false,
    location: 'Nordsee',
    maxTN: 10,
    currentTN: 22,
    extraStat: 1,
    leader: 'Maharani Fritsch de Navarrete'
  },
  {
    id: 'ns-b1-34',
    title: 'Yoga und Meditation Einführung',
    date: '01.–03.01.2027',
    startDate: '2027-01-01',
    endDate: '2027-01-03',
    isWE: true,
    location: 'Nordsee',
    maxTN: 10,
    currentTN: 1,
    extraStat: 0,
    leader: 'Mounir Jaber'
  },
  {
    id: 'ns-b1-35',
    title: 'Tauche ein in die Rauhnächte',
    date: '01.–03.01.2027',
    startDate: '2027-01-01',
    endDate: '2027-01-03',
    isWE: true,
    location: 'Nordsee',
    maxTN: 10,
    currentTN: 18,
    extraStat: 1,
    leader: 'Maharani Fritsch de Navarrete'
  },
  {
    id: 'ns-b1-36',
    title: 'Yoga und Pilates',
    date: '01.–03.01.2027',
    startDate: '2027-01-01',
    endDate: '2027-01-03',
    isWE: true,
    location: 'Nordsee',
    maxTN: 10,
    currentTN: 3,
    extraStat: 1,
    leader: 'Carina van Anken'
  },

  // --- BILD 2: Januar bis März 2027 (40 Einträge) ---
  {
    id: 'ns-b2-01',
    title: 'Yoga Ferienwoche',
    date: '03.–08.01.2027',
    startDate: '2027-01-03',
    endDate: '2027-01-08',
    isWE: false,
    location: 'Nordsee',
    maxTN: 0,
    currentTN: 4,
    extraStat: 1,
    leader: 'Suniti Jacob'
  },
  {
    id: 'ns-b2-02',
    title: 'Yogische Rituale lernen',
    date: '03.–08.01.2027',
    startDate: '2027-01-03',
    endDate: '2027-01-08',
    isWE: false,
    location: 'Nordsee',
    maxTN: 10,
    currentTN: 0,
    extraStat: 0,
    leader: 'Nirmaya Fodor; Abha Morkötter; weiterer Eintrag „hu“ (unklar)',
    note: 'Hinter den beiden Namen im Original „SL: hu“ erkennbar (unklar/evtl. abgeschnitten)'
  },
  {
    id: 'ns-b2-03',
    title: 'Yoga und Meditation Einführung',
    date: '08.–10.01.2027',
    startDate: '2027-01-08',
    endDate: '2027-01-10',
    isWE: true,
    location: 'Nordsee',
    maxTN: 10,
    currentTN: 3,
    extraStat: 1,
    leader: 'Monika Adele Camara'
  },
  {
    id: 'ns-b2-04',
    title: '2-Jahres-Ausbildung – Theoretische Prüfung',
    date: '08.–10.01.2027',
    startDate: '2027-01-08',
    endDate: '2027-01-10',
    isWE: true,
    location: 'Nordsee',
    maxTN: 0,
    currentTN: 1,
    extraStat: 0,
    leader: 'Karuna M. Wapke'
  },
  {
    id: 'ns-b2-05',
    title: 'Feldenkrais und Chi Gong',
    date: '22.–24.01.2027',
    startDate: '2027-01-22',
    endDate: '2027-01-24',
    isWE: true,
    location: 'Nordsee',
    maxTN: 5,
    currentTN: 0,
    extraStat: 1,
    leader: 'Hagit Noam'
  },
  {
    id: 'ns-b2-06',
    title: 'Begegne dir „Selbst“ durch NeuroGraphik-Zeichnen',
    date: '22.–24.01.2027',
    startDate: '2027-01-22',
    endDate: '2027-01-24',
    isWE: true,
    location: 'Nordsee',
    maxTN: 0,
    currentTN: 0,
    extraStat: 1,
    leader: 'Premajyoti Schäfer'
  },
  {
    id: 'ns-b2-07',
    title: 'Body Voice Process',
    date: '24.–29.01.2027',
    startDate: '2027-01-24',
    endDate: '2027-01-29',
    isWE: false,
    location: 'Nordsee',
    maxTN: 10,
    currentTN: 0,
    extraStat: 1,
    leader: 'Hagit Noam'
  },
  {
    id: 'ns-b2-08',
    title: 'Erkenne dich selbst – das Yoga Sutra von Patanjali',
    date: '24.–29.01.2027',
    startDate: '2027-01-24',
    endDate: '2027-01-29',
    isWE: false,
    location: 'Nordsee',
    maxTN: 10,
    currentTN: 0,
    extraStat: 1,
    leader: 'Michael Büchel'
  },
  {
    id: 'ns-b2-09',
    title: 'Vipassana-Meditations-Schweigekurs',
    date: '24.–29.01.2027',
    startDate: '2027-01-24',
    endDate: '2027-01-29',
    isWE: false,
    location: 'Nordsee',
    maxTN: 10,
    currentTN: 0,
    extraStat: 1,
    leader: 'Jochen Kowalski'
  },
  {
    id: 'ns-b2-10',
    title: 'Autogene Entspannung',
    date: '29.–31.01.2027',
    startDate: '2027-01-29',
    endDate: '2027-01-31',
    isWE: true,
    location: 'Nordsee',
    maxTN: 10,
    currentTN: 0,
    extraStat: 1,
    leader: 'Roswitha Breitkopf'
  },
  {
    id: 'ns-b2-11',
    title: 'Business Yoga',
    date: '29.–31.01.2027',
    startDate: '2027-01-29',
    endDate: '2027-01-31',
    isWE: true,
    location: 'Nordsee',
    maxTN: 10,
    currentTN: 1,
    extraStat: 1,
    leader: 'Amyana Finkel'
  },
  {
    id: 'ns-b2-12',
    title: 'Raja Yoga 3',
    date: '29.–31.01.2027',
    startDate: '2027-01-29',
    endDate: '2027-01-31',
    isWE: true,
    location: 'Nordsee',
    maxTN: 30,
    currentTN: 1,
    extraStat: 0,
    leader: 'Karuna M. Wapke'
  },
  {
    id: 'ns-b2-13',
    title: 'Deep Yin Relax',
    date: '31.01.–05.02.2027',
    startDate: '2027-01-31',
    endDate: '2027-02-05',
    isWE: false,
    location: 'Nordsee',
    maxTN: 10,
    currentTN: 2,
    extraStat: 1,
    leader: 'Dr. phil. Marlene Vogel'
  },
  {
    id: 'ns-b2-14',
    title: 'Yoga Ferienwoche',
    date: '31.01.–05.02.2027',
    startDate: '2027-01-31',
    endDate: '2027-02-05',
    isWE: false,
    location: 'Nordsee',
    maxTN: 0,
    currentTN: 0,
    extraStat: 0,
    leader: ''
  },
  {
    id: 'ns-b2-15',
    title: 'Yoga und Meditation Einführung',
    date: '05.–07.02.2027',
    startDate: '2027-02-05',
    endDate: '2027-02-07',
    isWE: true,
    location: 'Nordsee',
    maxTN: 10,
    currentTN: 3,
    extraStat: 1,
    leader: 'Monika Adele Camara'
  },
  {
    id: 'ns-b2-16',
    title: 'Ayurveda-Wellness-Woche',
    date: '07.–12.02.2027',
    startDate: '2027-02-07',
    endDate: '2027-02-12',
    isWE: false,
    location: 'Nordsee',
    maxTN: 10,
    currentTN: 0,
    extraStat: 2,
    leader: 'Aziza Lena Wahl; Satyananda Wahl'
  },
  {
    id: 'ns-b2-17',
    title: 'Faszientraining mit Yoga',
    date: '07.–12.02.2027',
    startDate: '2027-02-07',
    endDate: '2027-02-12',
    isWE: false,
    location: 'Nordsee',
    maxTN: 10,
    currentTN: 0,
    extraStat: 0,
    leader: 'Bernhard Bansemer'
  },
  {
    id: 'ns-b2-18',
    title: 'Yoga Ferienwoche',
    date: '07.–12.02.2027',
    startDate: '2027-02-07',
    endDate: '2027-02-12',
    isWE: false,
    location: 'Nordsee',
    maxTN: 0,
    currentTN: 0,
    extraStat: 1,
    leader: 'Erkan Batmaz'
  },
  {
    id: 'ns-b2-19',
    title: 'Yoga und Meditation im Alltag',
    date: '07.–12.02.2027',
    startDate: '2027-02-07',
    endDate: '2027-02-12',
    isWE: false,
    location: 'Nordsee',
    maxTN: 8,
    currentTN: 0,
    extraStat: 1,
    leader: 'Dr. phil. Oliver Hahn'
  },
  {
    id: 'ns-b2-20',
    title: 'Yoga und Meditation Einführung',
    date: '12.–14.02.2027',
    startDate: '2027-02-12',
    endDate: '2027-02-14',
    isWE: true,
    location: 'Nordsee',
    maxTN: 10,
    currentTN: 0,
    extraStat: 0,
    leader: 'Erkan Batmaz'
  },
  {
    id: 'ns-b2-21',
    title: 'Harmonium Lernseminar',
    date: '12.–14.02.2027',
    startDate: '2027-02-12',
    endDate: '2027-02-14',
    isWE: true,
    location: 'Nordsee',
    maxTN: 10,
    currentTN: 1,
    extraStat: 1,
    leader: 'Annette Pritschow',
    leaderPrefixBadge: '12',
    note: 'Zusätzliche grüne „12“ vor der Seminarleitung im Original'
  },
  {
    id: 'ns-b2-22',
    title: 'Yogilates Ball',
    date: '12.–14.02.2027',
    startDate: '2027-02-12',
    endDate: '2027-02-14',
    isWE: true,
    location: 'Nordsee',
    maxTN: 10,
    currentTN: 0,
    extraStat: 1,
    leader: 'Carina van Anken'
  },
  {
    id: 'ns-b2-23',
    title: 'Yoga Ferienwoche',
    date: '14.–19.02.2027',
    startDate: '2027-02-14',
    endDate: '2027-02-19',
    isWE: false,
    location: 'Nordsee',
    maxTN: 0,
    currentTN: 0,
    extraStat: 0,
    leader: ''
  },
  {
    id: 'ns-b2-24',
    title: 'Yoga für die Wirbelsäule',
    date: '14.–19.02.2027',
    startDate: '2027-02-14',
    endDate: '2027-02-19',
    isWE: false,
    location: 'Nordsee',
    maxTN: 10,
    currentTN: 0,
    extraStat: 1,
    leader: 'Gita Irene Hofmann'
  },
  {
    id: 'ns-b2-25',
    title: 'Meditations- und Yoga-Retreat',
    date: '14.–19.02.2027',
    startDate: '2027-02-14',
    endDate: '2027-02-19',
    isWE: false,
    location: 'Nordsee',
    maxTN: 10,
    currentTN: 0,
    extraStat: 0,
    leader: 'Narayani Kedenburg'
  },
  {
    id: 'ns-b2-26',
    title: 'Chakra Intensiv – Eine Erfahrungsreise zu deinem Selbst',
    date: '20.–25.02.2027',
    startDate: '2027-02-20',
    endDate: '2027-02-25',
    isWE: true,
    location: 'Nordsee',
    maxTN: 10,
    currentTN: 0,
    extraStat: 0,
    leader: 'Narayana Pressl',
    note: 'Im Original mit 20.–25.02.2027 und WE angegeben'
  },
  {
    id: 'ns-b2-27',
    title: 'Tag der offenen Tür – Haus Yoga Vidya Nordsee',
    date: '20.02.2027',
    startDate: '2027-02-20',
    endDate: '2027-02-20',
    isWE: true,
    location: 'Nordsee',
    maxTN: 20,
    currentTN: 0,
    extraStat: 0,
    leader: ''
  },
  {
    id: 'ns-b2-28',
    title: 'Asana Exakt nach dem Spiralprinzip',
    date: '21.–26.02.2027',
    startDate: '2027-02-21',
    endDate: '2027-02-26',
    isWE: false,
    location: 'Nordsee',
    maxTN: 10,
    currentTN: 1,
    extraStat: 1,
    leader: 'Gita Irene Hofmann'
  },
  {
    id: 'ns-b2-29',
    title: 'Yoga Ferienwoche',
    date: '21.–26.02.2027',
    startDate: '2027-02-21',
    endDate: '2027-02-26',
    isWE: false,
    location: 'Nordsee',
    maxTN: 0,
    currentTN: 0,
    extraStat: 1,
    leader: 'Suniti Jacob'
  },
  {
    id: 'ns-b2-30',
    title: 'Einführung in die Welt der Chakras',
    date: '26.–28.02.2027',
    startDate: '2027-02-26',
    endDate: '2027-02-28',
    isWE: true,
    location: 'Nordsee',
    maxTN: 10,
    currentTN: 0,
    extraStat: 1,
    leader: 'Melanie Vogt'
  },
  {
    id: 'ns-b2-31',
    title: 'Yogalehrer Weiterbildung intensiv D1 – Raja Yoga',
    date: '26.02.–07.03.2027',
    startDate: '2027-02-26',
    endDate: '2027-03-07',
    isWE: false,
    location: 'Nordsee',
    maxTN: 10,
    currentTN: 3,
    extraStat: 2,
    leader: 'Jagadishvari Dörrer; Karuna M. Wapke'
  },
  {
    id: 'ns-b2-32',
    title: 'Bhakti, Yoga und Yeshua – die Einheit im Herzen finden',
    date: '26.–28.02.2027',
    startDate: '2027-02-26',
    endDate: '2027-02-28',
    isWE: true,
    location: 'Nordsee',
    maxTN: 8,
    currentTN: 0,
    extraStat: 1,
    leader: 'Pranavi Deventer'
  },
  {
    id: 'ns-b2-33',
    title: 'Yoga Ferienwoche',
    date: '28.02.–05.03.2027',
    startDate: '2027-02-28',
    endDate: '2027-03-05',
    isWE: false,
    location: 'Nordsee',
    maxTN: 10,
    currentTN: 0,
    extraStat: 0,
    leader: 'Gauri Blumenthal'
  },
  {
    id: 'ns-b2-34',
    title: 'Yoga Nidra – die Kunst der richtigen Entspannung',
    date: '05.–07.03.2027',
    startDate: '2027-03-05',
    endDate: '2027-03-07',
    isWE: true,
    location: 'Nordsee',
    maxTN: 10,
    currentTN: 0,
    extraStat: 1,
    leader: 'Michael Büchel'
  },
  {
    id: 'ns-b2-35',
    title: 'Meditationskursleiter Ausbildung Teil 1',
    date: '07.–14.03.2027',
    startDate: '2027-03-07',
    endDate: '2027-03-14',
    isWE: false,
    location: 'Nordsee',
    maxTN: 8,
    currentTN: 0,
    extraStat: 0,
    leader: 'Karuna M. Wapke'
  },
  {
    id: 'ns-b2-36',
    title: 'Meditationskursleiter-Ausbildung Kompakt Teil 1+2',
    date: '07.–19.03.2027',
    startDate: '2027-03-07',
    endDate: '2027-03-19',
    isWE: false,
    location: 'Nordsee',
    maxTN: 20,
    currentTN: 4,
    extraStat: 2,
    leader: 'Karuna M. Wapke'
  },
  {
    id: 'ns-b2-37',
    title: 'Indische Schriften und Philosophiesysteme',
    date: '12.–14.03.2027',
    startDate: '2027-03-12',
    endDate: '2027-03-14',
    isWE: true,
    location: 'Nordsee',
    maxTN: 30,
    currentTN: 4,
    extraStat: 0,
    leader: 'Karuna M. Wapke'
  },
  {
    id: 'ns-b2-38',
    title: 'Yin Yoga für mehr Entspannung & Leichtigkeit im Alltag',
    date: '12.–14.03.2027',
    startDate: '2027-03-12',
    endDate: '2027-03-14',
    isWE: true,
    location: 'Nordsee',
    maxTN: 10,
    currentTN: 2,
    extraStat: 1,
    leader: 'Maharani Schons'
  },
  {
    id: 'ns-b2-39',
    title: 'Meditation Intensiv Schweigend',
    date: '14.–19.03.2027',
    startDate: '2027-03-14',
    endDate: '2027-03-19',
    isWE: false,
    location: 'Nordsee',
    maxTN: 8,
    currentTN: 0,
    extraStat: 0,
    leader: 'Karuna M. Wapke'
  },
  {
    id: 'ns-b2-40',
    title: 'Yin Yoga im Schweigen',
    date: '14.–19.03.2027',
    startDate: '2027-03-14',
    endDate: '2027-03-19',
    isWE: false,
    location: 'Nordsee',
    maxTN: 8,
    currentTN: 2,
    extraStat: 0,
    leader: 'Abha Morkötter'
  }
];

export const ALL_NORDSEE_SEMINARS: UpcomingSeminarItem[] = [
  ...HISTORICAL_SUMMER_AUTUMN_2026_SEMINARS,
  ...NORDSEE_SEMINAR_LIST_2026_2027
];

export function getLocalTodayIso(refDate: Date = new Date()): string {
  const yyyy = refDate.getFullYear();
  const mm = String(refDate.getMonth() + 1).padStart(2, '0');
  const dd = String(refDate.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Returns true if the seminar has not ended yet (endDate >= todayIso).
 * Used in the "Kommende Seminare" tab to list all ongoing & future seminars.
 */
export function isSeminarUpcomingOrOngoing(seminar: UpcomingSeminarItem, todayIso: string): boolean {
  return seminar.endDate >= todayIso;
}

/**
 * Returns true if the seminar is about to start OR started today, and hides it
 * as soon as 1 calendar day has passed after its start date (todayIso > seminar.startDate).
 */
export function isSeminarWithinOneDayOfStart(seminar: UpcomingSeminarItem, todayIso: string): boolean {
  return seminar.startDate >= todayIso;
}

/**
 * Returns the next `limit` (default 8) seminars that will start (or started today).
 * Once 1 day has passed after a seminar's start date, it is automatically hidden
 * and the subsequent seminars move into the 8 visible slots.
 */
export function getNextStartingSeminars(
  todayIso: string,
  limit = 8,
  source: UpcomingSeminarItem[] = ALL_NORDSEE_SEMINARS
): UpcomingSeminarItem[] {
  return source
    .filter((s) => isSeminarWithinOneDayOfStart(s, todayIso))
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .slice(0, limit);
}

/**
 * Computes DST-safe calendar days between `todayIso` and `startDate` (0 = today, 1 = tomorrow, etc.).
 */
export function getDaysUntilSeminarStart(startDate: string, todayIso: string): number {
  const [sy, sm, sd] = startDate.split('-').map(Number);
  const [ty, tm, td] = todayIso.split('-').map(Number);
  if (!sy || !ty) return 0;
  const sNoon = new Date(sy, sm - 1, sd, 12, 0, 0).getTime();
  const tNoon = new Date(ty, tm - 1, td, 12, 0, 0).getTime();
  return Math.round((sNoon - tNoon) / 86400000);
}

/**
 * Resolves the Rapla week Monday Date (Friday-to-Thursday cycle) for any ISO date YYYY-MM-DD.
 */
export function getRaplaMondayForIsoDate(isoDate: string): Date | null {
  const [y, m, d] = (isoDate || '').split('-').map(Number);
  if (!y || !m || !d) return null;
  const dt = new Date(y, m - 1, d);
  const dow = dt.getDay();
  let daysToMonday = 0;
  if (dow === 5) daysToMonday = 3;      // Friday -> upcoming Monday
  else if (dow === 6) daysToMonday = 2; // Saturday -> upcoming Monday
  else if (dow === 0) daysToMonday = 1; // Sunday -> tomorrow Monday
  else if (dow === 1) daysToMonday = 0;
  else if (dow === 2) daysToMonday = -1;
  else if (dow === 3) daysToMonday = -2;
  else if (dow === 4) daysToMonday = -3;
  return new Date(y, m - 1, d + daysToMonday);
}

export function getIsoWeekNumberForRaplaDate(isoDate: string): number | null {
  const monday = getRaplaMondayForIsoDate(isoDate);
  if (!monday) return null;
  const utc = new Date(Date.UTC(monday.getFullYear(), monday.getMonth(), monday.getDate()));
  const dayNum = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  return Math.ceil((((utc.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

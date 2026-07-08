-- testdaten, laedt automatisch beim start

-- 2 standorte in unterschiedlichen staedten (wichtig fuer vertretung/verteilung
-- und damit im frontend klar erkennbar ist, welcher raum zu welchem studio gehoert)
INSERT INTO studio (id, name, adresse) VALUES
 (1, 'Studio Krefeld', 'Hauptstr. 12, 47798 Krefeld'),
 (2, 'Studio Duesseldorf', 'Bahnhofallee 45, 40210 Duesseldorf');

INSERT INTO raum (id, name, studio_id) VALUES
 (1, 'Raum A', 1),
 (2, 'Raum B', 1),
 (3, 'Raum 1', 2),
 (4, 'Raum 2', 2);

-- login jetzt per benutzername (nicht mehr email). pw weiterhin base64 "verschluesselt":
-- admin -> admin123 / alle trainer -> trainer123. status ist immer AKTIV, ausser ein
-- trainer meldet sich in der anwendung krank (wird dann automatisch auf KRANK gesetzt).
INSERT INTO mitarbeiter (id, vorname, nachname, benutzername, email, passwort, rolle, typ, max_kurse_pro_woche, studio_id, status) VALUES
 (1, 'Lisa', 'Fit', 'lisa.fit', 'lisa.fit@fitaktiv.de', 'YWRtaW4xMjM=', 'ADMIN', NULL, 0, NULL, 'AKTIV'),
 (2, 'Fabian', 'Nguyen', 'fabian.nguyen', 'fabian.nguyen@fitaktiv.de', 'dHJhaW5lcjEyMw==', 'TRAINER', 'VOLLZEIT', 20, 1, 'AKTIV'),
 (3, 'Ayse', 'Celik', 'ayse.celik', 'ayse.celik@fitaktiv.de', 'dHJhaW5lcjEyMw==', 'TRAINER', 'TEILZEIT', 10, 1, 'AKTIV'),
 (4, 'Niklas', 'Brandt', 'niklas.brandt', 'niklas.brandt@fitaktiv.de', 'dHJhaW5lcjEyMw==', 'TRAINER', 'VOLLZEIT', 20, 1, 'AKTIV'),
 (5, 'Marie', 'Feldmann', 'marie.feldmann', 'marie.feldmann@fitaktiv.de', 'dHJhaW5lcjEyMw==', 'TRAINER', 'VOLLZEIT', 20, 2, 'AKTIV'),
 (6, 'Tobias', 'Dreher', 'tobias.dreher', 'tobias.dreher@fitaktiv.de', 'dHJhaW5lcjEyMw==', 'TRAINER', 'TEILZEIT', 10, 2, 'AKTIV'),
 (7, 'Ines', 'Pawlak', 'ines.pawlak', 'ines.pawlak@fitaktiv.de', 'dHJhaW5lcjEyMw==', 'TRAINER', 'VOLLZEIT', 20, 2, 'AKTIV'),
 (8, 'Sophie', 'Bauer', 'sophie.bauer', 'sophie.bauer@fitaktiv.de', 'dHJhaW5lcjEyMw==', 'TRAINER', 'TEILZEIT', 10, 1, 'AKTIV'),
 (9, 'David', 'Krueger', 'david.krueger', 'david.krueger@fitaktiv.de', 'dHJhaW5lcjEyMw==', 'TRAINER', 'VOLLZEIT', 20, 2, 'AKTIV');

INSERT INTO mitglied (id, vorname, nachname, email) VALUES
 (1, 'Anna', 'Weber', 'anna.weber@mail.de'),
 (2, 'Tom', 'Fischer', 'tom.fischer@mail.de'),
 (3, 'Lea', 'Hoffmann', 'lea.hoffmann@mail.de');

-- zwei davon ohne trainer_id, damit "automatisch verteilen" im admin-bereich
-- sich sinnvoll testen laesst.
INSERT INTO kurs (id, name, wochentag, startzeit, dauer_minuten, trainer_id, vertretung_trainer_id, raum_id, status) VALUES
 (1, 'Yoga', 'Montag', '08:00', 60, 2, NULL, 1, 'GEPLANT'),
 (2, 'Krafttraining', 'Dienstag', '09:00', 60, 5, NULL, 3, 'GEPLANT'),
 (3, 'HIIT', 'Mittwoch', '18:00', 60, NULL, NULL, 2, 'GEPLANT'),
 (4, 'Zumba', 'Donnerstag', '19:00', 60, NULL, NULL, 2, 'GEPLANT');

INSERT INTO teilnahme (id, kurs_id, mitglied_id) VALUES
 (1, 1, 1),
 (2, 1, 2),
 (3, 2, 2),
 (4, 2, 3),
 (5, 4, 1);

-- verfuegbarkeiten der trainer, meist grosszuegig damit vertretung meist klappt
-- ein paar luecken drin fuer den fall "kein ersatz verfuegbar"
INSERT INTO verfuegbarkeit (id, trainer_id, wochentag, von, bis) VALUES
 (1, 2, 'Montag', '07:00', '20:00'),
 (2, 2, 'Mittwoch', '07:00', '20:00'),
 (3, 3, 'Montag', '16:00', '20:00'),
 (4, 3, 'Mittwoch', '17:00', '21:00'),
 (5, 4, 'Montag', '07:00', '20:00'),
 (6, 4, 'Dienstag', '07:00', '20:00'),
 (7, 5, 'Dienstag', '07:00', '20:00'),
 (8, 5, 'Freitag', '07:00', '20:00'),
 (9, 6, 'Dienstag', '07:00', '14:00'),
 (10, 7, 'Freitag', '07:00', '20:00'),
 (11, 8, 'Montag', '07:00', '13:00'),
 (12, 8, 'Mittwoch', '07:00', '13:00'),
 (13, 9, 'Dienstag', '07:00', '20:00'),
 (14, 9, 'Donnerstag', '07:00', '20:00');

ALTER TABLE studio ALTER COLUMN id RESTART WITH 3;
ALTER TABLE raum ALTER COLUMN id RESTART WITH 5;
ALTER TABLE mitarbeiter ALTER COLUMN id RESTART WITH 10;
ALTER TABLE mitglied ALTER COLUMN id RESTART WITH 4;
ALTER TABLE kurs ALTER COLUMN id RESTART WITH 5;
ALTER TABLE teilnahme ALTER COLUMN id RESTART WITH 6;
ALTER TABLE verfuegbarkeit ALTER COLUMN id RESTART WITH 15;

// logik adminseite, alles in einer datei

let alleMitarbeiterListe = []; // wird gebraucht um bei den Kursen den Trainernamen anzuzeigen
let alleRaeumeListe = [];
let alleStudiosListe = [];
let alleKurseListe = [];
let alleVerfuegbarkeitenListe = [];

let kursSortFeld = "wochentag";
let kursSortRichtung = 1;

const WOCHENTAGE = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];
const WOCHENTAGE_KURZ = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const AVATAR_FARBEN = ["#059669", "#2563eb", "#d97706", "#7c3aed", "#db2777", "#0891b2", "#65a30d", "#dc2626"];

// beim laden

window.onload = function () {
    const mitarbeiterJson = sessionStorage.getItem("mitarbeiter");
    if (!mitarbeiterJson) {
        // nicht eingeloggt -> zurueck zum login
        window.location.href = "index.html";
        return;
    }
    const mitarbeiter = JSON.parse(mitarbeiterJson);
    if (mitarbeiter.rolle !== "ADMIN") {
        window.location.href = "trainer.html";
        return;
    }
    document.getElementById("admin-name").innerText = mitarbeiter.vorname + " " + mitarbeiter.nachname;
    document.getElementById("admin-avatar").innerText = initialen(mitarbeiter.vorname, mitarbeiter.nachname);

    studiosLaden();
    raeumeLaden();
    verfuegbarkeitenLaden();
    kurseLaden();
    mitarbeiterLaden();
    uebersichtLaden();

    // alle 4s neu abfragen statt reload
    setInterval(function () {
        kurseLaden();
        mitarbeiterLaden();
        uebersichtLaden();
    }, 4000);
};

function logout() {
    sessionStorage.removeItem("mitarbeiter");
    window.location.href = "index.html";
}

function initialen(vorname, nachname) {
    const a = vorname ? vorname[0] : "";
    const b = nachname ? nachname[0] : "";
    return (a + b).toUpperCase();
}

function avatarFarbe(id) {
    return AVATAR_FARBEN[id % AVATAR_FARBEN.length];
}

// tabs wechseln

function tabWechseln(name, button) {
    document.querySelectorAll(".tab-inhalt").forEach(el => el.classList.remove("sichtbar"));
    document.getElementById("tab-" + name).classList.add("sichtbar");

    document.querySelectorAll(".nav-item").forEach(el => el.classList.remove("aktiv"));
    button.classList.add("aktiv");
}

// uebersicht

function uebersichtLaden() {
    document.getElementById("anzahl-kurse").innerText = alleKurseListe.length;

    const heuteIndex = (new Date().getDay() + 6) % 7; // JS: 0=So .. wir wollen 0=Mo
    const heuteName = WOCHENTAGE[heuteIndex];
    document.getElementById("anzahl-heute").innerText =
        alleKurseListe.filter(k => k.wochentag === heuteName).length;

    document.getElementById("anzahl-abgesagt").innerText =
        alleKurseListe.filter(k => k.status === "ABGESAGT").length;

    const trainerAnzahl = alleMitarbeiterListe.filter(m => m.rolle === "TRAINER").length;
    document.getElementById("anzahl-trainer").innerText = trainerAnzahl;

    fetch("/api/krankmeldungen").then(r => r.json()).then(liste => {
        document.getElementById("anzahl-krankmeldungen").innerText = liste.length;
        document.getElementById("anzahl-vertretungen").innerText =
            liste.filter(k => k.status === "ERLEDIGT").length;
    });

    wochenansichtRendern(alleKurseListe);
    ereignisFeedLaden();
}

function ereignisFeedLaden() {
    fetch("/api/krankmeldungen/ereignisse").then(r => r.json()).then(ereignisse => {
        const feed = document.getElementById("ereignis-feed");
        feed.innerHTML = "";

        if (ereignisse.length === 0) {
            feed.innerHTML = "<li class='feed-empty'>Noch keine Benachrichtigungen versendet.</li>";
            return;
        }

        ereignisse.forEach(e => {
            feed.appendChild(ereignisEintragBauen(e));
        });
    });
}

function ereignisEintragBauen(e) {
    const konfig = {
        "VERTRETUNG_GEFUNDEN": { icon: "fa-check", klasse: "fi-ok" },
        "TRAINER_KRANK": { icon: "fa-triangle-exclamation", klasse: "fi-warn" },
        "KURS_ABGESAGT": { icon: "fa-xmark", klasse: "fi-danger" },
        "KURS_ERSTELLT": { icon: "fa-calendar-plus", klasse: "fi-ok" }
    };
    const k = konfig[e.typ] || { icon: "fa-circle-info", klasse: "fi-info" };

    const li = document.createElement("li");
    li.className = "feed-item";
    li.innerHTML = `
        <div class="feed-icon ${k.klasse}"><i class="fa-solid ${k.icon}"></i></div>
        <div>
            <div class="feed-text">${e.text}</div>
            <span class="feed-time">${e.zeitpunkt}</span>
        </div>
    `;
    return li;
}

function wochenansichtRendern(kurse) {
    const container = document.getElementById("wochenansicht");
    if (!container) return;
    container.innerHTML = "";

    WOCHENTAGE.forEach((tag, index) => {
        const spalte = document.createElement("div");
        spalte.className = "tag-spalte";

        const titel = document.createElement("div");
        titel.className = "tag-titel";
        titel.innerText = WOCHENTAGE_KURZ[index];
        spalte.appendChild(titel);

        kurse.filter(k => k.wochentag === tag)
            .sort((a, b) => a.startzeit.localeCompare(b.startzeit))
            .forEach(kurs => {
                spalte.appendChild(kursKachelBauen(kurs));
            });

        container.appendChild(spalte);
    });
}

function kursKachelBauen(kurs) {
    const div = document.createElement("div");

    let farbe = "kk-gruen";
    let statusText = "Findet statt";
    if (kurs.status === "ABGESAGT") {
        farbe = "kk-rot";
        statusText = "Abgesagt";
    } else if (kurs.vertretungTrainerId) {
        farbe = "kk-gelb";
        statusText = "Vertretung";
    }

    div.className = "kurs-kachel " + farbe;
    div.innerHTML = `<div class="kk-name">${kurs.name}</div>${kurs.startzeit} Uhr &middot; ${statusText}<div class="kk-raum">${raumLabel(kurs.raumId)}</div>`;
    return div;
}

// kurse

function kurseLaden() {
    fetch("/api/kurse").then(r => r.json()).then(kurse => {
        alleKurseListe = kurse;
        kurseFilterAuswahlFuellen();
        kurseRendern();
    });
}

function kurseFilterAuswahlFuellen() {
    const select = document.getElementById("kurs-filter-trainer");
    const aktuellerWert = select.value;
    select.innerHTML = '<option value="">Alle Trainer</option>';
    alleMitarbeiterListe.filter(m => m.rolle === "TRAINER").forEach(t => {
        const option = document.createElement("option");
        option.value = t.id;
        option.innerText = t.vorname + " " + t.nachname;
        select.appendChild(option);
    });
    select.value = aktuellerWert;
}

function kursSortieren(feld) {
    if (kursSortFeld === feld) {
        kursSortRichtung *= -1;
    } else {
        kursSortFeld = feld;
        kursSortRichtung = 1;
    }
    kurseRendern();
}

function kurseRendern() {
    const suchbegriff = (document.getElementById("kurs-suche").value || "").toLowerCase();
    const statusFilter = document.getElementById("kurs-filter-status").value;
    const trainerFilter = document.getElementById("kurs-filter-trainer").value;

    let liste = alleKurseListe.filter(kurs => {
        if (suchbegriff && !kurs.name.toLowerCase().includes(suchbegriff)) return false;
        if (statusFilter && kurs.status !== statusFilter) return false;
        if (trainerFilter && String(kurs.trainerId) !== trainerFilter) return false;
        return true;
    });

    liste.sort((a, b) => {
        let av = a[kursSortFeld] || "";
        let bv = b[kursSortFeld] || "";
        if (kursSortFeld === "wochentag") {
            av = WOCHENTAGE.indexOf(a.wochentag);
            bv = WOCHENTAGE.indexOf(b.wochentag);
        }
        if (av < bv) return -1 * kursSortRichtung;
        if (av > bv) return 1 * kursSortRichtung;
        return 0;
    });

    const tbody = document.getElementById("kurs-tabelle-body");
    tbody.innerHTML = "";

    if (liste.length === 0) {
        tbody.innerHTML = "<tr><td colspan='9' class='zelle-hell'>Keine Kurse gefunden.</td></tr>";
        return;
    }

    liste.forEach(kurs => {
        const trainer = findeMitarbeiter(kurs.trainerId);
        const vertretung = kurs.vertretungTrainerId ? findeMitarbeiter(kurs.vertretungTrainerId) : null;

        const statusBadge = kurs.status === "GEPLANT"
            ? `<span class="badge badge-gruen"><i class="fa-solid fa-circle-check"></i> Geplant</span>`
            : `<span class="badge badge-rot"><i class="fa-solid fa-circle-xmark"></i> Abgesagt</span>`;

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><b>${kurs.name}</b></td>
            <td>${kurs.wochentag}</td>
            <td>${kurs.startzeit} Uhr</td>
            <td>${kurs.dauerMinuten} Min.</td>
            <td>${raumLabel(kurs.raumId)}</td>
            <td>${trainer ? trainer.vorname + " " + trainer.nachname : "<span class='zelle-hell'>noch offen</span>"}</td>
            <td>${vertretung ? vertretung.vorname + " " + vertretung.nachname : "-"}</td>
            <td>${statusBadge}</td>
            <td>
                <div class="acties">
                    <button class="btn btn-blau btn-sm btn-icon" title="Bearbeiten" onclick="kursBearbeitenAnzeigen(${kurs.id})"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn btn-rot btn-sm btn-icon" title="Löschen" onclick="kursLoeschen(${kurs.id})"><i class="fa-solid fa-trash"></i></button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function standortVonRaum(raumId) {
    const raum = alleRaeumeListe.find(r => r.id === raumId);
    if (!raum) return null;
    return alleStudiosListe.find(s => s.id === raum.studioId);
}

// baut ein lesbares label wie "Raum A · Studio Krefeld" fuer kursliste,
// wochenuebersicht und traineransicht
function raumLabel(raumId) {
    const raum = alleRaeumeListe.find(r => r.id === raumId);
    if (!raum) return "-";
    const standort = alleStudiosListe.find(s => s.id === raum.studioId);
    return raum.name + (standort ? " · " + standort.name : "");
}

// verteilt alle kurse ohne trainer
function kurseVerteilen() {
    fetch("/api/kurse/verteilen", { method: "POST" }).then(r => r.text()).then(text => {
        document.getElementById("verteilen-hinweis").innerText = text;
        kurseLaden();
    });
}

function findeMitarbeiter(id) {
    return alleMitarbeiterListe.find(m => m.id === id);
}

function kursFormularAnzeigen() {
    document.getElementById("kurs-modal").classList.remove("versteckt");
    document.getElementById("kurs-modal-titel").innerText = "Neuer Kurs";
    document.getElementById("kurs-id").value = "";
    document.getElementById("kurs-name").value = "";
    document.getElementById("kurs-wochentag").value = "Montag";
    document.getElementById("kurs-startzeit").value = "";
    kursTrainerAuswahlFuellen();
    kursStandortAuswahlFuellen();
    kursRaumAuswahlFuellen();
}

function kursFormularVerstecken() {
    document.getElementById("kurs-modal").classList.add("versteckt");
}

function kursTrainerAuswahlFuellen() {
    const select = document.getElementById("kurs-trainer");
    select.innerHTML = '<option value="">-- automatisch zuweisen --</option>';
    alleMitarbeiterListe.filter(m => m.rolle === "TRAINER").forEach(t => {
        const option = document.createElement("option");
        option.value = t.id;
        option.innerText = t.vorname + " " + t.nachname;
        select.appendChild(option);
    });
}

function kursStandortAuswahlFuellen() {
    const select = document.getElementById("kurs-standort");
    const vorherigerWert = select.value;
    select.innerHTML = "";
    alleStudiosListe.forEach(s => {
        const option = document.createElement("option");
        option.value = s.id;
        option.innerText = s.name;
        select.appendChild(option);
    });
    if (vorherigerWert && alleStudiosListe.some(s => String(s.id) === vorherigerWert)) {
        select.value = vorherigerWert;
    }
}

// zeigt im raum-select nur die raeume des im standort-select gewaehlten studios
// (siehe anforderung: raum muss zum studio passen)
function kursRaumAuswahlFuellen() {
    const standortSelect = document.getElementById("kurs-standort");
    if (!standortSelect.value && alleStudiosListe.length > 0) {
        standortSelect.value = alleStudiosListe[0].id;
    }
    const standortId = parseInt(standortSelect.value);

    const select = document.getElementById("kurs-raum");
    select.innerHTML = "";
    alleRaeumeListe
        .filter(r => r.studioId === standortId)
        .forEach(r => {
            const option = document.createElement("option");
            option.value = r.id;
            option.innerText = r.name;
            select.appendChild(option);
        });
}

function kursBearbeitenAnzeigen(id) {
    fetch("/api/kurse/" + id).then(r => r.json()).then(kurs => {
        kursFormularAnzeigen();
        document.getElementById("kurs-modal-titel").innerText = "Kurs bearbeiten";
        document.getElementById("kurs-id").value = kurs.id;
        document.getElementById("kurs-name").value = kurs.name;
        document.getElementById("kurs-wochentag").value = kurs.wochentag;
        document.getElementById("kurs-startzeit").value = kurs.startzeit;
        document.getElementById("kurs-trainer").value = kurs.trainerId || "";

        // erst passenden standort setzen, dann den raum-select darauf filtern,
        // erst danach den eigentlichen raum auswaehlen
        const standort = standortVonRaum(kurs.raumId);
        if (standort) {
            document.getElementById("kurs-standort").value = standort.id;
        }
        kursRaumAuswahlFuellen();
        document.getElementById("kurs-raum").value = kurs.raumId;
    });
}

function kursSpeichern() {
    const id = document.getElementById("kurs-id").value;
    const trainerWert = document.getElementById("kurs-trainer").value;

    const name = document.getElementById("kurs-name").value.trim();
    if (!name) {
        alert("Bitte einen Kursnamen eingeben.");
        return;
    }

    const kurs = {
        name: name,
        wochentag: document.getElementById("kurs-wochentag").value,
        startzeit: document.getElementById("kurs-startzeit").value,
        // leer = spaeter automatisch verteilt. dauer ist immer 60 min (serverseitig fest)
        trainerId: trainerWert ? parseInt(trainerWert) : null,
        raumId: parseInt(document.getElementById("kurs-raum").value),
        status: "GEPLANT"
    };

    if (!kurs.wochentag) {
        alert("Bitte einen Wochentag auswählen.");
        return;
    }
    if (!kurs.startzeit) {
        alert("Bitte eine Startzeit eingeben.");
        return;
    }
    if (!kurs.raumId) {
        alert("Bitte einen Raum auswählen.");
        return;
    }

    const url = id ? "/api/kurse/" + id : "/api/kurse";
    const methode = id ? "PUT" : "POST";

    fetch(url, {
        method: methode,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(kurs)
    }).then(response => {
        if (!response.ok) {
            return response.json()
                .catch(() => null)
                .then(fehler => {
                    throw new Error((fehler && fehler.fehler) || ("Kurs konnte nicht gespeichert werden (Status " + response.status + ")."));
                });
        }
        return response.json();
    }).then(() => {
        kursFormularVerstecken();
        kurseLaden();
    }).catch(err => {
        alert(err.message || "Kurs konnte nicht gespeichert werden.");
    });
}

function kursLoeschen(id) {
    if (!confirm("Kurs wirklich löschen?")) {
        return;
    }
    fetch("/api/kurse/" + id, { method: "DELETE" }).then(response => {
        if (!response.ok) {
            throw new Error("Kurs konnte nicht gelöscht werden (Status " + response.status + ").");
        }
        kurseLaden();
    }).catch(err => {
        alert(err.message || "Kurs konnte nicht gelöscht werden.");
    });
}

// mitarbeiter

function mitarbeiterLaden() {
    fetch("/api/mitarbeiter").then(r => r.json()).then(liste => {
        alleMitarbeiterListe = liste;
        kursTrainerAuswahlFuellen();
        kurseFilterAuswahlFuellen();
        mitarbeiterRendern();
    });
}

function verfuegbarkeitenLaden() {
    fetch("/api/verfuegbarkeiten").then(r => r.json()).then(liste => {
        alleVerfuegbarkeitenListe = liste;
        mitarbeiterRendern();
    });
}

function verfuegbarkeitText(trainerId) {
    const eintraege = alleVerfuegbarkeitenListe.filter(v => v.trainerId === trainerId);
    if (eintraege.length === 0) {
        return "<span class='zelle-hell'>Durchgehend</span>";
    }
    return eintraege
        .map(v => {
            const kurz = WOCHENTAGE_KURZ[WOCHENTAGE.indexOf(v.wochentag)] || v.wochentag.substring(0, 2);
            return kurz + " " + v.von + "–" + v.bis;
        })
        .join(", ");
}

function mitarbeiterRendern() {
    const suchbegriff = (document.getElementById("ma-suche").value || "").toLowerCase();
    const rolleFilter = document.getElementById("ma-filter-rolle").value;
    const statusFilter = document.getElementById("ma-filter-status").value;

    const liste = alleMitarbeiterListe.filter(m => {
        const name = (m.vorname + " " + m.nachname).toLowerCase();
        if (suchbegriff && !name.includes(suchbegriff) && !(m.benutzername || "").toLowerCase().includes(suchbegriff)) return false;
        if (rolleFilter && m.rolle !== rolleFilter) return false;
        if (statusFilter && (m.status || "AKTIV") !== statusFilter) return false;
        return true;
    });

    const tbody = document.getElementById("mitarbeiter-tabelle-body");
    tbody.innerHTML = "";

    if (liste.length === 0) {
        tbody.innerHTML = "<tr><td colspan='8' class='zelle-hell'>Keine Mitarbeiter gefunden.</td></tr>";
        return;
    }

    liste.forEach(m => {
        const statusBadge = statusBadgeBauen(m.status);
        const kannGesundMelden = m.status === "KRANK";

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>
                <div class="persona">
                    <div class="avatar" style="background:${avatarFarbe(m.id)}">${initialen(m.vorname, m.nachname)}</div>
                    <div>
                        <div class="persona-name">${m.vorname} ${m.nachname}</div>
                        <div class="persona-sub">@${m.benutzername || "-"}</div>
                    </div>
                </div>
            </td>
            <td>${m.rolle === "ADMIN" ? "<span class='badge badge-blau'>Admin</span>" : "<span class='badge badge-grau'>Trainer</span>"}</td>
            <td>${m.typ ? (m.typ === "VOLLZEIT" ? "Vollzeit" : "Teilzeit") : "-"}</td>
            <td>${m.studioId ? standortName(m.studioId) : "-"}</td>
            <td class="wrap">${m.rolle === "TRAINER" ? verfuegbarkeitText(m.id) : "-"}</td>
            <td>${m.rolle === "TRAINER" ? (m.anzahlGeplanteKurse + " / " + m.maxKurseProWoche) : "-"}</td>
            <td>${statusBadge}</td>
            <td>
                <div class="acties">
                    ${kannGesundMelden ? `<button class="btn btn-gruen btn-sm" title="Als gesund markieren" onclick="alsGesundMelden(${m.id})"><i class="fa-solid fa-heart-pulse"></i></button>` : ""}
                    <button class="btn btn-blau btn-sm btn-icon" title="Bearbeiten" onclick="mitarbeiterBearbeitenAnzeigen(${m.id})"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn btn-rot btn-sm btn-icon" title="Löschen" onclick="mitarbeiterLoeschen(${m.id})"><i class="fa-solid fa-trash"></i></button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function statusBadgeBauen(status) {
    if (status === "KRANK") {
        return `<span class="badge badge-gelb"><i class="fa-solid fa-truck-medical"></i> Krank</span>`;
    }
    if (status === "INAKTIV") {
        return `<span class="badge badge-grau"><i class="fa-solid fa-moon"></i> Inaktiv</span>`;
    }
    return `<span class="badge badge-gruen"><i class="fa-solid fa-circle-check"></i> Aktiv</span>`;
}

function alsGesundMelden(id) {
    fetch("/api/mitarbeiter/" + id + "/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "AKTIV" })
    }).then(() => {
        mitarbeiterLaden();
    });
}

function rolleGeaendert() {
    const rolle = document.getElementById("ma-rolle").value;
    document.getElementById("ma-typ").closest(".field").style.display = rolle === "TRAINER" ? "block" : "none";
    document.getElementById("ma-studio").closest(".field").style.display = rolle === "TRAINER" ? "block" : "none";
}

function mitarbeiterFormularAnzeigen() {
    document.getElementById("mitarbeiter-modal").classList.remove("versteckt");
    document.getElementById("ma-modal-titel").innerText = "Neuer Mitarbeiter";
    document.getElementById("ma-id").value = "";
    document.getElementById("ma-vorname").value = "";
    document.getElementById("ma-nachname").value = "";
    document.getElementById("ma-benutzername").value = "";
    document.getElementById("ma-email").value = "";
    document.getElementById("ma-passwort").value = "";
    document.getElementById("ma-rolle").value = "TRAINER";
    rolleGeaendert();
}

function mitarbeiterFormularVerstecken() {
    document.getElementById("mitarbeiter-modal").classList.add("versteckt");
}

function mitarbeiterBearbeitenAnzeigen(id) {
    const m = findeMitarbeiter(id);
    if (!m) return;

    mitarbeiterFormularAnzeigen();
    document.getElementById("ma-modal-titel").innerText = "Mitarbeiter bearbeiten";
    document.getElementById("ma-id").value = m.id;
    document.getElementById("ma-vorname").value = m.vorname;
    document.getElementById("ma-nachname").value = m.nachname;
    document.getElementById("ma-benutzername").value = m.benutzername || "";
    document.getElementById("ma-email").value = m.email || "";
    document.getElementById("ma-passwort").value = ""; // Passwort wird nie angezeigt
    document.getElementById("ma-rolle").value = m.rolle;
    document.getElementById("ma-typ").value = m.typ ? m.typ : "VOLLZEIT";
    if (m.studioId) {
        document.getElementById("ma-studio").value = m.studioId;
    }
    rolleGeaendert();
}

function mitarbeiterSpeichern() {
    const id = document.getElementById("ma-id").value;
    const rolle = document.getElementById("ma-rolle").value;
    const benutzername = document.getElementById("ma-benutzername").value.trim();

    if (!benutzername) {
        alert("Bitte einen Benutzernamen vergeben.");
        return;
    }

    const mitarbeiter = {
        vorname: document.getElementById("ma-vorname").value,
        nachname: document.getElementById("ma-nachname").value,
        benutzername: benutzername,
        email: document.getElementById("ma-email").value,
        passwort: document.getElementById("ma-passwort").value,
        rolle: rolle,
        typ: rolle === "TRAINER" ? document.getElementById("ma-typ").value : null,
        maxKurseProWoche: rolle === "TRAINER" ? (document.getElementById("ma-typ").value === "VOLLZEIT" ? 20 : 10) : 0,
        studioId: rolle === "TRAINER" ? parseInt(document.getElementById("ma-studio").value) : null
    };

    if (!id && !mitarbeiter.passwort) {
        alert("Bitte ein Passwort vergeben.");
        return;
    }

    if (mitarbeiter.rolle === "TRAINER" && !mitarbeiter.studioId) {
        alert("Bitte einen Standort auswählen.");
        return;
    }

    const url = id ? "/api/mitarbeiter/" + id : "/api/mitarbeiter";
    const methode = id ? "PUT" : "POST";

    fetch(url, {
        method: methode,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mitarbeiter)
    }).then(response => {
        if (!response.ok) {
            return response.json()
                .catch(() => null)
                .then(fehler => {
                    throw new Error((fehler && fehler.fehler) || ("Mitarbeiter konnte nicht gespeichert werden (Status " + response.status + ")."));
                });
        }
        return response.json();
    }).then(() => {
        mitarbeiterFormularVerstecken();
        mitarbeiterLaden();
    }).catch(err => {
        alert(err.message || "Mitarbeiter konnte nicht gespeichert werden.");
    });
}

function mitarbeiterLoeschen(id) {
    if (!confirm("Mitarbeiter wirklich löschen?")) {
        return;
    }
    fetch("/api/mitarbeiter/" + id, { method: "DELETE" }).then(response => {
        if (!response.ok) {
            throw new Error("Mitarbeiter konnte nicht gelöscht werden (Status " + response.status + ").");
        }
        mitarbeiterLaden();
    }).catch(err => {
        alert(err.message || "Mitarbeiter konnte nicht gelöscht werden.");
    });
}

// raeume

function raeumeLaden() {
    // kein eigener tab, nur fuers dropdown gebraucht
    fetch("/api/raeume").then(r => r.json()).then(liste => {
        alleRaeumeListe = liste;
        kurseRendern();
    });
}

// standorte

function studiosLaden() {
    fetch("/api/studios").then(r => r.json()).then(liste => {
        alleStudiosListe = liste;
        const select = document.getElementById("ma-studio");
        select.innerHTML = "";
        liste.forEach(s => {
            const option = document.createElement("option");
            option.value = s.id;
            option.innerText = s.name;
            select.appendChild(option);
        });
    });
}

function standortName(id) {
    const s = alleStudiosListe.find(x => x.id === id);
    return s ? s.name : "-";
}

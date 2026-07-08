// logik traineransicht

let eingeloggterTrainer = null;
let alleTrainerListe = []; // fuer die Anzeige von Vertretungsnamen
let alleRaeumeListe = [];
let alleStudiosListe = [];

const AVATAR_FARBEN = ["#059669", "#2563eb", "#d97706", "#7c3aed", "#db2777", "#0891b2", "#65a30d", "#dc2626"];

window.onload = function () {
    const mitarbeiterJson = sessionStorage.getItem("mitarbeiter");
    if (!mitarbeiterJson) {
        window.location.href = "index.html";
        return;
    }
    eingeloggterTrainer = JSON.parse(mitarbeiterJson);

    if (eingeloggterTrainer.rolle !== "TRAINER") {
        window.location.href = "admin.html";
        return;
    }

    document.getElementById("trainer-name").innerText =
        eingeloggterTrainer.vorname + " " + eingeloggterTrainer.nachname;
    document.getElementById("trainer-avatar").innerText = initialen(eingeloggterTrainer.vorname, eingeloggterTrainer.nachname);
    document.getElementById("trainer-avatar").style.background = avatarFarbe(eingeloggterTrainer.id);

    fetch("/api/mitarbeiter/trainer").then(r => r.json()).then(liste => {
        alleTrainerListe = liste;
        // eigenen status aktuell halten (z.b. nach krankmeldung)
        const ich = liste.find(t => t.id === eingeloggterTrainer.id);
        if (ich) {
            eingeloggterTrainer.status = ich.status;
            statusAnzeigen();
        }
    });

    fetch("/api/raeume").then(r => r.json()).then(liste => { alleRaeumeListe = liste; });
    fetch("/api/studios").then(r => r.json()).then(liste => { alleStudiosListe = liste; });

    uebersichtLaden();
    kurseLaden();
    statusAnzeigen();

    // alle 4s neu laden, z.b. fuer vertretung
    setInterval(function () {
        uebersichtLaden();
        kurseLaden();
        fetch("/api/mitarbeiter/trainer").then(r => r.json()).then(liste => {
            alleTrainerListe = liste;
            const ich = liste.find(t => t.id === eingeloggterTrainer.id);
            if (ich) {
                eingeloggterTrainer.status = ich.status;
                statusAnzeigen();
            }
        });
    }, 4000);
};

function initialen(vorname, nachname) {
    const a = vorname ? vorname[0] : "";
    const b = nachname ? nachname[0] : "";
    return (a + b).toUpperCase();
}

function avatarFarbe(id) {
    return AVATAR_FARBEN[id % AVATAR_FARBEN.length];
}

function logout() {
    sessionStorage.removeItem("mitarbeiter");
    window.location.href = "index.html";
}

function tabWechseln(name, button) {
    document.querySelectorAll(".tab-inhalt").forEach(el => el.classList.remove("sichtbar"));
    document.getElementById("tab-" + name).classList.add("sichtbar");

    document.querySelectorAll(".nav-item").forEach(el => el.classList.remove("aktiv"));
    button.classList.add("aktiv");
}

function statusAnzeigen() {
    const feld = document.getElementById("mein-status");
    if (eingeloggterTrainer.status === "KRANK") {
        feld.innerHTML = `<span class="badge badge-gelb"><i class="fa-solid fa-truck-medical"></i> Krank</span>`;
    } else {
        feld.innerHTML = `<span class="badge badge-gruen"><i class="fa-solid fa-circle-check"></i> Aktiv</span>`;
    }
}

function uebersichtLaden() {
    fetch("/api/kurse/trainer/" + eingeloggterTrainer.id).then(r => r.json()).then(kurse => {
        document.getElementById("anzahl-eigene-kurse").innerText = kurse.length;
        wochenansichtRendern(kurse);
    });
    document.getElementById("max-kurse").innerText = eingeloggterTrainer.maxKurseProWoche;
    document.getElementById("mein-typ").innerText = eingeloggterTrainer.typ === "VOLLZEIT" ? "Vollzeit" : "Teilzeit";
}

const WOCHENTAGE = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];
const WOCHENTAGE_KURZ = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

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
        statusText = "Vertretung: " + findeTrainerName(kurs.vertretungTrainerId);
    }

    div.className = "kurs-kachel " + farbe;
    div.innerHTML = `<div class="kk-name">${kurs.name}</div>${kurs.startzeit} Uhr &middot; ${statusText}<div class="kk-raum">${raumLabel(kurs.raumId)}</div>`;
    return div;
}

function kurseLaden() {
    fetch("/api/kurse/trainer/" + eingeloggterTrainer.id).then(r => r.json()).then(kurse => {
        const tbody = document.getElementById("eigene-kurse-body");
        tbody.innerHTML = "";

        if (kurse.length === 0) {
            tbody.innerHTML = "<tr><td colspan='7' class='zelle-hell'>Keine Kurse zugewiesen.</td></tr>";
            return;
        }

        kurse.forEach(kurs => {
            const vertretung = kurs.vertretungTrainerId ? findeTrainerName(kurs.vertretungTrainerId) : "-";
            const statusBadge = kurs.status === "GEPLANT"
                ? `<span class="badge badge-gruen"><i class="fa-solid fa-circle-check"></i> Geplant</span>`
                : `<span class="badge badge-rot"><i class="fa-solid fa-circle-xmark"></i> Abgesagt</span>`;

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td><b>${kurs.name}</b></td>
                <td>${kurs.wochentag}</td>
                <td>${kurs.startzeit} Uhr</td>
                <td>${raumLabel(kurs.raumId)}</td>
                <td>${statusBadge}</td>
                <td>${vertretung}</td>
                <td>
                    ${kurs.status === 'GEPLANT'
                        ? `<button class="btn btn-rot btn-sm" onclick="krankMelden(${kurs.id})"><i class="fa-solid fa-truck-medical"></i> Krank melden</button>`
                        : "<span class='zelle-hell'>-</span>"}
                </td>
            `;
            tbody.appendChild(tr);
        });
    });
}

function findeTrainerName(id) {
    const t = alleTrainerListe.find(x => x.id === id);
    return t ? t.vorname + " " + t.nachname : "-";
}

// baut ein lesbares label wie "Raum A · Studio Krefeld" (siehe admin.js)
function raumLabel(raumId) {
    const raum = alleRaeumeListe.find(r => r.id === raumId);
    if (!raum) return "-";
    const standort = alleStudiosListe.find(s => s.id === raum.studioId);
    return raum.name + (standort ? " · " + standort.name : "");
}

function krankMelden(kursId) {
    if (!confirm("Möchtest du dich für diesen Kurs wirklich krankmelden? Das System sucht dann automatisch einen Ersatz.")) {
        return;
    }

    const heute = new Date().toISOString().split("T")[0];

    fetch("/api/krankmeldungen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            trainerId: eingeloggterTrainer.id,
            kursId: kursId,
            datum: heute
        })
    })
    .then(r => r.json())
    .then(ergebnis => {
        eingeloggterTrainer.status = "KRANK";
        statusAnzeigen();
        if (ergebnis.ersatzTrainerId) {
            alert("Krankmeldung gespeichert. Ein Ersatztrainer wurde automatisch gefunden.");
        } else {
            alert("Krankmeldung gespeichert. Es wurde leider kein Ersatztrainer gefunden, der Kurs fällt aus.");
        }
        kurseLaden();
        uebersichtLaden();
    });
}

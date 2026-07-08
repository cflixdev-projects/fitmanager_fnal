// login seite, schickt an /api/auth/login, leitet je nach rolle weiter
// (die rolle wird NICHT ausgewaehlt, sondern vom server anhand des
// mitarbeiters automatisch zurueckgegeben)

function login() {
    const benutzername = document.getElementById("benutzername").value.trim();
    const passwort = document.getElementById("passwort").value;
    const fehlerBox = document.getElementById("login-fehler");
    const fehlerText = document.getElementById("login-fehler-text");

    fehlerBox.style.display = "none";

    if (!benutzername || !passwort) {
        fehlerText.innerText = "Bitte Benutzername und Passwort eingeben.";
        fehlerBox.style.display = "flex";
        return;
    }

    fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ benutzername: benutzername, passwort: passwort })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error("falsch");
        }
        return response.json();
    })
    .then(mitarbeiter => {
        // mitarbeiter in sessionStorage speichern
        sessionStorage.setItem("mitarbeiter", JSON.stringify(mitarbeiter));

        // automatische erkennung: admin oder trainer
        if (mitarbeiter.rolle === "ADMIN") {
            window.location.href = "admin.html";
        } else {
            window.location.href = "trainer.html";
        }
    })
    .catch(err => {
        fehlerText.innerText = "Benutzername oder Passwort ist falsch.";
        fehlerBox.style.display = "flex";
    });
}

// login auch per enter
document.addEventListener("keydown", function(e) {
    if (e.key === "Enter") {
        login();
    }
});

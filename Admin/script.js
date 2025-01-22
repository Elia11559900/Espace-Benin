// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDGOgJ_Lmtc---VE6Ty-l3FHFzaFh5rcO4",
    authDomain: "immo-c41e6.firebaseapp.com",
    databaseURL: "https://immo-c41e6-default-rtdb.firebaseio.com",
    projectId: "immo-c41e6",
    storageBucket: "immo-c41e6.firebasestorage.app",
    messagingSenderId: "1050311955497",
    appId: "1:1050311955497:web:fdc94d20240387d1bdb838",
    measurementId: "G-54VG8HN5H8"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
// Get a reference to the database service
const database = firebase.database();
const storage = firebase.storage();

// Référence à la base de données
const logementsRef = database.ref('logements');
const locatairesRef = database.ref('locataires');

// Variable globale pour stocker l'ID de l'élément en cours de modification
let editingLogementId = null;
let editingLocataireId = null;

// Fonction pour afficher une notification
function afficherNotification(message, type) {
    const notification = document.getElementById("notification");
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.style.display = "block";

    // Masquer la notification après 3 secondes
    setTimeout(() => {
        notification.style.display = "none";
    }, 3000);
}

// Fonction pour ajouter un logement
function ajouterLogement(event) {
    event.preventDefault();

    const titre = document.getElementById("titre").value;
    const type = document.getElementById("type").value;
    const description = document.getElementById("description").value;
    const etat = document.getElementById("etat").value;
    const prix = parseInt(document.getElementById("prix").value);
    const demarcheur = document.getElementById("demarcheur").value;
    const proprietaire = document.getElementById("proprietaire").value;
    const quartier = document.getElementById("quartier").value;
    const imageUrl = document.getElementById("image").value;

    // Si editingLogementId n'est pas null, on est en mode édition
    if (editingLogementId) {
        // Mettre à jour le logement existant
        mettreAJourLogement(editingLogementId, titre, type, description, etat, prix, demarcheur, proprietaire, quartier, imageUrl);
    } else {
        // Mode ajout
        enregistrerLogement(titre, type, description, etat, prix, demarcheur, proprietaire, quartier, imageUrl);
    }
}

function enregistrerLogement(titre, type, description, etat, prix, demarcheur, proprietaire, quartier, imageUrl) {
    const nouveauLogementRef = logementsRef.push();
    nouveauLogementRef.set({
        titre: titre,
        type: type,
        description: description,
        etat: etat,
        prix: prix,
        demarcheur: demarcheur,
        proprietaire: proprietaire,
        quartier: quartier,
        image: imageUrl
    })
    .then(() => {
        console.log("Logement ajouté avec succès !");
        afficherNotification("Logement ajouté avec succès !", "success");
        // Vider le formulaire et réinitialiser editingLogementId
        document.getElementById("form-ajout-logement").reset();
        editingLogementId = null;
        // Remettre le bouton "Ajouter"
        const boutonAjouter = document.querySelector("#form-ajout-logement button[type='submit']");
        boutonAjouter.textContent = "Ajouter";
    })
    .catch((error) => {
        console.error("Erreur lors de l'ajout du logement :", error);
        afficherNotification("Erreur lors de l'ajout du logement", "error");
    });
}

function mettreAJourLogement(id, titre, type, description, etat, prix, demarcheur, proprietaire, quartier, imageUrl) {
    logementsRef.child(id).update({
        titre: titre,
        type: type,
        description: description,
        etat: etat,
        prix: prix,
        demarcheur: demarcheur,
        proprietaire: proprietaire,
        quartier: quartier,
        image: imageUrl
    })
    .then(() => {
        console.log("Logement modifié avec succès !");
        afficherNotification("Logement modifié avec succès !", "success");
        // Rétablir le bouton "Ajouter"
        const boutonAjouter = document.querySelector("#form-ajout-logement button[type='submit']");
        boutonAjouter.textContent = "Ajouter";
        // Vider le formulaire et réinitialiser editingLogementId
        document.getElementById("form-ajout-logement").reset();
        editingLogementId = null;
    })
    .catch((error) => {
        console.error("Erreur lors de la modification du logement :", error);
        afficherNotification("Erreur lors de la modification du logement", "error");
    });
}

// Fonction pour supprimer un logement
function supprimerLogement(id) {
    logementsRef.child(id).remove()
    .then(() => {
        console.log("Logement supprimé avec succès !");
        afficherNotification("Logement supprimé avec succès !", "success");
    })
    .catch((error) => {
        console.error("Erreur lors de la suppression du logement :", error);
        afficherNotification("Erreur lors de la suppression du logement", "error");
    });
}

// Fonction pour éditer un logement
function editerLogement(id) {
    // Stocker l'ID du logement en cours de modification
    editingLogementId = id;

    // Trouver le logement à éditer
    logementsRef.child(id).once('value', (snapshot) => {
        const logement = snapshot.val();

        // Pré-remplir le formulaire avec les données du logement
        document.getElementById("titre").value = logement.titre;
        document.getElementById("type").value = logement.type;
        document.getElementById("description").value = logement.description;
        document.getElementById("etat").value = logement.etat;
        document.getElementById("prix").value = logement.prix;
        document.getElementById("demarcheur").value = logement.demarcheur;
        document.getElementById("proprietaire").value = logement.proprietaire;
        document.getElementById("quartier").value = logement.quartier;
        document.getElementById("image").value = logement.image;

        // Modifier le bouton "Ajouter" pour qu'il devienne "Modifier"
        const boutonAjouter = document.querySelector("#form-ajout-logement button[type='submit']");
        boutonAjouter.textContent = "Modifier";

        // Faire défiler la fenêtre vers le formulaire
        document.getElementById("form-ajout-logement").scrollIntoView({ behavior: "smooth" });
    });
}

// Fonction pour afficher les logements
function afficherLogements() {
    const tbody = document.getElementById("tbody-logements");
    tbody.innerHTML = "";

    logementsRef.on('value', (snapshot) => {
        tbody.innerHTML = ""; // Effacer le tableau avant de le re-remplir

        snapshot.forEach((childSnapshot) => {
            const logement = childSnapshot.val();
            const id = childSnapshot.key; // Récupérer la clé (ID) du logement

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${id}</td>
                <td>${logement.titre}</td>
                <td>${logement.type}</td>
                <td>${logement.description}</td>
                <td>${logement.etat}</td>
                <td>${logement.prix} FCFA</td>
                <td>${logement.demarcheur}</td>
                <td>${logement.proprietaire}</td>
                <td>${logement.quartier}</td>
                <td><img src="${logement.image}" alt="${logement.titre}" width="50"></td>
                <td class="action-buttons">
                    <button onclick="editerLogement('${id}')">Éditer</button>
                    <button onclick="supprimerLogement('${id}')">Supprimer</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    });
}

// Écouter la soumission du formulaire d'ajout de logement
const formAjoutLogement = document.getElementById("form-ajout-logement");
formAjoutLogement.addEventListener("submit", ajouterLogement);

// Fonction pour ajouter un locataire
function ajouterLocataire(event) {
    event.preventDefault();

    const nom = document.getElementById("nom").value;
    const prenoms = document.getElementById("prenoms").value;
    const contact = document.getElementById("contact").value;
    const adresse = document.getElementById("adresse").value;
    const email = document.getElementById("email").value;
    const facebook = document.getElementById("facebook").value;

    if (editingLocataireId) {
        // Mode édition
        mettreAJourLocataire(editingLocataireId, nom, prenoms, contact, adresse, email, facebook);
    } else {
        // Mode ajout
        const nouveauLocataireRef = locatairesRef.push();
        nouveauLocataireRef.set({
            nom: nom,
            prenoms: prenoms,
            contact: contact,
            adresse: adresse,
            email: email,
            facebook: facebook
        })
        .then(() => {
            console.log("Locataire ajouté avec succès !");
            afficherNotification("Locataire ajouté avec succès !", "success");
            // Vider le formulaire et réinitialiser editingLocataireId
            document.getElementById("form-ajout-locataire").reset();
            editingLocataireId = null;
            // Remettre le bouton "Ajouter"
            const boutonAjouter = document.querySelector("#form-ajout-locataire button[type='submit']");
            boutonAjouter.textContent = "Ajouter";
        })
        .catch((error) => {
            console.error("Erreur lors de l'ajout du locataire :", error);
            afficherNotification("Erreur lors de l'ajout du locataire", "error");
        });
    }
}

// Fonction pour mettre à jour un locataire
function mettreAJourLocataire(id, nom, prenoms, contact, adresse, email, facebook) {
    locatairesRef.child(id).update({
        nom: nom,
        prenoms: prenoms,
        contact: contact,
        adresse: adresse,
        email: email,
        facebook: facebook
    })
    .then(() => {
        console.log("Locataire modifié avec succès !");
        afficherNotification("Locataire modifié avec succès !", "success");
        // Rétablir le bouton "Ajouter"
        const boutonAjouter = document.querySelector("#form-ajout-locataire button[type='submit']");
        boutonAjouter.textContent = "Ajouter";
        // Vider le formulaire et réinitialiser editingLocataireId
        document.getElementById("form-ajout-locataire").reset();
        editingLocataireId = null;
    })
    .catch((error) => {
        console.error("Erreur lors de la modification du locataire :", error);
        afficherNotification("Erreur lors de la modification du locataire", "error");
    });
}

// Fonction pour supprimer un locataire
function supprimerLocataire(id) {
    locatairesRef.child(id).remove()
    .then(() => {
        console.log("Locataire supprimé avec succès !");
        afficherNotification("Locataire supprimé avec succès !", "success");
    })
    .catch((error) => {
        console.error("Erreur lors de la suppression du locataire :", error);
        afficherNotification("Erreur lors de la suppression du locataire", "error");
    });
}

// Fonction pour éditer un locataire
function editerLocataire(id) {
    // Stocker l'ID du locataire en cours de modification
    editingLocataireId = id;

    // Trouver le locataire à éditer
    locatairesRef.child(id).once('value', (snapshot) => {
        const locataire = snapshot.val();

        // Pré-remplir le formulaire avec les données du locataire
        document.getElementById("nom").value = locataire.nom;
        document.getElementById("prenoms").value = locataire.prenoms;
        document.getElementById("contact").value = locataire.contact;
        document.getElementById("adresse").value = locataire.adresse;
        document.getElementById("email").value = locataire.email;
        document.getElementById("facebook").value = locataire.facebook;

        // Modifier le bouton "Ajouter" pour qu'il devienne "Modifier"
        const boutonAjouter = document.querySelector("#form-ajout-locataire button[type='submit']");
        boutonAjouter.textContent = "Modifier";

        // Faire défiler la fenêtre vers le formulaire
        document.getElementById("form-ajout-locataire").scrollIntoView({ behavior: "smooth" });
    });
}

// Fonction pour afficher les locataires
function afficherLocataires() {
    const tbody = document.getElementById("tbody-locataires");
    tbody.innerHTML = "";

    locatairesRef.on('value', (snapshot) => {
        tbody.innerHTML = "";

        snapshot.forEach((childSnapshot) => {
            const locataire = childSnapshot.val();
            const id = childSnapshot.key;

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${id}</td>
                <td>${locataire.nom}</td>
                <td>${locataire.prenoms}</td>
                <td>${locataire.contact}</td>
                <td>${locataire.adresse}</td>
                <td>${locataire.email}</td>
                <td>${locataire.facebook}</td>
                <td class="action-buttons">
                    <button onclick="editerLocataire('${id}')">Éditer</button>
                    <button onclick="supprimerLocataire('${id}')">Supprimer</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    });
}

// Écouter la soumission du formulaire d'ajout de locataire
const formAjoutLocataire = document.getElementById("form-ajout-locataire");
formAjoutLocataire.addEventListener("submit", ajouterLocataire);

// Gestion de l'affichage des tableaux
const afficherLogementsBtn = document.getElementById("afficher-logements-btn");
const afficherLocatairesBtn = document.getElementById("afficher-locataires-btn");
const listeLogements = document.getElementById("liste-logements");
const listeLocataires = document.getElementById("liste-locataires");

afficherLogementsBtn.addEventListener("click", () => {
    if (listeLogements.style.display === "none") {
        afficherLogements();
        listeLogements.style.display = "block";
    } else {
        listeLogements.style.display = "none";
    }
});

afficherLocatairesBtn.addEventListener("click", () => {
    if (listeLocataires.style.display === "none") {
        afficherLocataires();
        listeLocataires.style.display = "block";
    } else {
        listeLocataires.style.display = "none";
    }
});

// Gestion de l'affichage des formulaires
const afficherFormLogementBtn = document.getElementById("afficher-form-logement-btn");
const afficherFormLocataireBtn = document.getElementById("afficher-form-locataire-btn");
const formLogement = document.getElementById("form-logement");
const formLocataire = document.getElementById("form-locataire");

afficherFormLogementBtn.addEventListener("click", () => {
    formLogement.style.display = "block";
    formLocataire.style.display = "none";
    listeLogements.style.display = "block";
    listeLocataires.style.display = "none";
});

afficherFormLocataireBtn.addEventListener("click", () => {
    formLogement.style.display = "none";
    formLocataire.style.display = "block";
    listeLogements.style.display = "none";
    listeLocataires.style.display = "block";
});

// Masquer les tableaux par défaut au chargement de la page
listeLogements.style.display = "none";
listeLocataires.style.display = "none";

// Fonction pour exporter les données en Excel
function exportToExcel(tableId) {
    const table = document.getElementById(tableId);
    const wb = XLSX.utils.table_to_book(table, { sheet: tableId });
    XLSX.writeFile(wb, `${tableId}.xlsx`);
}

// Fonction pour exporter les données en PDF
function exportToPDF(tableId) {
    const table = document.getElementById(tableId);

    // Créer un nouveau document PDF
    const doc = new jsPDF();

    // Ajouter le tableau au document PDF
    doc.autoTable({ html: `#${tableId}` });

    // Télécharger le fichier PDF
    doc.save(`${tableId}.pdf`);
}

// Écouter les clics sur les boutons d'exportation
const exportButtons = document.querySelectorAll(".export-btn");
exportButtons.forEach(button => {
    button.addEventListener("click", () => {
        const tableId = button.dataset.table;
        const format = button.dataset.format;

        if (format === "xlsx") {
            exportToExcel(tableId);
        } else if (format === "pdf") {
            exportToPDF(tableId);
        }
    });
});
// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyC6gz3XjTK8B8yxJoEgI0uas88kXurqHJE",
    authDomain: "gklm-test.firebaseapp.com",
    databaseURL: "https://gklm-test-default-rtdb.firebaseio.com",
    projectId: "gklm-test",
    storageBucket: "gklm-test.firebasestorage.app",
    messagingSenderId: "394583326970",
    appId: "1:394583326970:web:70ec317319a75b7cd7c943",
    measurementId: "G-9M0GQQ30SM"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
// Get a reference to the database service
const database = firebase.database();

// Référence à la base de données
const logementsRef = database.ref('logements');

// Fonction pour ajouter un logement
function ajouterLogement(event) {
    event.preventDefault();

    const titre = document.getElementById("titre").value;
    const description = document.getElementById("description").value;
    const prix = parseInt(document.getElementById("prix").value);
    const image = document.getElementById("image").value;

    const nouveauLogementRef = logementsRef.push(); // Génère une clé unique

    nouveauLogementRef.set({
        titre: titre,
        description: description,
        prix: prix,
        image: image
    })
    .then(() => {
        console.log("Logement ajouté avec succès !");
        // Vider le formulaire
        document.getElementById("form-ajout-logement").reset();
    })
    .catch((error) => {
        console.error("Erreur lors de l'ajout du logement :", error);
    });
}

// Fonction pour supprimer un logement
function supprimerLogement(id) {
    logementsRef.child(id).remove()
    .then(() => {
        console.log("Logement supprimé avec succès !");
    })
    .catch((error) => {
        console.error("Erreur lors de la suppression du logement :", error);
    });
}

// Fonction pour éditer un logement
function editerLogement(id) {
    // Trouver le logement à éditer
    logementsRef.child(id).once('value', (snapshot) => {
        const logement = snapshot.val();

        // Pré-remplir le formulaire avec les données du logement
        document.getElementById("titre").value = logement.titre;
        document.getElementById("description").value = logement.description;
        document.getElementById("prix").value = logement.prix;
        document.getElementById("image").value = logement.image;

        // Modifier le bouton "Ajouter" pour qu'il devienne "Modifier"
        const boutonAjouter = document.querySelector("#form-ajout-logement button[type='submit']");
        boutonAjouter.textContent = "Modifier";

        // Supprimer l'écouteur d'événement "ajouterLogement"
        const form = document.getElementById("form-ajout-logement");
        form.removeEventListener("submit", ajouterLogement);

        // Ajouter un nouvel écouteur d'événement pour la modification
        form.addEventListener("submit", function modifierLogement(event) {
            event.preventDefault();

            // Mettre à jour les données du logement
            logementsRef.child(id).update({
                titre: document.getElementById("titre").value,
                description: document.getElementById("description").value,
                prix: parseInt(document.getElementById("prix").value),
                image: document.getElementById("image").value
            })
            .then(() => {
                console.log("Logement modifié avec succès !");
                // Rétablir le bouton "Ajouter"
                boutonAjouter.textContent = "Ajouter";
                // Vider le formulaire
                form.reset();
                // Supprimer l'écouteur d'événement de modification
                form.removeEventListener("submit", modifierLogement);
                // Remettre l'écouteur d'événement pour l'ajout
                form.addEventListener("submit", ajouterLogement);
            })
            .catch((error) => {
                console.error("Erreur lors de la modification du logement :", error);
            });
        });
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
                <td>${logement.description}</td>
                <td>${logement.prix} FCFA</td>
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

// Écouter la soumission du formulaire
const formAjoutLogement = document.getElementById("form-ajout-logement");
formAjoutLogement.addEventListener("submit", ajouterLogement);

// Afficher les logements au chargement de la page
afficherLogements();
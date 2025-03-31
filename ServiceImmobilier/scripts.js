// Configuration Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAwHqU_XLmDz9VbsxVGN3wbru3-hLDiyNI",
    authDomain: "microfinance-68811.firebaseapp.com",
    databaseURL: "https://microfinance-68811-default-rtdb.firebaseio.com",
    projectId: "microfinance-68811",
    storageBucket: "microfinance-68811.appspot.com",
    messagingSenderId: "328514838296",
    appId: "1:328514838296:web:89b35343ca3a14b352c86d",
    measurementId: "G-RBQJH93VWE"
};

// Initialisation Firebase
let app; // Déclare la variable `app`
if (!firebase.apps.length) { // Vérifie si Firebase est déjà initialisé
    app = firebase.initializeApp(firebaseConfig); // Initialise si ce n'est pas le cas
} else {
    app = firebase.app(); // Récupère l'instance existante si déjà initialisée
}
const database = firebase.database();
const auth = firebase.auth();
const storage = firebase.storage();

// Variables globales
let currentUser = null;
let editingLogementId = null;
let editingLocataireId = null;
let editingBienId = null;

// Références aux sections principales
const loginSection = document.getElementById('login-section');
const signupSection = document.getElementById('signup-section');
const mainContentSection = document.getElementById('main-content-section');

// Fonction afficherNotification (améliorée pour gérer différents IDs)
function afficherNotification(message, type, notificationId = "notification") {
    const notification = document.getElementById(notificationId);
    if (notification) {
        notification.textContent = message;
        notification.className = `notification ${type}`; // Utilise le type pour la classe CSS
        notification.style.display = "block";

        setTimeout(() => {
            notification.style.display = "none";
        }, 5000); // Augmenté à 5 secondes pour la visibilité.
    }
}

//  AUTHENTIFICATION
// Fonction pour afficher la section de connexion
function showLogin() {
    loginSection.style.display = 'block';
    signupSection.style.display = 'none';
    mainContentSection.style.display = 'none';
}

// Fonction pour afficher la section d'inscription
function showSignup() {
    loginSection.style.display = 'none';
    signupSection.style.display = 'block';
    mainContentSection.style.display = 'none';
}

// Fonction pour afficher le contenu principal
function showMainContent() {
    loginSection.style.display = 'none';
    signupSection.style.display = 'none';
    mainContentSection.style.display = 'block';
}

// Gestionnaire d'état de connexion
auth.onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        showMainContent();
        afficherLogements();
        afficherLocataires();
        afficherBiens();
        afficherDemandesPaiement(); // Appel pour afficher les demandes

        // Récupérer et afficher le nom de l'entreprise + Pré-remplissage
        database.ref(`entreprises/${currentUser.uid}/nom`).once('value')
            .then((snapshot) => {
                const entrepriseName = snapshot.val();
                if (entrepriseName) {
                    document.getElementById('entreprise-name').textContent = entrepriseName;
                    // Pré-remplit le champ établissement *uniquement* si le formulaire existe
                    const etablissementInput = document.getElementById("demande-paiement-etablissement");
                    if (etablissementInput) {
                        etablissementInput.value = entrepriseName;
                    }
                }
            })
            .catch((error) => {
                console.error("Erreur lors de la récupération du nom de l'entreprise:", error);
            });

    } else {
        currentUser = null;
        showLogin();
    }
});


// Inscription
const signupForm = document.getElementById('signup-form');
if (signupForm) {
    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const entrepriseName = document.getElementById('entrepriseName').value;
        const email = document.getElementById('signup-email').value;
        const contact = document.getElementById('contact').value;
        const password = document.getElementById('signup-password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const termsCheckbox = document.getElementById('terms-checkbox'); // Référence à la checkbox

        if (password !== confirmPassword) {
            afficherNotification("Les mots de passe ne correspondent pas.", "error", "signup-notification");
            return;
        }
        if (password.length < 6) {
            afficherNotification("Le mot de passe doit contenir au moins 6 caractères.", "error", "signup-notification");
            return;
        }
        // Vérification de la case à cocher (NOUVEAU)
        if (!termsCheckbox.checked) {
            afficherNotification("Vous devez accepter les termes et conditions.", "error", "signup-notification");
            return;
        }

        auth.createUserWithEmailAndPassword(email, password)
            .then((userCredential) => {
                const entrepriseId = userCredential.user.uid;
                // Sauvegarde des informations de l'entreprise dans la base de données
                database.ref('entreprises/' + entrepriseId).set({
                    nom: entrepriseName,
                    email: email,
                    contact: contact,
                    // Ajoutez d'autres champs si nécessaire
                });
                afficherNotification("Inscription réussie!", "success", 'signup-notification');
                // Redirige vers la connexion ou affiche le contenu principal directement
                // showLogin(); ou déclencher onAuthStateChanged implicitement
            })
            .catch((error) => {
                console.error("Erreur lors de l'inscription:", error);
                afficherNotification(error.message, "error", 'signup-notification'); // Affiche les erreurs de Firebase
            });
    });
}


// Connexion
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        auth.signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                // Connexion réussie, onAuthStateChanged gérera l'affichage
                afficherNotification("Connexion réussie!", "success"); // notification par défaut
            })
            .catch((error) => {
                console.error("Erreur lors de la connexion:", error);
                // Affiche *toutes* les erreurs, y compris celles de Firebase.
                afficherNotification(error.message, "error"); // notification par défaut
            });
    });
}

// Déconnexion
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        auth.signOut()
            .then(() => {
                // Déconnexion réussie. onAuthStateChanged gère l'affichage.
            })
            .catch((error) => {
                console.error("Erreur lors de la déconnexion:", error);
                afficherNotification("Erreur lors de la déconnexion", "error");
        });
    });
}

// Liens "Inscrivez-vous" et "Connectez-vous"
const showSignupLink = document.getElementById('show-signup');
const showLoginLink = document.getElementById('show-login');

if (showSignupLink) {
    showSignupLink.addEventListener('click', (e) => {
        e.preventDefault();
        showSignup();
    });
}

if (showLoginLink) {
    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        showLogin();
    });
}

// --- FONCTION UPLOAD D'IMAGE (Partagée) ---
async function uploadImage(file, folder) {
    if (!currentUser) throw new Error("Utilisateur non connecté.");
    if (!file) throw new Error("Aucun fichier sélectionné.");
    if (!folder) throw new Error("Dossier de destination manquant.");

    const storageRef = storage.ref(`${currentUser.uid}/${folder}/${Date.now()}_${file.name}`);
    const uploadTask = storageRef.put(file);

    return new Promise((resolve, reject) => {
        uploadTask.on(
            firebase.storage.TaskEvent.STATE_CHANGED,
            (snapshot) => {
                // Pourcentage de progression (facultatif)
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                console.log('Upload is ' + progress + '% done');
            },
            (error) => {
                console.error("Erreur lors de l'upload:", error);
                reject(new Error("Erreur lors du téléversement de l'image. Code: " + error.code)); // Rejette la promesse en cas d'erreur.
            },
            () => {
                // Succès de l'upload
                uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
                    console.log('File available at', downloadURL);
                    resolve(downloadURL); // Résout la promesse avec l'URL.
                }).catch(error => {
                    console.error("Erreur récupération URL:", error);
                    reject(new Error("Erreur lors de la récupération de l'URL de l'image."));
                });
            }
        );
    });
}


// --- FONCTIONS LOGEMENTS ---
async function ajouterLogement(event) {
    event.preventDefault();
    if (!currentUser) return;

    const titreInput = document.getElementById("titre");
    const typeInput = document.getElementById("type");
    const descriptionInput = document.getElementById("description");
    const etatInput = document.getElementById("etat");
    const prixInput = document.getElementById("prix");
    const demarcheurInput = document.getElementById("demarcheur");
    const proprietaireInput = document.getElementById("proprietaire");
    const quartierInput = document.getElementById("quartier");
    const villeInput = document.getElementById("ville");
    const statutInput = document.getElementById("statut");
    const imageInput = document.getElementById("image");
    const form = document.getElementById("form-ajout-logement");
    const submitButton = form.querySelector("button[type='submit']");

    // Vérification que les éléments existent
    if (!titreInput || !typeInput || !descriptionInput || !etatInput || !prixInput || !demarcheurInput || !proprietaireInput || !quartierInput || !villeInput || !statutInput || !imageInput || !form || !submitButton) {
        afficherNotification("Erreur: Un élément du formulaire est manquant.", "error");
        console.error("Élément(s) manquant(s) dans le formulaire logement.");
        return;
    }

    const titre = titreInput.value;
    const type = typeInput.value;
    const description = descriptionInput.value;
    const etat = etatInput.value;
    const prix = parseInt(prixInput.value);
    const demarcheur = demarcheurInput.value;
    const proprietaire = proprietaireInput.value;
    const quartier = quartierInput.value;
    const ville = villeInput.value;
    const statut = statutInput.value;
    const imageFile = imageInput.files[0];

    if (isNaN(prix) || prix < 0) {
         afficherNotification("Veuillez entrer un prix valide.", "error");
         return;
    }

    submitButton.disabled = true;
    submitButton.textContent = editingLogementId ? "Modification..." : "Ajout...";

    try {
        let imageUrl = null;
        if (imageFile) {
            imageUrl = await uploadImage(imageFile, 'logements');
        }

        const logementData = {
            titre, type, description, etat, prix, demarcheur, proprietaire, quartier, ville, statut,
             datePublication: new Date().toISOString() // Ajoute la date de publication/modification
        };

        if (editingLogementId) {
            // Mise à jour
             if (imageUrl) { // Met à jour l'image seulement si une nouvelle est fournie
                 logementData.image = imageUrl;
            } else {
                 // Si pas de nouvelle image, on garde l'ancienne (pas besoin de la remettre dans logementData)
                 // OU récupérer l'ancienne URL si on veut la stocker à nouveau (optionnel)
                 const logementSnapshot = await database.ref(`entreprises/${currentUser.uid}/logements/${editingLogementId}/image`).once('value');
                 logementData.image = logementSnapshot.val(); // Réutilise l'URL existante si aucune nouvelle image n'est téléchargée
            }
            await database.ref(`entreprises/${currentUser.uid}/logements/${editingLogementId}`).update(logementData);
            afficherNotification("Logement modifié avec succès !", "success");
        } else {
            // Ajout
            if (!imageUrl) {
                throw new Error("Une image est requise pour ajouter un nouveau logement.");
            }
            logementData.image = imageUrl;
            const nouveauLogementRef = database.ref(`entreprises/${currentUser.uid}/logements`).push();
            await nouveauLogementRef.set(logementData);
            afficherNotification("Logement ajouté avec succès !", "success");
        }

        form.reset(); // Réinitialiser après succès
        editingLogementId = null;

    } catch (error) {
        console.error("Erreur lors de l'ajout/modification du logement :", error);
        afficherNotification(`Erreur: ${error.message}`, "error");
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Ajouter"; // Toujours réinitialiser le texte à "Ajouter"
    }
}


async function mettreAJourLogement(id, titre, type, description, etat, prix, demarcheur, proprietaire, quartier, ville, imageUrl, statut) {
    if (!currentUser || !id) return;

    const updates = {
        titre, type, description, etat, prix, demarcheur, proprietaire, quartier, ville, statut,
        datePublication: new Date().toISOString() // Met à jour la date lors de la modification
    };

    // Récupère l'URL actuelle seulement si aucune nouvelle n'est fournie
    if (imageUrl) {
        updates.image = imageUrl;
    } else {
         try {
             const snapshot = await database.ref(`entreprises/${currentUser.uid}/logements/${id}/image`).once('value');
             updates.image = snapshot.val(); // Conserve l'URL existante
         } catch (error) {
             console.warn("Impossible de récupérer l'URL de l'image existante:", error);
             // Ne pas inclure 'updates.image' si la récupération échoue et qu'il n'y a pas de nouvelle URL
         }
    }


    try {
       await database.ref(`entreprises/${currentUser.uid}/logements/${id}`).update(updates);
        afficherNotification("Logement modifié avec succès !", "success");
        document.getElementById("form-ajout-logement").reset(); //Réinitialiser après la mise à jour
         editingLogementId = null;
        const boutonAjouter = document.querySelector("#form-ajout-logement button[type='submit']");
        if(boutonAjouter) boutonAjouter.textContent = "Ajouter"; // S'assurer que le bouton existe
    } catch(error){
        console.error("Erreur lors de la modification du logement :", error);
        afficherNotification("Erreur lors de la modification du logement", "error");
    }
}


function supprimerLogement(id) {
    if (!currentUser || !id) return;
     if (!confirm(`Voulez-vous vraiment supprimer le logement ID: ${id} ? Cette action est irréversible.`)) {
        return; // Annuler si l'utilisateur clique sur "Annuler"
    }
    database.ref(`entreprises/${currentUser.uid}/logements/${id}`).remove()
        .then(() => {
            afficherNotification("Logement supprimé avec succès !", "success");
            // La mise à jour de l'affichage est gérée par l'écouteur 'on value'
             // Supprimer aussi l'image du storage (optionnel mais recommandé)
            // Note : Il faut stocker le chemin complet de l'image dans la DB pour pouvoir la supprimer
            // Exemple : Si l'URL est https://firebasestorage.googleapis.com/v0/b/projet.appspot.com/o/uid%2Flogements%2Fnom_image.jpg?alt=media...
            // Il faudrait extraire "uid/logements/nom_image.jpg"
            // storage.refFromURL(imageUrl).delete().catch(err => console.error("Erreur suppression image storage:", err));
        })
        .catch((error) => {
            console.error("Erreur lors de la suppression du logement :", error);
            afficherNotification("Erreur lors de la suppression du logement", "error");
        });
}

function editerLogement(id) {
    if (!currentUser || !id) return;
    editingLogementId = id;

    database.ref(`entreprises/${currentUser.uid}/logements/${id}`).once('value', (snapshot) => {
        const logement = snapshot.val();
        const form = document.getElementById("form-ajout-logement");
        if (logement && form) {
            document.getElementById("titre").value = logement.titre || '';
            document.getElementById("type").value = logement.type || '';
            document.getElementById("description").value = logement.description || '';
            document.getElementById("etat").value = logement.etat || '';
            document.getElementById("prix").value = logement.prix || '';
            document.getElementById("demarcheur").value = logement.demarcheur || '';
            document.getElementById("proprietaire").value = logement.proprietaire || '';
            document.getElementById("quartier").value = logement.quartier || '';
            document.getElementById("ville").value = logement.ville || '';
            document.getElementById("statut").value = logement.statut || 'Libre';

             // Ne pas pré-remplir le champ 'file'
            document.getElementById("image").value = ''; // Efface toute sélection précédente

            const boutonAjouter = form.querySelector("button[type='submit']");
            if (boutonAjouter) boutonAjouter.textContent = "Modifier";
            form.scrollIntoView({ behavior: "smooth" });
        } else {
            console.error("Aucune donnée trouvée pour ce logement ou formulaire manquant.");
            afficherNotification("Impossible de charger les données du logement.", "error");
            editingLogementId = null; // Réinitialiser si l'édition échoue
        }
    }, (error) => {
         console.error("Erreur lecture données logement:", error);
         afficherNotification("Erreur lors de la lecture des données.", "error");
         editingLogementId = null;
    });
}


function afficherLogements() {
    if (!currentUser) return;

    const tbody = document.getElementById("tbody-logements");
    if (!tbody) {
        console.error("Element tbody-logements introuvable.");
        return;
    }

    const logementsRef = database.ref(`entreprises/${currentUser.uid}/logements`);

    // Utiliser 'on' pour écouter les changements en temps réel
    logementsRef.on('value', (snapshot) => {
        tbody.innerHTML = ""; // Vider le tableau avant de le remplir
        if (!snapshot.exists()) {
            tbody.innerHTML = '<tr><td colspan="13" style="text-align:center;">Aucun logement trouvé.</td></tr>';
             calculerStatistiquesLogements(); // Recalculer même si vide
            return;
        }
        snapshot.forEach((childSnapshot) => {
            const logement = childSnapshot.val();
            const id = childSnapshot.key;
             if (!logement) return; // Skip invalid entries

            const tr = document.createElement("tr");
             const statutText = logement.statut || 'N/A';
             const actionButtonText = statutText === 'Libre' ? 'Réserver' : (statutText === 'Réservé' ? 'Occupé' : 'Libérer');

            tr.innerHTML = `
                <td>${id || 'N/A'}</td>
                <td>${logement.titre || 'N/A'}</td>
                <td>${logement.type || 'N/A'}</td>
                <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${logement.description || 'N/A'}</td>
                <td>${logement.etat || 'N/A'}</td>
                <td>${(logement.prix !== undefined && logement.prix !== null) ? logement.prix.toLocaleString('fr-FR') + ' FCFA' : 'N/A'}</td>
                <td>${logement.demarcheur || 'N/A'}</td>
                <td>${logement.proprietaire || 'N/A'}</td>
                <td>${logement.quartier || 'N/A'}</td>
                <td>${logement.ville || 'N/A'}</td>
                <td>${logement.image ? `<img src="${logement.image}" alt="${logement.titre || 'Image'}" width="50" loading="lazy" onerror="this.style.display='none'">` : 'Pas d\'image'}</td>
                <td>${statutText}</td>
                <td class="action-buttons">
                    <button onclick="editerLogement('${id}')" title="Modifier ce logement">Éditer</button>
                    <button onclick="supprimerLogement('${id}')" title="Supprimer ce logement">Supprimer</button>
                    <button onclick="changerStatutLogementWrapper('${id}', '${statutText}')" title="Changer le statut">
                        ${actionButtonText}
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
         calculerStatistiquesLogements(); // Mettre à jour les stats après l'affichage
    }, (error) => {
        console.error("Erreur lecture logements:", error);
        tbody.innerHTML = `<tr><td colspan="13" style="text-align:center; color:red;">Erreur lors du chargement des logements.</td></tr>`;
        afficherNotification("Erreur chargement logements.", "error");
         calculerStatistiquesLogements(); // Mettre à jour les stats même en cas d'erreur
    });
}


// Wrapper pour confirmation avant de changer le statut
function changerStatutLogementWrapper(id, statutActuel) {
     if (!currentUser) return;

    let nouveauStatut;
    let actionText = "";
    if (statutActuel === 'Libre') {
        nouveauStatut = 'Réservé';
        actionText = "réserver";
    } else if (statutActuel === 'Réservé') {
        nouveauStatut = 'Occupé';
        actionText = "marquer comme occupé";
    } else { // Occupé ou autre -> Libre
        nouveauStatut = 'Libre';
        actionText = "libérer";
    }

    if (confirm(`Voulez-vous vraiment ${actionText} le logement ID: ${id} ?`)) {
        changerStatutLogement(id, nouveauStatut);
    }
}


//Fonction pour changer le statut d'un logement (interne)
function changerStatutLogement(id, nouveauStatut) {
     if (!currentUser || !id || !nouveauStatut) return;

    database.ref(`entreprises/${currentUser.uid}/logements/${id}`).update({ statut: nouveauStatut })
        .then(() => {
            afficherNotification(`Statut du logement mis à jour : ${nouveauStatut}`, "success");
            // L'affichage est mis à jour par l'écouteur 'on value'
        })
        .catch((error) => {
            console.error("Erreur lors de la mise à jour du statut:", error);
            afficherNotification("Erreur lors de la mise à jour du statut", "error");
        });
}


const formAjoutLogement = document.getElementById("form-ajout-logement");
if (formAjoutLogement) {
  formAjoutLogement.addEventListener("submit", ajouterLogement);
}

// --- FONCTIONS LOCATAIRES ---
function ajouterLocataire(event) {
    event.preventDefault();
    if (!currentUser) return;

    const nom = document.getElementById("nom").value.trim();
    const prenoms = document.getElementById("prenoms").value.trim();
    const adresse = document.getElementById("adresse").value.trim();
    const email = document.getElementById("email").value.trim();
    const facebook = document.getElementById("facebook").value.trim();
    const contact = document.getElementById("contactLocataire").value.trim(); // Récupération du contact
    const form = document.getElementById("form-ajout-locataire");
    const boutonAjouter = form.querySelector("button[type='submit']");

    if (!nom || !prenoms || !contact) { // Ajout nom et contact comme requis
        afficherNotification("Veuillez renseigner au moins le nom, les prénoms et le contact.", "error");
        return;
    }
     if (email && !/\S+@\S+\.\S+/.test(email)) { // Validation email si fourni
         afficherNotification("L'adresse email n'est pas valide.", "error");
         return;
     }


    boutonAjouter.disabled = true;
    boutonAjouter.textContent = editingLocataireId ? "Modification..." : "Ajout...";

    const locataireData = {
        nom, prenoms, adresse, email, facebook, contact
    };

    let actionPromise;
    if (editingLocataireId) {
        // Mise à jour
        actionPromise = database.ref(`entreprises/${currentUser.uid}/locataires/${editingLocataireId}`).update(locataireData);
    } else {
        // Ajout
        const nouveauLocataireRef = database.ref(`entreprises/${currentUser.uid}/locataires`).push();
        actionPromise = nouveauLocataireRef.set(locataireData);
    }

    actionPromise.then(() => {
        afficherNotification(`Locataire ${editingLocataireId ? 'modifié' : 'ajouté'} avec succès !`, "success");
        form.reset();
        editingLocataireId = null;
    })
    .catch((error) => {
        console.error(`Erreur lors de ${editingLocataireId ? 'la modification' : "l'ajout"} du locataire :`, error);
        afficherNotification(`Erreur lors de ${editingLocataireId ? 'la modification' : "l'ajout"} du locataire`, "error");
    })
    .finally(() => {
        boutonAjouter.disabled = false;
        boutonAjouter.textContent = "Ajouter"; // Toujours remettre "Ajouter"
    });
}

// La fonction mettreAJourLocataire est maintenant intégrée dans ajouterLocataire via editingLocataireId
// function mettreAJourLocataire(id, nom, prenoms, adresse, email, facebook, contact) { ... } // Supprimée ou commentée

function editerLocataire(id) {
    if (!currentUser || !id) return;
    editingLocataireId = id; // Mémorise l'ID pour la soumission du formulaire

    database.ref(`entreprises/${currentUser.uid}/locataires/${id}`).once('value', (snapshot) => {
        const locataire = snapshot.val();
        const form = document.getElementById("form-ajout-locataire");

        if (locataire && form) {
            document.getElementById("nom").value = locataire.nom || '';
            document.getElementById("prenoms").value = locataire.prenoms || '';
            document.getElementById("adresse").value = locataire.adresse || '';
            document.getElementById("email").value = locataire.email || '';
            document.getElementById("facebook").value = locataire.facebook || '';
            document.getElementById("contactLocataire").value = locataire.contact || '';

            const boutonAjouter = form.querySelector("button[type='submit']");
            if (boutonAjouter) boutonAjouter.textContent = "Modifier"; // Change le texte du bouton

            form.scrollIntoView({ behavior: "smooth" }); // Défile vers le formulaire
        } else {
            console.error("Aucune donnée trouvée pour ce locataire ou formulaire manquant.");
            afficherNotification("Impossible de charger les données du locataire.", "error");
            editingLocataireId = null; // Réinitialise si l'édition échoue
        }
    }, (error) => {
         console.error("Erreur lecture données locataire:", error);
         afficherNotification("Erreur lors de la lecture des données.", "error");
         editingLocataireId = null;
    });
}


function afficherLocataires() {
    if (!currentUser) return;
    const tbody = document.getElementById("tbody-locataires");
    if (!tbody) {
        console.error("Element tbody-locataires introuvable.");
        return;
    }

    const locatairesRef = database.ref(`entreprises/${currentUser.uid}/locataires`);

    locatairesRef.on('value', (snapshot) => {
        tbody.innerHTML = ""; // Vider avant de remplir
        if (!snapshot.exists()) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;">Aucun locataire trouvé.</td></tr>';
            return;
        }
        snapshot.forEach((childSnapshot) => {
            const locataire = childSnapshot.val();
            const id = childSnapshot.key;
             if (!locataire) return; // Skip invalid entries

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${id || 'N/A'}</td>
                <td>${locataire.nom || 'N/A'}</td>
                <td>${locataire.prenoms || 'N/A'}</td>
                <td>${locataire.adresse || 'N/A'}</td>
                <td>${locataire.email || 'N/A'}</td>
                <td>${locataire.facebook || 'N/A'}</td>
                <td>${locataire.contact || 'N/A'}</td>
                <td class="action-buttons">
                    <button onclick="editerLocataire('${id}')" title="Modifier ce locataire">Éditer</button>
                    <button onclick="supprimerLocataire('${id}')" title="Supprimer ce locataire">Supprimer</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }, (error) => {
        console.error("Erreur lecture locataires:", error);
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:red;">Erreur lors du chargement des locataires.</td></tr>`;
        afficherNotification("Erreur chargement locataires.", "error");
    });
}

function supprimerLocataire(id) {
    if (!currentUser || !id) return;
     if (!confirm(`Voulez-vous vraiment supprimer le locataire ID: ${id} ?`)) {
        return;
    }
    database.ref(`entreprises/${currentUser.uid}/locataires/${id}`).remove()
        .then(() => {
            afficherNotification("Locataire supprimé avec succès !", "success");
             // Mise à jour de l'affichage gérée par l'écouteur 'on value'
        })
        .catch((error) => {
            console.error("Erreur lors de la suppression du locataire :", error);
            afficherNotification("Erreur lors de la suppression du locataire", "error");
        });
}

const formAjoutLocataire = document.getElementById("form-ajout-locataire");
if (formAjoutLocataire) {
    formAjoutLocataire.addEventListener("submit", ajouterLocataire);
}

// --- FONCTIONS BIENS ---
async function ajouterBien(event) {
    event.preventDefault();
    if (!currentUser) return;

    const titre = document.getElementById("titreBien").value;
    const description = document.getElementById("descriptionBien").value;
    const etat = document.getElementById("etatBien").value;
    const prix = parseInt(document.getElementById("prixBien").value);
    const proprietaire = document.getElementById("proprietaireBien").value;
    const ville = document.getElementById("villeBien").value;
    const imageFile = document.getElementById("imageBien").files[0];
    const form = document.getElementById("form-ajout-bien");
    const submitButton = form.querySelector("button[type='submit']");

     if (isNaN(prix) || prix < 0) {
         afficherNotification("Veuillez entrer un prix valide.", "error");
         return;
     }

    submitButton.disabled = true;
    submitButton.textContent = editingBienId ? "Modification..." : "Ajout...";

    try {
        let imageUrl = null;
        if (imageFile) {
            imageUrl = await uploadImage(imageFile, 'biens');
        }

         const bienData = {
             titre, description, etat, prix, proprietaire, ville,
             datePublication: new Date().toISOString() // Ajoute date
         };

        if (editingBienId) {
            // Mise à jour
            if (imageUrl) {
                bienData.image = imageUrl;
             } else {
                 const bienSnapshot = await database.ref(`entreprises/${currentUser.uid}/biens/${editingBienId}/image`).once('value');
                 bienData.image = bienSnapshot.val(); // Conserve l'ancienne image
             }
            await database.ref(`entreprises/${currentUser.uid}/biens/${editingBienId}`).update(bienData);
            afficherNotification("Bien mis à jour avec succès!", "success");
        } else {
            // Ajout
            if (!imageUrl) {
                throw new Error("Une image est requise pour ajouter un nouveau bien.");
            }
            bienData.image = imageUrl;
            const nouveauBienRef = database.ref(`entreprises/${currentUser.uid}/biens`).push();
            await nouveauBienRef.set(bienData);
            afficherNotification("Bien ajouté avec succès!", "success");
        }

        form.reset();
        editingBienId = null;

    } catch (error) {
        console.error("Erreur lors de l'ajout/modification du bien:", error);
        afficherNotification(`Erreur: ${error.message}`, "error");
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Ajouter";
    }
}

// La fonction mettreAJourBien est intégrée dans ajouterBien
// async function mettreAJourBien(id, titre, description, etat, prix, proprietaire, ville, imageUrl) { ... } // Supprimée ou commentée


function supprimerBien(id) {
    if (!currentUser || !id) return;
     if (!confirm(`Voulez-vous vraiment supprimer le bien ID: ${id} ? Cette action est irréversible.`)) {
        return;
    }
    database.ref(`entreprises/${currentUser.uid}/biens/${id}`).remove()
    .then(() => {
        afficherNotification("Bien supprimé avec succès!", "success");
         // Gérer la suppression de l'image du storage si nécessaire/possible
    })
    .catch((error) => {
        console.error("Erreur lors de la suppression du bien:", error);
        afficherNotification("Erreur lors de la suppression du bien", "error");
    });
}

function editerBien(id) {
    if (!currentUser || !id) return;
    editingBienId = id;

    database.ref(`entreprises/${currentUser.uid}/biens/${id}`).once('value', (snapshot) => {
        const bien = snapshot.val();
        const form = document.getElementById("form-ajout-bien");

        if (bien && form) {
            document.getElementById("titreBien").value = bien.titre || '';
            document.getElementById("descriptionBien").value = bien.description || '';
            document.getElementById("etatBien").value = bien.etat || '';
            document.getElementById("prixBien").value = bien.prix || '';
            document.getElementById("proprietaireBien").value = bien.proprietaire || '';
            document.getElementById("villeBien").value = bien.ville || '';
            document.getElementById("imageBien").value = ''; // Clear file input

            const boutonAjouter = form.querySelector("button[type='submit']");
             if(boutonAjouter) boutonAjouter.textContent = "Modifier";

            form.scrollIntoView({ behavior: "smooth" });
        } else {
            console.error("Aucune donnée trouvée pour ce bien ou formulaire manquant.");
            afficherNotification("Impossible de charger les données du bien.", "error");
            editingBienId = null;
        }
     }, (error) => {
         console.error("Erreur lecture données bien:", error);
         afficherNotification("Erreur lors de la lecture des données.", "error");
         editingBienId = null;
     });
}

function afficherBiens() {
    if (!currentUser) return;
    const tbody = document.getElementById("tbody-biens");
    if (!tbody) {
        console.error("Element tbody-biens introuvable.");
        return;
    }

    const biensRef = database.ref(`entreprises/${currentUser.uid}/biens`);

    biensRef.on('value', (snapshot) => {
        tbody.innerHTML = "";
         if (!snapshot.exists()) {
            tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;">Aucun bien trouvé.</td></tr>';
            return;
        }
        snapshot.forEach((childSnapshot) => {
            const bien = childSnapshot.val();
            const id = childSnapshot.key;
            if (!bien) return; // Skip invalid entries

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${id || 'N/A'}</td>
                <td>${bien.titre || 'N/A'}</td>
                <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${bien.description || 'N/A'}</td>
                <td>${bien.etat || 'N/A'}</td>
                 <td>${(bien.prix !== undefined && bien.prix !== null) ? bien.prix.toLocaleString('fr-FR') + ' FCFA' : 'N/A'}</td>
                <td>${bien.proprietaire || 'N/A'}</td>
                <td>${bien.ville || 'N/A'}</td>
                 <td>${bien.image ? `<img src="${bien.image}" alt="${bien.titre || 'Image'}" width="50" loading="lazy" onerror="this.style.display='none'">` : 'Pas d\'image'}</td>
                <td class="action-buttons">
                    <button onclick="editerBien('${id}')" title="Modifier ce bien">Éditer</button>
                    <button onclick="supprimerBien('${id}')" title="Supprimer ce bien">Supprimer</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }, (error) => {
        console.error("Erreur lecture biens:", error);
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; color:red;">Erreur lors du chargement des biens.</td></tr>`;
        afficherNotification("Erreur chargement biens.", "error");
    });
}


const formAjoutBien = document.getElementById("form-ajout-bien");
if (formAjoutBien) {
    formAjoutBien.addEventListener("submit", ajouterBien);
}


// --- STATISTIQUES ---
function calculerStatistiquesLogements() {
  if (!currentUser) return;

  const dateActuelle = new Date();
  const moisActuel = dateActuelle.getMonth(); // Mois (0-11)
  const anneeActuelle = dateActuelle.getFullYear();

  let libres = 0, reserves = 0, occupes = 0;
  let totalMensuel = 0; // Compte les logements créés ce mois-ci
  let totalAnnuel = 0; // Compte les logements créés cette année

  const statLibresSpan = document.getElementById('stat-logements-libres');
  const statReservesSpan = document.getElementById('stat-logements-reserves');
  const statOccupesSpan = document.getElementById('stat-logements-occupes');
  const statMensuelSpan = document.getElementById('stat-logements-total-mensuel');
  const statAnnuelSpan = document.getElementById('stat-logements-total-annuel');

  // Reset stats display before calculation
  if (statLibresSpan) statLibresSpan.textContent = '0';
  if (statReservesSpan) statReservesSpan.textContent = '0';
  if (statOccupesSpan) statOccupesSpan.textContent = '0';
  if (statMensuelSpan) statMensuelSpan.textContent = '0';
  if (statAnnuelSpan) statAnnuelSpan.textContent = '0';


  // Utilisation de .once() pour obtenir les données une seule fois pour le calcul
 database.ref(`entreprises/${currentUser.uid}/logements`).once('value')
    .then((snapshot) => {
         if (!snapshot.exists()) {
             console.log("Aucun logement trouvé pour les statistiques.");
             return; // Sortir si pas de données
         }

        snapshot.forEach((childSnapshot) => {
            const logement = childSnapshot.val();
             if (!logement) return; // Skip invalid entries

            // Compter les statuts
            if (logement.statut === 'Libre') libres++;
            else if (logement.statut === 'Réservé') reserves++;
            else if (logement.statut === 'Occupé') occupes++;
             // else: Gérer d'autres statuts ou ignorer

            // Vérifier la date de publication pour les stats mensuelles/annuelles
             if (logement.datePublication) {
                 try {
                     const datePub = new Date(logement.datePublication);
                     if (!isNaN(datePub.getTime())) { // Vérifie si la date est valide
                         const logementMois = datePub.getMonth(); // 0-11
                         const logementAnnee = datePub.getFullYear();

                         if (logementMois === moisActuel && logementAnnee === anneeActuelle) {
                             totalMensuel++;
                         }
                         if (logementAnnee === anneeActuelle) {
                             totalAnnuel++;
                         }
                     } else {
                          console.warn(`Date invalide pour logement ${childSnapshot.key}: ${logement.datePublication}`);
                     }
                 } catch (e) {
                     console.warn(`Erreur parsing date pour logement ${childSnapshot.key}: ${logement.datePublication}`, e);
                 }
            }
        }); // Fin forEach

        // Mise à jour de l'affichage *après* avoir parcouru tous les logements
        if (statLibresSpan) statLibresSpan.textContent = libres;
        if (statReservesSpan) statReservesSpan.textContent = reserves;
        if (statOccupesSpan) statOccupesSpan.textContent = occupes;
        if (statMensuelSpan) statMensuelSpan.textContent = totalMensuel;
        if (statAnnuelSpan) statAnnuelSpan.textContent = totalAnnuel;

    }) // Fin .then()
    .catch(error => {
        console.error("Erreur lors du calcul des statistiques:", error);
        afficherNotification("Erreur calcul statistiques.", "error");
    }); // Fin .catch()
}


// --- DEMANDES DE PAIEMENT ---

function ajouterDemandePaiement(event) {
    event.preventDefault();
    if (!currentUser) return;

    const etablissementInput = document.getElementById("demande-paiement-etablissement");
    const montantInput = document.getElementById("demande-paiement-montant");
    const situationInput = document.getElementById("demande-paiement-situation");
    const contactDepotInput = document.getElementById("demande-paiement-contact-depot"); // NOUVEAU CHAMP
    const form = document.getElementById("form-ajout-demande-paiement");
    const submitButton = form.querySelector("button[type='submit']");


     // Vérifications
     if (!etablissementInput || !montantInput || !situationInput || !contactDepotInput || !form || !submitButton) {
        afficherNotification("Erreur: Un élément du formulaire de demande est manquant.", "error");
        console.error("Élément(s) manquant(s) dans le formulaire demande.");
        return;
     }

    const etablissement = etablissementInput.value; // Récupère la valeur (pré-remplie ou non)
    const montant = parseInt(montantInput.value);
    const situation = situationInput.value.trim();
    const contactDepot = contactDepotInput.value.trim(); // NOUVEAU CHAMP
    const date = new Date().getTime(); // Timestamp en millisecondes
    const statut = "En attente";  // Statut initial

    if (isNaN(montant) || montant <= 0) {
        afficherNotification("Veuillez entrer un montant valide.", "error");
        return;
    }
    if (!situation) {
        afficherNotification("Veuillez décrire la situation.", "error");
        return;
    }
     if (!contactDepot) { // NOUVELLE VÉRIFICATION
         afficherNotification("Veuillez renseigner le contact de dépôt.", "error");
         return;
     }

    submitButton.disabled = true;
    submitButton.textContent = "Envoi...";

    const nouvelleDemandeRef = database.ref(`entreprises/${currentUser.uid}/demandesPaiement`).push();
    nouvelleDemandeRef.set({
        date,
        etablissement, // Ajout de l'établissement
        montant,
        situation,     // Ajout de la situation
        contactDepot,  // NOUVEAU CHAMP
        statut
    })
    .then(() => {
        afficherNotification("Demande de paiement soumise avec succès !", "success");
        // Réinitialise seulement les champs modifiables
        montantInput.value = '';
        situationInput.value = '';
        contactDepotInput.value = ''; // NOUVEAU CHAMP
        // Garde le nom d'établissement pré-rempli si nécessaire
        // etablissementInput.value = etablissement; // Déjà fait par le readonly/préremplissage initial
    })
    .catch((error) => {
        console.error("Erreur lors de la soumission de la demande de paiement :", error);
        afficherNotification("Erreur lors de la soumission de la demande", "error");
    })
    .finally(() => {
        submitButton.disabled = false;
        submitButton.textContent = "Soumettre la Demande";
    });
}


function afficherDemandesPaiement() {
    if (!currentUser) return;

    const tbody = document.getElementById("tbody-demandes-paiement");
    if (!tbody) {
        console.error("Element tbody-demandes-paiement introuvable.");
        return;
    }

    const demandesRef = database.ref(`entreprises/${currentUser.uid}/demandesPaiement`);

    demandesRef.orderByChild('date').on('value', (snapshot) => { // Tri par date (optionnel)
        tbody.innerHTML = ""; // Vider avant de remplir
        if (!snapshot.exists()) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Aucune demande de paiement trouvée.</td></tr>'; // Mise à jour colspan
            return;
        }

        // Pour afficher les plus récentes en premier, on inverse après récupération
         const demandesArray = [];
         snapshot.forEach(childSnapshot => {
             demandesArray.push({ id: childSnapshot.key, ...childSnapshot.val() });
         });
         demandesArray.reverse(); // Inverse l'ordre

        demandesArray.forEach((demande) => {
             if (!demande) return; // Skip invalid entries
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${demande.id || 'N/A'}</td>
                <td>${demande.date ? new Date(demande.date).toLocaleString('fr-FR') : 'N/A'}</td>
                <td>${demande.etablissement || 'N/A'}</td>
                <td>${(demande.montant !== undefined && demande.montant !== null) ? demande.montant.toLocaleString('fr-FR') + ' FCFA' : 'N/A'}</td>
                <td>${demande.situation || 'N/A'}</td>
                <td>${demande.contactDepot || 'N/A'}</td> <!-- NOUVELLE CELLULE -->
                <td>${demande.statut || 'N/A'}</td>
            `;
            tbody.appendChild(tr);
        });
    }, (error) => {
        console.error("Erreur lecture demandes:", error);
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:red;">Erreur lors du chargement des demandes.</td></tr>`; // Mise à jour colspan
        afficherNotification("Erreur chargement demandes.", "error");
    });
}


// --- GESTION DE L'AFFICHAGE DES SECTIONS ---
const afficherFormLogementBtn = document.getElementById("afficher-form-logement-btn");
const afficherFormLocataireBtn = document.getElementById("afficher-form-locataire-btn");
const afficherFormBienBtn = document.getElementById("afficher-form-bien-btn");
const afficherDemandesPaiementBtn = document.getElementById("afficher-demandes-paiement-btn");

const formLogement = document.getElementById("form-logement");
const listeLogements = document.getElementById("liste-logements");
const afficherLogementsBtn = document.getElementById("afficher-logements-btn"); // Bouton "Afficher les logements"

const formLocataire = document.getElementById("form-locataire");
const listeLocataires = document.getElementById("liste-locataires");
const afficherLocatairesBtn = document.getElementById("afficher-locataires-btn"); // Bouton "Afficher les locataires"

const formBien = document.getElementById("form-bien");
const listeBiens = document.getElementById("liste-biens");
const afficherBiensBtn = document.getElementById("afficher-biens-btn"); // Bouton "Afficher les biens"


const formDemandePaiement = document.getElementById("form-demande-paiement");
const listeDemandesPaiement = document.getElementById("liste-demandes-paiement");

// Fonction pour masquer tous les formulaires/tableaux principaux
function masquerContenusPrincipaux() {
    const sections = [
        formLogement, listeLogements,
        formLocataire, listeLocataires,
        formBien, listeBiens,
        formDemandePaiement, listeDemandesPaiement
    ];
    sections.forEach(section => {
        if (section) section.style.display = "none";
    });
     // Optionnel: Déselectionner les boutons actifs du menu
     document.querySelectorAll('.menu button.active').forEach(btn => btn.classList.remove('active'));
}

// Fonction pour afficher une section (formulaire + liste)
function afficherSection(formElement, listElement, menuButton) {
    if (!currentUser) return; // Vérifier si l'utilisateur est connecté
    masquerContenusPrincipaux(); // Masquer tout d'abord
    if (formElement) formElement.style.display = "block";
    if (listElement) listElement.style.display = "block";
    if (menuButton) menuButton.classList.add('active'); // Marquer le bouton du menu comme actif
}

// Gestionnaires d'événements pour les boutons du menu
if (afficherFormLogementBtn) {
    afficherFormLogementBtn.addEventListener("click", () => {
        afficherSection(formLogement, listeLogements, afficherFormLogementBtn);
        afficherLogements(); // Recharge ou s'assure que les données sont à jour
        calculerStatistiquesLogements(); // Recalcule stats quand on affiche la section
    });
}

if (afficherFormLocataireBtn) {
    afficherFormLocataireBtn.addEventListener("click", () => {
        afficherSection(formLocataire, listeLocataires, afficherFormLocataireBtn);
        afficherLocataires(); // Recharge
    });
}

if (afficherFormBienBtn) {
    afficherFormBienBtn.addEventListener("click", () => {
        afficherSection(formBien, listeBiens, afficherFormBienBtn);
        afficherBiens(); // Recharge
    });
}

if (afficherDemandesPaiementBtn) {
    afficherDemandesPaiementBtn.addEventListener("click", () => {
        afficherSection(formDemandePaiement, listeDemandesPaiement, afficherDemandesPaiementBtn);
        afficherDemandesPaiement(); // Recharge
    });
}

// Gestionnaires pour les boutons "Afficher..." SOUS les formulaires
if (afficherLogementsBtn && listeLogements) {
    afficherLogementsBtn.addEventListener("click", () => {
        listeLogements.style.display = "block"; // Affiche la liste
        listeLogements.scrollIntoView({ behavior: "smooth" }); // Défile vers la liste
        afficherLogements(); // S'assure que les données sont à jour
        calculerStatistiquesLogements(); // Recalcule stats
    });
}
if (afficherLocatairesBtn && listeLocataires) {
    afficherLocatairesBtn.addEventListener("click", () => {
        listeLocataires.style.display = "block";
        listeLocataires.scrollIntoView({ behavior: "smooth" });
        afficherLocataires();
    });
}
if (afficherBiensBtn && listeBiens) {
    afficherBiensBtn.addEventListener("click", () => {
        listeBiens.style.display = "block";
        listeBiens.scrollIntoView({ behavior: "smooth" });
        afficherBiens();
    });
}


// --- EXPORTATION ---
function exportToExcel(tableElementId) {
    const table = document.getElementById(tableElementId);
    if (!table) {
        console.error(`Table avec ID "${tableElementId}" non trouvée pour l'export Excel.`);
         afficherNotification("Erreur: Impossible de trouver le tableau pour l'export.", "error");
        return;
    }

    try {
        // Cloner la table pour éviter de modifier l'original (surtout pour enlever les images/boutons)
         const tableClone = table.cloneNode(true);

         // Optionnel : Supprimer les colonnes non désirées (ex: Actions, Image) du clone avant export
         const thIndexToRemove = [];
         const actionHeader = tableClone.querySelector('thead th:last-child'); // Supposer que Actions est la dernière
         if (actionHeader && actionHeader.textContent.trim().toLowerCase() === 'actions') {
             thIndexToRemove.push(actionHeader.cellIndex);
         }
         // Trouver l'index de la colonne Image (si elle existe)
         const imageHeader = Array.from(tableClone.querySelectorAll('thead th')).find(th => th.textContent.trim().toLowerCase() === 'image');
          if (imageHeader) {
             thIndexToRemove.push(imageHeader.cellIndex);
         }

         if (thIndexToRemove.length > 0) {
             // Trier les index en ordre décroissant pour éviter les problèmes lors de la suppression
             thIndexToRemove.sort((a, b) => b - a);

             Array.from(tableClone.querySelectorAll('tr')).forEach(row => {
                 thIndexToRemove.forEach(index => {
                     if (row.cells[index]) {
                         row.deleteCell(index);
                     }
                 });
             });
         }


        const wb = XLSX.utils.table_to_book(tableClone, { sheet: tableElementId });
        XLSX.writeFile(wb, `${tableElementId}_${new Date().toISOString().slice(0,10)}.xlsx`);
         afficherNotification("Exportation Excel réussie.", "success");
    } catch (error) {
        console.error("Erreur lors de l'export Excel:", error);
        afficherNotification("Erreur lors de l'exportation Excel.", "error");
    }
}

function exportToPDF(tableElementId) {
    const table = document.getElementById(tableElementId);
     if (!table) {
        console.error(`Table avec ID "${tableElementId}" non trouvée pour l'export PDF.`);
         afficherNotification("Erreur: Impossible de trouver le tableau pour l'export.", "error");
        return;
    }
    if (typeof jsPDF === 'undefined' || typeof jsPDF.autoTable === 'undefined') {
         console.error("jsPDF ou jsPDF-AutoTable n'est pas chargé.");
         afficherNotification("Erreur: Librairie PDF non chargée.", "error");
         return;
    }

    try {
        const { jsPDF } = window.jspdf; // Utiliser l'instance globale
        const doc = new jsPDF({
             orientation: "landscape", // paysage
             unit: "mm",
             format: "a4"
        });

        // Optionnel: Ajouter un titre au PDF
        const title = `Liste - ${tableElementId.replace('liste-', '')}`;
        doc.setFontSize(16);
        doc.text(title, 14, 15); // Position (x, y) en mm

        // Cloner la table pour la préparation
         const tableClone = table.cloneNode(true);

         // Trouver les index des colonnes à supprimer (Actions, Image)
         let actionColumnIndex = -1;
         let imageColumnIndex = -1;
         const headers = Array.from(tableClone.querySelectorAll('thead th'));
         headers.forEach((th, index) => {
             const text = th.textContent.trim().toLowerCase();
             if (text === 'actions') actionColumnIndex = index;
             if (text === 'image') imageColumnIndex = index;
         });

         // Extraire les données pour autoTable en excluant les colonnes non désirées
         const head = [[]];
         const body = [];

         Array.from(tableClone.querySelectorAll('thead tr')).forEach(row => {
            Array.from(row.cells).forEach((cell, index) => {
                if (index !== actionColumnIndex && index !== imageColumnIndex) {
                    head[0].push(cell.textContent.trim());
                }
            });
        });

         Array.from(tableClone.querySelectorAll('tbody tr')).forEach(row => {
            const rowData = [];
            Array.from(row.cells).forEach((cell, index) => {
                 if (index !== actionColumnIndex && index !== imageColumnIndex) {
                     // Nettoyer le contenu (enlever les espaces multiples, etc.)
                     let cellText = cell.innerText || cell.textContent || '';
                     // Gérer spécifiquement le prix pour enlever "FCFA" si présent et garder le nombre formaté
                     if (head[0][rowData.length] && head[0][rowData.length].toLowerCase().includes('prix')) {
                        cellText = cellText.replace(/\s*FCFA\s*$/i, '').trim();
                     }
                     rowData.push(cellText.replace(/\s+/g, ' ').trim());
                 }
            });
            body.push(rowData);
        });


        doc.autoTable({
            head: head,
            body: body,
            startY: 25, // Position de départ du tableau sous le titre
            theme: 'grid', // Style de tableau ('striped', 'grid', 'plain')
            styles: {
                fontSize: 8, // Réduire la taille pour tenir en paysage
                cellPadding: 2,
                overflow: 'linebreak', // Gérer le dépassement
                 valign: 'middle'
            },
            headStyles: {
                fillColor: [0, 74, 173], // #004aad
                textColor: 255,
                fontStyle: 'bold',
                 halign: 'center'
            },
            // bodyStyles: { fillColor: [240, 240, 245] }, // Fond légèrement grisé
            // alternateRowStyles: { fillColor: [255, 255, 255] }, // Lignes alternées blanches
             columnStyles: {
                 // Ajuster la largeur de colonnes spécifiques si nécessaire
                 // 0: { cellWidth: 20 }, // Exemple pour la colonne ID
                 // 3: { cellWidth: 50 }, // Exemple pour Description
             },
             margin: { left: 10, right: 10 }
        });

        doc.save(`${tableElementId}_${new Date().toISOString().slice(0,10)}.pdf`);
        afficherNotification("Exportation PDF réussie.", "success");

    } catch(error) {
        console.error("Erreur lors de l'export PDF:", error);
        afficherNotification("Erreur lors de l'exportation PDF.", "error");
    }
}


const exportButtons = document.querySelectorAll(".export-btn");
if (exportButtons) {
    exportButtons.forEach(button => {
        button.addEventListener("click", () => {
            // dataset.table devrait correspondre à l'ID de la *div* contenant le tableau (ex: 'liste-logements')
             // Mais les fonctions attendent l'ID du *tableau* lui-même.
             // Assumons que la table a le même ID que la div parente pour simplifier
             // OU il faudrait une structure HTML plus précise (ex: div#liste-logements > table#table-logements)
             // Pour l'instant, on utilise dataset.table comme ID de la table.
            const tableId = button.dataset.table; // Ex: 'logements', 'locataires', 'biens'
            const format = button.dataset.format;
             const fullTableId = `liste-${tableId}`; // Construit l'ID complet de la div/table

            if (!document.getElementById(fullTableId)) {
                 console.error(`Élément ${fullTableId} non trouvé pour export.`);
                 afficherNotification(`Erreur: Tableau ${tableId} introuvable.`, "error");
                 return;
             }

            if (format === "xlsx") {
                exportToExcel(fullTableId); // Passe l'ID complet
            } else if (format === "pdf") {
                exportToPDF(fullTableId); // Passe l'ID complet
            }
        });
    });
} else {
     console.warn("Aucun bouton d'export trouvé.");
}

// Ajout du gestionnaire d'événements pour le formulaire de demandes de paiement.
const formAjoutDemandePaiement = document.getElementById("form-ajout-demande-paiement");
if (formAjoutDemandePaiement) {
    formAjoutDemandePaiement.addEventListener("submit", ajouterDemandePaiement);
}

// --- GESTION DES MODALES (Admin) ---
function setupAdminModal(modalId, triggerId) {
    const modal = document.getElementById(modalId);
    const trigger = document.getElementById(triggerId);
    const closeButton = modal ? modal.querySelector('.close-button') : null;

    if (!modal || !trigger || !closeButton) {
        console.warn(`Éléments manquants pour la modale: ${modalId} ou ${triggerId}`);
        return;
    }

    trigger.addEventListener('click', function(event) {
        event.preventDefault();
        modal.style.display = 'block';
    });

    closeButton.addEventListener('click', function() {
        modal.style.display = 'none';
    });

    // Fermeture en cliquant en dehors
    modal.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}

setupAdminModal('admin-terms-modal', 'show-admin-terms');
setupAdminModal('admin-privacy-modal', 'show-admin-privacy');


// --- INITIALISATION ---
// Au chargement initial, on vérifie l'état d'authentification
// onAuthStateChanged gère l'affichage initial (login ou main content)
// showLogin(); // Plus nécessaire ici, géré par onAuthStateChanged
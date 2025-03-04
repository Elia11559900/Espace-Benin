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
const app = firebase.initializeApp(firebaseConfig);
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

// Fonction afficherNotification
function afficherNotification(message, type, notificationId = "notification") {
    const notification = document.getElementById(notificationId);
    if (notification) {
        notification.textContent = message;
        notification.className = `notification ${type}`;
        notification.style.display = "block";

        setTimeout(() => {
            notification.style.display = "none";
        }, 3000);
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
        afficherDemandesPaiement();

        // Récupérer et afficher le nom de l'entreprise + Pré-remplissage
        database.ref(`entreprises/${currentUser.uid}/nom`).once('value')
            .then((snapshot) => {
                const entrepriseName = snapshot.val();
                if (entrepriseName) {
                    document.getElementById('entreprise-name').textContent = entrepriseName;
                     // Pré-remplit le champ établissement *uniquement* si le formulaire existe
                    if (document.getElementById("demande-paiement-etablissement")) {
                        document.getElementById("demande-paiement-etablissement").value = entrepriseName;
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

        if (password !== confirmPassword) {
            afficherNotification("Les mots de passe ne correspondent pas.", "error", "signup-notification");
            return;
        }
        if (password.length < 6) {
            afficherNotification("Le mot de passe doit contenir au moins 6 caractères.", "error", "signup-notification");
            return;
        }

        auth.createUserWithEmailAndPassword(email, password)
            .then((userCredential) => {
                const entrepriseId = userCredential.user.uid;
                database.ref('entreprises/' + entrepriseId).set({
                    nom: entrepriseName,
                    email: email,
                    contact: contact,
                });
                afficherNotification("Inscription réussie!", "success", 'signup-notification');
            })
            .catch((error) => {
                console.error("Erreur lors de l'inscription:", error);
                afficherNotification(error.message, "error", 'signup-notification');
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

        auth.signInWithEmailAndPassword(email, password).then((userCredential) => {
                afficherNotification("Connexion réussie!", "success"); // notification par défaut
            })
            .catch((error) => {
                console.error("Erreur lors de la connexion:", error);
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
document.getElementById('show-signup').addEventListener('click', (e) => {
    e.preventDefault();
    showSignup();
});

document.getElementById('show-login').addEventListener('click', (e) => {
    e.preventDefault();
    showLogin();
});

//  FONCTIONS LOGEMENTS (MODIFIÉES) 
async function ajouterLogement(event) {  // async ajouté
    event.preventDefault();
    if (!currentUser) return;

    const titre = document.getElementById("titre").value;
    const type = document.getElementById("type").value;
    const description = document.getElementById("description").value;
    const etat = document.getElementById("etat").value;
    const prix = parseInt(document.getElementById("prix").value);
    const demarcheur = document.getElementById("demarcheur").value;
    const proprietaire = document.getElementById("proprietaire").value;
    const quartier = document.getElementById("quartier").value;
    const ville = document.getElementById("ville").value; // Nouveau champ
    const statut = document.getElementById("statut").value;
    const imageFile = document.getElementById("image").files[0]; // Fichier, pas URL

    if (editingLogementId) {
        // Mise à jour.  Gère l'upload si une *nouvelle* image est sélectionnée.
        let imageUrl = null;
        if (imageFile) {
             imageUrl = await uploadImage(imageFile, 'logements'); //Fonction uploadImage
        }
        mettreAJourLogement(editingLogementId, titre, type, description, etat, prix, demarcheur, proprietaire, quartier, ville, imageUrl, statut);

    } else {
        // Ajout :  L'image est *requise* pour un nouvel ajout.
         if (!imageFile) {
            afficherNotification("Veuillez sélectionner une image.", "error");
            return;
        }
        const imageUrl = await uploadImage(imageFile, 'logements');
        enregistrerLogement(titre, type, description, etat, prix, demarcheur, proprietaire, quartier, ville, imageUrl, statut);
    }
}

async function enregistrerLogement(titre, type, description, etat, prix, demarcheur, proprietaire, quartier, ville, imageUrl, statut) {
     if (!currentUser) return;

    const nouveauLogementRef = database.ref(`entreprises/${currentUser.uid}/logements`).push();
     try {  // Gestion d'erreur améliorée
        await nouveauLogementRef.set({ //await ici aussi
            titre, type, description, etat, prix, demarcheur, proprietaire, quartier, ville, image: imageUrl, statut
        });
        afficherNotification("Logement ajouté avec succès !", "success");
        document.getElementById("form-ajout-logement").reset();
        editingLogementId = null;
        const boutonAjouter = document.querySelector("#form-ajout-logement button[type='submit']");
        boutonAjouter.textContent = "Ajouter";
    } catch (error) {
        console.error("Erreur lors de l'ajout du logement :", error);
        afficherNotification("Erreur lors de l'ajout du logement", "error");
    }
}

async function mettreAJourLogement(id, titre, type, description, etat, prix, demarcheur, proprietaire, quartier, ville, imageUrl, statut) {
    if (!currentUser) return;

    const updates = {
        titre, type, description, etat, prix, demarcheur, proprietaire, quartier, ville, statut
    };
    if (imageUrl) { //Mise à jour l'image SEULEMENT si une nouvelle URL est fournie
        updates.image = imageUrl;
    }

    try {
       await database.ref(`entreprises/${currentUser.uid}/logements/${id}`).update(updates);
        afficherNotification("Logement modifié avec succès !", "success");
        document.getElementById("form-ajout-logement").reset(); //Réinitialiser après la mise à jour
         editingLogementId = null;
        const boutonAjouter = document.querySelector("#form-ajout-logement button[type='submit']");
        boutonAjouter.textContent = "Ajouter";
    } catch(error){
        console.error("Erreur lors de la modification du logement :", error);
        afficherNotification("Erreur lors de la modification du logement", "error");
    }
}

// La fonction supprimerLogement reste *inchangée*.
function supprimerLogement(id) {
    if (!currentUser) return;
    database.ref(`entreprises/${currentUser.uid}/logements/${id}`).remove()
        .then(() => {
            afficherNotification("Logement supprimé avec succès !", "success");
        })
        .catch((error) => {
            console.error("Erreur lors de la suppression du logement :", error);
            afficherNotification("Erreur lors de la suppression du logement", "error");
        });
}

function editerLogement(id) {
    if (!currentUser) return;
    editingLogementId = id;

    database.ref(`entreprises/${currentUser.uid}/logements/${id}`).once('value', (snapshot) => {
        const logement = snapshot.val();
        if (logement) {
            document.getElementById("titre").value = logement.titre;
            document.getElementById("type").value = logement.type;
            document.getElementById("description").value = logement.description;
            document.getElementById("etat").value = logement.etat;
            document.getElementById("prix").value = logement.prix;
            document.getElementById("demarcheur").value = logement.demarcheur;
            document.getElementById("proprietaire").value = logement.proprietaire;
            document.getElementById("quartier").value = logement.quartier;
            document.getElementById("ville").value = logement.ville; // Champ ville
            document.getElementById("statut").value = logement.statut;

            // IMPORTANT:  N'affiche PAS le champ file input avec l'image.  Gère ça dans mettreAJourLogement.
             // Laisse l'utilisateur choisir une *nouvelle* image s'il le souhaite.

            const boutonAjouter = document.querySelector("#form-ajout-logement button[type='submit']");
            boutonAjouter.textContent = "Modifier";
            document.getElementById("form-ajout-logement").scrollIntoView({ behavior: "smooth" });
        } else {
            console.error("Aucune donnée trouvée pour ce logement.");
        }
    });
}

function afficherLogements() {
    if (!currentUser) return;

    const tbody = document.getElementById("tbody-logements");
    if (!tbody) return;

    tbody.innerHTML = "";

    database.ref(`entreprises/${currentUser.uid}/logements`).on('value', (snapshot) => {
        tbody.innerHTML = "";
        snapshot.forEach((childSnapshot) => {
            const logement = childSnapshot.val();
            const id = childSnapshot.key;
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
                <td>${logement.ville}</td>
                <td><img src="${logement.image}" alt="${logement.titre}" width="50"></td>
                <td>${logement.statut}</td>
                <td class="action-buttons">
                    <button onclick="editerLogement('${id}')">Éditer</button>
                    <button onclick="supprimerLogement('${id}')">Supprimer</button>
                    <button onclick="changerStatutLogement('${id}', '${logement.statut}')">
                        ${logement.statut === 'Libre' ? 'Réserver' : (logement.statut === 'Réservé' ? 'Occupé' : 'Libérer')}
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
        calculerStatistiquesLogements();
    });
}

//Fonction pour changer le statut d'un logement
function changerStatutLogement(id, statutActuel) {
     if (!currentUser) return;

    let nouveauStatut;
    if (statutActuel === 'Libre') {
        nouveauStatut = 'Réservé';
    } else if (statutActuel === 'Réservé') {
        nouveauStatut = 'Occupé';
    } else {
        nouveauStatut = 'Libre';
    }

    database.ref(`entreprises/${currentUser.uid}/logements/${id}`).update({ statut: nouveauStatut })
        .then(() => {
            afficherNotification(`Statut du logement mis à jour : ${nouveauStatut}`, "success");
            //afficherLogements(); // Pas besoin de réafficher, l'écouteur 'value' le fait déjà
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

//  FONCTIONS LOCATAIRES 
function ajouterLocataire(event) {
    event.preventDefault();
    if (!currentUser) return;

    const nom = document.getElementById("nom").value;
    const prenoms = document.getElementById("prenoms").value;
    const adresse = document.getElementById("adresse").value;
    const email = document.getElementById("email").value;
    const facebook = document.getElementById("facebook").value;
    const contact = document.getElementById("contactLocataire").value; // Récupération du contact

    if (editingLocataireId) {
        mettreAJourLocataire(editingLocataireId, nom, prenoms, adresse, email, facebook, contact); // Ajout contact
    } else {
        const nouveauLocataireRef = database.ref(`entreprises/${currentUser.uid}/locataires`).push();

        const nouveauLocataire = {
            nom, prenoms, adresse, email, facebook, contact // Ajout contact
        };

        nouveauLocataireRef.set(nouveauLocataire)
            .then(() => {
                afficherNotification("Locataire ajouté avec succès !", "success");
                document.getElementById("form-ajout-locataire").reset();
                editingLocataireId = null;
                const boutonAjouter = document.querySelector("#form-ajout-locataire button[type='submit']");
                boutonAjouter.textContent = "Ajouter";
            })
            .catch((error) => {
                console.error("Erreur lors de l'ajout du locataire :", error);
                afficherNotification("Erreur lors de l'ajout du locataire", "error");
            });
    }
}

function mettreAJourLocataire(id, nom, prenoms, adresse, email, facebook, contact) { // Ajout contact
    if (!currentUser) return;

    const locataireMisAJour = {
        nom, prenoms, adresse, email, facebook, contact  // Ajout contact
    };

    database.ref(`entreprises/${currentUser.uid}/locataires/${id}`).update(locataireMisAJour)
        .then(() => {
            afficherNotification("Locataire modifié avec succès !", "success");
            const boutonAjouter = document.querySelector("#form-ajout-locataire button[type='submit']");
            boutonAjouter.textContent = "Ajouter";
            document.getElementById("form-ajout-locataire").reset();
            editingLocataireId = null;
        })
        .catch((error) => {
            console.error("Erreur lors de la modification du locataire :", error);
            afficherNotification("Erreur lors de la modification du locataire", "error");
        });
}

function editerLocataire(id) {
    if (!currentUser) return;
    editingLocataireId = id;

    database.ref(`entreprises/${currentUser.uid}/locataires/${id}`).once('value', (snapshot) => {
        const locataire = snapshot.val();

        if (locataire) {
            document.getElementById("prenoms").value = locataire.prenoms;
            document.getElementById("adresse").value = locataire.adresse;
            document.getElementById("email").value = locataire.email;
            document.getElementById("facebook").value = locataire.facebook;
            document.getElementById("contactLocataire").value = locataire.contact; // Remplissage contact

            const boutonAjouter = document.querySelector("#form-ajout-locataire button[type='submit']");
            boutonAjouter.textContent = "Modifier";

            document.getElementById("form-ajout-locataire").scrollIntoView({ behavior: "smooth" });
        } else {
            console.error("Aucune donnée trouvée pour ce locataire.");
        }
    });
}

function afficherLocataires() {
    if (!currentUser) return;
    const tbody = document.getElementById("tbody-locataires");
    if (!tbody) return;

    tbody.innerHTML = "";

    database.ref(`entreprises/${currentUser.uid}/locataires`).on('value', (snapshot) => {
        tbody.innerHTML = "";
        snapshot.forEach((childSnapshot) => {
            const locataire = childSnapshot.val();
            const id = childSnapshot.key;

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${id}</td>
                <td>${locataire.nom}</td>
                <td>${locataire.prenoms}</td>
                <td>${locataire.adresse}</td>
                <td>${locataire.email}</td>
                <td>${locataire.facebook}</td>
                <td>${locataire.contact}</td>  
                <td class="action-buttons">
                    <button onclick="editerLocataire('${id}')">Éditer</button>
                    <button onclick="supprimerLocataire('${id}')">Supprimer</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    });
}

function supprimerLocataire(id) {
    if (!currentUser) return;
    database.ref(`entreprises/${currentUser.uid}/locataires/${id}`).remove()
        .then(() => {
            afficherNotification("Locataire supprimé avec succès !", "success");
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

//  FONCTIONS BIENS (MODIFIÉES) 
async function ajouterBien(event) {
    event.preventDefault();
    if (!currentUser) return;

    const titre = document.getElementById("titreBien").value;
    const description = document.getElementById("descriptionBien").value;
    const etat = document.getElementById("etatBien").value;
    const prix = parseInt(document.getElementById("prixBien").value);
    const proprietaire = document.getElementById("proprietaireBien").value;
    const ville = document.getElementById("villeBien").value; // Nouveau champ.
    const imageFile = document.getElementById("imageBien").files[0];

     if (editingBienId) {
        let imageUrl = null;
        if (imageFile) {
            imageUrl = await uploadImage(imageFile, 'biens');
        }
        mettreAJourBien(editingBienId, titre, description, etat, prix, proprietaire, ville, imageUrl); // Pass ville.
    } else {
        if (!imageFile) {
            afficherNotification("Veuillez sélectionner une image.", "error");
            return;
        }
        const imageUrl = await uploadImage(imageFile, 'biens');
        enregistrerBien(titre, description, etat, prix, proprietaire, ville, imageUrl); // Pass ville.
    }
}

async function enregistrerBien(titre, description, etat, prix, proprietaire, ville, imageUrl) {
    if (!currentUser) return;

    const nouveauBienRef = database.ref(`entreprises/${currentUser.uid}/biens`).push();
    try {
        await nouveauBienRef.set({
            titre, description, etat, prix, proprietaire, ville, image: imageUrl // Ajout ville
        });
        afficherNotification("Bien ajouté avec succès!", "success");
        document.getElementById("form-ajout-bien").reset();
        editingBienId = null;
        const boutonAjouter = document.querySelector("#form-ajout-bien button[type='submit']");
        boutonAjouter.textContent = "Ajouter";

    } catch(error){
        console.error("Erreur lors de l'ajout du bien:", error);
        afficherNotification("Erreur lors de l'ajout du bien", "error");
    }
}

async function mettreAJourBien(id, titre, description, etat, prix, proprietaire, ville, imageUrl) {
     if (!currentUser) return;

    const updates = { titre, description, etat, prix, proprietaire, ville };  // Ajout ville
    if (imageUrl) {
        updates.image = imageUrl;
    }

    try{
        await database.ref(`entreprises/${currentUser.uid}/biens/${id}`).update(updates);
        afficherNotification("Bien mis à jour avec succès!", "success");
        document.getElementById("form-ajout-bien").reset();
        editingBienId = null;
        const boutonAjouter = document.querySelector("#form-ajout-bien button[type='submit']");
        boutonAjouter.textContent = "Ajouter";

    }catch(error){
       console.error("Erreur lors de la mise à jour du bien:", error);
        afficherNotification("Erreur lors de la mise à jour du bien", "error");
    }
}

// supprimerBien reste *inchangée*.
function supprimerBien(id) {
    if (!currentUser) return;
    database.ref(`entreprises/${currentUser.uid}/biens/${id}`).remove()
    .then(() => {
        afficherNotification("Bien supprimé avec succès!", "success");
    })
    .catch((error) => {
        console.error("Erreur lors de la suppression du bien:", error);
        afficherNotification("Erreur lors de la suppression du bien", "error");
    });
}

function editerBien(id) {
    if (!currentUser) return;
    editingBienId = id;

    database.ref(`entreprises/${currentUser.uid}/biens/${id}`).once('value', (snapshot) => {
        const bien = snapshot.val();
        if (bien) {
            document.getElementById("titreBien").value = bien.titre;
            document.getElementById("descriptionBien").value = bien.description;
            document.getElementById("etatBien").value = bien.etat;
            document.getElementById("prixBien").value = bien.prix;
            document.getElementById("proprietaireBien").value = bien.proprietaire;
            document.getElementById("villeBien").value = bien.ville; // Champ ville.
            // Pas de pré-remplissage du champ image.

            const boutonAjouter = document.querySelector("#form-ajout-bien button[type='submit']");
            boutonAjouter.textContent = "Modifier";

            document.getElementById("form-ajout-bien").scrollIntoView({ behavior: "smooth" });
        } else {
            console.error("Aucune donnée trouvée pour ce bien.");
        }
    });
}

function afficherBiens() {
    if (!currentUser) return;
    const tbody = document.getElementById("tbody-biens");
    if (!tbody) return;

    tbody.innerHTML = "";

    database.ref(`entreprises/${currentUser.uid}/biens`).on('value', (snapshot) => {
        tbody.innerHTML = "";
        snapshot.forEach((childSnapshot) => {
            const bien = childSnapshot.val();
            const id = childSnapshot.key;

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${id}</td>
                <td>${bien.titre}</td>
                <td>${bien.description}</td>
                <td>${bien.etat}</td>
                <td>${bien.prix} FCFA</td>
                <td>${bien.proprietaire}</td>
                <td>${bien.ville}</td>
                <td><img src="${bien.image}" alt="${bien.titre}" width="50"></td>
                <td class="action-buttons">
                    <button onclick="editerBien('${id}')">Éditer</button>
                    <button onclick="supprimerBien('${id}')">Supprimer</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    });
}

//  FONCTION UPLOAD D'IMAGE (Nouvelle) 
async function uploadImage(file, folder) {
    if (!currentUser) throw new Error("Utilisateur non connecté.");

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
                reject(error); // Rejette la promesse en cas d'erreur.
            },
            () => {
                // Succès de l'upload
                uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
                    console.log('File available at', downloadURL);
                    resolve(downloadURL); // Résout la promesse avec l'URL.
                });
            }
        );
    });
}

const formAjoutBien = document.getElementById("form-ajout-bien");
if (formAjoutBien) {
    formAjoutBien.addEventListener("submit", ajouterBien);
}


//  STATISTIQUES
function calculerStatistiquesLogements() {
  if (!currentUser) return;

  const dateActuelle = new Date();
  const moisActuel = dateActuelle.getMonth() + 1; // Mois (1-12)
  const anneeActuelle = dateActuelle.getFullYear();

  let libres = 0, reserves = 0, occupes = 0;
    let totalMensuel = 0;
    let totalAnnuel = 0;


 database.ref(`entreprises/${currentUser.uid}/logements`).once('value', (snapshot) => {

   snapshot.forEach((childSnapshot) => {
            const logement = childSnapshot.val();
            const logementMois = new Date(logement.date).getMonth() + 1;
            const logementAnnee = new Date(logement.date).getFullYear();
            if (logement.statut === 'Libre') libres++;
            if (logement.statut === 'Réservé') reserves++;
            if (logement.statut === 'Occupé') occupes++;

            // Statistiques mensuelles et annuelles (en comptant *tous* les logements créés)
            if (logementMois === moisActuel) {
              totalMensuel++;
            }
            if(logementAnnee === anneeActuelle){
                totalAnnuel++;
            }
        });
      // Mise à jour de l'affichage *après* avoir parcouru tous les logements
        document.getElementById('stat-logements-libres').textContent = libres;
        document.getElementById('stat-logements-reserves').textContent = reserves;
        document.getElementById('stat-logements-occupes').textContent = occupes;
        document.getElementById('stat-logements-total-mensuel').textContent = totalMensuel;
        document.getElementById('stat-logements-total-annuel').textContent = totalAnnuel;
    });
}

// ---------- DEMANDES DE PAIEMENT ----------

function ajouterDemandePaiement(event) {
    event.preventDefault();
    if (!currentUser) return;

    const etablissement = document.getElementById("demande-paiement-etablissement").value; // Récupère la valeur (pré-remplie)
    const montant = parseInt(document.getElementById("demande-paiement-montant").value);
    const situation = document.getElementById("demande-paiement-situation").value; // Nouvelle valeur
    const date = new Date().getTime(); // Timestamp en millisecondes
    const statut = "En attente";  // Statut initial

    const nouvelleDemandeRef = database.ref(`entreprises/${currentUser.uid}/demandesPaiement`).push();
    nouvelleDemandeRef.set({
        date,
        etablissement, // Ajout de l'établissement
        montant,
        situation,  // Ajout de la situation
        statut
    })
    .then(() => {
        afficherNotification("Demande de paiement soumise avec succès !", "success");
        document.getElementById("form-ajout-demande-paiement").reset();
         //Réinitialise tous les champs, y compris le champ situation
         document.getElementById("demande-paiement-etablissement").value = etablissement;
         //Garde le nom d'établissement pré-rempli
    })
    .catch((error) => {
        console.error("Erreur lors de la soumission de la demande de paiement :", error);
        afficherNotification("Erreur lors de la soumission de la demande de paiement", "error");
    });
}


function afficherDemandesPaiement() {
    if (!currentUser) return;

    const tbody = document.getElementById("tbody-demandes-paiement");
    if (!tbody) return;
    tbody.innerHTML = "";

    database.ref(`entreprises/${currentUser.uid}/demandesPaiement`).on('value', (snapshot) => {
        tbody.innerHTML = "";
        snapshot.forEach((childSnapshot) => {
            const demande = childSnapshot.val();
            const id = childSnapshot.key;
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${id}</td>
                <td>${new Date(demande.date).toLocaleString()}</td>
                <td>${demande.etablissement}</td>
                <td>${demande.montant} FCFA</td>
                <td>${demande.situation}</td> 
                <td>${demande.statut}</td>
            `;
            tbody.appendChild(tr);
        });
    });
}

//GESTION DE L'AFFICHAGE 
const afficherFormLogementBtn = document.getElementById("afficher-form-logement-btn");
const afficherFormLocataireBtn = document.getElementById("afficher-form-locataire-btn");
const afficherFormBienBtn = document.getElementById("afficher-form-bien-btn");
const afficherDemandesPaiementBtn = document.getElementById("afficher-demandes-paiement-btn"); // Nouveau bouton


const formLogement = document.getElementById("form-logement");
const listeLogements = document.getElementById("liste-logements");
const formLocataire = document.getElementById("form-locataire");
const listeLocataires = document.getElementById("liste-locataires");
const formBien = document.getElementById("form-bien");
const listeBiens = document.getElementById("liste-biens");
const formDemandePaiement = document.getElementById("form-demande-paiement"); // Nouveau
const listeDemandesPaiement = document.getElementById("liste-demandes-paiement"); // Nouveau

// Fonction pour masquer tous les formulaires/tableaux
function masquerTout() {
    if (formLogement) formLogement.style.display = "none";
    if (listeLogements) listeLogements.style.display = "none";
    if (formLocataire) formLocataire.style.display = "none";
    if (listeLocataires) listeLocataires.style.display = "none";
    if (formBien) formBien.style.display = "none";
    if (listeBiens) listeBiens.style.display = "none";
    if (formDemandePaiement) formDemandePaiement.style.display = "none";  // Nouveau
    if (listeDemandesPaiement) listeDemandesPaiement.style.display = "none";   // Nouveau
}

// Gestionnaires d'événements pour les boutons du menu
if (afficherFormLogementBtn) {
    afficherFormLogementBtn.addEventListener("click", () => {
        if (!currentUser) return;
        masquerTout();
        formLogement.style.display = "block";
        afficherLogements(); // Important: recharge les données
        listeLogements.style.display = "block";
    });
}

if (afficherFormLocataireBtn) {
    afficherFormLocataireBtn.addEventListener("click", () => {
        if (!currentUser) return;
        masquerTout();
        formLocataire.style.display = "block";
        afficherLocataires();
        listeLocataires.style.display = "block";
    });
}

if (afficherFormBienBtn) {
    afficherFormBienBtn.addEventListener("click", () => {
        if (!currentUser) return;
        masquerTout();
        formBien.style.display = "block";
        afficherBiens();
        listeBiens.style.display = "block";
    });
}

if (afficherDemandesPaiementBtn) {
    afficherDemandesPaiementBtn.addEventListener("click", () => {
        if (!currentUser) return;
        masquerTout();
        formDemandePaiement.style.display = "block";
        afficherDemandesPaiement();
        listeDemandesPaiement.style.display = "block";
    });
}

// EXPORTATION
function exportToExcel(tableId) {
    const table = document.getElementById(tableId);
    if (!table) return;

    const wb = XLSX.utils.table_to_book(table, { sheet: tableId });
    XLSX.writeFile(wb, `${tableId}.xlsx`);
}

function exportToPDF(tableId) {
    const table = document.getElementById(tableId);
    if (!table) return;

    // Crée une instance de jsPDF en mode paysage ("l") et en millimètres ("mm").
    const doc = new jsPDF("l", "mm", "a4"); // "l" pour paysage, "mm" pour millimètres, "a4" pour le format de page.

    // Utilise autoTable pour convertir la table HTML en PDF.
    doc.autoTable({
        html: `#${tableId}`,
        // styles de base pour le tableau (facultatif)
        styles: {
            fontSize: 10, // Taille de police
            cellPadding: 2, // Espacement intérieur des cellules
            overflow: 'linebreak', //  'linebreak' (par défaut), 'ellipsize' ou 'visible'.
            halign: 'left', // Alignement horizontal ('left', 'center', 'right')
            valign: 'middle', // Alignement vertical ('top', 'middle', 'bottom')
        },
        // Style d'entête (facultatif)
        headStyles: {
            fillColor: [41, 128, 185], // Couleur de fond de l'en-tête (bleu)
            textColor: 255, // Couleur du texte de l'en-tête (blanc)
            fontStyle: 'bold', // Style de police de l'en-tête
        },
       // Style du corps (facultatif)
        bodyStyles: {
            fillColor: [236, 240, 241], // Couleur de fond des lignes (gris clair)
        },
         //Style des lignes alternatives (facultatif)
        alternateRowStyles: {
            fillColor: [255, 255, 255] // Couleur de fond des lignes alternatives
        },
         // Hook pour personnaliser le contenu des cellules (facultatif)
        didParseCell: function (data) {
            // Vous pouvez modifier data.cell.text ou data.cell.styles ici
            // Par exemple, pour mettre en gras le texte de la première colonne :
            // if (data.column.index === 0) {
            //    data.cell.styles.fontStyle = 'bold';
            //}
        },
        margin: { top: 15, left: 10, right:10, bottom:15 },
        tableWidth: 'auto',

    });

    // Enregistre le PDF.
    doc.save(`${tableId}.pdf`);
}

const exportButtons = document.querySelectorAll(".export-btn");
if (exportButtons) {
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
}

// Ajout du gestionnaire d'événements pour le formulaire de demandes de paiement.
const formAjoutDemandePaiement = document.getElementById("form-ajout-demande-paiement");
if (formAjoutDemandePaiement) {
    formAjoutDemandePaiement.addEventListener("submit", ajouterDemandePaiement);
}

// Au chargement initial, on affiche la section de connexion
showLogin();
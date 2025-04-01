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

// Références aux formulaires et listes
const formLogement = document.getElementById("form-logement");
const listeLogements = document.getElementById("liste-logements");
const formLocataire = document.getElementById("form-locataire");
const listeLocataires = document.getElementById("liste-locataires");
const formBien = document.getElementById("form-bien");
const listeBiens = document.getElementById("liste-biens");
const formDemandePaiement = document.getElementById("form-demande-paiement");
const listeDemandesPaiement = document.getElementById("liste-demandes-paiement");
const profilSection = document.getElementById("profil-section");
const formProfil = document.getElementById("form-profil");

// Références aux boutons de menu
const afficherFormLogementBtn = document.getElementById("afficher-form-logement-btn");
const afficherFormLocataireBtn = document.getElementById("afficher-form-locataire-btn");
const afficherFormBienBtn = document.getElementById("afficher-form-bien-btn");
const afficherDemandesPaiementBtn = document.getElementById("afficher-demandes-paiement-btn");
const afficherProfilBtn = document.getElementById("afficher-profil-btn");
const logoutBtn = document.getElementById('logout-btn');

// Références aux champs du profil
const profilEntrepriseNameInput = document.getElementById("profil-entrepriseName");
const profilEmailInput = document.getElementById("profil-email");
const profilContactInput = document.getElementById("profil-contact");
const profilWhatsappInput = document.getElementById("profil-whatsapp"); // ---> NOUVEAU <---


// Fonction afficherNotification (améliorée pour gérer différents IDs)
function afficherNotification(message, type, notificationId = "notification") {
    const notification = document.getElementById(notificationId);
    if (notification) {
        notification.textContent = message;
        notification.className = `notification ${type}`;
        notification.style.display = "block";

        setTimeout(() => {
            notification.style.display = "none";
        }, 5000);
    } else {
        console.warn(`Notification element with ID "${notificationId}" not found.`);
    }
}

//  AUTHENTIFICATION
// Fonction pour afficher la section de connexion
function showLogin() {
    if (loginSection) loginSection.style.display = 'block';
    if (signupSection) signupSection.style.display = 'none';
    if (mainContentSection) mainContentSection.style.display = 'none';
}

// Fonction pour afficher la section d'inscription
function showSignup() {
    if (loginSection) loginSection.style.display = 'none';
    if (signupSection) signupSection.style.display = 'block';
    if (mainContentSection) mainContentSection.style.display = 'none';
}

// Fonction pour afficher le contenu principal
function showMainContent() {
    if (loginSection) loginSection.style.display = 'none';
    if (signupSection) signupSection.style.display = 'none';
    if (mainContentSection) mainContentSection.style.display = 'block';
}

// Fonction pour masquer tous les formulaires/listes du contenu principal
function masquerToutContenuPrincipal() {
    if (formLogement) formLogement.style.display = "none";
    if (listeLogements) listeLogements.style.display = "none";
    if (formLocataire) formLocataire.style.display = "none";
    if (listeLocataires) listeLocataires.style.display = "none";
    if (formBien) formBien.style.display = "none";
    if (listeBiens) listeBiens.style.display = "none";
    if (formDemandePaiement) formDemandePaiement.style.display = "none";
    if (listeDemandesPaiement) listeDemandesPaiement.style.display = "none";
    if (profilSection) profilSection.style.display = "none";
}

// Gestionnaire d'état de connexion
auth.onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        showMainContent();
        masquerToutContenuPrincipal(); // Masquer tout au début

        // Charger les données initiales (elles seront affichées quand l'utilisateur clique sur le bouton correspondant)
        afficherLogements(); // Attache l'écouteur
        afficherLocataires(); // Attache l'écouteur
        afficherBiens(); // Attache l'écouteur
        afficherDemandesPaiement(); // Attache l'écouteur

        // Récupérer et afficher le nom de l'entreprise + Pré-remplissage
        const entrepriseNameElement = document.getElementById('entreprise-name');
        const demandeEtablissementInput = document.getElementById("demande-paiement-etablissement");

        database.ref(`entreprises/${currentUser.uid}`).once('value')
            .then((snapshot) => {
                const entrepriseData = snapshot.val();
                if (entrepriseData && entrepriseData.nom) {
                    if (entrepriseNameElement) {
                       entrepriseNameElement.textContent = entrepriseData.nom;
                    }
                    // Pré-remplit le champ établissement *uniquement* si le formulaire existe
                    if (demandeEtablissementInput) {
                        demandeEtablissementInput.value = entrepriseData.nom;
                    }
                } else if(entrepriseNameElement) {
                     entrepriseNameElement.textContent = "[Nom non défini]";
                }
            })
            .catch((error) => {
                console.error("Erreur lors de la récupération des données de l'entreprise:", error);
                 if (entrepriseNameElement) {
                     entrepriseNameElement.textContent = "[Erreur chargement]";
                 }
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

        const entrepriseName = document.getElementById('entrepriseName').value.trim();
        const email = document.getElementById('signup-email').value.trim();
        const contact = document.getElementById('contact').value.trim();
        const password = document.getElementById('signup-password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const termsCheckbox = document.getElementById('terms-checkbox');

        if (!entrepriseName || !email || !contact || !password || !confirmPassword) {
             afficherNotification("Veuillez remplir tous les champs.", "error", "signup-notification");
             return;
        }

        if (password !== confirmPassword) {
            afficherNotification("Les mots de passe ne correspondent pas.", "error", "signup-notification");
            return;
        }
        if (password.length < 6) {
            afficherNotification("Le mot de passe doit contenir au moins 6 caractères.", "error", "signup-notification");
            return;
        }
        if (!termsCheckbox || !termsCheckbox.checked) {
            afficherNotification("Vous devez accepter les termes et conditions.", "error", "signup-notification");
            return;
        }

        auth.createUserWithEmailAndPassword(email, password)
            .then((userCredential) => {
                const entrepriseId = userCredential.user.uid;
                // Stocke les informations de l'entreprise dans la base de données
                return database.ref('entreprises/' + entrepriseId).set({
                    nom: entrepriseName,
                    email: email, // Stocke aussi l'email pour référence facile
                    contact: contact,
                    whatsapp: '', // ---> NOUVEAU: Initialize whatsapp field as empty <---
                    dateCreation: firebase.database.ServerValue.TIMESTAMP // Optionnel: date de création
                });
            })
            .then(() => {
                 afficherNotification("Inscription réussie! Vous pouvez maintenant vous connecter.", "success", 'signup-notification');
                 signupForm.reset(); // Vide le formulaire
                 setTimeout(showLogin, 2000); // Redirige vers login après 2s
            })
            .catch((error) => {
                console.error("Erreur lors de l'inscription:", error);
                let message = "Erreur lors de l'inscription.";
                if (error.code === 'auth/email-already-in-use') {
                    message = "Cet email est déjà utilisé.";
                } else if (error.code === 'auth/invalid-email') {
                    message = "L'adresse email n'est pas valide.";
                } else if (error.code === 'auth/weak-password') {
                    message = "Le mot de passe est trop faible.";
                }
                 afficherNotification(message + " " + error.message, "error", 'signup-notification');
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

         if (!email || !password) {
             afficherNotification("Veuillez entrer l'email et le mot de passe.", "error", "notification");
             return;
         }

        auth.signInWithEmailAndPassword(email, password).then((userCredential) => {
                // Succès géré par onAuthStateChanged
            })
            .catch((error) => {
                console.error("Erreur lors de la connexion:", error);
                let message = "Erreur de connexion.";
                 if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                    message = "Email ou mot de passe incorrect.";
                } else if (error.code === 'auth/invalid-email') {
                     message = "Format d'email invalide.";
                }
                 afficherNotification(message, "error", "notification");
            });
    });
}

// Déconnexion
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        auth.signOut()
            .then(() => {
                // Géré par onAuthStateChanged
                 console.log("Déconnexion réussie");
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

if(showSignupLink) {
    showSignupLink.addEventListener('click', (e) => {
        e.preventDefault();
        showSignup();
    });
}

if(showLoginLink) {
    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        showLogin();
    });
}


//  FONCTION UPLOAD D'IMAGE (Commune)
async function uploadImage(file, folder) {
    if (!currentUser) throw new Error("Utilisateur non connecté pour l'upload.");
    if (!file) throw new Error("Aucun fichier sélectionné pour l'upload.");
    if (!storage) throw new Error("Firebase Storage non initialisé.");

    const storageRef = storage.ref(`${currentUser.uid}/${folder}/${Date.now()}_${file.name}`);
    console.log(`Uploading ${file.name} to ${storageRef.fullPath}`);

    try {
        const uploadTask = storageRef.put(file);
        const snapshot = await uploadTask;
        console.log('Upload successful:', snapshot);
        const downloadURL = await snapshot.ref.getDownloadURL();
        console.log('File available at', downloadURL);
        return downloadURL;

    } catch (error) {
        console.error("Erreur lors de l'upload:", error.code, error.message);
        switch (error.code) {
          case 'storage/unauthorized':
            throw new Error("Permission refusée. Vérifiez les règles de sécurité de Firebase Storage.");
          case 'storage/canceled':
            throw new Error("Upload annulé.");
          default:
            throw new Error("Erreur inconnue lors de l'upload de l'image.");
        }
    }
}


//  FONCTIONS LOGEMENTS
async function ajouterOuModifierLogement(event) {
    event.preventDefault();
    if (!currentUser || !formLogement) return;

    const boutonSubmit = formLogement.querySelector("button[type='submit']");
    boutonSubmit.disabled = true;
    boutonSubmit.textContent = editingLogementId ? "Modification..." : "Ajout...";

    const titre = document.getElementById("titre").value.trim();
    const type = document.getElementById("type").value;
    const description = document.getElementById("description").value.trim();
    const etat = document.getElementById("etat").value;
    const prixInput = document.getElementById("prix");
    const prix = prixInput.value ? parseInt(prixInput.value) : 0;
    const demarcheur = document.getElementById("demarcheur").value;
    const proprietaire = document.getElementById("proprietaire").value.trim();
    const quartier = document.getElementById("quartier").value.trim();
    const ville = document.getElementById("ville").value.trim();
    const statut = document.getElementById("statut").value;
    const imageInput = document.getElementById("image");
    const imageFile = imageInput.files[0];

    if (!titre || !type || !description || !etat || prix <= 0 || !demarcheur || !proprietaire || !quartier || !ville || !statut) {
         afficherNotification("Veuillez remplir tous les champs requis et vérifier le prix.", "error");
         boutonSubmit.disabled = false;
         boutonSubmit.textContent = editingLogementId ? "Modifier" : "Ajouter";
         return;
    }
    if (!editingLogementId && !imageFile) {
        afficherNotification("Veuillez sélectionner une image pour un nouveau logement.", "error");
        boutonSubmit.disabled = false;
        boutonSubmit.textContent = "Ajouter";
        return;
    }

    try {
        let imageUrl = null;
        if (imageFile) {
            imageUrl = await uploadImage(imageFile, 'logements');
        }

        const logementData = {
            titre, type, description, etat, prix, demarcheur, proprietaire, quartier, ville, statut,
             derniereModification: firebase.database.ServerValue.TIMESTAMP,
             // Add datePublication on creation or update if missing
             datePublication: firebase.database.ServerValue.TIMESTAMP
        };

        if (editingLogementId) {
             if (imageUrl) {
                logementData.image = imageUrl;
            } else {
                 const snapshot = await database.ref(`entreprises/${currentUser.uid}/logements/${editingLogementId}/image`).once('value');
                 logementData.image = snapshot.val();
             }
             // Make sure datePublication exists on update if it was missing
             const existingDataSnapshot = await database.ref(`entreprises/${currentUser.uid}/logements/${editingLogementId}`).once('value');
             if (!existingDataSnapshot.val()?.datePublication) {
                 logementData.datePublication = firebase.database.ServerValue.TIMESTAMP; // Add if missing
             } else {
                 delete logementData.datePublication; // Don't overwrite if exists
             }

            await database.ref(`entreprises/${currentUser.uid}/logements/${editingLogementId}`).update(logementData);
            afficherNotification("Logement modifié avec succès !", "success");
            editingLogementId = null;
        } else {
            if (!imageUrl) {
                 throw new Error("URL d'image manquante pour un nouveau logement.");
            }
            logementData.image = imageUrl;
            logementData.dateCreation = firebase.database.ServerValue.TIMESTAMP;
            logementData.datePublication = firebase.database.ServerValue.TIMESTAMP; // Set on creation
            await database.ref(`entreprises/${currentUser.uid}/logements`).push(logementData);
            afficherNotification("Logement ajouté avec succès !", "success");
        }

        formLogement.reset();
        imageInput.value = '';
        boutonSubmit.textContent = "Ajouter";

    } catch (error) {
        console.error("Erreur lors de l'ajout/modification du logement :", error);
        afficherNotification(`Erreur: ${error.message}`, "error");
        boutonSubmit.textContent = editingLogementId ? "Modifier" : "Ajouter";
    } finally {
         boutonSubmit.disabled = false;
    }
}

function editerLogement(id) {
    if (!currentUser || !formLogement) return;
    editingLogementId = id;

    const ref = database.ref(`entreprises/${currentUser.uid}/logements/${id}`);
    ref.once('value', (snapshot) => {
        const logement = snapshot.val();
        if (logement) {
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
            document.getElementById("image").value = '';

            const boutonSubmit = formLogement.querySelector("button[type='submit']");
            boutonSubmit.textContent = "Modifier";

             masquerToutContenuPrincipal();
             formLogement.style.display = "block";
             listeLogements.style.display = "block";
            formLogement.scrollIntoView({ behavior: "smooth", block: "start" });

        } else {
            console.error("Aucune donnée trouvée pour ce logement ID:", id);
            afficherNotification("Impossible de charger les données du logement pour l'édition.", "error");
            editingLogementId = null;
        }
    }, (error) => {
         console.error("Erreur Firebase lors du chargement du logement pour édition:", error);
         afficherNotification("Erreur de chargement des données.", "error");
         editingLogementId = null;
    });
}

function supprimerLogement(id) {
    if (!currentUser) return;
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce logement ? Cette action est irréversible.")) {
        return;
    }

    // Optional: Delete image from storage first
    database.ref(`entreprises/${currentUser.uid}/logements/${id}/image`).once('value', (snapshot) => {
        const imageUrl = snapshot.val();
        if (imageUrl) {
            try {
                 const imageRef = storage.refFromURL(imageUrl);
                 imageRef.delete().then(() => {
                     console.log("Image associée supprimée du Storage.");
                 }).catch(err => {
                     console.error("Erreur suppression image Storage:", err);
                     // Continue deleting DB entry even if image deletion fails
                 });
            } catch (e) {
                 console.error("Erreur lors de la création de la référence Storage:", e);
            }
        }
    }).finally(() => {
         // Delete database entry regardless of image deletion result
         database.ref(`entreprises/${currentUser.uid}/logements/${id}`).remove()
            .then(() => {
                afficherNotification("Logement supprimé avec succès !", "success");
            })
            .catch((error) => {
                console.error("Erreur lors de la suppression du logement (DB):", error);
                afficherNotification("Erreur lors de la suppression du logement.", "error");
            });
     });
}

function changerStatutLogement(id, statutActuel) {
     if (!currentUser) return;

    let nouveauStatut;
    switch (statutActuel) {
        case 'Libre':   nouveauStatut = 'Réservé'; break;
        case 'Réservé': nouveauStatut = 'Occupé';  break;
        case 'Occupé':  nouveauStatut = 'Libre';   break;
        default:        nouveauStatut = 'Libre';
    }

    database.ref(`entreprises/${currentUser.uid}/logements/${id}`).update({ statut: nouveauStatut })
        .then(() => { /* Notification optionnelle */ })
        .catch((error) => {
            console.error("Erreur lors de la mise à jour du statut:", error);
            afficherNotification("Erreur lors de la mise à jour du statut", "error");
        });
}

// --- Helper to add data-label for mobile table view ---
function addDataLabelsToTable(tableId) {
    const table = document.getElementById(tableId);
    if (!table) return;
    const headers = [];
    table.querySelectorAll('thead th').forEach(th => headers.push(th.innerText.trim()));

    table.querySelectorAll('tbody tr').forEach(tr => {
        tr.querySelectorAll('td').forEach((td, index) => {
            if (headers[index]) { // Ensure header exists
                td.setAttribute('data-label', headers[index] + ': ');
            }
        });
    });
}


function afficherLogements() {
    if (!currentUser) return;

    const tbody = document.getElementById("tbody-logements");
    const ref = database.ref(`entreprises/${currentUser.uid}/logements`);

    ref.on('value', (snapshot) => {
        if (!tbody) return;
        tbody.innerHTML = "";

        if (!snapshot.exists()) {
             tbody.innerHTML = "<tr><td colspan='13'>Aucun logement enregistré.</td></tr>";
             calculerStatistiquesLogements(null);
             return;
        }

        const logementsData = snapshot.val();
        // Sort logements by dateCreation (newest first) before displaying
         const sortedLogements = Object.entries(logementsData)
            .map(([id, data]) => ({ id, ...data })) // Combine ID with data
            .sort((a, b) => (b.dateCreation || 0) - (a.dateCreation || 0)); // Sort

        sortedLogements.forEach((logement) => {
            const id = logement.id;
             const tr = document.createElement("tr");
             tr.innerHTML = `
                <td>${id.substring(0, 6)}...</td>
                <td>${logement.titre || 'N/A'}</td>
                <td>${logement.type || 'N/A'}</td>
                <td>${(logement.description || 'N/A').substring(0, 30)}...</td>
                <td>${logement.etat || 'N/A'}</td>
                <td>${logement.prix ? logement.prix.toLocaleString('fr-FR') + ' FCFA' : 'N/A'}</td>
                <td>${logement.demarcheur || 'N/A'}</td>
                <td>${logement.proprietaire || 'N/A'}</td>
                <td>${logement.quartier || 'N/A'}</td>
                <td>${logement.ville || 'N/A'}</td>
                <td>${logement.image ? `<img src="${logement.image}" alt="${logement.titre || 'Image'}" width="50" height="auto" style="cursor:pointer;" onclick="window.open('${logement.image}', '_blank')">` : 'Aucune'}</td>
                <td><span class="statut-${(logement.statut || 'libre').toLowerCase()}">${logement.statut || 'Libre'}</span></td>
                <td class="action-buttons">
                    <button onclick="editerLogement('${id}')" title="Éditer"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-square" viewBox="0 0 16 16"><path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/><path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5z"/></svg></button>
                    <button onclick="supprimerLogement('${id}')" title="Supprimer"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash3-fill" viewBox="0 0 16 16"><path d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5m-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5M4.5 5.029l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06m6.53-.528a.5.5 0 0 0-.528.47l-.5 8.5a.5.5 0 0 0 .998.058l.5-8.5a.5.5 0 0 0-.47-.528M8 4.5a.5.5 0 0 0-.5.5v8.5a.5.5 0 0 0 1 0V5a.5.5 0 0 0-.5-.5"/></svg></button>
                    <button onclick="changerStatutLogement('${id}', '${logement.statut || 'Libre'}')" title="Changer Statut">
                         ${logement.statut === 'Libre' ? '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-bookmark-plus-fill" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M2 15.5V2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v13.5a.5.5 0 0 1-.74.439L8 13.069l-5.26 2.87A.5.5 0 0 1 2 15.5m6.5-11a.5.5 0 0 0-1 0V6H6a.5.5 0 0 0 0 1h1.5v1.5a.5.5 0 0 0 1 0V7H10a.5.5 0 0 0 0-1H8.5z"/></svg>' : (logement.statut === 'Réservé' ? '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-building-fill-check" viewBox="0 0 16 16"><path d="M12.5 16a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7m1.679-4.493-1.335 2.226a.75.75 0 0 1-1.174.144l-.774-.773a.5.5 0 0 1 .708-.708l.547.548 1.17-1.951a.5.5 0 1 1 .858.514Z"/><path d="M2 1a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v7.256A4.5 4.5 0 0 0 12.5 8a4.5 4.5 0 0 0-3 1.07V1H3v14h3v-2.5a.5.5 0 0 1 .5-.5H8v4H3a1 1 0 0 1-1-1z"/><path d="M4.5 6.5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5zm3 0a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5zm3 0a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5zm-6 3a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5zm3 0a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5z"/></svg>' : '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-door-open-fill" viewBox="0 0 16 16"><path d="M1.5 15a.5.5 0 0 0 0 1h13a.5.5 0 0 0 0-1H13V2.5A1.5 1.5 0 0 0 11.5 1H11V.5a.5.5 0 0 0-.57-.495l-7 1A.5.5 0 0 0 3 1.5V15zM11 2h.5a.5.5 0 0 1 .5.5V15h-1zM6.5 10h-.081l-.287-.845A.5.5 0 0 1 6.561 9h.878a.5.5 0 0 1 .46.289L7.58 10H7.5a.5.5 0 0 1 0 1h.081l.287.846a.5.5 0 0 1-.46.654H6.561a.5.5 0 0 1-.459-.654L6.16 11H6.5a.5.5 0 0 1 0-1"/></svg>')}
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        addDataLabelsToTable("table-logements"); // Add labels for mobile view
        calculerStatistiquesLogements(logementsData);

    }, (error) => {
        console.error("Erreur Firebase lors de l'écoute des logements:", error);
        if(tbody) tbody.innerHTML = "<tr><td colspan='13'>Erreur lors du chargement des données.</td></tr>";
        calculerStatistiquesLogements(null);
    });
}

// Attacher le listener au formulaire logement
if (formLogement) {
  formLogement.addEventListener("submit", ajouterOuModifierLogement);
}


//  FONCTIONS LOCATAIRES
function ajouterOuModifierLocataire(event) {
    event.preventDefault();
    if (!currentUser || !formLocataire) return;

     const boutonSubmit = formLocataire.querySelector("button[type='submit']");
     boutonSubmit.disabled = true;
     boutonSubmit.textContent = editingLocataireId ? "Modification..." : "Ajout...";

    const nom = document.getElementById("nom").value.trim();
    const prenoms = document.getElementById("prenoms").value.trim();
    const adresse = document.getElementById("adresse").value.trim();
    const email = document.getElementById("email").value.trim().toLowerCase();
    const facebook = document.getElementById("facebook").value.trim();
    const contact = document.getElementById("contactLocataire").value.trim();

     if (!nom || !prenoms || !adresse || !email || !contact) {
         afficherNotification("Veuillez remplir tous les champs obligatoires.", "error");
         boutonSubmit.disabled = false;
         boutonSubmit.textContent = editingLocataireId ? "Modifier" : "Ajouter";
         return;
     }
     if (!/^\S+@\S+\.\S+$/.test(email)) {
         afficherNotification("Veuillez entrer une adresse email valide.", "error");
          boutonSubmit.disabled = false;
         boutonSubmit.textContent = editingLocataireId ? "Modifier" : "Ajouter";
         return;
     }

    const locataireData = {
        nom, prenoms, adresse, email, facebook, contact,
        derniereModification: firebase.database.ServerValue.TIMESTAMP
    };

    const refPath = `entreprises/${currentUser.uid}/locataires`;
    let actionPromise;

    if (editingLocataireId) {
        actionPromise = database.ref(`${refPath}/${editingLocataireId}`).update(locataireData);
    } else {
         locataireData.dateCreation = firebase.database.ServerValue.TIMESTAMP;
        actionPromise = database.ref(refPath).push(locataireData);
    }

    actionPromise.then(() => {
        afficherNotification(editingLocataireId ? "Locataire modifié avec succès !" : "Locataire ajouté avec succès !", "success");
        formLocataire.reset();
        editingLocataireId = null;
        boutonSubmit.textContent = "Ajouter";
    }).catch((error) => {
        console.error("Erreur lors de l'ajout/modification du locataire :", error);
        afficherNotification("Erreur lors de l'opération.", "error");
         boutonSubmit.textContent = editingLocataireId ? "Modifier" : "Ajouter";
    }).finally(() => {
         boutonSubmit.disabled = false;
    });
}


function editerLocataire(id) {
    if (!currentUser || !formLocataire) return;
    editingLocataireId = id;

    const ref = database.ref(`entreprises/${currentUser.uid}/locataires/${id}`);
    ref.once('value', (snapshot) => {
        const locataire = snapshot.val();
        if (locataire) {
            document.getElementById("nom").value = locataire.nom || '';
            document.getElementById("prenoms").value = locataire.prenoms || '';
            document.getElementById("adresse").value = locataire.adresse || '';
            document.getElementById("email").value = locataire.email || '';
            document.getElementById("facebook").value = locataire.facebook || '';
            document.getElementById("contactLocataire").value = locataire.contact || '';

            const boutonSubmit = formLocataire.querySelector("button[type='submit']");
            boutonSubmit.textContent = "Modifier";

             masquerToutContenuPrincipal();
             formLocataire.style.display = "block";
             listeLocataires.style.display = "block";
             formLocataire.scrollIntoView({ behavior: "smooth", block: "start" });

        } else {
            console.error("Aucune donnée trouvée pour ce locataire ID:", id);
            afficherNotification("Impossible de charger les données du locataire.", "error");
            editingLocataireId = null;
        }
    }, (error) => {
         console.error("Erreur Firebase lors du chargement du locataire:", error);
         afficherNotification("Erreur de chargement des données.", "error");
         editingLocataireId = null;
    });
}


function supprimerLocataire(id) {
    if (!currentUser) return;
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce locataire ?")) {
        return;
    }

    database.ref(`entreprises/${currentUser.uid}/locataires/${id}`).remove()
        .then(() => {
            afficherNotification("Locataire supprimé avec succès !", "success");
        })
        .catch((error) => {
            console.error("Erreur lors de la suppression du locataire :", error);
            afficherNotification("Erreur lors de la suppression.", "error");
        });
}


function afficherLocataires() {
    if (!currentUser) return;

    const tbody = document.getElementById("tbody-locataires");
    const ref = database.ref(`entreprises/${currentUser.uid}/locataires`);

    ref.orderByChild('nom').on('value', (snapshot) => { // Sort by name
        if (!tbody) return;
        tbody.innerHTML = "";

        if (!snapshot.exists()) {
             tbody.innerHTML = "<tr><td colspan='8'>Aucun locataire enregistré.</td></tr>";
             return;
        }

        snapshot.forEach((childSnapshot) => {
            const locataire = childSnapshot.val();
            const id = childSnapshot.key;

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${id.substring(0, 6)}...</td>
                <td>${locataire.nom || 'N/A'}</td>
                <td>${locataire.prenoms || 'N/A'}</td>
                <td>${locataire.adresse || 'N/A'}</td>
                <td>${locataire.email || 'N/A'}</td>
                <td>${locataire.facebook ? `<a href="${locataire.facebook.startsWith('http') ? '' : '//'}${locataire.facebook}" target="_blank" rel="noopener noreferrer">Voir Profil</a>` : 'N/A'}</td>
                <td>${locataire.contact || 'N/A'}</td>
                <td class="action-buttons">
                     <button onclick="editerLocataire('${id}')" title="Éditer"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-square" viewBox="0 0 16 16"><path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/><path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5z"/></svg></button>
                     <button onclick="supprimerLocataire('${id}')" title="Supprimer"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash3-fill" viewBox="0 0 16 16"><path d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5m-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5M4.5 5.029l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06m6.53-.528a.5.5 0 0 0-.528.47l-.5 8.5a.5.5 0 0 0 .998.058l.5-8.5a.5.5 0 0 0-.47-.528M8 4.5a.5.5 0 0 0-.5.5v8.5a.5.5 0 0 0 1 0V5a.5.5 0 0 0-.5-.5"/></svg></button>
                </td>
            `;
            tbody.appendChild(tr);
        });
        addDataLabelsToTable("table-locataires"); // Add labels for mobile view
    }, (error) => {
        console.error("Erreur Firebase lors de l'écoute des locataires:", error);
        if(tbody) tbody.innerHTML = "<tr><td colspan='8'>Erreur lors du chargement des données.</td></tr>";
    });
}

// Attacher le listener au formulaire locataire
if (formLocataire) {
    formLocataire.addEventListener("submit", ajouterOuModifierLocataire);
}


//  FONCTIONS BIENS (Terrains, etc.)
async function ajouterOuModifierBien(event) {
    event.preventDefault();
    if (!currentUser || !formBien) return;

    const boutonSubmit = formBien.querySelector("button[type='submit']");
    boutonSubmit.disabled = true;
    boutonSubmit.textContent = editingBienId ? "Modification..." : "Ajout...";

    const titre = document.getElementById("titreBien").value.trim();
    const description = document.getElementById("descriptionBien").value.trim();
    const etat = document.getElementById("etatBien").value;
    const prixInput = document.getElementById("prixBien");
    const prix = prixInput.value ? parseInt(prixInput.value) : 0;
    const proprietaire = document.getElementById("proprietaireBien").value.trim();
    const ville = document.getElementById("villeBien").value.trim();
    const imageInput = document.getElementById("imageBien");
    const imageFile = imageInput.files[0];

     if (!titre || !description || !etat || prix <= 0 || !proprietaire || !ville) {
         afficherNotification("Veuillez remplir tous les champs requis et vérifier le prix.", "error");
         boutonSubmit.disabled = false;
         boutonSubmit.textContent = editingBienId ? "Modifier" : "Ajouter";
         return;
    }
     if (!editingBienId && !imageFile) {
        afficherNotification("Veuillez sélectionner une image pour un nouveau bien.", "error");
        boutonSubmit.disabled = false;
        boutonSubmit.textContent = "Ajouter";
        return;
    }

    try {
        let imageUrl = null;
        if (imageFile) {
            imageUrl = await uploadImage(imageFile, 'biens');
        }

        const bienData = {
            titre, description, etat, prix, proprietaire, ville,
            derniereModification: firebase.database.ServerValue.TIMESTAMP,
             // Add datePublication on creation or update if missing
             datePublication: firebase.database.ServerValue.TIMESTAMP
        };

        const refPath = `entreprises/${currentUser.uid}/biens`;
        let actionPromise;

        if (editingBienId) {
             if (imageUrl) {
                bienData.image = imageUrl;
            } else {
                 const snapshot = await database.ref(`${refPath}/${editingBienId}/image`).once('value');
                 bienData.image = snapshot.val();
             }
             // Ensure datePublication exists on update
             const existingDataSnapshot = await database.ref(`${refPath}/${editingBienId}`).once('value');
             if (!existingDataSnapshot.val()?.datePublication) {
                 bienData.datePublication = firebase.database.ServerValue.TIMESTAMP;
             } else {
                 delete bienData.datePublication;
             }
            actionPromise = database.ref(`${refPath}/${editingBienId}`).update(bienData);
        } else {
            if (!imageUrl) throw new Error("URL d'image manquante pour un nouveau bien.");
            bienData.image = imageUrl;
             bienData.dateCreation = firebase.database.ServerValue.TIMESTAMP;
             bienData.datePublication = firebase.database.ServerValue.TIMESTAMP;
            actionPromise = database.ref(refPath).push(bienData);
        }

        await actionPromise;
        afficherNotification(editingBienId ? "Bien modifié avec succès !" : "Bien ajouté avec succès !", "success");
        formBien.reset();
        imageInput.value = '';
        editingBienId = null;
        boutonSubmit.textContent = "Ajouter";

    } catch (error) {
        console.error("Erreur lors de l'ajout/modification du bien :", error);
        afficherNotification(`Erreur: ${error.message}`, "error");
         boutonSubmit.textContent = editingBienId ? "Modifier" : "Ajouter";
    } finally {
         boutonSubmit.disabled = false;
    }
}


function editerBien(id) {
    if (!currentUser || !formBien) return;
    editingBienId = id;

    const ref = database.ref(`entreprises/${currentUser.uid}/biens/${id}`);
    ref.once('value', (snapshot) => {
        const bien = snapshot.val();
        if (bien) {
            document.getElementById("titreBien").value = bien.titre || '';
            document.getElementById("descriptionBien").value = bien.description || '';
            document.getElementById("etatBien").value = bien.etat || '';
            document.getElementById("prixBien").value = bien.prix || '';
            document.getElementById("proprietaireBien").value = bien.proprietaire || '';
            document.getElementById("villeBien").value = bien.ville || '';
            document.getElementById("imageBien").value = ''; // Ne pas pré-remplir

            const boutonSubmit = formBien.querySelector("button[type='submit']");
            boutonSubmit.textContent = "Modifier";

             masquerToutContenuPrincipal();
             formBien.style.display = "block";
             listeBiens.style.display = "block";
             formBien.scrollIntoView({ behavior: "smooth", block: "start" });
        } else {
            console.error("Aucune donnée trouvée pour ce bien ID:", id);
            afficherNotification("Impossible de charger les données du bien.", "error");
            editingBienId = null;
        }
    }, (error) => {
         console.error("Erreur Firebase lors du chargement du bien:", error);
         afficherNotification("Erreur de chargement des données.", "error");
         editingBienId = null;
    });
}

function supprimerBien(id) {
    if (!currentUser) return;
     if (!confirm("Êtes-vous sûr de vouloir supprimer ce bien ?")) {
        return;
    }
     // Optional: Delete image from storage first
    database.ref(`entreprises/${currentUser.uid}/biens/${id}/image`).once('value', (snapshot) => {
        const imageUrl = snapshot.val();
        if (imageUrl) {
            try {
                 const imageRef = storage.refFromURL(imageUrl);
                 imageRef.delete().then(() => {
                     console.log("Image associée supprimée du Storage.");
                 }).catch(err => {
                     console.error("Erreur suppression image Storage:", err);
                 });
            } catch(e) {
                 console.error("Erreur création référence Storage:", e);
            }
        }
     }).finally(() => {
         database.ref(`entreprises/${currentUser.uid}/biens/${id}`).remove()
            .then(() => {
                afficherNotification("Bien supprimé avec succès!", "success");
            })
            .catch((error) => {
                console.error("Erreur lors de la suppression du bien (DB):", error);
                afficherNotification("Erreur lors de la suppression.", "error");
            });
     });
}


function afficherBiens() {
    if (!currentUser) return;

    const tbody = document.getElementById("tbody-biens");
    const ref = database.ref(`entreprises/${currentUser.uid}/biens`);

    ref.on('value', (snapshot) => {
         if (!tbody) return;
         tbody.innerHTML = "";

        if (!snapshot.exists()) {
             tbody.innerHTML = "<tr><td colspan='9'>Aucun bien enregistré.</td></tr>";
             return;
        }

         // Sort biens by dateCreation (newest first)
         const sortedBiens = Object.entries(snapshot.val())
             .map(([id, data]) => ({ id, ...data }))
             .sort((a, b) => (b.dateCreation || 0) - (a.dateCreation || 0));

        sortedBiens.forEach((bien) => {
            const id = bien.id;
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${id.substring(0, 6)}...</td>
                <td>${bien.titre || 'N/A'}</td>
                <td>${(bien.description || 'N/A').substring(0, 30)}...</td>
                <td>${bien.etat || 'N/A'}</td>
                 <td>${bien.prix ? bien.prix.toLocaleString('fr-FR') + ' FCFA' : 'N/A'}</td>
                <td>${bien.proprietaire || 'N/A'}</td>
                <td>${bien.ville || 'N/A'}</td>
                <td>${bien.image ? `<img src="${bien.image}" alt="${bien.titre || 'Image'}" width="50" height="auto" style="cursor:pointer;" onclick="window.open('${bien.image}', '_blank')">` : 'Aucune'}</td>
                <td class="action-buttons">
                     <button onclick="editerBien('${id}')" title="Éditer"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-square" viewBox="0 0 16 16"><path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/><path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5z"/></svg></button>
                    <button onclick="supprimerBien('${id}')" title="Supprimer"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash3-fill" viewBox="0 0 16 16"><path d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5m-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5M4.5 5.029l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06m6.53-.528a.5.5 0 0 0-.528.47l-.5 8.5a.5.5 0 0 0 .998.058l.5-8.5a.5.5 0 0 0-.47-.528M8 4.5a.5.5 0 0 0-.5.5v8.5a.5.5 0 0 0 1 0V5a.5.5 0 0 0-.5-.5"/></svg></button>
                </td>
            `;
            tbody.appendChild(tr);
        });
        addDataLabelsToTable("table-biens"); // Add labels for mobile view
    }, (error) => {
        console.error("Erreur Firebase lors de l'écoute des biens:", error);
        if(tbody) tbody.innerHTML = "<tr><td colspan='9'>Erreur lors du chargement des données.</td></tr>";
    });
}

// Attacher le listener au formulaire bien
if (formBien) {
    formBien.addEventListener("submit", ajouterOuModifierBien);
}


//  STATISTIQUES LOGEMENTS
function calculerStatistiquesLogements(logementsData) {
    const statsLibres = document.getElementById('stat-logements-libres');
    const statsReserves = document.getElementById('stat-logements-reserves');
    const statsOccupes = document.getElementById('stat-logements-occupes');
    const statsMensuel = document.getElementById('stat-logements-total-mensuel');
    const statsAnnuel = document.getElementById('stat-logements-total-annuel');

    if (!statsLibres || !statsReserves || !statsOccupes || !statsMensuel || !statsAnnuel) {
        console.warn("Certains éléments de statistiques sont manquants dans le DOM.");
        return;
    }

    if (!logementsData) {
        statsLibres.textContent = 0; statsReserves.textContent = 0; statsOccupes.textContent = 0;
        statsMensuel.textContent = 0; statsAnnuel.textContent = 0;
        return;
    }

    const dateActuelle = new Date();
    const moisActuel = dateActuelle.getMonth();
    const anneeActuelle = dateActuelle.getFullYear();
    let libres = 0, reserves = 0, occupes = 0;
    let totalMensuel = 0, totalAnnuel = 0;

    Object.values(logementsData).forEach(logement => {
        const statut = logement.statut || 'Libre';
        if (statut === 'Libre') libres++;
        else if (statut === 'Réservé') reserves++;
        else if (statut === 'Occupé') occupes++;

        // Use dateCreation for counting monthly/annual totals
        if (logement.dateCreation) {
            try {
                const creationDate = new Date(logement.dateCreation);
                if (!isNaN(creationDate)) { // Check if date is valid
                     const creationMois = creationDate.getMonth();
                     const creationAnnee = creationDate.getFullYear();
                     if (creationAnnee === anneeActuelle) {
                        totalAnnuel++;
                        if (creationMois === moisActuel) { totalMensuel++; }
                    }
                }
            } catch(e) { console.warn("Invalid dateCreation format:", logement.dateCreation); }
        }
    });

    statsLibres.textContent = libres; statsReserves.textContent = reserves; statsOccupes.textContent = occupes;
    statsMensuel.textContent = totalMensuel; statsAnnuel.textContent = totalAnnuel;
}


// ---------- DEMANDES DE PAIEMENT ----------

function ajouterDemandePaiement(event) {
    event.preventDefault();
    if (!currentUser || !formDemandePaiement) return;

    const boutonSubmit = formDemandePaiement.querySelector("button[type='submit']");
    boutonSubmit.disabled = true;
    boutonSubmit.textContent = "Envoi...";

    const etablissement = document.getElementById("demande-paiement-etablissement").value;
    const montantInput = document.getElementById("demande-paiement-montant");
    const montant = montantInput.value ? parseInt(montantInput.value) : 0;
    const situation = document.getElementById("demande-paiement-situation").value.trim();
    const date = firebase.database.ServerValue.TIMESTAMP;
    const statut = "En attente";

     if (!etablissement || montant <= 0 || !situation) {
         afficherNotification("Veuillez vérifier le montant et la situation de la demande.", "error");
         boutonSubmit.disabled = false;
         boutonSubmit.textContent = "Soumettre la Demande";
         return;
     }

    const nouvelleDemandeRef = database.ref(`entreprises/${currentUser.uid}/demandesPaiement`).push();
    nouvelleDemandeRef.set({
        date, etablissement, montant, situation, statut,
        demandeurId: currentUser.uid
    })
    .then(() => {
        afficherNotification("Demande de paiement soumise avec succès !", "success");
         montantInput.value = '';
         document.getElementById("demande-paiement-situation").value = '';
    })
    .catch((error) => {
        console.error("Erreur lors de la soumission de la demande :", error);
        afficherNotification("Erreur lors de la soumission.", "error");
    }).finally(() => {
         boutonSubmit.disabled = false;
         boutonSubmit.textContent = "Soumettre la Demande";
    });
}


function afficherDemandesPaiement() {
    if (!currentUser) return;

    const tbody = document.getElementById("tbody-demandes-paiement");
    const ref = database.ref(`entreprises/${currentUser.uid}/demandesPaiement`);

    ref.orderByChild('date').on('value', (snapshot) => {
        if (!tbody) return;
        tbody.innerHTML = "";

         if (!snapshot.exists()) {
             tbody.innerHTML = "<tr><td colspan='6'>Aucune demande de paiement.</td></tr>";
             return;
         }

         let demandesArray = [];
         snapshot.forEach((childSnapshot) => {
            demandesArray.push({ id: childSnapshot.key, ...childSnapshot.val() });
         });
         demandesArray.reverse();


         demandesArray.forEach((demande) => {
             const tr = document.createElement("tr");
             const dateLisible = demande.date ? new Date(demande.date).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short'}) : 'N/A';
             tr.innerHTML = `
                <td>${demande.id.substring(0, 6)}...</td>
                <td>${dateLisible}</td>
                <td>${demande.etablissement || 'N/A'}</td>
                <td>${demande.montant ? demande.montant.toLocaleString('fr-FR') + ' FCFA' : 'N/A'}</td>
                <td>${demande.situation || 'N/A'}</td>
                <td><span class="statut-paiement-${(demande.statut || 'attente').toLowerCase().replace(/\s+/g, '-')}">${demande.statut || 'N/A'}</span></td>
            `;
            tbody.appendChild(tr);
         });
         addDataLabelsToTable("table-demandes-paiement"); // Add labels for mobile view

    }, (error) => {
        console.error("Erreur Firebase lors de l'écoute des demandes:", error);
        if(tbody) tbody.innerHTML = "<tr><td colspan='6'>Erreur lors du chargement des données.</td></tr>";
    });
}

// Attacher listener au formulaire de demande
if (formDemandePaiement) {
    formDemandePaiement.addEventListener("submit", ajouterDemandePaiement);
}

// ---------- PROFIL ADMINISTRATEUR ----------

// Fonction pour afficher les informations du profil actuel
function afficherProfilAdmin() {
    if (!currentUser || !profilSection) return;

    const entrepriseRef = database.ref(`entreprises/${currentUser.uid}`);
    entrepriseRef.once('value')
        .then((snapshot) => {
            const entrepriseData = snapshot.val();
            if (entrepriseData) {
                if (profilEntrepriseNameInput) profilEntrepriseNameInput.value = entrepriseData.nom || '';
                if (profilEmailInput) {
                     profilEmailInput.value = currentUser.email;
                     profilEmailInput.readOnly = true;
                 }
                if (profilContactInput) profilContactInput.value = entrepriseData.contact || '';
                // ---> NOUVEAU: Load WhatsApp number <---
                if (profilWhatsappInput) profilWhatsappInput.value = entrepriseData.whatsapp || '';
                // ---> FIN NOUVEAU <---
            } else {
                 afficherNotification("Données de profil non trouvées.", "error", "profil-notification");
                 if (profilEmailInput) profilEmailInput.value = currentUser.email;
            }
        })
        .catch((error) => {
            console.error("Erreur lors du chargement du profil:", error);
            afficherNotification("Erreur lors du chargement du profil.", "error", "profil-notification");
             if (profilEmailInput) profilEmailInput.value = currentUser.email;
        });
}

// Fonction pour mettre à jour le profil
function mettreAJourProfilAdmin(event) {
    event.preventDefault();
    if (!currentUser || !formProfil) return;

    const boutonSubmit = formProfil.querySelector("button[type='submit']");
    boutonSubmit.disabled = true;
    boutonSubmit.textContent = "Mise à jour...";

    const nouveauNom = profilEntrepriseNameInput.value.trim();
    const nouveauContact = profilContactInput.value.trim();
    // ---> NOUVEAU: Get WhatsApp number <---
    const nouveauWhatsapp = profilWhatsappInput.value.trim().replace(/[^0-9+]/g, ''); // Allow '+' sign, remove others
    // ---> FIN NOUVEAU <---

     if (!nouveauNom || !nouveauContact) { // WhatsApp is optional
         afficherNotification("Le nom de l'entreprise et le contact principal sont requis.", "error", "profil-notification");
         boutonSubmit.disabled = false;
         boutonSubmit.textContent = "Mettre à jour le Profil";
         return;
     }

    const updates = {
        nom: nouveauNom,
        contact: nouveauContact,
        // ---> NOUVEAU: Add WhatsApp to updates <---
        whatsapp: nouveauWhatsapp, // Store the cleaned number, empty string if left blank
        // ---> FIN NOUVEAU <---
         derniereModification: firebase.database.ServerValue.TIMESTAMP
    };

    database.ref(`entreprises/${currentUser.uid}`).update(updates)
        .then(() => {
            afficherNotification("Profil mis à jour avec succès !", "success", "profil-notification");
            const entrepriseNameElement = document.getElementById('entreprise-name');
             if(entrepriseNameElement) entrepriseNameElement.textContent = nouveauNom;
             const demandeEtablissementInput = document.getElementById("demande-paiement-etablissement");
             if (demandeEtablissementInput) {
                 demandeEtablissementInput.value = nouveauNom;
             }
        })
        .catch((error) => {
            console.error("Erreur lors de la mise à jour du profil:", error);
            afficherNotification("Erreur lors de la mise à jour du profil.", "error", "profil-notification");
        })
         .finally(() => {
            boutonSubmit.disabled = false;
            boutonSubmit.textContent = "Mettre à jour le Profil";
        });
}

// Attacher le listener au formulaire de profil
if (formProfil) {
    formProfil.addEventListener("submit", mettreAJourProfilAdmin);
}


// GESTION DE L'AFFICHAGE DES SECTIONS via BOUTONS MENU
if (afficherFormLogementBtn) {
    afficherFormLogementBtn.addEventListener("click", () => {
        if (!currentUser) return;
        masquerToutContenuPrincipal();
        if (formLogement) formLogement.style.display = "block";
        if (listeLogements) listeLogements.style.display = "block";
         if (editingLogementId) {
            editingLogementId = null;
             if(formLogement) {
                 formLogement.reset();
                 formLogement.querySelector("button[type='submit']").textContent = "Ajouter";
                 document.getElementById("image").value = '';
             }
         }
    });
}

if (afficherFormLocataireBtn) {
    afficherFormLocataireBtn.addEventListener("click", () => {
        if (!currentUser) return;
        masquerToutContenuPrincipal();
        if (formLocataire) formLocataire.style.display = "block";
        if (listeLocataires) listeLocataires.style.display = "block";
         if (editingLocataireId) {
            editingLocataireId = null;
             if(formLocataire) {
                 formLocataire.reset();
                 formLocataire.querySelector("button[type='submit']").textContent = "Ajouter";
             }
         }
    });
}

if (afficherFormBienBtn) {
    afficherFormBienBtn.addEventListener("click", () => {
        if (!currentUser) return;
        masquerToutContenuPrincipal();
        if (formBien) formBien.style.display = "block";
        if (listeBiens) listeBiens.style.display = "block";
         if (editingBienId) {
            editingBienId = null;
             if(formBien) {
                 formBien.reset();
                 formBien.querySelector("button[type='submit']").textContent = "Ajouter";
                 document.getElementById("imageBien").value = '';
             }
         }
    });
}

if (afficherDemandesPaiementBtn) {
    afficherDemandesPaiementBtn.addEventListener("click", () => {
        if (!currentUser) return;
        masquerToutContenuPrincipal();
         const demandeEtablissementInput = document.getElementById("demande-paiement-etablissement");
         const entrepriseNameElement = document.getElementById('entreprise-name');
         if(demandeEtablissementInput && entrepriseNameElement && entrepriseNameElement.textContent !== "[Erreur chargement]" && entrepriseNameElement.textContent !== "[Nom non défini]") {
             demandeEtablissementInput.value = entrepriseNameElement.textContent;
         }
        if (formDemandePaiement) formDemandePaiement.style.display = "block";
        if (listeDemandesPaiement) listeDemandesPaiement.style.display = "block";
    });
}

if (afficherProfilBtn) {
    afficherProfilBtn.addEventListener("click", () => {
        if (!currentUser) return;
        masquerToutContenuPrincipal();
        afficherProfilAdmin(); // Charger les données actuelles
        if (profilSection) profilSection.style.display = "block";
    });
}


// ---------- EXPORTATION ----------
function getTableData(tableId) {
    const table = document.getElementById(tableId);
    if (!table) {
        console.error(`Table with ID "${tableId}" not found.`);
        return null;
    }
    const data = [];
    const headers = [];
    const skippedHeaders = ['image', 'actions']; // Headers to skip

    // Get headers, skipping specified ones
    table.querySelectorAll('thead th').forEach(th => {
        const headerText = th.innerText.trim().toLowerCase();
        if (!skippedHeaders.includes(headerText)) {
             headers.push(th.innerText.trim()); // Keep original case for display
        }
    });
    data.push(headers);

    // Get rows
    table.querySelectorAll('tbody tr').forEach(tr => {
        const rowData = [];
        // Keep track of original column index to map against original headers
        let originalColIndex = -1;
        tr.querySelectorAll('td').forEach(td => {
            originalColIndex++;
             const originalHeaderText = table.querySelector(`thead th:nth-child(${originalColIndex + 1})`)?.innerText.trim().toLowerCase();
             // Only add data if the original header wasn't skipped
             if (originalHeaderText && !skippedHeaders.includes(originalHeaderText)) {
                rowData.push(td.innerText.trim());
            }
        });
         if(rowData.length > 0) { // Add row only if it contains data for included columns
             data.push(rowData);
         }
    });

    return data;
}


function exportToExcel(tableId) {
     const data = getTableData(tableId);
     if (!data || data.length <= 1) {
        afficherNotification("Aucune donnée à exporter.", "error");
        return;
    }
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Données");
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `${tableId.replace('table-', '')}_export_${dateStr}.xlsx`;
    XLSX.writeFile(wb, filename);
     afficherNotification("Exportation Excel terminée.", "success");
}


function exportToPDF(tableId) {
     const data = getTableData(tableId);
     if (!data || data.length <= 1) {
         afficherNotification("Aucune donnée à exporter pour le PDF.", "error");
         return;
     }

    if (typeof jspdf === 'undefined' || typeof jspdf.jsPDF === 'undefined' || typeof jspdf.jsPDF.autoTable === 'undefined') {
         console.error("jsPDF or jsPDF-AutoTable is not loaded correctly.");
         afficherNotification("Erreur lors de la préparation du PDF (librairie manquante ou mal chargée).", "error");
         return;
     }
     // Ensure using the constructor from the window object if loaded globally
     const { jsPDF } = window.jspdf;
     const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

    const head = [data[0]];
    const body = data.slice(1);

    doc.autoTable({
        head: head,
        body: body,
        startY: 15,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak', halign: 'left' },
        headStyles: { fillColor: [0, 74, 173], textColor: 255, fontStyle: 'bold' },
        margin: { top: 15, left: 10, right: 10, bottom: 15 },
        didDrawPage: function (data) {
           doc.setFontSize(8);
           doc.text('Page ' + doc.internal.getNumberOfPages(), data.settings.margin.left, doc.internal.pageSize.height - 10);
           doc.text('Exporté de ESPACE BENIN Admin', doc.internal.pageSize.width - data.settings.margin.right, doc.internal.pageSize.height - 10, { align: 'right' });
        }
    });

    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `${tableId.replace('table-', '')}_export_${dateStr}.pdf`;
    doc.save(filename);
     afficherNotification("Exportation PDF terminée.", "success");
}


// Attacher les listeners aux boutons d'export
const exportButtons = document.querySelectorAll(".export-btn");
if (exportButtons) {
    exportButtons.forEach(button => {
        button.addEventListener("click", () => {
            const tableId = button.dataset.table;
            const format = button.dataset.format;

            if (!tableId) { console.error("Bouton d'export sans 'data-table' spécifié."); return; }
            if (format === "xlsx") { exportToExcel(tableId); }
            else if (format === "pdf") { exportToPDF(tableId); }
            else { console.warn(`Format d'export inconnu: ${format}`); }
        });
    });
}


// ---------- MODALES TERMES ET CONFIDENTIALITE ----------
const adminTermsModal = document.getElementById('admin-terms-modal');
const adminPrivacyModal = document.getElementById('admin-privacy-modal');

function openModal(modalElement) { if (modalElement) modalElement.style.display = 'block'; }
function closeModal(modalElement) { if (modalElement) modalElement.style.display = 'none'; }

const showAdminTermsLink = document.getElementById('show-admin-terms');
const showAdminPrivacyLink = document.getElementById('show-admin-privacy');

if (showAdminTermsLink && adminTermsModal) { showAdminTermsLink.addEventListener('click', (e) => { e.preventDefault(); openModal(adminTermsModal); }); }
if (showAdminPrivacyLink && adminPrivacyModal) { showAdminPrivacyLink.addEventListener('click', (e) => { e.preventDefault(); openModal(adminPrivacyModal); }); }

const closeButtons = document.querySelectorAll('.modal .close-button');
closeButtons.forEach(button => { button.addEventListener('click', () => closeModal(button.closest('.modal'))); });

window.addEventListener('click', (event) => { if (event.target.classList.contains('modal')) closeModal(event.target); });


// Initialisation: Afficher la section de connexion au chargement
document.addEventListener('DOMContentLoaded', () => {
    showLogin();
});
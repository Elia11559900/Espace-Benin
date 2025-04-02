// Configuration Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAwHqU_XLmDz9VbsxVGN3wbru3-hLDiyNI", // Masquer cette clé dans un environnement de production réel
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
const forgotPasswordSection = document.getElementById('forgot-password-section'); // NOUVEAU
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
const forgotPasswordForm = document.getElementById('forgot-password-form'); // NOUVEAU

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

// Références pour Mot de Passe Oublié (NOUVEAU)
const showForgotPasswordLink = document.getElementById('show-forgot-password');
const backToLoginLink = document.getElementById('back-to-login');
const forgotEmailInput = document.getElementById('forgot-email');


// Fonction afficherNotification (améliorée pour gérer différents IDs)
function afficherNotification(message, type, notificationId = "notification") {
    const notification = document.getElementById(notificationId);
    if (notification) {
        notification.textContent = message;
        notification.className = `notification ${type}`; // Assurez-vous que la classe de base est toujours présente
        notification.style.display = "block";

        setTimeout(() => {
            notification.style.display = "none";
        }, 5000); // Reste affiché 5 secondes
    } else {
        console.warn(`Notification element with ID "${notificationId}" not found.`);
    }
}

// --- GESTION DE L'AFFICHAGE DES SECTIONS INITIALES ---

// Fonction pour afficher la section de connexion
function showLogin() {
    if (loginSection) loginSection.style.display = 'block';
    if (signupSection) signupSection.style.display = 'none';
    if (forgotPasswordSection) forgotPasswordSection.style.display = 'none'; // Cacher aussi mot de passe oublié
    if (mainContentSection) mainContentSection.style.display = 'none';
}

// Fonction pour afficher la section d'inscription
function showSignup() {
    if (loginSection) loginSection.style.display = 'none';
    if (signupSection) signupSection.style.display = 'block';
    if (forgotPasswordSection) forgotPasswordSection.style.display = 'none'; // Cacher aussi mot de passe oublié
    if (mainContentSection) mainContentSection.style.display = 'none';
}

// Fonction pour afficher la section mot de passe oublié (NOUVEAU)
function showForgotPassword() {
    if (loginSection) loginSection.style.display = 'none';
    if (signupSection) signupSection.style.display = 'none';
    if (forgotPasswordSection) forgotPasswordSection.style.display = 'block';
    if (mainContentSection) mainContentSection.style.display = 'none';
}

// Fonction pour afficher le contenu principal (après connexion)
function showMainContent() {
    if (loginSection) loginSection.style.display = 'none';
    if (signupSection) signupSection.style.display = 'none';
    if (forgotPasswordSection) forgotPasswordSection.style.display = 'none'; // Cacher aussi mot de passe oublié
    if (mainContentSection) mainContentSection.style.display = 'block';
}

// Fonction pour masquer tous les formulaires/listes du contenu principal
function masquerToutContenuPrincipal() {
    // Cache toutes les sous-sections de mainContentSection
    const contentSections = mainContentSection?.querySelectorAll('.form-container, #liste-logements, #liste-locataires, #liste-biens, #liste-demandes-paiement');
    contentSections?.forEach(section => section.style.display = 'none');

    // Assurez-vous que les formulaires spécifiques sont aussi cachés s'ils ne sont pas des .form-container
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

// --- AUTHENTIFICATION ---

// Gestionnaire d'état de connexion
auth.onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        showMainContent();
        masquerToutContenuPrincipal(); // Masquer tout au début

        // Charger les données initiales (elles seront affichées quand l'utilisateur clique sur le bouton correspondant)
        // Ces fonctions attachent les écouteurs 'on value' qui mettront à jour les tables en temps réel
        afficherLogements();
        afficherLocataires();
        afficherBiens();
        afficherDemandesPaiement();

        // Récupérer et afficher le nom de l'entreprise + Pré-remplissage du champ établissement
        const entrepriseNameElement = document.getElementById('entreprise-name');
        const demandeEtablissementInput = document.getElementById("demande-paiement-etablissement");

        database.ref(`entreprises/${currentUser.uid}`).once('value')
            .then((snapshot) => {
                const entrepriseData = snapshot.val();
                const nomEntreprise = (entrepriseData && entrepriseData.nom) ? entrepriseData.nom : "[Nom non défini]";

                if (entrepriseNameElement) {
                    entrepriseNameElement.textContent = nomEntreprise;
                }
                // Pré-remplit le champ établissement
                if (demandeEtablissementInput && nomEntreprise !== "[Nom non défini]") {
                    demandeEtablissementInput.value = nomEntreprise;
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
        showLogin(); // Retour à la page de connexion si déconnecté
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

        // Validations
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

        // Création de l'utilisateur
        auth.createUserWithEmailAndPassword(email, password)
            .then((userCredential) => {
                const entrepriseId = userCredential.user.uid;
                // Stocke les informations de l'entreprise dans la base de données
                return database.ref('entreprises/' + entrepriseId).set({
                    nom: entrepriseName,
                    email: email, // Stocke aussi l'email pour référence facile
                    contact: contact,
                    dateCreation: firebase.database.ServerValue.TIMESTAMP
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
                 afficherNotification(`${message} (${error.code})`, "error", 'signup-notification');
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

        auth.signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                // Connexion réussie, gérée par onAuthStateChanged
                console.log("Connexion réussie pour:", userCredential.user.email);
            })
            .catch((error) => {
                console.error("Erreur lors de la connexion:", error);
                let message = "Erreur de connexion.";
                 if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                    message = "Email ou mot de passe incorrect.";
                } else if (error.code === 'auth/invalid-email') {
                     message = "Format d'email invalide.";
                } else if (error.code === 'auth/too-many-requests') {
                    message = "Trop de tentatives de connexion. Veuillez réessayer plus tard.";
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
                // Géré par onAuthStateChanged, qui appellera showLogin()
                 console.log("Déconnexion réussie");
                 currentUser = null; // Assurer la réinitialisation de currentUser
            })
            .catch((error) => {
                console.error("Erreur lors de la déconnexion:", error);
                afficherNotification("Erreur lors de la déconnexion", "error");
        });
    });
}

// Mot de passe oublié (NOUVEAU)
if (forgotPasswordForm && auth) {
    forgotPasswordForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = forgotEmailInput.value.trim();

        if (!email) {
            afficherNotification("Veuillez entrer votre adresse email.", "error", "forgot-notification");
            return;
        }

        const submitButton = forgotPasswordForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = "Envoi en cours...";

        auth.sendPasswordResetEmail(email)
            .then(() => {
                afficherNotification(`Email de réinitialisation envoyé à ${email}. Vérifiez votre boîte de réception (y compris les spams).`, "success", "forgot-notification");
                forgotPasswordForm.reset(); // Vider le formulaire
                setTimeout(showLogin, 4000); // Retour au login après 4s
            })
            .catch((error) => {
                console.error("Erreur lors de l'envoi de l'email de réinitialisation:", error);
                let message = "Erreur lors de l'envoi de l'email.";
                if (error.code === 'auth/user-not-found') {
                    message = "Aucun utilisateur trouvé avec cet email.";
                } else if (error.code === 'auth/invalid-email') {
                    message = "Adresse email invalide.";
                }
                afficherNotification(message, "error", "forgot-notification");
            })
            .finally(() => {
                submitButton.disabled = false;
                submitButton.textContent = "Envoyer l'email de réinitialisation";
            });
    });
}


// Liens de navigation entre les sections initiales
const showSignupLink = document.getElementById('show-signup');
const showLoginLink = document.getElementById('show-login');

if(showSignupLink) {
    showSignupLink.addEventListener('click', (e) => {
        e.preventDefault();
        showSignup();
    });
}
if(showLoginLink) { // Ce lien est dans la section signup
    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        showLogin();
    });
}
if(showForgotPasswordLink) { // NOUVEAU
    showForgotPasswordLink.addEventListener('click', (e) => {
        e.preventDefault();
        showForgotPassword();
    });
}
if(backToLoginLink) { // NOUVEAU (dans la section mot de passe oublié)
    backToLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        showLogin();
    });
}

// --- FONCTION UPLOAD D'IMAGE (Commune) ---
async function uploadImage(file, folder) {
    if (!currentUser) throw new Error("Utilisateur non connecté pour l'upload.");
    if (!file) throw new Error("Aucun fichier sélectionné pour l'upload.");
    if (!storage) throw new Error("Firebase Storage non initialisé.");

    // Crée une référence unique pour le fichier dans le dossier de l'utilisateur
    const storageRef = storage.ref(`${currentUser.uid}/${folder}/${Date.now()}_${file.name}`);

    console.log(`Uploading ${file.name} to ${storageRef.fullPath}`);

    try {
        const uploadTask = storageRef.put(file);

        // Optionnel: suivre la progression de l'upload
        // uploadTask.on('state_changed',
        //     (snapshot) => {
        //         const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        //         console.log('Upload is ' + progress + '% done');
        //     },
        //     (error) => { /* Gérer l'erreur ici si nécessaire pendant l'upload */ },
        //     () => { /* Gérer la réussite ici si nécessaire pendant l'upload */}
        // );


        // Attendre la fin de l'upload
        const snapshot = await uploadTask;
        console.log('Upload successful:', snapshot);

        // Obtenir l'URL de téléchargement
        const downloadURL = await snapshot.ref.getDownloadURL();
        console.log('File available at', downloadURL);
        return downloadURL;

    } catch (error) {
        console.error("Erreur lors de l'upload:", error.code, error.message);
         // Fournir plus de détails sur l'erreur
        switch (error.code) {
          case 'storage/unauthorized':
            throw new Error("Permission refusée. Vérifiez les règles de sécurité de Firebase Storage.");
          case 'storage/canceled':
            throw new Error("Upload annulé.");
          case 'storage/unknown':
          default:
            throw new Error("Erreur inconnue lors de l'upload de l'image.");
        }
    }
}


// --- FONCTIONS CRUD (Logements, Locataires, Biens) ---

// --- LOGEMENTS ---
async function ajouterOuModifierLogement(event) {
    event.preventDefault();
    if (!currentUser || !formLogement) return;

    const boutonSubmit = formLogement.querySelector("button[type='submit']");
    boutonSubmit.disabled = true; // Désactiver pendant le traitement
    boutonSubmit.textContent = editingLogementId ? "Modification..." : "Ajout...";

    // Récupération des valeurs
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

    // Validation
    if (!titre || !type || !description || !etat || prix <= 0 || !demarcheur || !proprietaire || !quartier || !ville || !statut) {
         afficherNotification("Veuillez remplir tous les champs requis et vérifier le prix.", "error");
         boutonSubmit.disabled = false;
         boutonSubmit.textContent = editingLogementId ? "Modifier" : "Ajouter";
         return;
    }

     // Si c'est un nouvel ajout, l'image est requise
    if (!editingLogementId && !imageFile) {
        afficherNotification("Veuillez sélectionner une image pour un nouveau logement.", "error");
        boutonSubmit.disabled = false;
        boutonSubmit.textContent = "Ajouter";
        return;
    }

    try {
        let imageUrl = null;
        // Uploader une nouvelle image seulement si elle est fournie
        if (imageFile) {
            imageUrl = await uploadImage(imageFile, 'logements');
        }

        const logementData = {
            titre, type, description, etat, prix, demarcheur, proprietaire, quartier, ville, statut,
            derniereModification: firebase.database.ServerValue.TIMESTAMP,
            datePublication: firebase.database.ServerValue.TIMESTAMP // Assuming creation/update time is publication time
        };

        const refPath = `entreprises/${currentUser.uid}/logements`;
        let actionPromise;

        if (editingLogementId) {
            // Mise à jour
             if (imageUrl) {
                logementData.image = imageUrl; // Mettre à jour l'URL si nouvelle image
            } else {
                 // Conserver l'ancienne image si aucune nouvelle n'est fournie
                 const snapshot = await database.ref(`${refPath}/${editingLogementId}/image`).once('value');
                 logementData.image = snapshot.val(); // Peut être null si l'original n'avait pas d'image
                 // Si l'image est essentielle, ajouter une vérification ici
                 if (!logementData.image) {
                     console.warn("Mise à jour sans nouvelle image, l'ancienne URL est conservée (si elle existait).");
                 }
             }
            actionPromise = database.ref(`${refPath}/${editingLogementId}`).update(logementData);
            afficherNotification("Logement modifié avec succès !", "success");

        } else {
            // Ajout
            if (!imageUrl) {
                 throw new Error("URL d'image manquante pour un nouveau logement.");
            }
            logementData.image = imageUrl;
            // datePublication is already set above
            actionPromise = database.ref(refPath).push(logementData);
            afficherNotification("Logement ajouté avec succès !", "success");
        }

        await actionPromise; // Attendre la fin de l'opération DB

        formLogement.reset(); // Réinitialiser le formulaire
        imageInput.value = ''; // Spécifiquement pour l'input file
        editingLogementId = null; // Réinitialiser l'ID d'édition
        boutonSubmit.textContent = "Ajouter"; // Remettre le texte initial

    } catch (error) {
        console.error("Erreur lors de l'ajout/modification du logement :", error);
        afficherNotification(`Erreur: ${error.message}`, "error");
        boutonSubmit.textContent = editingLogementId ? "Modifier" : "Ajouter"; // Remettre le texte même en cas d'erreur
    } finally {
         boutonSubmit.disabled = false; // Réactiver dans tous les cas
    }
}

function editerLogement(id) {
    if (!currentUser || !formLogement) return;
    editingLogementId = id; // Mémoriser l'ID

    const ref = database.ref(`entreprises/${currentUser.uid}/logements/${id}`);
    ref.once('value', (snapshot) => {
        const logement = snapshot.val();
        if (logement) {
            // Pré-remplissage du formulaire
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
            document.getElementById("image").value = ''; // Important: ne pas pré-remplir le champ 'file'
            // Make image field not required during edit
            document.getElementById("image").required = false;


            // Changer le texte du bouton et afficher le formulaire
            const boutonSubmit = formLogement.querySelector("button[type='submit']");
            boutonSubmit.textContent = "Modifier";

            masquerToutContenuPrincipal();
            formLogement.style.display = "block";
            listeLogements.style.display = "block"; // Garder la liste visible
            formLogement.scrollIntoView({ behavior: "smooth", block: "start" });

        } else {
            console.error("Aucune donnée trouvée pour ce logement ID:", id);
            afficherNotification("Impossible de charger les données du logement.", "error");
            editingLogementId = null; // Réinitialiser si le chargement échoue
            // Re-enable required for image if edit fails
            document.getElementById("image").required = true;
        }
    }, (error) => {
         console.error("Erreur Firebase lors du chargement pour édition:", error);
         afficherNotification("Erreur de chargement des données.", "error");
         editingLogementId = null;
         document.getElementById("image").required = true; // Re-enable required on error
    });
}

function supprimerLogement(id) {
    if (!currentUser) return;
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce logement ? Cette action est irréversible.")) return;

    // Optionnel : Supprimer l'image associée dans Storage avant de supprimer l'entrée DB
    // Pour cela, il faudrait d'abord récupérer l'URL de l'image depuis la DB
    // database.ref(`entreprises/${currentUser.uid}/logements/${id}/image`).once('value').then(snapshot => {
    //     const imageUrl = snapshot.val();
    //     if (imageUrl) {
    //         const imageRef = storage.refFromURL(imageUrl);
    //         imageRef.delete().catch(err => console.error("Erreur suppression image storage:", err));
    //     }
    // }).finally(() => { // Supprimer l'entrée DB même si l'image n'a pas pu être supprimée
           database.ref(`entreprises/${currentUser.uid}/logements/${id}`).remove()
            .then(() => {
                afficherNotification("Logement supprimé avec succès !", "success");
            })
            .catch((error) => {
                console.error("Erreur lors de la suppression du logement :", error);
                afficherNotification("Erreur lors de la suppression du logement.", "error");
            });
    // }); // Fin du .finally si on supprime l'image
}

function changerStatutLogement(id, statutActuel) {
     if (!currentUser) return;

    let nouveauStatut;
    switch (statutActuel) {
        case 'Libre':   nouveauStatut = 'Réservé'; break;
        case 'Réservé': nouveauStatut = 'Occupé';  break;
        case 'Occupé':  nouveauStatut = 'Libre';   break;
        default:        nouveauStatut = 'Libre';   // Sécurité
    }

    database.ref(`entreprises/${currentUser.uid}/logements/${id}`).update({ statut: nouveauStatut })
        .then(() => {
            // L'UI se met à jour via l'écouteur 'on value', notification non nécessaire
        })
        .catch((error) => {
            console.error("Erreur lors de la mise à jour du statut:", error);
            afficherNotification("Erreur màj statut", "error");
        });
}

function afficherLogements() {
    if (!currentUser) return;

    const tbody = document.getElementById("tbody-logements");
    const logementsTable = document.getElementById("liste-logements")?.querySelector('table'); // Pour data-label
    if (!tbody || !logementsTable) {
        console.warn("tbody ou table des logements introuvable");
        return;
    }
    const ref = database.ref(`entreprises/${currentUser.uid}/logements`);

    // Utiliser 'on' pour écouter les changements en temps réel
    ref.on('value', (snapshot) => {
        tbody.innerHTML = ""; // Vider avant de remplir

        if (!snapshot.exists()) {
             tbody.innerHTML = "<tr><td colspan='13'>Aucun logement enregistré.</td></tr>";
             calculerStatistiquesLogements(null); // Mettre stats à zéro
             return;
        }

        const logementsData = snapshot.val() || {}; // Obtenir toutes les données ou un objet vide
        const headers = Array.from(logementsTable.querySelectorAll('thead th')).map(th => th.innerText.trim()); // Get headers for data-label

        // Create an array to sort by datePublication if needed, otherwise render directly
        let logementsArray = [];
        snapshot.forEach((childSnapshot) => {
            logementsArray.push({ id: childSnapshot.key, ...childSnapshot.val() });
        });

        // Optional: Sort if needed, e.g., by date (newest first)
        // logementsArray.sort((a, b) => (b.datePublication || 0) - (a.datePublication || 0));

        logementsArray.forEach((logement) => {
            const id = logement.id; // Get id from the array item

             const tr = document.createElement("tr");
             const statutClass = (logement.statut || 'libre').toLowerCase().replace(/[éèê]/g, 'e').replace(/\s+/g, '-'); // Normalize status for class
             tr.innerHTML = `
                <td data-label="${headers[0] || 'ID'}">${id.substring(0, 6)}...</td>
                <td data-label="${headers[1] || 'Titre'}">${logement.titre || 'N/A'}</td>
                <td data-label="${headers[2] || 'Type'}">${logement.type || 'N/A'}</td>
                <td data-label="${headers[3] || 'Desc.'}">${(logement.description || 'N/A').substring(0, 30)}...</td>
                <td data-label="${headers[4] || 'Etat'}">${logement.etat || 'N/A'}</td>
                <td data-label="${headers[5] || 'Prix'}">${logement.prix ? logement.prix.toLocaleString('fr-FR') + ' FCFA' : 'N/A'}</td>
                <td data-label="${headers[6] || 'Démarcheur'}">${logement.demarcheur || 'N/A'}</td>
                <td data-label="${headers[7] || 'Proprio.'}">${logement.proprietaire || 'N/A'}</td>
                <td data-label="${headers[8] || 'Quartier'}">${logement.quartier || 'N/A'}</td>
                <td data-label="${headers[9] || 'Ville'}">${logement.ville || 'N/A'}</td>
                <td data-label="${headers[10] || 'Image'}">${logement.image ? `<img src="${logement.image}" alt="${logement.titre || 'Image'}" style="cursor:pointer; max-width: 50px; height: auto;" onclick="window.open('${logement.image}', '_blank')">` : 'Aucune'}</td>
                <td data-label="${headers[11] || 'Statut'}"><span class="statut-${statutClass}">${logement.statut || 'N/A'}</span></td>
                <td class="action-buttons" data-label="${headers[12] || 'Actions'}">
                    <button onclick="editerLogement('${id}')" title="Éditer"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-square" viewBox="0 0 16 16"><path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/><path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5z"/></svg></button>
                    <button onclick="supprimerLogement('${id}')" title="Supprimer"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash3-fill" viewBox="0 0 16 16"><path d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5m-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5M4.5 5.029l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06m6.53-.528a.5.5 0 0 0-.528.47l-.5 8.5a.5.5 0 0 0 .998.058l.5-8.5a.5.5 0 0 0-.47-.528M8 4.5a.5.5 0 0 0-.5.5v8.5a.5.5 0 0 0 1 0V5a.5.5 0 0 0-.5-.5"/></svg></button>
                    <button onclick="changerStatutLogement('${id}', '${logement.statut || 'Libre'}')" title="Changer Statut">
                         ${logement.statut === 'Libre' ? '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-bookmark-plus-fill" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M2 15.5V2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v13.5a.5.5 0 0 1-.74.439L8 13.069l-5.26 2.87A.5.5 0 0 1 2 15.5m6.5-11a.5.5 0 0 0-1 0V6H6a.5.5 0 0 0 0 1h1.5v1.5a.5.5 0 0 0 1 0V7H10a.5.5 0 0 0 0-1H8.5z"/></svg>' : (logement.statut === 'Réservé' ? '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-building-fill-check" viewBox="0 0 16 16"><path d="M12.5 16a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7m1.679-4.493-1.335 2.226a.75.75 0 0 1-1.174.144l-.774-.773a.5.5 0 0 1 .708-.708l.547.548 1.17-1.951a.5.5 0 1 1 .858.514Z"/><path d="M2 1a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v7.256A4.5 4.5 0 0 0 12.5 8a4.5 4.5 0 0 0-3 1.07V1H3v14h3v-2.5a.5.5 0 0 1 .5-.5H8v4H3a1 1 0 0 1-1-1z"/><path d="M4.5 6.5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5zm3 0a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5zm3 0a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5zm-6 3a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5zm3 0a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5z"/></svg>' : '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-door-open-fill" viewBox="0 0 16 16"><path d="M1.5 15a.5.5 0 0 0 0 1h13a.5.5 0 0 0 0-1H13V2.5A1.5 1.5 0 0 0 11.5 1H11V.5a.5.5 0 0 0-.57-.495l-7 1A.5.5 0 0 0 3 1.5V15zM11 2h.5a.5.5 0 0 1 .5.5V15h-1zM6.5 10h-.081l-.287-.845A.5.5 0 0 1 6.561 9h.878a.5.5 0 0 1 .46.289L7.58 10H7.5a.5.5 0 0 1 0 1h.081l.287.846a.5.5 0 0 1-.46.654H6.561a.5.5 0 0 1-.459-.654L6.16 11H6.5a.5.5 0 0 1 0-1"/></svg>')}
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        calculerStatistiquesLogements(logementsData); // Calculer les stats avec les données actuelles

    }, (error) => {
        console.error("Erreur Firebase lors de l'écoute des logements:", error);
        tbody.innerHTML = "<tr><td colspan='13'>Erreur lors du chargement des données.</td></tr>";
        calculerStatistiquesLogements(null); // Mettre stats à zéro en cas d'erreur
    });
}

// Attacher le listener au formulaire logement
if (formLogement) {
  formLogement.addEventListener("submit", ajouterOuModifierLogement);
  // Add listener to reset 'required' on image when adding new
  const boutonAfficherLogements = document.getElementById("afficher-form-logement-btn");
  if (boutonAfficherLogements) {
      boutonAfficherLogements.addEventListener('click', () => {
          document.getElementById("image").required = true;
          const boutonSubmit = formLogement.querySelector("button[type='submit']");
          if(boutonSubmit) boutonSubmit.textContent = "Ajouter";
          editingLogementId = null;
          formLogement.reset();
      });
  }
}


// --- LOCATAIRES ---
function ajouterOuModifierLocataire(event) {
    event.preventDefault();
    if (!currentUser || !formLocataire) return;

     const boutonSubmit = formLocataire.querySelector("button[type='submit']");
     boutonSubmit.disabled = true;
     boutonSubmit.textContent = editingLocataireId ? "Modification..." : "Ajout...";

    // Récupération des valeurs
    const nom = document.getElementById("nom").value.trim();
    const prenoms = document.getElementById("prenoms").value.trim();
    const adresse = document.getElementById("adresse").value.trim();
    const email = document.getElementById("email").value.trim().toLowerCase();
    const facebook = document.getElementById("facebook").value.trim(); // Pas requis
    const contact = document.getElementById("contactLocataire").value.trim();

    // Validation
     if (!nom || !prenoms || !adresse || !email || !contact) {
         afficherNotification("Veuillez remplir tous les champs obligatoires (Nom, Prénoms, Adresse, Email, Contact).", "error");
         boutonSubmit.disabled = false;
         boutonSubmit.textContent = editingLocataireId ? "Modifier" : "Ajouter";
         return;
     }
     if (email && !/^\S+@\S+\.\S+$/.test(email)) { // Valider l'email s'il est fourni
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
        afficherNotification(editingLocataireId ? "Locataire modifié !" : "Locataire ajouté !", "success");
        formLocataire.reset();
        editingLocataireId = null;
        boutonSubmit.textContent = "Ajouter";
    }).catch((error) => {
        console.error("Erreur ajout/modif locataire:", error);
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

            formLocataire.querySelector("button[type='submit']").textContent = "Modifier";
            masquerToutContenuPrincipal();
            formLocataire.style.display = "block";
            listeLocataires.style.display = "block";
            formLocataire.scrollIntoView({ behavior: "smooth", block: "start" });
        } else {
            afficherNotification("Données locataire introuvables.", "error");
            editingLocataireId = null;
        }
    }, (error) => {
         afficherNotification("Erreur chargement données.", "error");
         editingLocataireId = null;
    });
}

function supprimerLocataire(id) {
    if (!currentUser) return;
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce locataire ?")) return;

    database.ref(`entreprises/${currentUser.uid}/locataires/${id}`).remove()
        .then(() => {
            afficherNotification("Locataire supprimé !", "success");
        })
        .catch((error) => {
            afficherNotification("Erreur suppression.", "error");
        });
}

function afficherLocataires() {
    if (!currentUser) return;

    const tbody = document.getElementById("tbody-locataires");
    const locatairesTable = document.getElementById("liste-locataires")?.querySelector('table');
    if (!tbody || !locatairesTable) {
        console.warn("tbody ou table des locataires introuvable");
        return;
    }
    const ref = database.ref(`entreprises/${currentUser.uid}/locataires`);

    ref.on('value', (snapshot) => {
        tbody.innerHTML = "";
         if (!snapshot.exists()) {
             tbody.innerHTML = "<tr><td colspan='8'>Aucun locataire enregistré.</td></tr>";
             return;
        }

        const headers = Array.from(locatairesTable.querySelectorAll('thead th')).map(th => th.innerText.trim());

        let locatairesArray = [];
        snapshot.forEach((childSnapshot) => {
            locatairesArray.push({ id: childSnapshot.key, ...childSnapshot.val() });
        });

        // Optional: Sort locataires if needed
        // locatairesArray.sort((a, b) => a.nom.localeCompare(b.nom));

        locatairesArray.forEach((locataire) => {
            const id = locataire.id;

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td data-label="${headers[0] || 'ID'}">${id.substring(0, 6)}...</td>
                <td data-label="${headers[1] || 'Nom'}">${locataire.nom || 'N/A'}</td>
                <td data-label="${headers[2] || 'Prénoms'}">${locataire.prenoms || 'N/A'}</td>
                <td data-label="${headers[3] || 'Adresse'}">${locataire.adresse || 'N/A'}</td>
                <td data-label="${headers[4] || 'Email'}">${locataire.email || 'N/A'}</td>
                <td data-label="${headers[5] || 'Facebook'}">${locataire.facebook ? `<a href="${locataire.facebook.startsWith('http') ? '' : '//'}${locataire.facebook}" target="_blank" rel="noopener noreferrer">Lien</a>` : 'N/A'}</td>
                <td data-label="${headers[6] || 'Contact'}">${locataire.contact || 'N/A'}</td>
                <td class="action-buttons" data-label="${headers[7] || 'Actions'}">
                     <button onclick="editerLocataire('${id}')" title="Éditer"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-square" viewBox="0 0 16 16"><path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/><path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5z"/></svg></button>
                     <button onclick="supprimerLocataire('${id}')" title="Supprimer"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash3-fill" viewBox="0 0 16 16"><path d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5m-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5M4.5 5.029l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06m6.53-.528a.5.5 0 0 0-.528.47l-.5 8.5a.5.5 0 0 0 .998.058l.5-8.5a.5.5 0 0 0-.47-.528M8 4.5a.5.5 0 0 0-.5.5v8.5a.5.5 0 0 0 1 0V5a.5.5 0 0 0-.5-.5"/></svg></button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }, (error) => {
        console.error("Erreur écoute locataires:", error);
        tbody.innerHTML = "<tr><td colspan='8'>Erreur chargement données.</td></tr>";
    });
}

// Attacher le listener au formulaire locataire
if (formLocataire) {
    formLocataire.addEventListener("submit", ajouterOuModifierLocataire);
     // Add listener to reset edit state when clicking menu button
     const boutonAfficherLocataires = document.getElementById("afficher-form-locataire-btn");
     if (boutonAfficherLocataires) {
         boutonAfficherLocataires.addEventListener('click', () => {
             const boutonSubmit = formLocataire.querySelector("button[type='submit']");
             if(boutonSubmit) boutonSubmit.textContent = "Ajouter";
             editingLocataireId = null;
             formLocataire.reset();
         });
     }
}


// --- BIENS (Terrains, etc.) ---
async function ajouterOuModifierBien(event) {
    event.preventDefault();
    if (!currentUser || !formBien) return;

    const boutonSubmit = formBien.querySelector("button[type='submit']");
    boutonSubmit.disabled = true;
    boutonSubmit.textContent = editingBienId ? "Modification..." : "Ajout...";

    // Récupération
    const titre = document.getElementById("titreBien").value.trim();
    const description = document.getElementById("descriptionBien").value.trim();
    const etat = document.getElementById("etatBien").value;
    const prixInput = document.getElementById("prixBien");
    const prix = prixInput.value ? parseInt(prixInput.value) : 0;
    const proprietaire = document.getElementById("proprietaireBien").value.trim();
    const ville = document.getElementById("villeBien").value.trim();
    const imageInput = document.getElementById("imageBien");
    const imageFile = imageInput.files[0];

    // Validation
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
            datePublication: firebase.database.ServerValue.TIMESTAMP // Add publication date
        };

        const refPath = `entreprises/${currentUser.uid}/biens`;
        let actionPromise;

        if (editingBienId) {
             if (imageUrl) {
                bienData.image = imageUrl;
            } else {
                 const snapshot = await database.ref(`${refPath}/${editingBienId}/image`).once('value');
                 bienData.image = snapshot.val(); // Peut être null
             }
            actionPromise = database.ref(`${refPath}/${editingBienId}`).update(bienData);
            afficherNotification("Bien modifié !", "success");
        } else {
            if (!imageUrl) throw new Error("URL image manquante pour nouveau bien.");
            bienData.image = imageUrl;
            // datePublication already added above
            actionPromise = database.ref(refPath).push(bienData);
            afficherNotification("Bien ajouté !", "success");
        }

        await actionPromise;
        formBien.reset();
        imageInput.value = '';
        editingBienId = null;
        boutonSubmit.textContent = "Ajouter";

    } catch (error) {
        console.error("Erreur ajout/modif bien:", error);
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
            // Make image field not required during edit
            document.getElementById("imageBien").required = false;

            formBien.querySelector("button[type='submit']").textContent = "Modifier";
            masquerToutContenuPrincipal();
            formBien.style.display = "block";
            listeBiens.style.display = "block";
            formBien.scrollIntoView({ behavior: "smooth", block: "start" });
        } else {
            afficherNotification("Données bien introuvables.", "error");
            editingBienId = null;
            document.getElementById("imageBien").required = true; // Re-enable required
        }
    }, (error) => {
         afficherNotification("Erreur chargement données.", "error");
         editingBienId = null;
         document.getElementById("imageBien").required = true; // Re-enable required
    });
}

function supprimerBien(id) {
    if (!currentUser) return;
     if (!confirm("Êtes-vous sûr de vouloir supprimer ce bien ?")) return;

     // Optionnel : Supprimer image storage (similaire à supprimerLogement)
    database.ref(`entreprises/${currentUser.uid}/biens/${id}`).remove()
        .then(() => {
            afficherNotification("Bien supprimé !", "success");
        })
        .catch((error) => {
            afficherNotification("Erreur suppression.", "error");
        });
}

function afficherBiens() {
    if (!currentUser) return;

    const tbody = document.getElementById("tbody-biens");
    const biensTable = document.getElementById("liste-biens")?.querySelector('table');
    if (!tbody || !biensTable) {
         console.warn("tbody ou table des biens introuvable");
         return;
    }
    const ref = database.ref(`entreprises/${currentUser.uid}/biens`);

    ref.on('value', (snapshot) => {
         tbody.innerHTML = "";
        if (!snapshot.exists()) {
             tbody.innerHTML = "<tr><td colspan='9'>Aucun bien enregistré.</td></tr>";
             return;
        }

         const headers = Array.from(biensTable.querySelectorAll('thead th')).map(th => th.innerText.trim());
         let biensArray = [];
         snapshot.forEach((childSnapshot) => {
             biensArray.push({ id: childSnapshot.key, ...childSnapshot.val() });
         });

         // Optional: Sort biens
         // biensArray.sort((a, b) => (b.datePublication || 0) - (a.datePublication || 0));

        biensArray.forEach((bien) => {
            const id = bien.id;

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td data-label="${headers[0] || 'ID'}">${id.substring(0, 6)}...</td>
                <td data-label="${headers[1] || 'Titre'}">${bien.titre || 'N/A'}</td>
                <td data-label="${headers[2] || 'Desc.'}">${(bien.description || 'N/A').substring(0, 30)}...</td>
                <td data-label="${headers[3] || 'Etat'}">${bien.etat || 'N/A'}</td>
                <td data-label="${headers[4] || 'Prix'}">${bien.prix ? bien.prix.toLocaleString('fr-FR') + ' FCFA' : 'N/A'}</td>
                <td data-label="${headers[5] || 'Proprio.'}">${bien.proprietaire || 'N/A'}</td>
                <td data-label="${headers[6] || 'Ville'}">${bien.ville || 'N/A'}</td>
                <td data-label="${headers[7] || 'Image'}">${bien.image ? `<img src="${bien.image}" alt="${bien.titre || 'Image'}" style="cursor:pointer; max-width: 50px; height: auto;" onclick="window.open('${bien.image}', '_blank')">` : 'Aucune'}</td>
                <td class="action-buttons" data-label="${headers[8] || 'Actions'}">
                     <button onclick="editerBien('${id}')" title="Éditer"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-square" viewBox="0 0 16 16"><path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/><path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5z"/></svg></button>
                    <button onclick="supprimerBien('${id}')" title="Supprimer"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash3-fill" viewBox="0 0 16 16"><path d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5m-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5M4.5 5.029l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06m6.53-.528a.5.5 0 0 0-.528.47l-.5 8.5a.5.5 0 0 0 .998.058l.5-8.5a.5.5 0 0 0-.47-.528M8 4.5a.5.5 0 0 0-.5.5v8.5a.5.5 0 0 0 1 0V5a.5.5 0 0 0-.5-.5"/></svg></button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }, (error) => {
        console.error("Erreur écoute biens:", error);
        tbody.innerHTML = "<tr><td colspan='9'>Erreur chargement données.</td></tr>";
    });
}

// Attacher le listener au formulaire bien
if (formBien) {
    formBien.addEventListener("submit", ajouterOuModifierBien);
    // Add listener to reset required state and edit state
     const boutonAfficherBiens = document.getElementById("afficher-form-bien-btn");
     if (boutonAfficherBiens) {
         boutonAfficherBiens.addEventListener('click', () => {
             document.getElementById("imageBien").required = true;
             const boutonSubmit = formBien.querySelector("button[type='submit']");
             if(boutonSubmit) boutonSubmit.textContent = "Ajouter";
             editingBienId = null;
             formBien.reset();
         });
     }
}


// --- STATISTIQUES LOGEMENTS ---
function calculerStatistiquesLogements(logementsData) {
    const statsLibres = document.getElementById('stat-logements-libres');
    const statsReserves = document.getElementById('stat-logements-reserves');
    const statsOccupes = document.getElementById('stat-logements-occupes');
    const statsMensuel = document.getElementById('stat-logements-total-mensuel');
    const statsAnnuel = document.getElementById('stat-logements-total-annuel');

    if (!statsLibres || !statsReserves || !statsOccupes || !statsMensuel || !statsAnnuel) return; // Sortir si éléments manquants

    let libres = 0, reserves = 0, occupes = 0;
    let totalMensuel = 0, totalAnnuel = 0;

    if (logementsData) {
        const dateActuelle = new Date();
        const moisActuel = dateActuelle.getMonth(); // 0-11
        const anneeActuelle = dateActuelle.getFullYear();

        Object.values(logementsData).forEach(logement => {
            // Compter statuts
            const statut = (logement.statut || 'Libre').toLowerCase();
            if (statut === 'libre') libres++;
            else if (statut === 'réservé' || statut === 'reserve') reserves++; // Gérer les accents
            else if (statut === 'occupé' || statut === 'occupe') occupes++;

            // Compter totaux basés sur datePublication (use datePublication instead of dateCreation)
            if (logement.datePublication) {
                try {
                    const publicationDate = new Date(logement.datePublication);
                    if (!isNaN(publicationDate)) { // Vérifier si la date est valide
                        const publicationMois = publicationDate.getMonth();
                        const publicationAnnee = publicationDate.getFullYear();

                        if (publicationAnnee === anneeActuelle) {
                            totalAnnuel++;
                            if (publicationMois === moisActuel) {
                                totalMensuel++;
                            }
                        }
                    } else {
                        console.warn("Date de publication invalide pour le logement:", logement.titre, logement.datePublication);
                    }
                } catch (e) {
                     console.warn("Erreur parsing date de publication:", logement.titre, logement.datePublication, e);
                }
            }
        });
    }

    // Mettre à jour l'affichage
    statsLibres.textContent = libres;
    statsReserves.textContent = reserves;
    statsOccupes.textContent = occupes;
    statsMensuel.textContent = totalMensuel;
    statsAnnuel.textContent = totalAnnuel;
}

// --- DEMANDES DE PAIEMENT ---
function ajouterDemandePaiement(event) {
    event.preventDefault();
    if (!currentUser || !formDemandePaiement) return;

    const boutonSubmit = formDemandePaiement.querySelector("button[type='submit']");
    boutonSubmit.disabled = true;
    boutonSubmit.textContent = "Envoi...";

    // Récupération des valeurs
    const etablissement = document.getElementById("demande-paiement-etablissement").value; // Déjà rempli et readonly
    const montantInput = document.getElementById("demande-paiement-montant");
    const montant = montantInput.value ? parseInt(montantInput.value) : 0;
    const contactPaiementInput = document.getElementById("demande-paiement-contact"); // NOUVEAU
    const contactPaiement = contactPaiementInput.value.trim(); // NOUVEAU
    const situationInput = document.getElementById("demande-paiement-situation");
    const situation = situationInput.value.trim();
    const date = firebase.database.ServerValue.TIMESTAMP;
    const statut = "En attente";

    // Validation (Ajout de contactPaiement)
     if (!etablissement || montant <= 0 || !situation || !contactPaiement) { // NOUVEAU: Validation ajoutée
         afficherNotification("Veuillez vérifier tous les champs (montant, contact, situation).", "error"); // NOUVEAU: Message d'erreur mis à jour
         boutonSubmit.disabled = false;
         boutonSubmit.textContent = "Soumettre la Demande";
         return;
     }

    const nouvelleDemandeRef = database.ref(`entreprises/${currentUser.uid}/demandesPaiement`).push();
    nouvelleDemandeRef.set({
        date, etablissement, montant, contactPaiement, situation, statut, // NOUVEAU: contactPaiement ajouté ici
        demandeurId: currentUser.uid // Garder trace
    })
    .then(() => {
        afficherNotification("Demande de paiement soumise !", "success");
         montantInput.value = '';
         contactPaiementInput.value = ''; // NOUVEAU: Réinitialiser le nouveau champ
         situationInput.value = '';
    })
    .catch((error) => {
        console.error("Erreur soumission demande:", error);
        afficherNotification("Erreur lors de la soumission.", "error");
    }).finally(() => {
         boutonSubmit.disabled = false;
         boutonSubmit.textContent = "Soumettre la Demande";
    });
}

function afficherDemandesPaiement() {
    if (!currentUser) return;

    const tbody = document.getElementById("tbody-demandes-paiement");
     const demandesTable = document.getElementById("liste-demandes-paiement")?.querySelector('table');
    if (!tbody || !demandesTable) {
         console.warn("tbody ou table des demandes introuvable");
         return;
    }
    const ref = database.ref(`entreprises/${currentUser.uid}/demandesPaiement`);

    ref.orderByChild('date').on('value', (snapshot) => {
        tbody.innerHTML = "";
        if (!snapshot.exists()) {
             tbody.innerHTML = "<tr><td colspan='7'>Aucune demande de paiement.</td></tr>"; // NOUVEAU: Colspan à 7
             return;
         }

        const headers = Array.from(demandesTable.querySelectorAll('thead th')).map(th => th.innerText.trim());
        let demandesArray = [];
         snapshot.forEach((childSnapshot) => {
            demandesArray.push({ id: childSnapshot.key, ...childSnapshot.val() });
         });
         demandesArray.reverse(); // Plus récent en premier

        demandesArray.forEach((demande) => {
            const tr = document.createElement("tr");
            const dateLisible = demande.date ? new Date(demande.date).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short'}) : 'N/A';
            const statutClass = (demande.statut || 'attente').toLowerCase().replace(/\s+/g, '-').replace(/[éèê]/g, 'e'); // Normalize status
             tr.innerHTML = `
                <td data-label="${headers[0] || 'ID'}">${demande.id.substring(0, 6)}...</td>
                <td data-label="${headers[1] || 'Date'}">${dateLisible}</td>
                <td data-label="${headers[2] || 'Étab.'}">${demande.etablissement || 'N/A'}</td>
                <td data-label="${headers[3] || 'Montant'}">${demande.montant ? demande.montant.toLocaleString('fr-FR') + ' FCFA' : 'N/A'}</td>
                <td data-label="${headers[4] || 'Contact P.'}">${demande.contactPaiement || 'N/A'}</td> <!-- NOUVEAU CELLULE -->
                <td data-label="${headers[5] || 'Situation'}">${demande.situation || 'N/A'}</td>
                <td data-label="${headers[6] || 'Statut'}"><span class="statut-paiement-${statutClass}">${demande.statut || 'N/A'}</span></td>
            `;
            tbody.appendChild(tr);
         });

    }, (error) => {
        console.error("Erreur écoute demandes:", error);
        tbody.innerHTML = "<tr><td colspan='7'>Erreur chargement données.</td></tr>"; // NOUVEAU: Colspan à 7
    });
}

// Attacher listener au formulaire de demande
if (formDemandePaiement) {
    formDemandePaiement.addEventListener("submit", ajouterDemandePaiement);
}

// --- PROFIL ADMINISTRATEUR ---
function afficherProfilAdmin() {
    if (!currentUser || !profilSection) return;

    const entrepriseRef = database.ref(`entreprises/${currentUser.uid}`);
    entrepriseRef.once('value')
        .then((snapshot) => {
            const entrepriseData = snapshot.val();
            if (profilEmailInput) {
                profilEmailInput.value = currentUser.email; // Email de l'auth
                profilEmailInput.readOnly = true;
            }
            if (entrepriseData) {
                if (profilEntrepriseNameInput) profilEntrepriseNameInput.value = entrepriseData.nom || '';
                if (profilContactInput) profilContactInput.value = entrepriseData.contact || '';
            } else {
                 afficherNotification("Données de profil non trouvées.", "warning", "profil-notification");
            }
        })
        .catch((error) => {
            console.error("Erreur chargement profil:", error);
            afficherNotification("Erreur chargement profil.", "error", "profil-notification");
            if (profilEmailInput) profilEmailInput.value = currentUser.email;
        });
}

function mettreAJourProfilAdmin(event) {
    event.preventDefault();
    if (!currentUser || !formProfil) return;

    const boutonSubmit = formProfil.querySelector("button[type='submit']");
    boutonSubmit.disabled = true;
    boutonSubmit.textContent = "Mise à jour...";

    const nouveauNom = profilEntrepriseNameInput.value.trim();
    const nouveauContact = profilContactInput.value.trim();

     if (!nouveauNom || !nouveauContact) {
         afficherNotification("Nom et contact sont requis.", "error", "profil-notification");
         boutonSubmit.disabled = false;
         boutonSubmit.textContent = "Sauvegarder les modifications";
         return;
     }

    const updates = {
        nom: nouveauNom,
        contact: nouveauContact,
        derniereModification: firebase.database.ServerValue.TIMESTAMP,
        whatsapp: nouveauContact // Assuming the main contact is the WhatsApp number
    };

    database.ref(`entreprises/${currentUser.uid}`).update(updates)
        .then(() => {
            afficherNotification("Profil mis à jour !", "success", "profil-notification");
            // Mettre à jour le nom dans le header et pré-remplissage
            const entrepriseNameElement = document.getElementById('entreprise-name');
            const demandeEtablissementInput = document.getElementById("demande-paiement-etablissement");
            if(entrepriseNameElement) entrepriseNameElement.textContent = nouveauNom;
            if (demandeEtablissementInput) demandeEtablissementInput.value = nouveauNom;
        })
        .catch((error) => {
            console.error("Erreur màj profil:", error);
            afficherNotification("Erreur mise à jour profil.", "error", "profil-notification");
        })
         .finally(() => {
            boutonSubmit.disabled = false;
            boutonSubmit.textContent = "Sauvegarder les modifications";
        });
}

// Attacher le listener au formulaire de profil
if (formProfil) {
    formProfil.addEventListener("submit", mettreAJourProfilAdmin);
}


// --- GESTION DE L'AFFICHAGE DES SECTIONS (MENU) ---
function setupMenuButton(buttonId, showForm, showList, editVarName, formElement, listElement, imageInputId = null) {
    const button = document.getElementById(buttonId);
    if (button) {
        button.addEventListener("click", () => {
            if (!currentUser) return;
            masquerToutContenuPrincipal(); // Cache tout

            // Affiche le formulaire et la liste associés
            if (formElement) formElement.style.display = showForm ? "block" : "none";
            if (listElement) listElement.style.display = showList ? "block" : "none";

            // Réinitialise l'état d'édition si on clique sur le bouton du menu
            if (editVarName && typeof window[editVarName] !== 'undefined') { // Vérifie si la variable globale d'édition existe et est définie
                window[editVarName] = null; // Réinitialise la variable globale
                 if (formElement) {
                     formElement.reset();
                     const submitBtn = formElement.querySelector("button[type='submit']");
                     if (submitBtn) submitBtn.textContent = "Ajouter";
                     if (imageInputId) {
                         const imgInput = document.getElementById(imageInputId);
                         if (imgInput) {
                             imgInput.value = ''; // Vide le champ image
                             imgInput.required = true; // Reset required to true for add mode
                         }
                     }
                 }
             }

            // Cas spécifique pour la demande de paiement: pré-remplir établissement
            if (buttonId === 'afficher-demandes-paiement-btn') {
                 const demandeEtablissementInput = document.getElementById("demande-paiement-etablissement");
                 const entrepriseNameElement = document.getElementById('entreprise-name');
                 if(demandeEtablissementInput && entrepriseNameElement && entrepriseNameElement.textContent !== "[Erreur chargement]" && entrepriseNameElement.textContent !== "[Nom non défini]") {
                     demandeEtablissementInput.value = entrepriseNameElement.textContent;
                 }
            }
             // Cas spécifique pour le profil: charger les données
             if (buttonId === 'afficher-profil-btn') {
                 afficherProfilAdmin();
             }
        });
    }
}

// Configuration des boutons du menu
setupMenuButton("afficher-form-logement-btn", true, true, 'editingLogementId', formLogement, listeLogements, 'image');
setupMenuButton("afficher-form-locataire-btn", true, true, 'editingLocataireId', formLocataire, listeLocataires);
setupMenuButton("afficher-form-bien-btn", true, true, 'editingBienId', formBien, listeBiens, 'imageBien');
setupMenuButton("afficher-demandes-paiement-btn", true, true, null, formDemandePaiement, listeDemandesPaiement); // Pas de variable d'édition
setupMenuButton("afficher-profil-btn", true, false, null, profilSection, null); // Pas de liste, pas d'édition


// --- EXPORTATION ---
function getTableData(tableId) {
    const table = document.getElementById(tableId)?.querySelector('table'); // Sélectionne la table DANS la div
    if (!table) {
        console.error(`Table non trouvée dans la div ID "${tableId}".`);
        return null;
    }

    const data = [];
    const headers = [];
    // Define headers to skip based on table type
    let skippedHeaders = [];
    if (tableId === 'liste-logements' || tableId === 'liste-biens') {
        skippedHeaders = ['image', 'actions'];
    } else if (tableId === 'liste-locataires') {
         skippedHeaders = ['actions']; // Only skip actions for locataires
    }
     // For demandes-paiement, skip nothing for now, adjust if needed

    // Get headers, skip ignored ones
    table.querySelectorAll('thead th').forEach(th => {
        const headerText = th.innerText.trim().toLowerCase();
        if (!skippedHeaders.includes(headerText)) {
            headers.push(th.innerText.trim()); // Garder la casse originale pour l'affichage
        }
    });
    data.push(headers);

     // Get original full headers to map indices correctly
    const originalHeaders = Array.from(table.querySelectorAll('thead th')).map(th => th.innerText.trim().toLowerCase());
    const skippedIndices = originalHeaders.map((h, i) => skippedHeaders.includes(h) ? i : -1).filter(i => i !== -1);


    // Get rows
    table.querySelectorAll('tbody tr').forEach(tr => {
        // Ignorer les lignes "Aucun élément"
        if (tr.querySelector('td[colspan]')) {
            return;
        }
        const rowData = [];
        tr.querySelectorAll('td').forEach((td, index) => {
            if (!skippedIndices.includes(index)) {
                // Gérer le cas des liens ou des span pour obtenir le texte brut
                let cellText = td.innerText;
                if(td.querySelector('a')) { // Cas du lien facebook
                   cellText = td.querySelector('a').textContent; // ou href si besoin
                } else if (td.querySelector('span')) { // Cas des statuts
                   cellText = td.querySelector('span').textContent;
                }
                 rowData.push(cellText.trim());
            }
        });
        if(rowData.length > 0) { // Ajouter seulement si la ligne a des données utiles
            data.push(rowData);
        }
    });

    // Log the final data for debugging
    // console.log(`Data for ${tableId}:`, JSON.stringify(data, null, 2));

    return data;
}


function exportToExcel(tableId) {
     const data = getTableData(tableId); // Utilise l'ID de la DIV contenant la table
     if (!data || data.length <= 1) {
        afficherNotification("Aucune donnée à exporter.", "warning");
        return;
    }

    try {
        const ws = XLSX.utils.aoa_to_sheet(data);
        // Ajuster la largeur des colonnes (optionnel, basique)
         const colWidths = data[0].map((_, i) => ({ wch: Math.max(...data.map(row => row[i] ? row[i].toString().length : 0), 10) })); // min 10 chars wide
         ws['!cols'] = colWidths;

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Données"); // Nom de la feuille

        const dateStr = new Date().toISOString().split('T')[0];
        const filename = `${tableId.replace('liste-', '')}_export_${dateStr}.xlsx`; // Nom fichier plus propre

        XLSX.writeFile(wb, filename);
        afficherNotification("Exportation Excel terminée.", "success");
    } catch(error) {
         console.error("Erreur Export Excel:", error);
         afficherNotification("Erreur lors de l'exportation Excel.", "error");
    }
}

function exportToPDF(tableId) {
     const data = getTableData(tableId); // Utilise l'ID de la DIV
     if (!data || data.length <= 1) {
         afficherNotification("Aucune donnée à exporter pour le PDF.", "warning");
         return;
     }

    // Vérifier jsPDF et autoTable
    if (typeof window.jspdf === 'undefined' || typeof window.jspdf.jsPDF === 'undefined' || typeof window.jspdf.jsPDF.API === 'undefined' || typeof window.jspdf.jsPDF.API.autoTable === 'undefined') {
        console.error("jsPDF ou jsPDF-AutoTable non chargé.");
        afficherNotification("Erreur préparation PDF (librairie manquante).", "error");
        return;
    }

    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

        const head = [data[0]]; // Header row
        const body = data.slice(1); // Data rows

        // Titre du document
        const title = tableId.replace('liste-', '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()); // e.g. "Logements"
        doc.setFontSize(14);
        doc.text(title, 14, 15); // Position du titre

        doc.autoTable({
            head: head,
            body: body,
            startY: 20, // Démarrer après le titre
            theme: 'grid',
            styles: {
                fontSize: 7, // Reduced font size for potentially wider tables
                cellPadding: 1.5, // Reduced padding
                overflow: 'linebreak',
                halign: 'left',
            },
            headStyles: {
                fillColor: [0, 74, 173], // Bleu #004aad
                textColor: 255,
                fontStyle: 'bold',
            },
            margin: { top: 10, left: 8, right: 8, bottom: 15 }, // Adjusted margins
             didDrawPage: function (data) {
                // Pied de page
                doc.setFontSize(8);
                const pageCount = doc.internal.getNumberOfPages();
                doc.text('Page ' + doc.internal.getCurrentPageInfo().pageNumber + ' sur ' + pageCount, data.settings.margin.left, doc.internal.pageSize.height - 10);
                doc.text('Exporté de ESPACE BENIN Admin', doc.internal.pageSize.width - data.settings.margin.right, doc.internal.pageSize.height - 10, { align: 'right' });
            }
        });

        const dateStr = new Date().toISOString().split('T')[0];
        const filename = `${tableId.replace('liste-', '')}_export_${dateStr}.pdf`;
        doc.save(filename);
        afficherNotification("Exportation PDF terminée.", "success");

    } catch(error) {
         console.error("Erreur Export PDF:", error);
         afficherNotification("Erreur lors de l'exportation PDF.", "error");
    }
}


// Attacher les listeners aux boutons d'export
const exportButtons = document.querySelectorAll(".export-btn");
if (exportButtons) {
    exportButtons.forEach(button => {
        button.addEventListener("click", () => {
            const tableContainerId = button.dataset.table; // Doit être l'ID de la DIV (ex: 'liste-logements')
            const format = button.dataset.format;

            if (!tableContainerId) {
                console.error("Bouton export sans 'data-table' (ID de la div).");
                return;
            }

            if (format === "xlsx") {
                exportToExcel(tableContainerId);
            } else if (format === "pdf") {
                exportToPDF(tableContainerId);
            } else {
                 console.warn(`Format export inconnu: ${format}`);
            }
        });
    });
}


// --- MODALES TERMES ET CONFIDENTIALITE ---
const adminTermsModal = document.getElementById('admin-terms-modal');
const adminPrivacyModal = document.getElementById('admin-privacy-modal');

function openModal(modalElement) {
    if (modalElement) modalElement.style.display = 'block';
}

function closeModal(modalElement) {
     if (modalElement) modalElement.style.display = 'none';
}

// Liens dans le formulaire d'inscription
const showAdminTermsLink = document.getElementById('show-admin-terms');
const showAdminPrivacyLink = document.getElementById('show-admin-privacy');

if (showAdminTermsLink && adminTermsModal) {
    showAdminTermsLink.addEventListener('click', (e) => { e.preventDefault(); openModal(adminTermsModal); });
}
if (showAdminPrivacyLink && adminPrivacyModal) {
    showAdminPrivacyLink.addEventListener('click', (e) => { e.preventDefault(); openModal(adminPrivacyModal); });
}

// Boutons de fermeture dans les modales
document.querySelectorAll('.modal .close-button').forEach(button => {
    button.addEventListener('click', () => closeModal(button.closest('.modal')));
});

// Fermeture en cliquant en dehors
window.addEventListener('click', (event) => {
    if (event.target.classList.contains('modal')) closeModal(event.target);
});


// --- INITIALISATION ---
document.addEventListener('DOMContentLoaded', () => {
    // L'état initial (login ou main content) est géré par onAuthStateChanged
    // On s'assure juste que le login est affiché si onAuthStateChanged n'a pas encore répondu
    if (!auth.currentUser) {
       showLogin();
    }

    // Add the 'required' attribute back to image inputs if needed when adding new item
    const imageLogement = document.getElementById('image');
    const imageBien = document.getElementById('imageBien');
    if(imageLogement) imageLogement.required = true;
    if(imageBien) imageBien.required = true;
});
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

// Data structure for cities and quartiers (MUST BE THE SAME AS IN index.html's script.js)
const quartiersByVille = {
    "parakou": ["Banikanni", "Baka", "Arafat","Zongo", "Albarika", "Okédama", "Tranza", "Tourou", "Wansirou", "Autre / Non spécifié"], // Added example quartiers
    "cotonou": ["Agla", "Fidjrossè", "Cadjehoun", "Ste Rita", "Tokpa-Hoho", "Dantokpa", "Autre / Non spécifié"],
    "bohicon": ["Passagon", "Sodohomè", "Zongbon", "Autre / Non spécifié"],
    "abomey calavi": ["Calavi", "Godomey", "Akassato", "Ouèdo", "Arconville", "Kpota", "Autre / Non spécifié"],
    "porto novo": ["Ouando", "Tokpota", "Ayelawadjè", "Autre / Non spécifié"],
    "kandi": ["Akpédè", "Intinra", "Kpébié", "Autre / Non spécifié"],
    "natitingou": ["Boriyouré", "Sinendé", "Winké", "Autre / Non spécifié"],
    "malanville": ["Mandécali", "Guéné", "Garou", "Autre / Non spécifié"],
    "autre / non spécifié": ["Autre / Non spécifié"], // Generic option
    "": ["-- Sélectionnez une ville d'abord --"] // Default state (should match the placeholder)
};


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

// MODIFIED: Image Preview Elements
const logementImagePreview = document.getElementById('logement-image-preview');
const bienImagePreview = document.getElementById('bien-image-preview');

// References to Ville/Quartier selects in Admin
const villeLogementSelect = document.getElementById('ville');
const quartierLogementSelect = document.getElementById('quartier');
const villeBienSelect = document.getElementById('villeBien');


// Fonction afficherNotification (améliorée pour gérer différents IDs)
function afficherNotification(message, type, notificationId = "notification") {
    const notification = document.getElementById(notificationId);
    if (notification) {
        notification.textContent = message;
        notification.className = `notification ${type}`; // Assurez-vous que la classe de base est toujours présente
        notification.style.display = "block";

        // Set timeout based on type
        const duration = (type === 'error' || message.includes("Accès coupé")) ? 8000 : 5000;
        setTimeout(() => {
            notification.style.display = "none";
        }, duration); // Reste affiché 5-8 secondes
    } else {
        console.warn(`Notification element with ID "${notificationId}" not found.`);
        // Fallback for critical messages if element is missing
        if (notificationId === 'notification' || notificationId === 'signup-notification' || notificationId === 'forgot-notification') {
             alert(`${type.toUpperCase()}: ${message}`);
        }
    }
}

// Function to populate the quartier dropdown (admin version)
function populateQuartiersSelect(villeValue, quartierSelectElement, defaultOptionText = "-- Sélectionnez un quartier --") {
    const lowerVille = villeValue.toLowerCase();
    const quartiers = quartiersByVille[lowerVille] || [];

    quartierSelectElement.innerHTML = `<option value="">${defaultOptionText}</option>`; // Keep default option

    // Add options for the selected city's quartiers
    if (quartiers.length > 0) {
         quartiers.forEach(quartier => {
             // Avoid adding the default "Selectez une ville" option from the data if it's not the current selection
             if (quartier !== "-- Sélectionnez une ville d'abord --") {
                const option = document.createElement('option');
                option.value = quartier;
                option.textContent = quartier;
                quartierSelectElement.appendChild(option);
             }
         });
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

    // Clear image previews
    if (logementImagePreview) logementImagePreview.innerHTML = '';
    if (bienImagePreview) bienImagePreview.innerHTML = '';
}

// --- AUTHENTIFICATION ---

// Gestionnaire d'état de connexion
auth.onAuthStateChanged(async (user) => { // Made async
    if (user) {
        // --- Vérification du statut d'activation ---
        try {
            const activeRef = database.ref(`entreprises/${user.uid}/isActive`);
            const snapshot = await activeRef.once('value');
            const isActive = snapshot.val(); // Peut être true, false, null, undefined

            if (isActive === false) {
                console.warn(`Accès refusé pour ${user.email}: compte désactivé.`);
                currentUser = null;
                await auth.signOut();
                showLogin();
                setTimeout(() => {
                     afficherNotification("Votre accès a été coupé pour non-respect des conditions d'utilisation. Veuillez contacter l'administrateur.", "error", "notification");
                }, 100);
                return;
            }

        } catch (error) {
            console.error("Erreur lors de la vérification du statut d'activation:", error);
            currentUser = null;
            await auth.signOut();
            showLogin();
            setTimeout(() => {
                afficherNotification("Erreur lors de la vérification de votre compte. Veuillez réessayer.", "error", "notification");
            }, 100);
            return;
        }
        // --- Fin de la vérification ---

        currentUser = user;
        showMainContent();
        masquerToutContenuPrincipal(); // Masquer tout au début

        // Charger les données initiales (elles seront affichées quand l'utilisateur clique sur le bouton correspondant)
        // These calls will now set up listeners that populate tables when data changes
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

        if (!entrepriseName || !email || !contact || !password || !confirmPassword) {
             afficherNotification("Veuillez remplir tous les champs.", "error", "signup-notification"); return;
        }
        if (password !== confirmPassword) {
            afficherNotification("Les mots de passe ne correspondent pas.", "error", "signup-notification"); return;
        }
        if (password.length < 6) {
            afficherNotification("Le mot de passe doit contenir au moins 6 caractères.", "error", "signup-notification"); return;
        }
        if (!termsCheckbox || !termsCheckbox.checked) {
            afficherNotification("Vous devez accepter les termes et conditions.", "error", "signup-notification"); return;
        }

        auth.createUserWithEmailAndPassword(email, password)
            .then((userCredential) => {
                const entrepriseId = userCredential.user.uid;
                return database.ref('entreprises/' + entrepriseId).set({
                    nom: entrepriseName,
                    email: email,
                    contact: contact,
                    whatsapp: contact, // Assume contact is WhatsApp by default
                    isActive: true, // Active by default
                    dateCreation: firebase.database.ServerValue.TIMESTAMP
                });
            })
            .then(() => {
                 afficherNotification("Inscription réussie! Vous pouvez maintenant vous connecter.", "success", 'signup-notification');
                 signupForm.reset();
                 setTimeout(showLogin, 2000);
            })
            .catch((error) => {
                console.error("Erreur lors de l'inscription:", error);
                let message = "Erreur lors de l'inscription.";
                if (error.code === 'auth/email-already-in-use') message = "Cet email est déjà utilisé.";
                else if (error.code === 'auth/invalid-email') message = "L'adresse email n'est pas valide.";
                else if (error.code === 'auth/weak-password') message = "Le mot de passe est trop faible.";
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
             afficherNotification("Veuillez entrer l'email et le mot de passe.", "error", "notification"); return;
         }
        auth.setPersistence(firebase.auth.Auth.Persistence.NONE) // MODIFIED FOR NO SESSION PERSISTENCE
            .then(() => auth.signInWithEmailAndPassword(email, password))
            .then((userCredential) => {
                console.log("Tentative de connexion réussie pour:", userCredential.user.email);
                // onAuthStateChanged gérera la suite
            })
            .catch((error) => {
                console.error("Erreur lors de la connexion:", error);
                let message = "Erreur de connexion.";
                 if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') message = "Email ou mot de passe incorrect.";
                 else if (error.code === 'auth/invalid-email') message = "Format d'email invalide.";
                 else if (error.code === 'auth/too-many-requests') message = "Trop de tentatives de connexion. Veuillez réessayer plus tard.";
                 else if (error.code === 'auth/user-disabled') message = "Ce compte utilisateur a été désactivé.";
                 afficherNotification(message, "error", "notification");
            });
    });
}


// Déconnexion
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        auth.signOut()
            .then(() => {
                 console.log("Déconnexion réussie");
                 currentUser = null; // onAuthStateChanged will handle UI update
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
            afficherNotification("Veuillez entrer votre adresse email.", "error", "forgot-notification"); return;
        }
        const submitButton = forgotPasswordForm.querySelector("button[type='submit']");
        if (submitButton) {
             submitButton.disabled = true;
             submitButton.textContent = "Envoi en cours...";
        }


        auth.sendPasswordResetEmail(email)
            .then(() => {
                afficherNotification(`Email de réinitialisation envoyé à ${email}. Vérifiez votre boîte de réception (y compris les spams).`, "success", "forgot-notification");
                forgotPasswordForm.reset();
                setTimeout(showLogin, 4000);
            })
            .catch((error) => {
                console.error("Erreur lors de l'envoi de l'email de réinitialisation:", error);
                let message = "Erreur lors de l'envoi de l'email.";
                if (error.code === 'auth/user-not-found') message = "Aucun utilisateur trouvé avec cet email.";
                 else if (error.code === 'auth/invalid-email') message = "Adresse email invalide.";
                afficherNotification(message, "error", "forgot-notification");
            })
            .finally(() => {
                if (submitButton) {
                     submitButton.disabled = false;
                     submitButton.textContent = "Envoyer l'email de réinitialisation";
                }
            });
    });
}


// Liens de navigation entre les sections initiales
const showSignupLink = document.getElementById('show-signup');
const showLoginLink = document.getElementById('show-login');
if(showSignupLink) showSignupLink.addEventListener('click', (e) => { e.preventDefault(); showSignup(); });
if(showLoginLink) showLoginLink.addEventListener('click', (e) => { e.preventDefault(); showLogin(); });
if(showForgotPasswordLink) showForgotPasswordLink.addEventListener('click', (e) => { e.preventDefault(); showForgotPassword(); });
if(backToLoginLink) backToLoginLink.addEventListener('click', (e) => { e.preventDefault(); showLogin(); });

// --- FONCTION UPLOAD D'IMAGES (Modifiée pour gérer l'upload de plusieurs images) ---
async function uploadMultipleImages(files, folder) {
    if (!currentUser) throw new Error("Utilisateur non connecté pour l'upload.");
    if (!files || files.length === 0) return []; // Return empty array if no files selected

    if (!storage) throw new Error("Firebase Storage non initialisé.");

    const uploadPromises = Array.from(files).map(async (file) => {
        // Optional: Add file size/type validation here if needed
        const storageRef = storage.ref(`${currentUser.uid}/${folder}/${Date.now()}_${file.name}`);
        console.log(`Uploading ${file.name} to ${storageRef.fullPath}`);
        try {
            const snapshot = await storageRef.put(file);
            const downloadURL = await snapshot.ref.getDownloadURL();
            console.log(`Upload success: ${snapshot.metadata.name} -> ${downloadURL}`);
            return downloadURL;
        } catch (error) {
            console.error(`Erreur upload ${file.name}:`, error.code, error.message);
            let userMessage = `Erreur upload ${file.name}.`;
            switch (error.code) {
                case 'storage/unauthorized': userMessage = `Permission refusée: ${file.name}.`; break;
                case 'storage/canceled': userMessage = `Upload annulé: ${file.name}.`; break;
                case 'storage/quota-exceeded': userMessage = `Quota stockage dépassé: ${file.name}.`; break;
                case 'storage/invalid-argument': userMessage = `Fichier invalide/trop gros: ${file.name}.`; break;
                default: userMessage = `Erreur upload ${file.name}: ${error.message}`; // More detailed default error
            }
             // Log but do NOT re-throw to allow other files in a batch to potentially succeed
             console.error(`Upload failed for ${file.name}: ${userMessage}`);
            return null; // Return null for failed uploads
        }
    });

    // Exécute toutes les promesses d'upload en parallèle
    const results = await Promise.all(uploadPromises);
    // Filter out null results from failed uploads
    return results.filter(url => url !== null);
}


// Helper to display image previews (shows file count)
function displayImagePreview(fileInputId, previewElementId) {
    const input = document.getElementById(fileInputId);
    const previewContainer = document.getElementById(previewElementId);
    if (!input || !previewContainer) return;

    previewContainer.innerHTML = ''; // Clear previous previews
    const fileCount = input.files.length;
    if (fileCount > 0) {
        previewContainer.textContent = `${fileCount} fichier(s) sélectionné(s).`;
        // Optional: list filenames for small number of files
        if (fileCount <= 3) {
             const fileNames = Array.from(input.files).map(file => file.name).join(', ');
             previewContainer.textContent += ` (${fileNames})`;
        }
    } else {
        // Display existing image count when editing
        // Use the appropriate editing ID variable
        const editingId = (fileInputId === 'image' ? editingLogementId : (fileInputId === 'imageBien' ? editingBienId : null));
        const itemType = (fileInputId === 'image' ? 'logements' : (fileInputId === 'imageBien' ? 'biens' : null));

        if (editingId && itemType && currentUser) {
             database.ref(`entreprises/${currentUser.uid}/${itemType}/${editingId}`).once('value').then(snap => {
                 const itemData = snap.val();
                 let count = 0;
                 if (itemData) {
                      const imageArray = Array.isArray(itemData.images) ? itemData.images : [];
                      const singleImageUrl = itemData.image || null; // Check old field

                      count = imageArray.length;
                      if (singleImageUrl && count === 0) { // If no images array but old single image exists
                          count = 1;
                      }
                 }
                 previewContainer.textContent = `Images actuelles: ${count}. Sélectionnez de nouveaux fichiers pour remplacer.`;
             }).catch(error => {
                 console.error("Erreur chargement images existantes:", error);
                 previewContainer.textContent = 'Erreur chargement images existantes.';
             });
        } else {
             previewContainer.textContent = 'Aucun fichier sélectionné.';
        }
    }
}


// Add listeners for image previews
const imageLogementInput = document.getElementById('image');
const imageBienInput = document.getElementById('imageBien');
if(imageLogementInput && logementImagePreview) {
    imageLogementInput.addEventListener('change', () => displayImagePreview('image', 'logement-image-preview'));
}
if(imageBienInput && bienImagePreview) {
    imageBienInput.addEventListener('change', () => displayImagePreview('imageBien', 'bien-image-preview'));
}

// --- FONCTIONS CRUD (Logements, Locataires, Biens) ---

// --- LOGEMENTS ---
// MODIFIED: Uses uploadMultipleImages and saves 'images' array, updated JS validation
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
    const quartier = document.getElementById("quartier").value; // Get value from select
    const ville = document.getElementById("ville").value;       // Get value from select
    const statut = document.getElementById("statut").value;
    const imageInput = document.getElementById("image");
    const imageFiles = imageInput ? imageInput.files : null; // FileList

    // --- JS Validation (Keep for essential fields even if HTML 'required' removed) ---
    if (!titre) { afficherNotification("Le titre est requis.", "error"); boutonSubmit.disabled = false; boutonSubmit.textContent = editingLogementId ? "Modifier" : "Ajouter"; return; }
    if (!type) { afficherNotification("Le type de logement est requis.", "error"); boutonSubmit.disabled = false; boutonSubmit.textContent = editingLogementId ? "Modifier" : "Ajouter"; return; }
    if (!description) { afficherNotification("La description est requise.", "error"); boutonSubmit.disabled = false; boutonSubmit.textContent = editingLogementId ? "Modifier" : "Ajouter"; return; }
    if (!etat) { afficherNotification("L'état du logement est requis.", "error"); boutonSubmit.disabled = false; boutonSubmit.textContent = editingLogementId ? "Modifier" : "Ajouter"; return; }
    if (prix <= 0) { afficherNotification("Le prix doit être supérieur à zéro.", "error"); boutonSubmit.disabled = false; boutonSubmit.textContent = editingLogementId ? "Modifier" : "Ajouter"; return; }
     // demarcheur can be empty
     // proprietaire can be empty
    if (!ville) { afficherNotification("La ville est requise.", "error"); boutonSubmit.disabled = false; boutonSubmit.textContent = editingLogementId ? "Modifier" : "Ajouter"; return; }
    if (!quartier) { afficherNotification("Le quartier est requis.", "error"); boutonSubmit.disabled = false; boutonSubmit.textContent = editingLogementId ? "Modifier" : "Ajouter"; return; }
    if (!statut) { afficherNotification("Le statut est requis.", "error"); boutonSubmit.disabled = false; boutonSubmit.textContent = editingLogementId ? "Modifier" : "Ajouter"; return; }
    // --- End JS Validation ---

    try {
        let uploadedImageUrls = [];
        if (imageFiles && imageFiles.length > 0) {
             afficherNotification(`Upload de ${imageFiles.length} image(s)...`, "info");
             uploadedImageUrls = await uploadMultipleImages(imageFiles, 'logements'); // Use new function
             if (uploadedImageUrls.length !== imageFiles.length) {
                 afficherNotification(`Attention: Échec de l'upload pour ${imageFiles.length - uploadedImageUrls.length} image(s).`, "warning");
             }
        }

        const logementData = {
            titre, type, description, etat, prix, demarcheur: demarcheur || null, proprietaire: proprietaire || null, // Allow null for optional fields
            quartier, ville, statut,
            derniereModification: firebase.database.ServerValue.TIMESTAMP,
            datePublication: editingLogementId ? undefined : firebase.database.ServerValue.TIMESTAMP // Only set datePublication on add
        };

        const refPath = `entreprises/${currentUser.uid}/logements`;
        let actionPromise;
        let finalImageUrls = []; // URLs to save

        if (editingLogementId) {
             // Mise à jour
             const logementRef = database.ref(`${refPath}/${editingLogementId}`);
             // Get old image URLs to potentially delete later if replaced
             const oldImagesSnapshot = await logementRef.child('images').once('value');
             const oldImageUrlsArray = oldImagesSnapshot.val() || [];

              // Get old single image URL (fallback, handle deprecated field)
              const oldSingleSnapshot = await logementRef.child('image').once('value');
              const oldSingleImageUrl = oldSingleSnapshot.val();


             if (uploadedImageUrls.length > 0) {
                 finalImageUrls = uploadedImageUrls; // Use new images
                 console.log("Logement MAJ: Utilisation nouvelles images:", finalImageUrls);
                 // Schedule deletion of old images (both array and single) after DB update
                 const imagesToDelete = [...(Array.isArray(oldImageUrlsArray) ? oldImageUrlsArray : [])]; // Ensure array
                 if(oldSingleImageUrl) imagesToDelete.push(oldSingleImageUrl);
                 if(imagesToDelete.length > 0) {
                     setTimeout(() => deleteImagesFromStorage(imagesToDelete), 5000); // Delay deletion slightly
                 }
             } else {
                 // Keep existing images if no new ones uploaded
                 finalImageUrls = oldImageUrlsArray;
                 // If 'images' was empty but 'image' existed, use the old single image
                 if((!finalImageUrls || finalImageUrls.length === 0) && oldSingleImageUrl){
                     finalImageUrls = [oldSingleImageUrl];
                 }
                 console.log("Logement MAJ: Conservation images existantes:", finalImageUrls);
             }
             logementData.images = finalImageUrls; // Always save as 'images' array
             logementData.image = null; // Explicitly remove old single field


             actionPromise = logementRef.update(logementData);
             afficherNotification("Logement modifié avec succès !", "success");

        } else {
            // Ajout
             // KEEP THIS CHECK: Even if HTML required is off, a new listing needs at least one image to be useful
             if (!imageFiles || imageFiles.length === 0) {
                 afficherNotification("Veuillez sélectionner au moins une image pour un nouveau logement.", "error");
                 boutonSubmit.disabled = false;
                 boutonSubmit.textContent = "Ajouter";
                 return;
             }
            if (uploadedImageUrls.length === 0) {
                 // If files were selected but upload failed for all
                 afficherNotification("Aucune image n'a pu être uploadée. Veuillez réessayer.", "error");
                 boutonSubmit.disabled = false;
                 boutonSubmit.textContent = "Ajouter";
                 return;
            }
            finalImageUrls = uploadedImageUrls;
            logementData.images = finalImageUrls; // Save the array
            logementData.image = null; // Ensure old field is not set

            actionPromise = database.ref(refPath).push(logementData);
            afficherNotification("Logement ajouté avec succès !", "success");
        }

        await actionPromise;

        formLogement.reset();
        if (imageInput) imageInput.value = ''; // Clear file input
        if (logementImagePreview) logementImagePreview.innerHTML = '';
        editingLogementId = null;
        boutonSubmit.textContent = "Ajouter";
         // Re-populate quartier select for the current (or default) ville
        if (villeLogementSelect && quartierLogementSelect) {
             populateQuartiersSelect(villeLogementSelect.value, quartierLogementSelect);
         }


    } catch (error) {
        console.error("Erreur lors de l'ajout/modification du logement :", error);
        afficherNotification(`Erreur: ${error.message || 'Inconnue'}`, "error");
        boutonSubmit.textContent = editingLogementId ? "Modifier" : "Ajouter";
    } finally {
         boutonSubmit.disabled = false;
    }
}

// MODIFIED: Handles edit form display and image preview text, removed image required logic
function editerLogement(id) {
    if (!currentUser || !formLogement || !villeLogementSelect || !quartierLogementSelect) return;
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
            document.getElementById("statut").value = logement.statut || 'Libre';

             // --- Handle Ville and Quartier Selects ---
             const savedVille = logement.ville || '';
             const savedQuartier = logement.quartier || '';

             // 1. Set the Ville value. This will trigger the change listener.
             villeLogementSelect.value = savedVille;

             // 2. Manually trigger the change event or directly populate quartiers
             // Triggering is cleaner as it uses the existing event handler setup
             const changeEvent = new Event('change');
             villeLogementSelect.dispatchEvent(changeEvent);


             // 3. After the quartiers dropdown is populated (which happens asynchronously
             // or very quickly after dispatchEvent), set the quartier value.
             // A small timeout might be needed if the population isn't immediate,
             // although dispatchEvent is usually synchronous for simple changes.
             // Let's try directly first, if it fails, add a tiny timeout.
             // A timeout of 0 is often enough to defer execution slightly.
             setTimeout(() => {
                  quartierLogementSelect.value = savedQuartier;
                  // If the specific savedQuartier doesn't exist in the newly populated list,
                  // the dropdown will revert to the default option.
                  // We could add the savedQuartier as an option if it's not in the list,
                  // but for simplicity based on the defined list, we'll just let it default.
             }, 0); // 0ms timeout to defer slightly

             // --- End Ville and Quartier ---


            const imageInput = document.getElementById("image");
            if(imageInput) imageInput.value = '';
            // imageInput.required = false; // Removed, as required HTML attribute is removed

            // MODIFIED: Display existing image count in preview
             displayImagePreview('image', 'logement-image-preview');

            const boutonSubmit = formLogement.querySelector("button[type='submit']");
            if(boutonSubmit) boutonSubmit.textContent = "Modifier";
            masquerToutContenuPrincipal();
            formLogement.style.display = "block";
            listeLogements.style.display = "block"; // Keep list visible when editing
            formLogement.scrollIntoView({ behavior: "smooth", block: "start" });

        } else {
            console.error("Aucune donnée trouvée pour ce logement ID:", id);
            afficherNotification("Impossible de charger les données du logement.", "error");
            editingLogementId = null;
            // const imageInput = document.getElementById("image"); // Removed, as required HTML attribute is removed
            // if (imageInput) imageInput.required = true; // Removed
            if (logementImagePreview) logementImagePreview.innerHTML = '';
             // Reset quartier select
            if (villeLogementSelect && quartierLogementSelect) {
                 populateQuartiersSelect(villeLogementSelect.value, quartierLogementSelect);
            }
        }
    }, (error) => {
         console.error("Erreur Firebase lors du chargement pour édition:", error);
         afficherNotification("Erreur de chargement des données.", "error");
         editingLogementId = null;
         // const imageInput = document.getElementById("image"); // Removed
         // if (imageInput) imageInput.required = true; // Removed
         if (logementImagePreview) logementImagePreview.innerHTML = '';
         // Reset quartier select
         if (villeLogementSelect && quartierLogementSelect) {
              populateQuartiersSelect(villeLogementSelect.value, quartierLogementSelect);
         }
    });
}

// Helper function to delete images from storage, handling errors
async function deleteImagesFromStorage(urls) {
    if (!Array.isArray(urls) || urls.length === 0) {
        console.log("Aucune URL d'image fournie pour la suppression.");
        return;
    }
    console.log("Tentative de suppression des images:", urls);
    const deletePromises = urls.map(url => {
        if (url && typeof url === 'string' && url.startsWith('https://firebasestorage.googleapis.com')) {
             try {
                 const imageStorageRef = storage.refFromURL(url);
                 return imageStorageRef.delete()
                    .then(() => console.log(`Image supprimée: ${url}`))
                    .catch(err => console.warn(`Échec suppression image ${url}: ${err.code || err.message}`)); // Log but don't stop others
             } catch (error) {
                  console.warn(`URL Storage invalide, impossible de supprimer: ${url}`, error);
                  return Promise.resolve(); // Continue even if URL is bad
             }
        } else {
             console.warn(`URL invalide ou non-Storage ignorée: ${url}`);
             return Promise.resolve(); // Ignore invalid URLs silently
        }
    });
    try {
         await Promise.all(deletePromises);
         console.log("Suppression des images terminée (avec potentiels avertissements).");
    } catch (error) {
         // This catch might not be strictly necessary if individual promises catch errors,
         // but kept for safety.
         console.error("Erreur lors de la suppression groupée d'images:", error);
    }
}

// MODIFIED: Deletes images from 'images' array and fallback 'image' field
function supprimerLogement(id) {
    if (!currentUser) return;
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce logement ? Cette action est irréversible.")) return;

    const logementRef = database.ref(`entreprises/${currentUser.uid}/logements/${id}`);

    // 1. Get all potential image URLs (from array and single field)
    Promise.all([
        logementRef.child('images').once('value'),
        logementRef.child('image').once('value') // Check old field too
    ]).then(([imagesSnapshot, singleImageSnapshot]) => {
        const imageUrlsFromArray = imagesSnapshot.val() || [];
        const singleImageUrl = singleImageSnapshot.val();
        const allUrlsToDelete = [...(Array.isArray(imageUrlsFromArray) ? imageUrlsFromArray : [])]; // Ensure array
        if (singleImageUrl && !allUrlsToDelete.includes(singleImageUrl)) { // Avoid duplicates if old URL was migrated
            allUrlsToDelete.push(singleImageUrl);
        }

        // 2. Delete images from Storage
        return deleteImagesFromStorage(allUrlsToDelete); // Use helper function
    })
    .then(() => {
        // 3. Supprimer l'entrée de la Realtime Database
        return logementRef.remove();
    })
    .then(() => {
        afficherNotification("Logement supprimé avec succès !", "success");
        // UI update is handled by the 'on value' listener
    })
    .catch((error) => {
        console.error("Erreur lors de la suppression du logement :", error);
        afficherNotification("Erreur lors de la suppression du logement.", "error");
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
        .catch((error) => {
            console.error("Erreur lors de la mise à jour du statut:", error);
            afficherNotification("Erreur màj statut", "error");
        });
}

// MODIFIED: Adds data-label and handles multiple images display
function afficherLogements() {
    if (!currentUser) return;

    const tbody = document.getElementById("tbody-logements");
    const logementsTable = document.getElementById("liste-logements")?.querySelector('table');
    if (!tbody || !logementsTable) {
        console.warn("tbody ou table des logements introuvable");
        return;
    }
    const ref = database.ref(`entreprises/${currentUser.uid}/logements`);

    ref.on('value', (snapshot) => {
        tbody.innerHTML = "";
        if (!snapshot.exists()) {
             tbody.innerHTML = "<tr><td colspan='13'>Aucun logement enregistré.</td></tr>";
             calculerStatistiquesLogements(null);
             return;
        }

        const logementsData = snapshot.val() || {};
        const headers = Array.from(logementsTable.querySelectorAll('thead th')).map(th => th.innerText.trim()); // Get headers for data-label

        let logementsArray = [];
        snapshot.forEach((childSnapshot) => {
            logementsArray.push({ id: childSnapshot.key, ...childSnapshot.val() });
        });
        logementsArray.sort((a, b) => (b.datePublication || 0) - (a.datePublication || 0));

        logementsArray.forEach((logement) => {
            const id = logement.id;
            const tr = document.createElement("tr");
            const statutClass = (logement.statut || 'libre').toLowerCase().replace(/[éèê]/g, 'e').replace(/\s+/g, '-');

            // MODIFIED: Get image info
             const imageArray = Array.isArray(logement.images) ? logement.images : [];
             const imageUrl = imageArray.length > 0 ? imageArray[0] : logement.image || null; // Use first from array or fallback
             const imageCount = imageArray.length > 0 ? imageArray.length : (logement.image ? 1 : 0); // Count based on array or fallback

             // Add data-label attributes to each cell
             // Ensure data-labels match the potentially reordered/removed headers in the future if table structure changes
             const dataLabels = ['ID', 'Titre', 'Type', 'Description', 'Etat', 'Prix', 'Démarcheur', 'Propriétaire', 'Quartier', 'Ville', 'Image', 'Statut', 'Actions']; // Hardcoded labels for safety

             tr.innerHTML = `
                <td data-label="${dataLabels[0]}">${id ? id.substring(0, 6) + '...' : 'N/A'}</td>
                <td data-label="${dataLabels[1]}">${logement.titre || 'N/A'}</td>
                <td data-label="${dataLabels[2]}">${logement.type || 'N/A'}</td>
                <td data-label="${dataLabels[3]}">${(logement.description || 'N/A').substring(0, 30)}...</td>
                <td data-label="${dataLabels[4]}">${logement.etat || 'N/A'}</td>
                <td data-label="${dataLabels[5]}">${logement.prix ? logement.prix.toLocaleString('fr-FR') + ' FCFA' : 'N/A'}</td>
                <td data-label="${dataLabels[6]}">${logement.demarcheur || 'N/A'}</td>
                <td data-label="${dataLabels[7]}">${logement.proprietaire || 'N/A'}</td>
                <td data-label="${dataLabels[8]}">${logement.quartier || 'N/A'}</td>
                <td data-label="${dataLabels[9]}">${logement.ville || 'N/A'}</td>
                <td data-label="${dataLabels[10]}">
                  ${imageUrl ? `<img src="${imageUrl}" alt="${logement.titre || 'Image'}" onclick="window.open('${imageUrl}', '_blank')">` : 'Aucune'}
                  ${imageCount > 1 ? `<span class="image-count">(+${imageCount - 1})</span>` : ''}
                </td>
                <td data-label="${dataLabels[11]}"><span class="statut-${statutClass}">${logement.statut || 'N/A'}</span></td>
                <td class="action-buttons" data-label="${dataLabels[12]}">
                    <button onclick="editerLogement('${id}')" title="Éditer"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-square" viewBox="0 0 16 16"><path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/><path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5z"/></svg></button>
                    <button onclick="supprimerLogement('${id}')" title="Supprimer"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash3-fill" viewBox="0 0 16 16"><path d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5m-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5M4.5 5.029l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06m6.53-.528a.5.5 0 0 0-.528.47l-.5 8.5a.5.5 0 0 0 .998.058l.5-8.5a.5.5 0 0 0-.47-.528M8 4.5a.5.5 0 0 0-.5.5v8.5a.5.5 0 0 0 1 0V5a.5.5 0 0 0-.5-.5"/></svg></button>
                    <button onclick="changerStatutLogement('${id}', '${logement.statut || 'Libre'}')" title="Changer Statut">
                         ${logement.statut === 'Libre' ? '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-bookmark-plus-fill" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M2 15.5V2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v13.5a.5.5 0 0 1-.74.439L8 13.069l-5.26 2.87A.5.5 0 0 1 2 15.5m6.5-11a.5.5 0 0 0-1 0V6H6a.5.5 0 0 0 0 1h1.5v1.5a.5.5 0 0 0 1 0V7H10a.5.5 0 0 0 0-1H8.5z"/></svg>' : (logement.statut === 'Réservé' ? '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-building-fill-check" viewBox="0 0 16 16"><path d="M12.5 16a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7m1.679-4.493l-1.335 2.226a.75.75 0 0 1-1.174.144l-.774-.773a.5.5 0 0 1 .708-.708l.547.548 1.17-1.951a.5.5 0 1 1 .858.514Z"/><path d="M2 1a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v7.256A4.5 4.5 0 0 0 12.5 8a4.5 4.5 0 0 0-3 1.07V1H3v14h3v-2.5a.5.5 0 0 1 .5-.5H8v4H3a1 1 0 0 1-1-1z"/><path d="M4.5 6.5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5zm3 0a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5zm3 0a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5zm-6 3a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5zm3 0a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5z"/></svg>' : '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-door-open-fill" viewBox="0 0 16 16"><path d="M1.5 15a.5.5 0 0 0 0 1h13a.5.5 0 0 0 0-1H13V2.5A1.5 1.5 0 0 0 11.5 1H11V.5a.5.5 0 0 0-.57-.495l-7 1A.5.5 0 0 0 3 1.5V15zM11 2h.5a.5.5 0 0 1 .5.5V15h-1zM6.5 10h-.081l-.287-.845A.5.5 0 0 1 6.561 9h.878a.5.5 0 0 1 .46.289L7.58 10H7.5a.5.5 0 0 1 0 1h.081l.287.846a.5.5 0 0 1-.46.654H6.561a.5.5 0 0 1-.459-.654L6.16 11H6.5a.5.5 0 0 1 0-1"/></svg>')}
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        calculerStatistiquesLogements(snapshot.val());

    }, (error) => {
        console.error("Erreur Firebase lors de l'écoute des logements:", error);
        tbody.innerHTML = "<tr><td colspan='13'>Erreur lors du chargement des données.</td></tr>";
        calculerStatistiquesLogements(null);
    });
}

// Attacher le listener au formulaire logement
if (formLogement) {
  formLogement.addEventListener("submit", ajouterOuModifierLogement);
  const boutonAfficherLogements = document.getElementById("afficher-form-logement-btn");
  if (boutonAfficherLogements) {
      boutonAfficherLogements.addEventListener('click', () => {
          // const imageInput = document.getElementById("image"); // Removed
          // if (imageInput) imageInput.required = true; // Removed
          const boutonSubmit = formLogement.querySelector("button[type='submit']");
          if(boutonSubmit) boutonSubmit.textContent = "Ajouter";
          editingLogementId = null;
          formLogement.reset();
          if (logementImagePreview) logementImagePreview.innerHTML = '';
          // Reset quartier select when switching to add form
          if (villeLogementSelect && quartierLogementSelect) {
              populateQuartiersSelect(villeLogementSelect.value, quartierLogementSelect);
          }
      });
  }
   // Initial population of quartier select when the form is first shown or on load if it's the default
   // (handled by the event listener below)
   if (villeLogementSelect && quartierLogementSelect) {
      villeLogementSelect.addEventListener('change', (event) => {
          populateQuartiersSelect(event.target.value, quartierLogementSelect);
      });
       // Trigger initial population on load for the default selected city (which is likely empty)
       populateQuartiersSelect(villeLogementSelect.value, quartierLogementSelect);
   }

}


// --- LOCATAIRES ---
// MODIFIED: Updated JS validation
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

     // --- JS Validation (Keep for essential fields even if HTML 'required' removed) ---
     if (!nom) { afficherNotification("Le nom est requis.", "error"); boutonSubmit.disabled = false; boutonSubmit.textContent = editingLocataireId ? "Modifier" : "Ajouter"; return; }
     if (!prenoms) { afficherNotification("Les prénoms sont requis.", "error"); boutonSubmit.disabled = false; boutonSubmit.textContent = editingLocataireId ? "Modifier" : "Ajouter"; return; }
     // adresse can be empty
     if (!email) { afficherNotification("L'email est requis.", "error"); boutonSubmit.disabled = false; boutonSubmit.textContent = editingLocataireId ? "Modifier" : "Ajouter"; return; }
     if (email && !/^\S+@\S+\.\S+$/.test(email)) { afficherNotification("Veuillez entrer une adresse email valide.", "error"); boutonSubmit.disabled = false; boutonSubmit.textContent = editingLocataireId ? "Modifier" : "Ajouter"; return; }
     // facebook can be empty
     if (!contact) { afficherNotification("Le contact est requis.", "error"); boutonSubmit.disabled = false; boutonSubmit.textContent = editingLocataireId ? "Modifier" : "Ajouter"; return; }
     // --- End JS Validation ---


    const locataireData = {
        nom, prenoms, adresse: adresse || null, email, facebook: facebook || null, contact, // Allow null for optional fields
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

            const boutonSubmit = formLocataire.querySelector("button[type='submit']");
            if(boutonSubmit) boutonSubmit.textContent = "Modifier";

            masquerToutContenuPrincipal();
            formLocataire.style.display = "block";
            listeLocataires.style.display = "block"; // Keep list visible when editing
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

// MODIFIED: Adds data-label attributes
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

        locatairesArray.sort((a, b) => (a.nom || '').localeCompare(b.nom || ''));

        locatairesArray.forEach((locataire) => {
            const id = locataire.id;
            const tr = document.createElement("tr");
             // Add data-label attributes
            const dataLabels = ['ID', 'Nom', 'Prénoms', 'Adresse', 'Email', 'Facebook', 'Contact', 'Actions']; // Hardcoded labels for safety

            tr.innerHTML = `
                <td data-label="${dataLabels[0]}">${id ? id.substring(0, 6) + '...' : 'N/A'}</td>
                <td data-label="${dataLabels[1]}">${locataire.nom || 'N/A'}</td>
                <td data-label="${dataLabels[2]}">${locataire.prenoms || 'N/A'}</td>
                <td data-label="${dataLabels[3]}">${locataire.adresse || 'N/A'}</td>
                <td data-label="${dataLabels[4]}">${locataire.email || 'N/A'}</td>
                <td data-label="${dataLabels[5]}">${locataire.facebook ? `<a href="${locataire.facebook.startsWith('http') ? '' : '//'}${locataire.facebook}" target="_blank" rel="noopener noreferrer">Lien</a>` : 'N/A'}</td>
                <td data-label="${dataLabels[6]}">${locataire.contact || 'N/A'}</td>
                <td class="action-buttons" data-label="${dataLabels[7]}">
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
// MODIFIED: Uses uploadMultipleImages and saves 'images' array, updated JS validation
async function ajouterOuModifierBien(event) {
    event.preventDefault();
    if (!currentUser || !formBien || !villeBienSelect) return;

    const boutonSubmit = formBien.querySelector("button[type='submit']");
    boutonSubmit.disabled = true;
    boutonSubmit.textContent = editingBienId ? "Modification..." : "Ajout...";

    const titre = document.getElementById("titreBien").value.trim();
    const description = document.getElementById("descriptionBien").value.trim();
    const etat = document.getElementById("etatBien").value;
    const prixInput = document.getElementById("prixBien");
    const prix = prixInput.value ? parseInt(prixInput.value) : 0;
    const proprietaire = document.getElementById("proprietaireBien").value.trim();
    const ville = document.getElementById("villeBien").value; // Get value from select
    const imageInput = document.getElementById("imageBien");
    const imageFiles = imageInput ? imageInput.files : null;

    // --- JS Validation (Keep for essential fields even if HTML 'required' removed) ---
    if (!titre) { afficherNotification("Le titre est requis.", "error"); boutonSubmit.disabled = false; boutonSubmit.textContent = editingBienId ? "Modifier" : "Ajouter"; return; }
    if (!description) { afficherNotification("La description est requise.", "error"); boutonSubmit.disabled = false; boutonSubmit.textContent = editingBienId ? "Modifier" : "Ajouter"; return; }
    if (!etat) { afficherNotification("L'état du bien est requis.", "error"); boutonSubmit.disabled = false; boutonSubmit.textContent = editingBienId ? "Modifier" : "Ajouter"; return; }
    if (prix <= 0) { afficherNotification("Le prix doit être supérieur à zéro.", "error"); boutonSubmit.disabled = false; boutonSubmit.textContent = editingBienId ? "Modifier" : "Ajouter"; return; }
     // proprietaire can be empty
    if (!ville) { afficherNotification("La ville est requise.", "error"); boutonSubmit.disabled = false; boutonSubmit.textContent = editingBienId ? "Modifier" : "Ajouter"; return; }
    // --- End JS Validation ---


    try {
        let uploadedImageUrls = [];
        if (imageFiles && imageFiles.length > 0) {
            afficherNotification(`Upload de ${imageFiles.length} image(s)...`, "info");
            uploadedImageUrls = await uploadMultipleImages(imageFiles, 'biens'); // Use new function
             if (uploadedImageUrls.length !== imageFiles.length) {
                 afficherNotification(`Attention: Échec de l'upload pour ${imageFiles.length - uploadedImageUrls.length} image(s).`, "warning");
             }
        }


        const bienData = {
            titre, description, etat, prix, proprietaire: proprietaire || null, ville, // Allow null for optional field
            derniereModification: firebase.database.ServerValue.TIMESTAMP,
            datePublication: editingBienId ? undefined : firebase.database.ServerValue.TIMESTAMP // Only set datePublication on add
        };

        const refPath = `entreprises/${currentUser.uid}/biens`;
        let actionPromise;
        let finalImageUrls = [];

        if (editingBienId) {
             const bienRef = database.ref(`${refPath}/${editingBienId}`);
             const oldImagesSnapshot = await bienRef.child('images').once('value');
             const oldImageUrlsArray = oldImagesSnapshot.val() || [];
             const oldSingleSnapshot = await bienRef.child('image').once('value');
             const oldSingleImageUrl = oldSingleSnapshot.val();


             if (uploadedImageUrls.length > 0) {
                 finalImageUrls = uploadedImageUrls;
                 console.log("Bien MAJ: Utilisation nouvelles images:", finalImageUrls);
                 const imagesToDelete = [...(Array.isArray(oldImageUrlsArray) ? oldImageUrlsArray : [])]; // Ensure array
                 if(oldSingleImageUrl && !imagesToDelete.includes(oldSingleImageUrl)) imagesToDelete.push(oldSingleImageUrl); // Avoid duplicates
                  if(imagesToDelete.length > 0) {
                     setTimeout(() => deleteImagesFromStorage(imagesToDelete), 5000);
                 }
             } else {
                 finalImageUrls = oldImageUrlsArray;
                 if((!finalImageUrls || finalImageUrls.length === 0) && oldSingleImageUrl){
                     finalImageUrls = [oldSingleImageUrl];
                 }
                 console.log("Bien MAJ: Conservation images existantes:", finalImageUrls);
             }
             bienData.images = finalImageUrls;
             bienData.image = null;

            actionPromise = bienRef.update(bienData);
            afficherNotification("Bien modifié !", "success");
        } else {
            // KEEP THIS CHECK: A new listing needs at least one image to be useful
             if (!imageFiles || imageFiles.length === 0) {
                 afficherNotification("Veuillez sélectionner au moins une image pour un nouveau bien.", "error");
                 boutonSubmit.disabled = false;
                 boutonSubmit.textContent = "Ajouter";
                 return;
             }
             if (uploadedImageUrls.length === 0) {
                 // If files were selected but upload failed for all
                 afficherNotification("Aucune image n'a pu être uploadée. Veuillez réessayer.", "error");
                 boutonSubmit.disabled = false;
                 boutonSubmit.textContent = "Ajouter";
                 return;
            }
            finalImageUrls = uploadedImageUrls;
            bienData.images = finalImageUrls;
            bienData.image = null;

            actionPromise = database.ref(refPath).push(bienData);
            afficherNotification("Bien ajouté !", "success");
        }

        await actionPromise;
        formBien.reset();
        if(imageInput) imageInput.value = '';
        if (bienImagePreview) bienImagePreview.innerHTML = '';
        editingBienId = null;
        boutonSubmit.textContent = "Ajouter";

    } catch (error) {
        console.error("Erreur ajout/modif bien:", error);
        afficherNotification(`Erreur: ${error.message || 'Inconnue'}`, "error");
        boutonSubmit.textContent = editingBienId ? "Modifier" : "Ajouter";
    } finally {
         boutonSubmit.disabled = false;
    }
}

// MODIFIED: Handles edit form display and image preview text, removed image required logic
function editerBien(id) {
    if (!currentUser || !formBien || !villeBienSelect) return;
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
            document.getElementById("villeBien").value = bien.ville || ''; // Set the Ville select

            const imageInput = document.getElementById("imageBien");
            if (imageInput) imageInput.value = '';
            // imageInput.required = false; // Removed

            // MODIFIED: Display existing image count in preview
            displayImagePreview('imageBien', 'bien-image-preview');

            const boutonSubmit = formBien.querySelector("button[type='submit']");
             if(boutonSubmit) boutonSubmit.textContent = "Modifier";

            masquerToutContenuPrincipal();
            formBien.style.display = "block";
            listeBiens.style.display = "block"; // Keep list visible when editing
            formBien.scrollIntoView({ behavior: "smooth", block: "start" });
        } else {
            afficherNotification("Données bien introuvables.", "error");
            editingBienId = null;
            // const imageInput = document.getElementById("imageBien"); // Removed
            // if(imageInput) imageInput.required = true; // Removed
             if (bienImagePreview) bienImagePreview.innerHTML = '';
        }
    }, (error) => {
         afficherNotification("Erreur chargement données.", "error");
         editingBienId = null;
         // const imageInput = document.getElementById("imageBien"); // Removed
         // if(imageInput) imageInput.required = true; // Removed
         if (bienImagePreview) bienImagePreview.innerHTML = '';
    });
}

// MODIFIED: Deletes images from 'images' array and fallback 'image' field
function supprimerBien(id) {
    if (!currentUser) return;
     if (!confirm("Êtes-vous sûr de vouloir supprimer ce bien ?")) return;

    const bienRef = database.ref(`entreprises/${currentUser.uid}/biens/${id}`);

    // 1. Get all potential image URLs
    Promise.all([
        bienRef.child('images').once('value'),
        bienRef.child('image').once('value')
    ]).then(([imagesSnapshot, singleImageSnapshot]) => {
        const imageUrlsFromArray = imagesSnapshot.val() || [];
        const singleImageUrl = singleImageSnapshot.val();
        const allUrlsToDelete = [...(Array.isArray(imageUrlsFromArray) ? imageUrlsFromArray : [])]; // Ensure array
        if (singleImageUrl && !allUrlsToDelete.includes(singleImageUrl)) {
            allUrlsToDelete.push(singleImageUrl);
        }

        // 2. Delete images from Storage
        return deleteImagesFromStorage(allUrlsToDelete);
    })
    .then(() => {
        // 3. Supprimer l'entrée de la Realtime Database
        return bienRef.remove();
    })
    .then(() => {
        afficherNotification("Bien supprimé !", "success");
        // UI update handled by listener
    })
    .catch((error) => {
        console.error("Erreur lors de la suppression du bien:", error);
        afficherNotification("Erreur suppression.", "error");
    });
}

// MODIFIED: Adds data-label and handles multiple images display
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

         biensArray.sort((a, b) => (b.datePublication || 0) - (a.datePublication || 0));

        biensArray.forEach((bien) => {
            const id = bien.id;
            const tr = document.createElement("tr");

            // MODIFIED: Get image info
             const imageArray = Array.isArray(bien.images) ? bien.images : [];
             const imageUrl = imageArray.length > 0 ? imageArray[0] : bien.image || null;
             const imageCount = imageArray.length > 0 ? imageArray.length : (bien.image ? 1 : 0);

             // Add data-label attributes
            const dataLabels = ['ID', 'Titre', 'Description', 'Etat', 'Prix', 'Propriétaire', 'Ville', 'Image', 'Actions']; // Hardcoded labels for safety

            tr.innerHTML = `
                <td data-label="${dataLabels[0]}">${id ? id.substring(0, 6) + '...' : 'N/A'}</td>
                <td data-label="${dataLabels[1]}">${bien.titre || 'N/A'}</td>
                <td data-label="${dataLabels[2]}">${(bien.description || 'N/A').substring(0, 30)}...</td>
                <td data-label="${dataLabels[3]}">${bien.etat || 'N/A'}</td>
                <td data-label="${dataLabels[4]}">${bien.prix ? bien.prix.toLocaleString('fr-FR') + ' FCFA' : 'N/A'}</td>
                <td data-label="${dataLabels[5]}">${bien.proprietaire || 'N/A'}</td>
                <td data-label="${dataLabels[6]}">${bien.ville || 'N/A'}</td>
                <td data-label="${dataLabels[7]}">
                   ${imageUrl ? `<img src="${imageUrl}" alt="${bien.titre || 'Image'}" onclick="window.open('${imageUrl}', '_blank')">` : 'Aucune'}
                   ${imageCount > 1 ? `<span class="image-count">(+${imageCount - 1})</span>` : ''}
                </td>
                <td class="action-buttons" data-label="${dataLabels[8]}">
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
     const boutonAfficherBiens = document.getElementById("afficher-form-bien-btn");
     if (boutonAfficherBiens) {
         boutonAfficherBiens.addEventListener('click', () => {
             // const imageInput = document.getElementById("imageBien"); // Removed
             // if(imageInput) imageInput.required = true; // Removed
             const boutonSubmit = formBien.querySelector("button[type='submit']");
             if(boutonSubmit) boutonSubmit.textContent = "Ajouter";
             editingBienId = null;
             formBien.reset();
             if (bienImagePreview) bienImagePreview.innerHTML = '';
         });
     }
     // No quartier select for Bien form, so no need for ville change listener here
}


// --- STATISTIQUES LOGEMENTS ---
function calculerStatistiquesLogements(logementsData) {
    const statsLibres = document.getElementById('stat-logements-libres');
    const statsReserves = document.getElementById('stat-logements-reserves');
    const statsOccupes = document.getElementById('stat-logements-occupes');
    const statsMensuel = document.getElementById('stat-logements-total-mensuel');
    const statsAnnuel = document.getElementById('stat-logements-total-annuel');

    if (!statsLibres || !statsReserves || !statsOccupes || !statsMensuel || !statsAnnuel) return;

    let libres = 0, reserves = 0, occupes = 0;
    let totalMensuel = 0, totalAnnuel = 0;

    if (logementsData) {
        const dateActuelle = new Date();
        const moisActuel = dateActuelle.getMonth();
        const anneeActuelle = dateActuelle.getFullYear();

        Object.values(logementsData).forEach(logement => {
            const statut = (logement.statut || 'Libre').toLowerCase();
            if (statut === 'libre') libres++;
            else if (statut === 'réservé' || statut === 'reserve') reserves++;
            else if (statut === 'occupé' || statut === 'occupe') occupes++;

            if (logement.datePublication) {
                try {
                    const publicationDate = new Date(logement.datePublication);
                    if (!isNaN(publicationDate)) {
                        const publicationMois = publicationDate.getMonth();
                        const publicationAnnee = publicationDate.getFullYear();
                        if (publicationAnnee === anneeActuelle) {
                            totalAnnuel++;
                            if (publicationMois === moisActuel) {
                                totalMensuel++;
                            }
                        }
                    } else {
                        console.warn("Date publication invalide:", logement.titre, logement.datePublication);
                    }
                } catch (e) {
                     console.warn("Erreur parsing date pub:", logement.titre, logement.datePublication, e);
                }
            }
        });
    }

    statsLibres.textContent = libres;
    statsReserves.textContent = reserves;
    statsOccupes.textContent = occupes;
    statsMensuel.textContent = totalMensuel;
    statsAnnuel.textContent = totalAnnuel;
}

// --- DEMANDES DE PAIEMENT ---
// MODIFIED: Updated JS validation
function ajouterDemandePaiement(event) {
    event.preventDefault();
    if (!currentUser || !formDemandePaiement) return;

    const boutonSubmit = formDemandePaiement.querySelector("button[type='submit']");
    boutonSubmit.disabled = true;
    boutonSubmit.textContent = "Envoi...";

    const etablissementInput = document.getElementById("demande-paiement-etablissement");
    const etablissement = etablissementInput ? etablissementInput.value : '';

    const montantInput = document.getElementById("demande-paiement-montant");
    const montant = montantInput.value ? parseInt(montantInput.value) : 0;
    const contactPaiementInput = document.getElementById("demande-paiement-contact");
    const contactPaiement = contactPaiementInput ? contactPaiementInput.value.trim() : '';
    const situationInput = document.getElementById("demande-paiement-situation");
    const situation = situationInput ? situationInput.value.trim() : '';
    const date = firebase.database.ServerValue.TIMESTAMP;
    const statut = "En attente";

     // --- JS Validation (Keep for essential fields even if HTML 'required' removed) ---
     if (!etablissement || etablissement === "[Nom non défini]") {
         afficherNotification("Nom d'établissement invalide. Chargez d'abord votre profil.", "error");
         boutonSubmit.disabled = false;
         boutonSubmit.textContent = "Soumettre la Demande";
         return;
     }
     if (montant <= 0) {
         afficherNotification("Le montant doit être supérieur à zéro.", "error");
         boutonSubmit.disabled = false;
         boutonSubmit.textContent = "Soumettre la Demande";
         return;
     }
     if (!contactPaiement) {
         afficherNotification("Le contact pour le paiement est requis.", "error");
         boutonSubmit.disabled = false;
         boutonSubmit.textContent = "Soumettre la Demande";
         return;
     }
      if (!situation) {
         afficherNotification("La situation (motif) est requise.", "error");
         boutonSubmit.disabled = false;
         boutonSubmit.textContent = "Soumettre la Demande";
         return;
     }
     // --- End JS Validation ---


    const nouvelleDemandeRef = database.ref(`entreprises/${currentUser.uid}/demandesPaiement`).push();
    const demandeData = { // Defined for potential use in email notification
        date, etablissement, montant, contactPaiement, situation, statut,
        demandeurId: currentUser.uid
    };
    nouvelleDemandeRef.set(demandeData)
    .then(() => {
        afficherNotification("Demande de paiement soumise !", "success");
         if(montantInput) montantInput.value = '';
         if(contactPaiementInput) contactPaiementInput.value = '';
         if(situationInput) situationInput.value = '';

        // START OF MODIFICATION: Comment for email notification
        // TODO: Implement backend email notification to the main project administrator.
        // This would typically involve a Firebase Cloud Function triggered on new data in 'demandesPaiement'.
        // Example data to send:
        // const emailSubject = `Nouvelle demande de paiement de ${etablissement}`;
        // const emailBody = `
        //   Une nouvelle demande de paiement a été soumise :
        //   Établissement: ${etablissement}
        //   Montant: ${montant} FCFA
        //   Contact Paiement: ${contactPaiement}
        //   Situation: ${situation}
        //   Date: ${new Date(firebase.database.ServerValue.TIMESTAMP).toLocaleString('fr-FR')} // Note: This timestamp is a placeholder.
        //                                                                              // In a Cloud Function, you'd get the actual timestamp from the event.
        //   ID Demandeur: ${currentUser.uid}
        // `;
        // console.log("SIMULATE SENDING EMAIL:", emailSubject, emailBody);
        // END OF MODIFICATION
    })
    .catch((error) => {
        console.error("Erreur soumission demande:", error);
        afficherNotification("Erreur lors de la soumission.", "error");
    }).finally(() => {
         boutonSubmit.disabled = false;
         boutonSubmit.textContent = "Soumettre la Demande";
    });
}

// MODIFIED: Adds data-label attributes
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
             tbody.innerHTML = "<tr><td colspan='7'>Aucune demande de paiement.</td></tr>";
             return;
         }

        const headers = Array.from(demandesTable.querySelectorAll('thead th')).map(th => th.innerText.trim());
        let demandesArray = [];
         snapshot.forEach((childSnapshot) => {
            demandesArray.push({ id: childSnapshot.key, ...childSnapshot.val() });
         });
         demandesArray.reverse();

        demandesArray.forEach((demande) => {
            const tr = document.createElement("tr");
            const dateLisible = demande.date ? new Date(demande.date).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short'}) : 'N/A';
            const statutClass = (demande.statut || 'en attente').toLowerCase()
                                  .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                                  .replace(/\s+/g, '-');

             // Add data-label attributes
            const dataLabels = ['ID', 'Date', 'Établissement', 'Montant (FCFA)', 'Contact Paiement', 'Situation', 'Statut']; // Hardcoded labels for safety

             tr.innerHTML = `
                <td data-label="${dataLabels[0]}">${demande.id ? demande.id.substring(0, 6) + '...' : 'N/A'}</td>
                <td data-label="${dataLabels[1]}">${dateLisible}</td>
                <td data-label="${dataLabels[2]}">${demande.etablissement || 'N/A'}</td>
                <td data-label="${dataLabels[3]}">${demande.montant ? demande.montant.toLocaleString('fr-FR') + ' FCFA' : 'N/A'}</td>
                <td data-label="${dataLabels[4]}">${demande.contactPaiement || 'N/A'}</td>
                <td data-label="${dataLabels[5]}">${demande.situation || 'N/A'}</td>
                <td data-label="${dataLabels[6]}"><span class="statut-paiement-${statutClass}">${demande.statut || 'N/A'}</span></td>
            `;
            tbody.appendChild(tr);
         });

    }, (error) => {
        console.error("Erreur écoute demandes:", error);
        tbody.innerHTML = "<tr><td colspan='7'>Erreur chargement données.</td></tr>";
    });
}

// Attacher listener au formulaire de demande
if (formDemandePaiement) {
    formDemandePaiement.addEventListener("submit", ajouterDemandePaiement);
}

// --- PROFIL ADMINISTRATEUR ---
// MODIFIED: Updated JS validation
function afficherProfilAdmin() {
    if (!currentUser || !profilSection) return;

    const entrepriseRef = database.ref(`entreprises/${currentUser.uid}`);
    entrepriseRef.once('value')
        .then((snapshot) => {
            const entrepriseData = snapshot.val();
            if (profilEmailInput) {
                profilEmailInput.value = currentUser.email;
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

// MODIFIED: Updated JS validation
function mettreAJourProfilAdmin(event) {
    event.preventDefault();
    if (!currentUser || !formProfil || !profilEntrepriseNameInput || !profilContactInput) return;

    const boutonSubmit = formProfil.querySelector("button[type='submit']");
    boutonSubmit.disabled = true;
    boutonSubmit.textContent = "Mise à jour...";

    const nouveauNom = profilEntrepriseNameInput.value.trim();
    const nouveauContact = profilContactInput.value.trim();

     // --- JS Validation (Keep for essential fields even if HTML 'required' removed) ---
     if (!nouveauNom) {
         afficherNotification("Le nom de l'entreprise est requis.", "error", "profil-notification");
         boutonSubmit.disabled = false;
         boutonSubmit.textContent = "Sauvegarder les modifications";
         return;
     }
      if (!nouveauContact) {
         afficherNotification("Le contact principal est requis.", "error", "profil-notification");
         boutonSubmit.disabled = false;
         boutonSubmit.textContent = "Sauvegarder les modifications";
         return;
     }
     // --- End JS Validation ---

    const updates = {
        nom: nouveauNom,
        contact: nouveauContact,
        whatsapp: nouveauContact, // Update whatsapp too
        derniereModification: firebase.database.ServerValue.TIMESTAMP
    };

    database.ref(`entreprises/${currentUser.uid}`).update(updates)
        .then(() => {
            afficherNotification("Profil mis à jour !", "success", "profil-notification");
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
// MODIFIED: Updated to handle image preview clearing and setting required attribute (removed required logic)
function setupMenuButton(buttonId, showForm, showList, editVarName, formElement, listElement, imageInputId = null, previewElementId = null) {
    const button = document.getElementById(buttonId);
    if (button) {
        button.addEventListener("click", () => {
            if (!currentUser) return;
            masquerToutContenuPrincipal(); // Cache tout

            // Affiche le formulaire et la liste associés
            if (formElement) formElement.style.display = showForm ? "block" : "none";
            if (listElement) listElement.style.display = showList ? "block" : "none";

            // Réinitialise l'état d'édition si on clique sur le bouton du menu
            if (editVarName && typeof window[editVarName] !== 'undefined') {
                window[editVarName] = null;
                 if (formElement) {
                     formElement.reset();
                     const submitBtn = formElement.querySelector("button[type='submit']");
                     if (submitBtn) submitBtn.textContent = "Ajouter";
                     if (imageInputId) {
                         const imgInput = document.getElementById(imageInputId);
                         if (imgInput) {
                             imgInput.value = '';
                             // imgInput.required = true; // Removed: HTML required attribute is removed
                         }
                     }
                     if (previewElementId) {
                         const previewEl = document.getElementById(previewElementId);
                         if (previewEl) previewEl.innerHTML = ''; // Clear preview
                     }
                 }
             }

            if (buttonId === 'afficher-demandes-paiement-btn') {
                 const demandeEtablissementInput = document.getElementById("demande-paiement-etablissement");
                 const entrepriseNameElement = document.getElementById('entreprise-name');
                 if(demandeEtablissementInput && entrepriseNameElement && entrepriseNameElement.textContent !== "[Erreur chargement]" && entrepriseNameElement.textContent !== "[Nom non défini]") {
                     demandeEtablissementInput.value = entrepriseNameElement.textContent;
                 }
            }
             if (buttonId === 'afficher-profil-btn') {
                 afficherProfilAdmin();
             }
             // Specific logic for Logement form reset (quartier dropdown)
            if (buttonId === 'afficher-form-logement-btn' && formLogement && villeLogementSelect && quartierLogementSelect) {
                // When showing the add form, reset the quartier select based on the default/current ville
                populateQuartiersSelect(villeLogementSelect.value, quartierLogementSelect);
            }
        });
    }
}

// Configuration des boutons du menu (Added previewElementId)
setupMenuButton("afficher-form-logement-btn", true, true, 'editingLogementId', formLogement, listeLogements, 'image', 'logement-image-preview');
setupMenuButton("afficher-form-locataire-btn", true, true, 'editingLocataireId', formLocataire, listeLocataires);
setupMenuButton("afficher-form-bien-btn", true, true, 'editingBienId', formBien, listeBiens, 'imageBien', 'bien-image-preview');
setupMenuButton("afficher-demandes-paiement-btn", true, true, null, formDemandePaiement, listeDemandesPaiement); // Pas de variable d'édition
setupMenuButton("afficher-profil-btn", true, false, null, profilSection, null); // Pas de liste, pas d'édition


// --- EXPORTATION ---
function getTableData(tableId) {
    const table = document.getElementById(tableId)?.querySelector('table');
    if (!table) {
        console.error(`Table non trouvée dans la div ID "${tableId}".`);
        return null;
    }

    const data = [];
    const headersForMapping = []; // To store original headers for index mapping
    const headersForExport = []; // Headers to actually include in the export
    let skippedHeaders = [];
    // let imageColumnIndex = -1; // Not needed for export data itself

    table.querySelectorAll('thead th').forEach((th, index) => {
        const headerText = th.innerText.trim();
        const lowerHeaderText = headerText.toLowerCase();
        headersForMapping.push(lowerHeaderText); // Store lowercase for mapping
    });

    // Define skipped headers based on table type
    // Note: Image column is skipped for export as its content is complex (img tag + span)
    if (tableId === 'liste-logements' || tableId === 'liste-biens') {
        skippedHeaders = ['actions', 'image'];
    } else if (tableId === 'liste-locataires') {
         skippedHeaders = ['actions'];
    } else if (tableId === 'liste-demandes-paiement') {
         skippedHeaders = []; // Keep all
    }

    // Populate headersForExport, skipping the ignored ones
    table.querySelectorAll('thead th').forEach((th, index) => {
         const lowerHeaderText = headersForMapping[index]; // Use the mapped lowercase header
         if (!skippedHeaders.includes(lowerHeaderText)) {
             headersForExport.push(th.innerText.trim()); // Use original case for export
         }
    });

     if (headersForExport.length > 0) data.push(headersForExport);

    // Get rows
    table.querySelectorAll('tbody tr').forEach(tr => {
        if (tr.querySelector('td[colspan]')) return; // Skip "Aucun élément" rows

        const rowData = [];
        tr.querySelectorAll('td').forEach((td, index) => {
             // Find the original header text corresponding to this cell's index
             const originalHeaderIndex = headersForMapping.findIndex((_, hIdx) => {
                 // On mobile, use data-label to find the corresponding header in the original order
                 if (td.dataset.label && headersForExport.includes(td.dataset.label)) {
                      return headersForMapping[hIdx] === td.dataset.label.toLowerCase();
                 }
                 // On desktop, use the direct index
                 return hIdx === index;
             });

            const lowerHeaderText = headersForMapping[originalHeaderIndex];

            if (!skippedHeaders.includes(lowerHeaderText)) { // Check if this column should be skipped
                let cellText = td.innerText || '';
                 // Extract relevant text for complex cells like links or spans (status)
                 if(td.querySelector('a')) cellText = td.querySelector('a').textContent;
                 else if (td.querySelector('span')) { // Status span
                     cellText = td.querySelector('span').textContent;
                 } else {
                      // For regular text nodes, use textContent
                      cellText = td.textContent;
                 }
                 rowData.push(cellText.trim());
            }
        });
        if(rowData.length > 0) data.push(rowData);
    });

    return data;
}


function exportToExcel(tableId) {
     const data = getTableData(tableId);
     if (!data || data.length <= 1) {
        afficherNotification("Aucune donnée à exporter.", "warning");
        return;
    }

    try {
        const ws = XLSX.utils.aoa_to_sheet(data);
         // Estimate column widths
         const colWidths = data[0].map((_, i) => {
             // Find max length in column, cap at a reasonable number (e.g., 30-40)
             const maxLength = Math.max(...data.map(row => row[i] ? row[i].toString().length : 0));
             return { wch: Math.min(maxLength + 2, 40) }; // +2 for padding, max 40 chars
         });
         ws['!cols'] = colWidths;

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Données");

        const date = new Date();
        const dateStr = date.toISOString().split('T')[0];
        const timeStr = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }).replace(/:/g, '');
        const filename = `${tableId.replace('liste-', '').replace(/-/g, '_')}_export_${dateStr}_${timeStr}.xlsx`; // Changed dash to underscore

        XLSX.writeFile(wb, filename);
        afficherNotification("Exportation Excel terminée.", "success");
    } catch(error) {
         console.error("Erreur Export Excel:", error);
         afficherNotification("Erreur lors de l'exportation Excel.", "error");
    }
}

function exportToPDF(tableId) {
     const data = getTableData(tableId);
     if (!data || data.length <= 1) {
         afficherNotification("Aucune donnée à exporter pour le PDF.", "warning");
         return;
     }

    if (typeof window.jspdf === 'undefined' || typeof window.jspdf.jsPDF === 'undefined' || typeof window.jspdf.jsPDF.API === 'undefined' || typeof window.jspdf.jsPDF.API.autoTable === 'undefined') {
        console.error("jsPDF ou jsPDF-AutoTable non chargé.");
        afficherNotification("Erreur préparation PDF (librairie manquante).", "error");
        return;
    }

    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

        const head = [data[0]];
        const body = data.slice(1);

        const title = tableId.replace('liste-', '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) + " (ESPACE BENIN)";
        doc.setFontSize(16); // Slightly larger title
        doc.text(title, doc.internal.pageSize.width / 2, 15, { align: 'center' }); // Center title

         // Dynamic column widths (simple estimation)
        const columns = head[0].map(header => ({ header: header, dataKey: header }));
        const columnStyles = {};
         // Estimate column widths based on header and content length, relative to total width
         const totalTableWidth = doc.internal.pageSize.width - 16; // A4 landscape width minus margins
         const totalHeaderLength = head[0].reduce((sum, header) => sum + header.length, 0);

         head[0].forEach((header, index) => {
             const headerLength = header.length;
              // Try to find the corresponding column index in the *original* data structure before skipping columns
             const originalIndex = getTableData(tableId)[0].indexOf(header); // This is not reliable after skipping...

             // A more robust approach: map based on the header text itself.
             // Find the index of this header in the *full* original header list (before skipping)
             const originalHeaderIndex = document.getElementById(tableId)?.querySelector('table thead tr')?.querySelectorAll('th') ?
                                        Array.from(document.getElementById(tableId).querySelector('table thead tr').querySelectorAll('th')).findIndex(th => th.innerText.trim() === header) : -1;

             let maxBodyLength = 0;
             if (originalHeaderIndex !== -1) {
                 maxBodyLength = Math.max(...body.map(row => {
                      // Need to map the *exported* row index back to the *original* column index
                      // This is tricky with dynamic skipping... let's simplify: estimate max length from *exported* data columns.
                      // Assume for now that the order is preserved *among* the non-skipped columns.
                      // Find the index of this header *within the exported headers*.
                      const exportedHeaderIndex = head[0].indexOf(header);
                      if (exportedHeaderIndex !== -1) {
                         return Math.max(...body.map(row => (row[exportedHeaderIndex] ? row[exportedHeaderIndex].toString().length : 0)));
                      }
                      return 0; // Should not happen if header is in head[0]
                 }));
             } else {
                  // Fallback if somehow header wasn't found (shouldn't happen with getTableData logic)
                  maxBodyLength = Math.max(...body.map(row => row[index] ? row[index].toString().length : 0));
             }


             const maxLength = Math.max(headerLength, maxBodyLength);

             // Simple proportional width based on content length, with min/max caps
             let width = (maxLength / totalHeaderLength) * totalTableWidth; // This is a rough estimate
             width = Math.max(width, 15); // Minimum width
             width = Math.min(width, 60); // Maximum width

             columnStyles[header] = { cellWidth: width };

             // Specific width adjustment for known columns
             if (header.toLowerCase().includes('id')) {
                columnStyles[header] = { cellWidth: 20 };
             }
              if (header.toLowerCase().includes('montant')) {
                 columnStyles[header] = { cellWidth: 30 };
             }
              if (header.toLowerCase().includes('date')) {
                 columnStyles[header] = { cellWidth: 30 };
             }
             if (header.toLowerCase().includes('statut')) { // Add specific width for Statut
                 columnStyles[header] = { cellWidth: 25 };
             }
              if (header.toLowerCase().includes('contact')) { // Add specific width for Contact (Locataires/Demandes)
                 columnStyles[header] = { cellWidth: 35 };
             }

         });


        doc.autoTable({
            head: head,
            body: body,
            startY: 25, // Start below the title
            theme: 'grid',
            styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak', halign: 'left' },
            headStyles: { fillColor: [0, 74, 173], textColor: 255, fontStyle: 'bold' },
             columnStyles: columnStyles, // Apply dynamic column styles
            margin: { top: 10, left: 8, right: 8, bottom: 15 },
             didDrawPage: function (data) {
                doc.setFontSize(8);
                const pageCount = doc.internal.getNumberOfPages();
                doc.text('Page ' + doc.internal.getCurrentPageInfo().pageNumber + ' sur ' + pageCount, data.settings.margin.left, doc.internal.pageSize.height - 10);
                 const date = new Date();
                 const exportDateStr = date.toLocaleDateString('fr-FR') + ' ' + date.toLocaleTimeString('fr-FR');
                doc.text('Exporté de ESPACE BENIN Admin le ' + exportDateStr, doc.internal.pageSize.width - data.settings.margin.right, doc.internal.pageSize.height - 10, { align: 'right' });
            }
        });

        const date = new Date();
        const dateStr = date.toISOString().split('T')[0];
        const timeStr = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }).replace(/:/g, '');
        const filename = `${tableId.replace('liste-', '').replace(/-/g, '_')}_export_${dateStr}_${timeStr}.pdf`; // Changed dash to underscore

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
            const tableContainerId = button.dataset.table;
            const format = button.dataset.format;
            if (!tableContainerId) { console.error("Bouton export sans 'data-table'."); return; }
            if (format === "xlsx") exportToExcel(tableContainerId);
            else if (format === "pdf") exportToPDF(tableContainerId);
            else console.warn(`Format export inconnu: ${format}`);
        });
    });
}


// --- MODALES TERMES ET CONFIDENTIALITE ---
const adminTermsModal = document.getElementById('admin-terms-modal');
const adminPrivacyModal = document.getElementById('admin-privacy-modal');

function openModal(modalElement) { if (modalElement) modalElement.style.display = 'block'; }
function closeModal(modalElement) { if (modalElement) modalElement.style.display = 'none'; }

const showAdminTermsLink = document.getElementById('show-admin-terms');
const showAdminPrivacyLink = document.getElementById('show-admin-privacy');
if (showAdminTermsLink && adminTermsModal) showAdminTermsLink.addEventListener('click', (e) => { e.preventDefault(); openModal(adminTermsModal); });
if (showAdminPrivacyLink && adminPrivacyModal) showAdminPrivacyLink.addEventListener('click', (e) => { e.preventDefault(); openModal(adminPrivacyModal); });
document.querySelectorAll('.modal .close-button').forEach(button => button.addEventListener('click', () => closeModal(button.closest('.modal'))));
window.addEventListener('click', (event) => { if (event.target.classList.contains('modal')) closeModal(event.target); });


// --- INITIALISATION ---
document.addEventListener('DOMContentLoaded', () => {
    // The auth.onAuthStateChanged listener will handle showing the login screen
    // if currentUser is null, which will be the case with Persistence.NONE on page load.
    // So, the explicit call to showLogin() here if !auth.currentUser might be redundant
    // but is harmless and ensures the login UI is shown as quickly as possible.
    if (!auth.currentUser) {
       showLogin();
    }

    const voirSitePublicBtn = document.getElementById('voir-site-public-btn');
    if (voirSitePublicBtn) {
        voirSitePublicBtn.addEventListener('click', () => {
            window.open('index.html', '_blank'); // Ouvre index.html dans un nouvel onglet
        });
    }
});
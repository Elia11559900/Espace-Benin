// Configuration de Firebase (ESPACE BENIN)
const firebaseConfigEspaceBenin = {
    apiKey: "AIzaSyAwHqU_XLmDz9VbsxVGN3wbru3-hLDiyNI", // Clé de ESPACE BENIN
    authDomain: "microfinance-68811.firebaseapp.com",
    databaseURL: "https://microfinance-68811-default-rtdb.firebaseio.com",
    projectId: "microfinance-68811",
    storageBucket: "microfinance-68811.appspot.com",
    messagingSenderId: "328514838296",
    appId: "1:328514838296:web:89b35343ca3a14b352c86d",
    measurementId: "G-RBQJH93VWE"
};

// Initialiser Firebase pour ESPACE BENIN (avec un nom unique)
let espaceBeninApp;
let databaseEspaceBenin;
try {
    // Make sure firebase object is available from the SDK script loaded in HTML
    if (typeof firebase !== 'undefined') {
        espaceBeninApp = firebase.initializeApp(firebaseConfigEspaceBenin, "espaceBenin");
        databaseEspaceBenin = espaceBeninApp.database();
        console.log("Firebase for EspaceBenin initialized successfully.");
    } else {
        throw new Error("Firebase SDK not loaded before script.js execution.");
    }
} catch (error) {
    console.error("Firebase (EspaceBenin) initialization failed:", error);
    alert("Erreur critique: Impossible d'initialiser la connexion à la base de données Espace Benin. Certaines fonctionnalités seront indisponibles.");
    const derniersLogementsContainerError = document.getElementById("derniers-logements");
    const temoignagesContainerError = document.querySelector(".temoignages-container");
    if(derniersLogementsContainerError) derniersLogementsContainerError.innerHTML = "<p style='color:red; text-align:center;'>Erreur connexion données.</p>";
    if(temoignagesContainerError) temoignagesContainerError.innerHTML = "<p style='color:red; text-align:center;'>Erreur connexion données.</p>";
}

// --- DOM Element References ---
const loadingIndicator = document.getElementById("loading-indicator");
const resultatsRechercheContainer = document.getElementById("resultats-recherche");
const typeRechercheSelect = document.getElementById("type-recherche");
const champsLogementsDiv = document.getElementById("champs-logements");
const champsBiensDiv = document.getElementById("champs-biens");
const derniersLogementsContainer = document.getElementById("derniers-logements");
const voirPlusButton = document.getElementById("voir-plus");
const dernierePublicationSection = document.getElementById('derniere-publication');
const menuToggle = document.getElementById("menu-toggle");
const mainNav = document.getElementById("main-nav");
const temoignagesContainer = document.querySelector(".temoignages-container");
const formAjoutAvis = document.getElementById("form-ajout-avis");
const adminLoginButton = document.getElementById('admin-login-button');
const detailsModalContainer = document.getElementById('details-modal-container');

// --- State Variable ---
let isAllPublicationsVisible = false; // Tracks if all publications are currently shown

// --- Utility Functions ---
function toggleLoading(show) { if (loadingIndicator) loadingIndicator.style.display = show ? "flex" : "none"; }
function formatCurrency(amount) { if (amount == null || isNaN(Number(amount))) return "Prix non spécifié"; const num = Number(amount); return num.toLocaleString('fr-FR') + " FCFA"; }
function getStatusClass(status) { status = status?.toLowerCase().trim() || 'non spécifié'; switch (status) { case 'payé': return 'status-paye'; case 'réservé': return 'status-reserve'; case 'disponible': case 'libre': return 'status-disponible'; default: return 'status-non-specifie'; } }


// --- Core Functionality (Espace Benin) ---

// Fonction de recherche générique
async function effectuerRecherche(budget, quartier, ville, typeLogement) {
    toggleLoading(true);
    const resultats = {};
    const maintenant = Date.now();
    const typeRechercheSelectionne = typeRechercheSelect ? typeRechercheSelect.value : 'logements';
    const VINGT_QUATRE_HEURES_MS = 24 * 60 * 60 * 1000;

    if (!databaseEspaceBenin) {
         console.error("DB EspaceBenin non init.");
         toggleLoading(false);
         return {};
     }

    try {
        const entreprisesSnapshot = await databaseEspaceBenin.ref('entreprises').once('value');
        const entreprisesData = entreprisesSnapshot.val();
        if (!entreprisesData) return {};

        const fetchPromises = Object.keys(entreprisesData).map(async (entrepriseKey) => {
            const entrepriseNom = entreprisesData[entrepriseKey]?.nom || 'Nom Inconnu';
            const itemsRef = databaseEspaceBenin.ref(`entreprises/${entrepriseKey}/${typeRechercheSelectionne}`);
            const itemsSnapshot = await itemsRef.once('value');
            const itemsData = itemsSnapshot.val();
            if (!itemsData) return;

            for (const itemKey in itemsData) {
                 if (Object.hasOwnProperty.call(itemsData, itemKey)) {
                    const item = itemsData[itemKey];
                    if (typeof item !== 'object' || item === null) continue;

                    let isPaidAndUnavailable = false;
                    if (item.statut === "Payé" && item.datePaiement) {
                        try {
                            const dp = new Date(item.datePaiement).getTime();
                            // Mark as unavailable only if paid WITHIN the last 24 hours
                            if (!isNaN(dp) && (maintenant - dp < VINGT_QUATRE_HEURES_MS)) {
                                isPaidAndUnavailable = true;
                            }
                        } catch(e){ /* Ignore date parsing errors */ }
                    }
                    // Also consider "Occupé" as unavailable for new searches
                    if (isPaidAndUnavailable || item.statut === "Occupé") {
                         continue; // Skip if paid recently or occupied
                    }

                    const itemPrixNum = item.prix != null ? parseFloat(String(item.prix).replace(/[^0-9.,]+/g, "").replace(',', '.')) : null;
                    const budgetMatch = budget === null || (itemPrixNum !== null && !isNaN(itemPrixNum) && itemPrixNum <= budget);
                    const quartierMatch = quartier === null || !quartier || (typeof item.quartier === 'string' && item.quartier.toLowerCase().includes(quartier.toLowerCase()));
                    const villeMatch = ville === null || !ville || (typeof item.ville === 'string' && item.ville.toLowerCase().includes(ville.toLowerCase()));

                    let typeMatch = true;
                    if (typeRechercheSelectionne === 'logements' && typeLogement) {
                       typeMatch = typeof item.type === 'string' && item.type.toLowerCase().includes(typeLogement.toLowerCase());
                    }

                    if (budgetMatch && quartierMatch && villeMatch && typeMatch) {
                        let datePub = 0;
                        try { if(item.datePublication) { datePub = new Date(item.datePublication).getTime(); if(isNaN(datePub)) datePub = 0; } } catch(e){ datePub = 0;}
                        resultats[itemKey + '_' + typeRechercheSelectionne] = {
                            ...item,
                            id: itemKey,
                            entrepriseId: entrepriseKey,
                            entrepriseNom,
                            typeRecherche: typeRechercheSelectionne,
                            statut: item.statut || "Libre", // Default to Libre if missing
                            datePublicationTimestamp: datePub
                        };
                    }
                }
            }
        });

        await Promise.all(fetchPromises);
        return resultats;

    } catch (error) {
        console.error(`Erreur lors de la recherche ${typeRechercheSelectionne}:`, error);
        alert(`Une erreur est survenue lors de la recherche. Veuillez réessayer.`);
        return {};
    } finally {
        toggleLoading(false);
    }
}

// Fonction pour afficher les résultats de recherche (ou tous les biens) dans la page
function afficherResultatsDansLaPage(resultats) {
    if (!resultatsRechercheContainer) return;
    resultatsRechercheContainer.innerHTML = "";
    resultatsRechercheContainer.style.display = "grid"; // Make sure it's displayed as grid

    const resultKeys = Object.keys(resultats);
    if (resultKeys.length === 0) {
        resultatsRechercheContainer.innerHTML = "<p class='text-center' style='grid-column: 1 / -1;'>Aucun résultat ne correspond à vos critères.</p>";
    } else {
        // Sort results by publication date (newest first) before displaying
        const sortedResults = Object.values(resultats).sort((a, b) => {
             // Handle cases where timestamp might be missing or invalid
             const dateA = a.datePublicationTimestamp || 0;
             const dateB = b.datePublicationTimestamp || 0;
             return dateB - dateA;
         });

        sortedResults.forEach(item => {
            if (typeof item === 'object' && item !== null && item.typeRecherche) {
                const divItem = item.typeRecherche === 'logements' ? creerDivLogement(item) : creerDivBien(item);
                if (divItem) {
                   resultatsRechercheContainer.appendChild(divItem);
                }
            }
        });
    }
}

// Fonction pour créer l'affichage d'un BIEN
function creerDivBien(bien) {
    if (!bien || typeof bien !== 'object' || !bien.id) return null;
    const divBien = document.createElement("div");
    divBien.classList.add("bien");
    const statusClass = getStatusClass(bien.statut || 'Libre'); // Default to Libre

    // Handle multiple images: Use the first image for the card
    const imageUrl = (bien.images && bien.images.length > 0) ? bien.images[0] : (bien.image || 'img/placeholder.png');
    const descCourte = bien.description ? bien.description.substring(0, 80) + (bien.description.length > 80 ? '...' : '') : 'Pas de description.';

    divBien.innerHTML = `
        <img src="${imageUrl}" alt="${bien.titre || 'Bien Divers'}" loading="lazy" onerror="this.src='img/placeholder.png';">
        <div class="card-content">
            <h3>${bien.titre || 'Titre non disponible'}</h3>
            <p><span class="detail-label">Description:</span> ${descCourte}</p>
            <p class="price">${formatCurrency(bien.prix)}</p>
            ${bien.quartier || bien.ville ? `<p class="localisation"><i class="fas fa-map-marker-alt"></i> ${bien.quartier || ''}${bien.quartier && bien.ville ? ', ' : ''}${bien.ville || ''}</p>` : ''}
            <p><span class="detail-label">Statut:</span> <span class="status ${statusClass}">${bien.statut || 'Libre'}</span></p> <!-- Default to Libre -->
            <button class="button-details" data-item-id="${bien.id}" data-type="biens">
                <i class="fas fa-info-circle"></i> Voir les Détails
            </button>
        </div>`;

    const btn = divBien.querySelector('.button-details');
    if(btn) {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            // Pass the full item object
            afficherFenetreDetails(bien);
        });
    }
    return divBien;
}

// Fonction pour créer l'affichage d'un LOGEMENT
function creerDivLogement(logement) {
    if (!logement || typeof logement !== 'object' || !logement.id) return null;
    const divLogement = document.createElement("div");
    divLogement.classList.add("logement");
    const statusClass = getStatusClass(logement.statut || 'Libre'); // Default to Libre

    // Handle multiple images: Use the first image for the card
    const imageUrl = (logement.images && logement.images.length > 0) ? logement.images[0] : (logement.image || 'img/placeholder.png');
    const descCourte = logement.description ? logement.description.substring(0, 80) + (logement.description.length > 80 ? '...' : '') : 'Pas de description.';

    divLogement.innerHTML = `
        <img src="${imageUrl}" alt="${logement.titre || 'Logement'}" loading="lazy" onerror="this.src='img/placeholder.png';">
        <div class="card-content">
            <h3>${logement.titre || 'Titre non disponible'}</h3>
            <p><span class="detail-label">Type:</span> ${logement.type || 'N/A'}</p>
            <p><span class="detail-label">Description:</span> ${descCourte}</p>
            <p class="price">${formatCurrency(logement.prix)}</p>
            ${logement.quartier || logement.ville ? `<p class="localisation"><i class="fas fa-map-marker-alt"></i> ${logement.quartier || ''}${logement.quartier && logement.ville ? ', ' : ''}${logement.ville || ''}</p>` : ''}
            <p><span class="detail-label">Statut:</span> <span class="status ${statusClass}">${logement.statut || 'Libre'}</span></p> <!-- Default to Libre -->
            <button class="button-details" data-item-id="${logement.id}" data-type="logements">
                <i class="fas fa-info-circle"></i> Voir les Détails
            </button>
        </div>`;

    const btn = divLogement.querySelector('.button-details');
     if(btn) {
         btn.addEventListener('click', (e) => {
             e.stopPropagation();
             // Pass the full item object
             afficherFenetreDetails(logement);
         });
     }
    return divLogement;
}

// Fonction pour afficher les dernières publications (carousel)
async function afficherDernieresPublications() {
    if (!derniersLogementsContainer || !dernierePublicationSection) return;
    if (!databaseEspaceBenin) {
         console.error("DB EspaceBenin non init.");
         if(derniersLogementsContainer) derniersLogementsContainer.innerHTML = "<p style='color:red; text-align:center;'>Erreur connexion données.</p>";
         return;
     }

    dernierePublicationSection.classList.remove('hidden'); // Ensure CSS hidden class is removed

    derniersLogementsContainer.innerHTML = '<p class="loading" style="text-align:center;">Chargement des publications...</p>';
    let allItems = [];
    const maintenant = Date.now();
    const VINGT_QUATRE_HEURES_MS = 86400000; // 24 hours in milliseconds

    try {
        const entreprisesSnapshot = await databaseEspaceBenin.ref('entreprises').once('value');
        const entreprisesData = entreprisesSnapshot.val();
        if (!entreprisesData) {
            derniersLogementsContainer.innerHTML = "<p style='text-align:center;'>Aucune publication récente.</p>";
            if (voirPlusButton) voirPlusButton.style.display = 'none';
            return;
        }

        const entrepriseNomMap = {};
        for (const key in entreprisesData) {
            if (Object.hasOwnProperty.call(entreprisesData, key)) {
                entrepriseNomMap[key] = entreprisesData[key]?.nom || "Entreprise inconnue";
            }
        }

        // Fetch latest items based on datePublication (requires indexing in Firebase for efficiency)
        const itemPromises = Object.keys(entreprisesData).flatMap(key =>
             ['logements', 'biens'].map(async type => ({
                 key, type, data: (await databaseEspaceBenin.ref(`entreprises/${key}/${type}`)
                                      .orderByChild('datePublication') // Order by date
                                      .limitToLast(10) // Limit to recent ones per category per partner
                                      .once('value')
                                 ).val()
             }))
        );
        const snapshots = await Promise.all(itemPromises);

        snapshots.forEach(({ key, type, data }) => {
            if (!data) return;
            const nom = entrepriseNomMap[key];
            for (const itemKey in data) {
                if (Object.hasOwnProperty.call(data, itemKey)) {
                    const item = data[itemKey];
                    if (typeof item !== 'object' || item === null) continue;

                    let paidRecently = false;
                    if (item.statut === "Payé" && item.datePaiement) {
                         try {
                             const dp = new Date(item.datePaiement).getTime();
                             if (!isNaN(dp) && (maintenant - dp < VINGT_QUATRE_HEURES_MS)) { paidRecently = true; }
                         } catch(e){ /* ignore date parsing errors */ }
                    }

                    // Skip if paid recently OR occupied
                    if (!paidRecently && item.statut !== "Occupé") {
                        let datePub = 0;
                        try { if (item.datePublication) { datePub = new Date(item.datePublication).getTime(); if (isNaN(datePub)) datePub = 0; } } catch(e){ datePub = 0;}
                        allItems.push({ ...item, entrepriseId: key, entrepriseNom: nom, id: itemKey, statut: item.statut || "Libre", typeRecherche: type, datePublicationTimestamp: datePub });
                    }
                }
            }
        });

        allItems.sort((a, b) => (b.datePublicationTimestamp || 0) - (a.datePublicationTimestamp || 0)); // Sort all collected items by date
        const MAX_ITEMS = 9; // Max items for the carousel
        const recent = allItems.slice(0, MAX_ITEMS); // Take the most recent ones
        derniersLogementsContainer.innerHTML = ''; // Clear loading message

        if (recent.length > 0) {
            const carousel = document.createElement("div");
            carousel.classList.add("logement-carousel");
            recent.forEach(item => {
                const div = item.typeRecherche === 'logements' ? creerDivLogement(item) : creerDivBien(item);
                if (div) carousel.appendChild(div);
            });
            derniersLogementsContainer.appendChild(carousel);
            setupCarousel(carousel);
             if (voirPlusButton) voirPlusButton.style.display = 'block'; // Show button if there are items
        } else {
            derniersLogementsContainer.innerHTML = "<p style='text-align:center;'>Aucune publication récente.</p>";
            if (voirPlusButton) voirPlusButton.style.display = 'none'; // Hide button if no items
        }

    } catch (error) {
        console.error("Erreur lors de l'affichage des dernières publications:", error);
        derniersLogementsContainer.innerHTML = "<p style='text-align:center; color:red;'>Erreur lors du chargement des publications.</p>";
         if (voirPlusButton) voirPlusButton.style.display = 'none';
    }
}

// Fonction pour configurer et animer le carousel
function setupCarousel(carouselElement) {
    const slides = Array.from(carouselElement.children);
    const numSlides = slides.length;
    const container = carouselElement.parentElement;
    if (!container || numSlides <= 1) {
         const visibleCount = getVisibleSlidesCount();
         if (numSlides <= visibleCount) console.log("Carousel: Not enough slides to scroll.");
          applyCarouselStyles();
         return;
    }

    let currentItemIndex = 0;
    const intervalTime = 5000;
    let slideInterval;

    function getVisibleSlidesCount() { return window.innerWidth < 769 ? 1 : 3; }

    function applyCarouselStyles() {
        const visibleCount = getVisibleSlidesCount();
        const slideWidthPercent = 100 / visibleCount;

        slides.forEach((slide) => {
            slide.style.flex = `0 0 ${slideWidthPercent}%`;
            slide.style.maxWidth = `${slideWidthPercent}%`;
            slide.style.boxSizing = 'border-box';
        });
        goToSlide(currentItemIndex, 'auto'); // Apply initial position
    }

    function goToSlide(index, behavior = 'smooth') {
        const visibleCount = getVisibleSlidesCount();
        const maxIndex = Math.max(0, numSlides - visibleCount);
        currentItemIndex = Math.min(index, maxIndex); // Correct index clamping
        currentItemIndex = Math.max(0, currentItemIndex); // Ensure index is not negative

        const slideWidthPercent = 100 / visibleCount;
        const offsetPercent = -(currentItemIndex * slideWidthPercent);

        carouselElement.style.transition = (behavior === 'smooth') ? 'transform 0.5s ease-in-out' : 'none';
        carouselElement.style.transform = `translateX(${offsetPercent}%)`;

        if (behavior !== 'smooth') {
            carouselElement.offsetHeight; // Force reflow
            setTimeout(() => { carouselElement.style.transition = 'transform 0.5s ease-in-out'; }, 50);
        }
    }

    function nextSlide() {
        const visibleCount = getVisibleSlidesCount();
        const maxIndex = Math.max(0, numSlides - visibleCount);
        let nextIndex = currentItemIndex + 1;
        if (nextIndex > maxIndex) {
            nextIndex = 0; // Wrap around
        }
        goToSlide(nextIndex, 'smooth');
    }

    applyCarouselStyles(); // Initial setup

    clearInterval(slideInterval);
    if (numSlides > getVisibleSlidesCount()) {
        slideInterval = setInterval(nextSlide, intervalTime);
    }

    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            clearInterval(slideInterval);
            applyCarouselStyles();
            if (numSlides > getVisibleSlidesCount()) {
                 slideInterval = setInterval(nextSlide, intervalTime);
            }
        }, 250);
    });

    container.addEventListener('mouseenter', () => clearInterval(slideInterval));
    container.addEventListener('mouseleave', () => {
         if (numSlides > getVisibleSlidesCount()) {
              clearInterval(slideInterval);
              slideInterval = setInterval(nextSlide, intervalTime);
         }
    });
    console.log("Carousel setup complete.");
}


// Fonction pour afficher TOUTES les publications (logements + biens)
async function afficherTousLesLogementsEtBiens() {
    if (!resultatsRechercheContainer || !loadingIndicator) {
        console.error("Missing required elements for afficherTousLesLogementsEtBiens.");
        return;
    }
    toggleLoading(true);
    resultatsRechercheContainer.innerHTML = ''; // Clear previous results
    resultatsRechercheContainer.style.display = 'none'; // Hide initially

    if (!databaseEspaceBenin) {
         console.error("DB EspaceBenin non init.");
         resultatsRechercheContainer.innerHTML = "<p style='grid-column: 1 / -1; text-align: center; color: red;'>Erreur de connexion.</p>";
         resultatsRechercheContainer.style.display = 'grid'; // Show error
         toggleLoading(false);
         return;
     }

    const resultats = {};
    const maintenant = Date.now();
    const VINGT_QUATRE_HEURES_MS = 86400000;

    try {
        const entreprisesSnapshot = await databaseEspaceBenin.ref('entreprises').once('value');
        const entreprisesData = entreprisesSnapshot.val();
        if (!entreprisesData) {
            afficherResultatsDansLaPage({}); // Show "no results" message
            return;
        }

        const fetchPromises = Object.keys(entreprisesData).map(async (key) => {
             const nom = entreprisesData[key]?.nom || 'Entreprise Inconnue';
             const types = ['logements', 'biens']; // Fetch both types
             for (const type of types) {
                 const itemsRef = databaseEspaceBenin.ref(`entreprises/${key}/${type}`);
                 const itemsSnapshot = await itemsRef.once('value'); // Fetch all items of this type
                 const itemsData = itemsSnapshot.val();
                 if (!itemsData) continue;

                 for (const itemKey in itemsData) {
                     if (Object.hasOwnProperty.call(itemsData, itemKey)) {
                         const item = itemsData[itemKey];
                         if (typeof item !== 'object' || item === null) continue;

                         let paidRecently = false;
                         if (item.statut === "Payé" && item.datePaiement) {
                             try { const dp = new Date(item.datePaiement).getTime(); if (!isNaN(dp) && (maintenant - dp < VINGT_QUATRE_HEURES_MS)) paidRecently = true; } catch(e){}
                         }

                         // Skip if paid recently OR occupied
                         if (!paidRecently && item.statut !== "Occupé") {
                             let datePub = 0;
                             try { if(item.datePublication) { datePub = new Date(item.datePublication).getTime(); if(isNaN(datePub)) datePub = 0; } } catch(e){ datePub = 0;}
                             resultats[itemKey + '_' + type] = { ...item, id: itemKey, entrepriseId: key, entrepriseNom: nom, typeRecherche: type, statut: item.statut || "Libre", datePublicationTimestamp: datePub };
                         }
                     }
                 }
             }
        });

        await Promise.all(fetchPromises);

        // Pass the unsorted map directly, sorting happens in afficherResultatsDansLaPage
        afficherResultatsDansLaPage(resultats);

    } catch (error) {
        console.error("Erreur lors de l'affichage de tous les éléments:", error);
        alert("Une erreur est survenue lors du chargement de tous les biens. Veuillez réessayer.");
        afficherResultatsDansLaPage({}); // Show empty results on error
    } finally {
        toggleLoading(false);
    }
}


// Fonction pour afficher la fenêtre de détails
async function afficherFenetreDetails(item) {
    if (!item || !item.entrepriseId || !detailsModalContainer || !databaseEspaceBenin) {
        console.error("Données item/modal/DB manquantes pour afficher détails.");
         if(!databaseEspaceBenin) alert("Erreur de connexion DB.");
        return;
    }
    toggleLoading(true);

    try {
        // ---> Fetch entreprise data to get WhatsApp number <---
        const entrepriseRef = databaseEspaceBenin.ref(`entreprises/${item.entrepriseId}`);
        const entrepriseSnapshot = await entrepriseRef.once('value');
        const entrepriseData = entrepriseSnapshot.val();
        if (!entrepriseData) {
            throw new Error(`Entreprise ${item.entrepriseId} non trouvée.`);
        }

        // ---> Get and format WhatsApp number <---
        let entrepriseWhatsapp = entrepriseData.whatsapp || ''; // Use 'whatsapp' field from admin profile

        if (entrepriseWhatsapp) {
             // Basic formatting: remove non-digits and add country code if needed (assuming Benin format)
             entrepriseWhatsapp = entrepriseWhatsapp.replace(/[^0-9+]/g, ''); // Allow '+' sign
             if (entrepriseWhatsapp.startsWith('+')) {
                // Assume international format is correct
             } else if (entrepriseWhatsapp.length === 8) { // Assuming 8 digits is local Benin length
                 entrepriseWhatsapp = '229' + entrepriseWhatsapp;
             } else if (entrepriseWhatsapp.length === 11 && entrepriseWhatsapp.startsWith('229')) {
                 // Already has Benin code, do nothing
             } else {
                 // Number format might be unknown or invalid, clear it to disable button
                 console.warn(`Format WhatsApp inconnu pour ${item.entrepriseNom}: ${entrepriseWhatsapp}. Bouton désactivé.`);
                 entrepriseWhatsapp = '';
             }
         }

        let prixNumerique = NaN;
        if (item.prix != null) {
             if (typeof item.prix === 'number') prixNumerique = item.prix;
             else if (typeof item.prix === 'string') prixNumerique = parseFloat(item.prix.replace(/[^0-9.,]+/g, "").replace(',', '.'));
        }

        const demarcheurNom = item.demarcheur || "Non spécifié";
        const proprietaireNom = item.proprietaire || "Non spécifié";
        const texteBoutonPayerAvance = (item.typeRecherche === 'logements') ? "Payer Loyer" : "Payer Bien";
        const statusClass = getStatusClass(item.statut || 'Libre'); // Default to Libre

         let fraisReservation = 25000; // Default for > 50k
         if (!isNaN(prixNumerique)) {
             if (prixNumerique <= 5000) fraisReservation = 2000;
             else if (prixNumerique <= 10000) fraisReservation = 3000;
             else if (prixNumerique <= 15000) fraisReservation = 5000;
             else if (prixNumerique <= 25000) fraisReservation = 10000;
             else if (prixNumerique <= 50000) fraisReservation = 15000;
         } else fraisReservation = null;

        const currentStatut = item.statut || 'Libre';
        const isReservable = currentStatut !== 'Réservé' && currentStatut !== 'Payé' && currentStatut !== 'Occupé' && fraisReservation !== null;
        const isPayable = currentStatut !== 'Payé' && currentStatut !== 'Occupé' && !isNaN(prixNumerique) && prixNumerique > 0;

        const modalContentDiv = document.createElement('div');
        modalContentDiv.classList.add('fenetre-details');

         // Handle multiple images display
         let imagesHTML = '';
         if (item.images && item.images.length > 0) {
             imagesHTML = `<img src="${item.images[0]}" alt="${item.titre || 'Image'}" onerror="this.src='img/placeholder.png';">`;
             if (item.images.length > 1) {
                 imagesHTML += '<div class="thumbnails">';
                 item.images.forEach((imgUrl, index) => {
                     imagesHTML += `<img src="${imgUrl}" alt="Thumbnail ${index + 1}" class="thumbnail-img" data-full="${imgUrl}" onerror="this.style.display='none';">`;
                 });
                 imagesHTML += '</div>';
             }
         } else if (item.image) { // Fallback for single image
             imagesHTML = `<img src="${item.image}" alt="${item.titre || 'Image'}" onerror="this.src='img/placeholder.png';">`;
         }

        modalContentDiv.innerHTML = `
            <button class="modal-close-button" title="Fermer">×</button>
            <h3>${item.titre || 'Détails'}</h3>
            <div class="main-image-container">${imagesHTML}</div>
            <p>${item.description || 'Aucune description.'}</p><hr>
            <p><span class="detail-label">Prix:</span> <span class="detail-price">${formatCurrency(prixNumerique)}</span></p>
            <p><span class="detail-label">Entreprise:</span> ${item.entrepriseNom || 'N/A'}</p>
            <p><span class="detail-label">Statut:</span> <span class="status ${statusClass} item-statut">${currentStatut}</span></p>
            ${item.quartier || item.ville ? `<p><span class="detail-label">Localisation:</span> ${item.quartier || ''}${item.quartier && item.ville ? ', ' : ''}${item.ville || 'N/A'}</p>` : ''}
            <div class="boutons-container">
                <button class="bouton-discussion" ${entrepriseWhatsapp ? '' : 'disabled'} title="${entrepriseWhatsapp ? 'Contacter via WhatsApp' : 'WhatsApp non disponible'}"><i class="fab fa-whatsapp"></i> Discuter</button>
                <button class="bouton-infos" title="Afficher/Masquer les informations détaillées"><i class="fas fa-info-circle"></i> Plus d'Infos</button>
                <button class="bouton-reservation" ${isReservable ? '' : 'disabled'} title="${isReservable ? 'Afficher conditions de réservation' : (currentStatut === 'Réservé' || currentStatut === 'Payé' || currentStatut === 'Occupé' ? 'Déjà ' + currentStatut.toLowerCase() : 'Non réservable')}"><i class="fas fa-calendar-alt"></i> Réserver</button>
                <button class="bouton-payer-avance" ${isPayable ? '' : 'disabled'} title="${isPayable ? 'Payer le montant total via FedaPay' : (currentStatut === 'Payé' || currentStatut === 'Occupé' ? 'Déjà ' + currentStatut.toLowerCase() : 'Non payable')}"><i class="fas fa-credit-card"></i> ${texteBoutonPayerAvance}</button>
            </div>
            <div class="infos-logement" style="display: none;"></div>
            <div class="reservation-info" style="display: none;"></div>`;

         const infosLogementDiv = modalContentDiv.querySelector(".infos-logement");
         const reservationInfoDiv = modalContentDiv.querySelector(".reservation-info");

         // Regenerate content for infosLogementDiv and reservationInfoDiv
         infosLogementDiv.innerHTML = `<hr>
                <h4>Informations Détaillées</h4>
                <p><strong>Titre:</strong> ${item.titre || 'N/A'}</p>
                ${item.typeRecherche === 'logements' && item.type ? `<p><strong>Type:</strong> ${item.type}</p>` : ''}
                <p><strong>Description complète:</strong> ${item.description || 'N/A'}</p>
                <p><strong>État:</strong> ${item.etat || 'N/A'}</p>
                <p><strong>Prix:</strong> ${formatCurrency(prixNumerique)}</p>
                <p><strong>Démarcheur:</strong> ${demarcheurNom}</p>
                <p><strong>Propriétaire:</strong> ${proprietaireNom}</p>
                <p><strong>Quartier:</strong> ${item.quartier || 'N/A'}</p>
                <p><strong>Ville:</strong> ${item.ville || 'N/A'}</p>
                <p><strong>Partenaire:</strong> ${item.entrepriseNom || 'N/A'}</p>
                <p><strong>Statut actuel:</strong> <span class="status ${getStatusClass(currentStatut)} item-statut">${currentStatut}</span></p>`;

        reservationInfoDiv.innerHTML = `<hr>
                <h4>Conditions de Réservation ${fraisReservation !== null ? `(Frais: ${formatCurrency(fraisReservation)})` : '(Frais non applicables)'}</h4>
                ${fraisReservation !== null ? `
                    <p>La réservation peut se fait selon les critères basés sur le prix:</p>
                    <ul>
                        <li>Prix <= 5.000 FCFA: <strong>2.000 FCFA</strong></li>
                        <li>Prix 5.001 - 10.000 FCFA: <strong>3.000 FCFA</strong></li>
                        <li>Prix 10.001 - 15.000 FCFA: <strong>5.000 FCFA</strong></li>
                        <li>Prix 15.001 - 25.000 FCFA: <strong>10.000 FCFA</strong></li>
                        <li>Prix 25.001 - 50.000 FCFA: <strong>15.000 FCFA</strong></li>
                        <li>Prix > 50.000 FCFA: <strong>25.000 FCFA</strong></li>
                    </ul>
                    <p>Les frais de réservation son restitué après location effectif du local dans un délai de huit (08) jours.</p>
                    <p>Si vous décidez de ne plus louer la chambre ou le local, ou aucune local, vous perdre vos frais de réservation</p>
                    <p>Vous pouvez changer de local et bénéficier de la restitution des frais de Réservation toujours en respactant le délai de huit (08) jours.</p>
                    <p>Ces frais vous donnent une priorité pour une durée limitée. Confirmer vous redirigera vers la page de paiement sécurisée FedaPay.</p>
                    <button class="button-success confirmer-reservation" ${isReservable ? '' : 'disabled'}><i class="fas fa-check-circle"></i> Confirmer et Payer Frais</button>
                ` : `<p>La réservation directe avec frais n'est pas disponible pour cet article (prix non défini ou statut incompatible: ${currentStatut}).</p>`}`;

         const closeButton = modalContentDiv.querySelector('.modal-close-button');
         const boutonDiscussion = modalContentDiv.querySelector(".bouton-discussion");
         const boutonInfos = modalContentDiv.querySelector(".bouton-infos");
         const boutonReservation = modalContentDiv.querySelector(".bouton-reservation");
         const boutonPayerAvance = modalContentDiv.querySelector(".bouton-payer-avance");
         const statutSpans = modalContentDiv.querySelectorAll(".item-statut");
         // Re-select the reservation button after regenerating HTML
         const confirmerReservationButtonActual = reservationInfoDiv.querySelector(".confirmer-reservation");

        const paymentLink = "https://me.fedapay.com/mon_loyer";

        closeButton.addEventListener('click', () => { detailsModalContainer.classList.remove('visible'); detailsModalContainer.innerHTML = ''; });

        // ---> Event Listener for WhatsApp Button <---
        if (boutonDiscussion && entrepriseWhatsapp && !boutonDiscussion.disabled) {
             boutonDiscussion.addEventListener("click", () => {
                 const msg = encodeURIComponent(`Bonjour ${item.entrepriseNom || ''}, je suis intéressé par "${item.titre || 'votre bien'}" (${formatCurrency(prixNumerique)}) vu sur ESPACE BENIN.`);
                 const whatsappLink = `https://wa.me/${entrepriseWhatsapp}?text=${msg}`;
                 window.open(whatsappLink, '_blank', 'noopener,noreferrer');
            });
        }

        boutonInfos.addEventListener("click", () => {
            infosLogementDiv.style.display = infosLogementDiv.style.display === "none" ? "block" : "none";
            if (infosLogementDiv.style.display === "block") reservationInfoDiv.style.display = "none";
        });

        // Add event listeners only if buttons exist and are enabled
        if (isReservable && boutonReservation) {
            boutonReservation.addEventListener("click", () => {
                 reservationInfoDiv.style.display = reservationInfoDiv.style.display === "none" ? "block" : "none";
                 if (reservationInfoDiv.style.display === "block") infosLogementDiv.style.display = "none";
             });
        }

        if (isReservable && confirmerReservationButtonActual) {
             confirmerReservationButtonActual.addEventListener("click", async () => {
                 if (fraisReservation === null || fraisReservation <= 0) return;
                 const confirmationText = `Vous allez être redirigé vers FedaPay pour payer les frais de réservation (${formatCurrency(fraisReservation)}).\n\nIMPORTANT: Sur la page FedaPay, vous devrez entrer MANUELLEMENT :\n- Montant : ${fraisReservation} FCFA\n- Référence/Note : Frais Résa - ${item.titre.substring(0,30)} (ID:${item.id})\n\nContinuer ?`;
                 if (!confirm(confirmationText)) return;

                 confirmerReservationButtonActual.disabled = true; confirmerReservationButtonActual.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mise à jour...';
                 if (boutonReservation) boutonReservation.disabled = true;
                 if (boutonPayerAvance) boutonPayerAvance.disabled = true;

                 const itemRef = databaseEspaceBenin.ref(`entreprises/${item.entrepriseId}/${item.typeRecherche}/${item.id}`);
                 try {
                     await itemRef.update({ statut: "Réservé", dateReservation: new Date().toISOString() });
                     // Update status visually in the modal
                     statutSpans.forEach(span => { span.textContent = 'Réservé'; span.className = `status ${getStatusClass('Réservé')} item-statut`; });
                     if(boutonReservation) boutonReservation.disabled = true;
                     if(confirmerReservationButtonActual) confirmerReservationButtonActual.style.display = 'none'; // Hide button after use

                     reservationInfoDiv.innerHTML += `<p style='color:orange; font-weight:bold; margin-top:15px;'>Statut mis à jour (Réservé). Redirection vers FedaPay...</p><p>N'oubliez pas d'entrer le montant (${fraisReservation} FCFA) et la référence : Frais Résa - ${item.titre.substring(0,30)} (ID:${item.id})</p>`;
                     alert(`Redirection vers FedaPay...\nMontant: ${fraisReservation} FCFA\nRéférence: Frais Résa - ${item.titre.substring(0,30)} (ID:${item.id})`);
                     window.location.href = paymentLink; // Redirect after confirmation
                 } catch (dbErr) {
                     console.error("Erreur MAJ DB (Réservation):", dbErr); alert("Erreur lors de la mise à jour du statut. Le paiement n'a pas été initié.");
                     // Re-enable buttons on error
                     confirmerReservationButtonActual.disabled = false; confirmerReservationButtonActual.innerHTML = '<i class="fas fa-check-circle"></i> Confirmer et Payer Frais';
                     if (boutonReservation && isReservable) boutonReservation.disabled = false; // Check isReservable again
                     if (boutonPayerAvance && isPayable) boutonPayerAvance.disabled = false; // Check isPayable again
                 }
             });
        }

        if (isPayable && boutonPayerAvance) {
            boutonPayerAvance.addEventListener("click", async () => {
                 if (isNaN(prixNumerique) || prixNumerique <= 0) return;
                 const confirmationText = `Vous allez être redirigé vers FedaPay pour payer le montant total (${formatCurrency(prixNumerique)}).\n\nIMPORTANT: Sur la page FedaPay, vous devrez entrer MANUELLEMENT :\n- Montant : ${prixNumerique} FCFA\n- Référence/Note : Paiement - ${item.titre.substring(0,30)} (ID:${item.id})\n\nContinuer ?`;
                 if (!confirm(confirmationText)) return;

                 boutonPayerAvance.disabled = true; boutonPayerAvance.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mise à jour...';
                 if (boutonReservation) boutonReservation.disabled = true;
                 if (confirmerReservationButtonActual) confirmerReservationButtonActual.disabled = true;

                 const itemRef = databaseEspaceBenin.ref(`entreprises/${item.entrepriseId}/${item.typeRecherche}/${item.id}`);
                 try {
                     // Set status to Payé and record payment date
                     await itemRef.update({ statut: "Payé", datePaiement: new Date().toISOString() });
                     // Update status visually
                     statutSpans.forEach(span => { span.textContent = 'Payé'; span.className = `status ${getStatusClass('Payé')} item-statut`; });
                     if(boutonReservation) boutonReservation.disabled = true;
                     if (confirmerReservationButtonActual) confirmerReservationButtonActual.disabled = true;
                     if(boutonPayerAvance) boutonPayerAvance.disabled = true;

                     const paymentMessageDiv = document.createElement('div');
                     paymentMessageDiv.style.marginTop = '20px';
                     paymentMessageDiv.innerHTML = `<hr><p style='color:green; font-weight:bold;'>Statut mis à jour (Payé). Redirection vers FedaPay...</p><p>N'oubliez pas d'entrer le montant (${prixNumerique} FCFA) et la référence : Paiement - ${item.titre.substring(0,30)} (ID:${item.id})</p>`;
                     modalContentDiv.querySelector('.boutons-container').insertAdjacentElement('afterend', paymentMessageDiv);

                     alert(`Redirection vers FedaPay...\nMontant: ${prixNumerique} FCFA\nRéférence: Paiement - ${item.titre.substring(0,30)} (ID:${item.id})`);
                     window.location.href = paymentLink; // Redirect after confirmation
                 } catch (dbErr) {
                     console.error("Erreur MAJ DB (Paiement):", dbErr); alert("Erreur lors de la mise à jour du statut. Le paiement n'a pas été initié.");
                     // Re-enable buttons on error
                     boutonPayerAvance.disabled = false; boutonPayerAvance.innerHTML = `<i class="fas fa-credit-card"></i> ${texteBoutonPayerAvance}`;
                     if (boutonReservation && isReservable) boutonReservation.disabled = false; // Check isReservable again
                     if (confirmerReservationButtonActual && isReservable) confirmerReservationButtonActual.disabled = false; // Check isReservable again
                 }
            });
        }

        detailsModalContainer.innerHTML = ''; // Clear previous content before appending
        detailsModalContainer.appendChild(modalContentDiv);
        detailsModalContainer.classList.add('visible'); // Make the container visible

        // Add thumbnail click listener (if thumbnails exist)
        const mainImage = modalContentDiv.querySelector('.main-image-container > img');
        const thumbnails = modalContentDiv.querySelectorAll('.thumbnail-img');
        if (mainImage && thumbnails.length > 0) {
            thumbnails.forEach(thumb => {
                thumb.addEventListener('click', (e) => {
                    mainImage.src = e.target.dataset.full;
                     // Optional: Add active state to thumbnail
                     thumbnails.forEach(t => t.classList.remove('active'));
                     e.target.classList.add('active');
                });
            });
        }

    } catch (error) {
        console.error("Erreur lors de l'affichage des détails:", error);
        alert(`Une erreur est survenue lors du chargement des détails : ${error.message || 'Erreur inconnue'}`);
    } finally {
        toggleLoading(false);
    }
}


// Gestion du menu mobile
if (menuToggle && mainNav) {
    menuToggle.addEventListener("click", (e) => { e.stopPropagation(); mainNav.classList.toggle("open"); });
    mainNav.querySelectorAll('a').forEach(link => { link.addEventListener('click', () => mainNav.classList.remove('open')); });
    document.addEventListener('click', (event) => { if (mainNav.classList.contains('open') && !mainNav.contains(event.target) && event.target !== menuToggle && !menuToggle.contains(event.target)) mainNav.classList.remove('open'); });
}

// Fonction pour afficher les témoignages
async function afficherTemoignages() {
    if (!temoignagesContainer || !databaseEspaceBenin) return;
    temoignagesContainer.innerHTML = '<p class="loading" style="grid-column: 1/-1;">Chargement...</p>';
    try {
        const avisSnapshot = await databaseEspaceBenin.ref('avis').orderByChild('date').limitToLast(6).once('value');
        const avisData = avisSnapshot.val();
        temoignagesContainer.innerHTML = "";
        if (avisData) {
            const sortedKeys = Object.keys(avisData).sort((a, b) => (avisData[b]?.date ? new Date(avisData[b].date).getTime() : 0) - (avisData[a]?.date ? new Date(avisData[a].date).getTime() : 0));
            if (sortedKeys.length > 0) {
                 sortedKeys.forEach(id => {
                    const avis = avisData[id]; const div = document.createElement("div"); div.classList.add("temoignage");
                    const innerDiv = document.createElement("div"); // Use inner div for padding
                    const quotePara = document.createElement("p"); quotePara.textContent = `${avis.texte || ''}`; // Remove quotes, use ::before
                    const authorPara = document.createElement("p"); authorPara.classList.add("temoignage-auteur");
                    const date = avis.date ? new Date(avis.date).toLocaleDateString('fr-FR', {year:'numeric', month:'short', day:'numeric'}) : '';
                    authorPara.textContent = `- ${avis.nom || 'Anonyme'} ${date ? '('+date+')' : ''}`;
                    innerDiv.appendChild(quotePara); innerDiv.appendChild(authorPara); div.appendChild(innerDiv);
                    temoignagesContainer.appendChild(div);
                });
            } else { temoignagesContainer.innerHTML = "<p style='grid-column: 1/-1; text-align:center;'>Aucun témoignage pour le moment.</p>"; }
        } else { temoignagesContainer.innerHTML = "<p style='grid-column: 1/-1; text-align:center;'>Aucun témoignage pour le moment.</p>"; }
    } catch (error) {
        console.error("Erreur récupération avis:", error);
        temoignagesContainer.innerHTML = "<p style='grid-column: 1/-1; color:red; text-align:center;'>Erreur chargement témoignages.</p>";
    }
}

// Écouteur pour l'ajout d'avis
if (formAjoutAvis) {
    formAjoutAvis.addEventListener("submit", async (event) => {
        event.preventDefault();
        if (!databaseEspaceBenin) { alert("Erreur de connexion à la base de données."); return; }
        const nomInput = document.getElementById("avis-nom"); const emailInput = document.getElementById("avis-email"); const texteInput = document.getElementById("avis-texte"); const submitBtn = formAjoutAvis.querySelector('button[type="submit"]');
        const nom = nomInput?.value.trim() || ''; const email = emailInput?.value.trim() || ''; const texte = texteInput?.value.trim() || '';
        if (!nom || !texte) { alert("Le nom et le témoignage sont requis."); return; }
        if (email && !/\S+@\S+\.\S+/.test(email)) { alert("L'adresse email fournie n'est pas valide."); return; }
        if(submitBtn) { submitBtn.disabled = true; submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi...'; }
        try {
            const ref = databaseEspaceBenin.ref('avis').push();
            // Add date using Firebase Server Timestamp for consistency
            await ref.set({
                nom,
                email, // Store email even if optional, can be used for verification later if needed
                texte,
                date: firebase.database.ServerValue.TIMESTAMP // Use server timestamp
             });
            formAjoutAvis.reset();
            alert("Avis ajouté avec succès ! Merci pour votre retour.");
            await afficherTemoignages(); // Refresh testimonials
        } catch (error) {
            console.error("Erreur ajout avis:", error);
            alert("Une erreur est survenue lors de l'ajout de votre avis.");
        }
        finally { if(submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Soumettre l\'avis'; } }
    });
}

// Gestion des modales Termes & Confidentialité
function setupModal(modalId, triggerIds) {
    const modal = document.getElementById(modalId); if (!modal) return;
    const closeBtn = modal.querySelector('.close-button'); if (!closeBtn) return;
    const openModal = (e) => { e.preventDefault(); modal.style.display = 'block'; };
    const closeModal = () => { modal.style.display = 'none'; };
    triggerIds.forEach(id => { const trigger = document.getElementById(id); if (trigger) trigger.addEventListener('click', openModal); });
    closeBtn.addEventListener('click', closeModal);
    // Close modal when clicking outside the content
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
}

// Fermeture Details Modal en cliquant dehors
if (detailsModalContainer) {
    detailsModalContainer.addEventListener('click', (e) => {
        // Only close if the click is on the container itself, not its children
        if (e.target === detailsModalContainer) {
             detailsModalContainer.classList.remove('visible');
             detailsModalContainer.innerHTML = ''; // Clear content
        }
    });
}

// Gestion affichage champs de recherche dynamiques
if (typeRechercheSelect && champsLogementsDiv && champsBiensDiv) {
    const handleTypeChange = () => {
        const val = typeRechercheSelect.value; const isLogements = val === "logements";
        // Use 'display: contents' for grid items to flow correctly
        champsLogementsDiv.style.display = isLogements ? 'contents' : 'none';
        champsLogementsDiv.classList.toggle('visible', isLogements);

        // Check if the biens div has actual content or just whitespace/comments
        const hasBiensContent = champsBiensDiv.innerHTML.trim() !== '';
        champsBiensDiv.style.display = (!isLogements && hasBiensContent) ? 'contents' : 'none';
        champsBiensDiv.classList.toggle('visible', !isLogements && hasBiensContent);
    };
    handleTypeChange(); // Call on load
    typeRechercheSelect.addEventListener("change", handleTypeChange);
}


// Redirection Espace Admin
if (adminLoginButton) { adminLoginButton.addEventListener('click', () => { window.location.href = 'admin.html'; }); }


// --- Section 2: SIMPLE Gemini Chatbot Logic ---
const GEMINI_API_KEY = 'AIzaSyDetgN_odqwqvU2AbaHzzijsi0yDRSveDM'; // Replace with your actual key if needed
const CHATBOT_SYSTEM_INSTRUCTION = `Tu es "Assistant IA ESPACE BENIN", un assistant virtuel expert en immobilier au Bénin, spécialisé dans les services offerts par la plateforme ESPACE BENIN (https://espace-benin-idriss.web.app). Ta mission est d'aider les utilisateurs à trouver des logements (chambres, appartements, maisons), des biens divers (terrains, boutiques), et à comprendre les services de ESPACE BENIN (location, vente, gestion locative, construction BTP, location de véhicules, hébergement).
Sois toujours :
1.  **Professionnel et Courtois** : Utilise un ton aimable et serviable. Commence par "Bonjour ! Comment puis-je vous aider avec ESPACE BENIN aujourd'hui ?" et termine poliment.
2.  **Informatif et Précis** : Base tes réponses UNIQUEMENT sur les informations typiquement trouvées sur une plateforme immobilière comme ESPACE BENIN et les services listés. Mentionne les types de biens, les villes (ex: Parakou, Cotonou), les quartiers (ex: Zongo, Agla), les budgets possibles en FCFA.
3.  **Focalisé sur ESPACE BENIN** : Oriente toujours vers l'utilisation de la plateforme. Pour une recherche, suggère d'utiliser la barre de recherche de la page principale en précisant les critères (type de bien, ville, quartier, budget). Pour des détails sur un bien spécifique, explique qu'il faut cliquer sur "Voir les Détails" sur la carte du bien. Pour le contact, indique que l'utilisateur peut utiliser le bouton WhatsApp dans les détails du bien pour parler à l'agence partenaire.
4.  **Concis et Structuré** : Fournis des réponses claires et directes. Utilise des paragraphes courts ou des listes à puces si nécessaire pour une meilleure lisibilité. Évite le jargon technique excessif.
5.  **Limité dans tes capacités** : Tu NE PEUX PAS effectuer de recherche dans la base de données en temps réel, ni voir les biens actuellement disponibles, ni connaître les prix exacts ou statuts (disponible, réservé, payé). Tu ne peux pas non plus initier de réservation ou de paiement. Si on te demande une information spécifique (ex: "Trouve-moi un appartement à 50000 FCFA à Zongo"), explique que tu ne peux pas faire la recherche toi-même mais guide l'utilisateur sur COMMENT utiliser les outils du site ("Pour cela, je vous invite à utiliser la barre de recherche sur la page principale en entrant 'Appartement' comme type, 'Parakou' comme ville, 'Zongo' comme quartier et '50000' comme budget maximum."). Si on te demande le statut d'un bien, explique que le statut est visible sur la carte et dans les détails du bien sur le site.
6.  **Respectueux de la Confidentialité** : Ne demande jamais d'informations personnelles (nom, téléphone, email, etc.). Ne fournis pas d'informations de contact direct autres que celles accessibles publiquement via la plateforme (comme le lien WhatsApp général ou celui dans les détails).
7.  **Langue** : Réponds principalement en Français.
NE PAS :
*   Inventer des biens ou des prix.
*   Donner des conseils financiers ou juridiques.
*   Traiter des transactions ou des réservations.
*   Promettre une disponibilité ou un statut spécifique.
*   Accéder à des informations externes ou à des URL autres que pour mentionner la plateforme elle-même.
*   Engager des conversations hors sujet (météo, politique, etc.). Si cela arrive, recentre poliment sur ESPACE BENIN.

Exemple de réponse pour une recherche : "Pour trouver une chambre à Parakou dans votre budget, je vous recommande d'utiliser la barre de recherche sur notre site. Entrez 'Chambre' dans le type de logement, 'Parakou' dans la ville, et indiquez votre budget maximum. Vous verrez alors les options correspondantes proposées par nos partenaires."
Exemple si on demande des détails : "Pour voir plus de détails sur un logement ou un bien qui vous intéresse, cliquez simplement sur le bouton 'Voir les Détails' sur sa carte. Vous y trouverez la description complète, les photos, et les options pour contacter le partenaire."`;
let chatbotGenAI, chatbotModel, currentChatbotConversation = [];
const MAX_CHATBOT_HISTORY = 6;

function initializeChatbotGeminiAPI() {
    // Ensure SDK is available (should be set to window.GoogleGenerativeAI by the HTML script)
    if (typeof window.GoogleGenerativeAI === 'undefined') {
        console.error("Google Generative AI SDK not loaded or available globally.");
        showChatbotNotification("Erreur : Assistant IA non disponible (SDK).", "error");
        return false;
    }
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'VOTRE_CLE_API_GEMINI_ICI') {
        console.error("Gemini API Key is missing or is a placeholder.");
        showChatbotNotification("Erreur configuration Assistant IA (Clé API).", "error");
        return false;
    }
    try {
        if (!chatbotGenAI || !chatbotModel) {
             chatbotGenAI = new window.GoogleGenerativeAI(GEMINI_API_KEY);
             chatbotModel = chatbotGenAI.getGenerativeModel({ model: "gemini-1.5-flash-latest", systemInstruction: CHATBOT_SYSTEM_INSTRUCTION });
             console.log("Gemini API for Chatbot initialized.");
             currentChatbotConversation = [];
        }
        return true;
    } catch (error) {
        console.error("Failed to initialize Gemini API:", error);
        showChatbotNotification("Erreur initialisation assistant IA.", "error");
        chatbotGenAI = null;
        chatbotModel = null;
        return false;
    }
}

function displayChatbotMessage(sender, text) {
    const messagesContainer = document.getElementById('chatbot-messages');
    if (!messagesContainer) return null;

    const messageElement = document.createElement('div');
    messageElement.classList.add('message', sender === 'user' ? 'user-message' : 'ai-message');

    const textContentDiv = document.createElement('div');
    // Basic sanitization (replace with more robust library if needed)
    const sanitizedText = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    textContentDiv.innerHTML = sanitizedText.replace(/\n/g, '<br>'); // Convert newlines after sanitizing

    messageElement.appendChild(textContentDiv);
    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    return messageElement;
}


function showChatbotTypingIndicator() {
    const messagesContainer = document.getElementById('chatbot-messages');
    if (!messagesContainer) return;

    const existingIndicator = messagesContainer.querySelector('.typing-indicator-message');
    if (existingIndicator) existingIndicator.remove(); // Remove previous if any

    const indicatorElement = document.createElement('div');
    indicatorElement.classList.add('message', 'ai-message', 'typing-indicator-message');
    indicatorElement.innerHTML = `<div class="typing-indicator"><span></span><span></span><span></span></div>`;

    messagesContainer.appendChild(indicatorElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    return indicatorElement; // Return the element so it can be removed/updated
}

async function animateChatbotText(messageElement, fullText) {
    let contentDiv = messageElement.querySelector('div'); // Target the inner div
    if (!contentDiv) { // Should not happen if created by showChatbotTypingIndicator
        console.error("Typing indicator structure error.");
        messageElement.innerHTML = `<div>${fullText.replace(/\n/g, '<br>')}</div>`; // Fallback
        return;
    }

    messageElement.classList.remove('typing-indicator-message'); // Remove class
    contentDiv.innerHTML = ''; // Clear the dots

    const formattedText = fullText.replace(/\n/g, '<br>');
    let currentHTML = '';
    const delay = 15; // Typing speed
    const messagesContainer = document.getElementById('chatbot-messages');

    try {
        // Simulate typing effect
        for (let i = 0; i < formattedText.length; i++) {
            currentHTML += formattedText[i];
            contentDiv.innerHTML = currentHTML; // Update content progressively
            // Scroll down smoothly as text appears
            if (messagesContainer) {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    } catch (error) {
        console.warn("Chatbot text animation interrupted:", error);
        contentDiv.innerHTML = formattedText; // Ensure full text is shown if animation fails
    } finally {
        if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight; // Final scroll
        }
    }
}


async function sendChatbotMessage() {
    const inputElement = document.getElementById('chatbot-input');
    const sendButton = document.getElementById('chatbot-send');
    if (!inputElement || !sendButton) return;

    const userInput = inputElement.value.trim();
    if (!userInput) return;

    if (!chatbotGenAI || !chatbotModel) {
        if (!initializeChatbotGeminiAPI()) return;
    }

    inputElement.value = '';
    inputElement.style.height = 'auto'; // Reset height after sending
    sendButton.disabled = true;

    displayChatbotMessage('user', userInput); // Display user message immediately
    currentChatbotConversation.push({ role: "user", parts: [{ text: userInput }] });

    // Show typing indicator while waiting for response
    const loadingIndicatorElement = showChatbotTypingIndicator();

    // Prepare history for the API call
    const history = currentChatbotConversation.slice(0, -1) // Exclude the latest user message from history itself
                                             .slice(-MAX_CHATBOT_HISTORY); // Limit history length

    try {
        const chat = chatbotModel.startChat({ history: history });
        const result = await chat.sendMessage(userInput); // Send the latest message
        const response = await result.response;
        const aiResponseText = response.text();

        // Remove typing indicator and animate the actual response in its place
        if (loadingIndicatorElement) {
            await animateChatbotText(loadingIndicatorElement, aiResponseText);
        } else {
            // Fallback if indicator element wasn't found (shouldn't happen)
            displayChatbotMessage('ai', aiResponseText);
        }

        // Add AI response to the conversation history
        currentChatbotConversation.push({ role: "model", parts: [{ text: aiResponseText }] });

        // Trim conversation history if it exceeds the limit
        if (currentChatbotConversation.length > MAX_CHATBOT_HISTORY + 2) { // Keep user+model pair
            currentChatbotConversation = currentChatbotConversation.slice(-(MAX_CHATBOT_HISTORY + 2));
        }

    } catch (error) {
        console.error("Error sending message to Gemini:", error);
        // Remove typing indicator if it's still there on error
        if (loadingIndicatorElement && loadingIndicatorElement.parentNode) {
            loadingIndicatorElement.remove();
        }
        let errorMessage = `Désolé, une erreur est survenue lors de la communication avec l'assistant. Veuillez réessayer.`;
        if (error.message?.includes('Quota') || error.message?.includes('RATE_LIMIT') || error.status === 429) {
             errorMessage = "Trop de questions ont été posées récemment. Veuillez réessayer dans quelques instants.";
         } else if (error.message?.includes('API key not valid')) {
             errorMessage = "Erreur de configuration de l'assistant (clé API). Veuillez contacter l'administrateur.";
         } else if (error.message?.includes('timed out')) {
             errorMessage = "La connexion avec l'assistant a expiré. Veuillez réessayer.";
         }
        displayChatbotMessage('ai', errorMessage); // Display error message to user
        // Optionally, remove the failed user message from history?
        // currentChatbotConversation.pop(); // Remove last user message if API call failed

    } finally {
        sendButton.disabled = false; // Re-enable send button
        inputElement.focus(); // Keep focus on input
        // Ensure scroll is at bottom after potential error message
        const messagesContainer = document.getElementById('chatbot-messages');
        if (messagesContainer) messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}

function showChatbotNotification(message, type = 'info') {
    const messagesContainer = document.getElementById('chatbot-messages');
    if (!messagesContainer) return;

    const notifElement = document.createElement('div');
    notifElement.style.cssText = `text-align:center; font-size:0.8em; padding:5px 10px; margin: 5px auto; max-width: 90%; border-radius: 5px; background-color: ${type === 'error' ? '#ffebee' : '#f0f0f0'}; color:${type === 'error' ? '#c62828' : '#555'};`;
    notifElement.textContent = message;
    messagesContainer.appendChild(notifElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    setTimeout(() => {
        if (notifElement.parentNode === messagesContainer) {
             messagesContainer.removeChild(notifElement);
        }
    }, 7000);
}


// --- Section 3: DOMContentLoaded / Initialisation Générale ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded.");

    // Initialisations Espace Benin
    if (databaseEspaceBenin) {
        console.log("Loading initial Espace Benin data...");
        afficherDernieresPublications();
        afficherTemoignages();
    } else {
        console.warn("Database EspaceBenin not available, initial data load skipped.");
         if (voirPlusButton) voirPlusButton.style.display = 'none';
    }
    setupModal('privacy-modal', ['show-privacy', 'show-privacy-footer']);
    setupModal('terms-modal', ['show-terms', 'show-terms-footer']);

    // Listener Formulaire Recherche
    const formRechercheEl = document.getElementById("form-recherche");
    if (formRechercheEl) {
         formRechercheEl.addEventListener("submit", async (event) => {
             event.preventDefault();
             if (!databaseEspaceBenin) { alert("Erreur de connexion à la base de données."); return; }
             const budget = document.getElementById("budget")?.value ? parseInt(document.getElementById("budget").value, 10) : null;
             const quartier = document.getElementById("quartier")?.value.trim().toLowerCase() || null;
             const ville = document.getElementById("ville")?.value.trim().toLowerCase() || null;
             const typeLogement = (document.getElementById("type-recherche")?.value === 'logements' && document.getElementById("type")) ? document.getElementById("type").value.trim().toLowerCase() || null : null;

             if(dernierePublicationSection) dernierePublicationSection.classList.add('hidden');
             if(voirPlusButton) {
                   voirPlusButton.innerHTML = '<i class="fas fa-list"></i> Voir toutes les publications';
                   voirPlusButton.disabled = false;
             }
             isAllPublicationsVisible = false;

             if (resultatsRechercheContainer) {
                  resultatsRechercheContainer.innerHTML = '';
                  resultatsRechercheContainer.style.display = 'none';
             }

             toggleLoading(true);
             try {
                 const res = await effectuerRecherche(budget, quartier, ville, typeLogement);
                 afficherResultatsDansLaPage(res); // afficherResultatsDansLaPage now handles sorting
                 if (resultatsRechercheContainer) {
                     resultatsRechercheContainer.style.display = 'grid';
                      const searchSection = document.getElementById('recherche-logement');
                     if (searchSection) {
                         // Scroll below the search bar to show results
                         const searchBarHeight = searchSection.offsetHeight;
                         const scrollTarget = searchSection.offsetTop + searchBarHeight - 30; // Adjust offset as needed
                         window.scrollTo({ top: scrollTarget, behavior: 'smooth' });
                      }
                 }
             } catch (error) {
                 console.error("Search failed:", error);
                 if (resultatsRechercheContainer) {
                     resultatsRechercheContainer.innerHTML = '<p style="color:red; text-align:center; grid-column: 1 / -1;">Erreur lors de la recherche.</p>';
                     resultatsRechercheContainer.style.display = 'grid';
                 }
             } finally {
                 toggleLoading(false);
             }
         });
    } else { console.warn("Formulaire #form-recherche non trouvé."); }

    // Listener Bouton Voir/Masquer Publications
    const voirPlusButtonEl = document.getElementById('voir-plus');
    if (voirPlusButtonEl && resultatsRechercheContainer && dernierePublicationSection && databaseEspaceBenin) {
        voirPlusButtonEl.addEventListener('click', async (event) => {
            event.preventDefault();
            voirPlusButtonEl.disabled = true;

            if (!isAllPublicationsVisible) { // Action: Voir Toutes
                console.log("Action: Voir toutes les publications");
                voirPlusButtonEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Chargement...';
                dernierePublicationSection.classList.add('hidden');
                resultatsRechercheContainer.innerHTML = '';
                resultatsRechercheContainer.style.display = 'none';
                await afficherTousLesLogementsEtBiens(); // This calls afficherResultatsDansLaPage which sorts
                voirPlusButtonEl.innerHTML = '<i class="fas fa-eye-slash"></i> Masquer les publications';
                isAllPublicationsVisible = true;
                // Scroll to the results section after loading
                 const resultsSection = document.getElementById('resultats-recherche');
                 if (resultsSection) {
                     resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                 }

            } else { // Action: Masquer Toutes (revert to recent)
                console.log("Action: Masquer les publications");
                voirPlusButtonEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Chargement...';
                resultatsRechercheContainer.innerHTML = '';
                resultatsRechercheContainer.style.display = 'none';
                dernierePublicationSection.classList.remove('hidden');
                await afficherDernieresPublications(); // Reload recent
                voirPlusButtonEl.innerHTML = '<i class="fas fa-list"></i> Voir toutes les publications';
                isAllPublicationsVisible = false;
                dernierePublicationSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            voirPlusButtonEl.disabled = false;
        });
        console.log("Toggle listener added to 'Voir/Masquer Toutes Publications' button.");
    } else {
        console.warn("Required elements for 'Voir/Masquer' button not found or DB not initialized.");
        if (voirPlusButtonEl) voirPlusButtonEl.style.display = 'none';
    }

    // Initialisations Chatbot Flottant
    const chatbotToggleEl = document.getElementById('chatbot-toggle');
    const chatbotWindowEl = document.getElementById('chatbot-window');
    const chatbotCloseEl = document.getElementById('chatbot-close');
    const chatbotSendEl = document.getElementById('chatbot-send');
    const chatbotInputEl = document.getElementById('chatbot-input');
    const chatbotMessagesContainerEl = document.getElementById('chatbot-messages');

    if (chatbotToggleEl && chatbotWindowEl && chatbotCloseEl && chatbotSendEl && chatbotInputEl && chatbotMessagesContainerEl) {
        chatbotToggleEl.addEventListener('click', () => {
             const isVisible = chatbotWindowEl.classList.toggle('visible');
             if (isVisible) {
                  chatbotInputEl.focus();
                  // Initialize API only when opened for the first time or if previously failed
                  if (!chatbotModel) {
                       initializeChatbotGeminiAPI();
                  }
             }
         });
        chatbotCloseEl.addEventListener('click', () => { chatbotWindowEl.classList.remove('visible'); });
        chatbotSendEl.addEventListener('click', sendChatbotMessage);
        chatbotInputEl.addEventListener('keypress', (e) => {
             if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault(); // Prevent newline on Enter
                  sendChatbotMessage();
             }
         });
        // Auto-resize textarea
        chatbotInputEl.addEventListener('input', () => {
             chatbotInputEl.style.height = 'auto'; // Reset height
             const maxH = 100; // Max height in px
             chatbotInputEl.style.height = Math.min(chatbotInputEl.scrollHeight, maxH) + 'px';
         });
        console.log("Chatbot UI listeners attached.");
     } else {
         console.error("Chatbot UI elements missing! Chatbot disabled.");
         if (chatbotToggleEl) chatbotToggleEl.style.display = 'none';
    }

}); // End DOMContentLoaded
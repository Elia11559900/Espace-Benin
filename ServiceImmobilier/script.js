// --- START OF COMPLETE script.js ---

// --- Section 1: Core Real Estate Logic ---

// Configuration de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAwHqU_XLmDz9VbsxVGN3wbru3-hLDiyNI", // Replace with your actual API key if different
    authDomain: "microfinance-68811.firebaseapp.com",
    databaseURL: "https://microfinance-68811-default-rtdb.firebaseio.com",
    projectId: "microfinance-68811",
    storageBucket: "microfinance-68811.appspot.com",
    messagingSenderId: "328514838296",
    appId: "1:328514838296:web:89b35343ca3a14b352c86d",
    measurementId: "G-RBQJH93VWE"
};

// Initialiser Firebase
let app;
if (!firebase.apps.length) {
    app = firebase.initializeApp(firebaseConfig);
} else {
    app = firebase.app();
}
const database = firebase.database();

// Function to show/hide loading indicator
function toggleLoading(show) {
    const loadingIndicator = document.getElementById("loading-indicator");
    if (loadingIndicator) {
        loadingIndicator.style.display = show ? "block" : "none";
    }
}

// Generic search function
async function effectuerRecherche(budget, quartier, ville, typeLogement) {
    toggleLoading(true);
    const resultats = {};
    const maintenant = Date.now();
    const typeRechercheSelect = document.getElementById("type-recherche");
    const typeRechercheSelectionne = typeRechercheSelect ? typeRechercheSelect.value : 'logements';

    try {
        const entreprisesSnapshot = await database.ref('entreprises').once('value');
        const entreprisesData = entreprisesSnapshot.val();

        if (!entreprisesData) {
            console.log("Aucune entreprise trouvée.");
            return {};
        }

        const entreprisePromises = Object.keys(entreprisesData).map(async (entrepriseKey) => {
            const entrepriseNomSnapshot = await database.ref(`entreprises/${entrepriseKey}/nom`).once('value');
            const entrepriseNom = entrepriseNomSnapshot.val() || "Entreprise inconnue";
            const typesToSearch = [typeRechercheSelectionne];

            for (const typeRecherche of typesToSearch) {
                const itemsRef = database.ref(`entreprises/${entrepriseKey}/${typeRecherche}`);
                const itemsSnapshot = await itemsRef.once('value');
                const itemsData = itemsSnapshot.val();

                if (!itemsData) continue;

                for (const itemKey of Object.keys(itemsData)) {
                    const item = itemsData[itemKey];
                    if (typeof item !== 'object' || item === null || typeof item.prix === 'undefined') {
                        console.warn(`Skipping invalid item: entreprise=${entrepriseKey}, type=${typeRecherche}, key=${itemKey}`);
                        continue;
                    }

                    let isPaidAndUnavailable = false;
                    if (item.statut === "Payé" && item.datePaiement) {
                        try {
                            const datePaiement = new Date(item.datePaiement);
                            const vingtQuatreHeures = 24 * 60 * 60 * 1000;
                            if (!isNaN(datePaiement.getTime()) && (maintenant - datePaiement.getTime() < vingtQuatreHeures)) {
                                isPaidAndUnavailable = true;
                            }
                        } catch (e) { console.warn("Invalid date format for item:", itemKey, item.datePaiement); }
                    }
                    if (isPaidAndUnavailable) continue;

                    const itemPrice = Number(item.prix);
                    const budgetMatch = (budget === null || isNaN(itemPrice) || itemPrice <= budget);
                    const quartierMatch = (quartier === null || !quartier || (typeof item.quartier === 'string' && item.quartier.toLowerCase().includes(quartier.toLowerCase())));
                    const villeMatch = (ville === null || !ville || (typeof item.ville === 'string' && item.ville.toLowerCase().includes(ville.toLowerCase())));

                    if (budgetMatch && quartierMatch && villeMatch) {
                        const typeLogementMatch = !(typeRecherche === 'logements' && typeLogement !== null && typeLogement !== "" && (typeof item.type !== 'string' || !item.type.toLowerCase().includes(typeLogement.toLowerCase())));

                        if (typeLogementMatch) {
                            resultats[itemKey + '_' + typeRecherche] = {
                                ...item,
                                entrepriseId: entrepriseKey,
                                entrepriseNom: entrepriseNom,
                                statut: item.statut || "Non spécifié",
                                typeRecherche: typeRecherche,
                                id: itemKey
                            };
                        }
                    }
                }
            }
        });

        await Promise.all(entreprisePromises);
        return resultats;

    } catch (error) {
        console.error(`Erreur lors de la récupération des données:`, error);
        alert(`Une erreur est survenue lors de la recherche. Veuillez réessayer.`);
        return {};
    } finally {
        toggleLoading(false);
    }
}

// Function to display search results
function afficherResultatsDansLaPage(resultats) {
    const resultatsRechercheDiv = document.getElementById("resultats-recherche");
    if (!resultatsRechercheDiv) {
        console.error("Element #resultats-recherche not found!");
        return;
    }

    resultatsRechercheDiv.innerHTML = "";
    resultatsRechercheDiv.style.display = "grid";

    if (Object.keys(resultats).length === 0) {
        resultatsRechercheDiv.innerHTML = `<p>Aucun résultat ne correspond à vos critères.</p>`;
    } else {
        for (const uniqueKey in resultats) {
            const item = resultats[uniqueKey];
             if (typeof item === 'object' && item !== null && item.typeRecherche) {
                const divItem = item.typeRecherche === 'logements' ? creerDivLogement(item) : creerDivBien(item);
                if (divItem) {
                   resultatsRechercheDiv.appendChild(divItem);
                }
            } else {
                 console.warn("Skipping invalid item in results:", item);
            }
        }
    }
}

// Search form listener
const formRecherche = document.getElementById("form-recherche");
if (formRecherche) {
    formRecherche.addEventListener("submit", async (event) => {
        event.preventDefault();
        const budgetInput = document.getElementById("budget");
        const quartierInput = document.getElementById("quartier");
        const villeInput = document.getElementById("ville");
        const typeInput = document.getElementById("type");

        const budget = budgetInput && budgetInput.value ? parseInt(budgetInput.value) : null;
        const quartier = quartierInput ? quartierInput.value.trim() || null : null;
        const ville = villeInput ? villeInput.value.trim() || null : null;
        const typeLogementInput = typeInput ? typeInput.value.trim() || null : null;

        const typeRechercheSelect = document.getElementById("type-recherche");
        const selectedType = typeRechercheSelect ? typeRechercheSelect.value : 'logements';

        let finalTypeLogementFilter = null;
        if (selectedType === 'logements') {
            finalTypeLogementFilter = typeLogementInput;
        }

        const resultatsRechercheDiv = document.getElementById("resultats-recherche");
        if (resultatsRechercheDiv) {
            resultatsRechercheDiv.innerHTML = '';
            resultatsRechercheDiv.style.display = 'none';
        }
        toggleLoading(true);

        try {
            const resultats = await effectuerRecherche(budget, quartier, ville, finalTypeLogementFilter);
            afficherResultatsDansLaPage(resultats);
             if (resultatsRechercheDiv) {
                 resultatsRechercheDiv.style.display = 'grid';
             }
        } catch (error) {
            console.error("Erreur pendant la recherche:", error);
            if (resultatsRechercheDiv) {
                resultatsRechercheDiv.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; color: red;">Erreur lors de la recherche.</p>';
                resultatsRechercheDiv.style.display = 'grid';
            }
        } finally {
            toggleLoading(false);
        }
    });
} else {
     console.error("Search form (#form-recherche) not found!");
}

// Function to create a 'Bien' card
function creerDivBien(bien) {
    if (!bien || typeof bien !== 'object') return null;
    const divBien = document.createElement("div");
    divBien.classList.add("bien");

    if (bien.image) {
         const imgBien = document.createElement("img");
         imgBien.src = bien.image;
         imgBien.alt = bien.titre || 'Image du bien';
         imgBien.loading = 'lazy';
         imgBien.onerror = (e) => { e.target.style.display='none'; console.warn(`Image failed to load: ${bien.image}`); };
         divBien.appendChild(imgBien);
    } else {
         const placeholder = document.createElement('div');
         placeholder.style.cssText = "height: 220px; background-color: #eee; display: flex; align-items: center; justify-content: center; color: #aaa; font-style: italic;";
         placeholder.textContent = 'Pas d\'image';
         divBien.appendChild(placeholder);
    }

    const textContainer = document.createElement('div');
    const titreBien = document.createElement("h3");
    titreBien.textContent = bien.titre || 'Bien sans titre';
    textContainer.appendChild(titreBien);

    if (bien.description) {
        const descriptionBien = document.createElement("p");
        descriptionBien.textContent = bien.description.substring(0, 80) + (bien.description.length > 80 ? '...' : '');
        textContainer.appendChild(descriptionBien);
    }

    const prixBien = document.createElement("p");
    prixBien.classList.add("prix");
    const prixNum = Number(bien.prix);
    prixBien.textContent = (!isNaN(prixNum) ? `${prixNum.toLocaleString('fr-FR')} FCFA` : 'Prix non spécifié');
    textContainer.appendChild(prixBien);

    if (bien.ville || bien.quartier) {
        const localisation = document.createElement("p");
        localisation.classList.add("localisation");
        const villeText = bien.ville || '';
        const quartierText = bien.quartier || '';
        localisation.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${quartierText}${quartierText && villeText ? ', ' : ''}${villeText}`;
        textContainer.appendChild(localisation);
    }

    const statutBien = document.createElement("p");
    statutBien.style.fontSize = '0.9em';
    statutBien.innerHTML = `<strong>Statut:</strong> ${bien.statut || 'Non spécifié'}`;
    textContainer.appendChild(statutBien);

    const entrepriseNomParagraphe = document.createElement("p");
    entrepriseNomParagraphe.style.fontSize = '0.85em';
    entrepriseNomParagraphe.style.color = '#888';
    entrepriseNomParagraphe.textContent = `Agence: ${bien.entrepriseNom || 'N/A'}`;
    textContainer.appendChild(entrepriseNomParagraphe);

    divBien.appendChild(textContainer);

    const boutonDetailsBien = document.createElement("button");
    boutonDetailsBien.textContent = "Voir les Détails";
    boutonDetailsBien.addEventListener("click", () => {
        afficherFenetreDetails(bien);
    });
    divBien.appendChild(boutonDetailsBien);

    return divBien;
}

// Function to create a 'Logement' card
function creerDivLogement(logement) {
    if (!logement || typeof logement !== 'object') return null;
    const divLogement = document.createElement("div");
    divLogement.classList.add("logement");

    if (logement.image) {
        const imgLogement = document.createElement("img");
        imgLogement.src = logement.image;
        imgLogement.alt = logement.titre || 'Image du logement';
        imgLogement.loading = 'lazy';
        imgLogement.onerror = (e) => { e.target.style.display='none'; console.warn(`Image failed to load: ${logement.image}`); };
        divLogement.appendChild(imgLogement);
    } else {
         const placeholder = document.createElement('div');
         placeholder.style.cssText = "height: 220px; background-color: #eee; display: flex; align-items: center; justify-content: center; color: #aaa; font-style: italic;";
         placeholder.textContent = 'Pas d\'image';
         divLogement.appendChild(placeholder);
    }

    const textContainer = document.createElement('div');
    const titreLogement = document.createElement("h3");
    titreLogement.textContent = logement.titre || 'Logement sans titre';
    textContainer.appendChild(titreLogement);

    if (logement.description) {
        const descriptionLogement = document.createElement("p");
        descriptionLogement.textContent = logement.description.substring(0, 80) + (logement.description.length > 80 ? '...' : '');
        textContainer.appendChild(descriptionLogement);
    }

    const prixLogement = document.createElement("p");
    prixLogement.classList.add("prix");
    const prixNum = Number(logement.prix);
    prixLogement.textContent = (!isNaN(prixNum) ? `${prixNum.toLocaleString('fr-FR')} FCFA` : 'Prix non spécifié');
    textContainer.appendChild(prixLogement);

    if (logement.type) {
         const typeLogementP = document.createElement("p");
         typeLogementP.style.fontSize = '0.9em';
         typeLogementP.innerHTML = `<strong>Type :</strong> ${logement.type}`;
         textContainer.appendChild(typeLogementP);
    }

    if (logement.ville || logement.quartier) {
         const localisation = document.createElement("p");
         localisation.classList.add("localisation");
         const villeText = logement.ville || '';
         const quartierText = logement.quartier || '';
         localisation.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${quartierText}${quartierText && villeText ? ', ' : ''}${villeText}`;
         textContainer.appendChild(localisation);
    }

    const statutLogement = document.createElement("p");
    statutLogement.style.fontSize = '0.9em';
    statutLogement.innerHTML = `<strong>Statut:</strong> ${logement.statut || 'Non spécifié'}`;
    textContainer.appendChild(statutLogement);

    const entrepriseNomParagraphe = document.createElement("p");
    entrepriseNomParagraphe.style.fontSize = '0.85em';
    entrepriseNomParagraphe.style.color = '#888';
    entrepriseNomParagraphe.textContent = `Agence: ${logement.entrepriseNom || 'N/A'}`;
    textContainer.appendChild(entrepriseNomParagraphe);

    divLogement.appendChild(textContainer);

    const boutonDetails = document.createElement("button");
    boutonDetails.textContent = "Voir les Détails";
    boutonDetails.addEventListener("click", () => {
        afficherFenetreDetails(logement);
    });
    divLogement.appendChild(boutonDetails);

    return divLogement;
}

// Function to display latest publications
async function afficherDernieresPublications() {
    const derniersLogementsContainer = document.getElementById("derniers-logements");
    if (!derniersLogementsContainer) return;

    derniersLogementsContainer.innerHTML = '<p class="loading" style="text-align:center; padding: 20px;">Chargement des publications...</p>';
    let allItems = [];
    const maintenant = Date.now();

    try {
        const entreprisesSnapshot = await database.ref('entreprises').once('value');
        const entreprisesData = entreprisesSnapshot.val();
        if (!entreprisesData) {
            derniersLogementsContainer.innerHTML = "<p style='text-align:center; padding: 20px;'>Aucune publication récente.</p>";
            return;
        }

        const fetchPromises = Object.keys(entreprisesData).map(async (entrepriseKey) => {
            const entrepriseNomSnapshot = await database.ref(`entreprises/${entrepriseKey}/nom`).once('value');
            const entrepriseNom = entrepriseNomSnapshot.val() || "Entreprise inconnue";
            const logementsSnapshot = await database.ref(`entreprises/${entrepriseKey}/logements`).once('value');
            const biensSnapshot = await database.ref(`entreprises/${entrepriseKey}/biens`).once('value');
            return { entrepriseKey, entrepriseNom, logementsData: logementsSnapshot.val(), biensData: biensSnapshot.val() };
        });

        const results = await Promise.all(fetchPromises);

        results.forEach(({ entrepriseKey, entrepriseNom, logementsData, biensData }) => {
            const processItems = (itemsData, typeRecherche) => {
                if (!itemsData) return;
                for (const itemKey of Object.keys(itemsData)) {
                    const item = itemsData[itemKey];
                    if (typeof item !== 'object' || item === null) continue;

                    let isPaidAndUnavailable = false;
                    if (item.statut === "Payé" && item.datePaiement) {
                         try {
                            const datePaiement = new Date(item.datePaiement);
                            const vingtQuatreHeures = 24 * 60 * 60 * 1000;
                            if (!isNaN(datePaiement.getTime()) && (maintenant - datePaiement.getTime() < vingtQuatreHeures)) {
                                isPaidAndUnavailable = true;
                            }
                         } catch(e) {}
                    }

                    if (!isPaidAndUnavailable) {
                        let datePub = 0;
                        if(item.datePublication) {
                             try { datePub = new Date(item.datePublication).getTime(); } catch(e) { datePub = 0; }
                        }
                        if (isNaN(datePub) || datePub === 0) { datePub = new Date(0).getTime(); }

                        allItems.push({
                            ...item,
                            entrepriseId: entrepriseKey,
                            entrepriseNom: entrepriseNom,
                            id: itemKey,
                            statut: item.statut || "Non spécifié",
                            typeRecherche: typeRecherche,
                            datePublicationTimestamp: datePub
                        });
                    }
                }
            };
            processItems(logementsData, 'logements');
            processItems(biensData, 'biens');
        });

        allItems.sort((a, b) => b.datePublicationTimestamp - a.datePublicationTimestamp);

        const MAX_CAROUSEL_ITEMS = 9;
        const recentItems = allItems.slice(0, MAX_CAROUSEL_ITEMS);
        derniersLogementsContainer.innerHTML = '';

        if (recentItems.length > 0) {
            const itemCarousel = document.createElement("div");
            itemCarousel.classList.add("logement-carousel");

            recentItems.forEach((item) => {
                const divItem = item.typeRecherche === 'logements' ? creerDivLogement(item) : creerDivBien(item);
                if (divItem) {
                     divItem.style.height = '100%'; // Ensure card takes full slide height
                     itemCarousel.appendChild(divItem);
                }
            });
            derniersLogementsContainer.appendChild(itemCarousel);
            setupCarousel(itemCarousel);
        } else {
            derniersLogementsContainer.innerHTML = "<p style='text-align:center; padding: 20px;'>Aucune publication récente.</p>";
        }

    } catch (error) {
        console.error("Erreur lors de l'affichage des dernières publications:", error);
        derniersLogementsContainer.innerHTML = "<p style='text-align:center; padding: 20px; color: red;'>Erreur chargement publications.</p>";
    }
}

// Enhanced carousel setup function
function setupCarousel(carouselElement) {
    const slides = Array.from(carouselElement.children);
    const numSlides = slides.length;
    const container = carouselElement.parentElement;
    if (!container || numSlides <= 1) {
        applyCarouselStylesStatic();
        console.log("Carousel: Not enough slides or container not found.");
        return;
    }

    let currentItemIndex = 0;
    const intervalTime = 5000;
    let slideInterval;

    function getVisibleSlidesCount() {
        if (window.innerWidth < 769) return 1;
        return 3;
    }

    function applyCarouselStyles(behavior = 'smooth') {
        const visibleCount = getVisibleSlidesCount();
        const slideWidthPercent = 100 / numSlides;
        carouselElement.style.width = `${numSlides * 100}%`;

        slides.forEach((slide) => {
             slide.style.flex = `0 0 ${slideWidthPercent}%`;
             slide.style.maxWidth = `${slideWidthPercent}%`;
             slide.style.boxSizing = 'border-box';
             slide.style.height = '100%';
        });

         const offsetPercent = -(currentItemIndex * slideWidthPercent);
         carouselElement.style.transition = (behavior === 'smooth') ? 'transform 0.5s ease-in-out' : 'none';
         carouselElement.style.transform = `translateX(${offsetPercent}%)`;

         if (behavior !== 'smooth') {
            carouselElement.offsetHeight;
            setTimeout(() => {
                if (carouselElement) {
                   carouselElement.style.transition = 'transform 0.5s ease-in-out';
                }
            }, 50);
         }
    }

     function applyCarouselStylesStatic() {
         const visibleCount = getVisibleSlidesCount();
         const slideWidthPercent = 100 / visibleCount;
         carouselElement.style.width = `100%`;
         carouselElement.style.transform = `translateX(0%)`;
         carouselElement.style.transition = 'none';

         slides.forEach((slide) => {
             slide.style.flex = `0 0 ${slideWidthPercent}%`;
             slide.style.maxWidth = `${slideWidthPercent}%`;
             slide.style.boxSizing = 'border-box';
             slide.style.height = '100%';
         });
     }

    function nextSlide() {
        currentItemIndex = (currentItemIndex + 1) % numSlides;
        applyCarouselStyles('smooth');
    }

     if (numSlides > getVisibleSlidesCount()) {
        applyCarouselStyles('auto');
        slideInterval = setInterval(nextSlide, intervalTime);
     } else {
         applyCarouselStylesStatic();
     }

    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            console.log("Resizing carousel...");
            clearInterval(slideInterval);
            if (numSlides > getVisibleSlidesCount()) {
                applyCarouselStyles('auto');
                slideInterval = setInterval(nextSlide, intervalTime);
            } else {
                 applyCarouselStylesStatic();
            }
        }, 250);
    });

    container.addEventListener('mouseenter', () => {
        if (slideInterval) clearInterval(slideInterval);
    });
    container.addEventListener('mouseleave', () => {
         if (numSlides > getVisibleSlidesCount()) {
             clearInterval(slideInterval);
             slideInterval = setInterval(nextSlide, intervalTime);
         }
    });
}

// Function to display all items
async function afficherTout() {
    toggleLoading(true);
    const resultatsRechercheDiv = document.getElementById("resultats-recherche");
    if (resultatsRechercheDiv) resultatsRechercheDiv.innerHTML = '';

    let allItemsMap = {};
    const maintenant = Date.now();

    try {
        const entreprisesSnapshot = await database.ref('entreprises').once('value');
        const entreprisesData = entreprisesSnapshot.val();
        if (!entreprisesData) {
             if(resultatsRechercheDiv) resultatsRechercheDiv.innerHTML = "<p style='grid-column: 1 / -1; text-align: center;'>Aucun élément à afficher.</p>";
            toggleLoading(false);
            return;
        }

        const fetchPromises = Object.keys(entreprisesData).map(async (entrepriseKey) => {
             const entrepriseNomSnapshot = await database.ref(`entreprises/${entrepriseKey}/nom`).once('value');
             const entrepriseNom = entrepriseNomSnapshot.val() || "Entreprise inconnue";
             const logementsSnapshot = await database.ref(`entreprises/${entrepriseKey}/logements`).once('value');
             const biensSnapshot = await database.ref(`entreprises/${entrepriseKey}/biens`).once('value');
             return { entrepriseKey, entrepriseNom, logementsData: logementsSnapshot.val(), biensData: biensSnapshot.val() };
        });

        const results = await Promise.all(fetchPromises);

        results.forEach(({ entrepriseKey, entrepriseNom, logementsData, biensData }) => {
             const processItems = (itemsData, typeRecherche) => {
                 if (!itemsData) return;
                 for (const itemKey of Object.keys(itemsData)) {
                     const item = itemsData[itemKey];
                     if (typeof item !== 'object' || item === null) continue;

                     let isPaidAndUnavailable = false;
                     if (item.statut === "Payé" && item.datePaiement) {
                         try {
                             const datePaiement = new Date(item.datePaiement);
                             const vingtQuatreHeures = 24 * 60 * 60 * 1000;
                             if (!isNaN(datePaiement.getTime()) && (maintenant - datePaiement.getTime() < vingtQuatreHeures)) {
                                isPaidAndUnavailable = true;
                             }
                         } catch(e) {}
                     }

                     if (!isPaidAndUnavailable) {
                         let datePub = 0;
                         if(item.datePublication) {
                             try { datePub = new Date(item.datePublication).getTime(); } catch(e) { datePub = 0; }
                         }
                         if (isNaN(datePub) || datePub === 0) { datePub = new Date(0).getTime(); }

                         allItemsMap[itemKey + '_' + typeRecherche] = {
                             ...item,
                             entrepriseId: entrepriseKey,
                             entrepriseNom: entrepriseNom,
                             id: itemKey,
                             statut: item.statut || "Non spécifié",
                             typeRecherche: typeRecherche,
                             datePublicationTimestamp: datePub
                         };
                     }
                 }
             };
             processItems(logementsData, 'logements');
             processItems(biensData, 'biens');
        });

        let allItemsArray = Object.values(allItemsMap);
        allItemsArray.sort((a, b) => b.datePublicationTimestamp - a.datePublicationTimestamp);

        const sortedItemsMap = allItemsArray.reduce((acc, item) => {
            acc[item.id + '_' + item.typeRecherche] = item;
            return acc;
        }, {});

        afficherResultatsDansLaPage(sortedItemsMap);
         if (resultatsRechercheDiv) {
                resultatsRechercheDiv.style.display = 'grid';
         }

    } catch (error) {
        console.error("Erreur lors de l'affichage de tous les éléments:", error);
        if(resultatsRechercheDiv) resultatsRechercheDiv.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; color: red;">Erreur chargement.</p>';
    } finally {
        toggleLoading(false);
    }
}

// "Voir plus" button listener
const voirPlusButton = document.getElementById("voir-plus");
if (voirPlusButton) {
    voirPlusButton.addEventListener("click", () => {
        const resultSection = document.getElementById('recherche-logement');
        if (resultSection) {
           window.scrollTo({
               top: resultSection.offsetTop + resultSection.offsetHeight + 20,
               behavior: 'smooth'
           });
        }
        afficherTout();
    });
} else {
     console.error("Button #voir-plus not found!");
}

// Function to display the details modal (CORRECTED WhatsApp Button Logic)
async function afficherFenetreDetails(item) {
    const existingFenetre = document.querySelector(".fenetre-details");
    if (existingFenetre) {
        document.body.removeChild(existingFenetre);
    }

    const fenetreDetails = document.createElement("div");
    fenetreDetails.classList.add("fenetre-details");

    let prixNumerique = 0;
    if (typeof item.prix === 'number') {
        prixNumerique = item.prix;
    } else if (typeof item.prix === 'string') {
        prixNumerique = parseFloat(String(item.prix).replace(/[^0-9.,]+/g, "").replace(',', '.'));
    }
    if (isNaN(prixNumerique)) prixNumerique = 0;

    let entrepriseWhatsapp = null;
    try {
        const entrepriseSnapshot = await database.ref(`entreprises/${item.entrepriseId}`).once('value');
        const entrepriseData = entrepriseSnapshot.val();
        if (entrepriseData && entrepriseData.whatsapp) {
             let rawNumber = String(entrepriseData.whatsapp).replace(/[^0-9]/g, '');
             if (rawNumber.length === 8) {
                 entrepriseWhatsapp = '229' + rawNumber;
             } else if (rawNumber.startsWith('229') && rawNumber.length >= 9) {
                 entrepriseWhatsapp = rawNumber;
             }
        }
    } catch(error) {
       console.error("Erreur récupération infos entreprise:", error);
    }

    const demarcheurNom = item.demarcheur || "Non spécifié";
    const proprietaireNom = item.proprietaire || "Non spécifié";
    const itemStatut = item.statut || 'Non spécifié';
    const maintenant = Date.now();
    let isPaidRecently = false;
    if (itemStatut === "Payé" && item.datePaiement) {
        try {
            const datePaiement = new Date(item.datePaiement);
            if (!isNaN(datePaiement.getTime()) && (maintenant - datePaiement.getTime() < (24 * 60 * 60 * 1000))) {
                 isPaidRecently = true;
            }
        } catch(e) {}
    }

    let isReservable = itemStatut !== 'Réservé' && itemStatut !== 'Payé' && !isPaidRecently;
    let isPayable = itemStatut !== 'Payé' && !isPaidRecently;
    let texteBoutonPayerAvance = (item.typeRecherche === 'logements') ? "Payer Loyer" : "Payer Bien";

    // --- Build Modal HTML (WhatsApp button ALWAYS active visually) ---
    fenetreDetails.innerHTML = `
        <button class="close-button fenetre-close-button" title="Fermer">×</button>
        <h3>${item.titre || 'Détails'}</h3>
        ${item.image ? `<img src="${item.image}" alt="${item.titre || 'Image'}">` : '<div style="height: 200px; background: #eee; text-align: center; line-height: 200px; color: #aaa; border-radius: 8px; border: 1px solid var(--border-light);">Pas d\'image</div>'}
        <p>${item.description || 'Pas de description.'}</p>
        <hr>
        <p><strong>Prix :</strong> <span class="prix">${prixNumerique > 0 ? prixNumerique.toLocaleString('fr-FR') + ' FCFA' : 'Non spécifié'}</span></p>
        <p><strong>Agence :</strong> ${item.entrepriseNom || 'N/A'}</p>
        <p><strong>Statut :</strong> <span class="item-statut">${itemStatut}</span></p>
        <p class="localisation"><i class="fas fa-map-marker-alt"></i> ${item.quartier || ''}${item.quartier && item.ville ? ', ' : ''}${item.ville || 'Non spécifiée'}</p>
        <div class="boutons-container">
            <button class="bouton-discussion" title="${entrepriseWhatsapp ? 'Contacter via WhatsApp' : 'WhatsApp non disponible'}"><i class="fab fa-whatsapp"></i> Discuter</button>
            <button class="bouton-infos" title="Afficher plus d'informations">Plus d'Infos</button>
            <button class="bouton-reservation" ${isReservable ? '' : 'disabled'} title="${isReservable ? 'Réserver ce bien' : 'Non réservable'}">Réserver</button>
            <button class="bouton-payer-avance" ${isPayable ? '' : 'disabled'} title="${isPayable ? 'Payer le montant total' : 'Non payable'}">${texteBoutonPayerAvance}</button>
        </div>
        <div class="reservation-info" style="display: none;">
             <hr><h4>Conditions de Réservation</h4>
             <p>Frais de réservation uniques (non remboursables) basés sur le prix :</p>
             <ul><li>Prix <= 5.000 FCFA : <strong>2.000 FCFA</strong></li><li>Prix 5.001 - 10.000 FCFA : <strong>3.000 FCFA</strong></li><li>Prix 10.001 - 15.000 FCFA : <strong>5.000 FCFA</strong></li><li>Prix 15.001 - 25.000 FCFA : <strong>10.000 FCFA</strong></li><li>Prix 25.001 - 50.000 FCFA : <strong>15.000 FCFA</strong></li><li>Prix > 50.000 FCFA : <strong>25.000 FCFA</strong></li></ul>
             <p>Ces frais vous donnent une priorité limitée. Confirmer vous redirigera vers FedaPay.</p><p><small>NB: Ces frais sont <strong>non remboursables</strong>.</small></p>
             <button class="confirmer-reservation" ${isReservable ? '' : 'disabled'}>Confirmer et Payer les Frais</button>
        </div>
        <div class="infos-logement" style="display: none;">
             <hr><h4>Informations détaillées</h4>
             <p><strong>Titre :</strong> ${item.titre || 'N/A'}</p>${item.typeRecherche === 'logements' && item.type ? `<p><strong>Type :</strong> ${item.type}</p>` : ''}<p><strong>Description :</strong> ${item.description || 'N/A'}</p><p><strong>État :</strong> ${item.etat || 'Non spécifié'}</p>
             <p><strong>Prix :</strong> ${prixNumerique > 0 ? prixNumerique.toLocaleString('fr-FR') + ' FCFA' : 'Non spécifié'}</p><p><strong>Démarcheur :</strong> ${demarcheurNom}</p><p><strong>Propriétaire :</strong> ${proprietaireNom}</p><p><strong>Quartier :</strong> ${item.quartier || 'N/A'}</p>
             <p><strong>Ville :</strong> ${item.ville || 'N/A'}</p><p><strong>Agence :</strong> ${item.entrepriseNom || 'N/A'}</p><p><strong>Statut :</strong> <span class="item-statut">${itemStatut}</span></p>${item.datePublication ? `<p><strong>Publié :</strong> ${new Date(item.datePublication).toLocaleDateString('fr-FR')}</p>` : ''}
        </div>`;
    document.body.appendChild(fenetreDetails);

    // Add Event Listeners for Modal Elements
    const closeButton = fenetreDetails.querySelector(".fenetre-close-button");
    if (closeButton) {
        closeButton.addEventListener("click", () => fenetreDetails.remove());
    }

    // CORRECTED WhatsApp Discussion Button Listener
    const discussionButton = fenetreDetails.querySelector(".bouton-discussion");
    if (discussionButton) { // Check if button exists
        discussionButton.addEventListener("click", () => {
            if (entrepriseWhatsapp) { // Check if number is valid *inside* the listener
                const message = `Bonjour ${item.entrepriseNom || ''}, intéressé par "${item.titre || 'ce bien'}" (ID: ${item.id}) vu sur ESPACE BENIN.`;
                window.open(`https://wa.me/${entrepriseWhatsapp}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
            } else {
                // Number not available, inform the user
                alert("Le numéro WhatsApp de cette agence n'est pas disponible pour le moment.");
            }
        });
    }

    const infoButton = fenetreDetails.querySelector(".bouton-infos");
    const infoDiv = fenetreDetails.querySelector(".infos-logement");
    const reservDiv = fenetreDetails.querySelector(".reservation-info");
    if (infoButton && infoDiv && reservDiv) {
        infoButton.addEventListener("click", () => {
           reservDiv.style.display = "none";
           infoDiv.style.display = infoDiv.style.display === "none" ? "block" : "none";
        });
    }

    const reservButton = fenetreDetails.querySelector(".bouton-reservation");
    if (reservButton && reservDiv && infoDiv && !reservButton.disabled) {
        reservButton.addEventListener("click", () => {
            infoDiv.style.display = "none";
            reservDiv.style.display = "block";
        });
    }

    const confirmReservButton = fenetreDetails.querySelector(".confirmer-reservation");
    if (confirmReservButton && !confirmReservButton.disabled) {
       confirmReservButton.addEventListener("click", async () => {
           let fraisReservation = 0;
           if (prixNumerique <= 5000) fraisReservation = 2000;
           else if (prixNumerique <= 10000) fraisReservation = 3000;
           else if (prixNumerique <= 15000) fraisReservation = 5000;
           else if (prixNumerique <= 25000) fraisReservation = 10000;
           else if (prixNumerique <= 50000) fraisReservation = 15000;
           else if (prixNumerique > 50000) fraisReservation = 25000;
           else { alert("Impossible de calculer les frais."); return; }

           const confirmation = confirm(`Payer ${fraisReservation.toLocaleString('fr-FR')} FCFA (frais NON REMBOURSABLES) pour "${item.titre}" via FedaPay ?`);
           if (!confirmation) return;

           confirmReservButton.disabled = true;
           confirmReservButton.textContent = "Traitement...";
           if(reservButton) reservButton.disabled = true;
           const itemRef = database.ref(`entreprises/${item.entrepriseId}/${item.typeRecherche}/${item.id}`);

           try {
               const fedaPayPublicKey = 'pk_live_TfSz212W0xSMKK7oPEogkFmp'; // YOUR KEY
               if (!fedaPayPublicKey || !fedaPayPublicKey.startsWith('pk_')) throw new Error("Clé FedaPay invalide.");
               if (typeof FedaPay === 'undefined') throw new Error("FedaPay SDK manquant.");

               FedaPay.init(confirmReservButton, {
                   public_key: fedaPayPublicKey,
                   transaction: { amount: fraisReservation, description: `Frais Réservation (${item.id}): ${item.titre.substring(0,45)}...` },
                   customer: { email: 'client@reserve.espacebenin.com' },
                   onComplete: async (resp) => {
                       console.log("FedaPay Response (Fees):", resp);
                       if (resp.status === 'approved' || resp.reason === FedaPay.CHECKOUT_COMPLETED) {
                           try {
                               await itemRef.update({ statut: "Réservé", dateReservation: new Date().toISOString(), transactionFraisId: resp.id });
                               fenetreDetails.querySelectorAll(".item-statut").forEach(el => el.textContent = "Réservé");
                               if(reservButton) reservButton.disabled = true;
                               if(confirmReservButton) confirmReservButton.style.display = 'none';
                               if(reservDiv) reservDiv.innerHTML = "<p style='color:green;font-weight:bold;'>Frais payés ! Bien réservé.</p>";
                               alert("Frais de réservation payés !");
                           } catch (dbError) {
                               console.error("Erreur MAJ Firebase (frais):", dbError);
                               alert("Paiement réussi, erreur MAJ statut. Support: " + (resp.id || 'N/A'));
                           }
                       } else {
                           alert(`Paiement frais échoué (${resp.reason || '?'}, Statut: ${resp.status || '?'}).`);
                           confirmReservButton.disabled = false;
                           confirmReservButton.textContent = "Confirmer et Payer les Frais";
                           if(reservButton) reservButton.disabled = false;
                       }
                   }
               });
           } catch (error) {
               console.error("Erreur FedaPay Init (frais):", error);
               alert("Erreur paiement frais : " + error.message);
               confirmReservButton.disabled = false;
               confirmReservButton.textContent = "Confirmer et Payer les Frais";
               if(reservButton) reservButton.disabled = false;
           }
       });
    }

    const payerButton = fenetreDetails.querySelector(".bouton-payer-avance");
    if (payerButton && !payerButton.disabled) {
        payerButton.addEventListener("click", async () => {
           if (prixNumerique <= 0) { alert("Prix invalide."); return; }
           const confirmation = confirm(`Payer ${prixNumerique.toLocaleString('fr-FR')} FCFA pour "${item.titre}" via FedaPay ?`);
           if (!confirmation) return;

           payerButton.disabled = true;
           payerButton.textContent = "Traitement...";
           if(reservButton) reservButton.disabled = true;
           if(confirmReservButton) confirmReservButton.disabled = true;
           const itemRef = database.ref(`entreprises/${item.entrepriseId}/${item.typeRecherche}/${item.id}`);

           try {
               const fedaPayPublicKey = 'pk_live_TfSz212W0xSMKK7oPEogkFmp'; // YOUR KEY
               if (!fedaPayPublicKey || !fedaPayPublicKey.startsWith('pk_')) throw new Error("Clé FedaPay invalide.");
               if (typeof FedaPay === 'undefined') throw new Error("FedaPay SDK manquant.");

               FedaPay.init(payerButton, {
                   public_key: fedaPayPublicKey,
                   transaction: { amount: prixNumerique, description: `Paiement (${item.id}): ${item.titre.substring(0,50)}` },
                   customer: { email: 'client@paiement.espacebenin.com' },
                   onComplete: async (resp) => {
                        console.log("FedaPay Response (Full):", resp);
                       if (resp.status === 'approved' || resp.reason === FedaPay.CHECKOUT_COMPLETED) {
                           try {
                               await itemRef.update({ statut: "Payé", datePaiement: new Date().toISOString(), transactionPaiementId: resp.id });
                               fenetreDetails.querySelectorAll(".item-statut").forEach(el => el.textContent = "Payé");
                               if(payerButton) payerButton.disabled = true;
                               if(reservButton) reservButton.disabled = true;
                               if(confirmReservButton) confirmReservButton.disabled = true;
                               if(reservDiv) reservDiv.style.display = 'none';
                               alert("Paiement effectué !");
                           } catch (dbError) {
                               console.error("Erreur MAJ Firebase (total):", dbError);
                               alert("Paiement réussi, erreur MAJ statut. Support: " + (resp.id || 'N/A'));
                           }
                       } else {
                           alert(`Paiement échoué (${resp.reason || '?'}, Statut: ${resp.status || '?'}).`);
                            payerButton.disabled = false;
                            payerButton.textContent = texteBoutonPayerAvance;
                            const initialReservable = itemStatut !== 'Réservé' && itemStatut !== 'Payé' && !isPaidRecently;
                            if (initialReservable) {
                                if(reservButton) reservButton.disabled = false;
                                if(confirmReservButton) confirmReservButton.disabled = false;
                            }
                       }
                   }
               });
           } catch (error) {
               console.error("Erreur FedaPay Init (total):", error);
               alert("Erreur paiement total : " + error.message);
               payerButton.disabled = false;
               payerButton.textContent = texteBoutonPayerAvance;
               const initialReservable = itemStatut !== 'Réservé' && itemStatut !== 'Payé' && !isPaidRecently;
               if (initialReservable) {
                  if(reservButton) reservButton.disabled = false;
                  if(confirmReservButton) confirmReservButton.disabled = false;
               }
           }
       });
    }
} // --- End afficherFenetreDetails ---

// Mobile menu toggle logic
const menuToggle = document.getElementById("menu-toggle");
const mainNav = document.getElementById("main-nav");
const menu = document.getElementById("menu");

if (menuToggle && mainNav && menu) {
    menuToggle.addEventListener("click", () => mainNav.classList.toggle("visible"));
    menu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => mainNav.classList.remove('visible')));
    document.addEventListener('click', (event) => {
        if (!mainNav.contains(event.target) && !menuToggle.contains(event.target) && mainNav.classList.contains('visible')) {
            mainNav.classList.remove('visible');
        }
    });
} else {
    console.warn("Menu elements not found.");
}

// Function to display testimonials
async function afficherTemoignages() {
    const container = document.querySelector(".temoignages-container");
    if (!container) return;
    container.innerHTML = "<p class='loading' style='grid-column: 1 / -1; text-align: center;'>Chargement...</p>";

    try {
        const avisSnapshot = await database.ref('avis').orderByChild('date').limitToLast(6).once('value');
        const avisData = avisSnapshot.val();
        container.innerHTML = "";

        if (avisData) {
            const avisArray = Object.keys(avisData)
                                   .map(key => ({ id: key, ...avisData[key] }))
                                   .sort((a, b) => (new Date(b.date || 0).getTime()) - (new Date(a.date || 0).getTime()));

            if (avisArray.length > 0) {
                 avisArray.forEach(unAvis => {
                    const div = document.createElement("div"); div.classList.add("temoignage");
                    const innerDiv = document.createElement('div');
                    const quoteText = document.createElement('p');
                    const texteAvis = String(unAvis.texte || '').trim();
                    quoteText.textContent = texteAvis ? `"${texteAvis}"` : '"..."';
                    innerDiv.appendChild(quoteText);
                    const authorText = document.createElement('p'); authorText.classList.add('temoignage-auteur');
                    const dateAffichage = unAvis.date ? new Date(unAvis.date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'short', day: 'numeric' }) : '';
                    const nomAuteur = String(unAvis.nom || 'Anonyme').trim();
                    authorText.innerHTML = `- ${nomAuteur || 'Anonyme'} ${dateAffichage ? `(${dateAffichage})` : ''}`;
                    innerDiv.appendChild(authorText);
                    div.appendChild(innerDiv); container.appendChild(div);
                });
            } else {
                 container.innerHTML = "<p style='grid-column: 1 / -1; text-align:center;'>Aucun témoignage.</p>";
            }
        } else {
            container.innerHTML = "<p style='grid-column: 1 / -1; text-align:center;'>Aucun témoignage.</p>";
        }
    } catch (error) {
        console.error("Erreur récupération avis:", error);
        container.innerHTML = "<p class='loading' style='grid-column: 1 / -1; color: red; text-align:center;'>Erreur chargement.</p>";
    }
}


// Listener for adding testimonials
const formAjoutAvis = document.getElementById("form-ajout-avis");
if (formAjoutAvis) {
    formAjoutAvis.addEventListener("submit", async (event) => {
        event.preventDefault();
        const nomInput = document.getElementById("avis-nom");
        const emailInput = document.getElementById("avis-email");
        const texteInput = document.getElementById("avis-texte");
        const submitButton = formAjoutAvis.querySelector('button[type="submit"]');
        const nom = nomInput ? nomInput.value.trim() : '';
        const email = emailInput ? emailInput.value.trim() : '';
        const texte = texteInput ? texteInput.value.trim() : '';

        if (!nom || !texte) { alert("Nom et témoignage requis."); return; }
        if (email && !/\S+@\S+\.\S+/.test(email)) { alert("Email invalide."); return; }
        if (submitButton) { submitButton.disabled = true; submitButton.textContent = "Envoi..."; }

        try {
            const newAvisRef = database.ref('avis').push();
            await newAvisRef.set({ nom, email, texte, date: new Date().toISOString() });
            formAjoutAvis.reset();
            alert("Avis ajouté ! Merci.");
            afficherTemoignages();
        } catch (error) {
            console.error("Erreur ajout avis:", error);
            alert("Erreur lors de l'ajout.");
        } finally {
             if (submitButton) { submitButton.disabled = false; submitButton.textContent = "Soumettre l'avis"; }
        }
    });
} else {
    console.error("Form #form-ajout-avis not found!");
}

// Modal setup function
function setupModal(modalId, triggerIds) {
    const modal = document.getElementById(modalId);
    const closeButton = modal ? modal.querySelector('.modal-content .close-button') : null;
    if (!modal || !closeButton) {
        console.warn(`Modal (${modalId}) or close button not found.`);
        return;
    }
    const openModal = (e) => { e.preventDefault(); modal.style.display = 'block'; };
    const closeModal = () => { modal.style.display = 'none'; };
    triggerIds.forEach(id => { const trigger = document.getElementById(id); if (trigger) trigger.addEventListener('click', openModal); else console.warn(`Trigger ${id} not found`); });
    closeButton.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
}


// Dynamic search field display logic
const typeRechercheSelect = document.getElementById("type-recherche");
const champsLogementsDiv = document.getElementById("champs-logements");
const champsBiensDiv = document.getElementById("champs-biens");
if (typeRechercheSelect && champsLogementsDiv && champsBiensDiv) {
    const handleTypeChange = () => {
        const selectedValue = typeRechercheSelect.value;
        champsLogementsDiv.classList.remove('visible'); champsBiensDiv.classList.remove('visible');
        champsLogementsDiv.style.display = 'none'; champsBiensDiv.style.display = 'none';
        if (selectedValue === "logements") { champsLogementsDiv.classList.add('visible'); champsLogementsDiv.style.display = 'contents'; }
        // else if (selectedValue === "biens") { /* Add logic if biens fields exist */ }
    };
    handleTypeChange();
    typeRechercheSelect.addEventListener("change", handleTypeChange);
} else {
     console.warn("Dynamic search field elements not found.");
}

// Admin area redirect button
const adminLoginButton = document.getElementById('admin-login-button');
if (adminLoginButton) {
    adminLoginButton.addEventListener('click', () => window.location.href = 'admin.html');
} else {
     console.error("Admin login button not found!");
}


// --- Section 2: Gemini Chatbot Logic ---

const GEMINI_API_KEY = 'AIzaSyDetgN_odqwqvU2AbaHzzijsi0yDRSveDM'; // <-- PUT YOUR KEY HERE (REPLACE THIS)

const CHATBOT_SYSTEM_INSTRUCTION = `
Tu es l'assistant virtuel officiel d'Espace Benin, une plateforme immobilière en ligne basée au Bénin. Ton rôle principal est d'aider les utilisateurs à naviguer sur le site espacebenin.netlify.app, à comprendre ses fonctionnalités et à trouver les informations qu'ils recherchent concernant la location et l'achat de biens immobiliers (logements) et d'autres biens divers listés par nos partenaires (agences ou particuliers).

**Ta mission est de:**
1.  **Guider les utilisateurs:** Aide-les à utiliser efficacement la barre de recherche, à comprendre les filtres et à interpréter les résultats.
2.  **Expliquer les fonctionnalités:** Clarifie le fonctionnement des différentes sections comme "Dernières publications", "Comment ça marche ?", "Services", "Témoignages".
3.  **Détailler les processus:** Explique comment fonctionnent la réservation et le paiement via les liens FedaPay intégrés dans les détails des annonces. Mentionne que les frais de réservation sont non-remboursables.
4.  **Fournir des informations contextuelles:** Réponds aux questions sur les types de biens disponibles (logements comme chambres, appartements; biens divers), les localisations (villes, quartiers mentionnés), les statuts des annonces ("Non spécifié", "Réservé", "Payé").
5.  **Orienter les utilisateurs:** Redirige les utilisateurs vers les sections appropriées du site (Contact, Espace Admin, Termes, Confidentialité) ou les encourage à utiliser les boutons d'action sur les annonces (Voir Détails, WhatsApp).

**Informations Clés sur Espace Benin que tu dois connaître et utiliser:**
*   **Recherche:** Logements ou Biens Divers; Filtres: Budget (FCFA), Ville, Quartier/Zone; Filtre Type pour Logements (Chambre, Appartement).
*   **Listings:** Cartes avec image, titre, courte description, prix (FCFA), localisation, statut, agence. Bouton "Voir les Détails" ouvre une modale.
*   **Fenêtre Détails:** Infos complètes, nom agence. Boutons: "Discuter" (WhatsApp vers agence), "Plus d'Infos", "Réserver" (frais FedaPay NON REMBOURSABLES), "Payer Loyer/Bien" (total via FedaPay).
*   **Statuts:** "Réservé" (frais payés), "Payé" (total payé, indisponible ~24h).
*   **FedaPay:** Utilisé pour frais et paiement total via redirection. Tu ne traites aucun paiement.
*   **Autres Sections:** Publications (carousel + bouton Voir plus), Services, Espace Admin (lien vers admin.html), Témoignages, Contact (WhatsApp, FB, Email, Adresse), Termes/Confidentialité (liens pied de page).

**Ton Style:** Français clair, professionnel, serviable, patient. Utilise listes si utile. Devise: FCFA. Base réponses sur infos du site.

**Tes Limites:** Pas d'accès temps réel (dispo exacte => contacter agence), pas de négociation, pas d'organisation de visite (contacter agence), pas de traitement paiement, pas de conseil juridique/financier, pas d'accès comptes/admin, pas d'infos hors site.

**Exemple:** *User:* "Louer chambre Agla 30000 FCFA ?" *Toi:* "Cliquez 'Voir Détails'. Dans la fenêtre, bouton 'Discuter' (WhatsApp) pour contacter l'agence. Option 'Réserver' peut être là pour payer frais (non remboursables) et avoir priorité."

Sois précis, utile, focalisé sur l'aide à l'utilisation du site Espace Benin !`;

let chatbotGenAI;
let chatbotModel;
let currentChatbotConversation = [];
const MAX_CHATBOT_HISTORY = 6;

function initializeChatbotGeminiAPI() {
    if (typeof window.GoogleGenerativeAI === 'undefined') { console.error("SDK Gemini non chargé."); showChatbotNotification("Erreur Assistant (SDK).", "error"); return false; }
    if (!GEMINI_API_KEY || GEMINI_API_KEY.length < 10) { console.error("Clé API Gemini invalide."); showChatbotNotification("Clé API Assistant invalide.", "error"); const s=document.getElementById('chatbot-send'), i=document.getElementById('chatbot-input'); if(s) s.disabled=true; if(i) i.placeholder="Assistant indisponible (Clé)"; return false; }
    try {
        if (!chatbotGenAI || !chatbotModel) {
             chatbotGenAI = new window.GoogleGenerativeAI(GEMINI_API_KEY);
             chatbotModel = chatbotGenAI.getGenerativeModel({ model: "gemini-1.5-flash-latest", systemInstruction: CHATBOT_SYSTEM_INSTRUCTION });
             console.log("API Gemini initialisée.");
        } return true;
    } catch (error) { console.error("Échec init Gemini:", error); showChatbotNotification("Erreur init assistant.", "error"); chatbotGenAI = chatbotModel = null; return false; }
}

function displayChatbotMessage(sender, text) {
    const cont = document.getElementById('chatbot-messages'); if (!cont) return null;
    const el = document.createElement('div'); el.classList.add('message', sender === 'user' ? 'user-message' : 'ai-message');
    const node = document.createElement('div'); node.textContent = text; el.appendChild(node);
    cont.appendChild(el); cont.scrollTop = cont.scrollHeight; return el;
}

function showChatbotTypingIndicator() {
    const cont = document.getElementById('chatbot-messages'); if (!cont) return null;
    const exist = cont.querySelector('.typing-indicator-message'); if (exist) exist.remove();
    const ind = document.createElement('div'); ind.classList.add('message', 'ai-message', 'typing-indicator-message');
    ind.innerHTML = `<div class="typing-indicator"><span></span><span></span><span></span></div>`;
    cont.appendChild(ind); cont.scrollTop = cont.scrollHeight; return ind;
}

async function animateChatbotText(targetEl, text) {
    if (!targetEl || !targetEl.classList.contains('typing-indicator-message')) { console.error("Target invalide."); displayChatbotMessage('ai', text); if(targetEl?.parentNode) targetEl.remove(); return; }
    const content = document.createElement('div'); targetEl.innerHTML = ''; targetEl.appendChild(content); targetEl.classList.remove('typing-indicator-message');
    let current = ''; const delay = 15;
    try {
         for (let i = 0; i < text.length; i++) {
            current += text[i]; content.textContent = current;
            const cont = document.getElementById('chatbot-messages'); if(cont) cont.scrollTop = cont.scrollHeight;
            await new Promise(r => setTimeout(r, delay));
         }
    } catch (e) { console.warn("Anim interrompue:", e); content.textContent = text; }
    finally { const cont = document.getElementById('chatbot-messages'); if(cont) cont.scrollTop = cont.scrollHeight; }
}

async function sendChatbotMessage() {
    const input = document.getElementById('chatbot-input'), sendBtn = document.getElementById('chatbot-send'), cont = document.getElementById('chatbot-messages');
    if (!input || !sendBtn || !cont) return;
    const userInput = input.value.trim(); if (!userInput) return;
    if (!chatbotGenAI || !chatbotModel) { if (!initializeChatbotGeminiAPI()) return; }

    input.value = ''; input.style.height = 'auto'; sendBtn.disabled = true;
    displayChatbotMessage('user', userInput);
    currentChatbotConversation.push({ role: "user", parts: [{ text: userInput }] });

    const loader = showChatbotTypingIndicator();
    const history = currentChatbotConversation.slice(0, -1).slice(-MAX_CHATBOT_HISTORY * 2);

    try {
        const chat = chatbotModel.startChat({ history });
        const result = await chat.sendMessage(userInput);
        const response = await result.response;
        if (!response || !response.text) { let reason = response?.promptFeedback?.blockReason||'?'; throw new Error(`SAFETY (Blocked: ${reason})`); }
        const aiText = response.text();
        currentChatbotConversation.push({ role: "model", parts: [{ text: aiText }] });
        await animateChatbotText(loader, aiText);
        const maxLen = (MAX_CHATBOT_HISTORY + 1) * 2; if (currentChatbotConversation.length > maxLen) { currentChatbotConversation = currentChatbotConversation.slice(-maxLen); }
    } catch (error) {
        console.error("Erreur API Gemini:", error);
        if (loader?.parentNode === cont) cont.removeChild(loader);
        let msg = `Erreur Assistant IA.`; const errStr = error.toString();
        if (errStr.includes('Quota')||errStr.includes('RATE_LIMIT')||errStr.includes('429')) msg="Trop de questions. Patientez svp.";
        else if (errStr.includes('API key')) msg="Problème config Assistant. Contactez l'admin.";
        else if (errStr.includes('SAFETY')) msg="Réponse bloquée (sécurité). Reformulez svp.";
        else if (errStr.includes('fetch')) msg="Erreur connexion Assistant. Vérifiez Internet.";
        displayChatbotMessage('ai', msg);
        if (currentChatbotConversation[currentChatbotConversation.length - 1]?.role === 'user') currentChatbotConversation.pop();
    } finally { sendBtn.disabled = false; input.focus(); }
}

function showChatbotNotification(message, type = 'info') {
    const cont = document.getElementById('chatbot-messages'); if (!cont) return;
    const notif = document.createElement('div');
    notif.style.cssText = `text-align: center; font-size: 0.8em; padding: 5px 10px; margin: 5px auto; border-radius: 5px; max-width: 80%; background-color: ${type==='error'?'rgba(255,0,0,0.1)':'rgba(150,150,150,0.1)'}; color: ${type==='error'?'#c00':'#555'};`;
    notif.textContent = message; cont.appendChild(notif); cont.scrollTop = cont.scrollHeight;
    setTimeout(() => { if (notif.parentNode === cont) notif.remove(); }, 7000);
}


// --- Section 3: DOMContentLoaded / Initialisation Générale ---

document.addEventListener('DOMContentLoaded', () => {
    // Real Estate Logic Initializations
    afficherDernieresPublications();
    afficherTemoignages();
    setupModal('privacy-modal', ['show-privacy', 'show-privacy-footer']);
    setupModal('terms-modal', ['show-terms', 'show-terms-footer']);

    // Chatbot UI Initializations & Listeners
    const chatToggle = document.getElementById('chatbot-toggle');
    const chatWindow = document.getElementById('chatbot-window');
    const chatClose = document.getElementById('chatbot-close');
    const chatSend = document.getElementById('chatbot-send');
    const chatInput = document.getElementById('chatbot-input');

    if (chatToggle && chatWindow && chatClose && chatSend && chatInput) {
        chatToggle.addEventListener('click', () => {
            const isVisible = chatWindow.classList.toggle('visible');
            if (isVisible) { chatInput.focus(); if (!chatbotGenAI || !chatbotModel) initializeChatbotGeminiAPI(); }
        });
        chatClose.addEventListener('click', () => chatWindow.classList.remove('visible'));
        chatSend.addEventListener('click', sendChatbotMessage);
        chatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChatbotMessage(); }});
        chatInput.addEventListener('input', () => { chatInput.style.height='auto'; const maxH=100; chatInput.style.height = `${Math.min(chatInput.scrollHeight, maxH)}px`; });
    } else {
        console.error("Éléments UI Chatbot manquants !");
        if (chatToggle) chatToggle.style.display = 'none';
    }
});

// --- END OF SCRIPT ---
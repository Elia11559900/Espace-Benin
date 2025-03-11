// Configuration de Firebase (inchangée)
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

// Initialiser Firebase
const app = firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Variables pour les boutons et le type de recherche
const btnRechercheLogements = document.getElementById("btn-recherche-logements");
const btnRechercheBiens = document.getElementById("btn-recherche-biens");
let typeRechercheActuel = 'logements'; // 'logements' par défaut.  IMPORTANT


// Fonction pour afficher/cacher l'indicateur de chargement
function toggleLoading(show) {
    const loadingIndicator = document.getElementById("loading-indicator");
    loadingIndicator.style.display = show ? "block" : "none";
}

// Fonction générique pour effectuer une recherche (logements ET biens)
async function effectuerRecherche(budget, quartier, ville, typeLogement, typeRecherche = 'logements') { // Ajout du paramètre typeRecherche, avec 'logements' par défaut
    toggleLoading(true);
    const resultats = {};
    const maintenant = Date.now(); // Timestamp actuel

    try {
        const entreprisesSnapshot = await database.ref('entreprises').once('value');

        for (const entrepriseKey of Object.keys(entreprisesSnapshot.val() || {})) {
            // Boucle à travers les types d'items (logements et biens)
            // for (const typeRecherche of ['logements', 'biens']) { // MODIFICATION: Plus besoin de boucle, on utilise le paramètre
                const itemsRef = database.ref(`entreprises/${entrepriseKey}/${typeRecherche}`);  // Utilisation du paramètre typeRecherche
                const itemsSnapshot = await itemsRef.once('value');

                const entrepriseNom = (await database.ref(`entreprises/${entrepriseKey}/nom`).once('value')).val();

                for (const itemKey of Object.keys(itemsSnapshot.val() || {})) {
                    const item = itemsSnapshot.val()[itemKey];

                    // FILTRAGE: Vérifie si l'élément est payé et si la date de paiement est dépassée
                    if (item.statut === "Payé" && item.datePaiement) {
                        const datePaiement = new Date(item.datePaiement);
                        const vingtQuatreHeures = 24 * 60 * 60 * 1000; // 24 heures en millisecondes
                         if (maintenant - datePaiement.getTime() < vingtQuatreHeures) {
                             continue; //Ignore les biens/logements payés datant de plus de 24 heures
                        }
                    }

                    // FILTRAGE (commun aux logements et biens)
                    if ((budget === null || item.prix <= budget) &&
                        (quartier === null || item.quartier.toLowerCase().includes(quartier.toLowerCase())) &&
                        (ville === null || item.ville.toLowerCase().includes(ville.toLowerCase()))
                       )
                    {
                         // Filtrage supplémentaire pour le type de logement (si spécifié ET si c'est un logement)
                        if (typeRecherche === 'logements' && typeLogement !== null && typeLogement !== "" && !item.type.toLowerCase().includes(typeLogement.toLowerCase())) {
                            continue;  // Skip if type doesn't match
                        }

                        resultats[itemKey] = { ...item, entrepriseId: entrepriseKey, entrepriseNom: entrepriseNom, statut: item.statut || "Non spécifié", typeRecherche: typeRecherche, id: itemKey };
                    }
                }
            // } // Fermeture de la boucle (commentée)
        }
        return resultats;
    } catch (error) {
        console.error(`Erreur lors de la récupération des données:`, error);
        alert(`Une erreur est survenue lors de la recherche. Veuillez réessayer.`);
        return {};
    } finally {
        toggleLoading(false);
    }
}


// Fonction pour afficher les résultats (logements ET biens)
function afficherResultatsDansLaPage(resultats) {
    const resultatsRecherche = document.getElementById("resultats-recherche");
    resultatsRecherche.innerHTML = "";  // Clear previous results
    resultatsRecherche.style.display = "grid";

    if (Object.keys(resultats).length === 0) {
        const messageAucunResultat = document.createElement("p");
        messageAucunResultat.textContent = "Aucun résultat ne correspond à vos critères.";
        resultatsRecherche.appendChild(messageAucunResultat);
    } else {
        for (const itemId in resultats) {
            const item = resultats[itemId];
            const divItem = item.typeRecherche === 'logements' ? creerDivLogement(item) : creerDivBien(item);
            resultatsRecherche.appendChild(divItem);
        }
    }
}

// Fonctions pour gérer le clic sur les boutons:
btnRechercheLogements.addEventListener("click", () => {
    typeRechercheActuel = 'logements';
    btnRechercheLogements.classList.add("active");
    btnRechercheBiens.classList.remove("active");
    document.getElementById("resultats-recherche").innerHTML = ""; // Efface les résultats
    document.getElementById("type").parentElement.style.display = "block"; // Affiche l'input "type" (spécifique aux logements).
});

btnRechercheBiens.addEventListener("click", () => {
    typeRechercheActuel = 'biens';
    btnRechercheBiens.classList.add("active");
    btnRechercheLogements.classList.remove("active");
    document.getElementById("resultats-recherche").innerHTML = "";  // Efface les résultats
    document.getElementById("type").parentElement.style.display = "none"; // Cache le champ "type", car inutile pour les biens.
});


// Écoute de la soumission du formulaire de recherche (simplifié)
const formRecherche = document.getElementById("form-recherche");

formRecherche.addEventListener("submit", async (event) => {
    event.preventDefault();

    const budget = parseInt(document.getElementById("budget").value) || null;
    const quartier = document.getElementById("quartier").value || null;
    const ville = document.getElementById("ville").value || null;
    const typeLogement = document.getElementById("type").value || null;

    const resultats = await effectuerRecherche(budget, quartier, ville, typeLogement, typeRechercheActuel); // Ajout de typeRechercheActuel
    afficherResultatsDansLaPage(resultats);
});


// Fonction pour créer un élément div pour un BIEN
function creerDivBien(bien) {
    const divBien = document.createElement("div");
    divBien.classList.add("bien");

    const entrepriseNomParagraphe = document.createElement("p");
    entrepriseNomParagraphe.textContent = `Entreprise: ${bien.entrepriseNom}`;
    divBien.appendChild(entrepriseNomParagraphe);

    const statutBien = document.createElement("p");
    statutBien.textContent = `Statut: ${bien.statut}`;
    divBien.appendChild(statutBien);

    const imgBien = document.createElement("img");
    imgBien.src = bien.image;
    imgBien.alt = bien.titre;
    divBien.appendChild(imgBien);

    const titreBien = document.createElement("h3");
    titreBien.textContent = bien.titre;
    divBien.appendChild(titreBien);

    const descriptionBien = document.createElement("p");
    descriptionBien.textContent = bien.description;
    divBien.appendChild(descriptionBien);

    const prixBien = document.createElement("p");
    prixBien.textContent = `${bien.prix} FCFA`;
    divBien.appendChild(prixBien);

    const etatBien = document.createElement("p");
    etatBien.textContent = `État : ${bien.etat || 'Non spécifié'}`;
    divBien.appendChild(etatBien);

    const quartierBien = document.createElement("p");
    quartierBien.textContent = `Quartier : ${bien.quartier}`;
    divBien.appendChild(quartierBien);

    const villeBien = document.createElement("p");
    villeBien.textContent = `Ville : ${bien.ville}`;
    divBien.appendChild(villeBien);

    const boutonDetailsBien = document.createElement("button");
    boutonDetailsBien.textContent = "Détails";
    boutonDetailsBien.addEventListener("click", () => {
        afficherFenetreDetails(bien);
    });
    divBien.appendChild(boutonDetailsBien);

    return divBien;
}

// Fonction pour créer un élément div pour un LOGEMENT
function creerDivLogement(logement) {
    const divLogement = document.createElement("div");
    divLogement.classList.add("logement");

     const entrepriseNomParagraphe = document.createElement("p");
    entrepriseNomParagraphe.textContent = `Entreprise: ${logement.entrepriseNom}`;
    divLogement.appendChild(entrepriseNomParagraphe);

    const statutLogement = document.createElement("p");
    statutLogement.textContent = `Statut: ${logement.statut}`;
    divLogement.appendChild(statutLogement);

    const imgLogement = document.createElement("img");
    imgLogement.src = logement.image;
    imgLogement.alt = logement.titre;
    divLogement.appendChild(imgLogement);

    const titreLogement = document.createElement("h3");
    titreLogement.textContent = logement.titre;
    divLogement.appendChild(titreLogement);

    const descriptionLogement = document.createElement("p");
    descriptionLogement.textContent = logement.description;
    divLogement.appendChild(descriptionLogement);

    const prixLogement = document.createElement("p");
    prixLogement.textContent = `${logement.prix} FCFA`;
    divLogement.appendChild(prixLogement);

    const etatLogement = document.createElement("p");
    etatLogement.textContent = `État : ${logement.etat}`;
    divLogement.appendChild(etatLogement);

    const quartierLogement = document.createElement("p");
    quartierLogement.textContent = `Quartier : ${logement.quartier}`;
    divLogement.appendChild(quartierLogement);

    const villeLogement = document.createElement("p");
    villeLogement.textContent = `Ville : ${logement.ville}`;
    divLogement.appendChild(villeLogement);

    const boutonDetails = document.createElement("button");
    boutonDetails.textContent = "Détails";
    boutonDetails.addEventListener("click", () => {
        afficherFenetreDetails(logement);
    });
    divLogement.appendChild(boutonDetails);

    return divLogement;
}

// Fonction pour afficher les dernières publications (logements et biens)
async function afficherDernieresPublications(typeRecherche = null){ //Added typeRecherche
    const derniersLogements = document.getElementById("derniers-logements");
    derniersLogements.innerHTML = "";

    let allItems = [];
    const maintenant = Date.now();

    const entreprisesSnapshot = await database.ref('entreprises').once('value');
    for (const entrepriseKey of Object.keys(entreprisesSnapshot.val() || {})) {
        const entrepriseNom = (await database.ref(`entreprises/${entrepriseKey}/nom`).once('value')).val();

        // Loop through both 'logements' and 'biens'
       // for (const typeRecherche of ['logements', 'biens']) { //REMOVED
           let itemsRef;

            if (typeRecherche) {
                itemsRef = database.ref(`entreprises/${entrepriseKey}/${typeRecherche}`); // Use provided typeRecherche
            } else {
                // If typeRecherche is null, get both logements and biens
                for (const tr of ['logements', 'biens']) {
                    const tempItemsRef = database.ref(`entreprises/${entrepriseKey}/${tr}`);
                    const tempItemsSnapshot = await tempItemsRef.once('value');

                    for (const itemKey of Object.keys(tempItemsSnapshot.val() || {})) {
                        const item = tempItemsSnapshot.val()[itemKey];

                        // ... (rest of the filtering logic, as before) ...
                        if (item.statut === "Payé" && item.datePaiement) {
                            const datePaiement = new Date(item.datePaiement);
                            const vingtQuatreHeures = 24 * 60 * 60 * 1000;
                            if (maintenant - datePaiement.getTime() < vingtQuatreHeures) {
                                continue;  // Skip paid items older than 24 hours
                            }
                        }

                        allItems.push({ ...item, entrepriseId: entrepriseKey, entrepriseNom: entrepriseNom, id: itemKey, statut: item.statut || "Non spécifié", typeRecherche: tr });

                    }
                }
                continue; // Skip the rest of the loop if typeRecherche is null
            }

            const itemsSnapshot = await itemsRef.once('value');

            for (const itemKey of Object.keys(itemsSnapshot.val() || {})) {
                const item = itemsSnapshot.val()[itemKey];

                // FILTRAGE: Payé et date de paiement
                if (item.statut === "Payé" && item.datePaiement) {
                    const datePaiement = new Date(item.datePaiement);
                    const vingtQuatreHeures = 24 * 60 * 60 * 1000;
                    if (maintenant - datePaiement.getTime() < vingtQuatreHeures) {
                        continue;  // Skip paid items older than 24 hours
                    }
                }
                allItems.push({ ...item, entrepriseId: entrepriseKey, entrepriseNom: entrepriseNom, id: itemKey, statut: item.statut || "Non spécifié", typeRecherche: typeRecherche });
            }
        //} REMOVED
    }

    // Trier par date de publication (la plus récente en premier)
    allItems.sort((a, b) => (b.datePublication || 0) - (a.datePublication || 0));
    const recentItems = allItems.slice(0, 3);

    if (recentItems.length > 0) {
        const itemCarousel = document.createElement("div");
        itemCarousel.classList.add("logement-carousel"); // Use the same class for styling

        recentItems.forEach((item) => {
            const divItem = item.typeRecherche === 'logements' ? creerDivLogement(item) : creerDivBien(item);
            itemCarousel.appendChild(divItem);
        });

        derniersLogements.appendChild(itemCarousel);

        // Carousel logic (same as before, but using a more generic class name)
        let currentItemIndex = 0;
        const slides = itemCarousel.querySelectorAll(".logement, .bien"); // Select both logements and biens
        const numSlides = slides.length;

        setInterval(() => {
            slides.forEach((slide, index) => {
                if (index === currentItemIndex) {
                    slide.style.left = `calc(50% - calc(100% / 6))`;
                    slide.style.zIndex = "2";
                    slide.style.opacity = "1";
                } else if (
                    index === (currentItemIndex + 1) % numSlides ||
                    (currentItemIndex === numSlides - 1 && index === 0)
                ) {
                    slide.style.left = `calc(100% - calc(100% / 3))`;
                    slide.style.zIndex = "1";
                    slide.style.opacity = "0.7";
                } else {
                    slide.style.left = `0`;
                    slide.style.zIndex = "1";
                    slide.style.opacity = "0.7";
                }
            });
            currentItemIndex = (currentItemIndex + 1) % numSlides;
        }, 5000);

    } else {
        const messageAucunItem = document.createElement("p");
        messageAucunItem.textContent = "Aucune publication récente.";
        derniersLogements.appendChild(messageAucunItem);
    }
}



afficherDernieresPublications();

//Fonction pour afficher tous les logements (sans filtre) //Modified now
async function afficherTousLesLogements(typeRecherche = null) { // Add typeRecherche, default to null (all)
     const resultats = await effectuerRecherche(null, null, null, null, typeRecherche); // Added typeRecherche
    afficherResultatsDansLaPage(resultats);
}

//Bouton "Voir plus" : affiche tous les logements/biens
const voirPlusButton = document.getElementById("voir-plus");
voirPlusButton.addEventListener("click", () => {
    afficherTousLesLogements(typeRechercheActuel); // Utilisez typeRechercheActuel pour filter
});

// Fonction pour afficher la fenêtre de détails
async function afficherFenetreDetails(item) {
    const fenetreDetails = document.createElement("div");
    fenetreDetails.classList.add("fenetre-details");

    let prixNumerique = parseFloat(item.prix);
    const entrepriseRef = database.ref(`entreprises/${item.entrepriseId}`);
    const entrepriseSnapshot = await entrepriseRef.once('value');
    const entrepriseData = entrepriseSnapshot.val();

    if (!entrepriseData) {
        console.error("Entreprise non trouvée:", item.entrepriseId);
        alert("Erreur : Impossible de trouver les informations de l'entreprise.");
        return;
    }

    const entrepriseWhatsapp = entrepriseData.whatsapp;
    const demarcheurNom = item.demarcheur || "Non spécifié";
    const proprietaireNom = item.proprietaire || "Non spécifié";
    let texteBoutonPayerAvance = (item.typeRecherche === 'logements') ? "Payer Avance Logement" : "Payer Avance Bien";

    fenetreDetails.innerHTML = `
        <h3>${item.titre}</h3>
        <img src="${item.image}" alt="${item.titre}">
        <p>${item.description}</p>
        <p>Prix : ${item.prix} FCFA</p>
        <p>Entreprise : ${item.entrepriseNom}</p>
        <p>Statut : ${item.statut}</p>
        <div class="boutons-container">
            <button class="bouton-discussion">Discussion</button>
            <button class="bouton-infos">Infos </button>
             <button class="bouton-reservation">Réservation</button>
             <button class="bouton-payer-avance">${texteBoutonPayerAvance}</button>
            <button class="bouton-fermer">Fermer</button>
        </div>

        <div class="reservation-info" style="display: none;">
            <p>NB : La réservation peut se fait selon les critères</p>
            <p>Loyer compris entre :</p>
            <ul>
                <li>L : 0 - 5.000f = 2.000f</li>
                <li>L : 5.001 - 10.000f = 3.000f</li>
                <li>L : 10.001 - 15.000f = 5.000f</li>
                <li>L : 15.001 - 25.000f = 10.000f</li>
                <li>L : 25.001 - 50.000f = 15.000f</li>
                <li>L : 50.001f et plus = 25.000f</li>
            </ul>
            <p>Les frais de réservation son restitué après location effectif du local dans un délai de huit (08) jours.</p>
            <p>Si vous décidez de ne plus louer la chambre ou le local, ou aucune local, vous perdre vos frais de réservation</p>
            <p>Vous pouvez changer de local et bénéficier de la restitution des frais de Réservation toujours en respactant le délai de huit (08) jours.</p>
            <button class="confirmer-reservation">Réserver quand même</button>
        </div>

        <div class="infos-logement" style="display: none;">
            <h4>Informations détaillées :</h4>
            <p><strong>Titre:</strong> ${item.titre}</p>
            ${item.type ? `<p><strong>Type:</strong> ${item.type}</p>` : ''}
            <p><strong>Description:</strong> ${item.description}</p>
            <p><strong>État:</strong> ${item.etat || 'Non spécifié'}</p>
            <p><strong>Prix:</strong> ${item.prix} FCFA</p>
            <p><strong>Démarcheur:</strong> ${demarcheurNom}</p>
            <p><strong>Propriétaire:</strong> ${proprietaireNom}</p>
            <p><strong>Quartier:</strong> ${item.quartier}</p>
             <p><strong>Ville:</strong> ${item.ville}</p>
             <p><strong>Entreprise:</strong> ${item.entrepriseNom}</p>
              <p><strong>Statut:</strong> ${item.statut}</p>
        </div>
    `;

    document.body.appendChild(fenetreDetails);

    const boutonDiscussion = fenetreDetails.querySelector(".bouton-discussion");
    boutonDiscussion.addEventListener("click", () => {
        const message = item.typeRecherche === 'logements'
        ? `Je suis intéressé par le logement : ${item.titre}`
        : `Je suis intéressé par le bien : ${item.titre}`;
        window.location.href = `https://wa.me/${entrepriseWhatsapp}?text=${encodeURIComponent(message)}`;
    });

    const boutonInfos = fenetreDetails.querySelector(".bouton-infos");
    const infosLogement = fenetreDetails.querySelector(".infos-logement");

    boutonInfos.addEventListener("click", () => {
       infosLogement.style.display = infosLogement.style.display === "none" ? "block" : "none";
     });

    const boutonReservation = fenetreDetails.querySelector(".bouton-reservation");
    const reservationInfo = fenetreDetails.querySelector(".reservation-info");
    boutonReservation.addEventListener("click", () => {
        reservationInfo.style.display = "block";
    });

    const confirmerReservation = fenetreDetails.querySelector(".confirmer-reservation");
    confirmerReservation.addEventListener("click", async () => {
        let fraisReservation = 0;
        if (prixNumerique <= 5000) {
            fraisReservation = 2000;
        } else if (prixNumerique <= 10000) {
             fraisReservation = 3000;
        } else if (prixNumerique <= 15000) {
             fraisReservation = 5000;
         } else if (prixNumerique <= 25000) {
           fraisReservation = 10000;
         }else if(prixNumerique <= 50000){
            fraisReservation = 15000;
         }else{
             fraisReservation = 25000;
         }

        const itemRef = database.ref(`entreprises/${item.entrepriseId}/${item.typeRecherche}/${item.id}`);
        try {
            await itemRef.update({ statut: "Réservé" });
              const lienPaiement = `https://me.fedapay.com/mon_loyer?amount=${fraisReservation}`;
              window.location.href = lienPaiement;
            alert("Réservation confirmée!  Vous allez être redirigé pour le paiement.");
        } catch (error) {
            console.error("Erreur lors de la mise à jour du statut:", error);
            alert("Erreur lors de la réservation.  Veuillez réessayer.");
        }
    });

    const boutonPayerAvance = fenetreDetails.querySelector(".bouton-payer-avance");
    boutonPayerAvance.addEventListener("click", async () => {

        const itemRef = database.ref(`entreprises/${item.entrepriseId}/${item.typeRecherche}/${item.id}`);
        try{
            await itemRef.update({
                statut: "Payé",
                datePaiement: new Date().toISOString()
            });
            const lienPaiement = `https://me.fedapay.com/mon_loyer?amount=${item.prix}`;
            window.location.href = lienPaiement;
             alert("Paiement confirmé !");

        }catch(error){
            console.error("Erreur lors de la mise à jour du statut (paiement):", error);
            alert("Erreur lors du paiement.  Veuillez réessayer.");
        }
    });

    const boutonFermer = fenetreDetails.querySelector(".bouton-fermer");
    boutonFermer.addEventListener("click", () => {
        document.body.removeChild(fenetreDetails);
    });
}

const menuToggle = document.getElementById("menu-toggle");
const menu = document.getElementById("menu");

menuToggle.addEventListener("click", () => {
    menu.classList.toggle("hidden");
});

async function afficherTemoignages() {
    const temoignagesContainer = document.querySelector(".temoignages-container");
    temoignagesContainer.innerHTML = "";

    try {
        const avisSnapshot = await database.ref('avis').once('value');
        const avis = avisSnapshot.val();

        if (avis) {
            for (const avisId in avis) {
                const unAvis = avis[avisId];
                const temoignageDiv = document.createElement("div");
                temoignageDiv.classList.add("temoignage");
                temoignageDiv.innerHTML = `
                    <p>"${unAvis.texte}"</p>
                    <p class="temoignage-auteur">- ${unAvis.nom || 'Anonyme'}${unAvis.email ? `, <a href="mailto:${unAvis.email}">${unAvis.email}</a>` : ''}</p>
                `;
                temoignagesContainer.appendChild(temoignageDiv);
            }
        } else {
        temoignagesContainer.innerHTML = "<p>Aucun témoignage pour le moment.</p>";
        }

    } catch (error) {
        console.error("Erreur lors de la récupération des avis:", error);
        temoignagesContainer.innerHTML = "<p>Erreur lors du chargement des témoignages.</p>";
    }
}

const formAjoutAvis = document.getElementById("form-ajout-avis");
formAjoutAvis.addEventListener("submit", async (event) => {
    event.preventDefault();

    const nom = document.getElementById("avis-nom").value;
    const email = document.getElementById("avis-email").value;
    const texte = document.getElementById("avis-texte").value;

    if (!texte.trim()) {
        alert("Veuillez entrer un avis.");
        return;
    }

    try {
        const newAvisRef = database.ref('avis').push();
        await newAvisRef.set({
            nom: nom,
            email: email,
            texte: texte,
            date: new Date().toISOString()
        });
        formAjoutAvis.reset();
        alert("Avis ajouté avec succès !");
        afficherTemoignages();

    } catch (error) {
        console.error("Erreur lors de l'ajout de l'avis:", error);
        alert("Une erreur est survenue lors de l'ajout de l'avis. Veuillez réessayer.");
    }
});

afficherTemoignages();

document.getElementById('show-privacy').addEventListener('click', function(event) {
    event.preventDefault();
    document.getElementById('privacy-modal').style.display = 'block';
});

document.querySelector('.close-button').addEventListener('click', function() {
    document.getElementById('privacy-modal').style.display = 'none';
});

window.addEventListener('click', function(event) {
    if (event.target == document.getElementById('privacy-modal')) {
        document.getElementById('privacy-modal').style.display = 'none';
    }
});
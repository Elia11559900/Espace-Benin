// Configuration de Firebase
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



// Fonction pour afficher les résultats de la recherche (LOGEMENTS).
async function afficherResultats(budget, quartier, ville, type) {
    const logementsFiltres = {};

    const entreprisesSnapshot = await database.ref('entreprises').once('value');

    for (const entrepriseKey of Object.keys(entreprisesSnapshot.val() || {})) {
        const logementsRef = database.ref(`entreprises/${entrepriseKey}/logements`);
        const logementsSnapshot = await logementsRef.once('value');

        const entrepriseNom = (await database.ref(`entreprises/${entrepriseKey}/nom`).once('value')).val();

        for (const logementKey of Object.keys(logementsSnapshot.val() || {})) {
            const logement = logementsSnapshot.val()[logementKey];

            // FILTRAGE (modifié pour la recherche de biens - type peut être null)
            if ((budget === null || logement.prix <= budget) &&
                (quartier === null || logement.quartier.toLowerCase().includes(quartier.toLowerCase())) &&
                (ville === null || logement.ville.toLowerCase().includes(ville.toLowerCase())) &&
                (type === null || logement.type.toLowerCase().includes(type.toLowerCase()))) { // type optionnel

                logementsFiltres[logementKey] = { ...logement, entrepriseId: entrepriseKey, entrepriseNom: entrepriseNom, statut: logement.statut || "Non spécifié" };
            }
        }
    }
    afficherResultatsDansLaPage(logementsFiltres);
}

// Fonction pour afficher les résultats DANS LA PAGE (LOGEMENTS)
function afficherResultatsDansLaPage(logements) {
    const resultatsRecherche = document.getElementById("resultats-recherche");
    resultatsRecherche.innerHTML = "";
    resultatsRecherche.style.display = "grid";

    if (Object.keys(logements).length === 0) {
        const messageAucunLogement = document.createElement("p");
        messageAucunLogement.textContent = "Aucun logement n'est disponible correspondant à votre budget.";
        resultatsRecherche.appendChild(messageAucunLogement);
    } else {
        for (const logementId in logements) {
            const logement = logements[logementId];
            const divLogement = creerDivLogement(logement); // Utilise la fonction de création de div
            resultatsRecherche.appendChild(divLogement);
        }
    }
}


// Fonction pour afficher les résultats de la recherche (BIENS).
async function afficherResultatsBiens(budget, quartier, ville) { // Pas de type pour les biens
    const biensFiltres = {};

    const entreprisesSnapshot = await database.ref('entreprises').once('value');

    for (const entrepriseKey of Object.keys(entreprisesSnapshot.val() || {})) {
        const biensRef = database.ref(`entreprises/${entrepriseKey}/biens`); // Chemin vers les BIENS
        const biensSnapshot = await biensRef.once('value');

        const entrepriseNom = (await database.ref(`entreprises/${entrepriseKey}/nom`).once('value')).val();

        for (const bienKey of Object.keys(biensSnapshot.val() || {})) {
            const bien = biensSnapshot.val()[bienKey];

            // FILTRAGE pour les biens
            if ((budget === null || bien.prix <= budget) &&
                (quartier === null || bien.quartier.toLowerCase().includes(quartier.toLowerCase())) &&
                (ville === null || bien.ville.toLowerCase().includes(ville.toLowerCase()))) {

                biensFiltres[bienKey] = { ...bien, entrepriseId: entrepriseKey, entrepriseNom: entrepriseNom, statut: bien.statut || "Non spécifié" };
            }
        }
    }
    afficherResultatsBiensDansLaPage(biensFiltres); // Affiche les biens
}

// Fonction pour afficher les BIENS
function afficherResultatsBiensDansLaPage(biens) {
    const resultatsRecherche = document.getElementById("resultats-recherche");
    resultatsRecherche.innerHTML = ""; // Efface les résultats précédents
    resultatsRecherche.style.display = "grid";

    if (Object.keys(biens).length === 0) {
        const messageAucunBien = document.createElement("p");
        messageAucunBien.textContent = "Aucun bien disponible ne correspond à vos critères.";
        resultatsRecherche.appendChild(messageAucunBien);
    } else {
        for (const bienId in biens) {
            const bien = biens[bienId];
            const divBien = creerDivBien(bien); // Crée la div pour le bien
            resultatsRecherche.appendChild(divBien);
        }
    }
}

// Fonction pour créer un élément div pour un BIEN
function creerDivBien(bien) {
    const divBien = document.createElement("div");
    divBien.classList.add("bien"); // Classe CSS "bien"

    const entrepriseNomParagraphe = document.createElement("p");
    entrepriseNomParagraphe.textContent = `Entreprise: ${bien.entrepriseNom}`;
    divBien.appendChild(entrepriseNomParagraphe);

    const statutBien = document.createElement("p");
    statutBien.textContent = `Statut: ${bien.statut}`;
    divBien.appendChild(statutBien);

    const imgBien = document.createElement("img");
    imgBien.src = bien.image;
    imgBien.alt = bien.titre;  // Assure-toi que tes biens ont un champ 'titre'
    divBien.appendChild(imgBien);

    const titreBien = document.createElement("h3");
    titreBien.textContent = bien.titre;
    divBien.appendChild(titreBien);

    const descriptionBien = document.createElement("p");
    descriptionBien.textContent = bien.description; // Et un champ 'description'
    divBien.appendChild(descriptionBien);

    const prixBien = document.createElement("p");
    prixBien.textContent = `${bien.prix} FCFA`;
    divBien.appendChild(prixBien);

    const etatBien = document.createElement("p"); //Si tu as un champ 'etat' pour les biens
    etatBien.textContent = `État : ${bien.etat || 'Non spécifié'}`;  // Gère le cas où 'etat' est manquant
    divBien.appendChild(etatBien);

    const quartierBien = document.createElement("p");
    quartierBien.textContent = `Quartier : ${bien.quartier}`;
    divBien.appendChild(quartierBien);

    const boutonReserverBien = document.createElement("button");  // Un bouton "Réserver" pour les biens aussi?
    boutonReserverBien.textContent = "Réserver";
    boutonReserverBien.addEventListener("click", () => {
        // Tu peux utiliser la même fenêtre ou en créer une spécifique pour les biens
        afficherFenetreReservation(bien);
    });
    divBien.appendChild(boutonReserverBien);


    return divBien;
}

// Fonction pour créer un élément div pour un logement (réutilisable et améliorée)
function creerDivLogement(logement) {
    const divLogement = document.createElement("div");
    divLogement.classList.add("logement");

    const entrepriseNomParagraphe = document.createElement("p");
    entrepriseNomParagraphe.textContent = `Entreprise: ${logement.entrepriseNom}`; // Utilise entrepriseNom
    divLogement.appendChild(entrepriseNomParagraphe);

     // Ajout d'un paragraphe pour le *Statut* de l'entreprise
    const statutLogement = document.createElement("p");
    statutLogement.textContent = `Statut: ${logement.statut}`; // Utilise entrepriseNom
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

    const boutonReserver = document.createElement("button");
    boutonReserver.textContent = "Réserver";
    boutonReserver.addEventListener("click", () => {
        afficherFenetreReservation(logement);
    });
    divLogement.appendChild(boutonReserver);

    return divLogement;
}


// Écouter la soumission du formulaire de recherche
const formRecherche = document.getElementById("form-recherche");
const choixLogement = document.getElementById("choix-logement");
const choixBien = document.getElementById("choix-bien");
const champsLogement = document.getElementById("champs-logement");
const champsBien = document.getElementById("champs-bien");

//Affiche le formulaire en fonction du choix
choixLogement.addEventListener("change", () => {
    champsLogement.style.display = "block";
    champsBien.style.display = "none";
});

choixBien.addEventListener("change", () => {
    champsLogement.style.display = "none";
    champsBien.style.display = "block";
});

formRecherche.addEventListener("submit", (event) => {
    event.preventDefault();

    if (choixLogement.checked) {
        const budget = parseInt(document.getElementById("budget").value) || null;
        const quartier = document.getElementById("quartier").value || null;
        const ville = document.getElementById("ville").value || null;
        const type = document.getElementById("type").value || null;

        afficherResultats(budget, quartier, ville, type); // Recherche de logements
    } else if (choixBien.checked) {
        const budget = parseInt(document.getElementById("budget-bien").value) || null; // Budget du bien
        const quartier = document.getElementById("quartier-bien").value || null;    // Quartier du bien
        const ville = document.getElementById("ville-bien").value || null;          // Ville du bien

        afficherResultatsBiens(budget, quartier, ville); // Recherche de biens
    }
});

// Fonction pour afficher les dernières publications (version SIMPLIFIÉE)
async function afficherDernieresPublications() {
    const derniersLogements = document.getElementById("derniers-logements");
    derniersLogements.innerHTML = "";

    let allLogements = []; // Tableau pour stocker TOUS les logements

    const entreprisesSnapshot = await database.ref('entreprises').once('value');
    for (const entrepriseKey of Object.keys(entreprisesSnapshot.val() || {})) {
        const logementsRef = database.ref(`entreprises/${entrepriseKey}/logements`);
        const logementsSnapshot = await logementsRef.once('value');

         // Récupère le nom de l'entreprise AVANT de boucler sur les logements
        const entrepriseNom = (await database.ref(`entreprises/${entrepriseKey}/nom`).once('value')).val();


        for (const logementKey of Object.keys(logementsSnapshot.val() || {})) {
            const logement = logementsSnapshot.val()[logementKey];
            // Ajoute l'ID de l'entreprise, le NOM, l'ID du logement et le STATUT
            allLogements.push({ ...logement, entrepriseId: entrepriseKey,entrepriseNom: entrepriseNom, id: logementKey , statut: logement.statut || "Non spécifié" });
        }
    }

    // Trie TOUS les logements par date de publication (décroissant)
    allLogements.sort((a, b) => (b.datePublication || 0) - (a.datePublication || 0));

    // Sélectionne les 3 premiers (les plus récents)
    const logementsRecents = allLogements.slice(0, 3);


    if (logementsRecents.length > 0) { //Utilisation de length sur le tableau

        const logementCarousel = document.createElement("div");
        logementCarousel.classList.add("logement-carousel");

        logementsRecents.forEach((logement) => { //Utilisation du tableau logementsRecents
            const divLogement = creerDivLogement(logement);
            logementCarousel.appendChild(divLogement);
        });

        derniersLogements.appendChild(logementCarousel);

        // Carousel (logique inchangée)
        let currentLogementIndex = 0;
        const slides = logementCarousel.querySelectorAll(".logement");
        const numSlides = slides.length;

        setInterval(() => {
            slides.forEach((slide, index) => {
                if (index === currentLogementIndex) {
                    slide.style.left = `calc(50% - calc(100% / 6))`;
                    slide.style.zIndex = "2";
                    slide.style.opacity = "1";
                } else if (
                    index === (currentLogementIndex + 1) % numSlides ||
                    (currentLogementIndex === numSlides - 1 && index === 0)
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
            currentLogementIndex = (currentLogementIndex + 1) % numSlides;
        }, 5000);

    } else {
        const messageAucunLogement = document.createElement("p");
        messageAucunLogement.textContent = "Aucune publication récente.";
        derniersLogements.appendChild(messageAucunLogement);
    }
}

// Appeler la fonction pour afficher les dernières publications au chargement de la page
afficherDernieresPublications();


// Fonction pour afficher TOUS les logements (pour le bouton "Voir plus")
async function afficherTousLesLogements() {
    // Appelle afficherResultats sans filtre (budget et quartier à null)
    afficherResultats(null, null, null, null); // Ajout de null pour ville et type
}


// Écouter le clic sur le bouton "Voir plus"
const voirPlusButton = document.getElementById("voir-plus");
voirPlusButton.addEventListener("click", () => {
    afficherTousLesLogements();
});

// Fonction pour afficher la fenêtre de réservation (inchangée)
function afficherFenetreReservation(logement) {
    const fenetreReservation = document.createElement("div");
    fenetreReservation.classList.add("fenetre-reservation");

    fenetreReservation.innerHTML = `
        <h3>${logement.titre}</h3>
        <img src="${logement.image}" alt="${logement.titre}">
        <p>${logement.description}</p>
        <p>Prix : ${logement.prix} FCFA</p>
        <button class="bouton-discussion">Discussion</button>
        <button class="bouton-payer">Payer</button>
        <button class="bouton-fermer">Fermer</button>
    `;

    document.body.appendChild(fenetreReservation);

     // Bouton Discussion
    const boutonDiscussion = fenetreReservation.querySelector(".bouton-discussion");
    boutonDiscussion.addEventListener("click", () => {
        // Remplacer le numéro par le numéro WhatsApp de votre entreprise
        window.location.href = `https://wa.me/+22951092429?text=Je%20suis%20intéressé%20par%20le%20logement%20:%20${logement.titre}`;
    });

    // Bouton Payer
    const boutonPayer = fenetreReservation.querySelector(".bouton-payer");
    boutonPayer.addEventListener("click", () => {
    // Rediriger vers le lien de paiement Fedapay avec le montant
    const lienPaiement = `https://me.fedapay.com/mon_loyer?amount=${logement.prix}`;
    window.location.href = lienPaiement;
    });

    // Bouton Fermer
    const boutonFermer = fenetreReservation.querySelector(".bouton-fermer");
    boutonFermer.addEventListener("click", (event) => {
        event.preventDefault();
        document.body.removeChild(fenetreReservation);
    });
}


// Basculer la visibilité du menu (inchangé)
const menuToggle = document.getElementById("menu-toggle");
const menu = document.getElementById("menu");

menuToggle.addEventListener("click", () => {
    menu.classList.toggle("hidden");
});
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

// Fonction pour afficher/cacher l'indicateur de chargement
function toggleLoading(show) {
    const loadingIndicator = document.getElementById("loading-indicator");
    loadingIndicator.style.display = show ? "block" : "none";
}

// Fonction pour afficher les résultats de la recherche (LOGEMENTS).
async function afficherResultats(budget, quartier, ville, type) {
    toggleLoading(true); // Affiche le chargement
    const logementsFiltres = {};

    try {
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
    } catch (error) {
        console.error("Erreur lors de la récupération des logements:", error);
        alert("Une erreur est survenue lors de la recherche. Veuillez réessayer.");
    } finally {
        toggleLoading(false);
        afficherResultatsDansLaPage(logementsFiltres); // Affiche les résultats *après* le chargement
    }
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
async function afficherResultatsBiens(budget, quartier, ville) {
    toggleLoading(true); // Affiche le chargement
    const biensFiltres = {};

    try {
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
    } catch (error) {
        console.error("Erreur lors de la récupération des biens:", error);
        alert("Une erreur est survenue lors de la recherche de biens. Veuillez réessayer.");

    } finally {
        toggleLoading(false);
        afficherResultatsBiensDansLaPage(biensFiltres); // Affiche les résultats *après* le chargement
    }
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

      const villeBien = document.createElement("p");
    villeBien.textContent = `Ville : ${bien.ville}`;  // Ajout de la ville
    divBien.appendChild(villeBien);

    const boutonDetailsBien = document.createElement("button");  // CHANGEMENT : Bouton "Détails"
    boutonDetailsBien.textContent = "Détails";
    boutonDetailsBien.addEventListener("click", () => {
        afficherFenetreDetails(bien); // Affiche la fenêtre de détails
    });
    divBien.appendChild(boutonDetailsBien);

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

     const villeLogement = document.createElement("p");
     villeLogement.textContent = `Ville : ${logement.ville}`;  // Ajout de la ville
     divLogement.appendChild(villeLogement);


    const boutonDetails = document.createElement("button"); // CHANGEMENT : Bouton "Détails"
    boutonDetails.textContent = "Détails";
    boutonDetails.addEventListener("click", () => {
        afficherFenetreDetails(logement);  // Affiche la fenêtre de détails
    });
    divLogement.appendChild(boutonDetails);

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
            allLogements.push({ ...logement, entrepriseId: entrepriseKey, entrepriseNom: entrepriseNom, id: logementKey, statut: logement.statut || "Non spécifié" });
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

// Fonction pour afficher la fenêtre de détails (REMPLACE afficherFenetreReservation)
async function afficherFenetreDetails(item) { // 'item' peut être un logement OU un bien
    const fenetreDetails = document.createElement("div");
    fenetreDetails.classList.add("fenetre-details");

    let prixNumerique = parseFloat(item.prix);

    // Récupère les infos de l'entreprise (dont le numéro WhatsApp)
    const entrepriseRef = database.ref(`entreprises/${item.entrepriseId}`);
    const entrepriseSnapshot = await entrepriseRef.once('value');
    const entrepriseData = entrepriseSnapshot.val();

    if (!entrepriseData) {
        console.error("Entreprise non trouvée:", item.entrepriseId);
        alert("Erreur : Impossible de trouver les informations de l'entreprise.");
        return; // Arrête l'exécution si l'entreprise n'est pas trouvée
    }

    const entrepriseWhatsapp = entrepriseData.whatsapp; // Assure-toi que le champ 'whatsapp' existe
     // Récupérer le nom du démarcheur (si disponible)
    const demarcheurNom = item.demarcheur || "Non spécifié";
    const proprietaireNom = item.proprietaire || "Non spécifié";

    // Détermine le texte du bouton "Payer Avance" en fonction du type
    let texteBoutonPayerAvance = (item.hasOwnProperty('type')) ? "Payer Avance Logement" : "Payer Avance Bien";


    fenetreDetails.innerHTML = `
        <h3>${item.titre}</h3>
        <img src="${item.image}" alt="${item.titre}">
        <p>${item.description}</p>
        <p>Prix : ${item.prix} FCFA</p>
        <p>Entreprise : ${item.entrepriseNom}</p>
        <div class="boutons-container">
            <button class="bouton-discussion">Discussion</button>
            <button class="bouton-infos">Infos </button>
             <button class="bouton-reservation">Réservation</button>
             <button class="bouton-payer-avance">${texteBoutonPayerAvance}</button>
            <button class="bouton-fermer">Fermer</button>
        </div>

        <!-- Section d'information sur la réservation (initialement cachée) -->
        <div class="reservation-info" style="display: none;">
            <p>NB : La réservation se fait à un prix forfaitaire selon le critère :</p>
            <ul>
                <li>L : 0 - 5.000f = 2.000f</li>
                <li>L : 5.001 - 10.000f = 3.000f</li>
                <li>L : 10.001 - 15.000f = 5.000f</li>
                <li>L : 15.001 - 25.000f = 10.000f</li>
                <li>L : 25.001 - 50.000f = 15.000f</li>
                <li>L : 50.001f et plus = 25.000f</li>
            </ul>
            <p>Après paiement de l'avance, vos frais de réservation vous seront remboursés automatiquement.</p>
            <p>Si la chambre n'est plus disponible, vous perdez vos frais de réservation.</p>
            <p>La chambre peut être réservée dans un délai de huit (08) jours après le paiement de la réservation.</p>
            <button class="confirmer-reservation">Réserver</button>
        </div>

        <!-- Section d'informations détaillées (initialement cachée) -->
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

    // Bouton Discussion
    const boutonDiscussion = fenetreDetails.querySelector(".bouton-discussion");
    boutonDiscussion.addEventListener("click", () => {
        //Adapte le message en fonction du type de bien
        const message = item.hasOwnProperty('type')
        ? `Je suis intéressé par le logement : ${item.titre}`
        : `Je suis intéressé par le bien : ${item.titre}`;
         // Utilise le numéro WhatsApp de l'entreprise
        window.location.href = `https://wa.me/${entrepriseWhatsapp}?text=${encodeURIComponent(message)}`;

    });

      //Bouton Infos Logement/Bien (affiche les infos)
    const boutonInfos = fenetreDetails.querySelector(".bouton-infos");
    const infosLogement = fenetreDetails.querySelector(".infos-logement");

    boutonInfos.addEventListener("click", () => {
    // Affiche/masque la section des informations détaillées en utilisant un toggle
       infosLogement.style.display = infosLogement.style.display === "none" ? "block" : "none";
     });

    //Bouton Réservation (affiche les infos)
    const boutonReservation = fenetreDetails.querySelector(".bouton-reservation");
    const reservationInfo = fenetreDetails.querySelector(".reservation-info");

     boutonReservation.addEventListener("click", () => {
        reservationInfo.style.display = "block"; // Affiche les infos de réservation
     });

     //Bouton "Confirmer Réservation" (à l'intérieur des infos de réservation)
     const confirmerReservation = fenetreDetails.querySelector(".confirmer-reservation");
     confirmerReservation.addEventListener("click", () => {
      // Calcul des frais de réservation.
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
           // Rediriger vers le lien de paiement Fedapay avec le montant
         const lienPaiement = `https://me.fedapay.com/mon_loyer?amount=${fraisReservation}`;
         window.location.href = lienPaiement;

     });

    // Bouton Payer Avance
    const boutonPayerAvance = fenetreDetails.querySelector(".bouton-payer-avance");
    boutonPayerAvance.addEventListener("click", () => {
        // Rediriger vers le lien de paiement Fedapay avec le montant de l'AVANCE (prix complet)
        const lienPaiement = `https://me.fedapay.com/mon_loyer?amount=${item.prix}`;
        window.location.href = lienPaiement;
    });

    // Bouton Fermer
    const boutonFermer = fenetreDetails.querySelector(".bouton-fermer");
    boutonFermer.addEventListener("click", () => {
        document.body.removeChild(fenetreDetails);
    });
}

// Basculer la visibilité du menu (inchangé)
const menuToggle = document.getElementById("menu-toggle");
const menu = document.getElementById("menu");

menuToggle.addEventListener("click", () => {
    menu.classList.toggle("hidden");
});

// --------- Gestion des avis (NOUVEAU) ---------

// Fonction pour afficher les témoignages depuis Firebase
async function afficherTemoignages() {
    const temoignagesContainer = document.querySelector(".temoignages-container");
    temoignagesContainer.innerHTML = ""; // Efface les témoignages existants

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


// Écoute de la soumission du formulaire d'ajout d'avis
const formAjoutAvis = document.getElementById("form-ajout-avis");
formAjoutAvis.addEventListener("submit", async (event) => {
    event.preventDefault();

    const nom = document.getElementById("avis-nom").value;
    const email = document.getElementById("avis-email").value;
    const texte = document.getElementById("avis-texte").value;

    if (!texte.trim()) { // Vérifie que l'avis n'est pas vide
        alert("Veuillez entrer un avis.");
        return;
    }

    try {
        const newAvisRef = database.ref('avis').push();
        await newAvisRef.set({
            nom: nom,
            email: email,
            texte: texte,
            date: new Date().toISOString() // Ajoute une date pour le tri
        });
        // Efface le formulaire après soumission
        formAjoutAvis.reset();
        alert("Avis ajouté avec succès !");
        afficherTemoignages(); // Recharge les témoignages (y compris le nouveau)

    } catch (error) {
        console.error("Erreur lors de l'ajout de l'avis:", error);
        alert("Une erreur est survenue lors de l'ajout de l'avis. Veuillez réessayer.");
    }
});
// Appeler la fonction pour afficher les témoignages au chargement
afficherTemoignages();
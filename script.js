// Configuration de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDGOgJ_Lmtc---VE6Ty-l3FHFzaFh5rcO4",
  authDomain: "immo-c41e6.firebaseapp.com",
  databaseURL: "https://immo-c41e6-default-rtdb.firebaseio.com",
  projectId: "immo-c41e6",
  storageBucket: "immo-c41e6.firebasestorage.app",
  messagingSenderId: "1050311955497",
  appId: "1:1050311955497:web:fdc94d20240387d1bdb838",
  measurementId: "G-54VG8HN5H8"
};

// Initialiser Firebase
const app = firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Fonction pour afficher les résultats de la recherche
function afficherResultats(logements) {
  const resultatsRecherche = document.getElementById("resultats-recherche");
  resultatsRecherche.innerHTML = "";

  // Vérifier si la liste des logements est vide
  if (Object.keys(logements).length === 0) {
    // Afficher le message "Aucun logement..."
    const messageAucunLogement = document.createElement("p");
    messageAucunLogement.textContent =
      "Aucun logement n'est disponible correspondant à votre budget.";
    resultatsRecherche.appendChild(messageAucunLogement);
  } else {
    // Afficher les logements
    for (const logementId in logements) {
      const logement = logements[logementId];
      const divLogement = document.createElement("div");
      divLogement.classList.add("logement");

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

      const boutonReserver = document.createElement("button");
      boutonReserver.textContent = "Réserver";
      boutonReserver.addEventListener("click", () => {
        alert(`Réservation de la chambre ${logement.titre}`);
      });
      divLogement.appendChild(boutonReserver);

      resultatsRecherche.appendChild(divLogement);
    }
  }
}

// Écouter la soumission du formulaire de recherche
const formRecherche = document.getElementById("form-recherche");
formRecherche.addEventListener("submit", (event) => {
  event.preventDefault();

  const budget = parseInt(document.getElementById("budget").value);
  const quartier = document.getElementById("quartier").value;

  // Référence à la base de données
  const logementsRef = database.ref("logements");

  // Écoute des données et filtrage
  logementsRef.on("value", (snapshot) => {
    const logementsData = snapshot.val();
    const logementsFiltres = {};

    for (const id in logementsData) {
        if (budget && quartier) {
            // Filtrage par budget et par quartier
            if (logementsData[id].prix <= budget && logementsData[id].quartier.toLowerCase().includes(quartier.toLowerCase())) {
              logementsFiltres[id] = logementsData[id];
            }
          } else if (budget) {
            // Filtrage par budget uniquement
            if (logementsData[id].prix <= budget) {
              logementsFiltres[id] = logementsData[id];
            }
          } else if (quartier) {
            // Filtrage par quartier uniquement
            if (logementsData[id].quartier.toLowerCase().includes(quartier.toLowerCase())) {
              logementsFiltres[id] = logementsData[id];
            }
          } else {
            // Aucun filtre appliqué, afficher tous les logements
            logementsFiltres[id] = logementsData[id];
          }
    }

    afficherResultats(logementsFiltres);
  });
});

// Fonction pour afficher les dernières publications
async function afficherDernieresPublications() {
  const derniersLogements = document.getElementById("derniers-logements");
  derniersLogements.innerHTML = "";

  const logementsRef = database.ref("logements");

  const snapshot = await logementsRef.orderByChild("datePublication").limitToLast(3).once("value");
  const logementsData = snapshot.val();

  if (logementsData) {
    const logements = Object.values(logementsData).reverse();
    const logementCarousel = document.createElement("div");
    logementCarousel.classList.add("logement-carousel");

    logements.forEach((logement) => {
      const divLogement = document.createElement("div");
      divLogement.classList.add("logement");

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

      // Ajout du bouton "Réserver"
      const boutonReserver = document.createElement("button");
      boutonReserver.textContent = "Réserver";
      boutonReserver.addEventListener("click", () => {
        alert(`Réservation de la chambre ${logement.titre}`);
      });
      divLogement.appendChild(boutonReserver);

      logementCarousel.appendChild(divLogement);
    });

    derniersLogements.appendChild(logementCarousel);

    // Gérer le défilement automatique
    // Carousel logic
    let currentLogementIndex = 0;
    const slides = logementCarousel.querySelectorAll(".logement");
    const numSlides = slides.length;

    setInterval(() => {
        // Update slide positions and opacity
        slides.forEach((slide, index) => {
          if (index === currentLogementIndex) {
            // Middle slide (fully visible)
            slide.style.left = `calc(50% - calc(100% / 6))`;
            slide.style.zIndex = "2";
            slide.style.opacity = "1";
          } else if (
            index === (currentLogementIndex + 1) % numSlides ||
            (currentLogementIndex === numSlides - 1 && index === 0)
          ) {
            // Right slide (partially visible)
            slide.style.left = `calc(100% - calc(100% / 3))`;
            slide.style.zIndex = "1";
            slide.style.opacity = "0.7";
          } else {
            // Left slide (partially visible)
            slide.style.left = `0`;
            slide.style.zIndex = "1";
            slide.style.opacity = "0.7";
          }
        });
  
        // Move to the next slide
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

// Fonction pour afficher tous les logements
function afficherTousLesLogements() {
  const logementsRef = database.ref("logements");

  logementsRef.on("value", (snapshot) => {
    const logementsData = snapshot.val();

    if (logementsData) {
      afficherResultats(logementsData);
    } else {
      const messageAucunLogement = document.createElement("p");
      messageAucunLogement.textContent = "Aucun logement disponible.";
      document.getElementById("resultats-recherche").appendChild(messageAucunLogement);
    }
  });
}

// Écouter le clic sur le bouton "Voir plus"
const voirPlusButton = document.getElementById("voir-plus");
voirPlusButton.addEventListener("click", () => {
  afficherTousLesLogements();
});
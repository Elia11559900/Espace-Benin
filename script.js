// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyC6gz3XjTK8B8yxJoEgI0uas88kXurqHJE",
    authDomain: "gklm-test.firebaseapp.com",
    databaseURL: "https://gklm-test-default-rtdb.firebaseio.com",
    projectId: "gklm-test",
    storageBucket: "gklm-test.firebasestorage.app",
    messagingSenderId: "394583326970",
    appId: "1:394583326970:web:70ec317319a75b7cd7c943",
    measurementId: "G-9M0GQQ30SM"
};

// Initialize Firebase
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

  // Référence à la base de données
  const logementsRef = database.ref("logements");

  // Écoute des données et filtrage
  logementsRef.on("value", (snapshot) => {
    const logementsData = snapshot.val();
    const logementsFiltres = {};

    for (const id in logementsData) {
      if (logementsData[id].prix <= budget) {
        logementsFiltres[id] = logementsData[id];
      }
    }

    afficherResultats(logementsFiltres);
  });
});
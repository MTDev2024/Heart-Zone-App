// ========================================
// 2. FICHIER: src/utils/heartRateCalculator.js
// ========================================
/**
 * Utilitaires de calcul pour la fréquence cardiaque
 *
 * GREEN CODE: Fonctions pures (pas d'effets de bord)
 * qui peuvent être facilement mises en cache.
 */

/**
 * Calcule la zone cardiaque en fonction du BPM
 *
 * ACCESSIBILITÉ: Retourne toujours un objet complet
 * avec des informations contextuelles pour les lecteurs d'écran.
 *
 * @param {number} heartRate - Fréquence cardiaque en BPM
 * @param {Array} zones - Configuration des zones (optionnel)
 * @returns {Object|null} Zone active ou null si hors limites
 *
 * @example
 * const zone = calculateCurrentZone(145, HEART_RATE_ZONES);
 * // Retourne { id: 3, name: 'Tempo', ... }
 */
export const calculateCurrentZone = (heartRate, zones = HEART_RATE_ZONES) => {
  // Validation des entrées (defensive programming)
  if (typeof heartRate !== "number" || heartRate < 40 || heartRate > 220) {
    console.warn(`FC invalide reçue: ${heartRate}`);
    return null;
  }

  // Recherche de la zone correspondante
  // GREEN CODE: Utilisation de find() au lieu d'une boucle for
  return (
    zones.find(
      (zone) => heartRate >= zone.minBpm && heartRate <= zone.maxBpm
    ) || null
  );
};

/**
 * Calcule la FC maximale théorique selon l'âge
 *
 * Utilise la formule classique: 220 - âge
 *
 * @param {number} age - Âge en années
 * @returns {number} FC max théorique en BPM
 *
 * @example
 * const maxHR = calculateMaxHeartRate(30); // 190 BPM
 */
export const calculateMaxHeartRate = (age) => {
  if (typeof age !== "number" || age < 10 || age > 100) {
    throw new Error("Âge invalide. Doit être entre 10 et 100 ans.");
  }

  return 220 - age;
};

/**
 * Calcule les zones personnalisées selon FC max et repos
 *
 * Utilise la méthode de Karvonen pour plus de précision
 *
 * @param {number} maxHeartRate - FC maximale
 * @param {number} restingHeartRate - FC au repos
 * @returns {Array} Zones personnalisées
 */
export const calculatePersonalizedZones = (maxHeartRate, restingHeartRate) => {
  const reserve = maxHeartRate - restingHeartRate;

  return HEART_RATE_ZONES.map((zone) => ({
    ...zone,
    // Méthode Karvonen: (FC_max - FC_repos) × %intensité + FC_repos
    minBpm: Math.round(reserve * (zone.minBpm / 200) + restingHeartRate),
    maxBpm: Math.round(reserve * (zone.maxBpm / 200) + restingHeartRate),
    isPersonalized: true,
  }));
};

/**
 * Formate le temps en minutes:secondes
 *
 * ACCESSIBILITÉ: Format lisible pour les lecteurs d'écran
 *
 * @param {number} seconds - Temps en secondes
 * @returns {string} Temps formaté (ex: "12:05")
 */
export const formatTime = (seconds) => {
  if (typeof seconds !== "number" || seconds < 0) {
    return "00:00";
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  // Padding avec zéros pour toujours avoir 2 chiffres
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

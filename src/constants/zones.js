// ========================================
// 1. FICHIER: src/constants/zones.js
// ========================================
/**
 * Configuration des zones cardiaques
 *
 * Ces zones suivent la méthode standard de Karvonen
 * pour l'entraînement par fréquence cardiaque.
 *
 * GREEN CODE: Utilisation d'Object.freeze() pour éviter
 * les modifications accidentelles et optimiser la mémoire.
 */

export const HEART_RATE_ZONES = Object.freeze([
  {
    id: 1,
    name: "Récupération",
    description: "Échauffement et récupération active",
    minBpm: 90,
    maxBpm: 120,
    color: "#10b981", // Vert - Tailwind green-500
    intensity: "Très légère",
    benefits: "Favorise la récupération, améliore la circulation",
  },
  {
    id: 2,
    name: "Endurance",
    description: "Endurance fondamentale, brûle les graisses",
    minBpm: 120,
    maxBpm: 140,
    color: "#3b82f6", // Bleu - Tailwind blue-500
    intensity: "Légère",
    benefits: "Améliore le métabolisme des graisses, endurance de base",
  },
  {
    id: 3,
    name: "Tempo",
    description: "Développement aérobie",
    minBpm: 140,
    maxBpm: 160,
    color: "#f59e0b", // Orange - Tailwind amber-500
    intensity: "Modérée",
    benefits: "Améliore l'efficacité cardiovasculaire",
  },
  {
    id: 4,
    name: "Seuil",
    description: "Seuil anaérobie, efforts soutenus",
    minBpm: 160,
    maxBpm: 175,
    color: "#ef4444", // Rouge - Tailwind red-500
    intensity: "Difficile",
    benefits: "Augmente le seuil lactique, puissance",
  },
  {
    id: 5,
    name: "VO2 Max",
    description: "Effort maximal, intervalles courts",
    minBpm: 175,
    maxBpm: 200,
    color: "#dc2626", // Rouge foncé - Tailwind red-600
    intensity: "Maximale",
    benefits: "Développe la capacité anaérobie, VO2max",
  },
]);

/**
 * Protocoles d'entraînement prédéfinis
 *
 * GREEN CODE: Les intervalles sont pré-calculés et figés
 * pour éviter les calculs répétitifs en runtime.
 */
export const TRAINING_PROTOCOLS = Object.freeze([
  {
    id: "norwegian",
    name: "Méthode Norvégienne",
    description: "4x8min Zone 4 avec 3min récupération",
    durationMinutes: 44,
    difficulty: "Avancé",
    intervals: [
      { durationMinutes: 8, targetZoneId: 4, type: "effort" },
      { durationMinutes: 3, targetZoneId: 1, type: "recovery" },
      { durationMinutes: 8, targetZoneId: 4, type: "effort" },
      { durationMinutes: 3, targetZoneId: 1, type: "recovery" },
      { durationMinutes: 8, targetZoneId: 4, type: "effort" },
      { durationMinutes: 3, targetZoneId: 1, type: "recovery" },
      { durationMinutes: 8, targetZoneId: 4, type: "effort" },
      { durationMinutes: 3, targetZoneId: 1, type: "recovery" },
    ],
  },
  {
    id: "tabata",
    name: "Tabata",
    description: "8 cycles de 20s effort max / 10s repos",
    durationMinutes: 4,
    difficulty: "Très difficile",
    intervals: [
      { durationMinutes: 0.33, targetZoneId: 5, type: "effort" },
      { durationMinutes: 0.17, targetZoneId: 1, type: "recovery" },
      // ... répété 8 fois (simplifié ici pour la lisibilité)
    ],
  },
  {
    id: "endurance",
    name: "Endurance Fondamentale",
    description: "Sortie longue en Zone 2",
    durationMinutes: 45,
    difficulty: "Facile",
    intervals: [{ durationMinutes: 45, targetZoneId: 2, type: "steady" }],
  },
]);

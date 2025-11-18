// ========================================
// 3. FICHIER: src/services/BluetoothService.js
// ========================================
/**
 * Service de gestion Bluetooth Low Energy
 *
 * Gère la connexion, découverte et communication avec le bracelet LED
 *
 * BONNES PRATIQUES:
 * - Singleton pattern pour éviter les connexions multiples
 * - Gestion des erreurs robuste
 * - Reconnexion automatique
 * - Nettoyage des ressources (cleanup)
 *
 * GREEN CODE:
 * - Déconnexion automatique après inactivité
 * - Arrêt du scan dès qu'un appareil est trouvé
 */

import { BleManager } from "react-native-ble-plx";

// UUIDs du service et caractéristiques Bluetooth
// Ces valeurs doivent correspondre à celles de l'ESP32
const SERVICE_UUID = "4fafc201-1fb5-459e-8fcc-c5c9c331914b";
const HEART_RATE_CHARACTERISTIC_UUID = "beb5483e-36e1-4688-b7f5-ea07361b26a8";
const ZONE_CONFIG_CHARACTERISTIC_UUID = "beb5483e-36e1-4688-b7f5-ea07361b26a9";

class BluetoothService {
  constructor() {
    // Singleton: une seule instance du manager
    this.manager = new BleManager();
    this.connectedDevice = null;
    this.isScanning = false;

    // GREEN CODE: Timeout pour économiser la batterie
    this.inactivityTimeout = null;
    this.INACTIVITY_LIMIT_MS = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Initialise le Bluetooth et vérifie les permissions
   *
   * ACCESSIBILITÉ: Messages d'erreur clairs et explicites
   *
   * @returns {Promise<boolean>} true si initialisé correctement
   */
  async initialize() {
    try {
      const state = await this.manager.state();

      if (state !== "PoweredOn") {
        throw new Error(
          "Bluetooth désactivé. Veuillez l'activer dans les paramètres."
        );
      }

      console.log("✅ Bluetooth initialisé avec succès");
      return true;
    } catch (error) {
      console.error("❌ Erreur initialisation Bluetooth:", error);
      return false;
    }
  }

  /**
   * Scanne les appareils Bluetooth à proximité
   *
   * GREEN CODE: Arrêt automatique du scan après 10 secondes
   * pour économiser la batterie
   *
   * @param {Function} onDeviceFound - Callback appelé pour chaque appareil trouvé
   * @returns {Promise<void>}
   *
   * @example
   * await bluetoothService.scanForDevices((device) => {
   *   console.log('Trouvé:', device.name);
   * });
   */
  async scanForDevices(onDeviceFound) {
    if (this.isScanning) {
      console.warn("⚠️ Scan déjà en cours");
      return;
    }

    this.isScanning = true;
    console.log("🔍 Début du scan Bluetooth...");

    // Timeout de sécurité: arrêter le scan après 10s
    const scanTimeout = setTimeout(() => {
      this.stopScan();
      console.log("⏱️ Scan arrêté après timeout");
    }, 10000);

    try {
      this.manager.startDeviceScan(
        null, // Scan tous les services
        null, // Pas d'options spécifiques
        (error, device) => {
          if (error) {
            console.error("❌ Erreur pendant le scan:", error);
            clearTimeout(scanTimeout);
            this.stopScan();
            return;
          }

          // Filtrer uniquement les appareils avec un nom
          // GREEN CODE: Évite de traiter des appareils inutiles
          if (device && device.name) {
            onDeviceFound(device);

            // Si c'est notre bracelet, arrêter le scan immédiatement
            if (device.name.includes("HeartZone")) {
              console.log("✅ Bracelet HeartZone trouvé !");
              clearTimeout(scanTimeout);
              this.stopScan();
            }
          }
        }
      );
    } catch (error) {
      console.error("❌ Erreur lors du scan:", error);
      clearTimeout(scanTimeout);
      this.stopScan();
    }
  }

  /**
   * Arrête le scan Bluetooth
   */
  stopScan() {
    if (this.isScanning) {
      this.manager.stopDeviceScan();
      this.isScanning = false;
      console.log("🛑 Scan arrêté");
    }
  }

  /**
   * Se connecte à un appareil Bluetooth
   *
   * BONNES PRATIQUES:
   * - Vérification de l'état avant connexion
   * - Découverte des services et caractéristiques
   * - Gestion des déconnexions inattendues
   *
   * @param {Object} device - Appareil BLE à connecter
   * @param {Function} onDisconnect - Callback appelé en cas de déconnexion
   * @returns {Promise<boolean>} true si connecté
   */
  async connectToDevice(device, onDisconnect) {
    try {
      console.log(`🔗 Connexion à ${device.name}...`);

      // Se connecter à l'appareil
      this.connectedDevice = await device.connect();

      // Découvrir les services et caractéristiques
      await this.connectedDevice.discoverAllServicesAndCharacteristics();

      // Écouter les déconnexions
      this.manager.onDeviceDisconnected(
        device.id,
        (error, disconnectedDevice) => {
          console.log("🔌 Appareil déconnecté");
          this.connectedDevice = null;

          if (onDisconnect) {
            onDisconnect(error);
          }
        }
      );

      console.log("✅ Connecté avec succès");

      // GREEN CODE: Démarrer le timer d'inactivité
      this.resetInactivityTimer();

      return true;
    } catch (error) {
      console.error("❌ Erreur de connexion:", error);
      this.connectedDevice = null;
      return false;
    }
  }

  /**
   * S'abonne aux notifications de fréquence cardiaque
   *
   * @param {Function} onHeartRateReceived - Callback avec la FC reçue
   * @returns {Promise<void>}
   *
   * @example
   * await bluetoothService.subscribeToHeartRate((heartRate) => {
   *   console.log('FC:', heartRate);
   * });
   */
  async subscribeToHeartRate(onHeartRateReceived) {
    if (!this.connectedDevice) {
      throw new Error("Aucun appareil connecté");
    }

    try {
      // S'abonner aux notifications de la caractéristique
      this.connectedDevice.monitorCharacteristicForService(
        SERVICE_UUID,
        HEART_RATE_CHARACTERISTIC_UUID,
        (error, characteristic) => {
          if (error) {
            console.error("❌ Erreur lecture FC:", error);
            return;
          }

          if (characteristic?.value) {
            // Décoder la valeur Base64 en entier
            const heartRate = this.decodeHeartRate(characteristic.value);

            // GREEN CODE: Reset timer à chaque donnée reçue
            this.resetInactivityTimer();

            // Validation de la FC (entre 40 et 220 BPM)
            if (heartRate >= 40 && heartRate <= 220) {
              onHeartRateReceived(heartRate);
            } else {
              console.warn(`⚠️ FC invalide reçue: ${heartRate}`);
            }
          }
        }
      );

      console.log("✅ Abonné aux notifications FC");
    } catch (error) {
      console.error("❌ Erreur abonnement FC:", error);
    }
  }

  /**
   * Envoie la configuration des zones au bracelet
   *
   * @param {Array} zones - Configuration des zones
   * @returns {Promise<boolean>}
   */
  async sendZoneConfiguration(zones) {
    if (!this.connectedDevice) {
      throw new Error("Aucun appareil connecté");
    }

    try {
      // Convertir les zones en JSON puis en Base64
      const zonesJson = JSON.stringify(
        zones.map((z) => ({
          min: z.minBpm,
          max: z.maxBpm,
          color: z.color,
        }))
      );

      const base64Data = Buffer.from(zonesJson).toString("base64");

      // Écrire dans la caractéristique
      await this.connectedDevice.writeCharacteristicWithResponseForService(
        SERVICE_UUID,
        ZONE_CONFIG_CHARACTERISTIC_UUID,
        base64Data
      );

      console.log("✅ Configuration envoyée au bracelet");
      return true;
    } catch (error) {
      console.error("❌ Erreur envoi config:", error);
      return false;
    }
  }

  /**
   * Décode une valeur de FC depuis Base64
   *
   * @private
   * @param {string} base64Value - Valeur encodée en Base64
   * @returns {number} FC en BPM
   */
  decodeHeartRate(base64Value) {
    try {
      const buffer = Buffer.from(base64Value, "base64");
      return buffer.readUInt8(0); // Lire le premier byte
    } catch (error) {
      console.error("❌ Erreur décodage FC:", error);
      return 0;
    }
  }

  /**
   * GREEN CODE: Reset le timer d'inactivité
   * Déconnecte automatiquement après 5 minutes sans activité
   *
   * @private
   */
  resetInactivityTimer() {
    // Effacer l'ancien timer
    if (this.inactivityTimeout) {
      clearTimeout(this.inactivityTimeout);
    }

    // Créer un nouveau timer
    this.inactivityTimeout = setTimeout(() => {
      console.log("⏱️ Déconnexion automatique (inactivité)");
      this.disconnect();
    }, this.INACTIVITY_LIMIT_MS);
  }

  /**
   * Déconnecte l'appareil actuel
   *
   * GREEN CODE: Nettoyage complet des ressources
   */
  async disconnect() {
    if (this.connectedDevice) {
      try {
        await this.connectedDevice.cancelConnection();
        console.log("✅ Déconnexion réussie");
      } catch (error) {
        console.error("❌ Erreur déconnexion:", error);
      } finally {
        this.connectedDevice = null;

        // Nettoyer le timer
        if (this.inactivityTimeout) {
          clearTimeout(this.inactivityTimeout);
          this.inactivityTimeout = null;
        }
      }
    }
  }

  /**
   * Nettoie toutes les ressources
   * À appeler quand l'app est fermée
   *
   * GREEN CODE: Libération mémoire et déconnexion Bluetooth
   */
  async cleanup() {
    this.stopScan();
    await this.disconnect();
    this.manager.destroy();
    console.log("🧹 Ressources Bluetooth nettoyées");
  }
}

// Export singleton
export default new BluetoothService();

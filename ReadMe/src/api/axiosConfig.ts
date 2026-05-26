/**
 * axiosConfig.ts
 *
 * Instance Axios centralisée avec résolution dynamique de l'IP.
 *
 * Stratégie de résolution (ordre de priorité) :
 *
 *  1. EXPO_PUBLIC_API_URL définie et non-placeholder
 *     → Dev distant (ngrok/tunnel) OU production
 *     → Ex : https://abc123.ngrok-free.app/api
 *
 *  2. Constants.expoConfig.hostUri disponible (Metro en cours)
 *     → Dev local, PC et téléphone sur le même réseau Wi-Fi
 *     → Ex : http://192.168.1.220:3000/api (port Metro 8081 → port API 3000)
 *
 *  3. Fallback http://10.0.2.2:3000/api
 *     → Émulateur Android AVD (10.0.2.2 = loopback du PC hôte)
 */

import axios, { AxiosError, AxiosResponse } from "axios";
import Constants from "expo-constants";

// ─── Résolution de la baseURL ────────────────────────────────────────────────

// Tunnels qui nécessitent le header anti-interstitiel
const TUNNEL_PATTERNS = ["ngrok-free.app", "ngrok.io", "ngrok.app"];

export function isTunnelUrl(url: string): boolean {
  return TUNNEL_PATTERNS.some((p) => url.includes(p));
}

function resolveBaseUrl(): string {
  // ── Priorité 1 : variable d'environnement explicite ──────────────────────
  // Couvre deux cas :
  //   a) Dev distant  → EXPO_PUBLIC_API_URL=https://abc123.ngrok-free.app/api
  //   b) Production   → EXPO_PUBLIC_API_URL=https://api.monapp.com/api
  // La valeur placeholder "TO_BE_DEFINED" est ignorée intentionnellement.
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl && !envUrl.includes("TO_BE_DEFINED")) {
    console.log(`[axiosConfig] baseURL depuis EXPO_PUBLIC_API_URL → ${envUrl}`);
    return envUrl;
  }

  // ── Priorité 2 : IP résolue via Metro (dev local, même réseau Wi-Fi) ─────
  // hostUri ressemble à "192.168.1.220:8081"
  const hostUri =
    Constants.expoConfig?.hostUri ?? Constants.manifest?.debuggerHost;

  if (hostUri) {
    const host = hostUri.split(":")[0];
    const baseUrl = `http://${host}:3000/api`;
    console.log(`[axiosConfig] baseURL résolue dynamiquement → ${baseUrl}`);
    return baseUrl;
  }

  // ── Priorité 3 : fallback émulateur Android AVD ───────────────────────────
  console.warn(
    "[axiosConfig] hostUri introuvable, fallback AVD → http://10.0.2.2:3000/api",
  );
  return "http://10.0.2.2:3000/api";
}

// ─── URLs exportées ────────────────────────────────────────────────────────

// URL complète de l'API  → http://192.168.1.220:3000/api
const API_BASE_URL = resolveBaseUrl();

// URL racine du serveur  → http://192.168.1.220:3000
// Utilisée pour les fichiers statiques (couvertures, EPUBs) servis par Express.
// En prod, EXPO_PUBLIC_API_URL doit inclure "/api" pour que ce dérivé soit correct.
export const SERVER_BASE_URL = API_BASE_URL.replace(/\/api$/, "");

// ─── Création de l'instance ──────────────────────────────────────────────────

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10_000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    // Désactive la page d'avertissement ngrok pour les requêtes API.
    // Ignoré par les serveurs non-ngrok (header inconnu = ignoré).
    ...(isTunnelUrl(API_BASE_URL) && {
      "ngrok-skip-browser-warning": "true",
    }),
  },
});

// ─── Intercepteur de réponse (debug Network Error) ──────────────────────────

apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Certains endpoints renvoient HTTP 200 avec { error: true } (ex: 404 métier,
    // échec de création). On les traite comme de vraies erreurs.
    if (response.data?.error === true) {
      const message: string =
        response.data?.message ?? "Le serveur a retourné une erreur métier.";
      console.error(
        `[axiosConfig] ❌ Erreur métier (HTTP 200 + error: true)\n` +
          `  → URL     : ${response.config?.url ?? "inconnue"}\n` +
          `  → Message : ${message}`,
      );
      return Promise.reject(new Error(message));
    }
    return response;
  },
  (error: AxiosError) => {
    // Erreur réseau : pas de réponse du serveur
    if (!error.response) {
      const attemptedUrl = error.config
        ? `${error.config.baseURL ?? ""}${error.config.url ?? ""}`
        : "URL inconnue";

      console.error(
        `[axiosConfig] ❌ Network Error\n` +
          `  → URL tentée   : ${attemptedUrl}\n` +
          `  → Message      : ${error.message}\n` +
          `  → Vérifiez que le backend tourne et que le pare-feu autorise le port 3000.`,
      );
    } else {
      // Erreur HTTP (4xx / 5xx)
      console.error(
        `[axiosConfig] ❌ Erreur HTTP ${error.response.status}\n` +
          `  → URL : ${error.config?.url ?? "inconnue"}`,
      );
    }

    return Promise.reject(error);
  },
);

/**
 * uploadService.ts
 *
 * Upload de fichiers EPUB vers le backend Express/Multer.
 *
 * ─── Pourquoi XMLHttpRequest et pas Axios ? ────────────────────────────────
 *
 * Axios v1.x détecte FormData via `[Symbol.toStringTag]`.
 * React Native / Hermes n'expose PAS ce symbole sur son implémentation de
 * FormData → Axios ne le reconnaît pas, tente de le sérialiser autrement
 * → la requête XHR est construite incorrectement → Network Error immédiat.
 *
 * XMLHttpRequest natif de React Native :
 *  ✅ Détecte nativement un FormData comme corps de requête
 *  ✅ Génère automatiquement Content-Type: multipart/form-data; boundary=xxx
 *  ✅ Supporte onprogress pour la barre d'avancement
 *  ✅ Timeout configurable via xhr.timeout
 *
 * On garde Axios (apiClient) pour toutes les autres requêtes JSON.
 */

import { apiClient } from "./axiosConfig";
import { ENDPOINTS } from "./endpoints";
import type { Book } from "../types/models";
import { resolveAndroidContentUri } from "../utils/fileHelper";

// ─── Types publics ────────────────────────────────────────────────────────────

export interface UploadResult {
  success: boolean;
  book?: Book;
  error?: UploadError;
}

export interface UploadError {
  type: "network" | "file" | "server" | "unknown";
  message: string;
}

export type ProgressCallback = (percent: number) => void;

// ─── Fonction principale ──────────────────────────────────────────────────────

export async function uploadEpub(
  asset: { uri: string; name: string; mimeType: string },
  metadata: { author_name?: string; category_name?: string } = {},
  onProgress?: ProgressCallback,
): Promise<UploadResult> {
  try {
    // 1. Résoudre l'URI (content:// → file:// si nécessaire)
    const resolved = await resolveAndroidContentUri(
      asset.uri,
      asset.name,
      asset.mimeType,
    );

    console.log(`[uploadService] URI résolu : ${resolved.uri}`);

    // 2. Construire le FormData
    //    Structure exacte requise par React Native pour les fichiers :
    //    { uri, name, type } — pas un Blob, pas un File JS.
    const formData = new FormData();

    formData.append("epub", {
      uri: resolved.uri,
      name: resolved.name,
      type: resolved.mimeType,
    } as any);

    if (metadata.author_name) {
      formData.append("author_name", metadata.author_name);
    }
    if (metadata.category_name) {
      formData.append("category_name", metadata.category_name);
    }

    // 3. Construire l'URL (même IP dynamique qu'apiClient)
    const uploadUrl = `${apiClient.defaults.baseURL}${ENDPOINTS.BOOK_CREATE}`;
    console.log(`[uploadService] POST → ${uploadUrl}`);

    // 4. Envoyer via XMLHttpRequest natif (fiable pour FormData sur Hermes)
    const data = await sendWithXHR(uploadUrl, formData, onProgress);

    if (data.error) {
      return {
        success: false,
        error: {
          type: "server",
          message: data.message ?? "Le serveur a retourné une erreur.",
        },
      };
    }

    return { success: true, book: data.result };
  } catch (err: unknown) {
    return { success: false, error: classifyError(err) };
  }
}

// ─── Envoi via XMLHttpRequest ─────────────────────────────────────────────────

interface ApiResponse {
  error: boolean;
  result?: Book;
  message?: string;
}

function sendWithXHR(
  url: string,
  body: FormData,
  onProgress?: ProgressCallback,
): Promise<ApiResponse> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.open("POST", url);

    // Accept JSON en retour
    xhr.setRequestHeader("Accept", "application/json");

    // ⚠️  NE PAS définir Content-Type ici.
    // React Native détecte le FormData et génère automatiquement :
    //   Content-Type: multipart/form-data; boundary=<unique>
    // Si on le force, le boundary est absent → multer crashe côté serveur.

    // Timeout 2 minutes (le script Python peut prendre du temps)
    xhr.timeout = 120_000;

    // Suivi de progression (optionnel)
    if (onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          onProgress(Math.round((event.loaded / event.total) * 100));
        }
      };
    }

    xhr.onload = () => {
      console.log(`[uploadService] Réponse HTTP ${xhr.status}`);
      try {
        const parsed: ApiResponse = JSON.parse(xhr.responseText);
        resolve(parsed);
      } catch {
        reject(new Error(`Réponse non-JSON du serveur (status ${xhr.status})`));
      }
    };

    xhr.onerror = () => {
      console.error(`[uploadService] XHR onerror — URL : ${url}`);
      reject(new Error("Network Error"));
    };

    xhr.ontimeout = () => {
      console.error("[uploadService] XHR timeout après 120s");
      reject(new Error("L'upload a dépassé le délai de 2 minutes."));
    };

    xhr.send(body);
  });
}

// ─── Classification des erreurs ───────────────────────────────────────────────

function classifyError(err: unknown): UploadError {
  if (!(err instanceof Error)) {
    return { type: "unknown", message: "Une erreur inattendue est survenue." };
  }

  if (err.message === "Network Error") {
    return {
      type: "network",
      message:
        "Impossible de contacter le serveur. Vérifiez que le backend est lancé et que le port 3000 est accessible.",
    };
  }

  if (err.message.includes("timeout") || err.message.includes("délai")) {
    return {
      type: "network",
      message: err.message,
    };
  }

  if (
    err.message.toLowerCase().includes("copy") ||
    err.message.toLowerCase().includes("fichier")
  ) {
    return {
      type: "file",
      message: "Impossible de lire le fichier sélectionné.",
    };
  }

  return { type: "unknown", message: err.message };
}

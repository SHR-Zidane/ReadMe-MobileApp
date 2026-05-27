import { apiClient, isTunnelUrl } from "./axiosConfig";
import { ENDPOINTS } from "./endpoints";
import type { Book } from "../types/models";
import { resolveAndroidContentUri } from "../utils/fileHelper";

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

export async function uploadEpub(
  asset: { uri: string; name: string; mimeType: string },
  metadata: { author_name?: string; category_name?: string } = {},
  onProgress?: ProgressCallback,
): Promise<UploadResult> {
  try {
    const resolved = await resolveAndroidContentUri(
      asset.uri,
      asset.name,
      asset.mimeType,
    );

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

    const uploadUrl = `${apiClient.defaults.baseURL}${ENDPOINTS.BOOK_CREATE}`;

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

    xhr.setRequestHeader("Accept", "application/json");

    if (isTunnelUrl(url)) {
      xhr.setRequestHeader("ngrok-skip-browser-warning", "true");
    }

    xhr.timeout = 120_000;

    if (onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          onProgress(Math.round((event.loaded / event.total) * 100));
        }
      };
    }

    xhr.onload = () => {
      try {
        const parsed: ApiResponse = JSON.parse(xhr.responseText);
        resolve(parsed);
      } catch {
        reject(new Error(`Réponse non-JSON du serveur (status ${xhr.status})`));
      }
    };

    xhr.onerror = () => {
      reject(new Error("Network Error"));
    };

    xhr.ontimeout = () => {
      reject(new Error("L'upload a dépassé le délai de 2 minutes."));
    };

    xhr.send(body);
  });
}

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

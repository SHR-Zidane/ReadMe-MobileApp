/**
 * useBooks.ts
 *
 * Hook React Query pour récupérer la liste des livres depuis l'API.
 *
 * Utilisation :
 *   const { data, isLoading, isError, error, attemptedUrl } = useBooks();
 */

import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { apiClient } from "../api/axiosConfig";
import { ENDPOINTS } from "../api/endpoints";
import type { Book } from "../types/models";

// L'intercepteur de axiosConfig peut rejeter avec un Error simple (error: true
// métier) ou avec un AxiosError (réseau / HTTP). On utilise le type commun Error.

// ─── Type de la réponse API ───────────────────────────────────────────────────

interface BooksApiResponse {
  error: boolean;
  result: {
    count: number;
    rows: Book[];
  };
}

// ─── Type de retour enrichi du hook ──────────────────────────────────────────

export interface UseBooksResult {
  /** Liste des livres (vide tant que le chargement n'est pas terminé) */
  books: Book[];
  /** Nombre total de livres renvoyés par l'API */
  totalCount: number;
  /** true pendant la première requête */
  isLoading: boolean;
  /** true si la requête a échoué */
  isError: boolean;
  /**
   * L'objet erreur :
   *  - AxiosError  → erreur réseau ou HTTP (4xx/5xx)
   *  - Error       → réponse HTTP 200 avec { error: true } (erreur métier)
   */
  error: Error | null;
  /** URL tentée lors d'un Network Error — pratique pour le debug (AxiosError uniquement) */
  attemptedUrl: string | null;
  /** Relance manuellement la requête (ex: bouton "Réessayer") */
  refetch: () => void;
}

// ─── Clé de cache React Query ────────────────────────────────────────────────

export const BOOKS_QUERY_KEY = ["books"] as const;

// ─── Fetcher ─────────────────────────────────────────────────────────────────

async function fetchBooks(): Promise<BooksApiResponse> {
  const response = await apiClient.get<BooksApiResponse>(ENDPOINTS.BOOKS);
  return response.data;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useBooks(): UseBooksResult {
  const query = useQuery<BooksApiResponse, Error>({
    queryKey: BOOKS_QUERY_KEY,
    queryFn: fetchBooks,
    // Pas de refetch automatique en arrière-plan pour une app livre
    refetchOnWindowFocus: false,
    // 5 minutes de stale time : évite des appels réseau inutiles
    staleTime: 5 * 60 * 1000,
    // Nombre de tentatives avant de passer en état d'erreur
    retry: 2,
  });

  // attemptedUrl n'est disponible que pour les AxiosError (erreurs réseau/HTTP).
  // Les erreurs métier (Error simple) n'ont pas de .config.
  const attemptedUrl =
    query.isError && query.error instanceof AxiosError
      ? `${query.error.config?.baseURL ?? ""}${query.error.config?.url ?? ""}`
      : null;

  return {
    books: query.data?.result?.rows ?? [],
    totalCount: query.data?.result?.count ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error ?? null,
    attemptedUrl,
    refetch: query.refetch,
  };
}

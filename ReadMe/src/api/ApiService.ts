/**
 * ApiService.ts
 *
 * Fonctions d'accès à l'API — utilisent l'instance Axios centralisée (axiosConfig).
 * La baseURL et la résolution IP/port sont gérées dans axiosConfig.ts.
 */

import { apiClient } from "./axiosConfig";
import { ENDPOINTS } from "./endpoints";
import type { Book } from "../types/models";

// ─── Types de réponse ─────────────────────────────────────────────────────────

export interface BooksListResponse {
  error: boolean;
  result: {
    count: number;
    rows: Book[];
  };
}

export interface BookResponse {
  error: boolean;
  result: Book;
}

// ─── Requêtes ─────────────────────────────────────────────────────────────────

export const getBooks = async (): Promise<BooksListResponse> => {
  const response = await apiClient.get<BooksListResponse>(ENDPOINTS.BOOKS);
  return response.data;
};

export const getBookById = async (id: number): Promise<BookResponse> => {
  const response = await apiClient.get<BookResponse>(ENDPOINTS.BOOK(id));
  return response.data;
};

export const updateBookProgress = async (
  id: number,
  last_read_page: number,
): Promise<BookResponse> => {
  const response = await apiClient.put<BookResponse>(
    ENDPOINTS.BOOK_UPDATE(id),
    {
      last_read_page,
    },
  );
  return response.data;
};

export const uploadBook = async (formData: FormData): Promise<BookResponse> => {
  const response = await apiClient.post<BookResponse>(
    ENDPOINTS.BOOK_CREATE,
    formData,
  );
  return response.data;
};

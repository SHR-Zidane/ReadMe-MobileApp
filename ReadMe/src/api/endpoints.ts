/**
 * endpoints.ts
 *
 * Centralise toutes les routes de l'API REST.
 * Toutes les URLs sont relatives à la baseURL définie dans axiosConfig.ts.
 */

export const ENDPOINTS = {
  // ── Health-check ──────────────────────────────────────────────────────────
  /** GET /api  →  vérification que le backend répond */
  HEALTH: "/",

  // ── Livres ────────────────────────────────────────────────────────────────
  /** GET /api/books  →  liste paginée de tous les livres */
  BOOKS: "/books",

  /** GET /api/books/:id  →  détail d'un livre */
  BOOK: (id: number): string => `/books/${id}`,

  /** PUT /api/books/:id  →  mise à jour d'un livre (ex: last_read_page) */
  BOOK_UPDATE: (id: number): string => `/books/${id}`,

  /** POST /api/books  →  création / upload d'un nouveau livre */
  BOOK_CREATE: "/books",

  // ── Auteurs ───────────────────────────────────────────────────────────────
  /** GET /api/authors  →  liste des auteurs */
  AUTHORS: "/authors",

  // ── Tags ─────────────────────────────────────────────────────────────────
  /** GET /api/tags  →  liste de tous les tags */
  TAGS: "/tags",

  /** GET|PUT|DELETE /api/tags/:id  →  détail, mise à jour, suppression d'un tag */
  TAG: (id: number): string => `/tags/${id}`,

  /** POST /api/books/:id/tags  →  ajouter un tag à un livre */
  BOOK_TAGS: (bookId: number): string => `/books/${bookId}/tags`,

  /** DELETE /api/books/:id/tags/:tagId  →  retirer un tag d'un livre */
  BOOK_TAG: (bookId: number, tagId: number): string =>
    `/books/${bookId}/tags/${tagId}`,
} as const;

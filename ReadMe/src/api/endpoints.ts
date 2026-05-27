export const ENDPOINTS = {
  HEALTH: "/",
  BOOKS: "/books",
  BOOK: (id: number): string => `/books/${id}`,
  BOOK_UPDATE: (id: number): string => `/books/${id}`,
  BOOK_CREATE: "/books",
  AUTHORS: "/authors",
  TAGS: "/tags",
  TAG: (id: number): string => `/tags/${id}`,
  BOOK_TAGS: (bookId: number): string => `/books/${bookId}/tags`,
  BOOK_TAG: (bookId: number, tagId: number): string =>
    `/books/${bookId}/tags/${tagId}`,
} as const;

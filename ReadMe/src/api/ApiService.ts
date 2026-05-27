import { apiClient } from "./axiosConfig";
import { ENDPOINTS } from "./endpoints";
import type { Book } from "../types/models";

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

export const getBooks = async (): Promise<BooksListResponse> => {
  const response = await apiClient.get<BooksListResponse>(ENDPOINTS.BOOKS);
  return response.data;
};

export const getBookById = async (id: number): Promise<BookResponse> => {
  const response = await apiClient.get<BookResponse>(ENDPOINTS.BOOK(id));
  return response.data;
};

export const deleteBook = async (id: number): Promise<void> => {
  await apiClient.delete(ENDPOINTS.BOOK(id));
};

export const updateBookProgress = async (
  id: number,
  last_read_page: number,
  last_read_cfi?: string,
): Promise<BookResponse> => {
  const response = await apiClient.put<BookResponse>(
    ENDPOINTS.BOOK_UPDATE(id),
    { last_read_page, last_read_cfi },
  );
  return response.data;
};

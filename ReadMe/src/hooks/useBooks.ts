import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { apiClient } from "../api/axiosConfig";
import { ENDPOINTS } from "../api/endpoints";
import type { Book } from "../types/models";

interface BooksApiResponse {
  error: boolean;
  result: {
    count: number;
    rows: Book[];
  };
}

export interface UseBooksResult {
  books: Book[];
  totalCount: number;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  attemptedUrl: string | null;
  refetch: () => void;
}

export const BOOKS_QUERY_KEY = ["books"] as const;

async function fetchBooks(): Promise<BooksApiResponse> {
  const response = await apiClient.get<BooksApiResponse>(ENDPOINTS.BOOKS);
  return response.data;
}

export function useBooks(): UseBooksResult {
  const query = useQuery<BooksApiResponse, Error>({
    queryKey: BOOKS_QUERY_KEY,
    queryFn: fetchBooks,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

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

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../api/axiosConfig";
import { ENDPOINTS } from "../api/endpoints";
import { BOOKS_QUERY_KEY } from "./useBooks";
import type { Tag } from "../types/models";

interface TagsListResponse {
  error: boolean;
  result: Tag[];
}

interface TagSingleResponse {
  error: boolean;
  result: Tag;
}

export const TAGS_QUERY_KEY = ["tags"] as const;

export interface UseTagsResult {
  tags: Tag[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useTags(): UseTagsResult {
  const query = useQuery<TagsListResponse, Error>({
    queryKey: TAGS_QUERY_KEY,
    queryFn: async () => {
      const response = await apiClient.get<TagsListResponse>(ENDPOINTS.TAGS);
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  return {
    tags: query.data?.result ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error ?? null,
    refetch: query.refetch,
  };
}

export interface CreateTagVariables {
  name: string;
  color: string;
}

export function useCreateTag() {
  const queryClient = useQueryClient();

  return useMutation<Tag, Error, CreateTagVariables>({
    mutationFn: async (variables) => {
      const response = await apiClient.post<TagSingleResponse>(
        ENDPOINTS.TAGS,
        variables,
      );
      return response.data.result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TAGS_QUERY_KEY });
    },
  });
}

export interface UpdateTagVariables {
  id: number;
  name?: string;
  color?: string;
  bookId?: number;
}

export function useUpdateTag() {
  const queryClient = useQueryClient();

  return useMutation<Tag, Error, UpdateTagVariables>({
    mutationFn: async ({ id, name, color }) => {
      const response = await apiClient.put<TagSingleResponse>(
        ENDPOINTS.TAG(id),
        { name, color },
      );
      return response.data.result;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: TAGS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: BOOKS_QUERY_KEY });
      if (variables.bookId !== undefined) {
        queryClient.invalidateQueries({
          queryKey: ["book", variables.bookId],
        });
      }
    },
  });
}

export function useDeleteTag() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, number>({
    mutationFn: async (id) => {
      await apiClient.delete(ENDPOINTS.TAG(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TAGS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: BOOKS_QUERY_KEY });
    },
  });
}

export interface AddTagToBookVariables {
  tagId: number;
}

export function useAddTagToBook(bookId: number) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, AddTagToBookVariables>({
    mutationFn: async ({ tagId }) => {
      await apiClient.post(ENDPOINTS.BOOK_TAGS(bookId), { tagId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["book", bookId] });
      queryClient.invalidateQueries({ queryKey: BOOKS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: TAGS_QUERY_KEY });
    },
  });
}

export function useRemoveTagFromBook(bookId: number) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, number>({
    mutationFn: async (tagId) => {
      await apiClient.delete(ENDPOINTS.BOOK_TAG(bookId, tagId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["book", bookId] });
      queryClient.invalidateQueries({ queryKey: BOOKS_QUERY_KEY });
    },
  });
}

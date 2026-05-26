import axios from 'axios';
import { Book } from '../types/models';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api'; 

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

export const getBooks = async (): Promise<{ error: boolean, result: { count: number, rows: Book[] } }> => {
  const response = await apiClient.get('/books');
  return response.data;
};

export const getBookById = async (id: number): Promise<{ error: boolean, result: Book }> => {
  const response = await apiClient.get(`/books/${id}`);
  return response.data;
};

export const updateBookProgress = async (id: number, last_read_page: number): Promise<{ error: boolean, result: Book }> => {
  const response = await apiClient.put(`/books/${id}`, { last_read_page });
  return response.data;
};

export const uploadBook = async (formData: FormData): Promise<{ error: boolean, result: Book }> => {
  const response = await apiClient.post('/books', formData);
  return response.data;
};

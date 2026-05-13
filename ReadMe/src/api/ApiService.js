import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000'; // Change this to your API base URL

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Function to get all reviews
export const getReviews = async () => {
  const response = await apiClient.get('/reviews');
  return response.data;
};

// Function to create a review
export const createReview = async (reviewData) => {
  const response = await apiClient.post('/reviews', reviewData);
  return response.data;
};

// Function to get a single review by ID
export const getReview = async (id) => {
  const response = await apiClient.get(`/reviews/${id}`);
  return response.data;
};

// Function to update a review
export const updateReview = async (id, reviewData) => {
  const response = await apiClient.put(`/reviews/${id}`, reviewData);
  return response.data;
};

// Function to delete a review
export const deleteReview = async (id) => {
  const response = await apiClient.delete(`/reviews/${id}`);
  return response.data;
};

// Function to get all books (if needed)
export const getBooks = async () => {
  const response = await apiClient.get('/books');
  return response.data;
};

// Function to get a single book by ID (if needed)
export const getBook = async (id) => {
  const response = await apiClient.get(`/books/${id}`);
  return response.data;
};

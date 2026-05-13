import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Button,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import apiService from '../api/ApiService';

const BookDetailScreen = () => {
  const route = useRoute();
  const { bookId } = route.params;
  const [book, setBook] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBookDetails = async () => {
      try {
        const bookResponse = await apiService.getBook(bookId);
        const reviewsResponse = await apiService.getReviews(bookId);
        setBook(bookResponse);
        setReviews(reviewsResponse);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBookDetails();
  }, [bookId]);

  if (loading) {
    return (
      <ActivityIndicator
        size="large"
        color="#0000ff"
      />
    );
  }

  if (error) {
    return (
      <View>
        <Text>Error: {error}</Text>
      </View>
    );
  }

  return (
    <ScrollView>
      {book && (
        <View>
          <Text>{book.title}</Text>
          <Text>{book.author}</Text>
          <Text>{book.description}</Text>
        </View>
      )}
    </ScrollView>
  );
};

export default BookDetailScreen;

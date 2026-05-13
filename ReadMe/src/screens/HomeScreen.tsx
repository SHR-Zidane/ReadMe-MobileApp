import React, { useEffect, useState } from 'react';
import { View, FlatList, Text, StyleSheet } from 'react-native';
import apiService from '../api/ApiService';
import BookCard from '../components/BookCard';
import LoadingIndicator from '../components/LoadingIndicator';

const HomeScreen = () => {
    const [books, setBooks] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const booksResponse = await apiService.getBooks();
                const reviewsResponse = await apiService.getReviews();
                setBooks(booksResponse);
                setReviews(reviewsResponse);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return <LoadingIndicator />;
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={books}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => <BookCard book={item} />}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    reviewList: {
        marginTop: 16,
    },
});

export default HomeScreen;
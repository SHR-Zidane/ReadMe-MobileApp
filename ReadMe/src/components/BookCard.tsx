import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

interface BookCardProps {
  title: string;
  author: string;
  coverImage: string;
}

const BookCard: React.FC<BookCardProps> = ({ title, author, coverImage }) => {
  return (
    <View style={styles.card}>
      <Image
        source={{ uri: coverImage }}
        style={styles.coverImage}
      />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.author}>{author}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    margin: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  coverImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
  },
  author: {
    fontSize: 14,
    color: '#555',
  },
});

export default BookCard;

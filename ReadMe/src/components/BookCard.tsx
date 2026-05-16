import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Book } from '../types/models'; // Importe ton modèle

interface BookCardProps {
  book: Book; // On attend maintenant l'objet book complet
}

const BookCard: React.FC<BookCardProps> = ({ book }) => {
  return (
    <View style={styles.card}>
      <Image
        // Attention : vérifie si dans ta DB c'est coverImage ou cover_image
        source={{ uri: book.cover_image }} 
        style={styles.coverImage}
      />
      <Text style={styles.title}>{book.title}</Text>
      {/* On affiche le nom de l'auteur s'il est chargé ou une chaîne par défaut */}
      <Text style={styles.author}>
      {book.author 
        ? `${book.author.first_name} ${book.author.last_name}` 
        : 'Auteur inconnu'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginVertical: 8, // Un peu plus propre pour l'espacement
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  coverImage: {
    width: '100%',
    height: 200, // Augmenté un peu pour le style liseuse
    borderRadius: 8,
    resizeMode: 'cover',
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
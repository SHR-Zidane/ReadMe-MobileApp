import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as DocumentPicker from 'expo-document-picker';
import {
  FlatList,
  Image,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { fetchData } from '../ApiService';

const defaultCover = 'https://via.placeholder.com/120x160.png?text=EPUB';

export default function App() {
  const [books, setBooks] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadBooks();
  }, []);

  /**
   * Charge les livres depuis l'API Rust et les trie par added_date décroissant.
   */
  const loadBooks = async () => {
    try {
      const data = await fetchData();
      // Tri par added_date si disponible, sinon par createdAt
      const sortedBooks = data.sort((a, b) => new Date(b.added_date || b.createdAt) - new Date(a.added_date || a.createdAt));
      setBooks(sortedBooks);
    } catch (err) {
      setError(err.message || 'Erreur lors du chargement des livres');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Gère l'import d'un fichier EPUB (pour l'instant, simule l'ajout).
   * TODO: Intégrer avec l'API pour uploader le fichier.
   */
  const handleImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/epub+zip',
      });
      if (result.type === 'success') {
        // Ici, on pourrait envoyer le fichier à l'API Rust pour traitement
        alert('Fichier sélectionné : ' + result.name + '. Upload à implémenter.');
      }
    } catch (err) {
      alert('Erreur lors de l\'import : ' + err.message);
    }
  };

  /**
   * Affiche la couverture du livre ou une image par défaut.
   */
  const displayCover = (book) => book.cover || defaultCover;

  /**
   * Tronque le texte si trop long.
   */
  const truncateText = (text, length = 88) =>
    typeof text === 'string' && text.length > length ? `${text.slice(0, length)}…` : text;

  /**
   * Rend un élément de la liste des livres.
   */
  const renderBookItem = ({ item }) => (
    <Pressable style={styles.bookCard} onPress={() => setSelectedBook(item)}>
      <Image source={{ uri: displayCover(item) }} style={styles.cover} />
      <View style={styles.bookInfo}>
        <Text style={styles.bookTitle}>{item.title}</Text>
        <Text style={styles.bookAuthor}>{item.author}</Text>
        <Text style={styles.bookExcerpt}>{truncateText(item.description || 'Aucune description')}</Text>
        {item.added_date && (
          <Text style={styles.bookDate}>Ajouté le {new Date(item.added_date).toLocaleDateString()}</Text>
        )}
      </View>
    </Pressable>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.message}>Chargement de la bibliothèque...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={[styles.message, styles.error]}>{error}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <View>
          <Text style={styles.title}>ReadMe</Text>
          <Text style={styles.subtitle}>Bibliothèque EPUB</Text>
        </View>
        <Pressable style={styles.importButton} onPress={handleImport}>
          <Text style={styles.importButtonText}>Importer</Text>
        </Pressable>
      </View>

      {selectedBook ? (
        <View style={styles.detailContainer}>
          <Pressable style={styles.backButton} onPress={() => setSelectedBook(null)}>
            <Text style={styles.backText}>← Retour</Text>
          </Pressable>
          <Image source={{ uri: displayCover(selectedBook) }} style={styles.detailCover} />
          <Text style={styles.detailTitle}>{selectedBook.title}</Text>
          <Text style={styles.detailAuthor}>{selectedBook.author}</Text>
          <Text style={styles.detailDescription}>{selectedBook.description || 'Aucune description disponible.'}</Text>
          {selectedBook.added_date && (
            <Text style={styles.bookMeta}>Ajouté le {new Date(selectedBook.added_date).toLocaleDateString()}</Text>
          )}
        </View>
      ) : (
        <FlatList
          data={books}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          renderItem={renderBookItem}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Aucun livre dans la bibliothèque</Text>
              <Text style={styles.emptySubtitle}>Importez un EPUB pour commencer.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eef2ff',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 18,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#dbe4f5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 14,
    color: '#475569',
    marginTop: 4,
  },
  importButton: {
    backgroundColor: '#4338ca',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 16,
  },
  importButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  message: {
    paddingHorizontal: 20,
    paddingTop: 16,
    fontSize: 14,
    color: '#475569',
  },
  info: {
    color: '#1d4ed8',
  },
  listContainer: {
    padding: 20,
  },
  bookCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 14,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#0f172a',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 18,
    elevation: 3,
  },
  cover: {
    width: 90,
    height: 130,
    borderRadius: 16,
    backgroundColor: '#c7d2fe',
  },
  bookInfo: {
    flex: 1,
    marginLeft: 14,
  },
  bookTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  bookAuthor: {
    fontSize: 13,
    color: '#475569',
    marginBottom: 10,
  },
  bookExcerpt: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 20,
  },
  detailCard: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 20,
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 25,
    elevation: 4,
  },
  backButton: {
    marginBottom: 18,
  },
  backText: {
    color: '#4338ca',
    fontWeight: '700',
  },
  detailCover: {
    width: '100%',
    height: 240,
    borderRadius: 20,
    backgroundColor: '#c7d2fe',
    marginBottom: 18,
  },
  detailTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
  },
  detailAuthor: {
    fontSize: 15,
    color: '#475569',
    marginBottom: 16,
  },
  detailDescription: {
    fontSize: 15,
    color: '#334155',
    lineHeight: 22,
  },
  bookMeta: {
    marginTop: 16,
    fontSize: 13,
    color: '#475569',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 120,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748b',
  },
});

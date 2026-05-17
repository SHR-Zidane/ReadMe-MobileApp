import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { getBookById } from '../api/ApiService';

// Récupération de la largeur de l'écran pour le calcul des marges
const { width } = Dimensions.get('window');

const BookDetailScreen = () => {
  const route = useRoute();
  
  // Récupération de l'ID robuste (gère 'id' ou 'bookId' envoyés par HomeScreen)
  const params = route.params as { id?: number; bookId?: number };
  const idToUse = params.id || params.bookId;

  const [book, setBook] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Sécurité si l'ID est manquant ou n'est pas un nombre
    if (!idToUse || isNaN(Number(idToUse))) {
      console.error("L'ID reçu est invalide :", idToUse);
      setError("Impossible de charger les détails : ID invalide.");
      setLoading(false);
      return;
    }

    const fetchBookDetails = async () => {
      try {
        // Appel API (on force la conversion en nombre pour TS)
        const response = await getBookById(Number(idToUse));
        // On stocke le résultat (notre API renvoie { error, result })
        setBook(response.result);
      } catch (err: any) {
        console.error("Erreur API Details:", err);
        setError(err.message || "Une erreur est survenue lors du chargement.");
      } finally {
        setLoading(false);
      }
    };

    fetchBookDetails();
  }, [idToUse]);

  // Écran de chargement
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  // Écran d'erreur
  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Erreur: {error}</Text>
      </View>
    );
  }

  // Rendu principal une fois le livre chargé
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {book && (
        <View style={styles.content}>
          
          {/* 1. L'IMAGE DE COUVERTURE (Rétrécie et centrée) */}
          <View style={styles.coverWrapper}>
            <Image
              source={{ uri: `http://192.168.1.220:3000/cover_image/${book.cover_image}` }}
              style={styles.coverImage}
              resizeMode="cover" // 'cover' remplit le cadre sans déformer
            />
          </View>

          {/* 2. INFOS PRINCIPALES (Titre et Auteur) */}
          <View style={styles.infoContainer}>
            <Text style={styles.title}>{book.title}</Text>
            {/* Version simplifiée de l'affichage de l'auteur */}
            <Text style={styles.author}>
              {book.author
                ? `${book.author.first_name} ${book.author.last_name}`.trim()
                : 'Auteur inconnu'}
            </Text>
          </View>

          {/* 3. RÉSUMÉ (summary extrait par Python) */}
          <View style={styles.summaryContainer}>
            <Text style={styles.sectionTitle}>Résumé</Text>
            <Text style={styles.summaryText}>
              {book.summary || "Aucun résumé disponible pour ce livre."}
            </Text>
          </View>

        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  // Style global
  container: { 
    flex: 1, 
    backgroundColor: '#fff' 
  },
  // Centrage pour chargement/erreur
  center: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    padding: 20
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center'
  },
  scrollContent: {
    paddingTop: 20, // Espace en haut de la page avant l'image
  },
  content: { 
    paddingBottom: 40 
  },

  // --- Styles modifiés pour la couverture ---
  coverWrapper: {
    // Cette View englobe l'image pour gérer le centrage et l'ombre
    alignItems: 'center', // Centre horizontalement
    justifyContent: 'center',
    marginBottom: 25, // Espace sous l'image
    
    // Ombre portée pour donner du relief (iOS)
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: { 
        elevation: 5 // Ombre Android
      },
    }),
  },
  coverImage: {
    // Dimensions RÉTRÉCIES (par rapport aux 160x240 précédents)
    width: 120, // Plus petite largeur
    aspectRatio: 2 / 3, // Conserve le ratio livre vertical (hauteur sera 180)
    borderRadius: 8, // Petit arrondi moderne
    backgroundColor: '#f5f5f5', // Couleur d'attente
  },
  // ------------------------------------------

  // Styles pour les infos principales
  infoContainer: {
    paddingHorizontal: 25,
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22, // Légèrement plus petit pour l'équilibre visuel
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
    lineHeight: 28,
  },
  author: {
    fontSize: 17,
    color: '#666',
    marginTop: 6,
    fontWeight: '500',
  },

  // Styles pour le résumé
  summaryContainer: {
    paddingHorizontal: 25,
    paddingTop: 10,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '700',
    marginBottom: 12,
    color: '#444',
  },
  summaryText: {
    fontSize: 16,
    lineHeight: 24, // Bon espacement pour la lecture
    color: '#555',
    textAlign: 'justify', // Texte justifié pour un look propre
  },
});

export default BookDetailScreen;
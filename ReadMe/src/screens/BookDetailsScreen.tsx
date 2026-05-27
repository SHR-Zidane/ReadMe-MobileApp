import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Platform,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";
import { getBookById, deleteBook } from "../api/ApiService";
import { SERVER_BASE_URL } from "../api/axiosConfig";
import TagsManager from "../components/TagsManager";
import { Ionicons } from "@expo/vector-icons";

const BookDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation<any>();

  const params = route.params as { id?: number; bookId?: number };
  const idToUse = params.id || params.bookId;

  const queryClient = useQueryClient();
  const [book, setBook] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageError, setImageError] = useState(false);

  const fetchBookDetails = useCallback(async () => {
    if (!idToUse || isNaN(Number(idToUse))) return;
    try {
      const response = await getBookById(Number(idToUse));
      setBook(response.result);
    } catch (err: any) {
      console.error("Erreur lors du rafraîchissement du livre :", err);
    }
  }, [idToUse]);

  const handleDeleteBook = useCallback(() => {
    Alert.alert(
      "Supprimer le livre",
      `Êtes-vous sûr de vouloir supprimer "${book?.title ?? "ce livre"}" ? Cette action est irréversible.`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteBook(book.id);
              queryClient.invalidateQueries({ queryKey: ["books"] });
              navigation.goBack();
            } catch (err: any) {
              Alert.alert("Erreur", err.message ?? "Impossible de supprimer le livre.");
            }
          },
        },
      ],
    );
  }, [book, navigation]);

  useEffect(() => {
    if (!idToUse || isNaN(Number(idToUse))) {
      setError("Impossible de charger les détails : ID invalide.");
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      setError(null);
      await fetchBookDetails();
      setLoading(false);
    };
    load();
  }, [idToUse, fetchBookDetails]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      fetchBookDetails();
    });
    return unsubscribe;
  }, [navigation, fetchBookDetails]);

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
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
    >
      {book && (
        <View style={styles.content}>
          {/* 1. L'IMAGE DE COUVERTURE (Rétrécie et centrée) */}
          <View style={styles.coverWrapper}>
            {book.cover_image && !imageError ? (
              <Image
                source={{
                  uri: `${SERVER_BASE_URL}/cover_image/${book.cover_image}`,
                }}
                style={styles.coverImage}
                resizeMode="cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <View style={[styles.coverImage, styles.placeholderContainer]}>
                <Ionicons name="book-outline" size={48} color="#CDE8E1" />
              </View>
            )}
          </View>

          {/* 2. INFOS PRINCIPALES (Titre et Auteur) */}
          <View style={styles.infoContainer}>
            <Text style={styles.title}>{book.title}</Text>
            {/* Version simplifiée de l'affichage de l'auteur */}
            <Text style={styles.author}>
              {book.author
                ? `${book.author.first_name} ${book.author.last_name}`.trim()
                : "Auteur inconnu"}
            </Text>
          </View>

          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={styles.readButton}
              onPress={() => {
                const epubUrl = `${SERVER_BASE_URL}/epub/${book.epubPath}`;
                navigation.navigate("Reader", {
                  epubUrl,
                  title: book.title,
                  bookId: book.id,
                  lastReadPage: book.last_read_page ?? 0,
                  lastReadCfi: book.last_read_cfi || null,
                });
              }}
            >
              <Text style={styles.readButtonText}>
                {book.last_read_page > 0
                  ? "Continuer la lecture"
                  : "Lire le livre"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDeleteBook}
            >
              <Ionicons name="trash-outline" size={18} color="#C0392B" />
              <Text style={styles.deleteButtonText}>Supprimer le livre</Text>
            </TouchableOpacity>
          </View>

          {/* 3. RÉSUMÉ (summary extrait par Python) */}
          <View style={styles.summaryContainer}>
            <Text style={styles.sectionTitle}>Résumé</Text>
            <Text style={styles.summaryText}>
              {book.summary || "Aucun résumé disponible pour ce livre."}
            </Text>
          </View>

          {/* 4. TAGS */}
          <View style={styles.tagsContainer}>
            <Text style={styles.sectionTitle}>Tags</Text>
            <TagsManager bookId={book.id} initialTags={book.tags ?? []} />
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
    backgroundColor: "#fff",
  },
  // Centrage pour chargement/erreur
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    color: "red",
    fontSize: 16,
    textAlign: "center",
  },
  scrollContent: {
    paddingTop: 20, // Espace en haut de la page avant l'image
  },
  content: {
    paddingBottom: 40,
  },

  // --- Styles modifiés pour la couverture ---
  coverWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 25,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  coverImage: {
    width: 120,
    aspectRatio: 2 / 3,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
  },
  placeholderContainer: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#4A635E",
  },
  // ------------------------------------------

  // Styles pour les infos principales
  infoContainer: {
    paddingHorizontal: 25,
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 22, // Légèrement plus petit pour l'équilibre visuel
    fontWeight: "bold",
    textAlign: "center",
    color: "#333",
    lineHeight: 28,
  },
  author: {
    fontSize: 17,
    color: "#666",
    marginTop: 6,
    fontWeight: "500",
  },

  // Styles pour les actions
  actionContainer: {
    paddingHorizontal: 25,
    marginBottom: 25,
    alignItems: "center",
  },
  readButton: {
    backgroundColor: "#4A635E",
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 30,
    width: "100%",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  readButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },

  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E74C3C",
    gap: 8,
  },
  deleteButtonText: {
    color: "#C0392B",
    fontSize: 15,
    fontWeight: "600",
  },

  // Styles pour le résumé
  summaryContainer: {
    paddingHorizontal: 25,
    paddingTop: 10,
  },

  // Styles pour les tags
  tagsContainer: {
    paddingHorizontal: 25,
    paddingTop: 10,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: "700",
    marginBottom: 12,
    color: "#444",
  },
  summaryText: {
    fontSize: 16,
    lineHeight: 24, // Bon espacement pour la lecture
    color: "#555",
    textAlign: "justify", // Texte justifié pour un look propre
  },
});

export default BookDetailScreen;

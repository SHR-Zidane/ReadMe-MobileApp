import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { uploadEpub } from "../api/uploadService";
import { useBooks } from "../hooks/useBooks";
import LoadingIndicator from "../components/LoadingIndicator";
import BookCard from "../components/BookCard";
import { useNavigation } from "@react-navigation/native";
import type { Book } from "../types/models";

// ─── Palette de couleurs ─────────────────────────────────────────────────────

const COLORS = {
  primary: "#4A635E",
  secondary: "#CDE8E1",
  textMain: "#3F4946",
  textSub: "#8F8F8F",
  bg: "#F4FBF8",
  error: "#C0392B",
  errorBg: "#FDECEA",
};

// ─── Composant ────────────────────────────────────────────────────────────────

const HomeScreen = () => {
  const navigation = useNavigation<any>();
  const [uploading, setUploading] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);

  // ── Récupération des livres via React Query ────────────────────────────────
  const { books, isLoading, isError, error, attemptedUrl, refetch } =
    useBooks();

  // ── Upload d'un EPUB ───────────────────────────────────────────────────────

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/epub+zip",
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];
      setUploading(true);

      const res = await uploadEpub(
        {
          uri: asset.uri,
          name: asset.name || "book.epub",
          mimeType: asset.mimeType || "application/epub+zip",
        },
        { author_name: "Auteur Inconnu" },
        (percent) => {
          console.log(`Upload: ${percent}%`);
        },
      );

      if (res.success && res.book) {
        Alert.alert("Succès", "Livre ajouté avec succès !");
        refetch(); // Rafraîchit la liste via React Query
      } else if (res.error) {
        Alert.alert("Erreur", res.error.message);
      }
    } catch (err) {
      console.error("Erreur inattendue:", err);
      Alert.alert("Erreur", "Une erreur inattendue est survenue.");
    } finally {
      setUploading(false);
    }
  };

  // ── Rendu d'un item de la liste ────────────────────────────────────────────

  const renderBook = ({ item }: { item: Book }) => (
    <BookCard
      title={item.title}
      author={
        item.author
          ? `${item.author.first_name} ${item.author.last_name}`.trim()
          : "Auteur inconnu"
      }
      cover_image={item.cover_image}
      layout="list"
      onPress={() => navigation.navigate("BookDetails", { id: item.id })}
      style={{}}
    />
  );

  // ── États de chargement et d'erreur ───────────────────────────────────────

  if (isLoading) return <LoadingIndicator />;

  if (isError) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="wifi-outline" size={48} color={COLORS.error} />
        <Text style={styles.errorTitle}>Connexion impossible</Text>
        <Text style={styles.errorMessage}>
          {error?.message ?? "Une erreur réseau est survenue."}
        </Text>
        {attemptedUrl && (
          <Text style={styles.errorUrl}>URL tentée : {attemptedUrl}</Text>
        )}
        <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
          <Text style={styles.retryBtnText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Rendu principal ────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ma Bibliothèque</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => setFilterVisible(true)}
            style={styles.filterButton}
          >
            <Text style={{ color: COLORS.primary, fontWeight: "bold" }}>
              Filtres
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.addBtn}
            onPress={handlePickDocument}
            accessibilityLabel="Ajouter un livre"
          >
            {uploading ? (
              <ActivityIndicator color={COLORS.primary} />
            ) : (
              <Ionicons name="add" size={24} color={COLORS.primary} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Barre de recherche */}
      <TextInput
        style={styles.searchBar}
        placeholder="Rechercher un livre..."
        placeholderTextColor={COLORS.textSub}
      />

      {/* Liste des livres */}
      <FlatList
        data={books}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderBook}
        numColumns={1}
        ListEmptyComponent={
          <View style={{ alignItems: "center", marginTop: 50 }}>
            <Text style={{ color: COLORS.textSub }}>
              Aucun livre dans votre bibliothèque.
            </Text>
            <Text style={{ color: COLORS.textSub }}>
              Appuyez sur + pour en ajouter un !
            </Text>
          </View>
        }
      />

      {/* Modal Filtres */}
      <Modal visible={filterVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Catégories</Text>
            {["Roman", "Manga", "SF, Fantasy", "Bande dessinée"].map((cat) => (
              <TouchableOpacity key={cat} style={styles.filterItem}>
                <Text>{cat}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setFilterVisible(false)}
            >
              <Text style={{ color: "white" }}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, paddingHorizontal: 10 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 5,
  },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: COLORS.primary },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  filterButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginRight: 8,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.secondary,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  searchBar: {
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
  },
  // ── Erreur réseau ──────────────────────────────────────────────────────────
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.bg,
    paddingHorizontal: 24,
    gap: 12,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.error,
  },
  errorMessage: {
    fontSize: 14,
    color: COLORS.textMain,
    textAlign: "center",
  },
  errorUrl: {
    fontSize: 11,
    color: COLORS.textSub,
    fontFamily: "monospace",
    textAlign: "center",
    backgroundColor: "#F0F0F0",
    padding: 8,
    borderRadius: 6,
  },
  retryBtn: {
    marginTop: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  retryBtnText: {
    color: "#FFF",
    fontWeight: "bold",
  },
  // ── Modal ──────────────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 15 },
  filterItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  closeBtn: {
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
});

export default HomeScreen;

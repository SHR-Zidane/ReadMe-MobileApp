import React, { useState, useMemo } from "react";
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
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { uploadEpub } from "../api/uploadService";
import { useBooks } from "../hooks/useBooks";
import { useTags } from "../hooks/useTags";
import LoadingIndicator from "../components/LoadingIndicator";
import BookCard from "../components/BookCard";
import { useNavigation } from "@react-navigation/native";
import type { Book } from "../types/models";

const COLORS = {
  primary: "#4A635E",
  secondary: "#CDE8E1",
  textMain: "#3F4946",
  textSub: "#8F8F8F",
  bg: "#F4FBF8",
  error: "#C0392B",
  errorBg: "#FDECEA",
};

const HomeScreen = () => {
  const navigation = useNavigation<any>();
  const [uploading, setUploading] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);

  const { books, isLoading, isError, error, attemptedUrl, refetch } =
    useBooks();
  const { tags } = useTags();

  const filteredBooks = useMemo(() => {
    let result = [...books];

    // Filtre texte
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((b) => b.title.toLowerCase().includes(q));
    }

    // Filtre tags
    if (selectedTagIds.length > 0) {
      result = result.filter((b) =>
        b.tags?.some((t) => selectedTagIds.includes(t.id)),
      );
    }

    // Tri par date d'ajout
    result.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [books, searchQuery, selectedTagIds, sortOrder]);

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
        refetch();
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

  const toggleTag = (tagId: number) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId],
    );
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedTagIds([]);
    setSortOrder("desc");
  };

  const hasActiveFilters =
    searchQuery.trim() !== "" || selectedTagIds.length > 0 || sortOrder !== "desc";

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
            <Ionicons
              name={hasActiveFilters ? "funnel" : "funnel-outline"}
              size={20}
              color={COLORS.primary}
            />
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
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      {/* Tri actif */}
      <View style={styles.sortRow}>
        <TouchableOpacity
          style={styles.sortBtn}
          onPress={() =>
            setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"))
          }
        >
          <Ionicons
            name={sortOrder === "desc" ? "arrow-down" : "arrow-up"}
            size={14}
            color={COLORS.primary}
          />
          <Text style={styles.sortBtnText}>
            {sortOrder === "desc"
              ? "Plus récents d'abord"
              : "Plus anciens d'abord"}
          </Text>
        </TouchableOpacity>

        {selectedTagIds.length > 0 && (
          <View style={styles.tagBadge}>
            <Text style={styles.tagBadgeText}>
              {selectedTagIds.length} filtre(s)
            </Text>
          </View>
        )}
      </View>

      {/* Liste des livres */}
      <FlatList
        data={filteredBooks}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderBook}
        numColumns={1}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={{ alignItems: "center", marginTop: 50 }}>
            {searchQuery.trim() || selectedTagIds.length > 0 ? (
              <Text style={{ color: COLORS.textSub }}>
                Aucun livre ne correspond à votre recherche.
              </Text>
            ) : (
              <>
                <Text style={{ color: COLORS.textSub }}>
                  Aucun livre dans votre bibliothèque.
                </Text>
                <Text style={{ color: COLORS.textSub }}>
                  Appuyez sur + pour en ajouter un !
                </Text>
              </>
            )}
          </View>
        }
      />

      {/* Modal Filtres */}
      <Modal visible={filterVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Trier par</Text>

              <TouchableOpacity
                style={[
                  styles.sortOption,
                  sortOrder === "desc" && styles.sortOptionActive,
                ]}
                onPress={() => setSortOrder("desc")}
              >
                <Ionicons
                  name="arrow-down"
                  size={18}
                  color={
                    sortOrder === "desc" ? "#fff" : COLORS.textMain
                  }
                />
                <Text
                  style={[
                    styles.sortOptionText,
                    sortOrder === "desc" && styles.sortOptionTextActive,
                  ]}
                >
                  Plus récents d'abord
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.sortOption,
                  sortOrder === "asc" && styles.sortOptionActive,
                ]}
                onPress={() => setSortOrder("asc")}
              >
                <Ionicons
                  name="arrow-up"
                  size={18}
                  color={
                    sortOrder === "asc" ? "#fff" : COLORS.textMain
                  }
                />
                <Text
                  style={[
                    styles.sortOptionText,
                    sortOrder === "asc" && styles.sortOptionTextActive,
                  ]}
                >
                  Plus anciens d'abord
                </Text>
              </TouchableOpacity>

              <View style={styles.divider} />

              <Text style={styles.modalTitle}>Filtrer par tags</Text>

              {tags.length === 0 && (
                <Text style={{ color: COLORS.textSub, marginBottom: 12 }}>
                  Aucun tag disponible.
                </Text>
              )}

              <View style={styles.tagList}>
                {tags.map((tag) => {
                  const isSelected = selectedTagIds.includes(tag.id);
                  return (
                    <TouchableOpacity
                      key={tag.id}
                      style={[
                        styles.tagChip,
                        isSelected && {
                          backgroundColor: tag.color || COLORS.primary,
                        },
                      ]}
                      onPress={() => toggleTag(tag.id)}
                    >
                      <Text
                        style={[
                          styles.tagChipText,
                          isSelected && { color: "#fff" },
                        ]}
                      >
                        {tag.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              {hasActiveFilters && (
                <TouchableOpacity
                  style={styles.clearBtn}
                  onPress={() => {
                    clearFilters();
                    setFilterVisible(false);
                  }}
                >
                  <Text style={styles.clearBtnText}>Effacer tout</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setFilterVisible(false)}
              >
                <Text style={{ color: "white" }}>Appliquer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

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
    paddingHorizontal: 10,
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
    marginBottom: 8,
  },
  sortRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  sortBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.secondary,
    gap: 4,
  },
  sortBtnText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: "600",
  },
  tagBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },
  listContent: {
    paddingBottom: 20,
  },
  // ── Erreur réseau ──
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
  // ── Modal ──
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
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
    color: COLORS.textMain,
  },
  sortOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: "#F5F5F5",
    gap: 8,
  },
  sortOptionActive: {
    backgroundColor: COLORS.primary,
  },
  sortOptionText: {
    fontSize: 15,
    color: COLORS.textMain,
    fontWeight: "500",
  },
  sortOptionTextActive: {
    color: "#fff",
  },
  divider: {
    height: 1,
    backgroundColor: "#EEE",
    marginVertical: 16,
  },
  tagList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  tagChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#DDD",
    backgroundColor: "#fff",
  },
  tagChipText: {
    fontSize: 13,
    color: COLORS.textMain,
    fontWeight: "600",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    paddingTop: 8,
  },
  clearBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  clearBtnText: {
    color: COLORS.primary,
    fontWeight: "bold",
  },
  closeBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
});

export default HomeScreen;

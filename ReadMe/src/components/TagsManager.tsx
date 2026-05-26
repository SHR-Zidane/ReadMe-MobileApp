/**
 * TagsManager.tsx
 *
 * Affiche les tags du livre sous forme de chips et propose un modal
 * complet pour créer, éditer, supprimer des tags et les associer au livre.
 */

import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import type { Tag } from "../types/models";
import {
  useTags,
  useCreateTag,
  useUpdateTag,
  useDeleteTag,
  useAddTagToBook,
  useRemoveTagFromBook,
} from "../hooks/useTags";

// ─── Constants ────────────────────────────────────────────────────────────────

const COLORS = {
  primary: "#4A635E",
  secondary: "#CDE8E1",
  textMain: "#3F4946",
  textSub: "#8F8F8F",
  bg: "#F4FBF8",
} as const;

const TAG_PALETTE = [
  "#4A635E",
  "#E74C3C",
  "#3498DB",
  "#F39C12",
  "#9B59B6",
  "#1ABC9C",
  "#E67E22",
  "#27AE60",
  "#C0392B",
  "#7F8C8D",
] as const;

// ─── TagRow ───────────────────────────────────────────────────────────────────

interface TagRowProps {
  tag: Tag;
  isOnBook: boolean;
  isEditing: boolean;
  isSaving: boolean;
  editName: string;
  editColor: string;
  onToggle: (tag: Tag) => void;
  onStartEdit: (tag: Tag) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDelete: (tag: Tag) => void;
  onEditNameChange: (value: string) => void;
  onEditColorChange: (color: string) => void;
}

const TagRow: React.FC<TagRowProps> = React.memo(
  ({
    tag,
    isOnBook,
    isEditing,
    isSaving,
    editName,
    editColor,
    onToggle,
    onStartEdit,
    onSaveEdit,
    onCancelEdit,
    onDelete,
    onEditNameChange,
    onEditColorChange,
  }) => {
    // ── Inline edit mode ──────────────────────────────────────────────────
    if (isEditing) {
      return (
        <View style={rowStyles.container}>
          <View style={rowStyles.editBlock}>
            <TextInput
              style={rowStyles.editInput}
              value={editName}
              onChangeText={onEditNameChange}
              autoFocus
              maxLength={30}
              returnKeyType="done"
              onSubmitEditing={onSaveEdit}
              placeholderTextColor={COLORS.textSub}
            />
            <View style={rowStyles.miniPalette}>
              {TAG_PALETTE.map((c) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => onEditColorChange(c)}
                  style={[
                    rowStyles.colorDot,
                    { backgroundColor: c },
                    editColor === c && rowStyles.colorDotSelected,
                  ]}
                />
              ))}
            </View>
            <View style={rowStyles.editActions}>
              <TouchableOpacity
                onPress={onSaveEdit}
                disabled={isSaving}
                style={[
                  rowStyles.editBtn,
                  rowStyles.editBtnSave,
                  isSaving && rowStyles.editBtnDisabled,
                ]}
                accessibilityLabel="Enregistrer les modifications"
              >
                {isSaving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={rowStyles.editBtnSaveText}>Enregistrer</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onCancelEdit}
                style={[rowStyles.editBtn, rowStyles.editBtnCancel]}
                accessibilityLabel="Annuler les modifications"
              >
                <Text style={rowStyles.editBtnCancelText}>Annuler</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    }

    // ── Normal mode ───────────────────────────────────────────────────────
    return (
      <View style={rowStyles.container}>
        {/* Checkbox */}
        <TouchableOpacity
          onPress={() => onToggle(tag)}
          style={rowStyles.checkboxTouch}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: isOnBook }}
          accessibilityLabel={
            isOnBook ? `Retirer ${tag.name} du livre` : `Ajouter ${tag.name} au livre`
          }
        >
          <View
            style={[rowStyles.checkbox, isOnBook && rowStyles.checkboxChecked]}
          >
            {isOnBook && <Text style={rowStyles.checkmark}>✓</Text>}
          </View>
        </TouchableOpacity>

        {/* Chip */}
        <View style={[rowStyles.chip, { backgroundColor: tag.color }]}>
          <Text style={rowStyles.chipText} numberOfLines={1}>
            {tag.name}
          </Text>
        </View>

        {/* Edit / Delete */}
        <View style={rowStyles.actions}>
          <TouchableOpacity
            onPress={() => onStartEdit(tag)}
            style={rowStyles.iconBtn}
            accessibilityLabel={`Modifier ${tag.name}`}
          >
            <Feather name="edit-2" size={16} color={COLORS.textSub} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onDelete(tag)}
            style={rowStyles.iconBtn}
            accessibilityLabel={`Supprimer ${tag.name}`}
          >
            <Feather name="trash-2" size={16} color="#E74C3C" />
          </TouchableOpacity>
        </View>
      </View>
    );
  },
);

TagRow.displayName = "TagRow";

// ─── TagsManager ─────────────────────────────────────────────────────────────

interface Props {
  bookId: number;
  initialTags: Tag[];
}

const TagsManager: React.FC<Props> = ({ bookId, initialTags }) => {
  // ── State ────────────────────────────────────────────────────────────────
  const [modalVisible, setModalVisible] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [selectedColor, setSelectedColor] = useState<string>(TAG_PALETTE[0]);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState<string>(TAG_PALETTE[0]);
  const [bookTagIds, setBookTagIds] = useState<Set<number>>(
    () => new Set(initialTags.map((t) => t.id)),
  );

  // Resynchronise si le parent fournit de nouveaux initialTags
  useEffect(() => {
    setBookTagIds(new Set(initialTags.map((t) => t.id)));
  }, [initialTags]);

  // ── Hooks ────────────────────────────────────────────────────────────────
  const { tags, isLoading } = useTags();
  const addTagMutation = useAddTagToBook(bookId);
  const removeTagMutation = useRemoveTagFromBook(bookId);
  const createTagMutation = useCreateTag();
  const updateTagMutation = useUpdateTag();
  const deleteTagMutation = useDeleteTag();

  // Tags actuellement sur ce livre, résolus depuis la liste complète
  const currentBookTags = tags.filter((t) => bookTagIds.has(t.id));

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleToggleTag = useCallback(
    (tag: Tag) => {
      if (bookTagIds.has(tag.id)) {
        // Optimistic remove
        setBookTagIds((prev) => {
          const next = new Set(prev);
          next.delete(tag.id);
          return next;
        });
        removeTagMutation.mutate(tag.id, {
          onError: () => {
            setBookTagIds((prev) => new Set([...prev, tag.id]));
          },
        });
      } else {
        // Optimistic add
        setBookTagIds((prev) => new Set([...prev, tag.id]));
        addTagMutation.mutate(
          { tagId: tag.id },
          {
            onError: () => {
              setBookTagIds((prev) => {
                const next = new Set(prev);
                next.delete(tag.id);
                return next;
              });
            },
          },
        );
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [bookTagIds],
  );

  const handleCreateTag = useCallback(() => {
    const trimmed = newTagName.trim();
    if (!trimmed) {
      Alert.alert("Erreur", "Le nom du tag ne peut pas être vide.");
      return;
    }
    createTagMutation.mutate(
      { name: trimmed, color: selectedColor },
      {
        onSuccess: () => {
          setNewTagName("");
          setSelectedColor(TAG_PALETTE[0]);
        },
        onError: (err) => {
          Alert.alert("Erreur", err.message ?? "Impossible de créer le tag.");
        },
      },
    );
  }, [newTagName, selectedColor, createTagMutation]);

  const handleStartEdit = useCallback((tag: Tag) => {
    setEditingTag(tag);
    setEditName(tag.name);
    setEditColor(tag.color);
  }, []);

  const handleSaveEdit = useCallback(() => {
    if (!editingTag) return;
    const trimmed = editName.trim();
    if (!trimmed) {
      Alert.alert("Erreur", "Le nom du tag ne peut pas être vide.");
      return;
    }
    updateTagMutation.mutate(
      { id: editingTag.id, name: trimmed, color: editColor, bookId },
      {
        onSuccess: () => setEditingTag(null),
        onError: (err) => {
          Alert.alert(
            "Erreur",
            err.message ?? "Impossible de modifier le tag.",
          );
        },
      },
    );
  }, [editingTag, editName, editColor, bookId, updateTagMutation]);

  const handleCancelEdit = useCallback(() => {
    setEditingTag(null);
  }, []);

  const handleDeleteTag = useCallback(
    (tag: Tag) => {
      Alert.alert(
        "Supprimer le tag",
        `Supprimer "${tag.name}" ? Cette action est irréversible.`,
        [
          { text: "Annuler", style: "cancel" },
          {
            text: "Supprimer",
            style: "destructive",
            onPress: () => {
              // Retire du set local avant la requête
              setBookTagIds((prev) => {
                const next = new Set(prev);
                next.delete(tag.id);
                return next;
              });
              deleteTagMutation.mutate(tag.id, {
                onError: (err) => {
                  Alert.alert(
                    "Erreur",
                    err.message ?? "Impossible de supprimer le tag.",
                  );
                },
              });
            },
          },
        ],
      );
    },
    [deleteTagMutation],
  );

  const handleCloseModal = useCallback(() => {
    setEditingTag(null);
    setModalVisible(false);
  }, []);

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <View>
      {/* ── Chips des tags actuels ─────────────────────────────────────── */}
      <View style={styles.chipsRow}>
        {currentBookTags.length > 0 ? (
          currentBookTags.map((tag) => (
            <View
              key={tag.id}
              style={[styles.chip, { backgroundColor: tag.color }]}
            >
              <Text style={styles.chipText}>{tag.name}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.noTag}>Aucun tag</Text>
        )}
      </View>

      {/* ── Bouton de gestion ─────────────────────────────────────────── */}
      <TouchableOpacity
        style={styles.manageBtn}
        onPress={() => setModalVisible(true)}
        accessibilityLabel="Gérer les tags"
      >
        <Feather name="tag" size={14} color={COLORS.primary} />
        <Text style={styles.manageBtnText}> ✎ Tags</Text>
      </TouchableOpacity>

      {/* ── Modal ─────────────────────────────────────────────────────── */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={handleCloseModal}
      >
        <View style={styles.overlay}>
          {/* Backdrop : tap pour fermer */}
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={handleCloseModal}
          />

          {/* Bottom sheet avec gestion du clavier */}
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
          >
            <View style={styles.sheet}>
              {/* Handle bar */}
              <View style={styles.handleBar} />

              {/* Titre */}
              <Text style={styles.sheetTitle}>Gérer les tags</Text>

              <ScrollView
                style={styles.sheetScroll}
                contentContainerStyle={styles.sheetScrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {/* ── Nouveau tag ── */}
                <Text style={styles.sectionLabel}>Nouveau tag</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Nom du tag…"
                  placeholderTextColor={COLORS.textSub}
                  value={newTagName}
                  onChangeText={setNewTagName}
                  maxLength={30}
                  returnKeyType="done"
                />
                <View style={styles.palette}>
                  {TAG_PALETTE.map((c) => (
                    <TouchableOpacity
                      key={c}
                      onPress={() => setSelectedColor(c)}
                      style={[
                        styles.colorCircle,
                        { backgroundColor: c },
                        selectedColor === c && styles.colorCircleSelected,
                      ]}
                    />
                  ))}
                </View>
                <TouchableOpacity
                  style={[
                    styles.createBtn,
                    createTagMutation.isPending && styles.btnDisabled,
                  ]}
                  onPress={handleCreateTag}
                  disabled={createTagMutation.isPending}
                  accessibilityLabel="Créer le tag"
                >
                  {createTagMutation.isPending ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.createBtnText}>Créer</Text>
                  )}
                </TouchableOpacity>

                {/* Séparateur */}
                <View style={styles.separator} />

                {/* ── Tags existants ── */}
                <Text style={styles.sectionLabel}>Tags existants</Text>
                {isLoading ? (
                  <ActivityIndicator
                    color={COLORS.primary}
                    style={{ marginVertical: 16 }}
                  />
                ) : tags.length === 0 ? (
                  <Text style={styles.emptyText}>
                    Aucun tag créé pour l'instant.
                  </Text>
                ) : (
                  tags.map((tag) => (
                    <TagRow
                      key={tag.id}
                      tag={tag}
                      isOnBook={bookTagIds.has(tag.id)}
                      isEditing={editingTag?.id === tag.id}
                      isSaving={
                        updateTagMutation.isPending &&
                        editingTag?.id === tag.id
                      }
                      editName={editName}
                      editColor={editColor}
                      onToggle={handleToggleTag}
                      onStartEdit={handleStartEdit}
                      onSaveEdit={handleSaveEdit}
                      onCancelEdit={handleCancelEdit}
                      onDelete={handleDeleteTag}
                      onEditNameChange={setEditName}
                      onEditColorChange={setEditColor}
                    />
                  ))
                )}
              </ScrollView>

              {/* Bouton fermer */}
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={handleCloseModal}
                accessibilityLabel="Fermer le modal de gestion des tags"
              >
                <Text style={styles.closeBtnText}>Fermer</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
};

export default TagsManager;

// ─── Styles principaux ────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Chips affichées sur la fiche livre
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  chip: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  chipText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "500",
  },
  noTag: {
    color: COLORS.textSub,
    fontSize: 14,
    fontStyle: "italic",
  },

  // Bouton d'ouverture du modal
  manageBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
    marginTop: 2,
  },
  manageBtnText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "500",
  },

  // Modal / Overlay
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },

  // Bottom sheet
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "85%",
    paddingTop: 12,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: "#ddd",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 14,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.textMain,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sheetScroll: {
    flexShrink: 1,
  },
  sheetScrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },

  // Section labels
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textSub,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 10,
  },

  // Création d'un nouveau tag
  textInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: COLORS.textMain,
    backgroundColor: COLORS.bg,
    marginBottom: 12,
  },
  palette: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 14,
  },
  colorCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  colorCircleSelected: {
    borderWidth: 3,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 5,
  },
  createBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  btnDisabled: {
    opacity: 0.55,
  },
  createBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },

  // Séparateur
  separator: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 20,
  },

  // État vide
  emptyText: {
    color: COLORS.textSub,
    fontSize: 14,
    textAlign: "center",
    marginVertical: 12,
  },

  // Pied du modal
  closeBtn: {
    margin: 16,
    backgroundColor: COLORS.secondary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  closeBtnText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: "600",
  },
});

// ─── Styles des lignes de tag (TagRow) ───────────────────────────────────────

const rowStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },

  // Checkbox
  checkboxTouch: {
    padding: 4,
    marginRight: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#ccc",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  checkmark: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 17,
  },

  // Chip dans la liste
  chip: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 6,
    maxWidth: 200,
  },
  chipText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "500",
  },

  // Boutons icônes
  actions: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconBtn: {
    padding: 6,
    marginLeft: 2,
  },

  // Bloc d'édition inline
  editBlock: {
    flex: 1,
    gap: 8,
    paddingVertical: 4,
  },
  editInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: COLORS.textMain,
    backgroundColor: COLORS.bg,
  },
  miniPalette: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },
  colorDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  colorDotSelected: {
    borderWidth: 2.5,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
  editActions: {
    flexDirection: "row",
    gap: 8,
  },
  editBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: "center",
  },
  editBtnSave: {
    backgroundColor: COLORS.primary,
  },
  editBtnSaveText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  editBtnCancel: {
    backgroundColor: "#eee",
  },
  editBtnCancelText: {
    color: COLORS.textMain,
    fontSize: 13,
  },
  editBtnDisabled: {
    opacity: 0.55,
  },
});

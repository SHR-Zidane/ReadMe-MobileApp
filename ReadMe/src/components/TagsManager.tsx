import React, { useState, useCallback, useEffect, useMemo } from "react";
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

    return (
      <View style={rowStyles.container}>
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

        <View style={[rowStyles.chip, { backgroundColor: tag.color }]}>
          <Text style={rowStyles.chipText} numberOfLines={1}>
            {tag.name}
          </Text>
        </View>

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

interface Props {
  bookId: number;
  initialTags: Tag[];
}

const TagsManager: React.FC<Props> = ({ bookId, initialTags }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [selectedColor, setSelectedColor] = useState<string>(TAG_PALETTE[0]);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState<string>(TAG_PALETTE[0]);
  const [bookTagIds, setBookTagIds] = useState<Set<number>>(
    () => new Set(initialTags.map((t) => t.id)),
  );

  useEffect(() => {
    if (initialTags.length === 0) return;
    setBookTagIds(new Set(initialTags.map((t) => t.id)));
  }, [initialTags]);

  const { tags, isLoading } = useTags();
  const addTagMutation = useAddTagToBook(bookId);
  const removeTagMutation = useRemoveTagFromBook(bookId);
  const createTagMutation = useCreateTag();
  const updateTagMutation = useUpdateTag();
  const deleteTagMutation = useDeleteTag();

  const currentBookTags = useMemo(() => {
    const tagMap = new Map<number, Tag>();
    initialTags.forEach((t) => tagMap.set(t.id, t));
    tags.forEach((t) => tagMap.set(t.id, t));
    return [...bookTagIds].map((id) => tagMap.get(id)).filter(Boolean) as Tag[];
  }, [tags, initialTags, bookTagIds]);

  const handleToggleTag = useCallback(
    (tag: Tag) => {
      if (bookTagIds.has(tag.id)) {
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

  return (
    <View>
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

      <TouchableOpacity
        style={styles.manageBtn}
        onPress={() => setModalVisible(true)}
        accessibilityLabel="Gérer les tags"
      >
        <Feather name="tag" size={14} color={COLORS.primary} />
        <Text style={styles.manageBtnText}> ✎ Tags</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={handleCloseModal}
      >
        <View style={styles.overlay}>
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={handleCloseModal}
          />

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
          >
            <View style={styles.sheet}>
              <View style={styles.handleBar} />

              <Text style={styles.sheetTitle}>Gérer les tags</Text>

              <ScrollView
                style={styles.sheetScroll}
                contentContainerStyle={styles.sheetScrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
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

                <View style={styles.separator} />

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

const styles = StyleSheet.create({
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
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
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
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textSub,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 10,
  },
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
  separator: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 20,
  },
  emptyText: {
    color: COLORS.textSub,
    fontSize: 14,
    textAlign: "center",
    marginVertical: 12,
  },
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

const rowStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
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
  actions: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconBtn: {
    padding: 6,
    marginLeft: 2,
  },
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

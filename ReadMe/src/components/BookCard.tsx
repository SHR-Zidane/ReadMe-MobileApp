import React, { useState } from "react";
import { SERVER_BASE_URL } from "../api/axiosConfig";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
  ImageStyle,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface AuthorObj {
  id?: number | string;
  first_name?: string;
  last_name?: string;
  name?: string;
}

interface BookCardProps {
  title: string;
  author?: string | AuthorObj | null;
  cover_image: string | null;
  onPress?: () => void;
  style?: ViewStyle;
  layout?: "grid" | "list";
}

const BookCard: React.FC<BookCardProps> = ({
  title,
  author,
  cover_image,
  onPress,
  style,
  layout = "grid",
}) => {
  const [imageError, setImageError] = useState(false);
  const hasValidCover = cover_image != null && !imageError;

  const getAuthorText = (a?: string | AuthorObj | null) => {
    if (!a) return "Auteur inconnu";
    if (typeof a === "string") return a;
    const name = a.name || `${a.first_name || ""} ${a.last_name || ""}`.trim();
    return name || "Auteur inconnu";
  };
  const authorText = getAuthorText(author);

  const renderCover = (imageStyle: ImageStyle) => {
    if (hasValidCover) {
      return (
        <Image
          source={{ uri: `${SERVER_BASE_URL}/cover_image/${cover_image}` }}
          style={imageStyle}
          resizeMode="cover"
          onError={() => setImageError(true)}
        />
      );
    }
    return (
      <View style={[imageStyle, styles.placeholderContainer]}>
        <Ionicons name="book-outline" size={32} color="#CDE8E1" />
      </View>
    );
  };

  if (layout === "list") {
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        style={[styles.listContainer, style]}
        accessibilityLabel={`Book: ${title} by ${authorText}`}
      >
        {renderCover(styles.listImage)}
        <View style={styles.listMeta}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          <Text style={styles.author} numberOfLines={1}>
            {authorText}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.container, style]}
      accessibilityLabel={`Book: ${title} by ${authorText}`}
    >
      <View style={styles.card}>
        {renderCover(styles.coverImage)}

        <View style={styles.meta}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          <Text style={styles.author} numberOfLines={1}>
            {authorText}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create<{
  container: ViewStyle;
  card: ViewStyle;
  coverImage: ImageStyle;
  meta: ViewStyle;
  title: TextStyle;
  author: TextStyle;
  listContainer: ViewStyle;
  listImage: ImageStyle;
  listMeta: ViewStyle;
  placeholderContainer: ViewStyle;
}>({
  container: {
    flex: 1,
    margin: 8,
    minWidth: 120,
    maxWidth: 220,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  coverImage: {
    width: "100%",
    aspectRatio: 2 / 3,
    backgroundColor: "#eee",
  },
  meta: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111",
    lineHeight: 18,
  },
  author: {
    marginTop: 4,
    fontSize: 12,
    color: "#6b6b6b",
  },
  listContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 10,
    marginVertical: 6,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
    }),
  },
  listImage: {
    width: 90,
    aspectRatio: 2 / 3,
    borderRadius: 6,
    backgroundColor: "#eee",
  },
  listMeta: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "center",
  },
  placeholderContainer: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#4A635E",
  },
});

export default BookCard;

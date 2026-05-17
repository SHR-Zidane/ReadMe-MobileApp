import React from 'react';
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
} from 'react-native';

interface AuthorObj {
  id?: number | string;
  first_name?: string;
  last_name?: string;
  // fallback in case API provides a single name field
  name?: string;
}

interface BookCardProps {
  title: string;
  author?: string | AuthorObj | null;
  cover_image: string;
  onPress?: () => void;
  style?: ViewStyle;
  layout?: 'grid' | 'list';
}

const BookCard: React.FC<BookCardProps> = ({
  title,
  author,
  cover_image,
  onPress,
  style,
  layout = 'grid',
}) => {
  const imageUrl = `http://192.168.1.220:3000/cover_image/${cover_image}`;
    const getAuthorText = (a?: string | AuthorObj | null) => {
      if (!a) return 'Auteur inconnu';
      if (typeof a === 'string') return a;
      // object case
      const name = a.name || `${a.first_name || ''} ${a.last_name || ''}`.trim();
      return name || 'Auteur inconnu';
    };
    const authorText = getAuthorText(author);

  if (layout === 'list') {
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        style={[styles.listContainer, style]}
        accessibilityLabel={`Book: ${title} by ${authorText}`}
      >
        <Image source={{ uri: imageUrl }} style={styles.listImage} resizeMode="cover" />
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
        <Image source={{ uri: imageUrl }} style={styles.coverImage} resizeMode="cover" />

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
}>({
  container: {
    flex: 1,
    margin: 8,
    minWidth: 120,
    maxWidth: 220,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    // Shadow (iOS) and elevation (Android)
    ...Platform.select({
      ios: {
        shadowColor: '#000',
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
    width: '100%',
    aspectRatio: 2 / 3, // width : height = 2:3 (vertical cover)
    backgroundColor: '#eee',
  },
  meta: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111',
    lineHeight: 18,
  },
  author: {
    marginTop: 4,
    fontSize: 12,
    color: '#6b6b6b',
  },
  /* List-layout styles (compact horizontal row) */
  listContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    marginVertical: 6,
    // shadow/elevation
    ...Platform.select({
      ios: {
        shadowColor: '#000',
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
    backgroundColor: '#eee',
  },
  listMeta: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
});

export default BookCard;
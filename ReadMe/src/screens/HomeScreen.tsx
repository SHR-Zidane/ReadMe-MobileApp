import React, { useEffect, useState } from 'react';
import { 
    View, 
    Text, 
    FlatList, 
    StyleSheet, 
    Image, 
    TouchableOpacity, 
    TextInput,
    Modal,
    ActivityIndicator,
    Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { getBooks, uploadBook } from '../api/ApiService';
import LoadingIndicator from '../components/LoadingIndicator';
import { useNavigation } from '@react-navigation/native';

// Palette de couleurs
const COLORS = {
    primary: '#4A635E',
    secondary: '#CDE8E1',
    textMain: '#3F4946',
    textSub: '#8F8F8F',
    bg: '#F4FBF8',
};

const HomeScreen = () => {
    const navigation = useNavigation<any>();
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [filterVisible, setFilterVisible] = useState(false);

    const fetchData = async () => {
        try {
            const response = await getBooks();
            setBooks(response.result.rows);
        } catch (error) {
            console.error("Erreur Fetch:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handlePickDocument = async () => {
    try {
        const result = await DocumentPicker.getDocumentAsync({
            type: 'application/epub+zip',
            copyToCacheDirectory: true,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            const asset = result.assets[0];
            setUploading(true);

            const formData = new FormData();

            // --- STRATÉGIE WEB ---
            let fileBlob: Blob;

            if (asset.file instanceof Blob) {
                // Si l'objet File/Blob existe déjà (comportement standard Web)
                fileBlob = asset.file;
            } else {
                // Sinon on transforme l'URI en Blob (nécessaire pour certains navigateurs)
                const response = await fetch(asset.uri);
                fileBlob = await response.blob();
            }

            // On ajoute le blob avec la clé 'epub' + le nom du fichier
            formData.append('epub', fileBlob, asset.name || 'book.epub');
            
            // Champs obligatoires pour ton modèle Sequelize
            formData.append('title', asset.name ? asset.name.replace('.epub', '') : 'Nouveau Livre');
            formData.append('authorId', "1"); 
            formData.append('categoryId', "1");

            // Appel API
            const res = await uploadBook(formData);

            if (res && res.error === false) {
                Alert.alert('Succès', 'Livre ajouté avec succès !');
                fetchData();
            } else {
                Alert.alert('Le serveur a refusé le fichier');
            }
        }
    } catch (err) {
        console.error("Détail complet erreur:", err);
        Alert.alert("Erreur", "Impossible d'ajouter le livre.");
    } finally {
        setUploading(false);
    }
};

    const renderBook = ({ item }: { item: any }) => {
    console.log("Données du livre reçu :", item);
    // Construction de l'URL de l'image
    const imageUrl = item.cover_image 
        ? `${'http://192.168.1.220:3000'}/cover_image/${item.cover_image}`
        : 'https://via.placeholder.com/150'; // Image par défaut

    return (
        <TouchableOpacity style={styles.card}>
            <Image source={{ uri: imageUrl }} style={styles.cover} />
            {/* ... reste du contenu ... */}
        </TouchableOpacity>
    );
};

    if (loading) return <LoadingIndicator />;

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Ma Bibliothèque</Text>
                <View style={styles.headerActions}>
                    <TouchableOpacity onPress={() => setFilterVisible(true)} style={styles.filterButton}>
                        <Text style={{ color: COLORS.primary, fontWeight: 'bold' }}>Filtres</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.addBtn}
                        onPress={handlePickDocument}
                        accessibilityLabel="Ajouter un livre"
                    >
                        {uploading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Ionicons name="add" size={24} color={COLORS.primary} />
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            {/* Search Bar Placeholder */}
            <TextInput 
                style={styles.searchBar} 
                placeholder="Rechercher un livre..." 
                placeholderTextColor={COLORS.textSub}
            />

            <FlatList
                data={books}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderBook}
                numColumns={2}
                columnWrapperStyle={styles.row}
                ListEmptyComponent={
                    <View style={{ alignItems: 'center', marginTop: 50 }}>
                        <Text style={{ color: COLORS.textSub }}>Aucun livre dans votre bibliothèque.</Text>
                        <Text style={{ color: COLORS.textSub }}>Appuyez sur + pour en ajouter un !</Text>
                    </View>
                }
            />

            {/* Modal Filtres Rapide */}
            <Modal visible={filterVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Catégories</Text>
                        {["Roman", "Manga", "SF, Fantasy", "Bande dessinée"].map(cat => (
                            <TouchableOpacity key={cat} style={styles.filterItem}>
                                <Text>{cat}</Text>
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity 
                            style={styles.closeBtn} 
                            onPress={() => setFilterVisible(false)}
                        >
                            <Text style={{ color: 'white' }}>Fermer</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Le bouton d'ajout est maintenant dans l'en-tête (à droite de Filtres) */}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg, paddingHorizontal: 10 },
    header: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        paddingVertical: 20,
        paddingHorizontal: 5
    },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.primary },
    searchBar: { 
        backgroundColor: '#F5F5F5', 
        borderRadius: 10, 
        padding: 12, 
        marginBottom: 20 
    },
    row: { justifyContent: 'space-between' },
    card: { 
        width: '48%', 
        backgroundColor: '#FFF', 
        borderRadius: 12, 
        marginBottom: 15,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    cover: { width: '100%', height: 200, borderTopLeftRadius: 12, borderTopRightRadius: 12 },
    cardContent: { padding: 10 },
    title: { fontSize: 14, fontWeight: 'bold', color: COLORS.textMain },
    author: { fontSize: 12, color: COLORS.textSub, marginVertical: 4 },
    progressContainer: { 
        height: 6, 
        backgroundColor: COLORS.secondary, 
        borderRadius: 3, 
        marginTop: 8 
    },
    progressBar: { 
        height: '100%', 
        backgroundColor: COLORS.primary, 
        borderRadius: 3 
    },
    modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
    modalContent: { backgroundColor: 'white', padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
    modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
    filterItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#EEE' },
    closeBtn: { 
        backgroundColor: COLORS.primary, 
        padding: 15, 
        borderRadius: 10, 
        alignItems: 'center', 
        marginTop: 20 
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
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
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3,
    },
    addBtnText: {
        color: COLORS.primary,
        fontSize: 22,
        lineHeight: 22,
        fontWeight: '700',
    }
});

export default HomeScreen;

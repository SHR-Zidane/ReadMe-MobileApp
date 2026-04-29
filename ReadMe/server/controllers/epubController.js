import Epub from '../models/epubModel.js';
import epubParser from 'epub'; // Bibliothèque pour parser les EPUB
import { promisify } from 'util';

/**
 * Contrôleur pour gérer les opérations CRUD sur les livres EPUB.
 */
class EpubController {
  /**
   * Récupère tous les livres, triés par added_date décroissant.
   */
  static async getAllBooks(req, res) {
    try {
      const books = await Epub.findAll({
        order: [['added_date', 'DESC']], // Tri par date d'ajout
        attributes: ['id', 'title', 'author', 'cover', 'added_date', 'tags'], // Exclut le BLOB file pour performance
      });

      // Convertir les couvertures en base64 pour l'affichage
      const booksWithCovers = books.map(book => ({
        ...book.toJSON(),
        cover: book.cover ? `data:image/jpeg;base64,${book.cover.toString('base64')}` : null,
      }));

      res.json(booksWithCovers);
    } catch (error) {
      res.status(500).json({ error: 'Erreur lors de la récupération des livres' });
    }
  }

  /**
   * Récupère un livre par ID.
   */
  static async getBookById(req, res) {
    try {
      const book = await Epub.findByPk(req.params.id);
      if (!book) {
        return res.status(404).json({ error: 'Livre non trouvé' });
      }
      res.json(book);
    } catch (error) {
      res.status(500).json({ error: 'Erreur lors de la récupération du livre' });
    }
  }

  /**
   * Upload et sauvegarde d'un EPUB.
   * Extrait la couverture depuis le BLOB EPUB.
   */
  static async uploadBook(req, res) {
    try {
      const { title, author, tags } = req.body;
      const fileBuffer = req.file.buffer; // Buffer du fichier uploadé

      // Extraction de la couverture
      let coverBuffer = null;
      try {
        const epub = new epubParser(fileBuffer);
        await promisify(epub.parse.bind(epub))(); // Parse l'EPUB
        if (epub.metadata.cover) {
          // epub.metadata.cover est le chemin de l'image dans l'EPUB
          const coverPath = epub.metadata.cover;
          const coverImage = epub.images[coverPath];
          if (coverImage) {
            coverBuffer = coverImage; // Buffer de l'image
          }
        }
      } catch (parseError) {
        console.warn('Impossible d\'extraire la couverture :', parseError.message);
      }

      const newBook = await Epub.create({
        title,
        author,
        file: fileBuffer,
        cover: coverBuffer,
        tags,
        added_date: new Date(),
      });

      res.status(201).json(newBook);
    } catch (error) {
      res.status(500).json({ error: 'Erreur lors de l\'upload du livre' });
    }
  }

  /**
   * Supprime un livre par ID.
   */
  static async deleteBook(req, res) {
    try {
      const deleted = await Epub.destroy({ where: { id: req.params.id } });
      if (!deleted) {
        return res.status(404).json({ error: 'Livre non trouvé' });
      }
      res.json({ message: 'Livre supprimé' });
    } catch (error) {
      res.status(500).json({ error: 'Erreur lors de la suppression' });
    }
  }
}

export default EpubController;
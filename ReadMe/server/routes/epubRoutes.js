import express from 'express';
import EpubController from '../controllers/epubController.js';

const router = express.Router();

/**
 * Routes pour les livres EPUB.
 */
router.get('/', EpubController.getAllBooks); // Récupère tous les livres
router.get('/:id', EpubController.getBookById); // Récupère un livre par ID
router.post('/', EpubController.uploadBook); // Upload un nouveau livre
router.delete('/:id', EpubController.deleteBook); // Supprime un livre

export default router;
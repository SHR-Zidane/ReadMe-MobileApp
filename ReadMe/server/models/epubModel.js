import { DataTypes } from 'sequelize';
import db from '../db.js';

/**
 * Modèle Sequelize pour les livres EPUB.
 * Définit la structure de la table 'epubs' dans la base de données MySQL.
 */
const Epub = db.define('Epub', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: 'Identifiant unique du livre EPUB',
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Titre du livre',
  },
  author: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Auteur du livre',
  },
  file: {
    type: DataTypes.BLOB('long'),
    allowNull: false,
    comment: 'Contenu binaire du fichier EPUB',
  },
  cover: {
    type: DataTypes.BLOB('medium'), // Pour stocker l'image de couverture extraite
    allowNull: true,
    comment: 'Image de couverture du livre (extraite du EPUB)',
  },
  added_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: 'Date d\'ajout du livre dans la bibliothèque',
  },
  tags: {
    type: DataTypes.STRING, // Peut être une chaîne JSON ou séparée par virgules
    allowNull: true,
    comment: 'Tags pour le filtrage (ex: "fiction, aventure")',
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: 'Date de création de l\'enregistrement',
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: 'Date de dernière mise à jour',
  },
}, {
  tableName: 'epubs', // Nom explicite de la table
  timestamps: true, // Active createdAt et updatedAt
});

export default Epub;
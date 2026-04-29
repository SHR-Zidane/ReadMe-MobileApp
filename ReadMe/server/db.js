import { Sequelize } from 'sequelize';

// Configuration de la connexion à la base de données MySQL locale
const sequelize = new Sequelize('readme_db', 'root', '', {
  host: 'localhost',
  dialect: 'mysql',
  logging: console.log, // Active les logs SQL pour le développement
});

// Test de la connexion
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('Connexion à la base de données MySQL réussie.');
  } catch (error) {
    console.error('Erreur de connexion à la base de données:', error);
  }
}

// Synchronisation des modèles avec la base de données
async function syncDatabase() {
  try {
    await sequelize.sync({ alter: true }); // Utilise 'alter' pour ajuster les tables sans perdre de données
    console.log('Base de données synchronisée avec succès.');
  } catch (error) {
    console.error('Erreur lors de la synchronisation de la base de données:', error);
  }
}

export default sequelize;
export { testConnection, syncDatabase };
import express from 'express';
import cors from 'cors';
import { testConnection, syncDatabase } from './db.js';
import epubRoutes from './routes/epubRoutes.js';

const app = express();
const PORT = 3001; // Différent de 3000 pour l'API Rust

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/epubs', epubRoutes);

// Test de connexion et synchronisation au démarrage
(async () => {
  await testConnection();
  await syncDatabase();
})();

// Démarrage du serveur
app.listen(3001, '0.0.0.0', () => {
  console.log(`Serveur Node.js démarré sur http://0.0.0.0:3001`);
});
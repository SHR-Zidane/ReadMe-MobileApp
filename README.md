# ReadMe — Monorepo

Application mobile de gestion de bibliothèque EPUB personnelle.

```
ReadMe-MobileApp/
├── ReadMe/        ← App mobile React Native (Expo SDK 54)
└── backend/       ← Pointer vers api_express (repo séparé)
```

> Le backend est dans un repo séparé : **API-PassionLecture / api_express**

---

## Démarrage rapide

### 1. Lancer le backend

```bash
cd api_express
docker start mysql_db          # ou docker run ... (voir api_express/README.md)
npm run dev
```

Le backend doit écouter sur `http://0.0.0.0:3000`.

### 2. Lancer l'app mobile

```bash
cd ReadMe
npm install
npm start
```

Scanne le QR code avec **Expo Go** sur ton téléphone Android (même Wi-Fi que le PC).

---

## Réseaux différents (PC ≠ téléphone)

| Solution | Installation | URL fixe | Idéal pour |
|---|---|---|---|
| **Hotspot mobile** | Zéro | Non (change à chaque boot) | Ponctuellement |
| **ngrok + expo tunnel** | ngrok CLI | Non (gratuit) | Démo à distance |
| **Tailscale** | App PC + tél | Oui | Usage régulier |

See [`ReadMe/README.md`](./ReadMe/README.md) for detailed instructions.

---

## Documentation détaillée

| Projet | README |
|---|---|
| App mobile (Expo) | [`ReadMe/README.md`](./ReadMe/README.md) |
| Backend (Express + MySQL) | [`api_express/README.md`](https://github.com/Zidane/API-PassionLecture/blob/main/api_express/README.md) |

---

## Stack technique

| Côté | Technologies |
|---|---|
| Mobile | React Native, Expo SDK 54, React Navigation, React Query, Axios, TypeScript |
| Backend | Node.js, Express 5, Sequelize-TypeScript, MySQL, Multer, Python (parser EPUB) |
| Infra dev | Docker (MySQL), Metro (Expo), tsc-watch |

# ReadMe — Application Mobile

Application React Native (Expo SDK 54) de gestion de bibliothèque EPUB personnelle.

---

## Prérequis

| Outil | Version minimale | Vérification |
|---|---|---|
| Node.js | 18+ | `node -v` |
| npm | 9+ | `npm -v` |
| Expo CLI | SDK 54 | `npx expo --version` |
| Android physique **ou** émulateur | Android 10+ | — |

> Le backend doit tourner avant de lancer l'app. Voir le README de `api_express/`.

---

## Installation

```bash
# 1. Se placer dans le dossier de l'app
cd ReadMe

# 2. Installer les dépendances
npm install
```

---

## Variables d'environnement

Crée un fichier `.env` à la racine de `ReadMe/` :

```env
# URL de l'API en production (ignorée en développement — IP résolue automatiquement)
EXPO_PUBLIC_API_URL=https://TO_BE_DEFINED_IN_PROD
```

> En développement, l'IP du backend est **résolue automatiquement** depuis l'adresse
> du serveur Metro (`Constants.expoConfig.hostUri`). Tu n'as rien à configurer.

---

## Lancer l'application

```bash
# Démarrer Metro (serveur de développement Expo)
npm start
# ou
npx expo start
```

Metro affiche un QR code et l'adresse du serveur, par exemple :
```
› Metro waiting on exp://192.168.1.220:8081
```

---

## Ouvrir l'app sur un téléphone Android physique

### Option A — Expo Go (le plus simple)

1. Installe **Expo Go** depuis le Play Store sur ton téléphone
2. Connecte le téléphone et ton PC **au même réseau Wi-Fi**
3. Lance `npm start` sur ton PC
4. Scanne le QR code avec l'app Expo Go (ou l'appli Appareil photo)

> ✅ Expo Go autorise nativement le trafic HTTP — aucune config supplémentaire.

### Option B — Development Build (si Expo Go ne suffit pas)

```bash
# Compiler et installer l'app en mode dev sur le téléphone branché en USB
npx expo run:android
```

Pré-requis supplémentaires :
- Android Studio installé avec un SDK Android configuré
- Débogage USB activé sur le téléphone (`Paramètres → Options développeur`)
- Le téléphone détecté : `adb devices`

---

## PC et téléphone sur des réseaux différents

Deux solutions selon ton contexte.

---

### Solution A — Hotspot mobile (la plus simple, zéro installation)

Ton téléphone devient la box Wi-Fi. Le PC s'y connecte. Ils sont alors sur le même réseau.

```
1. Téléphone : activer le partage de connexion Wi-Fi (hotspot)
2. PC : se connecter au hotspot du téléphone
3. Retrouver l'IP du PC sur ce réseau : ipconfig  (chercher l'IP sous "carte Wi-Fi")
4. Lancer le backend normalement : npm run dev
5. Lancer Expo normalement : npm start
6. Tout fonctionne comme en réseau local — l'IP est résolue automatiquement
```

> ⚠️  Le hotspot consomme la data mobile du téléphone. À éviter pour les gros uploads.

---

### Solution B — ngrok + tunnel Expo (réseaux vraiment séparés)

Ngrok crée un tunnel HTTPS public vers le backend local. Expo `--tunnel` fait pareil pour Metro.

#### Étape 1 — Installer ngrok

```bash
# Windows (winget)
winget install ngrok

# macOS
brew install ngrok

# Ou télécharger sur https://ngrok.com/download
```

Créer un compte gratuit sur [ngrok.com](https://ngrok.com) et configurer le token :
```bash
ngrok config add-authtoken <TON_TOKEN>
```

#### Étape 2 — Exposer le backend

```bash
# Dans le dossier api_express, avec le backend déjà lancé (npm run dev) :
ngrok http 3000
```

Ngrok affiche une URL publique :
```
Forwarding  https://abc123.ngrok-free.app -> http://localhost:3000
```

#### Étape 3 — Configurer l'app mobile

Dans `ReadMe/.env`, remplacer le placeholder par l'URL ngrok :

```env
EXPO_PUBLIC_API_URL=https://abc123.ngrok-free.app/api
```

> L'app détecte que la valeur n'est pas un placeholder et l'utilise en priorité,
> même en mode développement.

#### Étape 4 — Lancer Expo avec tunnel

```bash
# Metro est aussi exposé publiquement (pour que le téléphone charge le JS)
npx expo start --tunnel
```

Scanne le nouveau QR code depuis n'importe où.

#### Récapitulatif pour ngrok

| Terminal | Commande | Rôle |
|---|---|---|
| 1 | `npm run dev` (dans `api_express/`) | Backend |
| 2 | `ngrok http 3000` | Tunnel backend |
| 3 | `npx expo start --tunnel` (dans `ReadMe/`) | Metro + tunnel app |

> ⚠️  L'URL ngrok change à chaque redémarrage sur le plan gratuit.
> Mettre à jour `.env` et redémarrer Metro à chaque fois.

---

### Solution C — Tailscale (la meilleure pour usage régulier)

Tailscale crée un VPN mesh privé. PC et téléphone obtiennent une IP fixe partagée, comme s'ils étaient sur le même réseau — sans changer `.env`.

```bash
# 1. Installer Tailscale sur le PC : https://tailscale.com/download
# 2. Installer Tailscale sur le téléphone (Play Store)
# 3. Connecter les deux au même compte Tailscale
# 4. Récupérer l'IP Tailscale du PC : 100.x.x.x  (visible dans l'app Tailscale)
# 5. Lancer le backend normalement
# 6. Lancer Expo normalement
# → L'IP est résolue automatiquement via Metro, comme en Wi-Fi local
```

---

## Ouvrir l'app sur un émulateur Android (AVD)

```bash
# Lancer l'émulateur depuis Android Studio, puis :
npx expo start --android
```

> Sur l'émulateur, `localhost` du PC est accessible via l'IP spéciale `10.0.2.2`.
> Le fallback est déjà configuré dans `src/api/axiosConfig.ts`.

---

## Connexion au backend depuis un autre PC ou téléphone

L'app résout l'IP du backend **automatiquement** à partir de l'adresse Metro :

```
Metro sur 192.168.1.220:8081  →  Backend sur 192.168.1.220:3000
```

**Pour que ça fonctionne, les 3 conditions doivent être réunies :**

| Condition | Vérification |
|---|---|
| PC et téléphone sur le même Wi-Fi | Paramètres réseau du téléphone |
| Backend lancé sur `0.0.0.0:3000` | `npm run dev` dans `api_express/` |
| Port 3000 non bloqué par le pare-feu | Voir ci-dessous |

### Autoriser le port 3000 dans le pare-feu Windows

```
Panneau de configuration
→ Système et sécurité
→ Pare-feu Windows Defender
→ Paramètres avancés
→ Règles de trafic entrant → Nouvelle règle
→ Port → TCP → 3000 → Autoriser la connexion
```

Ou en PowerShell (administrateur) :
```powershell
New-NetFirewallRule -DisplayName "ReadMe API" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow
```

---

## Structure des dossiers

```
ReadMe/
├── app.json              # Config Expo (usesCleartextTraffic, bundle ID…)
├── index.js              # Point d'entrée (registerRootComponent)
├── src/
│   ├── api/
│   │   ├── axiosConfig.ts    # Instance Axios + résolution IP dynamique
│   │   ├── ApiService.ts     # Fonctions d'accès aux livres
│   │   ├── endpoints.ts      # Toutes les routes API centralisées
│   │   └── uploadService.ts  # Upload EPUB via XMLHttpRequest
│   ├── components/
│   │   ├── BookCard.tsx       # Carte livre (liste / grille)
│   │   ├── LoadingIndicator.tsx
│   │   └── TagsManager.tsx    # Gestion des tags (chips + modal)
│   ├── hooks/
│   │   ├── useBooks.ts        # React Query — liste des livres
│   │   └── useTags.ts         # React Query — CRUD tags + book-tags
│   ├── navigation/
│   │   └── AppNavigator.tsx   # Stack Navigator
│   ├── screens/
│   │   ├── HomeScreen.tsx     # Bibliothèque + upload
│   │   ├── BookDetailsScreen.tsx  # Détail + tags + bouton lire
│   │   └── ReaderScreen.tsx   # Lecteur EPUB (epub.js dans WebView)
│   ├── store/                 # Redux store
│   ├── types/
│   │   └── models.ts          # Interfaces TypeScript (Book, Author, Tag…)
│   └── utils/
│       └── fileHelper.ts      # Résolution URI Android (content:// → file://)
└── App.tsx                # Racine (Redux + QueryClient + NavigationContainer)
```

---

## Dépannage

| Problème | Cause probable | Solution |
|---|---|---|
| QR code scanné mais "réseau inaccessible" | PC et téléphone pas sur le même Wi-Fi | Connecter les deux au même réseau |
| `Network Error` sur GET /api/books | Port 3000 bloqué ou backend arrêté | Vérifier pare-feu + `npm run dev` dans le backend |
| Les couvertures ne s'affichent pas | `SERVER_BASE_URL` mal résolu | Vérifier que Metro tourne bien sur la bonne IP |
| Upload EPUB — "Impossible de lire le fichier" | URI `content://` non copiée | Vérifier que `expo-document-picker` est bien installé |
| L'app ne démarre pas sur l'émulateur | `JAVA_HOME` non défini | Installer Android Studio et configurer les variables d'env |
| Écran de chargement infini sur lecture | epub.js ne charge pas le fichier | Vérifier que l'IP du backend est correcte dans les logs Metro |

# Guide d'installation complet — ReadMe

Guide pas à pas pour installer et faire fonctionner l'application **ReadMe** (frontend mobile + backend API) sur un PC et un téléphone vierges.

---

## Table des matières

1. [Installer les outils requis](#1-installer-les-outils-requis)
2. [Récupérer les projets](#2-récupérer-les-projets)
3. [Lancer la base de données (Docker)](#3-lancer-la-base-de-données-docker)
4. [Lancer le backend](#4-lancer-le-backend)
5. [Trouver l'IP de ton PC](#5-trouver-lip-de-ton-pc)
6. [Autoriser le port 3000 dans le pare-feu](#6-autoriser-le-port-3000-dans-le-pare-feu)
7. [Lancer l'app mobile](#7-lancer-lapp-mobile)
8. [Connecter le téléphone](#8-connecter-le-téléphone)
9. [Résumé des terminaux](#9-résumé-des-terminaux)
10. [Usage quotidien](#10-usage-quotidien)
11. [Dépannage](#11-dépannage)

---

## 1. Installer les outils requis

| Outil | Version minimale | Lien / Commande |
|---|---|---|
| **Docker Desktop** | — | https://docs.docker.com/desktop/setup/install/windows-install/ |
| **Node.js** | 18+ | https://nodejs.org (version LTS) |
| **Python** | 3.8+ | https://www.python.org/downloads/ — cocher **"Add Python to PATH"** |
| **Git** | — | https://git-scm.com/downloads |
| **Expo Go** | — | Play Store sur le téléphone |
| **ngrok** (optionnel) | — | `winget install ngrok` ou https://ngrok.com/download |

### Vérifications après installation

Ouvrir **PowerShell** et taper :

```powershell
node -v
npm -v
docker -v
python --version
git --version
```

Chaque commande doit afficher un numéro de version (pas d'erreur).

---

## 2. Récupérer les projets

```powershell
# Depuis GitHub (remplacer les URLs par les vraies)
git clone <URL_DU_REPO_API-PassionLecture>
git clone <URL_DU_REPO_ReadMe-MobileApp>
```

Structure attendue :

```
C:\Users\TonNom\Documents\GitHub\
├── API-PassionLecture\          ← Backend
│   └── api_express\
│       ├── server.ts
│       ├── controllers\
│       ├── models\
│       ├── parser.py
│       └── package.json
│
└── ReadMe-MobileApp\            ← Frontend mobile
    └── ReadMe\
        ├── src\
        ├── app.json
        ├── package.json
        └── assets\
```

---

## 3. Lancer la base de données (Docker)

```powershell
# Créer et démarrer le conteneur MySQL (une seule fois)
docker run --name mysql_db `
  -e MYSQL_ROOT_PASSWORD=root `
  -e MYSQL_DATABASE=db_api `
  -p 3306:3306 `
  -d mysql:8
```

Vérifier que ça tourne :

```powershell
docker ps
```

Tu dois voir une ligne avec `mysql:8` et le statut `Up`.

> **Les fois suivantes**, utiliser simplement : `docker start mysql_db`

---

## 4. Lancer le backend

```powershell
cd API-PassionLecture\api_express

# Installer les dépendances
npm install

# Lancer le serveur (compile et démarre)
npm run dev
```

**Résultat attendu** dans le terminal :

```
Connexion à MySQL réussie.
Toutes les tables ont été synchronisées.
Server running on http://0.0.0.0:3000
```

> ⚠️ Si tu vois `Impossible de lancer Python`, édite le fichier `api_express/.env` :
> ```env
> PYTHON_CMD=python
> ```
> Essaie `py` ou `python3` selon ton installation.

> Laisser ce terminal ouvert — le backend doit tourner en permanence.

---

## 5. Trouver l'IP de ton PC

```powershell
ipconfig
```

Cherche la ligne **"Adresse IPv4"** sous l'adaptateur **"Carte réseau Wi-Fi"**.

Exemple :
```
Adresse IPv4. . . . . . . . . . . : 192.168.1.220
```

> Note cette IP — elle sert à vérifier la connexion depuis le téléphone.

---

## 6. Autoriser le port 3000 dans le pare-feu

```powershell
# PowerShell en mode Administrateur
New-NetFirewallRule -DisplayName "ReadMe API" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow
```

> Sans cette règle, le téléphone ne pourra pas contacter le backend sur le réseau Wi-Fi.

---

## 7. Lancer l'app mobile

```powershell
cd ReadMe-MobileApp\ReadMe

# Installer les dépendances
npm install

# Démarrer le serveur de développement Expo
npx expo start
```

Un QR code s'affiche dans le terminal, par exemple :

```
› Metro waiting on exp://192.168.1.220:8081
```

> Laisser ce terminal ouvert.

---

## 8. Connecter le téléphone

### Option A — Même Wi-Fi (recommandé)

1. PC et téléphone connectés **au même réseau Wi-Fi**
2. Ouvrir **Expo Go** sur le téléphone
3. Scanner le QR code (avec Expo Go ou l'appareil photo)
4. L'application se charge automatiquement

> ✅ Solution la plus simple — fonctionne immédiatement.

---

### Option B — Hotspot téléphone (PC sans Wi-Fi)

| Étape | Action |
|---|---|
| 1 | Téléphone : activer le **partage de connexion** (hotspot) |
| 2 | PC : se connecter au Wi-Fi du téléphone |
| 3 | Relancer `npx expo start` (l'IP change) |
| 4 | Scanner le QR code |

> ⚠️ Consomme les données mobiles.

---

### Option C — ngrok (réseaux différents)

Utile si le PC est sur un réseau d'entreprise ou que le Wi-Fi ne permet pas la connexion directe.

#### Étape 1 — Installer ngrok

```powershell
winget install ngrok
```

Créer un compte gratuit sur https://ngrok.com et configurer :

```powershell
ngrok config add-authtoken TON_TOKEN
```

#### Étape 2 — Exposer le backend

```powershell
# Nouveau terminal, avec le backend déjà lancé
ngrok http 3000
```

Ngrok affiche une URL publique :
```
Forwarding  https://abc123.ngrok-free.app -> http://localhost:3000
```

#### Étape 3 — Configurer l'app

Modifier `ReadMe-MobileApp\ReadMe\.env` :

```env
EXPO_PUBLIC_API_URL=https://abc123.ngrok-free.app/api
```

#### Étape 4 — Relancer Expo en tunnel

```powershell
npx expo start --tunnel
```

Scanner le QR code — l'app fonctionne depuis n'importe où.

> ⚠️ L'URL ngrok change à chaque redémarrage (compte gratuit).  
> Mettre à jour `.env` et relancer Metro à chaque fois.

---

### Option D — Émulateur Android (AVD)

```powershell
# Lancer l'émulateur depuis Android Studio, puis :
npx expo start --android
```

> Sur l'émulateur, le backend est accessible via l'IP `10.0.2.2` (configuré par défaut).

---

## 9. Résumé des terminaux

| Terminal | Commande | Dossier |
|---|---|---|
| 1 | `docker start mysql_db` | N'importe où (une fois au début) |
| 2 | `npm run dev` | `API-PassionLecture\api_express\` |
| 3 | `npx expo start` | `ReadMe-MobileApp\ReadMe\` |
| 4 | `ngrok http 3000` (optionnel) | N'importe où |

---

## 10. Usage quotidien

```powershell
# 1. Démarrer MySQL
docker start mysql_db

# 2. Lancer le backend
cd API-PassionLecture\api_express
npm run dev

# 3. Lancer l'app (autre terminal)
cd ReadMe-MobileApp\ReadMe
npx expo start

# 4. Scanner le QR code → l'app s'ouvre sur le téléphone
```

Pour arrêter :
- **Ctrl + C** dans chaque terminal pour arrêter le backend et Metro
- `docker stop mysql_db` pour arrêter MySQL

---

## 11. Dépannage

| Problème | Cause probable | Solution |
|---|---|---|
| `ECONNREFUSED 3306` | MySQL non démarré | `docker start mysql_db` |
| QR code scanné mais "réseau inaccessible" | PC et téléphone pas sur le même Wi-Fi | Les connecter au même réseau |
| `Network Error` sur GET /books | Port 3000 bloqué ou backend arrêté | Vérifier pare-feu + terminal 2 |
| Les couvertures ne s'affichent pas | IP mal résolue | Vérifier que Metro tourne sur la bonne IP |
| `Impossible de lancer Python` | Python introuvable | Modifier `PYTHON_CMD` dans `api_express/.env` |
| Upload bloqué à 0% | Pare-feu ou réseau | Vérifier règle pare-feu + même Wi-Fi |
| Écran "Chargement du livre..." infini | epub.js ne trouve pas le fichier | Vérifier l'IP du backend dans les logs Metro |
| `ngrok-skip-browser-warning` | URL ngrok non reconnue | Mettre à jour `EXPO_PUBLIC_API_URL` dans `.env` |

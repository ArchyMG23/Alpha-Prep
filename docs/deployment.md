# Guide de Déploiement Alpha Prep

Ce dossier contient les informations nécessaires pour publier l'application sur n'importe quel hébergeur (Vercel, Netlify, DigitalOcean, etc.).

## 1. Variables d'Environnement
Vous devez configurer les variables suivantes dans l'interface de votre hébergeur :

| Variable | Description |
|----------|-------------|
| `GEMINI_API_KEY` | Votre clé API Google AI (obtenue sur Google AI Studio). |
| `VITE_FIREBASE_API_KEY` | Clé API de votre projet Firebase. |
| `VITE_FIREBASE_AUTH_DOMAIN` | Domaine d'authentification Firebase. |
| `VITE_FIREBASE_PROJECT_ID` | ID de votre projet Firebase. |
| `VITE_FIREBASE_STORAGE_BUCKET` | Bucket de stockage Firebase. |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | ID d'envoi de messages Firebase. |
| `VITE_FIREBASE_APP_ID` | ID de l'application Firebase. |
| `VITE_FIREBASE_FIRESTORE_DATABASE_ID` | (Optionnel) ID de la base Enterprise si différente de '(default)'. |

## 2. Configuration Firebase
L'application utilise **Firebase Firestore** (Base de données) et **Firebase Auth** (Authentification).

1.  **Firestore** : Créez une base de données en mode production.
2.  **Règles de Sécurité** : Copiez le contenu du fichier `firestore.rules` (à la racine du projet) dans l'onglet "Rules" de votre console Firebase Firestore.
3.  **Authentification** : Activez la méthode de connexion "Google" dans la console Firebase Auth.

## 3. Déploiement
L'application est une application React (Vite).
- **Commande de Build** : `npm run build`
- **Répertoire de Sortie** : `dist`

## 4. Initialisation des Données
Une fois déployée, connectez-vous avec votre compte Google. Si vous souhaitez devenir administrateur, ajoutez le `userId` de votre compte dans une nouvelle collection Firestore nommée `admins`.

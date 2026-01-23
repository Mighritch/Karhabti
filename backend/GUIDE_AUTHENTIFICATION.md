# 🔐 Guide d'Authentification et Dashboards - Karhabti

## 📋 Vue d'ensemble

Ce guide décrit le système complet d'authentification (Sign Up / Sign In) et les dashboards personnalisés selon le rôle de l'utilisateur.

---

## 🚀 Flux d'Authentification

### 1. **Inscription (Sign Up)**
- **Route**: `GET /signup` ou `POST /api/users/signup`
- **Page**: `/views/signup.twig`
- **Contrôleur**: `UserController.signup()`

**Processus**:
1. L'utilisateur remplit le formulaire avec ses informations
2. Validation des champs (tous obligatoires)
3. Vérification que les mots de passe correspondent
4. Vérification que l'email n'existe pas déjà
5. Création du nouvel utilisateur (mot de passe hashé avec bcryptjs)
6. Génération d'un token JWT valide 7 jours
7. Stockage du token et redirection vers `/dashboard`

**Données requises**:
```json
{
  "nom": "Dupont",
  "prenom": "Jean",
  "email": "jean@example.com",
  "telephone": "98765432",
  "dateNaissance": "1990-01-15",
  "mdp": "password123",
  "confirmMdp": "password123"
}
```

---

### 2. **Connexion (Sign In)**
- **Route**: `GET /signin` ou `POST /api/users/signin`
- **Page**: `/views/signin.twig`
- **Contrôleur**: `UserController.signin()`

**Processus**:
1. L'utilisateur entre son email et mot de passe
2. Recherche de l'utilisateur par email
3. Comparaison du mot de passe entré avec le mot de passe hashé
4. Si valide: génération d'un token JWT
5. Stockage du token et redirection vers `/dashboard`

**Données requises**:
```json
{
  "email": "jean@example.com",
  "mdp": "password123"
}
```

---

## 🎯 Système de Dashboards

Après une connexion réussie, l'utilisateur est redirigé vers son dashboard selon son rôle.

### **Middleware d'Authentification**
- **Fichier**: `/middleware/authMiddleware.js`
- **Fonction**: `protect` - Vérifie le token JWT
- **Utilisation**: Protège les routes sensibles

```javascript
// Exemple d'utilisation
router.get('/dashboard', authMiddleware.protect, controller);
```

---

### 1. **Dashboard Utilisateur (User)**
- **Route**: `GET /dashboard/user`
- **Page**: `/views/dashboards/user-dashboard.twig`
- **Rôle**: `user`
- **Accès**: Uniquement les utilisateurs simples

**Fonctionnalités**:
- ✅ Voir le profil personnel
- ✅ Voir les réservations
- ✅ Accéder à l'historique
- ✅ Faire une nouvelle réservation
- ✅ Modifier le profil
- ✅ Contacter le support

---

### 2. **Dashboard Agent**
- **Route**: `GET /dashboard/agent`
- **Page**: `/views/dashboards/agent-dashboard.twig`
- **Rôle**: `agent`
- **Accès**: Uniquement les agents

**Fonctionnalités**:
- ✅ Gérer les réservations en attente
- ✅ Gérer les véhicules
- ✅ Gérer les agences
- ✅ Consulter les rapports
- ✅ Voir les statistiques (réservations, revenus, satisfaction)

---

### 3. **Dashboard Administrateur**
- **Route**: `GET /dashboard/admin`
- **Page**: `/views/dashboards/admin-dashboard.twig`
- **Rôle**: `admin`
- **Accès**: Uniquement les administrateurs

**Fonctionnalités**:
- ✅ Gérer tous les utilisateurs
- ✅ Gérer tous les agents
- ✅ Gérer tous les véhicules
- ✅ Gérer toutes les agences
- ✅ Consulter les rapports globaux
- ✅ Accéder aux paramètres système
- ✅ Consulter les logs et audit

---

## 📡 Endpoints API

### Routes Publiques (Sans Authentification)

```bash
# Inscription
POST /api/users/signup
Content-Type: application/json

{
  "nom": "Dupont",
  "prenom": "Jean",
  "email": "jean@example.com",
  "telephone": "98765432",
  "dateNaissance": "1990-01-15",
  "mdp": "password123",
  "confirmMdp": "password123"
}

# Réponse (Succès)
{
  "success": true,
  "message": "Inscription réussie",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "nom": "Dupont",
    "prenom": "Jean",
    "email": "jean@example.com",
    "role": "user"
  }
}
```

```bash
# Connexion
POST /api/users/signin
Content-Type: application/json

{
  "email": "jean@example.com",
  "mdp": "password123"
}

# Réponse (Succès)
{
  "success": true,
  "message": "Connexion réussie",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "nom": "Dupont",
    "prenom": "Jean",
    "email": "jean@example.com",
    "role": "user"
  }
}
```

---

### Routes Protégées (Avec Authentification)

```bash
# Récupérer le profil
GET /api/users/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Mettre à jour le profil
PUT /api/users/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "nom": "Dupont",
  "prenom": "Jean",
  "telephone": "98765432",
  "dateNaissance": "1990-01-15"
}

# Déconnexion
POST /api/users/logout
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Accéder au dashboard
GET /dashboard
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🔑 Gestion du Token JWT

### **Stockage du Token**
Le token est stocké dans le `localStorage` du navigateur:

```javascript
localStorage.setItem('token', data.token);
localStorage.setItem('user', JSON.stringify(data.user));
```

### **Utilisation du Token**
Dans les requêtes protégées, ajouter le header:

```javascript
Authorization: Bearer <token>
```

### **Durée de Validité**
- Token valide: **7 jours**
- Après expiration: L'utilisateur doit se reconnecter

---

## 🔐 Rôles et Permissions

| Rôle | Accès | Niveau |
|------|-------|--------|
| **user** | Dashboard User | Faible |
| **agent** | Dashboard Agent | Moyen |
| **admin** | Dashboard Admin | Élevé |

---

## 📁 Structure des Fichiers

```
backend/
├── Controllers/
│   ├── UserController.js          # Contrôleurs signup/signin
│   └── DashboardController.js     # Contrôleurs dashboards
├── routes/
│   ├── UserRoutes.js              # Routes API utilisateur
│   ├── DashboardRoutes.js         # Routes dashboards
│   └── index.js                   # Routes publiques
├── middleware/
│   └── authMiddleware.js          # Middleware d'authentification
├── views/
│   ├── signin.twig                # Page connexion
│   ├── signup.twig                # Page inscription
│   └── dashboards/
│       ├── user-dashboard.twig    # Dashboard user
│       ├── agent-dashboard.twig   # Dashboard agent
│       └── admin-dashboard.twig   # Dashboard admin
├── models/
│   └── User.js                    # Modèle User
├── app.js                         # Configuration Express
└── package.json                   # Dépendances
```

---

## 🛠️ Installation et Démarrage

### 1. Installer les dépendances
```bash
npm install
```

### 2. Configurer les variables d'environnement
Créer un fichier `.env`:
```
MONGODB_URI=mongodb://localhost:27017/karhabti
JWT_SECRET=your_super_secret_key_change_this_in_production_123456789
PORT=3000
NODE_ENV=development
```

### 3. Démarrer le serveur
```bash
npm start
```

### 4. Accéder à l'application
- Accueil: `http://localhost:3000/`
- Inscription: `http://localhost:3000/signup`
- Connexion: `http://localhost:3000/signin`
- Dashboard: `http://localhost:3000/dashboard` (après connexion)

---

## 🔄 Flux Utilisateur Complet

```
1. Utilisateur visite /signup
   ↓
2. Remplit le formulaire et soumet
   ↓
3. Données envoyées à POST /api/users/signup
   ↓
4. Utilisateur créé, token généré
   ↓
5. Token sauvegardé dans localStorage
   ↓
6. Redirection vers /dashboard
   ↓
7. Middleware vérifie le token
   ↓
8. Affichage du dashboard selon le rôle
   ↓
9. Utilisateur peut naviguer dans son interface
```

---

## ⚠️ Points Importants

1. **Sécurité des mots de passe**: Les mots de passe sont hashés avec bcryptjs avant stockage
2. **JWT Secret**: À changer en production dans les variables d'environnement
3. **Token expiration**: 7 jours, après il faut se reconnecter
4. **Validation des données**: Validée à la fois côté client (HTML5) et serveur
5. **Rôles**: Chaque utilisateur a un rôle (user, agent, admin) déterminant son accès

---

## 🚀 Prochaines Étapes

1. Implémenter les pages de gestion (Users, Vehicles, Agencies, etc.)
2. Ajouter les fonctionnalités de réservation
3. Implémenter un système de notifications
4. Ajouter la pagination et les filtres
5. Implémenter les rapports et statistiques
6. Ajouter un système d'audit et logs

---

**Créé le**: 21 Janvier 2026
**Projet**: Karhabti - Système de Location de Véhicules

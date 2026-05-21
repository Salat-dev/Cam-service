# 🇨🇲 travailici — Marketplace de Services au Cameroun

<div align="center">

**La première plateforme de mise en relation entre clients et prestataires de services au Cameroun.**

Plomberie • Électricité • Design • Photographie • Beauté • Bâtiment • Transport • et plus

---

[🌐 Démo Live](https://travailici.vercel.app) · [📋 Documentation](#installation) · [🐛 Signaler un bug](https://github.com/votre-repo/issues)

</div>

---

## 📸 Aperçu

| Landing Page | Services | Détail Service |
|:---:|:---:|:---:|
| Hero dynamique, stats live, catégories | Grille 4 colonnes, recherche, filtres | Profil prestataire, portfolio, tarifs |

| Dashboard Prestataire | Grille Tarifaire | Portfolio |
|:---:|:---:|:---:|
| CRUD services, sidebar, stats | Gestion des prix par prestation | Galerie de réalisations |

---

## ✨ Fonctionnalités

### 🛒 Côté Client
- **Recherche avancée** — par texte, catégorie, ville, tri par prix/date/alphabétique
- **Fiche service détaillée** — description, tarifs, portfolio, activités et certifications du prestataire
- **Panier intelligent** — drawer latéral, ajout/suppression, total automatique
- **Authentification requise** — modal de connexion inline (sans quitter la page) pour ajouter au panier
- **Contact direct** — WhatsApp, email, lien vers le profil du prestataire
- **Stats prestataire** — commandes réalisées, note moyenne, avis clients, taux de réponse

### 💼 Côté Prestataire (Dashboard)
- **Gestion des services** — CRUD complet avec catégories, prix, type de tarification, durée
- **Grille tarifaire** — tarifs détaillés par prestation (forfait, horaire, demi-journée, journée, par personne, sur mesure)
- **Portfolio** — galerie de réalisations avec images/vidéos, catégories, tags, mise en vedette
- **Activités & Certifications** — formations, événements, collaborations, récompenses avec documents justificatifs
- **Sidebar dynamique** — badges compteurs, avatar, rôle, statut vérifié
- **Toggle actif/inactif** — activer ou désactiver un service en un clic

### 🔐 Authentification & Sécurité
- Inscription avec rôle (client / prestataire)
- Connexion via Supabase Auth
- Synchronisation automatique `auth.users` → `public.users`
- Modal de connexion inline sur les pages publiques
- Row Level Security (RLS) sur toutes les tables
- Vérification d'identité (CNI, passeport) avec validation admin

### 📊 Admin
- Tableau de bord complet
- Validation des prestataires et documents
- Gestion des utilisateurs (activer, suspendre, bannir)

---

## 🏗️ Architecture du Projet

```
travailici/
│
├── index.html                  # Point d'entrée → redirige vers landing
├── landing.html                # Page d'accueil dynamique (stats, catégories, services populaires)
├── services.html               # Liste publique de tous les services (grille 4×3 + voir plus)
├── service-detail.html         # Détail service + profil prestataire complet
├── login.html                  # Connexion
├── register.html               # Inscription client / prestataire
├── checkout.html               # Passage de commande
│
├── dashboard/                  # Espace prestataire
│   ├── index.html              # Vue d'ensemble
│   ├── services.html           # CRUD services
│   ├── pricing.html            # Grille tarifaire
│   ├── portfolio.html          # Portfolio / réalisations
│   ├── activities.html         # Activités & certifications
│   ├── orders.html             # Commandes
│   ├── profile.html            # Mon profil
│   ├── analytics.html          # Statistiques
│   └── css/
│       └── dashboard.css       # Styles du dashboard
│
├── admin.html                  # Panel administrateur
├── cart.html                   # Panier (version page complète)
│
├── config.js                   # Configuration Supabase + utilitaires partagés
├── manifest.json               # PWA manifest
├── vercel.json                 # Configuration déploiement Vercel
│
├── icons/                      # Logos et icônes PWA
│   ├── favicon.ico
│   ├── apple-touch-icon.png
│   ├── icon-72x72.png
│   ├── icon-96x96.png
│   ├── icon-128x128.png
│   ├── icon-144x144.png
│   ├── icon-192x192.png
│   ├── icon-384x384.png
│   ├── icon-512x512.png
│   ├── icon-512.svg
│   ├── logo-512.svg
│   ├── logo-512.png
│   └── logo-256.png
│
└── css/
    └── global.css              # Styles globaux partagés
```

---

## 🗄️ Base de Données (Supabase)

### Tables

| Table | Description |
|-------|-------------|
| `users` | Profils utilisateurs (client, prestataire, admin) |
| `services` | Services proposés par les prestataires |
| `orders` | Commandes passées par les clients |
| `pricing_grid` | Grille tarifaire détaillée par prestataire |
| `portfolio_items` | Réalisations du portfolio (images, vidéos) |
| `provider_activities` | Certifications, formations, événements |
| `provider_stats` | Statistiques agrégées par prestataire |
| `profile_views` | Tracking des vues de profil |
| `verification_documents` | Documents d'identité pour vérification |

### Relations

```
users (1) ──→ (N) services
users (1) ──→ (N) pricing_grid
users (1) ──→ (N) portfolio_items
users (1) ──→ (N) provider_activities
users (1) ──→ (1) provider_stats
users (1) ──→ (N) orders (client + provider)
services (1) ──→ (N) pricing_grid
users (1) ──→ (N) verification_documents
users (1) ──→ (N) profile_views
```

---

## 🚀 Installation

### Prérequis

- Un compte [Supabase](https://supabase.com) (gratuit)
- Un compte [Vercel](https://vercel.com) (gratuit) pour le déploiement
- Git installé sur votre machine

### 1. Cloner le projet

```bash
git clone https://github.com/votre-repo/travailici.git
cd travailici
```

### 2. Configurer Supabase

1. Créez un projet sur [supabase.com](https://supabase.com)
2. Récupérez votre **Project URL** et **Anon Key** dans Settings → API
3. Dans le **SQL Editor**, exécutez le fichier `supabase-setup.sql`
4. Créez les buckets Storage :
   - `documents` (public) — pour les CNI et justificatifs
   - `services` (public) — pour les images de services

### 3. Configurer les clés

Ouvrez `config.js` et remplacez :

```javascript
const SUPABASE_URL  = 'https://VOTRE_PROJET.supabase.co';
const SUPABASE_ANON = 'VOTRE_ANON_KEY';
```

> ⚠️ Faites la même chose dans chaque fichier HTML du dashboard qui contient ces constantes en haut du `<script>`.

### 4. Configurer les policies RLS

```sql
-- Autoriser la lecture publique des services et profils
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Services visibles par tous" ON services FOR SELECT USING (true);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profils publics visibles" ON users FOR SELECT USING (true);

-- Autoriser les prestataires à gérer leurs propres données
CREATE POLICY "CRUD propre" ON services
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "CRUD propre" ON pricing_grid
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "CRUD propre" ON portfolio_items
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "CRUD propre" ON provider_activities
  FOR ALL USING (auth.uid() = user_id);
```

### 5. Lancer en local

```bash
# Avec Python
python3 -m http.server 8000

# Avec Node.js
npx serve .

# Puis ouvrir http://localhost:8000
```

### 6. Déployer sur Vercel

```bash
# Installer Vercel CLI
npm i -g vercel

# Déployer
vercel

# Ou connecter votre repo GitHub à Vercel pour le déploiement automatique
```

### 7. Créer le compte admin

```sql
UPDATE users SET role = 'admin', is_verified = true, verification_status = 'verified'
WHERE email = 'votre-email@example.com';
```

---

## 🎨 Design System

| Variable | Valeur | Usage |
|----------|--------|-------|
| `--ink` | `#1A1714` | Texte principal, fonds sombres |
| `--gold` | `#C4943E` | Accent primaire, prix, CTA |
| `--green` | `#3D8B5E` | Succès, vérifié, actif |
| `--red` | `#DC2626` | Erreur, suppression, danger |
| `--cream` | `#FAF8F5` | Fond de page |
| `--white` | `#FFFFFF` | Cartes, modals |
| `--muted` | `#8A8279` | Texte secondaire |
| `--rule` | `#E8E2DA` | Bordures, séparateurs |

**Typographies** : Outfit (body, 200-900) + Allison (script, logo)

---

## 🛠️ Stack Technique

| Couche | Technologie |
|--------|-------------|
| **Frontend** | HTML5, CSS3, JavaScript vanilla (aucun framework) |
| **Backend** | Supabase (Auth + PostgreSQL + Storage + RLS) |
| **Icônes** | Lucide Icons (CDN) |
| **Fonts** | Google Fonts (Outfit, Allison) |
| **Déploiement** | Vercel (static hosting) |
| **PWA** | Manifest + icônes multi-tailles |

---

## 📝 Changelog

### v2.0 — Dashboard Complet
- ✅ Dashboard prestataire avec sidebar dynamique
- ✅ CRUD services avec modal (créer, modifier, activer/désactiver, supprimer)
- ✅ Grille tarifaire complète (6 types de prix, éléments inclus, durée, max personnes)
- ✅ Portfolio avec galerie, tags, catégories, mise en vedette, lightbox
- ✅ Activités & certifications avec timeline groupée par année
- ✅ Page service-detail enrichie (portfolio, tarifs, activités, stats du prestataire)
- ✅ Modal de connexion inline (auth sans quitter la page)
- ✅ Panier drawer latéral avec auth obligatoire
- ✅ Landing page dynamique (stats live, catégories, services populaires, compteurs animés)
- ✅ Page services publique (grille 4×3, voir plus, recherche, tri, filtres)
- ✅ PWA manifest + icônes multi-tailles + favicon
- ✅ Configuration Vercel avec URLs propres et cache

### v1.0 — MVP
- ✅ Authentification (inscription, connexion, rôles)
- ✅ CRUD services basique
- ✅ Recherche par texte, ville, prix
- ✅ Panier localStorage
- ✅ Contact WhatsApp
- ✅ Panel admin

---

## 🤝 Contribution

Les contributions sont les bienvenues ! Pour contribuer :

1. Forkez le projet
2. Créez votre branche (`git checkout -b feature/ma-fonctionnalite`)
3. Committez vos changements (`git commit -m 'Ajout de ma fonctionnalité'`)
4. Pushez sur la branche (`git push origin feature/ma-fonctionnalite`)
5. Ouvrez une Pull Request

---

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

<div align="center">
Cam<em>S</em>ervices © 2025

</div>
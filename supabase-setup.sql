-- ============================================================
-- CAMSERVICES — Script SQL pour Supabase
-- ============================================================
-- Exécutez ce script dans l'éditeur SQL de votre dashboard Supabase
-- (Dashboard > SQL Editor > New Query)
-- ============================================================

-- ============================================================
-- 1. TABLE USERS (profils utilisateurs)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    city TEXT,
    role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'prestataire', 'admin')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'blocked')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. TABLE SERVICES (services proposés par les prestataires)
-- ============================================================
CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL CHECK (price >= 0),
    images JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. TABLE ORDERS (commandes / demandes de services)
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. TABLE DOCUMENTS (CNI et pièces de vérification)
-- ============================================================
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cni_url TEXT NOT NULL,
    verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 5. POLITIQUES RLS (Row Level Security)
-- ============================================================
-- Activer RLS sur toutes les tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- ----- USERS -----
-- Tout le monde peut lire les profils (nécessaire pour afficher les prestataires)
CREATE POLICY "users_select_all" ON users
    FOR SELECT USING (true);

-- Un utilisateur peut insérer son propre profil
CREATE POLICY "users_insert_own" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Un utilisateur peut modifier son propre profil
CREATE POLICY "users_update_own" ON users
    FOR UPDATE USING (auth.uid() = id);

-- L'admin peut modifier tous les profils (pour valider/bloquer)
-- Note : vous devez avoir un utilisateur admin dans la table users
CREATE POLICY "users_update_admin" ON users
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

-- ----- SERVICES -----
-- Tout le monde peut voir les services
CREATE POLICY "services_select_all" ON services
    FOR SELECT USING (true);

-- Un prestataire peut créer ses propres services
CREATE POLICY "services_insert_own" ON services
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Un prestataire peut modifier ses propres services
CREATE POLICY "services_update_own" ON services
    FOR UPDATE USING (auth.uid() = user_id);

-- Un prestataire peut supprimer ses propres services
CREATE POLICY "services_delete_own" ON services
    FOR DELETE USING (auth.uid() = user_id);

-- ----- ORDERS -----
-- Un client peut voir ses propres commandes
CREATE POLICY "orders_select_client" ON orders
    FOR SELECT USING (auth.uid() = client_id);

-- Un prestataire peut voir les commandes sur ses services
CREATE POLICY "orders_select_provider" ON orders
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM services
            WHERE services.id = orders.service_id
            AND services.user_id = auth.uid()
        )
    );

-- Un client peut créer une commande
CREATE POLICY "orders_insert_client" ON orders
    FOR INSERT WITH CHECK (auth.uid() = client_id);

-- Un prestataire peut mettre à jour le statut des commandes sur ses services
CREATE POLICY "orders_update_provider" ON orders
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM services
            WHERE services.id = orders.service_id
            AND services.user_id = auth.uid()
        )
    );

-- L'admin peut tout voir et modifier sur les commandes
CREATE POLICY "orders_admin_all" ON orders
    FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

-- ----- DOCUMENTS -----
-- Un utilisateur peut voir ses propres documents
CREATE POLICY "documents_select_own" ON documents
    FOR SELECT USING (auth.uid() = user_id);

-- L'admin peut voir tous les documents
CREATE POLICY "documents_select_admin" ON documents
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

-- Un utilisateur peut soumettre ses documents
CREATE POLICY "documents_insert_own" ON documents
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- L'admin peut modifier le statut des documents
CREATE POLICY "documents_update_admin" ON documents
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

-- ============================================================
-- 6. STORAGE BUCKETS (pour les images et documents)
-- ============================================================
-- Créez ces buckets manuellement dans Supabase Dashboard > Storage :
--   - Bucket "documents" (pour les CNI) — public
--   - Bucket "services" (pour les images de services) — public
--
-- Puis ajoutez ces policies dans chaque bucket :
--   - SELECT : true (tout le monde peut lire)
--   - INSERT : auth.uid() IS NOT NULL (utilisateurs connectés)
--   - UPDATE : auth.uid() IS NOT NULL
--   - DELETE : auth.uid() IS NOT NULL

-- ============================================================
-- 7. CRÉER UN UTILISATEUR ADMIN (à adapter)
-- ============================================================
-- Après avoir créé un compte admin via le formulaire d'inscription,
-- exécutez cette requête pour changer son rôle :
--
-- UPDATE users SET role = 'admin', status = 'verified'
-- WHERE email = 'votre-email-admin@example.com';

-- ============================================================
-- FIN DU SCRIPT
-- ============================================================

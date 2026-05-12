<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Détail du service — CamServices</title>
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
</head>
<body>
    <div id="nav"></div>
    <hr>

    <div id="service-detail">Chargement du service...</div>

    <hr>
    <a href="services.html"><button>Retour aux services</button></a>

    <script src="config.js"></script>
    <script>
        renderNav();

        /**
         * Récupère l'ID du service depuis l'URL (?id=xxx)
         */
        function getServiceId() {
            const params = new URLSearchParams(window.location.search);
            return params.get('id');
        }

        /**
         * Charge et affiche les détails d'un service
         */
        async function loadServiceDetail() {
            const serviceId = getServiceId();
            const container = document.getElementById('service-detail');

            if (!serviceId) {
                container.innerHTML = '<p>Aucun service spécifié.</p>';
                return;
            }

            // Récupérer le service avec les infos du prestataire
            const { data: service, error } = await supabase
                .from('services')
                .select('*, users(full_name, phone, city, email)')
                .eq('id', serviceId)
                .single();

            if (error || !service) {
                container.innerHTML = '<p>Service introuvable : ' + (error ? error.message : '') + '</p>';
                return;
            }

            const prestataire = service.users || {};
            const phone = (prestataire.phone || '').replace(/\s+/g, '').replace('+', '');
            const whatsappLink = 'https://wa.me/' + phone + '?text=' +
                encodeURIComponent('Bonjour, je suis intéressé par votre service "' + service.title + '" sur CamServices.');

            // Affichage des images si disponibles
            let imagesHtml = '';
            if (service.images && Array.isArray(service.images) && service.images.length > 0) {
                service.images.forEach(url => {
                    imagesHtml += '<img src="' + url + '" alt="' + service.title + '" width="200"><br>';
                });
            }

            let html = '';
            html += '<h1>' + service.title + '</h1>';
            html += imagesHtml;
            html += '<p><strong>Description :</strong></p>';
            html += '<p>' + (service.description || 'Pas de description.') + '</p>';
            html += '<p><strong>Prix :</strong> ' + formatPrice(service.price) + '</p>';
            html += '<hr>';
            html += '<h3>Prestataire</h3>';
            html += '<p><strong>Nom :</strong> ' + (prestataire.full_name || 'Inconnu') + '</p>';
            html += '<p><strong>Ville :</strong> ' + (prestataire.city || 'Non renseignée') + '</p>';
            html += '<p><strong>Email :</strong> ' + (prestataire.email || '') + '</p>';
            html += '<hr>';

            // Bouton ajouter au panier
            html += '<button onclick="handleAddToCart()">Ajouter au panier</button> ';

            // Bouton contacter via WhatsApp
            html += '<a href="' + whatsappLink + '" target="_blank"><button>Contacter via WhatsApp</button></a>';

            container.innerHTML = html;

            // Stocker le service pour l'ajout au panier
            window._currentService = {
                id: service.id,
                title: service.title,
                price: service.price,
                prestataire: prestataire.full_name || 'Inconnu'
            };
        }

        /**
         * Gère l'ajout au panier avec vérification de connexion
         */
        async function handleAddToCart() {
            const session = await getSession();
            if (!session) {
                alert('Veuillez vous connecter pour ajouter un service au panier.');
                window.location.href = 'login.html';
                return;
            }
            addToCart(window._currentService);
        }

        loadServiceDetail();
    </script>
</body>
</html>




-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  service_id uuid,
  client_id uuid,
  provider_id uuid,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'in_progress'::text, 'completed'::text, 'cancelled'::text, 'deleted'::text])),
  total_amount numeric NOT NULL,
  client_message text,
  scheduled_date timestamp with time zone,
  completed_at timestamp with time zone,
  cancelled_at timestamp with time zone,
  deleted_at timestamp with time zone,
  is_restored boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id),
  CONSTRAINT orders_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.users(id),
  CONSTRAINT orders_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.users(id)
);
CREATE TABLE public.portfolio_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  title text NOT NULL,
  description text,
  media_url text NOT NULL,
  media_type text DEFAULT 'image'::text CHECK (media_type = ANY (ARRAY['image'::text, 'video'::text])),
  category text,
  tags ARRAY,
  is_featured boolean DEFAULT false,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT portfolio_items_pkey PRIMARY KEY (id),
  CONSTRAINT portfolio_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.pricing_grid (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  service_id uuid,
  name text NOT NULL,
  description text,
  base_price numeric NOT NULL,
  pricing_type text DEFAULT 'fixed'::text CHECK (pricing_type = ANY (ARRAY['fixed'::text, 'hourly'::text, 'half_day'::text, 'full_day'::text, 'per_person'::text, 'custom'::text])),
  duration_hours numeric,
  max_people integer,
  includes ARRAY,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT pricing_grid_pkey PRIMARY KEY (id),
  CONSTRAINT pricing_grid_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT pricing_grid_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id)
);
CREATE TABLE public.profile_views (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  provider_id uuid,
  viewer_id uuid,
  viewed_at timestamp with time zone DEFAULT now(),
  ip_address text,
  user_agent text,
  CONSTRAINT profile_views_pkey PRIMARY KEY (id),
  CONSTRAINT profile_views_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.users(id),
  CONSTRAINT profile_views_viewer_id_fkey FOREIGN KEY (viewer_id) REFERENCES public.users(id)
);
CREATE TABLE public.provider_activities (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  title text NOT NULL,
  description text,
  activity_type text CHECK (activity_type = ANY (ARRAY['certification'::text, 'training'::text, 'event'::text, 'collaboration'::text, 'award'::text, 'other'::text])),
  date_start date,
  date_end date,
  organization text,
  document_url text,
  is_verified boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT provider_activities_pkey PRIMARY KEY (id),
  CONSTRAINT provider_activities_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.provider_stats (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  provider_id uuid UNIQUE,
  total_orders integer DEFAULT 0,
  completed_orders integer DEFAULT 0,
  total_revenue numeric DEFAULT 0,
  average_rating numeric DEFAULT 0,
  total_reviews integer DEFAULT 0,
  profile_views_count integer DEFAULT 0,
  response_rate numeric DEFAULT 0,
  avg_response_time_hours numeric,
  last_updated timestamp with time zone DEFAULT now(),
  CONSTRAINT provider_stats_pkey PRIMARY KEY (id),
  CONSTRAINT provider_stats_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.users(id)
);
CREATE TABLE public.services (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  title text NOT NULL,
  description text,
  category text NOT NULL,
  price numeric NOT NULL,
  pricing_type text DEFAULT 'fixed'::text CHECK (pricing_type = ANY (ARRAY['fixed'::text, 'hourly'::text, 'daily'::text, 'project'::text])),
  duration_minutes integer,
  is_active boolean DEFAULT true,
  image_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT services_pkey PRIMARY KEY (id),
  CONSTRAINT services_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  username text NOT NULL UNIQUE,
  full_name text NOT NULL,
  phone text NOT NULL,
  profile_photo_url text,
  city text NOT NULL,
  neighborhood text NOT NULL,
  employment_status text DEFAULT 'unemployed'::text CHECK (employment_status = ANY (ARRAY['employed'::text, 'unemployed'::text, 'self_employed'::text, 'student'::text])),
  role text DEFAULT 'client'::text CHECK (role = ANY (ARRAY['client'::text, 'prestataire'::text, 'admin'::text])),
  domain_expertise ARRAY,
  education text,
  side_activities text,
  bio text,
  is_verified boolean DEFAULT false,
  verification_status text DEFAULT 'none'::text CHECK (verification_status = ANY (ARRAY['none'::text, 'pending'::text, 'verified'::text, 'rejected'::text])),
  id_document_url text,
  id_document_type text CHECK (id_document_type = ANY (ARRAY['cni'::text, 'passport'::text, 'permit'::text, 'other'::text])),
  status text DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'suspended'::text, 'banned'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id)
);
CREATE TABLE public.verification_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  document_type text CHECK (document_type = ANY (ARRAY['cni'::text, 'passport'::text, 'permit'::text, 'other'::text])),
  document_url text NOT NULL,
  document_status text DEFAULT 'pending'::text CHECK (document_status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])),
  submitted_at timestamp with time zone DEFAULT now(),
  reviewed_at timestamp with time zone,
  reviewer_notes text,
  CONSTRAINT verification_documents_pkey PRIMARY KEY (id),
  CONSTRAINT verification_documents_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
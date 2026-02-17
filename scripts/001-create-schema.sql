-- Magia Plateada: Schema inicial
-- Usuarios, expertos, sesiones, creditos, calificaciones

-- Extension para UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tabla de usuarios (auth basica)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('client', 'expert')),
  display_name TEXT NOT NULL,
  credits INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabla de expertos (perfil publico)
CREATE TABLE IF NOT EXISTS experts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  service TEXT NOT NULL,
  service_category TEXT NOT NULL DEFAULT 'otro',
  experience TEXT NOT NULL,
  modality TEXT NOT NULL CHECK (modality IN ('presencial', 'remoto', 'ambos')),
  zone TEXT NOT NULL,
  schedule TEXT NOT NULL,
  contact TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'busy', 'unavailable')),
  rating NUMERIC(2,1) NOT NULL DEFAULT 0.0,
  total_ratings INTEGER NOT NULL DEFAULT 0,
  avatar TEXT NOT NULL DEFAULT '',
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabla de sesiones (solicitudes de servicio)
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expert_id UUID NOT NULL REFERENCES experts(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed', 'expired', 'disputed')),
  requested_date TEXT NOT NULL,
  requested_time TEXT NOT NULL DEFAULT '',
  requested_duration TEXT NOT NULL DEFAULT '1 hora',
  credits_cost INTEGER NOT NULL DEFAULT 1,
  proposed_date TEXT,
  proposed_time TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabla de calificaciones
CREATE TABLE IF NOT EXISTS ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  rater_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rated_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quality INTEGER NOT NULL CHECK (quality BETWEEN 1 AND 5),
  clarity INTEGER NOT NULL CHECK (clarity BETWEEN 1 AND 5),
  punctuality INTEGER NOT NULL CHECK (punctuality BETWEEN 1 AND 5),
  overall INTEGER NOT NULL CHECK (overall BETWEEN 1 AND 5),
  comment TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(session_id, rater_id)
);

-- Tabla de transacciones de creditos
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('welcome', 'session_charge', 'session_refund', 'purchase')),
  session_id UUID REFERENCES sessions(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indices para optimizar consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_experts_status ON experts(status);
CREATE INDEX IF NOT EXISTS idx_experts_zone ON experts(zone);
CREATE INDEX IF NOT EXISTS idx_experts_modality ON experts(modality);
CREATE INDEX IF NOT EXISTS idx_experts_service_category ON experts(service_category);
CREATE INDEX IF NOT EXISTS idx_sessions_client ON sessions(client_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expert ON sessions(expert_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);

-- Insertar expertos demo (sin user_id, son datos semilla)
INSERT INTO experts (name, age, service, service_category, experience, modality, zone, schedule, contact, status, rating, total_ratings, avatar)
VALUES
  ('Maria Elena Torres', 62, 'Clases de cocina tradicional', 'clases', '30 anos de experiencia en gastronomia', 'presencial', 'Centro', 'Lunes a Viernes, 10:00 - 14:00', '+52 55 1234 5678', 'available', 4.8, 24, 'ME'),
  ('Roberto Sanchez Gil', 58, 'Reparacion de electrodomesticos', 'reparaciones', '35 anos como tecnico certificado', 'presencial', 'Norte', 'Lunes a Sabado, 9:00 - 17:00', '+52 55 2345 6789', 'available', 4.5, 18, 'RS'),
  ('Carmen Lucia Vega', 65, 'Asesoria contable y fiscal', 'asesoria', '40 anos en contabilidad empresarial', 'remoto', 'Sur', 'Martes y Jueves, 11:00 - 15:00', '+52 55 3456 7890', 'busy', 4.9, 31, 'CL'),
  ('Jorge Alberto Mora', 70, 'Clases de guitarra y musica', 'clases', '45 anos como musico profesional', 'ambos', 'Este', 'Miercoles a Domingo, 16:00 - 20:00', '+52 55 4567 8901', 'available', 4.7, 42, 'JA'),
  ('Patricia Mendez Ruiz', 55, 'Costura y confeccion a medida', 'oficios', '25 anos como modista independiente', 'presencial', 'Centro', 'Lunes a Viernes, 8:00 - 13:00', '+52 55 5678 9012', 'available', 4.6, 15, 'PM')
ON CONFLICT DO NOTHING;

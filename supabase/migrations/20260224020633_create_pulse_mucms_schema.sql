/*
  # Pulse MuCMS Database Schema

  1. New Tables
    - `profiles` - User profiles with game-related data
      - `id` (uuid, primary key, references auth.users)
      - `username` (text, unique)
      - `email` (text)
      - `server` (text)
      - `vip_type` (text)
      - `vip_expires` (timestamptz)
      - `credits` (integer)
      - `wcoins` (integer)
      - `goblin_points` (integer)
      - `is_admin` (boolean)
      - `created_at` (timestamptz)
      - `last_login` (timestamptz)
    - `news` - News/announcements
      - `id` (uuid, primary key)
      - `title` (text)
      - `content` (text)
      - `excerpt` (text)
      - `category` (text) - featured, news, event, patch_note, announcement
      - `image_url` (text)
      - `author_id` (uuid, references profiles)
      - `created_at` (timestamptz)
    - `downloads` - Downloadable files
      - `id` (uuid, primary key)
      - `name` (text)
      - `version` (text)
      - `category` (text) - client, patch, hotfix, tool
      - `size` (text)
      - `download_url` (text)
      - `uploaded_at` (timestamptz)
    - `servers` - Server status info
      - `id` (uuid, primary key)
      - `name` (text)
      - `type` (text) - pvp, nonpvp, vip
      - `is_online` (boolean)
      - `players_online` (integer)
      - `max_players` (integer)
      - `load_percent` (integer)
    - `characters` - Character/ranking data
      - `id` (uuid, primary key)
      - `name` (text)
      - `class` (text)
      - `level` (integer)
      - `master_level` (integer)
      - `resets` (integer)
      - `grand_resets` (integer)
      - `is_online` (boolean)
      - `vip_badge` (text)
      - `owner_id` (uuid, references profiles)
      - `server` (text)
      - `image_url` (text)
    - `events` - Upcoming events
      - `id` (uuid, primary key)
      - `name` (text)
      - `next_run` (timestamptz)
    - `castle_siege` - Castle siege info
      - `id` (uuid, primary key)
      - `owner_guild` (text)
      - `next_siege` (timestamptz)
    - `rules` - Server rules
      - `id` (uuid, primary key)
      - `title` (text)
      - `content` (text)
      - `sort_order` (integer)
    - `guides` - Game guides
      - `id` (uuid, primary key)
      - `title` (text)
      - `content` (text)
      - `category` (text)
      - `image_url` (text)
      - `created_at` (timestamptz)
    - `support_tickets` - Support tickets
      - `id` (uuid, primary key)
      - `subject` (text)
      - `message` (text)
      - `status` (text)
      - `user_id` (uuid, references profiles)
      - `created_at` (timestamptz)

  2. Security
    - RLS enabled on all tables
    - Public read for news, downloads, servers, characters, events, castle_siege, rules, guides
    - Authenticated write for profiles, support_tickets
    - Admin-only write for news, downloads, servers, events, castle_siege, rules, guides
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  username text UNIQUE NOT NULL,
  email text NOT NULL DEFAULT '',
  server text NOT NULL DEFAULT 'x9999',
  vip_type text NOT NULL DEFAULT 'none',
  vip_expires timestamptz,
  credits integer NOT NULL DEFAULT 0,
  wcoins integer NOT NULL DEFAULT 0,
  goblin_points integer NOT NULL DEFAULT 0,
  is_admin boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_login timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view profiles" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE TABLE IF NOT EXISTS news (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  excerpt text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'news',
  image_url text NOT NULL DEFAULT '',
  author_id uuid REFERENCES profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE news ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read news" ON news FOR SELECT USING (true);
CREATE POLICY "Admins can insert news" ON news FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));
CREATE POLICY "Admins can update news" ON news FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));
CREATE POLICY "Admins can delete news" ON news FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

CREATE TABLE IF NOT EXISTS downloads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  version text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'client',
  size text NOT NULL DEFAULT '',
  download_url text NOT NULL DEFAULT '',
  uploaded_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE downloads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read downloads" ON downloads FOR SELECT USING (true);
CREATE POLICY "Admins can insert downloads" ON downloads FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));
CREATE POLICY "Admins can update downloads" ON downloads FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));
CREATE POLICY "Admins can delete downloads" ON downloads FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

CREATE TABLE IF NOT EXISTS servers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL DEFAULT 'pvp',
  is_online boolean NOT NULL DEFAULT false,
  players_online integer NOT NULL DEFAULT 0,
  max_players integer NOT NULL DEFAULT 500,
  load_percent integer NOT NULL DEFAULT 0
);
ALTER TABLE servers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read servers" ON servers FOR SELECT USING (true);
CREATE POLICY "Admins can insert servers" ON servers FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));
CREATE POLICY "Admins can update servers" ON servers FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

CREATE TABLE IF NOT EXISTS characters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  class text NOT NULL DEFAULT 'Dark Knight',
  level integer NOT NULL DEFAULT 1,
  master_level integer NOT NULL DEFAULT 0,
  resets integer NOT NULL DEFAULT 0,
  grand_resets integer NOT NULL DEFAULT 0,
  is_online boolean NOT NULL DEFAULT false,
  vip_badge text NOT NULL DEFAULT '',
  owner_id uuid REFERENCES profiles(id),
  server text NOT NULL DEFAULT 'x9999',
  image_url text NOT NULL DEFAULT ''
);
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read characters" ON characters FOR SELECT USING (true);
CREATE POLICY "Users can insert own characters" ON characters FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update own characters" ON characters FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  next_run timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read events" ON events FOR SELECT USING (true);
CREATE POLICY "Admins can manage events" ON events FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));
CREATE POLICY "Admins can update events" ON events FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

CREATE TABLE IF NOT EXISTS castle_siege (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_guild text NOT NULL DEFAULT 'None',
  next_siege timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE castle_siege ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read castle siege" ON castle_siege FOR SELECT USING (true);
CREATE POLICY "Admins can update castle siege" ON castle_siege FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

CREATE TABLE IF NOT EXISTS rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0
);
ALTER TABLE rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read rules" ON rules FOR SELECT USING (true);
CREATE POLICY "Admins can insert rules" ON rules FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));
CREATE POLICY "Admins can update rules" ON rules FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

CREATE TABLE IF NOT EXISTS guides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'general',
  image_url text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE guides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read guides" ON guides FOR SELECT USING (true);
CREATE POLICY "Admins can insert guides" ON guides FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));
CREATE POLICY "Admins can update guides" ON guides FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

CREATE TABLE IF NOT EXISTS support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text NOT NULL,
  message text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'open',
  user_id uuid REFERENCES profiles(id) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own tickets" ON support_tickets FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users can create tickets" ON support_tickets FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can read all tickets" ON support_tickets FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));
CREATE POLICY "Admins can update tickets" ON support_tickets FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));
